const utils = require("./utils");
const path = require("path");

const beneficiariesFile = path.join(__dirname, "beneficiaries.txt");

exports.getBeneficiaries = async (accessToken) => {
  try {
    return JSON.parse(utils.readFile(beneficiariesFile));
  } catch {
    console.log(
      `Requesting beneficiaries. Error reading file: ${beneficiariesFile}`
    );
  }
  return (
    await utils.request({
      method: "GET",
      path: "/api/v2/appointment/beneficiaries",
      accessToken,
    })
  ).beneficiaries;
};
