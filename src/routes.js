const git = require('git-rev-sync');

module.exports = (router) => {
  router.get('/favicon.ico', (req, res) => {
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end();
  });

  // Used by https://stats.uptimerobot.com/ZzYnEf2BW
  router.get('/status', (req, res) => {
    res.end('OK');
  });

  // Used by developers as a sanity check
  router.get('/version', (req, res) => {
    res.end(git.short());
  });

  router.get('*', (req, res) => {
    // Redirect since we don't need anyone visiting our service
    // if they happen to stumble upon our URL
    res.writeHead(301, { Location: 'https://github.com/ewolfe/prlint' });
    res.end();
  });
};
