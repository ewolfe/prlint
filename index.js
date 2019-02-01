const lint = require('./src/linter.js');
const { fetchPRLintJson, postComment } = require('./src/github.js');

module.exports = {
  lint,
  fetchPRLintJson,
  postComment,
};
