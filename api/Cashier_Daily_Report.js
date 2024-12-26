const express = require("express");
const router = express.Router();
const Cashier_Daily_Report = require("../routes/Cashier_Daily_Report");
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
 


router.post("/getData",Cashier_Daily_Report.getData);
router.post("/insertData",Cashier_Daily_Report.insertData);
router.post("/view",Cashier_Daily_Report.view);
 
 


 

 
module.exports = router;
