const utils = require("./utils");

exports.getAccessToken = async (mobileNo) => {  
  const txnId = (
    await utils.request({
      path: "/api/v2/auth/generateOTP",
      body: { mobile: mobileNo },
      method: "POST",
    })
  ).txnId;
  const otp = await utils.takeInput("Enter OTP:");
  await utils.request({
      path: "/api/v2/auth/confirmOTP",
      body: {}
  })
};
