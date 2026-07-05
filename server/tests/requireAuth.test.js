const test = require('node:test');
const assert = require('node:assert/strict');
const requireAuth = require('../authentication/requireAuth');

const makeRes = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

const makeReq = (path) => ({
  method: 'GET',
  path,
  headers: {},
});

test('requireAuth skips public tour-related routes without token', (t) => {
  const publicPaths = [
    '/get-all-tours',
    '/filter-tour/by-query',
    '/tour-booking/get-users-booking',
  ];

  for (const path of publicPaths) {
    const req = makeReq(path);
    const res = makeRes();
    let nextCalled = false;

    requireAuth(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true, `${path} should bypass auth`);
    assert.equal(res.statusCode, null, `${path} should not set status`);
  }
});
