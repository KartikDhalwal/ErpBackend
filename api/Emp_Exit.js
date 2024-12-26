const express = require("express");
const router = express.Router();
const Emp_Exit = require("../routes/Emp_Exit");
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
 


router.post("/getempdata",Emp_Exit.getempdata);
router.post("/findhodbelowemp",Emp_Exit.findhodbelowemp);
router.post("/findMasters",Emp_Exit.findMasters);
router.post("/saveempexit",Emp_Exit.saveempexit);
router.post("/getExitempforhod",Emp_Exit.getExitempforhod);
router.post("/saveempexitByHOD",Emp_Exit.saveempexitByHOD);
router.post("/GetHrViewData",Emp_Exit.GetHrViewData);
router.post("/saveempexitByHR",Emp_Exit.saveempexitByHR);
router.post("/GetCEOViewData",Emp_Exit.GetCEOViewData);
router.post("/finddepart",Emp_Exit.finddepart);

 



 

 
module.exports = router;
