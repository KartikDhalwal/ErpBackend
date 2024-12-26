const express = require("express");
const router = express.Router();
const TvCostSheet = require("../routes/TvCostSheet");
const multer = require("multer");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fieldSize: 100 * 1024 * 1024,
    },
  }).any();
router.post("/insertData", TvCostSheet.insertData);
router.post("/UpdateData", TvCostSheet.UpdateData);
router.post("/insertDataSale",upload, TvCostSheet.insertDataSale);
router.post("/insertDataPur", TvCostSheet.insertDataPur);
router.post("/UpdatePur", TvCostSheet.UpdatePur);
router.post("/UpdateSale",upload, TvCostSheet.UpdateSale);
router.post("/PendingPurchaseData", TvCostSheet.PendingPurchaseData);
router.post("/PendingSaleData", TvCostSheet.PendingSaleData);
router.post("/findMasters", TvCostSheet.findMasters);
router.post("/TvView", TvCostSheet.TvView);
router.post("/nonDelivered", TvCostSheet.nonDelivered);
router.post("/Delivered", TvCostSheet.Delivered);
router.post("/findEmployee", TvCostSheet.findEmployee);
router.post("/PendingSaleDataManual", TvCostSheet.PendingSaleDataManual);
router.post("/PrintData", TvCostSheet.PrintData);
router.post("/GetLedgerDataManual", TvCostSheet.GetLedgerDataManual);
router.post("/GetLedgerDataDMS", TvCostSheet.GetLedgerDataDMS);
router.post("/TvViewManual", TvCostSheet.TvViewManual);
router.post("/TvApprView", TvCostSheet.TvApprView);
router.post("/ApproveTvTran", TvCostSheet.ApproveTvTran);
router.post("/RejectTvTran", TvCostSheet.RejectTvTran);
router.post("/VerificationReq", TvCostSheet.VerificationReq);
router.post("/DelvrUpdate", TvCostSheet.DelvrUpdate);
router.post("/TvDashBoard", TvCostSheet.TvDashBoard);
router.post("/nonDeliveredDms", TvCostSheet.nonDeliveredDms);
router.post("/TvApprViewDms", TvCostSheet.TvApprViewDms);
router.post("/PurReport", TvCostSheet.PurReport);
router.post("/SaleReport", TvCostSheet.SaleReport);
router.post("/ReVerificationReq", TvCostSheet.ReVerificationReq);
router.post("/IcmRegister", TvCostSheet.IcmRegister);
router.post("/StockReport", TvCostSheet.StockReport);
router.post("/IcmRegisterNew", TvCostSheet.IcmRegisterNew);
router.post("/CancelSale", TvCostSheet.CancelSale);
router.post("/DeliveredDMs", TvCostSheet.DeliveredDMs);
router.post("/PostPurchase", TvCostSheet.PostPurchase);
router.post("/UnpostPurchaseData", TvCostSheet.UnpostPurchaseData);
router.post("/FindDMSBillsData", TvCostSheet.FindDMSBillsData);
router.post("/CreateNewLedgerOldCar", TvCostSheet.CreateNewLedgerOldCar);
router.post("/UpdateLastOffer", TvCostSheet.UpdateLastOffer);
router.post("/TVAuditSave", upload ,TvCostSheet.TVAuditSave);
router.post("/PurEnqSave" , TvCostSheet.PurEnqSave);
router.post("/PurEnqUpdate" , TvCostSheet.PurEnqUpdate);
router.post("/PurchaseEnquiryData" , TvCostSheet.PurchaseEnquiryData);
router.post("/sendVerification" , TvCostSheet.sendVerification);
router.post("/TvApprViewPurchase" , TvCostSheet.TvApprViewPurchase);
router.post("/ApproveTvPurchase" , TvCostSheet.ApproveTvPurchase);
router.post("/RejectTvPurchase" , TvCostSheet.RejectTvPurchase);
router.post("/TvViewDo" , TvCostSheet.TvViewDo);
router.post("/insertDataApproval" , TvCostSheet.insertDataApproval);
router.post("/DoHandover" , TvCostSheet.DoHandover);


module.exports = router;