const express = require("express");
const router = express.Router();
const BodyShop = require("../routes/BodyShop");
const multer = require("multer");


const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();


router.post("/BodyShopReports",excelUpload, BodyShop.BodyShopReports);
router.post("/BodyShopOrderCheck", BodyShop.BodyShopOrderCheck);
router.get("/BodyShopDownload", BodyShop.BodyShopDownload);
router.post("/GetBtachAndCount", BodyShop.GetBtachAndCount);


module.exports = router;
