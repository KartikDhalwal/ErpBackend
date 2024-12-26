const express = require("express");
const router = express.Router();
const ExpenseAprvl = require("../routes/ExpenseAprvl");
const multer = require("multer");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
    },
  }).any();

router.post("/expense", ExpenseAprvl.expense);
router.post("/ApproveExpense", ExpenseAprvl.ApproveExpense);
router.post("/RejectExpense", ExpenseAprvl.RejectExpense);
router.post("/UpdateExpenseDetails",upload,ExpenseAprvl.UpdateExpenseDetails);



// expense management
router.post("/Alltemplates", ExpenseAprvl.Alltemplates);
router.post("/templateFetch", ExpenseAprvl.templateFetch);
router.post("/saveExpenseTemplate", ExpenseAprvl.saveExpenseTemplate);
router.post("/updateExpenseTemplate", ExpenseAprvl.updateExpenseTemplate);
router.post("/deleteTemplate", ExpenseAprvl.deleteTemplate);
router.post("/EditTemplate", ExpenseAprvl.EditTemplate);
router.post("/saveExpense",upload, ExpenseAprvl.saveExpense);
router.post("/viewExpense", ExpenseAprvl.viewExpense);
router.post("/ApproveViewExpense", ExpenseAprvl.ApproveViewExpense);
router.post("/approveMainExpense", ExpenseAprvl.approveMainExpense);
router.post("/RejectMainExpense", ExpenseAprvl.rejectMainExpense);
router.post("/viewExpenseLOcationReport", ExpenseAprvl.viewExpenseLOcationReport);
router.post("/dashboard", ExpenseAprvl.dashboard);





module.exports = router;
