const express = require("express");
const router = express.Router();
const PartSuggestive = require("../routes/PartSuggestive");
const multer = require("multer");




const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
    },
  }).fields([{ name: "excel", maxCount: 1 }]);
  
router.post("/branch",PartSuggestive.branch);
router.post("/minstockexcelimport", excelUpload, PartSuggestive.minstockexcelimport);
router.post("/minStockImportFormat", PartSuggestive.minStockImportFormat);
router.post("/excelimport", excelUpload, PartSuggestive.excelimport);
router.post("/maxorderno",  PartSuggestive.maxorderno);
router.post("/generatestock",  PartSuggestive.generatestock);
router.post("/savesuggestive",  PartSuggestive.savesuggestive);
router.post("/getreport",  PartSuggestive.getreport);
router.post("/getreportall",  PartSuggestive.getreportall);
router.get("/formateministock",  PartSuggestive.formateministock);
router.get("/formatstock",  PartSuggestive.formatstock);

 



 

 
module.exports = router;
