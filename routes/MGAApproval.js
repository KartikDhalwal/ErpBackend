const { dbname } = require("../utils/dbconfig");
const jwt = require("jsonwebtoken");
const { Sequelize, DataTypes, literal, where } = require("sequelize");
const FormData = require("form-data");
const Joi = require("joi");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { SendWhatsAppMessgae } = require("./user");
const { _MGA_Approval, MGAApprovalSchema } = require("../models/MGAApproval");
const {
  _MGA_Approval_dtl,
  MGAApprovalDtlSchema,
} = require("../models/MGA_Approval_dtl");
const { query } = require("express");

exports.InsertData = async function (req, res) {
  console.log(req.body, "komal");
  const { Tran_Id, ledger_id, ...General } = req.body.Formdata;
  const { Service } = req.body;
  const { error: requestError, value: MGAData } =
    MGAApprovalSchema.validate(General);

  const { error: productError, value: MGADtlData } = Joi.array()
    .items(MGAApprovalDtlSchema)
    .validate(Service, {
      abortEarly: false,
      stripUnknown: true,
    });

  if (requestError || productError) {
    const errors = (requestError ? requestError.details : []).concat(
      productError ? productError.details : []
    );
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }

  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    // Create PurchaseOrder
    const MGAapproval = _MGA_Approval(sequelize, Sequelize.DataTypes);
    const MGAapproval1 = await MGAapproval.create(MGAData, {
      transaction: t,
      return: true,
    });

    // Create PurchaseReqProductDetails associated with PurchaseRequest
    const MGAapprovaldtl = _MGA_Approval_dtl(sequelize, Sequelize.DataTypes);
    const MGAapprovaldtldata = await Promise.all(
      MGADtlData.map((product) => {
        return MGAapprovaldtl.create(
          {
            ...product,
            MGA_Approval_UTD: MGAapproval1.UTD,
            Created_By: MGAapproval1.Created_By,
          },
          {
            transaction: t,
            returning: true,
          }
        );
      })
    );

    await t.commit();

    //Approver MobileNo
    const mobile_no = await sequelize.query(
      `select mobile_no, EMPCODE from employeemaster where empcode=
      (select top 1 Approver1_A from Approval_matrix where Empcode = 
      (select top 1 empcode from MGA_Approval where utd = '${MGAapproval1.UTD}'))`
    );

    //Employee Mobileno and name
    const emp1 = await sequelize.query(
      `select Mobile_no,concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EMPNAME from employeemaster where empcode='${MGAapproval1.EmpCode}' `
    );
    const branch = await sequelize.query(
      `select Godw_Name from GODOWN_MST where Godw_Code in (${MGAapproval1.Location})  and export_type<3`
    );

    const encodedCompCode = Buffer.from(req.headers.compcode).toString(
      "base64"
    );
    const encodedEmpCode = Buffer.from(mobile_no[0][0].EMPCODE).toString(
      "base64"
    );
    const encodedUTD = Buffer.from(MGAapproval1.UTD.toString()).toString(
      "base64"
    );

    const comapny = await sequelize.query(`select comp_name from comp_mst `);
    await SendWhatsAppMessgae(
      req.headers.compcode,
      mobile_no[0][0]?.mobile_no,
      "mga_approver",
      [
        {
          type: "text",
          text: emp1[0][0]?.EMPNAME,
        },
        {
          type: "text",
          text: emp1[0][0]?.Mobile_no,
        },
        {
          type: "text",
          text: MGAapproval1.Cust_Name,
        },
        {
          type: "text",
          text: MGAapproval1.Cust_Id,
        },
        {
          type: "text",
          text: MGAapproval1.Invoice_No,
        },
        {
          type: "text",
          text: branch[0][0]?.Godw_Name,
        },
        {
          type: "text",
          text: `https://erp.autovyn.com/autovyn/MGA/MGAApproval/MGADetails?compcode=${encodedCompCode}&aprcode=${encodedEmpCode}&UTD=${encodedUTD}`,
        },
        {
          type: "text",
          text: comapny[0][0]?.comp_name,
        },
      ]
    );

    await SendWhatsAppMessgae(
      req.headers.compcode,
      MGAapproval1.Cust_Mobile,
      "mga_customer",
      [
        {
          type: "text",
          text: MGAapproval1.Cust_Name,
        },
        {
          type: "text",
          text: emp1[0][0]?.EMPNAME,
        },
        {
          type: "text",
          text: MGAapproval1.Invoice_No,
        },
        {
          type: "text",
          text: req.body.Amount,
        },
        {
          type: "text",
          text: `https://erp.autovyn.com/backend/MGAApproval/CustomerViewViaMsg?compcode=${encodedCompCode}&UTD=${encodedUTD}`,
        },
        {
          type: "text",
          text: comapny[0][0]?.comp_name,
        },
      ]
    );
    // Prepare response
    const response = {
      success: true,
      MGAapproval: MGAapproval1,
      MGAapprovaldtldata: MGAapprovaldtldata,
    };

    res.status(200).json(response);
  } catch (err) {
    // if (t) await t.rollback(); // Rollback transaction if an error occurred
    console.error(err);
    res.status(500).json({ error: "Failed to create purchase request" });
  }
};

exports.CustomerDetails = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Cust_Id = req.body.Cust_Id;
  const Location = req.body.Location;

  try {
    const result2 = await sequelize.query(
      `SELECT * FROM MGA_Approval WHERE Cust_Id = '${Cust_Id}' AND (Cust_Status IS NULL AND Fin_Appr IS NULL)`
    );

    if (result2[0].length > 0) {
      return res.status(404).send("Your one Request is Pending");
    }

    const result = await sequelize.query(`
    SELECT 
    MAX(Tran_Id) AS Tran_Id, 
    ledger_id,
    MAX(VIN) AS VIN, 
    MAX(Bill_No) AS Invoice_No, 
    MAX(Ledger_Name) AS Cust_Name,
    SUM(taxable + CGST +SGST+IGST+Cess_Amt ) AS MGAIssuedDMS,
    (SELECT TOP 1 mga_pric 
     FROM icm_dtl 
     WHERE Tran_Id = 
         (SELECT TOP 1 Tran_Id 
          FROM ICM_MST 
          WHERE ICM_MST.Cust_Id = DMS_ROW_DATA.Ledger_Id)
    ) AS MGAPromisedAmt
FROM 
    DMS_ROW_DATA
WHERE 
    ledger_id = '${Cust_Id}'
    AND Loc_Code = '${Location}'
    AND tran_type = 4
    AND Export_Type < 3
GROUP BY 
    ledger_id;
    `);

    const result1 = await sequelize.query(`
      SELECT MOBILE2 
      FROM GD_FDI_TRANS_customer 
      WHERE cust_id='${Cust_Id}'  
        AND LOC_CD IN (
          SELECT REPLACE(newcar_rcpt, '-S', '') 
          FROM GODOWN_MST 
          WHERE Godw_Code IN (${Location}) 
            AND Export_Type < 3
        ) and MOBILE2 is not null
    `);

    console.log(result[0], "komalnuwal");

    if (result1[0].length > 0 && result1[0][0].MOBILE2) {
      result[0][0].Cust_Mobile = result1[0][0].MOBILE2;
    }

    console.log(result[0], "komalnuwalafter");

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

exports.EmployeeView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const empcode = req.body.empcode;
    const DateFrom = req.body.DateFrom;
    const DateTo = req.body.DateTo;
    const Location = req.body.Location;
    const result = await sequelize.query(
      `select * from (
          select
          iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}' 
                 IN (approver1_A, approver1_B) and module_code = 'MGA' and MGA_Approval.EMPCODE collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}' 
                 IN (approver2_A, approver2_B) and module_code = 'MGA' and MGA_Approval.EMPCODE collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}' 
                 IN (approver3_A, approver3_B) and module_code = 'MGA' and MGA_Approval.EMPCODE collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
          
                    (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                where empcode =
                    (select iif(Appr_1_Code is not null,Appr_1_Code,
                    (select iif(Approver1_A = '${empcode}', Approver1_A, iif(Approver1_B = '${empcode}',Approver1_B,Approver1_A))
                     from Approval_Matrix where module_code = 'MGA' and   MGA_Approval.EMPCODE collate database_default = empcode collate database_default)))
                    and   Export_Type < 3) as apr1_name,
                                  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                where empcode =
                    (select iif(Appr_2_Code is not null,Appr_2_Code,
                    (select iif(Approver2_A = '${empcode}', Approver2_A, iif(Approver2_B = '${empcode}',Approver2_B,Approver2_A))
                     from Approval_Matrix where  module_code = 'MGA' and   MGA_Approval.EMPCODE collate database_default = empcode collate database_default)))
                    and   Export_Type < 3) as apr2_name,
                    (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
                where empcode = 
                    (select iif(Appr_3_Code is not null,Appr_3_Code,
                    (select iif(Approver3_A = '${empcode}',Approver3_A,iif(Approver3_B = '${empcode}',Approver3_B,Approver3_A))
                     from Approval_Matrix where module_code = 'MGA' and   MGA_Approval.EMPCODE collate database_default = empcode collate database_default)))
                    and   Export_Type < 3) as apr3_name,
  
      
                    iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${empcode}' 
                   IN (approver1_A, approver1_B) and module_code = 'MGA' and MGA_Approval.EMPCODE collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}' 
                   IN (approver2_A, approver2_B) and module_code = 'MGA' and MGA_Approval.EMPCODE collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}' 
                   IN (approver3_A, approver3_B) and module_code = 'MGA' and MGA_Approval.EMPCODE collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
                    iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4) as stat, Appr_1_Stat,Appr_2_Stat,Appr_3_Stat,
                    UTD, CAST(Req_Date as DATE) AS Req_Date,fin_appr,Appr_1_Rem,Appr_2_Rem,Appr_3_Rem,Cust_Id, VIN, Invoice_No,Cust_Name,Cust_Mobile,MGAIssuedDMS, EmpCode, 
                    (SELECT CONCAT(EMPFIRSTNAME, ' ' , EMPLASTNAME) AS EMPNAME FROM EMPLOYEEMASTER where EMPLOYEEMASTER.empcode = MGA_Approval.EmpCode) AS EmpName from MGA_Approval WHERE EmpCode in ('${empcode}') and Req_Date between '${DateFrom}' and '${DateTo}' and Location in (${Location})) as dasd order by UTD desc  
          `
    );

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

exports.MGAViewDtl = async function (req, res) {
  try {
    const UTD = req.body.UTD;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
    SELECT UTD,
       (SELECT TOP 1 Cust_Id 
        FROM MGA_Approval 
        WHERE MGA_Approval.UTD = MGA_Approval_dtl.MGA_Approval_UTD) AS Cust_Id,
       MGA_Description,
       Quantity,
       Amount,
       SUM(CAST(Amount AS decimal(18, 2))) OVER () AS TotalAmount
FROM MGA_Approval_dtl
WHERE MGA_Approval_UTD = '${UTD}'
    `;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.MGAApproverView = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    let query;
    query = `
    select * from (
      select
      iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver1_A, approver1_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver2_A, approver2_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver3_A, approver3_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode =
                (select iif(Appr_1_Code is not null,Appr_1_Code,
                (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                 from Approval_Matrix where module_code = 'MGA' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr1_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode =
                (select iif(Appr_2_Code is not null,Appr_2_Code,
                (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                 from Approval_Matrix where  module_code = 'MGA' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr2_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
            where empcode =
                (select iif(Appr_3_Code is not null,Appr_3_Code,
                (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                 from Approval_Matrix where module_code = 'MGA' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr3_name,
                iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}'
               IN (approver1_A, approver1_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
               IN (approver2_A, approver2_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
               IN (approver3_A, approver3_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
              UTD,Cast(Req_Date as date)as Req_Date, Cust_Id, Cust_Name,VIN, Invoice_No,  Cust_Mobile, MGAIssuedDMS, Location,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster  where employeemaster.empcode =MGA_Approval.srm)as EmpName,Cust_Status,
        Appr_1_Rem, Appr_2_Rem, Appr_3_Rem, srm as emp_code
        from MGA_Approval  where Req_Date between '${dateFrom}' and '${dateto}' and Location in (${loc_code}) 
                and srm in  (select empcode from approval_matrix where
                  '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))
                ) as dasd 
                 `;
    if (req.body.status == 2) {
      query += `where  (status_khud_ka is null and status_appr is null)  Order By utd desc`;
    } else {
      query += `where  status_khud_ka =${req.body.status}  Order By utd desc`;
    }
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const processMainDataforMGA = async (
  mainData,
  sequelize,
  Appr_Code,
  Remark,
  compcode
) => {
  // const t = await sequelize.transaction();
  const backgroundTasks = [];

  try {
    // Pre-fetch necessary static data
    const comp_name_result = await sequelize.query(
      `SELECT TOP 1 comp_name FROM comp_mst`
    );
    const comp_name = comp_name_result[0][0]?.comp_name;

    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.UTD;
      console.log(item?.rowData, "c");
      const a = await sequelize.query(
        `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = :empcode AND module_code = 'MGA'`,
        {
          replacements: { empcode },
          // , transaction: t
        }
      );

      if (a[0]?.length > 0) {
        const approvers = a[0][0];
        let ApprovalLevel = 0;
        let Final_apprvl = null;

        if (
          [
            approvers.approver1_A?.toLowerCase(),
            approvers.approver1_B?.toLowerCase(),
          ].includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 1;
        } else if (
          [
            approvers.approver2_A?.toLowerCase(),
            approvers.approver2_B?.toLowerCase(),
          ].includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 2;
        } else if (
          [
            approvers.approver3_A?.toLowerCase(),
            approvers.approver3_B?.toLowerCase(),
          ].includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel === 0) {
          throw new Error("You are not the right person to approve this");
        }

        if (
          (ApprovalLevel === 1 &&
            !approvers.approver2_A &&
            !approvers.approver2_B &&
            !approvers.approver2_C) ||
          (ApprovalLevel === 2 &&
            !approvers.approver3_A &&
            !approvers.approver3_B &&
            !approvers.approver3_C)
        ) {
          Final_apprvl = 1;
        }

        const data = {
          Appr_Code,
          Remark,
          Final_apprvl,
        };

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE MGA_Approval
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 1,
                Appr_1_Rem = :Remark,
                appr_1_date=GETDATE(),
                Fin_Appr = :Final_apprvl
            WHERE UTD = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;

          const result = await sequelize.query(
            `select mobile_no,CONCAT(EMPFIRSTNAME,' ', EMPLASTNAME)AS EMPNAME from employeemaster where empcode='${c.emp_code}'`
          );

          const comapny = await sequelize.query(
            `select comp_name from comp_mst `
          );
          await SendWhatsAppMessgae(
            compcode,
            result[0][0]?.mobile_no,
            "mga_approve",
            [
              {
                type: "text",
                text: result[0][0]?.EMPNAME,
              },
              {
                type: "text",
                text: item?.rowData?.Cust_Name,
              },
              {
                type: "text",
                text: item?.rowData?.Cust_Mobile,
              },
              {
                type: "text",
                text: item?.rowData?.Cust_Id,
              },
              {
                type: "text",
                text: item?.rowData?.Invoice_No,
              },
              {
                type: "text",
                text: item?.rowData?.apr1_name,
              },
              {
                type: "text",
                text: item?.rowData?.apr1_name,
              },

              {
                type: "text",
                text: comapny[0][0]?.comp_name,
              },
            ]
          );
          if (!Final_apprvl) {
            //Approve2
            const approver2 = await sequelize.query(
              `select  mobile_no,empcode from employeemaster where empcode=(select top 1 approver2_A from approval_matrix where empcode='${c.emp_code}' and module_code='MGA')`
            );
            //employee
            const mobile_emp = await sequelize.query(
              `select mobile_no,concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EMPNAME  from employeemaster where empcode='${c.emp_code}'`
            );
            const branch = await sequelize.query(
              `select Godw_Name from GODOWN_MST where Godw_Code in (${c.Location})  and export_type<3`
            );

            const encodedCompCode = Buffer.from(compcode).toString("base64");
            const encodedEmpCode = Buffer.from(
              approver2[0][0].empcode
            ).toString("base64");
            const encodedUTD = Buffer.from(
              item?.rowData.UTD.toString()
            ).toString("base64");

            console.log(
              encodedCompCode,
              encodedEmpCode,
              encodedUTD,
              "encodedUTD"
            );
            await SendWhatsAppMessgae(
              compcode,
              approver2[0][0]?.mobile_no,
              "mga_approver",
              [
                {
                  type: "text",
                  text: mobile_emp[0][0]?.EMPNAME,
                },
                {
                  type: "text",
                  text: mobile_emp[0][0]?.mobile_no,
                },
                {
                  type: "text",
                  text: item?.rowData.Cust_Name,
                },
                {
                  type: "text",
                  text: item?.rowData.Cust_Id,
                },
                {
                  type: "text",
                  text: item?.rowData.Invoice_No,
                },
                {
                  type: "text",
                  text: branch[0][0]?.Godw_Name,
                },
                {
                  type: "text",
                  text: `https://erp.autovyn.com/autovyn/MGA/MGAApproval/MGADetails?compcode=${encodedCompCode}&aprcode=${encodedEmpCode}&UTD=${encodedUTD}`,
                },
                {
                  type: "text",
                  text: comapny[0][0]?.comp_name,
                },
              ]
            );
          }
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE MGA_Approval
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 1,
                appr_2_date=GETDATE(),
                Appr_2_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE UTD = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;

          const result = await sequelize.query(
            `select mobile_no,CONCAT(EMPFIRSTNAME,' ', EMPLASTNAME)AS EMPNAME from employeemaster where empcode='${c.emp_code}'`
          );

          const comapny = await sequelize.query(
            `select comp_name from comp_mst `
          );
          await SendWhatsAppMessgae(
            compcode,
            result[0][0]?.mobile_no,
            "mga_approve2",
            [
              {
                type: "text",
                text: result[0][0]?.EMPNAME,
              },
              {
                type: "text",
                text: item?.rowData?.Cust_Name,
              },
              {
                type: "text",
                text: item?.rowData?.Cust_Mobile,
              },
              {
                type: "text",
                text: item?.rowData?.Cust_Id,
              },
              {
                type: "text",
                text: item?.rowData?.Invoice_No,
              },
              {
                type: "text",
                text: item?.rowData?.apr2_name,
              },
              {
                type: "text",
                text: Remark,
              },
              {
                type: "text",
                text: item?.rowData?.apr2_name,
              },

              {
                type: "text",
                text: comapny[0][0]?.comp_name,
              },
            ]
          );
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE MGA_Approval
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 1,
                appr_3_date=GETDATE(),
                Appr_3_Rem = :Remark,
                Fin_Appr = 1
            WHERE UTD = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        }

        // Execute the update queries
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM MGA_Approval WHERE UTD = :tran_id`,
          {
            replacements: { tran_id },
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, tran_id },
            // , transaction: t
          });
        }

        // Prepare message sending tasks for background execution
        // if (ApprovalLevel === 1) {
        //   const result = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   backgroundTasks.push(() => SendWhatsAppMessgae(result[0][0]?.mobile_no, 'approver_1_approve_message', [
        //     { "type": "text", "text": item?.rowData.SRM_Name },
        //     { "type": "text", "text": item?.rowData?.Cust_Name },
        //     { "type": "text", "text": item?.rowData?.Mob },
        //     { "type": "text", "text": item?.rowData?.modl_name },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //     { "type": "text", "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)' },
        //     { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": comp_name }
        //   ]));

        //   if (!Final_apprvl) {
        //     const approver2 = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode=(SELECT TOP 1 approver2_A FROM approval_matrix WHERE empcode='${item?.rowData.SRM}' AND module_code='discount')`);
        //     const outlet_name = await sequelize.query(`SELECT TOP 1 br_extranet FROM godown_mst WHERE godw_code='${item?.rowData.location}' AND export_type<3`);
        //     if (approver2[0]?.length && approver2[0][0].mobile_no) {
        //       backgroundTasks.push(() => SendWhatsAppMessgae(approver2[0][0].mobile_no, 'disc_appr_msg_l2_new', [
        //         { "type": "text", "text": outlet_name[0][0].br_extranet },
        //         { "type": "text", "text": `${item.rowData.Modl_Group_Name} , ${item.rowData.modl_name} , ${item.rowData.Veh_Clr_Name}` },
        //         { "type": "text", "text": item?.rowData?.Cust_Name },
        //         { "type": "text", "text": item?.rowData?.Dise_Amt },
        //         { "type": "text", "text": item?.rowData?.RM_Name },
        //         { "type": "text", "text": item?.rowData?.book_date },
        //         { "type": "text", "text": comp_name }
        //       ]));
        //     }
        //   }
        // } else if (ApprovalLevel === 2) {
        //   const mobile_emp = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
        //     backgroundTasks.push(() => SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_reject_message', [
        //       { "type": "text", "text": item?.rowData?.SRM_Name },
        //       { "type": "text", "text": item?.rowData?.Cust_Name },
        //       { "type": "text", "text": item?.rowData?.Mob },
        //       { "type": "text", "text": item?.rowData?.modl_name },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": comp_name }
        //     ]));
        //   }
        // }

        console.log({
          success: true,
          Message:
            affectedRows.length === 0
              ? "Cannot Approve"
              : `Approved on level ${ApprovalLevel}`,
        });
      }
    }
    // await t.commit();
    // Respond to the caller immediately
    return {
      success: true,
      message: "Main data processing initiated",
    };
  } catch (e) {
    console.error(e);
    //p
    throw e;
  } finally {
    setTimeout(async () => {
      try {
        for (const task of backgroundTasks) {
          await task();
          await delay(2000);
          // Execute each function in backgroundTasks
        }
      } catch (err) {
        console.error("Error executing background tasks:", err);
      }
    }, 1000);
  }
};

exports.approveby2MGA = async function (req, res) {


  try {
    const compcode = req.body.open?Buffer.from(req.headers.compcode, "base64").toString(
      "utf-8"
    ):req.headers.compcode
    const sequelize = await dbname(compcode)
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.open?Buffer.from(req.body.Appr_Code, "base64").toString(
      "utf-8"
    ):req.body.Appr_Code


    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (!Appr_Code) {
      return res.status(400).send({
        status: false,
        Message: "Appr_Code is mandatory",
      });
    }

    if (!mainData?.length) {
      return res.status(400).send({
        status: false,
        Message: "Please select the entry to approve",
      });
    }

    await processMainDataforMGA(
      mainData,
      sequelize,
      Appr_Code,
      Remark,
      compcode
    );

    return res
      .status(200)
      .send({ success: true, Message: "Approved Successfully" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};

exports.rejectby2forMGA = async function (req, res) {

  try {
    const compcode = req.body.open?Buffer.from(req.headers.compcode, "base64").toString(
      "utf-8"
    ):req.headers.compcode
    const sequelize = await dbname(compcode)
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.open?Buffer.from(req.body.Appr_Code, "base64").toString(
      "utf-8"
    ):req.body.Appr_Code
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;

    if (!Appr_Code) {
      return res.status(400).send({
        status: false,
        Message: "Appr_Code is mandatory",
      });
    }

    if (!mainData?.length) {
      return res.status(400).send({
        status: false,
        Message: "Please select the entry to reject",
      });
    }

    await processMainData1forMGA(
      mainData,
      sequelize,
      Appr_Code,
      Remark,
      compcode
    );

    return res
      .status(200)
      .send({ success: true, Message: "Request Rejected Successfully" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};
async function processMainData1forMGA(
  mainData,
  sequelize,
  Appr_Code,
  Remark,
  compcode
) {
  // const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.UTD;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'MGA'`,
        {
          replacements: { empcode },
          // , transaction: t
        }
      );

      const mobile_emp = await sequelize.query(
        `select top 1 mobile_no from employeemaster where empcode='${item?.rowData.emp_code}'`
      );
      const comp_name = await sequelize.query(
        `select top 1 comp_name from comp_mst`
      );

      if (a[0]?.length > 0) {
        const approvers = a[0][0];
        let ApprovalLevel = 0;

        if (
          [
            approvers.approver1_A?.toLowerCase(),
            approvers.approver1_B?.toLowerCase(),
          ]
            .map((approver) => approver?.toLowerCase())
            .includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 1;
        } else if (
          [approvers.approver2_A, approvers.approver2_B]
            .map((approver) => approver?.toLowerCase())
            .includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 2;
        } else if (
          [approvers.approver3_A, approvers.approver3_B]
            .map((approver) => approver?.toLowerCase())
            .includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel === 0) {
          throw new Error("You are not the right person to reject this");
        }

        const data = {
          Appr_Code,
          Remark,
        };

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE MGA_Approval
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 0,
                Appr_1_Rem = :Remark,
                Fin_Appr = 0
            WHERE UTD = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
          `;

          const mobile_emp = await sequelize.query(
            `select mobile_no,CONCAT(EMPFIRSTNAME,' ', EMPLASTNAME)AS EMPNAME from employeemaster where empcode='${c.emp_code}'`
          );
          const comp_name = await sequelize.query(
            `select top 1 comp_name from comp_mst`
          );
          if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
            await SendWhatsAppMessgae(
              compcode,
              mobile_emp[0][0].mobile_no,
              "mga_reject",
              [
                {
                  type: "text",
                  text: mobile_emp[0][0]?.EMPNAME,
                },
                {
                  type: "text",
                  text: item?.rowData?.Cust_Name,
                },
                {
                  type: "text",
                  text: item?.rowData?.Cust_Mobile,
                },
                {
                  type: "text",
                  text: item?.rowData?.Cust_Id,
                },
                {
                  type: "text",
                  text: item?.rowData?.Invoice_No,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr1_name,
                },
                {
                  type: "text",
                  text: Remark,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr1_name,
                },
                {
                  type: "text",
                  text: comp_name[0][0].comp_name,
                },
              ]
            );
          }
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE MGA_Approval
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 0,
                Appr_2_Rem = :Remark,
                Fin_Appr = 0
            WHERE UTD = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
          const mobile_emp = await sequelize.query(
            `select mobile_no,CONCAT(EMPFIRSTNAME,' ', EMPLASTNAME)AS EMPNAME from employeemaster where empcode='${c.emp_code}'`
          );
          const comp_name = await sequelize.query(
            `select top 1 comp_name from comp_mst`
          );
          if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
            await SendWhatsAppMessgae(
              compcode,
              mobile_emp[0][0].mobile_no,
              "mga_reject",
              [
                {
                  type: "text",
                  text: mobile_emp[0][0]?.EMPNAME,
                },
                {
                  type: "text",
                  text: item?.rowData?.Cust_Name,
                },
                {
                  type: "text",
                  text: item?.rowData?.Cust_Mobile,
                },
                {
                  type: "text",
                  text: item?.rowData?.Cust_Id,
                },
                {
                  type: "text",
                  text: item?.rowData?.Invoice_No,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr2_name,
                },
                {
                  type: "text",
                  text: Remark,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr2_name,
                },
                {
                  type: "text",
                  text: comp_name[0][0].comp_name,
                },
              ]
            );
          }
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE MGA_Approval
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 0,
                Appr_3_Rem = :Remark,
                Fin_Appr = 0
            WHERE UTD = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        }
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM MGA_Approval WHERE UTD = :tran_id;`,
          {
            replacements: { tran_id },
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, tran_id },
          });
        }

        console.log({
          success: true,
          Message:
            affectedRows.length === 0
              ? "Cannot Reject"
              : `Rejected on level ${ApprovalLevel}`,
        });
      }
    }

    // await t.commit();
  } catch (e) {
    console.error(e);
    // await t.rollback();
    throw e;
  }
}

exports.CustomerDetailsForApprover = async function (req, res) {
  const compcode = Buffer.from(req.headers.compcode, "base64").toString(
    "utf-8"
  ); // Base64 decode
  const UTD = Buffer.from(req.body.UTD, "base64").toString("utf-8");
  const Appr_Code = Buffer.from(req.body.Appr_Code, "base64").toString("utf-8");

  console.log(compcode, UTD, Appr_Code, "kkk");
  const sequelize = await dbname(compcode);
  try {
    const CustomerData = await sequelize.query(
      `SELECT CAST(Req_Date AS DATE) AS Req_Date,Cust_Id,Cust_Status, Cust_Name, VIN, Invoice_No, Cust_Mobile, MGAIssuedDMS FROM MGA_Approval where utd = '${UTD}'`
    );

    const CustomerDataDtl = await sequelize.query(`SELECT UTD, MGA_Description, 
      (SELECT TOP 1 Cust_Id 
       FROM MGA_Approval 
       WHERE MGA_Approval.UTD = MGA_Approval_Dtl.MGA_Approval_UTD) AS Cust_Id, 
      Quantity, 
      Amount,
      SUM(CAST(Amount AS DECIMAL(18, 2))) OVER () AS TotalAmount FROM MGA_Approval_dtl 
WHERE MGA_Approval_UTD = '${UTD}'`);

    const GetPromisedAmt =
      await sequelize.query(`select top 1 MGA_Pric from icm_dtl where tran_id =
        (select top 1 tran_id from ICM_MST where cust_id=(select top 1 cust_id from MGA_Approval where MGA_Approval. utd = '${UTD}') 
      and Loc_Code in (select top 1 Location from MGA_Approval where MGA_Approval. utd = '${UTD}'))`);

    const GetLedgerShort =
      await sequelize.query(`select ledg_ac,sum(iif(amt_drcr=1,post_amt,post_amt*-1)) as ledger_balance,(select net_bal from ICM_MST where Ledg_Ac=ledg_Acnt) as short from Acnt_Post 
where acnt_post.export_Type<5 and ledg_Ac  in(select ledg_acnt from icm_mst where cust_id= (select top 1 cust_id from MGA_Approval where MGA_Approval. utd = '${UTD}') and acnt_post.loc_code=icm_mst.Loc_Code and ICM_MST.EXPORT_TYPE<5)
group by ledg_ac`);

    CustomerData[0][0].MGAPromisedAmt = GetPromisedAmt[0][0].MGA_Pric;
    CustomerData[0][0].Ledg_Bal = GetLedgerShort[0][0].ledger_balance;
    CustomerData[0][0].ICM_Short_Access = GetLedgerShort[0][0].short;
    CustomerData[0][0].MGARequestedAmt = CustomerDataDtl[0][0].TotalAmount;

    const MGAIssuedDMS = parseFloat(CustomerData[0][0].MGAIssuedDMS) || 0;
    const MGARequestedAmt = parseFloat(CustomerData[0][0].MGARequestedAmt) || 0;
    CustomerData[0][0].MGADiff = MGAIssuedDMS - MGARequestedAmt;

    const query = `
    select * from (
      select
      iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver1_A, approver1_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver2_A, approver2_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver3_A, approver3_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode =
                (select iif(Appr_1_Code is not null,Appr_1_Code,
                (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                 from Approval_Matrix where module_code = 'MGA' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr1_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode =
                (select iif(Appr_2_Code is not null,Appr_2_Code,
                (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                 from Approval_Matrix where  module_code = 'MGA' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr2_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
            where empcode =
                (select iif(Appr_3_Code is not null,Appr_3_Code,
                (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                 from Approval_Matrix where module_code = 'MGA' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr3_name,
                iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}'
               IN (approver1_A, approver1_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
               IN (approver2_A, approver2_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
               IN (approver3_A, approver3_B) and module_code = 'MGA' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
              UTD,Cast(Req_Date as date)as Req_Date, Cust_Id, Cust_Name,VIN, Invoice_No,  Cust_Mobile, MGAIssuedDMS, Location,
        (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster  where employeemaster.empcode =MGA_Approval.srm)as EmpName,
        Appr_1_Rem, Appr_2_Rem, Appr_3_Rem, srm as emp_code
        from MGA_Approval  where  srm in  (select empcode from approval_matrix where
                  '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B)) and utd='${UTD}'
                ) as dasd 
                where  (status_khud_ka is null and status_appr is null)  Order By utd desc
                 `;

    const Approve = await sequelize.query(query);

    console.log(Approve, "Approve");

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      CustomerData: CustomerData[0][0],
      CustomerDataDtl: CustomerDataDtl[0],
      Approve: Approve[0],
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

// CustomerViewViaMsg: Displays the MGA approval details
// Function to view the page with customer data and details
exports.CustomerViewViaMsg = async function (req, res) {
  try {
    const compcode = Buffer.from(req.query.compcode, "base64").toString(
      "utf-8"
    ); // Base64 decode
    const UTD = Buffer.from(req.query.UTD, "base64").toString("utf-8");
    const sequelize = await dbname(compcode);

    // Query for the asset details
    const results = await sequelize.query(
      `SELECT MGA_Description, Quantity, Amount FROM MGA_Approval_dtl WHERE MGA_Approval_UTD = '${UTD}';`
    );

    // Query for employee details and Cust_Status
    const result1 = await sequelize.query(
      `SELECT CAST(REQ_DATE AS DATE) AS Req_Date, Cust_Id, Invoice_No, VIN, Cust_Name, Cust_Mobile, MGAIssuedDMS, Cust_Status 
       FROM MGA_Approval WHERE UTD = '${UTD}';`
    );

    const assetDetails = results[0];
    const employeeDetails = result1[0][0];

    let totalAmount = 0;
    assetDetails.forEach((item) => {
      totalAmount += parseFloat(item.Amount); // Ensure Amount is treated as a number
    });

    // Generate HTML response with disabled button logic
    const isDisabled = employeeDetails.Cust_Status !== null ? "disabled" : "";

    const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>MGA Approval Details</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f9f9f9;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        h1 {
          color: #004080;
          text-align: center;
        }
        h3 {
          color: #004080;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        tfoot {
          font-weight: bold;
        }
        .total-row {
          background-color: #f9f9f9;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          padding: 20px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .scrollable-table {
          max-height: 300px;
          overflow-y: auto;
        }
        .button-container {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }
        .button {
          background-color: #004080;
          color: white;
          border: none;
          padding: 10px 20px;
          margin: 0 10px;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          border-radius: 5px;
        }
        .button:hover {
          background-color: #003366;
        }
        .button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        #message {
          text-align: center;
          margin-top: 20px;
          padding: 10px;
          font-size: 1.2em;
          display: none; /* Initially hidden */
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>MGA APPROVAL</h1>
        <table>
          <tr>
            <th>Request Date</th>
            <td>${employeeDetails.Req_Date}</td>
          </tr>
          <tr>
            <th>Customer ID</th>
            <td>${employeeDetails.Cust_Id}</td>
          </tr>
          <tr>
            <th>Invoice No</th>
            <td>${employeeDetails.Invoice_No}</td>
          </tr>
          <tr>
            <th>VIN</th>
            <td>${employeeDetails.VIN}</td>
          </tr>
          <tr>
            <th>Customer Name</th>
            <td>${employeeDetails.Cust_Name}</td>
          </tr>
          <tr>
            <th>Customer Mobile</th>
            <td>${employeeDetails.Cust_Mobile}</td>
          </tr>
          <tr>
            <th>MGA Issued DMS</th>
            <td>${employeeDetails.MGAIssuedDMS}</td>
          </tr>
        </table>
    
        <h3>MGA DETAILS</h3>
        <div class="scrollable-table">
          <table>
            <thead>
              <tr>
                <th>MGA Description</th>
                <th>Quantity</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${assetDetails
                .map(
                  (item) => `
                <tr>
                  <td>${item.MGA_Description}</td>
                  <td>${item.Quantity}</td>
                  <td>₹${parseFloat(item.Amount).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="2">Total Amount</td>
                <td>₹${totalAmount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
    
        <div class="button-container">
          <button id="yesButton" class="button" onclick="handleApproval('yes', '${UTD}', '${
      req.query.compcode
    }')" ${isDisabled}>Yes</button>
          <button id="noButton" class="button" onclick="handleApproval('no', '${UTD}', '${
      req.query.compcode
    }')" ${isDisabled}>No</button>
        </div>
        
        <!-- Message Display Section -->
        <div id="message"></div>
      </div>
    
      <script>
        function handleApproval(response, utd, compcode) {
          // Disable both buttons once one is clicked
          document.getElementById('yesButton').disabled = true;
          document.getElementById('noButton').disabled = true;

          fetch('https://erp.autovyn.com/backend/MGAApproval/UpdateForCustomer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'compcode': compcode
            },
            body: JSON.stringify({ UTD: utd, response: response, compcode: compcode })
          })
          .then(res => res.json())
          .then(data => {
            showMessage(\`Your response '\${response}' was submitted successfully.\`);
          })
          .catch(err => {
            console.error('Error:', err);
            showMessage('An error occurred while submitting your response. Please try again.', true);
          });
        }

        function showMessage(message, isError = false) {
          const messageElement = document.getElementById('message');
          messageElement.textContent = message;
          messageElement.style.color = isError ? 'red' : 'green';
          messageElement.style.display = 'block'; // Make the message visible
        }
      </script>
    </body>
    </html>
    `;

    res.send(htmlResponse);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send("An error occurred while fetching employee asset data");
  }
};

// Function to update the customer response status
exports.UpdateForCustomer = async function (req, res) {
  try {
    const UTD = req.body.UTD;
    const response = req.body.response;
    const sequelize = await dbname( Buffer.from(req.body.compcode, "base64").toString(
      "utf-8"
    ));

    // Update query to set the customer status only if Cust_Status is null
    const query = `UPDATE MGA_Approval SET Cust_Status = '${response}' WHERE UTD = '${UTD}' AND Cust_Status IS NULL`;
    await sequelize.query(query);

    res.status(200).send({
      success: true,
      message: `Customer response '${response}' saved successfully.`,
    });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .send({ success: false, message: "Error updating customer response." });
  }
};

exports.MGAReport = async function (req, res) {
  try {
    const Location = req.body.Location;
    const DateFrom = req.body.DateFrom;
    const DateTo = req.body.DateTo;
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(`
    SELECT 
    tran_id, 
    utd, 
    Bill_Date, 
    Ledger_Id, 
    Ledger_Name, 
    Bill_No, 
    (SELECT SUM(taxable + CGST + SGST + IGST + Cess_Amt)
     FROM DMS_ROW_DATA 
     WHERE Ledger_Id = dasd.Ledger_Id 
       AND Tran_Type = 4 
       AND Loc_Code in (${Location})
    ) AS Inv_Amt,
    (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME
     FROM EMPLOYEEMASTER
     WHERE EMPCODE = Mg.EmpCode) AS EmpName,
    (SELECT TOP 1 MOBILE2
     FROM GD_FDI_TRANS_customer
     WHERE cust_id = dasd.Ledger_Id      
       AND LOC_CD IN (
           SELECT REPLACE(newcar_rcpt, '-S', '')
           FROM GODOWN_MST
           WHERE Godw_Code IN (${Location}) AND Export_Type < 3
       )
    ) AS Mobile2,
    (SELECT SUM(CAST(d.Amount AS DECIMAL(10, 2)))
     FROM MGA_Approval_dtl AS d      
     WHERE d.MGA_Approval_UTD = Mg.utd
    ) AS MGARequestedAmt,
    (SELECT TOP 1 mga_pric
     FROM icm_dtl
     WHERE tran_id = (
         SELECT TOP 1 tran_id        
         FROM ICM_MST
         WHERE ICM_MST.cust_id = dasd.Ledger_Id
     )
    ) AS MGAPromisedAmt,
    (SELECT TOP 1 godw_name
     FROM GODOWN_MST
     WHERE Godw_Code = dasd.loc_code 
    ) AS Location,
    Cust_Status,
    CASE
        WHEN Mg.appr_1_stat = 1 THEN 'Approved'
        WHEN Mg.appr_1_stat = 0 THEN 'Rejected'
        ELSE 'Pending'
    END AS Approval_1_Status, 
    Appr_1_stat,
    CASE
        WHEN Mg.appr_2_stat = 1 THEN 'Approved'
        WHEN Mg.appr_2_stat = 0 THEN 'Rejected'
        ELSE 'Pending'
    END AS Approval_2_Status,
    Appr_2_stat,
    CASE
        WHEN Mg.Fin_Appr = 1 THEN 'Approved'
        WHEN Mg.Fin_Appr = 0 THEN 'Rejected'
        ELSE 'Pending'
    END AS Final_Status, 
    Fin_Appr
FROM (
    SELECT DISTINCT Ledger_Id, tran_id, Bill_Date, Ledger_Name, VIN, Bill_No, loc_code, Inv_Amt        
    FROM DMS_ROW_DATA
    WHERE Tran_Type = 4
      AND Export_Type IN (1, 2)
      AND ledger_id IN (
          SELECT cust_id
          FROM ICM_MST
          WHERE Export_Type < 5
            AND Ledger_Id = Cust_Id
            AND Bill_Date > Delv_Date               
            AND ICM_MST.VIN = DMS_ROW_DATA.VIN
            AND ICM_MST.loc_code = DMS_ROW_DATA.loc_code
      )
      AND CAST(bill_date AS DATE) BETWEEN '${DateFrom}' AND '${DateTo}'
      AND loc_code IN (${Location})
) AS dasd
LEFT JOIN MGA_Approval mg ON mg.Cust_Id = dasd.Ledger_Id AND Bill_No = mg.Invoice_No
ORDER BY EmpName DESC, Ledger_Id
    `);

    res.status(200).send(result[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.MGAUpdate = async function (req, res) {
  try {
    const Location = req.body.Location;
    const DateFrom = req.body.DateFrom;
    const DateTo = req.body.DateTo;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
    SELECT UTD, CAST(Req_Date AS DATE) AS Req_Date,(SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME
         FROM EMPLOYEEMASTER
         WHERE EMPCODE = MGA_Approval.EmpCode) AS EmpName,Cust_Id, Cust_Mobile, VIN, Invoice_No, Cust_Name, 
		 Cust_Mobile, (SELECT TOP 1 mga_pric
     FROM icm_dtl
     WHERE tran_id = (
         SELECT TOP 1 tran_id
         FROM ICM_MST
         WHERE ICM_MST.cust_id = MGA_Approval.Cust_Id
     )
    ) AS MGAPromisedAmt, MGAIssuedDMS,  (SELECT TOP 1 godw_name
     FROM GODOWN_MST
     WHERE Godw_Code = MGA_Approval.Location
    ) AS Location, Cust_Status FROM MGA_Approval WHERE Fin_Appr = '1' and Location in (${Location}) and Req_Date between '${DateFrom}' and '${DateTo}' 
    `;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.Updatedata = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body, "requestname");
    const Invoice_No = req.body.Invoice_No;
    const Location = req.body.Location;
    const UTD = req.body.UTD;

    const result =
      await sequelize.query(`SELECT UPPER(REPLACE(LTRIM(RTRIM(Invoice_No)), ' ', '')) AS Invoice_No
          FROM MGA_Approval
          WHERE Location = '${Location}'
          AND (LTRIM(RTRIM(Invoice_No))) = '${Invoice_No}'`);

    if (result[0].length > 0) {
      res.status(400).send({ message: "Invoice Number Already Exist" });
      return;
    }

    // Update query to set the customer status only if Cust_Status is null
    const result1 = await sequelize.query(
      `UPDATE MGA_Approval SET Invoice_No = '${Invoice_No}' WHERE UTD = '${UTD}'`
    );

    res.status(200).send("Updated Successfully");
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .send({ success: false, message: "Error updating customer response." });
  }
};

exports.Dashboard = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "request.body");
  const Location = req.body.Location;
  const monthFrom = req.body.monthFrom;
  const year = req.body.year;

  const t = await sequelize.transaction();
  try {
    const allresult = await sequelize.query(
      `SELECT 
      COUNT(*) AS TotalCases, 
      'TotalCases' AS description  -- Adding a description for clarity
  FROM 
      MGA_Approval 
  WHERE 
      Location  in (${Location}) and MONTH(req_date) = '${monthFrom}'
          AND YEAR(req_date) = '${year}'
  UNION ALL
  
  -- Second part: Calculate YES Cases
  SELECT 
     COUNT(UTD) AS TotalCases, 'Total Yes Cases' AS description  FROM MGA_Approval where Cust_Status = 'yes' and
      Location in (${Location}) and MONTH(req_date) = '${monthFrom}'
          AND YEAR(req_date) = '${year}'
  UNION ALL
  
  --Third Part: Calulate No Cases
 SELECT 
     COUNT(UTD) AS TotalCases, 'Total No Cases' AS description  FROM MGA_Approval where Cust_Status = 'no' and
      Location in (${Location}) and MONTH(req_date) = '${monthFrom}'
          AND YEAR(req_date) = '${year}'
  UNION ALL

   --Fourth Part: Calulate Approved Cases
 SELECT 
     COUNT(UTD) AS TotalCases, 'Total Approved Cases' AS description  FROM MGA_Approval where Fin_Appr = '1' and
      Location in (${Location}) and MONTH(req_date) = '${monthFrom}'
          AND YEAR(req_date) = '${year}'
  UNION ALL
  
  --Fifth Part: Calculate Rejected Cases
  SELECT 
     COUNT(UTD) AS TotalCases, 'Total Rejected Cases' AS description  FROM MGA_Approval where Fin_Appr = '0' and
      Location in (${Location}) and MONTH(req_date) = '${monthFrom}'
          AND YEAR(req_date) = '${year}'
  UNION ALL
  
  --Sixth Part: Calculate FraudRate
 SELECT  
    CAST(ROUND((COUNT(UTD) * 100.0 / (SELECT COUNT(UTD) 
                                 FROM MGA_Approval 
                                 WHERE Location IN (${Location}))), 2) AS DECIMAL(5,2)) AS TotalCases, 'Total Fraud Cases' AS description  
FROM MGA_Approval 
WHERE Cust_Status = 'no' 
AND Location IN (${Location}) and MONTH(req_date) = '${monthFrom}'
          AND YEAR(req_date) = '${year}'
      `,
      { transaction: t }
    );

    console.log(allresult[0][1], "allresult");
    const LocationWise =
      await sequelize.query(`select COUNT(*) as NoCases,Location from MGA_Approval WHERE Cust_Status ='no' AND MONTH(Req_Date) = '${monthFrom}'
    AND YEAR(Req_Date) = '${year}'  GROUP BY Location`);

    const EmployeeWise =
      await sequelize.query(`select COUNT(utd) as NoCases,EmpCode as Location from MGA_Approval WHERE Cust_Status ='no' AND MONTH(Req_Date) = '${monthFrom}'
    AND YEAR(Req_Date) = '${year}' and Location in (${Location}) GROUP BY EmpCode`);

    const combinedObject = {
      TotalCases: allresult[0][0].TotalCases || 0,
      YesCases: allresult[0][1].TotalCases || 0,
      NoCases: allresult[0][2].TotalCases || 0,
      ApprovedCases: allresult[0][3].TotalCases || 0,
      RejectCases: allresult[0][4].TotalCases || 0,
      FraudRateCases: allresult[0][5].TotalCases || 0,
    };

    console.log(combinedObject, "combineobject");

    await t.commit();
    res.status(200).send({
      current: combinedObject,
      LocationWise: LocationWise[0],
      EmployeeWise: EmployeeWise[0],
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.MGABillAmt = async function (req, res) {
  try {
    const Location = req.body.Location;
    const Invoice_No = req.body.Invoice_No;
    const sequelize = await dbname(req.headers.compcode);
    let query = `select top 1 Inv_Amt from DMS_ROW_DATA where Bill_No = '${Invoice_No}' 
    AND Loc_Code = '${Location}'
    AND tran_type = 4
    AND Export_Type < 3 `;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0][0]);
  } catch (e) {
    console.log(e);
  }
};


exports.ShowCustomerdtlAmt = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const Cust_Id = req.body.Cust_Id;
    const Location = req.body.Location;

    const result = await sequelize.query(`
    SELECT DISTINCT Tran_Id,
      VIN, 
      Bill_No AS Invoice_No, 
      Ledger_Name AS Cust_Name, 
      (Inv_amt+ Rnd_Off) AS MGAIssuedDMS,
      (SELECT TOP 1 mga_pric FROM icm_dtl WHERE Tran_Id = 
        (SELECT TOP 1 Tran_Id FROM ICM_MST WHERE ICM_MST.Cust_Id = DMS_ROW_DATA.Ledger_Id)) AS MGAPromisedAmt
    FROM 
      DMS_ROW_DATA 
    WHERE 
      ledger_id = '${Cust_Id}' 
      AND Loc_Code = '${Location}'
      AND tran_type = 4 
      AND Export_Type < 3
  `);


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
  }
};
