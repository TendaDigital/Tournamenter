const { test, expect } = require('@playwright/test');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { listen } = require('../../app');

let host;
let origin;
let directory;
let env;

test.beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tournamenter-browser-'));
  env = {
    PORT: '0',
    HOST: '127.0.0.1',
    DB_FOLDER: directory,
    PASSWORD: 'local-test',
    APP_NAME: 'Test tournament',
    TOURNAMENTER_EXTENSIONS_JSON: JSON.stringify([join(__dirname, 'fixture-pageview')]),
  };
  await start();
});
async function start() {
  host = await listen({ env });
  origin = 'http://127.0.0.1:' + host.listener.address().port;
}
test.afterAll(async () => {
  await host?.close();
  await rm(directory, { recursive: true, force: true });
});

async function edit(page, label, value, select = false) {
  await page.getByRole('button', { name: 'Edit ' + label, exact: true }).click();
  const dialog = page.getByRole('dialog');
  if (select) await dialog.getByLabel(label, { exact: true }).selectOption({ label: value });
  else await dialog.getByLabel(label, { exact: true }).fill(value);
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
}
async function signIn(page) {
  await page.goto(origin + '/teams/manage');
  await page.getByLabel('Password').fill(env.PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Create Team' })).toBeVisible();
}

test('organize, score and project over a disconnected LAN, then reopen the event', async ({
  page,
  browser,
}) => {
  const external = [];
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).hostname !== '127.0.0.1') {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await signIn(page);
  await page.getByRole('button', { name: 'Create Team' }).click();
  await edit(page, 'Team name', 'Equipe São João');
  await edit(page, 'Location', 'Brazil', true);
  await page.getByRole('link', { name: 'Tables', exact: true }).click();
  await page.getByRole('button', { name: 'Create New Table' }).click();
  await edit(page, 'Table name', 'Resgate');
  await page.getByRole('button', { name: 'Show Options' }).click();
  await edit(page, 'Score Columns', '2');
  await edit(page, 'Score Columns (View)', '1');
  await page.getByRole('button', { name: 'Show', exact: true }).click();
  await page.getByRole('button', { name: 'Add Team' }).click();
  await edit(page, 'Team', 'Equipe São João', true);
  for (const [column, value] of [
    [1, '23'],
    [2, '7'],
  ]) {
    await page.getByRole('button', { name: 'Edit Score ' + column + ' for Equipe São João' }).click();
    await page.getByRole('dialog').getByLabel('Score', { exact: true }).fill(value);
    await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  await expect(page.getByRole('cell', { name: '30', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Show', exact: true }).click();
  await expect(page.getByRole('cell', { name: '30', exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Views', exact: true }).click();
  await page.getByRole('button', { name: 'Create New View' }).click();
  await edit(page, 'View title', 'Results');
  await page.getByText('New Page', { exact: true }).click();
  await page.getByRole('button', { name: 'Table View', exact: true }).click();
  await edit(page, 'Table to show', 'Resgate', true);
  const publicLink = await page.getByRole('link', { name: /^\/views\/view\// }).getAttribute('href');
  const publicContext = await browser.newContext();
  const viewer = await publicContext.newPage();
  viewer.on('pageerror', (e) => errors.push(e.message));
  await viewer.goto(origin + '/views/view');
  await viewer.getByRole('link', { name: 'Results' }).click();
  await expect(viewer.getByRole('cell', { name: 'Equipe São João' })).toBeVisible();
  await expect(viewer.getByRole('cell', { name: '23', exact: true })).toHaveCount(2);
  await expect(viewer.getByRole('columnheader', { name: 'Score 2' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Visible', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hidden', exact: true })).toBeVisible();
  await expect(viewer.getByRole('cell', { name: 'Equipe São João' })).toHaveCount(0, { timeout: 10000 });
  await page.getByRole('button', { name: 'Hidden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Visible', exact: true })).toBeVisible();
  await host.close();
  await start();
  await viewer.goto(origin + publicLink);
  await expect(viewer.getByRole('cell', { name: 'Equipe São João' })).toBeVisible();
  await publicContext.close();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('manage a group and live match, then configure an installed page view', async ({ page }) => {
  await signIn(page);
  await page.getByRole('link', { name: 'Groups', exact: true }).click();
  await page.getByRole('button', { name: 'Create New Group' }).click();
  await edit(page, 'Group name', 'Final');
  await page.getByRole('button', { name: 'Show', exact: true }).click();
  await page.getByRole('button', { name: 'Create New Match' }).click();
  await edit(page, 'Match state', 'playing', true);
  await edit(page, 'Team A score', '4');
  const list = await page.request.get(origin + '/matches');
  const [match] = await list.json();
  await page.goto(origin + '/matches/live/' + match.id);
  await page.getByRole('button', { name: '4', exact: true }).click();
  await expect(page.getByRole('button', { name: '5', exact: true })).toBeVisible();

  // Write through the same authenticated browser session the UI uses.
  const created = await page.request.post(origin + '/views', { data: { title: 'Fixture view' } });
  const view = await created.json();
  await page.goto(origin + '/views/manage/' + view.id);
  await page.getByText('New Page', { exact: true }).click();
  await page.getByRole('button', { name: 'Arena announcement', exact: true }).click();
  await page.getByRole('button', { name: 'Use Arena B' }).click();
  await expect
    .poll(
      async () =>
        (await (await page.request.get(origin + '/api/admin/views/' + view.id)).json()).pages[0]?.options
          .message,
    )
    .toBe('Arena B');
  await page.goto(origin + '/views/view/' + view.id);
  await expect(page.getByRole('heading', { name: 'Arena B', exact: true })).toBeVisible();
});

test('render existing announcement, image, elimination bracket, group and live match slides', async ({
  page,
}) => {
  await signIn(page);
  const group = await (await page.request.post(origin + '/groups', { data: { name: 'Arena azul' } })).json();
  const match = await (
    await page.request.post(origin + '/matches', {
      data: { groupId: group.id, field: 'A', teamAScore: 9, teamBScore: 3 },
    })
  ).json();
  const pages = [
    { module: 'pageview-message', options: { message: '# Aviso\n\n<strong>Sala 2</strong>' } },
    { module: 'pageview-image', options: { file: '/branding.png', size: 'small' } },
    {
      module: 'pageview-bracket',
      options: { data: { teams: [['Jade', 'Ametista']], results: [[[[7, 2]]]] } },
    },
    { module: 'pageview-group', options: { tables: group.id } },
    { module: 'pageview-live-match', options: { match: match.id } },
  ].map((p, index) => ({ ...p, id: index + 1, disabled: 'false', still: 30 }));
  const view = await (await page.request.post(origin + '/views', { data: { title: 'Arena', pages } })).json();
  await page.goto(origin + '/views/view/' + view.id);
  await expect(page.getByRole('heading', { name: 'Aviso' })).toBeVisible();
  await expect(page.locator('strong').filter({ hasText: 'Sala 2' })).toBeVisible();
  await page.getByRole('link', { name: 'Page 2', exact: true }).click();
  await expect(page.locator('#pages img')).toBeVisible();
  await page.getByRole('link', { name: 'Page 3', exact: true }).click();
  await expect(page.getByText('Ametista', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Page 4', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Arena azul' })).toBeVisible();
  await page.getByRole('link', { name: 'Page 5', exact: true }).click();
  await expect(page.locator('.team.left .team-score')).toHaveText('9');
  await page.goto(origin + '/views/view/nonexistent');
  await expect(page.getByText('Current Created Views')).toBeVisible();
});
