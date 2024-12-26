const express = require("express");
const router = express.Router();
const Payment_Tracker = require("../routes/Payment_Tracker");
const multer = require("multer");
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
    },
}).any();
//discount approval
router.get("/", Payment_Tracker.showrecipt);
router.post("/", Payment_Tracker.SaveData);
router.post("/PreData", Payment_Tracker.PreData);
router.post("/viewpaymentapproaldata", Payment_Tracker.viewpaymentapproaldata);
router.post("/approveby2", Payment_Tracker.approveby2);
router.post("/rejectby2", Payment_Tracker.rejectby2);
router.post("/updatediscountamountonly", Payment_Tracker.updatediscountamountonly);
router.post("/Update", Payment_Tracker.Update);
router.post("/PaymentBranchwise", Payment_Tracker.PaymentBranchwise);
router.post("/PaymentBranchwisesummary", Payment_Tracker.PaymentBranchwisesummary);

// router.post("/getlabels", discount.getlabels);
// router.post("/viewDiscountReport", discount.viewDiscountReport);
// router.post("/discountreportUserwise", discount.discountreportUserwise);
// router.post("/discountreportBranchwise", discount.discountreportBranchwise);
// router.get("/DiscountReport", discount.DiscountReport);
// router.post("/disc3", discount.disc3);
// router.post("/findvarient", discount.findvarient);
// router.post("/savediscountapproval", discount.savediscountapproval);
// router.post("/findphonenumber", discount.findphonenumber);
// router.post("/finddataofapproval1", discount.finddataofapproval1);
// router.post("/updatediscountapproval1", discount.updatediscountapproval1);
// router.post("/viewdiscountapproaldata", discount.viewdiscountapproaldata);
// router.post("/approveby2", discount.approveby2);
// router.post("/rejectby2", discount.rejectby2);
// router.post("/findone", discount.findone);
// router.post("/reapproval", discount.reapproval);
// router.post("/disc5", discount.disc5);
// router.post("/updatediscountamountonly", discount.updatediscountamountonly);
// router.post("/gdapprover", discount.gdapprover);
// router.post("/viewgdapproaldata", discount.viewgdapproaldata);
// router.post("/disc7", discount.disc7);
// router.post("/findgdfdidata", discount.findgdfdidata);
// router.post("/viewdiscountapproaldataforapr1", discount.viewdiscountapproaldataforapr1);
// router.post("/discount-grid-apr1", discount.disc8);
// router.post("/reapperovalby2", discount.reapperovalby2);
// router.post("/viewold", discount.viewold);
// router.post("/viewdiscountaccount", discount.viewdiscountaccount);
// router.post("/checked", discount.checked);
// router.post("/uploadeddocument", upload, discount.uploadeddocument);


// router.post("/recentviewdiscountapproaldata", discount.recentviewdiscountapproaldata);
// router.post("/recentapproveby2", discount.recentapproveby2);
// router.post("/recentrejectby2", discount.recentrejectby2);



// router.post('/discountoffer', discount.discountoffer)
// router.post('/savediscountoffer', discount.savediscountoffer)
// router.post('/updatediscountoffer', discount.updatediscountoffer)

// router.post('/viewbooking', discount.viewbooking)

// router.post('/viewDiscountReportrana', discount.viewDiscountReportrana)

module.exports = router;
