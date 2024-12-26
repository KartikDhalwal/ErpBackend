const { Sequelize, DataTypes, literal, QueryTypes } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const Joi = require("joi");
const nodemailer = require("nodemailer");
const cron = require("node-cron");
const schedule = require("node-schedule");
const https = require("https");

const { _Template, TemplateDataSchema } = require("../models/Templates");
const { _EmpDtl, EmpDtlSchema } = require("../models/EmpDtl");
const { _EmpMst, EmpMstSchema } = require("../models/EmpMst");
const { _EmpRights, EmpRightsSchema } = require("../models/EmpRights");

// const job = schedule.scheduleJob("43 16 * * *", myTask);

// async function myTask() {
//     const sequelize = await dbname('demo');

//     var currentDate = new Date();
//     var currentDay = currentDate.getDate();
//     var currentMonth = currentDate.getMonth() + 1;

//     currentDay = currentDay < 10 ? '0' + currentDay : currentDay;
//     currentMonth = currentMonth < 10 ? '0' + currentMonth : currentMonth;

//     const wish = await sequelize.query(`SELECT * FROM Templates Where SCHEDULED = 1`, { type: QueryTypes.SELECT });
//     console.log(wish)
//     for (const employee1 of wish) {
//         const sendDate = employee1.SEND_DATE;
//         console.log(sendDate)
//         const query = await sequelize.query(`SELECT TITLE,EMPFIRSTNAME,EMPLASTNAME, MOBILE_NO, CORPORATEMAILID FROM Emp_Mst WHERE MONTH(${sendDate}) = MONTH(GETDATE())
//         AND DAY(${sendDate}) = DAY(GETDATE()); `, { type: QueryTypes.SELECT });

//         const EMPDATA1 = query;
//         console.log(EMPDATA1)
//         const messageTemplate = employee1.CONTENT;
//         const sched = employee1.SCHEDULED;

//         console.log(messageTemplate,'fff')

//         for (const employee of EMPDATA1) {
//             const title = employee.TITLE;
//             const firstName = employee.EMPFIRSTNAME;
//             const lastName = employee.EMPLASTNAME;
//             const mobileNo = employee.MOBILE_NO;

//             const data = [[title, firstName, lastName, mobileNo]];

//             data.forEach(([title, firstName, lastName]) => {
//                 const message = generateMessage(messageTemplate, title, firstName, lastName);
//                 console.log(message);
//                 console.log(mobileNo)
//                 if (message) {
//                     let transporter = nodemailer.createTransport({
//                         service: 'gmail',
//                         auth: {
//                             user: 'AUTOVYN.MAILER@gmail.com',
//                             pass: 'lamdgvthpjetawtr'
//                         }
//                     });

//                     const mailOptions = {
//                         from: 'AUTOVYN.MAILER@gmail.com',
//                         to: employee.CORPORATEMAILID,
//                         subject: employee1.TEMPLATE_NAME,
//                         text: message
//                     };

//                     transporter.sendMail(mailOptions, function (error, info) {
//                         if (error) {
//                             console.log(error);
//                         } else {
//                             console.log('Email sent: ' + info.response);
//                         }
//                     });
//                 }
//             });
//         }
//     }
// }

// function generateMessage(template, title, firstName, lastName) {
//   return template
//     .replace(/< TITLE >/g, title)
//     .replace(/< EMPFIRSTNAME >/g, firstName)
//     .replace(/< EMPLASTNAME >/g, lastName);
// }

// cron.schedule('41 18 * * *', async () => {
//     try {
//         SendMail();
//     } catch (err) {
//         console.error('Error occurred while sending mail:', err);
//     }
// });

// const SendMail = async function (req, res) {
//     const sequelize = await dbname('demo');
//     try {
//         const Template = _Template(sequelize, DataTypes);
//         const EmpMst = _EmpMst(sequelize, DataTypes);
//         const EmpDtl = _EmpDtl(sequelize, DataTypes);
//         const EmpRights = _EmpRights(sequelize, DataTypes);
//         const currentDate = new Date();
//         const currentYear = currentDate.getFullYear();
//         const currentMonth = currentDate.getMonth() + 1;
//         const currentDay = currentDate.getDate();
//         const currentDateString = `${currentYear}-${currentMonth}-${currentDay}`;

//         const Wish = await EmpMst.findAll({
//             attributes: [
//                 ['EMPCODE', 'EMPCODE'],
//                 ['EMPFIRSTNAME', 'EMPFIRSTNAME'],
//                 ['EMPLASTNAME', 'EMPLASTNAME'],
//                 ['MOBILE_NO', 'MOBILE_NO'],
//                 ['CORPORATEMAILID', 'CORPORATEMAILID']
//             ],
//             where: { DOB: currentDateString }
//         });

//         for (const wish of Wish) {
//             const TemplateData = await Template.findOne({
//                 attributes: [
//                     ['TEMPLATE_NO', 'value'],
//                     ['TEMPLATE_NAME', 'Label'],
//                     ['CONTENT', 'CONTENT'],
//                     ['KEYWORDS', 'KEYWORDS'],
//                     ['SEND_DATE', 'SEND_DATE']
//                 ],
//                 where: { SEND_DATE: 'DOB' }
//             });

//                 await sequelize.close();
//                 // res.status(200).send({ success: true });
//             let transporter = nodemailer.createTransport({
//                 service: 'gmail',
//                 auth: {
//                     user: 'AUTOVYN.MAILER@gmail.com',
//                     pass: 'lamdgvthpjetawtr'
//                 }
//             });

//             const mailOptions = {
//                 from: 'AUTOVYN.MAILER@gmail.com',
//                 to: wish.CORPORATEMAILID,
//                 subject: TemplateData.TEMPLATE_NAME,
//                 text: TemplateData.CONTENT
//             };

//             transporter.sendMail(mailOptions, function (error, info) {
//                 if (error) {
//                     console.log(error);
//                 } else {
//                     console.log('Email sent: ' + info.response);
//                 }
//             });
//         }
//     } catch (err) {
//         await sequelize.close();
//         console.log(err);
//         // res.status(500).send({ success: false, error: err.message });
//     }
// }

// module.exports.SendMail = SendMail;

exports.SendLetter = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Template = _Template(sequelize, DataTypes);

    const TemplateData = await Template.findAll({
      attributes: [
        ["TEMPLATE_NO", "value"],
        ["TEMPLATE_NAME", "Label"],
        ["CONTENT", "CONTENT"],
        ["KEYWORDS", "KEYWORDS"],
      ],
      where: { TEMPLATE_NO: req.body.value },
    });

    let data = {
      Template: TemplateData,
    };
    await sequelize.close();
    res.status(200).send({ success: true, data: data });
  } catch (err) {
    await sequelize.close();
    console.log(err);
  }
};

exports.FindTemplateContent = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Template = _Template(sequelize, DataTypes);

    const EmpMst_ = await sequelize.query(`select * from employeemaster where EMPCODE= :EMPCODE and export_type < 3`,
      { replacements: { EMPCODE: req.body.SRNO } });

    const TemplateData = await Template.findAll({
      attributes: [
        ["TEMPLATE_NO", "value"],
        ["TEMPLATE_NAME", "Label"],
        ["CONTENT", "CONTENT"],
        ["KEYWORDS", "KEYWORDS"],
      ],
      where: { TEMPLATE_NO: req.body.value },
    });

    let data = {
      Template: TemplateData,
      EMPL: EmpMst_,
    };
    await sequelize.close();
    res.status(200).send({ success: true, data: data });
  } catch (err) {
    await sequelize.close();
    console.log(err);
  }
};

exports.FindTemplate= async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Template = _Template(sequelize, DataTypes);
    const TemplateData = await Template.findAll({
      attributes: [
        ["TEMPLATE_NO", "value"],
        ["TEMPLATE_NAME", "label"],
      ],
    });
    let data = {
      Template: TemplateData,
    };
    await sequelize.close();
    res.status(200).send({ success: true, data: data });
  } catch (err) {
    await sequelize.close();
    console.log(err);
  }
};

exports.insertData = async function (req, res) {
  const BodyData = req.body;
  console.log(BodyData);
  const { error, value: TemplateData } = TemplateDataSchema.validate(
    BodyData.Template,
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );
  console.log(TemplateData);
  const Created_by = BodyData.Created_by;
  // if (error) {
  //   const errorMessage = error.details.map((err) => err.message).join(", ");
  //   return res.status(400).send({ success: false, message: errorMessage });
  // } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const Template = _Template(sequelize, DataTypes);
    try {
      console.log(TemplateData, "TemplateData");
      const Template_ = await Template.create(
        { KEYWORDS:TemplateData.KEYWORDS,TEMPLATE_NAME:TemplateData.TEMPLATE_NAME,CONTENT:TemplateData.CONTENT, Created_by: BodyData.Created_by },
        { transaction: t }
      );
      await t.commit();
      res.status(200).send({ success: true, Message: "Data saved" });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "An error occurred while creating Employee jasj.",
        error,
      });
      await t.rollback();
    } finally {
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  // }
};

exports.updateData = async function (req, res) {
  const BodyData = req.body;
  console.log(BodyData);

  const { error, value: TemplateData } = TemplateDataSchema.validate(
    BodyData.Template,
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );
  console.log(TemplateData);

  const Created_by = BodyData.Created_by;
  const TemplateNo = BodyData.TemplateId; // Use TemplateNo instead of TemplateId
console.log(TemplateNo);
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const Template = _Template(sequelize, DataTypes);

    try {
      console.log(TemplateData, "TemplateData");

      // Find the record to update using TemplateNo
      const [affectedCount, updatedRecords] = await Template.update(
        { CONTENT:TemplateData.CONTENT, Created_by: BodyData.Created_by },
        {
          where: { TEMPLATE_NO: TemplateNo }, // Use TemplateNo here
          returning: true, // To get the updated record(s)
          transaction: t
        }
      );

      if (affectedCount === 0) {
        // No records were updated
        return res.status(404).send({ success: false, message: "Record not found" });
      }

      await t.commit();
      res.status(200).send({
        success: true,
        Message: "Data updated successfully",
        updatedRecord: updatedRecords[0]
      });
    } catch (error) {
      console.log(error);
      res.status(500).send({
        success: false,
        message: "An error occurred while updating the record.",
        error,
      });
      await t.rollback();
    } finally {
      await sequelize.close();
      console.log("Connection has been closed.");
    }
  }
};



exports.empdata = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const empcode=req.body.empcode;
  try {
    
      const a = await sequelize.query(`SELECT CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME,PERMANENTADDRESS1 as EMPADDRESSP,
        PANNO AS EMPPAN,DOB AS EMPDOB,GENDER AS EMPGENDER,FATHERNAME AS EMPFATHERNAME,
        CORPORATEMAILID AS EMPEMAIL,MONTHLY_CTC AS EMPMONTHLYCTC ,ANNUAL_CTC AS EMPANNUALCTC,BRANCH AS EMPBRANCH,CURRENTADDRESS1 AS EMPADDRESSC,
        EMPLOYEEDESIGNATION AS EMPDESIGNATION,(select top 1 misc_name from misc_mst where Misc_Type=68 and Export_Type<3 and Misc_Code=DIVISION) as EMPDEPARTMENT,
        EMPCODE AS EMPCODE,MOBILE_NO AS EMPMOB,CONVERT(VARCHAR(10), CURRENTJOINDATE, 23) as EMPJOINDATE,
        CONVERT(VARCHAR(10), LASTWOR_DATE, 23) as EMPLASTDATE
        from EMPLOYEEMASTER where EMPCODE='${empcode}'`);  
      console.log(a[0],"aaaaaa")
     
  res.status(200).send({ success: true, data: a[0]});
     
  }
  catch (e) {
      console.log(e);
  }
  finally {
      await sequelize.close();
  }
}
