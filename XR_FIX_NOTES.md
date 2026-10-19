# XR 4.1 — 19 October 2026

Fix for XR startup failures in both public learning worlds.

- A single controller owns pending, active and ending immersive sessions. Repeated clicks cannot send a second request or end the first session accidentally.
- The native request stays in the original click call stack to preserve user activation.
- VR prefers `local-floor` and falls back to `local` only when floor tracking is unsupported. The fallback preserves a 1.65 m eye-height offset during teleportation. AR keeps `local` tracking and required hit testing.
- Cancellation and setup errors close only the owned session and restore the world once. Re-entry is supported after permission refusal or exit.
- Four-language error notices remain visible until dismissed. They include the native error code and message; permission, support and already-active-session failures have distinct guidance.
- Entry scripts are versioned to avoid retaining the previous XR code through HTTP caches. The VR welcome panel waits for the first XR frame.

Validation: `node --test tests/xr-session.test.mjs` — 10 tests passed. JavaScript syntax checks passed. Tests use simulated XR session objects; they are not a physical headset or phone test.

Physical-device verification remains required: start VR/AR from the device browser, allow requested permissions, exit, enter again, try rapid double taps, then check VR teleportation or AR surface placement. Record device, browser, error code and observed behavior. This environment has no physical XR device and its cloud browser disables WebGL.

Reference contracts: https://www.w3.org/TR/webxr/ and https://threejs.org/docs/pages/WebXRManager.html
