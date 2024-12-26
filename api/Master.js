const express = require("express");
const router = express.Router();
const Master = require("../routes/Master");

router.post("/FindMaster", Master.FindMaster);
router.post("/insertData", Master.insertData);
router.post("/updateMaster/:id", Master.updateMaster);
router.post("/findbranchdivision", Master.findbranchdivision);
router.post("/saveholiday", Master.saveholiday);
router.post("/holidaydata", Master.holidaydata);
router.post("/updateholiday", Master.updateholiday);
router.post("/salarmasterdata", Master.salarmasterdata);
module.exports = router;
