const express = require("express");
const router = express.Router();
const quotation = require("../routes/quotation");
const multer = require("multer");
 
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();


const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([{ name: "excel", maxCount: 1 }]);


router.post("/insert", quotation.insert);
router.post("/getInsertedData", quotation.getInsertedData);
router.post("/findMasters", quotation.findMasters);
router.post("/update", quotation.update);
router.post("/sendEmail", quotation.sendEmail);
router.post("/findMaxquotation", quotation.findMaxquotation);
router.post("/varient", quotation.varient);
router.post("/sendwhatsapp", quotation.sendwhatsapp);
router.post("/uploadeddocument", upload, quotation.uploadeddocument);
router.post("/insertenquiry", quotation.insertenquiry);
router.post("/viewenquiryrowdata", quotation.viewenquiryrowdata);
router.post("/updateenquiry", quotation.updateenquiry);
router.post("/updatefollowups", quotation.updatefollowups);
router.post("/dropdown", quotation.dropdown);
router.post("/modelGrpvarmobile", quotation.modelGrpvarmobile);
router.post("/databyenqno", quotation.databyenqno);
router.post("/maxenquiryno", quotation.maxenquiryno);
router.post("/enquiryreport", quotation.enquiryreport);
router.post("/enquiryreport1", quotation.enquiryreport1);
router.post("/alotchasno", quotation.alotchasno);
router.post("/dealotchasno", quotation.dealotchasno);
router.post("/maxcodeforadd", quotation.maxcodeforadd);
router.post("/adddropdata", quotation.adddropdata);
router.post("/excelimport",excelUpload, quotation.excelimport);


 
module.exports = router;
