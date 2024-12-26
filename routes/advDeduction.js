const { dbname } = require("../utils/dbconfig");

exports.LoanApprover1 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(
      `select Misc_Name as label , Misc_Code as value  from Misc_mst where  misc_type=85 and  export_type<3`
    );
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};
exports.LoanApprover2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const branch = await sequelize.query(
      `select Misc_Name as name , Misc_Code as value  from Misc_mst where  misc_type=85 and  export_type<3 `
    );

    res.render("LoanApprover2", {
      branch: branch[0],
      location: req.session.multi_loc,
    });
  } catch (e) {
    console.log(e);
  }
};
exports.LoanApprover3 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const branch = await sequelize.query(
      `select Misc_Name as name , Misc_Code as value  from Misc_mst where  misc_type=85 and  export_type<3 `
    );

    res.render("LoanApprover3", {
      branch: branch[0],
      location: req.session.multi_loc,
    });
  } catch (e) {
    console.log(e);
  }
};
exports.LoanAccountview = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const branch = await sequelize.query(
      `select Misc_Name as name , Misc_Code as value  from Misc_mst where  misc_type=85 and  export_type<3 `
    );

    res.render("LoanAccountview", {
      branch: branch[0],
      location: req.session.multi_loc,
    });
  } catch (e) {
    console.log(e);
  }
};
exports.LoanRequest = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const gross_salary =
      await sequelize.query(`select top 1 Gross_Salary from SALARYSTRUCTURE where emp_code = (SELECT top 1 EMPCODE from user_tbl
      WHERE User_Code = ${req.query.user_code}
      AND
      Module_Code = 10 AND Export_Type <3) and Export_Type <3`);

    const allreq =
      await sequelize.query(`SELECT UTD,REQUEST_DATE,REQ_AMOUNT,SANC_AMOUNT,
    CASE 
        WHEN APPR_1_STATUS = 0 THEN 'Pending at Approver 1'
        WHEN APPR_1_STATUS = 2 THEN 'Rejected by Approver 1'
        WHEN APPR_2_STATUS = 0 THEN 'Pending at Approver 2'
        WHEN APPR_2_STATUS = 2 THEN 'Rejected by Approver 2'
        WHEN APPR_3_STATUS = 0 THEN 'Pending at Approver 3'
        WHEN APPR_3_STATUS = 2 THEN 'Rejected by Approver 3'
        WHEN FINAL_APPRV = 1 THEN 'Approved'
    END AS Status
FROM Advance_Mst
WHERE EMPCODE = (SELECT top 1 EMPCODE from user_tbl
  WHERE User_Code = ${req.query.user_code}
  AND
  Module_Code = 10 AND Export_Type <3) order by REQUEST_DATE desc;`);

    const LASTWOR_DATE =
      await sequelize.query(`select LASTWOR_DATE from EMPLOYEEMASTER where empcode= (SELECT top 1 EMPCODE from user_tbl
    WHERE User_Code = ${req.query.user_code}
    AND
    Module_Code = 10 AND Export_Type <3);`);

    const result = await sequelize.query(`
    SELECT EMPCODE from user_tbl
    WHERE User_Code = ${req.query.user_code}
    AND
    Module_Code = 10 AND Export_Type = 1`);
    const result1 = await sequelize.query(
      `Select * from EMPLOYEEMASTER where EMPCODE = '${result[0][0].EMPCODE}'`
    );
    const rep1 = await sequelize.query(
      `Select CONCAT(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS Name from EMPLOYEEMASTER where EMPCODE = '${result1[0][0].Reporting_1}'`
    );
    const rep2 = await sequelize.query(
      `Select CONCAT(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS Name from EMPLOYEEMASTER where EMPCODE = '${result1[0][0].Reporting_2}'`
    );
    const rep3 = await sequelize.query(
      `Select CONCAT(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS Name from EMPLOYEEMASTER where EMPCODE = '${result1[0][0].Reporting_3}'`
    );

    res.status(200).send({
      allreq: allreq[0],
      gross_salary: gross_salary[0][0] ? gross_salary[0][0].Gross_Salary : null,
      data: LASTWOR_DATE[0],
      rep1: rep1[0][0],
      rep2: rep2[0][0],
      rep3: rep3[0][0],
    });
  } catch (e) {
    console.log(e);
  }
};

exports.LoanTable = async function (req, res) {
  try {
    res.render("LoanTable");
  } catch (e) {
    console.log(e);
  }
};

exports.findUser = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(`
        SELECT EMPCODE from user_tbl
        WHERE User_Code = ${req.session.user_code}
        AND
        Module_Code = 10 AND Export_Type = 1`);
    const result1 = await sequelize.query(
      `Select * from EMPLOYEEMASTER where EMPCODE = '${result[0][0].EMPCODE}'`
    );
    const rep1 = await sequelize.query(
      `Select CONCAT(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS Name from EMPLOYEEMASTER where EMPCODE = '${result1[0][0].Reporting_1}'`
    );
    const rep2 = await sequelize.query(
      `Select CONCAT(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS Name from EMPLOYEEMASTER where EMPCODE = '${result1[0][0].Reporting_2}'`
    );
    const rep3 = await sequelize.query(
      `Select CONCAT(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS Name from EMPLOYEEMASTER where EMPCODE = '${result1[0][0].Reporting_3}'`
    );
    const maxutd = await sequelize.query(
      `SELECT ISNULL(MAX(UTD), 0) + 1 AS billno FROM Advance_Mst;`
    );
    res.send({
      rep1: rep1[0][0],
      rep2: rep2[0][0],
      rep3: rep3[0][0],
      maxutd: maxutd[0][0],
    });
  } catch (err) {
    console.log(err);
  }
};

exports.insertData = async function (req, res) {
  try {
    const advanceMst = req.body.AdvanceMst;
    const advanceDtl = req.body.AdvanceDtl;
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(`
    SELECT EMPCODE from user_tbl
    WHERE User_Code = ${advanceMst.user_code}
    AND
    Module_Code = 10 AND Export_Type = 1`);
    const result1 = await sequelize.query(
      `Select EMPCODE,SRNO,location,Reporting_1,Reporting_2,Reporting_3 from EMPLOYEEMASTER where EMPCODE = '${result[0][0].EMPCODE}' and export_type<3`
    );
    const EMPCODE = result[0][0].EMPCODE;
    const SRNO = result1[0][0].SRNO;
    const TRAN_TYPE = advanceMst.TRAN_TYPE;
    const REQ_AMOUNT = advanceMst.REQ_AMOUNT;
    const TENURE_MONTH = advanceMst.TENURE_MONTH;
    const REPAYMENT_START_DATE = advanceMst.REPAYMENT_START_DATE;
    const Reason = advanceMst.reason;
    const LOC_CODE = result1[0][0].location;
    const APPR_1_CODE = result1[0][0].Reporting_1;
    const APPR_2_CODE = result1[0][0].Reporting_2;
    const APPR_3_CODE = result1[0][0].Reporting_3;

    await sequelize.query(`
    INSERT into Advance_Mst 
    (EMPCODE,SRNO,TRAN_TYPE,REQ_AMOUNT,TENURE_MONTH,
    REPAYMENT_START_DATE, APPR_1_CODE,
    APPR_2_CODE, APPR_3_CODE,
    LOC_CODE, CREATED_BY,Appr_1_status,Reason)
    values 
    ('${EMPCODE}',${SRNO},'${TRAN_TYPE}',${REQ_AMOUNT},${TENURE_MONTH},
    '${REPAYMENT_START_DATE}','${APPR_1_CODE}',
    '${APPR_2_CODE}','${APPR_3_CODE}',
    ${LOC_CODE},'${advanceMst.user_code}',0,'${Reason}')`);

    const AdvDtl_Tran_id = await sequelize.query(
      `SELECT top 1 Utd 
      FROM advance_mst 
      WHERE empcode = '${EMPCODE}' 
        AND REQ_AMOUNT='${REQ_AMOUNT}'
        AND TRAN_TYPE = '${TRAN_TYPE}' order by Utd desc
      `
    );

    for (let i = 0; i < advanceDtl.length; i++) {
      console.log(`insert into advance_dtl (Tran_id,ino,inst_date,inst_amt,Rem_Bal,PYMT_Recvd,created_by)
      values ('${AdvDtl_Tran_id[0][0].Utd}',${advanceDtl[i].INO},'${advanceDtl[i].INST_DATE}','${advanceDtl[i].INST_AMT}','${advanceDtl[i].REM_BAL}','${advanceDtl[0].PYMT_RECVD}','${advanceMst.user_code}')`);
      await sequelize.query(`insert into advance_dtl (Tran_id,ino,inst_date,inst_amt,Rem_Bal,PYMT_Recvd,created_by)
        values ('${AdvDtl_Tran_id[0][0].Utd}',${advanceDtl[i].INO},'${advanceDtl[i].INST_DATE}','${advanceDtl[i].INST_AMT}','${advanceDtl[i].REM_BAL}','${advanceDtl[0].PYMT_RECVD}','${advanceMst.user_code}')`);
    }

    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
exports.viewapproal1dataforLoan = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const query = `SELECT 
    (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS Name 
     FROM EMPLOYEEMASTER 
     WHERE EMPCODE = am.EMPCODE AND export_type < 3) AS EmployeeName,
    (SELECT TOP 1 Misc_name 
     FROM misc_mst 
     WHERE misc_type = 85 AND misc_code = am.loc_code) AS BranchName,
    am.*,
    B.group_code,
    B.Opening,
    B.Debit,
    B.Credit,
    B.Closing
FROM 
    advance_mst am
LEFT JOIN (
    SELECT 
        ledg_code AS group_code,
        emp_code,
        Sum(Opening) AS Opening,
        Sum(Debit) AS Debit,
        Sum(credit) AS Credit,
        Sum(Opening) + Sum(Debit) - Sum(credit) AS Closing
    FROM (
        SELECT
            0.00 AS Opening,
            Sum(iif(Amt_Drcr = 1, Post_Amt, 0)) AS Debit,
            Sum(iif(Amt_Drcr = 2, Post_Amt, 0)) AS Credit,
            lm.ledg_code,
            lm.emp_code
        FROM 
            acnt_post ap
        JOIN 
            ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
        JOIN
            EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
        WHERE  
            ap.Acnt_Date BETWEEN '${req.body.dateFrom}' AND '${req.body.dateto}'
            AND ap.Export_Type < 5 
            AND ap.Ledg_Ac <> 10 
            AND ap.Acnt_Type NOT IN (16, 14)
            AND em.export_type < 3
        GROUP BY
			lm.ledg_code,
            lm.emp_code
        UNION ALL
        SELECT
            Sum(iif(Amt_Drcr = 1, Post_Amt, Post_Amt * -1)) AS Opening,
            0.00 AS Debit,
            0.00 AS Credit,
            lm.ledg_code,
            lm.emp_code
        FROM 
            acnt_post ap
        JOIN 
            ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
        JOIN
            EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
        WHERE  
            ap.Acnt_Date < '${req.body.dateFrom}'
            AND ap.Export_Type < 5 
            AND ap.Ledg_Ac <> 10 
            AND ap.Acnt_Type NOT IN (16, 14)
            AND em.export_type < 3
        GROUP BY
            lm.emp_code,
			lm.ledg_code
    ) AS B  
    GROUP BY
        B.emp_code,B.ledg_code
) AS B ON B.emp_code = am.EMPCODE
WHERE 
    am.Request_Date BETWEEN '${req.body.dateFrom}' AND '${req.body.dateto}'
    AND am.appr_1_status = '${req.body.status}' 
    AND am.appr_1_code = (select top 1 empcode from user_tbl where user_code='${req.body.user_code}'
    and module_code=10 and export_type<3);`;
    const result = await sequelize.query(query);

    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};
exports.viewapproal2dataforLoan = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const query = `SELECT 
    (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS Name 
     FROM EMPLOYEEMASTER 
     WHERE EMPCODE = am.EMPCODE AND export_type < 3) AS EmployeeName,
    (SELECT TOP 1 Misc_name 
     FROM misc_mst 
     WHERE misc_type = 85 AND misc_code = am.loc_code) AS BranchName,
    am.*,
    B.group_code,
    B.Opening,
    B.Debit,
    B.Credit,
    B.Closing
FROM 
    advance_mst am
LEFT JOIN (
    SELECT 
        ledg_code AS group_code,
        emp_code,
        Sum(Opening) AS Opening,
        Sum(Debit) AS Debit,
        Sum(credit) AS Credit,
        Sum(Opening) + Sum(Debit) - Sum(credit) AS Closing
    FROM (
        SELECT
            0.00 AS Opening,
            Sum(iif(Amt_Drcr = 1, Post_Amt, 0)) AS Debit,
            Sum(iif(Amt_Drcr = 2, Post_Amt, 0)) AS Credit,
            lm.ledg_code,
            lm.emp_code
        FROM 
            acnt_post ap
        JOIN 
            ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
        JOIN
            EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
        WHERE  
            ap.Acnt_Date BETWEEN '${req.body.dateFrom}' AND '${req.body.dateto}'
            AND ap.Export_Type < 5 
            AND ap.Ledg_Ac <> 10 
            AND ap.Acnt_Type NOT IN (16, 14)
            AND em.export_type < 3
        GROUP BY
			lm.ledg_code,
            lm.emp_code
        UNION ALL
        SELECT
            Sum(iif(Amt_Drcr = 1, Post_Amt, Post_Amt * -1)) AS Opening,
            0.00 AS Debit,
            0.00 AS Credit,
            lm.ledg_code,
            lm.emp_code
        FROM 
            acnt_post ap
        JOIN 
            ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
        JOIN
            EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
        WHERE  
            ap.Acnt_Date < '${req.body.dateFrom}'
            AND ap.Export_Type < 5 
            AND ap.Ledg_Ac <> 10 
            AND ap.Acnt_Type NOT IN (16, 14)
            AND em.export_type < 3
        GROUP BY
            lm.emp_code,
			lm.ledg_code
    ) AS B  
    GROUP BY
        B.emp_code,B.ledg_code
) AS B ON B.emp_code = am.EMPCODE
WHERE 
    am.Request_Date BETWEEN '${req.body.dateFrom}' AND '${req.body.dateto}'
    AND am.appr_2_status = '${req.body.status}' 
    AND am.appr_2_code = (select top 1 empcode from user_tbl where user_code='${req.body.user_code}'
    and module_code=10 and export_type<3);`;

    // const result =
    //   await sequelize.query(`select (select top 1  CONCAT(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS Name from EMPLOYEEMASTER where EMPCODE =advance_mst.EMPCODE and export_type<3)as EmployeeName
    //    , (select top 1 Misc_name from misc_mst where misc_type=85 and misc_code=advance_mst.loc_code)as BranchName,* from advance_mst where Request_Date between '${
    //      req.body.dateFrom
    //    }' and '${req.body.dateto}'
    //   and loc_code in (${JSON.parse(req.body.loc_code)}) and appr_2_status='${
    //     req.body.status
    //   }' and appr_2_code=(select top 1 empcode from user_tbl where user_name='${
    //     req.session.username
    //   }' and module_code=10 and export_type<3)`);
    const result = await sequelize.query(query);

    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};
exports.viewapproal3dataforLoan = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const query = `SELECT 
    (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS Name 
     FROM EMPLOYEEMASTER 
     WHERE EMPCODE = am.EMPCODE AND export_type < 3) AS EmployeeName,
    (SELECT TOP 1 Misc_name 
     FROM misc_mst 
     WHERE misc_type = 85 AND misc_code = am.loc_code) AS BranchName,
    am.*,
    B.group_code,
    B.Opening,
    B.Debit,
    B.Credit,
    B.Closing
FROM 
    advance_mst am
LEFT JOIN (
    SELECT 
        ledg_code AS group_code,
        emp_code,
        Sum(Opening) AS Opening,
        Sum(Debit) AS Debit,
        Sum(credit) AS Credit,
        Sum(Opening) + Sum(Debit) - Sum(credit) AS Closing
    FROM (
        SELECT
            0.00 AS Opening,
            Sum(iif(Amt_Drcr = 1, Post_Amt, 0)) AS Debit,
            Sum(iif(Amt_Drcr = 2, Post_Amt, 0)) AS Credit,
            lm.ledg_code,
            lm.emp_code
        FROM 
            acnt_post ap
        JOIN 
            ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
        JOIN
            EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
        WHERE  
            ap.Acnt_Date BETWEEN '${req.body.dateFrom}' AND '${req.body.dateto}'
            AND ap.Export_Type < 5 
            AND ap.Ledg_Ac <> 10 
            AND ap.Acnt_Type NOT IN (16, 14)
            AND em.export_type < 3
        GROUP BY
			lm.ledg_code,
            lm.emp_code
        UNION ALL
        SELECT
            Sum(iif(Amt_Drcr = 1, Post_Amt, Post_Amt * -1)) AS Opening,
            0.00 AS Debit,
            0.00 AS Credit,
            lm.ledg_code,
            lm.emp_code
        FROM 
            acnt_post ap
        JOIN 
            ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
        JOIN
            EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
        WHERE  
            ap.Acnt_Date < '${req.body.dateFrom}'
            AND ap.Export_Type < 5 
            AND ap.Ledg_Ac <> 10 
            AND ap.Acnt_Type NOT IN (16, 14)
            AND em.export_type < 3
        GROUP BY
            lm.emp_code,
			lm.ledg_code
    ) AS B  
    GROUP BY
        B.emp_code,B.ledg_code
) AS B ON B.emp_code = am.EMPCODE
WHERE 
    am.Request_Date BETWEEN '${req.body.dateFrom}' AND '${req.body.dateto}' 
    AND am.appr_3_status = '${req.body.status}' 
    AND am.appr_3_code = (select top 1 empcode from user_tbl where user_code='${req.body.user_code}'
    and module_code=10 and export_type<3);`;

    // const result =
    //   await sequelize.query(`select (select top 1  CONCAT(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS Name from EMPLOYEEMASTER where EMPCODE =advance_mst.EMPCODE and export_type<3)as EmployeeName
    //    , (select top 1 Misc_name from misc_mst where misc_type=85 and misc_code=advance_mst.loc_code)as BranchName,* from advance_mst where Request_Date between '${
    //      req.body.dateFrom
    //    }' and '${req.body.dateto}'
    //   and loc_code in (${JSON.parse(req.body.loc_code)}) and appr_3_status='${
    //     req.body.status
    //   }' and appr_3_code=(select top 1 empcode from user_tbl where user_name='${
    //     req.session.username
    //   }' and module_code=10 and export_type<3)`);

    const result = await sequelize.query(query);

    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};
exports.findadvancedtldata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const result = await sequelize.query(
      `select * from Advance_Dtl where tran_id='${req.body.UTD}'`
    );
    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};
exports.LoanAccountviewdata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    const query = `SELECT 
    (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS Name 
     FROM EMPLOYEEMASTER 
     WHERE EMPCODE = am.EMPCODE AND export_type < 3) AS EmployeeName,
     (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS Name 
     FROM EMPLOYEEMASTER 
     WHERE EMPCODE = am.Appr_1_Code AND export_type < 3) AS Approver1,
     (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS Name 
     FROM EMPLOYEEMASTER 
     WHERE EMPCODE = am.Appr_2_Code AND export_type < 3) AS Approver2,
     (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS Name 
     FROM EMPLOYEEMASTER 
     WHERE EMPCODE = am.Appr_3_Code AND export_type < 3) AS Approver3,
    (SELECT TOP 1 Misc_name 
     FROM misc_mst 
     WHERE misc_type = 85 AND misc_code = am.loc_code) AS BranchName,
    am.*,
    B.group_code,
    B.Opening,
    B.Debit,
    B.Credit,
    B.Closing
FROM 
    advance_mst am
LEFT JOIN (
    SELECT 
        ledg_code AS group_code,
        emp_code,
        Sum(Opening) AS Opening,
        Sum(Debit) AS Debit,
        Sum(credit) AS Credit,
        Sum(Opening) + Sum(Debit) - Sum(credit) AS Closing
    FROM (
        SELECT
            0.00 AS Opening,
            Sum(iif(Amt_Drcr = 1, Post_Amt, 0)) AS Debit,
            Sum(iif(Amt_Drcr = 2, Post_Amt, 0)) AS Credit,
            lm.ledg_code,
            lm.emp_code
        FROM 
            acnt_post ap
        JOIN 
            ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
        JOIN
            EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
        WHERE  
            ap.Acnt_Date BETWEEN '${req.body.dateFrom}' AND '${req.body.dateto}'
            AND ap.Export_Type < 5 
            AND ap.Ledg_Ac <> 10 
            AND ap.Acnt_Type NOT IN (16, 14)
            AND em.export_type < 3
        GROUP BY
			lm.ledg_code,
            lm.emp_code
        UNION ALL
        SELECT
            Sum(iif(Amt_Drcr = 1, Post_Amt, Post_Amt * -1)) AS Opening,
            0.00 AS Debit,
            0.00 AS Credit,
            lm.ledg_code,
            lm.emp_code
        FROM 
            acnt_post ap
        JOIN 
            ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
        JOIN
            EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
        WHERE  
            ap.Acnt_Date < '${req.body.dateFrom}'
            AND ap.Export_Type < 5 
            AND ap.Ledg_Ac <> 10 
            AND ap.Acnt_Type NOT IN (16, 14)
            AND em.export_type < 3
        GROUP BY
            lm.emp_code,
			lm.ledg_code
    ) AS B  
    GROUP BY
        B.emp_code,B.ledg_code
) AS B ON B.emp_code = am.EMPCODE
WHERE 
    am.Request_Date BETWEEN '${req.body.dateFrom}' AND '${req.body.dateto}'
    AND am.loc_code IN (
      select distinct(misc_hod) from Misc_Mst  where  Misc_Code in (${req.body.loc_code}) and Misc_Type=85
	and  Export_Type<3
      ) 
    AND  am.final_apprv=1`;

    const result = await sequelize.query(query);

    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};

exports.LoanTableviewdata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const query = `SELECT 
    ledg_code AS group_code,
    emp_code,
   (select top 1 concat(title,'',empfirstname,'',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= emp_code and export_type < 3) as empname,
   (select top 1 Misc_Name from Misc_Mst where Misc_Code=(select top 1 location from EMPLOYEEMASTER where empcode= emp_code and export_type < 3) and Misc_Type=85) as BranchName,
   (select top 1 Gross_Salary from SALARYSTRUCTURE where Emp_Code=B.emp_code and export_type < 3) as Gross_Salary,
   (select top 1 Basic from SALARYSTRUCTURE where Emp_Code=B.emp_code and export_type < 3) as Basic,


    Sum(Opening) AS Opening,
    Sum(Debit) AS Debit,
    Sum(credit) AS Credit,
    Sum(Opening) + Sum(Debit) - Sum(credit) AS Closing
FROM (
    SELECT
        0.00 AS Opening,
        Sum(iif(Amt_Drcr = 1, Post_Amt, 0)) AS Debit,
        Sum(iif(Amt_Drcr = 2, Post_Amt, 0)) AS Credit,
        lm.ledg_code,
        lm.emp_code
    FROM 
        acnt_post ap
    JOIN 
        ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
    JOIN
        EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
    WHERE  
        ap.Acnt_Date BETWEEN '${req.body.dateFrom}' AND '${req.body.dateto}'
        AND ap.Export_Type < 5 
        AND ap.Ledg_Ac <> 10 
        AND ap.Acnt_Type NOT IN (16, 14)
        AND em.export_type < 3
    GROUP BY
  lm.ledg_code,
        lm.emp_code
    UNION ALL
    SELECT
        Sum(iif(Amt_Drcr = 1, Post_Amt, Post_Amt * -1)) AS Opening,
        0.00 AS Debit,
        0.00 AS Credit,
        lm.ledg_code,
        lm.emp_code
    FROM 
        acnt_post ap
    JOIN 
        ledg_mst lm ON ap.Ledg_Ac = lm.ledg_code
    JOIN
        EMPLOYEEMASTER em ON em.EMPCODE = lm.emp_code
    WHERE  
        ap.Acnt_Date <  '${req.body.dateFrom}'
        AND ap.Export_Type < 5 
        AND ap.Ledg_Ac <> 10 
        AND ap.Acnt_Type NOT IN (16, 14)
        AND em.export_type < 3
    GROUP BY
        lm.emp_code,
  lm.ledg_code
) AS B  
GROUP BY
    B.emp_code,B.ledg_code`;
    const result = await sequelize.query(query);

    res.status(200).send(result[0]);
  } catch (err) {
    console.log(err);
  }
};

// function calculateEMI(months, amount, repaymentStartDate, Created_by) {
//   const emi = amount / months;
//   let remainingBalance = amount;
//   let currentDate = new Date(repaymentStartDate);
//   const installmentDetails = [];

//   for (let i = 1; i <= months; i++) {
//     remainingBalance -= emi;
//     const PYMT_RECVD = remainingBalance > 0 ? "Pending" : "Completed";
//     installmentDetails.push({
//       INO: i,
//       INST_DATE: currentDate.toLocaleDateString(),
//       INST_AMT: emi.toFixed(2),
//       REM_BAL: Math.max(remainingBalance, 0).toFixed(2),
//       PYMT_RECVD: 0,
//       PYMT_REC_DATE: null,
//       CREATED_BY: Created_by,
//     });
//     currentDate.setMonth(currentDate.getMonth() + 1);
//   }
//   return installmentDetails;
// }

function calculateDates(year, monthStart) {
  const fiscalYearstart = parseInt(monthStart) >= 1 ? year : year + 1;
  const fiscalYearend = parseInt(monthStart) >= 1 ? year : year + 1;
  const startDate = new Date(fiscalYearstart, parseInt(monthStart) - 1, 2);
  const endDate = new Date(fiscalYearend, parseInt(monthStart), 1);
  return endDate.toISOString().slice(0, 10);
}
function calculateEMI(months, amount, repaymentStartDate, Created_by) {
  const emi = amount / months;
  let remainingBalance = amount;
  console.log(repaymentStartDate);
  let currentDate = new Date(repaymentStartDate);
  console.log(repaymentStartDate.slice(5, 7), "repaymentStartDate");
  let month = repaymentStartDate.slice(5, 7); // Extracting characters from index 5 up to index 7 (exclusive)
  let year = repaymentStartDate.slice(0, 4);
  const installmentDetails = [];
  for (let i = 1; i <= months; i++) {
    remainingBalance -= emi;
    // const currentMonth = currentDate.getMonth();
    // const currentYear = currentDate.getFullYear();
    // const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Get the last day of the current month
    const lastDayOfMonth1 = calculateDates(year, month);
    if (month == 12) {
      month = 1;
      year++;
    } else {
      month++;
    }

    const PYMT_RECVD = remainingBalance > 0 ? "Pending" : "Completed";
    installmentDetails.push({
      INO: i,
      INST_DATE: new Date(lastDayOfMonth1).toISOString(), // Set the date to the last day of the current month
      INST_DATE1: new Date(lastDayOfMonth1).toLocaleDateString(),
      INST_AMT: emi.toFixed(2),
      REM_BAL: Math.max(remainingBalance, 0).toFixed(2),
      PYMT_RECVD: 0,
      PYMT_REC_DATE: null,
      CREATED_BY: Created_by,
    });
    // currentDate.setMonth(currentDate.getMonth() + 1);
    // currentDate.setDate(1); // Resetting the date to the 1st day of the next month
  }
  return installmentDetails;
}
exports.Updateamountandmonth = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    await sequelize.query(
      `delete from Advance_Dtl where tran_id='${req.body.UTD}'`
    );

    await sequelize.query(
      `update advance_mst set sanc_amount='${req.body.amt}' , tenure_month='${req.body.tenure_month}' where utd='${req.body.UTD}'`
    );
    const result = await sequelize.query(
      `select TENURE_MONTH,SANC_AMOUNT,repayment_Start_Date from advance_mst where utd='${req.body.UTD}'`
    );
    console.log(result[0][0], "results");
    const advanceDtl = calculateEMI(
      result[0][0].TENURE_MONTH,
      result[0][0].SANC_AMOUNT,
      result[0][0].repayment_Start_Date,
      req.body.user_code
    );

    for (let i = 0; i < advanceDtl.length; i++) {
      await sequelize.query(`insert into advance_dtl (Tran_id,ino,inst_date,inst_amt,Rem_Bal,PYMT_Recvd,created_by)
          values ('${req.body.UTD}',${advanceDtl[i].INO},'${advanceDtl[i].INST_DATE}','${advanceDtl[i].INST_AMT}','${advanceDtl[i].REM_BAL}','${advanceDtl[0].PYMT_RECVD}','${req.body.user_code}')`);
    }
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
exports.approveby1 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const tran_id = req.body.UTD;

    const appr_1_Remark = req.body.appr_1_Remark
      ? `'${req.body.appr_1_Remark}'`
      : null;
    for (let i = 0; i < tran_id.length; i++) {
      const result = await sequelize.query(
        `select * from advance_mst where utd='${tran_id[i]}'`
      );

      if (result[0][0].SANC_AMOUNT == null) {
        await sequelize.query(
          `update advance_mst set SANC_AMOUNT=REQ_AMOUNT  where utd='${tran_id[i]}'`
        );
      }
      await sequelize.query(
        `update advance_mst set appr_1_status=1,appr_1_Remark=${appr_1_Remark},appr_2_status=0 where utd='${tran_id[i]}'`
      );
    }

    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
exports.approveby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const tran_id = req.body.UTD;
    const appr_2_Remark = req.body.appr_2_Remark
      ? `'${req.body.appr_2_Remark}'`
      : null;

    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update advance_mst set appr_2_status=1,appr_2_Remark=${appr_2_Remark},appr_3_status=0 where utd='${tran_id[i]}'`
      );
    }
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
exports.approveby3 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const tran_id = req.body.UTD;

    const appr_3_Remark = req.body.appr_3_Remark
      ? `'${req.body.appr_3_Remark}'`
      : null;

    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update advance_mst set appr_3_status=1,appr_3_Remark=${appr_3_Remark},final_apprv=1 where utd='${tran_id[i]}'`
      );
    }
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
exports.rejectby1 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const tran_id = req.body.UTD;
    const appr_1_Remark = req.body.appr_1_Remark
      ? `'${req.body.appr_1_Remark}'`
      : null;

    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update advance_mst set appr_1_status=2,appr_1_Remark=${appr_1_Remark} where utd='${tran_id[i]}'`
      );
    }
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
exports.rejectby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const tran_id = req.body.UTD;
    const appr_2_Remark = req.body.appr_2_Remark
      ? `'${req.body.appr_2_Remark}'`
      : null;

    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update advance_mst set appr_2_status=2,appr_2_Remark=${appr_2_Remark} where utd='${tran_id[i]}'`
      );
    }
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
exports.rejectby3 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const tran_id = req.body.UTD;
    const appr_3_Remark = req.body.appr_3_Remark
      ? `'${req.body.appr_3_Remark}'`
      : null;
    for (let i = 0; i < tran_id.length; i++) {
      await sequelize.query(
        `update advance_mst set appr_3_status=2,appr_3_Remark=${appr_3_Remark} where utd='${tran_id[i]}'`
      );
    }
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
exports.cancle = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const tran_id = req.body.UTD;
    const result = await sequelize.query(
      `select APPR_1_STATUS from Advance_Mst where utd='${tran_id}'`
    );
    if (result[0][0].APPR_1_STATUS == 0) {
      await sequelize.query(`delete from Advance_Mst where utd='${tran_id}'`);
      await sequelize.query(
        `delete from Advance_Dtl where tran_id='${tran_id}'`
      );
      res.status(200).send("done");
    } else {
      res.status(404).send("cannot Cancle Request");
    }
  } catch (err) {
    console.log(err);
  }
};
exports.updateremarkofaccount = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const UTD = req.body.UTD;
    const Remark = req.body.Remark;
    await sequelize.query(
      `update Advance_Mst set account_remark='${Remark}' where utd='${UTD}'`
    );
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};
