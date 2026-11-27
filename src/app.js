import express from 'express';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const app = express();
const activities = [
  { student: 'Alex', team: 'Octocats', type: 'Running', minutes: 30 },
  { student: 'Sam', team: 'Robocats', type: 'Cycling', minutes: 45 },
  { student: 'Jordan', team: 'Octocats', type: 'Swimming', minutes: 20 },
].map((activity) => ({
  ...activity,
  id: randomUUID(),
  points: activity.minutes,
}));

app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public/', import.meta.url))));

app.get('/api/activities', (req, res) => {
  res.json({ activities });
});

app.get('/api/leaderboard', (req, res) => {
  const totals = new Map();
  for (const { team, points } of activities) {
    const total = totals.get(team) ?? { totalPoints: 0, activityCount: 0 };
    total.totalPoints += points;
    total.activityCount += 1;
    totals.set(team, total);
  }

  const leaderboard = [...totals]
    .map(([team, { totalPoints, activityCount }]) => ({ team, totalPoints, activityCount }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
  res.json({ leaderboard });
});

app.post('/api/activities', (req, res) => {
  const { student, team, type, minutes } = req.body ?? {};

  for (const [name, value] of Object.entries({ student, team, type })) {
    if (typeof value !== 'string' || value.trim().length === 0) {
      return res.status(400).json({ error: `${name} must be a non-empty string` });
    }
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1 || minutes > 300) {
    return res.status(400).json({ error: 'minutes must be a number between 1 and 300' });
  }

  const activity = { id: randomUUID(), student, team, type, minutes, points: minutes };
  activities.unshift(activity);
  return res.status(201).json({ activity });
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  return next(err);
});

export default app;
