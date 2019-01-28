module.exports = function setupErrorReporting() {
  const disableRavenLogging = process.env.DISABLE_RAVEN_LOG;

  let Raven = {
    isStub: true,
    captureException:
      // eslint-disable-next-line no-console
      console.log /* stub it out with console.log so that errors are not swallowed */,
  };

  if (!disableRavenLogging) {
    // eslint-disable-next-line global-require
    Raven = require('raven');
    // Setup error logging
    Raven.config(
      'https://e84d90e8ec13450d924ddd1a19581c62:aa9224cf89544c0591bf839112161adf@sentry.io/251839',
      {
        autoBreadcrumbs: {
          http: true,
        },
      },
    ).install();
  }

  return Raven;
};
