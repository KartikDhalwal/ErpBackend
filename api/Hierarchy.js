const express = require("express");
const router = express.Router();
const hierarchyRoute = require("../routes/hierarchyRoute");

router.post("/insertData", hierarchyRoute.insertData);
router.post("/findAllLevels", hierarchyRoute.findAllLevels);


module.exports = router;