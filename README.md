# PEACEVERSE × STEMCYCLE G2B ReGen

Multilingual educational 3D worlds — Turkish, English, Romanian and Ukrainian.

## Deployment

The complete static application is stored in twelve ordered `worlds.zip.partNN` files. GitHub Actions reassembles the ZIP, verifies SHA-256, extracts it and deploys it to GitHub Pages.

To unpack locally:
```sh
cat worlds.zip.part* > worlds.zip
unzip worlds.zip -d site
```

The archive contains all application source, local Three.js dependencies, both GLB scenes, four-language learning material, project artwork, guides and a music demo. The demo is an offline render, not a live VR recording.

## Updating the exhibition

Files in `overrides/` replace matching application files during deployment. For example, maintain `overrides/data/exhibits.json` and media under `overrides/assets/` to publish approved student work without replacing the entire archive. Preserve the existing catalog schema. Do not include student personal data or secrets.

## Pages edition

Scores, profiles and suggestion drafts stay in the current browser. They do not synchronize between devices and are removed when browser data is cleared. Drafts are not automatically sent to teachers. Shared submissions use the teacher-designated Padlet.

The private teacher application has separate account-based storage and moderation. It is not automatically synchronized with this public Pages edition.

WebXR requires a compatible browser/device and HTTPS. Actual headset VR and phone AR still require device testing.

## Student links

- [PEACEVERSE](https://sev84.github.io/peaceverse-g2b-worlds/experience.html)
- [STEMCYCLE G2B ReGen](https://sev84.github.io/peaceverse-g2b-worlds/regen.html)
- [Documents and suggestion board](https://sev84.github.io/peaceverse-g2b-worlds/resources.html)

First successful publication: 19 October 2026. All three entry pages, four PEACEVERSE language choices, the monthly mission and local suggestion saving were verified in the browser. WebGL is disabled in that test browser, so real-time rendering and VR/AR headset behavior remain unverified.
