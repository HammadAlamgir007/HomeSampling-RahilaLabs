import http from 'k6/http';
import { check, sleep } from 'k6';

// Run with: k6 run load_test.js
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 200 },  // Ramp up to 200 users
    { duration: '2m', target: 200 },  // Stay at 200 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

export default function () {
  // 1. Fetch the test catalog (should hit the Redis cache instantly)
  let catalogRes = http.get(`${BASE_URL}/api/patient/tests`);
  check(catalogRes, {
    'catalog fetched successfully': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Health check endpoint (verifies underlying DB connections)
  let healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'system is healthy': (r) => r.status === 200,
  });

  sleep(Math.random() * 2); // Random sleep between 0 and 2s to simulate real users
}
