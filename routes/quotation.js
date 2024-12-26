const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const Joi = require("joi");
const { SendWhatsAppMessgae } = require("./user");
const fs = require('fs');
const path = require("path");
const FormData = require("form-data");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const nodemailer = require('nodemailer');
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");


async function sendEmail(toEmail, subject, htmlContent, pdflink) {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "AUTOVYN.MAILER@gmail.com",
        pass: "lamdgvthpjetawtr",
      },
    });
    const pdfUrl = `https://erp.autovyn.com/backend/fetch?filePath=${pdflink}`;
    const pdfResponse = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
    const pdfBuffer = Buffer.from(pdfResponse.data, 'binary');

    let mailOptions = {
      from: "AUTOVYN.MAILER@gmail.com",
      to: toEmail,
      subject: subject,
      html: htmlContent,
      attachments: [
        {
          filename: 'quotation.pdf',
          content: pdfBuffer,
          encoding: 'base64'
        }
      ]
    };

    let info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error occurred while sending email:", error);
    throw error;
  }
}

exports.sendEmail = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const tran_id = req.body.tran_id;
  const multi_loc = req.body.multi_loc;
  const subject = "Car Quotation";

  if (!tran_id || !multi_loc) {
    return res.status(400).send({
      success: false,
      message: "Missing required parameters: tran_id or multi_loc",
    });
  }

  try {

    const a = await sequelize.query(`
     SELECT q.*,
       (SELECT TOP 1 m.Misc_Name
        FROM Misc_Mst m
        WHERE m.Misc_type = 10
          AND m.Misc_Code = q.color
        ORDER BY m.Misc_Name) AS Color_Name,
		   (SELECT TOP 1 m.Misc_Name
        FROM Misc_Mst m
        WHERE m.Misc_type = 14
          AND m.Misc_Code = q.model
        ORDER BY m.Misc_Name) AS Model_Name
       FROM quotation q
       WHERE q.tran_id ='${tran_id}' and  q.export_type < 33;
    `);

    if (!a || !a[0] || !a[0][0] || !a[0][0].email) {
      return res.status(404).send({
        success: false,
        message: "Email address not found for given tran_id",
      });
    }

    const to = a[0][0].email;

    const company = await sequelize.query(`select comp_name from comp_mst `);

    if (!company || !company[0] || !company[0][0]) {
      return res.status(404).send({
        success: false,
        message: "Company details not found for given multi_loc",
      });
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Car Quotation</title>
      </head>
      <body>
        <div>
          <h2>Quotation for Car</h2>
          <p>Dear ${a[0][0].party_name},</p>
          <p>I hope this message finds you well. Thank you for considering ${company[0][0].comp_name} for your automotive needs. We are pleased to provide you with a quotation for the ${a[0][0].Model_Name} you are interested in:</p>
          
          <ul>
            <li><strong>Quotation No.:</strong> ${a[0][0].tran_id}</li>
            <li><strong>Car Model:</strong> ${a[0][0].Model_Name}</li>
            <li><strong>Color:</strong> ${a[0][0].Color_Name}</li>
            <li><strong>Total Price:</strong> ${a[0][0].total_price?.toFixed(2)}</li>
          </ul>
          <p>Please feel free to contact us if you have any questions or would like to discuss customization options. We are committed to ensuring your satisfaction and look forward to assisting you further.</p>
          <div class="footer">
            <p>Best regards,<br>
              ${company[0][0].comp_name}<br>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const pdflink = a[0][0].pdf

    await sendEmail(to, subject, htmlContent, pdflink);
    res.status(200).send({
      success: true,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error occurred while sending email:", error);
    res.status(500).send({
      success: false,
      message: "Failed to send email",
    });
  }
};


exports.insert = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();

  const {
    tran_id, quotation_date, enquiry_no, date, party_name, address,
    whatsApp_no, email, dse, tl, remark, model, variant, color, quantity,
    rate, consumer_offer, corporate_offer, exchange_offer, additional_offer,
    insurance_amount, rto_amount, mga, ew, ccp, fastag, Auto_card,
    other_charges, total_price, loc_code, create_by, pdf
  } = req.body;

  try {

    const MaxCode = await sequelize.query('SELECT isnull(max(tran_id)+1,1) AS tran_id from quotation');


    // const existranid = await sequelize.query(
    //   `SELECT tran_id FROM quotation WHERE tran_id = :tran_id`,
    //   {
    //     replacements: { tran_id },
    //     transaction: t,
    //     type: Sequelize.QueryTypes.SELECT
    //   }
    // );

    // console.log(existranid, "existranid");


    // if (existranid.length > 0) {
    //   await t.rollback();
    //   return res.status(200).send({
    //     Status: false,
    //     Message: "Quotation no. already exists",
    //     Result: null,
    //   });
    // }

    // Insert the new record
    await sequelize.query(
      `INSERT INTO quotation (  
          tran_id, quotation_date, enquiry_no, date, party_name, address,
          whatsApp_no, email, dse, tl, remark, model, variant, color, quantity,
          rate, consumer_offer, corporate_offer, exchange_offer, additional_offer,
          insurance_amount, rto_amount, mga, ew, ccp, fastag, Auto_card,
          other_charges, total_price, loc_code, create_by, pdf,export_type,ServerId
      ) VALUES (
           :tran_id, :quotation_date, :enquiry_no, :date, :party_name, :address,
          :whatsApp_no, :email, :dse, :tl, :remark, :model, :variant, :color, :quantity,
          :rate, :consumer_offer, :corporate_offer, :exchange_offer, :additional_offer,
          :insurance_amount, :rto_amount, :mga, :ew, :ccp, :fastag, :Auto_card,
          :other_charges, :total_price, :loc_code, :create_by, :pdf, :export_type,:ServerId
      )`,
      {
        replacements: {
          tran_id: MaxCode[0][0].tran_id,
          quotation_date: quotation_date || null,
          enquiry_no: enquiry_no || null,
          date: date || null,
          party_name: party_name || null,
          address: address || null,
          whatsApp_no: whatsApp_no || null,
          email: email || null,
          dse: dse || null,
          tl: tl || null,
          remark: remark || null,
          model: model || null,
          variant: variant || null,
          color: color || null,
          quantity: quantity || null,
          rate: rate || null,
          consumer_offer: consumer_offer || null,
          corporate_offer: corporate_offer || null,
          exchange_offer: exchange_offer || null,
          additional_offer: additional_offer || null,
          insurance_amount: insurance_amount || null,
          rto_amount: rto_amount || null,
          mga: mga || null,
          ew: ew || null,
          ccp: ccp || null,
          fastag: fastag || null,
          Auto_card: Auto_card || null,
          other_charges: other_charges || null,
          total_price: total_price || null,
          loc_code: loc_code || null,
          create_by: create_by || null,
          pdf: pdf || null,
          export_type: 1,   
          ServerId: 1       
        },
        transaction: t
      }
    );

    // Commit the transaction
    await t.commit();
    res.status(200).send({
      Status: true,
      Message: "Quotation is Submitted successfully",
      Result: MaxCode[0][0].tran_id, // Insert queries typically return an array where the first element is the result of the query
    });
  } catch (e) {
    console.error(e);
    // Rollback the transaction on error
    if (t) {
      await t.rollback();
    }
    res.status(500).send({
      Status: false,
      Message: "Error occurred while inserting data",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};





exports.findMaxquotation = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const MaxCode = await sequelize.query('SELECT isnull(max(tran_id)+1,1) AS tran_id from quotation');
    res.send({
      success: true, tran_id: MaxCode[0][0].tran_id
    });
  } catch (err) {
    console.log(err);
  }
  finally {
    await sequelize.close();
  }
};





exports.getInsertedData = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  const dateFrom = req.body.dateFrom;
  const dateTo = req.body.dateTo;

  try {
    // Adjusted query to use parameterized inputs including dateFrom and dateTo
    const results = await sequelize.query(`
      SELECT
        q.*,
        (SELECT TOP 1 Misc_Name 
         FROM Misc_Mst 
         WHERE Misc_type = 14 AND Misc_Code = q.model
         ORDER BY Misc_Name) AS Model_Name,
        (SELECT TOP 1 EMPFIRSTNAME 
         FROM EMPLOYEEMASTER 
         WHERE EMPCODE = q.tl
         ORDER BY EMPFIRSTNAME) AS tl_name,
        (SELECT TOP 1 Modl_Name 
         FROM Modl_Mst 
         WHERE item_code = q.variant
         ORDER BY Modl_Name) AS variant_name,
          (SELECT TOP 1 Misc_Name 
         FROM misc_mst 
         WHERE Misc_Type = 10 and
          Misc_Code = q.color
         ORDER BY Misc_Name) AS color_name
      FROM quotation q
      WHERE q.loc_code = :loc_code
        AND export_type<33
        AND q.quotation_date BETWEEN :dateFrom AND :dateTo;
    `, {
      replacements: { loc_code, dateFrom, dateTo },
      type: sequelize.QueryTypes.SELECT
    });


    // Optionally format the data here if needed
    // const formattedData = results.map(row => ({
    //   ...row,
    //   rate: parseFloat(row.rate).toFixed(2),
    //   consumer_offer: parseFloat(row.consumer_offer).toFixed(2),
    //   corporate_offer: parseFloat(row.corporate_offer).toFixed(2),
    //   exchange_offer: parseFloat(row.exchange_offer).toFixed(2),
    //   additional_offer: parseFloat(row.additional_offer).toFixed(2),
    //   insurance_amount: parseFloat(row.insurance_amount).toFixed(2),
    //   rto_amount: parseFloat(row.rto_amount).toFixed(2),
    //   mga: parseFloat(row.mga).toFixed(2),
    //   ew: parseFloat(row.ew).toFixed(2),
    //   ccp: parseFloat(row.ccp).toFixed(2),
    //   fastag: parseFloat(row.fastag).toFixed(2),
    //   Auto_card: parseFloat(row.Auto_card).toFixed(2),
    //   other_charges: row.other_charges ? parseFloat(row.other_charges).toFixed(2) : null,
    //   total_price: parseFloat(row.total_price).toFixed(2)
    // }));

    // Respond with the results
    res.status(200).send({
      Status: "true",
      Message: "Data Fetched",
      Result: results
    });
  } catch (e) {
    console.log(e);
    res.status(500).send({ success: false, error: e.message });
  } finally {
    await sequelize.close();
  }
};



exports.update = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();

  try {
    const {
      tran_id, quotation_date, enquiry_no, date, party_name, address,
      whatsApp_no, email, dse, tl, remark, model, variant, color, quantity,
      rate, consumer_offer, corporate_offer, exchange_offer, additional_offer,
      insurance_amount, rto_amount, mga, ew, ccp, fastag, Auto_card,
      other_charges, total_price, loc_code, create_by, pdf
    } = req.body;

    const updateQuery = `
      UPDATE quotation SET
         export_type=33
      WHERE tran_id = :tran_id
    `;

    const values = {
      tran_id
    };
    const result = await sequelize.query(updateQuery, {
      replacements: values,
      type: sequelize.QueryTypes.UPDATE,
      transaction: t
    });
    await sequelize.query(
      `INSERT INTO quotation (  
          tran_id, quotation_date, enquiry_no, date, party_name, address,
          whatsApp_no, email, dse, tl, remark, model, variant, color, quantity,
          rate, consumer_offer, corporate_offer, exchange_offer, additional_offer,
          insurance_amount, rto_amount, mga, ew, ccp, fastag, Auto_card,
          other_charges, total_price, loc_code, create_by, pdf,export_type,ServerId
      ) VALUES (
          :tran_id, :quotation_date, :enquiry_no, :date, :party_name, :address,
          :whatsApp_no, :email, :dse, :tl, :remark, :model, :variant, :color, :quantity,
          :rate, :consumer_offer, :corporate_offer, :exchange_offer, :additional_offer,
          :insurance_amount, :rto_amount, :mga, :ew, :ccp, :fastag, :Auto_card,
          :other_charges, :total_price, :loc_code, :create_by, :pdf, :export_type,:ServerId
      )`,
      {
        replacements: {
          tran_id: tran_id,
          quotation_date: quotation_date || null,
          enquiry_no: enquiry_no || null,
          date: date || null,
          party_name: party_name || null,
          address: address || null,
          whatsApp_no: whatsApp_no || null,
          email: email || null,
          dse: dse || null,
          tl: tl || null,
          remark: remark || null,
          model: model || null,
          variant: variant || null,
          color: color || null,
          quantity: quantity || null,
          rate: rate || null,
          consumer_offer: consumer_offer || null,
          corporate_offer: corporate_offer || null,
          exchange_offer: exchange_offer || null,
          additional_offer: additional_offer || null,
          insurance_amount: insurance_amount || null,
          rto_amount: rto_amount || null,
          mga: mga || null,
          ew: ew || null,
          ccp: ccp || null,
          fastag: fastag || null,
          Auto_card: Auto_card || null,
          other_charges: other_charges || null,
          total_price: total_price || null,
          loc_code: loc_code || null,
          create_by: create_by || null,
          pdf: pdf || null,
          export_type: 1,  // Assuming export_type should always be 1
          ServerId: 1
        },
        transaction: t
      }
    );


    await t.commit();
    res.status(200).send({
      Status: true,
      Message: "Success",
      Result: null, // Insert queries typically return an array where the first element is the result of the query
    });
  } catch (e) {
    console.error(e);
    if (sequelize) {
      await sequelize.query("ROLLBACK", { transaction: t });
    }
    res.status(500).send({
      Status: false,
      Message: "Error occurred while updating data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};




exports.findMasters = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const DESG = await sequelize.query(`
    SELECT DISTINCT 
      EMPCODE as value, 
      CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS label,EMPLOYEEDESIGNATION
  FROM EMPLOYEEMASTER
    `);

    const TL = await sequelize.query(`SELECT DISTINCT 
        EMPCODE as value, 
        CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS label
        FROM EMPLOYEEMASTER
       `);



    const modelGrp = await sequelize.query(`select Misc_Name as label,CAST(Misc_Code as VARCHAR) as value from Misc_mst where Misc_type=14`);
    const color = await sequelize.query(` select CAST(Misc_Code as VARCHAR) AS value, Misc_Name AS label from Misc_Mst where Misc_Type = 10 AND Misc_Name <> ''`)
    await sequelize.close();
    res.send(
      {
        Status: "true",
        Message: "Success",
        Result: { DESG: DESG[0],TL:TL[0],  modelGrp: modelGrp[0], color: color[0] }
      }
    );
  } catch (err) {
    console.error("Error occurred while fetching data:", err);
    res.status(500).send("Error Occurred While Fetching Data");
  } finally {
    // Always close sequelize connection in finally block
    await sequelize.close();
  }
};




exports.varient = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const ModelGroup = req.body.ModelGroup;

  try {
    const varient = await sequelize.query(`select Modl_Name as label,CAST(Item_Code AS VARCHAR) as value,Modl_Code from Modl_mst where Modl_Grp='${ModelGroup}'`);
    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: varient[0],
    });
  }
  catch (e) {
    console.log(e);
    res.status(500).send({
      success: false,
      message: "An error occurred while Fetching Data.",
      e,
    });
  }
  finally {
    await sequelize.close();
  }
};




exports.sendwhatsapp = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const tran_id = req.body.tran_id;

  try {
    const a = await sequelize.query(`
     SELECT q.*,
       (SELECT TOP 1 m.Misc_Name
        FROM Misc_Mst m
        WHERE m.Misc_type = 10
          AND m.Misc_Code = q.color
        ORDER BY m.Misc_Name) AS Color_Name,
		   (SELECT TOP 1 m.Misc_Name
        FROM Misc_Mst m
        WHERE m.Misc_type = 14
          AND m.Misc_Code = q.model
        ORDER BY m.Misc_Name) AS Model_Name
       FROM quotation q
       WHERE q.tran_id ='${tran_id}' and  q.export_type < 33;
    `);
    const comapny = await sequelize.query(`select comp_name from comp_mst`);

    await SendWhatsAppMessgae(req.headers.compcode,
      a[0][0]?.whatsApp_no,
      "quotation_message",
      [
        {
          type: "text",
          text: a[0][0]?.party_name,
        },
        {
          type: "text",
          text: comapny[0][0]?.comp_name,
        },
        {
          type: "text",
          text: a[0][0]?.Model_Name,
        },
        {
          type: "text",
          text: a[0][0]?.tran_id,
        },
        {
          type: "text",
          text: a[0][0]?.Model_Name,
        },
        {
          type: "text",
          text: a[0][0]?.Color_Name,
        },
        {
          type: "text",
          text: a[0][0]?.total_price?.toFixed(2),
        },
        {
          type: "text",
          text: `https://erp.autovyn.com/backend/fetch?filePath=${a[0][0]?.pdf}`,
        },
        {
          type: "text",
          text: comapny[0][0]?.comp_name,
        },
      ]
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: "done",
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




async function uploadImage2(files, Comp_Code) {
  try {
    let dataArray = [];
    await Promise.all(
      files?.map(async (file, index) => {
        const customPath = `${Comp_Code}/quotation/`;
        const ext = path.extname(file.originalname);
        const randomUUID = uuidv4();
        const fileName = randomUUID + ext;
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
            fieldname: file.fieldname,
            path: `${customPath}${fileName}`,
          };
          dataArray.push(data);
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




exports.uploadeddocument = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
        );
        if (EMP_DOCS_data.length > 0) {
          res.status(200).send(EMP_DOCS_data[0].path);
        } else {
          res.status(404).send("No documents uploaded");
        }
      } else {
        res.status(200).send("No File Uploaded");
      }
    } catch (e) {
      console.error(e);
      res.status(500).send("Internal Server Error");
    }
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
};




exports.insertenquiry = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const { formdata1 } = req.body;

  const DOCS = formdata1?.ImgSourseArray ? JSON.stringify(formdata1.ImgSourseArray) : null;

  // Retrieve location from the database or use the provided location
  const [loc] = await sequelize.query(
    `SELECT LOCATION FROM EMPLOYEEMASTER WHERE EMPCODE='${formdata1.DSE_Gen}'`
  );
  const location = formdata1.Loc_Code ? formdata1.Loc_Code : loc[0].LOCATION;

  const status = (formdata1.Lost_Date !== null && formdata1.Lost_Date !== undefined) ? "2" : (formdata1.Enq_Stat == null && formdata1.Enq_Stat == undefined) ? "0" : formdata1.Enq_Stat;

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  try {
    const maxTranIdQuery = `SELECT COALESCE(MAX(tran_id), 0) AS max_tran_id FROM RTL_MST`;
    const [maxTranIdResult] = await sequelize.query(maxTranIdQuery, {
      transaction: t,
      type: Sequelize.QueryTypes.SELECT
    });
    const maxTranId = maxTranIdResult.max_tran_id;
    const newTranId = maxTranId + 1;

    const enquiryDate = formdata1.enquiry_date || getCurrentDate();

    const insertRTLMstQuery = `
      INSERT INTO RTL_MST (
        tran_id,book_attachment, docs, Modl_Var, enquiry_date, Exp_Del_Date, Fin_Code, Enq_No, Ledg_Name, Ph1, Modl_Code, DSE_Gen, Enq_Stat, Qty, Ledg_Add1, Teh_Code, Dist_Code, Stat_Code,
        Pin_Code, Email_Id, Ph2, Enq_Src, Cust_Ocu, Pymt_Mode, Loc_Code, Veh_Amt, Insu_Amt, RTO_Amt, war_Amt, Acc_Amt, Loy_Card_Amt,
        Other_Charge, Disc_Amt, Total_Amt, Book_Date, Book_Mode, Book_No, Book_Amt, Book_Rem, Lost_Date, Lost_Reason, Export_Type, ServerId
      ) VALUES (
        :tran_id,:book_attachment, :docs, :Modl_Var, :enquiry_date, :Exp_Del_Date, :Fin_Code, :Enq_No, :Ledg_Name, :Ph1, :Modl_Code, :DSE_Gen, :Enq_Stat, :Qty, :Ledg_Add1, :Teh_Code, :Dist_Code, :Stat_Code,
        :Pin_Code, :Email_Id, :Ph2, :Enq_Src, :Cust_Ocu, :Pymt_Mode, :Loc_Code, :Veh_Amt, :Insu_Amt, :RTO_Amt, :war_Amt, :Acc_Amt, :Loy_Card_Amt,
        :Other_Charge, :Disc_Amt, :Total_Amt, :Book_Date, :Book_Mode, :Book_No, :Book_Amt, :Book_Rem, :Lost_Date, :Lost_Reason, :Export_Type, :ServerId
      )`;

    const rtlMstValues = {
      tran_id: newTranId,
      book_attachment: formdata1.book_attachment || null,
      docs: DOCS,
      Modl_Var: formdata1.Modl_Var || null,
      enquiry_date: enquiryDate,
      Exp_Del_Date: formdata1.Exp_Del_Date || null,
      Fin_Code: formdata1.Fin_Code || null,
      Enq_No: `E${newTranId}`,
      Ledg_Name: formdata1.Ledg_Name || null,
      Ph1: formdata1.Ph1 || null,
      Modl_Code: formdata1.Modl_Code || null,
      DSE_Gen: formdata1.DSE_Gen || null,
      Enq_Stat: status,
      Qty: formdata1.Qty || null,
      Ledg_Add1: formdata1.Ledg_Add1 || null,
      Teh_Code: formdata1.Teh_Code || null,
      Dist_Code: formdata1.Dist_Code || null,
      Stat_Code: formdata1.Stat_Code || null,
      Pin_Code: formdata1.Pin_Code || null,
      Email_Id: formdata1.Email_Id || null,
      Ph2: formdata1.Ph2 || null,
      Enq_Src: formdata1.Enq_Src || null,
      Cust_Ocu: formdata1.Cust_Ocu || null,
      Pymt_Mode: formdata1.Pymt_Mode || null,
      Loc_Code: location,
      Veh_Amt: formdata1.Veh_Amt || null,
      Insu_Amt: formdata1.Insu_Amt || null,
      RTO_Amt: formdata1.RTO_Amt || null,
      war_Amt: formdata1.war_Amt || null,
      Acc_Amt: formdata1.Acc_Amt || null,
      Loy_Card_Amt: formdata1.Loy_Card_Amt || null,
      Other_Charge: formdata1.Other_Charge || null,
      Disc_Amt: formdata1.Disc_Amt || null,
      Total_Amt: formdata1.Total_Amt || null,
      Book_Date: formdata1.Book_Date || null,
      Book_Mode: formdata1.Book_Mode || null,
      Book_No: formdata1.Book_No || null,
      Book_Amt: formdata1.Book_Amt || null,
      Book_Rem: formdata1.Book_Rem || null,
      Lost_Date: formdata1.Lost_Date || null,
      Lost_Reason: formdata1.Lost_Reason || null,
      Export_Type: 1,
      ServerId: 1
    };

    await sequelize.query(insertRTLMstQuery, {
      replacements: rtlMstValues,
      transaction: t
    });

    // Insert into Enq_Dtl using the same tran_id
    if (formdata1.rowdata) {
      for (const data of formdata1.rowdata) {
        const insertEnqDtlQuery = `
          INSERT INTO Enq_Dtl (
            Tran_Id, SNo, DSE_Reg, Meet_Date, Cont_Mod, Cust_Rep, Plan_date, Loc_Code, Dse_Reg_Label, Export_Type, ServerId
          ) VALUES (
            :Tran_Id, :SNo, :DSE_Reg, :Meet_Date, :Cont_Mod, :Cust_Rep, :Plan_date, :Loc_Code, :Dse_Reg_Label, :Export_Type, :ServerId
          )`;
        const enqDtlValues = {
          Tran_Id: newTranId,
          SNo: data.SNo,
          DSE_Reg: data.Dse_Reg,
          Meet_Date: data.Meet_Date,
          Cont_Mod: data.Cont_Mod,
          Cust_Rep: data.Cust_Rep,
          Plan_date: data.Plan_date,
          Loc_Code: data.Loc_Code,
          Dse_Reg_Label: data.Dse_Reg_Label,
          Export_Type: data.Export_Type,
          ServerId: data.ServerId
        };

        await sequelize.query(insertEnqDtlQuery, {
          replacements: enqDtlValues,
          transaction: t
        });
      }
    }

    await t.commit();
    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: {},
    });
  } catch (e) {
    if (t) {
      await t.rollback();
    }

    console.error(e);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred while processing request",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};




exports.updateenquiry = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode); // Assuming dbname is a function that initializes Sequelize
  const t = await sequelize.transaction();
  const { formdata1 } = req.body; // Assuming formdata1 includes tran_id and other fields
  const DOCS = JSON.stringify(formdata1.ImgSourseArray);
  const tran_id = formdata1.tran_id; // Extract tran_id from formdata1

  // Check if Lost_Date is null or undefined, and set status accordingly
  const status = (formdata1.Lost_Date !== null && formdata1.Lost_Date !== undefined) ? "2" : (formdata1.Enq_Stat == null && formdata1.Enq_Stat == undefined) ? "0" : formdata1.Enq_Stat;

  try {
    const updateRTLMstQuery = `
      UPDATE RTL_MST SET
        Export_Type = :Export_Type
        WHERE tran_id = :tran_id
    `;
    const rtlMstValues = {
      tran_id,
      Export_Type: 33
    };
    await sequelize.query(updateRTLMstQuery, {
      replacements: rtlMstValues,
      transaction: t
    });

    const insertRTLMstQuery = `
    INSERT INTO RTL_MST (
      tran_id,book_attachment, docs, Modl_Var, enquiry_date, Exp_Del_Date, Fin_Code, Enq_No, Ledg_Name, Ph1, Modl_Code, DSE_Gen, Enq_Stat, Qty, Ledg_Add1, Teh_Code, Dist_Code, Stat_Code,
      Pin_Code, Email_Id, Ph2, Enq_Src, Cust_Ocu, Pymt_Mode, Loc_Code, Veh_Amt, Insu_Amt, RTO_Amt, war_Amt, Acc_Amt, Loy_Card_Amt,
      Other_Charge, Disc_Amt, Total_Amt, Book_Date, Book_Mode, Book_No, Book_Amt, Book_Rem, Lost_Date, Lost_Reason, Export_Type, ServerId
    ) VALUES (
      :tran_id,:book_attachment, :docs, :Modl_Var, :enquiry_date, :Exp_Del_Date, :Fin_Code, :Enq_No, :Ledg_Name, :Ph1, :Modl_Code, :DSE_Gen, :Enq_Stat, :Qty, :Ledg_Add1, :Teh_Code, :Dist_Code, :Stat_Code,
      :Pin_Code, :Email_Id, :Ph2, :Enq_Src, :Cust_Ocu, :Pymt_Mode, :Loc_Code, :Veh_Amt, :Insu_Amt, :RTO_Amt, :war_Amt, :Acc_Amt, :Loy_Card_Amt,
      :Other_Charge, :Disc_Amt, :Total_Amt, :Book_Date, :Book_Mode, :Book_No, :Book_Amt, :Book_Rem, :Lost_Date, :Lost_Reason, :Export_Type, :ServerId
    )`;

    const rtlMstValues1 = {
      tran_id: tran_id,
      book_attachment: formdata1.book_attachment || null,
      docs: DOCS,
      Modl_Var: formdata1.Modl_Var || null,
      enquiry_date: formdata1?.enquiry_date || null,
      Exp_Del_Date: formdata1.Exp_Del_Date || null,
      Fin_Code: formdata1.Fin_Code || null,
      Enq_No: formdata1.Enq_No || null,
      Ledg_Name: formdata1.Ledg_Name || null,
      Ph1: formdata1.Ph1 || null,
      Modl_Code: formdata1.Modl_Code || null,
      DSE_Gen: formdata1.DSE_Gen || null,
      Enq_Stat: status || null,
      Qty: formdata1.Qty || null,
      Ledg_Add1: formdata1.Ledg_Add1 || null,
      Teh_Code: formdata1.Teh_Code || null,
      Dist_Code: formdata1.Dist_Code || null,
      Stat_Code: formdata1.Stat_Code || null,
      Pin_Code: formdata1.Pin_Code || null,
      Email_Id: formdata1.Email_Id || null,
      Ph2: formdata1.Ph2 || null,
      Enq_Src: formdata1.Enq_Src || null,
      Cust_Ocu: formdata1.Cust_Ocu || null,
      Pymt_Mode: formdata1.Pymt_Mode || null,
      Loc_Code: formdata1?.Loc_Code || null,
      Veh_Amt: formdata1.Veh_Amt || null,
      Insu_Amt: formdata1.Insu_Amt || null,
      RTO_Amt: formdata1.RTO_Amt || null,
      war_Amt: formdata1.war_Amt || null,
      Acc_Amt: formdata1.Acc_Amt || null,
      Loy_Card_Amt: formdata1.Loy_Card_Amt || null,
      Other_Charge: formdata1.Other_Charge || null,
      Disc_Amt: formdata1.Disc_Amt || null,
      Total_Amt: formdata1.Total_Amt || null,
      Book_Date: formdata1.Book_Date || null,
      Book_Mode: formdata1.Book_Mode || null,
      Book_No: formdata1.Book_No || null,
      Book_Amt: formdata1.Book_Amt || null,
      Book_Rem: formdata1.Book_Rem || null,
      Lost_Date: formdata1.Lost_Date || null,
      Lost_Reason: formdata1.Lost_Reason || null,
      Export_Type: 1,
      ServerId: 1
    };

    await sequelize.query(insertRTLMstQuery, {
      replacements: rtlMstValues1,
      transaction: t
    });



    for (const data of formdata1.rowdata) {
      const upsertEnqDtlQuery = `
        MERGE INTO Enq_Dtl AS target
        USING (VALUES (
          :Tran_Id, :SNo, :DSE_Reg, :Meet_Date, :Cont_Mod, :Cust_Rep, :Plan_date,
          :Loc_Code, :Dse_Reg_Label, :Export_Type, :ServerId
        )) AS source (Tran_Id, SNo, DSE_Reg, Meet_Date, Cont_Mod, Cust_Rep, Plan_date,
                      Loc_Code, Dse_Reg_Label, Export_Type, ServerId)
        ON target.Tran_Id = source.Tran_Id AND target.SNo = source.SNo
        WHEN MATCHED THEN
          UPDATE SET
            DSE_Reg = source.DSE_Reg,
            Meet_Date = source.Meet_Date,
            Cont_Mod = source.Cont_Mod,
            Cust_Rep = source.Cust_Rep,
            Plan_date = source.Plan_date,
            Loc_Code = source.Loc_Code,
            Dse_Reg_Label = source.Dse_Reg_Label,
            Export_Type = source.Export_Type,
            ServerId = source.ServerId
        WHEN NOT MATCHED THEN
          INSERT (Tran_Id, SNo, DSE_Reg, Meet_Date, Cont_Mod, Cust_Rep, Plan_date,
                  Loc_Code, Dse_Reg_Label, Export_Type, ServerId)
          VALUES (source.Tran_Id, source.SNo, source.DSE_Reg, source.Meet_Date, source.Cont_Mod,
                  source.Cust_Rep, source.Plan_date, source.Loc_Code, source.Dse_Reg_Label,
                  source.Export_Type, source.ServerId);
      `;

      const enqDtlValues = {
        Tran_Id: tran_id,
        SNo: data.SNo,
        DSE_Reg: data.Dse_Reg,
        Meet_Date: data.Meet_Date,
        Cont_Mod: data.Cont_Mod,
        Cust_Rep: data.Cust_Rep,
        Plan_date: data.Plan_date,
        Loc_Code: data.Loc_Code,
        Dse_Reg_Label: data.Dse_Reg_Label,
        Export_Type: data.Export_Type,
        ServerId: data.ServerId
      };

      await sequelize.query(upsertEnqDtlQuery, {
        replacements: enqDtlValues,
        transaction: t
      });
    }

    await t.commit();
    res.status(200).send({
      Status: true,
      Message: "Success",
      Result: 'done',
    });
  } catch (e) {
    if (t) {
      await t.rollback();
    }

    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while processing request",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};




exports.updatefollowups = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode); // Assuming dbname is a function that initializes Sequelize
  const t = await sequelize.transaction();
  const { rowdata } = req.body;

  const tran_id = rowdata[0]?.Tran_Id;
  try {
    for (const data of rowdata) {
      const upsertEnqDtlQuery = `
        MERGE INTO Enq_Dtl AS target
        USING (VALUES (
          :Tran_Id, :SNo, :DSE_Reg, :Meet_Date, :Cont_Mod, :Cust_Rep, :Plan_date,
          :Loc_Code, :Dse_Reg_Label, :Export_Type, :ServerId
        )) AS source (Tran_Id, SNo, DSE_Reg, Meet_Date, Cont_Mod, Cust_Rep, Plan_date,
                      Loc_Code, Dse_Reg_Label, Export_Type, ServerId)
        ON target.Tran_Id = source.Tran_Id AND target.SNo = source.SNo
        WHEN MATCHED THEN
          UPDATE SET
            DSE_Reg = source.DSE_Reg,
            Meet_Date = source.Meet_Date,
            Cont_Mod = source.Cont_Mod,
            Cust_Rep = source.Cust_Rep,
            Plan_date = source.Plan_date,
            Loc_Code = source.Loc_Code,
            Dse_Reg_Label = source.Dse_Reg_Label,
            Export_Type = source.Export_Type,
            ServerId = source.ServerId
        WHEN NOT MATCHED THEN
          INSERT (Tran_Id, SNo, DSE_Reg, Meet_Date, Cont_Mod, Cust_Rep, Plan_date,
                  Loc_Code, Dse_Reg_Label, Export_Type, ServerId)
          VALUES (source.Tran_Id, source.SNo, source.DSE_Reg, source.Meet_Date, source.Cont_Mod,
                  source.Cust_Rep, source.Plan_date, source.Loc_Code, source.Dse_Reg_Label,
                  source.Export_Type, source.ServerId);
      `;

      const enqDtlValues = {
        Tran_Id: tran_id,
        SNo: data.SNo,
        DSE_Reg: data.Dse_Reg,
        Meet_Date: data.Meet_Date,
        Cont_Mod: data.Cont_Mod,
        Cust_Rep: data.Cust_Rep,
        Plan_date: data.Plan_date,
        Loc_Code: data.Loc_Code,
        Dse_Reg_Label: data.Dse_Reg_Label,
        Export_Type: data.Export_Type,
        ServerId: data.ServerId
      };

      await sequelize.query(upsertEnqDtlQuery, {
        replacements: enqDtlValues,
        transaction: t
      });
    }

    await t.commit();
    res.status(200).send({
      Status: true,
      Message: "Success",
      Result: 'done',
    });
  } catch (e) {
    if (t) {
      await t.rollback();
    }

    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while processing request",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};




exports.viewenquiryrowdata = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code
  const tran_id = req.body.tran_id
  try {
    const [a] = await sequelize.query(`SELECT  tran_id,book_attachment,Alot_chas,CAST(Modl_Var AS VARCHAR) as Modl_Var ,CONVERT(VARCHAR(10), enquiry_date, 23) AS enquiry_date, CONVERT(VARCHAR(10), Exp_Del_Date, 23) AS Exp_Del_Date, Enq_No, Ledg_Name, Ph1, CAST(Modl_Code AS VARCHAR) as Modl_Code, DSE_Gen,CAST(Enq_Stat AS VARCHAR) as Enq_Stat,
        CAST(Qty AS VARCHAR)  Qty, Ledg_Add1,  CAST(Teh_Code AS VARCHAR) as Teh_Code,CAST(Dist_Code AS VARCHAR) as Dist_Code,CAST(Stat_Code AS VARCHAR) as Stat_Code,
        Pin_Code, Email_Id, Ph2, Enq_Src, Cust_Ocu,CAST(Pymt_Mode AS VARCHAR) as Pymt_Mode, CAST(Fin_Code AS VARCHAR) as Fin_Code ,
         Veh_Amt, Insu_Amt, RTO_Amt, war_Amt, Acc_Amt, Loy_Card_Amt,  
        Other_Charge, Disc_Amt, Total_Amt, CONVERT(VARCHAR(10), Book_Date, 23) AS Book_Date, CONVERT(VARCHAR(10), Exp_Del_Date, 23) AS Exp_Del_Date,  CAST(Book_Mode AS VARCHAR) as Book_Mode,Book_No, Book_Amt, Book_Rem, CONVERT(VARCHAR(10), enquiry_date, 23) AS enquiry_date, CONVERT(VARCHAR(10), Lost_Date, 23) AS Lost_Date, Lost_Reason,Export_Type, ServerId
         from RTL_MST where export_type < 3 and loc_code='${loc_code}' and tran_id='${tran_id}'`);
        const ImgSourseArray = await sequelize.query(`SELECT docs from RTL_MST where Export_Type < 3 and loc_code='${loc_code}' and tran_id='${tran_id}'`);
        const [rowdata] = await sequelize.query(`SELECT 
          
          Cont_Mod,Cust_Rep,Dse_Reg,Dse_Reg_Label,Export_Type,Loc_Code,SNo,Tran_Id,ServerId,
       FORMAT(Meet_Date, 'yyyy-MM-dd') as Meet_Date,
       FORMAT(Plan_date, 'yyyy-MM-dd') as Plan_date
    
from Enq_Dtl where Loc_code='${loc_code}' and Tran_Id='${tran_id}'`);
    //  if (a.length > 0) {
    //   a[0].Book_Amt = parseFloat(a[0].Book_Amt).toFixed(2);
    //   a[0].Veh_Amt = parseFloat(a[0].Veh_Amt).toFixed(2);
    //   a[0].Insu_Amt = parseFloat(a[0].Insu_Amt).toFixed(2);
    //   a[0].RTO_Amt = parseFloat(a[0].RTO_Amt).toFixed(2);
    //   a[0].war_Amt = parseFloat(a[0].war_Amt).toFixed(2);
    //   a[0].Acc_Amt = parseFloat(a[0].Acc_Amt).toFixed(2);
    //   a[0].Loy_Card_Amt = parseFloat(a[0].Loy_Card_Amt).toFixed(2);
    //   a[0].Other_Charge = parseFloat(a[0].Other_Charge).toFixed(2);
    //   a[0].Disc_Amt = parseFloat(a[0].Disc_Amt).toFixed(2);
    //   a[0].Total_Amt = parseFloat(a[0].Total_Amt).toFixed(2);
    //   a[0].Book_Amt = parseFloat(a[0].Book_Amt).toFixed(2);
    // }
    const data = { ...a[0], rowdata, ImgSourseArray: JSON.parse(ImgSourseArray[0][0].docs) };

    res.status(200).send({ success: true, data: { ...a[0], rowdata, ImgSourseArray: JSON.parse(ImgSourseArray[0][0].docs) } });
  }
  catch (e) {
    console.log(e);
  }
  finally {
    await sequelize.close();
  }
}


exports.modelGrpvarmobile = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const [model_group] = await sequelize.query(`select Misc_Name AS label, CAST(Misc_Code as VARCHAR) as value from Misc_mst where Misc_type=14`);

    await sequelize.close();
    res.send({
      Status: "true",
      Message: "Success",
      Result: model_group,
    });
  } catch (err) {
    console.error("Error occurred while fetching data:", err);
    res.status(500).send("Error Occurred While Fetching Data");
  } finally {
    await sequelize.close();
  }
}


exports.dropdown = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const [dse] = await sequelize.query(`SELECT EMPCODE AS value , CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS label FROM EMPLOYEEMASTER WHERE export_type < 3 AND TRIM(EMPFIRSTNAME) != ''   --EMPLOYEEDESIGNATION LIKE '%DSE%';`)
    const [financer] = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) as value ,Misc_Name as label FROM Misc_Mst where misc_type = 8 and export_type < 3 `);
    const [pymt_mode] = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) as value ,Misc_Name as label FROM Misc_Mst where misc_type = 39 and export_type < 3`);
    const [state] = await sequelize.query(`select CAST(Misc_Code AS VARCHAR) as value ,Misc_Name as label from Misc_Mst where Misc_Type=3`);
    const [district] = await sequelize.query('select CAST(Misc_Code AS VARCHAR) as value,Misc_Name AS label from Misc_Mst where Misc_Type=1');
    const [model_group] = await sequelize.query(`select Misc_Name AS label, CAST(Misc_Code as VARCHAR) as value from Misc_mst where Misc_type=14`);
    const [Teh_Code] = await sequelize.query('select CAST(Misc_Code AS VARCHAR) as value,Misc_Name AS label from Misc_Mst where Misc_Type=1');
    const [source] = await sequelize.query('select  CAST(Misc_Code AS VARCHAR) as value,Misc_Name AS label from Misc_Mst where Misc_Type=17');
    const [cust_occ] = await sequelize.query('select  CAST(Misc_Code AS VARCHAR) as value,Misc_Name AS label from Misc_Mst where Misc_Type=11');

    await sequelize.close();
    res.send({ success: true, data: { financer, pymt_mode, state, district, model_group, Teh_Code, dse, source, cust_occ } });
  } catch (err) {
    console.error("Error occurred while fetching data:", err);
    res.status(500).send("Error Occurred While Fetching Data");
  } finally {
    await sequelize.close();
  }
}


exports.databyenqno = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Enq_No = req.body.Enq_No

  try {
    const [a] = await sequelize.query(`SELECT  DSE_Gen,Ledg_Name,Ph1,enquiry_date,Modl_Code,Modl_Var
      from RTL_MST where Enq_No='${Enq_No}'`);
    res.status(200).send({
      Status: "true",
      Message: "Success",
      Result: a
    });
  }
  catch (e) {
    console.log(e);
  }
  finally {
    await sequelize.close();
  }
}


exports.maxenquiryno = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const MaxCode = await sequelize.query('SELECT isnull(max(tran_id)+1,1) AS tran_id from RTL_MST');
    res.send({
      Status: "true",
      Message: "Success",
      Result: { tran_id: `E${MaxCode[0][0].tran_id}` }
    });
  } catch (err) {
    console.log(err);
  }
  finally {
    await sequelize.close();
  }
};


// (SELECT TOP 1 Misc_mst.Misc_Name 
//   FROM Misc_Mst 
//   WHERE Misc_mst.Misc_type = 10 
//     AND Misc_mst.Misc_Code = RTL_MST.color 
//  ) AS model_color,


exports.enquiryreport = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  const dateFrom = req.body.dateFrom;
  const dateTo = req.body.dateTo;
  const status = req.body.status;
  const DSE_Gen = req.body.dse;
  const Enq_Src = req.body.Enq_Src;
  let whereClause = '';

  try {
    if (status === "") {
      whereClause += ` AND ( Enq_stat ='0')`;
    } else if (status) {
      whereClause += ` AND Enq_stat = :status`;
    }
    // RTL_MST.Enq_Stat, RTL_MST.Ledg_Add1, RTL_MST.Ph1, RTL_MST.Email_Id, RTL_MST.Tran_Id, RTL_MST.DSE_Gen, RTL_MST.Ledg_Name, RTL_MST.Tran_Id, RTL_MST.Enq_No, RTL_MST.enquiry_date,
    // select Modl_Name as label,CAST(Item_Code AS VARCHAR) as value,Modl_Code from Modl_mst where Modl_Grp='${ModelGroup}'
    let query = `
    SELECT 
        RTL_MST.*,
        CONCAT(EMPLOYEEMASTER.EMPFIRSTNAME, ' ', EMPLOYEEMASTER.EMPLASTNAME) AS create_label,
        (SELECT TOP 1 Misc_mst.Misc_Name 
         FROM Misc_Mst 
         WHERE Misc_mst.Misc_type = 14 
           AND Misc_mst.Misc_Code = RTL_MST.Modl_Code 
        ) AS model_label,
        (SELECT TOP 1 Modl_mst.Modl_Name 
         FROM Modl_mst 
         WHERE Modl_mst.Item_Code = RTL_MST.Modl_var 
        ) AS variant_label
    FROM RTL_MST
    LEFT JOIN EMPLOYEEMASTER ON EMPLOYEEMASTER.EMPCODE = RTL_MST.DSE_Gen 
        AND EMPLOYEEMASTER.Export_Type = 1
    WHERE RTL_MST.Export_Type = 1 
      AND RTL_MST.enquiry_date BETWEEN :dateFrom AND :dateTo
      AND (Enq_stat = '0')
      ${loc_code ? 'AND RTL_MST.loc_code = :loc_code' : ''}
      ${DSE_Gen ? 'AND RTL_MST.DSE_Gen = :DSE_Gen' : ''}
      ${Enq_Src ? 'AND RTL_MST.Enq_Src = :Enq_Src' : ''}
    ORDER BY tran_id
    `;
    
    const replacements = {
      dateFrom,
      dateTo,
      ...(loc_code && { loc_code }),
      ...(DSE_Gen && { DSE_Gen }),
      ...(Enq_Src && { Enq_Src }),
    };
    

    const results = await sequelize.query(query, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT
    });

    for (const item of results) {
      const a = await sequelize.query(
        `SELECT * FROM Enq_Dtl WHERE tran_id = :tran_id`,
        {
          replacements: { tran_id: item.Tran_Id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      item.flow = a;
    }
    res.status(200).send({
      Status: "true",
      Message: "Data Fetched",
      Result: results
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({ success: false, error: e.message });
  } finally {
    await sequelize.close();
  }
};



exports.enquiryreport1 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  const dateFrom = req.body.dateFrom;
  const dateTo = req.body.dateTo;
  let whereClause = '';

  try {
 
     
    let query = `
 SELECT * from RTL_MST WHERE enquiry_date BETWEEN :dateFrom AND :dateTo and export_type = 2
 
      
    `;
    const replacements = {
      dateFrom: dateFrom,
      dateTo: dateTo
    };

    if (loc_code) {
      query += ` AND loc_code = :loc_code`;
      replacements.loc_code = loc_code;
    }
 
    const results = await sequelize.query(query, {
      replacements: replacements,
      type: sequelize.QueryTypes.SELECT
    });


    console.log(results,"queryquery")


    for (const item of results) {
      const a = await sequelize.query(
        `SELECT * FROM Enq_Dtl WHERE tran_id = :tran_id`,
        {
          replacements: { tran_id: item.Tran_Id },
          type: sequelize.QueryTypes.SELECT
        }
      );
      item.flow = a;
    }
    res.status(200).send({
      Status: "true",
      Message: "Data Fetched",
      Result: results
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({ success: false, error: e.message });
  } finally {
    await sequelize.close();
  }
};





exports.alotchasno = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const tran_id = req.body.tran_id;
  const Alot_chas = req.body.Alot_chas;

  try {
    // Check if Alot_chas already exists
    const checkExistingQuery = `
      SELECT COUNT(*) as count
      FROM RTL_MST
      WHERE Alot_chas = :Alot_chas 
    `;
    const checkValues = {
      Alot_chas,
      tran_id
    };
    const [existingResult] = await sequelize.query(checkExistingQuery, {
      replacements: checkValues,
      type: sequelize.QueryTypes.SELECT,
      transaction: t
    });

    if (existingResult.count > 0) {
      await t.rollback();
      res.status(200).send({
        Status: false,
        Message: "Chassis Number is already exists ",
        Result: null,
      });
      return;
    }
    const updateRTLMstQuery = `
      UPDATE RTL_MST SET
        Alot_chas = :Alot_chas,
        Enq_Stat = 4
      WHERE tran_id = :tran_id
    `;
    const rtlMstValues = {
      tran_id,
      Alot_chas
    };
    await sequelize.query(updateRTLMstQuery, {
      replacements: rtlMstValues,
      transaction: t
    });
    await t.commit();
    res.status(200).send({
      Status: true,
      Message: "Success",
      Result: 'done',
    });
  } catch (e) {
    if (t) {
      await t.rollback();
    }
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while processing request",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.dealotchasno = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const tran_id = req.body.tran_id;

  try {
    const updateRTLMstQuery = `
      UPDATE RTL_MST SET
        Alot_chas= NULL,
         Enq_Stat = 0
      WHERE tran_id = :tran_id
    `;
    const rtlMstValues = {
      tran_id,
    };
    await sequelize.query(updateRTLMstQuery, {
      replacements: rtlMstValues,
      transaction: t
    });
    await t.commit();
    res.status(200).send({
      Status: true,
      Message: "Success",
      Result: 'done',
    });
  } catch (e) {
    if (t) {
      await t.rollback();
    }
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while processing request",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};




exports.maxcodeforadd = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const misc_type = req.body?.misc_type;
  console.log(misc_type, "misc_type")
  try {
    const [results] = await sequelize.query(
      ` select MAX(misc_code) as maxcode from Misc_Mst where Misc_Type=${misc_type}`
    );
    console.log(results[0], "resultsresults")
    res.send({
      Status: "true",
      Message: "Success",
      Result: results[0].maxcode + 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred",
      Error: err.message
    });
  } finally {
    await sequelize.close();
  }
};


exports.adddropdata = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const data = req.body.newEntry;

  console.log(data, "datadatadatadatadata");

  try {
    // Insert data into the table
    const result = await sequelize.query(
      `INSERT INTO Misc_Mst (misc_code, misc_name, misc_type,export_Type,Serverid,Loc_code)
       VALUES (:misc_code,:misc_name,:misc_type,:export_Type,:Serverid,:Loc_code)`,
      {
        replacements: {
          misc_code: data.misc_code,
          misc_name: data.misc_name,
          misc_type: data.misc_type,
          export_Type: 1,
          Serverid: 1,
          Loc_code: data.Loc_code
        }
      }
    );

    res.send({
      Status: "true",
      Message: "Success",
      Result: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      Status: "false",
      Message: "Error occurred",
      Error: err.message
    });
  } finally {
    await sequelize.close();
  }
};





exports.excelimport = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();


  console.log(req.body,"body")
  try {
      const excelFile = req.files?.["excel"]?.[0];
      if (!excelFile) {
          throw new Error("No file uploaded");
      }
      const workbook = xlsx.read(excelFile.buffer, { type: "buffer", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });


      console.log(transformedData,"transformedData")
      // Fetch max transaction ID
      const maxTranIdQuery = `SELECT COALESCE(MAX(tran_id), 0) AS max_tran_id FROM RTL_MST`;
      const [results] = await sequelize.query(maxTranIdQuery);
      const maxTranId = results[0]?.max_tran_id || 0;
      let globalTranId = maxTranId + 1;
 
      transformedData.forEach((item, index) => {
          item.TRAN_ID = globalTranId++;
          item.srno = index + 1; // Adding a unique serial number
      });

      // Batch processing
      const BATCH_SIZE = 1000;
      const batchCount = Math.ceil(transformedData.length / BATCH_SIZE);

      for (let i = 0; i < batchCount; i++) {
          const batchStart = i * BATCH_SIZE;
          const batchEnd = batchStart + BATCH_SIZE;
          const dataBatch = transformedData.slice(batchStart, batchEnd);

          const values = dataBatch.map(
              (item) =>
                  `(:TRAN_ID_${item.srno}, :Loc_code_${item.srno}, :Export_Type_${item.srno},  :Ph1_${item.srno}, 
                   :Qty_${item.srno}, :Modl_Code_${item.srno}, :Ledg_Name_${item.srno}, :enquiry_date_${item.srno}, :ServerId_${item.srno}, :Email_Id${item.srno} ,:Enq_Stat${item.srno})`
          ).join(", ");
          console.log(dataBatch,'dataBatch')
          const replacements = {};
          dataBatch.forEach((item) => {
              replacements[`TRAN_ID_${item.srno}`] = item.TRAN_ID;
              replacements[`Loc_code_${item.srno}`] = req.body.branch;
              replacements[`Export_Type_${item.srno}`] = 2;
              replacements[`Ph1_${item.srno}`] = item.Ph1 || null;
              replacements[`Qty_${item.srno}`] = item.Qty || null;
              replacements[`Modl_Code_${item.srno}`] = item.Modl_Code || null;
              replacements[`Ledg_Name_${item.srno}`] = item.Ledg_Name || null;
              replacements[`enquiry_date_${item.srno}`] = item.enquiry_date || null;
              replacements[`ServerId_${item.srno}`] = 1;
              replacements[`Email_Id${item.srno}`] = item.Email_Id;
              replacements[`Enq_Stat${item.srno}`] = 0 ;
          });
          console.log(replacements,'replacements')
          await sequelize.query(
              `INSERT INTO RTL_MST 
              (TRAN_ID, Loc_code, Export_Type, Ph1, Qty, Modl_Code, Ledg_Name, enquiry_date, ServerId ,Email_Id,Enq_Stat) 
              VALUES ${values}`,
              {
                  replacements,
                  transaction: t,
              }
          );
          console.log(`Inserted batch ${i + 1} with ${dataBatch.length} items`);
      }

      await t.commit();

      res.send({
          Status: "true",
          Message: "Success",
          Result: transformedData.slice(0, 10), // Send top 10 entries
      });
  } catch (error) {
      console.error("Error during Excel import:", error);
      await t.rollback();
      res.status(500).send({ Message: error.message || "Error inserting data" });
  } finally {
      await sequelize.close();
  }
};

