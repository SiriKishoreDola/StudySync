import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const { NextRequest, NextResponse } = require('next/server');
function load(file, mocks = {}, globals = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    exports, require: name => name in mocks ? mocks[name] : require(name),
    Response, URL, Buffer, structuredClone, ...globals,
  });
  return exports;
}
const safeRedirect = load('lib/supabase/redirect.ts');

test('post-login target cannot escape this app', () => {
  for (const value of [null, '', '//evil.example', 'https://evil.example', '/\\evil.example', '/login', '/courses/\\evil']) {
    assert.equal(safeRedirect.safeNext(value), '/dashboard');
  }
  assert.equal(safeRedirect.safeNext('/courses/qa?tab=exams'), '/courses/qa?tab=exams');
});

test('getCurrentUserId validates with getUser and fails closed', async () => {
  for (const [data, error, expected] of [[{ user: { id: 'user-a' } }, null, 'user-a'], [{ user: null }, null, null], [{ user: { id: 'spoofed' } }, {}, null]]) {
    const auth = load('lib/auth.ts', { '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data, error }) } }) } });
    assert.equal(await auth.getCurrentUserId(), expected);
  }
  const auth = load('lib/auth.ts', { '@/lib/supabase/server': { createClient: async () => { throw new Error('Config/network failure'); } } });
  assert.equal(await auth.getCurrentUserId(), null);
});

test('server cookie adapter reads session and writes exchanged/refreshed cookies', async () => {
  const writes = [];
  let methods;
  const server = load('lib/supabase/server.ts', {
    '@supabase/ssr': { createServerClient: (_url, _key, options) => { methods = options.cookies; return {}; } },
    'next/headers': { cookies: async () => ({ getAll: () => [{ name: 'session', value: 'test-cookie' }], set: (...args) => writes.push(args) }) },
    './config': { getSupabaseConfig: () => ({ url: 'https://example.supabase.co', key: 'test-public-key' }) },
  });
  await server.createClient();
  assert.equal(methods.getAll()[0].name, 'session');
  methods.setAll([{ name: 'session', value: 'refreshed', options: { path: '/' } }]);
  assert.equal(writes[0][1], 'refreshed');
});

test('OAuth callback exchanges the code, rejects missing/failed codes, and blocks external redirects', async () => {
  const calls = [];
  const callback = load('app/auth/callback/route.ts', {
    'next/server': { NextResponse },
    '@/lib/supabase/server': { createClient: async () => ({ auth: { exchangeCodeForSession: async code => { calls.push(code); return { error: code === 'bad' ? {} : null }; } } }) },
    '@/lib/supabase/redirect': safeRedirect,
  });
  for (const query of ['', '?error=access_denied', '?code=bad']) {
    const response = await callback.GET(new Request(`http://localhost:3000/auth/callback${query}`));
    assert.equal(new URL(response.headers.get('location')).pathname, '/login');
  }
  const success = await callback.GET(new Request('http://localhost:3000/auth/callback?code=good&next=%2Fcourses'));
  assert.equal(success.headers.get('location'), 'http://localhost:3000/courses');
  assert.match(success.headers.get('cache-control'), /no-store/);
  const unsafe = await callback.GET(new Request('http://localhost:3000/auth/callback?code=good&next=https://evil.example'));
  assert.equal(unsafe.headers.get('location'), 'http://localhost:3000/dashboard');
  assert.deepEqual(calls, ['bad', 'good', 'good']);
});

test('proxy refresh copies cookies to request and response and preserves no-cache headers', async () => {
  let refreshedRequest;
  const session = load('lib/supabase/proxy.ts', {
    'next/server': { NextResponse },
    './config': { getSupabaseConfig: () => ({ url: 'https://example.supabase.co', key: 'test-public-key' }) },
    '@supabase/ssr': { createServerClient: (_url, _key, { cookies }) => ({ auth: { getClaims: async () => {
      cookies.setAll([{ name: 'session', value: 'refreshed', options: { path: '/' } }], { 'Pragma': 'no-cache' });
      refreshedRequest = cookies.getAll().find(c => c.name === 'session')?.value;
      return { data: { claims: { sub: 'user-a' } }, error: null };
    } } }) },
  });
  const result = await session.updateSession(new NextRequest('http://localhost/courses'));
  assert.equal(result.userId, 'user-a');
  assert.equal(refreshedRequest, 'refreshed');
  assert.equal(result.response.cookies.get('session').value, 'refreshed');
  assert.equal(result.response.headers.get('pragma'), 'no-cache');
});

test('page redirects keep refresh cookies; APIs are not redirected to HTML login', async () => {
  const proxy = load('proxy.ts', {
    'next/server': { NextResponse },
    '@/lib/supabase/proxy': { updateSession: async () => {
      const response = NextResponse.next(); response.cookies.set('session', 'refreshed');
      return { userId: null, response };
    } },
  });
  for (const path of ['/courses', '/courses/a', '/extraction', '/review']) {
    const response = await proxy.proxy(new NextRequest(`http://localhost${path}`));
    const target = new URL(response.headers.get('location'));
    assert.equal(target.pathname, '/login');
    assert.equal(response.headers.get('x-middleware-next'), null);
    assert.equal(target.searchParams.get('next'), path);
    assert.equal(response.cookies.get('session').value, 'refreshed');
  }
  const api = await proxy.proxy(new NextRequest('http://localhost/api/dashboard'));
  assert.equal(api.headers.get('location'), null);
});

const apiMocks = {
  'next/server': { NextResponse },
  '@/utils/schema': { CATEGORIES: ['assignment', 'quiz', 'exam', 'project', 'reading'] },
  '@google/genai': {},
};
const privateRoutes = [
  ['app/api/dashboard/route.ts', 'GET'], ['app/api/requirements/[id]/complete/route.ts', 'PATCH'],
  ['app/api/extract/route.ts', 'POST'], ['app/api/courses/route.ts', 'POST'],
  ['app/api/courses/[id]/route.ts', 'PATCH'], ['app/api/courses/[id]/route.ts', 'DELETE'],
  ['app/api/requirements/[id]/route.ts', 'PATCH'], ['app/api/requirements/[id]/route.ts', 'DELETE'],
  ['app/api/requirements/courses/route.ts', 'GET'],
];
test('all private handlers return 401 before parsing or database access', async () => {
  for (const [file, method] of privateRoutes) {
    const handler = load(file, { ...apiMocks,
      '@/lib/auth': { getCurrentUserId: async () => null },
      '@/lib/supabase/server': { createClient: async () => { throw new Error('Must not access database'); } },
    });
    assert.equal((await handler[method]({}, { params: Promise.resolve({ id: '1' }) })).status, 401, file + method);
  }
});
test('mutations filter by verified owner and course save uses the RLS RPC', async () => {
  const owner = '11111111-1111-4111-8111-111111111111';
  const filters = []; let rpcCall;
  const chain = new Proxy({}, { get(_object, name) {
    if (name === 'then') return resolve => resolve({ data: [{ id: 'owned' }], error: null });
    return (...args) => { if (name === 'eq') filters.push(args); return chain; };
  } });
  const mocks = { ...apiMocks,
    '@/lib/auth': { getCurrentUserId: async () => owner },
    '@/lib/supabase/server': { createClient: async () => ({ from: () => chain, rpc: async (name, args) => { rpcCall = { name, args }; return { data: 'course-id', error: null }; } }) },
  };
  for (const [file, method] of privateRoutes.filter(([file]) => file.includes('[id]'))) {
    filters.length = 0;
    const handler = load(file, mocks);
    const response = await handler[method](new Request('http://localhost/api/item', { method, ...(method === 'PATCH' ? { body: '{"title":"Owned item","completed":true}' } : {}) }), { params: Promise.resolve({ id: 'row-id' }) });
    assert.equal(response.status, 200, file);
    assert.ok(filters.some(([key, value]) => key === 'user_id' && value === owner), file);
  }
  const courses = load('app/api/courses/route.ts', mocks);
  const response = await courses.POST(new Request('http://localhost/api/courses', { method: 'POST', body: JSON.stringify({ userId: 'spoofed', title: 'Owned course', requirements: [] }) }));
  assert.equal(response.status, 200);
  assert.equal(rpcCall.name, 'save_course');
  assert.equal('p_user_id' in rpcCall.args, false);
});

test('Google button starts OAuth with same-origin callback and requested page', async () => {
  let options;
  const React = require('react');
  const button = load('components/google-sign-in.tsx', {
    react: { ...React, useState: value => [value, () => {}] },
    '@/lib/supabase/redirect': safeRedirect,
    '@/lib/supabase/client': { createClient: () => ({ auth: { signInWithOAuth: async value => { options = value; return { error: null }; } } }) },
  }, { window: { location: { origin: 'http://localhost:3000' } } });
  const tree = button.GoogleSignIn({ next: '/courses' });
  await tree.props.children[1].props.onClick();
  assert.equal(options.provider, 'google');
  const callback = new URL(options.options.redirectTo);
  assert.equal(callback.origin, 'http://localhost:3000');
  assert.equal(callback.pathname, '/auth/callback');
  assert.equal(callback.searchParams.get('next'), '/courses');
});

test('logout uses Supabase and does not redirect on sign-out failure', async () => {
  const React = require('react');
  for (const fails of [false, true]) {
    let options; const paths = [];
    const navbar = load('components/Navbar.tsx', {
      react: { ...React, useState: value => [value, () => {}] },
      'next/navigation': { usePathname: () => '/dashboard', useRouter: () => ({ push: path => paths.push(path), refresh() {} }) },
      'next/link': { default: 'a' },
      '@/lib/supabase/client': { createClient: () => ({ auth: { signOut: async value => { options = value; return { error: fails ? {} : null }; } } }) },
    });
    function find(node) {
      if (!node || typeof node !== 'object') return null;
      if (node.type === 'button' && node.props.children === 'Log out') return node;
      for (const child of React.Children.toArray(node.props?.children)) { const found = find(child); if (found) return found; }
      return null;
    }
    await find(navbar.default()).props.onClick();
    assert.equal(options.scope, 'local');
    assert.equal(paths.length, fails ? 0 : 1);
  }
});
test('browser course caches use separate account namespaces', () => {
  const records = new Map([['studysync:courses', '[{"id":"legacy"}]']]);
  const localStorage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
  const courses = load('utils/courses.ts', { '@/lib/supabase/client': {}, '@/components/auth-user-provider': {} }, { localStorage, window: { dispatchEvent() {} }, Event });
  courses.saveCoursesLocally([{ id: 'only-a' }], 'user-a');
  courses.saveCoursesLocally([{ id: 'only-b' }], 'user-b');
  assert.equal(JSON.parse(records.get('studysync:courses:user-a'))[0].id, 'only-a');
  assert.equal(JSON.parse(records.get('studysync:courses:user-b'))[0].id, 'only-b');
});
