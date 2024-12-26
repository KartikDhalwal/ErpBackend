const express = require("express");
const router = express.Router();
const BookAlot = require("../routes/BookAlot");

router.post("/viewgdapproaldata", BookAlot.viewgdapproaldata);
router.post("/ChassisView", BookAlot.ChassisView);
router.post("/ChassisReport", BookAlot.ChassisReport);
router.post("/AllotedChassisView", BookAlot.AllotedChassisView);
router.post("/AllotChassis", BookAlot.AllotChassis);
router.post("/DeAllotChassis", BookAlot.DeAllotChassis);
router.post("/DeAllotedChassisView", BookAlot.DeAllotedChassisView);
router.post("/ChassisWiseActions", BookAlot.ChassisWiseActions);
router.post("/ChassisMaster", BookAlot.ChassisMaster);
router.post("/ApprovalDataView", BookAlot.ApprovalDataView);
router.post("/ApprovalSystem", BookAlot.ApprovalSystem);
router.post("/RejectSystem", BookAlot.RejectSystem);
router.post("/viewgdapproaldataone", BookAlot.viewgdapproaldataone);
router.post("/ChassisViewSingle", BookAlot.ChassisViewSingle);
router.post("/ChasisViewStock", BookAlot.ChasisViewStock);


module.exports = router;
