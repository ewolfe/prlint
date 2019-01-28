const test = require('ava');
const setupErrorReporting = require('../src/setupErrorReporting');

test('should not require Raven if disabled via env var', async (t) => {
  process.env.DISABLE_RAVEN_LOG = true;
  const Raven = setupErrorReporting();

  t.true(Raven.isStub);

  // ensure we mock captureException so that Raven calls do not fail.
  // eslint-disable-next-line no-console
  t.true(Raven.captureException === console.log);

  delete process.env.DISABLE_RAVEN_LOG;
});
