const { dbname } = require("../utils/dbconfig");
const { Sequelize, DataTypes, literal } = require("sequelize");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const { insuEntrySchema, _Insu_Entry } = require("../models/InsuEntry");
const { _Insu_Register } = require("../models/InsuRegister");
const path = require("path");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const crypto = require('crypto');
const { SendWhatsAppMessgae } = require("./user");

exports.closeentries = async function (req, res) {
  console.log("Generating Excel template");
  const sequelize = await dbname(req.query.compcode);
  try {
    const reportName = "Insurance Excel Import";
    const Headeres = [
      "Policy No",
      "Chassis No",
      "Engine No",
      "Registration No",
      "Customer Name",
      "Status",
      "Payment Mode",
      "Premium",
      "Discount",
      "Format No",
      "Cheque_No",
      "Cheque Date/Payment Recieved Date",
      "Bank Name",
      "Field Executive Name",
      "Policy Issued Date"
    ];

    const Company_Name = await sequelize.query(
      `select top 1 comp_name from Comp_Mst`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    worksheet.addRow();
    worksheet.addRow();
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Auto_Lead_Template.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.error("Error generating Excel template:", e);
    res.status(500).send("Internal Server Error");
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.closeentriesupdate = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const excelFile = req.files["excel"][0];
    const user = req.body.user;
    const branch = req.body.branch;
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData?.length) {
      await sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    const renameKeys = (obj) => {
      const keyMap = {
        "Policy No": "Policy_No",
        "Chassis No": "Chassis_No",
        "Engine No": "Engine_No",
        "Registration No": "Registration_No",
        "Customer Name": "Customer_Name",
        Status: "Status",
        "Payment Mode": "Mode_Of_Payment",
        Premium: "Premium",
        Discount: "Discount",
        "Format No": "Format_No",
        Cheque_No: "Cheque_No",
        "Cheque Date/Payment Recieved Date": "Cheque_Date",
        "Bank Name": "Bank_Name",
        "Field Executive Name": "Field_Executive",
        "Policy Issued Date": "Policy_Issued_Date",
        "Policy Issued Date": "LeadDate"
      };
      const renamedObj = Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key;
        if (newKey === "Policy_No") {
          acc[newKey] = String(obj[key]).replace(/'/g, "");
        } else if (newKey === "Status") {
          if (
            obj[key] === "closed" ||
            obj[key] === "Closed" ||
            obj[key] === "CLOSED"
          ) {
            acc[newKey] = "4";
          }
          else if (
            obj[key] === "Open" ||
            obj[key] === "OPEN" ||
            obj[key] === "open"
          ) {
            acc[newKey] = "1";
          }

          else if (
            obj[key] === "lost" ||
            obj[key] === "Lost" ||
            obj[key] === "LOST"
          ) {
            acc[newKey] = "0";
          }
        } else if (newKey === "Mode_Of_Payment") {
          if (obj[key] === "cash" || obj[key] === "CASH" || obj[key] === "Cash")
            acc[newKey] = "1";
          else if (
            obj[key] === "cheque" ||
            obj[key] === "CHEQUE" ||
            obj[key] === "Cheque"
          )
            acc[newKey] = "2";
          else acc[newKey] = obj[key] === "" ? null : String(obj[key]);
        } else if (newKey === "Cheque_Date") {
          if (obj[key]) {
            acc[newKey] = adjustToIST(obj[key]); // Convert Policy_Due to YYYY-MM-DD format
          } else {
            acc[newKey] = null; // Handle empty string or null value
          }
        }
        else if (newKey === "Policy_Issued_Date") {
          if (obj[key]) {
            acc[newKey] = adjustToIST(obj[key]); // Convert Policy_Due to YYYY-MM-DD format
          } else {
            acc[newKey] = null; // Handle empty string or null value
          }
        }
        else if (newKey === "LeadDate") {
          if (obj[key]) {
            const leadDate = new Date(obj[key]);
            const currentDate = new Date();
            // Convert both dates to just the date part (YYYY-MM-DD) without time
            const leadDateOnly = new Date(leadDate.toISOString().split('T')[0]);
            const currentDateOnly = new Date(currentDate.toISOString().split('T')[0]);
            console.log(leadDateOnly, currentDateOnly, "currentDateOnly")
            // Check if leadDate is greater than currentDate
            if (leadDateOnly > currentDateOnly) {
              acc[newKey] = adjustToIST(currentDateOnly); // Assign current date
              console.log("if")
            } else {
              console.log("else")
              acc[newKey] = adjustToIST(leadDateOnly); // Convert LeadDate to YYYY-MM-DD format
            }
          } else {
            acc[newKey] = null; // Handle empty string or null value
          }
        }
        else {
          acc[newKey] = obj[key] === "" ? null : String(obj[key]);
        }
        return acc;
      }, {});
      return renamedObj;
    };
    function adjustToIST(dateStr) {
      try {
        const date = new Date(dateStr);
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 31);
        date.setDate(date.getDate() + 1);
        const ISTDateStr = date.toISOString();
        return ISTDateStr.slice(0, 10);
      } catch (err) {
        return parseDate(dateStr);
      }
    }
    function parseDate(dateStr) {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date // Convert to YYYY-MM-DD format
      }
      return null; // Handle invalid date
    }

    const data = transformedData.map(renameKeys);
    console.log(data, "data");

    const Insu_Data = _Insu_Entry(sequelize, DataTypes);

    // Collect column names from renameKeys
    const columnNames = Object.keys(renameKeys(transformedData[0]));
    console.log("Column Names:", columnNames);

    await Promise.all(
      data.map((service) => {
        const { Engine_No, LeadDate, ...oldservice } = service;
        return Insu_Data.update(
          oldservice, // Spread the oldservice object
          {
            where: { Engine_No: Engine_No, Location: branch },
            transaction: t,
          }
        );
      })
    );
    const Engine_No = data.map((item) => `'${String(item.Engine_No)}'`);
    await t.commit();
    for (const item of data) {
      const data = await sequelize.query(`select lead,Leaddate from  insu_entry where Engine_No ='${item.Engine_No}' and location ='${branch}'`)
      if (data[0].length > 0) {
        await sequelize.query(`update insu_entry set Lead=${data[0][0].lead ? 'Lead' : `(select isnull(Max(Lead)+1,1) from Insu_Entry where location ='${branch}')`},Leaddate=${data[0][0].Leaddate ? 'Leaddate' : `'${item.LeadDate}'`} where Engine_No='${item.Engine_No}' and location ='${branch}'`)
      }
    }
    const newdata =
      await sequelize.query(`select Lead,LeadDate,Policy_No,Chassis_No,Engine_No,Registration_No,Customer_Name,
      CASE 
       WHEN Status = 0 THEN 'Lost entry'
       WHEN Status = 1 THEN 'Open entry'
      WHEN Status = 4 THEN 'Closed entry'
      ELSE Status
      END AS Status,
      Mode_Of_Payment,
      Premium,
      Discount,
      Format_No,
      Cheque_No,
      Cheque_Date,
      Bank_Name,
      Field_Executive 
      from insu_entry where Engine_No in (${Engine_No}) and location ='${branch}'`);
    res
      .status(200)
      .send({ Message: "Updated Successfully", updatedInsu_Data: newdata[0] });

    // for (const item of newdata[0]) {
    //   const createinsudata = await sequelize.query(
    //     `select * from insu_entry where Engine_No in ('${item.Engine_No}')`
    //   );

    //   function addOneYear(dateString) {
    //     const date = new Date(dateString);
    //     date.setFullYear(date.getFullYear() + 1);
    //     return date.toISOString().split("T")[0];
    //   }

    //   function updatePolicyRenType(renType) {
    //     if (renType === "FIRST_YEAR") {
    //       return "SECOND_YEAR";
    //     } else if (renType === "SECOND_YEAR") {
    //       return "THIRD_YEAR";
    //     }
    //   }

    //   const newentrydata = {
    //     Policy_No: createinsudata[0][0].Policy_No,
    //     CRE_NAME: createinsudata[0][0].CRE_NAME,
    //     Customer_Name: createinsudata[0][0].Customer_Name,
    //     Policy_Due: addOneYear(createinsudata[0][0].Policy_Due),
    //     Registration_No: createinsudata[0][0].Registration_No,
    //     Engine_No: createinsudata[0][0].Engine_No,
    //     Chassis_No: createinsudata[0][0].Chassis_No,
    //     Year_Manufacture: createinsudata[0][0].Year_Manufacture,
    //     Sub_Model: createinsudata[0][0].Sub_Model,
    //     Address1: createinsudata[0][0].Address1,
    //     Address2: createinsudata[0][0].Address2,
    //     Address3: createinsudata[0][0].Address3,
    //     Cust_City: createinsudata[0][0].Cust_City,
    //     PinCode: createinsudata[0][0].PinCode,
    //     Phone_No: createinsudata[0][0].Phone_No,
    //     MobileNo: createinsudata[0][0].MobileNo,
    //     Policy_Ren_Type: updatePolicyRenType(
    //       createinsudata[0][0].Policy_Ren_Type
    //     ),
    //     Policy_Sub_Type: createinsudata[0][0].Policy_Sub_Type,
    //     Dealer_Code: createinsudata[0][0].Dealer_Code,
    //     Created_By: createinsudata[0][0].Created_By,
    //     loc_code: createinsudata[0][0].loc_code,
    //   };
    //   await Insu_Data.create(newentrydata);
    // }
    await sequelize.close();
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

exports.excelimportmini = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Insu_Data = _Insu_Entry(sequelize, DataTypes);
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file

    if (!excelFile) {
      await sequelize.close();
      return res.status(400).send({ Message: "No file uploaded" });
    }

    const user = req.body.user;
    const branch = req.body.branch;

    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData.length) {
      await sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }

    const renameKeys = (obj) => {
      const keyMap = {
        "S.No": "S_No",
        "Policy No": "Policy_No",
        "CRE NAME": "CRE_NAME",
        "Customer Name": "Customer_Name",
        "Policy Due for Renewal": "Policy_Due",
        "Registration Number": "Registration_No",
        "Engine No": "Engine_No",
        "Chassis No": "Chassis_No",
        "Year of Manufacture": "Year_Manufacture",
        "Sub Model": "Sub_Model",
        Address1: "Address1",
        Address2: "Address2",
        Address3: "Address3",
        "Customer City": "Cust_City",
        "Pin Code": "PinCode",
        "Phone No": "Phone_No",
        "Mobile No": "MobileNo",
        "Policy Renewal Type": "Policy_Ren_Type",
        "Policy Sub Type": "Policy_Sub_Type",
        "Dealer Code": "Dealer_Code",
        "Branch": "loc_code",
      };

      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key; // Use the new key if found, otherwise keep the original key
        // Treat Engine_No and Chassis_No as strings
        if (newKey === "Policy_No") {
          // Remove single quotes from Policy_No if they exist
          acc[newKey] = String(obj[key]).replace(/'/g, "");
        } else if (newKey === "Policy_Due") {
          if (obj[key]) {
            acc[newKey] = parseDate(obj[key]);
            // Convert Policy_Due to YYYY-MM-DD format
          } else {
            acc[newKey] = null; // Handle empty string or null value
          }
        } else {
          // Convert empty string values to null
          acc[newKey] = obj[key] === "" ? null : String(obj[key]);
        }
        return acc;
      }, {});
    };

    const data = transformedData.map(renameKeys);

    function adjustToIST(dateStr) {
      try {
        const date = new Date(dateStr);
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 31);
        const ISTDateStr = date.toISOString();
        return ISTDateStr.slice(0, 10);
      } catch (err) {
        return parseDate(dateStr);
      }
    }

    function parseDate(dateStr) {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date // Convert to YYYY-MM-DD format
      }
      return null; // Handle invalid date
    }

    console.log(data, "Policy_Due");

    const empCodesdata = data.map((obj) => obj.Policy_No);
    const empcode = await sequelize.query(
      `SELECT DISTINCT Policy_No FROM Insu_Entry WHERE Policy_No IN (:empCodesdata) and location='${branch}'`,
      {
        replacements: { empCodesdata },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const RegNo = data.map((obj) => obj.Registration_No);
    const RegNumber = await sequelize.query(
      `SELECT DISTINCT Registration_No FROM Insu_Entry WHERE Registration_No IN (:RegNo) and location='${branch}'`,
      {
        replacements: { RegNo },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const EngineNo = data.map((obj) => obj.Engine_No);
    const EngineNumber = await sequelize.query(
      `SELECT DISTINCT Engine_No FROM Insu_Entry WHERE Engine_No IN (:EngineNo) and location='${branch}'`,
      {
        replacements: { EngineNo },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const ChassisNo = data.map((obj) => obj.Chassis_No);
    const ChassisNumber = await sequelize.query(
      `SELECT DISTINCT Chassis_No FROM Insu_Entry WHERE Chassis_No IN (:ChassisNo) and location='${branch}'`,
      {
        replacements: { ChassisNo },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const user_code = await sequelize.query(
      `SELECT DISTINCT User_Name FROM user_tbl WHERE module_code = 10 AND export_type < 3 AND (',' + multi_loc + ',' LIKE '%,${branch},%')`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const userNames = user_code.map((item) => item.User_Name.toLowerCase());
    const ErroredData = [];
    const CorrectData = [];

    data.forEach((obj) => {
      let oldObj = { ...obj };
      const rejectionReasons = [];

      if (
        empcode.some(
          (item) => item.Policy_No?.toString() === obj.Policy_No?.toString()
        )
      ) {
        rejectionReasons.push(
          `Duplicate Policy Number ${obj.Policy_No}`,
          " | "
        );
      }

      if (
        RegNumber.some(
          (item) =>
            item.Registration_No?.toString() === obj.Registration_No?.toString()
        )
      ) {
        rejectionReasons.push(
          `Duplicate Registration Number ${obj.Registration_No}`,
          " | "
        );
      }

      const formattedUserNames = userNames.map((name) =>
        name.replace(/\s+/g, "").toLowerCase()
      );
      const formattedCreName = obj.CRE_NAME?.toString()
        .replace(/\s+/g, "")
        .toLowerCase();

      const isUserFound = formattedUserNames.includes(formattedCreName);

      if (!isUserFound) {
        rejectionReasons.push(
          `No User Found For Cre Name: - ${obj.CRE_NAME}`,
          " | "
        );
      }

      // if (
      //   EngineNumber.some(
      //     (item) => item.Engine_No?.toString() === obj.Engine_No?.toString()
      //   )
      // ) {
      //   rejectionReasons.push(
      //     `Duplicate Engine Number ${obj.Engine_No}`,
      //     " | "
      //   );
      // }

      // if (
      //   ChassisNumber.some(
      //     (item) => item.Chassis_No?.toString() === obj.Chassis_No?.toString()
      //   )
      // ) {
      //   rejectionReasons.push(
      //     `Duplicate Chassis Number ${obj.Chassis_No}`,
      //     " | "
      //   );
      // }

      const isDuplicateEngine = EngineNumber.some(
        (item) => item.Engine_No?.toString() === obj.Engine_No?.toString()
      );
      const isDuplicateChassis = ChassisNumber.some(
        (item) => item.Chassis_No?.toString() === obj.Chassis_No?.toString()
      );

      if (isDuplicateEngine && isDuplicateChassis) {
        rejectionReasons.push(
          `Duplicate Engine Number ${obj.Engine_No} and Chassis Number ${obj.Chassis_No}`,
          " | "
        );
      }

      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons.join(""),
        });
      } else {
        obj.Created_By = user;
        obj.Location = branch;
        CorrectData.push(obj);
      }
    });

    const InsuData1 = await Insu_Data.bulkCreate(CorrectData, {
      transaction: t,
    });
    await t.commit();
    await sequelize.close();

    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: CorrectData,
      Message: `${InsuData1.length} Records Inserted`,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

exports.paymentimport = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Insu_Register = _Insu_Register(sequelize, DataTypes);
    const Insu_Entry = _Insu_Entry(sequelize, DataTypes);
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    const user = req.body.user;
    const branch = req.body.branch;
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    if (!transformedData?.length) {
      sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    const renameKeys = (obj) => {
      const keyMap = {
        "Proposal No": "Exl_Fld1",
        "Policy No": "Exl_Fld2",
        "Policy Type": "Exl_Fld3",
        "Policy Issue Date": "Exl_Fld4",
        "Policy Issue Time": "Exl_Fld5",
        "Risk Inception Date": "Exl_Fld6",
        "Insurance Company": "Exl_Fld7",
        "Policy Expiry Date": "Exl_Fld8",
        "Auto Membership": "Exl_Fld9",
        "Auto Membership Premium": "Exl_Fld10",
        "PA No. Of Person": "Exl_Fld11",
        "PA Sum Insured Per Person": "Exl_Fld12",
        "PA Premium": "Exl_Fld13",
        "OD Premium": "Exl_Fld14",
        "TP Premium": "Exl_Fld15",
        "TPPD Extn Sum Assured": "Exl_Fld16",
        "TPPD Extn Premium": "Exl_Fld17",
        "Voluntary Excess Limit": "Exl_Fld18",
        "Voluntary Excess Premium": "Exl_Fld19",
        "Geographic Extn Premium": "Exl_Fld20",
        "Driver Cover": "Exl_Fld21",
        "Legal Liability No. Of Person": "Exl_Fld22",
        "Driver Cover Premium": "Exl_Fld23",
        "Employer Liability No. Of Employees": "Exl_Fld24",
        "Employer Liability Premium": "Exl_Fld25",
        "Service Tax Amount": "Exl_Fld26",
        "Electrical ies Value": "Exl_Fld27",
        "Non-Electrical ies Value": "Exl_Fld28",
        "Electrical ies Premium": "Exl_Fld29",
        "Non-Electrical ies Premium": "Exl_Fld30",
        "CNG Kit Value": "Exl_Fld31",
        "CNG Premium": "Exl_Fld32",
        "Part A Premium": "Exl_Fld33",
        "Part B Premium": "Exl_Fld34",
        Premium: "Exl_Fld35",
        "Gross Total Premium": "Exl_Fld36",
        "Compulsory Excess": "Exl_Fld37",
        "Previous Policy No.": "Exl_Fld38",
        "Fresh / Renewal": "Exl_Fld39",
        "Payment Status": "Exl_Fld40",
        "Previous Insurer": "Exl_Fld41",
        "Malus NCB Value": "Exl_Fld42",
        "Malus Premium": "Exl_Fld43",
        "Cancel Status": "Exl_Fld44",
        "Cancelled Date": "Exl_Fld45",
        "Cancelled Remarks": "Exl_Fld46",
        "64VB Verified Status": "Exl_Fld47",
        "RTI Status": "Exl_Fld48",
        "EP Status": "Exl_Fld49",
        "Zero Dep. Status": "Exl_Fld50",
        "Consumable Status": "Exl_Fld51",
        "RSA Status": "Exl_Fld52",
        "KeyProtect Status": "Exl_Fld53",
        "HEV Status": "Exl_Fld54",
        "TyreProtect Status": "Exl_Fld55",
        "PersonalBelonging Status": "Exl_Fld56",
        "IMT43 Status": "Exl_Fld57",
        "IMT44 Status": "Exl_Fld58",
        "Zero Dep. Premium": "Exl_Fld59",
        "Engine Cover Premium": "Exl_Fld60",
        "RTI Premium": "Exl_Fld61",
        "Consumable Premium": "Exl_Fld62",
        "RSA Premium": "Exl_Fld63",
        "KeyProtect Premium": "Exl_Fld64",
        "HEV Premium": "Exl_Fld65",
        "TyreProtect Premium": "Exl_Fld66",
        "PersonalBelonging Premium": "Exl_Fld67",
        "IMT43 Premium": "Exl_Fld68",
        "IMT44 Premium": "Exl_Fld69",
        "Expired Remarks": "Exl_Fld70",
        "Free Scheme": "Exl_Fld71",
        "Renewal Status(MI/NON MI)": "Exl_Fld72",
        "MI Renewal Break Up": "Exl_Fld73",
        "MI Renewal Status": "Exl_Fld74",
        "Previous Policy Issue Date": "Exl_Fld75",
        "Previous Policy Expiry Date": "Exl_Fld76",
        "Cancellation Remarks by Dealer": "Exl_Fld77",
        "Dealer's Cancellation Executive": "Exl_Fld78",
        "Cancellation Time": "Exl_Fld79",
        "Cheque Of": "Exl_Fld80",
        "Remuneration Paid": "Exl_Fld81",
        "Auto Debit Status": "Exl_Fld82",
        "Blocked By": "Exl_Fld83",
        "Blocked Date": "Exl_Fld84",
        "Blocked Remarks": "Exl_Fld85",
        "Request Submission Date": "Exl_Fld86",
        "CCA Verified Date": "Exl_Fld87",
        "OD Cancelled Remarks": "Exl_Fld88",
        "Status Remarks": "Exl_Fld89",
        "OD Cancellation Date": "Exl_Fld90",
        "Web Policy Status(Y/N)": "Exl_Fld91",
        "Payment Mode": "Exl_Fld92",
        "Edit Payment Date": "Exl_Fld93",
        "OD Expiry Date": "Exl_Fld94",
        "NCB Previous Policy No.": "Exl_Fld95",
        "NCB Previous Insurer": "Exl_Fld96",
        "Previous Policy Issue Date": "Exl_Fld97",
        "Previous Policy Expiry Date": "Exl_Fld98",
        CLAIM_COUNT: "Exl_Fld99",
        "Customer Name": "Exl_Fld100",
        City: "Exl_Fld101",
        "Date Of Birth": "Exl_Fld102",
        "Customer Pin Code": "Exl_Fld103",
        "Customer STATE": "Exl_Fld104",
        "Sub Model": "Exl_Fld105",
        Dealer: "Exl_Fld106",
        "Dealer Address": "Exl_Fld107",
        "Dealer Phone No.": "Exl_Fld108",
        "Vehicle Regn. No.": "Exl_Fld109",
        "Vehicle Type": "Exl_Fld110",
        "Engine No.": "Exl_Fld111",
        "Chassis No.": "Exl_Fld112",
        "Showroom Price(Rs)": "Exl_Fld113",
        "Year of Manufacture": "Exl_Fld114",
        "Dealer Outlet City": "Exl_Fld115",
        "Mul Variant": "Exl_Fld116",
        "Mul Color": "Exl_Fld117",
        "Dealer's Executive": "Exl_Fld118",
        "Dealer Code": "Exl_Fld119",
        "For Code": "Exl_Fld120",
        "Vehicle Sale Date": "Exl_Fld121",
        "Insured Declared Value(Rs)": "Exl_Fld122",
        "Anti-theft Device Installed": "Exl_Fld123",
        VIN: "Exl_Fld124",
        Region: "Exl_Fld125",
        "Model Name": "Exl_Fld126",
        Financed: "Exl_Fld127",
        "Finance Company": "Exl_Fld128",
        "Other Finance Company": "Exl_Fld129",
        "Payment Reconciliation": "Exl_Fld130",
        "Reconciliation Instrument No": "Exl_Fld131",
        "Reconciliation Instrument Drawn On": "Exl_Fld132",
        "Reconciliation Instrument Date": "Exl_Fld133",
        "Reconciliation Instrument Amount": "Exl_Fld134",
        "Deposit No": "Exl_Fld135",
        "MUL Deposit No": "Exl_Fld136",
        "Reconciliation Date": "Exl_Fld137",
        "64VB Deposit No": "Exl_Fld138",
        "Cheque No 1": "Exl_Fld139",
        "Cheque Amount 1": "Exl_Fld140",
        "Credit Amount 1": "Exl_Fld141",
        "Credit Date 1": "Exl_Fld142",
        "Collection Date 1": "Exl_Fld143",
        "Gross Premium Amount": "Exl_Fld144",
        "Credit Note No": "Exl_Fld145",
        "Confirmed Date": "Exl_Fld146",
        Remarks: "Exl_Fld147",
        "MI Renewed Policy Number": "Exl_Fld148",
        "MI Renewed INS Co": "Exl_Fld149",
        "MI Renewed Dealer Name": "Exl_Fld150",
        "MI Renewed Dealer City": "Exl_Fld151",
        "MI Renewed 64 VB Status": "Exl_Fld152",
        "MI Renewed Policy Issue Date": "Exl_Fld153",
        "MI Renewed Policy Risk Inception Date": "Exl_Fld154",
        "MI Renewed Policy Break In Status": "Exl_Fld155",
        CLAIMS: "Exl_Fld156",
      };

      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key; // Use the new key if found, otherwise keep the original key
        // Treat Engine_No and Chassis_No as strings
        // Convert empty string values to null
        acc[newKey] =
          obj[key] === "" ? null : String(obj[key]).replace(/'/g, "");
        return acc;
      }, {});
    };

    const data = transformedData.map(renameKeys);
    function adjustToIST(dateStr) {
      const date = new Date(dateStr);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 31);
      const ISTDateStr = date.toISOString();
      return ISTDateStr.slice(0, 10);
    }
    // cheking duplicate employeeCode
    const ErroredData = [];
    const CorrectData = [];

    const empCodesdata = data.map((obj) => `'${obj.Exl_Fld1}'`);
    const empcode = await sequelize.query(
      `select distinct(Exl_Fld1) from Insu_register where Exl_Fld1 in (${empCodesdata.length ? empCodesdata : `''`
      })`
    );

    data.map((obj) => {
      let oldObj = { ...obj };
      const rejectionReasons = [];

      if (
        empcode[0].some(
          (item) => item.Exl_Fld1?.toString() == obj.Exl_Fld1?.toString()
        )
      ) {
        rejectionReasons.push(`Duplicate Proposal No ${obj.Exl_Fld1}`, " | ");
      }
      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons?.slice(0, -1),
        });
      } else {
        CorrectData.push(obj);
        // }
      }
    });
    const Insu_Register1 = await Insu_Register.bulkCreate(CorrectData, {
      transaction: t,
    });
    for (item of CorrectData) {
      const data = await sequelize.query(
        `select * from insu_entry where Policy_No='${item.Exl_Fld2}'`,
        { transaction: t }
      );
      if (data[0].length > 0) {
        if (item.Exl_Fld91.toLowerCase() === "yes") {
          await sequelize.query(
            `update insu_entry set Web_Policy='${item.Exl_Fld91}',Insu_Comp='${item.Exl_Fld7}',
            Payment_Reconciliation='${item.Exl_Fld130}',Reconciliation_Instrument_No='${item.Exl_Fld131}',
            Reconciliation_Instrument_Drawn_On='${item.Exl_Fld132}',Reconciliation_Instrument_Date='${item.Exl_Fld133}',
            Reconciliation_Instrument_Amount='${item.Exl_Fld134}',status='4' where Policy_No='${item.Exl_Fld2}' and YEAR(policy_due)=YEAR(GETDATE()) and location='${branch}'`,
            { transaction: t }
          );
          // function addOneYear(dateString) {
          //   const date = new Date(dateString);
          //   date.setFullYear(date.getFullYear() + 1);
          //   return date.toISOString().split("T")[0];
          // }
          // function updatePolicyRenType(renType) {
          //   if (renType === "FIRST_YEAR") {
          //     return "SECOND_YEAR_ONWARDS";
          //   } else if (renType === "SECOND_YEAR_ONWARDS") {
          //     return "THIRD_YEAR_ONWARDS";
          //   } else if (renType === "THIRD_YEAR_ONWARDS") {
          //     return "FOURTH_YEAR_ONWARDS";
          //   } else if (renType === "FOURTH_YEAR_ONWARDS") {
          //     return "FIFTH_YEAR_ONWARDS";
          //   } else if (renType === "FIFTH_YEAR_ONWARDS") {
          //     return "SIXTH_YEAR_ONWARDS";
          //   } else if (renType === "SIXTH_YEAR_ONWARDS") {
          //     return "SEVENTH_YEAR_ONWARDS";
          //   } else if (renType === "SEVENTH_YEAR_ONWARDS") {
          //     return "EIGHTH_YEAR_ONWARDS";
          //   } else if (renType === "EIGHTH_YEAR_ONWARDS") {
          //     return "NINTH_YEAR_ONWARDS";
          //   } else if (renType === "NINTH_YEAR_ONWARDS") {
          //     return "TENTH_YEAR_ONWARDS";
          //   }
          // }
          // const newentrydata = {
          //   Policy_No: data[0][0].Policy_No,
          //   CRE_NAME: data[0][0].CRE_NAME,
          //   Customer_Name: data[0][0].Customer_Name,
          //   Policy_Due: addOneYear(data[0][0].Policy_Due),
          //   Registration_No: data[0][0].Registration_No,
          //   Engine_No: data[0][0].Engine_No,
          //   Chassis_No: data[0][0].Chassis_No,
          //   Year_Manufacture: data[0][0].Year_Manufacture,
          //   Sub_Model: data[0][0].Sub_Model,
          //   Address1: data[0][0].Address1,
          //   Address2: data[0][0].Address2,
          //   Address3: data[0][0].Address3,
          //   Cust_City: data[0][0].Cust_City,
          //   PinCode: data[0][0].PinCode,
          //   Phone_No: data[0][0].Phone_No,
          //   MobileNo: data[0][0].MobileNo,
          //   Policy_Ren_Type: updatePolicyRenType(data[0][0].Policy_Ren_Type),
          //   Policy_Sub_Type: data[0][0].Policy_Sub_Type,
          //   Dealer_Code: data[0][0].Dealer_Code,
          //   Created_By: data[0][0].Created_By,
          //   loc_code: data[0][0].loc_code,
          // };
          // await Insu_Entry.create(newentrydata, { transaction: t });
        }
      }
    }
    t.commit();
    await sequelize.close();
    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: data,
      Message: `${data.length} Records Inserted`,
    });
    // res.status(200).send("imported Successfully");
  } catch (error) {
    t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

exports.insertLeadEntry = async function (req, res, next) {
  const { SRNo, Lead, ...insertData } = req.body;
  const { error, value: Insu_Entry } = insuEntrySchema.validate(insertData, {
    abortEarly: false,
    stripUnknown: true,
  });
  let t;

  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    try {
      const sequelize = await dbname(req.headers.compcode);
      const isAvaiable = await sequelize.query(`select * from insu_entry where engine_no='${req.body.Engine_No}' and location='${req.body.Location}'`)
      if (isAvaiable[0].length > 0) {
        return res.status(404).send({ success: false, message: "Entry Already Exits In System" });
      }
      t = await sequelize.transaction();
      const Insu_Entry = _Insu_Entry(sequelize, DataTypes);
      const Insu_Entry1 = await Insu_Entry.create(insertData, {
        transaction: t,
      });
      await t.commit();
      await sequelize.query(`update insu_entry set Lead=(select isnull(Max(Lead)+1,1) from Insu_Entry where location ='${req.body.Location}'),LastUpdatedBy='${req.headers.name}',LastUpdatedDate=GETDATE() where srno='${Insu_Entry1.SRNo}'`)
      if (req.body.Status == '4') {
        await sequelize.query(`update insu_entry set Closed_By='${req.headers.name}',ClosedDate=GETDATE() where srno='${Insu_Entry1.SRNo}'`)
      }
      const leaddata = await sequelize.query(`select Lead from  insu_entry  where srno='${Insu_Entry1.SRNo}'`)
      const nextLead = await sequelize.query(`select isnull(Max(Lead)+1,1) as Lead from Insu_Entry where lead is not null and lead!='' and location ='${req.body.Location}'`)
      res.status(200).send({ Lead: leaddata[0][0].Lead, nextLead: nextLead[0][0].Lead });
    } catch (error) {
      await t.rollback();
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred during Saving." });
    }
  }
};

exports.updateLeadEntry = async function (req, res, next) {
  const { SRNo, Lead, Created_At, ...updateData } = req.body;
  if (!SRNo) {
    return res.status(400).send({
      success: false,
      message: "SRNo is required for updating an entry.",
    });
  }

  const { error, value: InsuData } = insuEntrySchema.validate(updateData, {
    abortEarly: false,
    stripUnknown: true,
  });
  let t;

  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    try {
      const sequelize = await dbname(req.headers.compcode);
      const Alreadyhas = await sequelize.query(`select LeadDate,Status from insu_entry where srno=${SRNo}`)
      if (Alreadyhas[0][0].Status === '4') {
        if ((req.bodyStatus != '4' || req.bodyStatus != '5') && !req.headers.update) {
          return res.status(401).send({ success: false, message: "To Change The Status OF Entry Need Otp Verification" });
        }
      }
      if (Alreadyhas[0][0].LeadDate) {
        updateData.LeadDate = Alreadyhas[0][0].LeadDate
      }

      t = await sequelize.transaction();
      const Insu_Entry = _Insu_Entry(sequelize, DataTypes);

      const [updatedRowsCount] = await Insu_Entry.update(updateData, {
        where: { SRNo },
        transaction: t,
      });

      if (updatedRowsCount === 0) {
        await t.rollback();
        return res.status(404).send({
          success: false,
          message: "No entry found with the given SRNo.",
        });
      }
      await t.commit();
      const LeadEntry = await sequelize.query(`select Lead from insu_entry where srno='${SRNo}'`)
      console.log(LeadEntry[0][0])
      if (!LeadEntry[0][0].Lead) {
        await sequelize.query(`update insu_entry set Lead=(select isnull(Max(Lead)+1,1) from Insu_Entry where location ='${req.body.Location}'),LastUpdatedBy='${req.headers.name}',LastUpdatedDate=GETDATE() where srno='${SRNo}'`)
      }
      if (req.body.Status == '4') {
        await sequelize.query(`update insu_entry set Closed_By='${req.headers.name}',ClosedDate=GETDATE() where srno='${SRNo}'`)
      }
      const UpdatedLead = await sequelize.query(`select Lead from insu_entry where srno='${SRNo}'`)
      if (updateData.Delivered == 1) {
        const comapny = await sequelize.query(
          `select top 1 comp_name from comp_mst`
        );
        if (updateData?.MobileNo && updateData?.MobileNo != "") {
          await SendWhatsAppMessgae(req.headers.compcode, updateData.MobileNo, "insurance_msg", [
            {
              type: "text",
              text: updateData.Customer_Name ? updateData.Customer_Name : "N/A",
            },
            {
              type: "text",
              text: updateData.Delivery_Executive,
            },
            {
              type: "text",
              text: updateData.Delivery_Date ? updateData.Delivery_Date : "N/A",
            },
            {
              type: "text",
              text: updateData.uploaded_document
                ? `https://erp.autovyn.com/backend/fetch?filePath=${updateData.uploaded_document}`
                : "N/A",
            },
            {
              type: "text",
              text: comapny[0][0]?.comp_name ? comapny[0][0]?.comp_name : "N/A",
            },
          ]);
        }
      }
      res.status(200).send({ SRNo: UpdatedLead[0][0].Lead });

      // if (updateData.Status == "4" && updateData.TeleCaller != "1") {
      //   console.log(updateData.Policy_Ren_Type, "Policy_Ren_Type");
      //   // Function to add one year to the policy due date
      //   function addOneYear(dateString) {
      //     const date = new Date(dateString);
      //     date.setFullYear(date.getFullYear() + 1);
      //     return date.toISOString().split("T")[0];
      //   }
      //   // Function to update the policy renewal type
      //   function updatePolicyRenType(renType) {
      //     if (renType === "FIRST_YEAR") {
      //       return "SECOND_YEAR_ONWARDS";
      //     } else if (renType === "SECOND_YEAR_ONWARDS") {
      //       return "THIRD_YEAR_ONWARDS";
      //     } else if (renType === "THIRD_YEAR_ONWARDS") {
      //       return "FOURTH_YEAR_ONWARDS";
      //     } else if (renType === "FOURTH_YEAR_ONWARDS") {
      //       return "FIFTH_YEAR_ONWARDS";
      //     } else if (renType === "FIFTH_YEAR_ONWARDS") {
      //       return "SIXTH_YEAR_ONWARDS";
      //     } else if (renType === "SIXTH_YEAR_ONWARDS") {
      //       return "SEVENTH_YEAR_ONWARDS";
      //     } else if (renType === "SEVENTH_YEAR_ONWARDS") {
      //       return "EIGHTH_YEAR_ONWARDS";
      //     } else if (renType === "EIGHTH_YEAR_ONWARDS") {
      //       return "NINTH_YEAR_ONWARDS";
      //     } else if (renType === "NINTH_YEAR_ONWARDS") {
      //       return "TENTH_YEAR_ONWARDS";
      //     } else null;
      //   }
      //   // Update the data object
      //   const data = {
      //     Policy_No: updateData.Policy_No,
      //     CRE_NAME: updateData.CRE_NAME,
      //     Customer_Name: updateData.Customer_Name,
      //     Policy_Due: addOneYear(updateData.Policy_Due),
      //     Registration_No: updateData.Registration_No,
      //     Engine_No: updateData.Engine_No,
      //     Chassis_No: updateData.Chassis_No,
      //     Year_Manufacture: updateData.Year_Manufacture,
      //     Sub_Model: updateData.Sub_Model,
      //     Address1: updateData.Address1,
      //     Address2: updateData.Address2,
      //     Address3: updateData.Address3,
      //     Cust_City: updateData.Cust_City,
      //     PinCode: updateData.PinCode,
      //     Phone_No: updateData.Phone_No,
      //     MobileNo: updateData.MobileNo,
      //     Policy_Ren_Type: updatePolicyRenType(updateData.Policy_Ren_Type),
      //     Policy_Sub_Type: updateData.Policy_Sub_Type,
      //     Dealer_Code: updateData.Dealer_Code,
      //     Created_By: updateData.Created_By,
      //     loc_code: updateData.loc_code,
      //   };
      //   await Insu_Entry.create(data);
      // }
    } catch (error) {
      await t.rollback();
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred during updating." });
    }
  }
};


exports.Documentshow = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, status, user_code, branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select SRNo,uploaded_document,CRE_NAME,Policy_No,Customer_Name,Payment_Status,Policy_Due,Registration_No,Chassis_No,Engine_No,Sub_Model,Address1,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where policy_due between '${dateFrom}' and '${dateto}' and CRE_NAME='${user_code}'and location='${branch}' `,
      { transaction: t }
    );
    await t.commit();

    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.findany = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { compCode, username, branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select
      Lead,LeadDate,
      SRNo,CRE_NAME,Policy_No,Customer_Name,Policy_Due,Chassis_No,Registration_No,Engine_No,Sub_Model,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where (Engine_No like '%${compCode}%' or chassis_no like '%${compCode}%' or registration_no like '%${compCode}%' and cre_name='${username}') and location='${branch}'  `,
      { transaction: t }
    );
    await t.commit();

    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();

    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.findanywithcre = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { compCode, username, branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select 
      Lead,LeadDate,SRNo,CRE_NAME,Policy_No,Customer_Name,Policy_Due,Chassis_No,Registration_No,Engine_No,Sub_Model,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where (Engine_No like '%${compCode}%' or chassis_no like '%${compCode}%'  or cre_name like '%${compCode}%' or registration_no like '%${compCode}%') and location='${branch}'`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.findanywithcrecancle = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { compCode, username, branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select 
      Lead,LeadDate,SRNo,CRE_NAME,Policy_No,Customer_Name,Policy_Due,Chassis_No,Registration_No,Engine_No,Sub_Model,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where (Engine_No like '%${compCode}%' or chassis_no like '%${compCode}%'  or cre_name like '%${compCode}%' or registration_no like '%${compCode}%') and status=1 and location='${branch}' `,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.fetchData = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, status, user_code, branch, PolicyRenType, CREName } = req.body;
  let query;
  let count;
  try {
    query = `select top 100 SRNo,Policy_No,Customer_Name,CRE_NAME,Policy_Due,Registration_No,Chassis_No,Engine_No,Year_Manufacture,Sub_Model,Address1,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type from insu_entry
       where policy_due between '${dateFrom}' and '${dateto}' and location='${branch}'`

    count = `select count(*) as length from insu_entry
       where policy_due between '${dateFrom}' and '${dateto}' and location='${branch}'`
    if (PolicyRenType) {
      query += `and Policy_Ren_Type='${PolicyRenType}'`
      count += `and Policy_Ren_Type='${PolicyRenType}'`
    }
    if (CREName) {
      query = `select  SRNo,Policy_No,Customer_Name,CRE_NAME,Policy_Due,Registration_No,Chassis_No,Engine_No,Year_Manufacture,Sub_Model,Address1,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type from insu_entry
       where policy_due between '${dateFrom}' and '${dateto}'  and cre_name='${CREName}' and location='${branch}'`
      count = `select count(*) as length from insu_entry
       where policy_due between '${dateFrom}' and '${dateto}'  and cre_name='${CREName}' and location='${branch}'`
      if (PolicyRenType) {
        query += `and Policy_Ren_Type='${PolicyRenType}'`
        count += `and Policy_Ren_Type='${PolicyRenType}'`

      }
    }
    const result = await sequelize.query(query);
    const lenth = await sequelize.query(count)
    res.status(200).send({ result: result[0], length: lenth[0][0].length });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};






exports.InsuViewData = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, status, user_code, branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select
      Lead,LeadDate,SRNo,CRE_NAME,Policy_No,Customer_Name,Policy_Due,Chassis_No,Registration_No,Engine_No,Sub_Model,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where policy_due between '${dateFrom}' and '${dateto}' and Cre_Name='${user_code}' and location='${branch}' `,
      { transaction: t }
    );
    await t.commit();

    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.ManagerViewData = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, status, user_code, branch, PolicyRenType, cre } = req.body;
  let query;
  let count;

  try {
    query = `select top 100
      Lead,LeadDate,SRNo,CRE_NAME,Policy_No,Customer_Name,Policy_Due,Chassis_No,Registration_No,Engine_No,Sub_Model,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where policy_due between '${dateFrom}' and '${dateto}' and location='${branch}' `
    count = `select count(*) as length from insu_entry
       where policy_due between '${dateFrom}' and '${dateto}' and location='${branch}' `

    if (PolicyRenType) {
      query += `and Policy_Ren_Type ='${PolicyRenType}'`
      count += `and Policy_Ren_Type='${PolicyRenType}'`
    }
    if (cre) {
      query += `and Cre_name ='${cre}'`
      count += `and Cre_name ='${cre}'`
    }

    const result = await sequelize.query(query);
    const lenth = await sequelize.query(count)


    res.status(200).send({ result: result[0], length: lenth[0][0].length });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.CancleViewData = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, status, user_code, branch, PolicyRenType, cre } = req.body;
  let query;
  let count;

  try {
    query = `select top 100
      Lead,LeadDate,SRNo,CRE_NAME,Policy_No,Customer_Name,Policy_Due,Chassis_No,Registration_No,Engine_No,Sub_Model,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where policy_due between '${dateFrom}' and '${dateto}' and status=1  and location='${branch}'`
    count = `select count(*) as length from insu_entry
       where policy_due between '${dateFrom}' and '${dateto}' and location='${branch}' and status=1  `

    if (PolicyRenType) {
      query += `and Policy_Ren_Type ='${PolicyRenType}'`
      count += `and Policy_Ren_Type='${PolicyRenType}'`
    }
    if (cre) {
      query += `and Cre_name ='${cre}'`
      count += `and Cre_name ='${cre}'`
    }

    const result = await sequelize.query(query);
    const lenth = await sequelize.query(count)


    res.status(200).send({ result: result[0], length: lenth[0][0].length });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.sendOtp = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `select User_mob from user_tbl where emp_dms_code='ADMIN' and export_type<3 and module_code=10`
    );
    const otp = crypto.randomInt(100000, 999999);
    console.log(`Generated OTP: ${otp}`);
    for (item of result[0]) {
      console.log(item, "slslslsl")
      await SendWhatsAppMessgae(req.headers.compcode, item.User_mob, "cancellation2", [
        {
          type: "text",
          text: req.body.Customer_Name,
        },
        {
          type: "text",
          text: `${req.body.Policy_Due}`,
        },
        {
          type: "text",
          text: `${req.body.Engine_No}`,
        },
        {
          type: "text",
          text: `${req.body.Chassis_No}`,
        },
        {
          type: "text",
          text: `${req.headers.user}`,
        },
        {
          type: "text",
          text: otp,
        },
      ]);
    }
    res.status(200).json(otp)
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.ManagerReport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const PolicyRenType = data.PolicyRenType;
    const cre = data.cre;
    const branch = data.branch
    let query;
    query = `select 
      SRNo,CRE_NAME,Policy_No,Customer_Name,Policy_Due,Chassis_No,Registration_No,Engine_No,Sub_Model,Cust_City,
      PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where policy_due between '${dateFrom}' and '${dateto}' `
    if (PolicyRenType != 'undefined') {
      query += `and Policy_Ren_Type ='${PolicyRenType}'`
    }
    if (cre != 'undefined') {
      query += `and Cre_name='${cre}'`
    }

    let txnDetails;

    txnDetails = await sequelize.query(query);

    reportName = "Insurance Report";
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    // Add headers for the data starting from the 3rd row
    const headers = Object.keys(txnDetails[0][0]);
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });
    txnDetails[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Insurance_Report.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="AttdenceReport.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  }
};
exports.LeadAndDiscountRegisterReport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const PolicyRenType = data.PolicyRenType;
    const cre = data.cre;
    const branch = data.branch

    let query;
    let secoundquery;

    query = `WITH Summary AS (
      SELECT 
          ROW_NUMBER() OVER (ORDER BY cre_name) AS SRNo,
          cre_name AS [Tele-Caller],
          Policy_Ren_Type,
          COUNT(CASE WHEN status IN (4, 1, 5) AND location='1' THEN 1 END) AS [Total Renewed],
          COUNT(CASE WHEN status IN (1) AND location='1' THEN 1 END) AS [Open Entries],
          COUNT(CASE WHEN status IN (4) AND location='1' THEN 1 END) AS [Close Entries],
          COUNT(CASE WHEN status IN (5) AND location='1' THEN 1 END) AS [Cancelled Entries],
          SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS [Discounted Amount],
          COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 THEN 1 END) AS [Discounted Customer],
          COUNT(CASE WHEN status IN (1) AND Policy_Ren_Type='Insurance Renewal -1st Year' AND location='1' THEN 1 END) AS [1st Year Open Entries],
          COUNT(CASE WHEN status IN (4) AND Policy_Ren_Type='Insurance Renewal -1st Year' AND location='1' THEN 1 END) AS [1st Year Close Entries],
          COUNT(CASE WHEN status IN (5) AND Policy_Ren_Type='Insurance Renewal -1st Year' AND location='1' THEN 1 END) AS [1st Year Cancelled Entries],
          COUNT(CASE WHEN status IN (1) AND Policy_Ren_Type='Insurance Renewal -2nd Year' AND location='1' THEN 1 END) AS [2nd Year Open Entries],
          COUNT(CASE WHEN status IN (4) AND Policy_Ren_Type='Insurance Renewal -2nd Year' AND location='1' THEN 1 END) AS [2nd Year Close Entries],
          COUNT(CASE WHEN status IN (5) AND Policy_Ren_Type='Insurance Renewal -2nd Year' AND location='1' THEN 1 END) AS [2nd Year Cancelled Entries]
      FROM 
          insu_entry
  WHERE 
      cast(LeadDate as date) BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}'
 `
    if (PolicyRenType != 'null') {
      query += `and Policy_Ren_Type ='${PolicyRenType}'`
    }
    query += ` GROUP BY
      cre_name, Policy_Ren_Type) SELECT * FROM Summary

      UNION ALL
      SELECT
          NULL AS SRNo,
          'Total' AS [Tele-Caller],
          NULL AS Policy_Ren_Type,
          SUM([Total Renewed]) AS [Total Renewed],
          SUM([Open Entries]) AS [Open Entries],
          SUM([Close Entries]) AS [Close Entries],
          SUM([Cancelled Entries]) AS [Cancelled Entries],
          SUM([Discounted Amount]) AS [Discounted Amount],
          SUM([Discounted Customer]) AS [Discounted Customer],
          SUM([1st Year Open Entries]) AS [1st Year Open Entries],
          SUM([1st Year Close Entries]) AS [1st Year Close Entries],
          SUM([1st Year Cancelled Entries]) AS [1st Year Cancelled Entries],
          SUM([2nd Year Open Entries]) AS [2nd Year Open Entries],
          SUM([2nd Year Close Entries]) AS [2nd Year Close Entries],
          SUM([2nd Year Cancelled Entries]) AS [2nd Year Cancelled Entries]
      FROM
          Summary`
    secoundquery = `SELECT
            CASE
                WHEN status IS NULL THEN 'Pending'   
                WHEN status = 0 THEN 'Lost'
                WHEN status = 1 THEN 'Open'
                WHEN status = 4 THEN 'Close'        
                WHEN status = 5 THEN 'Cancelled'        
                ELSE ''
            END AS [STATUS],
      	  LEAD,
      	  cast(LeadDate as date)as Date,
          Policy_Ren_Type,
            CRE_NAME AS [CRE NAME],Customer_Name AS [CUSTOMER NAME],Premium [PREMIUM AMOUNT],Discount as [DISCOUNT GIVEN],Sub_Model AS [CAR MODEL NAME],CAST(Policy_Due AS DATE) AS [POLICY DUE DATE],Engine_No AS 
      [ENGINE NO],Chassis_No AS [CHASSIS NO],Registration_No as [Registration No],Year_Manufacture  AS [YEAR OF MANUFACTURE],
      CASE
                WHEN uploaded_document IS NULL THEN 'No'   
                WHEN uploaded_document IS NOT NULL THEN 'Yes'     
                ELSE ''
            END AS [Document Uploaded],
       web_policy AS [WEB POLICY],
       Field_Executive,
       Address1 as [Customer Address 1],
       Address2 as [Address 2],
       Address3 as [Address 3],
        MobileNo as [Mobile No],
       Phone_No as [Phone No],
       pincode as [PINCODE],
Mode_Of_Payment  as [Mode Of Payment],
       Cheque_No  as [Cheque No/UTR],
       Cheque_Date  as [Cheque Date/Transaction Date],
       Favour_Of  as [Favour Of],
       CancleRemark as [Cancle Remark],
 Created_By as [Created By],
      Created_At as [Created Date Time]
        FROM insu_entry
          WHERE cast(LeadDate as date) between
           '${dateFrom}' and '${dateto}' and location='${branch}'`;
    if (PolicyRenType != 'null') {
      secoundquery += `and Policy_Ren_Type ='${PolicyRenType}'`
    }

    let txnDetails;
    let secondDetails;


    txnDetails = await sequelize.query(query);
    secondDetails = await sequelize.query(secoundquery);


    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add headers for the first set of data
    const headers1 = Object.keys(txnDetails[0][0]);
    const headerRow1 = worksheet.addRow(headers1);
    headerRow1.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    // Add rows for the first set of data
    txnDetails[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });

    // Add a blank row for separation
    worksheet.addRow([]);

    // Add headers for the second set of data
    const headers2 = Object.keys(secondDetails[0][0]);
    const headerRow2 = worksheet.addRow(headers2);
    headerRow2.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    // Add rows for the second set of data
    secondDetails[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Insurance_Report.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="AttdenceReport.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  }
};

exports.DailyExpiryReport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const PolicyRenType = data.PolicyRenType;
    const cre = data.cre;
    const branch = data.branch
    const LeadDate = data.LeadDate;
    let query;
    let secoundquery;

    query = `SELECT 
      ROW_NUMBER() OVER (ORDER BY cre_name) AS SRNo,
      cre_name AS [Tele-Caller],
      COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) AS [Base],
      COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Conversion leads],
      COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Open leads],
      COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Closed leads],
      COUNT(CASE WHEN Status IN (5) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Cancle leads],
      CONCAT(
          CAST(
              COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) * 100.0 /
              NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END), 0) AS DECIMAL(5, 2)
          ), ''
      ) AS [Conversion %],
      COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4) THEN 1 END) AS [Discounted Leads],
      CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
  FROM
      insu_entry
  WHERE
      policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}'
  GROUP BY
      cre_name
UNION ALL
SELECT 
      NULL AS SRNo,
      'Total' AS [Tele-Caller],
      COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) AS [Base],
      COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Conversion leads],
      COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Open leads],
      COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Closed leads],
      COUNT(CASE WHEN Status IN (5) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Cancle leads],
      CONCAT(
          CAST(
              COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) * 100.0 /
              NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END), 0) AS DECIMAL(5, 2)
          ), ''
      ) AS [Conversion %],
      COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4) THEN 1 END) AS [Discounted Leads],
      CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
  FROM
      insu_entry
  WHERE
      policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}'
 `

    if (PolicyRenType != 'null' && PolicyRenType != 'all') {
      query = `
  SELECT 
  ROW_NUMBER() OVER (ORDER BY cre_name) AS SRNo,
  cre_name AS [Tele-Caller],
  COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) AS [Base],
  COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Conversion leads],
  COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Open leads],
  COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Closed leads],
  COUNT(CASE WHEN Status IN (5) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Cancle leads],
  CONCAT(
      CAST(
          COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END), 0) AS DECIMAL(5, 2)
      ), ''
  ) AS [Conversion %],
  COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4) THEN 1 END) AS [Discounted Leads],
  CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
FROM
  insu_entry
WHERE
  policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' and Policy_Ren_Type ='${PolicyRenType}'
GROUP BY
  cre_name
UNION ALL
SELECT 
  NULL AS SRNo,
  'Total' AS [Tele-Caller],
  COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) AS [Base],
  COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Conversion leads],
  COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Open leads],
  COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Closed leads],
  COUNT(CASE WHEN Status IN (5) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Cancle leads],
  CONCAT(
      CAST(
          COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END), 0) AS DECIMAL(5, 2)
      ), ''
  ) AS [Conversion %],
  COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4) THEN 1 END) AS [Discounted Leads],
  CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
FROM
  insu_entry
WHERE
  policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' 
  and Policy_Ren_Type ='${PolicyRenType}'`
    }
    if (LeadDate != 'null' && LeadDate != 'undefined') {
      query = `SELECT 
      ROW_NUMBER() OVER (ORDER BY cre_name) AS SRNo,
      cre_name AS [Tele-Caller],
      COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Total leads],
      COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Conversion leads],    
      COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Open leads],     
      COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Closed leads],   
      COUNT(CASE WHEN Status IN (5) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Cancelled leads],   
      CONCAT(
          CAST(
              COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) * 100.0 /
              NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END), 0) AS DECIMAL(5, 2)
          ), ''
      ) AS [Conversion %],
      COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4) and location='${branch}' THEN 1 END) AS [Discounted Leads],
      CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
  FROM
      insu_entry
  WHERE
      policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}'  
      group by CRE_NAME

UNION ALL

SELECT 
      NULL AS SRNo,
      'Total' AS [Tele-Caller],
      COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Total leads],
      COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Conversion leads],    
      COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Open leads],     
      COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Closed leads],   
      COUNT(CASE WHEN Status IN (5) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Cancelled leads],   
      CONCAT(
          CAST(
              COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) * 100.0 /
              NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END), 0) AS DECIMAL(5, 2)
          ), ''
      ) AS [Conversion %],
      COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4) and location='${branch}' THEN 1 END) AS [Discounted Leads],
      CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
  FROM
      insu_entry
  WHERE
      policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}';
`
      if (PolicyRenType != 'null' && PolicyRenType != 'all') {
        query = `SELECT 
  ROW_NUMBER() OVER (ORDER BY cre_name) AS SRNo,
  cre_name AS [Tele-Caller],
  COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Total leads],
  COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Conversion leads],    
  COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Open leads],     
  COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Closed leads],   
  COUNT(CASE WHEN Status IN (5) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Cancelled leads],   
  CONCAT(
      CAST(
          COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END), 0) AS DECIMAL(5, 2)
      ), ''
  ) AS [Conversion %],
  COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4) and location='${branch}' THEN 1 END) AS [Discounted Leads],
  CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
FROM
  insu_entry
WHERE
  policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}'  and Policy_Ren_Type ='${PolicyRenType}' 
  group by CRE_NAME

UNION ALL

SELECT 
  NULL AS SRNo,
  'Total' AS [Tele-Caller],
  COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END) AS [Total leads],
  COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Conversion leads],    
  COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Open leads],     
  COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Closed leads],   
  COUNT(CASE WHEN Status IN (5) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) AS [Cancelled leads],   
  CONCAT(
      CAST(
          COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}' and location='${branch}' THEN 1 END) * 100.0 /
          NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}' THEN 1 END), 0) AS DECIMAL(5, 2)
      ), ''
  ) AS [Conversion %],
  COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4) and location='${branch}' THEN 1 END) AS [Discounted Leads],
  CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
FROM
  insu_entry
WHERE
  policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}'  and Policy_Ren_Type ='${PolicyRenType}' ;
`
      }
    }



    secoundquery = `SELECT 
      ROW_NUMBER() OVER (ORDER BY YEAR(policy_due)) AS SRNo,
      CASE
            WHEN status IS NULL THEN 'Pending'
            WHEN status = 0 THEN 'Lost'   
            WHEN status = 1 THEN 'Open'   
            WHEN status = 4 THEN 'Closed' 
            WHEN status = 5 THEN 'Cancelled' 
            ELSE ''
        END AS [Status],
      Lead as [Lead Number],
      Cast(LeadDate as date) as [Lead Date],
      CRE_NAME as [Tele-Caller],
      Field_Executive,
      Engine_No AS [ENGINE NO],Chassis_No AS [CHASSIS NO],Registration_No as [Registration No],
      CAST(policy_due AS DATE) as [Policy Due Date],
      Customer_Name as [Customer's Name],
      Premium as [Premium Amount],
      Discount as [Discount],
      Policy_Ren_Type,
Created_By as [Created By],
      Created_At as [Created Date Time]
  FROM 
      insu_entry where
      policy_due between 
      '${dateFrom}' and '${dateto}' and location='${branch}'`;

    if (PolicyRenType != 'null' && PolicyRenType != 'all') {
      secoundquery += `and Policy_Ren_Type ='${PolicyRenType}'`
    }
    let txnDetails;
    let secondDetails;
    txnDetails = await sequelize.query(query);
    secondDetails = await sequelize.query(secoundquery);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    // Add headers for the first set of data
    const headers1 = Object.keys(txnDetails[0][0]);
    const headerRow1 = worksheet.addRow(headers1);
    headerRow1.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    // Add rows for the first set of data
    txnDetails[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });

    // Add a blank row for separation
    worksheet.addRow([]);

    // Add headers for the second set of data
    const headers2 = Object.keys(secondDetails[0][0]);
    const headerRow2 = worksheet.addRow(headers2);
    headerRow2.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    // Add rows for the second set of data
    secondDetails[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Insurance_Report.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="AttdenceReport.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  }
};

exports.reassignreport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const PolicyRenType = data.PolicyRenType;
    const CREName = data.cre;
    const branch = data.branch
    let query;
    query = `select  SRNo,Policy_No,Customer_Name,CRE_NAME,Policy_Due,Registration_No,Chassis_No,Engine_No,Year_Manufacture,Sub_Model,Address1,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type from insu_entry
    where policy_due between '${dateFrom}' and '${dateto}' and Location='${branch}' `

    if (PolicyRenType != 'undefined') {
      query += `and Policy_Ren_Type='${PolicyRenType}'`
    }
    if (CREName != 'undefined') {
      query = `select  SRNo,Policy_No,Customer_Name,CRE_NAME,Policy_Due,Registration_No,Chassis_No,Engine_No,Year_Manufacture,Sub_Model,Address1,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type from insu_entry
    where policy_due between '${dateFrom}' and '${dateto}' and cre_name='${CREName}' and Location='${branch}'`

      if (PolicyRenType != 'undefined') {
        query += `and Policy_Ren_Type='${PolicyRenType}'`
      }
    }

    let txnDetails;

    txnDetails = await sequelize.query(query);

    reportName = "Insurance Report";
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    // Add headers for the data starting from the 3rd row
    const headers = Object.keys(txnDetails[0][0]);
    const headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });
    txnDetails[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Insurance_Report.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    const workbook = new ExcelJS.Workbook();

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="AttdenceReport.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  }
};
exports.PolicyView = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, user_code, branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select
      SRNo,CRE_NAME,Policy_No,Customer_Name,Policy_Due,Chassis_No,Registration_No,Engine_No,Insu_Comp,Payment_Reconciliation,Reconciliation_Instrument_No,Reconciliation_Instrument_Drawn_On,Reconciliation_Instrument_Date,Reconciliation_Instrument_Amount
      from insu_entry where policy_due between '${dateFrom}' and '${dateto}' and Cre_Name='${user_code}'  and Web_Policy='yes' and status=4 and location='${branch}' `,
      { transaction: t }
    );

    await t.commit();
    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.fetchcrename = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { branch } = req.body
  try {
    const result = await sequelize.query(
      `select user_name as value,user_name as label from user_tbl where  export_type<3 and module_code=10 and multi_loc='${branch}'`
    );
    res.status(200).send(result[0]);
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.deliverydetailsfill = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, status, user_code, branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select
      SRNo,Policy_No,Customer_Name,CRE_NAME,Policy_Due,Chassis_No,Engine_No,Registration_No,Sub_Model,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status
      ,Delivery_Executive,Delivery_Date,Delivered,Conveyance_Applicable,Web_Policy
      from insu_entry where policy_due between '${dateFrom}' and '${dateto}' and Cre_Name='${user_code}' and status=1 and Payment_Status=1 and location='${branch}'`,
      { transaction: t }
    );

    await t.commit();
    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.PaymentData = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, status, user_code, branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select SRNo,CRE_NAME,Policy_No,Customer_Name,Payment_Status,Policy_Due,Chassis_No,Engine_No,Registration_No,Sub_Model,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where policy_due between '${dateFrom}' and '${dateto}' and CRE_NAME='${user_code}' and status is not null and status <> 0 and location='${branch}' `,
      { transaction: t }
    );
    await t.commit();

    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

async function uploadImage2(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    // console.log(files);
    await Promise.all(
      files?.map(async (file, index) => {
        const customPath = `${Comp_Code}/insurance/`;
        const ext = path.extname(file.originalname);
        // Generate randomUUID
        const randomUUID = uuidv4();
        // Append extension to randomUUID
        const fileName = randomUUID + ext;
        const formData = new FormData();
        formData.append("photo", file.buffer, fileName);
        formData.append("customPath", customPath);
        try {
          const response = await axios.post(
            "http://cloud.autovyn.com:3000/upload-photo",
            formData,
            {
              headers: formData.getHeaders(),
            }
          );
          const data = {
            SRNO: index,
            User_Name: Created_by,
            DOC_NAME: file.originalname,
            fieldname: file.fieldname,
            path: `${customPath}${fileName}`,
          };
          // console.log(data, 'data');
          dataArray.push(data);
          console.log(`Image uploaded successfully`);
        } catch (error) {
          console.log(error);
          console.error(`Error uploading image ${index}:, error.message`);
        }
        // Doc_Type	TRAN_ID	SRNO	path	File_Name	User_Name	Upload_Date	Export_type
      })
    );
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}

exports.deliverycopy = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const SRNo = req.body.SRNo;
    try {
      if (req.files) {
        console.log(req.files, "files");
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode,
          req.body.name
        );
        console.log(EMP_DOCS_data[0].path, "EMP_DOCS_data");
        await sequelize.query(
          `update insu_entry set delivery_copy='${EMP_DOCS_data[0].path}' where srno='${SRNo}'`
        );
        const result = await sequelize.query(
          `select 
          SRNo,MobileNo,Policy_No,Customer_Name,Policy_Due,Address1,Cust_City,PinCode,Delivered,Delivery_Date,Delivery_Copy
            from insu_entry where srno='${SRNo}'`
        );
        res.status(200).send(result[0]);
      } else {
        res.status(200).send("No File Uploaded");
      }
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};
exports.uploadeddocument = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const SRNo = req.body.SRNo;
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
          req.body.name
        );
        await sequelize.query(
          `update insu_entry set uploaded_document='${EMP_DOCS_data[0].path}' where srno='${SRNo}'`
        );
        const result = await sequelize.query(
          `select 
          uploaded_document
            from insu_entry where srno='${SRNo}'`
        );
        res.status(200).send(result[0][0].uploaded_document);
      } else {
        res.status(200).send("No File Uploaded");
      }
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};

exports.deliveryview = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, status, user_code } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select 
    SRNo,MobileNo,Policy_No,Customer_Name,Policy_Due,Address1,Cust_City,PinCode,Delivered,Delivery_Date,Delivery_Copy
      from insu_entry where Delivery_Date between '${dateFrom}' and '${dateto}' and Delivery_Executive='${user_code}'`,
      { transaction: t }
    );

    await t.commit();

    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.findLead = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { SRNO, branch } = req.body;
  let result;
  let t;
  try {
    t = await sequelize.transaction();
    result = await sequelize.query(
      `select *
      from insu_entry where srno=${SRNO}`,
      { transaction: t }
    );

    await t.commit();

    if (!result[0][0].Lead) {
      const data = await sequelize.query(`select isnull(Max(Lead)+1,1) as Lead from Insu_Entry where lead is not null and lead!='' and location ='${branch}'`)
      result[0][0].Lead = data[0][0].Lead
    }

    res.status(200).send(result[0][0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.updatedelivery = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { SRNo, Delivered, Remark } = req.body;
  const t = await sequelize.transaction();
  try {
    // Using parameterized query to prevent SQL injection
    await sequelize.query(
      `UPDATE insu_entry SET 
          Delivered = :Delivered, 
          Delv_Remark = COALESCE(:Remark, Delv_Remark),
          Act_Delivery_Date = GETDATE() 
        WHERE srno = :SRNo`,
      {
        replacements: { Delivered, Remark, SRNo },
        transaction: t,
      }
    );
    const result = await sequelize.query(
      `SELECT SRNo, MobileNo, Policy_No, Customer_Name, Policy_Due, Address1, Cust_City, PinCode, Delivered, Delivery_Date 
        FROM insu_entry 
        WHERE srno = :SRNo`,
      {
        replacements: { SRNo },
        transaction: t,
      }
    );
    await t.commit();
    res.status(200).send(result[0][0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.addcrecode = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const Insu_Entry = _Insu_Entry(sequelize, DataTypes);
  const { SRNo, Cre_Code } = req.body;
  const t = await sequelize.transaction();
  try {
    // Assuming SRNo is an array of ids
    await Insu_Entry.update(
      { CRE_NAME: Cre_Code },
      {
        where: {
          SRNo: SRNo,
        },
        transaction: t,
      }
    );
    const result = await sequelize.query(
      `select SRNo,Policy_No,Customer_Name,CRE_NAME,Policy_Due,Registration_No,Chassis_No,Engine_No,Year_Manufacture,Sub_Model,Address1,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type from insu_entry where SrNo in (${SRNo})`,
      { transaction: t }
    );

    await t.commit();
    res.status(200).send(result[0]);
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
function calculateDates(year, monthStart, monthEnd, month) {
  const fiscalYearstart = parseInt(monthStart) >= 4 ? year : year + 1;
  const fiscalYearend = parseInt(monthEnd) >= 4 ? year : year + 1;
  const startDate = new Date(fiscalYearstart, parseInt(monthStart) - 1, 2);
  const yearStart = new Date(year, parseInt(month) - 1, 2);
  const endDate = new Date(fiscalYearend, parseInt(monthEnd), 1);
  return {
    start: startDate.toISOString().slice(0, 10),
    end: endDate.toISOString().slice(0, 10),
    yearStart: yearStart.toISOString().slice(0, 10),
  };
}

const getMonthStartAndEndDates = (year, month) => {
  // Calculate the start date of the month
  const startDate = new Date(year, month - 1, 2); // Subtract 1 to adjust for 0-indexed month

  // Calculate the end date of the month
  const endDate = new Date(year, month, 1);

  return { startDate, endDate };
};

exports.Insurancedashboard = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  // const Insu_Entry = _Insu_Entry(sequelize, DataTypes);
  let { monthFrom, monthTo, year, branch } = req.body;

  const t = await sequelize.transaction();
  try {
    const allresult = await sequelize.query(
      `
      select sum(TARGET)  as total from CRE_TARGETS where
      Year='${year}' and month='${monthFrom}' 
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}'  and Status is null and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}'  and Status =1 and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}'  and Status =0 and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}'  and Status =4 and location='${branch}'
      `,
      { transaction: t }
    );
    const dashboard1 = await sequelize.query(`
      SELECT 
      loc_code as cre_name,
      COUNT(*) AS total_assign,
      COUNT(CASE WHEN status = 4 THEN 1 END) AS Closed_Entries,
    COUNT(CASE WHEN status = 1 THEN 1 END) AS Target FROM insu_entry
    WHERE MONTH(Policy_Due) = '${monthFrom}'
    AND YEAR(Policy_Due) = '${year}' and location='${branch}'
    GROUP BY loc_code `);

    const dashboard = await sequelize.query(`
      SELECT 
      cre_name,
      (SELECT TOP 1 target 
       FROM CRE_TARGETS 
       WHERE MONTH(GETDATE()) = '${monthFrom}' 
         AND YEAR(GETDATE()) = '${year}' 
         AND CRE_CODE = Insu_Entry.CRE_NAME) AS Target,
      COUNT(*) AS total_assign,
      COUNT(CASE WHEN status = 4 THEN 1 END) AS Closed_Entries
    FROM insu_entry
    WHERE Month(Policy_Due) ='${monthFrom}'
      AND YEAR(Policy_Due) = '${year}'
        and location='${branch}'
    GROUP BY cre_name; `);

    if (monthFrom == 1) {
      monthFrom = 12;
      year = year - 1;
    } else {
      monthFrom = monthFrom - 1;
    }
    const allresultprevios = await sequelize.query(
      `
      select sum(TARGET)  as total from CRE_TARGETS where
      Year='${year}' and month='${monthFrom}' 
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}'  and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}'  and Status is null and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}'  and Status =1 and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}'  and Status =0 and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}'  and Status =4 and location='${branch}'
      `,
      { transaction: t }
    );
    const combinedObject = {
      Total_Target: allresult[0][0].total || 0,
      Total_Assign: allresult[0][1].total || 0,
      Total_Pending: allresult[0][2].total || 0,
      Total_Open: allresult[0][3].total || 0,
      Total_Lost: allresult[0][4].total || 0,
      Total_Closed: allresult[0][5].total || 0,
    };
    const combinedObjectPrev = {
      Total_Target: allresultprevios[0][0].total || 0,
      Total_Assign: allresultprevios[0][1].total || 0,
      Total_Pending: allresultprevios[0][2].total || 0,
      Total_Open: allresultprevios[0][3].total || 0,
      Total_Lost: allresultprevios[0][4].total || 0,
      Total_Closed: allresultprevios[0][5].total || 0,
    };
    await t.commit();
    res.status(200).send({
      current: combinedObject,
      previous: combinedObjectPrev,
      dashboard: dashboard[0],
      dashboard1: dashboard1[0],
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.branch = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { branch } = req.body;
  try {
    const t = await sequelize.transaction();
    const result = await sequelize.query(
      `select godw_code as value,godw_name as label from godown_mst where godw_code in (${branch}) and export_type<3`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.excelimportexecutive = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    const user = req.body.user;
    const branch = req.body.branch;
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    console.log(transformedData, "ssks");
    if (!transformedData?.length) {
      sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    const renameKeys = (obj) => {
      const keyMap = {
        "User Name": "Misc_Name",
        Location: "Loc_code",
        "MobileNo.": "Misc_Mob",
        Email: "Misc_Phon",
      };

      return Object.keys(obj).reduce((acc, key) => {
        // Determine the new key based on keyMap; if not found, use the original key
        const newKey = keyMap[key] || key;

        // Transform the value: convert empty strings to null, and other values to strings
        acc[newKey] = obj[key] === "" ? null : String(obj[key]);

        // Return the accumulator for the next iteration
        return acc;
      }, {});
    };
    const data = transformedData.map(renameKeys);
    function adjustToIST(dateStr) {
      const date = new Date(dateStr);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 31);
      const ISTDateStr = date.toISOString();
      return ISTDateStr.slice(0, 10);
    }
    // cheking duplicate employeeCode
    const empCodesdata = data.map((obj) => `'${obj.Misc_Name}'`);
    const empcode = await sequelize.query(
      `select distinct(Misc_Name) from Misc_Mst where Misc_Name in (${empCodesdata.length ? empCodesdata : ""
      } )and Misc_Type = '7' and export_type <3`
    );
    console.log(empcode, "gfd");

    const ErroredData = [];
    const CorrectData = [];

    data.map((obj) => {
      let oldObj = { ...obj };
      const rejectionReasons = [];

      if (
        empcode[0].some(
          (item) => item.Misc_Name?.toString() == obj.Misc_Name?.toString()
        )
      ) {
        rejectionReasons.push(`Duplicate User Name ${obj.Misc_Name}`, " | ");
      }

      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons?.slice(0, -1),
        });
      } else {
        obj.Created_By = user;
        obj.loc_code = branch;
        CorrectData.push(obj);
        // }
      }
    });

    CorrectData.map((data) => {
      // Extract data from the object
      const { Misc_Name, Loc_code, Misc_Mob, Misc_Phon } = data;

      const result = sequelize.query(
        `Insert into Misc_Mst(misc_code,Misc_Name,Loc_code,Misc_Mob,Misc_Phon,misc_type,Export_Type,ServerId)
         values ((SELECT COALESCE(MAX(misc_code + 1), 1) AS next_misc_code FROM Misc_Mst WHERE Misc_Type = 7),'${Misc_Name}','${Loc_code}','${Misc_Mob}','${Misc_Phon}',7,1,1)`
      );
    });
    console.log(CorrectData.length, "enue");
    await t.commit();
    await sequelize.close();
    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: CorrectData,
      Message: `${CorrectData.length} Records Inserted`,
    });
    // res.status(200).send("imported Successfully");
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};
exports.credashboard = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  // const Insu_Entry = _Insu_Entry(sequelize, DataTypes);
  let { monthFrom, monthTo, year, branch, user_code } = req.body;
  const dates = calculateDates(year, monthFrom, monthFrom, 4);
  const t = await sequelize.transaction();
  try {
    const allresult = await sequelize.query(
      `
      select sum(TARGET)  as total from CRE_TARGETS where
      Year='${year}' and month='${monthFrom}' and cre_code = '${user_code}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and Status is null and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and Status =1 and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and Status =0 and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and Status =4 and location='${branch}'
      `,
      { transaction: t }
    );
    const dashboard = await sequelize.query(`
      SELECT 
      cre_name,
      (SELECT TOP 1 target 
       FROM CRE_TARGETS 
       WHERE MONTH(GETDATE()) = '${monthFrom}' 
         AND YEAR(GETDATE()) = '${year}' 
         AND CRE_CODE = Insu_Entry.CRE_NAME) AS Target,
      COUNT(*) AS total_assign,
      COUNT(CASE WHEN status = 4 THEN 1 END) AS Closed_Entries
    FROM insu_entry
    WHERE Month(Policy_Due) ='${monthFrom}'
      AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and location='${branch}'
    GROUP BY cre_name; `);
    if (monthFrom == 1) {
      monthFrom = 12;
      year = year - 1;
    } else {
      monthFrom = monthFrom - 1;
    }
    const allresultprevios = await sequelize.query(
      `
      select sum(TARGET)  as total from CRE_TARGETS where
      Year='${year}' and month='${monthFrom}' and cre_code = '${user_code}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and Status is null and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and Status =1 and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and Status =0 and location='${branch}'
     union all
     select
     count(*) as total
     from insu_entry where MONTH(Policy_Due) = '${monthFrom}'
 AND YEAR(Policy_Due) = '${year}' and CRE_NAME = '${user_code}' and Status =4 and location='${branch}'
      `,
      { transaction: t }
    );
    const combinedObject = {
      Total_Target: allresult[0][0].total || 0,
      Total_Assign: allresult[0][1].total || 0,
      Total_Pending: allresult[0][2].total || 0,
      Total_Open: allresult[0][3].total || 0,
      Total_Lost: allresult[0][4].total || 0,
      Total_Closed: allresult[0][5].total || 0,
    };
    const combinedObjectPrev = {
      Total_Target: allresultprevios[0][0].total || 0,
      Total_Assign: allresultprevios[0][1].total || 0,
      Total_Pending: allresultprevios[0][2].total || 0,
      Total_Open: allresultprevios[0][3].total || 0,
      Total_Lost: allresultprevios[0][4].total || 0,
      Total_Closed: allresultprevios[0][5].total || 0,
    };
    await t.commit();
    res.status(200).send({
      current: combinedObject,
      previous: combinedObjectPrev,
      dashboard: dashboard[0],
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.CreReport = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const report_type = req.body.reporttype;
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const Policy_Ren_Type = req.body.Policy_Ren_Type;
    const LeadDate = req.body.LeadDate;
    const branch = req.body.branch;
    let query;
    if (report_type == "1") {
      query = `SELECT 
    ROW_NUMBER() OVER (ORDER BY cre_name) AS SRNo,
    cre_name AS [Tele-Caller],
    Policy_Ren_Type,
    COUNT(*) AS [Total Customer],
    COUNT(CASE WHEN status IN (4, 1) THEN 1 END) AS [Renewed],
    CONCAT(CAST(COUNT(CASE WHEN status IN (4, 1) THEN 1 END) * 100.0 / COUNT(*) AS DECIMAL(5, 2)), '%') AS [% age], 
    COUNT(CASE WHEN status IN (1) THEN 1 END) AS [Open],
    COUNT(CASE WHEN status IN (4) THEN 1 END) AS [Closed],
    SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS [Discounted Amount],
    COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 THEN 1 END) AS [Discounted Customer]
FROM 
    insu_entry
  WHERE 
      policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}'
  GROUP BY 
       cre_name, Policy_Ren_Type`;
    } else if (report_type == "2") {
      query = `SELECT
      CASE
          WHEN status IS NULL THEN 'Pending'
          WHEN status = 0 THEN 'Lost'
          WHEN status = 1 THEN 'Open'
          WHEN status = 4 THEN 'Close'
          ELSE ''
      END AS [STATUS],
      CRE_NAME AS [CRE NAME],Customer_Name AS [CUSTOMER NAME],Premium [PREMIUM AMOUNT],Discount as [DISCOUNT GIVEN],Sub_Model AS [CAR MODEL NAME],CAST(Policy_Due AS DATE) AS [POLICY DUE DATE],Engine_No AS
[ENGINE NO],Chassis_No AS [CHASSIS NO],Year_Manufacture  AS 
[YEAR OF MANUFACTURE],
CASE
          WHEN uploaded_document IS NULL THEN 'No'
          WHEN uploaded_document IS NOT NULL THEN 'Yes'     
          ELSE ''
      END AS [Document Uploaded],
 web_policy AS [WEB POLICY],
 Field_Executive as [Field Executive],
 Customer_Name as [Customer Name],
 Address1 as [Customer Address],
 MobileNo as [Mobile No]
  FROM insu_entry
    WHERE policy_due between
    '${dateFrom}' and '${dateto}'  and location='${branch}'`;
    } else if (report_type == "3") {
      query = `WITH AggregatedData AS (
    SELECT 
        loc_code AS [Branch],
        Policy_ren_type AS [Policy Renewal Type],
        COUNT(*) AS [Total Customer],
        COUNT(CASE WHEN status IN (4, 1) THEN 1 END) AS [Renewed],
        CONCAT(CAST(COUNT(CASE WHEN status IN (4, 1) THEN 1 END) * 100.0 / COUNT(*) AS DECIMAL(5, 2)), '%') AS [% age],
        COUNT(CASE WHEN status = 1 THEN 1 END) AS [Open],
        COUNT(CASE WHEN status = 4 THEN 1 END) AS [Closed],
        CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount],
        COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 THEN 1 END) AS [Discounted Customer]
    FROM
        insu_entry
    WHERE
        policy_due BETWEEN '${dateFrom}' and '${dateto}'  and location='${branch}'
    GROUP BY
        loc_code,
        Policy_ren_type
)
SELECT 
    ROW_NUMBER() OVER (ORDER BY [Branch]) AS SRNo,
    [Branch],
    [Policy Renewal Type],
    [Total Customer],
    [Renewed],
    [% age],
    [Open],
    [Closed],
    [Discount Amount],
    [Discounted Customer]
FROM
    AggregatedData
ORDER BY
    [Branch]`;
    } else if (report_type == "4") {
      query = `SELECT 
      ROW_NUMBER() OVER (ORDER BY Sub_Model) AS SRNo,
      ISNULL(Sub_Model, 'No model found') AS [MODEL NAME],
      COUNT(*) AS [Total Customer],
      COUNT(CASE WHEN status in(4,1) THEN 1 END) AS [Renewed],
      CONCAT(CAST(COUNT(CASE WHEN status in(4,1) THEN 1 END) * 100.0 / COUNT(*) AS DECIMAL(5, 2)), '%') AS [% age],
      CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount],
    COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 THEN 1 END) AS [Discounted Customer]
  FROM 
      insu_entry where
      policy_due between 
      '${dateFrom}' and '${dateto}'  and location='${branch}'
  GROUP BY 
      Sub_Model;`;
    } else if (report_type == "5") {
      query = `WITH AggregatedData AS (
        SELECT
            Year_Manufacture AS [Sold Year],
            COUNT(*) AS [Total Customer],
            COUNT(CASE WHEN status IN (4, 1) THEN 1 END) AS 
[Renewed],
            CONCAT(CAST(COUNT(CASE WHEN status IN (4, 1) THEN 1 END) * 100.0 / COUNT(*) AS DECIMAL(5, 2)), '%') AS [% age],
         COUNT(CASE WHEN status IN (1) THEN 1 END) AS [Open],
        COUNT(CASE WHEN status IN (4) THEN 1 END) AS [Closed],
		COUNT(CASE WHEN status in(1) and Policy_Ren_Type='Insurance Renewal -1st Year' THEN 1 END) AS [1st Year Open Entries],
      COUNT(CASE WHEN status in(4) and Policy_Ren_Type='Insurance Renewal -1st Year' THEN 1 END) AS [1st Year Close Entries],
	  COUNT(CASE WHEN status in(1) and Policy_Ren_Type='Insurance Renewal -2nd Year' THEN 1 END) AS [2nd Year Open Entries],
      COUNT(CASE WHEN status in(4) and Policy_Ren_Type='Insurance Renewal -2nd Year' THEN 1 END) AS [2nd Year Close Entries]
        FROM
            insu_entry
        WHERE
            policy_due BETWEEN '${dateFrom}' and '${dateto}'  and location='${branch}'
             GROUP BY Year_Manufacture
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY [Sold Year]) AS SRNo,   
        [Sold Year],
        [Total Customer],
        [Renewed],
        [% age],
      [Open],
      [Closed],
	  [1st Year Open Entries],
	  [1st Year Close Entries],
	  [2nd Year Open Entries],
	  [2nd Year Close Entries]

    FROM
        AggregatedData
    ORDER BY
        [Sold Year]`;
    } else if (report_type == "6") {
      query = `SELECT 
      ROW_NUMBER() OVER (ORDER BY YEAR(policy_due)) AS SRNo,
      Lead as [Lead Number],
      Cast(LeadDate as date) as [Lead Date],
      Policy_Ren_Type,
    Proposal_No as [Proposal No],
    CAST(policy_due AS DATE) as [Policy Due Date],
    Customer_Name as [Customer's Name],
    MobileNo as [Contact No],
    Address1 as [Area],
    FollowUpDate as [Follow Date],
    CASE
            WHEN status IS NULL THEN 'Pending'
            WHEN status = 0 THEN 'Lost'   
            WHEN status = 1 THEN 'Open'   
            WHEN status = 4 THEN 'Closed' 
            ELSE ''
        END AS [Status],
    Premium as [Premium Amount],
    CRE_NAME as [Tele-Caller],
    Field_Executive as [Field Executive],
    Discount as [Discount]
  FROM 
      insu_entry where
      policy_due between 
      '${dateFrom}' and '${dateto}'  and location='${branch}'`;
    } else if (report_type == "7") {
      query = `SELECT 
      ROW_NUMBER() OVER (ORDER BY cre_name) AS SRNo,
      cre_name AS [Tele-Caller],
      COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) AS [Total leads],
      COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) AS [Conversion leads],    
         COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) AS [Open leads],     
      COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) AS [Closed leads], 
      COUNT(CASE WHEN Status IN (5) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) AS [Cancelled leads],   
      CONCAT(
          CAST(
              COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END) * 100.0 /
              NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}' THEN 1 END), 0) AS DECIMAL(5, 2)
          ), ''
      ) AS [Conversion %],
     COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4) THEN 1 END) AS [Discounted Leads],
    CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
  FROM
      insu_entry
  WHERE
      policy_due BETWEEN '${dateFrom}' and '${dateto}' and location='${branch}'
 `;
      if (LeadDate) {
        query = `SELECT 
      ROW_NUMBER() OVER (ORDER BY cre_name) AS SRNo,
      cre_name AS [Tele-Caller],
      COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}'  and location='${branch}' THEN 1 END) AS [Total leads],
      COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}'  and location='${branch}' THEN 1 END) AS [Conversion leads],    
         COUNT(CASE WHEN Status IN (1) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}'  and location='${branch}' THEN 1 END) AS [Open leads],     
      COUNT(CASE WHEN Status IN (4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}'  and location='${branch}' THEN 1 END) AS [Closed leads],   
      CONCAT(
          CAST(
              COUNT(CASE WHEN Status IN (1, 4) AND policy_due BETWEEN '${dateFrom}' and '${dateto}' and cast(LeadDate as date) <= '${LeadDate}'  and location='${branch}' THEN 1 END) * 100.0 /
              NULLIF(COUNT(CASE WHEN policy_due BETWEEN '${dateFrom}' and '${dateto}'  and location='${branch}' THEN 1 END), 0) AS DECIMAL(5, 2)
          ), ''
      ) AS [Conversion %],
     COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 AND Status IN (1, 4)  and location='${branch}' THEN 1 END) AS [Discounted Leads],
    CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount]
  FROM
      insu_entry
  WHERE
      policy_due BETWEEN '${dateFrom}' and '${dateto}'  and location='${branch}'`
      }
      if (Policy_Ren_Type && Policy_Ren_Type != 'all') {
        query += `and Policy_Ren_Type='${Policy_Ren_Type}'`
      }

      query += ` GROUP BY
      cre_name;`
    } else if (report_type == "8") {
      query = `SELECT 
          ROW_NUMBER() OVER (ORDER BY MONTH(policy_due)) AS SRNo,
          DATENAME(MONTH, policy_due) as [Month],
          COUNT(*) AS [Total leads],
          CAST(SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS INT) AS [Discount Amount],
    COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 THEN 1 END) AS [Discounted Leads]          
      FROM 
          insu_entry
      WHERE 
          policy_due BETWEEN '${dateFrom}' and '${dateto}'  and location='${branch}'
      GROUP BY 
          DATENAME(MONTH, policy_due), 
          MONTH(policy_due)
      ORDER BY 
          MONTH(policy_due)
      `;
    } else if (report_type == "9") {
      query = `
      SELECT 
      ROW_NUMBER() OVER (ORDER BY YEAR(policy_due)) AS SRNo,
       Lead as [Lead Number],
		 Cast(LeadDate as Date)as [Lead Date],
	  CRE_NAME as [Tele-Caller],
	  Field_Executive as [Field Executive],
	   Customer_Name as [Customer's Name],
	    Proposal_No as [Proposal No],
		
		  FollowUpDate as [Follow Date],
		Cast(policy_due as Date) as [Policy Due Date],
		  Cast(Cheque_Date as Date)   as [Cheque Date],
		 Cast(Policy_Issued_Date as Date) as [Policy Issue Date],
      CASE
            WHEN status IS NULL THEN 'Pending'
            WHEN status = 0 THEN 'Lost'   
            WHEN status = 1 THEN 'Open'   
            WHEN status = 4 THEN 'Closed' 
            ELSE ''
        END AS [Status],
    Premium as [Premium Amount],
	Policy_Ren_Type,
	 Address1 as [Area]
  FROM 
      insu_entry
     WHERE policy_due between 
    '${dateFrom}' and '${dateto}'  and location='${branch}'
      `;
    }
    //    else if (report_type == "10") {
    //     query = `SELECT 
    //     ROW_NUMBER() OVER (ORDER BY YEAR(policy_due)) AS SRNo,
    //     Lead as [Lead Number],
    // 	 Cast(LeadDate as Date)as [Lead Date],
    //     Field_Executive as [Field Executive],
    //    Customer_Name as [Customer's Name],
    //     Proposal_No as [Proposal No],
    // 	  FollowUpDate as [Follow Date],
    // 	  Cast(policy_due as Date) as [Policy Due Date],
    // 	  Cast(Cheque_Date as Date)   as [Cheque Date],
    // 	  Cast(Policy_Issued_Date as Date) as [Policy Issue Date],
    //     CASE
    //           WHEN status IS NULL THEN 'Pending'
    //           WHEN status = 0 THEN 'Lost'   
    //           WHEN status = 1 THEN 'Open'   
    //           WHEN status = 4 THEN 'Closed' 
    //           ELSE ''
    //       END AS [Status],
    //   Premium as [Premium Amt],
    // Policy_Ren_Type,
    //  Address1 as [Area]
    // FROM 
    //     insu_entry WHERE policy_due between 
    //    '${dateFrom}' and '${dateto}'`;
    //   } 
    else if (report_type == "11") {
      query = `
      WITH NumberedEntries AS (
    SELECT
        CRE_NAME AS [Tele-Caller],
        Lead as [Lead Number],
		    Cast(LeadDate as Date)as [Lead Date],
        registration_no AS [Registration No],
        Delivery_Executive AS [Delivery Executive],
        Customer_Name AS [Customer's Name],
        Premium AS [Premium Amt],
        Address1 AS [Area],
        FORMAT(25.00, 'N2') AS [Conveyance Amount],

        ROW_NUMBER() OVER (PARTITION BY CRE_NAME ORDER BY Policy_Due) AS autogen
    FROM insu_entry
    WHERE
        policy_due BETWEEN '${dateFrom}' AND '${dateto}'
        AND delivered = 1
        AND Conveyance_Applicable = 1  and location='${branch}'
)
SELECT
    CASE WHEN autogen = 1 THEN [Tele-Caller] ELSE '' END AS [Telly Caller],
    autogen AS [Srl No],
    [Registration No],
    [Customer's Name],
    [Lead No],
    [Premium Amt],
    [Area],
    [Delivery Executive],
    [Conveyance amount] -- Include the new column in the final SELECT
FROM NumberedEntries
ORDER BY [Tele-Caller], autogen;

      `;
    }
    else if (report_type == "12") {
      query = `SELECT 
      ROW_NUMBER() OVER (ORDER BY YEAR(policy_due)) AS SRNo,
      Lead as [Lead Number],
		 Cast(LeadDate as Date)as [Lead Date],
	   Customer_Name as [Customer's Name],
	   Field_Executive as [Field Executive],
	   Phone_No as [Contact No],
	   CASE
          WHEN status IS NULL THEN 'Pending'   
          WHEN status = 0 THEN 'Lost'
          WHEN status = 1 THEN 'Open'
          WHEN status = 4 THEN 'Close'        
          WHEN status = 5 THEN 'Cancelled'       
          ELSE ''
      END as [Policy Status],
	    policy_due as [Expiry Date],
		 Policy_Issued_Date as [Policy Issue Date],
		 Delivery_Date as [Policy Delivery Date],
		 Delivered as [Delivered]
  FROM 
      insu_entry
     WHERE policy_due between 
     '${dateFrom}' and '${dateto}' and LeadDate  is not null and LEAD is not null  and location='${branch}' order by lead`;
    }
    else if (report_type == "13") {
      query = `SELECT 
       ROW_NUMBER() OVER (ORDER BY cre_name) AS SRNo,
      cre_name AS [Tele-Caller],
      Policy_Ren_Type,
      COUNT(CASE WHEN status in(4,1,5) THEN 1 END) AS [Total Renewed],
      COUNT(CASE WHEN status in(1) THEN 1 END) AS [Open Entries],
      COUNT(CASE WHEN status in(4) THEN 1 END) AS [Close Entries],
      COUNT(CASE WHEN status in(5) THEN 1 END) AS [Cancelled Entries],
	    SUM(TRY_CAST(Discount AS DECIMAL(10, 2))) AS [Discounted Amount],
      COUNT(CASE WHEN TRY_CAST(Discount AS DECIMAL(10, 2)) IS NOT NULL AND TRY_CAST(Discount AS DECIMAL(10, 2)) <> 0 THEN 1 END) AS [Discounted Customer],
      COUNT(CASE WHEN status in(1) and Policy_Ren_Type='Insurance Renewal -1st Year' THEN 1 END) AS [1st Year Open Entries],
      COUNT(CASE WHEN status in(4) and Policy_Ren_Type='Insurance Renewal -1st Year' THEN 1 END) AS [1st Year Close Entries],
      COUNT(CASE WHEN status in(5) and Policy_Ren_Type='Insurance Renewal -1st Year' THEN 1 END) AS [1st Year Cancelled Entries],
	  COUNT(CASE WHEN status in(1) and Policy_Ren_Type='Insurance Renewal -2nd Year' THEN 1 END) AS [2nd Year Open Entries],
      COUNT(CASE WHEN status in(4) and Policy_Ren_Type='Insurance Renewal -2nd Year' THEN 1 END) AS [2nd Year Close Entries],
      COUNT(CASE WHEN status in(5) and Policy_Ren_Type='Insurance Renewal -2nd Year' THEN 1 END) AS [2st Year Cancelled Entries]
      
  FROM 
      insu_entry
  WHERE 
      cast(LeadDate as date) BETWEEN '${dateFrom}' and '${dateto}'  and location='${branch}'
  GROUP BY 
      cre_name, Policy_Ren_Type`;
    }
    else if (report_type == "14") {
      query = `SELECT
            CASE
                WHEN status IS NULL THEN 'Pending'   
                WHEN status = 0 THEN 'Lost'
                WHEN status = 1 THEN 'Open'
                WHEN status = 4 THEN 'Close'        
                WHEN status = 5 THEN 'Cancelled'        
                ELSE ''
            END AS [STATUS],
      	  LEAD,
      	  cast(LeadDate as date)as Date,
          Policy_Ren_Type,
            CRE_NAME AS [CRE NAME],Customer_Name AS [CUSTOMER NAME],Premium [PREMIUM AMOUNT],Discount as [DISCOUNT GIVEN],Sub_Model AS [CAR MODEL NAME],CAST(Policy_Due AS DATE) AS [POLICY DUE DATE],Engine_No AS 
      [ENGINE NO],Chassis_No AS [CHASSIS NO],Year_Manufacture  AS [YEAR OF MANUFACTURE],
      CASE
                WHEN uploaded_document IS NULL THEN 'No'   
                WHEN uploaded_document IS NOT NULL THEN 'Yes'     
                ELSE ''
            END AS [Document Uploaded],
       web_policy AS [WEB POLICY],
       Field_Executive as [Field Executive],
       Customer_Name as [Customer Name],
       Address1 as [Customer Address],
       MobileNo as [Mobile No]

        FROM insu_entry
          WHERE cast(LeadDate as date) between
           '${dateFrom}' and '${dateto}'  and location='${branch}'`;

    }

    const result = await sequelize.query(query);
    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};
exports.users = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `SELECT 
      u.user_code, 
      u.user_name, 
      u.user_mob, 
      u.user_email, 
      t.target AS Target,
      b.base AS Base
  FROM 
      user_tbl u
  LEFT JOIN 
      (SELECT 
           CRE_CODE, 
           target 
       FROM 
           CRE_TARGETS 
       WHERE 
           MONTH(GETDATE()) = MONTH 
           AND YEAR(GETDATE()) = YEAR) t 
  ON 
      u.user_name = t.CRE_CODE
  LEFT JOIN 
      (SELECT 
           CRE_NAME, 
           COUNT(*) AS base 
       FROM 
           Insu_Entry 
       WHERE 
           MONTH(Policy_Due) = MONTH(GETDATE()) 
           AND YEAR(Policy_Due) = YEAR(GETDATE()) 
           and location='${branch}'
       GROUP BY 
           CRE_NAME) b 
  ON 
      u.user_name = b.CRE_NAME
  WHERE 
      u.export_type < 3 
      AND u.module_code = 10 and u.multi_loc='${branch}'`,
      { transaction: t }
    );

    await t.commit();

    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.findcredata = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { user_code } = req.query;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select user_code as CRE_CODE,user_name as CRE_NAME,user_mob,user_email from user_tbl where user_Name='${user_code}' and export_type<3 and module_code=10`,
      { transaction: t }
    );
    const Prevtarget = await sequelize.query(
      `select * from CRE_TARGETS where cre_code='${user_code}'`
    );
    await t.commit();
    res.status(200).send({ result: result[0][0], tabledata: Prevtarget[0] });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.findallCre = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { branch } = req.query;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select user_name as value,user_name as label from user_tbl where  export_type<3 and module_code=10 and user_name!='' and  (',' + multi_loc + ',' LIKE '%,${branch},%') `,
      { transaction: t }
    );
    const result1 = await sequelize.query(
      `select Misc_Code as value,Misc_Name as label from misc_mst where misc_type=39 and export_type<3`,
      { transaction: t }
    );
    const result2 = await sequelize.query(
      `select distinct sub_model as value, sub_model as label from Insu_Entry where sub_model is not null and Sub_Model !=''`,
      { transaction: t }
    );

    const result3 = await sequelize.query(
      `select distinct User_Name as value, User_Name as label from user_tbl where Export_Type<3 and Module_Code ='10' and user_name!='' and  (',' + multi_loc + ',' LIKE '%,${branch},%')
      `,
      { transaction: t }
    );
    const result4 = await sequelize.query(
      `select distinct Misc_Name as value, Misc_Name as label from misc_mst where misc_type=7 and export_type<3`,
      { transaction: t }
    );
    const data = await sequelize.query(`select isnull(Max(Lead)+1,1) as Lead from Insu_Entry where lead is not null and lead!='' and location ='${branch}'`)

    await t.commit();
    res.send({
      success: true,
      result: result[0],
      result1: result1[0],
      result2: result2[0],
      result3: result3[0],
      result4: result4[0],
      data: data[0][0].Lead
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.SaveCre = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const CRE_CODE = req.body.CRE_CODE;
  const MONTH = req.body.MONTH;
  const YEAR = req.body.YEAR;
  const TARGET = req.body.TARGET;
  const Created_by = req.body.Created_by;

  const result =
    await sequelize.query(`SELECT CRE_CODE AS CRE_CODE , MONTH, YEAR
      FROM CRE_TARGETS
      WHERE CRE_CODE = '${CRE_CODE}' AND MONTH = '${MONTH}' AND YEAR = '${YEAR}'`);

  if (result[0].length > 0) {
    await sequelize.query(
      `update CRE_TARGETS set TARGET = '${TARGET}' where CRE_CODE = '${CRE_CODE}' AND MONTH = '${MONTH}' AND YEAR = '${YEAR}'`
    );

    res.status(201).send("CRE Target Updated Successfully ");
    return;
  }
  let t;
  try {
    const t = await sequelize.transaction();
    const result = await sequelize.query(
      `INSERT INTO CRE_TARGETS(CRE_CODE,MONTH,YEAR,TARGET,Created_by) VALUES('${CRE_CODE}','${MONTH}','${YEAR}','${TARGET}','${Created_by}')`,
      { transaction: t }
    );

    await t.commit();
    res.status(200).send({ result: result[0][0] });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.SaveExecutive = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const Misc_Name = req.body.Misc_Name;
  const Misc_Mob = req.body.Misc_Mob;
  const Loc_code = req.body.Loc_code;
  const Misc_Phon = req.body.Misc_Phon;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `Insert into Misc_Mst(misc_code,Misc_Name,Loc_code,Misc_Mob,Misc_Phon,misc_type,Export_Type,ServerId)
      values ((SELECT COALESCE(MAX(misc_code + 1), 1) AS next_misc_code FROM Misc_Mst WHERE Misc_Type = 7),'${Misc_Name}','${Loc_code}','${Misc_Mob}','${Misc_Phon}',7,1,1)`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send({ result: result[0][0] });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.UpdateExecutive = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const Misc_Name = req.body.Misc_Name;
  const Misc_Mob = req.body.Misc_Mob;
  const Misc_Abbr = req.body.Misc_Abbr;
  const Misc_Phon = req.body.Misc_Phon;
  const misc_code = req.body.misc_code;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `update Misc_Mst set Misc_Name = '${Misc_Name}', Misc_Mob ='${Misc_Mob}', Misc_Phon = '${Misc_Phon}', Misc_Abbr = '${Misc_Abbr}' where Misc_Type = '7' and export_type <3 and misc_code ='${misc_code}'`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send({ result: result[0][0] });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.ViewExecutive = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { branch } = req.body
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select misc_code, Misc_Name,Misc_Mob,(select top 1 godw_name from godown_mst where godw_code=Loc_code and export_type<3)as Loc_code,Misc_Phon,misc_abbr from  Misc_Mst where  Misc_Type = '7' and export_type <3 and loc_code='${branch}'`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send({ result: result[0] });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.importformatmini = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Insurance Excel Import";
    const Headeres = [
      "Policy No",
      "CRE NAME",
      "Customer Name",
      "Policy Due for Renewal",
      "Registration Number",
      "Engine No",
      "Chassis No",
      "Year of Manufacture",
      "Sub Model",
      "Address1",
      "Address2",
      "Address3",
      "Customer City",
      "Pin Code",
      "Phone No",
      "Mobile No",
      "Policy Renewal Type",
      "Policy Sub Type",
      "Dealer Code",
      "Branch"
    ];

    const Company_Name = await sequelize.query(
      `select top 1 comp_name from Comp_Mst`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    worksheet.addRow();
    worksheet.addRow();
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Insurance_Import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Excel_import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.CreImport = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Cre Excel Import";
    const Headeres = ["CRE NAME"];

    const crelist = await sequelize.query(
      `select user_name from user_tbl where module_code = 10 and export_type <3 `
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    crelist[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="CRE_List.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Excel_import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.executivedata = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Executive Excel Import";
    const Headeres = ["EXECUTIVE NAME", "EXECUTIVE CODE"];

    const crelist = await sequelize.query(
      `select Misc_Name, Misc_Code from Misc_Mst where Misc_Type = '7' and Export_Type<3`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    crelist[0]?.forEach((obj) => {
      const values = Object.values(obj);
      worksheet.addRow(values);
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Executive_List.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Excel_import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.importformatexecutive = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Executive Excel Import";
    const Headeres = ["User Name", "Location", "MobileNo.", "Email"];

    const Company_Name = await sequelize.query(
      `select top 1 comp_name from Comp_Mst`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    // worksheet.mergeCells("A1:E1");
    // worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name}`; // Replace with your company name
    // worksheet.getCell("A1").alignment = {
    //   vertical: "middle",
    //   horizontal: "center",
    // }; // Center the text
    // worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
    // worksheet.mergeCells("A2:E2");
    // worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
    // worksheet.getCell("A2").alignment = {
    //   vertical: "middle",
    //   horizontal: "center",
    // }; // Center the text
    // worksheet.mergeCells("A3:L3");
    // let reportName1 =
    //   "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
    // worksheet.getCell("A3").value = `${reportName1}`;
    // Add headers for the data starting from the 3rd row

    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    worksheet.addRow();
    worksheet.addRow();
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Executive_Import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Excel_import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};


exports.AllImported = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { dateFrom, dateto, status, user_code, branch } = req.body;
  let t;
  try {
    t = await sequelize.transaction();
    const result = await sequelize.query(
      `select
      SRNo,CRE_NAME,Policy_No,Customer_Name,Policy_Due,Chassis_No,Registration_No,Engine_No,Sub_Model,Cust_City,PinCode,MobileNo,Policy_Ren_Type,Policy_Sub_Type,Status,Web_Policy
      from insu_entry where policy_due between '${dateFrom}' and '${dateto}' `,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send(result[0]);
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};


exports.excelimportpolicy = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    const user = req.body.user;
    const branch = req.body.branch;
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    if (!transformedData?.length) {
      sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    console.log(transformedData, "transformedData")
    const renameKeys = (obj) => {
      const keyMap = {
        "New Policy No": "NewPolicy_No",
        "Customer Name": "Customer_Name",
        "Engine No": "Engine_No",
        "Chassis No": "Chassis_No",
        "Registration No": "Registration_No",
        "Delivery Executive": "Delivery_Executive",
        "Delivery Date": "Delivery_Date",
        "Delivered": "Delivered",
        'Conveyance Applicable': "Conveyance_Applicable",
        "Status": "Status",
        "Policy Issued Date": "Policy_Issued_Date",
      };
      return Object.keys(obj).reduce((acc, key) => {
        // Determine the new key based on keyMap; if not found, use the original key
        const newKey = keyMap[key] || key;

        // Trim the value before further processing
        const value = String(obj[key]).trim();
        if (newKey === "Status") {
          if (value === "closed" || value === "Closed" || value === "CLOSED") {
            acc[newKey] = "4";
          } else if (value === "lost" || value === "Lost" || value === "LOST") {
            acc[newKey] = "0";
          }
          else if (value === "OPEN" || value === "Open" || value === "open") {
            acc[newKey] = "1";
          }
        } else if (newKey === "Delivered") {
          if (value === "YES" || value === "Yes" || value === "yes") {
            acc[newKey] = "1";
          } else if (value === "No" || value === "NO" || value === "no") {
            acc[newKey] = "0";
          }
        } else if (newKey === "Conveyance_Applicable") {
          if (value === "YES" || value === "Yes" || value === "yes") {
            acc[newKey] = 1;
          } else if (value === "No" || value === "NO" || value === "no") {
            acc[newKey] = 0;
          }
        }
        else if (newKey === "Delivery_Date") {
          if (value) {
            acc[newKey] = parseDate(value); // Convert Policy_Due to YYYY-MM-DD format
          }
        }
        else if (newKey === "Policy_Issued_Date") {
          if (value) {
            acc[newKey] = parseDate(value); // Convert Policy_Due to YYYY-MM-DD format
          }
        }
        else {
          acc[newKey] = value === "" ? null : value;
        }

        // Return the accumulator for the next iteration
        return acc;
      }, {});

    };
    function parseDate(dateStr) {
      try {
        const [day, month, year] = dateStr.split("/");
        const date = new Date(`${year}-${month}-${day}`);
        if (!isNaN(date.getTime())) {
          return date.toISOString().slice(0, 10); // Convert to YYYY-MM-DD format
        }
        return null
        // Handle invalid date
      } catch (err) {
        return adjustToIST(dateStr)
      }
    }
    const data = transformedData.map(renameKeys)
    function adjustToIST(dateStr) {
      const date = new Date(dateStr);
      date.setHours(date.getHours() + 5);
      date.setMinutes(date.getMinutes() + 31);
      const ISTDateStr = date.toISOString();
      return ISTDateStr.slice(0, 10);
    }
    const ErrorData = [];
    const CorrectData = [];
    for (item of data) {
      const delv = item.Delivery_Date ? `'${item.Delivery_Date}'` : null;
      const Policy_Issued_Date = item.Policy_Issued_Date ? `'${item.Policy_Issued_Date}'` : null;
      const conveyance_applicable = item.conveyance_applicable ? `${item.conveyance_applicable}` : null;
      const res = await sequelize.query(`SELECT status, policy_No, Chassis_No, Engine_No FROM insu_entry 
        WHERE (Chassis_No ='${item.Chassis_No}' or Engine_no = '${item.Engine_No}') and Lead is not null and location='${branch}'`);
      if (res[0].length > 0) {
        await sequelize.query(`update insu_entry set newpolicy_no = '${item.NewPolicy_No}',Policy_Issued_Date=${Policy_Issued_Date},
          delivery_executive = ${item.Delivery_Executive ? item.Delivery_Executive : null}, delivery_date =${delv},delivered = ${item.Delivered ? item.Delivered : null},
          conveyance_applicable=${conveyance_applicable}, Status='${item.Status}'  WHERE Chassis_No ='${item.Chassis_No}' or Engine_no = '${item.Engine_No}' and status in (1,4) and location='${branch}'`)
        CorrectData.push(item)
      } else {
        const NoLead = await sequelize.query(`SELECT status, policy_No, Chassis_No, Engine_No FROM insu_entry WHERE Chassis_No ='${item.Chassis_No}' or Engine_no = '${item.Engine_No}' and lead is null and location='${branch}' `);
        if (NoLead[0].length > 0) {
          item.rejectionReasons = `Lead Entry Is Not Generated.`
        } else {
          item.rejectionReasons = `Entry Not Found.`
        }
        ErrorData.push(item)
      }
    }
    console.log(CorrectData, "correct")
    console.log(ErrorData, "correct")
    await t.commit();
    await sequelize.close();
    res.status(200).send({
      ErroredData: ErrorData,
      CorrectData: CorrectData,
      Message: `${CorrectData.length} Records Inserted`,
    });

    // res.status(200).send("imported Successfully");
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

exports.importformatpolicy = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Policy Excel Import";
    const Headeres = ["New Policy No", "Customer Name", "Engine No", "Chassis No", "Registration No", "Delivery Executive", "Delivery Date", "Delivered", "Conveyance Applicable", "Status"];

    const Company_Name = await sequelize.query(
      `select top 1 comp_name from Comp_Mst`
    );
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    // worksheet.mergeCells("A1:E1");
    // worksheet.getCell("A1").value = ${Company_Name[0][0]?.comp_name}; // Replace with your company name
    // worksheet.getCell("A1").alignment = {
    //   vertical: "middle",
    //   horizontal: "center",
    // }; // Center the text
    // worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
    // worksheet.mergeCells("A2:E2");
    // worksheet.getCell("A2").value = ${reportName}; // Replace with your company name
    // worksheet.getCell("A2").alignment = {
    //   vertical: "middle",
    //   horizontal: "center",
    // }; // Center the text
    // worksheet.mergeCells("A3:L3");
    // let reportName1 =
    //   "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
    // worksheet.getCell("A3").value = ${reportName1};
    // Add headers for the data starting from the 3rd row

    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });
    worksheet.addRow();
    worksheet.addRow();
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Policy_Import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Excel_import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};



exports.ReassignTemplete = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Reassign Excel Import";
    const Headeres = ["Customer Name", "Engine No", "Chassis No", "Registration No", "OLD CRE NAME", "NEW CRE NAME"];

    const Company_Name = await sequelize.query(
      `select top 1 comp_name from Comp_Mst`
    );
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");
    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });
    worksheet.addRow();
    worksheet.addRow();
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Reassign_Import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } catch (e) {
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Reassign_Import_Tamplate.xlsx"'
    );
    return workbook.xlsx
      .write(res)
      .then(() => {
        res.end();
      })
      .catch((error) => {
        console.error("Error creating workbook:", error);
        res.status(500).send("Internal Server Error");
      });
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.ReassignTempleteimport = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    const user = req.body.user;
    const branch = req.body.branch;
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    if (!transformedData?.length) {
      sequelize.close();
      return res
        .status(500)
        .send({ Message: "No data found in Excel or may be Invalid format" });
    }
    console.log(transformedData, "transformedData")
    const Headeres = ["Customer Name", "Engine No", "Chassis No", "Registration No", "OLD CRE NAME", "NEW CRE NAME"];

    const renameKeys = (obj) => {
      const keyMap = {
        "Customer Name": "Customer_Name",
        "Engine No": "Engine_No",
        "Chassis No": "Chassis_No",
        "Registration No": "Registration_No",
        "OLD CRE NAME": "CRE_NAME",
        "NEW CRE NAME": "NEW_CRE_NAME"
      };
      return Object.keys(obj).reduce((acc, key) => {
        // Determine the new key based on keyMap; if not found, use the original key
        const newKey = keyMap[key] || key;
        // Trim the value before further processing
        const value = String(obj[key]).trim();
        acc[newKey] = value === "" ? null : value;
        // Return the accumulator for the next iteration
        return acc;
      }, {});

    };
    const data = transformedData.map(renameKeys)
    const ErrorData = [];
    const CorrectData = [];
    for (item of data) {
      const res = await sequelize.query(`SELECT srno, Chassis_No, Engine_No FROM insu_entry 
        WHERE (Chassis_No ='${item.Chassis_No}' or Engine_no = '${item.Engine_No}') and Cre_name='${item.CRE_NAME}' and location='${branch}'`);
      if (res[0].length > 0) {
        await sequelize.query(`update insu_entry set cre_name='${item.NEW_CRE_NAME}' where srno='${res[0][0].srno}'`)
        item.rejectionReasons = `Cre  Updated Successfully`
        CorrectData.push(item)
      } else {
        item.rejectionReasons = `Entry Not Found`
        ErrorData.push(item)
      }
    }
    console.log(CorrectData, "correct")
    console.log(ErrorData, "correct")
    await t.commit();
    await sequelize.close();
    res.status(200).send({
      ErroredData: ErrorData,
      CorrectData: CorrectData,
      Message: `${CorrectData.length} Records Inserted`,
    });

    // res.status(200).send("imported Successfully");
  } catch (error) {
    await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

