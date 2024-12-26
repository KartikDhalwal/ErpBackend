const express = require("express");
const router = express.Router();
const ars = require("../routes/ars");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([
  { name: "punchIn", maxCount: 1 },
  { name: "punchOut", maxCount: 1 },
]);

router.post("/attendance", ars.attendance);
router.post("/ChangeShiftTime", ars.ChangeShiftTime);
// router.post("/MissPunchReq", upload, ars.MissPunchReq);
router.post("/shiftChange", ars.shiftChange);
router.post("/fetchAttendanceData", ars.fetchAttendanceData);
router.post("/changeweeklyoff", ars.changeweeklyoff);
router.post("/UpdateInOutchange", ars.UpdateInOutchange);
router.post("/ChangeMisPunch", ars.ChangeMisPunch);
router.post("/uploadMisspunch", upload, ars.uploadMisspunch);
module.exports = router;
