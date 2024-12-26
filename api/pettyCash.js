const express = require("express");
const router = express.Router();
const pettyCash = require("../routes/pettyCash");

router.post("/insertData", pettyCash.insertData);
router.post("/PettyCashApr1", pettyCash.PettyCashApr1);
router.post("/PettyCashApr2", pettyCash.PettyCashApr2);
router.post("/PettyCashAmt", pettyCash.PettyCashAmt);
router.post("/PettyCashEmpAmt", pettyCash.PettyCashEmpAmt);
router.post("/PettyCashapprove", pettyCash.PettyCashapprove);
router.post("/PettyCashreject", pettyCash.PettyCashreject);
router.post("/PettyCashView", pettyCash.PettyCashView);
router.post("/PettyCashcancel", pettyCash.PettyCashcancel);

module.exports = router;
