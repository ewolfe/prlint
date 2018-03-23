const jsonwebtoken = require('jsonwebtoken');

module.exports = function newJsonWebToken() {
  // https://developer.github.com/apps/building-integrations/setting-up-and-registering-github-apps/about-authentication-options-for-github-apps/#authenticating-as-a-github-app
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (10 * 60), // prettier-ignore
    iss: 7012, // https://github.com/settings/apps/prlint
  };

  const privateKeyBuffer = Buffer.from(process.env.PRIVATE_KEY_B64, 'base64');
  const privateKey = privateKeyBuffer.toString('ascii');
  return jsonwebtoken.sign(payload, privateKey, { algorithm: 'RS256' });
};
