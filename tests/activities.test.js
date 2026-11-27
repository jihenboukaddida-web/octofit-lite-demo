import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

const validActivity = {
  student: 'Alex',
  team: 'Octocats',
  type: 'Running',
  minutes: 30,
};

test('GET /api/activities returns the three seeded activities', async () => {
  const response = await request(app).get('/api/activities').expect(200);
  assert.equal(response.body.activities.length, 3);
  assert.deepEqual(
    new Set(response.body.activities.map((activity) => activity.team)),
    new Set(['Octocats', 'Robocats']),
  );
  for (const activity of response.body.activities) {
    assert.ok(activity.id);
    assert.equal(activity.points, activity.minutes);
  }
});

test('POST creates an activity and GET returns newest first', async () => {
  const first = await request(app)
    .post('/api/activities')
    .send(validActivity)
    .expect(201);
  const second = await request(app)
    .post('/api/activities')
    .send({ ...validActivity, student: 'Sam', minutes: 12.5 })
    .expect(201);

  assert.deepEqual(
    Object.fromEntries(Object.keys(validActivity).map((key) => [key, first.body.activity[key]])),
    validActivity,
  );
  assert.ok(first.body.activity.id);
  assert.ok(second.body.activity.id);
  assert.notEqual(first.body.activity.id, second.body.activity.id);
  assert.equal(first.body.activity.points, 30);
  assert.equal(second.body.activity.points, 12.5);

  const list = await request(app).get('/api/activities').expect(200);
  assert.deepEqual(list.body.activities.slice(0, 2), [
    second.body.activity,
    first.body.activity,
  ]);
});

test('POST accepts the inclusive minutes boundaries', async () => {
  for (const minutes of [1, 300]) {
    const response = await request(app)
      .post('/api/activities')
      .send({ ...validActivity, minutes })
      .expect(201);
    assert.equal(response.body.activity.points, minutes);
  }
});

test('POST rejects invalid fields with an error message', async () => {
  const invalidActivities = [];
  for (const field of ['student', 'team', 'type']) {
    for (const value of [undefined, '', '   ', null, 123]) {
      invalidActivities.push({ ...validActivity, [field]: value });
    }
  }
  for (const value of [undefined, null, '30', 0, 300.1, {}, true]) {
    invalidActivities.push({ ...validActivity, minutes: value });
  }
  invalidActivities.push(null, [], 'text');

  for (const input of invalidActivities) {
    const response = await request(app)
      .post('/api/activities')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(input))
      .expect(400);
    assert.equal(typeof response.body.error, 'string');
    assert.ok(response.body.error.length > 0);
  }
});

test('POST rejects non-positive minutes without changing activities or leaderboard', async () => {
  const activities = await request(app).get('/api/activities').expect(200);
  const leaderboard = await request(app).get('/api/leaderboard').expect(200);

  for (const minutes of [0, -1, -0.5]) {
    const response = await request(app)
      .post('/api/activities')
      .send({ ...validActivity, minutes })
      .expect(400);
    assert.equal(response.body.error, 'minutes must be a number between 1 and 300');
  }

  const activitiesAfter = await request(app).get('/api/activities').expect(200);
  const leaderboardAfter = await request(app).get('/api/leaderboard').expect(200);
  assert.deepEqual(activitiesAfter.body, activities.body);
  assert.deepEqual(leaderboardAfter.body, leaderboard.body);
});

test('POST rejects malformed JSON with an error message', async () => {
  const response = await request(app)
    .post('/api/activities')
    .set('Content-Type', 'application/json')
    .send('{"student":')
    .expect(400);
  assert.equal(typeof response.body.error, 'string');
  assert.ok(response.body.error.length > 0);
});

test('GET / serves the web page', async () => {
  const response = await request(app).get('/').expect(200);
  assert.match(response.headers['content-type'], /text\/html/);
  assert.match(response.text, /<form\b/i);
});
