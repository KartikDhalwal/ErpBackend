const express = require("express");
const router = express.Router();
const hrmsreport = require("../routes/hrmsreport");

router.get("/attendanceReport", hrmsreport.attendanceReport);
router.get("/OtDaysReport", hrmsreport.OtDaysReport);
router.get("/digitalgatepass", hrmsreport.digitalgatepass);
router.post("/findMasters", hrmsreport.findMasters);
router.get("/MobileAttdenceReport", hrmsreport.MobileAttdenceReport);
router.get("/SalaryReport", hrmsreport.SalaryReport);
router.get("/AssetEmpReport", hrmsreport.AssetEmpReport);
router.post("/digitalgatepassdash", hrmsreport.digitalgatepassdash);
router.get("/PunchingReport", hrmsreport.PunchingReport);
router.get("/parfoma_report", hrmsreport.parfoma_report);


module.exports = router;


