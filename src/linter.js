const flatten = require('flat');

module.exports = function ({ prlintDotJson = {}, pullRequest = {} }) {
  const pullRequestFlattened = flatten(pullRequest);
  const failureMessages = [];
  const failureURLs = [];

  Object.keys(prlintDotJson).forEach((element) => {
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
