import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/index.js';

test('health reports not ready without required secrets', async () => {
  const response=await worker.fetch(new Request('https://example.workers.dev/api/health'), {});
  assert.equal(response.status,200);
  const json=await response.json();
  assert.equal(json.ok,true);
  assert.equal(json.ready,false);
});

test('CORS preflight blocks unknown origins', async () => {
  const response=await worker.fetch(new Request('https://example.workers.dev/api/requests',{
    method:'OPTIONS', headers:{Origin:'https://attacker.example'}
  }), {});
  assert.equal(response.status,403);
});

test('CORS preflight accepts SAITE origin only', async () => {
  const response=await worker.fetch(new Request('https://example.workers.dev/api/requests',{
    method:'OPTIONS', headers:{Origin:'https://k410sh4.github.io'}
  }), {});
  assert.equal(response.status,204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://k410sh4.github.io');
});

test('rejects public POST from unknown origin', async () => {
  const response=await worker.fetch(new Request('https://example.workers.dev/api/requests',{
    method:'POST', headers:{Origin:'https://example.com','Content-Type':'application/json'},
    body:JSON.stringify({source:'saite'})
  }), {});
  assert.equal(response.status,403);
});

test('public POST fails closed before backend configuration', async () => {
  const response=await worker.fetch(new Request('https://example.workers.dev/api/requests',{
    method:'POST', headers:{Origin:'https://k410sh4.github.io','Content-Type':'application/json'},
    body:JSON.stringify({source:'saite'})
  }), {});
  assert.equal(response.status,503);
});

test('admin API does not return messages to unauthenticated callers', async () => {
  const response=await worker.fetch(new Request('https://example.workers.dev/api/admin/requests'), {});
  assert.equal(response.status,401);
});

test('unknown APIs are not publicly exposed', async () => {
  const response=await worker.fetch(new Request('https://example.workers.dev/api/debug'), {});
  assert.equal(response.status,404);
});
