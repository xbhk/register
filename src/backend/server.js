const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

// 存储账户信息的文件路径
const accountsFilePath = path.join(__dirname, "accounts.json");

// 从文件中读取账户信息
function readAccountsFromFile() {
  try {
    const data = fs.readFileSync(accountsFilePath, "utf8");
    const accounts = JSON.parse(data);
    return accounts;
  } catch (err) {
    return []; // 如果文件不存在或读取失败返回空数组
  }
}

// 将账户信息保存到文件
function saveAccountsToFile(accounts) {
  try {
    const data = JSON.stringify(accounts, null, 2); // 格式化JSON数据
    fs.writeFileSync(accountsFilePath, data);
    console.log(`账户信息被保存到文件: ${accountsFilePath}`);
  } catch (err) {
    console.error("保存账户信息失败:", err);
  }
}

// 注册端点
app.post("/api/register", (req, res) => {
  const { username, password } = req.body;

  // 从文件中读取现有账户信息
  const accounts = readAccountsFromFile();

  // 检查账号是否已存在
  const existingAccount = accounts.find((acc) => acc.username === username);
  if (existingAccount) {
    return res.status(400).json({ message: "账号已存在" });
  }

  // 添加新账号到数组
  accounts.push({ username, password });

  // 将更新后的账户信息保存到文件
  saveAccountsToFile(accounts);

  res.status(200).json({ message: "注册成功" });
});

// 登录端点
// 登录端点
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // 从文件中读取现有账户信息
  const accounts = readAccountsFromFile();

  // 查找匹配的账户
  const account = accounts.find(
    (acc) => acc.username === username && acc.password === password
  );

  if (account) {
    // 以下是一个示例token字符串

    const token = "example-token-string";

    // 登录成功，返回token和用户信息
    res.status(200).json({
      message: "登录成功",
      token: token,
      user: {
        username: account.username,
        // 其他用户信息可以在这里添加
      },
    });
  } else {
    // 登录失败，返回一个错误信息
    res.status(401).json({ message: "用户名或密码错误" });
  }
});

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
