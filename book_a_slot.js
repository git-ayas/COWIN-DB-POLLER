var https = require("follow-redirects").https;
const { exec } = require("child_process");

// Modified below fields to customize
const accessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJhZTVkZjdkYS01YTc1LTRkNzEtYjMxMS05YzFjNDAwNjMzOGQiLCJ1c2VyX2lkIjoiYWU1ZGY3ZGEtNWE3NS00ZDcxLWIzMTEtOWMxYzQwMDYzMzhkIiwidXNlcl90eXBlIjoiQkVORUZJQ0lBUlkiLCJtb2JpbGVfbnVtYmVyIjo5MDMzMDk2MTg5LCJiZW5lZmljaWFyeV9yZWZlcmVuY2VfaWQiOjI1NjU5MjM5NzIyODgwLCJzZWNyZXRfa2V5IjoiYjVjYWIxNjctNzk3Ny00ZGYxLTgwMjctYTYzYWExNDRmMDRlIiwidWEiOiJNb3ppbGxhLzUuMCAoWDExOyBMaW51eCB4ODZfNjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS85MC4wLjQ0MzAuMjEyIFNhZmFyaS81MzcuMzYiLCJkYXRlX21vZGlmaWVkIjoiMjAyMS0wNS0xM1QxMjo1NDo1MS43MjlaIiwiaWF0IjoxNjIwOTEwNDkxLCJleHAiOjE2MjA5MTEzOTF9.bEgCBRyzsGNvdfwkrMR4m7RMin98KvtU1utslzYvZQo";
const pinList = ["395006"];
const districtIdList = undefined;
const feeFilter = ["Free"];
const minAgeLimit = 18;
const onlyCenters = [
  650098, 612188, 695568, 650126, 602602, 606715, 694062, 695507, 696241,
];
const minTimeoutValue = 5000; // 5 seconds
const maxTimeoutValue = 8000; // 5 seconds
const playSound = false;
// Modified above fields to customize

const commonOptions = {
  method: "GET",
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
    authorization: `Bearer ${accessToken}`,
  },
  maxRedirects: 20,
};

const sing = () => {
  exec("vlc success.mp3", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

const benefReq = https.request(
  {
    ...commonOptions,
    path: "/api/v2/appointment/beneficiaries",
  },
  function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      if (res.statusCode !== 200) {
        console.error(`${res.statusCode}: Request Failed. Update accessToken.`);
        return;
      }
      var body = Buffer.concat(chunks);
      let beneficiariesList = [];
      try {
        beneficiariesList = JSON.parse(body.toString()).beneficiaries;
      } catch (error) {
        console.log(body.toString());
        console.error(`${res.statusCode}: Request Failed. Update accessToken.`);
        return;
      }

      beneficiariesList.map((each) => console.log(`Beneficiary: ${each.name}`));
      const beneficiaries = beneficiariesList.map(
        (each) => each.beneficiary_reference_id
      );
      let success = false;
      const main = async ({ districtId, pin }) => {
        return new Promise((resolve) => {
          const currentDate = new Date();

          const formattedDate = `${(currentDate.getDate() + 1)
            .toString()
            .padStart(2, "0")}-${(currentDate.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${currentDate.getFullYear()}`;
          console.log(currentDate);
          console.log(formattedDate);
          const path = pin
            ? `/api/v2/appointment/sessions/calendarByPin?pincode=${pin}&date=${formattedDate}`
            : `/api/v2/appointment/sessions/calendarByDistrict?district_id=${districtId}&date=${formattedDate}`;
          var req = https.request(
            {
              ...commonOptions,
              path,
            },
            function (res) {
              var chunks = [];

              res.on("data", function (chunk) {
                chunks.push(chunk);
              });

              res.on("end", async function () {
                if (res.statusCode !== 200) {
                  exit();
                  resolve();
                  return;
                }
                var body = Buffer.concat(chunks);
                let centerList = [];
                try {
                  centerList = JSON.parse(body.toString()).centers;
                } catch (error) {
                  console.log(body.toString());
                  exit();
                  resolve();
                  return;
                }
                console.log(`Fee Filters: ${feeFilter.join(", ")}`);
                console.log(`Minimum age limit: ${minAgeLimit}`);
                if (!centerList.length) {
                  console.log(`No centers found for ${formattedDate}`);
                }
                for (const center of centerList) {
                  if (
                    feeFilter.length &&
                    !feeFilter.includes(center.fee_type)
                  ) {
                    console.log(
                      `[Skipped] ${center.name} is ${center.fee_type}.`
                    );
                    continue;
                  }
                  if (
                    onlyCenters.length &&
                    !onlyCenters.includes(center.center_id)
                  ) {
                    console.log(
                      `[Ignored] ${center.name} is ${center.fee_type}.`
                    );
                    continue;
                  }
                  for (const session of center.sessions) {
                    if (session.min_age_limit !== minAgeLimit) {
                      console.log(
                        `[AgeLimitMismatch] ${center.name} with ${session.min_age_limit} years limit`
                      );
                      continue;
                    }
                    console.log(
                      `[Checking] ${center.name} with ${session.min_age_limit} years limit`
                    );
                    if (session.available_capacity > 0) {
                      if (playSound) {
                        sing();
                      }
                      console.log(`===================================`);
                      console.log(
                        `Found a session with ${session.available_capacity} availability at ${center.name} for age ${session.min_age_limit}`
                      );
                      console.log(`===================================`);
                      for (const slot of session.slots) {
                        success = await new Promise((resolve, reject) => {
                          const scheduleReq = https.request(
                            {
                              ...commonOptions,
                              method: "POST",
                              path: "/api/v2/appointment/schedule",
                            },
                            function (res) {
                              var chunks = [];

                              res.on("data", function (chunk) {
                                chunks.push(chunk);
                              });

                              res.on("end", function () {
                                if (res.statusCode === 200) {
                                  var body = Buffer.concat(chunks);
                                  try {
                                    console.log(JSON.parse(body.toString()));
                                  } catch (error) {
                                    console.log(body.toString());
                                    resolve(false);
                                  }
                                  console.log(
                                    `${slot} is booked successfully.`
                                  );
                                  resolve(true);
                                } else if (res.statusCode == 401) {
                                  console.log("Access token expired.");
                                  reject();
                                } else {
                                  console.error(
                                    `Appointment booking failed for slot ${slot}`
                                  );
                                  resolve(false);
                                }
                              });

                              res.on("error", function (error) {
                                console.error(error);
                                resolve(false);
                              });
                            }
                          );
                          const requestBody = JSON.stringify({
                            dose: 1,
                            session_id: session.session_id,
                            slot,
                            beneficiaries,
                          });
                          scheduleReq.write(requestBody);
                          scheduleReq.end();
                        });
                      }
                    } else {
                      console.log(`No availability at ${center.name}`);
                    }
                    if (success) break;
                  }
                  if (success) break;
                }
                resolve();
              });

              res.on("error", function (error) {
                console.error(error);
                resolve();
              });
            }
          );

          req.end();
        });
      };
      const mainLoop = async () => {
        try {
          if (districtIdList && districtIdList.length) {
            for (const districtId of districtIdList) {
              await main({ districtId });
            }
          } else if (pinList && pinList.length) {
            for (const pin of pinList) {
              await main({ pin });
            }
          } else throw new Error("No values for district id or pin");
          if (!success) {
            const timeout = Math.trunc(
              Math.random() * (maxTimeoutValue - minTimeoutValue) +
                minTimeoutValue
            );
            console.log(`Waiting for ${timeout} ms`);
            setTimeout(mainLoop, timeout);
          }
        } catch {
          console.log("Main loop break. Check access token validity.");
        }
      };
      mainLoop();
      const exit = () => {
        console.error("Authorization Expired. Update accessToken.");
      };
    });

    res.on("error", function (error) {
      console.error(error);
    });
  }
);

benefReq.end();
