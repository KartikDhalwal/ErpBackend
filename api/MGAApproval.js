const express = require("express");
const router = express.Router();
const MGAApproval = require("../routes/MGAApproval");
const multer = require("multer");
const upload1 = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([
  { name: "VendorDocument", maxCount: 1 },
]);

router.post("/InsertData", MGAApproval.InsertData);
router.post("/CustomerDetails", MGAApproval.CustomerDetails);
router.post("/EmployeeView", MGAApproval.EmployeeView);
router.post("/MGAViewDtl", MGAApproval.MGAViewDtl);
router.post("/MGAApproverView", MGAApproval.MGAApproverView);
router.post("/approveby2MGA", MGAApproval.approveby2MGA);
router.post("/rejectby2forMGA", MGAApproval.rejectby2forMGA);
router.post("/CustomerDetailsForApprover", MGAApproval.CustomerDetailsForApprover);
router.get("/CustomerViewViaMsg", MGAApproval.CustomerViewViaMsg);
router.post("/UpdateForCustomer", MGAApproval.UpdateForCustomer);
router.post("/MGAReport", MGAApproval.MGAReport);
router.post("/MGAUpdate", MGAApproval.MGAUpdate);
router.post("/Updatedata", MGAApproval.Updatedata);


router.post("/Dashboard", MGAApproval.Dashboard);
router.post("/MGABillAmt", MGAApproval.MGABillAmt);
router.post("/ShowCustomerdtlAmt", MGAApproval.ShowCustomerdtlAmt);




module.exports = router;  