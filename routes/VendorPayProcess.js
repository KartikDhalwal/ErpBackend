const { Sequelize, DataTypes, literal, Transaction } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const { v4: uuidv4 } = require('uuid');
const FormData = require("form-data");
const axios = require("axios");
const bodyParser = require("body-parser");
const path = require('path');


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

exports.ApprovalWindow = async function (req, res) {
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
    if (req.body.type == "" || req.body.type == undefined || req.body.type == null) {
      return res.status(500).send({
        status: false,
        Message: "type is mandatory",
      });
    }
    if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
      return res.status(500).send({
        status: false,
        Message: "dateFrom is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);
    let query = ``;
    if (req.body.type == 'approved') {
      query = `ap.API_Book = 1 and ap.export_type < 3 and Seq_No = 2`;
    } else if (req.body.type == 'rejected') {
      query = `ap.API_Book = 1 and ap.export_type = 5 and Seq_No = 2`;
    } else if (req.body.type == 'pending') {
      query = `ap.API_Book = 1 and ap.export_type = 99 and Seq_No = 2 and bp.STATUS is null`;
    } else if (req.body.type == 'failed') {
      query = `ap.API_Book = 1 and ap.export_type = 99 and Seq_No = 2 and bp.STATUS = 'FAILED'`;
    }
    const data = await sequelize.query(`
      select 
--ap.export_type,ap.API_Book,ap.bank_api,ap.seq_no,
bp.UTR,bp.BANK_RESPONSE,bp.DATED as TRF_DATE,bp.TRF_AMT,bp.BANK_NARR,
bp.STATUS,ap.Book_Code,ap.Ledg_Ac,lm.Ac_No1,lm.Ifsc_Code1,
ap.acnt_id,ap.Acnt_Date,(select top 1 book_name from book_mst where book_mst.book_Code = ap.book_code)as vch_type,
am.Pymt_type,am.Party_Name,
(select top 1 godw_name from godown_mst where godown_mst.godw_code = ap.loc_code)as Location,
ap.Post_Amt,ap.loc_code,
(select iif(bp.Approver_1 is not null,(select top 1 user_name from user_tbl where user_code = bp.Approver_1 and   Export_Type < 3),
(select iif(bc.Approver_1  = '${userId}',bc.Approver_1,iif(bc.Approver_1B = '${userId}',bc.Approver_1B,
iif(bc.Approver_1C = '${userId}',bc.Approver_1C,bc.Approver_1)))from bank_config bc where Branch_Code = ap.Loc_Code and   Export_Type < 3))) as apr1_name,
(select iif(bp.Approver_2 is not null,(select top 1 user_name from user_tbl where user_code = bp.Approver_2 and   Export_Type < 3),
(select iif(bc.Approver_2  = '${userId}',bc.Approver_2,iif(bc.Approver_2B = '${userId}',bc.Approver_2B,
iif(bc.Approver_2C = '${userId}',bc.Approver_2C,bc.Approver_2)))from bank_config bc where Branch_Code = ap.Loc_Code and   Export_Type < 3))) as apr2_name,
(select iif(bp.Approver_3 is not null,(select top 1 user_name from user_tbl where user_code = bp.Approver_3 and   Export_Type < 3),
(select iif(bc.Approver_3  = '${userId}',bc.Approver_3,iif(bc.Approver_3B = '${userId}',bc.Approver_3B,
iif(bc.Approver_3C = '${userId}',bc.Approver_3C,bc.Approver_3)))from bank_config bc where Branch_Code = ap.Loc_Code and   Export_Type < 3))) as apr3_name,
iif((bp.Reject_1 is null and bp.Reject_2 is null and bp.Reject_3 is null),iif(bp.Approver_3 is null,iif(bp.Approver_2  is null,iif(bp.Approver_1 is null ,1,2),3),4),4) as stat,
(select top 1 path from DOC_UPLOAD where Doc_Type = 'CHQ' and tran_id = ap.ledg_ac and export_type < 3) as chqImage,
bp.Approver_1,bp.App1_Date,bp.App1_Time,bp.App1_Rem,bp.Approver_2,bp.App2_Date,bp.App2_Time,bp.App2_Rem,bp.Approver_3,bp.App3_Date,bp.App3_Time,bp.App3_Rem,bp.Reject_1,bp.Rej1_Date,bp.Rej1_Time,bp.Rej1_Rem,
bp.Reject_2,bp.Rej2_Date,bp.Rej2_Time,bp.Rej2_Rem,bp.Reject_3,bp.Rej3_Date,bp.Rej3_Time,bp.Rej3_Rem
from acnt_post ap
left join Ledg_Mst lm on lm.Ledg_Code = ap.Ledg_Ac
left join acnt_mail am on am.acnt_id = ap.acnt_id
left join bank_post bp on bp.acnt_id = ap.acnt_id
where 
ap.loc_code in (${loc_code}) and ${query} and ap.Acnt_Date between '${dateFrom}' and '${dateTo}'`);

    await sequelize.close();
    res.status(200).send({ success: true, data: data[0] });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  }
};


exports.PaymentApprove = async function (req, res) {
  try {
    const acnt_id = req.body.acnt_id;
    const userId = req.body.user_code;
    const loc_code = req.body.loc_code;
    if (acnt_id == "" || acnt_id == undefined || acnt_id == null) {
      return res.status(500).send({
        status: false,
        Message: "acnt_id is mandatory",
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
    const sequelize = await dbname(req.headers.compcode);
    const data = sequelize.query(`select lm.*,ap.*
from acnt_post  ap
left join Ledg_Mst lm on lm.Ledg_Code = ap.Ledg_Ac
where acnt_id = ${acnt_id}`);
    await sequelize.close();
    res.status(200).send({ success: true, data: data[0] });
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ success: "false", message: "Internal Server Error" });
  }
};