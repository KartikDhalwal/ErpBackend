const express = require("express");
const router = express.Router();
const manualdiscount = require("../routes/manualdiscount");

//discount approval
router.get("/discountdashboard", manualdiscount.discountdashboard);
router.post("/discountdashboarddata", manualdiscount.discountdashboarddata);
router.post("/viewDiscountReport", manualdiscount.viewDiscountReport);
router.post("/discountreportUserwise", manualdiscount.discountreportUserwise);
router.post("/discountreportBranchwise", manualdiscount.discountreportBranchwise);
router.post("/findvarient", manualdiscount.findvarient);
router.post("/savediscountapproval", manualdiscount.savediscountapproval);
router.post("/viewdiscountapproaldata", manualdiscount.viewdiscountapproaldata);
router.post("/approveby2", manualdiscount.approveby2);
router.post("/rejectby2", manualdiscount.rejectby2);
router.post("/findone", manualdiscount.findone);
router.post("/reapproval", manualdiscount.reapproval);
router.post("/updatediscountamountonly", manualdiscount.updatediscountamountonly);
router.post("/viewgdapproaldata", manualdiscount.viewgdapproaldata);
router.post("/disc7", manualdiscount.disc7);
router.post("/findgdfdidata", manualdiscount.findgdfdidata);
router.post("/reapperovalby2", manualdiscount.reapperovalby2);
router.post("/viewold", manualdiscount.viewold);
module.exports = router;
