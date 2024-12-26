const { dbname } = require("../utils/dbconfig");
const jwt = require("jsonwebtoken");
const FormData = require("form-data");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { SendWhatsAppMessgae } = require("./user");

exports.ViewEmpMaster = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  console.log(req.body, "dddd");
  const Empcode = req.body.Empcode;
  try {
    let query = "";
    query += `SELECT 
    CAST(EM.Pf_date AS DATE) AS PF_Date, 
    EM.pfnumber, 
    EM.UAN_No, 
    EM.PFNO, 
    EM.pfper, 
    CAST(EM.ESI_Date AS DATE) AS ESI_Date, 
    EM.esinumber, 
    EM.ESINO, 
    EM.LWFNO,
    EM.WEEKLYOFF, 
    EM.pro_tax, 
    EM.EMP_SHIFT, 
    EM.BANKNAME, 
    EM.BANKACCOUNTNO, 
    EM.ACCOUNT_TYPE, 
    EM.BRANCH, 
    EM.PAYMENTMODE, 
    EM.ifsc_code, 
    EM.Emp_Ac_Name, 
    EM.Sal_Region,
    EM.Punch_Type, 
    EM.ANNUAL_CTC, 
    EM.LWF, 
    EM.PFSALARY_LIMIT, 
    EM.BONUS_AMOUNT,
    SS.Effective_date, 
    SS.Basic, 
    SS.HRA, 
    SS.Conveyance, 
    SS.Medical, 
    SS.Other, 
    SS.Washing, 
    SS.Gross_Salary, 
    SS.Uniform,
    EM.Sal_Hold
FROM 
    EMPLOYEEMASTER EM
JOIN 
    SALARYSTRUCTURE SS
ON 
    EM.EMPCODE = SS.EMP_CODE
WHERE
	EM.EMPCODE = '${Empcode}'
    AND SS.Export_Type <3`;

    const result = await sequelize.query(query);
    console.log(result, "result");
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.AddEmpMaster = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode); // Get the sequelize instance based on company code
  console.log(req.body, "Request Data");

   

  const formdata = req.body.formData1;
  const PF_Date = formdata.PF_Date ? `'${formdata.PF_Date}'` : null;
  const PFNO = formdata.PFNO ? `'${formdata.PFNO}'` : null;
  const UAN_No = formdata.UAN_No ? `'${formdata.UAN_No}'` : null;
  const pfnumber = formdata.pfnumber ? `'${formdata.pfnumber}'` : null;
  const pfper = formdata.pfper ? `'${formdata.pfper}'` : null;
  const ESI_Date = formdata.ESI_Date ? `'${formdata.ESI_Date}'` : null;
  const esinumber = formdata.esinumber ? `'${formdata.esinumber}'` : null;
  const ESINO = formdata.ESINO ? `'${formdata.ESINO}'` : null;
  const LWFNO = formdata.LWFNO ? `'${formdata.LWFNO}'` : null;
  const WEEKLYOFF = formdata.WEEKLYOFF ? `'${formdata.WEEKLYOFF}'` : null;
  const pro_tax = formdata.pro_tax ? `'${formdata.pro_tax}'` : null;
  const EMP_SHIFT = formdata.EMP_SHIFT ? `'${formdata.EMP_SHIFT}'` : null;
  const BANKNAME = formdata.BANKNAME ? `'${formdata.BANKNAME}'` : null;
  const BANKACCOUNTNO = formdata.BANKACCOUNTNO
    ? `'${formdata.BANKACCOUNTNO}'`
    : null;
  const ACCOUNT_TYPE = formdata.ACCOUNT_TYPE
    ? `'${formdata.ACCOUNT_TYPE}'`
    : null;
  const BRANCH = formdata.BRANCH ? `'${formdata.BRANCH}'` : null;
  const PAYMENTMODE = formdata.PAYMENTMODE ? `'${formdata.PAYMENTMODE}'` : null;
  const ifsc_code = formdata.ifsc_code ? `'${formdata.ifsc_code}'` : null;
  const Emp_Ac_Name = formdata.Emp_Ac_Name ? `'${formdata.Emp_Ac_Name}'` : null;
  const Sal_Region = formdata.Sal_Region ? `'${formdata.Sal_Region}'` : null;
  const Punch_Type = formdata.Punch_Type ? `'${formdata.Punch_Type}'` : null;
  const ANNUAL_CTC = formdata.ANNUAL_CTC?.toString() ? `'${formdata.ANNUAL_CTC}'` : null;
  const LWF = formdata.LWF?.toString() ? `'${formdata.LWF}'` : null;
  const PFSALARY_LIMIT = formdata.PFSALARY_LIMIT?.toString()
    ? `'${formdata.PFSALARY_LIMIT}'`
    : null;
  const BONUS_AMOUNT = formdata.BONUS_AMOUNT?.toString()
    ? `'${formdata.BONUS_AMOUNT}'`
    : null;
  const Effective_date = formdata.Effective_date
    ? `'${formdata.Effective_date}'`
    : null;
  const Basic = formdata.Basic?.toString() ? `'${formdata.Basic}'` : null;
  const HRA = formdata.HRA?.toString() ? `'${formdata.HRA}'` : null;
  const Conveyance = formdata.Conveyance?.toString() ? `'${formdata.Conveyance}'` : null;
  const Medical = formdata.Medical?.toString() ? `'${formdata.Medical}'` : null;
  const Other = formdata.Other?.toString() ? `'${formdata.Other}'` : null;
  const Washing = formdata.Washing?.toString() ? `'${formdata.Washing}'` : null;
  const Uniform = formdata.Uniform?.toString() ? `'${formdata.Uniform}'` : null;
  const Gross_Salary = formdata.Gross_Salary?.toString()
    ? `'${formdata.Gross_Salary}'`
    : null;
  const Sal_Hold = formdata.Sal_Hold
    ? `'${formdata.Sal_Hold}'`
    : null;

  const EMPCODE = req.body.Empcode;
  const Rec_date = req.body.Rec_date ? `'${req.body.Rec_date}'` : null;

  const t = await sequelize.transaction();

  try {
    // Construct the SQL query with string interpolation
    const updateEmpMasterSQL = `
            UPDATE EMPLOYEEMASTER
            SET 
                PF_Date = ${PF_Date}, 
                PFNO = ${PFNO}, 
                UAN_No = ${UAN_No}, 
                PF = ${PFNO}, 
                pfnumber = ${pfnumber}, 
                pfper = ${pfper}, 
                ESI_Date = ${ESI_Date}, 
                esinumber = ${esinumber}, 
                ESINO = ${ESINO}, 
                LWFNO = ${LWFNO}, 
                WEEKLYOFF = ${WEEKLYOFF}, 
                pro_tax = ${pro_tax}, 
                EMP_SHIFT = ${EMP_SHIFT}, 
                BANKNAME = ${BANKNAME}, 
                BANKACCOUNTNO = ${BANKACCOUNTNO}, 
                ACCOUNT_TYPE = ${ACCOUNT_TYPE}, 
                BRANCH = ${BRANCH}, 
                PAYMENTMODE = ${PAYMENTMODE}, 
                ifsc_code = ${ifsc_code}, 
                Emp_Ac_Name = ${Emp_Ac_Name}, 
                Sal_Region = ${Sal_Region}, 
                Sal_Hold = ${Sal_Hold}, 
                Punch_Type = ${Punch_Type}, 
                ANNUAL_CTC = ${ANNUAL_CTC}, 
                LWF = ${LWF}, 
                PFSALARY_LIMIT = ${PFSALARY_LIMIT}, 
                BONUS_AMOUNT = ${BONUS_AMOUNT}
            WHERE EMPCODE = '${EMPCODE}';
        `;

    // Execute the update query
    await sequelize.query(updateEmpMasterSQL, {
      transaction: t, // Pass the transaction to this query
    });

    const fetchLocationSQL = `SELECT LOCATION FROM EMPLOYEEMASTER WHERE EMPCODE = '${EMPCODE}'`;
    const [locationResult] = await sequelize.query(fetchLocationSQL, { transaction: t });
    const location = locationResult.length > 0 ? `'${locationResult[0].LOCATION}'` : null;


    // Check if EMPCODE exists in SALARYSTRUCTURE
    const checkSalarySQL = `SELECT * FROM SALARYSTRUCTURE WHERE Emp_Code = '${EMPCODE}'`;
    

    const [existingSalary] = await sequelize.query(checkSalarySQL, {
      transaction: t,
    });

    if (existingSalary.length > 0) {
      // Update the export_type in SALARYSTRUCTURE
      const updateExportTypeSQL = `
                UPDATE SALARYSTRUCTURE
                SET export_type = 3
                WHERE Emp_Code = '${EMPCODE}';
            `;
      await sequelize.query(updateExportTypeSQL, {
        transaction: t,
      });
    }

    // Insert a new row into SALARYSTRUCTURE
    const insertSalarySQL = `
            INSERT INTO SALARYSTRUCTURE (
                Emp_Code, Effective_date,Rec_date, Basic, HRA, Conveyance, Medical, Other, Washing,
                Uniform, Gross_Salary, ServerId, Export_Type,Loc_Code
            )
            VALUES (
                ${EMPCODE}, ${Effective_date},${Rec_date}, ${Basic}, ${HRA}, ${Conveyance}, ${Medical}, 
                ${Other}, ${Washing}, ${Uniform}, ${Gross_Salary}, 1, 1,${location}
            );
        `;
    await sequelize.query(insertSalarySQL, {
      transaction: t,
    });

    // Commit the transaction
    await t.commit();

    // Send success response
    res.status(200).send({
      Status: true,
      Message: "Data inserted and updated successfully",
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Transaction Error:", error);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while processing data",
    });
  } finally {
    // Close the sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.PaymentMode = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const Driver_Code = req.body.Driver_Code;
    const branchQuery = `
          SELECT Misc_Code AS value, Misc_Name AS label 
          FROM misc_mst 
          WHERE misc_type = 39 AND export_type < 3`;

    // const mobileQuery = `select MOBILE_NO from EMPLOYEEMASTER where empcode = '${Driver_Code}'`;

    const branch = await sequelize.query(branchQuery);
    // const result = await sequelize.query(mobileQuery);

    res.status(200).send({
      Branch: branch[0],
      // result: result[0][0],
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ error: "An error occurred while fetching data." });
  }
};

exports.sendOtp = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const empcode = req.body.empcode;
  console.log(empcode, "datadatadata");
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const comapny = await sequelize.query(`SELECT comp_name FROM comp_mst`);
    const mobileQuery = `select misc_dtl1 from Misc_Mst where misc_type = 85 AND
        Misc_Code = (select top 1 location from EMPLOYEEMASTER where empcode = '${empcode}') AND export_type < 3`;

    const result = await sequelize.query(mobileQuery);

    console.log(result, "result");
    if (!result[0]?.[0]?.misc_dtl1) {
      throw new Error("Mobile number not found for the given employee code.");
    }

    const mobileNumber = result[0][0].misc_dtl1;

    const ab = await SendWhatsAppMessgae(
      req.headers.compcode,
      mobileNumber.toString(), // Ensure mobile number is a string
      "msg_code_2",
      [
        { type: "text", text: otp },
        { type: "text", text: comapny[0][0].comp_name },
      ]
    );

    console.log("WhatsApp Response:", ab);

    res.status(200).send({
      Status: true,
      Message: "OTP generated successfully",
      Otp: otp,
    });
  } catch (err) {
    console.error("Error in sendOtp:", err);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while generating OTP",
      Error: err.message,
    });
  }
};