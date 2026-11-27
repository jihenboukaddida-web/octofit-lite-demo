import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('GET /api/leaderboard sums points by team and updates ranks after activities', async () => {
  const initial = await request(app).get('/api/leaderboard').expect(200);
  assert.deepEqual(initial.body, {
    leaderboard: [
      { team: 'Octocats', totalPoints: 50, rank: 1 },
      { team: 'Robocats', totalPoints: 45, rank: 2 },
    ],
  });

  await request(app).post('/api/activities').send({
    student: 'Sam',
    team: 'Robocats',
    type: 'Running',
    minutes: 12.5,
  }).expect(201);
  await request(app).post('/api/activities').send({
    student: 'Alex',
    team: '__proto__',
    type: 'Swimming',
    minutes: 60,
  }).expect(201);

  const updated = await request(app).get('/api/leaderboard').expect(200);
  assert.deepEqual(updated.body, {
    leaderboard: [
      { team: '__proto__', totalPoints: 60, rank: 1 },
      { team: 'Robocats', totalPoints: 57.5, rank: 2 },
      { team: 'Octocats', totalPoints: 50, rank: 3 },
    ],
  });
});
