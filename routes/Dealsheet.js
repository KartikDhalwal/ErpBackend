const { dbname } = require("../utils/dbconfig");
const { Sequelize, DataTypes, literal } = require("sequelize");
const { SendWhatsAppMessgae } = require("./user");
const path = require("path");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const crypto = require('crypto');
const { _DealSheet, dealSheetSchema } = require("../models/DealSheet");
const { _DealSheetMaster, dealSheetMasterSchema } = require("../models/DealSheetMaster");
const { _DealSheetPrice, dealSheetPriceSchema } = require("../models/DealSheetPrice")
const { _DiscountOffers, discountOffersSchema } = require("../models/DiscountOffers");
const { _InsuComp, validateInsuComp } = require("../models/InsuComp");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const { jsPDF } = require("jspdf");
const Joi = require("joi");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");


exports.PreData = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const branch = req.body.branch
  try {
    const Model = await sequelize.query(
      `select Misc_Code AS value,Misc_Name AS label from misc_mst where misc_type=14 and Export_Type<3 and Misc_Name<>'' `);

    const Color = await sequelize.query(
      `select Misc_Name AS label, MIN(Misc_Code) AS value  from Misc_mst where Misc_type=10 and export_type<3 and misc_name!='' and misc_name is not null
    group by Misc_Name
    ORDER BY Misc_Name`
    );
    const BranchData = await sequelize.query(`
    select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
    gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
    from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
    where  gm.Export_Type < 3 AND gm.Godw_code  in (${branch})`)

    const Municipal_Taxes = await sequelize.query(`
    SELECT Misc_Name AS label, Misc_ABBR AS value
    FROM misc_mst
    WHERE misc_type = 632
    UNION ALL
    SELECT 'No' AS label, '0' AS value;`)

    const Insurance = await sequelize.query(`select Insurance_Company as label,Insurance_Company as value from Insu_Comp where 
    CAST(GETDATE() AS date) BETWEEN CAST(Valid_From AS date) AND CAST(Valid_Upto AS date) and Perferred='Yes'`)
    const Discount_Master = await sequelize.query(`
    select name,amount as Percentage from DealSheet_Master where branch in (${branch})and  CAST(GETDATE() AS date) BETWEEN CAST(validfrom AS date) AND CAST(validTo AS date)`)


    res.status(200).send({ Model: Model[0], color: Color[0], BranchData: BranchData[0][0], Municipal_Taxes: Municipal_Taxes[0], Insurance: Insurance[0], Discount_Master: Discount_Master[0] });
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};
exports.Varient = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Model = req.body.Model;
  try {
    const varient = await sequelize.query(
      `SELECT 
    Modl_Name AS label, 
    MIN(Modl_Code) AS value -- Select the smallest Item_Code for each Modl_Name
FROM Modl_mst
WHERE Modl_Grp <> 0 and Modl_Grp='${Model}'
GROUP BY Modl_Name
ORDER BY Modl_Name
`);
    res.status(200).send({ varient: varient[0] });
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};
exports.findprices = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const ModelCode = req.body.Model
  const Loc_Code = req.body.Location
  try {
    const pricess = await sequelize.query(
      `select * from Deal_Sheet_Price where modelcode='${ModelCode}' and Loc_code='${Loc_Code}'
      and CAST(GETDATE() AS date) BETWEEN CAST(Valid_From AS date) AND CAST(Valid_Upto AS date);
`);
    res.status(200).send(pricess[0][0]);
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
      cast(req_date as date)as req_date,Customer_Name,Approved_amt,Bill_No,Location,Mode_OF_Payement from Deal_Sheet where tran_id=${req.query.id}`)
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
    dealSheetSchema.validate(req.body, {
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
    const AssetProduct = _DealSheet(sequelize, Sequelize.DataTypes);
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
            IN (approver1_A, approver1_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver2_A, approver2_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver3_A, approver3_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_1_Code is not null,Appr_1_Code,
               (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                from Approval_Matrix where module_code = 'Deal_Sheet' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr1_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_2_Code is not null,Appr_2_Code,
               (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                from Approval_Matrix where  module_code = 'Deal_Sheet' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr2_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode = 
               (select iif(Appr_3_Code is not null,Appr_3_Code,
               (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                from Approval_Matrix where module_code = 'Deal_Sheet' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr3_name,
               iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
              IN (approver1_A, approver1_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver2_A, approver2_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver3_A, approver3_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
			  * from Deal_Sheet where  location in (${loc_code}) and cast(Req_Date as date)  between '${dateFrom}' and '${dateto}' and  srm in  (select empcode from approval_matrix where 
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
exports.mydeals = async function (req, res) {
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
            IN (approver1_A, approver1_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver2_A, approver2_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver3_A, approver3_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_1_Code is not null,Appr_1_Code,
               (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                from Approval_Matrix where module_code = 'Deal_Sheet' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr1_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_2_Code is not null,Appr_2_Code,
               (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                from Approval_Matrix where  module_code = 'Deal_Sheet' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr2_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode = 
               (select iif(Appr_3_Code is not null,Appr_3_Code,
               (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                from Approval_Matrix where module_code = 'Deal_Sheet' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr3_name,
               iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}' 
              IN (approver1_A, approver1_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver2_A, approver2_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}' 
              IN (approver3_A, approver3_B) and module_code = 'Deal_Sheet' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
			  (select top 1  Misc_Name from Misc_Mst where Misc_Code=Model and Misc_Type=14)as Model_Name,
 (select top 1 Modl_Name from Modl_Mst where Modl_Code=Variant)as Variant_Name,
 * from Deal_Sheet where   cast(Req_Date as date)  between '${dateFrom}' and '${dateto}' and  srm ='${Appr_Code}'
               ) as dasd 
                 `;
    const branch = await sequelize.query(query);
    res.status(200).send({
      branch: branch[0]
    });
  } catch (e) {
    console.log(e);
  }
};
exports.finddetails = async function (req, res) {
  try {
    const tran_id = req.body.tran_id;
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(`select * from deal_sheet where tran_id='${tran_id}'`);
    const pricess = await sequelize.query(
      `select 
      Deal_Sheet_Price.UTD,	Deal_Sheet_Price.ModelCode,	Deal_Sheet_Price.ModelName,	Deal_Sheet_Price.Clr,	Deal_Sheet_Price.Price,	
	  Deal_Sheet_Price.Insurance_1_Year,	Deal_Sheet_Price.Insurance_1_3_Year,	Deal_Sheet_Price.Permanent,
	  Deal_Sheet_Price.Temporary,	Deal_Sheet_Price.Fastag,	Deal_Sheet_Price.Basic,	Deal_Sheet_Price.Tcs,	Deal_Sheet_Price.MCP_Amount,
	  Deal_Sheet_Price.Loyalty_Amount,	Deal_Sheet_Price.Dealer_EW_Royal_Platinum,
	  Deal_Sheet_Price.Solitaire_6th,	Deal_Sheet_Price.Royal_Platinum_5th,	Deal_Sheet_Price.Platinum_4th,	
	  Deal_Sheet_Price.Gold_3th,	Deal_Sheet_Price.Ccp_Amount,Broker_Discount,
	  Deal_Sheet_Price.Valid_From,	Deal_Sheet_Price.Valid_Upto,	Deal_Sheet_Price.Municipal_Tax_1,
	  Deal_Sheet_Price.Municipal_Tax_2,Deal_Sheet_Price.Municipal_Tax_3,
	  Deal_Sheet_Price.Municipal_Tax_4,	Deal_Sheet_Price.Municipal_Tax_5,	
	  Deal_Sheet_Price.Loc_Code,Discount_Offers.Consumer,Discount_Offers.Corporate1 as Corporate,
    Discount_Offers.Exch as Exchange,Discount_Offers.Mssf as MSSF_Amount
    from Deal_Sheet_Price
	  left Join Discount_Offers on Discount_Offers.Model_Code=Deal_Sheet_Price.ModelCode and
	  CAST(GETDATE() AS date) BETWEEN CAST(Discount_Offers.Valid_From AS date) AND CAST(Discount_Offers.Valid_Upto AS date)
	  and Deal_Sheet_Price.Loc_Code=Discount_Offers.Branch
	  where Deal_Sheet_Price.modelcode='${branch[0][0].Variant}' and Deal_Sheet_Price.Loc_code='${branch[0][0].Location}'
      and clr='${branch[0][0].Color}'
      and CAST(GETDATE() AS date) BETWEEN CAST(Deal_Sheet_Price.Valid_From AS date) AND CAST(Deal_Sheet_Price.Valid_Upto AS date)
      order by Deal_Sheet_Price.Created_At,Discount_Offers.Created_At desc
     `);
    res.status(200).send({ branch: branch[0][0], pricess: pricess[0][0] });
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
        `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = :empcode AND module_code = 'Deal_Sheet'`,
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
            UPDATE Deal_Sheet
            SET Approved_amt = Dise_Amt
            WHERE Approved_amt IS NULL AND Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
          query = `
            UPDATE Deal_Sheet
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 1,
                Appr_1_Rem = :Remark,
                appr_1_date=GETDATE(),
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE Deal_Sheet
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 1,
                appr_2_date=GETDATE(),
                Appr_2_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE Deal_Sheet
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 1,
                Appr_3_Rem = :Remark,
                Fin_Appr = 1
            WHERE Tran_id = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        }
        // Execute the update queries
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Deal_Sheet WHERE Tran_id = :tran_id`,
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
        // if (data.Final_apprvl == 1) {
        //   backgroundTasks.push(() => SendWhatsAppMessgae(compcodePassed, item?.rowData.Mobile_No, 'customer_receipt1', [
        //     { "type": "text", "text": item?.rowData?.Customer_Name },
        //     { "type": "text", "text": item?.rowData?.Customer_Name },
        //     { "type": "text", "text": item?.rowData?.Model_Variant_Name },
        //     { "type": "text", "text": item?.rowData?.Payment_Mode },
        //     { "type": "text", "text": item?.rowData?.Req_Date },
        //     { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //     { "type": "text", "text": `https://erp.autovyn.com/backend/Deal_Sheet?compcode=${compcodePassed}&id=${item?.rowData.tran_id}` },
        //     { "type": "text", "text": comp_name }
        //   ]));
        // }
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
        //     const approver2 = await sequelize.query(`SELECT TOP 1 mobileno FROM employeemaster WHERE empcode=(SELECT TOP 1 approver2_A FROM approval_matrix WHERE empcode='${item?.rowData.SRM}' AND module_code='Deal_Sheet')`);
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
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'Deal_Sheet'`,
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
            UPDATE Deal_Sheet
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
            UPDATE Deal_Sheet
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
            UPDATE Deal_Sheet
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 0,
                Appr_3_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        }
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Deal_Sheet WHERE Tran_id = :tran_id;`,
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
      `update Deal_Sheet set Approved_amt='${amt}' where tran_id='${tran_id}' `
    );

    res.status(200).send("done");
  } catch (e) {
    console.log(e);
  }
};
exports.Update = async function (req, res) {
  // Validate Asset Product data
  const { error: assetError, value: Payment_Data } =
    dealSheetSchema.validate(req.body, {
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
    const result = await sequelize.query(`select * from Deal_Sheet where tran_id=tran_id and Appr_1_Stat is null`)
    if (result[0].length == 0) {
      return res.status(404).send({ Message: 'Cannot Update Request' })
    }
    // Create the Asset Product
    const AssetProduct = _DealSheet(sequelize, Sequelize.DataTypes);
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
	from Deal_Sheet where Location IN (${req.body.multi_loc}) and cast(req_date as date) between  '${dateFrom}' AND '${dateto}'
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
	from Deal_Sheet where Location IN (${req.body.multi_loc}) and cast(req_date as date) between  '${dateFrom}' AND '${dateto}'
    ${value}
   `
    );
    res.status(200).send(discountdata[0])
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.findMasterdata = async function (req, res) {
  const Branch = req.body.Branch;
  const validfrom = req.body.validfrom;
  const validTo = req.body.validTo;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const result = await sequelize.query(`
      SELECT UTD, name, Branch, amount, validfrom, validTo 
      FROM DealSheet_Master
      WHERE Branch = :Branch
        AND validfrom >= :validfrom
        AND validTo <= :validTo
    `, {
      replacements: { Branch, validfrom, validTo }, // Using parameterized query for safety
      type: sequelize.QueryTypes.SELECT
    });
    res.status(200).send({ result: result });
  } catch (err) {
    console.error("Error fetching master data:", err);
    res.status(500).send({ error: "Failed to fetch data" });
  }
};

exports.SaveParameter = async function (req, res) {
  // Validate the amounts array using Joi
  const { error: financeError, value: FinancerMasters } = Joi.array()
    .items(dealSheetMasterSchema)
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
    const Finance_Master = _DealSheetMaster(sequelize, Sequelize.DataTypes);
    // Start a transaction
    transaction = await sequelize.transaction();
    const InsuData1 = await Finance_Master.bulkCreate(FinancerMasters, {
      transaction: transaction,
    });
    // Commit the transaction after successful inserts
    await transaction.commit();
    // Send a success response with inserted records
    return res.status(200).send({
      success: true,
      message: ' data inserted successfully',
    });
  } catch (err) {
    // Rollback the transaction in case of error
    if (transaction) await transaction.rollback();
    console.log('Error saving Data:', err);
    return res.status(500).send({
      success: false,
      message: 'Error saving Data ',
      error: err.message,
    });
  }
};

exports.UpdateParameter = async function (req, res) {
  // Validate the amounts array using Joi
  const { error: financeError, value: FinancerMasters } = Joi.array()
    .items(dealSheetMasterSchema)
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
    const Finance_Master = _DealSheetMaster(sequelize, Sequelize.DataTypes);

    // Start a transaction
    transaction = await sequelize.transaction();

    // Insert each valid financer into the database
    const insertedRecords = await Promise.all(
      FinancerMasters.map((financerData) => {
        const { UTD, ...otherFields } = financerData; // Extract UTD and remaining fields

        return Finance_Master.update(
          {
            ...otherFields, // Spread the remaining fields into the update object
          },
          {
            where: { UTD }, // Use UTD to identify the record to update
            transaction, // Pass the transaction object for atomic updates
          }
        );
      })
    );
    // Commit the transaction after successful inserts
    await transaction.commit();
    // Send a success response with inserted records
    return res.status(200).send({
      success: true,
      message: ' data inserted successfully',
      data: insertedRecords,
    });
  } catch (err) {
    // Rollback the transaction in case of error
    if (transaction) await transaction.rollback();
    console.log('Error saving data:', err);
    return res.status(500).send({
      success: false,
      message: 'Error saving  data',
      error: err.message,
    });
  }
};

exports.importformatdispatch = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const Municipal_Taxes = await sequelize.query(`select Misc_Name from misc_mst where misc_type=632`)

    const municipalTaxHeaders = Municipal_Taxes[0].map(tax => tax.Misc_Name);
    const Headeres = [
      'Modelcode',
      'ModelName',
      'Clr',
      'Ex-Showroom Price',
      'Insurance(1 Year)',
      'Insurance(1 + 3 Year)',
      'RTO (Permanent)',
      'RTO (Temporary)',
      'Fas Tag',
      'Maruti Genuine Accessories (Basic)',
      'TCS @1% with PAN',
      'MCP Amount',
      'Autocard',
      'EW(Dealer EW Royal Platinum)',
      'EW(Solitaire (6th Yr))',
      'EW(Royal Platinum (5th Yr))',
      'EW(Platinum (4th Yr))',
      'EW(Gold (3th Yr))',
      'CPP PRICE ACTUAL',
      // 'Consumer Offer',
      // 'Corporate Offer',
      // 'Exchange Offer',
      // 'MSSF Offer',
      'Broker Discount',
      'Valid From',
      'Valid upto',
      'Branch_Code',
    ].concat(municipalTaxHeaders);
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
      'attachment; filename="Import_Tamplate.xlsx"'
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
      'attachment; filename="import_Tamplate.xlsx"'
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
exports.importformatmaruti = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    const Headeres = [
      "Model Code",
      "Model Name",
      "Consumer",
      "Rips",
      "Mssf",
      "ISL",
      "Rmk",
      "Exchange",
      "scrappage",
      "Manufacturing Year",
      "Branch",
      "Valid_From",
      "Valid_Upto"
    ]
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
      'attachment; filename="Import_Tamplate.xlsx"'
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
      'attachment; filename="import_Tamplate.xlsx"'
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
exports.excelimportmini = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Insu_Data = _DealSheetPrice(sequelize, DataTypes);
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    if (!excelFile) {
      await sequelize.close();
      return res.status(400).send({ Message: "No file uploaded" });
    }
    const user = req.body.user;
    const branch = req.body.branch;
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData.length) {
      await sequelize.close();
      return res.status(500).send({ Message: "No data found in Excel or may be Invalid format" });
    }

    const municipalTaxMapping = await sequelize.query(`
      SELECT Misc_Abbr, Misc_Name
      FROM misc_mst
      WHERE misc_type = 632
    `);

    const renameKeys = async (obj) => {
      const keyMap = {
        'Modelcode': 'ModelCode',
        'ModelName': 'ModelName',
        'Clr': 'Clr',
        'Ex-Showroom Price': 'Price',
        'Insurance(1 Year)': 'Insurance_1_Year',
        'Insurance(1 + 3 Year)': 'Insurance_1_3_Year',
        'RTO (Permanent)': 'Permanent',
        'RTO (Temporary)': 'Temporary',
        'Fas Tag': 'Fastag',
        'Maruti Genuine Accessories (Basic)': 'Basic',
        'TCS @1% with PAN': 'Tcs',
        'MCP Amount': 'MCP_Amount',
        'Autocard': 'Loyalty_Amount',
        'EW(Dealer EW Royal Platinum)': 'Dealer_EW_Royal_Platinum',
        'EW(Solitaire (6th Yr))': 'Solitaire_6th',
        'EW(Royal Platinum (5th Yr))': 'Royal_Platinum_5th',
        'EW(Platinum (4th Yr))': 'Platinum_4th',
        'EW(Gold (3th Yr))': 'Gold_3th',
        'CPP PRICE ACTUAL': 'Ccp_Amount',
        // 'Consumer Offer': 'Consumer',
        // 'Corporate Offer': 'Corporate',
        // 'Exchange Offer': 'Exchange',
        // 'MSSF Offer': 'MSSF_Amount',
        'Broker Discount': 'Broker_Discount',
        'Valid From': 'Valid_From',
        'Valid upto': 'Valid_Upto',
        'Branch_Code': 'Loc_Code',
      };
      // Extend the keyMap with municipal tax mappings
      municipalTaxMapping[0].forEach(({ Misc_Abbr, Misc_Name }) => {
        keyMap[Misc_Name] = Misc_Abbr;
      });
      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key;

        if (newKey === "Valid_From" || newKey === "Valid_Upto") {
          acc[newKey] = obj[key] ? adjustToIST(obj[key]) : null;
        } else {
          // Format price fields to 2 decimal places
          if (newKey === "price" || newKey.includes("_Amount")) {
            acc[newKey] = parseFloat(obj[key]).toFixed(2);
          } else {
            acc[newKey] = obj[key] === "" ? null : obj[key];
          }
        }

        return acc;
      }, {});
    };

    const data = await Promise.all(transformedData.map(renameKeys)); // Use Promise.all to resolve the async renameKeys function
    function adjustToIST(dateStr) {
      try {
        const date = new Date(dateStr);
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 31);
        const ISTDateStr = date.toISOString();
        return ISTDateStr.slice(0, 10);
      } catch (err) {
        return parseDate(dateStr);
      }
    }

    function parseDate(dateStr) {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date // Convert to YYYY-MM-DD format
      }
      return null; // Handle invalid date
    }
    // Proceed with validation and saving data to database
    const ErroredData = [];
    const CorrectData = [];

    data.forEach((obj) => {
      const rejectionReasons = [];
      if (rejectionReasons.length > 0) {
        ErroredData.push({ ...obj, rejectionReasons: rejectionReasons.join(" ") });
      } else {
        obj.Created_By = user;
        // obj.Loc_Code = branch;
        CorrectData.push(obj);
      }
    });
    const InsuData1 = await Insu_Data.bulkCreate(CorrectData,
      { transaction: t }
    );

    await t.commit();
    await sequelize.close();

    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: CorrectData,
      Message: `${InsuData1.length} Records Inserted`,
    });
  } catch (error) {
    // await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};
exports.excelimportmarutioffers = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const Insu_Data = _DiscountOffers(sequelize, DataTypes);
    const excelFile = req.files["excel"][0]; // Accessing the uploaded file
    if (!excelFile) {
      await sequelize.close();
      return res.status(400).send({ Message: "No file uploaded" });
    }
    const user = req.body.user;
    const branch = req.body.branch;
    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData.length) {
      await sequelize.close();
      return res.status(500).send({ Message: "No data found in Excel or may be Invalid format" });
    }
    const renameKeys = (obj) => {
      const keyMap = {
        "Model Code": "Model_Code",
        "Model Name": 'Model_Name',
        "Consumer": 'Consumer',
        "Rips": 'Rips',
        "Mssf": 'Mssf',
        "ISL": 'Corporate1',
        "Rmk": 'Corporate2',
        "Exchange": 'Exch',
        "scrappage": 'scrappage',
        "Manufacturing Year": 'Year',
        "Branch": 'Branch',
        "Valid_From": 'Valid_From',
        "Valid_Upto": 'Valid_Upto'
      };
      // Extend the keyMap with municipal tax mappings
      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key;
        if (newKey === "Valid_From" || newKey === "Valid_Upto") {
          acc[newKey] = obj[key] ? adjustToIST(obj[key]) : null;
        } else {
          // Format price fields to 2 decimal places
          if (newKey === "Model_Code" || newKey === "Model_Name") {
            acc[newKey] = obj[key] === "" ? null : String(obj[key]);
          } else {
            acc[newKey] = obj[key] === "" ? null : obj[key];
          }
        }

        return acc;
      }, {});
    };

    const data = transformedData.map(renameKeys) // Use Promise.all to resolve the async renameKeys function


    function adjustToIST(dateStr) {
      try {
        const date = new Date(dateStr);
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 31);
        const ISTDateStr = date.toISOString();
        return ISTDateStr.slice(0, 10);
      } catch (err) {
        return parseDate(dateStr);
      }
    }

    function parseDate(dateStr) {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date // Convert to YYYY-MM-DD format
      }
      return null; // Handle invalid date
    }
    // Proceed with validation and saving data to database
    const ErroredData = [];
    const CorrectData = [];

    for (item of data) {
      const rejectionReasons = [];
      const modl_mst = await sequelize.query(`select Modl_Grp as Model_Group,(select top 1 Misc_name from Misc_Mst where Misc_Code=Modl_Grp and Misc_Type=14 and Export_Type<3)as Model_Group_Name
      from Modl_Mst where Modl_Code='${item.Model_Code}'`)
      const branchdata = await sequelize.query(`select Br_Region as State,Br_Segment as Channel  from godown_mst where godw_code='${item.Branch}'`)
      if (modl_mst[0].length > 0) {
        item.Model_Group = modl_mst[0][0].Model_Group
        item.Model_Group_Name = modl_mst[0][0].Model_Group_Name
      } else {
        rejectionReasons.push(
          `Model Group Not Found ${item.Model_Code}`,
          " | "
        );
      }
      if (branchdata[0].length > 0) {
        item.State = branchdata[0][0].State
        item.Channel = branchdata[0][0].Channel
      } else {
        rejectionReasons.push(
          `Region And Channel Not Found ${item.Model_Code}`,
          " | "
        );
      }
      const { error: modelerror, value: Asset_Product } =
        discountOffersSchema.validate(item, {
          abortEarly: false,
          stripUnknown: true,
        });
      if (modelerror) {
        rejectionReasons.push(modelerror.details)
        console.log(modelerror.details, 'slslslssl')
      }
      if (rejectionReasons.length > 0) {
        ErroredData.push({ ...item, rejectionReasons: rejectionReasons.join(" ") });
      } else {
        item.Created_By = user;
        // obj.Loc_Code = branch;
        CorrectData.push({ ...item, rejectionReasons: "Imported Successfully" })
      }
    }
    const InsuData1 = await Insu_Data.bulkCreate(CorrectData,
      { transaction: t }
    );

    await t.commit();
    await sequelize.close();

    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: CorrectData,
      Message: `${InsuData1.length} Records Inserted`,
    });
  } catch (error) {
    // await t.rollback();
    console.error("Error:", error);
    res.status(500).json({ Message: "An error occurred during file import." });
  }
};

exports.ViewInsuranceCompany = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `select UTD,Insurance_Company,Perferred,Valid_From,Valid_Upto from Insu_Comp where 
       CAST(GETDATE() AS date) BETWEEN CAST(Valid_From AS date) AND CAST(Valid_Upto AS date);`
    );
    res.status(200).send({ result: result[0] });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.SaveInsuranceCompany = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { UTD, ...insertData } = req.body;
  const { error, value: Insu_Entrydata } = validateInsuComp.validate(insertData, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    try {
      const Insu_Entry = _InsuComp(sequelize, DataTypes);
      const Insu_Entry1 = await Insu_Entry.create(Insu_Entrydata);
      res.status(200).send(Insu_Entry1);
    } catch (err) {
      res.status(500).json({ error: "An error occurred during updating." });
      console.log(err);
    }
  }
};
exports.UpdateInsuranceCompany = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { UTD, ...insertData } = req.body;

  // Validate the input data
  const { error, value: Insu_Entrydata } = validateInsuComp.validate(insertData, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    // If validation fails, send error messages
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }

  try {
    // Define the model
    const Insu_Entry = _InsuComp(sequelize, DataTypes);

    // Perform the update operation
    const [affectedRows] = await Insu_Entry.update(Insu_Entrydata, {
      where: { UTD }, // Use UTD in the where condition
    });

    if (affectedRows === 0) {
      return res.status(404).send({ success: false, message: "No record found to update with the provided UTD." });
    }

    // Send success response
    res.status(200).send({ success: true, message: "Record updated successfully." });
  } catch (err) {
    // Handle errors
    res.status(500).json({ error: "An error occurred during updating." });
    console.error(err);
  }
};
