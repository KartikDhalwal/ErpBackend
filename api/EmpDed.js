const express = require("express");
const router = express.Router();
const EmpDed = require("../routes/empDed");

router.post("/insertData", EmpDed.insertData);
router.post("/findAll", EmpDed.findAll);
router.post("/update", EmpDed.updateData);
router.post("/findMasters", EmpDed.findMasters);

module.exports = router;
