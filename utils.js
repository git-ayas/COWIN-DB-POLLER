const readline = require("readline");
const https = require("follow-redirects").https;
const fs = require("fs");

exports.takeInput = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
};

exports.readFile = (filePath) => {
  return fs.readFileSync(filePath, "utf8");
};

exports.writeFile = (filePath, data) => {
  fs.writeFileSync(filePath, data);
};

exports.request = ({ method, path, accessToken, body }) => {
  const options = {
    method,
    path,
    hostname: "cdn-api.co-vin.in",
    headers: {
      authority: "cdn-api.co-vin.in",
      "sec-ch-ua": '" Not A;Brand";v="99", "Chromium";v="90"',
      accept: "application/json, text/plain, */*",
      dnt: "1",
      "sec-ch-ua-mobile": "?0",
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
      origin: "https://selfregistration.cowin.gov.in",
      "sec-fetch-site": "cross-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
      referrer: "https://selfregistration.cowin.gov.in/",
      referrerPolicy: "strict-origin-when-cross-origin",
      "accept-language":
        "en-IN,en;q=0.9,hi-IN;q=0.8,hi;q=0.7,gu-IN;q=0.6,gu;q=0.5,en-GB;q=0.4,en-US;q=0.3",
    },
  };
  if (accessToken) options.headers.authorization = `Bearer ${accessToken}`;
  return new Promise((resolve, reject) => {
    const req = https.request(options, function (res) {
      const chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        if (res.statusCode !== 200) {
          reject(`${res.statusCode}: Request Failed.`);
          return;
        }
        const body = Buffer.concat(chunks);
        try {
          resolve(JSON.parse(body.toString()));
        } catch (error) {
          reject(`${res.statusCode}: Request Failed. ${body.toString()}`);
        }
      });

      res.on("error", function (error) {
        reject(`Request Failed: ${error}`);
      });
    });
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};
