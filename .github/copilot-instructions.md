# Copilot instructions for OctoFit Lite

- Follow `docs/spec.md`. It is the source of truth: do not add features it does not describe.
- Use Node.js 22, Express 5 and ES modules. No database, no frontend framework, no build step.
- Keep the server on port 3000.
- Keep `src/app.js` free of `listen` so tests can import the app.
- Prefer small, test-driven changes. Run `npm test` after every change and fix failures before stopping.
- Return deliberate `400` errors with a clear `error` message for invalid input.
- Never edit an existing test to make it pass unless the spec changed.
