const git = require('git-rev-sync');
const { json, send } = require('micro');
const setupErrorReporting = require('./setupErrorReporting');

const newJsonWebToken = require('./utils/newJsonWebToken.js');
const lintPullRequest = require('./linter.js');

const Raven = setupErrorReporting();

const accessTokens = {};

// Get a JWT on server start
let JWT = newJsonWebToken();

// Refresh the JSON Web Token every X milliseconds
// This saves us from persisting and managing tokens
// elsewhere (like redis or postgresql)
setInterval(() => {
  JWT = newJsonWebToken();
}, 300000 /* 5 minutes */);

// This is the main entry point, our dependency 'micro' expects a function
// that accepts standard http.IncomingMessage and http.ServerResponse objects
// https://github.com/zeit/micro#usage
module.exports = async (req, res) => {
  if (req.url === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end();
  }

  // Used by https://stats.uptimerobot.com/ZzYnEf2BW
  if (req.url === '/status' && req.method === 'GET') {
    res.end('OK');
  }

  // Used by developers as a sanity check
  if (req.url === '/version' && req.method === 'GET') {
    res.end(git.short());
  }

  // Used by GitHub
  if (req.url === '/webhook' && req.method === 'POST') {
    const payload = await json(req);

    const accessToken = accessTokens[`${payload.installation.id}`];

    const { status, exception, freshToken, body, extra } = lintPullRequest({ payload, accessToken, JWT });

    console.log({ status, exception, freshToken, body, extra });

    if (freshToken && accessToken.token !== freshToken.token) accessTokens[`${payload.installation.id}`] = freshToken;

    if (status !== 200) {
      Raven.captureException(exception || body, extra);
      send(res, status, (exception && exception.toString()) || body);
    } else {
      send(res, status, body);
    }
  } else {
    // Redirect since we don't need anyone visiting our service
    // if they happen to stumble upon our URL
    res.writeHead(301, { Location: 'https://github.com/ewolfe/prlint' });
    res.end();
  }
};
