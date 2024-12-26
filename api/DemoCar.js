const express = require("express");
const router = express.Router();
const DemoCar = require("../routes/DemoCar");
const multer = require("multer");
const upload1 = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();


router.post("/Demogatepassadd", DemoCar.Demogatepassadd);
router.post("/Demogatepassdashboard", DemoCar.Demogatepassdashboard);
router.post("/modelnamefetch", DemoCar.modelnamefetch);
router.post("/demogetpassview", DemoCar.demogetpassview);
router.post("/demogetpassapr1", DemoCar.demogetpassapr1);
// router.get("/demogetpassapprove", DemoCar.demogetpassapprove);
router.post("/approveby2", DemoCar.approveby2);
router.post("/rejectby2", DemoCar.rejectby2);
router.post("/demogetpassinout", DemoCar.demogetpassinout);
router.post("/demogetpassguardview", DemoCar.demogetpassguardview);
router.post("/uploadeddocumentOutImage",upload1, DemoCar.uploadeddocumentOutImage);
router.post("/uploadedCarImage",upload1, DemoCar.uploadedCarImage);

// 18-10-2024
router.post("/getEmpDetails", DemoCar.getEmpDetails);
router.post("/GatepassReport", DemoCar.GatepassReport);
router.post("/GatepassRdieWiseReport", DemoCar.GatepassRdieWiseReport);

router.post("/uploadedCarImageDirect",upload1, DemoCar.uploadedCarImageDirect);
router.post("/RejectEntry", DemoCar.RejectEntry);

module.exports = router;