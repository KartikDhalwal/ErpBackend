const express = require("express");
const router = express.Router();
const template = require("../routes/template");

router.post("/insertData", template.insertData);
router.post("/FindTemplate", template.FindTemplate);
router.post("/FindTemplateContent", template.FindTemplateContent);
router.post("/empdata", template.empdata);
router.post("/updateData", template.updateData);


module.exports = router;
