const express = require("express");
const router = express.Router();
const refu = require("../routes/refund");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();

router.post("/viewgdapproaldata", refu.viewgdapproaldata);
router.post("/refundReprt", refu.refundReprt );
router.post("/UploadBookingImages",upload, refu.UploadBookingImages);
router.post("/RefundEntry", refu.RefundEntry);
router.post("/RefundReappEntry", refu.RefundReappEntry);
router.post("/showReapp", refu.showReapp);
router.post("/viewApproalData", refu.viewApproalData);
router.post("/approveRefund", refu.approveRefund);
router.post("/rejectRefund", refu.rejectRefund);
router.post("/deleteImage", refu.deleteImage);
router.post("/reportBranchwise", refu.reportBranchwise);


module.exports = router;
