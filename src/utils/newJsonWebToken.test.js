const test = require('ava');
const newJsonWebToken = require('./newJsonWebToken');

test('newJsonWebToken should return a new JWT', async t => {
  const jwt = newJsonWebToken();
  t.is(typeof jwt, 'string');
  t.is(jwt.length, 442);
});
