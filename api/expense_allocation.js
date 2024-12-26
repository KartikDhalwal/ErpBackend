const express = require("express");
const router = express.Router();
const expense_allocation = require("../routes/expense_allocation");
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

router.post("/expenseledger", expense_allocation.expenseledger);
// router.post("/saveexpense", expense_allocation.saveexpense);
router.post("/updateexpense", expense_allocation.updateexpense);
router.post("/ExpAllotdata", expense_allocation.ExpAllotdata);


router.post("/Brexpsubmit", expense_allocation.Brexpsubmit);
router.post("/BrExpData", expense_allocation.BrExpData);
router.post("/Brexpupdate", expense_allocation.Brexpupdate);



router.post("/savenewcarppc", expense_allocation.savenewcarppc)
router.post("/viewcarppc", expense_allocation.viewcarppc);
router.post("/updatenewcarppc", expense_allocation.updatenewcarppc);

 
module.exports = router;
