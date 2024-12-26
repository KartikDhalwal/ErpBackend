const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const axios = require("axios");
const nodemailer = require('nodemailer');



exports.findMasters = async function (req, res) {
    console.log("findMasters")
    let sequelize;
    sequelize = await dbname(req.headers.compcode);
    const Loc_Code =  req.body.Loc_Code

    try {
      const [DIVISION] = await sequelize.query(`SELECT CAST(misc_code as VARCHAR) AS value, misc_name AS label FROM Misc_Mst WHERE misc_type = 68`);
      const [EMPLOYEEDESIGNATION] = await sequelize.query(`select distinct(EMPLOYEEDESIGNATION) as value, EMPLOYEEDESIGNATION as label from EMPLOYEEMASTER where EMPLOYEEDESIGNATION is not null and EMPLOYEEDESIGNATION !=''`);
       const [employee]=await sequelize.query(`SELECT EMPCODE AS value , CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS label FROM EMPLOYEEMASTER WHERE Loc_code in (${Loc_Code}) and export_type < 3 AND TRIM(EMPFIRSTNAME) != '' `)
       const data = {
        DIVISION,
        EMPLOYEEDESIGNATION,
        employee
      };

      res.status(200).send({ success: true, data });
    } catch (err) {
      console.error(err);
      if (sequelize && typeof sequelize.close === 'function') {
        await sequelize.close();
      }
      res.status(500).send({ success: false, message: 'An error occurred' });
    }
};


exports.findhodbelowemp = async function (req, res) {
    console.log("findhodbelowemp")
    let sequelize;
    sequelize = await dbname(req.headers.compcode);
    const empcode = req.body.empcode
    const Loc_Code =  req.body.Loc_Code
    console.log(Loc_Code,"findhodbelowemp")
    try {
        const [a]= await sequelize.query(`select EMPLOYEEDESIGNATION from employeemaster where empcode = '${empcode}' `);
        const dat1a = a[0].EMPLOYEEDESIGNATION 
       const [employee]=await sequelize.query(`SELECT EMPCODE AS value , CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS label FROM EMPLOYEEMASTER WHERE Loc_code in (${Loc_Code}) and EMPLOYEEDESIGNATION = '${dat1a}' and export_type < 3 AND TRIM(EMPFIRSTNAME) != '' `)
      const data = {
        employee
      };
      res.status(200).send({ success: true, data });
    } catch (err) {
      console.error(err);
  
      if (sequelize && typeof sequelize.close === 'function') {
        await sequelize.close();
      }
      res.status(500).send({ success: false, message: 'An error occurred' });
    }
};


exports.getempdata = async function (req, res) { 
    const sequelize = await dbname(req.headers.compcode);
    const Emp_code=req.body.Emp_code;
    console.log(Emp_code,"Emp_code")
    try {
        const results=  await sequelize.query(
        ` SELECT 
    em.empcode AS Emp_Code,
    CONCAT(em.EMPFIRSTNAME, ' ', em.Emplastname) AS Emp_Name,
    em.CORPORATEMAILID AS Email,
    em.MOBILE_NO AS Mobile_no,
    FORMAT(em.CURRENTJOINDATE, 'yyyy-MM-dd') AS Joining_Date,
    em.EMPLOYEEDESIGNATION AS Designation,
    em.DIVISION AS Department,
    em.PERMANENTADDRESS1 AS Address,
    ee.Emp_Reason,
    FORMAT(ee.Left_Date, 'yyyy-MM-dd') AS Left_Date,
    ee.Emp_Attachment,
    ee.Exit_Feedback,
    ee.Notice_Period,
    ee.HOD_Attachment,
    ee.HOD_Reason,
    ee.NOC_HOD,
    ee.HR_Reason,
    ee.HR_Attachment,
    ee.NOC_HR,
    ee.Actual_Left_Date,
    ee.Tran_id
FROM 
    EMPLOYEEMASTER em
LEFT JOIN 
    Emp_Exit ee ON em.EmpCode = ee.Emp_Code and ee.export_type < '3'
WHERE 
    em.EmpCode = '${Emp_code}'`
        );
        console.log(results[0][0],"resultsresults")
        res.send({
            Status: "true",
            Message: "Success",
            Result: results[0][0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message
        });
    } finally {
        await sequelize.close();
    }
};


exports.saveempexit = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
    console.log(data, "datadtaa");

    try {
        const [existingCodeResult] = await sequelize.query(
            'SELECT COUNT(*) AS count FROM Emp_exit WHERE Emp_Code = :Emp_Code',
            {
                replacements: { Emp_Code: data.Emp_Code },
                transaction: t
            }
        );

        if (existingCodeResult[0].count > 0) {
            return res.status(200).send({
                Status: false,
                Message: "Employee already exit.",
                Result: null
            });
        }

        // Get the next transaction ID
        const [maxCodeResult] = await sequelize.query(
            'SELECT COALESCE(MAX(Tran_id), 0) AS max_tran_id FROM Emp_exit',
            { transaction: t }
        );
        const nexttran_id = maxCodeResult[0].max_tran_id + 1;
        console.log(nexttran_id, "nexttran_id");

        // Insert the new employee exit record
        await sequelize.query(
            `INSERT INTO Emp_exit (Tran_id, Emp_Name, Emp_Code, Email, Mobile_no, Designation, Department, Address, Joining_Date, Left_Date, Emp_Reason, Emp_Attachment, Status, Loc_Code,Notice_Period,Exit_Feedback,export_type)
            VALUES (:Tran_id, :Emp_Name, :Emp_Code, :Email, :Mobile_no, :Designation, :Department, :Address, :Joining_Date, :Left_Date, :Emp_Reason, :Emp_Attachment, :Status, :Loc_Code,:Notice_Period,:Exit_Feedback,1)`,
            {
                replacements: {
                    Tran_id: nexttran_id,
                    Emp_Name: data.Emp_Name || null,
                    Emp_Code: data.Emp_Code || null,
                    Email: data.Email || null,
                    Mobile_no: data.Mobile_no || null,
                    Designation: data.Designation || null,
                    Department: data.Department || null,
                    Address: data.Address || null,
                    Joining_Date: data.Joining_Date || null,
                    Left_Date: data.Left_Date || null,
                    Emp_Reason: data.Emp_Reason || null,
                    Emp_Attachment: data.Emp_Attachment || null,
                    Status: 1,
                    Notice_Period:data.Notice_Period || null,
                    Exit_Feedback:data.Exit_Feedback || null,
                    Loc_Code: data.Loc_Code || null,
                },
                transaction: t
            }
        );

        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Employee Exit Process Submit successfully",
            Result: null
        });
    } catch (e) {
        console.error(e);
        // Rollback the transaction on error
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};


exports.getExitempforhod= async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const Loc_Code=req.body.Loc_Code;
    const Date_to=req.body.Date_to
    const Date_From=req.body.Date_From
    console.log(Loc_Code,"Loc_CodeLoc_CodeLoc_Code")
    try {
        const results=  await sequelize.query(
        `select Emp_Exit.*,
              (SELECT Top 1 Misc_Name 
                 FROM Misc_Mst 
                 WHERE Misc_mst.Misc_type = 68 
                   AND Misc_mst.Misc_Code = Emp_Exit.Department 
              
                ) as Department_label
         from Emp_Exit 
         where export_type<3 and  Loc_Code in (${Loc_Code})`
        );
        // console.log(results[0][0],"resultsresults")
        res.send({
            Status: "true",
            Message: "Success",
            Result: results[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message
        });
    } finally {
        await sequelize.close();
    }
};



exports.saveempexitByHOD = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
    console.log(data, "datahod");

    try {
        const [existingCodeResult] = await sequelize.query(
            "SELECT COUNT(*) AS count FROM Emp_exit WHERE Status='2' and Emp_Code =:Emp_Code",
            {
                replacements: { Emp_Code: data.Emp_Code },
                transaction: t
            }
        );

        if (existingCodeResult[0].count > 0) {
            return res.status(200).send({
                Status: false,
                Message: "Employee already exit.",
                Result: null
            });
        }

 
let Tran_id 
     if(data.Tran_id){
        await sequelize.query(
            `update Emp_exit set export_type = 33 where tran_id = ${data.Tran_id}`)
            Tran_id = data.Tran_id    
     }else{
        const [maxCodeResult] = await sequelize.query(
            'SELECT COALESCE(MAX(Tran_id), 0) AS max_tran_id FROM Emp_exit',
            { transaction: t }
        );
            Tran_id = maxCodeResult[0].max_tran_id + 1;
        // console.log(Tran_id, "nexttran_id");
     }

        await sequelize.query(
            `INSERT INTO Emp_exit (Tran_id, Emp_Name, Emp_Code, Email, Mobile_no, Designation, Department, Address, Joining_Date, Left_Date, Emp_Reason, Emp_Attachment,HOD_Attachment,HOD_Reason,NOC_HOD, Status, Loc_Code,Notice_Period,Exit_Feedback ,export_type)
            VALUES (:Tran_id, :Emp_Name, :Emp_Code, :Email, :Mobile_no, :Designation, :Department, :Address, :Joining_Date, :Left_Date, :Emp_Reason, :Emp_Attachment, :HOD_Attachment, :HOD_Reason, :NOC_HOD, :Status, :Loc_Code,:Notice_Period,:Exit_Feedback,1)`,
            {
                replacements: {
                    Tran_id: Tran_id,
                    Emp_Name: data.Emp_Name || null,
                    Emp_Code: data.Emp_Code || null,
                    Email: data.Email || null,
                    Mobile_no: data.Mobile_no || null,
                    Designation: data.Designation || null,
                    Department: data.Department || null,
                    Address: data.Address || null,
                    Joining_Date: data.Joining_Date || null,
                    Left_Date: data.Left_Date || null,
                    Emp_Reason: data.Emp_Reason || null,
                    Emp_Attachment: data.Emp_Attachment || null,
                    NOC_HOD: data.NOC_HOD || null,
                    HOD_Reason: data.HOD_Reason || null,
                    HOD_Attachment: data.HOD_Attachment || null,
                    Status:2,
                    Loc_Code: data.Loc_Code || null,
                    Notice_Period:data.Notice_Period || null,
                    Exit_Feedback:data.Exit_Feedback || null
                },
                transaction: t
            }
        );

        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Employee Exit Process Submit successfully",
            Result: null
        });
    } catch (e) {
        console.error(e);
        // Rollback the transaction on error
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};



exports.GetHrViewData= async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const Loc_Code=req.body.Loc_Code;
    const Date_to=req.body.Date_to
    const Date_From=req.body.Date_From
    console.log(Loc_Code,"Loc_CodeLoc_CodeLoc_Code")
    try {
        const results=  await sequelize.query(
        `select Emp_Exit.*,
              (SELECT Top 1 Misc_Name 
                 FROM Misc_Mst 
                 WHERE Misc_mst.Misc_type = 68 
                   AND Misc_mst.Misc_Code = Emp_Exit.Department 
              
                ) as Department_label
         from Emp_Exit 
         where export_type < 3 and Loc_Code in (${Loc_Code})`
        );
        // console.log(results[0][0],"resultsresults")
        res.send({
            Status: "true",
            Message: "Success",
            Result: results[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message
        });
    } finally {
        await sequelize.close();
    }
};


exports.saveempexitByHR = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
    console.log(data, "datahr");

    try {
        const [existingCodeResult] = await sequelize.query(
            "SELECT COUNT(*) AS count FROM Emp_exit WHERE Status='3' and Emp_Code =:Emp_Code",
            {
                replacements: { Emp_Code: data.Emp_Code },
                transaction: t
            }
        );

        if (existingCodeResult[0].count > 0) {
            return res.status(200).send({
                Status: false,
                Message: "Employee already exists.",
                Result: null
            });
        }


        let Tran_id 
        if(data.Tran_id){
           await sequelize.query(
               `update Emp_exit set export_type = 33 where tran_id = ${data.Tran_id}`)
               Tran_id = data.Tran_id    
        }else{
           const [maxCodeResult] = await sequelize.query(
               'SELECT COALESCE(MAX(Tran_id), 0) AS max_tran_id FROM Emp_exit',
               { transaction: t }
           );
               Tran_id = maxCodeResult[0].max_tran_id + 1;
        }

        await sequelize.query(
            `INSERT INTO Emp_exit (Tran_id, Emp_Name, Emp_Code, Email, Mobile_no, Designation, Department, Address, Joining_Date, Left_Date, Emp_Reason, Emp_Attachment,HOD_Attachment,HOD_Reason,HR_Attachment,HR_Reason,NOC_HOD, Status, Loc_Code,Notice_Period,Exit_Feedback,Actual_Left_Date,NOC_HR ,export_type)
            VALUES (:Tran_id, :Emp_Name, :Emp_Code, :Email, :Mobile_no, :Designation, :Department, :Address, :Joining_Date, :Left_Date, :Emp_Reason, :Emp_Attachment, :HOD_Attachment, :HOD_Reason,:HR_Attachment, :HR_Reason, :NOC_HOD, :Status, :Loc_Code,:Notice_Period,:Exit_Feedback,:Actual_Left_Date,:NOC_HR,1)`,
            {
                replacements: {
                    Tran_id: Tran_id,
                    Emp_Name: data.Emp_Name || null,
                    Emp_Code: data.Emp_Code || null,
                    Email: data.Email || null,
                    Mobile_no: data.Mobile_no || null,
                    Designation: data.Designation || null,
                    Department: data.Department || null,
                    Address: data.Address || null,
                    Joining_Date: data.Joining_Date || null,
                    Left_Date: data.Left_Date || null,
                    Emp_Reason: data.Emp_Reason || null,
                    Emp_Attachment: data.Emp_Attachment || null,
                    NOC_HOD: data.NOC_HOD || null,
                    NOC_HR: data.NOC_HOD || null,
                    HOD_Reason: data.HOD_Reason || null,
                    HOD_Attachment: data.HOD_Attachment || null,
                    HR_Reason: data.HR_Reason || null,
                    HR_Attachment: data.HR_Attachment || null,
                    Status:3,
                    Loc_Code: data.Loc_Code || null,
                    Notice_Period:data.Notice_Period || null,
                    Exit_Feedback:data.Exit_Feedback || null,
                    Actual_Left_Date:data.Actual_Left_Date || null,
                },
                transaction: t
            }
        );

    if(data.Actual_Left_Date){
        await sequelize.query(
            `update EMPLOYEEMASTER set LASTWOR_DATE = '${data.Actual_Left_Date}'  WHERE EMPCODE='${data.Emp_Code}'`,
            { transaction: t }
        );
    }


        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Employee Exit Process Submit successfully",
            Result: null
        });
    } catch (e) {
        console.error(e);
        // Rollback the transaction on error
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};


exports.GetCEOViewData= async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const Loc_Code=req.body.Loc_Code;
    const Date_to=req.body.Date_to
    const Date_From=req.body.Date_From
    console.log(Loc_Code,"Loc_CodeLoc_CodeLoc_Code")
    try {
        const results=  await sequelize.query(
        `select Emp_Exit.*,
              (SELECT Top 1 Misc_Name 
                 FROM Misc_Mst 
                 WHERE Misc_mst.Misc_type = 68 
                   AND Misc_mst.Misc_Code = Emp_Exit.Department 
              
                ) as Department_label
         from Emp_Exit 
         where export_type < 3 and Loc_Code in (${Loc_Code})`
        );
        // console.log(results[0][0],"resultsresults")
        res.send({
            Status: "true",
            Message: "Success",
            Result: results[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message
        });
    } finally {
        await sequelize.close();
    }
};



exports.finddepart = async function (req, res) {
    console.log("findMasters")
    let sequelize;
    sequelize = await dbname(req.headers.compcode);
    try {
      const [DIVISION] = await sequelize.query(`
DECLARE @CurrentYear INT = YEAR(GETDATE());
    SELECT 
    DIVISION,
    (SELECT TOP 1  misc_name  FROM Misc_Mst WHERE misc_type = 68 AND Misc_Code = DIVISION) AS Department,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) + SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 1, 1)) THEN 1 ELSE 0 END) AS January,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 2, 1)) THEN 1 ELSE 0 END) AS February,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 3, 1)) THEN 1 ELSE 0 END) AS March,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 4, 1)) THEN 1 ELSE 0 END) AS April,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 5, 1)) THEN 1 ELSE 0 END) AS May,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 6, 1)) THEN 1 ELSE 0 END) AS June,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 7, 1)) THEN 1 ELSE 0 END) AS July,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 8, 1)) THEN 1 ELSE 0 END) AS August,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 9, 1)) THEN 1 ELSE 0 END) AS September,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 10, 1)) THEN 1 ELSE 0 END) AS October,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 11, 1)) THEN 1 ELSE 0 END) AS November,
    SUM(CASE WHEN LastWor_Date IS NULL THEN 1 ELSE 0 END) +  SUM(CASE WHEN LastWor_Date <= EOMONTH(DATEFROMPARTS(@CurrentYear, 12, 1)) THEN 1 ELSE 0 END) AS December
    FROM 
    employeemaster
    GROUP BY 
    DIVISION
`);
    const data = {
        DIVISION
      };
      await sequelize.close();
      res.status(200).send({ success: true, data });
   
    } catch (err) {
      console.error(err);
        await sequelize.close();
      res.status(500).send({ success: false, message: 'An error occurred' });
    }
};














 