const express = require("express");
const router = express.Router();
const finpayout = require("../routes/finpayout");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([{ name: "excel", maxCount: 1 }]);

router.post("/UploadImages", upload, finpayout.UploadImages);
//finance payout
router.post("/payoutdataloc", finpayout.payoutdataloc);
router.post("/payout", finpayout.payout);
router.post("/payoutdata", finpayout.payoutdata);
router.post("/viewfinancedetailstable", finpayout.viewfinancedetailstable);
router.post("/updateFINANCEDETAILS", finpayout.updateFINANCEDETAILS);
router.post("/payoutpaymentpendingTable", finpayout.payoutpaymentpendingTable);
router.post("/viewpayoutpendingTable", finpayout.viewpayoutpendingTable);
router.post("/viewpayoutconvert", finpayout.viewpayoutconvert);
router.post("/viewpayoutdocument", finpayout.viewpayoutdocument);
router.post("/viewpendingdatainvoice", finpayout.viewpendingdatainvoice);
router.post("/viewpendingdatainvoicepre", finpayout.viewpendingdatainvoicepre);
router.post("/payoutpaymentreceivedTable", finpayout.payoutpaymentreceivedTable);
router.post("/searchpayoutpendingData", finpayout.searchpayoutpendingData);
router.post("/updatebankdetails", finpayout.updatebankdetails);
router.post("/findfinancedata", finpayout.findfiannceata);

router.post("/searchfinanceapprove", finpayout.searchfinanceapprove);
router.post("/updatefinance1", finpayout.updatefinance1);
router.post("/invoicegenerate", finpayout.invoicegenerate);
router.post("/invoiceDetailssave", finpayout.invoiceDetailssave);
router.post("/payoutactualchnage", finpayout.payoutactualchnage);
router.post("/sendemail", finpayout.sendemail);
router.post("/payoutfinancereport", finpayout.payoutfinancereport);

router.post("/paymentimport", excelUpload, finpayout.paymentimport);
router.get("/importformat", finpayout.importformat);

//all branches of sales
router.post("/findallbranches", finpayout.findallbranches);
router.post("/Savefinancer", finpayout.Savefinancer);
router.post("/Updatefinancer", finpayout.Updatefinancer);
router.post("/findMasterdata", finpayout.findMasterdata);
router.post("/findpayout", finpayout.findpayout);
router.post("/payoutvariencereport", finpayout.payoutvariencereport);
router.post("/EntryPrint", finpayout.EntryPrint);
router.post("/EntryPrint1", finpayout.EntryPrint1);
router.post("/changefintype", finpayout.changefintype);
router.post("/ViewFinancers", finpayout.ViewFinancers);
router.post("/SaveFinancers", finpayout.SaveFinancers);
router.post("/updateFinancers", finpayout.UpdateFinancers);
router.post("/payoutFLDPreport", finpayout.payoutFLDPreport);
router.post("/payoutfinancersegmenteport", finpayout.payoutfinancersegmenteport);
router.post("/payout2", finpayout.payout2);
router.post("/payout3", finpayout.payout3);


//preinvoice download
router.post('/downloadprintout', finpayout.downloadprintout)





module.exports = router;
