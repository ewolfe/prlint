// https://probot.github.io/api/latest/classes/context.html

const log = require('./log');
const { lint, defaultConfig } = require('./core');

const APP_NAME = 'PRLint';

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

    const report = { valid: true, failures: [] };

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
      state: report.valid ? 'success' : 'failure',
      description: `found ${failureMessages} problems, ${failureURLs} warnings`,
    });
  } catch (e) {
    log({
      context,
      message: e.toString(),
      level: 'error',
    });
  }
};
