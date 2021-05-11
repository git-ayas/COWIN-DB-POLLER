const utils = require("./utils");
const playSound = require("./play-sound");
const beneficiaries = require("./beneficiaries");
const centers = require("./centers");

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
playSound.enableSound = false;
// Modified above fields to customize

console.log(`Fee Filters: ${feeFilter.join(", ")}`);
console.log(`Minimum age limit: ${minAgeLimit}`);

let success = false;
(async () => {
  const beneficiariesList = await beneficiaries.getBeneficiaries(accessToken);

  beneficiariesList.map((each) => console.log(`Beneficiary: ${each.name}`));
  const beneficiariesIdList = beneficiariesList.map(
    (each) => each.beneficiary_reference_id
  );

  const currentDate = new Date();
  const formattedDate = `${(currentDate.getDate() + 1)
    .toString()
    .padStart(2, "0")}-${(currentDate.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${currentDate.getFullYear()}`;

  console.log(formattedDate);

  const main = async (param) => {
    const centerList = await centers.getCenters(
      param,
      formattedDate,
      accessToken
    );
    if (!centerList.length) {
      console.log(`No centers found for ${formattedDate}`);
    }
    for (const center of centerList) {
      if (feeFilter.length && !feeFilter.includes(center.fee_type)) {
        console.log(`[Skipped] ${center.name} is ${center.fee_type}.`);
        continue;
      }
      if (onlyCenters.length && !onlyCenters.includes(center.center_id)) {
        console.log(`[Ignored] ${center.name} is not selected.`);
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
          playSound.playSound(playSound.sounds.alarm);
          console.log(`===================================`);
          console.log(
            `Found a session with ${session.available_capacity} availability at ${center.name} for age ${session.min_age_limit}`
          );
          console.log(`===================================`);
          for (const slot of session.slots) {
            try {
              utils
                .request({
                  method: "POST",
                  accessToken,
                  path: "/api/v2/appointment/schedule",
                  body: {
                    dose: 1,
                    session_id: session.session_id,
                    slot,
                    beneficiaries,
                  },
                })
                .then((response) => {
                  console.log(response);
                  success = true;
                })
                .catch((error) => console.log(error));
            } catch {
              console.log(`Error while booking slot.`);
            }
          }
        } else {
          console.log(`No availability at ${center.name}`);
        }
        if (success) break;
      }
      if (success) break;
    }
  };

  const mainLoop = async () => {
    try {
      console.log(`++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);
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
          Math.random() * (maxTimeoutValue - minTimeoutValue) + minTimeoutValue
        );
        console.log(`Waiting for ${timeout} ms`);
        setTimeout(mainLoop, timeout);
      }
      console.log(`++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++`);
    } catch (error) {
      console.log("Main loop breaks with following error.");
      console.log(error);
    }
  };
  mainLoop();
})();
