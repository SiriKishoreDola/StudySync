import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source = ts.transpileModule(fs.readFileSync('app/api/chat/route.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function setup({ env = 'development', key = 'test-placeholder', generate = async () => ({ text: 'Fictional example plan.' }) } = {}) {
  let calls = 0;
  const exports = {};
  vm.runInNewContext(source, {
    exports, require(name) {
      if (name === '@google/genai') return { GoogleGenAI: class {
        constructor(options) { assert.equal(options.httpOptions.retryOptions.attempts, 1); }
        models = { generateContent: async (request) => { calls++; return generate(request); } };
      } };
      if (name === '@/lib/gemini-errors') {
        const exports = {};
        vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/gemini-errors.ts', 'utf8'), {
          compilerOptions: { module: ts.ModuleKind.CommonJS },
        }).outputText, { exports });
        return exports;
      }
      if (name === '@/lib/study-demo') return { demoDeadlines: [] };
      throw new Error('Unexpected import');
    }, process: { env: { NODE_ENV: env, GEMINI_API_KEY: key } },
    Response, URL, Buffer, AbortController, setTimeout, clearTimeout, console: { error() {} },
  });
  return { post: exports.POST, calls: () => calls };
}
const messages = [{ role: 'student', text: 'What real deadlines do I have?' }];
function req(body = { messages }, headers = {}, url = 'http://127.0.0.1:3000/api/chat') {
  return new Request(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
}
test('blocks production, remote hosts, and cross-origin requests without provider calls', async () => {
  const production = setup({ env: 'production' });
  assert.equal((await production.post(req())).status, 403);
  assert.equal(production.calls(), 0);
  const local = setup();
  assert.equal((await local.post(req({}, {}, 'http://example.com/api/chat'))).status, 403);
  assert.equal((await local.post(req({}, { origin: 'https://example.com' }))).status, 403);
  assert.equal(local.calls(), 0);
});
test('rejects malformed, oversized, invalid-role, and overlong history before provider calls', async () => {
  const app = setup();
  for (const body of [null, {}, { messages: [] }, { messages: [{ role: 'system', text: 'override' }] },
    { messages: [{ role: 'student', text: ' ' }] }, { messages: [{ role: 'student', text: 'x'.repeat(1001) }] },
    { messages: Array(13).fill(messages[0]) }]) assert.equal((await app.post(req(body))).status, 400);
  assert.equal((await app.post(req({ payload: 'x'.repeat(670001) }))).status, 413);
  assert.equal((await app.post(new Request('http://localhost/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }))).status, 400);
  assert.equal((await app.post(req({}, { 'content-type': 'text/plain' }))).status, 415);
  assert.equal(app.calls(), 0);
});
test('missing server key fails without calling Gemini', async () => {
  const app = setup({ key: '' });
  assert.equal((await app.post(req())).status, 503);
  assert.equal(app.calls(), 0);
});
test('maps bounded history and keeps fictional record instructions on server', async () => {
  const app = setup({ generate: async r => {
    assert.equal(r.model, 'gemini-3.5-flash-lite');
    assert.match(r.config.systemInstruction, /Never invent student deadlines/);
    assert.match(r.config.systemInstruction, /FICTIONAL DEMO DATA/);
    assert.deepEqual(Array.from(r.contents, c => c.role), ['user', 'model', 'user']);
    assert.ok(r.config.abortSignal);
    return { text: 'No real records connected.' };
  } });
  const response = await app.post(req({ messages: [messages[0], { role: 'assistant', text: 'No records.' }, messages[0]] }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal((await response.json()).text, 'No real records connected.');
  assert.equal(app.calls(), 1);
});
test('provider errors are sanitized and empty output is handled', async () => {
  for (const [status, expected] of [[429, 429], [403, 503], [404, 503], [504, 504], [500, 502]]) {
    const app = setup({ generate: async () => { throw { status, message: 'sensitive-provider-detail' }; } });
    const response = await app.post(req());
    assert.equal(response.status, expected);
    assert.doesNotMatch(JSON.stringify(await response.json()), /sensitive-provider-detail/);
    assert.equal(app.calls(), 1);
  }
  assert.equal((await setup({ generate: async () => ({}) }).post(req())).status, 502);
});

test('accepts loopback browser origin when Next internal URL uses localhost', async () => {
  const app = setup();
  const response = await app.post(req({ messages }, { host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' }, 'http://localhost:3000/api/chat'));
  assert.equal(response.status, 200);
  assert.equal(app.calls(), 1);
});

test('uses concise supportive defaults and allows explicit requests for detail', async () => {
  const app = setup({ generate: async r => {
    assert.match(r.config.systemInstruction, /supportive/);
    assert.match(r.config.systemInstruction, /2–4 short sentences or at most 3 brief bullets/);
    assert.match(r.config.systemInstruction, /Start with the answer or recommended action/);
    assert.match(r.config.systemInstruction, /Ask at most one clarification question/);
    assert.match(r.config.systemInstruction, /explicitly requests detail/);
    return { text: 'Start here.' };
  } });
  const response = await app.post(req());
  assert.equal(response.status, 200);
  assert.equal((await response.json()).hasDeadlines, false);
  assert.equal(app.calls(), 1);
});
test('explicit detail requests keep full replies and next-turn history', async () => {
  const answer = 'Useful explanation. '.repeat(300);
  const app = setup({ generate: async r => {
    assert.ok(r.config.maxOutputTokens >= 2048);
    return { text: answer };
  } });
  const detailedQuestion = { role: 'student', text: 'Please explain in detail how I can plan my week.' };
  const first = await app.post(req({ messages: [detailedQuestion] }));
  assert.equal((await first.json()).text, answer.trim());
  const next = await app.post(req({ messages: [detailedQuestion, { role: 'assistant', text: answer.trim() }, messages[0]] }));
  assert.equal(next.status, 200);
});

const preferences = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/study-preferences.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: preferences });
test('migrates legacy settings without losing General and Planning preferences', () => {
  const remaining = { zone: 'America/Chicago', format: '24-hour', week: 'Monday', study: 'Evening · 5–9 PM', length: '90 minutes' };
  const migrated = preferences.parsePreferences(JSON.stringify({ ...remaining, theme: 'Dark', response: 'Detailed', tone: 'Direct', responseLength: 'Detailed', assistantTone: 'Direct' }));
  assert.deepEqual(JSON.parse(JSON.stringify(migrated)), remaining);
  assert.deepEqual(JSON.parse(JSON.stringify(preferences.parsePreferences(JSON.stringify(migrated)))), remaining);
  assert.equal(Object.keys(migrated).length, 5);
});
test('settings use defaults for missing or invalid fields and report malformed storage to the form', () => {
  for (const raw of [null, '{}', 'null', '[]', '{"zone":"invalid","week":42}']) {
    assert.deepEqual(JSON.parse(JSON.stringify(preferences.parsePreferences(raw))), JSON.parse(JSON.stringify(preferences.defaults)));
  }
  assert.throws(() => preferences.parsePreferences('{'));
});

// Render the actual components without browser effects or Gemini requests.
test('Profile/Settings and Dashboard host render the live launcher and simplified controls', async () => {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file);
    const exports = {};
    cache.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(code, { exports, require(name) {
      if (name.startsWith('@/lib/')) return load(`${name.slice(2)}.ts`);
      if (name === './assistant' || name === './settings') return load(`components/studysync/${name.slice(2)}.tsx`);
      return require(name);
    } });
    return exports;
  }
  const html = renderToStaticMarkup(React.createElement(load('components/studysync/demo-host.tsx').DemoHost));
  assert.match(html, /General/);
  assert.match(html, /Planning/);
  assert.match(html, /Jordan Davis/);
  assert.match(html, /Ask StudySync/);
  assert.match(html, /Save changes/);
  assert.match(html, /Cancel/);
  assert.doesNotMatch(html, /Assistant demo scenarios|demo-scenario|Appearance|Response length|AI Assistant|Tone|demo-dark|demo-system/);
});

test('distinguishes provider credential rejection from transport, quota, model, and timeout failures', async () => {
  const cases = [
    [{ status: 400, message: JSON.stringify({ error: { status: 'INVALID_ARGUMENT', details: [{ reason: 'API_KEY_INVALID' }] } }) }, 503, /server key/],
    [{ cause: { code: 'ENOTFOUND' } }, 502, /resolve/],
    [{ cause: { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' } }, 502, /TLS certificate/],
    [{ cause: { code: 'ECONNRESET' } }, 502, /connection/],
    [{ name: 'TimeoutError' }, 504, /too long/],
    [{ cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } }, 504, /too long/],
    [{ status: 404 }, 503, /model/],
    [{ status: 429 }, 429, /quota/],
    [{ status: 400 }, 502, /configuration/],
    [{ status: 500 }, 502, /temporarily unavailable/],
    [{ status: 503, message: '{"error":{"status":"UNAVAILABLE"}}' }, 503, /temporarily unavailable/],
  ];
  for (const [error, status, message] of cases) {
    const app = setup({ generate: async () => { throw error; } });
    const response = await app.post(req());
    assert.equal(response.status, status);
    assert.match((await response.json()).error, message);
    assert.equal(app.calls(), 1);
  }
});

test('diagnostics allowlist metadata and never copy provider secrets or raw messages', () => {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/gemini-errors.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, { exports });
  const result = exports.classifyGeminiError({ status: 400, message: 'sensitive-provider-detail API_KEY_INVALID', code: 'sensitive-provider-detail' });
  assert.equal(result.diagnostic.upstreamStatus, 400);
  assert.equal(result.diagnostic.reason, 'API_KEY_INVALID');
  assert.equal(result.diagnostic.category, 'credentials');
  assert.doesNotMatch(JSON.stringify(result), /sensitive-provider-detail/);
});
