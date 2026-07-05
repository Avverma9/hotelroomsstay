const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const carRouter = require('../routes/travel/car');
const bookingRouter = require('../routes/travel/booking');

const startApp = (router) => {
  const app = express();
  app.use(express.json());
  app.use('/travel', router);
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
};

test('travel owner endpoints require auth token', async () => {
  const { server, port } = await startApp(carRouter);
  try {
    const noTokenResponse = await fetch(`http://127.0.0.1:${port}/travel/get-my-cars`);
    assert.equal(noTokenResponse.status, 401);
  } finally {
    server.close();
  }
});

test('travel booking owner endpoint requires auth token', async () => {
  const { server, port } = await startApp(bookingRouter);
  try {
    const noTokenResponse = await fetch(`http://127.0.0.1:${port}/travel/get-bookings-by/owner/123`);
    assert.equal(noTokenResponse.status, 401);
  } finally {
    server.close();
  }
});
