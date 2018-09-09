const flatten = require('flat');
const git = require('git-rev-sync');
const got = require('got');
const Raven = require('raven');
const { json, send } = require('micro');

const newJsonWebToken = require('./utils/newJsonWebToken.js');

const accessTokens = {};

Raven.config(
  'https://e84d90e8ec13450d924ddd1a19581c62:aa9224cf89544c0591bf839112161adf@sentry.io/251839',
  {
    autoBreadcrumbs: {
      http: true,
    },
  },
).install();

async function updateShaStatus(body, res) {
  const pullRequestFlat = flatten(body.pull_request);
  const accessToken = accessTokens[`${body.installation.id}`].token;

  try {
    const configUrl = `https://api.github.com/repos/${
      body.repository.full_name
    }/contents/.github/prlint.json?ref=${body.pull_request.head.ref}`;
    const config = await got(configUrl, {
      headers: {
        Accept: 'application/vnd.github.machine-man-preview+json',
        Authorization: `token ${accessToken}`,
      },
    });

    const userConfigBase64 = JSON.parse(config.body).content;

    const failureMessages = [];
    const failureURLs = [];
    const defaultFailureURL = `https://github.com/${
      body.repository.full_name
    }/blob/${body.pull_request.head.sha}/.github/prlint.json`;

    let userConfig;

    try {
      userConfig = JSON.parse(Buffer.from(userConfigBase64, 'base64'));
    } catch (e) {
      failureMessages.push(e);
    }

    if (userConfig) {
      Object.keys(userConfig).forEach((element) => {
        userConfig[element].forEach((item, index) => {
          const { pattern } = item;
          try {
            const regex = new RegExp(pattern, item.flags || '');
            const pass = regex.test(pullRequestFlat[element]);
            if (!pass || !pullRequestFlat[element]) {
              let message = `Rule \`${element}[${index}]\` failed`;
              message = item.message || message;
              failureMessages.push(message);
              const URL = item.detailsURL || defaultFailureURL;
              failureURLs.push(URL);
            }
          } catch (e) {
            failureMessages.push(e);
            failureURLs.push(defaultFailureURL);
          }
        });
      });
    }

    let bodyPayload = {};
    if (!failureMessages.length) {
      bodyPayload = {
        state: 'success',
        description: 'Your validation rules passed',
        context: 'PRLint',
      };
    } else {
      let description = failureMessages[0];
      let URL = failureURLs[0];
      if (failureMessages.length > 1) {
        description = `1/${failureMessages.length - 1}: ${description}`;
        URL = defaultFailureURL;
      }
      bodyPayload = {
        state: 'failure',
        description: description.slice(0, 140), // 140 characters is a GitHub limit
        target_url: URL,
        context: 'PRLint',
      };
    }

    try {
      const statusUrl = `https://api.github.com/repos/${
        body.repository.full_name
      }/statuses/${body.pull_request.head.sha}`;
      await got.post(statusUrl, {
        headers: {
          Accept: 'application/vnd.github.machine-man-preview+json',
          Authorization: `token ${accessToken}`,
        },
        body: bodyPayload,
        json: true,
      });
      send(res, 200, bodyPayload);
    } catch (exception) {
      Raven.captureException(exception, { extra: userConfig });
      send(res, 500, {
        exception,
        request_body: bodyPayload,
        response: exception.response.body,
      });
    }
  } catch (exception) {
    let description = exception.toString();
    let statusCode = 200;
    if (exception.response && exception.response.statusCode === 404) {
      description = '`.github/prlint.json` not found';
    } else {
      statusCode = 500;
      Raven.captureException(exception);
    }
    const statusUrl = `https://api.github.com/repos/${
      body.repository.full_name
    }/statuses/${body.pull_request.head.sha}`;
    await got.post(statusUrl, {
      headers: {
        Accept: 'application/vnd.github.machine-man-preview+json',
        Authorization: `token ${accessToken}`,
      },
      body: {
        state: 'error',
        description,
        context: 'PRLint',
        target_url: 'https://github.com/ewolfe/prlint/issues/new',
      },
      json: true,
    });
    send(res, statusCode, description);
  }
}

let JWT = newJsonWebToken();

// Refresh the JSON Web Token every X milliseconds
setInterval(() => {
  JWT = newJsonWebToken();
}, 300000 /* 5 minutes */);

// This is the main entry point, our dep 'micro' expects a function that
// accepts standard http.IncomingMessage and http.ServerResponse objects
// https://github.com/zeit/micro#usage
module.exports = async (req, res) => {
  if (req.url === '/favicon.ico') {
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end();
  }

  if (req.url === '/status' && req.method === 'GET') {
    res.end('OK');
  }

  if (req.url === '/version' && req.method === 'GET') {
    res.end(git.short());
  }

  if (req.url === '/webhook' && req.method === 'POST') {
    const body = await json(req);
    if (body && !body.pull_request) {
      send(res, 200, body);
    } else if (body && body.action && body.action === 'closed') {
      send(res, 200, body);
    } else if (
      body &&
      body.pull_request &&
      body.installation &&
      body.installation.id &&
      accessTokens[`${body.installation.id}`] &&
      new Date(accessTokens[`${body.installation.id}`].expires_at) > new Date() // make sure token expires in the future
    ) {
      await updateShaStatus(body, res);
    } else if (
      body &&
      body.pull_request &&
      body.installation &&
      body.installation.id
    ) {
      try {
        const response = await got.post(
          `https://api.github.com/installations/${
            body.installation.id
          }/access_tokens`,
          {
            headers: {
              Accept: 'application/vnd.github.machine-man-preview+json',
              Authorization: `Bearer ${JWT}`,
            },
          },
        );
        accessTokens[`${body.installation.id}`] = JSON.parse(response.body);
        await updateShaStatus(body, res);
      } catch (exception) {
        Raven.captureException(exception);
        send(res, 500, {
          token: accessTokens[`${body.installation.id}`],
          exception,
        });
      }
    } else {
      send(res, 400, 'invalid request payload');
    }
  } else {
    res.writeHead(301, { Location: 'https://github.com/ewolfe/prlint' });
    res.end();
  }
};
