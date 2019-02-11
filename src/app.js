const lintPullRequest = require('./handler.js');
const configureRoutes = require('./routes.js');

module.exports = (app) => {
  const router = app.route('/');
  configureRoutes(router);

  // https://developer.github.com/v3/activity/events/types/#pullrequestevent
  // subscribe to every event but "closed"
  app.on(
    [
      'pull_request.opened',
      'pull_request.edited',
      'pull_request.reopened',
      'pull_request.assigned',
      'pull_request.unassigned',
      'pull_request.labeled',
      'pull_request.unlabeled',
      'pull_request.synchronized',
    ],
    lintPullRequest,
  );
};
