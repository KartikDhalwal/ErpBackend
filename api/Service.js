const express = require("express");
const router = express.Router();
const Service = require("../routes/Service");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024,
  },
}).any();

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024,
  },
}).fields([{ name: "excel", maxCount: 1 }]);

router.post("/FindMaster", Service.FindMaster);
router.post("/insertData", Service.insertData);
router.post("/UpdateData", Service.UpdateData);
router.post("/OffersView", Service.OffersView);
router.get("/CustomerImportFormat", Service.CustomerImportFormat);
router.post("/CustomerImportExcel", excelUpload, Service.CustomerImportExcel);
router.post("/ViewOfferCustomer", Service.ViewOfferCustomer);
router.post("/ApplyOffer", Service.ApplyOffer);
router.post("/ScanQrResult", Service.ScanQrResult);
router.post("/AvailOffer", Service.AvailOffer);
router.post("/OfferReport", Service.OfferReport);
router.post("/DashData", Service.DashData);
router.post("/WaHstReport", Service.WaHstReport);
router.post("/FindMasterBodyShop", Service.FindMasterBodyShop);
router.post("/FIndModlVar", Service.FIndModlVar);
router.post("/BodyShopClaimSave", upload, Service.BodyShopClaimSave);
router.post("/BodyShopClaimUpdate", upload, Service.BodyShopClaimUpdate);
router.post("/FindBillDataBodySHop", Service.FindBillDataBodySHop);
router.post("/BodyShopGatePassSave", Service.BodyShopGatePassSave);
router.post("/PrintGatePass", Service.PrintGatePass);
router.post("/BodyShopViewTable", Service.BodyShopViewTable);
router.post("/BodyShopView", Service.BodyShopView);
router.post("/VerifyClaim", Service.VerifyClaim);
router.post("/BodyShopViewPrev", Service.BodyShopViewPrev);
router.post("/BodyShopViewManager", Service.BodyShopViewManager);
router.post("/VerifyEstimateMan", Service.VerifyEstimateMan);
router.post("/RejectEstimateMan", Service.RejectEstimateMan);
router.post("/VerifyEstMan", Service.VerifyEstMan);
router.post("/FindGpSeq", Service.FindGpSeq);
router.post("/DMSImportExcel", excelUpload, Service.DMSImportExcel);
router.post("/JobcardsTrack", Service.JobcardsTrack);
router.get("/GlanceExport", Service.GlanceExport);
router.post("/claimReport", Service.claimReport);

//Komal
router.post("/SavePicknDrop", Service.SavePicknDrop);
router.post("/PaymentMode", Service.PaymentMode);
router.post("/PickDropView", Service.PickDropView);
router.post("/PickDropViewForUpdate", Service.PickDropViewForUpdate);
router.post("/UpdateDataforPicknDrop", Service.UpdateDataforPicknDrop);
router.post("/PickDropBeforeView", Service.PickDropBeforeView);
router.post("/PickDropBeforeViewForMobile", Service.PickDropBeforeViewForMobile);

router.post("/FillDatabyRegNo", Service.FillDatabyRegNo);

//Not in Use
// router.post("/RegNo", Service.RegNo);
// router.post("/FillData", Service.FillData);
// router.post("/FillDatabyDMS", Service.FillDatabyDMS);







// new changes
router.post("/SaveInService", Service.SaveInService);
router.post("/InServiceView", Service.InServiceView);
router.post("/OutServiceView", Service.OutServiceView);



module.exports = router;
