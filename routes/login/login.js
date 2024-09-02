const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const ResponseManager = require("../../utils/responseManager");
const LoginService = require("../../services/login/loginService");

const secret_key = process.env.JWT_SECRET;

route.post("/login", async (req, res) => {
  const { Email, Password } = req.body;
  try {
    const user = await LoginService.getUserByEmailAndPassword(Email, Password);
    if (user !== null && user.length > 0) {
      const userData = {
        id: user[0].AdminID,
        Email: user[0].Email,
        Password: user[0].Password,
        Phone: user[0].Phone,
        Age: user[0].Age,
        City: user[0].City,
        ProfilePicture: user[0].ProfilePicture,
      };
      jwt.sign(
        { userData },
        secret_key,
        { expiresIn: "1200s" },
        (err, jwtToken) => {
          if (err) {
            console.error("Error generating token:", err);
            ResponseManager.sendError(
              res,
              500,
              "ERR_GENERATING_TOKEN",
              "Error generating token"
            );
          } else {
            ResponseManager.sendSuccess(
              res,
              { user: userData, jwtToken },
              200,
              "Login successful"
            );
          }
        }
      );
    } else {
      throw new Error("Invalid credentials");
    }
  } catch (error) {
    console.error("Server error:", error);
    if (error.message === "Invalid credentials") {
      ResponseManager.sendError(
        res,
        401,
        "INVALID_CREDENTIALS",
        "Invalid email or password"
      );
    }
    else if (error.message.includes("undefined")) {
      ResponseManager.sendError(res, 404, "USER_NOT_FOUND", "User not found");
    } else {
      ResponseManager.sendError(
        res,
        500,
        "SERVER_ERROR",
        "Internal server error"
      );
    }
  }
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearerToken = bearerHeader.split(" ")[1];
    req.token = bearerToken;
    next();
  } else {
    ResponseManager.sendError(
      res,
      403,
      "MISSING_TOKEN",
      "Authorization header missing"
    );
  }
}

module.exports = route;
