const express = require("express");
const router = express.Router();
const insurance = require("../routes/insurance");
const multer = require("multer");
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([{ name: "excel", maxCount: 1 }]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();
router.get("/importformatmini", insurance.importformatmini);
router.get("/importformatexecutive", insurance.importformatexecutive);
router.post("/excelimportmini", excelUpload, insurance.excelimportmini);
router.post("/paymentimport", excelUpload, insurance.paymentimport);
router.post("/LeadEntry", insurance.insertLeadEntry);
router.post("/updateLeadEntry", insurance.updateLeadEntry);
router.post("/fetchData", insurance.fetchData);
router.post("/InsuViewData", insurance.InsuViewData);
router.post("/ManagerViewData", insurance.ManagerViewData);
router.post("/PolicyView", insurance.PolicyView);
router.post("/findLead", insurance.findLead);
router.post("/branch", insurance.branch);
router.post("/users", insurance.users);
router.get("/findcredata", insurance.findcredata);
router.get("/findallCre", insurance.findallCre);
router.post("/SaveCre", insurance.SaveCre);
router.post("/addcrecode", insurance.addcrecode);
router.post("/credashboard", insurance.credashboard);
router.post("/Insurancedashboard", insurance.Insurancedashboard);
router.post("/deliveryview", insurance.deliveryview);
router.post("/updatedelivery", insurance.updatedelivery);
router.post("/deliverydetailsfill", insurance.deliverydetailsfill);
router.post("/PaymentData", insurance.PaymentData);
router.post("/deliverycopy", upload, insurance.deliverycopy);
router.post("/uploadeddocument", upload, insurance.uploadeddocument);
router.post("/excelimportexecutive", excelUpload, insurance.excelimportexecutive);
router.post("/CreReport", insurance.CreReport);
router.post("/Documentshow", insurance.Documentshow);
router.post("/findany", insurance.findany);
router.post("/findanywithcre", insurance.findanywithcre);
router.get("/closeentries", insurance.closeentries);
router.post("/closeentriesupdate", excelUpload, insurance.closeentriesupdate);
router.post("/SaveExecutive", excelUpload, insurance.SaveExecutive);
router.post("/ViewExecutive", excelUpload, insurance.ViewExecutive);
router.post("/UpdateExecutive", insurance.UpdateExecutive);
router.get("/CreImport", insurance.CreImport);
router.get("/executivedata", insurance.executivedata);
router.post("/AllImported", insurance.AllImported);
router.post("/fetchcrename", insurance.fetchcrename);
router.get("/ManagerReport", insurance.ManagerReport);
router.get("/LeadAndDiscountRegisterReport", insurance.LeadAndDiscountRegisterReport);
router.get("/DailyExpiryReport", insurance.DailyExpiryReport);
router.get("/reassignreport", insurance.reassignreport);
router.get("/importformatpolicy", insurance.importformatpolicy);
router.post("/excelimportpolicy", excelUpload, insurance.excelimportpolicy);
router.post("/sendOtp", insurance.sendOtp);
router.post("/CancleViewData", insurance.CancleViewData);
router.get("/ReassignTemplete", insurance.ReassignTemplete);
router.post("/ReassignTempleteimport", excelUpload, insurance.ReassignTempleteimport);




module.exports = router;
