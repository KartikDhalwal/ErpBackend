const express = require("express");
const router = express.Router();
const cash_sheet = require("../routes/cash_sheet");
const multer = require("multer");


const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([{ name: "excel", maxCount: 1 }]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();

router.post("/savecashsheet",cash_sheet.savecashsheet);
router.post("/getClosingBal",cash_sheet.getClosingBal);
router.post("/sendOtp",cash_sheet.sendOtp);
router.post("/getreport",cash_sheet.getreport);
router.post("/getupdatedreport",cash_sheet.getupdatedreport);
router.post("/getceobranchreport",cash_sheet.getceobranchreport);
router.post("/getceoledgerreport",cash_sheet.getceoledgerreport);
router.post("/sendEmailtoceo", cash_sheet.sendEmailtoceo);


 


 

 
module.exports = router;
