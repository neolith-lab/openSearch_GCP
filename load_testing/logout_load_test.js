import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 20,           // 1 virtual user (adjust as needed)
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

  const jar = http.cookieJar();
  if (res.cookies.session && res.cookies.session.length > 0) {
    jar.set("https://api.thecolourbook.com", "session", res.cookies.session[0].value);
  }

  const meRes = http.get("https://api.thecolourbook.com/me");
  check(meRes, {
    "me status is 200": (r) => r.status === 200,
  });
  console.log("Response from /me: " + meRes.body);

  const logoutRes = http.post("https://api.thecolourbook.com/logout", null, { 
    headers: { "Accept": "application/json" },
  });
  check(logoutRes, {
    "logout status is 200": (r) => r.status === 200,
  });
  console.log("Logout Response: " + logoutRes.body);

  sleep(1);
}