const express = require("express");
const router = express.Router();
const icm = require("../routes/icm");
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fieldSize: 100 * 1024 * 1024,
    },
  }).any();


router.post("/FindMasters", icm.FindMasters);
router.post("/FindNewCarSaleData", icm.FindNewCarSaleData);
router.post("/IcmSave", upload, icm.IcmSave);
router.post("/IcmViewTable", icm.IcmViewTable);
router.post("/IcmView", icm.IcmView);
router.post("/VoucherCodeData", icm.VoucherCodeData);
router.post("/savedata", icm.savedata);
router.post("/updatedata", icm.updatedata);
router.post("/findMastersLedgerselected", icm.findMastersLedgerselected);
router.post("/findMastersLedger", icm.findMastersLedger);
router.post("/ShowData", icm.ShowData);
router.post("/ViewAllData", icm.ViewAllData);
router.post("/FindMastersDocUpload", icm.FindMastersDocUpload);
router.post("/SaveNewDocumentType", icm.SaveNewDocumentType);
router.post("/SaveDocuments", upload, icm.SaveDocuments);
router.post("/IcmDocumentsView", icm.IcmDocumentsView);

module.exports = router;
