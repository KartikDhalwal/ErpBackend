const express = require("express");
const router = express.Router();
const getpass = require("../routes/getpass");
//discount approval
router.post("/", getpass.insertgetpass);
router.post("/update", getpass.updategetpass);
router.post("/findcust", getpass.findcust);
router.post("/findmaster", getpass.findmaster);
router.post("/viewgetpass", getpass.viewgetpass);
router.post("/findvarient", getpass.findvarient);
router.post("/findgetpass", getpass.findgetpass);
router.post("/finddatabyvin", getpass.finddatabyvin);
router.post("/findgetpassprint", getpass.findgetpassprint);


module.exports = router;
