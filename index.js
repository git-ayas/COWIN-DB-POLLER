var https = require('follow-redirects').https;
var esformatter = require('esformatter');
var fs = require('fs');
const { exec } = require("child_process");


const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX25hbWUiOiJjY2NiZTIyMC1mNGY2LTQ2ZjEtOWY4Zi02N2U3ZWY3N2JlM2QiLCJ1c2VyX2lkIjoiY2NjYmUyMjAtZjRmNi00NmYxLTlmOGYtNjdlN2VmNzdiZTNkIiwidXNlcl90eXBlIjoiQkVORUZJQ0lBUlkiLCJtb2JpbGVfbnVtYmVyIjo3MjU5NjE5MDI5LCJiZW5lZmljaWFyeV9yZWZlcmVuY2VfaWQiOjQ2NTI2MTQxMDEwOTkwLCJzZWNyZXRfa2V5IjoiYjVjYWIxNjctNzk3Ny00ZGYxLTgwMjctYTYzYWExNDRmMDRlIiwidWEiOiJNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvOTAuMC40NDMwLjg1IFNhZmFyaS81MzcuMzYgRWRnLzkwLjAuODE4LjQ2IiwiZGF0ZV9tb2RpZmllZCI6IjIwMjEtMDUtMDlUMTg6MDc6MjguODQ3WiIsImlhdCI6MTYyMDU4MzY0OCwiZXhwIjoxNjIwNTg0NTQ4fQ.xDdejLfisztrigj9oQJp8oo8ogYAJMBh10lY8P92oII"
const timeout = 10000
const DistrictIds = [294, 265]
const main = (DistrictId = 294) => {

  const currentDate = new Date()

  const formattedDate = `${currentDate.getDate() + 1}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`
  console.log(currentDate)
  var options = {
    'method': 'GET',
    'hostname': 'cdn-api.co-vin.in',
    'path': `/api/v2/appointment/sessions/calendarByDistrict?district_id=${DistrictId}&date=${formattedDate}`,
    'headers': {
      'authority': 'cdn-api.co-vin.in',
      'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Microsoft Edge";v="90"',
      'accept': 'application/json, text/plain, */*',
      'dnt': '1',
      'sec-ch-ua-mobile': '?0',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36 Edg/90.0.818.46',
      'origin': 'https://selfregistration.cowin.gov.in',
      'sec-fetch-site': 'cross-site',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      'referer': 'https://selfregistration.cowin.gov.in/',
      'accept-language': 'en-US,en;q=0.9',
      'if-none-match': 'W/"15fc0-h+yyfPnwRvwgls5oCjLlVbKOk5E"',
      'Authorization': `Bearer ${accessToken}`
    },
    'maxRedirects': 20
  };

  var req = https.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function (chunk) {
      var body = Buffer.concat(chunks);
      let CenterList = []
      try {
        CenterList = JSON.parse(body.toString()).centers;
      } catch (error) {
        exit()
      }
      const EighteenPlusFilter = (center) => {
        const sessions = center.sessions
        for (let i = 0; i < sessions.length; i++) {
          const session = sessions[i];
          if (session.min_age_limit === 18) return true
        }
        return false
      }
      const AvailableEighteenPlusFilter = (center) => {
        const sessions = center.sessions
        for (let i = 0; i < sessions.length; i++) {
          const session = sessions[i];
          if (session.min_age_limit === 18 && session.available_capacity > 0) return true
        }
        return false
      }
      const getAvailableCenters = (CentersList) => {
        return CentersList.map((center) => {
          const sessions = center.sessions
          center.sessions = sessions.filter((session) => session.available_capacity > 0 ? true : false)
          return center.sessions.length > 0 ? center : false
        }).filter((center) => center)

      }
      const EighteenPlusFacilities = CenterList.filter(EighteenPlusFilter)
      const AvailableCenters = getAvailableCenters(CenterList)
      const below45 = AvailableCenters.filter(AvailableEighteenPlusFilter)

      console.count("Call")
      console.log(`%c[Total]: ${CenterList.length} hospitals, (${EighteenPlusFacilities.length} 18+ facilities)`, "color: yellow");
      console.log(`%c[Available]: ${AvailableCenters.length}, (${below45.length} 18+ facilities)`, "color: lightblue");
      console.log(`%c[18+ Slots]: ${below45.length}`, `color: ${below45.length > 0 ? "lightgreen" : "red"}`);

      if (AvailableCenters.length > 0) {
        writeData(DistrictId+'_available_hospitals.json', AvailableCenters)
      }

      if (below45.length > 0) {
        sing()
        writeData(DistrictId+'_18plus_hospitals.json', below45)
      }
    });

    res.on("error", function (error) {
      console.error(error);
    });
  });

  req.end();

}
const writeData = (fileName, data) => {
  // convert JSON object to string
  const dataString = esformatter.format(JSON.stringify(data));

  // write JSON string to a file
  fs.writeFile(fileName, dataString, (err) => {
    if (err) {
      throw err;
    }
    console.log("JSON data is saved.");
  });
}
const mainLoop = () => {
  DistrictIds.forEach((id) => main(id))
}
mainLoop()
const intervalCall = setInterval(mainLoop, timeout)
const exit = (found = false) => {
  if (!found) console.error("Authorization Expired")
  else {
    console.info("~~~~~~~~~~~~Found 18+ slot. stopping~~~~~~~~~~~~")

  }
  clearInterval(intervalCall)
}
const sing = () => {
  exec("vlc .\\success.mp3", (error, stdout, stderr) => {
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

}