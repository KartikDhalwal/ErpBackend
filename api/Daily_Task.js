const express = require("express");
const router = express.Router();
const Daily_Task = require("../routes/Daily_Task");
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
 


router.post("/saveTask1",Daily_Task.saveTask1);
router.post("/saveTask2",Daily_Task.saveTask2);
router.post("/managerView",Daily_Task.managerView);
router.post("/gatEmpData",Daily_Task.gatEmpData);
router.post("/getLastRecordByDate",Daily_Task.getLastRecordByDate);
router.post("/dailytaskbutton",Daily_Task.dailytaskbutton);
router.post("/updateRemarks",Daily_Task.updateRemarks);
 


module.exports = router;
