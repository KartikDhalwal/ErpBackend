const { dbname } = require("../utils/dbconfig");
const Joi = require("joi");
const { Sequelize, DataTypes, literal } = require("sequelize");
const FormData = require("form-data");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require('fs');
const { _TDS_CALC, tdsCalcSchema } = require("../models/TdsCalc");
function transformData(passedData) {
  const months = ['Apr', 'May', 'June', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  // Initialize the result structure
  const result = months.map((month, index) => ({
    Month: month,
    MonthOrder: index + 4,
    _01: null, _02: null, _03: null, _04: null, _05: null, _06: null, _07: null, _08: null, _09: null, _10: null, _11: null, _12: null, _13: null, _14: null,
  }));

  // Initialize totals
  const totals = {
    Tot_01: 0, Tot_02: 0, Tot_03: 0, Tot_04: 0, Tot_05: 0, Tot_06: 0, Tot_07: 0, Tot_08: 0, Tot_09: 0, Tot_10: 0, Tot_11: 0, Tot_12: 0, Tot_13: 0, Tot_14: 0,
  };

  // Populate the result structure with the provided data
  for (const data of passedData) {
    months.forEach((month, index) => {
      const monthData = result[index];
      for (let day = 1; day <= 14; day++) {
        const dayKey = `${month}_${day.toString().padStart(2, '0')}`;
        if (data[dayKey] != null) {
          monthData[`_${day.toString().padStart(2, '0')}`] = data[dayKey];
          totals[`Tot_${day.toString().padStart(2, '0')}`] += data[dayKey] || 0;
        }
      }
    });
  }
  // Convert totals from 0 to null if needed
  Object.keys(totals).forEach(key => {
    if (totals[key] === 0) totals[key] = null;
  });

  return { result, totals };
}

exports.employee = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let EmpDetails;
  let data;
  const year = parseInt(req.body.yearvalue)
  try {
    const tdsarray = await sequelize.query(`select Apr_01,	Apr_02,	Apr_03,	Apr_04,	Apr_05,	Apr_06,	Apr_07,	Apr_08,	Apr_09,	Apr_10,	Apr_11,	Apr_12,	Apr_13,	Apr_14,	May_01,	May_02,	May_03,	May_04,	May_05,	May_06,	May_07,	May_08,	May_09,	May_10,	May_11,	May_12,	May_13,	May_14,	June_01,	June_02,	June_03,	June_04,	June_05,	June_06,	June_07,	June_08,	June_09,	June_10,	June_11,	June_12,	June_13,	June_14,	Jul_01,	Jul_02,	Jul_03,	Jul_04,	Jul_05,	Jul_06,	Jul_07,	Jul_08,	Jul_09,	Jul_10,	Jul_11,	Jul_12,	Jul_13,	Jul_14,	Aug_01,	Aug_02,	Aug_03,	Aug_04,	Aug_05,	Aug_06,	Aug_07,	Aug_08,	Aug_09,	Aug_10,	Aug_11,	Aug_12,	Aug_13,	Aug_14,	Sep_01,	Sep_02,	Sep_03,	Sep_04,	Sep_05,	Sep_06,	Sep_07,	Sep_08,	Sep_09,	Sep_10,	Sep_11,	Sep_12,	Sep_13,	Sep_14,	Oct_01,	Oct_02,	Oct_03,	Oct_04,	Oct_05,	Oct_06,	Oct_07,	Oct_08,	Oct_09,	Oct_10,	Oct_11,	Oct_12,	Oct_13,	Oct_14,	Nov_01,	Nov_02,	Nov_03,	Nov_04,	Nov_05,	Nov_06,	Nov_07,	Nov_08,	Nov_09,	Nov_10,	Nov_11,	Nov_12,	Nov_13,	Nov_14,	Dec_01,	Dec_02,	Dec_03,	Dec_04,	Dec_05,	Dec_06,	Dec_07,	Dec_08,	Dec_09,	Dec_10,	Dec_11,	Dec_12,	Dec_13,	Dec_14,	Jan_01,	Jan_02,	Jan_03,	Jan_04,	Jan_05,	Jan_06,	Jan_07,	Jan_08,	Jan_09,	Jan_10,	Jan_11,	Jan_12,	Jan_13,	Jan_14,	Feb_01,	Feb_02,	Feb_03,	Feb_04,	Feb_05,	Feb_06,	Feb_07,	Feb_08,	Feb_09,	Feb_10,	Feb_11,	Feb_12,	Feb_13,	Feb_14,	Mar_01,	Mar_02,	Mar_03,	Mar_04,	Mar_05,	Mar_06,	Mar_07,	Mar_08,	Mar_09,	Mar_10,	Mar_11,	Mar_12,	Mar_13,	Mar_14,	Tot_01,	Tot_02,	Tot_03,	Tot_04,	Tot_05,	Tot_06,	Tot_07,	Tot_08,	Tot_09,	Tot_10,	Tot_11,	Tot_12,	Tot_13,	Tot_14 from tds_calc where Emp_code='${req.body.value}'`);
    if (tdsarray[0].length > 0) {
      const { result } = transformData(tdsarray[0]);
      data = result
      EmpDetails = await sequelize.query(`select Tran_Id,	Emp_Code,	Emp_Name,	PAN_No,	Designation,	BrLocation,	Residence,	Salaried,	Emp_Add,	Landlord_PAN,	PF,	Age,Inv_01,	Inv_02,	Inv_03,	Inv_04,	Inv_05,	Inv_06,	Inv_07,	Inv_08,	Inv_09,	Inv_10_1,	Inv_10_2,	Inv_11,	Inv_12_1,	Inv_12_2,	Inv_13_1,	Inv_13_2,	Inc_01,	Inc_02,	Inc_03,	Inc_04,	Inc_05,	Inc_06,	Inc_07,	Inc_08,	Inc_09,	Inc_10,	Inc_11,	Inc_12,	Inc_13,	Inc_14,	Inc_15,	Inc_16,	Inc_17,	Inc_18,	Inc_19,	Inc_20,	Inc_21,	Inc_22,	Inc_23,	Inc_24,	Inc_25,	Inc_26,	Inc_27,	Inc_28,	Inc_29,	Ded_80C_1,	Ded_80C_2,	Ded_80D_1,	Ded_80D_2,	Ded_80G_Head,	Ded_80G_1,	Ded_80G_2,	Totl_Ded,	Net_Inc_1,	Net_Inc_2,	Tax_Payable,	Rebate_87A,	Surcharge,	Edu_Cess,	Totl_Tax,	TDS_Deducation,	Bal_Tax,	FY_Mnth,	Avg_Tds,	Loc_Code,	USR_Code,	Export_Type,	ENTR_DATE,	ENTR_TIME,	MOD_USER,	MOD_DATE,	MOD_TIME
    from tds_calc where Emp_code='${req.body.value}'`)
    } else {
      EmpDetails = await sequelize.query(`
               select empcode as Emp_Code,concat(EMPFIRSTNAME,' ',EMPLASTNAME)as Emp_Name,PANNO as PAN_No,EMPLOYEEDESIGNATION as Designation,LOCATION as BrLocation,PERMANENTADDRESS1 as Emp_Add,DATEDIFF(YEAR, DOB, GETDATE()) - 
    CASE 
        WHEN MONTH(DOB) > MONTH(GETDATE()) 
            OR (MONTH(DOB) = MONTH(GETDATE()) AND DAY(DOB) > DAY(GETDATE())) 
        THEN 1 ELSE 0 END AS Age,
        CASE 
        WHEN PFNO = 0 THEN 'No'
        WHEN PFNO = 1 THEN 'Yes'
        ELSE 'Unknown' -- Optional: handle cases where PFNO is neither 0 nor 1
    END AS PF from EMPLOYEEMASTER where Empcode='${req.body.value}'`);
      [data] = await sequelize.query(`
      SELECT 
        FORMAT(Basic_Earn, 'N2') AS _01,
        FORMAT(HRA_Earn, 'N2') AS _02,
        FORMAT(0.00, 'N2') AS _03,
        FORMAT(0.00, 'N2') AS _04,
        FORMAT(CONVEN_Earn, 'N2') AS _05,
        FORMAT(0.00, 'N2') AS _06,
        FORMAT(Other_Earn, 'N2') AS _07,
        FORMAT(Arrear, 'N2') AS _08,
        FORMAT(Bonus, 'N2') AS _09,
        FORMAT(Gross_Earn, 'N2') AS _10,
        FORMAT(pf_employee, 'N2') AS _11,
         CASE 
           WHEN (SELECT SUM(tds) FROM TDS_26AS 
                 WHERE TDS_26AS.emp_code = salaryFile.emp_code 
                 AND MONTH(tds_date) = salMnth 
                 AND YEAR(tds_date) = salYear) IS NOT NULL 
           THEN (SELECT SUM(tds) FROM TDS_26AS 
                 WHERE TDS_26AS.emp_code = salaryFile.emp_code 
                 AND MONTH(tds_date) = salMnth 
                 AND YEAR(tds_date) = salYear)
           ELSE salaryFile.tds 
       END AS _12,
        --(select sum(tds) from TDS_26AS where TDS_26AS.emp_code=salaryFile.emp_code and salMnth=month(tds_date) and salYear=Year(tds_date))as _12,
        --FORMAT(tds, 'N2') AS _12,
        FORMAT(Medical, 'N2') AS _13,
       FORMAT(Gross_Earn - pf_employee - 
              (CASE 
                  WHEN (SELECT SUM(tds) FROM TDS_26AS 
                        WHERE TDS_26AS.emp_code = salaryFile.emp_code 
                        AND MONTH(tds_date) = salMnth 
                        AND YEAR(tds_date) = salYear) IS NOT NULL 
                  THEN (SELECT SUM(tds) FROM TDS_26AS 
                        WHERE TDS_26AS.emp_code = salaryFile.emp_code 
                        AND MONTH(tds_date) = salMnth 
                        AND YEAR(tds_date) = salYear)
                  ELSE salaryFile.tds 
               END) - Medical, 'N2') AS _14,
        CASE
          WHEN SalMnth = 1 THEN 'Jan'
          WHEN SalMnth = 2 THEN 'Feb'
          WHEN SalMnth = 3 THEN 'Mar'
          WHEN SalMnth = 4 THEN 'Apr'
          WHEN SalMnth = 5 THEN 'May'
          WHEN SalMnth = 6 THEN 'June'
          WHEN SalMnth = 7 THEN 'Jul'
          WHEN SalMnth = 8 THEN 'Aug'
          WHEN SalMnth = 9 THEN 'Sep'
          WHEN SalMnth = 10 THEN 'Oct'
          WHEN SalMnth = 11 THEN 'Nov'
          WHEN SalMnth = 12 THEN 'Dec'
          ELSE 'Tot'
        END AS Month,
        CASE
          WHEN SalMnth >= 4 THEN SalMnth
          ELSE SalMnth + 12
        END AS MonthOrder
      FROM salaryFile
      WHERE emp_code = '${req.body.value}'
        AND ((salMnth IN (4,5,6,7,8,9,10,11,12) AND salyear = ${req.body.yearvalue})
        OR (salMnth IN (1,2,3) AND salyear = ${year + 1}))
      ORDER BY MonthOrder;
      
      `)
    }


    const getDocPathsArray = (docData) => {
      return docData.map(item => item.DOC_PATH);
    };
    const [Inv_01] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_01' and EMP_CODE='${req.body.value}'`)
    const [Inv_02] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_02' and EMP_CODE='${req.body.value}'`)
    const [Inv_03] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_03' and EMP_CODE='${req.body.value}'`)
    const [Inv_05] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_05' and EMP_CODE='${req.body.value}'`)
    const [Inv_06] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_06' and EMP_CODE='${req.body.value}'`)
    const [Inv_07] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_07' and EMP_CODE='${req.body.value}'`)
    const [Inv_08] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_08' and EMP_CODE='${req.body.value}'`)
    const [Inv_09] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_09' and EMP_CODE='${req.body.value}'`)
    const [Inv_10_1] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_10_1' and EMP_CODE='${req.body.value}'`)
    const [Inv_12_1] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_12_1' and EMP_CODE='${req.body.value}'`)
    const [Inv_13_1] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inv_13_1' and EMP_CODE='${req.body.value}'`)
    const [Inc_24] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Inc_24' and EMP_CODE='${req.body.value}'`)
    const [Ded_80G_Head] = await sequelize.query(`select  DOC_PATH from EMP_DOCS where DOC_NAME='TDS-Ded_80G_Head' and EMP_CODE='${req.body.value}'`)
    EmpDetails[0][0].ImageInv_01 = getDocPathsArray(Inv_01)
    EmpDetails[0][0].ImageInv_02 = getDocPathsArray(Inv_02)
    EmpDetails[0][0].ImageInv_03 = getDocPathsArray(Inv_03)
    EmpDetails[0][0].ImageInv_05 = getDocPathsArray(Inv_05)
    EmpDetails[0][0].ImageInv_06 = getDocPathsArray(Inv_06)
    EmpDetails[0][0].ImageInv_07 = getDocPathsArray(Inv_07)
    EmpDetails[0][0].ImageInv_08 = getDocPathsArray(Inv_08)
    EmpDetails[0][0].ImageInv_09 = getDocPathsArray(Inv_09)
    EmpDetails[0][0].ImageInv_10_1 = getDocPathsArray(Inv_10_1)
    EmpDetails[0][0].ImageInv_12_1 = getDocPathsArray(Inv_12_1)
    EmpDetails[0][0].ImageInv_13_1 = getDocPathsArray(Inv_13_1)
    EmpDetails[0][0].ImageInc_24 = getDocPathsArray(Inc_24)
    EmpDetails[0][0].ImageDed_80G_Head = getDocPathsArray(Ded_80G_Head)
    res.status(200).send({ EmpDetails: EmpDetails[0][0], data: data });
  }
  catch (e) {
    console.log(e);
  }
  finally {
    await sequelize.close();
  }
}

const transformTableData = (tableData, totals) => {
  // Initialize an empty object to store the transformed data
  const transformedData = {};
  // Iterate over each row in tableData
  tableData.forEach((row) => {
    // Get the value before the underscore in the Month field (e.g., "April" from "April_2024")
    const monthPrefix = row.Month.split('_')[0];

    Object.keys(row).forEach((key) => {
      if (key.startsWith("_")) {
        const columnName = `${monthPrefix}_${key.substring(1)}`;
        transformedData[columnName] = row[key];
      }
    });
  });
  // Now, add the totals to the transformed data
  Object.keys(totals).forEach((key) => {
    const totalKey = `Tot_${key.substring(1)}`;
    transformedData[totalKey] = totals[key];
  });

  return transformedData;
};

exports.savetds = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const [result] = await sequelize.query("SELECT ISNULL(MAX(Tran_id) + 1, 1) as MaxTran_id FROM TDS_CALC");
    const nextTranId = result[0].MaxTran_id;
    const newdata = transformTableData(req.body.tableData, req.body.totals);
    const finalData = { Tran_Id: nextTranId, ...req.body.formData, ...newdata };
    const TDS_CALC = _TDS_CALC(sequelize, DataTypes);
    const insertdata = await TDS_CALC.create(finalData, {
      return: true
    });
    console.log(insertdata, "insertdata")
    res.status(200).send("done");

  }
  catch (e) {
    console.log(e);
  }
  finally {
    await sequelize.close();
  }
}
exports.updatetds = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const newdata = transformTableData(req.body.tableData, req.body.totals);
    const finalData = { ...req.body.formData, ...newdata };
    const { Tran_Id, ...restData } = finalData
    const TDS_CALC = _TDS_CALC(sequelize, DataTypes);
    const [rowsUpdated, [updatedRecord]] = await TDS_CALC.update(restData, {
      where: { Tran_Id }, // Specify the condition for which record to update
      returning: true,    // Ensure it returns the updated record
    });
    console.log(rowsUpdated, updatedRecord, "slslsslsl")
    res.status(200).send("done");

  }
  catch (e) {
    console.log(e);
  }
  finally {
    await sequelize.close();
  }
}



exports.UpdateEmpdocs = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const sequelize = await dbname(req.headers.compcode);
    const attachments = req.body.attachment;
    for (let index = 0; index < attachments.length; index++) {
      const uploadQuery = `
        INSERT INTO EMP_DOCS (
          EMP_CODE, DOC_NAME, DOC_PATH,Created_Date
        ) VALUES (
         '${req.body.empcode}',
          'TDS-${req.body.value}', 
          '${attachments[index]}', 
          GETDATE()
        )`;

      await sequelize.query(uploadQuery);
    }
    return res.status(200).send("success")

  }
  catch (e) {
    console.log(e);
  }
  finally {
    await sequelize.close();
  }
}
async function uploadImage2(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    // console.log(files);
    await Promise.all(
      files?.map(async (file, index) => {
        const customPath = `${Comp_Code}/tds/`;
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
            "http://cloud.autovyn.com:3000/upload-photo-compress",
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

exports.uploadedImage = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
          req.body.name
        );
        console.log(EMP_DOCS_data, "EMP_DOCS_data");
        res.status(200).send(EMP_DOCS_data[0].path);
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

