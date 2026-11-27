import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('GET /api/leaderboard assigns 1-based ranks to teams with equal points', async () => {
  await request(app).post('/api/activities').send({
    student: 'Sam',
    team: 'Robocats',
    type: 'Running',
    minutes: 5,
  }).expect(201);

  const response = await request(app).get('/api/leaderboard').expect(200);
  assert.deepEqual(response.body.leaderboard.map(({ rank, totalPoints }) => ({ rank, totalPoints })), [
    { rank: 1, totalPoints: 50 },
    { rank: 2, totalPoints: 50 },
  ]);
  assert.deepEqual(new Set(response.body.leaderboard.map(({ team }) => team)), new Set(['Octocats', 'Robocats']));
});
