import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';

test('the page loads the leaderboard and refreshes it after an activity', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = {
    '#activity-form': {
      addEventListener(event, handler) { this.handler = handler; },
      reset() { this.resetCalled = true; },
    },
    '#error': { textContent: '' },
    '#activities': { replaceChildren(...items) { this.items = items; } },
    '#leaderboard': { replaceChildren(...items) { this.items = items; } },
  };
  const requests = [];
  let submitted = false;
  const fetch = async (url, options) => {
    requests.push({ url, options });
    if (url === '/api/activities' && options?.method === 'POST') {
      submitted = true;
      return { ok: true, json: async () => ({ activity: {} }) };
    }
    if (url === '/api/activities') {
      return { ok: true, json: async () => ({ activities: [] }) };
    }
    assert.equal(url, '/api/leaderboard');
    return {
      ok: true,
      json: async () => ({
        leaderboard: submitted
          ? [{ team: 'Robocats', totalPoints: 55, rank: 1 }, { team: 'Octocats', totalPoints: 50, rank: 2 }]
          : [{ team: 'Octocats', totalPoints: 50, rank: 1 }, { team: 'Robocats', totalPoints: 45, rank: 2 }],
      }),
    };
  };
  const values = { student: 'Sam', team: 'Robocats', type: 'Running', minutes: '10' };
  class FormData {
    get(name) { return values[name]; }
  }

  runInNewContext(script, {
    document: {
      querySelector: (selector) => elements[selector],
      createElement: () => ({ textContent: '' }),
    },
    fetch,
    FormData,
  });
  await setImmediate();
  assert.deepEqual(elements['#leaderboard'].items.map((item) => item.textContent), [
    'Octocats: 50 points',
    'Robocats: 45 points',
  ]);

  await elements['#activity-form'].handler({ preventDefault() {} });
  assert.deepEqual(elements['#leaderboard'].items.map((item) => item.textContent), [
    'Robocats: 55 points',
    'Octocats: 50 points',
  ]);
  assert.equal(requests.filter(({ url }) => url === '/api/leaderboard').length, 2);
  assert.equal(elements['#activity-form'].resetCalled, true);
  assert.equal(elements['#error'].textContent, '');
});
