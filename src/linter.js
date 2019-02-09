const flatten = require('flat');
const GithubRepo = require('./github.js');
const newJsonWebToken = require('./utils/newJsonWebToken.js');

const validate = ({ prlintDotJson = {}, pullRrequest = {}, defaultFailureURL }) => {
  const pullRequestFlattened = flatten(pullRrequest);
  const failureMessages = [];
  const failureURLs = [];

  Object.keys(prlintDotJson).forEach(element => {
    if (prlintDotJson[element]) {
      prlintDotJson[element].forEach((item, index) => {
        const { pattern } = item;
        try {
          const regex = new RegExp(pattern, item.flags || '');
          const pass = regex.test(pullRequestFlattened[element]);
          if (!pass || !pullRequestFlattened[element]) {
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
    }
  });

  return { failureMessages, failureURLs };
};

const shouldLint = body => {
  if (!body) {
    // Doubtful GitHub will ever end up at this block
    // but it was useful while I was developing
    return { proceed: false, status: 400, body: 'invalid request payload' };
  }

  if (!body.pull_request) {
    // We just return the data that was sent to the webhook
    // since there's not really anything for us to do in this situation
    return { proceed: false, status: 200, body };
  }

  if (body.action && body.action === 'closed') {
    // No point in linting anything if the pull request is closed
    return { proceed: false, status: 200, body };
  }

  if (!body.installation || !body.installation.id) {
    // Doubtful GitHub will ever end up at this block
    // but it was useful while I was developing
    return { proceed: false, status: 400, body: 'missing installation id, see if the app was registered correctly' };
  }

  return { proceed: true };
};

const orchestrate = async ({ payload, accessToken, JWT }) => {
  // eslint-disable-next-line prefer-const
  let { proceed, status, body } = shouldLint(payload);
  console.log({ proceed, status, body });

  if (!proceed) {
    // let the caller return http response however they want
    return { status, body };
  }

  status = 200;

  const githubRepo = new GithubRepo(payload);
  let freshToken = accessToken;

  if (
    !accessToken ||
    !new Date(accessToken.expires_at) > new Date() // make sure token expires in the future
  ) {
    try {
      // token has expired or not valid. in this case, get a new one
      // use passed in JWT or generate our own
      const accessTokenObj = await githubRepo.getAccessToken({ jsonWebToken: JWT || newJsonWebToken() });
      freshToken = accessTokenObj;
    } catch (exception) {
      return { status: 500, exception, body: 'unable to authenticate with github' };
      // Raven.captureException(exception);
      // send(res, 500, {
      //   token: newToken,
      //   exception,
      // });
    }
  }

  let bodyPayload;
  let prlintDotJson;

  try {
    // Initialize variables
    const failureMessages = [];
    const failureURLs = [];

    const fetchPRLintResponse = await githubRepo.fetchPRLintJson({
      accessToken: freshToken.token,
    });

    ({ prlintDotJson } = fetchPRLintResponse.prlintDotJson);
    failureMessages.push(fetchPRLintResponse.failureMsgs);

    // Run each of the validations (regex's)
    if (prlintDotJson) {
      const { failureMessages: linterFailureMsgs, failureURLs: linterFailureURLs } = validate({
        prlintDotJson,
        pullRequest: payload.pull_request,
      });
      failureMessages.push(...linterFailureMsgs);
      failureURLs.push(...linterFailureURLs);
    }

    bodyPayload = githubRepo.createBodyPayload({
      failureMessages,
      failureURLs,
    });
  } catch (exception) {
    // If anyone of the "happy path" logic above failed
    // then we post an update to the pull request that our
    // application (PRLint) had issues, or that they're missing
    // a configuration file (./.github/prlint.json)
    // status = 200;
    if (exception.response && exception.response.statusCode === 404) {
      status = 404;
      await githubRepo.post404Status({ accessToken });
    } else {
      status = 500;
      // Raven.captureException(exception);
      await githubRepo.post500Status({ accessToken, exception, extra: { prlintDotJson } });
    }

    return { status, exception, freshToken };
  }

  try {
    await githubRepo.postValidationStatus({
      bodyPayload,
      accessToken: freshToken.token,
    });

    return { status: 200, body: bodyPayload, freshToken };
  } catch (exception) {
    // If anyone of the "happy path" logic above failed
    // then we post an update to the pull request that our
    // application (PRLint) had issues,
    await githubRepo.post500Status({ accessToken: freshToken.token, exception });
    return {
      status: 500,
      exception,
      extra: {
        request_body: bodyPayload,
        response: exception.response.body,
        prlintDotJson,
      },
      freshToken,
    };
  }
};

module.exports = orchestrate;
