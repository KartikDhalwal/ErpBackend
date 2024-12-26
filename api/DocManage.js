const express = require("express");
const router = express.Router();
const DocManage = require("../routes/DocManage");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();



router.post("/Masters", DocManage.Masters);
router.post("/save", upload, DocManage.save);



module.exports = router;
