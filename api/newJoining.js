const express = require("express");
const router = express.Router();
const newJoining = require("../routes/newJoining");

router.post("/insertData", newJoining.insertData);
router.post("/findAll", newJoining.findAll);
module.exports = router;
