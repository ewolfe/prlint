// https://probot.github.io/api/latest/classes/context.html

const log = require('./log');
const { lint, defaultConfig } = require('./core');

const APP_NAME = 'PRLint';

const createFinalReport = ({
  failureMessages,
  failureURLs,
  defaultFailureURL,
}) => {
  let bodyPayload = {};
  if (!failureMessages.length) {
    bodyPayload = {
      state: 'success',
      description: 'Your validation rules passed',
    };
  } else {
    let description = failureMessages[0];
    let URL = failureURLs[0];
    if (failureMessages.length > 1) {
      description = `1/${failureMessages.length - 1}: ${description}`;
      URL = defaultFailureURL;
    }
    if (description) {
      bodyPayload = {
        state: 'failure',
        description: description.slice(0, 140), // 140 characters is a GitHub limit
        target_url: URL,
      };
    } else {
      bodyPayload = {
        state: 'failure',
        description:
          'Something went wrong with PRLint - You can help by opening an issue (click details)',
        target_url: 'https://github.com/ewolfe/prlint/issues/new',
      };
    }
  }

  return bodyPayload;
};

module.exports = async (context) => {
  const { repos } = context.github;
  const { sha } = context.payload.pull_request.head;
  const repo = context.repo();
  const defaultFailureURL = `${
    context.payload.repository.html_url
  }/blob/${sha}/.github/prlint.json`;

  // Hold this PR info
  const statusInfo = { ...repo, sha, context: APP_NAME };

  try {
    // Pending
    await repos.createStatus({
      ...statusInfo,
      state: 'pending',
      description: 'Waiting for the status to be reported',
    });

    // get prlint.json. get the default one in case of 404
    const prlintDotJson = await context.config('prlint.json', defaultConfig);
    const { failureMessages, failureURLs } = lint({
      pull_request: context.payload.pull_request,
      prlintDotJson,
      defaultFailureURL,
    });

    // Final status
    await repos.createStatus({
      ...statusInfo,
      ...createFinalReport({ failureMessages, failureURLs, defaultFailureURL }),
    });
  } catch (e) {
    log({
      context,
      message: e.toString(),
      level: 'error',
    });
  }
};
