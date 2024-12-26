const express = require("express");
const router = express.Router();
const mobile = require("../routes/mobile");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([
  { name: "punchIn", maxCount: 1 },
  { name: "punchOut", maxCount: 1 },
]);

const uploadtravel = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();


// API for mobile App and some are for erp.autovyn.com also
// repaired by Mohit Tater 
router.get("/GetVersionInfo", mobile.GetVersionInfo);
router.get("/getAttendance1", mobile.getAttendance1);
router.get("/getEmpDesignation", mobile.getEmpDesignation);
router.get("/GetMStatus", mobile.GetMStatus);
router.get("/getGatePassEmployeeGuard", mobile.getGatePassEmployeeGuard);
router.get("/getGatePassInfoSelf", mobile.getGatePassInfoSelf);
router.get("/getGatePassEmployee", mobile.getGatePassEmployee);
router.get("/approveGatePass", mobile.approveGatePass);
router.get("/applyGatePass", mobile.applyGatePass);
router.get("/gatePassInOut", mobile.gatePassInOut);
router.get("/IsProfileFilled",mobile.IsProfileFilled);
router.get("/GetCompanyBranches", mobile.GetCompanyBranches);
router.get("/GetCities", mobile.GetCities);
router.get("/GetStates", mobile.GetStates);
router.get("/GetOccupations", mobile.GetOccupations);
router.get("/getMPList", mobile.getMPList);
router.get("/getMPRemarksList", mobile.getMPRemarksList);
router.post("/uploadMisspunch", upload, mobile.uploadMisspunch);
router.get("/AddMispunchRequest_New", mobile.AddMispunchRequest_New);
router.get("/getMispunch_Employee_new", mobile.getMispunch_Employee_new);
router.get("/ApproveAttendance_New", mobile.ApproveAttendance_New);
router.get("/checkLogin", mobile.checkLogin);
router.get("/updateFcm", mobile.updateFcm);
router.get("/getPendingAppList", mobile.getPendingAppList);
router.get("/AddPunchIN", mobile.AddPunchIN);
router.get("/AddPunchOUT", mobile.AddPunchOUT);
router.post("/uploadAttendance", upload, mobile.uploadAttendance);
router.get("/GetDeviceLog", mobile.GetDeviceLog);
router.get("/GetDeviceLogDetails", mobile.GetDeviceLogDetails);
router.get("/updateEmpLocation", mobile.updateEmpLocation);
router.get("/viewTravelExpence", mobile.viewTravelExpence);
router.post("/addTravelExpense",uploadtravel, mobile.addTravelExpense);
router.get("/getExpenseTypeList", mobile.getExpenseTypeList);
router.post("/saveTheme", mobile.updateAppTheme);
router.get("/demogetpassguardview", mobile.demogetpassguardview);
router.post("/getShiftTime", mobile.getShiftTime);


router.get("/getMasterData", mobile.getMasterData);
router.get("/EditMispunchRequest", mobile.EditMispunchRequest);
router.get("/MispunchRequestList", mobile.MispunchRequestList);
router.get("/GetEmployeeList", mobile.GetEmployeeList);
router.get("/getCandidateDetails", mobile.getCandidateDetails);
router.get("/updateCandidateDetails", mobile.updateCandidateDetails);

//this is pending
router.get("/getEmpProfile", mobile.getEmpProfile);
router.get("/updateEmpProfile", mobile.updateEmpProfile);

//kartik
router.get("/GetAllEmployeeList", mobile.GetAllEmployeeList);
router.get("/getMispunch_Employee", mobile.getMispunch_Employee);

router.get("/GetLocationLog", mobile.GetLocationLog);
router.get("/getLocations", mobile.getLocations);
router.get("/getDept", mobile.getDept);
router.get("/getGroup", mobile.getGroup);
router.get("/getLeave_Employee", mobile.getLeave_Employee);
router.get("/LeaveList", mobile.LeaveList);
router.get("/getAttendanceLog", mobile.getAttendanceLog);
router.get("/getAttendanceLogNew", mobile.getAttendanceLogNew);
router.get("/AddLeave", mobile.AddLeave);
router.get("/getAttendanceDetails", mobile.getAttendanceDetails);
router.get("/getCandidateList", mobile.getCandidateList);
router.get("/getAttendanceDetailsNew", mobile.getAttendanceDetailsNew);

router.post("/MonthMaster", mobile.MonthMaster);
router.post("/MonthMasterRange", mobile.MonthMasterRange);
// API BY KOMAL NUWAL
//har jeet ka fasla
router.get("/demogetpassapprove", mobile.demogetpassapprove);
router.get("/demogetpassinout", mobile.demogetpassinout);
router.get("/demogetpassadd", mobile.demogetpassadd);
router.get("/modelnamefetch", mobile.modelnamefetch);
router.get("/demogetpassview", mobile.demogetpassview);
router.get("/demogetpassapr1", mobile.demogetpassapr1);
router.get("/getGetFCMTokenOfManager", mobile.getGetFCMTokenOfManager);
router.get("/rejectExpense", mobile.rejectExpense);
router.get("/approveExpense", mobile.approveExpense);

//MOHIT

router.get("/GetMsgEmployeeList", mobile.GetMsgEmployeeList);
router.get("/getMsgDtl", mobile.getMsgDtl);
router.get("/addMsg", mobile.addMsg);
router.get("/getLiveLocation", mobile.getLiveLocation);
router.get("/updateGeofence", mobile.updateGeofence);
router.get("/checkLocationInOut", mobile.checkLocationInOut);
router.get("/getPunchingInfo", mobile.getPunchingInfo);
router.get("/GetEmpDed", mobile.GetEmpDed);
router.get("/GetEmployeeListNew", mobile.GetEmployeeListNew);
router.get("/GetEmployeeListGatePass", mobile.GetEmployeeListGatePass);
router.get("/getEmpTrack", mobile.getEmpTrack);
router.get("/GetEmployeeListGatePassForNotification", mobile.GetEmployeeListGatePassForNotification);
router.get("/GetFcmOfManagerInGatepass", mobile.GetFcmOfManagerInGatepass);


//Payslip
router.post("/PaySlipData", mobile.PaySlipData);
router.post("/AtnStatus", mobile.AtnStatus);
router.post("/UpdateAtnStatus", mobile.UpdateAtnStatus);
router.post("/DeleteAtnStatus", mobile.DeleteAtnStatus);

router.post("/LeaveTypes", mobile.LeaveTypes);
router.post("/AddLeave", mobile.AddLeave);
router.post("/getLeaveData", mobile.getLeaveData);
router.post("/ApproveLeave", mobile.ApproveLeave);

//Announsments
router.post("/insertAnnouncement", uploadtravel,mobile.addAnnouncement);
router.post("/getAnnouncements", mobile.getAnnouncements);
router.post("/getUserAnnouncements", mobile.getUserAnnouncements);
router.post("/getAnnouncementTemplates", mobile.getAnnouncementTemplates);
router.post("/updateAnnouncementStatus", mobile.updateAnnouncementStatus);
router.post("/getPendingAnnouncement", mobile.getPendingAnnouncement);
router.get("/EmployeeImagesRar", mobile.EmployeeImagesRar);
router.post("/GatePassDashboard", mobile.GatePassDashboard);
router.post("/GatePassDashboardEmployee", mobile.GatePassDashboardEmployee);

// Api Provided by Gourav Shimli Design Engineer and Android Developer 
//pending task
router.post("/getPendingTasks", mobile.getPendingTasks);
router.post("/getBirthdayEmployee", mobile.getBirthdayEmployee);
router.post("/insertWish", mobile.insertWish);

////complaints
router.post("/raiseComplaint",uploadtravel, mobile.raiseComplaint);
router.post("/getTaggedComplaints", mobile.getTaggedComplaints);
router.post("/submitRemark", mobile.submitRemark);
router.post("/getSelfComplaints", mobile.getSelfComplaints);
router.post("/getComplaintResponseFromComplaint", mobile.getComplaintResponseFromComplaint);
router.post("/submitStatus", mobile.submitStatus);

module.exports = router;
