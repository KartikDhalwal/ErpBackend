const express = require("express");
const router = express.Router();
const EmpMaster = require("../routes/EmpMaster");
const multer = require("multer");
const upload1 = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();


router.post("/ViewEmpMaster", EmpMaster.ViewEmpMaster);
router.post("/AddEmpMaster", EmpMaster.AddEmpMaster);
router.post("/PaymentMode", EmpMaster.PaymentMode);
router.post("/sendOtp", EmpMaster.sendOtp);

module.exports = router;