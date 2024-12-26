const cluster = require('cluster');
const os = require('os');

if (cluster.isMaster) {
  const numCPUs = os.cpus().length;

  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Starting a new worker');
    cluster.fork();
  });

} else {
const { urlencoded } = require("body-parser");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");

const { authenticateUser } = require("./middleware/auth");
const cors = require("cors");

const Mobile = require("./api/mobile");
const AdvDeduction = require("./api/advDeduction");
const Master = require("./api/Master");
const groupMaster = require("./api/groupMaster");
const template = require("./api/template");
const EmpDed = require("./api/EmpDed");
const newJoining = require("./api/newJoining");
const employee = require("./api/employee");
const branch = require("./api/branch");
const ars = require("./api/ars");
const finpayout = require("./api/finpayout");
const discount = require("./api/discount");
const user = require("./api/users");
const pettyCash = require("./api/pettyCash");
const insurance = require("./api/insurance");
const hrmsreport = require("./api/hrmsreport");
const Hierarchy = require("./api/Hierarchy");
const dashboards = require("./api/dashboards");
const Reminder = require("./api/reminder");
const Tvicm = require("./api/Tvicm");
const budget = require("./api/budgets");
const panAndAdharApi = require("./api/panAndAdharApi");
const interview = require("./api/interview");
const fuel = require("./api/fuel");
const ExpenseAprvl = require("./api/ExpenseAprvl");
const Ledger = require("./api/ledgMst");
const Accounts = require("./api/accounts");
const Refund = require("./api/refund");
const inventory = require("./api/inventory");
const ManualDiscount = require('./api/manualdiscount');
const DemoCar = require("./api/DemoCar")
const Asset = require("./api/Asset")
const VendorPayProcess = require("./api/VendorPayProcess");
const Incentive = require("./api/Incentive");
const Service = require("./api/Service");
const Tds = require('./api/tds')
const BodyShop = require("./api/BodyShop");
const quotation = require("./api/quotation");
const BookAlot = require("./api/BookAlot");
const pot_cust = require("./api/pot_cust");
const icmTracker = require("./api/icmTracker");
const expense_allocation = require("./api/expense_allocation");
const PartSuggestive = require("./api/PartSuggestive");
const Daily_Task = require("./api/Daily_Task");
const Emp_Exit = require("./api/Emp_Exit");
const MGAApproval = require("./api/MGAApproval")
const cash_sheet = require("./api/cash_sheet");
const NewCarAudit = require("./api/NewCarAudit");
const icm = require("./api/icm");
const DocManage = require("./api/DocManage");
const Payment_Tracker = require("./api/Payment_Tracker");
const Dealsheet = require("./api/DealSheet");
const Website = require("./api/Website");
const EmpMaster = require("./api/EmpMaster");
const getpass = require("./api/getpass");
const Cashier_Daily_Report = require("./api/Cashier_Daily_Report");




const port = 5000;
const app = express();
require("dotenv").config();

app.use(cors({ origin: true }));
app.use(bodyParser.json({ limit: '100mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true })); // Adjust the limit as needed
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  authenticateUser(req, res, next);
});
app.use("/Mobile", Mobile);
app.use("/AdvDeduction", AdvDeduction);
app.use("/Master", Master);
app.use("/groupMaster", groupMaster);
app.use("/template", template);
app.use("/empded", EmpDed);
app.use("/newJoining", newJoining);
app.use("/employee", employee);
app.use("/branch", branch);
app.use("/ars", ars);
app.use("/payout", finpayout);
app.use("/discount", discount);
app.use("/manualdiscount", ManualDiscount);
app.use("/users", user);
app.use("/pettycash", pettyCash);
app.use("/insurance", insurance);
app.use("/hrmsreport", hrmsreport);
app.use("/Hierarchy", Hierarchy);
app.use("/dashboards", dashboards);
app.use("/Tvicm", Tvicm);
app.use("/reminder", Reminder);
app.use("/budget", budget);
app.use("/panandadharapi", panAndAdharApi);
app.use("/interview", interview);
app.use("/fuel", fuel);
app.use("/ExpenseAprvl", ExpenseAprvl);
app.use("/Ledger", Ledger)
app.use("/accounts", Accounts);
app.use("/Refund", Refund);
app.use("/inventory", inventory);
app.use("/DemoCar", DemoCar);
app.use("/Asset", Asset);
app.use("/VendorPayProcess", VendorPayProcess);
app.use("/Incentive", Incentive);
app.use("/Service", Service);
app.use("/Tds", Tds);
app.use("/BodyShop", BodyShop);
app.use("/quotation", quotation);
app.use("/BookAlot", BookAlot);
app.use("/pot_cust", pot_cust);
app.use("/icmTracker", icmTracker);
app.use("/expense_allocation", expense_allocation);
app.use("/PartSuggestive", PartSuggestive);
app.use("/Daily_Task", Daily_Task);
app.use("/Emp_Exit", Emp_Exit);
app.use("/MGAApproval", MGAApproval);
app.use("/cash_sheet", cash_sheet);
app.use("/NewCarAudit", NewCarAudit);
app.use("/icm", icm);
app.use("/DocManage", DocManage);
app.use("/Payment_Tracker", Payment_Tracker);
app.use("/Dealsheet", Dealsheet);
app.use("/Website", Website);
app.use("/EmpMaster", EmpMaster);
app.use("/getpass", getpass);
app.use("/Cashier_Daily_Report", Cashier_Daily_Report);



app.get("/fetch", async (req, res) => {
  try {
    const filePath = req.query.filePath;
    const url = `http://cloud.autovyn.com:3000/fetch?filePath=${filePath}`;
    const response = await axios.get(url, { responseType: "stream" });

    const contentType = response.headers['content-type'];
    res.setHeader('Content-Type', contentType);

    // Remove X-Frame-Options header
    // Set Content-Security-Policy header to allow embedding from any domain
    res.setHeader('Content-Security-Policy', "frame-ancestors *");

    if (contentType.startsWith('image/') || contentType === 'application/pdf') {
      // If the content type is an image or a PDF, stream it directly
      response.data.pipe(res);
    } else {
      // If the content type is not an image or a PDF, prompt a download
      res.setHeader('Content-Disposition', `attachment; filename=${filePath.split('/').pop()}`);
      response.data.pipe(res);
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.get("*", async (req, res) => {
  res.status(401).send({
    Status: false,
    Message: "Invalid Request",
  });
});
app.post("*", async (req, res) => {
  res.status(401).send({
    Status: false,
    Message: "Invalid Request",
  });
});


  app.listen(port, function (err) {
    if (err) {
      console.log("ERROR!", err);
      return;
    }
    console.log(`Worker ${process.pid} started`);
  });
}
