const nock = require('nock');
const { Probot } = require('probot');
const request = require('supertest');

const payloadFailure = require('./payload-failure.json');
const payloadNormal = require('./payload-normal.json');
const prlintSampleConfig = require('./prlint-config-sample.json');
const service = require('..');

describe('PRLint', () => {
  let probot;

  beforeEach(() => {
    nock.disableNetConnect();
    // Allow localhost connections so we can test local routes and mock servers.
    nock.enableNetConnect('127.0.0.1');

    probot = new Probot({});
    const app = probot.load(service);

    // just return a test token
    app.app = () => 'test';
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('routes', () => {
    test('ANY /<unhandled> should redirect to github.com/ewolfe/prlint', async () => {
      nock('https://github.com')
        .get('/ewolfe/prlint')
        .reply(200, 'OK');

      await request(probot.server)
        .get('/na')
        .expect(301)
        .expect('Location', 'https://github.com/ewolfe/prlint');
    });

    test('GET /favicon.ico should return image/x-icon header', async () => {
      await request(probot.server)
        .get('/favicon.ico')
        .expect('Content-Type', 'image/x-icon')
        .expect(200);
    });

    test('GET /status should return OK', async () => {
      await request(probot.server)
        .get('/status')
        .expect(200, 'OK');
    });
  });

  describe('webhook', () => {
    const pendingStatusBody = {
      context: 'PRLint',
      state: 'pending',
      description: 'Waiting for the status to be reported',
    };

    beforeEach(() => {
      nock('https://api.github.com')
        .post(
          `/app/installations/${payloadNormal.installation.id}/access_tokens`,
        )
        .reply(200, { token: 'test' });

      nock('https://api.github.com')
        .get(
          `/repos/${
            payloadNormal.repository.full_name
          }/contents/.github/prlint.json`,
        )
        .reply(200, {
          content: Buffer.from(
            JSON.stringify(prlintSampleConfig),
            'utf8',
          ).toString('base64'),
        });
    });

    test('status update to pending', async () => {
      const statusUrl = `/repos/${
        payloadNormal.repository.full_name
      }/statuses/${payloadNormal.pull_request.head.sha}`;

      const successStatusBody = {
        context: 'PRLint',
        description: 'Your validation rules passed',
        state: 'success',
      };

      let actualPendingStatus;
      let actualSuccessStatus;

      const scope = nock('https://api.github.com')
        .post(statusUrl, (body) => {
          actualPendingStatus = body;
          return body;
        })
        .reply(200)
        .post(statusUrl, (body) => {
          actualSuccessStatus = body;
          return body;
        })
        .reply(200);

      await probot.receive({
        name: 'pull_request',
        payload: payloadNormal,
      });

      expect(scope.isDone()).toBe(true);
      expect(actualPendingStatus).toMatchObject(pendingStatusBody);
      expect(actualSuccessStatus).toMatchObject(successStatusBody);
    });

    test('POST /webhook should add a failure status to the PR if it doesn’t pass the users rules', async () => {
      const statusUrl = `/repos/${
        payloadFailure.repository.full_name
      }/statuses/${payloadFailure.pull_request.head.sha}`;

      const failureStatusBody = {
        context: 'PRLint',
        description: '1/1: Your PR title doesn’t match our schema',
        state: 'failure',
      };

      let actualPendingStatus;
      let actualFailureStatus;

      const scope = nock('https://api.github.com')
        .post(statusUrl, (body) => {
          actualPendingStatus = body;
          return true;
        })
        .reply(200)
        .post(statusUrl, (body) => {
          actualFailureStatus = body;
          return true;
        })
        .reply(200);

      await probot.receive({
        name: 'pull_request',
        payload: payloadFailure,
      });

      expect(scope.isDone()).toBe(true);
      expect(actualPendingStatus).toMatchObject(pendingStatusBody);
      expect(actualFailureStatus).toMatchObject(failureStatusBody);
    });
  });
});
