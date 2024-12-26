const express = require("express");
const router = express.Router();
const pot_cust = require("../routes/pot_cust");
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
 


router.post("/savepotcust",pot_cust.savepotcust);
router.post("/getsavedata",pot_cust.getsavedata);
router.post("/getPOT_CUST_DTL",pot_cust.getPOT_CUST_DTL);
router.post("/updatepotcust",pot_cust.updatepotcust);
router.post("/updatespm",pot_cust.updatespm);
router.post("/inventoryitem",pot_cust.inventoryitem);
router.post("/deleterow",pot_cust.deleterow);






router.post("/getsendwishemp",pot_cust.getsendwishemp);
router.post("/sendwishonwhatsapp",pot_cust.sendwishonwhatsapp);



 

 
module.exports = router;
