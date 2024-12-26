const express = require("express");
const router = express.Router();
const interview = require("../routes/interview");

const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();

//   .fields([
//     { name: "image", maxCount: 1 },
//     { name: "image1", maxCount: 1 },
//     { name: "image2", maxCount: 1 },
//     { name: "image3", maxCount: 1 },
//     { name: "image4", maxCount: 1 },
//     { name: "image5", maxCount: 1 },
//     { name: "image6", maxCount: 1 },
//   ]);

//router.get("/", insurance.insurance);

router.post("/candreg", interview.candreg);
router.post("/insertnewcandidate", upload, interview.insertnewcandidate);
router.post("/insertnewcandidatehr",interview.insertnewcandidatehr);
router.post("/interviewcanidates", interview.interviewcanidates);
router.post("/rejectcanidates", interview.rejectcanidates);
router.post("/shortlistcandidate", interview.shortlistcandidate);
router.post("/shortlistedcandi", interview.shortlistedcandi);
// router.post("/getcandidatetranId", interview.getcandidatetranId);
router.post("/getcandidata", interview.getcandidata);
router.post("/allemployee", interview.allemployee);
router.post("/update1interview", interview.update1interview);
router.post("/update2interview", interview.update2interview);
router.post("/update3interview", interview.update3interview);
router.post("/update4interview", interview.update4interview);
router.post("/Schedule1interview", interview.Schedule1interview);
router.post("/Schedule2interview", interview.Schedule2interview);
router.post("/Schedule3interview", interview.Schedule3interview);
router.post("/Schedule4interview", interview.Schedule4interview);
router.post("/candidateresult", interview.candidateresult);
router.post("/empupdate",upload, interview.empupdate);
router.post("/PrintHeader", interview.PrintHeader);
router.post("/findMasters", interview.findMasters);
router.post("/gethrentry", interview.gethrentry);
router.post("/updatenewcandidate", upload, interview.updatenewcandidate);
router.post("/sendwhatsapp", interview.sendwhatsapp);
router.post("/getonedata", interview.getonedata);
router.post("/hrformupdate", interview.hrformupdate);
router.post("/finallyselectedbyhr", interview.finallyselectedbyhr);
router.post("/finallyrejectedbyhr", interview.finallyrejectedbyhr);
router.post("/createempmaster", interview.createempmaster);
router.post("/removefromempmaster", interview.removefromempmaster);
router.post("/getmaxemployeeno", interview.getmaxemployeeno);
 

// router.post("/rowdatashortlistbytranid", interview.rowdatashortlistbytranid);






module.exports = router;

