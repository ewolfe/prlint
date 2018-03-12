const fs = require('fs');
const listen = require('test-listen');
const micro = require('micro');
const nock = require('nock');
const request = require('request-promise-native');
const test = require('ava');

const payloadClosed = require('./payload-closed.json');
const payloadNormal = require('./payload-normal.json');
const service = require('../index.js');

test('GET /favicon.ico should return image/x-icon header', async (t) => {
  const url = await listen(micro(service));
  const response = await request.head(`${url}/favicon.ico`);
  t.is('image/x-icon', response['content-type']);
});

test('GET /status should return OK', async (t) => {
  const url = await listen(micro(service));
  const response = await request(`${url}/status`);
  t.is('OK', response);
});

test('POST /webhook should return payload if there’s no pull_request data', async (t) => {
  const url = await listen(micro(service));
  const response = await request.post(`${url}/webhook`, { json: { foo: 'bar' } });
  t.deepEqual({ foo: 'bar' }, response);
});

test('POST /webhook should return payload if the PR is closed', async (t) => {
  const url = await listen(micro(service));
  const response = await request.post(`${url}/webhook`, { json: payloadClosed });
  t.deepEqual(payloadClosed, response);
});

test('POST /webhook should send POST to github api as a side effect', async (t) => {
  // mock access_tokens response data from github
  const date = new Date();
  date.setDate(date.getDate() + 1 /* days  */);
  nock('https://api.github.com')
    .post(`/installations/${payloadNormal.installation.id}/access_tokens`)
    .reply(200, {
      expires_at: date,
      token: 'token',
    });

  // mock prlint.json config response data from github
  const prlint = fs.readFileSync('test/prlint-config-sample.json', 'utf8');
  const buf = Buffer.from(prlint, 'utf8');
  nock('https://api.github.com')
    .get(`/repos/${payloadNormal.repository.full_name}/contents/.github/prlint.json?ref=${payloadNormal.pull_request.head.ref}`)
    .reply(200, { content: buf.toString('base64') });

  // mock status update response data from github
  const statusUpdate = nock('https://api.github.com')
    .post(`/repos/${payloadNormal.repository.full_name}/statuses/${payloadNormal.pull_request.head.sha}`)
    .reply(200, { success: true });

  // perform test
  const url = await listen(micro(service));
  await request.post(`${url}/webhook`, { json: payloadNormal });
  t.is(statusUpdate.isDone(), true);
});

test('ANY /<unhandled> should redirect to github.com/ewolfe/prlint', async (t) => {
  nock('https://github.com').get('/ewolfe/prlint').reply(200, 'OK');
  const url = await listen(micro(service));
  const response = await request(`${url}/na`);
  t.is('OK', response);
});
