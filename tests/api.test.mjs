import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authenticate, readJson, failure, HttpError } from '../lib/server/api.ts';

const req=(body,type='application/json')=>new Request('https://zoya.example/api/properties',{method:'POST',headers:{'Content-Type':type},body});
test('body parser accepts JSON and rejects malformed JSON and wrong media types',async()=>{
 assert.deepEqual(await readJson(req('{"x":1}')),{x:1});
 await assert.rejects(readJson(req('{')));
 await assert.rejects(readJson(req('{}','text/plain')),e=>e.status===415);
});
test('body size limit applies without Content-Length',async()=>{
 await assert.rejects(readJson(req(JSON.stringify({description:'x'.repeat(40000)}))),e=>e.status===413);
});
test('missing bearer token fails before contacting database',async()=>{
 await assert.rejects(authenticate(new Request('https://zoya.example')),e=>e.status===401);
});
test('unexpected errors do not leak internals',async t=>{
 t.mock.method(console,'error',()=>{});
 const response=failure(new Error('secret SQL and token'));
 assert.equal(response.status,500);assert.equal(response.headers.get('cache-control'),'no-store');
 assert.equal((await response.json()).error,'Could not complete the request.');
 assert.equal(failure(new HttpError(403,'Administrator access required.')).status,403);
});
test('authentication and admin checks validate remote identity, not token appearance',async t=>{
 process.env.NEXT_PUBLIC_SUPABASE_URL='https://test.supabase.co';
 process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-publishable';
 const request=new Request('https://zoya.example',{headers:{Authorization:'Bearer fake-token'}});
 let valid=false, administrator=false; const seen=[];
 t.mock.method(globalThis,'fetch',async (input,options)=>{
  const url=String(input); seen.push({url,headers:options?.headers});
  if(url.endsWith('/auth/v1/user')) return Response.json(valid ? {id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'test@example.com',app_metadata:{},user_metadata:{},created_at:'2026-11-17T00:00:00Z'} : {message:'Invalid token'}, {status: valid ? 200 : 401});
  if(url.endsWith('/rest/v1/rpc/is_marketplace_admin')) return Response.json(administrator);
  throw new Error('Unexpected network request');
 });
 await assert.rejects(authenticate(request),e=>e.status===401);
 valid=true;
 await assert.rejects(authenticate(request,true),e=>e.status===403);
 administrator=true;
 assert.equal((await authenticate(request,true)).user.id,'11111111-1111-4111-8111-111111111111');
 assert.ok(seen.some(entry=>entry.url.includes('/auth/v1/user')));
});
