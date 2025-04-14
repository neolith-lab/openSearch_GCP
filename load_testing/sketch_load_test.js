import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,           // 1 virtual user (adjust as needed)
  duration: "20s",    // 1 iteration per VU
};

export default function () {
  // Replicate the formData payload from login.action.js.
  // Replace these with valid test credentials.
  const payload = {
    email: "newuser@gmail.com",
    password: "new",
  };

  // URL‑encode the payload.
  const encodedPayload = Object.entries(payload)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");

  const params = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  };

  // This POST request exactly replicates the axios call in login.action.js.
  let res = http.post("https://api.thecolourbook.com/login", encodedPayload, params);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  console.log("Response: " + res.body + res.status);
  sleep(1);
}