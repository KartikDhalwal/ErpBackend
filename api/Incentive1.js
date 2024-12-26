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
router.post("/findEmployeeName", incentive.findEmployeeName);
router.post("/TeamView", incentive.TeamView);
router.get("/DseImportFormat", incentive.DseImportFormat);
router.post("/DSEImportExcel",excelUpload, incentive.DSEImportExcel);
router.get("/TLImportFormat", incentive.TLImportFormat);
router.post("/TLImportExcel",excelUpload, incentive.TLImportExcel);

module.exports = router;
