import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1,
  duration: "20s",
};

export default function () {
  let params = {
    headers: {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Referer": "https://www.google.com/",
      "Origin": "https://www.thecolourbook.com",
      "sec-ch-ua": `"Chromium";v="119", "Not)A;Brand";v="8", "Google Chrome";v="119"`,
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": `"macOS"`,
    },
    insecureSkipTLSVerify: true,
  };

  let res = http.get("https://www.thecolourbook.com", params);

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  console.log("Response Status: " + res.status);
  sleep(1);
}