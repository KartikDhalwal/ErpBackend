const express = require("express");
const router = express.Router();
const reminder = require("../routes/reminder");

router.post("/addreminderpost", reminder.addreminderpost);
router.get("/reminder", reminder.home);

router.get("/addreminder", reminder.addreminder);
router.get("/updatereminder", reminder.updatereminder);
router.post("/updatereminderpost", reminder.updatereminderpost);
router.post("/addreminderforotherpost", reminder.addreminderforotherpost);
router.post("/deletereminder", reminder.deletereminder);
router.get("/expiredreminder", reminder.expiredreminder);
router.get("/activate", reminder.activatereminder);
router.get("/addreminderforteam", reminder.addreminderforteam);
router.post("/findreminder", reminder.findreminder);

module.exports = router;
