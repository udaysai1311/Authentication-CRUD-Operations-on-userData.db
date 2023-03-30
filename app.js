const express = require("express");
const app = express();
app.use(express.json());

const bcrypt = require("bcrypt");

const path = require("path");
const dbPath = path.join(__dirname, "userData.db");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server started at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBServer();

// POST API 1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  const usernameQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUsername = await db.get(usernameQuery);
  if (dbUsername === undefined) {
    const addUserQuery = `
            INSERT INTO 
                user (username,name,password,gender,location)
            VALUES 
                ('${username}',
                 '${name}',
                 '${hashedPassword}',
                 '${gender}',
                 '${location}');`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let dbNewUser = await db.run(addUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// POST API 2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  let hashedPassword = await bcrypt.hash(password, 10);
  const userNameQuery = `SELECT * FROM user WHERE username='${username}';`;
  const userData = await db.get(userNameQuery);
  if (userData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let unHashedPassword = await bcrypt.compare(password, userData.password);
    if (unHashedPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

// PUT API 3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userQuery = `
    SELECT * 
    FROM user 
    WHERE username='${username}';`;
  const userData = await db.get(userQuery);
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const unHashedPassword = await bcrypt.compare(oldPassword, userData.password);
  if (unHashedPassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newPasswordQuery = `
            UPDATE user
            SET 
                password = '${hashedPassword}'
            WHERE
                username = '${username}';`;

      const dbData = await db.run(newPasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
