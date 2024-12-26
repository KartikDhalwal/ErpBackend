const express = require("express");
const router = express.Router();
const employee = require("../routes/employee");
const multer = require("multer");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([
 { name: "profile", maxCount: 1 },
  { name: "adhar", maxCount: 1 },
  { name: "pan", maxCount: 1 },
  { name: "salary", maxCount: 1 },
  { name: "other", maxCount: 1 },
]);


const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([{ name: "excel", maxCount: 1 }]);


router.post("/all", employee.findAll);
router.post("/masters", employee.findMasters);
router.post("/EmployeeMasterView", employee.EmployeeMasterView);
router.post("/excelimport", excelUpload, employee.excelimport);
router.post("/excelimportmini", excelUpload, employee.excelimportmini);
router.post("/salaryImport", excelUpload, employee.salaryImport);
router.get("/importformatsalary", employee.importformatsalary);
router.get("/importformat", employee.importformat);
router.get("/importformatmini", employee.importformatmini)
router.post("/SmEmplMasters", employee.SmEmplMasters);
router.post("/SmEmplData", employee.SmEmplData);
// router.post("/update/salary/:id", employee.updateSalary);
router.post("/", upload,  employee.insertData);

router.post("/savemini", employee.insertDatamini);
router.post("/AssetDetailsSave", employee.AssetDetailsSave);
router.post("/UpdateAssets", employee.UpdateAssets);
router.post("/mini/:id", employee.findOnemini);
router.post("/updatemini/:id", employee.updateDatamini);
router.post("/update/:id", upload, employee.updateData);
router.post("/AssetDetailsEmp/:id", employee.AssetDetailsEmp);
router.post("/:id", employee.findOne);

module.exports = router;
