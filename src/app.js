const git = require('git-rev-sync');
const { json, send } = require('micro');
const setupErrorReporting = require('./setupErrorReporting');

const newJsonWebToken = require('./utils/newJsonWebToken.js');
const linter = require('./linter.js');
const GithubRepo = require('./github.js');

const Raven = setupErrorReporting();

const accessTokens = {};

async function updateShaStatus({ githubRepo, prlintDotJson, failureMessages, failureURLs, accessToken }) {
  const bodyPayload = githubRepo.createBodyPayload({
    failureMessages,
    failureURLs,
  });
  try {
    // Build up a status for sending to the pull request
    // POST the status to the pull request
    await githubRepo.postValidationStatus({
      bodyPayload,
      accessToken,
    });

    return { status: 200, payload: bodyPayload };
  } catch (exception) {
    Raven.captureException(exception, { extra: prlintDotJson });

    return {
      status: 500,
      payload: {
        exception,
        request_body: bodyPayload,
        response: exception.response.body,
      },
    };
  }
}

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
    const body = await json(req);

    if (!body) {
      // Doubtful GitHub will ever end up at this block
      // but it was useful while I was developing
      send(res, 400, 'invalid request payload');
      return;
    }

    if (!body.pull_request) {
      // We just return the data that was sent to the webhook
      // since there's not really anything for us to do in this situation
      send(res, 200, body);
      return;
    }

    if (body.action && body.action === 'closed') {
      // No point in linting anything if the pull request is closed
      send(res, 200, body);
      return;
    }

    if (!body.installation || !body.installation.id) {
      // Doubtful GitHub will ever end up at this block
      // but it was useful while I was developing
      send(res, 400, 'missing installation id, see if the app was registered correctly');
      return;
    }

    const githubRepo = new GithubRepo(body);
    let accessToken = accessTokens[`${body.installation.id}`];

    try {
      if (
        !accessToken ||
        !new Date(accessToken.expires_at) > new Date() // make sure token expires in the future
      ) {
        try {
          // token has expired or not valid. in this case, get a new one
          accessToken = await githubRepo.getAccessToken({ JWT });
          accessTokens[`${body.installation.id}`] = accessToken;
          accessToken = accessTokens[`${body.installation.id}`].token;
        } catch (exception) {
          Raven.captureException(exception);
          send(res, 500, {
            token: accessTokens[`${body.installation.id}`],
            exception,
          });
        }
      }
      // Initialize variables
      const failureMessages = [];
      const failureURLs = [];

      const { prlintDotJson, failureMessages: prlintFetchFailureMsgs } = await githubRepo.fetchPRLintJson({
        accessToken,
      });

      failureMessages.push(...prlintFetchFailureMsgs);

      // Run each of the validations (regex's)
      if (prlintDotJson) {
        const { failureMessages: linterFailureMsgs, failureURLs: linterFailureURLs } = linter({
          prlintDotJson,
          pullRequest: body.pull_request,
        });
        failureMessages.push(...linterFailureMsgs);
        failureURLs.push(...linterFailureURLs);
      }

      const { status, payload } = await updateShaStatus({
        githubRepo,
        prlintDotJson,
        failureMessages,
        failureURLs,
        accessToken,
      });
      send(res, status, payload);
    } catch (exception) {
      // If anyone of the "happy path" logic above failed
      // then we post an update to the pull request that our
      // application (PRLint) had issues, or that they're missing
      // a configuration file (./.github/prlint.json)
      let status = 200;
      if (exception.response && exception.response.statusCode === 404) {
        await githubRepo.post404Status({ accessToken });
      } else {
        status = 500;
        Raven.captureException(exception);
        await githubRepo.post500Status({ accessToken, exception });
      }

      send(res, status, exception.toString());
    }
  } else {
    // Redirect since we don't need anyone visiting our service
    // if they happen to stumble upon our URL
    res.writeHead(301, { Location: 'https://github.com/ewolfe/prlint' });
    res.end();
  }
};
