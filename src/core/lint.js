const flatten = require('flat');

// eslint-disable-next-line camelcase
module.exports = ({ pull_request, prlintDotJson, defaultFailureURL }) => {
  const failureMessages = [];
  const failureURLs = [];
  const pullRequestFlattened = flatten(pull_request);
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
