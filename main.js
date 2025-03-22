import readline from "readline/promises";
import fss from "fs/promises";
import Mailjs from "@cemalgnlts/mailjs";
import { HttpsProxyAgent } from "https-proxy-agent";
import chalk from 'chalk';
import fetch from "node-fetch";
import { jwtDecode } from "jwt-decode";
import FormData from "form-data";
import fs from "fs";

const mailjs = new Mailjs();
const headers = {
  "Content-Type": "application/json",
  origin: "https://cess.network",
  referer: "https://cess.network/",
  accept: "application/json, text/plain, */*",
  "content-type": "application/json",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
};
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

function logger(message, level = 'info') {
	const now = new Date().toISOString();
	const colors = {
	    info: chalk.blue,
	    warn: chalk.yellow,
	    error: chalk.red,
	    success: chalk.green,
	    debug: chalk.magenta,
        introduce: chalk.rgb(121, 5, 245)
	};
	const color = colors[level] || chalk.white;
	console.log(color(`[${now}] [${level.toUpperCase()}]: ${message}`));
}

async function sentOTP(email, agent) {
    try {
        const url = "https://merklev2.cess.network/merkle/ecode"
        const request = await fetch(url, {
            headers,
            method: "POST",
            agent,
            body: JSON.stringify({
                email
            })
        })
        const response = await request.json()
        logger(`Đã gửi mã OTP tới email ${email}`, 'success')
        return response
    } catch (error) {
        console.log(error);
        return null
    }
}

async function loginCESS(email, otp, agent) {
    try {
        const url = "https://merklev2.cess.network/merkle/elogin"
        const request = await fetch(url, {
            headers,
            method: "POST",
            agent,
            body: JSON.stringify({
                email,
                code: otp
            })
        })
        const response = await request.json()
        return response.data
    } catch (error) {
        console.log(error);
        return null
    }
}

async function userInfo(token, agent) {
    try {
        const url = "https://merklev2.cess.network/merkle/task/status"
        headers["token"] = token.trim()
        const request = await fetch(url, {
            headers,
            method: "GET",
            agent,
        })
        const response = await request.json()        
        const points = response?.data?.account?.points;
        const username = response?.data?.account?.username;
        const quiz = response?.data?.actsMap?.["Quiz challenge: What is CESS?"]?.done
        const changeProfile = response?.data?.actsMap?.["Change profile"]?.done
        return { points, username, quiz, changeProfile }
    } catch (error) {
        console.log(error);
        return null
    }
}

async function dailyCheckIn(token, agent) {
  try {
      const url = "https://merklev2.cess.network/merkle/task/checkin"
      headers["token"] = token.trim()
      const request = await fetch(url, {
          headers,
          method: "POST",
          agent,
          body: JSON.stringify({})
      })
      const response = await request.json()
      return response.data
  } catch (error) {
      console.log(error);
      return null
  }
}

async function followX(token, agent) {
  try {
      const url = "https://merklev2.cess.network/merkle/task/follow"
      headers["token"] = token.trim()
      const request = await fetch(url, {
          headers,
          method: "POST",
          agent,
          body: JSON.stringify({})
      })
      const response = await request.json()
      return response.data
  } catch (error) {
      console.log(error);
      return null
  }
}

async function getOTPCodeFromMailjs(email, password) {
    const loginMailjs = await mailjs.login(email, password)
    let otp = null;
    if (!loginMailjs || !password) {
        logger(`Email bạn nhập không phải mail của mailJs, hãy vào trong hộp thư Spam của bạn để lấy mã OTP`)
        otp = await rl.question("Nhập mã OTP của bạn, mã OTP có hiệu lực khoảng 1 phút 30 giây, hãy nhập OTP: ");
        return otp
    }
    loginMailjs.data.token
    otp = await waitForEmail(mailjs)
    return otp;
}

async function waitForEmail(mailjs, first = true, delay = 5000) {
    await new Promise(resolve => setTimeout(resolve, 10 * 1000))
    const retries = first ? 3 : 10;
    for (let i = 0; i < retries; i++) {
        const messages = await mailjs.getMessages();
        if (messages?.data?.length > 0) {
            const message = messages.data[0];
            const fullMessage = await mailjs.getMessage(message.id);
            const htmlContent = fullMessage?.data?.html?.[0];
            const otp = getOTPCode(htmlContent)
            if (otp) return otp;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    logger('OTP Fail');
    return null
}


function getOTPCode(htmlContent) {
    const regex = /<p style="font-size: 32px; color: #0443FF; margin-top: 4px; text-align: center; display: block;">\s*\n*\s*(\d{6})/;
    const match = htmlContent.match(regex);
    if (match) {
        return match[1]
    }
    return null;
}

async function saveToFile(filename, data) {
    try {
        await fss.appendFile(filename, `${data}\n`, 'utf-8');
        logger(`Data saved to ${filename}`, 'success');
    } catch (error) {
        logger(`Failed to save data to ${filename}: ${error.message}`, 'error');
    }
}

function answer(questionId) {
  const answer = { 
    1: "Proof of Idle Space (PoIS)",
    2: "100MB",
    3: "Proof of Data Reduplication and Recovery",
    4: "Storage",
    5: "3",
    6: "Decentralized Object Storage Service",
    7: "gateway",
    8: "Yes",
    9: "TCESS",
    10: "circulation",
    11: "Retrieval",
    12: "11",
    13: "2019",
    14: "3220.02",
    15: "Content Decentralized Delivery Network",
    16: "2021",
    17: "TEE",
    18: "Location-based Storage Selection",
  }
  return answer[questionId]
}

async function quiz(token, agent) {
  try {
      const url = "https://merklev2.cess.network/merkle/task/questions"
      headers["token"] = token.trim()
      const request = await fetch(url, {
          headers,
          method: "GET",
          agent,
      })
      const response = await request.json()
      const questions = response.data;

      const ids = questions.map(question => question.id)
      const body = ids.map(id => {
        return {
          answer: answer(id),
          questionId: id
        }
      })

      console.log(body);

      const requestSubmit = await fetch("https://merklev2.cess.network/merkle/task/submit", {
        headers,
        method: "POST",
        agent,
        body: JSON.stringify({ answerSheet: body})
      });

      const responseSubmit = await requestSubmit.json()      
      logger(`Bạn đã trả lời các câu hỏi và được thêm ${responseSubmit?.data?.record?.score}`, 'success')
      return responseSubmit?.data?.record?.score

  } catch (error) {
      console.log(error);
      return null
  }
}

async function uploadFile(token, agent) {    
    const formData = new FormData();
    formData.append("file", fs.createReadStream("./avatar.png"));
    headers["token"] = token.trim()

    try {
        const request = await fetch("https://d.cess.network/file", {
            method: "POST",
            headers: {
                ...formData.getHeaders(),
                token: token.trim()
            },
            body: formData,
            agent
        });

        const response = await request.json();
        logger("Upload file thành công", 'success')
        const { fid, url } = response.data
        
        const formDataAvatar = new FormData();
        formDataAvatar.append("file", fs.createReadStream("./avatar.png"));
        formDataAvatar.append("fid", fid);
        formDataAvatar.append("link", url);

        const requestAvatar = await fetch("https://merklev2.cess.network/merkle/portal/avator", {
            method: "POST",
            headers: {
                ...formDataAvatar.getHeaders(),
                token: token.trim()
            },
            body: formDataAvatar,
        });

        const responseAvatar = await requestAvatar.json();
        return responseAvatar.code
        
    } catch (error) {
        console.error("Lỗi khi upload file:", error);
    }
}


async function main() {
  logger("TOOL ĐƯỢC PHÁT TRIỂN BỞI: THIEN THO TRAN", "introduce");
  logger(
    "Tham gia group facebook để nhận tool mới: https://www.facebook.com/groups/2072702003172443/", "introduce"
  );
  logger(
    "Tham gia group Telegram để chia sẻ kiến thức tại: https://web.telegram.org/k/#@mmoFromAirdrop", "introduce"
  );
  console.log("------------------------------------------------------------");
  const accountData = await fss.readFile("accounts.txt", "utf-8");
  const accounts = accountData?.trim()?.split("\n").map(o => o.trim());
  const proxyData = await fss.readFile("proxies.txt", "utf-8");
  const proxies = proxyData?.trim()?.split("\n").map(o => o.trim());
  const tokenData = await fss.readFile("tokens.txt", "utf-8");
  const tokens = tokenData?.trim() ? tokenData?.trim()?.split("\n").map(o => o.trim()) : [];
  for (let i = 0; i < accounts.length; i++) {
    try {
      const agent = proxies[i] ? new HttpsProxyAgent(proxies[i]) : null;
      const account = accounts[i];
      const [email, password] = account.split(',')
  
    const decoded = tokens[i] ? jwtDecode(tokens[i]) : null;
      if (decoded && (decoded.exp * 1000 <= (new Date()).getTime())) {
          logger("Token đã hết hạn, bắt đầu lấy token mới", 'warn')
          await sentOTP(email, agent);
          const otp = await getOTPCodeFromMailjs(email, password);
          if (!otp) {
              logger("không tìm thấy otp, chuyển sang tài khoản khác", 'error')
              continue;
          }
          const token = await loginCESS(email, otp);
          tokens[i] = token;
          const tokenLines = (await fss.readFile('tokens.txt', 'utf-8')).split('\n');
          tokenLines[i] = token.trim();
          await fss.writeFile('tokens.txt', tokenLines.join('\n'), 'utf-8');
          logger(`Account ${i + 1} đã được làm mới token`, "success");
      } else if (!decoded) {
          logger(`Bắt đầu lấy token cho tài khoản ${i + 1}`, 'warn')
          await sentOTP(email, agent);
          const otp = await getOTPCodeFromMailjs(email, password);
          logger(`Mã OTP là: ${otp}`, 'success')
          if (!otp) {
              logger("không tìm thấy otp, chuyển sang tài khoản khác", 'error')
              continue;
          }
          const token = await loginCESS(email, otp, agent);
          tokens.push(token);
          await saveToFile('tokens.txt', token)
      }

      await dailyCheckIn(tokens[i], agent);
      await followX(tokens[i], agent);
      const info = await userInfo(tokens[i], agent)
      let points = info?.points
      logger(`Username của tài khoản ${email}: ${info?.username}`)
      logger(`Point của tài khoản ${email}: ${points}`)
      if (info.quiz === false) {
        logger(`Chưa làm quiz, bắt đầu làm`)
        const score = await quiz(tokens[i], agent)
        points += score
        logger(`Point của tài khoản ${email}: ${points}`)
      }
      if (info.changeProfile === false) {
        logger(`Chưa làm task change profile, bắt đầu làm`)
        const changeProfile = await uploadFile(tokens[i], agent)
        if (changeProfile == 200) {
            points += 30;
            logger(`Point của tài khoản ${email}: ${points}`)
        }
      }
    } catch (error) {
      logger(`Lỗi ở tài khoản thứ ${i + 1}, ${error}`, 'error')
    }  
  }
  rl.close()
}

main()
