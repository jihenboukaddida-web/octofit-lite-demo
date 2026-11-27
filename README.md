# OctoFit Lite – GitHub Copilot agent mode demo

Demo repository for GH-300, module 10 (*Building applications with GitHub Copilot agent mode*).

The repository starts almost empty on purpose: GitHub Copilot agent mode builds the application from
`docs/spec.md`, guided by `.github/copilot-instructions.md`.

Open it in a GitHub Codespace, then follow the demo guide.

## Run locally

Use Node.js 22, then install dependencies and start the server:

```sh
npm install
npm start
```

Open http://localhost:3000 to log activities and see the team leaderboard,
which refreshes after each new activity. Activities are stored in memory and
reset when the server restarts. Run the tests with `npm test`.
