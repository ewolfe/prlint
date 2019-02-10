const lintPullRequest = require('./linter.js');
const configureRoutes = require('./routes.js');

module.exports = (app) => {
  const router = app.route('/');
  configureRoutes(router);

  // https://developer.github.com/webhooks/#events
  // github exposes several pull_request events (https://developer.github.com/v3/activity/events/types/#pullrequestevent)
  // but we're not interested in anything that potentially doesn't affect the title.
  app.on(
    ['pull_request.opened', 'pull_request.edited', 'pull_request.reopened'],
    lintPullRequest,
  );
};
