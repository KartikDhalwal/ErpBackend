const express = require("express");
const router = express.Router();
const CanaraBank = require("../routes/CanaraBank");

router.post("/rtgs", CanaraBank.rtgs);
router.post("/neft", CanaraBank.neft);
router.post("/imps", CanaraBank.imps);
router.post("/statement", CanaraBank.statement);
router.post("/balance", CanaraBank.balance);
module.exports = router;
