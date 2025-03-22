import fetch from "node-fetch";
import chalk from 'chalk';
import fss from "fs/promises";
import readline from "readline/promises";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

const BASE_URL = "https://api.mail.tm"

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

async function saveToFile(filename, data) {
    try {
        await fss.appendFile(filename, `${data}\n`, 'utf-8');
        logger(`Data saved to ${filename}`, 'success');
    } catch (error) {
        logger(`Failed to save data to ${filename}: ${error.message}`, 'error');
    }
}

async function getAvailableDomains() {
    try {
        const response = await fetch(`${BASE_URL}/domains`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const domains = data["hydra:member"] || [];
        return domains.map(domain => domain.domain);
    } catch (error) {
        console.log("❌ Không thể lấy danh sách domain:", error.message);
        return [];
    }
}

function generateRandomEmail() {
    const firstNames = ["Minh", "Anh", "Hung", "Hai", "Duy", "Linh", "Thao", "Trang", "Quang", "Bao", "Phuc", "Khanh"];
    const lastNames = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Phan", "Vu", "Dang", "Bui", "Do"];

    const first = firstNames[Math.floor(Math.random() * firstNames.length)].toLowerCase();
    const last = lastNames[Math.floor(Math.random() * lastNames.length)].toLowerCase();
    const number = Math.floor(Math.random() * 90) + 10; // Số từ 10-99

    return `${first}${last}${number}reff`;
}

async function createMailAccount() {
    let quantity = await rl.question("Nhập số lượng email muốn generate bởi mailjs: ");    
    quantity = parseInt(quantity);

    const PASSWORD = await rl.question("Nhập mật khẩu muốn đặt để truy cập vào hộp thư mailjs: ");
    const emailPrefix = generateRandomEmail();
    const domains = await getAvailableDomains();
    
    if (domains.length === 0) {
        return null;
    }

    const selectedDomain = domains[0];
    const email = `${emailPrefix}@${selectedDomain}`;
    logger(email);
    const payload = JSON.stringify({ address: email, password: PASSWORD });

    try {
        const response = await fetch(`${BASE_URL}/accounts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        logger("✅ Tài khoản được tạo thành công!", 'success');
        if (data.address) {
            await saveToFile('accounts.txt', `${data.address},${PASSWORD}`)
        }
    } catch (error) {
        logger(`❌ Lỗi khi tạo tài khoản: ${error.message}`, 'error');
        return null;
    }
    rl.close()
}

// Gọi thử hàm
createMailAccount();
