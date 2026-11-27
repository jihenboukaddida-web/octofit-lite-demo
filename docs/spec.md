# OctoFit Lite – Specification

OctoFit Lite helps Mergington High School students log their workouts and see which team is leading.

## 1. Architecture

- Node.js 22, Express 5, ES modules (`"type": "module"`).
- In-memory storage only (no database). Data resets when the server restarts.
- The server listens on port **3000** and serves a static web page from `public/`.
- Source code lives in `src/`, tests in `tests/`.

## 2. Activities (version 1)

| Method and path | Expected behavior |
| --- | --- |
| `GET /api/activities` | Returns `{ "activities": [...] }`, newest first. |
| `POST /api/activities` | Body: `student`, `team`, `type`, `minutes`. Returns `201` with `{ "activity": {...} }`. The activity gets an `id` and `points` equal to `minutes`. |

Validation rules for `POST /api/activities`:

- `student`, `team` and `type` are required non-empty strings.
- `minutes` is a required number between 1 and 300.
- Invalid input returns `400` with `{ "error": "<message>" }`.

Seed data at startup: 3 activities across 2 teams, **Octocats** and **Robocats**.

## 3. Leaderboard (version 2)

| Method and path | Expected behavior |
| --- | --- |
| `GET /api/leaderboard` | Returns `{ "leaderboard": [...] }`: one entry per team with `team`, `totalPoints`, `activityCount` and a 1-based `rank`, highest points first. |

## 4. Web page

`public/index.html` (plain HTML, CSS and JavaScript, no framework):

- a form to log an activity (student, team, type, minutes), showing the API error message when the input is invalid;
- the list of activities, filterable by team or showing all teams; available teams update after an activity is added;
- (version 2) the team leaderboard with rank, points and activity count per team, refreshed after each new activity.

## 5. Tests

- Use the built-in Node.js test runner (`node --test`) and `supertest`.
- `npm test` runs all tests. Every endpoint has at least one success test and one validation test.
- `src/app.js` exports the Express app without calling `listen`; `src/server.js` starts it.
