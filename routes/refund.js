const { dbname } = require("../utils/dbconfig");
const { Sequelize, DataTypes, literal } = require("sequelize");
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FormData = require("form-data");
const axios = require("axios");
const { _BookingRefund, bookingRefundSchema } = require("../models/BookingRefund");
const { SendWhatsAppMessgae } = require("./user");


exports.showReapp = async function (req, res) {
  try {
    const UTD = req.body.UTD;
   
    const sequelize = await dbname(req.headers.compcode);

    const result =
      await sequelize.query(`select top 1 * from ( SELECT    hhh.UTD,      hhh.Trans_ID,     hhh.Trans_Date,     hhh.Trans_Ref_Date,     hhh.Variant_CD,     hhh.ECOLOR_CD,     hhh.Cust_Name,     hhh.Team_Head,     hhh.Loc_Cd,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
        where empcode = (select approver1_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr1_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
        where empcode = (select approver2_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr2_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
        where empcode = (select approver3_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr3_name,
      (SELECT TOP 1 godw_code FROM godown_mst WHERE hhh.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  hhh.EXECUTIVE,
        (SELECT TOP 1 Godw_Name FROM godown_mst WHERE hhh.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,hhh.TAXABLE_VALUE,
             (SELECT TOP 1 modl_name FROM Modl_Mst WHERE hhh.VARIANT_CD = Modl_Code) AS Modl_Name,
                 (SELECT TOP 1 item_code FROM Modl_Mst WHERE hhh.VARIANT_CD = Modl_Code) AS item_code,
                   (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE hhh.VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                   --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                   --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                   (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
              FROM DOC_UPLOAD dgd
              WHERE dgd.tran_id =  hhh.utd and doc_type = 'ORDBC' and export_type < 3
              FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
              (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where hhh.VARIANT_CD=Modl_Code))as Modl_Group_Name,
        (SELECT TOP 1 Misc_name FROM misc_mst WHERE hhh.ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem
         FROM GD_FDI_TRANS hhh
        LEFT JOIN booking_refund e ON hhh.UTD = e.UTD
         WHERE e.UTD = '${UTD}' and e.export_type = 9 ) as ab order by Tran_id desc
`);

    res.status(200).send(result[0]);
  } catch (e) {
    console.log(e);
  }
};
exports.refundReprt = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const emp_dms_code = req.body.emp_dms_code;
    const sequelize = await dbname(req.headers.compcode);



    const result =
      await sequelize.query(`select * from ( SELECT    hhh.UTD,hhh.CUST_ID,      hhh.Trans_ID,     hhh.Trans_Date,     hhh.Trans_Ref_Date,     hhh.Variant_CD,     hhh.ECOLOR_CD,     hhh.Cust_Name,     hhh.Team_Head,     hhh.Loc_Cd,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
        where empcode = (select approver1_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr1_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
        where empcode = (select approver2_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr2_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
        where empcode = (select approver3_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr3_name,
      (SELECT TOP 1 godw_code FROM godown_mst WHERE hhh.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  hhh.EXECUTIVE,
        (SELECT TOP 1 Godw_Name FROM godown_mst WHERE hhh.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,hhh.TAXABLE_VALUE,
             (SELECT TOP 1 modl_name FROM Modl_Mst WHERE hhh.VARIANT_CD = Modl_Code) AS Modl_Name,
                 (SELECT TOP 1 item_code FROM Modl_Mst WHERE hhh.VARIANT_CD = Modl_Code) AS item_code,
                   (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE hhh.VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                   --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                   --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                   (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
              FROM DOC_UPLOAD dgd
              WHERE dgd.tran_id =  hhh.utd and doc_type = 'ORDBC' and export_type < 3
              FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
              (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where hhh.VARIANT_CD=Modl_Code))as Modl_Group_Name,
        (SELECT TOP 1 Misc_name FROM misc_mst WHERE hhh.ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem
                 ,ap.Acnt_Id,ap.Acnt_Date as PayDate,ap.Ledg_Narr
         FROM GD_FDI_TRANS hhh
        LEFT JOIN booking_refund e ON hhh.UTD = e.UTD and e.export_type < 3
        		 left join godown_mst gm on gm.newcar_rcpt = hhh.LOc_cd and gm.export_type < 3
		 left join ledg_mst lm on lm.Ledg_add6 = hhh.CUST_ID and lm.export_type < 3 and lm.loc_code = gm.godw_code
		 left join acnt_post ap on ap.Ledg_Ac = lm.Ledg_Code and ap.Acnt_Type = 2 and ap.Post_Amt = e.Final_Amount and ap.export_type < 3
         WHERE hhh.TRANS_TYPE = 'ORDBC' 
         AND hhh.TRANS_DATE BETWEEN '${dateFrom}' AND '${dateto}'   ) as ab where Godown_Code in (${loc_code}) order by Refund_id desc, Trans_Date desc
`);

    res.status(200).send(result[0]);
  } catch (e) {
    console.log(e);
  }
};
exports.viewgdapproaldata = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const emp_dms_code = req.body.emp_dms_code;
    if (req.body.emp_dms_code == "" || req.body.emp_dms_code == undefined || req.body.emp_dms_code == null) {
      return res.status(500).send({
        status: false,
        Message: "emp_dms_code is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);



    const result =
      await sequelize.query(`select * from ( SELECT    hhh.UTD,      hhh.Trans_ID,     hhh.Trans_Date,     hhh.Trans_Ref_Date,     hhh.Variant_CD,     hhh.ECOLOR_CD,     hhh.Cust_Name,     hhh.Team_Head,     hhh.Loc_Cd,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
        where empcode = (select approver1_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr1_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
        where empcode = (select approver2_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr2_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
        where empcode = (select approver3_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr3_name,
      (SELECT TOP 1 godw_code FROM godown_mst WHERE hhh.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  hhh.EXECUTIVE,
        (SELECT TOP 1 Godw_Name FROM godown_mst WHERE hhh.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,hhh.TAXABLE_VALUE,
             (SELECT TOP 1 modl_name FROM Modl_Mst WHERE hhh.VARIANT_CD = Modl_Code) AS Modl_Name,
                 (SELECT TOP 1 item_code FROM Modl_Mst WHERE hhh.VARIANT_CD = Modl_Code) AS item_code,
                   (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE hhh.VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                   --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                   --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                   (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
              FROM DOC_UPLOAD dgd
              WHERE dgd.tran_id =  hhh.utd and doc_type = 'ORDBC' and export_type < 3
              FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
              (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where hhh.VARIANT_CD=Modl_Code))as Modl_Group_Name,
        (SELECT TOP 1 Misc_name FROM misc_mst WHERE hhh.ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem
         FROM GD_FDI_TRANS hhh
        LEFT JOIN booking_refund e ON hhh.UTD = e.UTD and e.export_type < 3
           WHERE hhh.TRANS_TYPE = 'ORDBC' 
         AND hhh.TRANS_DATE BETWEEN '${dateFrom}' AND '${dateto}' ${emp_dms_code == 'EDP'? '' :` And LEFT(hhh.Team_head, CHARINDEX(' - ', hhh.Team_head) - 1) in(${emp_dms_code}) `}
         ) as ab where Godown_Code in (${loc_code}) order by Trans_Date desc
`);

    res.status(200).send(result[0]);
  } catch (e) {
    console.log(e);
  }
};
exports.viewApproalData = async function (req, res) {
  try {
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);

    const result =
      await sequelize.query(` select * from ( SELECT 
        iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
           IN (approver1_A, approver1_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
           IN (approver2_A, approver2_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
           IN (approver3_A, approver3_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
              (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
          where empcode =
              (select iif(Appr_1_Code is not null,Appr_1_Code,
              (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
               from Approval_Matrix where module_code = 'BOOKINGREFUND' and   SRM collate database_default = empcode collate database_default)))
              and   Export_Type < 3) as apr1_name,
              (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
          where empcode =
              (select iif(Appr_2_Code is not null,Appr_2_Code,
              (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
               from Approval_Matrix where  module_code = 'BOOKINGREFUND' and   SRM collate database_default = empcode collate database_default)))
              and   Export_Type < 3) as apr2_name,
              (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
          where empcode = 
              (select iif(Appr_3_Code is not null,Appr_3_Code,
              (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
               from Approval_Matrix where module_code = 'BOOKINGREFUND' and   SRM collate database_default = empcode collate database_default)))
              and   Export_Type < 3) as apr3_name,
              iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
             IN (approver1_A, approver1_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver2_A, approver2_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver3_A, approver3_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
        GD_FDI_TRANS.UTD,      Trans_ID,     Trans_Date,     Trans_Ref_Date,     GD_FDI_TRANS.Variant_CD,     GD_FDI_TRANS.ECOLOR_CD,     Cust_Name,     Team_Head,     Loc_Cd,CUST_ID,
      (SELECT TOP 1 godw_code FROM godown_mst WHERE GD_FDI_TRANS.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  EXECUTIVE, 
        (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GD_FDI_TRANS.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,TAXABLE_VALUE,
             (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Name, 
                 (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS item_code,   
                   (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                   --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                   --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                   (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
              FROM DOC_UPLOAD dgd
              WHERE dgd.tran_id =  GD_FDI_TRANS.utd and doc_type = 'ORDBC' and export_type < 3
              FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
              (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where VARIANT_CD=Modl_Code))as Modl_Group_Name,
        (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem FROM GD_FDI_TRANS
        LEFT JOIN booking_refund e ON GD_FDI_TRANS.UTD = e.UTD and e.export_type < 3 
         WHERE SRM in (select empcode from approval_matrix where 
          '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B) ) ) as ab where ((status_khud_ka is not null and status_appr is not null)
          or (status_khud_ka is null and status_appr is null)) and Godown_Code in (${loc_code}) order by Trans_Date desc`);

    return res.status(200).send(result[0]);
  } catch (e) {
    console.log(e);
    return res.status(500).send({ Messgae: 'Internal server error' });
  }
};
exports.approveRefund = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code?.toUpperCase();
    const Approved_Amt = req.body.Approved_Amt;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (Appr_Code == "" || Appr_Code == undefined || Appr_Code == null) {
      return res.status(500).send({
        status: false,
        Message: "Appr_Code is mandatory",
      });
    }
    if (Approved_Amt == "" || Approved_Amt == undefined || Approved_Amt == null) {
      return res.status(500).send({
        status: false,
        Message: "Approved Amt is mandatory",
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
    const t = await sequelize.transaction();
    const t2 = await sequelize.transaction();
    const c = mainData;
    const empcode = c?.SRM;
    const tran_id = c?.tran_id;

    try {
      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode  = '${empcode}' and module_code = 'BOOKINGREFUND'`,
        { transaction: t2 }
      );
      if (a[0]?.length > 0) {
        let ApprovalLevel = 0;
        let Final_apprvl = 0;
        let rowsAffected = 0;
        const Approver_1A = a[0][0]?.approver1_A?.toUpperCase();
        const Approver_1B = a[0][0]?.approver1_B?.toUpperCase();
        const Approver_2A = a[0][0]?.approver2_A?.toUpperCase();
        const Approver_2B = a[0][0]?.approver2_B?.toUpperCase();
        const Approver_3A = a[0][0]?.approver3_A?.toUpperCase();
        const Approver_3B = a[0][0]?.approver3_B?.toUpperCase();

        if (Approver_1A == Appr_Code || Approver_1B == Appr_Code) {
          ApprovalLevel = 1;
        } else if (Approver_2A == Appr_Code || Approver_2B == Appr_Code) {
          ApprovalLevel = 2;
        } else if (Approver_3A == Appr_Code || Approver_3B == Appr_Code) {
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
            `UPDATE Booking_Refund
              SET 
                  Appr_1_Code ='${data.Appr_1_Code}', 
                  Appr_1_Stat =1, 
                  Appr_1_Rem=${Remark},
                  Fin_Appr = ${data.Fin_Appr},
                  Approved_Amt = ${Approved_Amt}
                  OUTPUT deleted.Tran_id 
              WHERE 
                  Tran_id =${tran_id} AND 
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
            `UPDATE Booking_Refund
            SET 
                Appr_2_Code ='${data.Appr_2_Code}', 
                Appr_2_Stat =1, 
                Appr_2_Rem=${Remark},
                Fin_Appr = ${data.Fin_Appr},
                Approved_Amt = ${Approved_Amt}
                OUTPUT deleted.Tran_id 
            WHERE 
                Tran_id =${tran_id} AND 
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
              `UPDATE Booking_Refund
            SET 
                Appr_3_Code ='${data.Appr_3_Code}', 
                Appr_3_Stat =1, 
                Appr_3_Rem=${Remark},
                Fin_Appr = ${data.Fin_Appr},
                Approved_Amt = ${Approved_Amt}
                OUTPUT deleted.Tran_id 
            WHERE 
                Tran_id =${tran_id} AND 
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
        const result =
          await sequelize.query(` select * from ( SELECT 
          iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver1_A, approver1_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver2_A, approver2_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver3_A, approver3_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode =
                (select iif(Appr_1_Code is not null,Appr_1_Code,
                (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                 from Approval_Matrix where module_code = 'BOOKINGREFUND' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr1_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode =
                (select iif(Appr_2_Code is not null,Appr_2_Code,
                (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                 from Approval_Matrix where  module_code = 'BOOKINGREFUND' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr2_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode = 
                (select iif(Appr_3_Code is not null,Appr_3_Code,
                (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                 from Approval_Matrix where module_code = 'BOOKINGREFUND' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr3_name,
                iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
               IN (approver1_A, approver1_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
               IN (approver2_A, approver2_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
               IN (approver3_A, approver3_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
          GD_FDI_TRANS.UTD,      Trans_ID,     Trans_Date,     Trans_Ref_Date,     GD_FDI_TRANS.Variant_CD,     GD_FDI_TRANS.ECOLOR_CD,     Cust_Name,     Team_Head,     Loc_Cd,
        (SELECT TOP 1 godw_code FROM godown_mst WHERE GD_FDI_TRANS.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  EXECUTIVE, 
          (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GD_FDI_TRANS.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,TAXABLE_VALUE,
               (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Name, 
                   (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS item_code,   
                     (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                     --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                     --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                     (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
                FROM DOC_UPLOAD dgd
                WHERE dgd.tran_id =  GD_FDI_TRANS.utd and doc_type = 'ORDBC' and export_type < 3
                FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
                (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where VARIANT_CD=Modl_Code))as Modl_Group_Name,
          (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem FROM GD_FDI_TRANS
          LEFT JOIN booking_refund e ON GD_FDI_TRANS.UTD = e.UTD and e.export_type < 3 
           WHERE e.Tran_id = ${tran_id}) as ab where (status_khud_ka is not null and status_appr is not null)
            or (status_khud_ka is null and status_appr is null) order by Trans_Date desc`);
        // console.log(result[0]);
        if (Final_apprvl == 1) {
          return res.status(200).send({ success: true, Message: "Final Approval Done", data: result[0][0] });
        } else {
          if (ApprovalLevel == 1) {
            return res.status(200).send({ success: true, Message: "Approved on level 1", data: result[0][0] });
          }
          if (ApprovalLevel == 2) {
            return res.status(200).send({ success: true, Message: "Approved on level 2", data: result[0][0] });
          }
          if (ApprovalLevel == 3) {
            return res.status(200).send({ success: true, Message: "Approved on level 3", data: result[0][0] });
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
exports.rejectRefund = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code?.toUpperCase();
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (Appr_Code == "" || Appr_Code == undefined || Appr_Code == null) {
      return res.status(500).send({
        status: false,
        Message: "Appr_Code is mandatory",
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
    if (Remark == "" || Remark == undefined || Remark == null) {
      return res.status(500).send({
        status: false,
        Message: "Remark is mandatory",
      });
    }
    // mainData.map(async (item, index) => {
    const t2 = await sequelize.transaction();
    const c = mainData;
    const empcode = c?.SRM;
    const tran_id = c?.tran_id;

    try {
      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode  = '${empcode}' and module_code = 'BOOKINGREFUND'`,
        { transaction: t2 }
      );

      if (a[0]?.length > 0) {
        let ApprovalLevel = 0;
        let Final_apprvl = 1;
        let rowsAffected = 0;
        const Approver_1A = a[0][0]?.approver1_A?.toUpperCase();
        const Approver_1B = a[0][0]?.approver1_B?.toUpperCase();
        const Approver_2A = a[0][0]?.approver2_A?.toUpperCase();
        const Approver_2B = a[0][0]?.approver2_B?.toUpperCase();
        const Approver_3A = a[0][0]?.approver3_A?.toUpperCase();
        const Approver_3B = a[0][0]?.approver3_B?.toUpperCase();

        if (Approver_1A == Appr_Code || Approver_1B == Appr_Code) {
          ApprovalLevel = 1;
        } else if (Approver_2A == Appr_Code || Approver_2B == Appr_Code) {
          ApprovalLevel = 2;
        } else if (Approver_3A == Appr_Code || Approver_3B == Appr_Code) {
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
              `UPDATE Booking_Refund
            SET 
                Appr_1_Code ='${data.Appr_1_Code}', 
                Appr_1_Stat = 0, 
                Appr_1_Rem=${Remark},
                Fin_Appr = 0
                OUTPUT deleted.Tran_id 
            WHERE 
                Tran_id =${tran_id} AND 
                Appr_1_Stat IS NULL AND 
                Fin_Appr IS NULL;`,
              { transaction: t2 }
            );

          rowsAffected = affectedRowsCount[0].length;
          console.log(rowsAffected, "asdkaskdjldas");
        } else if (ApprovalLevel == 2) {
          const data = { Appr_2_Code: Appr_Code };
          const affectedRowsCount = await sequelize.query(
            `UPDATE Booking_Refund
            SET 
                Appr_2_Code ='${data.Appr_2_Code}', 
                Appr_2_Stat = 0, 
                Appr_2_Rem=${Remark},
                Fin_Appr = 0
                OUTPUT deleted.Tran_id 
            WHERE 
                Tran_id =${tran_id} AND 
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
            `UPDATE Booking_Refund
            SET 
                Appr_3_Code ='${data.Appr_3_Code}', 
                Appr_3_Stat = 0, 
                Appr_3_Rem=${Remark},
                Fin_Appr = 0
                OUTPUT deleted.Tran_id
            WHERE 
                Tran_id =${tran_id} AND 
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
        const result =
          await sequelize.query(` select * from ( SELECT 
        iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
           IN (approver1_A, approver1_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
           IN (approver2_A, approver2_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
           IN (approver3_A, approver3_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
              (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
          where empcode =
              (select iif(Appr_1_Code is not null,Appr_1_Code,
              (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
               from Approval_Matrix where module_code = 'BOOKINGREFUND' and   SRM collate database_default = empcode collate database_default)))
              and   Export_Type < 3) as apr1_name,
              (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
          where empcode =
              (select iif(Appr_2_Code is not null,Appr_2_Code,
              (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
               from Approval_Matrix where  module_code = 'BOOKINGREFUND' and   SRM collate database_default = empcode collate database_default)))
              and   Export_Type < 3) as apr2_name,
              (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
          where empcode = 
              (select iif(Appr_3_Code is not null,Appr_3_Code,
              (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
               from Approval_Matrix where module_code = 'BOOKINGREFUND' and   SRM collate database_default = empcode collate database_default)))
              and   Export_Type < 3) as apr3_name,
              iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
             IN (approver1_A, approver1_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver2_A, approver2_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver3_A, approver3_B) and module_code = 'BOOKINGREFUND' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
        GD_FDI_TRANS.UTD,      Trans_ID,     Trans_Date,     Trans_Ref_Date,     GD_FDI_TRANS.Variant_CD,     GD_FDI_TRANS.ECOLOR_CD,     Cust_Name,     Team_Head,     Loc_Cd,
      (SELECT TOP 1 godw_code FROM godown_mst WHERE GD_FDI_TRANS.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  EXECUTIVE, 
        (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GD_FDI_TRANS.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,TAXABLE_VALUE,
             (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Name, 
                 (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS item_code,   
                   (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                   --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                   --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                   (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
              FROM DOC_UPLOAD dgd
              WHERE dgd.tran_id =  GD_FDI_TRANS.utd and doc_type = 'ORDBC' and export_type < 3
              FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
              (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where VARIANT_CD=Modl_Code))as Modl_Group_Name,
        (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem FROM GD_FDI_TRANS
        LEFT JOIN booking_refund e ON GD_FDI_TRANS.UTD = e.UTD and e.export_type < 3 
         WHERE e.Tran_id = ${tran_id}) as ab where (status_khud_ka is not null and status_appr is not null)
          or (status_khud_ka is null and status_appr is null) order by Trans_Date desc`);

        if (Final_apprvl == 1) {
          return res.status(200).send({ success: true, Message: 'Request Rejected successfully', data: result[0][0] });
        } else {
          if (ApprovalLevel == 1) {
            return res.status(200).send({ success: true, Message: 'Rejection on level 1', data: result[0][0] });
          }
          if (ApprovalLevel == 2) {
            return res.status(200).send({ success: true, Message: 'Rejection on level 2', data: result[0][0] });
          }
          if (ApprovalLevel == 3) {
            return res.status(200).send({ success: true, Message: 'Rejection on level 3', data: result[0][0] });
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
async function uploadImages(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    await Promise.all(files?.map(async (file, index) => {
      const customPath = `${Comp_Code}/ORDERBOOKING/`;
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
          "http://cloud.autovyn.com:3000/upload-photo-compress",
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
        columndoc_type: "ORDERBOOKING",
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
exports.UploadBookingImages = async function (req, res) {
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
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImages(
          req.files,
          req.headers.compcode,
          req.body.EMPCODE,
        );
        for (const data of EMP_DOCS_data) {
          const record = await sequelize.query(`INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
        VALUES ('ORDBC', ${UTD},${Image_Index} , '${data.DOC_PATH}', '${data.DOC_NAME}','${EMPCODE}', CONVERT(VARCHAR, GETDATE(), 5), 1);`);
        }
      }
      const result =
        await sequelize.query(` select * from ( SELECT    GD_FDI_TRANS.UTD,      Trans_ID,     Trans_Date,
          (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
          where empcode = (select approver1_A from Approval_Matrix where empcode = SRM
		 and module_code = 'BOOKINGREFUND'))as apr1_name,
		         (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
          where empcode = (select approver2_A from Approval_Matrix where empcode = SRM
		 and module_code = 'BOOKINGREFUND'))as apr2_name,
		         (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
          where empcode = (select approver3_A from Approval_Matrix where empcode = SRM
		 and module_code = 'BOOKINGREFUND'))as apr3_name,
          Trans_Ref_Date,     GD_FDI_TRANS.Variant_CD,     GD_FDI_TRANS.ECOLOR_CD,     Cust_Name,     Team_Head,     Loc_Cd,
          (SELECT TOP 1 godw_code FROM godown_mst WHERE GD_FDI_TRANS.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  EXECUTIVE, 
            (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GD_FDI_TRANS.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,TAXABLE_VALUE,
                 (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Name, 
                     (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS item_code,   
                       (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                       --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                       --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                       (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
                  FROM DOC_UPLOAD dgd
                  WHERE dgd.tran_id =  GD_FDI_TRANS.utd and doc_type = 'ORDBC' and export_type < 3
                  FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
                  (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where VARIANT_CD=Modl_Code))as Modl_Group_Name,
            (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem FROM GD_FDI_TRANS
            LEFT JOIN booking_refund e ON GD_FDI_TRANS.UTD = e.UTD and e.export_type < 3  WHERE TRANS_TYPE = 'ORDBC' and GD_FDI_TRANS.Utd = '${UTD}' ) as dasd`);
      res.status(200).send({ Message: "Documents Updated", rowData: result[0] });
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};
function generateTransactionId(length = 8) {
  const chars = '0123456789';
  let transactionId = '';
  const dateTime = new Date().toISOString().replace(/[-:.TZ]/g, ''); // Remove non-numeric characters
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    transactionId += chars[randomIndex];
  }
  return `REF${dateTime}${transactionId}`;
}
exports.deleteImage = async function (req, res) {
  try {


    if (req.body.UTD == "" || req.body.UTD == undefined || req.body.UTD == null) {
      return res.status(500).send({
        status: false,
        Message: "UTD is mandatory",
      });
    }
    if (req.body.SRNO == "" || req.body.SRNO == undefined || req.body.SRNO == null) {
      return res.status(500).send({
        status: false,
        Message: "SRNO is mandatory",
      });
    }

    const sequelize = await dbname(req.headers.compcode);

    const t = await sequelize.transaction();
    try {
      const existingRecord = await sequelize.query(`update DOC_UPLOAD set export_type = 33 where tran_id = '${req.body.UTD}' and SRNO = '${req.body.SRNO}'`);

      const result =
        await sequelize.query(` select * from ( SELECT    GD_FDI_TRANS.UTD,      Trans_ID,     Trans_Date,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
        where empcode = (select approver1_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr1_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
        where empcode = (select approver2_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr2_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
        where empcode = (select approver3_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr3_name,
        Trans_Ref_Date,     GD_FDI_TRANS.Variant_CD,     GD_FDI_TRANS.ECOLOR_CD,     Cust_Name,     Team_Head,     Loc_Cd,
        (SELECT TOP 1 godw_code FROM godown_mst WHERE GD_FDI_TRANS.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  EXECUTIVE, 
          (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GD_FDI_TRANS.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,TAXABLE_VALUE,
               (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Name, 
                   (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS item_code,   
                     (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                     --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                     --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                     (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
                FROM DOC_UPLOAD dgd
                WHERE dgd.tran_id =  GD_FDI_TRANS.utd and doc_type = 'ORDBC' and export_type < 3
                FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
                (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where VARIANT_CD=Modl_Code))as Modl_Group_Name,
          (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem FROM GD_FDI_TRANS
          LEFT JOIN booking_refund e ON GD_FDI_TRANS.UTD = e.UTD and e.export_type < 3  WHERE TRANS_TYPE = 'ORDBC' and GD_FDI_TRANS.Utd = '${req.body.UTD}' ) as dasd`);
      console.log(result);
      res.status(200).send({ Message: "Document deleted", rowData: result[0] });

    } catch (e) {
      // t.rollback();
      // return res.status(500).send({ Message: "Internal Server Error" });
      console.log(e);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ Message: "Internal Server Error" });

  }
};
exports.RefundEntry = async function (req, res) {
  try {

    if (req.body.SRM == "" || req.body.SRM == undefined || req.body.SRM == null) {
      return res.status(500).send({
        status: false,
        Message: "SRM is mandatory",
      });
    }
    if (req.body.UTD == "" || req.body.UTD == undefined || req.body.UTD == null) {
      return res.status(500).send({
        status: false,
        Message: "UTD is mandatory",
      });
    }
    if (req.body.remark_dse == "" || req.body.remark_dse == undefined || req.body.remark_dse == null) {
      return res.status(500).send({
        status: false,
        Message: "remark_dse is mandatory",
      });
    }
    if (req.body.booking_id == "" || req.body.booking_id == undefined || req.body.booking_id == null) {
      return res.status(500).send({
        status: false,
        Message: "booking_id is mandatory",
      });
    }
    if (req.body.location == "" || req.body.location == undefined || req.body.location == null) {
      return res.status(500).send({
        status: false,
        Message: "location is mandatory",
      });
    }
    if (req.body.emp_dms_code == "" || req.body.emp_dms_code == undefined || req.body.emp_dms_code == null) {
      return res.status(500).send({
        status: false,
        Message: "emp_dms_code is mandatory",
      });
    }
    const data = {
      SRM: req.body.SRM,
      UTD: req.body.UTD,
      booking_id: req.body.booking_id,
      location: req.body.location,
      remark_dse: req.body.remark_dse,
      emp_dms_code: req.body.emp_dms_code,
      is_gd: 1,
      export_type: 1,
      Booking_Amt: req.body.Booking_Amt,
      Booking_Amt_Actual: req.body.Booking_Amt_Actual,
      Adnl_Amt: req.body.Adnl_Amt,
      Cncl_Charges: req.body.Cncl_Charges,
      Final_Amount: req.body.Final_Amount,
      Refund_id: generateTransactionId()
    }
    const sequelize = await dbname(req.headers.compcode);
    const BookingRefund = _BookingRefund(sequelize, DataTypes);

    const t = await sequelize.transaction();
    try {
      const existingRecord = await BookingRefund.findOne({
        where: {
          UTD: data.UTD,
          export_type: 1
        }
      });
      if (existingRecord) {
        // await t.rollback();
        return res.status(500).send({ Message: "Record already exists" });
      } else {
        await BookingRefund.create({ ...data, Created_by: req.body.SRM }, { transaction: t })
        t.commit();
      }
      const result =
        await sequelize.query(` select * from ( SELECT    GD_FDI_TRANS.UTD,      Trans_ID,     Trans_Date,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
        where empcode = (select approver1_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr1_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
        where empcode = (select approver2_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr2_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
        where empcode = (select approver3_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr3_name,
        Trans_Ref_Date,     GD_FDI_TRANS.Variant_CD,     GD_FDI_TRANS.ECOLOR_CD,     Cust_Name,     Team_Head,     Loc_Cd,
        (SELECT TOP 1 godw_code FROM godown_mst WHERE GD_FDI_TRANS.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  EXECUTIVE, 
          (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GD_FDI_TRANS.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,TAXABLE_VALUE,
               (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Name, 
                   (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS item_code,   
                     (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                     --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                     --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                     (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
                FROM DOC_UPLOAD dgd
                WHERE dgd.tran_id =  GD_FDI_TRANS.utd and doc_type = 'ORDBC' and export_type < 3
                FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
                (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where VARIANT_CD=Modl_Code))as Modl_Group_Name,
          (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem FROM GD_FDI_TRANS
          LEFT JOIN booking_refund e ON GD_FDI_TRANS.UTD = e.UTD and e.export_type < 3  WHERE TRANS_TYPE = 'ORDBC' and GD_FDI_TRANS.Utd = '${data.UTD}' ) as dasd`);
      console.log(result);
      const empdata = await sequelize.query(`select 
(select top 1 concat(EMPFIRSTNAME  , EMPLASTNAME) from EMPLOYEEMASTER where empcode = SRM)as EMPNAME,
(select top 1 MOBILE_NO from EMPLOYEEMASTER where empcode = (select approver1_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as appr_1_mobile,
   (select top 1 MOBILE_NO from EMPLOYEEMASTER where empcode = SRM)as Mobile_no,
   (select top 1 comp_name from Comp_Mst where Comp_Code = 1) as comp_name,
* from Booking_Refund where utd = '${data.UTD}'`);
      res.status(200).send({ Message: "Refund raised", rowData: result[0] });
    } catch (e) {
      // t.rollback();
      // return res.status(500).send({ Message: "Internal Server Error" });
      console.log(e);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ Message: "Internal Server Error" });

  }
};
exports.RefundReappEntry = async function (req, res) {
  try {
    console.log("he;;llooooo")

    if (req.body.SRM == "" || req.body.SRM == undefined || req.body.SRM == null) {
      return res.status(500).send({
        status: false,
        Message: "SRM is mandatory",
      });
    }
    if (req.body.UTD == "" || req.body.UTD == undefined || req.body.UTD == null) {
      return res.status(500).send({
        status: false,
        Message: "UTD is mandatory",
      });
    }
    if (req.body.remark_dse == "" || req.body.remark_dse == undefined || req.body.remark_dse == null) {
      return res.status(500).send({
        status: false,
        Message: "remark_dse is mandatory",
      });
    }
    if (req.body.booking_id == "" || req.body.booking_id == undefined || req.body.booking_id == null) {
      return res.status(500).send({
        status: false,
        Message: "booking_id is mandatory",
      });
    }
    if (req.body.location == "" || req.body.location == undefined || req.body.location == null) {
      return res.status(500).send({
        status: false,
        Message: "location is mandatory",
      });
    }

    const sequelize = await dbname(req.headers.compcode);
    const BookingRefund = _BookingRefund(sequelize, DataTypes);

    const t = await sequelize.transaction();
    try {

      const existingRecord = await BookingRefund.findOne({
        where: {
          UTD: req.body.UTD,
          export_type: 1
        }
      });
      // if (!existingRecord) {
      //   // await t.rollback();
      //   return res.status(500).send({ Message: "Record already exists" });
      // } else {
      await sequelize.query(`update booking_refund set export_type = 9 where Tran_id = :Tran_id`, {
        replacements: { Tran_id: existingRecord.Tran_id }
      }, { transaction: t })
      const data = {
        SRM: existingRecord.SRM,
        UTD: existingRecord.UTD,
        booking_id: existingRecord.booking_id,
        location: existingRecord.location,
        remark_dse: existingRecord.remark_dse,
        Dms_Code: existingRecord.emp_dms_code,
        is_gd: 1,
        export_type: 1,
        Booking_Amt: req.body.Booking_Amt,
        Booking_Amt_Actual: req.body.Booking_Amt_Actual,
        Adnl_Amt: req.body.Adnl_Amt,
        Cncl_Charges: req.body.Cncl_Charges,
        Final_Amount: req.body.Final_Amount,
        Refund_id: existingRecord.Refund_id,
        Is_Reapp:1
      }
      await BookingRefund.create({ ...data, Created_by: req.body.SRM }, { transaction: t })
      t.commit();
      // }
      const result =
        await sequelize.query(` select * from ( SELECT    GD_FDI_TRANS.UTD,      Trans_ID,     Trans_Date,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
        where empcode = (select approver1_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr1_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
        where empcode = (select approver2_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr2_name,
           (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
        where empcode = (select approver3_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as apr3_name,
        Trans_Ref_Date,     GD_FDI_TRANS.Variant_CD,     GD_FDI_TRANS.ECOLOR_CD,     Cust_Name,     Team_Head,     Loc_Cd,
        (SELECT TOP 1 godw_code FROM godown_mst WHERE GD_FDI_TRANS.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<3) AS Godown_Code,  EXECUTIVE, 
          (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GD_FDI_TRANS.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<3) AS godw_name,TAXABLE_VALUE,
               (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Name, 
                   (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS item_code,   
                     (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Grp,e.SRM, e.tran_id,e.Appr_1_Stat,e.Appr_2_Stat,e.Appr_3_Stat,e.Fin_Appr,e.is_gd,e.remark_dse,e.Approved_Amt,e.Booking_Amt_Actual,e.Adnl_Amt,e.Cncl_Charges,e.Final_Amount,e.Utd as Refund_id,e.Is_Reapp,e.Appr_1_Code,e.Appr_2_Code,e.Appr_3_Code,
                     --(select top 1 mobile2 from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as MOBILE2,
                     --(select top 1 PAN_NO from gd_fdi_trans_customer where gd_fdi_trans_customer.utd=gd_fdi_trans.utd) as PAN_NO,
                     (SELECT top 1  STUFF((SELECT '|' + concat(srno,'__',path)
                FROM DOC_UPLOAD dgd
                WHERE dgd.tran_id =  GD_FDI_TRANS.utd and doc_type = 'ORDBC' and export_type < 3
                FOR XML PATH('')), 1, 1, '')) AS ImagePaths,
                (select top 1 Misc_Name from Misc_Mst where Misc_type=14 and export_type < 3 and  misc_code=(select top 1 Modl_Grp from Modl_Mst where VARIANT_CD=Modl_Code))as Modl_Group_Name,
          (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color,e.Appr_1_Rem,e.Appr_2_Rem,e.Appr_3_Rem FROM GD_FDI_TRANS
          LEFT JOIN booking_refund e ON GD_FDI_TRANS.UTD = e.UTD and e.export_type < 3  WHERE TRANS_TYPE = 'ORDBC' and GD_FDI_TRANS.Utd = '${data.UTD}' ) as dasd`);
      console.log(result);
      const empdata = await sequelize.query(`select 
(select top 1 concat(EMPFIRSTNAME  , EMPLASTNAME) from EMPLOYEEMASTER where empcode = SRM)as EMPNAME,
(select top 1 MOBILE_NO from EMPLOYEEMASTER where empcode = (select approver1_A from Approval_Matrix where empcode = SRM
   and module_code = 'BOOKINGREFUND'))as appr_1_mobile,
   (select top 1 MOBILE_NO from EMPLOYEEMASTER where empcode = SRM)as Mobile_no,
   (select top 1 comp_name from Comp_Mst where Comp_Code = 1) as comp_name,
* from Booking_Refund where utd = '${data.UTD}'`);
      res.status(200).send({ Message: "Refund raised", rowData: result[0] });
    } catch (e) {
      // t.rollback();
      // return res.status(500).send({ Message: "Internal Server Error" });
      console.log(e);
    }
  } catch (e) {
    console.log(e);
    return res.status(500).send({ Message: "Internal Server Error" });

  }
};

exports.reportBranchwise = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  const branch = req.body.branch;
  function getPreviousMonthDate(dateString) {
    const date = new Date(dateString);
    const previousMonth = date.getMonth() - 1;

    if (previousMonth < 0) {
      // Handle wrap-around for January to previous December
      date.setFullYear(date.getFullYear() - 1);
      date.setMonth(11); // December is month 11 (0-indexed)
    } else {
      date.setMonth(previousMonth);
    }
    return date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
  }

  const previousMonthDateTo = getPreviousMonthDate(dateto);
  const previousMonthDateFrom = getPreviousMonthDate(dateFrom);
  try {
    const sequelize = await dbname(req.headers.compcode);

    const discountdata = await sequelize.query(
      `select 
 count(*) as total_count,   
 SUM(iif(Refund_id is not null,1,0)) AS request_raised,
    SUM(IIF(appr_1_stat = 1 , 1, 0)) AS approvedby1,
    SUM(IIF(appr_1_stat = 0 , 1, 0)) AS rejectedby1,
    SUM(IIF((appr_1_stat IS NULL) and  Refund_id is not null, 1, 0)) AS pendingat1,
    SUM(IIF(appr_2_stat = 1 , 1, 0)) AS approvedby2,
    SUM(IIF(appr_2_stat = 0 , 1, 0)) AS rejectedby2,
    SUM(IIF((appr_2_stat is null and  appr_1_stat=1) and fin_appr is null, 1, 0)) AS pendingat2,
	SUM(IIF(appr_3_stat = 1 , 1, 0)) AS approvedby3,
	SUM(IIF(appr_3_stat = 0 , 1, 0)) AS rejectedby3,
	SUM(IIF((appr_3_stat is null and  appr_2_stat=1) and fin_appr is null, 1, 0)) AS pendingat3,
(select Godw_Name from godown_mst where replace(newcar_rcpt,'-s','') =LOC_CD and export_type<3) as location_name,LOC_CD
from (
select
g.LOC_CD,g.trans_id , dl.*
  FROM GD_FDI_TRANS g
 left  join
(select  utd ,appr_1_stat,appr_2_stat, appr_3_stat,Refund_id,Fin_Appr from Booking_Refund where export_type < 3  ) 
as dl on dl.utd = g.UTD
         WHERE loc_cd  IN (select replace(newcar_rcpt,'-s','') from godown_mst where godw_code in (${req.body.multi_loc})) and
 cast (g.TRANS_DATE as date) BETWEEN  '${dateFrom}' and '${dateto}'
 and g.TRANS_TYPE = 'ordbc' 
 ) as dad group by LOC_CD order by total_count
   `
    );
    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};