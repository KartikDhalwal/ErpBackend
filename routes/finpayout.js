const { dbname } = require("../utils/dbconfig");
const { Sequelize, DataTypes, literal } = require("sequelize");
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FormData = require("form-data");
const axios = require("axios");
const nodemailer = require("nodemailer");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const { _FinancerMaster, financerSchema } = require('../models/FinancerMaster');
const Joi = require("joi");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "AUTOVYN.MAILER@gmail.com",
    pass: "lamdgvthpjetawtr",
  },
});
function sendmail(EMAIL, subject, html, CCMAIL = [], attachments = []) {
  var BCCMAIL = ["devs@autovyn.com", "yuvraj@autovyn.com", "gopal@autovyn.com"];
  let mailOptions = {
    from: "AUTOVYN.MAILER@gmail.com",
    to: EMAIL,
    cc: CCMAIL,
    bcc: BCCMAIL,
    subject: subject,
    html: html,
    attachments: attachments, // Attachments array
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(error);
    }
    console.log("Email sent: For Reminder" + info.response);
  });
}


const getCurrentMonthYear = () => {
  const date = new Date();
  const options = { month: 'long', year: 'numeric' }; // e.g., "October 2024"
  return date.toLocaleDateString('en-US', options);
};
exports.sendemail = async function (req, res) {
  try {
    const tran = req.body.tran_id.map((item) => item.id);
    const cc = req.body.cc;
    const subject = req.body.subject;
    const year = req.body.year;
    const financer = req.body.financer;
    const sequelize = await dbname(req.headers.compcode);

    let emailContent = `
    <html>
      <body>
        <p>Dear Sir/Madam,</p>
        <p>These are the documents for the following Customer:</p>
    `;

    const attachments = []; // To store file attachments

    req.body.tran_id.forEach(item => {
      const { Ledg_Name, vechical_invoice, insurance_policy, Rto_Copy } = item.rowData;
      emailContent += `
      <p><strong>${Ledg_Name}</strong></p>
      <br/>
      `;

      // Add files to attachments if available
      if (vechical_invoice) {
        attachments.push({
          filename: `Vehicle_Invoice_${Ledg_Name}.pdf`,
          path: `https://erp.autovyn.com/backend/fetch?filePath=${vechical_invoice}`
        });
      }
      if (insurance_policy) {
        attachments.push({
          filename: `Insurance_Policy_${Ledg_Name}.pdf`,
          path: `https://erp.autovyn.com/backend/fetch?filePath=${insurance_policy}`
        });
      }
      if (Rto_Copy) {
        attachments.push({
          filename: `RTO_Copy_${Ledg_Name}.pdf`,
          path: `https://erp.autovyn.com/backend/fetch?filePath=${Rto_Copy}`
        });
      }
    });

    emailContent += `
      </body>
    </html>
    `;

    // Call the sendmail function with attachments
    sendmail(
      req.body.Remark,
      `PDD For - ${subject} ${year} - ${financer}`,
      emailContent,
      cc,
      attachments
    );

    await sequelize.query(`update icm_ext set Emaildate=GETDATE(),Emailto='${req.body.Remark}' where tran_id in (${tran})`);
    res.status(200).json({ message: "done" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "error" });
  }
};

exports.updatebankdetails = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const Cust_Id = req.body.data.map((number) => `'${number}'`).join(",");
    const FBank_Name = req.body.FBank_Name ? `'${req.body.FBank_Name}'` : null;
    const FCredit_Ref = req.body.FBank_Name
      ? `'${req.body.FCredit_Ref}'`
      : null;
    const FRemark = req.body.FBank_Name ? `'${req.body.FRemark}'` : null;
    const FRecd_Amt = req.body.FBank_Name ? `'${req.body.FRecd_Amt}'` : null;
    const FAccount_No = req.body.FAccount_No
      ? `'${req.body.FAccount_No}'`
      : null;
    const Receipt_No = req.body.Receipt_No;
    const Receipt_Date = req.body.Receipt_Date;

    await sequelize.query(`update icm_mst
    Set
    FBank_Name=${FBank_Name},
    FCredit_Ref=${FCredit_Ref},
    FRemark=${FRemark},
    FRecd_Amt=${FRecd_Amt},
    FAccount_No=${FAccount_No}
    where Tran_id in (${Cust_Id})`);

    await sequelize.query(`update icm_ext set Receipt_No='${Receipt_No}',Receipt_Date='${Receipt_Date}' where Tran_id in (${Cust_Id}) and export_type=1`)

    res.status(200).json({ message: "done" });
  } catch (err) {
    console.log(err);
  }
};


exports.payout = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    var data1 = await sequelize.query(

      `
     WITH GodownData AS (
    SELECT 
        Godw_Name AS label,
        CAST(Godw_Code AS VARCHAR(MAX)) AS value
    FROM Godown_Mst
    WHERE Godw_Code IN (${req.body.multi_loc})
    AND export_type < 3 and SALES_INTEGRATION in ( 1,99)
)
-- Get the 'ALL' row for Godown
SELECT 
    'ALL BRANCH' AS label, 
    STRING_AGG(CAST(Godw_Code AS VARCHAR(MAX)), ',') AS value,
    0 AS sort_order  -- 'ALL ' row first
FROM Godown_Mst
WHERE Godw_Code IN (${req.body.multi_loc})
AND export_type < 3 and SALES_INTEGRATION in ( 1,99)

UNION ALL

-- Get Godown_Mst data
SELECT 
    label, 
    value,
    1 AS sort_order  -- Other rows after 'ALL'
FROM GodownData
ORDER BY sort_order;
`
    );

    var data = await sequelize.query(
      `select godw_code as value , godw_name as label from godown_mst where SALES_INTEGRATION in ( 1,99)  and export_type < 3 and godw_code in (${req.body.multi_loc}) order by godw_name`
    );
    var service = await sequelize.query(
      `select godw_code as value , godw_name as label from godown_mst where  export_type < 3 and godw_code in (${req.body.multi_loc}) order by godw_name`
    );


    const result = await sequelize.query(
      `SELECT DISTINCT Misc_Code as value ,Misc_Name as label FROM Misc_Mst where misc_type = 8 and export_type < 3 and misc_name not in ('','-','#N/A','.','0') order by Misc_Name`
    );
    const fintype = await sequelize.query(
      `SELECT DISTINCT Misc_Code as value ,Misc_Name as label FROM Misc_Mst where misc_type = 18 and export_type < 3 order by Misc_Name`
    );
    const company =
      await sequelize.query(`select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
    gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
    from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
    where  gm.Export_Type < 3 AND gm.Godw_code  in (${req.body.multi_loc})`);

    const emp = await sequelize.query(`SELECT [EMPCODE] AS [value], concat(EMPCODE ,' ' , EMPFIRSTNAME , ' ' , EMPLASTNAME ) AS [label] FROM [dbo].[EMPLOYEEMASTER] AS [Employeemaster] where  export_type < 3 and location in (${req.body.multi_loc})`);

    res.status(200).send({
      financer: result[0],
      branch: data[0],
      branch1: data1[0],
      fintype: fintype[0],
      company: company[0][0],
      emp: emp[0],
      service: service[0]
    });
  } catch (err) {
    console.log(err);
  }
};


exports.payoutdata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const ffin_code = wrapValuesInQuotes(req.body.ffincode);
    let result1;
    let result2;
    let result3;
    let result4;
    let result5;
    let result6;
    let result7;
    let result8;
    // const ffin_code1 = req.body.ffincode.split(",").map((item) => item.trim()); // Split and trim each item
    // const ffin_code = ffin_code1.map((number) => `'${number}'`).join(",");
    const loc_code = req.body.multi_loc;
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result1 = await sequelize.query(`
   WITH FinancerData AS (
    SELECT 
        IIF(
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE misc_type = 18 AND misc_code = Pymt_Mode) IS NULL,
            'UNDEFINED',
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE misc_type = 18 AND misc_code = Pymt_Mode)
        ) AS financername, 
        COUNT(Pymt_Mode) AS cases
    FROM ICM_MST
    WHERE Pymt_Mode IS NOT NULL
    AND loc_code IN (${loc_code})
	AND Fin_Code IN (${ffin_code})
    AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}' 
    GROUP BY Pymt_Mode)
SELECT 
    'TOTAL' AS financername,
    SUM(cases) AS cases,
  CAST(100.0 AS DECIMAL(10, 2)) AS percentage,
    0 AS sort_order  -- Assign 0 to total for ordering
FROM FinancerData

UNION ALL

SELECT 
    financername,
    cases,
    CAST(ROUND(cases * 100.0 / (SELECT SUM(cases) FROM FinancerData), 2) AS DECIMAL(10, 2)) AS percentage,
    1 AS sort_order  -- Assign 1 to financers for ordering
FROM FinancerData
ORDER BY sort_order, cases DESC`);
    } else {
      result1 = await sequelize.query(`
      WITH FinancerData AS (
       SELECT 
           IIF(
               (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE misc_type = 18 AND misc_code = Pymt_Mode) IS NULL,
               'UNDEFINED',
               (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE misc_type = 18 AND misc_code = Pymt_Mode)
           ) AS financername, 
           COUNT(Pymt_Mode) AS cases
       FROM ICM_MST
       WHERE Pymt_Mode IS NOT NULL
       AND loc_code IN (${loc_code})
    AND (Fin_Code IN (${ffin_code}) or Fin_code is null)
       AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}' 
       GROUP BY Pymt_Mode)
   SELECT 
       'TOTAL' AS financername,
       SUM(cases) AS cases,
     CAST(100.0 AS DECIMAL(10, 2)) AS percentage,
       0 AS sort_order  -- Assign 0 to total for ordering
   FROM FinancerData
   
   UNION ALL
   
   SELECT 
       financername,
       cases,
       CAST(ROUND(cases * 100.0 / (SELECT SUM(cases) FROM FinancerData), 2) AS DECIMAL(10, 2)) AS percentage,
       1 AS sort_order  -- Assign 1 to financers for ordering
   FROM FinancerData
   ORDER BY sort_order, cases DESC`);
    }

    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result2 =
        await sequelize.query(`SELECT COUNT(*) AS cases, financername
FROM (
    SELECT Fin_Dono, Fin_Code,
           DATENAME(MONTH, INV_Date) AS financername
    FROM icm_mst
    WHERE Pymt_Mode IN ('5', '9')
      AND EXPORT_TYPE < 3
      AND Fin_Code IN (${ffin_code})
      AND loc_code IN (${loc_code})
      AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
      AND tran_id NOT IN (SELECT a.tran_id FROM icm_ext a)
) AS subquery 
GROUP BY financername
ORDER BY financername;`);
    } else {
      result2 =
        await sequelize.query(`SELECT COUNT(*) AS cases, financername
  FROM (
      SELECT Fin_Dono, Fin_Code,
             DATENAME(MONTH, Bhatia_Inv_Date) AS financername
      FROM icm_mst
      WHERE Pymt_Mode IN ('5', '1')
        AND EXPORT_TYPE < 3
        AND Fin_Code IN (${ffin_code})
        AND loc_code IN (${loc_code})
        AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
        AND tran_id NOT IN (SELECT a.tran_id FROM icm_ext a)
  ) AS subquery 
  GROUP BY financername
  ORDER BY financername;`);
    }

    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result3 =
        await sequelize.query(`SELECT COUNT(*) as cases,financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
           DATENAME(MONTH, INV_Date) AS financername
         FROM ICM_MST
        WHERE Pymt_Mode in ('4')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is not  null and invoice_num is null group  by financername ORDER BY financername;
    `);
    } else {
      result3 =
        await sequelize.query(`SELECT COUNT(*) as cases,financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
           DATENAME(MONTH, Bhatia_Inv_Date) AS financername
         FROM ICM_MST
        WHERE Pymt_Mode in ('5','1')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is not  null and invoice_num is null group  by financername ORDER BY financername;
    `);
    }
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result4 =
        await sequelize.query(`SELECT COUNT(*) as cases,financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
           DATENAME(MONTH, INV_Date) AS financername,
		FRecd_Amt
        FROM ICM_MST
        WHERE Pymt_Mode in ('4')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE  invoice_num is not null and  isnull(FRecd_Amt,0)=0 group  by financername ORDER BY financername;
    `);
    } else {
      result4 =
        await sequelize.query(`SELECT COUNT(*) as cases,financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
           DATENAME(MONTH, Bhatia_Inv_Date) AS financername,
		FRecd_Amt
        FROM ICM_MST
        WHERE Pymt_Mode in ('5','1')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE  invoice_num is not null and  isnull(FRecd_Amt,0)=0 group  by financername ORDER BY financername;
    `);
    }
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result5 =
        await sequelize.query(`SELECT COUNT(*) as cases,financername 
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
DATENAME(MONTH, INV_Date) AS financername,
		FRecd_Amt
        FROM ICM_MST
        WHERE Pymt_Mode in ('4')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE  invoice_num is not null and  isnull(FRecd_Amt,0)>0 group  by financername ORDER BY financername;
    `);
    } else {
      result5 =
        await sequelize.query(`SELECT COUNT(*) as cases,financername 
      FROM (
          SELECT Fin_Dono,Fin_Code,
              (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
              (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
  DATENAME(MONTH, Bhatia_Inv_Date) AS financername,
      FRecd_Amt
          FROM ICM_MST
          WHERE Pymt_Mode in ('5','1')
              AND EXPORT_TYPE < 3
              AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
            AND fin_code IN (${ffin_code})
              AND loc_code IN (${loc_code})
              AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
      ) AS subquery
      WHERE  invoice_num is not null and  isnull(FRecd_Amt,0)>0 group  by financername ORDER BY financername;
      `);
    }
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result6 =
        await sequelize.query(`SELECT COUNT(*) as cases,financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
           DATENAME(MONTH, INV_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('4')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is  null and tPayout_Rate is not null and vechical_invoice is null  and Emaildate is null group  by financername ORDER BY financername;
  `);
    } else {
      result6 =
        await sequelize.query(`SELECT COUNT(*) as cases,financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
            (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
           DATENAME(MONTH, Bhatia_Inv_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('5','1')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is  null and tPayout_Rate is not null and (vechical_invoice is null or insurance_policy is null ) and Emaildate is null group  by financername ORDER BY financername;
  `);
    }
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result7 =
        await sequelize.query(`   SELECT COUNT(*) as cases,financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,

            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
           DATENAME(MONTH, INV_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('4')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is  null and tPayout_Rate is not null and vechical_invoice is not null  and Emaildate is not null group  by financername ORDER BY financername;
`);
    } else {
      result7 =
        await sequelize.query(`   SELECT COUNT(*) as cases,financername
      FROM (
          SELECT Fin_Dono,Fin_Code,
              (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
              (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
              (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
            (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,
              (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
             DATENAME(MONTH, Bhatia_Inv_Date) AS financername
          FROM ICM_MST
          WHERE Pymt_Mode in ('5','1')
              AND EXPORT_TYPE < 3
              AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
            AND fin_code IN (${ffin_code})
              AND loc_code IN (${loc_code})
              AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
      ) AS subquery
      WHERE preinvoice_num is  null and tPayout_Rate is not null and vechical_invoice is not null  and insurance_policy is not null  and Emaildate is not null group  by financername ORDER BY financername;
  `);
    }
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result8 =
        await sequelize.query(`
        SELECT COUNT(*) as cases,financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
            (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
           DATENAME(MONTH, INV_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('5','1')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is null and tPayout_Rate is not null  and insurance_policy is not null and vechical_invoice is not null  and Emaildate is null group  by financername ORDER BY financername;
  `);
    } else {
      result8 =
        await sequelize.query(`
        SELECT COUNT(*) as cases,financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
            (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
           DATENAME(MONTH, Bhatia_Inv_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('4')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
            AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is null and tPayout_Rate is not null and insurance_policy is not null and vechical_invoice is not null  and Emaildate is null group  by financername ORDER BY financername;
  `);
    }
    res.status(200).send({
      newcar_financecases: result1[0],
      payoutpending_cases: result2[0],
      payoutinvoice_cases: result3[0],
      payoutpaymnetpending_cases: result4[0],
      payoutPaymnetreceived_cases: result5[0],
      payoutdocument_cases: result6[0],
      payoutdocumentemail_cases: result8[0],
      prepayoutinvoice_cases: result7[0],
    });
  } catch (err) {
    console.log(err);
  }
};


exports.payoutdataloc = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const ffin_code1 = req.body.ffincode.split(",").map((item) => item.trim()); // Split and trim each item
    const ffin_code = ffin_code1.map((number) => `'${number}'`).join(",");
    const loc_code = req.body.loc_code;
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const cases = req.body.cases
    const item = req.body.item
    let result;
    let result1;
    console.log(cases)

    switch (cases) {
      case "newcar_financecases":
        result = await sequelize.query(`
              WITH FinancerData AS (
    SELECT 
        IIF(
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE misc_type = 18 AND misc_code = Pymt_Mode) IS NULL,
            'UNDEFINED',
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE misc_type = 18 AND misc_code = Pymt_Mode)
        ) AS financername, 
		 (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
        COUNT(Pymt_Mode) AS cases
    FROM ICM_MST
    WHERE Pymt_Mode IS NOT NULL
	 AND loc_code IN (${loc_code})
    AND (Fin_Code IN (${ffin_code}) or Fin_code is null)
    AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}' 
    GROUP BY loc_code,Pymt_Mode)
SELECT 
branch as financername,
    cases,
    1 AS sort_order  -- Assign 1 to financers for ordering
FROM FinancerData where financername='${item}'
ORDER BY sort_order, cases DESC`);
        result1 = await sequelize.query(`
              WITH FinancerData AS (
    SELECT 
        IIF(
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE misc_type = 18 AND misc_code = Pymt_Mode) IS NULL,
            'UNDEFINED',
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE misc_type = 18 AND misc_code = Pymt_Mode)
        ) AS financername, 
		 (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
        COUNT(Pymt_Mode) AS cases
    FROM ICM_MST
    WHERE Pymt_Mode IS NOT NULL
	 AND loc_code IN (${loc_code})
    AND (Fin_Code IN (${ffin_code}) or Fin_code is null)
    AND Inv_Date BETWEEN '${dateFrom}' AND '${dateto}' 
    GROUP BY loc_code,Pymt_Mode)
SELECT 
branch as financername,
    cases,
    1 AS sort_order  -- Assign 1 to financers for ordering
FROM FinancerData where financername='${item}'
ORDER BY sort_order, cases DESC`);
        break;

      case "Pending Data":
        result =
          await sequelize.query(`SELECT COUNT(*) AS cases,branch as financername
FROM (
    SELECT Fin_Dono, Fin_Code,
	(SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
   DATENAME(MONTH, Bhatia_Inv_Date) AS financername
    FROM icm_mst
    WHERE Pymt_Mode IN ('5', '1')
      AND EXPORT_TYPE < 3
      AND Fin_Code IN (${ffin_code})
      AND loc_code IN (${loc_code})
      AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
	  and DATENAME(MONTH, Bhatia_Inv_Date)='${item}'
      AND tran_id NOT IN (SELECT a.tran_id FROM icm_ext a)
) AS subquery 
GROUP BY branch
ORDER BY branch;`);
        result1 = await sequelize.query(`
        SELECT COUNT(*) AS cases,branch as financername
FROM (
    SELECT Fin_Dono, Fin_Code,
	(SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
   DATENAME(MONTH, INV_Date) AS financername
    FROM icm_mst
    WHERE Pymt_Mode IN ('5', '9')
      AND EXPORT_TYPE < 3
      AND Fin_Code IN (${ffin_code})
      AND loc_code IN (${loc_code})
      AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
	  and DATENAME(MONTH, INV_Date)='${item}'
      AND tran_id NOT IN (SELECT a.tran_id FROM icm_ext a)
) AS subquery 
GROUP BY branch
ORDER BY branch;`);
        break;

      case "Document Pending":
        result =
          await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
			 (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
             (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,
           DATENAME(MONTH, Bhatia_Inv_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('5','1')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
			and DATENAME(MONTH, Bhatia_Inv_Date)='${item}'
            AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is  null and tPayout_Rate is not null and (vechical_invoice is null or insurance_policy is null )   and Emaildate is null
	GROUP BY branch
    ORDER BY branch;`);
        result1 = await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
			 (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
           DATENAME(MONTH, INV_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('4')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
			and DATENAME(MONTH, INV_Date)='${item}'
            AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is  null and tPayout_Rate is not null and vechical_invoice is null  and Emaildate is null
	GROUP BY branch
    ORDER BY branch;`);
        break;

      case "Document Email Pending":
        result =
          await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
			 (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
             (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,
           DATENAME(MONTH, Bhatia_Inv_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('5','1')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
			and DATENAME(MONTH, Bhatia_Inv_Date)='${item}'
            AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is  null and tPayout_Rate is not null and vechical_invoice is not null and insurance_policy is not null   and Emaildate is null
	GROUP BY branch
    ORDER BY branch;`);
        result1 = await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
			 (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
           DATENAME(MONTH, INV_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('4')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
			and DATENAME(MONTH, INV_Date)='${item}'
            AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is  null and tPayout_Rate is not null and vechical_invoice is not null  and Emaildate is null
	GROUP BY branch
    ORDER BY branch;`);
        break;

      case "Pre Invoice Pending":
        result =
          await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
  FROM (
      SELECT Fin_Dono,Fin_Code,
          (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
          (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
          (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
     (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
          (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
           (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,

         DATENAME(MONTH, Bhatia_Inv_Date) AS financername
      FROM ICM_MST
      WHERE Pymt_Mode in ('5','1')
          AND EXPORT_TYPE < 3
          AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
        AND fin_code IN (${ffin_code})
          AND loc_code IN (${loc_code})
    and DATENAME(MONTH, Bhatia_Inv_Date)='${item}'
          AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
  ) AS subquery
  WHERE preinvoice_num is  null and tPayout_Rate is not null and vechical_invoice is not null and insurance_policy is not null   and Emaildate is not null
GROUP BY branch
  ORDER BY branch;`);
        result1 = await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
  FROM (
      SELECT Fin_Dono,Fin_Code,
          (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
          (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
          (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
     (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
          (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
         DATENAME(MONTH, INV_Date) AS financername
      FROM ICM_MST
      WHERE Pymt_Mode in ('4')
          AND EXPORT_TYPE < 3
          AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
        AND fin_code IN (${ffin_code})
          AND loc_code IN (${loc_code})
    and DATENAME(MONTH, INV_Date)='${item}'
          AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
  ) AS subquery
  WHERE preinvoice_num is  null and tPayout_Rate is not null and vechical_invoice is not null  and Emaildate is not null
GROUP BY branch
  ORDER BY branch;`);
        break;
      case "Invoice Pending":
        result =
          await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
       (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
             (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,
              (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
           DATENAME(MONTH, Bhatia_Inv_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('5','1')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
      and DATENAME(MONTH, Bhatia_Inv_Date)='${item}'
            AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is not null and invoice_num is null and tPayout_Rate is not null and vechical_invoice is not null and insurance_policy is not null   and Emaildate is not null
  GROUP BY branch
    ORDER BY branch;`);
        result1 = await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
    FROM (
        SELECT Fin_Dono,Fin_Code,
            (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
            (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
            (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
       (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
            (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
                        (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
           DATENAME(MONTH, INV_Date) AS financername
        FROM ICM_MST
        WHERE Pymt_Mode in ('4')
            AND EXPORT_TYPE < 3
            AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
          AND fin_code IN (${ffin_code})
            AND loc_code IN (${loc_code})
      and DATENAME(MONTH, INV_Date)='${item}'
            AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
    ) AS subquery
    WHERE preinvoice_num is not  null and invoice_num is null and tPayout_Rate is not null and vechical_invoice is not null  and Emaildate is not null
  GROUP BY branch
    ORDER BY branch;`);
        break;
      case "Payment Pending":
        result =
          await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
      FROM (
          SELECT Fin_Dono,Fin_Code,
              (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
              (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
              (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
         (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
              (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
               (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,
                (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
             DATENAME(MONTH, Bhatia_Inv_Date) AS financername,
             FRecd_Amt
          FROM ICM_MST
          WHERE Pymt_Mode in ('5','1')
              AND EXPORT_TYPE < 3
              AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
            AND fin_code IN (${ffin_code})
              AND loc_code IN (${loc_code})
        and DATENAME(MONTH, Bhatia_Inv_Date)='${item}'
              AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
      ) AS subquery
      WHERE  invoice_num is not null and  isnull(FRecd_Amt,0)=0 group  by financername ORDER BY financername;`);
        result1 = await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
      FROM (
          SELECT Fin_Dono,Fin_Code,
              (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
              (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
              (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
         (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
              (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
                          (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
             DATENAME(MONTH, INV_Date) AS financername,
             FRecd_Amt
          FROM ICM_MST
          WHERE Pymt_Mode in ('4')
              AND EXPORT_TYPE < 3
              AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
            AND fin_code IN (${ffin_code})
              AND loc_code IN (${loc_code})
        and DATENAME(MONTH, INV_Date)='${item}'
              AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
      ) AS subquery
      WHERE  invoice_num is not null and  isnull(FRecd_Amt,0)=0 group  by financername ORDER BY financername;`);
        break;
      case "Payment Received":
        result =
          await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
      FROM (
          SELECT Fin_Dono,Fin_Code,
              (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
              (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
              (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
         (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
              (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
               (SELECT TOP 1 insurance_policy FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS insurance_policy,
                (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
             DATENAME(MONTH, Bhatia_Inv_Date) AS financername,
             FRecd_Amt
          FROM ICM_MST
          WHERE Pymt_Mode in ('5','1')
              AND EXPORT_TYPE < 3
              AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
            AND fin_code IN (${ffin_code})
              AND loc_code IN (${loc_code})
        and DATENAME(MONTH, Bhatia_Inv_Date)='${item}'
              AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
      ) AS subquery
          WHERE  invoice_num is not null and  isnull(FRecd_Amt,0)>0 group  by financername ORDER BY financername;
`);
        result1 = await sequelize.query(`SELECT COUNT(*) as cases,branch as financername
      FROM (
          SELECT Fin_Dono,Fin_Code,
              (SELECT TOP 1 tPayout_Rate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS tPayout_Rate,
              (SELECT TOP 1 preinvoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS preinvoice_num,
              (SELECT TOP 1 vechical_invoice FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS vechical_invoice,
         (SELECT TOP 1 godw_name FROM godown_mst WHERE godown_mst.godw_code = icm_mst.loc_code AND godown_mst.export_type < 3) AS branch,
              (SELECT TOP 1 Emaildate FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Emaildate,
                          (SELECT TOP 1 invoice_num FROM icm_ext WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS invoice_num,
             DATENAME(MONTH, INV_Date) AS financername,
             FRecd_Amt
          FROM ICM_MST
          WHERE Pymt_Mode in ('4')
              AND EXPORT_TYPE < 3
              AND tran_id IN (SELECT a.tran_id FROM icm_ext a)
            AND fin_code IN (${ffin_code})
              AND loc_code IN (${loc_code})
        and DATENAME(MONTH, INV_Date)='${item}'
              AND INV_Date BETWEEN '${dateFrom}' AND '${dateto}'
      ) AS subquery
          WHERE  invoice_num is not null and  isnull(FRecd_Amt,0)>0 group  by financername ORDER BY financername;
`);
        break;

      default:
        console.log("Unknown query type");
        res.status(400).send("Unknown query type");
        return;
        break;
    }

    console.log(result[0])

    res.status(200).send(req.headers.compcode.toLowerCase() === 'seva-24' ? result[0] : result1[0]);
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
};

//finanace payout
exports.payoutpending = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(
      `SELECT DISTINCT Misc_Code,Misc_Name FROM Misc_Mst where misc_type = 8 and export_type < 3`
    );
    res.render("payoutpending", {
      financer: result.recordset,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.payoutpaymentpending = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(
      `SELECT DISTINCT Misc_Code,Misc_Name FROM Misc_Mst where misc_type = 8 and export_type < 3`
    );
    res.render("payoutpaymentpending", {
      financer: result.recordset,
    });
  } catch (err) {
    console.log(err);
  }
};
exports.payoutpaymentreceived = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(
      `SELECT DISTINCT Misc_Code,Misc_Name FROM Misc_Mst where misc_type = 8 and export_type < 3`
    );
    res.render("payoutpaymentreceived", {
      financer: result.recordset,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.exportpayoutReceived = async function (req, res) {
  try {
    const ffin_code = req.query.ffin_code;
    const dateFrom = req.query.dateFrom;
    const dateto = req.query.dateto;

    if (!dateFrom || !dateto) {
      return res.status(404).json({ message: "Enter a Valid date" });
    }

    const loc_code = req.session.multi_loc;
    const sequelize = await dbname(req.headers.compcode);
    var query;
    if (ffin_code == "ALL") {
      query = `select * from ( select (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as invoice_num ,
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name,
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID)as invoice_date, * from ICM_MST where Pymt_Mode in ('4') 
      and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a ) and isnull( fin_code,'')<>''  and isnull(FRecd_Amt,0)>0 
        and loc_code in  (${loc_code}) and INV_Date between '${dateFrom}' AND '${dateto}' )
      as abce where  invoice_num is not null`;
    } else {
      query = `select * from ( select (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as invoice_num ,
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID)as invoice_date, * from ICM_MST where Pymt_Mode in ('4') 
      and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a )  and isnull(FRecd_Amt,0)>0 
       and ffin_code='${ffin_code}'   and loc_code in  (${loc_code}) and INV_Date between '${dateFrom}' AND 
       '${dateto}' )as abce where  invoice_num is not  null`;
    }
    result = await sequelize.query(query);
    const Excel = require("exceljs");
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("payout Payment Received Report");
    try {
      if (!result.recordset.length) return;
    } catch (err) { }
    const columns = [
      { header: "G. Invoice", key: "invoice_num", width: 15 },
      { header: "G. Inv date ", key: "invoice_date", width: 15 },
      { header: "Payment Rec. Date ", key: "DO_Pymt_Recd_Date", width: 15 },
      { header: "Payment Received", key: "DO_Pymt_Recd", width: 10 },
      { header: "Payout Amount", key: "Payout_Amt", width: 10 },
      { header: "Finance Dono", key: "Fin_Dono", width: 10 },
      { header: "CUstomer Name", key: "Ledg_Name", width: 15 },
      { header: "Customer Id ", key: "Cust_Id", width: 15 },
      { header: "invoice", key: "DMS_Inv", width: 15 },
      { header: "Chassis", key: "Chas_No", width: 15 },
      { header: "Financer Name", key: "Financer_name", width: 15 },
      { header: "Financer Type", key: "Financer_Type", width: 15 },
      { header: "Branch", key: "branch", width: 15 },
    ];
    worksheet.columns = columns;
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: "center" };
      cell.font = { bold: true };
      cell.border = {
        bottom: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "90EE90" },
      };
    });
    result.recordset.forEach((record) => {
      worksheet.addRow(record);
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="PayoutPaymentReceived_Report.xlsx"'
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
  } catch (err) {
    console.log(err);
  }
};

//payout payment received

exports.payoutpaymentreceivedTable = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    // const ffin_code = ffin_code1.map((number) => `'${number}'`).join(",");
    const ffin_code = wrapValuesInQuotes1(req.body.ffin_code);
    // const ffin_code = req.body.ffin_code;
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    if (!dateFrom || !dateto) {
      return res.status(404).json({ message: "Enter a Valid date" });
    }
    const loc_code = req.body.multi_loc;
    var query;
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      query = `select * from ( select 
      (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_num,
      (select top 1 apayout from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as apayout,
            (select top 1 payout_type from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as payout_type , 
      (select top 1 Payout_Received_Amount from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Payout_Received_Amount,
      (select top 1 Payout_Received_Amount from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=2)as Payout_Received_Amount2,
      (select top 1 Payout_Received_Amount from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=3)as Payout_Received_Amount3,
      (select top 1 Payout_TDS from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Payout_TDS ,
      (select top 1 Payout_TDS from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=2)as Payout_TDS2 ,
      (select top 1 Payout_TDS from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=3)as Payout_TDS3 ,
        (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name, 
        (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
        (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
        (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_date, * from ICM_MST where Pymt_Mode in ('4') 
        and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a )  and isnull(FRecd_Amt,0)>0 
         and fin_code in (${ffin_code})   and loc_code in  (${loc_code}) and INV_Date between '${dateFrom}' AND 
         '${dateto}' )as abce where  invoice_num is not  null`;
    } else {
      query = `select * from ( select (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_num ,
      (select top 1 apayout from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as apayout ,
            (select top 1 payout_type from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as payout_type , 
      (select top 1 Payout_Received_Amount from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Payout_Received_Amount ,
      (select top 1 Payout_TDS from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Payout_TDS ,
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_date, 
      TRAN_ID,	Tran_Type,	DRD_ID,	INV_No,	(select top 1 (Sale_INV_Prefix+Invoice_no)as DMS_Inv1 from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as DMS_Inv,
(select top 1 Invoice_Date from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as INV_Date,
Cust_Id,	File_No,	File_Date,	drpTitle,	drpTitl,	Ledg_Name,	Ledg_Add1,	Ledg_Add2,
Teh_Code,	Stat_Code,	Ph1,	Email_Id,	drpCustType,	Pin_Code,	Pan_No,	GST_No,	Nomi_Name,
Rel_Code,	NDOB,	Fin_Code,	Br_Code,	Fin_Dono,	Pymt_Mode,	Modl_Grp,	Modl_Code,	Veh_Clr,
Chas_Id,	Chas_No,	Engn_No,	DMS_DSE,	ERP_DSE,	DMS_TL,	ERP_TL,	Spl_Rem,	Fin_Payout,
DSE_Payout,	Veh_Cost,	Totl_Disc,	OnRoad_Price,	Rect_Tot,	Bank_Rcpt,	Net_Bal,	User_Code,	
PC_Name,	ENTR_DATE,	ENTR_TIME,	ServerId,	EXPORT_TYPE,	Loc_Code,	Veh_Del,	Del_Date,
Org_Loc,	DO_AMT,	VIN,	Del_CustId,	FFin_Code,	FBr_Code,	FPymt_Mode,	FERP_DSE,	FERP_TL,
Payout_Rate,	Payout_Amt,	Payout_GST,	Net_Payout,	FLoan_Status,	FLoan_Date,	FBank_Name,	FAccount_No,
FRecd_Amt,	FCredit_Ref,	FRemark,	Delv_Date,	Full_Pymt,	PO_No,	PO_Date,	PO_Amt,	Prty_Name_1,
Party_Trf_Amt_1,	Party_Rem_1,	Prty_Name_2,	Party_Trf_Amt_2,	Party_Rem_2,	Prty_Name_3,
Party_Trf_Amt_3,	Party_Rem_3,	PF_Charges,	Old_Car_Status,	Temp_No,	FORM16,	GP_Seq,	GP_Prefix,	GP_DATETIME,
FUEL_TYPE,	DO_Pymt_Recd,	TV_Pymt_Recd,	TV_Pymt_Date,	TV_JV_No,	PO_Pymt_Recd,	GM_Rem,	IsMgmt,	DMS_FINANCIER,
TV_AMT,	Ledg_Acnt,	EW_Pending,	FT_Pending,	AC_Pending,	Disc_Apr_by,	Prty_Name_4,	Party_Trf_Amt_4,	Party_Rem_4,
Prty_Name_5,	Party_Trf_Amt_5,	Party_Rem_5,	Prty_Name_6,	Party_Trf_Amt_6,	Party_Rem_6,	Prty_Trf_Acnt_Id_1,
Prty_Trf_Acnt_Id_2,	Prty_Trf_Acnt_Id_3,	Prty_Trf_Acnt_Id_4,	Prty_Trf_Acnt_Id_5,	Prty_Trf_Acnt_Id_6,	Dist_Code,	Village,
Aadhar_No,	FASTAG_Number,	MSSF_Id,	PRICE_DT,	DUAL_TONE,	ICM_Verified,	Verify_Date,	Verify_By,	DO_Pymt_Recd_Date,
ADNL_MGA_DISC,	Key_No,	Invoice_Regn_No,	OS_Clear,	Book_Date,	Del_OS,	Inv_Number,	GP_User from ICM_MST
        where Pymt_Mode in ('5','1')  
      and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a )  and isnull(FRecd_Amt,0)>0 
       and fin_code in (${ffin_code})   and loc_code in  (${loc_code}) and Bhatia_Inv_Date between '${dateFrom}' AND 
       '${dateto}' )as abce where  invoice_num is not  null`;
    }


    result = await sequelize.query(query);
    res.status(200).json(result[0]);
  } catch (err) {
    console.log(err);
  }
};

exports.searchpayoutpaymentreceivedData = async function (req, res) {
  try {
    const ffin_code = req.body.ffin_code;
    const searchText = req.query.searchText;
    const sequelize = await dbname(req.headers.compcode);
    const query = `select DO_Pymt_Recd_Date,DO_Pymt_Recd,Payout_Rate,Payout_Amt,Fin_Dono,Ledg_Name,Cust_Id,DMS_Inv,Chas_No
    from icm_mst where isnull(do_amt,0)>0 and isnull(payout_rate,0)>0 and isnull(frecd_amt,0)>0 and  ffin_code='${ffin_code}'and 
      Ledg_Name LIKE '%${searchText}%' OR
      Cust_Id LIKE '%${searchText}%' OR
      DMS_Inv LIKE '%${searchText}%' OR
      Chas_No LIKE '%${searchText}%'`;

    result = await sequelize.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.log(err);
  }
};

//payout payment pending
exports.exportpaymentpending = async function (req, res) {
  try {
    const ffin_code = req.query.ffin_code;
    const dateFrom = req.query.dateFrom;
    const dateto = req.query.dateto;

    if (!dateFrom || !dateto) {
      return res.status(404).json({ message: "Enter a Valid date" });
    }

    const loc_code = req.session.multi_loc;
    const sequelize = await dbname(req.headers.compcode);
    var query;
    if (ffin_code == "ALL") {
      query = `select * from ( select (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as invoice_num ,
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID)as invoice_date, * from ICM_MST where Pymt_Mode in ('4') and isnull(DO_AMT,0)>0 and (isnull(Payout_Rate,0)>0 or isnull(Payout_Amt,0)>0) and isnull(FRecd_Amt,0)=0  and ffin_code  is not null   and loc_code in  (${loc_code}) and INV_Date between '${dateFrom}' AND '${dateto}' )as abce where  invoice_num is not null`;
    } else {
      query = `select * from ( select (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as invoice_num , 
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID)as invoice_date, * from ICM_MST where  Pymt_Mode in ('4') and isnull(DO_AMT,0)>0 and (isnull(Payout_Rate,0)>0 or isnull(Payout_Amt,0)>0) and isnull(FRecd_Amt,0)=0  and ffin_code='${ffin_code}'   and loc_code in  (${loc_code}) and INV_Date between '${dateFrom}' AND '${dateto}' )as abce where  invoice_num is not  null`;
    }
    result = await sequelize.query(query);
    const Excel = require("exceljs");
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("payout Payment  Pending Report");
    try {
      if (!result.recordset.length) return;
    } catch (err) { }
    const columns = [
      { header: "G. Invoice", key: "invoice_num", width: 15 },
      { header: "G. Inv date ", key: "invoice_date", width: 15 },
      { header: "Payout Amt", key: "Payout_Amt", width: 15 },
      { header: "Fin Dono", key: "Fin_Dono", width: 10 },
      { header: "Pymt Rec Date", key: "DO_Pymt_Recd_Date", width: 10 },
      { header: "CUstomer Name", key: "Ledg_Name", width: 10 },
      { header: "Customer Id ", key: "Cust_Id", width: 15 },
      { header: "Invoice", key: "DMS_Inv", width: 15 },
      { header: "Date", key: "INV_Date", width: 15 },
      { header: "Chassis", key: "Chas_No", width: 15 },
      { header: "Financer Name", key: "Financer_name", width: 15 },
      { header: "Financer Type", key: "Financer_Type", width: 15 },
      { header: "Branch", key: "branch", width: 15 },
    ];
    worksheet.columns = columns;
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: "center" };
      cell.font = { bold: true };
      cell.border = {
        bottom: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "90EE90" },
      };
    });
    result.recordset.forEach((record) => {
      worksheet.addRow(record);
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="PayoutPaymentPending_Report.xlsx"'
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
  } catch (err) {
    console.log(err);
  }
};

function wrapValuesInQuotes1(valuesString) {
  // Split the string into an array of values
  try {

    const valuesArray = valuesString.split(",");

    // Map over the array and wrap each value in single quotes
    const quotedValuesArray = valuesArray.map((value) => `'${value.trim()}'`);

    return quotedValuesArray;
  } catch (err) {
    return valuesString;
  }
}
exports.payoutpaymentpendingTable = async function (req, res) {
  try {
    const ffin_code = wrapValuesInQuotes1(req.body.ffin_code);
    // const ffin_code = req.body.ffin_code;
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;

    if (!dateFrom || !dateto) {
      return res.status(404).json({ message: "Enter a Valid date" });
    }
    const loc_code = req.body.multi_loc;
    const sequelize = await dbname(req.headers.compcode);
    var query;

    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      query = `select * from ( select TRAN_ID,
      (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_num,INV_Date, 
      (select top 1 apayout from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as apayout, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 payout_type from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as payout_type , 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_date,
    (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin ,
         (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as gstAmount1 , 
         (select top 1 payout_tds from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as payout_tds , 
         (select top 1 Taxable_Amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Taxable_Amt 
      ,Payout_Amt,ffin_code,Fin_Dono,DO_Pymt_Recd_Date,Ledg_Name,Cust_Id,DMS_Inv,File_Date,Chas_No from ICM_MST where  Pymt_Mode in ('4')
      and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a ) and isnull(FRecd_Amt,0)=0
        and fin_code in (${ffin_code})   and loc_code in  (${loc_code}) and INV_Date between '${dateFrom}' AND 
        '${dateto}' )as abce where  invoice_num is not  null`;
    } else {
      query = `select * from ( select (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1 )as invoice_num , 
      (select top 1 apayout from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as apayout, 
      (select top 1 payout_type from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as payout_type , 
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_date,
         (select top 1 payout_tds from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1 )as payout_tds , 
      (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1 )as totalfin ,
         (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID  and icm_ext.export_type=1)as gstAmount1 , 
         (select top 1 Taxable_Amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID  and icm_ext.export_type=1)as Taxable_Amt ,
      TRAN_ID,ffin_code,	Tran_Type,	DRD_ID,	INV_No,	(select top 1 (Sale_INV_Prefix+Invoice_no)as DMS_Inv1 from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as DMS_Inv,
(select top 1 Invoice_Date from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as INV_Date,
Payout_Amt,Fin_Dono,DO_Pymt_Recd_Date,Ledg_Name,Cust_Id,File_Date,Chas_No from ICM_MST
      where  Pymt_Mode in ('5','1')
      and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a ) and isnull(FRecd_Amt,0)=0
        and fin_code in (${ffin_code})   and loc_code in  (${loc_code}) and Bhatia_Inv_Date between '${dateFrom}' AND 
        '${dateto}' )as abce where  invoice_num is not  null`;
    }



    result = await sequelize.query(query);
    res.status(200).json(result[0]);
  } catch (err) {
    console.log(err);
  }
};
exports.searchpayoutpaymentpendingData = async function (req, res) {
  try {
    const ffin_code = req.body.ffin_code;
    const searchText = req.query.searchText;
    const sequelize = await dbname(req.headers.compcode);
    const query = `select Payout_Rate,Payout_Amt,Fin_Dono,DO_Pymt_Recd_Date,Ledg_Name,Cust_Id,DMS_Inv,Chas_No
    from icm_mst where isnull(do_amt,0)>0 and isnull(payout_rate,0)>0 and isnull(frecd_amt,0)=0 and  ffin_code='${ffin_code}' and 
      Ledg_Name LIKE '%${searchText}%' OR
      Cust_Id LIKE '%${searchText}%' OR
      DMS_Inv LIKE '%${searchText}%' OR
      Chas_No LIKE '%${searchText}%'`;

    result = await sequelize.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.log(err);
  }
};

//payout pending
exports.exportpayoutpending = async function (req, res) {
  try {
    const ffin_code = req.query.ffin_code;
    const dateFrom = req.query.dateFrom;
    const dateto = req.query.dateto;

    if (!dateFrom || !dateto) {
      return res.status(404).json({ message: "Enter a Valid date" });
    }

    const loc_code = req.session.multi_loc;
    const sequelize = await dbname(req.headers.compcode);
    var query;

    if (ffin_code == "ALL") {
      query = `select Fin_Dono,Ledg_Name,Cust_Id,DMS_Inv,INV_Date,Chas_No ,
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name
      from icm_mst where Pymt_Mode in ('4') and EXPORT_TYPE<3   and tran_id not in (select a.tran_id from icm_ext a ) and isnull( fin_code,'')<>''   and loc_code in  (${loc_code}) and INV_Date between '${dateFrom}' AND '${dateto}'`;
    } else {
      query = `select Fin_Dono,Ledg_Name,Cust_Id,DMS_Inv,INV_Date,Chas_No,
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3) as branch,
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 

      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name 

       from icm_mst where Pymt_Mode in ('4') and EXPORT_TYPE<3   and tran_id not in (select a.tran_id from icm_ext a ) and fin_code='${ffin_code}' and loc_code in  (${loc_code})and INV_Date between '${dateFrom}' AND '${dateto}'`;
    }
    result = await sequelize.query(query);
    const Excel = require("exceljs");
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Payout  Pending Report");
    try {
      if (!result.recordset.length) return;
    } catch (err) { }
    const columns = [
      { header: "Do Number", key: "Fin_Dono", width: 15 },
      { header: "Customer Name ", key: "Ledg_Name", width: 15 },
      { header: "Cust Id", key: "Cust_Id", width: 15 },
      { header: "Invoice", key: "DMS_Inv", width: 10 },
      { header: "Date", key: "INV_Date", width: 10 },
      { header: "Chassis", key: "Chas_No", width: 10 },
      { header: "Financer Name", key: "Financer_name", width: 15 },
      { header: "Financer Type", key: "Financer_Type", width: 15 },
      { header: "Branch", key: "branch", width: 15 },
    ];
    worksheet.columns = columns;
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: "center" };
      cell.font = { bold: true };
      cell.border = {
        bottom: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "90EE90" },
      };
    });
    result.recordset.forEach((record) => {
      worksheet.addRow(record);
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="payoutpending_Report.xlsx"'
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
  } catch (err) {
    console.log(err);
  }
};

exports.viewpayoutpendingTable = async function (req, res) {
  try {
    // const ffin_code1 = req.body.ffincode.split(",").map((item) => item.trim()); // Split and trim each item
    // const ffin_code = wrapValuesInQuotes(req.body.ffincode);
    const ffin_code = req.body.ffin_code;
    const loc_code = req.body.multi_loc; // Parse each item as an integer
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;

    if (!dateFrom || !dateto) {
      return res.status(404).json({ message: "Enter a Valid date" });
    }
    const sequelize = await dbname(req.headers.compcode);
    let result;
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result =
        await sequelize.query(`select Tran_Id,Fin_Dono,Ledg_Name,Cust_Id,DMS_Inv,INV_Date,Chas_No,
    (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3) as branch,
            (select top 1 fin_branch from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as fin_branch , 
    (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
    (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
    (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name 
    from icm_mst where Pymt_Mode in ('4') and EXPORT_TYPE<3   and tran_id not in (select a.tran_id from icm_ext a ) and 
    fin_code in(${ffin_code}) and loc_code in  (${loc_code})and INV_Date between '${dateFrom}' AND '${dateto}'`);
    } else {
      result =
        await sequelize.query(`select Tran_Id,Fin_Dono,Ledg_Name,Cust_Id,(select top 1 (Sale_INV_Prefix+Invoice_no)as DMS_Inv1 from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as DMS_Inv,(select top 1 Invoice_Date from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as INV_Date,Chas_No,
  (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3) as branch,
    (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
            (select top 1 fin_branch from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as fin_branch , 
  (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
  (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name 
  from icm_mst where Pymt_Mode in ('5','1') and EXPORT_TYPE<3   and tran_id not in (select a.tran_id from icm_ext a ) and 
  fin_code in(${ffin_code}) and loc_code in  (${loc_code})and Bhatia_Inv_Date between '${dateFrom}' AND '${dateto}'`);
    }


    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};
exports.viewpayoutconvert = async function (req, res) {
  try {
    // const ffin_code1 = req.body.ffincode.split(",").map((item) => item.trim()); // Split and trim each item
    // const ffin_code = wrapValuesInQuotes(req.body.ffincode);
    const ffin_code = req.body.ffin_code;
    const loc_code = req.body.multi_loc; // Parse each item as an integer
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;


    if (!dateFrom || !dateto) {
      return res.status(404).json({ message: "Enter a Valid date" });
    }
    if (!loc_code) {
      return res.status(404).json({ message: "Enter a Location Code" });
    }
    const sequelize = await dbname(req.headers.compcode);
    let result;
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result =
        await sequelize.query(`select Tran_Id,Fin_Dono,Ledg_Name,Cust_Id,DMS_Inv,INV_Date,Chas_No,
            (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
        (select top 1 fin_branch from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as fin_branch , 
    (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3) as branch,
    (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
    (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name,pymt_mode
    from icm_mst where  EXPORT_TYPE<3    and 
    fin_code in(${ffin_code}) and loc_code in  (${loc_code})and INV_Date between '${dateFrom}' AND '${dateto}'`);
    } else {
      result =
        await sequelize.query(`select Tran_Id,Fin_Dono,Ledg_Name,Cust_Id,
  (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
        (select top 1 fin_branch from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as fin_branch , 
  (select top 1 (Sale_INV_Prefix+Invoice_no)as DMS_Inv1 from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as DMS_Inv,(select top 1 Invoice_Date from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as INV_Date,Chas_No,
  (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3) as branch,
  (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
  (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name,pymt_mode
  from icm_mst where EXPORT_TYPE<3  and 
  (fin_code in(${ffin_code}) or fin_code is null) and loc_code in  (${loc_code})and Bhatia_Inv_Date between '${dateFrom}' AND '${dateto}'`);
    }


    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};

exports.searchpayoutpendingData = async function (req, res) {
  try {
    const ffin_code = req.body.ffin_code;
    const searchText = req.body.searchText;
    const sequelize = await dbname(req.headers.compcode);
    const query = `select Fin_Dono,Ledg_Name,Cust_Id,DMS_Inv,Chas_No from icm_mst where isnull(do_amt,0)>0 and isnull(payout_rate,0)=0 and ffin_code='${ffin_code}' and Ledg_Name LIKE '%${searchText}%' OR
      Cust_Id LIKE '%${searchText}%' OR
      DMS_Inv LIKE '%${searchText}%' OR
      Chas_No LIKE '%${searchText}%'`;
    result = await sequelize.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    console.log(err);
  }
};

exports.financeapprove = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result1 = await sequelize.query(
      `select Godw_Name,Godw_Code from GODOWN_MST where Godw_Code in (${req.session.multi_loc}) and  export_type<3`
    );
    const result2 = await sequelize.query(
      `SELECT DISTINCT Misc_Code,Misc_Name FROM Misc_Mst where misc_type = 8 and export_type < 3`
    );
    const result3 = await sequelize.query(
      "select Misc_Code,Misc_Name from misc_mst where Misc_Type=18"
    );

    res.render("financeapprove", {
      branch: result1.recordset,
      financer: result2.recordset,
      fintype: result3.recordset,
    });
  } catch (err) {
    console.log(err);
    // res.render('financeapprove');
    // res.status(500).send('Error connecting to the database.');
  }
};

exports.financeapprove1 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result1 = await sequelize.query(
      `select Godw_Name,Godw_Code from GODOWN_MST where Godw_Code in (${req.session.multi_loc}) and  export_type<3`
    );
    const result2 = await sequelize.query(
      `SELECT DISTINCT Misc_Code,Misc_Name FROM Misc_Mst where misc_type = 8 and export_type < 3`
    );
    const result3 = await sequelize.query(
      "select Misc_Code,Misc_Name from misc_mst where Misc_Type=18"
    );

    res.render("financeapprove1", {
      branch: result1.recordset,
      financer: result2.recordset,
      fintype: result3.recordset,
    });
  } catch (err) {
    console.log(err);
    // res.render('financeapprove');
    // res.status(500).send('Error connecting to the database.');
  }
};

exports.searchfinanceapprove = async (req, res) => {
  try {
    const Tran_Id = req.body.Tran_Id;
    // const pool = await sql.connect(req.session.config);
    const sequelize = await dbname(req.headers.compcode);
    let result;
    let query;
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      query = `select  (select top 1 EMPFIRSTNAME +' '+ EMPLASTNAME As EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SRNO=ICM_MST.ERP_DSE) AS ERP_DSE_NAME, 
    (select top 1 EMPFIRSTNAME +' '+ EMPLASTNAME As EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SRNO=ICM_MST.ERP_TL) AS ERP_TL_NAME,  
    (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
    * from ICM_MST WHERE Tran_Id = '${Tran_Id}'`;
    } else {
      query = `select  (select top 1 EMPFIRSTNAME +' '+ EMPLASTNAME As EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SRNO=ICM_MST.ERP_DSE) AS ERP_DSE_NAME, 
(select top 1 EMPFIRSTNAME +' '+ EMPLASTNAME As EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SRNO=ICM_MST.ERP_TL) AS ERP_TL_NAME,  
TRAN_ID,	Tran_Type,	DRD_ID,	INV_No,	(select top 1 (Sale_INV_Prefix+Invoice_no)as DMS_Inv1 from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as DMS_Inv,
(select top 1 Invoice_Date from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as INV_Date,
Cust_Id,	File_No,	File_Date,	drpTitle,	drpTitl,	Ledg_Name,	Ledg_Add1,	Ledg_Add2,
Teh_Code,	Stat_Code,	Ph1,	Email_Id,	drpCustType,	Pin_Code,	Pan_No,	GST_No,	Nomi_Name,
Rel_Code,	NDOB,	Fin_Code,	Br_Code,	Fin_Dono,	Pymt_Mode,	Modl_Grp,	Modl_Code,	Veh_Clr,
Chas_Id,	Chas_No,	Engn_No,	DMS_DSE,	ERP_DSE,	DMS_TL,	ERP_TL,	Spl_Rem,	Fin_Payout,
DSE_Payout,	Veh_Cost,	Totl_Disc,	OnRoad_Price,	Rect_Tot,	Bank_Rcpt,	Net_Bal,	User_Code,	
PC_Name,	ENTR_DATE,	ENTR_TIME,	ServerId,	EXPORT_TYPE,	Loc_Code,	Veh_Del,	Del_Date,
Org_Loc,	DO_AMT,	VIN,	Del_CustId,	FFin_Code,	FBr_Code,	FPymt_Mode,	FERP_DSE,	FERP_TL,
Payout_Rate,	Payout_Amt,	Payout_GST,	Net_Payout,	FLoan_Status,	FLoan_Date,	FBank_Name,	FAccount_No,
FRecd_Amt,	FCredit_Ref,	FRemark,	Delv_Date,	Full_Pymt,	PO_No,	PO_Date,	PO_Amt,	Prty_Name_1,
Party_Trf_Amt_1,	Party_Rem_1,	Prty_Name_2,	Party_Trf_Amt_2,	Party_Rem_2,	Prty_Name_3,
Party_Trf_Amt_3,	Party_Rem_3,	PF_Charges,	Old_Car_Status,	Temp_No,	FORM16,	GP_Seq,	GP_Prefix,	GP_DATETIME,
FUEL_TYPE,	DO_Pymt_Recd,	TV_Pymt_Recd,	TV_Pymt_Date,	TV_JV_No,	PO_Pymt_Recd,	GM_Rem,	IsMgmt,	DMS_FINANCIER,
TV_AMT,	Ledg_Acnt,	EW_Pending,	FT_Pending,	AC_Pending,	Disc_Apr_by,	Prty_Name_4,	Party_Trf_Amt_4,	Party_Rem_4,
Prty_Name_5,	Party_Trf_Amt_5,	Party_Rem_5,	Prty_Name_6,	Party_Trf_Amt_6,	Party_Rem_6,	Prty_Trf_Acnt_Id_1,
Prty_Trf_Acnt_Id_2,	Prty_Trf_Acnt_Id_3,	Prty_Trf_Acnt_Id_4,	Prty_Trf_Acnt_Id_5,	Prty_Trf_Acnt_Id_6,	Dist_Code,	Village,
Aadhar_No,	FASTAG_Number,	MSSF_Id,	PRICE_DT,	DUAL_TONE,	ICM_Verified,	Verify_Date,	Verify_By,	DO_Pymt_Recd_Date,
    (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
ADNL_MGA_DISC,	Key_No,	Invoice_Regn_No,	OS_Clear,	Book_Date,	Del_OS,	Inv_Number,	GP_User from ICM_MST WHERE Tran_Id = '${Tran_Id}'`;
    }
    result = await sequelize.query(query);
    const query2 = `select 
    * from icm_ext where TRAN_ID='${Tran_Id}' and export_type=1`;
    const newcartran = await sequelize.query(`select * from newcar_financedetails where icm_tran_id='${Tran_Id}'`)
    if (newcartran[0].length == 0) {
      await sequelize.query(`update newcar_financedetails set icm_tran_id='${Tran_Id}' where inv_no=(select dms_inv from icm_mst where tran_id = '${Tran_Id}')`)
    }
    const query3 = `select * from newcar_financedetails where icm_tran_id='${Tran_Id}' `
    let result3 = await sequelize.query(query2);
    let result4 = await sequelize.query(query3);

    const responseObj = {
      icm_ext: result3[0],
      icm_mst: result[0],
      newcar: result4[0],
    };
    res.status(200).json(responseObj);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
//img test
exports.updatefinance1 = async (req, res) => {
  try {

    const sequelize = await dbname(req.headers.compcode);
    let result;
    let result1;

    const DO_AMT = req.body.icm_mst[0].DO_AMT
      ? `'${req.body.icm_mst[0].DO_AMT}'`
      : null;
    const finreceivedate = req.body.icm_ext[0].finreceivedate
      ? `'${req.body.icm_ext[0].finreceivedate}'`
      : null;
    const gstinc = req.body.icm_ext[0].gstinc ? 1 : 0;
    const totalfin = req.body.icm_ext[0].totalfin
      ? req.body.icm_ext[0].totalfin
      : null;
    const TRAN_ID = req.body.icm_mst[0].TRAN_ID;
    const Fin_Dono = req.body.icm_mst[0].Fin_Dono
      ? req.body.icm_mst[0].Fin_Dono
      : 0;
    const DO_Pymt_Recd = req.body.icm_mst[0].DO_Pymt_Recd
      ? req.body.icm_mst[0].DO_Pymt_Recd
      : 0;
    const DO_Pymt_Recd_Date = req.body.icm_mst[0].DO_Pymt_Recd_Date
      ? `'${req.body.icm_mst[0].DO_Pymt_Recd_Date}'`
      : null;
    const Fin_Payout = req.body.icm_mst[0].Fin_Payout
      ? req.body.icm_mst[0].Fin_Payout
      : 0;
    const Payout_GST = req.body.icm_mst[0].Payout_GST
      ? req.body.icm_mst[0].Payout_GST
      : 0;
    const FLoan_Date = req.body.icm_mst[0].FLoan_Date
      ? `'${req.body.icm_mst[0].FLoan_Date}'`
      : null;
    const Cust_Id = req.body.icm_mst[0].Cust_Id
      ? req.body.icm_mst[0].Cust_Id
      : 0;
    const payout_rate = req.body.icm_mst[0].Payout_Rate
      ? req.body.icm_mst[0].Payout_Rate
      : 0;
    const tPayout_Rate = req.body.icm_ext[0].tPayout_Rate
      ? req.body.icm_ext[0].tPayout_Rate
      : null;
    const ttotalfin = req.body.icm_ext[0].ttotalfin
      ? req.body.icm_ext[0].ttotalfin
      : null;
    const executive_payout = req.body.icm_ext[0].executive_payout
      ? req.body.icm_ext[0].executive_payout
      : 0;
    //new one
    const payoutAMT = req.body.icm_mst[0].Payout_Amt
      ? req.body.icm_mst[0].Payout_Amt
      : 0;
    const gstAmount1 = req.body.icm_ext[0].gstAmount1
      ? req.body.icm_ext[0].gstAmount1
      : 0;
    //icm_ext
    const fpfcharge = req.body.icm_ext[0].fpfcharge
      ? req.body.icm_ext[0].fpfcharge
      : 0;
    const d_perc = req.body.icm_ext[0].d_perc ? req.body.icm_ext[0].d_perc : 0;
    const fdo_date = req.body.icm_ext[0].fdo_date
      ? `'${req.body.icm_ext[0].fdo_date}'`
      : null;
    const financier = req.body.icm_mst[0].Fin_Code
      ? `'${req.body.icm_mst[0].Fin_Code}'`
      : null;
    const Pymt_Mode = req.body.icm_mst[0].Pymt_Mode
      ? `'${req.body.icm_mst[0].Pymt_Mode}'`
      : null;
    const d_amt = req.body.icm_ext[0].d_amt
      ? `'${req.body.icm_ext[0].d_amt}'`
      : null;
    const Taxable_Amt = req.body.icm_ext[0].Taxable_Amt
      ? `'${req.body.icm_ext[0].Taxable_Amt}'`
      : null;
    const mssf = req.body.newcar[0].mssf_id
      ? `'${req.body.newcar[0].mssf_id}'`
      : null;
    const roi = req.body.newcar[0].roi ? `'${req.body.newcar[0].roi}'` : null;
    const tender = req.body.newcar[0].tendermonth
      ? `'${req.body.newcar[0].tendermonth}'`
      : null;
    const los = req.body.newcar[0].losNo
      ? `'${req.body.newcar[0].losNo}'`
      : null;
    const loan_account_number = req.body.newcar[0].loan_account_number
      ? `'${req.body.newcar[0].loan_account_number}'`
      : null;
    const loan_amount = req.body.newcar[0].loan_amount
      ? `'${req.body.newcar[0].loan_amount}'`
      : null;


    const mssfyes = req.body.icm_ext[0].mssf ? `'${req.body.icm_ext[0].mssf}'` : null
    const mssf_reason = req.body.icm_ext[0].mssf_reason ? `'${req.body.icm_ext[0].mssf_reason}'` : null
    const findse = req.body.icm_ext[0].findse ? `'${req.body.icm_ext[0].findse}'` : null

    const Payout_Received_Amount = req.body.icm_ext[0].Payout_Received_Amount ? req.body.icm_ext[0].Payout_Received_Amount : null
    const Payout_TDS = req.body.icm_ext[0].Payout_TDS ? req.body.icm_ext[0].Payout_TDS : null
    const fin_branch = req.body.icm_ext[0].fin_branch ? `'${req.body.icm_ext[0].fin_branch}'` : null


    const newcar_financedetails = await sequelize.query(
      `select * from newcar_financedetails where cust_id ='${Cust_Id}'`
    );

    if (newcar_financedetails[0].length < 1) {
      await sequelize.query(`insert into newcar_financedetails 
  (losNo,	mssf_id	,roi,	tendermonth	,cust_id,username,loan_account_number,loan_amount,icm_tran_id)
  values(${los},${mssf},${roi},${tender},'${Cust_Id}','${req.body.username}',${loan_account_number},${loan_amount},'${TRAN_ID}')`);
    } else {
      await sequelize.query(`update  newcar_financedetails 
  set losNo =${los},	mssf_id=${mssf}	,roi=${roi},	tendermonth	=${tender},loan_account_number=${loan_account_number},loan_amount=${loan_amount} where icm_tran_id = '${TRAN_ID}'`);
    }
    const check = `select * from icm_ext where Tran_id='${TRAN_ID}' and export_type=1`;
    let checkresult = await sequelize.query(check);
    let newquery;
    if (checkresult[0].length > 0) {
      newquery = `update  icm_ext set fin_branch=${fin_branch},Payout_TDS=${Payout_TDS},Payout_Received_Amount=${Payout_Received_Amount},findse=${findse},fdo_date=${fdo_date},mssf=${mssfyes},mssf_reason=${mssf_reason},d_perc='${d_perc}',fpfcharge='${fpfcharge}',gstAmount1='${gstAmount1}',totalfin=${totalfin ? totalfin : 'totalfin'},finreceivedate=${finreceivedate},gstinc='${gstinc}',d_amt=${d_amt},createdby='${req.body.username}',tPayout_Rate=${tPayout_Rate ? tPayout_Rate : 'tPayout_Rate'},ttotalfin=${ttotalfin ? ttotalfin : 'ttotalfin'},executive_payout=${executive_payout},Taxable_Amt=${Taxable_Amt},loc_code=(select top 1 loc_code from ICM_MST where  Tran_id='${TRAN_ID}') where Tran_id='${TRAN_ID}' and export_type=1;`;
    } else {
      newquery = `insert into icm_ext (tran_id,fdo_date,d_perc,fpfcharge,invoice_num,date,gstAmount1,totalfin,gstinc,finreceivedate,d_amt,createdby,tPayout_Rate,ttotalfin,executive_payout,Taxable_Amt,mssf,mssf_reason,findse,Payout_Received_Amount,Payout_TDS,loc_code,fin_branch,export_type) values('${TRAN_ID}',${fdo_date},'${d_perc}','${fpfcharge}',${null},${null},'${gstAmount1}',${totalfin ? totalfin : null},'${gstinc}',${finreceivedate},${d_amt},'${req.body.username}',${tPayout_Rate ? tPayout_Rate : null},${ttotalfin ? ttotalfin : null},${executive_payout},${Taxable_Amt},${mssfyes},${mssf_reason},${findse},${Payout_Received_Amount},${Payout_TDS},(select top 1 loc_code from ICM_MST where  Tran_id='${TRAN_ID}'),${fin_branch},1)`;
    }
    result1 = await sequelize.query(newquery);
    const query = `update icm_mst
           Set 
           Do_Amt=${DO_AMT},
           Fin_Dono='${Fin_Dono}',
           Fin_Payout='${Fin_Payout}',
           Payout_GST='${Payout_GST}',
           FLoan_Date=${FLoan_Date},
           DO_Pymt_Recd='${DO_Pymt_Recd}',
           DO_Pymt_Recd_Date=${DO_Pymt_Recd_Date},
           payout_rate='${payout_rate}',
           Payout_Amt='${payoutAMT}',
          FFin_code=${financier},
    Fin_code=${financier},
    Pymt_Mode=${Pymt_Mode}
               where Cust_Id='${Cust_Id}' and TRAN_ID='${TRAN_ID}' ; `;

    result = await sequelize.query(query);
    res.status(200).send("Data saved successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.payoutinvoicepending = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(
      `SELECT DISTINCT Misc_Code,Misc_Name FROM Misc_Mst where misc_type = 8 and export_type < 3`
    );
    res.render("payoutinvoicepending", {
      financer: result.recordset,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.exportinvoicepending = async function (req, res) {
  try {
    const ffincode = req.query.ffin_code;
    const date = req.query.dateFrom;
    const date2 = req.query.dateto;

    if (!date || !date2) {
      return res.status(404).json({ message: "Enter a Valid date" });
    }

    const loc_code = req.session.multi_loc;
    const sequelize = await dbname(req.headers.compcode);
    var result;
    if (ffincode == "ALL")
      result = await sequelize.query(`select * from ( select 
        (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as totalfin ,
        (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as gstAmount1 , 
        (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name, 
        (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 

    (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as invoice_num , 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID)as invoice_date, * from ICM_MST where  Pymt_Mode in ('4') and isnull(DO_AMT,0)>0 and (isnull(Payout_Rate,0)>0 or isnull(Payout_Amt,0)>0) and isnull(FRecd_Amt,0)=0  and ffin_code  is not null   and loc_code in  (${loc_code}) and INV_Date between '${date}' AND '${date2}' )as abce where  invoice_num is  null
    `);
    else {
      result = await sequelize.query(`select * from ( select
        (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as totalfin ,
        (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as gstAmount1 , 
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 

        (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as invoice_num , 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID)as invoice_date, * from ICM_MST where  Pymt_Mode in ('4') and isnull(DO_AMT,0)>0 and (isnull(Payout_Rate,0)>0 or isnull(Payout_Amt,0)>0) and isnull(FRecd_Amt,0)=0  and ffin_code='${ffincode}'   and loc_code in  (${loc_code}) and INV_Date between '${date}' AND '${date2}' )as abce where  invoice_num is  null
      `);
    }
    const Excel = require("exceljs");
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("Invoice  Pending Report");
    try {
      if (!result.recordset.length) return;
    } catch (err) { }
    const columns = [
      { header: "Sr No.", key: "TRAN_ID", width: 15 },
      { header: "Finance Do No. ", key: "Fin_Dono", width: 15 },
      { header: "Customer Name", key: "Ledg_Name", width: 15 },
      { header: "Customer Id", key: "Cust_Id", width: 10 },
      { header: "Invoice", key: "DMS_Inv", width: 10 },
      { header: "Date", key: "INV_Date", width: 10 },
      { header: "Chasis", key: "Chas_No", width: 15 },
      { header: "Payout", key: "Payout_Amt", width: 15 },
      { header: "Gst", key: "gstAmount1", width: 15 },
      { header: "Total Finance", key: "totalfin", width: 15 },
      { header: "Financer Name", key: "Financer_name", width: 15 },
      { header: "Financer Type", key: "Financer_Type", width: 15 },
      { header: "Branch", key: "branch", width: 15 },
    ];
    worksheet.columns = columns;
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: "center" };
      cell.font = { bold: true };
      cell.border = {
        bottom: { style: "thin" },
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "90EE90" },
      };
    });
    result.recordset.forEach((record) => {
      worksheet.addRow(record);
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Invoicepending_Report.xlsx"'
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
  } catch (err) {
    console.log(err);
  }
};

function wrapValuesInQuotes(valuesString) {
  // Split the string into an array of values
  try {

    const valuesArray = valuesString.split(",");

    // Map over the array and wrap each value in single quotes
    const quotedValuesArray = valuesArray.map((value) => `'${value.trim()}'`);

    return quotedValuesArray;
  } catch (err) {
    return valuesString
  }
}

exports.viewpendingdatainvoice = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const date = req.body.dateFrom;
    const date2 = req.body.dateto;
    const ffin_code = wrapValuesInQuotes(req.body.ffincode);

    const loc_code = req.body.multi_loc;
    let result;
    // if (req.headers.compcode.toLowerCase() != 'seva-24') {
    //   result = await sequelize.query(`select * from ( select
    //      (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin ,
    //     (select top 1 ttotalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin1 ,
    //      (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as gstAmount1 , 
    //       (select top 1 payout_type from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as payout_type , 
    //      (select top 1 Taxable_Amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Taxable_Amt , 
    //      (select top 1 preinvoice_by from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as preinvoice_by , 
    //      (select top 1 preinvoice_date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as preinvoice_date , 
    //      (select top 1 apayout from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1 )as apayout , 
    //      (select top 1 Replace(newcar_rcpt, '-S', '') + '/' + (select top 1 preinvoice_num from icm_ext where icm_ext.tran_id = ICM_MST.TRAN_ID and icm_ext.export_type=1)from Godown_Mst where godw_code = (select top 1 loc_code from icm_ext where icm_ext.tran_id = ICM_MST.TRAN_ID)) as PreInvoiceNum,
    //    (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name, 
    //    (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
    //    (select top 1 d_amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as deduction_per , 
    //      (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_num , 
    //    (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
    //    (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_date,
    //    TRAN_ID,Cust_Id,Fin_Dono,Ledg_Name,Chas_No,fin_code as ffin_code,INV_Date,DMS_Inv
    //    from ICM_MST where  Pymt_Mode in ('4')  and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a )  and fin_code in (${ffin_code})   and loc_code in  (${loc_code}) and INV_Date between '${date}' AND '${date2}' )as abce where  invoice_num is  null and PreInvoiceNum is not null
    //    `);
    // } else {
    result = await sequelize.query(`select ROW_NUMBER() OVER (ORDER BY PreInvoiceNum DESC) AS SrNo,PreInvoiceNum as TRAN_ID,count(*)as Count,PreInvoiceNum,preinvoice_date,Financer_name,Description,sum(Taxable_Amt)as Taxable_Amt,sum(gstAmount1)as gstAmount1,sum(totalfin)as totalfin,branch from ( select
        (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin ,
        (select top 1 ttotalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin1 ,
        (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as gstAmount1 ,
          (select top 1 payout_type from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as payout_type ,
          (select top 1 preinvoice_by from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as preinvoice_by ,
         (select top 1 cast(preinvoice_date as date) from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as preinvoice_date ,
         (select top 1 Replace(newcar_rcpt, '-S', '') + '/' + (select top 1 preinvoice_num from icm_ext where icm_ext.tran_id = ICM_MST.TRAN_ID and icm_ext.export_type=1)from Godown_Mst where godw_code =
         (select top 1 loc_code from icm_ext where icm_ext.tran_id = ICM_MST.TRAN_ID) and Export_Type<3) as PreInvoiceNum,
         (select top 1 apayout from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as apayout ,
         (select top 1 Taxable_Amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Taxable_Amt ,
         (select top 1 Description from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Description ,
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name,
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type,
      (select top 1 d_amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as deduction_per ,
        (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_num ,
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_date,
TRAN_ID,   Tran_Type,  DRD_ID,  INV_No,(select top 1 (Sale_INV_Prefix+Invoice_no)as DMS_Inv1 from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as DMS_Inv,
(select top 1 Invoice_Date from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as INV_Date,
Cust_Id,Fin_Dono,Ledg_Name,Chas_No,fin_code as ffin_code from ICM_MST where  Pymt_Mode in ('5','1')  and EXPORT_TYPE<3
 and tran_id  in (select a.tran_id from icm_ext a )  and fin_code in 
(${ffin_code}) and loc_code in  (${loc_code}) and Bhatia_Inv_Date between '${date}' AND '${date2}')as abce 
  where  invoice_num is  null and PreInvoiceNum is not null
  group by PreInvoiceNum,preinvoice_date,Financer_name,Description,branch
`);
    // }
    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};
exports.viewpendingdatainvoicepre = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const date = req.body.dateFrom;
    const date2 = req.body.dateto;
    const ffin_code = wrapValuesInQuotes(req.body.ffincode);

    const loc_code = req.body.multi_loc;
    let result;
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result = await sequelize.query(`select * from ( select
         (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin ,
        (select top 1 ttotalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin1 ,
        (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as gstAmount1 , 
        (select top 1 fin_branch from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as fin_branch , 
        (select top 1 payout_type from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as payout_type , 
        (select top 1 Taxable_Amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Taxable_Amt , 
       (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name, 
       (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
       (select top 1 d_amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1 )as deduction_per , 
      (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_num , 
      (select top 1 preinvoice_date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as preinvoice_date , 
      (select top 1 preinvoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as preinvoice_num , 
      (select top 1 Emaildate from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Emaildate , 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_date,
       TRAN_ID,Cust_Id,Fin_Dono,Ledg_Name,Chas_No,fin_code as ffin_code,INV_Date,DMS_Inv
       from ICM_MST where  Pymt_Mode in ('4')  and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a )  and fin_code in (${ffin_code})   and loc_code in  (${loc_code}) and INV_Date between '${date}' AND '${date2}' )as abce where  preinvoice_num is  null and Emaildate is not null
       `);
    } else {
      result = await sequelize.query(`select * from ( select
        (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin ,
        (select top 1 ttotalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin1 ,
        (select top 1 payout_type from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as payout_type , 
                (select top 1 fin_branch from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as fin_branch , 
        (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as gstAmount1 , 
         (select top 1 Taxable_Amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Taxable_Amt , 
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.fin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 d_amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as deduction_per , 
        (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_num , 
         (select top 1 preinvoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as preinvoice_num , 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as invoice_date, 
               (select top 1 Emaildate from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as Emaildate , 
         (select top 1 preinvoice_date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as preinvoice_date , 
TRAN_ID,	Tran_Type,	DRD_ID,	INV_No,	(select top 1 (Sale_INV_Prefix+Invoice_no)as DMS_Inv1 from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as DMS_Inv,
(select top 1 Invoice_Date from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as INV_Date,
Cust_Id,Fin_Dono,Ledg_Name,Chas_No,fin_code as ffin_code from ICM_MST where  Pymt_Mode in ('5','1')  and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a )  and fin_code in (${ffin_code})   and loc_code in  (${loc_code}) and Bhatia_Inv_Date between '${date}' AND '${date2}' )as abce where  preinvoice_num is  null and  Emaildate is not null
      `);
    }

    res.status(200).send(result);
  } catch (err) {
    console.log(err);
  }
};
exports.viewpayoutdocument = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const date = req.body.dateFrom;
    const date2 = req.body.dateto;

    const ffin_code = wrapValuesInQuotes(req.body.ffin_code);

    const loc_code = req.body.multi_loc;
    let result;

    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      result = await sequelize.query(`select * from ( select
        (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as totalfin ,
               (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
        (select top 1 vechical_invoice from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as vechical_invoice ,
        (select top 1 Emaildate from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as Emaildate ,
        (select top 1 tPayout_Rate from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as tPayout_Rate ,
        (select top 1 insurance_policy from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as insurance_policy ,
        (select top 1 Rto_Copy from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as Rto_Copy ,
        (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as gstAmount1 , 
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.ffin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 d_amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as deduction_per , 
        (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as invoice_num , 
         (select top 1 preinvoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as preinvoice_num , 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID)as invoice_date, 
      * from ICM_MST where  Pymt_Mode in ('4')  and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a )  and fin_code in (${ffin_code})   and loc_code in  (${loc_code}) and INV_Date between '${date}' AND '${date2}' )as abce where  tPayout_Rate is not  null and preinvoice_num is null
      `);
    } else {
      result = await sequelize.query(`select * from ( select
        (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as totalfin ,
               (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
       (select top 1 vechical_invoice from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as vechical_invoice ,
       (select top 1 Emaildate from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as Emaildate ,
       (select top 1 tPayout_Rate from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as tPayout_Rate ,
        (select top 1 insurance_policy from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as insurance_policy ,
        (select top 1 Rto_Copy from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as Rto_Copy ,
        (select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as gstAmount1 , 
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and convert(varchar,misc_mst.misc_code)=icm_mst.ffin_code)As Financer_name, 
      (select top 1 Misc_Name from misc_mst where Misc_Type=18 and misc_mst.misc_code=icm_mst.Pymt_Mode)As Financer_Type, 
      (select top 1 d_amt from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as deduction_per , 
        (select top 1 invoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as invoice_num, 
      (select top 1 godw_name from godown_mst where godown_mst.godw_code=icm_mst.loc_code and godown_mst.export_type<3)as branch,
         (select top 1 preinvoice_num from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID )as preinvoice_num , 
      (select top 1 date from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID)as invoice_date, 
TRAN_ID,	Tran_Type,	DRD_ID,	INV_No,	(select top 1 (Sale_INV_Prefix+Invoice_no)as DMS_Inv1 from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as DMS_Inv,
(select top 1 Invoice_Date from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as INV_Date,
Cust_Id,Fin_Dono,Ledg_Name,Chas_No,ffin_code from ICM_MST where  Pymt_Mode in ('5','1')  and EXPORT_TYPE<3   and tran_id  in (select a.tran_id from icm_ext a )  and fin_code in (${ffin_code})   and loc_code in  (${loc_code}) and Bhatia_Inv_Date between '${date}' AND '${date2}' )as abce where  tPayout_Rate is not null and preinvoice_num is null
      `);
    }

    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};
async function uploadImagesto(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    await Promise.all(files?.map(async (file, index) => {
      const customPath = `${Comp_Code}/PAYOUT/`;
      const ext = path.extname(file.originalname);
      // Generate randomUUID
      const randomUUID = uuidv4();

      // Append extension to randomUUID
      const fileName = randomUUID + ext;
      console.log(fileName);
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
        console.log(`Image uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading image ${index}:`, error.message);
      }
      const data = {
        SRNO: index,
        EMP_CODE: Created_by,
        Created_by: Created_by,
        DOC_NAME: file.originalname,
        misspunch_inout: index,
        columndoc_type: "PAYOUT",
        DOC_PATH: `${customPath}${fileName}`,
      };
      dataArray.push(data);
    }));

    console.log(dataArray, 'dataArray');
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}

exports.UploadImages = async function (req, res) {
  try {

    if (req.body.EMPCODE == "" || req.body.EMPCODE == undefined || req.body.EMPCODE == null) {
      return res.status(500).send({
        status: false,
        Message: "EMPCODE is mandatory",
      });
    }
    if (req.body.UTD == "" || req.body.UTD == undefined || req.body.UTD == null) {
      return res.status(500).send({
        status: false,
        Message: "UTD is mandatory",
      });
    }
    if (req.body.Image_Index == "" || req.body.Image_Index == undefined || req.body.Image_Index == null) {
      return res.status(500).send({
        status: false,
        Message: "Image_Index is mandatory",
      });
    }
    // (SELECT COALESCE(MAX(SRNO), 0) + 1 FROM DOC_UPLOAD WHERE TRAN_ID = ${UTD})
    const EMPCODE = req.body.EMPCODE;
    const UTD = req.body.UTD;
    const Image_Index = req.body.Image_Index;
    const sequelize = await dbname(req.headers.compcode);
    let EMP_DOCS_data;
    try {
      if (req.files) {
        EMP_DOCS_data = await uploadImagesto(
          req.files,
          req.headers.compcode,
          req.body.EMPCODE,
        );
        if (Image_Index == 1) {
          await sequelize.query(`update icm_ext set vechical_invoice='${EMP_DOCS_data[0].DOC_PATH}' where tran_id=${UTD}`)
        } else if (Image_Index == 2) {
          await sequelize.query(`update icm_ext set insurance_policy='${EMP_DOCS_data[0].DOC_PATH}' where tran_id=${UTD}`)
        } else if (Image_Index == 3) (
          await sequelize.query(`update icm_ext set rto_copy='${EMP_DOCS_data[0].DOC_PATH}' where tran_id=${UTD}`)
        )
      }

      res.status(200).send(EMP_DOCS_data[0].DOC_PATH);
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};



exports.invoicegenerate = async function (req, res) {
  try {
    const otherpayout = req.body.otherpayout;
    const Taxable = req.body.Taxable;
    const gst = req.body.gst;
    const apayout = req.body.apayout
    const remark = req.body.Remark;
    const user = req.body.user
    const tran_id = req.body.data;
    const Description = req.body.Description;
    // const invoicenumber = req.body.invoicenumber;
    // const date = req.body.date;
    const sequelize = await dbname(req.headers.compcode);
    const inv = await sequelize.query(`select isnull(Max(preinvoice_num)+1,1)as inv  from icm_ext where loc_code = (select top 1 loc_code from ICM_MST where  Tran_id='${tran_id[0]}')`)
    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update icm_ext set otherpayout=${otherpayout ? otherpayout : null},Taxable=${Taxable},gst=${gst},
        apayout=${apayout},remark='${remark}',preinvoice_by='${user}',preinvoice_date=GETDATE(),preinvoice_num='${inv[0][0].inv}',Description='${Description}' where tran_id=${tran_id[i]} and preinvoice_date is null and export_type=1`
      );
    }
    const invNo = await sequelize.query(`
      SELECT 
    Replace(NewCar_Rcpt, '-S', '') + '/' +'${inv[0][0].inv}' as Invoice
FROM 
    godown_mst 
WHERE 
    godw_code = (
        SELECT TOP 1 loc_code 
        FROM ICM_MST 
        WHERE Tran_id = '${tran_id[0]}'
    ) 
    AND Export_Type < 3;

      `)
    res.status(200).send(invNo[0][0]);
  } catch (err) {
    console.log(err);
  }
};


exports.invoiceDetailssave = async function (req, res) {
  try {
    const tran_id = req.body.data;
    const invoicenumber = req.body.invoicenumber;
    const date = req.body.date;
    const sequelize = await dbname(req.headers.compcode);
    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update icm_ext set invoice_num='${invoicenumber}',date='${date}' where tran_id in (
        select tran_id from (
        select 
        Replace(godown_mst.NewCar_Rcpt, '-S', '') + '/'+ preinvoice_num as Invoice,tran_id from icm_ext
        left join godown_mst on Godw_Code=icm_ext.loc_code and godown_mst.Export_Type<3)as ab
        where Invoice='${tran_id[i]}'
        ) 
        and invoice_num is null and export_type=1`
      );
    }
    res.status(200).send({ message: "successfull" });
  } catch (err) {
    console.log(err);
  }
};

exports.financedetails = async function (req, res) {
  try {
    res.render("financedetailstable");
  } catch (err) {
    console.log(err);
  }
};


exports.payoutfinancereport = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  const branch = req.body.multi_loc;
  try {
    const sequelize = await dbname(req.headers.compcode);

    const discountdata = await sequelize.query(
      `select branch_name,SUM(CASH + total_inhouse + self_loan)as RETAIL,CASH,
SUM(total_inhouse + self_loan)as FIN_POTENTIAL,
total_inhouse,self_loan,
(CAST(SUM(total_inhouse) AS FLOAT) / CAST(SUM(CASH + total_inhouse + self_loan) AS FLOAT) * 100) AS New_Format,
(CAST(SUM(total_inhouse) AS FLOAT) / CAST(SUM(total_inhouse + self_loan) AS FLOAT) * 100) AS Old_Format
from(SELECT 
    (SELECT TOP 1 godw_name 
     FROM Godown_Mst 
     WHERE Godw_Code = Loc_Code) AS branch_name,
    
    -- Counting CASH transactions
    COUNT(CASE WHEN Pymt_Mode = 2 THEN 1 END) AS CASH,
    
    -- Counting total_inhouse transactions
    COUNT(CASE WHEN Pymt_Mode IN (5, 1) THEN 1 END) AS total_inhouse,
    
    -- Counting self_loan transactions
    COUNT(CASE WHEN Pymt_Mode = 6 THEN 1 END ) AS self_loan,

    -- Calculating New_Format (percentage of total_inhouse over all transactions)
    CAST(COUNT(CASE WHEN Pymt_Mode IN (5, 1) THEN 1 END) AS FLOAT) / 
    CAST(COUNT(*) AS FLOAT) * 100 AS New_Format

FROM 
    ICM_MST
WHERE 
     Pymt_Mode IS NOT NULL
       AND loc_code IN (1,7,9,11,12,14,15,21,22,23,24,26,27,6)
    AND (Fin_Code IN (select misc_code from Misc_Mst where Misc_Type=8 and Export_Type<3) or Fin_code is null)
       AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
	   and loc_code in (${branch})
GROUP BY 
    Loc_Code
	)as ab
GROUP BY 
    branch_name, CASH, total_inhouse, self_loan;
`
    );

    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


exports.findfiannceata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(`select 
    (select top 1 godw_name from godown_mst where Godw_Code=Loc_Code and EXPORT_TYPE<3) as BranchName,
    (select top 1 misc_name from Misc_Mst where misc_code=financer and Misc_Type=8 and Export_Type<3)as financer_name,
    (select top 1 misc_name from Misc_Mst where misc_code=Loan_Type and Misc_Type=18 and Export_Type<3)as Loan_typeName,* from newcar_financedetails where inv_no='${req.body.Cust_Id}'`);
    const result2 = await sequelize.query(`
      select distinct inv_no,customer_id,(select top 1 godw_code from Godown_Mst where Replace(NEWCAR_RCPT,'-S','')=Location_Code and Export_Type<3)as loc_code,customer_name,vin,inv_dt from newcar_sale_register where  inv_no ='${req.body.Cust_Id}'
      `);
    const company =
      await sequelize.query(`select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
    gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
    from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
    where  gm.Export_Type < 3 AND gm.Godw_code  in (${req.body.multi_loc})`);
    res.status(200).send({
      result: result[0][0],
      result2: result2[0][0],
      company: company[0][0],
    });
  } catch (err) {
    console.log(err);
  }
};

exports.viewfinancedetailstable = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const status = req.body.status;
    const branch = req.body.branch
    const sequelize = await dbname(req.headers.compcode);
    // let result; = await sequelize.query(`
    // select distinct inv_no,customer_id,customer_name,vin,inv_dt from newcar_sale_register where icm_id is null and customer_id is not null and inv_dt is not null and inv_dt between '${dateFrom}' and '${dateto}' and vin is not null and customer_id not in (
    //   select cust_id from newcar_financedetails)  order by inv_dt desc
    // `);
    const result1 = await sequelize.query(
      `select Godw_Name as label,Godw_Code as value from GODOWN_MST where  export_type<3`
    );
    const result3 = await sequelize.query(
      "select Misc_Code as value,Misc_Name as label from misc_mst where Misc_Type=18"
    );

    if (status == 0) {
      result = await sequelize.query(`
      select distinct inv_no,
      customer_id,customer_name,vin,inv_dt,
      (select top  1 misc_name from misc_mst where Misc_Type=18  and misc_code in (select loan_type from newcar_financedetails where inv_no=newcar_sale_register.Inv_No))as loan_type,
    (select top  1 misc_name from misc_mst where Misc_Type=8  and misc_code in (select financer from newcar_financedetails where inv_no=newcar_sale_register.Inv_No))as financer,
    (select fin_dono from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_dono,
    (select fin_do_date from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_do_date,
    (select fin_doamt from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_doamt,
    (select fin_paymt_recd from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_paymt_recd,
    (select finpaymtrec_date from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_paymt_recd_date,
    (select losNo from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as los,
    (select mssf_id from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as mssf_id,
    (select roi from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as roi,
    (select tendermonth from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as tendermonth,
    (select loan_amount from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as loan_amount,
    (select loan_account_number from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as loan_account_number,
    (select payoutpertentative from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as payoutpertentative  
      from newcar_sale_register where   Inv_No not in (select Inv_No from newcar_financedetails where inv_no is not null) and icm_id != '99999' and customer_id is not null and inv_dt is not null and inv_dt between '${dateFrom}' and '${dateto}' and vin is not null and location_code in (select newcar_rcpt from godown_mst where godw_code in (${branch}))  order by inv_dt desc
      `);
    } else if (status == 1) {
      result = await sequelize.query(`select distinct inv_no,
      customer_id,customer_name,vin,inv_dt,
      (select top  1 misc_name from misc_mst where Misc_Type=18  and misc_code in (select loan_type from newcar_financedetails where inv_no=newcar_sale_register.Inv_No))as loan_type,
    (select top  1 misc_name from misc_mst where Misc_Type=8  and misc_code in (select financer from newcar_financedetails where inv_no=newcar_sale_register.Inv_No))as financer,
    (select fin_dono from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_dono,
    (select fin_do_date from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_do_date,
    (select fin_doamt from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_doamt,
    (select fin_paymt_recd from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_paymt_recd,
    (select finpaymtrec_date from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as fin_paymt_recd_date,
    (select losNo from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as los,
    (select mssf_id from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as mssf_id,
    (select roi from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as roi,
    (select tendermonth from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as tendermonth,
    (select loan_amount from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as loan_amount,
    (select loan_account_number from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as loan_account_number,
    (select payoutpertentative from newcar_financedetails where inv_no=newcar_sale_register.Inv_No)as payoutpertentative  
      from newcar_sale_register where  Inv_No in (select Inv_No from newcar_financedetails) and icm_id !='99999' and inv_dt between '${dateFrom}' and '${dateto}' and vin is not null and location_Code in (select newcar_rcpt from godown_mst where godw_code in (${branch}))  order by inv_dt desc`);
    }

    res.status(200).send({
      financedetails: result[0],
      branch: result1[0],
      fintype: result3[0],
    });
  } catch (err) {
    console.log(err);
  }
};

exports.updateviewfinancedetailstable = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result1 = await sequelize.query(
      `select Godw_Name,Godw_Code from GODOWN_MST where Godw_Code in (${req.body.Multi_Loc}) and  export_type<3`
    );
    const result3 = await sequelize.query(
      "select Misc_Code,Misc_Name from misc_mst where Misc_Type=18"
    );

    res.status(200).send({
      branch: result1,
      fintype: result3,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.updateFINANCEDETAILS = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const fintype = req.body.loan_type ? `'${req.body.loan_type}'` : null;
    const financier = req.body.financer ? `'${req.body.financer}'` : null;
    const loc_code = req.body.loc_code ? `'${req.body.loc_code}'` : null;
    const finDoNo = req.body.fin_dono ? `'${req.body.fin_dono}'` : null;
    const finDoNodate = req.body.fin_do_date
      ? `'${req.body.fin_do_date}'`
      : null;
    const finDoAmt = req.body.fin_doamt ? `${req.body.fin_doamt}` : null;
    const finPymtReceived = req.body.fin_paymt_recd
      ? `${req.body.fin_paymt_recd}`
      : null;
    const losno = req.body.losNo ? `'${req.body.losNo}'` : null;
    const mssfid = req.body.mssf_id ? `'${req.body.mssf_id}'` : null;
    const roi = req.body.roi ? `${req.body.roi}` : null;
    const tenuremonth = req.body.tendermonth
      ? `'${req.body.tendermonth}'`
      : null;
    const finPymtReceiveddate = req.body.finpaymtrec_date
      ? `'${req.body.finpaymtrec_date}'`
      : null;
    const cust_id = req.body.cust_id ? `'${req.body.cust_id}'` : null;
    const loanaccountnumber = req.body.loan_account_number
      ? `'${req.body.loan_account_number}'`
      : null;
    const loanamount = req.body.loan_amount
      ? `'${req.body.loan_amount}'`
      : null;
    const payoutper = req.body.payoutpertentative
      ? `'${req.body.payoutpertentative}'`
      : null;

    const invoiceNo = req.body.inv_no ? `'${req.body.inv_no}'` : null;

    const inv_dt = req.body.inv_dt ? `'${req.body.inv_dt}'` : null;

    const vin = req.body.vin ? `'${req.body.vin}'` : null;
    const customerID = req.body.customer_id
      ? `'${req.body.customer_id}'`
      : null;

    const result = await sequelize.query(
      `select  inv_no,customer_id,customer_name,vin,inv_dt from newcar_sale_register where inv_no=${invoiceNo}  order by inv_dt desc`
    );
    // const delv_date=await request.query(`select Delv_Date from icm_mst where  dms_inv=${invoiceNo}`)

    // if(delv_date[0].length>0){

    //   if(delv_date[0][0].Delv_Date){
    //     return res.status(401).send("Locaked By Icm Team")
    //   }
    // }
    const financedetails = await sequelize.query(
      `select * from newcar_financedetails where inv_no=${invoiceNo}`
    );
    if (financedetails[0].length > 0) {
      await sequelize.query(`update newcar_financedetails set loan_type=${fintype},	financer=${financier}	,fin_dono=${finDoNo},	fin_do_date=${finDoNodate},fin_doamt=${finDoAmt},fin_paymt_recd=${finPymtReceived},
      finpaymtrec_date= ${finPymtReceiveddate}	,losNo=${losno},	mssf_id=${mssfid}	,roi=${roi},	tendermonth=${tenuremonth},	
        loc_code=${loc_code},	username='${req.body.username}',loan_amount=${loanamount},loan_account_number=${loanaccountnumber},payoutpertentative=${payoutper} where  inv_no=${invoiceNo}`);
    } else {
      await sequelize.query(`insert into newcar_financedetails 
      (loan_type,	financer	,fin_dono,	fin_do_date,fin_doamt,fin_paymt_recd,
      finpaymtrec_date	,losNo,	mssf_id	,roi,	tendermonth	,cust_id,	vin	,inv_no,	date,
        loc_code,	export_type	,username,loan_amount,loan_account_number,payoutpertentative)
      values(${fintype},${financier},${finDoNo},${finDoNodate},${finDoAmt},${finPymtReceived},
      ${finPymtReceiveddate},${losno},${mssfid},${roi},${tenuremonth},${customerID},${vin},${invoiceNo},
      ${inv_dt},${loc_code},'1','${req.body.username}',${loanamount},${loanaccountnumber},${payoutper})`);
    }

    const icm = await sequelize.query(
      `select * from icm_mst where  dms_inv=${invoiceNo}`
    );
    if (icm[0].length > 0) {
      const query = `
    UPDATE icm_mst 
    SET 
      Pymt_Mode = COALESCE(?, Pymt_Mode), 
      DO_AMT = COALESCE(?, DO_AMT),
      Fin_Dono = COALESCE(?, Fin_Dono), 
      DO_Pymt_Recd = COALESCE(?, DO_Pymt_Recd), 
      DO_Pymt_Recd_Date = COALESCE(?, DO_Pymt_Recd_Date), 
      fin_code = COALESCE(?, fin_code), 
      ffin_code = COALESCE(?, ffin_code)
    WHERE 
      dms_inv = ?`;

      const values = [
        req.body.loan_type || null,
        req.body.fin_doamt || null,
        req.body.fin_dono || null,
        req.body.fin_paymt_recd || null,
        req.body.finpaymtrec_date || null,
        req.body.financer || null,
        req.body.financer || null,
        req.body.inv_no
      ];

      await sequelize.query(query, { replacements: values });



    }
    res.status(200).send({ message: "done" });
  } catch (err) {
    console.log(err);
  }
};
exports.payoutactualchnage = async function (req, res) {
  try {
    console.log(req.body);
    const tran_id = JSON.parse(req.body.data);
    const Payout_Rate = req.body.Payout_Rate;
    const finPymtReceived = req.body.finPymtReceived;
    const sequelize = await dbname(req.headers.compcode);

    res.status(200).send({ message: "done" });
  } catch (err) {
    console.log(err);
  }
};




exports.importformat = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Executive Excel Import";
    const Headeres = ["Engine No", "Chassis No", "Loan Account Number", "Actual Payout Amount"];

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
      'attachment; filename="Payout_Import_Tamplate.xlsx"'
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
      'attachment; filename="Payout_Import_Tamplate.xlsx"'
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

exports.paymentimport = async function (req, res, next) {
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
    const renameKeys = (obj) => {
      const keyMap = {
        "Engine No": "Engine_No",
        "Chassis No": "Chassis_No",
        "Loan Account Number": "Loan_Account_Number",
        "Actual Payout Amount": "Actual_Payout_Amount",
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
    // cheking duplicate employeeCode
    const CorrectData = [];

    for (item of data) {
      const result = await sequelize.query(
        `SELECT Tran_id FROM icm_mst WHERE Engn_No='${item.Engine_No}' AND Chas_No='${item.Chassis_No}'`,
        { transaction: t }
      );
      const tran_id = result[0][0].Tran_id;
      const actualPayoutAmount = item.Actual_Payout_Amount;
      // Calculate taxable amount and fix to 2 decimal places
      const taxableAmount = (actualPayoutAmount / 1.18).toFixed(2);
      // Calculate GST (18%) and fix to 2 decimal places
      const gstAmount = (taxableAmount * 0.18).toFixed(2);
      await sequelize.query(`update icm_ext set totalfin='${actualPayoutAmount}',gstAmount1='${gstAmount}',Taxable_Amt='${taxableAmount}' where tran_id='${tran_id}'`)
      const corr = await sequelize.query(`select Engn_No,Chas_No,(select top 1 loan_account_number from newcar_financedetails where icm_mst.TRAN_ID=newcar_financedetails.icm_tran_id)as Loan_Account_Number,
(select top 1 totalfin from icm_ext where icm_ext.tran_id=icm_mst.TRAN_ID)as Actual_Payout_Amount,
(select top 1 gstAmount1 from icm_ext where icm_ext.tran_id=icm_mst.TRAN_ID)as Gst_Amount,
(select top 1 Taxable_Amt from icm_ext where icm_ext.tran_id=icm_mst.TRAN_ID)as Taxable_Amt
        from icm_mst where TRAN_ID='${tran_id}'`)
      CorrectData.push(corr[0][0])
    }
    t.commit();
    await sequelize.close();
    res.status(200).send({
      ErroredData: [],
      CorrectData: CorrectData,
      Message: `${data.length} Records Inserted`,
    });
    // res.status(200).send("imported Successfully");
  } catch (error) {
    t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};



exports.findallbranches = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(`
    select Godw_Code,Godw_Name from Godown_Mst where SALES_INTEGRATION in (1,99) and Export_Type<3 order by Godw_Code`)
    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};

exports.Savefinancer = async function (req, res) {
  // Validate the amounts array using Joi
  const { error: financeError, value: FinancerMasters } = Joi.array()
    .items(financerSchema)
    .validate(req.body.amounts, {
      abortEarly: false,
      stripUnknown: true,
    });

  // Handle validation errors
  if (financeError) {
    const errors = financeError.details || [];
    const errorMessage = errors.map((err) => err.message).join(', ');
    return res.status(400).send({ success: false, message: errorMessage });
  }

  let transaction;
  try {
    // Get the Sequelize instance and model
    const sequelize = await dbname(req.headers.compcode);
    const Finance_Master = _FinancerMaster(sequelize, Sequelize.DataTypes);

    // Start a transaction
    transaction = await sequelize.transaction();

    // Insert each valid financer into the database
    const insertedRecords = await Promise.all(
      FinancerMasters.map((financerData) => {
        return Finance_Master.create(
          {
            Financer: financerData.Financer,
            godw_code: financerData.godw_code,
            amount: financerData.amount,
            validfrom: financerData.validfrom,
            validTo: financerData.validTo,
            CREATED_BY: financerData.CREATED_BY, // Assuming CREATED_BY is taken from request body
            Gst: financerData.Gst
          },
          { transaction }
        );
      })
    );

    // Commit the transaction after successful inserts
    await transaction.commit();

    // Send a success response with inserted records
    return res.status(200).send({
      success: true,
      message: 'Financer data inserted successfully',
      data: insertedRecords,
    });
  } catch (err) {
    // Rollback the transaction in case of error
    if (transaction) await transaction.rollback();
    console.log('Error saving financer:', err);
    return res.status(500).send({
      success: false,
      message: 'Error saving financer data',
      error: err.message,
    });
  }
};
exports.Updatefinancer = async function (req, res) {
  // Validate the amounts array using Joi
  const { error: financeError, value: FinancerMasters } = Joi.array()
    .items(financerSchema)
    .validate(req.body.amounts, {
      abortEarly: false,
      stripUnknown: true,
    });

  // Handle validation errors
  if (financeError) {
    const errors = financeError.details || [];
    const errorMessage = errors.map((err) => err.message).join(', ');
    return res.status(400).send({ success: false, message: errorMessage });
  }
  let transaction;
  try {
    // Get the Sequelize instance and model
    const sequelize = await dbname(req.headers.compcode);
    const Finance_Master = _FinancerMaster(sequelize, Sequelize.DataTypes);

    // Start a transaction
    transaction = await sequelize.transaction();

    // Insert each valid financer into the database
    const insertedRecords = await Promise.all(
      FinancerMasters.map((financerData) => {
        if (financerData.UTD) {
          return Finance_Master.update(
            {
              Financer: financerData.Financer,
              godw_code: financerData.godw_code,
              amount: financerData.amount,
              validfrom: financerData.validfrom,
              validTo: financerData.validTo,
              CREATED_BY: financerData.CREATED_BY, // Assuming CREATED_BY is taken from request body
              Gst: financerData.Gst
            },
            {
              where: {
                UTD: financerData.UTD // Using UTD to identify the record to update
              },
              transaction
            }
          );
        } else {
          // Optionally handle the case when UTD is missing, e.g., log it or throw an error
          return Promise.resolve(); // Skips updating if no UTD
        }
      })
    );
    // Commit the transaction after successful inserts
    await transaction.commit();
    // Send a success response with inserted records
    return res.status(200).send({
      success: true,
      message: 'Financer data inserted successfully',
      data: insertedRecords,
    });
  } catch (err) {
    // Rollback the transaction in case of error
    if (transaction) await transaction.rollback();
    console.log('Error saving financer:', err);
    return res.status(500).send({
      success: false,
      message: 'Error saving financer data',
      error: err.message,
    });
  }
};
exports.findMasterdata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const fin_code = req.body.ffin_code;
    const result = await sequelize.query(`
    select Financer,CREATED_BY,amount,godw_code,validTo,validfrom,UTD,Gst from Financer_Master where Financer='${fin_code}' and  validFrom <= CAST(GETDATE() AS DATE) 
AND validTo >= CAST(GETDATE() AS DATE) and godw_code!=0`)
    const Default = await sequelize.query(`
  select utd,amount from Financer_Master where Financer='${fin_code}' and  validFrom <= CAST(GETDATE() AS DATE) 
AND validTo >= CAST(GETDATE() AS DATE) and godw_code=0`)
    res.status(200).send({ result: result[0], default: Default[0][0] });
  } catch (err) {
    console.log(err);
  }
};
exports.findpayout = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const fin_code = req.body.fincode;
    const location = req.body.location;
    const result = await sequelize.query(`
      SELECT TOP 1 amount,Gst
      FROM (
          SELECT amount,Gst
          FROM Financer_Master 
          WHERE Financer = ${fin_code}
            AND validFrom <= CAST(GETDATE() AS DATE) 
            AND validTo >= CAST(GETDATE() AS DATE) 
            AND godw_code = ${location} 
            AND (amount IS NOT NULL AND amount > 0)
          
          UNION ALL
      
          SELECT amount,Gst
          FROM Financer_Master 
          WHERE Financer = ${fin_code}
            AND validFrom <= CAST(GETDATE() AS DATE) 
            AND validTo >= CAST(GETDATE() AS DATE) 
            AND godw_code = 0 
            AND (amount IS NOT NULL AND amount > 0)
      ) AS CombinedResults
      `);


    res.status(200).send(result[0][0]);
  } catch (err) {
    console.log(err);
  }
};
exports.payoutvariencereport = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  const branch = req.body.multi_loc;
  let discountdata;
  try {
    const sequelize = await dbname(req.headers.compcode);
    if (req.headers.compcode.toLowerCase() != 'seva-24') {
      discountdata = await sequelize.query(
        `SELECT 
    Engn_No,
    Chas_No,
    DMS_Inv,
    INV_Date,
    Cust_Id,
    Ledg_Name,
    (SELECT TOP 1 misc_name 
     FROM misc_mst 
     WHERE misc_type=8  
       AND misc_code=Fin_Code 
       AND Export_Type < 3) AS Financer,
    (SELECT TOP 1 misc_name 
     FROM misc_mst 
     WHERE misc_type=18 
       AND misc_code=Pymt_Mode 
       AND Export_Type < 3) AS LoanType,
    (SELECT TOP 1 tpayout_rate 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Tentative,
    (SELECT TOP 1 ttotalfin 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS TentativePayout,
    (SELECT TOP 1 totalfin 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS ActualPayout,
    -- Calculating the difference between TentativePayout and ActualPayout
    (SELECT TOP 1 ttotalfin 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) - 
    (SELECT TOP 1 totalfin 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS PayoutDifference,
       (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
     (select top 1 Loan_account_number from newcar_financedetails where ICM_MST.Cust_Id=newcar_financedetails.cust_id)as Loan_account_number
FROM 
    ICM_MST
WHERE 
    INV_Date BETWEEN '${dateFrom}' AND '${dateto}' and Loc_Code in (${branch}) and Pymt_Mode in (5,9)`
      );
    } else {
      discountdata = await sequelize.query(
        `SELECT 
    Engn_No,
    Chas_No,
   (select top 1 (Sale_INV_Prefix+Invoice_no)as DMS_Inv1 from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as DMS_Inv,
   (select top 1 Invoice_Date from BHATIA_INVOICE where ICM_ID=ICM_MST.TRAN_ID)as INV_Date,
    Cust_Id,
    Ledg_Name,
    (SELECT TOP 1 misc_name 
     FROM misc_mst 
     WHERE misc_type=8  
       AND misc_code=Fin_Code 
       AND Export_Type < 3) AS Financer,
       (select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=Modl_Grp)as Model_Group,
    (SELECT TOP 1 misc_name 
     FROM misc_mst 
     WHERE misc_type=18 
       AND misc_code=Pymt_Mode 
       AND Export_Type < 3) AS LoanType,
    (SELECT TOP 1 tpayout_rate 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS Tentative,
    (SELECT TOP 1 ttotalfin 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS TentativePayout,
    (SELECT TOP 1 totalfin 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS ActualPayout,
    -- Calculating the difference between TentativePayout and ActualPayout
    (SELECT TOP 1 ttotalfin 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) - 
    (SELECT TOP 1 totalfin 
     FROM icm_ext 
     WHERE icm_ext.tran_id = ICM_MST.TRAN_ID) AS PayoutDifference,
     (select top 1 Loan_account_number from newcar_financedetails where ICM_MST.Cust_Id=newcar_financedetails.cust_id)as Loan_account_number
FROM 
    ICM_MST
WHERE 
    INV_Date BETWEEN '${dateFrom}' AND '${dateto}' and Loc_Code in (${branch}) and Pymt_Mode in (5,9)`
      );
    }

    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.payoutFLDPreport = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  const branch = req.body.multi_loc;
  let discountdata;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const discountdata = await sequelize.query(`select (select top 1 city from Godown_Mst where Godw_Code=im.Loc_Code)as [Dealer Location],
(select top 1 Misc_Name from Misc_mst where Misc_type=14  and Misc_Code=im.Modl_Grp)as Model,
concat(bi.SALE_INV_PREFIX,'',bi.Invoice_No)as Inv_Number,
bi.Invoice_Date as [Invoice Date],
im.Cust_Id as  [Customer Id],
im.Ledg_Name as[Ledger Name],
bi.Mobile_no as [Mobile no],
im.Chas_No as  [Chas No],
im.Engn_No as [Engine No],
(select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=im.fin_code)as  [Financier],
(select top 1 EMPFIRSTNAME +' '+ EMPLASTNAME As EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SRNO=im.ERP_DSE) AS [DSE],
(select top 1 EMPFIRSTNAME +' '+ EMPLASTNAME As EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SRNO=im.ERP_TL) AS [TL], 
(select top 1 godw_name from godown_mst where godw_code = (select top 1 br_location from godown_mst where godw_code=im.loc_code))as [Channel],
--channel
CASE 
  WHEN im.Pymt_mode IN (5, 1) THEN 'SEVA'
  ELSE (SELECT TOP 1 Misc_Name FROM misc_mst WHERE Misc_Type = 18 AND misc_mst.misc_code = im.Pymt_mode)
END AS [Source],
ie.findse as [FDSE],
--Bank,
--Bank Branch,
im.FLoan_Date as [Disb Date],
nf.loan_amount as [Disb Amt For Payout],
nf.mssf_id as [MSSF ID],
ie.invoice_num as [invoice_num],
ie.date as [Seva Payout Invoice date],
CASE WHEN ie.Payout_Received_Amount IS NULL THEN 'No' ELSE 'Yes' END AS [Payout Recd Yes / No],
ie.Payout_Received_Amount / 1.18 AS [Dealer Payout before GST],
(ie.Payout_Received_Amount - (ie.Payout_Received_Amount / 1.18)) AS [GST @ 18%(CGST+SGST)],
ie.Payout_Received_Amount as [Payout Including GST],
ie.Payout_TDS as [TDS],
(ie.Payout_Received_Amount - ie.Payout_TDS)as [Recd Amount],
ie.Receipt_No as [Receipt No.],
ie.Receipt_Date as [Receipt Date],
((ie.Payout_Received_Amount / 1.18 )/nf.loan_amount) as [Payout %],
ie.remark as [Remark]
from ICM_MST im
left join BHATIA_INVOICE bi on
bi.icm_id=im.TRAN_ID
left join icm_ext ie on
im.tran_id=ie.tran_id
left join newcar_financedetails nf on 
nf.icm_tran_id=im.TRAN_ID
where Bhatia_Inv_Date between '${dateFrom}' AND '${dateto}' and im.Loc_Code in (${branch})`)
    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



exports.EntryPrint = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const UTD = req.body.UTD;
    // const BranchData = await sequelize.query(`
    //       select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
    //       gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
    //       from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
    //       where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
    const BranchData = await sequelize.query(`
      select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,cm.Right_Head2,
      gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No,gm.city
      from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
      where  gm.Export_Type < 3 AND gm.Godw_code  in (select top 1 loc_code from bhatia_invoice where icm_id=${UTD})`);
    // const data = await sequelize.query(`select * from bhatia_invoice where icm_id=${UTD}`)
    const data = await sequelize.query(`select 
      GST_No,
      (select top 1 Ledg_PIN from ledg_mst where ledg_add6=(select top 1 Cust_Id from ICM_MST where bhatia_invoice.ICM_ID=ICM_MST.TRAN_ID))as Pincode,
      (select top 1 EMPFIRSTNAME +' '+ EMPLASTNAME As EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SRNO=(select top 1 ERP_DSE from ICM_MST where ICM_MST.TRAN_ID=bhatia_invoice.ICM_ID)) AS ERP_DSE_NAME, 
      (select top 1 EMPFIRSTNAME +' '+ EMPLASTNAME As EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.SRNO=(select top 1 ERP_TL from ICM_MST where ICM_MST.TRAN_ID=bhatia_invoice.ICM_ID)) AS ERP_TL_NAME,  
      (select top 1 misc_abbr from Misc_Mst where Misc_Type=3 and Misc_Name=bhatia_invoice.Place_of_Supply)as Statecode,
      (select top 1 Chas_No from ICM_MST where bhatia_invoice.ICM_ID=ICM_MST.TRAN_ID)as chas,
      (select top 1 Engn_No from ICM_MST where bhatia_invoice.ICM_ID=ICM_MST.TRAN_ID)as Engn,* from bhatia_invoice where icm_id=${UTD}`)

    const bankDetails = await sequelize.query(`select Bank_Name,Bank_Branch,Bank_Ac,Bank_IFSC,TRADE_NAME from Godown_Mst where Godw_Code in (select top 1 loc_code from bhatia_invoice where icm_id=${UTD}) and Export_Type<3`)

    const qr = await sequelize.query(`
select B2CQR from B2C_QR where tran_id=${UTD}`)
    let imageSrc;
    if (qr.length > 0) {
      const buffer = qr[0][0].B2CQR; // Get the buffer
      const base64Image = buffer.toString('base64'); // Convert buffer to base64
      imageSrc = `data:image/jpeg;base64,${base64Image}`; // Create data URL
    }
    console.log(qr[0][0], "qr[0][0]")
    res.send({
      success: true,
      BranchData: BranchData[0][0],
      PrintData: data[0][0],
      bankDetails: bankDetails[0][0],
      qr: imageSrc
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "An error occurred while Fetching Data.",
      err,
    });
  } finally {
    await sequelize.close();
  }
};
exports.changefintype = async function (req, res) {

  const fintype = req.body.fintype
  const data = req.body.data
  const tran_id = data.map((item) => item.id)
  const sequelize = await dbname(req.headers.compcode);
  try {
    await sequelize.query(`update icm_mst set pymt_mode=${fintype} where tran_id in (${tran_id})`)
    res.status(200).send("done")
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "An error occurred while Fetching Data.",
      err,
    });
  } finally {
    await sequelize.close();
  }
};

exports.ViewFinancers = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const t = await sequelize.transaction();
    const result = await sequelize.query(
      `select misc_code, Misc_Name,Misc_Mob,
      misc_abbr from  Misc_Mst where  Misc_Type = '8'`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send({ result: result[0] });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.SaveFinancers = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const Misc_Name = req.body.Misc_Name;
  const Misc_Abbr = req.body.Misc_Abbr
  try {
    const t = await sequelize.transaction();
    const result = await sequelize.query(
      `Insert into Misc_Mst(misc_code,Misc_Name,misc_type,Export_Type,ServerId,Misc_Abbr,Loc_Code)
      values ((SELECT COALESCE(MAX(misc_code + 1), 1) AS next_misc_code FROM Misc_Mst WHERE Misc_Type = 8),
      '${Misc_Name}',8,1,1,'${Misc_Abbr}',1)`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send({ result: result[0][0] });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.UpdateFinancers = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const Misc_Name = req.body.Misc_Name;
  const Misc_Abbr = req.body.Misc_Abbr;
  const misc_code = req.body.misc_code;
  try {
    const t = await sequelize.transaction();
    const result = await sequelize.query(
      `update Misc_Mst set Misc_Name = '${Misc_Name}', Misc_Abbr = '${Misc_Abbr}' where Misc_Type = '8' and export_type <3 and misc_code ='${misc_code}'`,
      { transaction: t }
    );
    await t.commit();
    res.status(200).send({ result: result[0][0] });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};


exports.EntryPrint1 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const multi_loc = req.body.multi_loc;
    // const BranchData = await sequelize.query(`
    //       select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
    //       gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
    //       from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
    //       where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
    const BranchData = await sequelize.query(`
      select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,cm.Right_Head2,
      gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No,gm.city
      from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
      where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
    // const data = await sequelize.query(`select * from bhatia_invoice where icm_id=${UTD}`)
    // const bankDetails = await sequelize.query(`select Bank_Name,Bank_Branch,Bank_Ac,Bank_IFSC,TRADE_NAME from Godown_Mst where Godw_Code in (select top 1 loc_code from bhatia_invoice where icm_id=${UTD}) and Export_Type<3`)
    res.send({
      success: true,
      BranchData: BranchData[0][0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "An error occurred while Fetching Data.",
      err,
    });
  } finally {
    await sequelize.close();
  }
};


exports.payoutfinancersegmenteport = async function (req, res) {
  console.log(req.body, "ndnnd")
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  const Br_Segment = req.body.Br_Segment;
  try {
    const sequelize = await dbname(req.headers.compcode);

    const data = await sequelize.query(`
      SELECT 
    (SELECT TOP 1 Misc_name 
     FROM Misc_Mst 
     WHERE misc_type=303 AND export_type < 3 AND misc_code = g.Br_Location) AS loc_code,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 4 THEN 1 END) AS April,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 5 THEN 1 END) AS May,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 6 THEN 1 END) AS June,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 7 THEN 1 END) AS July,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 8 THEN 1 END) AS August,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 9 THEN 1 END) AS September,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 10 THEN 1 END) AS October,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 11 THEN 1 END) AS November,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 12 THEN 1 END) AS December,
	COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 1 THEN 1 END) AS January,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 2 THEN 1 END) AS February,
    COUNT(CASE WHEN MONTH(ICM_MST.Bhatia_Inv_Date) = 3 THEN 1 END) AS March,
    COUNT(*) AS Total 
FROM ICM_MST
JOIN godown_mst g ON g.godw_code = ICM_MST.loc_code AND g.Export_Type < 3
WHERE g.Br_Segment in (${Br_Segment}) and ICM_MST.EXPORT_TYPE<5
AND Bhatia_Inv_Date BETWEEN '${dateFrom}' AND '${dateto}'
GROUP BY g.Br_Location;`)
    res.status(200).send(data[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



exports.payout2 = async function (req, res) {
  try {
    const user = req.body.user
    const tran_id = req.body.Tran_id;
    const export_type = req.body.export_type;
    // const date = req.body.date;
    const sequelize = await dbname(req.headers.compcode);
    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update icm_ext set export_type='${export_type}' where tran_id ='${tran_id[i]}' AND export_type = 1`
      );
      await sequelize.query(
        `update icm_mst  set FRecd_Amt=null where tran_id ='${tran_id[i]}'`
      );
      await sequelize.query(`INSERT INTO icm_ext (
        export_type, tran_id, fdo_date, d_perc, fpfcharge, gstAmount1, gstinc, finreceivedate, d_amt, entertime,
        createdby, tPayout_Rate, ttotalfin, executive_payout, vechical_invoice, insurance_policy, Taxable_Amt,
        mssf, mssf_reason, Rto_Copy, Emailto, Emaildate, findse, loc_code, fin_branch,payout_type
      )
      SELECT 
        1 AS export_type, tran_id, fdo_date, d_perc, fpfcharge, gstAmount1, gstinc, finreceivedate, d_amt, entertime,
        createdby, tPayout_Rate, ttotalfin, executive_payout, vechical_invoice, insurance_policy, Taxable_Amt,
        mssf, mssf_reason, Rto_Copy, Emailto, Emaildate, findse, loc_code, fin_branch, 'payout_2' as payout_type
      FROM 
        icm_ext 
      WHERE 
        tran_id =${tran_id[i]} AND export_type = '${export_type}'`)
    }
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
exports.payout3 = async function (req, res) {
  try {
    const user = req.body.user
    const tran_id = req.body.Tran_id;
    const export_type = req.body.export_type;
    // const date = req.body.date;
    const sequelize = await dbname(req.headers.compcode);
    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update icm_ext set export_type='${export_type}' where tran_id ='${tran_id[i]}' AND export_type = 1`
      );
      await sequelize.query(
        `update icm_mst  set FRecd_Amt=null where tran_id ='${tran_id[i]}'`
      );
      await sequelize.query(`INSERT INTO icm_ext (
        export_type, tran_id, fdo_date, d_perc, fpfcharge, gstAmount1, gstinc, finreceivedate, d_amt, entertime,
        createdby, tPayout_Rate, ttotalfin, executive_payout, vechical_invoice, insurance_policy, Taxable_Amt,
        mssf, mssf_reason, Rto_Copy, Emailto, Emaildate, findse, loc_code, fin_branch,payout_type
      )
      SELECT 
        1 AS export_type, tran_id, fdo_date, d_perc, fpfcharge, gstAmount1, gstinc, finreceivedate, d_amt, entertime,
        createdby, tPayout_Rate, ttotalfin, executive_payout, vechical_invoice, insurance_policy, Taxable_Amt,
        mssf, mssf_reason, Rto_Copy, Emailto, Emaildate, findse, loc_code, fin_branch, 'payout_3' as payout_type
      FROM 
        icm_ext 
      WHERE 
        tran_id =${tran_id[i]} AND export_type = '${export_type}'`)
    }
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};

exports.downloadprintout = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const PreInvoiceNum = req.body.PreInvoiceNum;

    const result = await sequelize.query(`select tran_id from (
    select 
    otherpayout,Taxable,gst,apayout,remark,Description,Replace(godown_mst.NewCar_Rcpt, '-S', '') + '/'+ preinvoice_num as Invoice,loc_code,tran_id from icm_ext
    left join godown_mst on Godw_Code=icm_ext.loc_code and godown_mst.Export_Type<3)as ab
    where Invoice='${PreInvoiceNum}'`)

    const invoice = await sequelize.query(`select tran_id,loc_code,otherpayout,Taxable,gst,apayout,Remark,Description,FORMAT(CAST(preinvoice_date AS DATE), 'dd-MM-yyyy') as inv_date from icm_ext where tran_id='${result[0][0].tran_id}'`)

    const BranchData = await sequelize.query(`
    select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,cm.Right_Head2,
    gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No,gm.city
    from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
    where  gm.Export_Type < 3 AND gm.Godw_code  in (${invoice[0][0].loc_code})`)


    const selectedrowdata = await sequelize.query(`
      select Ledg_Name,Cust_Id,Inv_Number as DMS_Inv,Bhatia_Inv_Date as INV_Date,Chas_No,
      (select top 1 Misc_Name from misc_mst where Misc_Type=8 and misc_mst.misc_code=icm_mst.ffin_code)As Financer_name,
       (select top 1 totalfin from icm_ext where icm_ext.tran_id=ICM_MST.TRAN_ID and icm_ext.export_type=1)as totalfin 
       from icm_mst where tran_id in (select tran_id from (
    select 
    otherpayout,Taxable,gst,apayout,remark,Description,Replace(godown_mst.NewCar_Rcpt, '-S', '') + '/'+ preinvoice_num as Invoice,loc_code,tran_id from icm_ext
    left join godown_mst on Godw_Code=icm_ext.loc_code and godown_mst.Export_Type<3)as ab
    where Invoice='${PreInvoiceNum}')
      `)
    const formattedData = selectedrowdata[0].map(row => ({
      rowData: row
    }));
    res.status(200).send({ invno: PreInvoiceNum, invoice: invoice[0][0], BranchData: BranchData[0][0], selectedrowdata: formattedData });
  } catch (err) {
    console.log(err);
  }
};