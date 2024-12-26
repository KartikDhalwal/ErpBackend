const express = require("express");
const router = express.Router();
const icmTracker = require("../routes/icmTracker");
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fieldSize: 100 * 1024 * 1024,
    },
  }).any();


router.post("/findBookingData", icmTracker.findBookingData);
router.post("/FindMastericmTracker", icmTracker.FindMastericmTracker);
router.post("/FirstSave", upload, icmTracker.FirstSave);
router.post("/DocketUpdate", upload, icmTracker.DocketUpdate);
router.post("/IcmTrackerViewTable", icmTracker.IcmTrackerViewTable);
router.post("/IcmTrackerView", icmTracker.IcmTrackerView);
router.post("/VerifyDocket", icmTracker.VerifyDocket);
router.post("/DeliveryRegister", icmTracker.DeliveryRegister);
router.post("/GetReceipts", icmTracker.GetReceipts);


module.exports = router;
