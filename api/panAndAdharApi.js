const express = require("express");
const router = express.Router();
const panAndAdharApi = require("../routes/panAndAdharApi");
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
    },
}).any()
router.get("/validate", panAndAdharApi.validate);
router.post("/uatValidateSprintVerify", upload, panAndAdharApi.validateSprintVerify);
router.post("/validateSprintVerify", upload, panAndAdharApi.uatValidateSprintVerify);
router.get("/gst", panAndAdharApi.GST);
module.exports = router;


