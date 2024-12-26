const express = require("express");
const router = express.Router();
const tds = require("../routes/tds");
const multer = require("multer");
const upload1 = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
    },
}).any();

router.post("/employee", tds.employee);
router.post("/UpdateEmpdocs", tds.UpdateEmpdocs);
router.post("/uploadedImage", upload1, tds.uploadedImage);
router.post("/savetds", tds.savetds);
router.post("/updatetds", tds.updatetds);


module.exports = router;
