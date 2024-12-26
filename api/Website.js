const express = require("express");
const router = express.Router();
const Website = require("../routes/Website");
const multer = require("multer");
const upload1 = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();


router.post("/uploadedResume",upload1, Website.uploadedResume);
router.post("/uploadTestimonialImage",upload1, Website.uploadTestimonialImage);
router.get("/TestimonialMsg", Website.TestimonialMsg);
router.post("/UpdateTestimonial", Website.UpdateTestimonial);


module.exports = router;