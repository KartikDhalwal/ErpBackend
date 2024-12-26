const express = require("express");
const router = express.Router();
const Dealsheet = require("../routes/Dealsheet");
const multer = require("multer");
const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
    },
}).fields([{ name: "excel", maxCount: 1 }]);


router.get("/", Dealsheet.showrecipt);
router.post("/", Dealsheet.SaveData);
router.post("/PreData", Dealsheet.PreData);
router.post("/Varient", Dealsheet.Varient);
router.post("/findprices", Dealsheet.findprices);
router.post("/mydeals", Dealsheet.mydeals);
router.post("/finddetails", Dealsheet.finddetails);
router.post("/viewpaymentapproaldata", Dealsheet.viewpaymentapproaldata);
router.post("/approveby2", Dealsheet.approveby2);
router.post("/rejectby2", Dealsheet.rejectby2);
router.post("/updatediscountamountonly", Dealsheet.updatediscountamountonly);
router.post("/Update", Dealsheet.Update);
router.post("/PaymentBranchwise", Dealsheet.PaymentBranchwise);
router.post("/PaymentBranchwisesummary", Dealsheet.PaymentBranchwisesummary);
router.post("/SaveParameter", Dealsheet.SaveParameter);
router.post("/UpdateParameter", Dealsheet.UpdateParameter);
router.post("/findMasterdata", Dealsheet.findMasterdata);
router.get("/importformatdispatch", Dealsheet.importformatdispatch);
router.get("/importformatmaruti", Dealsheet.importformatmaruti);
router.post("/excelimportmini", excelUpload, Dealsheet.excelimportmini);
router.post("/excelimportmarutioffers", excelUpload, Dealsheet.excelimportmarutioffers);
router.post("/ViewInsuranceCompany", Dealsheet.ViewInsuranceCompany);
router.post("/SaveInsuranceCompany", Dealsheet.SaveInsuranceCompany);
router.post("/UpdateInsuranceCompany", Dealsheet.UpdateInsuranceCompany);


module.exports = router;
