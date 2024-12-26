const express = require("express");
const router = express.Router();
const groupMaster = require("../routes/groupMaster");

router.post("/FindGroup", groupMaster.FindGroup);
router.post("/FindGroupName", groupMaster.FindGroupName);
router.post("/insertData", groupMaster.insertData);
router.post("/updateGroup", groupMaster.updateGroup);

module.exports = router;
