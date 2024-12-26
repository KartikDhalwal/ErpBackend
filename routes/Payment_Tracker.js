const { dbname } = require("../utils/dbconfig");
const { Sequelize, DataTypes, literal } = require("sequelize");
const { SendWhatsAppMessgae } = require("./user");
const path = require("path");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const crypto = require('crypto');
const { _Payment_Tracker, paymentTrackerSchema } = require("../models/PaymentTracker");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const { jsPDF } = require("jspdf");


exports.PreData = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const empcode = req.body.empcode;
  const Valid_From = req.body.Valid_From;
  const Valid_Upto = req.body.Valid_Upto;
  try {
    const varient = await sequelize.query(
      `SELECT 
    Modl_Name AS label, 
    MIN(Item_Code) AS value -- Select the smallest Item_Code for each Modl_Name
FROM Modl_mst
WHERE Modl_Grp <> 0
GROUP BY Modl_Name
ORDER BY Modl_Name;
`);
    const result = await sequelize.query(
      `select * from (
        select
        iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}' 
               IN (approver1_A, approver1_B) and module_code = 'Payment_Tracker' and Payment_Tracker.SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}' 
               IN (approver2_A, approver2_B) and module_code = 'Payment_Tracker' and Payment_Tracker.SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}' 
               IN (approver3_A, approver3_B) and module_code = 'Payment_Tracker' and Payment_Tracker.SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
        
                  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
              where empcode =
                  (select iif(Appr_1_Code is not null,Appr_1_Code,
                  (select iif(Approver1_A = '${empcode}', Approver1_A, iif(Approver1_B = '${empcode}',Approver1_B,Approver1_A))
                   from Approval_Matrix where module_code = 'Payment_Tracker' and   Payment_Tracker.SRM collate database_default = empcode collate database_default)))
                  and   Export_Type < 3) as apr1_name,
                                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
              where empcode =
                  (select iif(Appr_2_Code is not null,Appr_2_Code,
                  (select iif(Approver2_A = '${empcode}', Approver2_A, iif(Approver2_B = '${empcode}',Approver2_B,Approver2_A))
                   from Approval_Matrix where  module_code = 'Payment_Tracker' and   Payment_Tracker.SRM collate database_default = empcode collate database_default)))
                  and   Export_Type < 3) as apr2_name,
                  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
              where empcode = 
                  (select iif(Appr_3_Code is not null,Appr_3_Code,
                  (select iif(Approver3_A = '${empcode}',Approver3_A,iif(Approver3_B = '${empcode}',Approver3_B,Approver3_A))
                   from Approval_Matrix where module_code = 'Payment_Tracker' and   Payment_Tracker.SRM collate database_default = empcode collate database_default)))
                  and   Export_Type < 3) as apr3_name,
                  iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${empcode}' 
                 IN (approver1_A, approver1_B) and module_code = 'Payment_Tracker' and Payment_Tracker.SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}' 
                 IN (approver2_A, approver2_B) and module_code = 'Payment_Tracker' and Payment_Tracker.SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}' 
                 IN (approver3_A, approver3_B) and module_code = 'Payment_Tracker' and Payment_Tracker.SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
                  iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4) as stat,
                  (select Modl_Name from Modl_Mst where Item_Code=Model_Variant)as Model_Variant_Name,
         (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode =srm)as srmname,FORMAT(req_date, 'dd/MM/yyyy') AS Request,* from Payment_Tracker WHERE srm in ('${empcode}') and Cast(Req_date as date) between '${Valid_From}' And '${Valid_Upto}') as dasd order by tran_id desc  `
    );
    res.status(200).send({ varient: varient[0], result: result[0] });
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};
exports.showrecipt = async function (req, res) {
  try {
    const sequelize = await dbname(req.query.compcode);
    const result = await sequelize.query(`select 
       (select Modl_Name from Modl_Mst where Item_Code=Model_Variant)as Model_Variant_Name,
         (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode =srm)as srmname,
      cast(req_date as date)as req_date,Customer_Name,Approved_amt,Bill_No,Location,Mode_OF_Payement from payment_tracker where tran_id=${req.query.id}`)
    const data = result[0][0];

    const BranchData = await sequelize.query(`
      select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
      gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
      from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
      where  gm.Export_Type < 3 AND gm.Godw_code  in (${data.Location})`)
    const branch = BranchData[0][0];
    const doc = new jsPDF();
    // Add the logo on the left
    const logoPath = path.join(__dirname, "..", "public", "logo.png");
    if (fs.existsSync(logoPath)) {
      const logo = fs.readFileSync(logoPath).toString("base64");
      // Add logo to the left
      doc.addImage(logo, "PNG", 10, 20, 30, 15); // x = 10, y = 20, width = 30, height = 15
    }

    // Add the branch details in the center
    doc.setFontSize(11);
    doc.setTextColor(0);
    const branchDetails = `
    ${branch.Comp_Name}
    ${branch.Godw_Add1 || ""}
    ${branch.Godw_Add2 || ""}
    ${branch.Godw_Add3 || ""}
    ${branch.Godw_Name || ""}
    `;
    doc.text(branchDetails.trim(), 105, 20, null, null, "center"); // x = 105 centers the text

    // Optional: Add another image (e.g., Maruti logo) on the right
    const marutiLogoPath = path.join(__dirname, "..", "public", "maruti.png");
    if (fs.existsSync(marutiLogoPath)) {
      const marutiLogo = fs.readFileSync(marutiLogoPath).toString("base64");
      // Add branding/logo to the right
      doc.addImage(marutiLogo, "PNG", 170, 20, 30, 15); // x = 170, y = 20, width = 30, height = 15
    }

    // Add a border below the header
    doc.setDrawColor(0); // Black border color
    doc.setLineWidth(0.5); // Border thickness
    doc.line(10, 40, 200, 40); // x1, y1, x2, y2 (draw line from left to right)



    // Add receipt details below the header
    doc.setFontSize(12);
    doc.rect(10, 50, 190, 100); // Box for the receipt content
    doc.text(`Customer Name: ${data.Customer_Name}`, 15, 60);
    doc.text(`Bill No: ${data.Bill_No}`, 15, 70);
    doc.text(`Model Variant: ${data.Model_Variant_Name}`, 15, 80);
    doc.text(`Payment Mode: ${data.Mode_OF_Payement}`, 15, 90);
    doc.text(`Date: ${data.req_date}`, 15, 100);
    doc.text(`Amount: ${data.Approved_amt.toFixed(2)}`, 15, 110);

    // Footer or additional spacing
    // doc.text("Thank you for your payment!", 105, 160, null, null, "center");

    // Send the PDF as a response
    const pdfBuffer = doc.output("arraybuffer");
    res.contentType("application/pdf");
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during Saving." });
  }
};
exports.SaveData = async function (req, res) {
  // Validate Asset Product data
  const { error: assetError, value: Payment_Data } =
    paymentTrackerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
  // Check if any validation errors occurred
  if (assetError) {
    const errors = assetError.details
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }
  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    // Create the Asset Product
    const AssetProduct = _Payment_Tracker(sequelize, Sequelize.DataTypes);
    const createdAssetProduct = await AssetProduct.create(Payment_Data, {
      transaction: t,
      returning: true,
    });
    await t.commit();
    res.status(200).json(createdAssetProduct);
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback();
    }
    res.status(500).json({ error: "An error occurred during Saving." });
  }
};
exports.viewpaymentapproaldata = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    let query
    query = `
 select * from (
     select
     iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver1_A, approver1_B) and module_code = 'Payment_Tracker' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver2_A, approver2_B) and module_code = 'Payment_Tracker' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver3_A, approver3_B) and module_code = 'Payment_Tracker' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_1_Code is not null,Appr_1_Code,
               (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                from Approval_Matrix where module_code = 'Payment_Tracker' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr1_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_2_Code is not null,Appr_2_Code,
               (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                from Approval_Matrix where  module_code = 'Payment_Tracker' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr2_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode = 
               (select iif(Appr_3_Code is not null,Appr_3_Code,
               (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                from Approval_Matrix where module_code = 'Payment_Tracker' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr3_name,
               iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
              IN (approver1_A, approver1_B) and module_code = 'Payment_Tracker' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver2_A, approver2_B) and module_code = 'Payment_Tracker' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver3_A, approver3_B) and module_code = 'Payment_Tracker' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
			  (select Modl_Name from Modl_Mst where Item_Code=Model_Variant)as Model_Variant_Name,
        IIF(fin_appr= 1 OR fin_appr= 0, 4, IIF(Appr_1_Stat IS NULL, 1, IIF(Appr_2_Stat IS NULL, 2, IIF(Appr_3_Stat IS NULL, 3, 3)))) AS stat,
         (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode =srm)as srmname,srm as empcode,
                FORMAT(req_date, 'dd/MM/yyyy') AS Request,* from [Payment_Tracker] where  location in (${loc_code}) and cast(Req_Date as date)  between '${dateFrom}' and '${dateto}' and  srm in  (select empcode from approval_matrix where 
                 '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))
               ) as dasd 
                 `;
    if (req.body.status == 2) {
      query += `where  (status_khud_ka is null and status_appr is null) order by Req_Date`
    } else {
      query += `where  status_khud_ka =${req.body.status}  order by Req_Date`

    }

    const branch = await sequelize.query(query);
    res.status(200).send({
      branch: branch[0]
    });
  } catch (e) {
    console.log(e);
  }
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const processMainData = async (compcodePassed, mainData, sequelize, Appr_Code, Remark) => {
  // const t = await sequelize.transaction();
  const backgroundTasks = [];

  try {
    // Pre-fetch necessary static data
    const comp_name_result = await sequelize.query(`SELECT TOP 1 comp_name FROM comp_mst`);
    const comp_name = comp_name_result[0][0]?.comp_name;
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.srm;
      const tran_id = c?.tran_id;

      const a = await sequelize.query(
        `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = :empcode AND module_code = 'Payment_Tracker'`,
        {
          replacements: { empcode }
          // , transaction: t
        }
      );

      if (a[0]?.length > 0) {
        const approvers = a[0][0];
        let ApprovalLevel = 0;
        let Final_apprvl = null;

        if ([approvers.approver1_A?.toLowerCase(), approvers.approver1_B?.toLowerCase()].includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 1;
        } else if ([approvers.approver2_A?.toLowerCase(), approvers.approver2_B?.toLowerCase()].includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 2;
        } else if ([approvers.approver3_A?.toLowerCase(), approvers.approver3_B?.toLowerCase()].includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel === 0) {
          throw new Error("You are not the right person to approve this");
        }

        if ((ApprovalLevel === 1 && !approvers.approver2_A && !approvers.approver2_B && !approvers.approver2_C) ||
          (ApprovalLevel === 2 && !approvers.approver3_A && !approvers.approver3_B && !approvers.approver3_C)) {
          Final_apprvl = 1;
        }
        const data = {
          Appr_Code,
          Remark,
          Final_apprvl
        };
        let query = "";
        let query2 = null;

        if (ApprovalLevel === 1) {
          query2 = `
            UPDATE payment_tracker
            SET Approved_amt = Dise_Amt
            WHERE Approved_amt IS NULL AND Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
          query = `
            UPDATE payment_tracker
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 1,
                Appr_1_Rem = :Remark,
                appr_1_date=GETDATE(),
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE payment_tracker
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 1,
                appr_2_date=GETDATE(),
                Appr_2_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE payment_tracker
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 1,
                Appr_3_Rem = :Remark,
                Fin_Appr = 1
            WHERE Tran_id = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        }
        // Execute the update queries
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM payment_tracker WHERE Tran_id = :tran_id`,
          {
            replacements: { tran_id }
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          if (query2) {
            await sequelize.query(query2, {
              replacements: { ...data, tran_id }
              // , transaction: t 
            }
            );
          }
          await sequelize.query(query, {
            replacements: { ...data, tran_id }
            // , transaction: t 
          });
        }
        if (data.Final_apprvl == 1) {
          backgroundTasks.push(() => SendWhatsAppMessgae(compcodePassed, item?.rowData.Mobile_No, 'customer_receipt1', [
            { "type": "text", "text": item?.rowData?.Customer_Name },
            { "type": "text", "text": item?.rowData?.Customer_Name },
            { "type": "text", "text": item?.rowData?.Model_Variant_Name },
            { "type": "text", "text": item?.rowData?.Mode_OF_Payement },
            { "type": "text", "text": item?.rowData?.Req_Date },
            { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
            { "type": "text", "text": `https://erp.autovyn.com/backend/Payment_Tracker?compcode=${compcodePassed}&id=${item?.rowData.tran_id}` },
            { "type": "text", "text": comp_name }
          ]));
        }
        // Prepare message sending tasks for background execution
        // if (ApprovalLevel === 1) {
        //   const result = await sequelize.query(`SELECT TOP 1 mobileno FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   backgroundTasks.push(() => SendWhatsAppMessgae(compcodePassed, result[0][0]?.mobileno, 'approver_1_approve_message', [
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
        //     const approver2 = await sequelize.query(`SELECT TOP 1 mobileno FROM employeemaster WHERE empcode=(SELECT TOP 1 approver2_A FROM approval_matrix WHERE empcode='${item?.rowData.SRM}' AND module_code='Payment_Tracker')`);
        //     const outlet_name = await sequelize.query(`SELECT TOP 1 br_extranet FROM godown_mst WHERE godw_code='${item?.rowData.location}' AND export_type<3`);
        //     if (approver2[0]?.length && approver2[0][0].mobileno) {
        //       backgroundTasks.push(() => SendWhatsAppMessgae(compcodePassed, approver2[0][0].mobileno, 'disc_appr_msg_l2_new1', [
        //         { "type": "text", "text": outlet_name[0][0].br_extranet },
        //         { "type": "text", "text": `${item.rowData.Modl_Group_Name} , ${item.rowData.modl_name} , ${item.rowData.Veh_Clr_Name}` },
        //         { "type": "text", "text": item?.rowData?.Cust_Name },
        //         { "type": "text", "text": item?.rowData?.Dise_Amt },
        //         { "type": "text", "text": item?.rowData?.Approved_amt },
        //         { "type": "text", "text": item?.rowData?.RM_Name },
        //         { "type": "text", "text": item?.rowData?.book_date },
        //         { "type": "text", "text": comp_name }
        //       ]));
        //     }
        //   }
        // } else if (ApprovalLevel === 2) {
        //   const mobile_emp = await sequelize.query(`SELECT TOP 1 mobileno FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobileno) {
        //     backgroundTasks.push(() => SendWhatsAppMessgae(compcodePassed, mobile_emp[0][0].mobileno, 'approver_reject_message', [
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
          Message: affectedRows.length === 0 ? "Cannot Approve" : `Approved on level ${ApprovalLevel}`
        });
      }
    }
    // await t.commit();
    // Respond to the caller immediately
    return {
      success: true,
      message: 'Main data processing initiated'
    };
  } catch (e) {
    console.error(e);
    //p
    throw e;
  }
  finally {
    setTimeout(async () => {
      try {
        for (const task of backgroundTasks) {
          await task();
          await delay(2000);
          // Execute each function in backgroundTasks
        }
      } catch (err) {
        console.error('Error executing background tasks:', err);
      }
    }, 1000);

  }
};
exports.approveby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (!Appr_Code) {
      return res.status(400).send({
        status: false,
        Message: "Appr_Code is mandatory"
      });
    }

    if (!mainData?.length) {
      return res.status(400).send({
        status: false,
        Message: "Please select the entry to approve"
      });
    }

    await processMainData(req.headers.compcode, mainData, sequelize, Appr_Code, Remark);

    return res.status(200).send({ success: true, Message: "Approved Successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};
exports.rejectby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
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

    await processMainData1(req.headers.compcode, mainData, sequelize, Appr_Code, Remark);

    return res.status(200).send({ success: true, Message: "Request Rejected Successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ status: false, Message: "Internal Server Error" });
  }
};
async function processMainData1(compcodePassed, mainData, sequelize, Appr_Code, Remark) {
  // const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.srm;
      const tran_id = c?.tran_id;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'Payment_Tracker'`,
        {
          replacements: { empcode }

          // , transaction: t 
        }
      );

      // const mobile_emp = await sequelize.query(`select top 1 mobileno from employeemaster where empcode='${item?.rowData.SRM}'`)
      // const comp_name = await sequelize.query(`select top 1 comp_name from comp_mst`)


      if (a[0]?.length > 0) {
        const approvers = a[0][0];
        let ApprovalLevel = 0;

        if ([approvers.approver1_A?.toLowerCase(), approvers.approver1_B?.toLowerCase()].map(approver => approver?.toLowerCase()).includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 1;
        } else if ([approvers.approver2_A, approvers.approver2_B].map(approver => approver?.toLowerCase()).includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 2;
        } else if ([approvers.approver3_A, approvers.approver3_B].map(approver => approver?.toLowerCase()).includes(Appr_Code?.toLowerCase())) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel === 0) {
          throw new Error("You are not the right person to reject this");
        }

        const data = {
          Appr_Code,
          Remark
        };

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE payment_tracker
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 0,
                Appr_1_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
          `;
          // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobileno) {
          //   await SendWhatsAppMessgae(compcodePassed, mobile_emp[0][0].mobileno, 'approver_1_2_reject_messaage', [
          //     {
          //       "type": "text",
          //       "text": item?.rowData.empname
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Cust_Name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Mob
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.modl_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr1_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Appr_1_Rem ? item?.rowData?.Appr_1_Rem : '(Not Given)'
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr1_name
          //     },
          //     {
          //       "type": "text",
          //       "text": comp_name[0][0].comp_name
          //     }
          //   ])
          // }
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE payment_tracker
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 0,
                Appr_2_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
          // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobileno) {
          //   await SendWhatsAppMessgae(compcodePassed, mobile_emp[0][0].mobileno, 'approver_1_2_reject_messaage', [
          //     {
          //       "type": "text",
          //       "text": item?.rowData.empname
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Cust_Name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Mob
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.modl_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr2_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Appr_2_Rem ? item?.rowData?.Appr_2_Rem : '(Not Given)'
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr2_name
          //     },
          //     {
          //       "type": "text",
          //       "text": comp_name[0][0].comp_name
          //     }
          //   ])
          // }

        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE payment_tracker
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 0,
                Appr_3_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        }
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM payment_tracker WHERE Tran_id = :tran_id;`,
          {
            replacements: { tran_id }
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, tran_id }

          });
        }

        console.log({
          success: true,
          Message: affectedRows.length === 0 ? "Cannot Reject" : `Rejected on level ${ApprovalLevel}`
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
exports.updatediscountamountonly = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const tran_id = req.body.tran_id;
    const amt = req.body.amt;
    await sequelize.query(
      `update payment_tracker set Approved_amt='${amt}' where tran_id='${tran_id}' `
    );

    res.status(200).send("done");
  } catch (e) {
    console.log(e);
  }
};
exports.Update = async function (req, res) {
  // Validate Asset Product data
  const { error: assetError, value: Payment_Data } =
    paymentTrackerSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
  // Check if any validation errors occurred
  if (assetError) {
    const errors = assetError.details
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }
  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    const { tran_id, ...other } = Payment_Data
    const result = await sequelize.query(`select * from Payment_Tracker where tran_id=tran_id and Appr_1_Stat is null`)
    if (result[0].length == 0) {
      return res.status(404).send({ Message: 'Cannot Update Request' })
    }
    // Create the Asset Product
    const AssetProduct = _Payment_Tracker(sequelize, Sequelize.DataTypes);
    const createdAssetProduct = await AssetProduct.update(other, {
      where: { tran_id: tran_id }, // Ensure tran_id is the condition for updating
      transaction: t,
      returning: true, // Return the updated rows
    });
    await t.commit();
    res.status(200).json(createdAssetProduct);
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback();
    }
    res.status(500).json({ error: "An error occurred during Saving." });
  }
};
exports.PaymentBranchwise = async function (req, res) {
  const dateto = req.body.dateto;
  const dateFrom = req.body.dateFrom;
  try {
    const sequelize = await dbname(req.headers.compcode);

    const discountdata = await sequelize.query(
      `
      SELECT 
    COUNT(*) AS total_count,
    COUNT(*) AS request_raised,
    SUM(IIF(appr_1_stat = 1 , 1, 0)) AS approvedby1,
    SUM(IIF(appr_1_stat = 0 , 1, 0)) AS rejectedby1,
    SUM(IIF((appr_1_stat IS NULL) , 1, 0)) AS pendingat1,
    SUM(IIF(appr_2_stat = 1 , 1, 0)) AS approvedby2,
    SUM(IIF(appr_2_stat = 0 , 1, 0)) AS rejectedby2,
    SUM(IIF((appr_2_stat IS NULL AND appr_1_stat = 1) , 1, 0)) AS pendingat2,
    (SELECT Godw_Name FROM godown_mst WHERE Godw_Code= Location AND export_type < 3) AS location_name
	from Payment_Tracker where Location IN (${req.body.multi_loc}) and cast(req_date as date) between  '${dateFrom}' AND '${dateto}'
	group by Location 
   `
    );
    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.PaymentBranchwisesummary = async function (req, res) {
  const dateto = req.body.dateto;
  const value = req.body.value;
  const dateFrom = req.body.dateFrom;
  try {
    const sequelize = await dbname(req.headers.compcode);

    const discountdata = await sequelize.query(
      `
      SELECT 
    cast(req_date as date)as Request,
    (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode =srm)as srmname,
    (select Modl_Name from Modl_Mst where Item_Code=Model_Variant)as Model_Variant_Name,
    *
	from Payment_Tracker where Location IN (${req.body.multi_loc}) and cast(req_date as date) between  '${dateFrom}' AND '${dateto}'
    ${value}
   `
    );
    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};