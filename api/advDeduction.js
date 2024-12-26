const express = require("express");
const router = express.Router();
const advDeduction = require("../routes/advDeduction");

router.get("/LoanTable", advDeduction.LoanTable);
router.get("/LoanApprover1", advDeduction.LoanApprover1);
router.get("/LoanApprover2", advDeduction.LoanApprover2);
router.get("/LoanApprover3", advDeduction.LoanApprover3);
router.get("/LoanAccountview", advDeduction.LoanAccountview);
router.get("/LoanRequest", advDeduction.LoanRequest);
router.post("/viewapproal1dataforLoan", advDeduction.viewapproal1dataforLoan);
router.post("/viewapproal2dataforLoan", advDeduction.viewapproal2dataforLoan);
router.post("/viewapproal3dataforLoan", advDeduction.viewapproal3dataforLoan);
router.post("/LoanAccountviewdata", advDeduction.LoanAccountviewdata);
router.post("/LoanTableviewdata", advDeduction.LoanTableviewdata);
router.post("/Updateamountandmonth", advDeduction.Updateamountandmonth);
router.post("/findadvancedtldata", advDeduction.findadvancedtldata);
router.post("/saveadvLoanDed", advDeduction.insertData);
router.post("/findUser", advDeduction.findUser);
router.post("/approveby1Loan", advDeduction.approveby1);
router.post("/rejectby1Loan", advDeduction.rejectby1);
router.post("/approveby2Loan", advDeduction.approveby2);
router.post("/rejectby2Loan", advDeduction.rejectby2);
router.post("/approveby3Loan", advDeduction.approveby3);
router.post("/rejectby3Loan", advDeduction.rejectby3);
router.post("/canclerequest", advDeduction.cancle);
router.post("/updateremarkofaccount", advDeduction.updateremarkofaccount);

module.exports = router;
