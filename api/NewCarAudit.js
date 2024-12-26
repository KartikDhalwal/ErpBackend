const express = require("express");
const router = express.Router();
const NewCarAudit = require("../routes/NewCarAudit");
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
 


router.post("/GetVechileDataByVin",NewCarAudit.GetVechileDataByVin);
router.post("/GenerateQr",NewCarAudit.GenerateQr);
router.post("/AddAuditOfCar",NewCarAudit.AddAuditOfCar);
router.get("/AuditReport",NewCarAudit.AuditReport);
router.get("/GetVechileData/:id",NewCarAudit.GetVechileData);





 

 
module.exports = router;
