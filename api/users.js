const express = require("express");
const router = express.Router();
const user = require("../routes/user");
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

router.get("/importformatapprovalmatrix", user.importformatapprovalmatrix);
router.post("/excelimportapprovalmatrix", excelUpload, user.excelimportapprovalmatrix);

router.get("/importformatuser", user.importformatuser);
router.post("/excelimportuser", excelUpload, user.excelimportuser);


router.get("/importformatuserrights", user.importformatuserrights);
router.post("/excelimportuserrights", excelUpload, user.excelimportuserrights);

router.post("/login", user.login);
router.post("/", user.insertData);

router.post("/savedealerrights", user.savedealerrights);
router.post("/findDealerRights", user.findDealerRights);

router.post("/update", user.updateData);
router.post("/all", user.findAll);
router.post("/getyear", user.getyear);
router.post("/approvalmatrix", user.approvalmatrix);
router.post("/findMatrixEmployees", user.findMatrixEmployees);
router.post("/BranchApi", user.BranchApi);
router.post("/approvalmatrixfindOne", user.approvalmatrixfindOne);
router.post("/approvalmatrixfindOneByLocation", user.approvalmatrixfindOneByLocation);
router.post("/approvalmatrixByLocation", user.approvalmatrixByLocation);
router.post("/approvalmatrixTransfer", user.approvalmatrixTransfer);
router.post("/findAllEmployee", user.findAllEmployee);
router.post("/MandatoryFields", user.MandatoryFields);
router.post("/MandatoryFieldsUpdate", user.MandatoryFieldsUpdate);
router.post("/whatsappmsg", user.whatsappmsg);
router.post("/ranawhatsapp", user.ranawhatsapp);
router.post("/passwordChange", user.passwordChange);
router.post("/dbauthenticate", user.dbauthenticate);
router.post("/Alldbauthenticate", user.Alldbauthenticate);
router.post("/StatementAccNo", user.StatementAccNo);
router.post("/GetStatement", user.GetStatement);
router.post("/ApprovalMatrixImport", user.ApprovalMatrixImport);
router.post("/MobileRightsUpdate", user.MobileRightsUpdate);
router.post("/SaveTemplateMobileRights", user.SaveTemplateMobileRights);
router.post("/MobileRightsGet", user.MobileRightsGet);
router.get("/MobileRightsDownload", user.MobileRightsDownload);
router.post("/MobileRightsAddExtra", user.MobileRightsAddExtra);
router.post("/MobileRightsRemoveExtra", user.MobileRightsRemoveExtra);
router.post("/MessageHistory", user.MessageHistory);
router.post("/findCompanyRights", user.findCompanyRights);
router.post("/saveCompanyRights", user.saveCompanyRights);
router.post("/addrelease", user.addrelease);
router.post("/updaterelease", user.updaterelease);
router.post("/findrelease", user.findrelease);
router.post("/findreleaseforlogin", user.findreleaseforlogin);
router.post("/:id", user.findOne);
module.exports = router;
