const express = require("express");
const router = express.Router();
const fuel = require("../routes/fuel");
const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
    },
  }).fields([
    { name: "FuelSlip", maxCount: 1 },
  ]);
router.post("/branchDistanceSave", fuel.branchDistanceSave);
router.post("/branchDistance", fuel.branchDistance);
router.post("/Masters", fuel.Masters);
router.post("/branchAddr", fuel.branchAddr);
router.post("/ModelDetails", fuel.ModelDetails);
router.post("/branchDistanceUpdate", fuel.branchDistanceUpdate);
router.post("/insertData",fuel.insertData);
router.post("/DemoCarFetch", fuel.DemoCarFetch);
router.post("/NewCarDataFetch", fuel.NewCarDataFetch);
router.post("/FuelSlipSave",upload, fuel.FuelSlipSave);
router.post("/MaxTranId", fuel.MaxTranId);
router.post("/PrintNewCar", fuel.PrintNewCar);
router.post("/DemoCarDataFetch", fuel.DemoCarDataFetch);
router.post("/DemoCarDataView", fuel.DemoCarDataView);
router.post("/PrintDemoCar", fuel.PrintDemoCar);
router.post("/InterBranchDataFetch", fuel.InterBranchDataFetch);
router.post("/DistanceBetw", fuel.DistanceBetw);
router.post("/FuelReport", fuel.FuelReport);
router.post("/NewCarRePrintView", fuel.NewCarRePrintView);
router.post("/RePrintNewCar", fuel.RePrintNewCar);
router.post("/RePrintMaster", fuel.RePrintMaster);
router.post("/SendOtp", fuel.SendOtp);
module.exports = router;
