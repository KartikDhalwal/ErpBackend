const { Sequelize, DataTypes, literal, Transaction } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const { v4: uuidv4 } = require('uuid');
const FormData = require("form-data");
const axios = require("axios");
const bodyParser = require("body-parser");
const { _ExpenseApproval, expenseApprovalSchema } = require("../models/ExpenseApproval");
const { _ExpenseTemplate } = require("../models/ExpenseTemplate");
const { _ExpenseMng } = require("../models/ExpenseMng");
const { _ExpenseMngDtl } = require("../models/ExpenseMngDtl");

const path = require('path');
const { SendWhatsAppMessgae } = require("./user");


async function uploadImages(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    console.log(files);

    await Promise.all(files?.map(async (file, index) => {
      const customPath = `${Comp_Code}/EXPENSE/`;
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
        const data = {
          SRNO: index,
          User_Name: Created_by,
          DOC_NAME: file.originalname,
          Doc_Type: "INV",
          path: `${customPath}${fileName}`,
        };
        console.log(data, 'data');
        dataArray.push(data);
        console.log(`Image uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading image ${index}:`, error.message);
      }
      // Doc_Type	TRAN_ID	SRNO	path	File_Name	User_Name	Upload_Date	Export_type
    }));

    console.log(dataArray, 'dataArray');
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}
exports.expense = async function (req, res) {
  try {
    const loc_code = req.body.loc_code;
    const userId = req.body.user_code;
    const dateFrom = req.body.dateFrom;
    const dateTo = req.body.dateTo;
    if (userId == "" || userId == undefined || userId == null) {
      return res.status(500).send({
        status: false,
        Message: "user_code is mandatory",
      });
    }
    if (loc_code == "" || loc_code == undefined || loc_code == null) {
      return res.status(500).send({
        status: false,
        Message: "loc_code is mandatory",
      });
    }
    if (dateTo == "" || dateTo == undefined || dateTo == null) {
      return res.status(500).send({
        status: false,
        Message: "loc_code is mandatory",
      });
    }
    if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
      return res.status(500).send({
        status: false,
        Message: "dateFrom is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);

    const data = await sequelize.query(`
      select d.tran_id, d.bill_no,d.Bill_Date,d.Ledger_Name,d.GST,d.Inv_amt,d.loc_code,d.acnt_idMain,
          (select top 1 path from DOC_UPLOAD where Doc_Type = 'CHQ' and tran_id = d.ledg_acnt) as chqImage,
      (select top 1 user_name from user_tbl where user_code = d.usr_code and Export_Type < 3) as user_name,
      (select top 1 godw_name from Godown_Mst where Godw_Code = d.Loc_Code and Export_Type < 3) as branch,
      (select top 1 user_name from user_tbl where user_code = 
      (select iif(e.Appr_1_Code is not null,Appr_1_Code,
      (select iif(Approver_1A = ${userId},Approver_1A,iif(Approver_1B = ${userId},Approver_1B,iif(Approver_1C = ${userId},Approver_1C,Approver_1A)))
       from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
      and   Export_Type < 3) as apr1_name,
      (select top 1 user_name from user_tbl where user_code = 
      (select iif(e.Appr_2_Code is not null,Appr_2_Code,
      (select iif(Approver_2A = ${userId},Approver_2A,iif(Approver_2B = ${userId},Approver_2B,iif(Approver_2C = ${userId},Approver_2C,Approver_2A)))
       from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
      and   Export_Type < 3) as apr2_name,
      (select top 1 user_name from user_tbl where user_code = 
      (select iif(e.Appr_3_Code is not null,Appr_3_Code,
      (select iif(Approver_3A = ${userId},Approver_3A,iif(Approver_3B = ${userId},Approver_3B,iif(Approver_3C = ${userId},Approver_3C,Approver_3A)))
       from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
      and   Export_Type < 3) as apr3_name,
      iif(fin_appr is null,iif((SELECT top 1 branch_code as result FROM Expense_Approval_Matrix WHERE '${userId}' 
         IN (Approver_1A, Approver_1B,Approver_1c) and Branch_Code = d.Loc_Code ) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${userId}' 
         IN (Approver_2A, Approver_2B,Approver_2c) and Branch_Code = d.Loc_Code ) is not null,Appr_2_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${userId}' 
         IN (approver_3A, Approver_3B,Approver_3c) and Branch_Code = d.Loc_Code ) is not null,Appr_3_Stat,1))),1) as status_reject,
      iif(fin_appr is null,iif((SELECT top 1 branch_code as result FROM Expense_Approval_Matrix WHERE '${userId}' 
         IN (Approver_1A, Approver_1B,Approver_1c) and Branch_Code = d.Loc_Code ) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${userId}' 
         IN (Approver_2A, Approver_2B,Approver_2c) and Branch_Code = d.Loc_Code ) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${userId}' 
         IN (approver_3A, Approver_3B,Approver_3c) and Branch_Code = d.Loc_Code ) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
         iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4) as stat,
         e.*,
         (SELECT top 1  STUFF((SELECT '|' + path
              FROM DOC_UPLOAD dgd
              WHERE dgd.tran_id =  d.acnt_idMain
              FOR XML PATH('')), 1, 1, '')) AS ImagePaths
              from (
                select distinct acnt_id as acnt_idMain,tran_id, bill_no,Bill_Date,Ledger_Name,GST,Inv_amt,drd.loc_code,LEDG_ACNT,drd.USR_CODE 
              from dms_row_data drd
              join ACNT_POST ap on Link_id = Tran_Id and ap.Export_Type < 3 and  ap.Book_Code = drd.Tran_Type
              where tran_type collate database_default in (select misc_dtl1 collate database_default from misc_mst 
              where misc_type =  56 and misc_num1=1)
                and drd.Loc_Code in (${loc_code}) 
                and Bill_Date between '${dateFrom}' and '${dateTo}'
              and drd.Export_Type < 3   
              )as d
                LEFT JOIN Expense_Approval e ON d.Tran_Id = e.Drd_Id 
          
    `);

    await sequelize.close();
    res.status(200).send({ success: true, data: data[0] });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  }
};
exports.ApproveExpense = async function (req, res) {
  try {
    console.log(req.body, 'req.boody')
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const t2 = await sequelize.transaction();
    const bodyData = req.body;
    const loc_code = req.body.loc_code;
    const userId = req.body.user_code;
    const user_code = req.body.user_code;

    if (userId == "" || userId == undefined || userId == null) {
      return res.status(500).send({
        status: false,
        Message: "user_code is mandatory",
      });
    }
    if (loc_code == "" || loc_code == undefined || loc_code == null) {
      return res.status(500).send({
        status: false,
        Message: "loc_code is mandatory",
      });
    }
    if (req.body.tran_id == "" || req.body.tran_id == undefined || req.body.tran_id == null) {
      return res.status(500).send({
        status: false,
        Message: "tran_id is mandatory",
      });
    }
    try {

      const a = await sequelize.query(
        `SELECT top 1 * from Expense_Approval_Matrix where Branch_Code  = '${loc_code}'`
        , { transaction: t2 });

      if (a[0]?.length > 0) {
        let ApprovalLevel = 0;
        let Final_apprvl = 0;
        let rowsAffected = 0;
        const Approver_1A = a[0][0]?.Approver_1A;
        const Approver_1B = a[0][0]?.Approver_1B;
        const Approver_1C = a[0][0]?.Approver_1C;
        const Approver_2A = a[0][0]?.Approver_2A;
        const Approver_2B = a[0][0]?.Approver_2B;
        const Approver_2C = a[0][0]?.Approver_2C;
        const Approver_3A = a[0][0]?.Approver_3A;
        const Approver_3B = a[0][0]?.Approver_3B;
        const Approver_3C = a[0][0]?.Approver_3C;

        if (Approver_1A == userId || Approver_1B == userId || Approver_1C == userId) {
          ApprovalLevel = 1;
        } else if (Approver_2A == userId || Approver_2B == userId || Approver_2C == userId) {
          ApprovalLevel = 2;
        } else if (Approver_3A == userId || Approver_3B == userId || Approver_3C == userId) {
          ApprovalLevel = 3;
        }
        if (ApprovalLevel == 2 && !a[0][0].Approver_3A && !a[0][0].Approver_3B && !a[0][0].Approver_3C) {
          Final_apprvl = 1;
        } else if (ApprovalLevel == 1 && !a[0][0].Approver_2A && !a[0][0].Approver_2B && !a[0][0].Approver_2C) {
          Final_apprvl = 1;
        }
        if (ApprovalLevel == 0) {
          return res.status(200).send({
            status: false,
            Message: "you are not the right person to approve this",
          });
        }
        const ExpenseApproval = _ExpenseApproval(sequelize, DataTypes);
        const { error, value } = expenseApprovalSchema.validate(bodyData, {
          abortEarly: false,
          stripUnknown: true,
        });
        const employeeData = value;
        employeeData.Created_by = userId;
        employeeData.Drd_Id = bodyData.tran_id;

        if (bodyData.UTD == null || bodyData.UTD == "" || bodyData.UTD == undefined) {
          const existingRecord = await ExpenseApproval.findOne({
            where: {
              Drd_Id: bodyData.tran_id
            }
          });
          if (existingRecord) {
            bodyData.UTD = existingRecord.UTD
          } else {
            console.log(employeeData)
            const newRecord = await ExpenseApproval.create({ ...employeeData, Created_By: userId }, { transaction: t });
            bodyData.UTD = newRecord.UTD;
            t.commit();
          }

        }
        if (ApprovalLevel == 1) {
          const data = { Appr_1_Code: userId, Appr_1_Stat: 1, Fin_Appr: Final_apprvl == 1 ? 1 : null }
          const [affectedRowsCount] = await ExpenseApproval.update({ ...data, Created_By: userId },
            { where: { UTD: bodyData.UTD, Appr_1_Stat: null, Fin_Appr: null } },
            { transaction: t2 });
          rowsAffected = affectedRowsCount;
          console.log(affectedRowsCount, 'asdkaskdjldas')
        }
        else if (ApprovalLevel == 2) {
          const data = { Appr_2_Code: userId, Appr_2_Stat: 1, Fin_Appr: Final_apprvl == 1 ? 1 : null }
          const [affectedRowsCount] = await ExpenseApproval.update({ ...data, Created_By: userId },
            {
              where: {
                UTD: bodyData.UTD,
                Appr_1_Stat: { [Sequelize.Op.not]: null },
                Appr_2_Stat: null,
                Fin_Appr: null
              }
            },
            { transaction: t2 });
          rowsAffected = affectedRowsCount;
          console.log(affectedRowsCount, 'asdkaskdjldas')

        }
        else if (ApprovalLevel == 3) {
          Final_apprvl = 1;
          const data = { Appr_3_Code: userId, Appr_3_Stat: 1, Fin_Appr: 1 }
          const [affectedRowsCount] = await ExpenseApproval.update({ ...data, Created_By: userId },
            {
              where:
              {
                UTD: bodyData.UTD,
                Appr_2_Stat: { [Sequelize.Op.not]: null },
                Appr_3_Code: null,
                Fin_Appr: null
              }
            },
            { transaction: t2 });
          rowsAffected = affectedRowsCount;
          console.log(affectedRowsCount, 'asdkaskdjldas')

        }
        const data = await sequelize.query(`
          select d.tran_id, d.bill_no,d.Bill_Date,d.Ledger_Name,d.GST,d.Inv_amt,d.loc_code,d.acnt_idMain,
          (select top 1 path from DOC_UPLOAD where Doc_Type = 'CHQ' and tran_id = d.ledg_acnt) as chqImage,
          (select top 1 user_name from user_tbl where user_code = d.usr_code and Export_Type < 3) as user_name,
          (select top 1 godw_name from Godown_Mst where Godw_Code = d.Loc_Code and Export_Type < 3) as branch,
          (select top 1 user_name from user_tbl where user_code = 
          (select iif(e.Appr_1_Code is not null,Appr_1_Code,
          (select iif(Approver_1A = ${user_code},Approver_1A,iif(Approver_1B = ${user_code},Approver_1B,iif(Approver_1C = ${user_code},Approver_1C,Approver_1A)))
           from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
          and   Export_Type < 3) as apr1_name,
          (select top 1 user_name from user_tbl where user_code = 
          (select iif(e.Appr_2_Code is not null,Appr_2_Code,
          (select iif(Approver_2A = ${user_code},Approver_2A,iif(Approver_2B = ${user_code},Approver_2B,iif(Approver_2C = ${user_code},Approver_2C,Approver_2A)))
           from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
          and   Export_Type < 3) as apr2_name,
          (select top 1 user_name from user_tbl where user_code = 
          (select iif(e.Appr_3_Code is not null,Appr_3_Code,
          (select iif(Approver_3A = ${user_code},Approver_3A,iif(Approver_3B = ${user_code},Approver_3B,iif(Approver_3C = ${user_code},Approver_3C,Approver_3A)))
           from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
          and   Export_Type < 3) as apr3_name,
          iif(fin_appr is null,iif((SELECT top 1 branch_code as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (Approver_1A, Approver_1B,Approver_1c) and Branch_Code = d.Loc_Code ) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (Approver_2A, Approver_2B,Approver_2c) and Branch_Code = d.Loc_Code ) is not null,Appr_2_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (approver_3A, Approver_3B,Approver_3c) and Branch_Code = d.Loc_Code ) is not null,Appr_3_Stat,1))),1) as status_reject,
          iif(fin_appr is null,iif((SELECT top 1 branch_code as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (Approver_1A, Approver_1B,Approver_1c) and Branch_Code = d.Loc_Code ) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (Approver_2A, Approver_2B,Approver_2c) and Branch_Code = d.Loc_Code ) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (approver_3A, Approver_3B,Approver_3c) and Branch_Code = d.Loc_Code ) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
             iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4) as stat,
             e.*,
             (SELECT top 1  STUFF((SELECT '|' + path
              FROM DOC_UPLOAD dgd
              WHERE dgd.tran_id =  d.acnt_idMain
              FOR XML PATH('')), 1, 1, '')) AS ImagePaths
              from (
                select distinct acnt_id as acnt_idMain,tran_id, bill_no,Bill_Date,Ledger_Name,GST,Inv_amt,drd.loc_code,LEDG_ACNT,drd.USR_CODE 
              from dms_row_data drd
              join ACNT_POST ap on Link_id = Tran_Id and ap.Export_Type < 3 and  ap.Book_Code = drd.Tran_Type
              where tran_type collate database_default in (select misc_dtl1 collate database_default from misc_mst 
              where misc_type =  56 and misc_num1=1)
                and drd.Loc_Code in (${loc_code}) 
              and drd.Export_Type < 3   
              and drd.tran_id = ${bodyData.tran_id}
              )as d
                LEFT JOIN Expense_Approval e ON d.Tran_Id = e.Drd_Id 
        `, { transaction: t2 });
        t2.commit();
        if (rowsAffected == 0) {
          return res.status(200).send({ success: true, Message: 'Can Not Approve', data: data[0] });
        }
        if (Final_apprvl == 1) {
          return res.status(200).send({ success: true, Message: 'Final Approval Done', data: data[0] });
        }
        if (ApprovalLevel == 1) {
          return res.status(200).send({ success: true, Message: 'Approved on level 1', data: data[0] });
        }
        if (ApprovalLevel == 2) {
          return res.status(200).send({ success: true, Message: 'Approved on level 2', data: data[0] });
        }
        if (ApprovalLevel == 3) {
          return res.status(200).send({ success: true, Message: 'Approved on level 3', data: data[0] });
        }
      }
    } catch (e) {
      console.log(e);
      t.rollback();
      t2.rollback();
      return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }

}
exports.RejectExpense = async function (req, res) {
  try {
    console.log(req.body, 'req.boody')
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const t2 = await sequelize.transaction();
    const bodyData = req.body;
    const loc_code = req.body.loc_code;
    const userId = req.body.user_code;
    const user_code = req.body.user_code;
    const Remark = req.body.Remark;

    if (userId == "" || userId == undefined || userId == null) {
      return res.status(500).send({
        status: false,
        Message: "user_code is mandatory",
      });
    }
    if (Remark == "" || Remark == undefined || Remark == null) {
      return res.status(500).send({
        status: false,
        Message: "Remark is mandatory",
      });
    }
    if (userId == "" || userId == undefined || userId == null) {
      return res.status(500).send({
        status: false,
        Message: "user_code is mandatory",
      });
    }
    if (loc_code == "" || loc_code == undefined || loc_code == null) {
      return res.status(500).send({
        status: false,
        Message: "loc_code is mandatory",
      });
    }
    if (req.body.tran_id == "" || req.body.tran_id == undefined || req.body.tran_id == null) {
      return res.status(500).send({
        status: false,
        Message: "tran_id is mandatory",
      });
    }
    try {

      const a = await sequelize.query(
        `SELECT top 1 * from Expense_Approval_Matrix where Branch_Code  = '${loc_code}'`
        , { transaction: t2 });

      if (a[0]?.length > 0) {
        let ApprovalLevel = 0;
        let Final_apprvl = 0;
        let rowsAffected = 0;
        const Approver_1A = a[0][0]?.Approver_1A;
        const Approver_1B = a[0][0]?.Approver_1B;
        const Approver_1C = a[0][0]?.Approver_1C;
        const Approver_2A = a[0][0]?.Approver_2A;
        const Approver_2B = a[0][0]?.Approver_2B;
        const Approver_2C = a[0][0]?.Approver_2C;
        const Approver_3A = a[0][0]?.Approver_3A;
        const Approver_3B = a[0][0]?.Approver_3B;
        const Approver_3C = a[0][0]?.Approver_3C;

        if (Approver_1A == userId || Approver_1B == userId || Approver_1C == userId) {
          ApprovalLevel = 1;
        } else if (Approver_2A == userId || Approver_2B == userId || Approver_2C == userId) {
          ApprovalLevel = 2;
        } else if (Approver_3A == userId || Approver_3B == userId || Approver_3C == userId) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel == 0) {
          return res.status(200).send({
            status: false,
            Message: "you are not the right person to Reject this",
          });
        }
        const ExpenseApproval = _ExpenseApproval(sequelize, DataTypes);
        const { error, value } = expenseApprovalSchema.validate(bodyData, {
          abortEarly: false,
          stripUnknown: true,
        });
        const employeeData = value;
        employeeData.Created_by = userId;
        employeeData.Drd_Id = bodyData.tran_id;


        if (bodyData.UTD == null || bodyData.UTD == "" || bodyData.UTD == undefined) {
          const existingRecord = await ExpenseApproval.findOne({
            where: {
              Drd_Id: bodyData.tran_id
            }
          });
          if (existingRecord) {
            bodyData.UTD = existingRecord.UTD
          } else {
            console.log(employeeData)
            const newRecord = await ExpenseApproval.create({ ...employeeData, Created_By: userId }, { transaction: t });
            bodyData.UTD = newRecord.UTD;
            t.commit();
          }

        }
        if (ApprovalLevel == 1) {
          const data = { Appr_1_Code: userId, Appr_1_Stat: 0, Fin_Appr: 0, Appr_1_Rem: Remark }
          const [affectedRowsCount] = await ExpenseApproval.update({ ...data, Created_By: userId },
            { where: { UTD: bodyData.UTD, Appr_1_Stat: null, Fin_Appr: null } },
            { transaction: t2 });
          rowsAffected = affectedRowsCount;
          console.log(affectedRowsCount, 'asdkaskdjldas')
        }
        if (ApprovalLevel == 2) {
          const data = { Appr_2_Code: userId, Appr_2_Stat: 0, Fin_Appr: 0, Appr_2_Rem: Remark }
          const [affectedRowsCount] = await ExpenseApproval.update({ ...data, Created_By: userId },
            {
              where: {
                UTD: bodyData.UTD,
                Appr_2_Stat: null,
                Fin_Appr: null
              }
            },
            { transaction: t2 });
          rowsAffected = affectedRowsCount;
          console.log(affectedRowsCount, 'asdkaskdjldas')

        }
        if (ApprovalLevel == 3) {
          const data = { Appr_3_Code: userId, Appr_3_Stat: 1, Fin_Appr: 0, Appr_3_Rem: Remark }
          const [affectedRowsCount] = await ExpenseApproval.update({ ...data, Created_By: userId },
            {
              where:
              {
                UTD: bodyData.UTD,
                Appr_3_Code: null,
                Fin_Appr: null
              }
            },
            { transaction: t2 });
          rowsAffected = affectedRowsCount;
          console.log(affectedRowsCount, 'asdkaskdjldas')

        }
        const data = await sequelize.query(`
          select d.tran_id, d.bill_no,d.Bill_Date,d.Ledger_Name,d.GST,d.Inv_amt,d.loc_code,d.acnt_idMain,
          (select top 1 path from DOC_UPLOAD where Doc_Type = 'CHQ' and tran_id = d.ledg_acnt) as chqImage,
          (select top 1 user_name from user_tbl where user_code = d.usr_code and Export_Type < 3) as user_name,
          (select top 1 godw_name from Godown_Mst where Godw_Code = d.Loc_Code and Export_Type < 3) as branch,
          (select top 1 user_name from user_tbl where user_code = 
          (select iif(e.Appr_1_Code is not null,Appr_1_Code,
          (select iif(Approver_1A = ${user_code},Approver_1A,iif(Approver_1B = ${user_code},Approver_1B,iif(Approver_1C = ${user_code},Approver_1C,Approver_1A)))
           from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
          and   Export_Type < 3) as apr1_name,
          (select top 1 user_name from user_tbl where user_code = 
          (select iif(e.Appr_2_Code is not null,Appr_2_Code,
          (select iif(Approver_2A = ${user_code},Approver_2A,iif(Approver_2B = ${user_code},Approver_2B,iif(Approver_2C = ${user_code},Approver_2C,Approver_2A)))
           from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
          and   Export_Type < 3) as apr2_name,
          (select top 1 user_name from user_tbl where user_code = 
          (select iif(e.Appr_3_Code is not null,Appr_3_Code,
          (select iif(Approver_3A = ${user_code},Approver_3A,iif(Approver_3B = ${user_code},Approver_3B,iif(Approver_3C = ${user_code},Approver_3C,Approver_3A)))
           from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
          and   Export_Type < 3) as apr3_name,
          iif(fin_appr is null,iif((SELECT top 1 branch_code as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (Approver_1A, Approver_1B,Approver_1c) and Branch_Code = d.Loc_Code ) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (Approver_2A, Approver_2B,Approver_2c) and Branch_Code = d.Loc_Code ) is not null,Appr_2_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (approver_3A, Approver_3B,Approver_3c) and Branch_Code = d.Loc_Code ) is not null,Appr_3_Stat,1))),1) as status_reject,
          iif(fin_appr is null,iif((SELECT top 1 branch_code as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (Approver_1A, Approver_1B,Approver_1c) and Branch_Code = d.Loc_Code ) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (Approver_2A, Approver_2B,Approver_2c) and Branch_Code = d.Loc_Code ) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
             IN (approver_3A, Approver_3B,Approver_3c) and Branch_Code = d.Loc_Code ) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
             iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4) as stat,
             e.*,
             (SELECT top 1  STUFF((SELECT '|' + path
             FROM DOC_UPLOAD dgd
             WHERE dgd.tran_id =  d.acnt_idMain
             FOR XML PATH('')), 1, 1, '')) AS ImagePaths
             from (
               select distinct acnt_id as acnt_idMain,tran_id, bill_no,Bill_Date,Ledger_Name,GST,Inv_amt,drd.loc_code,LEDG_ACNT,drd.USR_CODE 
             from dms_row_data drd
             join ACNT_POST ap on Link_id = Tran_Id and ap.Export_Type < 3 and  ap.Book_Code = drd.Tran_Type
             where tran_type collate database_default in (select misc_dtl1 collate database_default from misc_mst 
             where misc_type =  56 and misc_num1=1)
               and drd.Loc_Code in (${loc_code}) 
             and drd.Export_Type < 3   
             and drd.tran_id = ${bodyData.tran_id}
             )as d
               LEFT JOIN Expense_Approval e ON d.Tran_Id = e.Drd_Id 
        `, { transaction: t2 });
        t2.commit();
        if (rowsAffected == 0) {
          return res.status(200).send({ success: true, Message: 'Can Not Reject', data: data[0] });
        } else {
          return res.status(200).send({ success: true, Message: 'Final Rejection Done', data: data[0] });
        }


      }
    } catch (e) {
      console.log(e);
      t.rollback();
      t2.rollback();
      return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }

}
exports.UpdateExpenseDetails = async function (req, res) {
  try {
    console.log(req.body)
    console.log(req.files)
    const data = JSON.parse(req.body.rowData);
    console.log(data)
    const { user_code, loc_code, UTD, Utr_no, Utr_Date, Autovyn_Pymt_Vch, Pymt_Done, tran_id, Amount, acnt_idMain } = data;

    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const t2 = await sequelize.transaction();
    console.log({ user_code, loc_code, UTD, Utr_no, Utr_Date, Autovyn_Pymt_Vch, Pymt_Done })
    if (user_code == "" || user_code == undefined || user_code == null) {
      return res.status(500).send({
        status: false,
        Message: "user_code is mandatory",
      });
    }
    if (loc_code == "" || loc_code == undefined || loc_code == null) {
      return res.status(500).send({
        status: false,
        Message: "loc_code is mandatory",
      });
    }
    if (UTD == "" || UTD == undefined || UTD == null) {
      return res.status(500).send({
        status: false,
        Message: "UTD is mandatory",
      });
    }
    let EMP_DOCS_data
    if (req.files) {
      EMP_DOCS_data = await uploadImages(
        req.files,
        req.headers.compcode,
        user_code,
      );
      for (const data of EMP_DOCS_data) {
        console.log(data);
        const record = await sequelize.query(`INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
        VALUES ('${data.Doc_Type}', ${acnt_idMain}, (SELECT COALESCE(MAX(SRNO), 0) + 1 
        FROM DOC_UPLOAD 
        WHERE TRAN_ID = ${acnt_idMain}), '${data.path}', '${data.DOC_NAME}',(select top 1 user_name from user_tbl where user_code = ${user_code} and export_type = 1), CONVERT(VARCHAR, GETDATE(), 5), 1);`);
      }
    }
    console.log(EMP_DOCS_data)
    const ExpenseApproval = _ExpenseApproval(sequelize, DataTypes);
    const [affectedRowsCount] = await ExpenseApproval.update({ Utr_no, Utr_Date, Autovyn_Pymt_Vch, Pymt_Done, Amount, Acnt_Id: acnt_idMain },
      {
        where:
        {
          UTD: UTD,
          Fin_Appr: 1
        }
      },
      { transaction: t2 });

    if (affectedRowsCount) {
      const data = await sequelize.query(`
        select d.tran_id, d.bill_no,d.Bill_Date,d.Ledger_Name,d.GST,d.Inv_amt,d.loc_code,d.acnt_idMain,
          (select top 1 path from DOC_UPLOAD where Doc_Type = 'CHQ' and tran_id = d.ledg_acnt) as chqImage,
        (select top 1 user_name from user_tbl where user_code = d.usr_code and Export_Type < 3) as user_name,
        (select top 1 godw_name from Godown_Mst where Godw_Code = d.Loc_Code and Export_Type < 3) as branch,
        (select top 1 user_name from user_tbl where user_code = 
        (select iif(e.Appr_1_Code is not null,Appr_1_Code,
        (select iif(Approver_1A = ${user_code},Approver_1A,iif(Approver_1B = ${user_code},Approver_1B,iif(Approver_1C = ${user_code},Approver_1C,Approver_1A)))
         from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
        and   Export_Type < 3) as apr1_name,
        (select top 1 user_name from user_tbl where user_code = 
        (select iif(e.Appr_2_Code is not null,Appr_2_Code,
        (select iif(Approver_2A = ${user_code},Approver_2A,iif(Approver_2B = ${user_code},Approver_2B,iif(Approver_2C = ${user_code},Approver_2C,Approver_2A)))
         from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
        and   Export_Type < 3) as apr2_name,
        (select top 1 user_name from user_tbl where user_code = 
        (select iif(e.Appr_3_Code is not null,Appr_3_Code,
        (select iif(Approver_3A = ${user_code},Approver_3A,iif(Approver_3B = ${user_code},Approver_3B,iif(Approver_3C = ${user_code},Approver_3C,Approver_3A)))
         from Expense_Approval_Matrix where Branch_Code = d.Loc_Code)))
        and   Export_Type < 3) as apr3_name,
        iif(fin_appr is null,iif((SELECT top 1 branch_code as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
           IN (Approver_1A, Approver_1B,Approver_1c) and Branch_Code = d.Loc_Code ) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
           IN (Approver_2A, Approver_2B,Approver_2c) and Branch_Code = d.Loc_Code ) is not null,Appr_2_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
           IN (approver_3A, Approver_3B,Approver_3c) and Branch_Code = d.Loc_Code ) is not null,Appr_3_Stat,1))),1) as status_reject,
        iif(fin_appr is null,iif((SELECT top 1 branch_code as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
           IN (Approver_1A, Approver_1B,Approver_1c) and Branch_Code = d.Loc_Code ) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
           IN (Approver_2A, Approver_2B,Approver_2c) and Branch_Code = d.Loc_Code ) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Expense_Approval_Matrix WHERE '${user_code}' 
           IN (approver_3A, Approver_3B,Approver_3c) and Branch_Code = d.Loc_Code ) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
           iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4) as stat,
           e.*,
           (SELECT top 1  STUFF((SELECT '|' + path
                FROM DOC_UPLOAD dgd
                WHERE dgd.tran_id =  acnt_idMain
                FOR XML PATH('')), 1, 1, '')) AS ImagePaths
                from (
                  select distinct acnt_id as acnt_idMain,tran_id, bill_no,Bill_Date,Ledger_Name,GST,Inv_amt,drd.loc_code,LEDG_ACNT,drd.USR_CODE 
                from dms_row_data drd
                join ACNT_POST ap on Link_id = Tran_Id and ap.Export_Type < 3 and  ap.Book_Code = drd.Tran_Type
                where tran_type collate database_default in (select misc_dtl1 collate database_default from misc_mst 
                where misc_type =  56 and misc_num1=1)
                  and drd.Loc_Code in (${loc_code}) 
                  and Bill_Date between '2024-04-10' and '2024-05-14'
                and drd.Export_Type < 3   and Tran_Id = ${tran_id}
                )as d
                  LEFT JOIN Expense_Approval e ON d.Tran_Id = e.Drd_Id 
      `);

      console.log(data[0])
      return res.status(200).send({ success: true, Message: "Record updated", data: data[0] });
    } else {
      return res.status(200).send({ success: false, Message: "Record can not be updated" });
    }


  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }

}
// expense management

exports.Alltemplates = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    try {
      const template = await sequelize.query(`select distinct Template_Id as id,Template_Id as Code, Template_Name as name, Template_Name as Name from expense_template where export_type < 3`)

      return res.status(200).send({ status: true, data: template[0] });

    } catch (e) {
      console.log(e);
      return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }

}
exports.templateFetch = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    try {
      const template = await sequelize.query(`select distinct Template_Id as id,Template_Id as Code,
         Template_Name as name, Template_Name as Name from expense_template where export_type < 3 and Template_Id in (
         SELECT LTRIM(RTRIM(m.value('.[1]', 'VARCHAR(8000)'))) AS value
        FROM user_tbl
        CROSS APPLY (
            SELECT CAST('<x>' + REPLACE(Multi_Cash, ',', '</x><x>') + '</x>' AS XML)
        ) AS t(x)
        CROSS APPLY t.x.nodes('/x') AS a(m)
        WHERE empcode = '${req.body.EMPCODE}'
          AND export_type < 3 
          AND module_code = 10)`)
      const employees = await sequelize.query(`select EMPCODE as value, empfirstname as label	from employeemaster 
      where empcode in (SELECT empcode FROM Approval_Matrix WHERE '${req.body.EMPCODE}' 
      IN (approver1_A, approver1_B) and module_code = 'EXPENSE') or empcode in ('${req.body.EMPCODE}')`)
      console.log(employees);
      return res.status(200).send({ status: true, data: template[0], employee: employees[0] });

    } catch (e) {
      console.log(e);
      return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }

}
exports.EditTemplate = async function (req, res) {
  console.log(req.body)
  try {
    const template1 = req.body.template
    const sequelize = await dbname(req.headers.compcode);
    try {
      const template = await sequelize.query(`select UTD, Field_Name	,Field_Type,	Field_Req,	Field_Attr,Table_field from expense_template where template_id = ${template1?.id}`)
      return res.status(200).send({ status: true, data: template[0], temlatename: template1.name });

    } catch (e) {
      console.log(e);
      return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }

}
exports.saveExpenseTemplate = async function (req, res) {

  const columns = req.body.columns;
  const TemplateName = req.body.TemplateName;
  const Created_By = req.body.Created_By;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    try {
      const ExpenseTemplate = _ExpenseTemplate(sequelize, DataTypes);
      const Existingtemplate = await sequelize.query(`select * from  expense_template where Template_Name = '${TemplateName}' and export_type < 3`)

      if (Existingtemplate[0].length) {
        return res.status(500).send({ status: false, Message: "Can not Create Duplicate Template", });
      }
      const template = await sequelize.query(`select isnull(max(Template_Id),0)+1 as Template_Id from expense_template`)
      const columns1 = ["DESCRIPTION", "LOCATION", "RATE", "QTY", "AMOUNT"];
      let tableFieldCounter = 1; // Counter for generating unique table fields
      let data = [];
      columns.forEach((item, index) => {
        const tableField = columns1.some(column => column === item.Field_Name) ? item.Field_Name : `F_${tableFieldCounter}`;

        // Increment the counter for the next iteration
        if (tableField.startsWith('F_')) {
          tableFieldCounter++;
        }
        data.push({
          Created_By: Created_By,
          Template_Name: TemplateName,
          Template_Id: template[0][0].Template_Id,
          Export_type: 1,
          Table_field: tableField,
          ...item,
        });
      });
      console.log(data);
      const as = await ExpenseTemplate.bulkCreate(data, { transaction: t })
      t.commit();
      const template1 = await sequelize.query(`select distinct Template_Id as id, Template_Name as name from expense_template where export_type < 3`)

      return res.status(200).send({ status: true, data: template1[0] });

    } catch (e) {
      console.log(e);
      return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }

}
exports.deleteTemplate = async function (req, res) {

  console.log(req.body)

  const editTemp = req.body.template;
  const Created_By = req.body.Created_By;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    try {
      const ExpenseTemplate = _ExpenseTemplate(sequelize, DataTypes);
      const as1 = await ExpenseTemplate.update({ Export_type: 33, Created_By: Created_By }, {
        where: {
          Template_Id: editTemp.id
        },
        transaction: t
      });
      t.commit();
      const template1 = await sequelize.query(`select distinct Template_Id as id, Template_Name as name from expense_template where export_type < 3`)
      return res.status(200).send({ status: true, data: template1[0] });

    } catch (e) {
      console.log(e);
      return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }

}
exports.updateExpenseTemplate = async function (req, res) {

  console.log(req.body)
  const columns = req.body.columns;
  const TemplateName = req.body.TemplateName;
  const Created_By = req.body.Created_By;
  const editTemp = req.body.editTemp;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    try {
      const ExpenseTemplate = _ExpenseTemplate(sequelize, DataTypes);
      const Existingtemplate = await sequelize.query(`select * from  expense_template where Template_Name = '${TemplateName}' and export_type < 3 and template_id != '${editTemp.id}'`)

      if (Existingtemplate[0].length) {
        return res.status(500).send({ status: false, Message: "Can not Create Duplicate Template", });
      }
      const template = await sequelize.query(`select isnull(max(Template_Id),0)+1 as Template_Id from expense_template`);
      const columns1 = ["DESCRIPTION", "LOCATION", "RATE", "QTY", "AMOUNT"];
      let tableFieldCounter = 1; // Counter for generating unique table fields

      let data = [];

      columns.forEach((item, index) => {
        const tableField = columns1.some(column => column === item.Field_Name) ? item.Field_Name : `F_${tableFieldCounter}`;
        const { UTD, ...rest } = item;

        // Increment the counter for the next iteration
        if (tableField.startsWith('F_')) {
          tableFieldCounter++;
        }
        data.push({
          ...rest,
          Created_By: Created_By,
          Template_Name: TemplateName,
          Template_Id: template[0][0].Template_Id,
          Export_type: 1,
          Table_field: tableField,
        });
      });
      console.log(data);
      const as1 = await ExpenseTemplate.update({ Export_type: 33, Created_By: Created_By }, {
        where: {
          Template_Id: editTemp.id
        },
        transaction: t
      });
      const as = await ExpenseTemplate.bulkCreate(data, { transaction: t });
      const UserTblUpdate = await sequelize.query(`WITH ParsedValues AS (
        SELECT 
                user_tbl.UTD, 
                user_tbl.Multi_Cash,
                LTRIM(RTRIM(m.value('.[1]', 'VARCHAR(8000)'))) AS value
            FROM user_tbl
            CROSS APPLY (
                SELECT CAST('<x>' + REPLACE(Multi_Cash, ',', '</x><x>') + '</x>' AS XML)
            ) AS t(x)
            CROSS APPLY t.x.nodes('/x') AS a(m)
            WHERE export_type < 3 
              AND module_code = 10
        ),
        FilteredRecords AS (
            SELECT DISTINCT UTD
            FROM ParsedValues
            WHERE value = '${editTemp.id}' 
        ),
        FilteredRecords2 AS (
            SELECT DISTINCT UTD
            FROM ParsedValues
            WHERE value = '${as[0].Template_Id}' 
        )
        UPDATE user_tbl SET Multi_Cash = 
        CASE
            WHEN CHARINDEX('${as[0].Template_Id}', Multi_Cash) = 0 
            THEN CONCAT(Multi_Cash, ',${as[0].Template_Id}') -- Appending new value
            ELSE Multi_Cash
        END 
        WHERE export_type < 3
          AND module_code = 10
          AND UTD IN (SELECT UTD FROM FilteredRecords)
          AND UTD NOT IN (SELECT UTD FROM FilteredRecords2);
      `, { transaction: t })
      t.commit();
      const template1 = await sequelize.query(`select distinct Template_Id as id, Template_Name as name from expense_template where export_type < 3`)
      return res.status(200).send({ status: true, data: template1[0] });

    } catch (e) {
      console.log(e);
      return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }

}
async function uploadImage2(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    // console.log(files);

    await Promise.all(files?.map(async (file, index) => {
      const customPath = `${Comp_Code}/BOOK_EXPENSE/`;
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
        console.error(`Error uploading image ${index}:`, error.message);
      }
      // Doc_Type	TRAN_ID	SRNO	path	File_Name	User_Name	Upload_Date	Export_type
    }));

    console.log(dataArray, 'dataArray');
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}
exports.saveExpense = async function (req, res) {
  console.log('hiii')
  const sequelize = await dbname(req.headers.compcode);
  const selectedTemp = req.body.selectedTemp;
  const Created_By = req.body.Created_By;
  const REMARK = req.body.Remark;
  const EMPCODE = req.body.EMPCODE;
  const LOCATION = req.body.selectedBranch;

  const missingFields = [];
  if (!selectedTemp) missingFields.push("selectedTemp");
  if (!Created_By) missingFields.push("Created_By");
  if (!REMARK) missingFields.push("Remark");
  if (!EMPCODE) missingFields.push("EMPCODE");
  console.log(missingFields);
  if (missingFields.length > 0) {
    return res.status(500).json({ error: "One or more required fields are missing.", missingFields });
  }
  const EMP_DOCS_data = await uploadImage2(
    req.files,
    req.headers.compcode?.split("-")[0],
    1,
  );
  const reqBody = req.body;

  const combinedData = EMP_DOCS_data.reduce((acc, doc) => {
    acc[doc.fieldname] = doc.path;
    return acc;
  }, {});
  console.log(combinedData)
  console.log({ ...reqBody, ...combinedData })
  const data = { ...reqBody, ...combinedData };
  const numberOfRows = Object.keys(data).length;

  const arrayOfObjects = [];

  for (let i = 0; i < numberOfRows; i++) {
    const rowKeyPrefix = `row${i}`;
    const properties = Object.keys(data)
      .filter(key => key.startsWith(rowKeyPrefix))
      .reduce((acc, key) => {
        acc[key.replace(`${rowKeyPrefix}_`, '')] = data[key];
        return acc;
      }, {});

    if (Object.keys(properties).length > 0) {
      arrayOfObjects.push(properties);
    } else {
      break;
    }
  }
  const template = await sequelize.query(`select UTD, Field_Name	,Field_Type,	Field_Req,	Field_Attr,Table_field,Template_Name from expense_template where template_id = ${req.body.selectedTemp}`)
  const constraints = template[0]?.reduce((acc, item) => {
    acc[item.Field_Name] = {
      Table_field: item.Table_field,
    };
    return acc;
  }, {});





  const mngDatatoCreate = {
    Template_Id: selectedTemp,
    Created_By: Created_By,
    REMARK: REMARK,
    EMP_CODE: EMPCODE,
    LOCATION: LOCATION
  }

  try {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    try {
      const ExpenseMng = _ExpenseMng(sequelize, DataTypes);
      const ExpenseMngDtl = _ExpenseMngDtl(sequelize, DataTypes);

      const mngData = await ExpenseMng.create(mngDatatoCreate, { transaction: t });
      console.log(mngData.Expense_Id);
      const transformedData = arrayOfObjects.map(item => {
        let newItem = {};
        for (let key in item) {
          if (constraints[key] && constraints[key].Table_field) {
            newItem[constraints[key].Table_field] = item[key];
          }
        }
        newItem.Template_Id = req.body.selectedTemp;
        newItem.Expense_Id = mngData.Expense_Id;
        newItem.Export_type = 1;
        return newItem;
      });
      console.log(transformedData);

      const as1 = await ExpenseMngDtl.bulkCreate(transformedData, {
        transaction: t
      });
      t.commit();
      try {
        const Appr_mobile = await sequelize.query(`select mobile_no,EMPFIRSTNAME from employeemaster where empcode in (select approver1_a from approval_matrix where empcode in ('${EMPCODE}') and module_code = 'EXPENSE')`);
        const emp_mobile = await sequelize.query(`select EMPFIRSTNAME from employeemaster where empcode in ('${EMPCODE}')`);
        const comapny = await sequelize.query(`select comp_name from comp_mst `);
        const expenseDetails = transformedData.map((expense, i) => {
          return `${i + 1}. ${expense.DESCRIPTION}, Amount: ${expense.AMOUNT};`
        }).join(', ');
        const totalAmount = transformedData.reduce((total, expense) => {
          const amount = parseFloat(expense.AMOUNT) || 0; // Ensure the amount is treated as a number
          return total + amount;
        }, 0);
        await SendWhatsAppMessgae(req.headers.compcode, Appr_mobile[0][0]?.mobile_no, "expense_utoa", [
          {
            type: "text",
            text: Appr_mobile[0][0].EMPFIRSTNAME,
          },
          {
            type: "text",
            text: template[0][0].Template_Name,
          },
          {
            type: "text",
            text: totalAmount,
          },
          {
            type: "text",
            text: emp_mobile[0][0].EMPFIRSTNAME,
          },
          {
            type: "text",
            text: `${new Date().toDateString()}`,
          },
          {
            type: "text",
            text: expenseDetails,
          },
          {
            type: "text",
            text: 'https://erp.autovyn.com/autovyn/expense/approveExpense',
          },
          {
            type: "text",
            text: comapny[0][0]?.comp_name,
          },
        ]);
      } catch (error) {

      }

    } catch (e) {
      console.log(e);
      return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error", });
  }
  return res.status(200).send({ status: true });

}
exports.viewExpense = async function (req, res) {
  try {
    const Appr_Code = req.body.EMPCODE;
    const location = req.body.location;
    const Team = req.body.Team;
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const sequelize = await dbname(req.headers.compcode);

    const result =
      await sequelize.query(`
              SELECT 
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                  where employeemaster.empcode =
                      (select top 1 iif(Appr_1_Code is not null,Appr_1_Code,
                      (select iif(Approver1_A = EMP_CODE , Approver1_A, iif(Approver1_B = EMP_CODE ,Approver1_B,Approver1_A))
                       from Approval_Matrix where module_code = 'EXPENSE' and   EMPCODE collate database_default = EMP_CODE collate database_default)
                      ))and   Export_Type < 3)
                as apr1_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                  where empcode =
                      (select iif(Appr_2_Code is not null,Appr_2_Code,
                      (select iif(Approver2_A = EMP_CODE , Approver2_A, iif(Approver2_B = EMP_CODE ,Approver2_B,Approver2_A))
                       from Approval_Matrix where  module_code = 'EXPENSE' and   EMPCODE collate database_default = emp_code collate database_default)))
                      and   Export_Type < 3) as apr2_name,
                     
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                  where empcode = 
                      (select iif(Appr_3_Code is not null,Appr_3_Code,
                      (select iif(Approver3_A = EMP_CODE ,Approver3_A,iif(Approver3_B = EMP_CODE ,Approver3_B,Approver3_A))
                       from Approval_Matrix where module_code = 'EXPENSE' and   EMPCODE collate database_default = emp_code collate database_default)))
                      and   Export_Type < 3) as apr3_name,
                      (select count(*) from expense_mng_dtl where expense_mng_dtl.expense_id = expense_mng.expense_id   )as total_exp,
                iif((SELECT top 1 empcode FROM Approval_Matrix WHERE EMP_CODE  
                   IN (approver1_A, approver1_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE EMP_CODE  
                   IN (approver2_A, approver2_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE EMP_CODE  
                   IN (approver3_A, approver3_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
                   ( select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                  where employeemaster.empcode = emp_code) as emp_name,
                   ( select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                  where employeemaster.empcode = Expense_Mng.created_by) as Created_emp_name,
                   (select godw_name from godown_mst where export_type <  3 and Godw_Code = location) as emp_location,
                   (select cast(round(sum(Amount),2)as varchar) from expense_mng_dtl where expense_mng_dtl.expense_id = expense_mng.expense_id   )as total,
                  (select top 1 template_name from Expense_Template where expense_mng.Template_Id=Expense_Template.Template_Id) as Template_Name,
                  iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE EMP_CODE  
                     IN (approver1_A, approver1_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE EMP_CODE  
                     IN (approver2_A, approver2_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE EMP_CODE  
                     IN (approver3_A, approver3_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
                     (
                      SELECT
                      e.Expense_Id,
                      e.UTD,
                      e.Template_Id,
                      e.DESCRIPTION,
                      e.RATE,
                      e.QTY,
                      e.AMOUNT,
                      (select top 1  godw_name from GODOWN_MST where Godw_Code = e.LOCATION and Export_type < 3) as LOCATION,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_1') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_1) AS F_1,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_2') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_2) AS F_2,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_3') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_3) AS F_3,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_4') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_4) AS F_4,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_5') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_5) AS F_5,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_6') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_6) AS F_6,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_7') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_7) AS F_7,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_8') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_8) AS F_8,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_9') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_9) AS F_9,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_10') =1,'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_10) AS F_10                  
                      FROM
                          Expense_Mng_Dtl e
                      WHERE
                          e.expense_id = Expense_Mng.expense_id
                      FOR JSON PATH , INCLUDE_NULL_VALUES
                  ) AS expense_details,
                  (select Field_Name as Header,Table_field as accessor from Expense_Template et where  et.Template_Id = Expense_Mng.Template_Id FOR JSON PATH) as column_array
                     ,* from Expense_Mng
                     where 
                     location in (${location}) and 
                       ${Appr_Code ? ` (EMP_CODE in ('${Appr_Code}') or Created_By = '${Appr_Code}'   ${Team ? ` or EMP_CODE in (select EMPCODE from employeemaster
                      where empcode in (SELECT empcode FROM Approval_Matrix WHERE '${Appr_Code}'
                      IN (approver1_A, approver1_B) and module_code = 'EXPENSE'))`: ''})` : ''}
                       ${Appr_Code && dateFrom ? 'and' : ''}
                      ${dateFrom ? `cast (Created_At as date) between '${dateFrom}' and '${dateto}'` : ''}
                         order by Expense_Id desc 
                     FOR JSON PATH , INCLUDE_NULL_VALUES
              `);
    const concatenatedJsonString = result[0]
      .map((item) => {
        const dynamicKey = Object.keys(item)[0];
        return item[dynamicKey];
      })
      .join('');

    const abcd = JSON.parse(concatenatedJsonString ? concatenatedJsonString : '[]');


    return res.status(200).send(abcd);
  } catch (e) {
    console.log(e);
    return res.status(500).send({ Messgae: 'Internal server error' });
  }
};
exports.ApproveViewExpense = async function (req, res) {

  try {
    const Appr_Code = req.body.EMPCODE;
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const location = req.body.location;

    const sequelize = await dbname(req.headers.compcode);

    const result =
      await sequelize.query(`select * from (
              SELECT 
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                  where employeemaster.empcode =
                      (select top 1 iif(Appr_1_Code is not null,Appr_1_Code,
                      (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                       from Approval_Matrix where module_code = 'EXPENSE' and   EMPCODE collate database_default = EMP_CODE collate database_default)
                      ))and   Export_Type < 3)
                as apr1_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                  where empcode =
                      (select iif(Appr_2_Code is not null,Appr_2_Code,
                      (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                       from Approval_Matrix where  module_code = 'EXPENSE' and   EMPCODE collate database_default = emp_code collate database_default)))
                      and   Export_Type < 3) as apr2_name,
                     
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                  where empcode = 
                      (select iif(Appr_3_Code is not null,Appr_3_Code,
                      (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                       from Approval_Matrix where module_code = 'EXPENSE' and   EMPCODE collate database_default = emp_code collate database_default)))
                      and   Export_Type < 3) as apr3_name,
                      (select count(*) from expense_mng_dtl where expense_mng_dtl.expense_id = expense_mng.expense_id   )as total_exp,
                iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
                   IN (approver1_A, approver1_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
                   IN (approver2_A, approver2_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
                   IN (approver3_A, approver3_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
                   ( select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                  where employeemaster.empcode = emp_code) as emp_name,
                   ( select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                  where employeemaster.empcode = Expense_Mng.created_by) as Created_emp_name,
                  (select godw_name from godown_mst where export_type <  3 and Godw_Code = location) as emp_location,
                  (select cast(round(sum(Amount),2)as varchar) from expense_mng_dtl where expense_mng_dtl.expense_id = expense_mng.expense_id   )as total,
                  (select top 1 template_name from Expense_Template where expense_mng.Template_Id=Expense_Template.Template_Id) as Template_Name,
                  iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
                     IN (approver1_A, approver1_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
                     IN (approver2_A, approver2_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
                     IN (approver3_A, approver3_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
                     (
                      SELECT
                      e.Expense_Id,
                      e.UTD,
                      e.Template_Id,
                      e.DESCRIPTION,
                      e.RATE,
                      e.QTY,
                      e.AMOUNT,
                      (select top 1  godw_name from GODOWN_MST where Godw_Code = e.LOCATION and Export_type < 3) as LOCATION,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_1') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_1) AS F_1,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_2') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_2) AS F_2,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_3') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_3) AS F_3,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_4') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_4) AS F_4,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_5') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_5) AS F_5,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_6') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_6) AS F_6,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_7') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_7) AS F_7,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_8') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_8) AS F_8,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_9') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_9) AS F_9,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_10') =1,'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_10) AS F_10                  
                      FROM
                          Expense_Mng_Dtl e
                      WHERE
                          e.expense_id = Expense_Mng.expense_id
                      FOR JSON PATH , INCLUDE_NULL_VALUES
                  ) AS expense_details,
                  (select Field_Name as Header,Table_field as accessor from Expense_Template et where  et.Template_Id = Expense_Mng.Template_Id FOR JSON PATH) as column_array
                     ,* from Expense_Mng where location in (${location}) ${dateFrom ? ` and cast (Created_At as date) between '${dateFrom}' and '${dateto}' and` : ''}  EMP_CODE in (select empcode from approval_matrix where 
          '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B) ) ) as ab where (status_khud_ka is not null and status_appr is not null)
          or (status_khud_ka is null and status_appr is null) order by Expense_Id desc
                     FOR JSON PATH , INCLUDE_NULL_VALUES
              `);

    const concatenatedJsonString = result[0]
      .map((item) => {
        const dynamicKey = Object.keys(item)[0];
        return item[dynamicKey];
      })
      .join('');

    const abcd = JSON.parse(concatenatedJsonString ? concatenatedJsonString : '[]');
    // console.log(abcd, 'approveexdododododo')
    return res.status(200).send(abcd);
  } catch (e) {
    console.log(e);
    return res.status(500).send({ Messgae: 'Internal server error' });
  }
};
exports.approveMainExpense = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    // const Approved_Amt = req.body.Approved_Amt;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (Appr_Code == "" || Appr_Code == undefined || Appr_Code == null) {
      return res.status(500).send({
        status: false,
        Message: "Appr_Code is mandatory",
      });
    }
    // if (Remark == "" || Remark == undefined || Remark == null) {
    //   return res.status(500).send({
    //     status: false,
    //     Message: "Remark is mandatory",
    //   });
    // }
    if (
      req.body.tran_id == "" ||
      req.body.tran_id == undefined ||
      req.body.tran_id == null
    ) {
      return res.status(500).send({
        status: false,
        Message: "please select the entry to approve",
      });
    }
    // mainData.map(async (item, index) => {
    const t = await sequelize.transaction();
    const t2 = await sequelize.transaction();
    const c = mainData;
    const empcode = c?.EMP_CODE;
    const tran_id = c?.Expense_Id;
    const expense_details = c?.expense_details;

    try {
      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode  = '${empcode}' and module_code = 'EXPENSE'`,
        { transaction: t2 }
      );
      if (a[0]?.length > 0) {
        let ApprovalLevel = 0;
        let Final_apprvl = 0;
        let rowsAffected = 0;
        const Approver_1A = a[0][0]?.approver1_A;
        const Approver_1B = a[0][0]?.approver1_B;
        const Approver_2A = a[0][0]?.approver2_A;
        const Approver_2B = a[0][0]?.approver2_B;
        const Approver_3A = a[0][0]?.approver3_A;
        const Approver_3B = a[0][0]?.approver3_B;

        if (Approver_1A?.toUpperCase() == Appr_Code?.toUpperCase() || Approver_1B?.toUpperCase() == Appr_Code?.toUpperCase()) {
          ApprovalLevel = 1;
        } else if (Approver_2A?.toUpperCase() == Appr_Code?.toUpperCase() || Approver_2B?.toUpperCase() == Appr_Code?.toUpperCase()) {
          ApprovalLevel = 2;
        } else if (Approver_3A?.toUpperCase() == Appr_Code?.toUpperCase() || Approver_3B?.toUpperCase() == Appr_Code?.toUpperCase()) {
          ApprovalLevel = 3;
        }
        if (
          ApprovalLevel == 2 && !a[0][0].approver3_A && !a[0][0].approver3_B && !a[0][0].approver3_C
        ) {
          Final_apprvl = 1;
        } else if (ApprovalLevel == 1 && !a[0][0].approver2_A && !a[0][0].approver2_B && !a[0][0].approver2_C) {
          Final_apprvl = 1;
        }
        if (ApprovalLevel == 0) {
          return res.status(500).send({
            status: false,
            Message: "you are not the right person to approve this",
          });
        }

        if (ApprovalLevel == 1) {
          const data = {
            Appr_1_Code: Appr_Code,
            Appr_1_Stat: 1,
            Fin_Appr: Final_apprvl == 1 ? 1 : null,
          };
          const affectedRowsCount = await sequelize.query(
            `UPDATE Expense_Mng
              SET 
                  Appr_1_Code ='${data.Appr_1_Code}', 
                  Appr_1_Stat =1, 
                  Appr_1_Rem=${Remark},
                  Fin_Appr = ${data.Fin_Appr}
                  OUTPUT deleted.Expense_Id 
              WHERE 
                  Expense_Id =${tran_id} AND 
                  Appr_1_Stat IS NULL AND 
                  Fin_Appr IS NULL;`,
            { transaction: t2 }
          );

          rowsAffected = affectedRowsCount[0].length;
          console.log(rowsAffected, "asdkaskdjldas");
        } else if (ApprovalLevel == 2) {
          const data = {
            Appr_2_Code: Appr_Code,
            Appr_2_Stat: 1,
            Fin_Appr: Final_apprvl == 1 ? 1 : null,
          };
          const affectedRowsCount = await sequelize.query(
            `UPDATE Expense_Mng
            SET 
                Appr_2_Code ='${data.Appr_2_Code}', 
                Appr_2_Stat =1, 
                Appr_2_Rem=${Remark},
                Fin_Appr = ${data.Fin_Appr}
                OUTPUT deleted.Expense_Id 
            WHERE 
                Expense_Id =${tran_id} AND 
                Appr_2_Stat IS NULL AND 
                Appr_1_Stat IS not NULL AND 
                Fin_Appr IS NULL;`,
            { transaction: t2 }
          );

          rowsAffected = affectedRowsCount[0].length;
          console.log(rowsAffected, "asdkaskdjldas");
        } else if (ApprovalLevel == 3) {
          Final_apprvl = 1;
          const data = {
            Appr_3_Code: Appr_Code,
            Appr_3_Stat: 1,
            Fin_Appr: 1,
          };
          const affectedRowsCount =
            await sequelize.query(
              `UPDATE Expense_Mng
            SET 
                Appr_3_Code ='${data.Appr_3_Code}', 
                Appr_3_Stat =1, 
                Appr_3_Rem=${Remark},
                Fin_Appr = ${data.Fin_Appr}
                OUTPUT deleted.Expense_Id 
            WHERE 
                Expense_Id =${tran_id} AND 
                Appr_3_Stat IS NULL AND 
                Appr_2_Stat IS not NULL AND 
                Fin_Appr IS NULL;`,
              { transaction: t2 }
            );
          rowsAffected = affectedRowsCount[0].length;
          console.log(rowsAffected, "asdkaskdjldas");
        }

        t2.commit();
        if (rowsAffected == 0) {
          return res
            .status(500)
            .send({ success: true, Message: 'Can Not Approve' });
        }
        const dataaaa = await sequelize.query(`SELECT 
          em1.mobile_no AS approver1_mobile, 
          em1.EMPFIRSTNAME AS approver1_name,
          em2.mobile_no AS approver2_mobile, 
          em2.EMPFIRSTNAME AS approver2_name,
          em3.mobile_no AS approver3_mobile, 
          em3.EMPFIRSTNAME AS approver3_name,
          emp.mobile_no AS employee_mobile, 
          emp.EMPFIRSTNAME AS employee_name,
          cm.comp_name AS company_name
      FROM 
          approval_matrix am
      LEFT JOIN employeemaster em1 ON am.approver1_a = em1.empcode
      LEFT JOIN employeemaster em2 ON am.approver2_A = em2.empcode
      LEFT JOIN employeemaster em3 ON am.approver3_A = em3.empcode
      LEFT JOIN employeemaster emp ON am.empcode = emp.empcode
      CROSS JOIN comp_mst cm
      WHERE 
          am.empcode = '${empcode}' AND 
          am.module_code = 'EXPENSE';`);
        const expenseDetails = expense_details.map((expense, i) => {
          return `${i + 1}. ${expense.DESCRIPTION}, Amount: ${expense.AMOUNT};`
        }).join(' | ');
        const totalAmount = expense_details.reduce((total, expense) => {
          const amount = parseFloat(expense.AMOUNT) || 0; // Ensure the amount is treated as a number
          return total + amount;
        }, 0);

        if (Final_apprvl == 1) {
          await SendWhatsAppMessgae(req.headers.compcode, dataaaa[0][0].employee_mobile, "expense_final_approval", [
            {
              type: "text",
              text: dataaaa[0][0].employee_name,
            },
            {
              type: "text",
              text: expenseDetails?.slice(0, 200),
            },
            {
              type: "text",
              text: Remark ? Remark : "N/A",
            },
            {
              type: "text",
              text: `${c?.Template_Name} - ${totalAmount}`,
            },
            {
              type: "text",
              text: ApprovalLevel == 1 ? dataaaa[0][0].approver1_name : ApprovalLevel == 2
                ? dataaaa[0][0].approver2_name : ApprovalLevel == 3
                  ? dataaaa[0][0].approver3_name : "--",
            },
            {
              type: "text",
              text: dataaaa[0][0]?.company_name,
            },
          ]);
          return res.status(200).send({ success: true, Message: "Final Approval Done" });
        } else {
          if (ApprovalLevel == 1) {

            // From level 1 , 2 to user
            await SendWhatsAppMessgae(req.headers.compcode, dataaaa[0][0].employee_mobile, "expense_approve_1", [
              {
                type: "text",
                text: dataaaa[0][0].employee_name,
              },
              {
                type: "text",
                text: expenseDetails?.slice(0, 200),
              },
              {
                type: "text",
                text: Remark ? Remark : "N/A",
              },
              {
                type: "text",
                text: `${c?.Template_Name} - ${totalAmount}`,
              },
              {
                type: "text",
                text: dataaaa[0][0].approver1_name,
              },
              {
                type: "text",
                text: dataaaa[0][0]?.company_name,
              },
            ]);

            // to Nexe Level 
            await SendWhatsAppMessgae(req.headers.compcode, dataaaa[0][0]?.approver2_mobile, "expense_utoa", [
              {
                type: "text",
                text: dataaaa[0][0].approver2_name,
              },
              {
                type: "text",
                text: c?.Template_Name,
              },
              {
                type: "text",
                text: totalAmount,
              },
              {
                type: "text",
                text: dataaaa[0][0].employee_name,
              },
              {
                type: "text",
                text: `${new Date(c?.Created_At).toDateString()}`,
              },
              {
                type: "text",
                text: expenseDetails,
              },
              {
                type: "text",
                text: 'https://erp.autovyn.com/autovyn/expense/approveExpense',
              },
              {
                type: "text",
                text: dataaaa[0][0]?.company_name,
              },
            ]);
            return res.status(200).send({ success: true, Message: "Approved on level 1" });
          }
          if (ApprovalLevel == 2) {
            await SendWhatsAppMessgae(req.headers.compcode, dataaaa[0][0].employee_mobile, "expense_approve_1", [
              {
                type: "text",
                text: dataaaa[0][0].employee_name,
              },
              {
                type: "text",
                text: expenseDetails?.slice(0, 200),
              },
              {
                type: "text",
                text: Remark ? Remark : "N/A",
              },
              {
                type: "text",
                text: `${c?.Template_Name} - ${totalAmount}`,
              },
              {
                type: "text",
                text: dataaaa[0][0].approver2_name,
              },
              {
                type: "text",
                text: dataaaa[0][0]?.company_name,
              },
            ]);

            // to Nexe Level 
            await SendWhatsAppMessgae(req.headers.compcode, dataaaa[0][0]?.approver3_mobile, "expense_utoa", [
              {
                type: "text",
                text: dataaaa[0][0].approver3_name,
              },
              {
                type: "text",
                text: c?.Template_Name,
              },
              {
                type: "text",
                text: totalAmount,
              },
              {
                type: "text",
                text: dataaaa[0][0].employee_name,
              },
              {
                type: "text",
                text: `${new Date(c?.Created_At).toDateString()}`,
              },
              {
                type: "text",
                text: expenseDetails,
              },
              {
                type: "text",
                text: 'https://erp.autovyn.com/autovyn/expense/approveExpense',
              },
              {
                type: "text",
                text: dataaaa[0][0]?.company_name,
              },
            ]);
            return res.status(200).send({ success: true, Message: "Approved on level 2" });
          }
          if (ApprovalLevel == 3) {
            return res.status(200).send({ success: true, Message: "Approved on level 3" });
          }
        }
      }
    } catch (e) {
      console.log(e);
      t.rollback();
      t2.rollback();
      return res
        .status(500)
        .send({ status: false, Message: "Internal Server Error" });
    }
    // });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};
exports.rejectMainExpense = async function (req, res) {
  try {
    console.log('aaya ider')
    console.log(req.body.tran_id)
    console.log(req.body.Appr_Code)
    console.log(req.body.Remark)
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (Appr_Code == "" || Appr_Code == undefined || Appr_Code == null) {
      return res.status(500).send({
        status: false,
        Message: "Appr_Code is mandatory",
      });
    }
    if (Remark == "" || Remark == undefined || Remark == null) {
      return res.status(500).send({
        status: false,
        Message: "Remark is mandatory",
      });
    }
    if (
      req.body.tran_id == "" ||
      req.body.tran_id == undefined ||
      req.body.tran_id == null
    ) {
      return res.status(500).send({
        status: false,
        Message: "please select the entry to approve",
      });
    }
    // mainData.map(async (item, index) => {
    const t2 = await sequelize.transaction();
    const c = mainData;
    const empcode = c?.EMP_CODE;
    const tran_id = c?.Expense_Id;
    const expense_details = c?.expense_details;

    try {
      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode  = '${empcode}' and module_code = 'EXPENSE'`,
        { transaction: t2 }
      );

      if (a[0]?.length > 0) {
        let ApprovalLevel = 0;
        let Final_apprvl = 1;
        let rowsAffected = 0;
        const Approver_1A = a[0][0]?.approver1_A;
        const Approver_1B = a[0][0]?.approver1_B;
        const Approver_2A = a[0][0]?.approver2_A;
        const Approver_2B = a[0][0]?.approver2_B;
        const Approver_3A = a[0][0]?.approver3_A;
        const Approver_3B = a[0][0]?.approver3_B;

        if (Approver_1A?.toUpperCase() == Appr_Code?.toUpperCase() || Approver_1B?.toUpperCase() == Appr_Code?.toUpperCase()) {
          ApprovalLevel = 1;
        } else if (Approver_2A?.toUpperCase() == Appr_Code?.toUpperCase() || Approver_2B?.toUpperCase() == Appr_Code?.toUpperCase()) {
          ApprovalLevel = 2;
        } else if (Approver_3A?.toUpperCase() == Appr_Code?.toUpperCase() || Approver_3B?.toUpperCase() == Appr_Code?.toUpperCase()) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel == 0) {
          return res.status(500).send({
            status: false,
            Message: "you are not the right person to approve this",
          });
        }

        if (ApprovalLevel == 1) {
          const data = { Appr_1_Code: Appr_Code };
          const affectedRowsCount =
            await sequelize.query(
              `UPDATE Expense_Mng
            SET 
                Appr_1_Code ='${data.Appr_1_Code}', 
                Appr_1_Stat = 0, 
                Appr_1_Rem=${Remark},
                Fin_Appr = 0
                OUTPUT deleted.Expense_Id 
            WHERE 
                Expense_Id =${tran_id} AND 
                Appr_1_Stat IS NULL AND 
                Fin_Appr IS NULL;`,
              { transaction: t2 }
            );

          rowsAffected = affectedRowsCount[0].length;
          console.log(rowsAffected, "asdkaskdjldas");
        } else if (ApprovalLevel == 2) {
          const data = { Appr_2_Code: Appr_Code };
          const affectedRowsCount = await sequelize.query(
            `UPDATE Expense_Mng
            SET 
                Appr_2_Code ='${data.Appr_2_Code}', 
                Appr_2_Stat = 0, 
                Appr_2_Rem=${Remark},
                Fin_Appr = 0
                OUTPUT deleted.Expense_Id 
            WHERE 
                Expense_Id =${tran_id} AND 
                Appr_2_Stat IS NULL AND 
                Appr_1_Stat IS not NULL AND 
                Fin_Appr IS NULL;`,
            { transaction: t2 }
          );

          rowsAffected = affectedRowsCount[0].length;
          console.log(rowsAffected, "asdkaskdjldas");
        } else if (ApprovalLevel == 3) {
          Final_apprvl = 1;
          const data = { Appr_3_Code: Appr_Code };
          const affectedRowsCount = await sequelize.query(
            `UPDATE Expense_Mng
            SET 
                Appr_3_Code ='${data.Appr_3_Code}', 
                Appr_3_Stat = 0, 
                Appr_3_Rem=${Remark},
                Fin_Appr = 0
                OUTPUT deleted.Expense_Id
            WHERE 
                Expense_Id =${tran_id} AND 
                Appr_3_Stat IS NULL AND 
                Appr_2_Stat IS not NULL AND 
                Fin_Appr IS NULL;`,
            { transaction: t2 }
          );

          rowsAffected = affectedRowsCount[0].length;
          console.log(rowsAffected, "asdkaskdjldas");
        }

        t2.commit();
        if (rowsAffected == 0) {
          return res.status(500).send({ success: true, Message: 'Can Not Reject' });
        }
        const dataaaa = await sequelize.query(`SELECT 
                em1.mobile_no AS approver1_mobile, 
                em1.EMPFIRSTNAME AS approver1_name,
                em2.mobile_no AS approver2_mobile, 
                em2.EMPFIRSTNAME AS approver2_name,
                em3.mobile_no AS approver3_mobile, 
                em3.EMPFIRSTNAME AS approver3_name,
                emp.mobile_no AS employee_mobile, 
                emp.EMPFIRSTNAME AS employee_name,
                cm.comp_name AS company_name
            FROM 
                approval_matrix am
            LEFT JOIN employeemaster em1 ON am.approver1_a = em1.empcode
            LEFT JOIN employeemaster em2 ON am.approver2_A = em2.empcode
            LEFT JOIN employeemaster em3 ON am.approver3_A = em3.empcode
            LEFT JOIN employeemaster emp ON am.empcode = emp.empcode
            CROSS JOIN comp_mst cm
            WHERE 
                am.empcode = '${empcode}' AND 
                am.module_code = 'EXPENSE';`);
        const expenseDetails = expense_details.map((expense, i) => {
          return `${i + 1}. ${expense.DESCRIPTION}, Amount: ${expense.AMOUNT};`
        }).join(' | ');
        const totalAmount = expense_details.reduce((total, expense) => {
          const amount = parseFloat(expense.AMOUNT) || 0; // Ensure the amount is treated as a number
          return total + amount;
        }, 0);
        await SendWhatsAppMessgae(req.headers.compcode, dataaaa[0][0]?.employee_mobile, "expense_reject", [
          {
            type: "text",
            text: dataaaa[0][0].employee_name,
          },
          {
            type: "text",
            text: expenseDetails?.slice(0, 200),
          },
          {
            type: "text",
            text: Remark ? Remark : "N/A",
          },
          {
            type: "text",
            text: `${c?.Template_Name} - ${totalAmount}`,
          },
          {
            type: "text",
            text: ApprovalLevel == 1 ? dataaaa[0][0].approver1_name : ApprovalLevel == 2
              ? dataaaa[0][0].approver2_name : ApprovalLevel == 3
                ? dataaaa[0][0].approver3_name : "--",
          },
          {
            type: "text",
            text: dataaaa[0][0]?.company_name,
          },
        ]);
        if (Final_apprvl == 1) {
          return res.status(200).send({ success: true, Message: 'Request Rejected successfully' });
        } else {
          if (ApprovalLevel == 1) {
            return res.status(200).send({ success: true, Message: 'Rejection on level 1' });
          }
          if (ApprovalLevel == 2) {
            return res.status(200).send({ success: true, Message: 'Rejection on level 2' });
          }
          if (ApprovalLevel == 3) {
            return res.status(200).send({ success: true, Message: 'Rejection on level 3' });
          }
        }
      }
    } catch (e) {
      console.log(e);
      t2.rollback();
      // return res
      //   .status(500)
      //   .send({ status: false, Message: "Internal Server Error" });
    }
    // });
    return res.status(200).send({
      success: true,
      Message: "Request Rejected Successfully",
    });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};
exports.dashboard = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  // const Insu_Entry = _Insu_Entry(sequelize, DataTypes);
  let { monthFrom, monthTo, year, branch } = req.body;

  const t = await sequelize.transaction();
  try {

    const allresult = await sequelize.query(
      `select 
 count(*) as total_count,
  isnull(SUM(IIF(appr_1_stat = 1 , 1, 0)),0) AS approvedby1,
  isnull(SUM(IIF(appr_1_stat = 0 , 1, 0)),0) AS rejectedby1,
  isnull(SUM(IIF(appr_1_stat IS NULL, 1, 0)),0) AS pendingat1,
  isnull(SUM(IIF(appr_2_stat = 1 , 1, 0)),0) AS approvedby2,
  isnull(SUM(IIF(appr_2_stat = 0 , 1, 0)),0) AS rejectedby2,
  isnull(SUM(IIF((appr_2_stat is null and  appr_1_stat=1), 1, 0)),0) AS pendingat2
  from (
  select * 
    FROM Expense_Mng g where location in (${branch}) and  year(Created_At) = '${year}' and month(created_at) = '${monthFrom}'
  ) as dad 

      `,
      { transaction: t }
    );


    const dashboard = await sequelize.query(`
      select (select top 1 TEMPLATE_NAME from Expense_Template where
	Expense_Template.Template_Id = Expense_Mng_Dtl.Template_Id) as Template_Name,
	sum(AMOUNT) as Amount
	from Expense_Mng_Dtl
	  where location in (${branch}) and year(Created_At) = '${year}' and month(created_at) = '${monthFrom}'
	group by Template_Id
 `);

    if (monthFrom == 1) {
      monthFrom = 12;
      year = year - 1;
    } else {
      monthFrom = monthFrom - 1;
    }
    const allresultprevios = await sequelize.query(
      `
      select 
 count(*) as total_count,
  isnull(SUM(IIF(appr_1_stat = 1 , 1, 0)),0) AS approvedby1,
  isnull(SUM(IIF(appr_1_stat = 0 , 1, 0)),0) AS rejectedby1,
  isnull(SUM(IIF(appr_1_stat IS NULL, 1, 0)),0) AS pendingat1,
  isnull(SUM(IIF(appr_2_stat = 1 , 1, 0)),0) AS approvedby2,
  isnull(SUM(IIF(appr_2_stat = 0 , 1, 0)),0) AS rejectedby2,
  isnull(SUM(IIF((appr_2_stat is null and  appr_1_stat=1), 1, 0)),0) AS pendingat2
  from (
  select * 
    FROM Expense_Mng g 
    where g.location in (${branch}) and year(Created_At) = '${year}' and month(created_at) = '${monthFrom}'
  ) as dad 
        `,
      { transaction: t }
    );
    const dashboard1 = await sequelize.query(`
        select (select top 1 TEMPLATE_NAME from Expense_Template where
    Expense_Template.Template_Id = Expense_Mng_Dtl.Template_Id) as Template_Name,
    sum(AMOUNT) as Amount
    from Expense_Mng_Dtl
      where location in (${branch}) and year(Created_At) = '${year}' and month(created_at) = '${monthFrom}'
    group by Template_Id
 `);
    // const combinedObject = {
    //   Total_Target: allresult[0][0].total || 0,
    //   Total_Assign: allresult[0][1].total || 0,
    //   Total_Pending: allresult[0][2].total || 0,
    //   Total_Open: allresult[0][3].total || 0,
    //   Total_Lost: allresult[0][4].total || 0,
    //   Total_Closed: allresult[0][5].total || 0,
    // };
    // const combinedObjectPrev = {
    //   Total_Target: allresultprevios[0][0].total || 0,
    //   Total_Assign: allresultprevios[0][1].total || 0,
    //   Total_Pending: allresultprevios[0][2].total || 0,
    //   Total_Open: allresultprevios[0][3].total || 0,
    //   Total_Lost: allresultprevios[0][4].total || 0,
    //   Total_Closed: allresultprevios[0][5].total || 0,
    // };
    await t.commit();
    res.status(200).send({
      current: allresult[0],
      previous: allresultprevios[0],
      dashboard: dashboard[0],
      dashboard1: dashboard1[0],
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.viewExpenseLOcationReport = async function (req, res) {
  try {
    const Appr_Code = req.body.EMPCODE;
    const location = req.body.location;
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const sequelize = await dbname(req.headers.compcode);

    const result =
      await sequelize.query(`
              SELECT 
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                  where employeemaster.empcode =
                      (select top 1 iif(Appr_1_Code is not null,Appr_1_Code,
                      (select iif(Approver1_A = EMP_CODE , Approver1_A, iif(Approver1_B = EMP_CODE ,Approver1_B,Approver1_A))
                       from Approval_Matrix where module_code = 'EXPENSE' and   EMPCODE collate database_default = EMP_CODE collate database_default)
                      ))and   Export_Type < 3)
                as apr1_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                  where empcode =
                      (select iif(Appr_2_Code is not null,Appr_2_Code,
                      (select iif(Approver2_A = EMP_CODE , Approver2_A, iif(Approver2_B = EMP_CODE ,Approver2_B,Approver2_A))
                       from Approval_Matrix where  module_code = 'EXPENSE' and   EMPCODE collate database_default = emp_code collate database_default)))
                      and   Export_Type < 3) as apr2_name,
                     
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                  where empcode = 
                      (select iif(Appr_3_Code is not null,Appr_3_Code,
                      (select iif(Approver3_A = EMP_CODE ,Approver3_A,iif(Approver3_B = EMP_CODE ,Approver3_B,Approver3_A))
                       from Approval_Matrix where module_code = 'EXPENSE' and   EMPCODE collate database_default = emp_code collate database_default)))
                      and   Export_Type < 3) as apr3_name,
                      (select count(*) from expense_mng_dtl where expense_mng_dtl.expense_id = expense_mng.expense_id   )as total_exp,
                iif((SELECT top 1 empcode FROM Approval_Matrix WHERE EMP_CODE  
                   IN (approver1_A, approver1_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE EMP_CODE  
                   IN (approver2_A, approver2_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE EMP_CODE  
                   IN (approver3_A, approver3_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
                   ( select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                  where employeemaster.empcode = emp_code) as emp_name,
                   ( select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                  where employeemaster.empcode = Expense_Mng.created_by) as Created_emp_name,
                   (select godw_name from godown_mst where export_type <  3 and Godw_Code = location) as emp_location,
                   (select cast(round(sum(Amount),2)as varchar) from expense_mng_dtl where expense_mng_dtl.expense_id = expense_mng.expense_id   )as total,
                  (select top 1 template_name from Expense_Template where expense_mng.Template_Id=Expense_Template.Template_Id) as Template_Name,
                  iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE EMP_CODE  
                     IN (approver1_A, approver1_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE EMP_CODE  
                     IN (approver2_A, approver2_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE EMP_CODE  
                     IN (approver3_A, approver3_B) and module_code = 'EXPENSE' and EMPCODE collate database_default = emp_code collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
                     (
                      SELECT
                      e.Expense_Id,
                      e.UTD,
                      e.Template_Id,
                      e.DESCRIPTION,
                      e.RATE,
                      e.QTY,
                      e.AMOUNT,
                      (select top 1  godw_name from GODOWN_MST where Godw_Code = e.LOCATION and Export_type < 3) as LOCATION,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_1') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_1) AS F_1,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_2') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_2) AS F_2,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_3') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_3) AS F_3,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_4') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_4) AS F_4,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_5') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_5) AS F_5,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_6') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_6) AS F_6,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_7') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_7) AS F_7,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_8') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_8) AS F_8,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_9') =1, 'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_9) AS F_9,
                      CONCAT(iif( (SELECT 1 FROM Expense_Template f WHERE f.Template_Id = e.Template_Id AND f.Field_Type = 'doc' AND f.Table_field = 'F_10') =1,'https://erp.autovyn.com/backend/fetch?filePath=' , null ),e.F_10) AS F_10                  
                      FROM
                          Expense_Mng_Dtl e
                      WHERE
                          e.expense_id = Expense_Mng.expense_id
                      FOR JSON PATH , INCLUDE_NULL_VALUES
                  ) AS expense_details,
                  (select Field_Name as Header,Table_field as accessor from Expense_Template et where  et.Template_Id = Expense_Mng.Template_Id FOR JSON PATH) as column_array
                     ,* from Expense_Mng
                      where
                      location in (${location}) 
                      ${dateFrom ? ` and  cast (Created_At as date) between '${dateFrom}' and '${dateto}'` : ''}
                         order by Expense_Id desc 
                     FOR JSON PATH , INCLUDE_NULL_VALUES
              `);
    const concatenatedJsonString = result[0]
      .map((item) => {
        const dynamicKey = Object.keys(item)[0];
        return item[dynamicKey];
      })
      .join('');

    const abcd = JSON.parse(concatenatedJsonString ? concatenatedJsonString : '[]');


    return res.status(200).send(abcd);
  } catch (e) {
    console.log(e);
    return res.status(500).send({ Messgae: 'Internal server error' });
  }
};