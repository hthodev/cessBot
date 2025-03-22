import readline from "readline/promises";
import Mailjs from "@cemalgnlts/mailjs";

const mailjs = new Mailjs();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function getOTPFromMailjs(email, password) {
  const login = await mailjs.login(email, password);
  console.log(login);
  
  if (!login || login.data.code == 401) {
    console.log(login.data.message);
    return;
  }
  const otp = await waitForEmail(mailjs);
  return otp;
}

async function waitForEmail(mailjs, first = true, delay = 5000) {
  await new Promise((resolve) => setTimeout(resolve, 10 * 1000));
  const retries = first ? 3 : 10;
  for (let i = 0; i < retries; i++) {
    const messages = await mailjs.getMessages();
    if (messages?.data?.length > 0) {
      const message = messages.data[0];
      const fullMessage = await mailjs.getMessage(message.id);
      const htmlContent = fullMessage?.data?.html?.[0];
      const otp = getOTPCode(htmlContent);
      if (otp) return otp;
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  console.log("Get OTP fail");
  return null;
}

function getOTPCode(htmlContent) {
  const regex =
    /<p style="font-size: 32px; color: #0443FF; margin-top: 4px; text-align: center; display: block;">\s*\n*\s*(\d{6})/;
  const match = htmlContent.match(regex);
  if (match) {
    return match[1];
  }
  return null;
}


async function main() {
    const email = await rl.question("Nhập email: ");
    const password = await rl.question("Nhập password: ");
    const otp = await getOTPFromMailjs(email, password)
    console.log("Mã OTP là:", otp);
}

main()
