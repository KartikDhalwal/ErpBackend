const express = require("express");
const router = express.Router();
const incentive = require("../routes/incentive");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([
  { name: "VendorDocument", maxCount: 1 },
]);
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([{ name: "excel", maxCount: 1 }]);

router.post("/findMasters", incentive.findMasters);
router.post("/Models", incentive.Models);
router.post("/SavePolicy", incentive.SavePolicy);
router.post("/Import", incentive.Import);
router.post("/IncPolicy", incentive.IncPolicy);
router.post("/findMastersDetail", incentive.FindMasterDetail);
router.post("/ImportFromPrevMonthDSE", incentive.ImportFromPrevMonthDSE);
router.post("/findEmployeeName", incentive.findEmployeeName);
router.post("/TeamView", incentive.TeamView);
router.get("/DseImportFormat", incentive.DseImportFormat);
router.post("/DSEImportExcel",excelUpload, incentive.DSEImportExcel);
router.post("/TVNTVImportExcel",excelUpload, incentive.TVNTVImportExcel);
router.get("/TLImportFormat", incentive.TLImportFormat);
router.get("/TVNTVImportFormat", incentive.TVNTVImportFormat);
router.get("/makeinsentive", incentive.makeInsentive);
router.post("/TLImportExcel",excelUpload, incentive.TLImportExcel);


//new car payout module.
router.post("/payoutMaster", incentive.payoutMaster);
router.post("/SavePayoutMaster", incentive.SavePayoutMaster);
router.get("/MarutiPayout", incentive.MarutiPayout);





module.exports = router;
