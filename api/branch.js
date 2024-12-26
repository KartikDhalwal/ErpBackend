const express = require("express");
const router = express.Router();
const branch = require("../routes/branch");

router.post("/", branch.insertData);
router.post("/update", branch.updateData);
router.post("/all", branch.findAll);
router.post("/onlybranch", branch.onlybranch);
router.post("/:id", branch.findOne);
module.exports = router;
