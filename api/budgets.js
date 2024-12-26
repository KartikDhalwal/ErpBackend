const express = require("express");
const router = express.Router();
const budget = require("../routes/budget");

router.post("/master", budget.master);
router.post("/type",budget.type);
router.post("/insertData", budget.insertData);
router.post("/finOpenings", budget.finOpenings);
router.post("/BudgetView", budget.BudgetView);
router.post("/UpdateData", budget.UpdateData);
module.exports = router;
