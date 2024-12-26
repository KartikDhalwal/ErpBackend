const express = require("express");
const router = express.Router();
const Ledger = require("../routes/ledgMst");
const multer = require("multer");


router.post("/findMasters", Ledger.findMasters);
router.post("/AccStatmentLedg", Ledger.AccStatmentLedg);
router.post("/LedgerView",Ledger.LedgerView);
router.post("/FinLedger", Ledger.FinLedger);
router.post("/LedgerSave", Ledger.LedgerSave);
router.post("/FindGroupPath", Ledger.FindGroupPath);
router.get("/AccountExport", Ledger.AccountExport);
router.post("/findMaxLedgCode", Ledger.findMaxLedgCode);
router.post("/UpdateLedger",Ledger.UpdateLedger);
module.exports = router;
