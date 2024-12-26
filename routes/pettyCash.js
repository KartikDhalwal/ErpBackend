const { func } = require("joi");
const { dbname } = require("../utils/dbconfig");
const { Sequelize } = require('sequelize');


exports.insertData = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    console.log(req.body);
    const Req_Amount = req.body.Req_Amount;
    const Purpose = req.body.Purpose;
    const Remark = req.body.Remark;
    const Loc_Code = req.body.Loc_Code;
    const EmpCode = req.body.EmpCode;
    const UserName = req.body.username;

    if (!Req_Amount) throw new Error("Requested Amt is mendatory");
    if (!Purpose) throw new Error("Purpose is mendatory");
    if (!Remark) throw new Error("Remark is mendatory");
    if (!Loc_Code) throw new Error("Loc_Code is mendatory");
    if (!EmpCode) throw new Error("EmpCode is mendatory");
    if (!UserName) throw new Error("UserName is mendatory");

    if (Req_Amount && Purpose && Remark && Loc_Code && EmpCode && UserName) {
      const result = await sequelize.query(
        `INSERT INTO PETTY_CASH (Req_Amount,Purpose,Remark,Loc_Code,EmpCode, Created_by) VALUES('${Req_Amount}','${Purpose}','${Remark}','${Loc_Code}','${EmpCode}', '${UserName}')`
      );
    }

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: e.message,
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.PettyCashApr1 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "body");
  try {
    const empcode = req.body.empcode;
    const StartDate = req.body.StartDate;
    const EndDate = req.body.EndDate;
    const Loc_Code = req.body.Loc_Code;
    const status = req.body.Status;
    console.log(status, "status");

    const query = `SELECT subquery.utd,cast(Requested_Date as date) AS Requested_Date,subquery.Req_Amount,subquery.Loc_Code,
      subquery.Status,subquery.location,subquery.EmpCode,subquery.Apr_Amt,subquery.Purpose,subquery.Remark,subquery.approver1_A,
      subquery.approver1_B,subquery.approver2_A,subquery.approver_1_name,
      subquery.empployee_name,
      subquery.approver_2_name FROM 
        (SELECT p.Remark1,p.utd,p.Requested_Date,p.Req_Amount,p.Loc_Code,p.Status,p.EmpCode,p.Apr_Amt,p.Purpose,p.Remark,(SELECT approver1_A FROM Approval_Matrix WHERE empcode = p.empcode AND module_code = 'petty_cash') AS approver1_A,
        (SELECT TOP 1 CONCAT(empfirstname, ' ', emplastname) FROM employeemaster WHERE empcode = (SELECT empcode FROM Approval_Matrix WHERE empcode = p.empcode AND module_code = 'petty_cash' )) AS empployee_name,
        (SELECT TOP 1 CONCAT(empfirstname, ' ', emplastname) FROM employeemaster WHERE empcode = (SELECT approver1_A FROM Approval_Matrix WHERE empcode = p.empcode AND module_code = 'petty_cash' )) AS approver_1_name,(SELECT TOP 1 CONCAT(empfirstname, ' ', emplastname) FROM employeemaster WHERE empcode = (SELECT approver2_A FROM Approval_Matrix WHERE empcode = p.empcode AND module_code = 'petty_cash'))AS approver_2_name,(select top 1 godw_name from godown_mst where godw_code=p.loc_code)as location,(SELECT approver2_A FROM Approval_Matrix WHERE empcode = p.empcode and module_code='petty_cash') AS approver2_A ,(SELECT approver1_B FROM Approval_Matrix WHERE empcode = p.empcode and module_code='petty_cash') AS approver1_B FROM PETTY_CASH p) AS subquery
         JOIN EMPLOYEEMASTER e ON subquery.EmpCode = e.empcode WHERE (subquery.approver1_A = '${empcode}' OR subquery.approver1_B = '${empcode}') AND cast(Requested_Date as date) BETWEEN '${StartDate}' AND '${EndDate}' AND subquery.Loc_Code in (${Loc_Code}) and Status  ${req.body.Status ? `= ${req.body.Status}` : `is  null`}`;

    const result = await sequelize.query(query);

    // console.log(status)
    // console.log(query);
    // console.log(result);
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

exports.PettyCashApr2 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const empcode = req.body.empcode;
    const StartDate = req.body.StartDate;
    const EndDate = req.body.EndDate;
    const Loc_Code = req.body.Loc_Code;
    const status = req.body.Status;
    const result =
      await sequelize.query(`SELECT subquery.utd,subquery.Remark2,cast(Requested_Date as date) AS Requested_Date,subquery.Req_Amount,subquery.Loc_Code,subquery.location,
      subquery.Status,subquery.EmpCode,subquery.Apr_Amt,subquery.Purpose,subquery.Remark,subquery.approver2_A,
      subquery.approver_1_name,subquery.empployee_name FROM 
        (SELECT p.Remark2, p.utd,p.Requested_Date,p.Req_Amount,p.Loc_Code,p.Status,p.EmpCode,p.Apr_Amt,p.Purpose,p.Remark,
          (SELECT approver2_A FROM Approval_Matrix WHERE empcode = p.empcode and module_code='petty_cash') AS approver2_A,
          (SELECT TOP 1 CONCAT(empfirstname, ' ', emplastname) FROM employeemaster WHERE empcode = (SELECT empcode FROM Approval_Matrix WHERE empcode = p.empcode AND module_code = 'petty_cash' )) AS empployee_name,
          (SELECT TOP 1 CONCAT(empfirstname, ' ', emplastname) FROM employeemaster WHERE empcode = (SELECT approver1_A FROM Approval_Matrix WHERE empcode = p.empcode AND module_code = 'petty_cash' )) AS approver_1_name,
          (select top 1 godw_name from godown_mst where godw_code=p.loc_code)as location,
          (SELECT approver2_B FROM Approval_Matrix WHERE empcode = p.empcode and module_code='petty_cash') AS approver2_B 
          FROM PETTY_CASH p) AS subquery
      JOIN EMPLOYEEMASTER e ON subquery.EmpCode = e.empcode 
      WHERE (subquery.approver2_A = '${empcode}' OR subquery.approver2_B = '${empcode}') AND cast(Requested_Date as date) BETWEEN '${StartDate}' AND '${EndDate}' AND subquery.Loc_Code in (${Loc_Code}) and Status  ${
        req.body.Status ? `= ${req.body.Status}` : `is  null`
      }`);

    console.log(result);
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

exports.PettyCashAmt = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const utd = req.body.utd;
    const Apr_Amt = req.body.Apr_Amt;
    const Remark = req.body.Remark;
    const status = req.body.status;
    const pymt_mode = req.body.pymt_mode ? `${req.body.pymt_mode}` : null;
    let databaseremark;
    databaseremark = status == 1 ? "remark1" : "remark2";

    const result = await sequelize.query(
      `UPDATE PETTY_CASH SET Apr_Amt = '${Apr_Amt}',${databaseremark}=  '${Remark}',pymt_mode=${pymt_mode} WHERE utd= ${utd}`
    );

    console.log(result);

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
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

exports.PettyCashEmpAmt = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const utd = req.body.utd;
    const Req_Amount = req.body.Req_Amount;

    const result = await sequelize.query(
      `UPDATE PETTY_CASH SET Req_Amount = '${Req_Amount}' WHERE utd= ${utd}`
    );

    console.log(result);

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
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

exports.PettyCashapprove = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const status = req.body.status;
  
    const utd = req.body.utd;
   
    for (let i = 0; i < utd.length; i++) {
      const result = await sequelize.query(
        `select Req_Amount,Apr_Amt from PETTY_CASH WHERE utd= ${utd[i]}`
      );

     

      if (result[0][0].Apr_Amt == null) {
        await sequelize.query(
          `UPDATE PETTY_CASH SET status='${status}' , Apr_Amt = '${result[0][0].Req_Amount}' WHERE utd ='${utd[i]}' `
        );
      } else {
        await sequelize.query(
          `UPDATE PETTY_CASH SET status='${status}'  WHERE utd ='${utd[i]}' `
        );
      }
    }

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
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

exports.PettyCashreject = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const utd = req.body.utd;

    for (let i = 0; i < utd.length; i++) {
      const result = await sequelize.query(
        `UPDATE PETTY_CASH SET Status = '0' WHERE utd= ${utd[i]}`
      );
      console.log(result);
    }

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
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

exports.PettyCashView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const empcode = req.body.empcode;

    const result =
      await sequelize.query(`select utd,Remark,Purpose, cast(Requested_Date as date) AS Requested_Date, Req_Amount,Apr_Amt,CASE WHEN status = 0 THEN 'Reject'
                 WHEN status = 1 THEN 'Approve by 1'
                 WHEN status = 2 THEN 'Approve by 2' 
                 ELSE 'Pending'
                 END AS STATUS
    from PETTY_CASH WHERE EmpCode = '${empcode}'`);

    console.log(result);
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

exports.PettyCashcancel = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const utd = req.body.utd;
    const result = await sequelize.query(
      `DELETE FROM PETTY_CASH WHERE utd = '${utd}'`
    );

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
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
