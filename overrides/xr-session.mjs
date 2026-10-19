// One owner for the browser's single immersive session. No await before requestSession:
// the request must retain the button click's transient user activation.
export async function selectXRReferenceSpace(session, mode) {
  if (mode === 'immersive-ar') {
    return {type: 'local', space: await session.requestReferenceSpace('local'), eyeOffset: 0};
  }
  try {
    return {type: 'local-floor', space: await session.requestReferenceSpace('local-floor'), eyeOffset: 0};
  } catch (error) {
    if (error.name !== 'NotSupportedError') throw error;
    return {type: 'local', space: await session.requestReferenceSpace('local'), eyeOffset: 1.65};
  }
}

export function createXRSessionController({xr, secureContext = true, overlayRoot,
  setup, restore, onState = () => {}, onError = () => {}}) {
  let owner = null;
  let state = 'idle';
  const transition = value => { state = value; onState(value); };
  const error = (name, message) => Object.assign(new Error(message), {name});
  function finish(attempt) {
    if (owner !== attempt || attempt.finished) return;
    attempt.finished = true;
    attempt.session?.removeEventListener('end', attempt.onEnd);
    try { if (attempt.setupStarted) restore(); }
    finally { owner = null; transition('idle'); }
  }
  async function close(attempt) {
    if (!attempt.session || attempt.ended) return;
    if (!attempt.closing) {
      transition('ending');
      attempt.closing = attempt.session.end().then(() => { attempt.ended = true; }).catch(e => {
        if (e.name === 'InvalidStateError') attempt.ended = true;
        else { attempt.closing = null; throw e; }
      });
    }
    await attempt.closing;
  }
  async function start(mode) {
    // Covers pending permission prompts, active sessions, and asynchronous teardown.
    if (owner) return null;
    const attempt = {mode, settingUp: true, cancelled: false, ended: false};
    owner = attempt;
    transition('starting');
    try {
      if (!secureContext) throw error('SecurityError', 'HTTPS is required');
      if (!xr || !['immersive-vr', 'immersive-ar'].includes(mode)) {
        throw error('NotSupportedError', 'This browser does not support this XR mode');
      }
      const options = mode === 'immersive-ar'
        ? {requiredFeatures: ['hit-test'], optionalFeatures: overlayRoot ? ['dom-overlay'] : [],
          ...(overlayRoot ? {domOverlay: {root: overlayRoot}} : {})}
        : {optionalFeatures: ['local-floor']};
      attempt.session = await xr.requestSession(mode, options);
      attempt.onEnd = () => {
        attempt.ended = true;
        // Let the renderer's own end listener restore its framebuffer first.
        if (!attempt.settingUp) queueMicrotask(() => finish(attempt));
      };
      attempt.session.addEventListener('end', attempt.onEnd, {once: true});
      const stopped = () => attempt.cancelled || attempt.ended;
      if (!stopped()) {
        attempt.setupStarted = true;
        await setup(attempt.session, mode, stopped);
      }
      if (stopped()) { await close(attempt); return null; }
      attempt.settingUp = false;
      transition('active');
      return attempt.session;
    } catch (e) {
      try { await close(attempt); }
      catch (closingError) { onError(closingError, mode); }
      if (!attempt.cancelled && e.name !== 'AbortError') onError(e, mode);
      return null;
    } finally {
      attempt.settingUp = false;
      // Keep the lock if the browser refused to end a still-active owned session.
      if (!attempt.session || attempt.ended) finish(attempt);
    }
  }
  async function end() {
    const attempt = owner;
    if (!attempt) return;
    attempt.cancelled = true;
    transition('ending');
    // A pending request cannot be aborted. Close only our returned session;
    // never start a second request or race renderer setup with session.end().
    if (attempt.settingUp) return;
    try { await close(attempt); finish(attempt); }
    catch (e) { onError(e, attempt.mode); }
  }
  return {start, end, get state() { return state; }};
}
