const express = require("express");
const router = express.Router();
const dash = require("../routes/dashboards");
const multer = require("multer");
const excelUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
    },
}).fields([{ name: "excel", maxCount: 1 }]);

router.post("/SalesData2", dash.SalesData2);
router.post("/discountDashBoard", dash.discountDashBoard);
router.post("/discountDashBoard2", dash.discountDashBoard2);
router.post("/WorkshopDashBoard", dash.WorkshopDashBoard);
router.post("/modalwisedata", dash.modalwisedata);
router.post("/Modeldaywisemodels", dash.Modeldaywisemodels);
router.post("/modaldaywisedata", dash.modaldaywisedata);
router.post("/AttendanceDash", dash.AttendanceDash);
router.post("/AttendanceDashAbst", dash.AttendanceDashAbst);
router.post("/abstmonthg", dash.abstmonthg);
router.post("/LateComersg", dash.LateComersg);
router.post("/deprtemp", dash.deprtemp);
router.post("/bankbal", dash.bankbal);
router.post("/cashBal", dash.cashBal);
router.post("/MissPunchDashboard", dash.MissPunchDashboard);
router.post("/nomobile/SalesData", dash.SalesData);
router.post("/SalesData", dash.SalesData);
router.post("/nomobile/WorkshopDashBoard2", dash.WorkshopDashBoard2);
router.post("/WorkshopDashBoard2", dash.WorkshopDashBoard2);
router.post("/nomobile/HrDashBoard", dash.HrDashBoard);
router.post("/HrDashBoard", dash.HrDashBoard);


router.post("/discountDashBoardseva", dash.discountDashBoardseva);
router.post("/workshopDashBoardseva", dash.workshopDashBoardseva);
router.post("/workshopLabourDashBoardseva", dash.workshopLabourDashBoardseva);
router.post("/bodyshopLoadDashBoardseva", dash.bodyshopLoadDashBoardseva);
router.post("/bodyshopLabourDashBoardseva", dash.bodyshopLabourDashBoardseva);
router.post("/bodyshopSparesDashBoardseva", dash.bodyshopSparesDashBoardseva);
router.post("/workshopSparesDashBoardseva", dash.workshopSparesDashBoardseva);

router.post("/workshopLabourdiscountDashBoardseva", dash.workshopLabourdiscountDashBoardseva);
router.post("/bodyshopLabourdiscountDashBoardseva", dash.bodyshopLabourdiscountDashBoardseva);
router.post("/workshopSpearsdiscountDashBoardseva", dash.workshopSpearsdiscountDashBoardseva);
router.post("/bodyshopSpearsdiscountDashBoardseva", dash.bodyshopSpearsdiscountDashBoardseva);
router.post("/VasDashboard", dash.VasDashboard);
router.get("/VasGlanceExport", dash.VasGlanceExport);


router.post("/Stockandbooking", dash.Stockandbooking);
router.post("/Predata", dash.Predata);

router.post("/newcarsalerepoort", dash.newcarsalerepoort);


router.post("/excelimportmini", excelUpload, dash.excelimportmini);

router.get("/importformatmini", dash.importformatmini);
router.post("/newcarrtorepoort", dash.newcarrtorepoort);
router.post("/newcarrtototalrepoort", dash.newcarrtototalrepoort);



router.post("/liveStock", dash.liveStock);
router.post("/DeliveredStock", dash.DeliveredStock);
router.post("/modelGroups", dash.modelGroups);


router.post("/savevahandetails", dash.savevahandetails);
router.post("/updatevahandetails", dash.updatevahandetails);

//stock management
router.get("/importformatdispatch", dash.importformatdispatch);
router.post("/excelimportdispatch", excelUpload, dash.excelimportdispatch);

router.post("/SaveInternal", dash.SaveInternal);
router.post("/UpdateInternal", dash.UpdateInternal);


router.post("/SaveParameter", dash.SaveParameter);
router.post("/UpdateParameter", dash.UpdateParameter);
router.post("/findMasterdata", dash.findMasterdata);



//profit dashboards
router.post("/workshopDashBoardProfit", dash.workshopDashBoardProfit);
router.post("/bodyshopDashBoardProfit", dash.bodyshopDashBoardProfit);
router.post("/stockview", dash.stockview);
router.get("/workshop_profit_report", dash.workshop_profit_report);

//quantative dashboard
router.post("/Quantative_Dashboard", dash.Quantative_Dashboard);

module.exports = router;
