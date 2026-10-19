import test from 'node:test';
import assert from 'node:assert/strict';
import {createXRSessionController, selectXRReferenceSpace} from '../overrides/xr-session.mjs';

const deferred = () => { let resolve, reject; const promise=new Promise((yes,no)=>{resolve=yes;reject=no}); return {promise,resolve,reject}; };
const failure = name => Object.assign(new Error(name), {name});
class FakeSession extends EventTarget {
  ends=0;
  async end(){this.ends++;this.dispatchEvent(new Event('end'));}
}
function fixture(xr,setup=async()=>{}) {
  const states=[],errors=[];let restores=0;
  const controller=createXRSessionController({xr,setup,restore:()=>restores++,onState:s=>states.push(s),onError:e=>errors.push(e.name)});
  return {controller,states,errors,get restores(){return restores}};
}

test('double click while permission prompt is pending sends exactly one native request',async()=>{
  const permission=deferred(),session=new FakeSession();let requests=0;
  const f=fixture({requestSession(){requests++;return permission.promise}});
  const first=f.controller.start('immersive-vr');
  assert.equal(requests,1,'native request occurs synchronously in click call stack');
  assert.equal(await f.controller.start('immersive-ar'),null);
  assert.equal(requests,1);
  permission.resolve(session);assert.equal(await first,session);
  assert.equal(await f.controller.start('immersive-vr'),null);
  assert.equal(session.ends,0,'duplicate click must not terminate first session');
  await f.controller.end();assert.equal(f.restores,1);assert.equal(session.ends,1);
});
test('permission refusal releases lock and permits a deliberate retry',async()=>{
  let calls=0;const session=new FakeSession();
  const f=fixture({requestSession(){return ++calls===1?Promise.reject(failure('NotAllowedError')):Promise.resolve(session)}});
  assert.equal(await f.controller.start('immersive-vr'),null);assert.equal(f.controller.state,'idle');
  assert.deepEqual(f.errors,['NotAllowedError']);assert.equal(f.restores,0);
  assert.equal(await f.controller.start('immersive-vr'),session);await f.controller.end();
});
test('setup failure ends only owned session, restores once and permits a clean next session',async()=>{
  let attempt=0;const sessions=[new FakeSession(),new FakeSession()];
  const f=fixture({requestSession:async()=>sessions[attempt++]},async()=>{if(attempt===1)throw failure('NotSupportedError')});
  await f.controller.start('immersive-ar');assert.equal(sessions[0].ends,1);assert.equal(f.restores,1);
  await f.controller.start('immersive-vr');assert.equal(f.controller.state,'active');
  sessions[0].dispatchEvent(new Event('end'));await Promise.resolve();
  assert.equal(f.controller.state,'active','late old end cannot reset new session');
  await f.controller.end();assert.equal(f.restores,2);
});
test('exit during pending permission waits for and closes the acquired session without activating',async()=>{
  const permission=deferred(),session=new FakeSession();let setup=0;
  const f=fixture({requestSession:()=>permission.promise},async()=>setup++);
  const pending=f.controller.start('immersive-vr');await f.controller.end();
  assert.equal(f.controller.state,'ending');permission.resolve(session);await pending;
  assert.equal(setup,0);assert.equal(session.ends,1);assert.equal(f.controller.state,'idle');
  assert.ok(!f.states.includes('active'));
});
test('exit during renderer setup avoids racing setup and native end',async()=>{
  const gate=deferred(),session=new FakeSession();const f=fixture({requestSession:async()=>session},()=>gate.promise);
  const pending=f.controller.start('immersive-ar');await Promise.resolve();await f.controller.end();
  assert.equal(session.ends,0);gate.resolve();await pending;
  assert.equal(session.ends,1);assert.equal(f.restores,1);assert.ok(!f.states.includes('active'));
});
test('native headset exit restores once and allows re-entry',async()=>{
  const sessions=[new FakeSession(),new FakeSession()];let i=0;
  const f=fixture({requestSession:async()=>sessions[i++]});
  await f.controller.start('immersive-vr');await sessions[0].end();await Promise.resolve();
  assert.equal(f.controller.state,'idle');assert.equal(f.restores,1);
  await f.controller.start('immersive-vr');await f.controller.end();assert.equal(f.restores,2);
});
test('native exit during async setup never reports active',async()=>{
  const gate=deferred(),session=new FakeSession();const f=fixture({requestSession:async()=>session},()=>gate.promise);
  const pending=f.controller.start('immersive-vr');await Promise.resolve();await session.end();gate.resolve();await pending;
  assert.ok(!f.states.includes('active'));assert.equal(f.restores,1);assert.equal(f.controller.state,'idle');
});
test('floor tracking falls back only for unsupported space and preserves eye height',async()=>{
  const calls=[],local={kind:'local'};
  const result=await selectXRReferenceSpace({async requestReferenceSpace(type){calls.push(type);if(type==='local-floor')throw failure('NotSupportedError');return local}},'immersive-vr');
  assert.deepEqual(calls,['local-floor','local']);assert.equal(result.space,local);assert.equal(result.eyeOffset,1.65);
  await assert.rejects(selectXRReferenceSpace({requestReferenceSpace:async()=>{throw failure('SecurityError')}},'immersive-vr'),{name:'SecurityError'});
});
test('AR uses local tracking and required hit-test while overlay stays optional',async()=>{
  const root={},session=new FakeSession();let seen;
  const c=createXRSessionController({xr:{requestSession(mode,options){seen={mode,options};return Promise.resolve(session)}},overlayRoot:root,setup:async()=>{},restore:()=>{}});
  await c.start('immersive-ar');assert.deepEqual(seen.options.requiredFeatures,['hit-test']);assert.deepEqual(seen.options.optionalFeatures,['dom-overlay']);assert.equal(seen.options.domOverlay.root,root);await c.end();
  const calls=[];const result=await selectXRReferenceSpace({async requestReferenceSpace(type){calls.push(type);return {}}},'immersive-ar');assert.deepEqual(calls,['local']);assert.equal(result.eyeOffset,0);
});
test('missing XR API fails without trying to create or close a session',async()=>{
  const f=fixture(undefined);await f.controller.start('immersive-vr');assert.deepEqual(f.errors,['NotSupportedError']);assert.equal(f.controller.state,'idle');assert.equal(f.restores,0);
});
