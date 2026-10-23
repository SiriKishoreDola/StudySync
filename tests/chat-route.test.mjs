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
      if (name === '@/lib/study-demo') return { demoDeadlines: [] };
      throw new Error('Unexpected import');
    }, process: { env: { NODE_ENV: env, GEMINI_API_KEY: key } },
    Response, URL, Buffer, AbortController, setTimeout, clearTimeout,
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
    assert.equal(r.model, 'gemini-3.8-flash');
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

test('defaults to Concise and validates the response preference before provider calls', async () => {
  const app = setup({ generate: async r => {
    assert.match(r.config.systemInstruction, /Concise \(default\)/);
    assert.match(r.config.systemInstruction, /2–4 short sentences or at most 3 brief bullets/);
    assert.match(r.config.systemInstruction, /Start with the answer or recommended action/);
    assert.match(r.config.systemInstruction, /Ask at most one clarification question/);
    assert.match(r.config.systemInstruction, /explicitly requests detail/);
    return { text: 'Start here.' };
  } });
  assert.equal((await app.post(req())).status, 200);
  assert.equal((await app.post(req({ messages, responseLength: 'Concise' }))).status, 200);
  for (const responseLength of ['Verbose', null, {}, 1]) {
    assert.equal((await app.post(req({ messages, responseLength }))).status, 400);
  }
  assert.equal(app.calls(), 2);
});
test('Detailed allows full replies without cutting off output or breaking next-turn history', async () => {
  const answer = 'Useful explanation. '.repeat(300);
  const app = setup({ generate: async r => {
    assert.match(r.config.systemInstruction, /Saved response length: Detailed/);
    assert.match(r.config.systemInstruction, /Allow fuller explanations/);
    assert.ok(r.config.maxOutputTokens >= 2048);
    return { text: answer };
  } });
  const first = await app.post(req({ messages, responseLength: 'Detailed' }));
  assert.equal((await first.json()).text, answer.trim());
  const next = await app.post(req({ messages: [messages[0], { role: 'assistant', text: answer.trim() }, messages[0]], responseLength: 'Detailed' }));
  assert.equal(next.status, 200);
});

const preferences = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/study-preferences.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, { exports: preferences });
test('reads the saved response preference and falls back safely when storage is missing or invalid', () => {
  for (const raw of [null, '{', '{}', 'null', '{"response":"Verbose"}', '{"response":"Concise"}']) {
    assert.equal(preferences.readResponseLength({ getItem: () => raw }), 'Concise');
  }
  assert.equal(preferences.readResponseLength({ getItem: key => {
    assert.equal(key, 'studysync-demo-settings-v1');
    return '{"response":"Detailed"}';
  } }), 'Detailed');
  assert.equal(preferences.readResponseLength({ getItem: () => { throw new Error('Storage unavailable'); } }), 'Concise');
});
