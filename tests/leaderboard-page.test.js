import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { setImmediate } from 'node:timers/promises';
import { runInNewContext } from 'node:vm';

test('the page loads the leaderboard and refreshes it after an activity', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  assert.match(html, /<th>Activités<\/th>/);
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const elements = {
    '#activity-form': {
      addEventListener(event, handler) { this.handler = handler; },
      reset() { this.resetCalled = true; },
    },
    '#error': { textContent: '' },
    '#activities': { replaceChildren(...items) { this.items = items; } },
    '#leaderboard': { replaceChildren(...items) { this.items = items; } },
    '#team-filter': {
      value: '',
      addEventListener() {},
      replaceChildren() {},
    },
  };
  const createElement = (tagName) => ({
    tagName,
    textContent: '',
    append(...children) {
      this.children = children;
    },
  });
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
          ? [{ team: 'Robocats', totalPoints: 55, activityCount: 2, rank: 1 }, { team: 'Octocats', totalPoints: 50, activityCount: 2, rank: 2 }]
          : [{ team: 'Octocats', totalPoints: 50, activityCount: 2, rank: 1 }, { team: 'Robocats', totalPoints: 45, activityCount: 1, rank: 2 }],
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
      createElement,
    },
    fetch,
    FormData,
  });
  await setImmediate();
  assert.deepEqual(elements['#leaderboard'].items.map((item) => item.children.map((cell) => cell.textContent)), [
    [1, 'Octocats', 50, 2],
    [2, 'Robocats', 45, 1],
  ]);

  await elements['#activity-form'].handler({ preventDefault() {} });
  assert.deepEqual(elements['#leaderboard'].items.map((item) => item.children.map((cell) => cell.textContent)), [
    [1, 'Robocats', 55, 2],
    [2, 'Octocats', 50, 2],
  ]);
  assert.equal(requests.filter(({ url }) => url === '/api/leaderboard').length, 2);
  assert.equal(elements['#activity-form'].resetCalled, true);
  assert.equal(elements['#error'].textContent, '');
});

test('the page filters activities by team and retains the filter after adding an activity', async () => {
  const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const teamFilter = {
    value: '',
    addEventListener(event, handler) { this.handler = handler; },
    replaceChildren(...items) { this.items = items; },
  };
  const elements = {
    '#activity-form': {
      addEventListener(event, handler) { this.handler = handler; },
      reset() {},
    },
    '#error': { textContent: '' },
    '#activities': { replaceChildren(...items) { this.items = items; } },
    '#leaderboard': { replaceChildren(...items) { this.items = items; } },
    '#team-filter': teamFilter,
  };
  const createElement = (tagName) => ({
    tagName,
    textContent: '',
    append(...children) {
      this.children = children;
    },
  });
  const activities = [
    { student: 'Alex', team: 'Octocats', type: 'Running', minutes: 30, points: 30 },
    { student: 'Sam', team: 'Robocats', type: 'Cycling', minutes: 45, points: 45 },
  ];
  const fetch = async (url, options) => {
    if (options?.method === 'POST') {
      activities.unshift({ student: 'Jordan', team: 'New team', type: 'Swimming', minutes: 20, points: 20 });
      return { ok: true, json: async () => ({ activity: activities[0] }) };
    }
    if (url === '/api/activities') return { ok: true, json: async () => ({ activities }) };
    return { ok: true, json: async () => ({ leaderboard: [] }) };
  };
  class FormData {
    get(name) { return { student: 'Jordan', team: 'New team', type: 'Swimming', minutes: '20' }[name]; }
  }

  runInNewContext(script, {
    document: {
      querySelector: (selector) => elements[selector],
      createElement,
    },
    fetch,
    FormData,
  });
  await setImmediate();
  assert.deepEqual(teamFilter.items.map((item) => item.value), ['', 'Octocats', 'Robocats']);
  assert.equal(elements['#activities'].items.length, 2);

  teamFilter.value = 'Robocats';
  teamFilter.handler();
  assert.deepEqual(elements['#activities'].items.map((item) => item.textContent), [
    'Sam - Robocats - Cycling: 45 minutes (45 points)',
  ]);

  await elements['#activity-form'].handler({ preventDefault() {} });
  assert.deepEqual(teamFilter.items.map((item) => item.value), ['', 'New team', 'Octocats', 'Robocats']);
  assert.equal(teamFilter.value, 'Robocats');
  assert.equal(elements['#activities'].items.length, 1);
  assert.match(elements['#activities'].items[0].textContent, /^Sam - Robocats/);

  teamFilter.value = '';
  teamFilter.handler();
  assert.equal(elements['#activities'].items.length, 3);
  teamFilter.value = 'New team';
  teamFilter.handler();
  assert.equal(elements['#activities'].items.length, 1);
  assert.match(elements['#activities'].items[0].textContent, /^Jordan - New team/);
});
