const fs = require('fs');
const listen = require('test-listen');
const micro = require('micro');
const nock = require('nock');
const request = require('request-promise-native');
const test = require('ava');

const payloadClosed = require('./payload-closed.json');
const payloadFailure = require('./payload-failure.json');
const payloadNormal = require('./payload-normal.json');
const service = require('../src/app.js');

test('ANY /<unhandled> should redirect to github.com/ewolfe/prlint', async (t) => {
  nock('https://github.com')
    .get('/ewolfe/prlint')
    .reply(200, 'OK');
  const url = await listen(micro(service));
  const response = await request(`${url}/na`);
  t.is('OK', response);
  nock.cleanAll();
});

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
  const response = await request.post(`${url}/webhook`, {
    json: { foo: 'bar' },
  });
  t.deepEqual({ foo: 'bar' }, response);
});

test('POST /webhook should return payload if the PR is closed', async (t) => {
  const url = await listen(micro(service));
  const response = await request.post(`${url}/webhook`, {
    json: payloadClosed,
  });
  t.deepEqual(payloadClosed, response);
});

test('POST /webhook should return 400 if the PR payload is badly structured', async (t) => {
  const url = await listen(micro(service));
  const response = await request.post(`${url}/webhook`, {
    json: { pull_request: {} },
    resolveWithFullResponse: true, // give us access to response.statusCode
    simple: false, // don't throw when non 2xx
  });
  t.is(400, response.statusCode);
});

test('POST /webhook should return a 500 if any access token logic fails', async (t) => {
  // mock access_tokens response data from github
  const date = new Date();
  date.setDate(date.getDate() + 1 /* days  */);
  nock('https://api.github.com')
    .post(`/installations/${payloadNormal.installation.id}/access_tokens`)
    .reply(500, ''); // <- fails JSON.parse

  // perform test
  const url = await listen(micro(service));
  const response = await request.post(`${url}/webhook`, {
    // https://github.com/request/request-promise
    json: payloadNormal,
    resolveWithFullResponse: true, // give us access to response.statusCode
    simple: false, // don't throw when non 2xx
  });

  t.is(500, response.statusCode);
  nock.cleanAll();
});

test('POST /webhook should return a 500 if any status update logic fails', async (t) => {
  // mock access_tokens response data from github
  const date = new Date();
  date.setDate(date.getDate() + 1 /* days  */);
  const accessTokens = nock('https://api.github.com')
    .post(`/installations/${payloadNormal.installation.id}/access_tokens`)
    .reply(200, {
      expires_at: date,
      token: 'token',
    });
  accessTokens.persist(false);

  // mock status update response data from github
  const statuses = nock('https://api.github.com')
    .post(
      `/repos/${payloadNormal.repository.full_name}/statuses/${
        payloadNormal.pull_request.head.sha
      }`,
    )
    .reply(500);
  statuses.persist(false);

  // perform test
  const url = await listen(micro(service));
  const response = await request.post(`${url}/webhook`, {
    // https://github.com/request/request-promise
    json: payloadNormal,
    resolveWithFullResponse: true, // give us access to response.statusCode
    simple: false, // don't throw when non 2xx
  });

  t.is(500, response.statusCode);
  nock.cleanAll();
});

test('POST /webhook should send POST to github api as a side effect', async (t) => {
  // mock access_tokens response data from github
  const date = new Date();
  date.setDate(date.getDate() + 1 /* days  */);
  const accessTokens1 = nock('https://api.github.com')
    .post(`/installations/${payloadNormal.installation.id}/access_tokens`)
    .reply(200, {
      expires_at: date,
      token: 'token',
    });
  accessTokens1.persist(false);

  // mock prlint.json config response data from github
  const prlint = fs.readFileSync('test/prlint-config-sample.json', 'utf8');
  const buf = Buffer.from(prlint, 'utf8');
  const prlintDotJson = nock('https://api.github.com')
    .get(
      `/repos/${
        payloadNormal.repository.full_name
      }/contents/.github/prlint.json?ref=${
        payloadNormal.pull_request.head.ref
      }`,
    )
    .reply(200, { content: buf.toString('base64') });

  // mock status update response data from github
  const statuses1 = nock('https://api.github.com')
    .post(
      `/repos/${payloadNormal.repository.full_name}/statuses/${
        payloadNormal.pull_request.head.sha
      }`,
    )
    .reply(200);
  statuses1.persist(false);

  // perform test
  const url = await listen(micro(service));
  await request.post(`${url}/webhook`, { json: payloadNormal });
  t.is(prlintDotJson.isDone(), true);
  t.is(statuses1.isDone(), true);

  // perform second test to make sure access token is read from internal cache
  // as long as we don't call out to the github api for the token then we're good
  const accessTokens2 = nock('https://api.github.com')
    .post(`/installations/${payloadNormal.installation.id}/access_tokens`)
    .reply(200, {
      expires_at: date,
      token: 'token',
    });
  const prlintDotJson2 = nock('https://api.github.com')
    .get(
      `/repos/${
        payloadNormal.repository.full_name
      }/contents/.github/prlint.json?ref=${
        payloadNormal.pull_request.head.ref
      }`,
    )
    .reply(200, { content: buf.toString('base64') });
  const statuses2 = nock('https://api.github.com')
    .post(
      `/repos/${payloadNormal.repository.full_name}/statuses/${
        payloadNormal.pull_request.head.sha
      }`,
    )
    .reply(200, { success: true });
  statuses2.persist(false);

  await request.post(`${url}/webhook`, { json: payloadNormal });
  t.is(prlintDotJson2.isDone(), true);
  t.is(!accessTokens2.isDone(), true);
  nock.cleanAll();
});

test('POST /webhook should add a failure status to the PR if it doesn’t pass the users rules', async (t) => {
  // mock access_tokens response data from github
  const date = new Date();
  date.setDate(date.getDate() + 1 /* days  */);
  const accessToken = nock('https://api.github.com')
    .post(`/installations/${payloadFailure.installation.id}/access_tokens`)
    .reply(200, {
      expires_at: date,
      token: 'token',
    });
  accessToken.persist(false);

  // mock prlint.json config response data from github
  const prlint = fs.readFileSync('test/prlint-config-sample.json', 'utf8');
  const buf = Buffer.from(prlint, 'utf8');
  const prlintDotJson = nock('https://api.github.com')
    .get(
      `/repos/${
        payloadFailure.repository.full_name
      }/contents/.github/prlint.json?ref=${
        payloadFailure.pull_request.head.ref
      }`,
    )
    .reply(200, { content: buf.toString('base64') });

  // mock status update response data from github
  const statuses = nock('https://api.github.com')
    .post(
      `/repos/${payloadFailure.repository.full_name}/statuses/${
        payloadFailure.pull_request.head.sha
      }`,
    )
    .reply(200);

  // perform test
  const url = await listen(micro(service));
  await request.post(`${url}/webhook`, { json: payloadFailure });
  t.is(prlintDotJson.isDone(), true);
  t.is(statuses.isDone(), true);
  nock.cleanAll();
});

test('POST /webhook should add a failure status to the PR if it doesn’t pass the users rules', async (t) => {
  // mock access_tokens response data from github
  const date = new Date();
  date.setDate(date.getDate() + 1 /* days  */);
  nock('https://api.github.com')
    .post(`/installations/${payloadFailure.installation.id}/access_tokens`)
    .reply(500);

  // mock prlint.json config response data from github
  const prlint = fs.readFileSync('test/prlint-config-sample.json', 'utf8');
  const buf = Buffer.from(prlint, 'utf8');
  const prlintDotJson = nock('https://api.github.com')
    .get(
      `/repos/${
        payloadFailure.repository.full_name
      }/contents/.github/prlint.json?ref=${
        payloadFailure.pull_request.head.ref
      }`,
    )
    .reply(200, { content: buf.toString('base64') });

  // mock status update response data from github
  const statuses = nock('https://api.github.com')
    .post(
      `/repos/${payloadFailure.repository.full_name}/statuses/${
        payloadFailure.pull_request.head.sha
      }`,
    )
    // TODO: add failure payload to this post
    .reply(200);

  // perform test
  const url = await listen(micro(service));
  await request.post(`${url}/webhook`, { json: payloadFailure });
  t.is(prlintDotJson.isDone(), true);
  t.is(statuses.isDone(), true);
  nock.cleanAll();
});

test('POST /webhook should add an error status when prlint.json is missing', async (t) => {
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
  const prlintDotJson = nock('https://api.github.com')
    .get(
      `/repos/${
        payloadNormal.repository.full_name
      }/contents/.github/prlint.json?ref=${
        payloadNormal.pull_request.head.ref
      }`,
    )
    .reply(404);

  // mock status update response data from github
  const statuses = nock('https://api.github.com')
    .post(
      `/repos/${payloadNormal.repository.full_name}/statuses/${
        payloadNormal.pull_request.head.sha
      }`,
    )
    // TODO: add error payload to this post
    .reply(200, { success: true });

  // perform test
  const url = await listen(micro(service));
  await request.post(`${url}/webhook`, {
    json: payloadNormal,
    resolveWithFullResponse: true,
  });
  t.is(prlintDotJson.isDone(), true);
  t.is(statuses.isDone(), true);
  nock.cleanAll();
});

test('POST /webhook should send error status in the event of an unknown error', async (t) => {
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
  const prlintDotJson = nock('https://api.github.com')
    .get(
      `/repos/${
        payloadNormal.repository.full_name
      }/contents/.github/prlint.json?ref=${
        payloadNormal.pull_request.head.ref
      }`,
    )
    .reply(500);

  // mock status update response data from github
  const statuses = nock('https://api.github.com')
    .post(
      `/repos/${payloadNormal.repository.full_name}/statuses/${
        payloadNormal.pull_request.head.sha
      }`,
    )
    // TODO: add error payload to this post
    .reply(200, { success: true });

  // perform test
  const url = await listen(micro(service));
  const response = await request.post(`${url}/webhook`, {
    json: payloadNormal,
    simple: false, // don't throw when non 2xx
    resolveWithFullResponse: true,
  });
  t.is(prlintDotJson.isDone(), true);
  t.is(statuses.isDone(), true);
  t.is(500, response.statusCode);
  nock.cleanAll();
});
