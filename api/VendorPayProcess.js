const express = require("express");
const router = express.Router();
const VendorPayProcess = require("../routes/VendorPayProcess");
// const multer = require("multer");
// const upload = multer({
//     storage: multer.memoryStorage(),
//     limits: {
//       fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
//     },
//   }).any();

router.post("/ApprovalWindow", VendorPayProcess.ApprovalWindow);






module.exports = router;
