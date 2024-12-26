const jwt = require("jsonwebtoken");

// Define the authentication middleware function
const authenticateUser = (req, res, next) => {
  if (
    req.path === "/users/login" ||
    req.path === "/users/getyear" ||
    req.path === "/fetch"
  ) {
    return next();
  }
  const token = req.headers.authorization;

  // if (!token) {
  //   return res.status(401).json({ message: "Authentication token missing" });
  // }
  const compCode = req.headers.compcode || req.query.compcode || req.body.compcode;
  if (!compCode) {
    return res.status(401).send({ message: "comapany code missing" });
  }
  // jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
  //   if (err) {
  //     return res.status(401).json({ message: "Invalid token" });
  //   }else{
  //     next();
  //   }
  // });
  next();
};

// Use the authentication middleware with Express.js for all routes except /login

module.exports = { authenticateUser };
