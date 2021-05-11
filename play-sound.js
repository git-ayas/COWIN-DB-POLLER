const path = require("path");
const { exec } = require("child_process");

exports.sounds = {
  alarm: path.join("sounds", "alarm.mp3"),
  accessing: path.join("sounds", "accessing.mp3"),
  loginRejected: path.join("sounds", "login-rejected.mp3"),
  success: path.join("sounds", "success.mp3"),
};

exports.enableSound = true;

exports.playSound = (sound) => {
  if (!this.enableSound) return;
  const filePath = path.join(__dirname, sound);
  exec(`cvlc ${filePath}`, (error, stdout, stderr) => {
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
