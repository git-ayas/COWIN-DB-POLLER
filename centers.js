const utils = require("./utils");

exports.getCenters = async (
  { districtId, pin },
  formattedDate,
  accessToken
) => {
  const path = pin
    ? `/api/v2/appointment/sessions/calendarByPin?pincode=${pin}&date=${formattedDate}`
    : `/api/v2/appointment/sessions/calendarByDistrict?district_id=${districtId}&date=${formattedDate}`;
  return (
    await utils.request({
      method: "GET",
      path,
      accessToken,
    })
  ).centers;
};
