const sql = require('mssql');
const https = require('https');
const nodemailer = require('nodemailer');
const { dbname } = require("../utils/dbconfig");
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const FormData = require("form-data");
const axios = require("axios");
const { _Employeemaster, EmployeemasterSchema, } = require("../models/Employeemaster");
const { _InterviewSideTables } = require("../models/InterviewSideTables");
const { Sequelize, DataTypes, literal } = require("sequelize");
const { SendWhatsAppMessgae } = require("./user");
const { PDFDocument, rgb } = require('pdf-lib');
const { Buffer } = require('buffer');



let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "automailerautovyn@gmail.com",
    pass: "azucvdumhwegelzg",
  },
});
let transporter2 = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "AUTOVYN.MAILER@gmail.com",
    pass: "lamdgvthpjetawtr",
  },
});

async function sendmail(EMAIL, subject, html) {
  if (EMAIL) {
    var BCCMAIL = ['devs@autovyn.com', 'yuvraj@autovyn.com', 'gopal@autovyn.com'];
    let mailOptions = {
      from: 'AUTOVYN.MAILER@gmail.com',
      to: EMAIL,
      bcc: BCCMAIL,
      subject: subject,
      html: html,
      // attachments: [
      //     {
      //         filename: 'favicon.png',
      //         path: 'public/favicon.png',
      //         cid: 'favicon'
      //     }
      // ]
    };
    let mailOptions2 = {
      from: 'automailerautovyn@gmail.com',
      to: EMAIL,
      bcc: BCCMAIL,
      subject: subject,
      html: html,
      // attachments: [
      //     {
      //         filename: 'favicon.png',
      //         path: 'public/favicon.png',
      //         cid: 'favicon'
      //     }
      // ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        transporter2.sendMail(mailOptions2, (error, info1) => {
          if (error) {
            return false;
          }
          return true;
        })
        return false;
      }
      return true;
    });
  }
}
// function generateOTP() {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// }
// function sendmsg(number, otp) {
//   const recipientNumber = number; // Replace with the recipient's phone number
//   const message = otp;
//   const apiKey = 'b7bb5cecab0f94922762b271ffec8f04db5437ce';
//   const instance = 'GXh6SeK9lv45PIC';
//   const url = `https://app.nationalbulksms.com/api/send-text.php?number=${encodeURIComponent(recipientNumber)}&msg=${encodeURIComponent(message)}&apikey=${apiKey}&instance=${instance}`;
//   console.log(otp);
//   https.get(url, (response) => {
//     let data = '';
//     response.on('data', (chunk) => {
//       data += chunk;
//     });
//     response.on('end', () => {
//       if (response.statusCode === 200) {
//         console.log('SMS sent successfully:', data);
//       } else {
//         console.error('Error sending SMS:', data);
//       }
//     });
//   }).on('error', (error) => {
//     console.error('Error sending SMS:', error);
//   });
// }
// exports.viewjoinig = async function (req, res) {
//   res.render('viewjoinig');
// }
exports.candreg = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    // const result1 = await sequelize.query('select CAST(Misc_Code as VARCHAR) as value, Misc_Name as label from Misc_Mst where Misc_Type = 1 group by misc_name,misc_code');
    const result2 = await sequelize.query('select CAST(Misc_Code as VARCHAR) as value, Misc_Name as label from Misc_Mst where Misc_Type = 3');
    const result3 = await sequelize.query(`select distinct(EMPLOYEEDESIGNATION) as value, EMPLOYEEDESIGNATION as label from EMPLOYEEMASTER where EMPLOYEEDESIGNATION is not null and EMPLOYEEDESIGNATION !=''`);
    const result4 = await sequelize.query('select CAST(Misc_Code as VARCHAR) as value, Misc_Name as label from Misc_Mst where Misc_Type = 85');
    const result5 = await sequelize.query('select CAST(Misc_Code as VARCHAR) as value, Misc_Name as label from Misc_Mst where Misc_Type = 17');
    // const result6 = await sequelize.query('select CAST(Misc_Code as VARCHAR) as value, Misc_Name as label from Misc_Mst where Misc_Type = 601');
    // const result7 = await sequelize.query('select CAST(Misc_Code as VARCHAR) as value, Misc_Name as label from Misc_Mst where Misc_Type = 603');

    res.status(200).send({
      cities: [], states: result2[0], desg: result3[0], location: result4[0],
      sources: result5[0], skills: [], religion: []
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error connecting to the database.');
  }
}
async function uploadImages(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    console.log(files);

    await Promise.all(files?.map(async (file, index) => {
      const customPath = `${Comp_Code}/interview/`;
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
        columndoc_type: "NCR",
        DOC_PATH: `${customPath}${fileName}`,
      };
      console.log(data, 'data');
      dataArray.push(data);
    }));
    console.log(dataArray, 'dataArray');
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}
exports.insertnewcandidatehr = async function (req, res) {
  const { NAME, MOB_NO, EMAIL, DESIGNATION, LOC_CODE } = req.body;
  const currentDate = new Date().toISOString();
  const APPLICATION_DATE = currentDate;

  const sequelize = await dbname(req.headers.compcode);
  try {
    const missingFields = [];
    if (!NAME) missingFields.push("NAME");
    if (!MOB_NO) missingFields.push("MOB_NO");
    if (!LOC_CODE) missingFields.push("LOC_CODE");
    if (!DESIGNATION) missingFields.push("DESIGNATION");
    if (!EMAIL) missingFields.push("EMAIL");

    if (missingFields.length > 0) {
      return res.status(400).json({ error: "One or more required fields are missing.", missingFields });
    }

    // Get new transaction ID
    const [recordSet] = await sequelize.query('SELECT isnull(MAX(TRAN_ID)+1,1) AS Tranid FROM NEW_JOINING');
    const newtranid = recordSet[0]?.Tranid;

    // Insert new record
    const sql = `
      INSERT INTO NEW_JOINING 
      (TRAN_ID, NAME, MOB_NO, LOC_CODE, DESIGNATION, EMAIL)
      VALUES 
      (:TRAN_ID, :NAME, :MOB_NO, :LOC_CODE, :DESIGNATION, :EMAIL);
    `;

    await sequelize.query(sql, {
      replacements: { TRAN_ID: newtranid, NAME, MOB_NO, LOC_CODE, DESIGNATION, EMAIL },
      type: sequelize.QueryTypes.INSERT
    });

    res.send({ kartik: 'Record inserted successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ Message: 'An error occurred while inserting the record.' });
  }
};
exports.interviewcanidates = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const branch = await sequelize.query(`
SELECT 
    nj.CITY as CITY1,
    (select top 1 Misc_Name from Misc_Mst where Misc_Code = nj.STATE and  Misc_Type = 3) AS STATE1,
    (select top 1 Misc_Name from Misc_Mst where Misc_Code = nj.RELIGION and  Misc_Type = 603) AS RELIGION1,
    (select top 1 Misc_Name from Misc_Mst where Misc_Code = nj.LOC_CODE and  Misc_Type = 85) AS LOC_CODE1,
    CONVERT(varchar, nj.APPLICATION_DATE, 105) as APPLICATION_DATE1,
    CONVERT(varchar, nj.DOB, 105) as DOB1,
    CONVERT(varchar, nj.DOM, 105) as DOM1,
    (select top 1 CONCAT(em1.empfirstname, ' ', em1.emplastname) from EMPLOYEEMASTER em1 where em1.EMPCODE=nj.INTR1BY) as employeename1 ,  -- Alias with 1 for the first empcode
    (select top 1 CONCAT(em2.empfirstname, ' ', em2.emplastname) from EMPLOYEEMASTER em2 where em2.EMPCODE=nj.INTR2BY) as employeename2 ,  -- Alias with 2 for the second empcode
    (select top 1 CONCAT(em3.empfirstname, ' ', em3.emplastname) from EMPLOYEEMASTER em3 where em3.EMPCODE=nj.INTR3BY) as employeename3 ,  -- Alias with 3 for the third empcode
    (select top 1 CONCAT(em4.empfirstname, ' ', em4.emplastname) from EMPLOYEEMASTER em4 where em4.EMPCODE=nj.INTR4BY) as employeename4 ,  -- Alias with 4 for the fourth empcode
    nj.* 
FROM 
    NEW_JOINING nj
    where
    nj.INT_STATUS in (1)

`);
    const SRNOS = branch[0].map((abcd) => (abcd.TRAN_ID));
    if (!SRNOS?.length) {
      return res.status(200).send([])
    }
    const interviewSideData = await sequelize.query(
      `SELECT * FROM Interview_SideTables where SRNO in (${SRNOS.join(',')})`
    );
    const ImageData = await sequelize.query(
      `select * from DOC_UPLOAD where Doc_Type='NCR' and Export_type < 3 and TRAN_ID in (${SRNOS.join(',')})`,
    );

    const fieldsToKeepByType = {
      1: [ // EmpExperience
        'Emp_Company',
        'Emp_Designation',
        'Emp_Responsibility',
        'Emp_From_Date',
        'Emp_To_Date',
        'Emp_Settlement_Done',
        'Emp_Drawn_Salary',
        'Emp_Leaving_Reason'
      ],
      2: [ // EmpEdu
        'Emp_Degree',
        'Emp_Board',
        'Emp_College',
        'Emp_Passing_year',
        'Emp_Percentage'
      ],
      3: [ // EmpItSkill
        'Emp_Tool',
        'Emp_Version',
        'Emp_Proficiency',
        'Emp_Last_Used',
        'Emp_Experience'
      ],
      4: [ // EmpLang
        'Emp_Language',
        'Emp_Language_Understand',
        'Emp_Language_Speak',
        'Emp_Language_Read',
        'Emp_Language_Write'
      ],
      5: [ // References
        'Emp_Ref_Name',
        'Emp_Ref_Occup',
        'Emp_Ref_Address',
        'Emp_Ref_Mobile',
        'Emp_Ref_emailid',
        'Emp_Ref_relation'
      ],
      6: [ // EmpNominee
        'Nominee_Name',
        'Member_Name',
        'Relation',
        'Percentage',
        'Is_Minor'
      ]
    };

    const Tbl_Type = {
      EmpExperience: 1,
      EmpEdu: 2,
      EmpItSkill: 3,
      EmpLang: 4,
      References: 5,
      EmpNominee: 6
    }

    const processDataForAllSRNOs = (interviewData, ImageData) => {
      // Grouping the data by SRNO
      const groupedData = interviewData.reduce((acc, row) => {
        const { SRNO, Tbl_Type, ...rest } = row;
        const fieldsToKeep = fieldsToKeepByType[Tbl_Type] || [];

        // Filter out null values and keep only relevant fields
        const filteredData = fieldsToKeep.reduce((obj, field) => {
          if (rest[field] !== null && rest[field] !== undefined) {
            obj[field] = rest[field];
          }
          return obj;
        }, {});

        // Only push if there is any relevant data
        if (Object.keys(filteredData).length > 0) {
          if (!acc[SRNO]) {
            acc[SRNO] = {
              EmpEdu: [],
              EmpLang: [],
              EmpItSkill: [],
              EmpExperience: [],
              References: [],
              EmpFamily: [],
              EmpNominee: []
            };
          }

          // Mapping data to the correct array based on Tbl_Type
          switch (Tbl_Type) {
            case 1:
              acc[SRNO].EmpExperience.push(filteredData);
              break;
            case 2:
              acc[SRNO].EmpEdu.push(filteredData);
              break;
            case 3:
              acc[SRNO].EmpItSkill.push(filteredData);
              break;
            case 4:
              acc[SRNO].EmpLang.push(filteredData);
              break;
            case 5:
              acc[SRNO].References.push(filteredData);
              break;
            case 6:
              acc[SRNO].EmpNominee.push(filteredData);
              break;
          }
        }

        return acc;
      }, {});
      const groupedImageData = ImageData.reduce((acc, row) => {
        const { TRAN_ID, ...imageFields } = row;

        // Ensure there is an array to store images for each SRNO
        if (!acc[TRAN_ID]) {
          acc[TRAN_ID] = [];
        }

        // Push the image data into the array
        acc[TRAN_ID].push(imageFields);

        return acc;
      }, {});
      // Convert groupedData into an array if needed
      const finalData = branch[0].map((srno) => ({
        ...srno,
        ...groupedData[srno.TRAN_ID],
        IMAGES: groupedImageData[srno.TRAN_ID]
      }));

      return finalData;
    };

    // Call the function and get the processed data
    const result = processDataForAllSRNOs(interviewSideData[0], ImageData[0]);

    await sequelize.close();
    res.status(200).send(result);
  } catch (e) {
    console.log(e);
    if (sequelize) {
      await sequelize.close();
    }
    return res.status(500).send({ message: "Error" })
  }
}
exports.gethrentry = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(`SELECT *,(select top 1 misc_name from misc_mst where misc_Code = NEW_JOINING.loc_code and misc_type = 85) as locationname FROM NEW_JOINING WHERE ADDRESS IS NULL order by tran_id desc;`);
    await sequelize.close();
    res.status(200).send(branch[0]);
  } catch (e) { console.log(e); }
}

exports.rejectcanidates = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);

    if (!req.body.tran_id) {
      return res.status(400).send({
        status: false,
        message: "tran_id is mandatory",
      });
    }

    await sequelize.query(`
      UPDATE NEW_JOINING 
      SET int_status = 99, rejection_remark = '${req.body.msg}' 
      WHERE tran_id = ${req.body.tran_id}
    `);

    await sequelize.query(`
      INSERT INTO SHORtlisted_candidate (
        SKILLS, SRNO, EMPFIRSTNAME, MOBILE_NO, MOBILENO, CURRENTADDRESS1,
        PPINCODE, pState, PCITY, BASICQUALIFICATION, FATHERNAME,
        GENDER, MOTHERNAME, LOCATION, EMPLOYEEDESIGNATION, ALTERNET_MAIL,
        UID_NO, DOB, DOM, Export_Type, EMPCODE, SERVERid
      )
      SELECT 
        nj.SKILLS, nj.tran_id, nj.NAME, nj.MOB_NO, nj.WHATSAPP_NO, nj.ADDRESS,
        nj.PINCODE, nj.STATE, '', nj.HIGH_QUAL, nj.FATHERS_NAME,
        nj.GENDER, nj.MOTHERS_NAME, nj.LOC_CODE, nj.DESIGNATION,
        nj.EMAIL, nj.AADHAR_NO, nj.DOB, nj.DOM, nj.INT_status, '', ''
      FROM NEW_JOINING nj
      WHERE nj.tran_id = ${req.body.tran_id} 
      AND NOT EXISTS (
        SELECT 1 
        FROM SHORtlisted_candidate sc 
        WHERE sc.srno = nj.tran_id
      )
    `);

    await sequelize.close();

    if (req.body.check === "true") {
      if (!req.body.msg) {
        return res.status(400).send({
          status: false,
          message: "msg is mandatory",
        });
      }
      if (!req.body.wp_number) {
        return res.status(400).send({
          status: false,
          message: "whatsapp number is mandatory",
        });
      }
      // sendotp('91' + req.body.wp_number, req.body.msg);
      return res.status(200).send({ message: 'Message sent to the applicant' });
    } else {
      return res.status(200).send({ message: 'Applicant rejected' });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: 'API crashed.' });
  }
}

exports.shortlistcandidate = async function (req, res) {
  try {
    if (!req.body.tran_id) {
      return res.status(400).send({
        status: false,
        message: "tran_id is mandatory",
      });
    }

    const sequelize = await dbname(req.headers.compcode);
    const randomUUID = uuidv4();

    await sequelize.query(`
      UPDATE NEW_JOINING 
      SET int_status = 2, unique_id = '${randomUUID}' 
      WHERE tran_id = ${req.body.tran_id}
    `);

    await sequelize.query(`
      INSERT INTO SHORTLISTED_CANDIDATE (
        SKILLS, SRNO, EMPFIRSTNAME, MOBILE_NO, MOBILENO, CURRENTADDRESS1,
        PPINCODE, pState, PCITY, BASICQUALIFICATION, FATHERNAME,
        GENDER, MOTHERNAME, LOCATION, EMPLOYEEDESIGNATION, ALTERNET_MAIL,
        UID_NO, DOB, DOM, Export_Type, EMPCODE, SERVERid
      )
      SELECT 
        nj.SKILLS, nj.tran_id, nj.NAME, nj.MOB_NO, nj.WHATSAPP_NO, nj.ADDRESS,
        nj.PINCODE, nj.STATE, '', nj.HIGH_QUAL, nj.FATHERS_NAME, 
        nj.GENDER, nj.MOTHERS_NAME, nj.LOC_CODE, nj.DESIGNATION, 
        nj.EMAIL, nj.AADHAR_NO, nj.DOB, nj.DOM, nj.INT_status, '', '' 
      FROM NEW_JOINING nj
      WHERE nj.tran_id = ${req.body.tran_id} 
      AND NOT EXISTS (
        SELECT 1 
        FROM SHORTLISTED_CANDIDATE sc 
        WHERE sc.srno = nj.tran_id
      )
    `);

    await sequelize.close();
    res.status(200).send({ msg: 'Application Shortlisted', icon: 'success', title: 'Success' });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: 'API crashed.' });
  }
}

exports.shortlistedcandi = async function (req, res) {
  console.log("shortlistedcandi");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(`SELECT 
    nj.CITY as CITY1,
    (select top 1 Misc_Name from Misc_Mst where Misc_Code = nj.STATE and  Misc_Type = 3) AS STATE1,
    (select top 1 Misc_Name from Misc_Mst where Misc_Code = nj.RELIGION and  Misc_Type = 603) AS RELIGION1,
    (select top 1 Misc_Name from Misc_Mst where Misc_Code = nj.LOC_CODE and  Misc_Type = 85) AS LOC_CODE1,
    CONVERT(varchar, nj.APPLICATION_DATE, 105) as APPLICATION_DATE1,
    CONVERT(varchar, nj.DOB, 105) as DOB1,
    CONVERT(varchar, nj.DOM, 105) as DOM1,
    (select top 1 CONCAT(em1.empfirstname, ' ', em1.emplastname) from EMPLOYEEMASTER em1 where em1.EMPCODE=nj.INTR1BY) as employeename1 ,  -- Alias with 1 for the first empcode
    (select top 1 CONCAT(em2.empfirstname, ' ', em2.emplastname) from EMPLOYEEMASTER em2 where em2.EMPCODE=nj.INTR2BY) as employeename2 ,  -- Alias with 2 for the second empcode
    (select top 1 CONCAT(em3.empfirstname, ' ', em3.emplastname) from EMPLOYEEMASTER em3 where em3.EMPCODE=nj.INTR3BY) as employeename3 ,  -- Alias with 3 for the third empcode
    (select top 1 CONCAT(em4.empfirstname, ' ', em4.emplastname) from EMPLOYEEMASTER em4 where em4.EMPCODE=nj.INTR4BY) as employeename4 ,  -- Alias with 4 for the fourth empcode
    nj.* 
FROM 
    NEW_JOINING nj
    where
    nj.INT_STATUS not in (1)
`);
    const SRNOS = branch[0].map((abcd) => (abcd.TRAN_ID));
    const interviewSideData = await sequelize.query(
      `SELECT * FROM Interview_SideTables where SRNO in (${SRNOS.join(',')})`,
    );
    const ImageData = await sequelize.query(
      `select * from DOC_UPLOAD where Doc_Type='NCR' and Export_type < 3  and TRAN_ID in    (${SRNOS.join(',')})`,
    );

    const fieldsToKeepByType = {
      1: [ // EmpExperience
        'Emp_Company',
        'Emp_Designation',
        'Emp_Responsibility',
        'Emp_From_Date',
        'Emp_To_Date',
        'Emp_Settlement_Done',
        'Emp_Drawn_Salary',
        'Emp_Leaving_Reason'
      ],
      2: [ // EmpEdu
        'Emp_Degree',
        'Emp_Board',
        'Emp_College',
        'Emp_Passing_year',
        'Emp_Percentage'
      ],
      3: [ // EmpItSkill
        'Emp_Tool',
        'Emp_Version',
        'Emp_Proficiency',
        'Emp_Last_Used',
        'Emp_Experience'
      ],
      4: [ // EmpLang
        'Emp_Language',
        'Emp_Language_Understand',
        'Emp_Language_Speak',
        'Emp_Language_Read',
        'Emp_Language_Write'
      ],
      5: [ // References
        'Emp_Ref_Name',
        'Emp_Ref_Occup',
        'Emp_Ref_Address',
        'Emp_Ref_Mobile',
        'Emp_Ref_emailid',
        'Emp_Ref_relation'
      ],
      6: [ // EmpNominee
        'Nominee_Name',
        'Member_Name',
        'Relation',
        'Percentage',
        'Is_Minor'
      ]
    };
    const Tbl_Type = {
      EmpExperience: 1,
      EmpEdu: 2,
      EmpItSkill: 3,
      EmpLang: 4,
      References: 5,
      EmpNominee: 6
    }

    const processDataForAllSRNOs = (interviewData, ImageData) => {
      // Grouping the data by SRNO
      const groupedData = interviewData.reduce((acc, row) => {
        const { SRNO, Tbl_Type, ...rest } = row;
        const fieldsToKeep = fieldsToKeepByType[Tbl_Type] || [];

        // Filter out null values and keep only relevant fields
        const filteredData = fieldsToKeep.reduce((obj, field) => {
          if (rest[field] !== null && rest[field] !== undefined) {
            obj[field] = rest[field];
          }
          return obj;
        }, {});

        // Only push if there is any relevant data
        if (Object.keys(filteredData).length > 0) {
          if (!acc[SRNO]) {
            acc[SRNO] = {
              EmpEdu: [],
              EmpLang: [],
              EmpItSkill: [],
              EmpExperience: [],
              References: [],
              EmpFamily: [],
              EmpNominee: []
            };
          }

          // Mapping data to the correct array based on Tbl_Type
          switch (Tbl_Type) {
            case 1:
              acc[SRNO].EmpExperience.push(filteredData);
              break;
            case 2:
              acc[SRNO].EmpEdu.push(filteredData);
              break;
            case 3:
              acc[SRNO].EmpItSkill.push(filteredData);
              break;
            case 4:
              acc[SRNO].EmpLang.push(filteredData);
              break;
            case 5:
              acc[SRNO].References.push(filteredData);
              break;
            case 6:
              acc[SRNO].EmpNominee.push(filteredData);
              break;
          }
        }

        return acc;
      }, {});
      const groupedImageData = ImageData.reduce((acc, row) => {
        const { TRAN_ID, ...imageFields } = row;

        // Ensure there is an array to store images for each SRNO
        if (!acc[TRAN_ID]) {
          acc[TRAN_ID] = [];
        }

        // Push the image data into the array
        acc[TRAN_ID].push(imageFields);

        return acc;
      }, {});
      // Convert groupedData into an array if needed
      const finalData = branch[0].map((srno) => ({
        ...srno,
        ...groupedData[srno.TRAN_ID],
        IMAGES: groupedImageData[srno.TRAN_ID]
      }));

      return finalData;
    };

    // Call the function and get the processed data
    const result = processDataForAllSRNOs(interviewSideData[0], ImageData[0]);


    await sequelize.close();
    res.status(200).send({ data: result });

  } catch (e) {
    res.status(500).send({ Message: 'api crashed.' });
    console.log(e);
  }
}
exports.CurrentInterview = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(`SELECT 
    nj.CITY as CITY1,
    (select top 1 Misc_Name from Misc_Mst where Misc_Code = nj.STATE and  Misc_Type = 3) AS STATE1,
    (select top 1 Misc_Name from Misc_Mst where Misc_Code = nj.RELIGION and  Misc_Type = 603) AS RELIGION1,
    (select top 1 Misc_Name from Misc_Mst where Misc_Code = nj.LOC_CODE and  Misc_Type = 85) AS LOC_CODE1,
    CONVERT(varchar, nj.APPLICATION_DATE, 105) as APPLICATION_DATE1,
    CONVERT(varchar, nj.DOB, 105) as DOB1,
    CONVERT(varchar, nj.DOM, 105) as DOM1,
    (select top 1 CONCAT(em1.empfirstname, ' ', em1.emplastname) from EMPLOYEEMASTER em1 where em1.EMPCODE=nj.INTR1BY) as employeename1 ,  -- Alias with 1 for the first empcode
    (select top 1 CONCAT(em2.empfirstname, ' ', em2.emplastname) from EMPLOYEEMASTER em2 where em2.EMPCODE=nj.INTR2BY) as employeename2 ,  -- Alias with 2 for the second empcode
    (select top 1 CONCAT(em3.empfirstname, ' ', em3.emplastname) from EMPLOYEEMASTER em3 where em3.EMPCODE=nj.INTR3BY) as employeename3 ,  -- Alias with 3 for the third empcode
    (select top 1 CONCAT(em4.empfirstname, ' ', em4.emplastname) from EMPLOYEEMASTER em4 where em4.EMPCODE=nj.INTR4BY) as employeename4 ,  -- Alias with 4 for the fourth empcode
    nj.* 
FROM 
    NEW_JOINING nj
    WHERE 
	nj.INT_STATUS not in (1,99) and (
  nj.INTR1BY is not null or
	nj.INTR2BY is not null or
	nj.INTR3BY is not null or
	nj.INTR4BY is not null )
`);
    const SRNOS = branch[0].map((abcd) => (abcd.TRAN_ID));
    const interviewSideData = await sequelize.query(
      `SELECT * FROM Interview_SideTables where SRNO in (${SRNOS.join(',')})`,
    );
    const ImageData = await sequelize.query(
      `select * from DOC_UPLOAD where Doc_Type='NCR' and Export_type < 3 and TRAN_ID in (${SRNOS.join(',')})`,
    );

    const fieldsToKeepByType = {
      1: [ // EmpExperience
        'Emp_Company',
        'Emp_Designation',
        'Emp_Responsibility',
        'Emp_From_Date',
        'Emp_To_Date',
        'Emp_Settlement_Done',
        'Emp_Drawn_Salary',
        'Emp_Leaving_Reason'
      ],
      2: [ // EmpEdu
        'Emp_Degree',
        'Emp_Board',
        'Emp_College',
        'Emp_Passing_year',
        'Emp_Percentage'
      ],
      3: [ // EmpItSkill
        'Emp_Tool',
        'Emp_Version',
        'Emp_Proficiency',
        'Emp_Last_Used',
        'Emp_Experience'
      ],
      4: [ // EmpLang
        'Emp_Language',
        'Emp_Language_Understand',
        'Emp_Language_Speak',
        'Emp_Language_Read',
        'Emp_Language_Write'
      ],
      5: [ // References
        'Emp_Ref_Name',
        'Emp_Ref_Occup',
        'Emp_Ref_Address',
        'Emp_Ref_Mobile',
        'Emp_Ref_emailid',
        'Emp_Ref_relation'
      ],
      6: [ // EmpNominee
        'Nominee_Name',
        'Member_Name',
        'Relation',
        'Percentage',
        'Is_Minor'
      ]
    };
    const Tbl_Type = {
      EmpExperience: 1,
      EmpEdu: 2,
      EmpItSkill: 3,
      EmpLang: 4,
      References: 5,
      EmpNominee: 6
    }

    const processDataForAllSRNOs = (interviewData, ImageData) => {
      // Grouping the data by SRNO
      const groupedData = interviewData.reduce((acc, row) => {
        const { SRNO, Tbl_Type, ...rest } = row;
        const fieldsToKeep = fieldsToKeepByType[Tbl_Type] || [];

        // Filter out null values and keep only relevant fields
        const filteredData = fieldsToKeep.reduce((obj, field) => {
          if (rest[field] !== null && rest[field] !== undefined) {
            obj[field] = rest[field];
          }
          return obj;
        }, {});

        // Only push if there is any relevant data
        if (Object.keys(filteredData).length > 0) {
          if (!acc[SRNO]) {
            acc[SRNO] = {
              EmpEdu: [],
              EmpLang: [],
              EmpItSkill: [],
              EmpExperience: [],
              References: [],
              EmpFamily: [],
              EmpNominee: []
            };
          }

          // Mapping data to the correct array based on Tbl_Type
          switch (Tbl_Type) {
            case 1:
              acc[SRNO].EmpExperience.push(filteredData);
              break;
            case 2:
              acc[SRNO].EmpEdu.push(filteredData);
              break;
            case 3:
              acc[SRNO].EmpItSkill.push(filteredData);
              break;
            case 4:
              acc[SRNO].EmpLang.push(filteredData);
              break;
            case 5:
              acc[SRNO].References.push(filteredData);
              break;
            case 6:
              acc[SRNO].EmpNominee.push(filteredData);
              break;
          }
        }

        return acc;
      }, {});
      const groupedImageData = ImageData.reduce((acc, row) => {
        const { TRAN_ID, ...imageFields } = row;

        // Ensure there is an array to store images for each SRNO
        if (!acc[TRAN_ID]) {
          acc[TRAN_ID] = [];
        }

        // Push the image data into the array
        acc[TRAN_ID].push(imageFields);

        return acc;
      }, {});
      // Convert groupedData into an array if needed
      const finalData = branch[0].map((srno) => ({
        ...srno,
        ...groupedData[srno.TRAN_ID],
        IMAGES: groupedImageData[srno.TRAN_ID]
      }));

      return finalData;
    };

    // Call the function and get the processed data
    const result = processDataForAllSRNOs(interviewSideData[0], ImageData[0]);

    await sequelize.close();
    res.status(200).send({ data: result });

  } catch (e) {
    res.status(500).send({ Message: 'api crashed.' });
    console.log(e);
  }
}
exports.getcandidata = async function (req, res) {
  try {
    if (req.body.tran_id == "" || req.body.tran_id == undefined || req.body.tran_id == null) {
      return res.status(500).send({
        status: false,
        Message: "tran_id is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);
    const reminder_id = req.body.tran_id;
    const data = await sequelize.query(`select * from Shortlisted_candidate where srno='${reminder_id}'`);
    const images = await sequelize.query(`select * from doc_upload where tran_id='${data[0][0]?.SRNO}' and doc_type = 'NCR' AND EXPORT_TYPE < 5 order by srno`);
    const intrstatus = await sequelize.query(`select * from new_joining where tran_id='${reminder_id}'`);
    console.log(reminder_id, "reminder_id")
    const interviewSideData = await sequelize.query(
      `SELECT * FROM Interview_SideTables WHERE SRNO = ${reminder_id}`,
    );
    const filledArray = Array.from({ length: 6 }, (_, i) => {
      const srno = i + 1; // SRNO starts from 1
      const match = images[0].find(item => item.SRNO === srno);
      return match || { SRNO: srno, Doc_Type: null, TRAN_ID: null, path: null, File_Name: null, User_Name: null, Upload_Date: null, Export_type: null };
    });
    const fieldsToKeepByType = {
      1: [ // EmpExperience
        'Emp_Company',
        'Emp_Designation',
        'Emp_Responsibility',
        'Emp_From_Date',
        'Emp_To_Date',
        'Emp_Settlement_Done',
        'Emp_Drawn_Salary',
        'Emp_Leaving_Reason'
      ],
      2: [ // EmpEdu
        'Emp_Degree',
        'Emp_Board',
        'Emp_College',
        'Emp_Passing_year',
        'Emp_Percentage'
      ],
      3: [ // EmpItSkill
        'Emp_Tool',
        'Emp_Version',
        'Emp_Proficiency',
        'Emp_Last_Used',
        'Emp_Experience'
      ],
      4: [ // EmpLang
        'Emp_Language',
        'Emp_Language_Understand',
        'Emp_Language_Speak',
        'Emp_Language_Read',
        'Emp_Language_Write'
      ],
      5: [ // References
        'Emp_Ref_Name',
        'Emp_Ref_Occup',
        'Emp_Ref_Address',
        'Emp_Ref_Mobile',
        'Emp_Ref_emailid',
        'Emp_Ref_relation'
      ],
      6: [ // EmpNominee
        'Nominee_Name',
        'Member_Name',
        'Relation',
        'Percentage',
        'Is_Minor'
      ]
    };
    const Tbl_Type = {
      EmpExperience: 1,
      EmpEdu: 2,
      EmpItSkill: 3,
      EmpLang: 4,
      References: 5,
      EmpNominee: 6
    }

    const result = interviewSideData[0].reduce((acc, row) => {
      const { Tbl_Type, ...rest } = row;
      const fieldsToKeep = fieldsToKeepByType[Tbl_Type] || [];

      // Filter out null values and keep only relevant fields
      const filteredData = fieldsToKeep.reduce((obj, field) => {
        if (rest[field] !== null && rest[field] !== undefined) {
          obj[field] = rest[field];
        }
        return obj;
      }, {});

      // Only push if there is any relevant data
      if (Object.keys(filteredData).length > 0) {
        acc[Tbl_Type] = acc[Tbl_Type] || [];
        acc[Tbl_Type].push({
          ...filteredData,
        });
      }

      return acc;
    }, {});


    await sequelize.close();
    data[0].length ? res.send({
      intrstatus: intrstatus[0][0],
      data: { ...data[0][0], EmpEdu: result[Tbl_Type.EmpEdu], EmpLang: result[Tbl_Type.EmpLang], EmpItSkill: result[Tbl_Type.EmpItSkill], EmpExperience: result[Tbl_Type.EmpExperience], References: result[Tbl_Type.References], EmpFamily: [], EmpNominee: result[Tbl_Type.EmpNominee] }, images: filledArray, msg: 'data featched', icon: 'success', title: 'Success'
    }) : res.send({ data: data[0], msg: 'No data found', icon: 'error', title: 'Error' });
  } catch (e) {
    console.log(e);
    res.send({ msg: 'Problem Featching data', icon: 'error', title: 'Error', data: [] })
  }
}
async function uploadImagesTravel(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    console.log(files);
    await Promise.all(files?.map(async (file, index) => {
      const customPath = `${Comp_Code}/INTERVIEW/`;
      const ext = path.extname(file.originalname);
      const randomUUID = uuidv4();
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
        console.log(`Image uploaded successfully`);
      } catch (error) {
        console.error(`Error uploading image ${index}:`, error.message);
      }
      const data = {
        SRNO: index,
        EMP_CODE: Created_by,
        fieldname: file.fieldname,
        Created_by: Created_by,
        DOC_NAME: file.originalname,
        misspunch_inout: index,
        columndoc_type: "TRAVEL",
        DOC_PATH: `${customPath}${fileName}`,
      };
      console.log(data, 'data');
      dataArray.push(data);
    }));

    console.log(dataArray, 'dataArray');
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}
exports.empupdate = async function (req, res) {
  try {
    console.log(req.files);
    // return res.status(200).json({ message: 'Interview updated' });

    console.log(req.body, 'bofy')
    // console.log(req.files, 'files')
    // console.log(req.headers, 'headres')

    const missingFields = [];
    if (!req.body.tran_id) missingFields.push("tran_id");
    if (!req.body.username) missingFields.push("username");

    if (missingFields.length > 0) {
      return res.status(500).json({ error: "One or more required fields are missing.", missingFields });
    }
    const datafromreq = JSON.parse(req.body.formData);
    const query = `
  update shortlisted_candidate set 
  TITLE = ${datafromreq?.TITLE ? `'${datafromreq?.TITLE}'` : null},
  --MACHINE_NAME = ${datafromreq?.MACHINE_NAME ? `'${datafromreq?.MACHINE_NAME}'` : null},
  --DRIVING_VERIFICATION = ${datafromreq?.DRIVING_VERIFICATION ? `'${datafromreq?.DRIVING_VERIFICATION}'` : null},
  --PASSPORT_VERIFICATION = ${datafromreq?.PASSPORT_VERIFICATION ? `'${datafromreq?.PASSPORT_VERIFICATION}'` : null},
  --AADHAR_VERIFICATION = ${datafromreq?.AADHAR_VERIFICATION ? `'${datafromreq?.AADHAR_VERIFICATION}'` : null},
  --PAN_VERIFICATION = ${datafromreq?.PAN_VERIFICATION ? `'${datafromreq?.PAN_VERIFICATION}'` : null},
  pre_Exp = ${datafromreq?.pre_Exp ? `'${datafromreq?.pre_Exp}'` : null},
  USR_NAME = ${datafromreq?.USR_NAME ? `'${datafromreq?.USR_NAME}'` : null},
  CREATED_BY = ${datafromreq?.CREATED_BY ? `'${datafromreq?.CREATED_BY}'` : null},
  EMPFIRSTNAME = ${datafromreq?.EMPFIRSTNAME ? `'${datafromreq?.EMPFIRSTNAME}'` : null},
  EMPLASTNAME = ${datafromreq?.EMPLASTNAME ? `'${datafromreq?.EMPLASTNAME}'` : null},
  GENDER = ${datafromreq?.GENDER ? `'${datafromreq?.GENDER}'` : null},
  EMPLOYEETYPE = ${datafromreq?.EMPLOYEETYPE ? `'${datafromreq?.EMPLOYEETYPE}'` : null},
  Sal_Region = ${datafromreq?.Sal_Region ? `'${datafromreq?.Sal_Region}'` : null},
  LOCATION = ${datafromreq?.LOCATION ? `'${datafromreq?.LOCATION}'` : null},
  EMPLOYEEDESIGNATION = ${datafromreq?.EMPLOYEEDESIGNATION ? `'${datafromreq?.EMPLOYEEDESIGNATION}'` : null},
  SECTION = ${datafromreq?.SECTION ? `'${datafromreq?.SECTION}'` : null},
  DIVISION = ${datafromreq?.DIVISION ? `'${datafromreq?.DIVISION}'` : null},
  PAY_CODE = ${datafromreq?.PAY_CODE ? `'${datafromreq?.PAY_CODE}'` : null},
  Interview_Date = ${datafromreq?.Interview_Date ? `'${datafromreq?.Interview_Date}'` : null},
  EMP_STATUS = ${datafromreq?.EMP_STATUS ? `'${datafromreq?.EMP_STATUS}'` : null},
  CURRENTJOINDATE = ${datafromreq?.CURRENTJOINDATE ? `'${datafromreq?.CURRENTJOINDATE}'` : null},
  Induction_Done = ${datafromreq?.Induction_Done ? `'${datafromreq?.Induction_Done}'` : null},
  PROBATIONPERIOD = ${datafromreq?.PROBATIONPERIOD ? `'${datafromreq?.PROBATIONPERIOD}'` : null},
  Prob_period = ${datafromreq?.Prob_period ? `'${datafromreq?.Prob_period}'` : null},
  CORPORATEMAILID = ${datafromreq?.CORPORATEMAILID ? `'${datafromreq?.CORPORATEMAILID}'` : null},
  SKILLS = ${datafromreq?.SKILLS ? `'${datafromreq?.SKILLS}'` : null},
  MOBILE_NO = ${datafromreq?.MOBILE_NO ? `'${datafromreq?.MOBILE_NO}'` : null},
  PANNO = ${datafromreq?.PANNO ? `'${datafromreq?.PANNO}'` : null},
  UID_NO = ${datafromreq?.UID_NO ? `'${datafromreq?.UID_NO}'` : null},
  PASSPORTNO = ${datafromreq?.PASSPORTNO ? `'${datafromreq?.PASSPORTNO}'` : null},
  PASSEXPIRYDATE = ${datafromreq?.PASSEXPIRYDATE ? `'${datafromreq?.PASSEXPIRYDATE}'` : null},
  DRIVINGLIC_ISSUEPALACE = ${datafromreq?.DRIVINGLIC_ISSUEPALACE ? `'${datafromreq?.DRIVINGLIC_ISSUEPALACE}'` : null},
  DRIVINGLIC_ISSUEDATE = ${datafromreq?.DRIVINGLIC_ISSUEDATE ? `'${datafromreq?.DRIVINGLIC_ISSUEDATE}'` : null},
  Rec_Date = ${datafromreq?.Rec_Date ? `'${datafromreq?.Rec_Date}'` : null},
  FATHERNAME = ${datafromreq?.FATHERNAME ? `'${datafromreq?.FATHERNAME}'` : null},
  Father_Mob = ${datafromreq?.Father_Mob ? `'${datafromreq?.Father_Mob}'` : null},
  DOB = ${datafromreq?.DOB ? `'${datafromreq?.DOB}'` : null},
  BLOODGROUP = ${datafromreq?.BLOODGROUP ? `'${datafromreq?.BLOODGROUP}'` : null},
  RELCODE = ${datafromreq?.RELCODE ? `'${datafromreq?.RELCODE}'` : null},
  MOTHERNAME = ${datafromreq?.MOTHERNAME ? `'${datafromreq?.MOTHERNAME}'` : null},
  SPOUSENAME = ${datafromreq?.SPOUSENAME ? `'${datafromreq?.SPOUSENAME}'` : null},
  DOM = ${datafromreq?.DOM ? `'${datafromreq?.DOM}'` : null},
  ALTERNET_MAIL = ${datafromreq?.ALTERNET_MAIL ? `'${datafromreq?.ALTERNET_MAIL}'` : null},
  EMPHEIGHT = ${datafromreq?.EMPHEIGHT ? `'${datafromreq?.EMPHEIGHT}'` : null},
  EMPWEIGHT = ${datafromreq?.EMPWEIGHT ? `'${datafromreq?.EMPWEIGHT}'` : null},
  Mother_Mob = ${datafromreq?.Mother_Mob ? `'${datafromreq?.Mother_Mob}'` : null},
  PERMANENTADDRESS1 = ${datafromreq?.PERMANENTADDRESS1 ? `'${datafromreq?.PERMANENTADDRESS1}'` : null},
  PCITY = ${datafromreq?.PCITY ? `'${datafromreq?.PCITY}'` : null},
  PPINCODE = ${datafromreq?.PPINCODE ? `'${datafromreq?.PPINCODE}'` : null},
  MOBILENO = ${datafromreq?.MOBILENO ? `'${datafromreq?.MOBILENO}'` : null},
  landline_no = ${datafromreq?.landline_no ? `'${datafromreq?.landline_no}'` : null},
  PSTATE = ${datafromreq?.PSTATE ? `'${datafromreq?.PSTATE}'` : null},
  CURRENTADDRESS1 = ${datafromreq?.CURRENTADDRESS1 ? `'${datafromreq?.CURRENTADDRESS1}'` : null},
  CCITY = ${datafromreq?.CCITY ? `'${datafromreq?.CCITY}'` : null},
  CPINCODE = ${datafromreq?.CPINCODE ? `'${datafromreq?.CPINCODE}'` : null},
  CSTATE = ${datafromreq?.CSTATE ? `'${datafromreq?.CSTATE}'` : null},
  NOTICEPERIOD = ${datafromreq?.NOTICEPERIOD ? `'${datafromreq?.NOTICEPERIOD}'` : null},
  ExitInterview_Done = ${datafromreq?.ExitInterview_Done ? `'${datafromreq?.ExitInterview_Done}'` : null},
  LASTWOR_DATE = ${datafromreq?.LASTWOR_DATE ? `'${datafromreq?.LASTWOR_DATE}'` : null},
  PREVIOUSCOMPANYNAME = ${datafromreq?.PREVIOUSCOMPANYNAME ? `'${datafromreq?.PREVIOUSCOMPANYNAME}'` : null},
  BASICQUALIFICATION = ${datafromreq?.BASICQUALIFICATION ? `'${datafromreq?.BASICQUALIFICATION}'` : null},
  CNATIONALITY = ${datafromreq?.CNATIONALITY ? `'${datafromreq?.CNATIONALITY}'` : null},
  PRECOMPCITY = ${datafromreq?.PRECOMPCITY ? `'${datafromreq?.PRECOMPCITY}'` : null},
  PREDESIGNATION = ${datafromreq?.PREDESIGNATION ? `'${datafromreq?.PREDESIGNATION}'` : null},
  EmpType = ${datafromreq?.EmpType ? `'${datafromreq?.EmpType}'` : null},
  JOINING_TYPE = ${datafromreq?.JOINING_TYPE ? `'${datafromreq?.JOINING_TYPE}'` : null},
  GRADE = ${datafromreq?.GRADE ? `'${datafromreq?.GRADE}'` : null},
  Acnt_Loc = ${datafromreq?.Acnt_Loc ? `'${datafromreq?.Acnt_Loc}'` : null},
  APPLICATION_ID = ${datafromreq?.APPLICATION_ID ? `'${datafromreq?.APPLICATION_ID}'` : null},
  APPROVED_AUTHO = ${datafromreq?.APPROVED_AUTHO ? `'${datafromreq?.APPROVED_AUTHO}'` : null},
  BIOMETRIC_ID = ${datafromreq?.BIOMETRIC_ID ? `'${datafromreq?.BIOMETRIC_ID}'` : null},
  LEVEL = ${datafromreq?.LEVEL ? `'${datafromreq?.LEVEL}'` : null},
  UNIT = ${datafromreq?.UNIT ? `'${datafromreq?.UNIT}'` : null},
  ADUSER_NAME = ${datafromreq?.ADUSER_NAME ? `'${datafromreq?.ADUSER_NAME}'` : null},
  EXT_NO = ${datafromreq?.EXT_NO ? `'${datafromreq?.EXT_NO}'` : null},
  PROPOSEDRETIRE_DATE = ${datafromreq?.PROPOSEDRETIRE_DATE ? `'${datafromreq?.PROPOSEDRETIRE_DATE}'` : null},
  LASTMODI_BY = ${datafromreq?.LASTMODI_BY ? `'${datafromreq?.LASTMODI_BY}'` : null},
  LASTMODI_ON = ${datafromreq?.LASTMODI_ON ? `'${datafromreq?.LASTMODI_ON}'` : null},
  CREATED_ON = ${datafromreq?.CREATED_ON ? `'${datafromreq?.CREATED_ON}'` : null},
  ROLE = ${datafromreq?.ROLE ? `'${datafromreq?.ROLE}'` : null},
  IEMI = ${datafromreq?.IEMI ? `'${datafromreq?.IEMI}'` : null},
  Android_ID = ${datafromreq?.Android_ID ? `'${datafromreq?.Android_ID}'` : null},
  mPunch = ${datafromreq?.mPunch ? `'${datafromreq?.mPunch}'` : null},
  mMispunch = ${datafromreq?.mMispunch ? `'${datafromreq?.mMispunch}'` : null},
  mApprove = ${datafromreq?.mApprove ? `'${datafromreq?.mApprove}'` : null},
  mLeave = ${datafromreq?.mLeave ? `'${datafromreq?.mLeave}'` : null},
  mCalender = ${datafromreq?.mCalender ? `'${datafromreq?.mCalender}'` : null},
  MSPN_Id = ${datafromreq?.MSPN_Id ? `'${datafromreq?.MSPN_Id}'` : null},
  IsMSPN = ${datafromreq?.IsMSPN ? `'${datafromreq?.IsMSPN}'` : null},
  MSPN_DTL = ${datafromreq?.MSPN_DTL ? `'${datafromreq?.MSPN_DTL}'` : null},
  Relaxation_Type = ${datafromreq?.Relaxation_Type ? `'${datafromreq?.Relaxation_Type}'` : null},
  ShiftIn_Relaxation = ${datafromreq?.ShiftIn_Relaxation ? `'${datafromreq?.ShiftIn_Relaxation}'` : null},
  ShiftOut_Relaxation = ${datafromreq?.ShiftOut_Relaxation ? `'${datafromreq?.ShiftOut_Relaxation}'` : null},
  Cumulative_Relaxation = ${datafromreq?.Cumulative_Relaxation ? `'${datafromreq?.Cumulative_Relaxation}'` : null},
  empcode2 = ${datafromreq?.empcode2 ? `'${datafromreq?.empcode2}'` : null},
  empcode3 = ${datafromreq?.empcode3 ? `'${datafromreq?.empcode3}'` : null},
  empcode4 = ${datafromreq?.empcode4 ? `'${datafromreq?.empcode4}'` : null},
  Reporting_1 = ${datafromreq?.Reporting_1 ? `'${datafromreq?.Reporting_1}'` : null},
  Reporting_2 = ${datafromreq?.Reporting_2 ? `'${datafromreq?.Reporting_2}'` : null},
  Reporting_3 = ${datafromreq?.Reporting_3 ? `'${datafromreq?.Reporting_3}'` : null}
  where 
  SRNO = ${req.body.tran_id}
  `
    let query2 = `UPDATE NEW_JOINING
SET
    SKILLS = SC.SKILLS,
    NAME = SC.EMPFIRSTNAME,
    MOB_NO = SC.MOBILE_NO,
    WHATSAPP_NO = SC.MOBILENO,
    ADDRESS = SC.CURRENTADDRESS1,
    PINCODE = SC.PPINCODE,
    STATE = SC.pState,
    HIGH_QUAL = SC.BASICQUALIFICATION,
    FATHERS_NAME = SC.FATHERNAME,
    GENDER = SC.GENDER,
    MOTHERS_NAME = SC.MOTHERNAME,
    LOC_CODE = SC.LOCATION,
    DESIGNATION = SC.EMPLOYEEDESIGNATION,
    EMAIL = SC.ALTERNET_MAIL,
    AADHAR_NO = SC.UID_NO,
    DOB = SC.DOB,
    DOM = SC.DOM
FROM SHORtlisted_candidate SC
WHERE NEW_JOINING.TRAN_ID = SC.SRNO
  AND SC.SRNO = ${req.body.tran_id};`;

    const sequelize = await dbname(req.headers.compcode);
    console.log(req.files, "dataArray")
    if (req.files.length > 0) {
      const EMP_DOCS_data = await uploadImagesTravel(
        req.files,
        req.headers?.compcode?.split("-")[0],
        req.body.tran_id,
      );
      const arr = {
        "ProfileImage": 1,
        "AadharCard": 3,
        "UpdateCV": 2,
        "PANCard": 4,
        "SalarySlip": 5,
        "ExperienceLetter": 6
      };


      const values = EMP_DOCS_data.forEach(async (doc) => {
        // Find the index of doc.fieldname in the arr array
        const srnoIndex = arr[doc.fieldname]; // Adding 1 to match the SRNO format

        if (srnoIndex > 0) { // Ensure the fieldname exists in the array
          const update = `
            UPDATE DOC_UPLOAD 
            SET export_type = 33 
            WHERE TRAN_ID = '${req.body.tran_id}' 
            AND SRNO = '${srnoIndex}' 
            AND doc_type = 'NCR'
          `;

          const insertQuery = `
            INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path,file_name, User_Name, Upload_Date, Export_type)
            VALUES (
              'NCR', 
              '${req.body.tran_id}', 
              ${srnoIndex}, 
              '${doc.DOC_PATH}', 
              '${doc.DOC_NAME}', 
              '${datafromreq?.EMPFIRSTNAME}', 
              CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), 
              '1'
            )
          `;

          await sequelize.query(update);
          await sequelize.query(insertQuery);
        } else {
          console.error(`Fieldname ${doc.fieldname} not found in arr.`);
        }
      });

    }




    const Tbl_Type = {
      EmpExperience: 1,
      EmpEdu: 2,
      EmpItSkill: 3,
      EmpLang: 4,
      References: 5,
      EmpNominee: 6
    }
    let dataWithMeta = [];
    const createdBy = req.body.username;
    const tranId = req.body.tran_id;
    Object.keys(datafromreq).forEach((key, index) => {
      // Check if the value is an array
      if (Tbl_Type[key]) {
        const tblType = Tbl_Type[key];
        datafromreq[key].forEach((item, i) => {
          if (Object.keys(item).length) { // Only process non-empty objects
            dataWithMeta.push({
              ...item,
              Tbl_Type: tblType,
              Created_by: createdBy,
              SNo: i + 1,
              SRNO: tranId
            });
          }
        });
      }
    });
    const t = await sequelize.transaction();
    try {
      const InterviewSideTables = _InterviewSideTables(sequelize, DataTypes);
      console.log(dataWithMeta);
      await InterviewSideTables.destroy({
        where: {
          SRNO: tranId
        }
      }, { transaction: t });
      await InterviewSideTables.bulkCreate(
        dataWithMeta,
        { transaction: t });
      await sequelize.query(query, { transaction: t });
      await sequelize.query(query2, { transaction: t });
      await t.commit();
      await sequelize.close();
    } catch (e) {
      await t.rollback();
      res.send({ Message: 'Data is not updated', icon: 'error', title: 'error' });
    }

    res.send({ Message: 'data Updated successfully', icon: 'success', title: 'Success' });
  } catch (e) {
    console.log(e);
    res.send({ Message: 'Error Updating data', icon: 'error', title: 'Error' });
  }
}
exports.allemployee = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const EmpMst = _Employeemaster(sequelize, DataTypes);
    const data = await EmpMst.findAll({
      attributes: [
        ["EMPCODE", "value"],
        [
          sequelize.literal("EMPCODE +' ' + EMPFIRSTNAME + ' ' + EMPLASTNAME "),
          "label",
        ],
      ],
    });
    if (!data) {
      return res.status(500).send({ success: false, message: "No data found" });
    }

    return res.status(200).send({ success: true, data: data });
  } catch (e) {
    console.log(e);
  } finally {
    await sequelize.close();
    console.log("connection closed");
  }
};
exports.update1interview = async function (req, res) {
  try {
    const TRAN_ID = req.body.TRAN_ID;
    const INTR1DATE = req.body.INTR1DATE;
    const INTR1BY = req.body.INTR1BY;
    const INTR1TIME = req.body.INTR1TIME;
    if (TRAN_ID == "" || TRAN_ID == undefined || TRAN_ID == null) {
      return res.status(500).send({
        status: false,
        Message: "TRAN_ID is mandatory",
      });
    }
    if (INTR1BY == "" || INTR1BY == undefined || INTR1BY == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR1BY is mandatory",
      });
    }
    if (INTR1DATE == "" || INTR1DATE == undefined || INTR1DATE == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR1DATE is mandatory",
      });
    }
    if (INTR1TIME == "" || INTR1TIME == undefined || INTR1TIME == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR1TIME is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);
    await sequelize.query(`update new_joining set  INT_STATUS='3',INTR1DATE='${INTR1DATE}',INTR1BY='${INTR1BY}',INTR1TIME='${INTR1TIME}' where TRAN_ID='${TRAN_ID}' `);
    await sequelize.query(`update SHORTLISTED_CANDIDATE set  Interview_Date='${INTR1DATE}'  where srno='${TRAN_ID}' `);
    await sequelize.close();
    res.status(200).json({ message: 'Interview updated' });

  } catch (e) { console.log(e); }
}
exports.update2interview = async function (req, res) {
  try {
    const TRAN_ID = req.body.TRAN_ID;
    const INTR2DATE = req.body.INTR2DATE;
    const INTR2BY = req.body.INTR2BY;
    const INTR2TIME = req.body.INTR2TIME;
    if (TRAN_ID == "" || TRAN_ID == undefined || TRAN_ID == null) {
      return res.status(500).send({
        status: false,
        Message: "TRAN_ID is mandatory",
      });
    }
    if (INTR2BY == "" || INTR2BY == undefined || INTR2BY == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR2BY is mandatory",
      });
    }
    if (INTR2DATE == "" || INTR2DATE == undefined || INTR2DATE == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR2DATE is mandatory",
      });
    }
    if (INTR2TIME == "" || INTR2TIME == undefined || INTR2TIME == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR2TIME is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);

    await sequelize.query(`update new_joining set INT_STATUS='3',INTR2DATE='${INTR2DATE}',INTR2BY='${INTR2BY}',INTR2TIME='${INTR2TIME}' where TRAN_ID='${TRAN_ID}' `);
    await sequelize.close();

    res.status(200).json({ message: 'Interview updated' });
  } catch (e) { console.log(e); }
}
exports.update3interview = async function (req, res) {
  try {
    const TRAN_ID = req.body.TRAN_ID;
    const INTR3DATE = req.body.INTR3DATE;
    const INTR3BY = req.body.INTR3BY;
    const INTR3TIME = req.body.INTR3TIME;
    if (TRAN_ID == "" || TRAN_ID == undefined || TRAN_ID == null) {
      return res.status(500).send({
        status: false,
        Message: "TRAN_ID is mandatory",
      });
    }
    if (INTR3BY == "" || INTR3BY == undefined || INTR3BY == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR3BY is mandatory",
      });
    }
    if (INTR3DATE == "" || INTR3DATE == undefined || INTR3DATE == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR3DATE is mandatory",
      });
    }
    if (INTR3TIME == "" || INTR3TIME == undefined || INTR3TIME == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR3TIME is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);

    await sequelize.query(`update new_joining set INT_STATUS='3',INTR3DATE='${INTR3DATE}',INTR3BY='${INTR3BY}',INTR3TIME='${INTR3TIME}' where TRAN_ID='${TRAN_ID}' `);
    await sequelize.close();
    res.status(200).json({ message: 'Interview updated' });
  } catch (e) { console.log(e); }
}
exports.update4interview = async function (req, res) {
  try {
    const TRAN_ID = req.body.TRAN_ID;
    const INTR4DATE = req.body.INTR4DATE;
    const INTR4BY = req.body.INTR4BY;
    const INTR4TIME = req.body.INTR4TIME;
    if (TRAN_ID == "" || TRAN_ID == undefined || TRAN_ID == null) {
      return res.status(500).send({
        status: false,
        Message: "TRAN_ID is mandatory",
      });
    }
    if (INTR4BY == "" || INTR4BY == undefined || INTR4BY == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR4BY is mandatory",
      });
    }
    if (INTR4DATE == "" || INTR4DATE == undefined || INTR4DATE == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR4DATE is mandatory",
      });
    }
    if (INTR4TIME == "" || INTR4TIME == undefined || INTR4TIME == null) {
      return res.status(500).send({
        status: false,
        Message: "INTR4TIME is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);

    await sequelize.query(`update new_joining set INT_STATUS='3',INTR4DATE='${INTR4DATE}',INTR4BY='${INTR4BY}',INTR4TIME='${INTR4TIME}' where TRAN_ID='${TRAN_ID}' `);
    await sequelize.close();
    res.status(200).json({ message: 'Interview updated' });
  } catch (e) { console.log(e); }
}
exports.Schedule1interview = async function (req, res) {
  try {
    const TRAN_ID = req.body.TRAN_ID;
    if (TRAN_ID == "" || TRAN_ID == undefined || TRAN_ID == null) {
      return res.status(500).send({
        status: false,
        Message: "TRAN_ID is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);
    const Candidate = await sequelize.query(`select *,(select top 1 misc_name from misc_mst where misc_Code = NEW_JOINING.loc_code and misc_type = 85) as locationname,
      FORMAT(INTR1DATE, 'dd-MMM-yyyy') AS FormattedDate,
    STUFF(RIGHT(CONVERT(VARCHAR, CAST(INTR1TIME AS TIME), 100), 7), 6, 0, ' ') AS FormattedTime 
      from NEW_JOINING where TRAN_ID='${TRAN_ID}'`)
    const INTR1DATE = Candidate[0][0]?.FormattedDate;
    const INTR1TIME = Candidate[0][0]?.FormattedTime;
    const INTR1BY = Candidate[0][0]?.INTR1BY;
    const interviewer = await sequelize.query(`select CORPORATEMAILID,MOBILE_NO,EMPFIRSTNAME,EMPLASTNAME,EMPLOYEEDESIGNATION from EMPLOYEEMASTER where EMPCODE='${INTR1BY}'`)
    const companyResult = await sequelize.query(`SELECT comp_name FROM comp_mst`);
    const companyName = companyResult[0][0]?.comp_name;
    const html = `
    <html>
      <body>
        <p>Dear ${Candidate[0][0]?.NAME} ,</p>
        <p>We are excited to invite you to an interview for the position of ${Candidate[0][0]?.DESIGNATION} at ${Candidate[0][0].locationname}.</p>
        <p>The interview details are as follows:</p>
        <ul>
          <li>Date: ${INTR1DATE}</li>
          <li>Time: ${INTR1TIME}</li>
        </ul>
       
        <p>If you have any questions or need to reschedule, please contact us as soon as possible.</p>
        <p>We look forward to meeting you!</p>
       
      </body>
    </html>
  `;
    const message = `
      Dear {{1}},

      We are excited to invite you to an interview for the position of {{2}} at {{3}}.

      The interview details are as follows:
      - Date: {{4}}
      - Time: {{5}}

      If you have any questions or need to reschedule, please contact us as soon as possible.

      We look forward to meeting you!

      Regards
      {{6}}`;

    sendmail(Candidate[0][0]?.EMAIL, `INTERVIEW SCHEDULE 1`, html);
    await SendWhatsAppMessgae(req.headers.compcode,
      Candidate[0][0].MOB_NO,
      "int_1_candidate_msg",
      [
        { type: "text", text: Candidate[0][0].NAME },
        { type: "text", text: Candidate[0][0].DESIGNATION },
        { type: "text", text: Candidate[0][0].locationname },
        { type: "text", text: INTR1DATE },
        {
          type: "text",
          text: INTR1TIME
        },
        { type: "text", text: companyName },
      ]
    );


    const html2 = `
    <html>
      <body>
        <p>Dear ${interviewer[0][0]?.EMPFIRSTNAME} ${interviewer[0][0]?.EMPLASTNAME},</p>
        <p>We would like to confirm your upcoming interview schedule as an interviewer for the position of ${Candidate[0][0]?.DESIGNATION} at ${Candidate[0][0].locationname}.</p>
        <p>The interview details are as follows:</p>
        <ul>
          <li>Date: ${INTR1DATE}</li>
          <li>Time: ${INTR1TIME}</li>
        </ul>
        <p>Please make sure to review the candidate's resume and prepare any questions or evaluations you may have for the interview.</p>
        <p>If you have any questions or need to reschedule, please don't hesitate to contact us as soon as possible.</p>
        <p>We appreciate your time and effort in assisting with this interview process.</p>
        <p>For more candidate details <a href="https://erp.autovyn.com/autovyn/payroll/interview/zoom">Click Here</a></p>
        <p>Best regards,</p>
        <p>${companyName}</p>
         
      </body>
    </html>
  `;
    sendmail(interviewer[0][0]?.CORPORATEMAILID, `INTERVIEW SCHEDULE 1`, html2);

    const queryParams = {
      TRAN_ID: TRAN_ID,
      comp_code: req.headers.compcode
    };
    const encodedParams = btoa(JSON.stringify(queryParams));
    const url = `https://erp.autovyn.com/autovyn/payroll/interview/zoom?v1=${encodedParams}`;
    await SendWhatsAppMessgae(req.headers.compcode,
      interviewer[0][0]?.MOBILE_NO,
      "whatsup__to_interviewer",
      [
        { type: "text", text: `${interviewer[0][0]?.EMPFIRSTNAME} ${interviewer[0][0]?.EMPLASTNAME}` },
        { type: "text", text: Candidate[0][0].DESIGNATION },
        { type: "text", text: Candidate[0][0].locationname },
        { type: "text", text: INTR1DATE },
        { type: "text", text: INTR1TIME },
        { type: "text", text: url },
        { type: "text", text: companyName },
      ]
    );

    res.status(200).json({ icon: 'success', title: 'Success', text: 'Interview updated' });
  } catch (e) {
    console.log(e);
    res.status(500).send({ Message: 'contact to mohit api me dikkat h.' });

  }
}
exports.Schedule2interview = async function (req, res) {
  try {
    const TRAN_ID = req.body.TRAN_ID;
    if (TRAN_ID == "" || TRAN_ID == undefined || TRAN_ID == null) {
      return res.status(500).send({
        status: false,
        Message: "TRAN_ID is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);

    const Candidate = await sequelize.query(`select *,(select top 1 misc_name from misc_mst where misc_Code = NEW_JOINING.loc_code and misc_type = 85) as locationname,
      FORMAT(INTR1DATE, 'dd-MMM-yyyy') AS FormattedDate,
    STUFF(RIGHT(CONVERT(VARCHAR, CAST(INTR1TIME AS TIME), 100), 7), 6, 0, ' ') AS FormattedTime  from NEW_JOINING where TRAN_ID='${TRAN_ID}'`)

    const INTR2DATE = Candidate[0][0]?.FormattedDate;
    const INTR2TIME = Candidate[0][0]?.FormattedTime;
    const INTR2BY = Candidate[0][0]?.INTR2BY;
    const companyResult = await sequelize.query(`SELECT comp_name FROM comp_mst`);
    const companyName = companyResult[0][0]?.comp_name;
    const interviewer = await sequelize.query(`select CORPORATEMAILID,MOBILE_NO,EMPFIRSTNAME,EMPLASTNAME,EMPLOYEEDESIGNATION from EMPLOYEEMASTER where EMPCODE='${INTR2BY}'`)

    var html = `
    <html>
      <body>
        <p>Dear ${Candidate[0][0]?.NAME} ,</p>
        <p>We are excited to invite you to an interview for the position of ${Candidate[0][0]?.DESIGNATION} at ${Candidate[0][0].locationname}.</p>
        <p>The interview details are as follows:</p>
        <ul>
          <li>Date: ${INTR2DATE}</li>
          <li>Time: ${INTR2TIME}</li>
        </ul>
       
        <p>If you have any questions or need to reschedule, please contact us as soon as possible.</p>
        <p>We look forward to meeting you!</p>
         
      </body>
    </html>
  `;
    sendmail(Candidate[0][0]?.EMAIL, `INTERVIEW SCHEDULE 2`, html);
    await SendWhatsAppMessgae(req.headers.compcode,
      Candidate[0][0].MOB_NO,
      "int_1_candidate_msg",
      [
        { type: "text", text: Candidate[0][0].NAME },
        { type: "text", text: Candidate[0][0].DESIGNATION },
        { type: "text", text: Candidate[0][0].locationname },
        { type: "text", text: INTR2DATE },
        {
          type: "text",
          text: INTR2TIME
        },
        { type: "text", text: companyName },
      ]
    );
    var html2 = `
    <html>
      <body>
        <p>Dear ${interviewer[0][0]?.EMPFIRSTNAME} ${interviewer[0][0]?.EMPLASTNAME},</p>
        <p>We would like to confirm your upcoming interview schedule as an interviewer for the position of ${Candidate[0][0]?.DESIGNATION} at ${Candidate[0][0].locationname}.</p>
        <p>The interview details are as follows:</p>
        <ul>
          <li>Date: ${INTR2DATE}</li>
          <li>Time: ${INTR2TIME}</li>
        </ul>
        <p>Please make sure to review the candidate's resume and prepare any questions or evaluations you may have for the interview.</p>
        <p>If you have any questions or need to reschedule, please don't hesitate to contact us as soon as possible.</p>
        <p>We appreciate your time and effort in assisting with this interview process.</p>
        <p>For more candidate details <a href="https://erp.autovyn.com/autovyn/payroll/interview/zoom">Click Here</a></p>
        <p>Best regards,</p>
        <p>${companyName}</p>
         
      </body>
    </html>
  `;

    sendmail(interviewer[0][0]?.CORPORATEMAILID, `INTERVIEW SCHEDULE 2`, html2);

    const queryParams = {
      TRAN_ID: TRAN_ID,
      comp_code: req.headers.compcode
    };


    const encodedParams = btoa(JSON.stringify(queryParams));
    const url = `https://erp.autovyn.com/autovyn/payroll/interview/zoom?v1=${encodedParams}`;
    await SendWhatsAppMessgae(req.headers.compcode,
      interviewer[0][0]?.MOBILE_NO,
      "whatsup__to_interviewer",
      [
        { type: "text", text: `${interviewer[0][0]?.EMPFIRSTNAME} ${interviewer[0][0]?.EMPLASTNAME}` },
        { type: "text", text: Candidate[0][0].DESIGNATION },
        { type: "text", text: Candidate[0][0].locationname },
        { type: "text", text: INTR2DATE },
        { type: "text", text: INTR2TIME },
        { type: "text", text: url },
        { type: "text", text: companyName },
      ]
    );
    res.status(200).json({ icon: 'success', title: 'Success', text: 'Interview updated' });

  } catch (e) {
    console.log(e);
    res.status(500).send({ Message: 'contact to mohit api me dikkat h.' });
  }
}
exports.Schedule3interview = async function (req, res) {
  try {

    const TRAN_ID = req.body.TRAN_ID;
    if (TRAN_ID == "" || TRAN_ID == undefined || TRAN_ID == null) {
      return res.status(500).send({
        status: false,
        Message: "TRAN_ID is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);

    const Candidate = await sequelize.query(`select *,(select top 1 misc_name from misc_mst where misc_Code = NEW_JOINING.loc_code and misc_type = 85) as locationname,
      FORMAT(INTR1DATE, 'dd-MMM-yyyy') AS FormattedDate,
    STUFF(RIGHT(CONVERT(VARCHAR, CAST(INTR1TIME AS TIME), 100), 7), 6, 0, ' ') AS FormattedTime  from NEW_JOINING where TRAN_ID='${TRAN_ID}'`)

    const INTR3DATE = Candidate[0][0]?.FormattedDate;
    const INTR3TIME = Candidate[0][0]?.FormattedTime;
    const INTR3BY = Candidate[0][0]?.INTR3BY;
    const interviewer = await sequelize.query(`select  CORPORATEMAILID,MOBILE_NO,EMPFIRSTNAME,EMPLASTNAME,EMPLOYEEDESIGNATION from EMPLOYEEMASTER where EMPCODE='${INTR3BY}'`)
    const companyResult = await sequelize.query(`SELECT comp_name FROM comp_mst`);
    const companyName = companyResult[0][0]?.comp_name;
    var html = `
    <html>
      <body>
        <p>Dear ${Candidate[0][0]?.NAME} ,</p>
        <p>We are excited to invite you to an interview for the position of ${Candidate[0][0]?.DESIGNATION} at ${Candidate[0][0].locationname}.</p>
        <p>The interview details are as follows:</p>
        <ul>
          <li>Date: ${INTR3DATE}</li>
          <li>Time: ${INTR3TIME}</li>
        </ul>
       
        <p>If you have any questions or need to reschedule, please contact us as soon as possible.</p>
        <p>We look forward to meeting you!</p>
         
      </body>
    </html>
  `;


    sendmail(Candidate[0][0]?.EMAIL, `INTERVIEW SCHEDULE 3`, html);
    await SendWhatsAppMessgae(req.headers.compcode,
      Candidate[0][0].MOB_NO,
      "int_1_candidate_msg",
      [
        { type: "text", text: Candidate[0][0].NAME },
        { type: "text", text: Candidate[0][0].DESIGNATION },
        { type: "text", text: Candidate[0][0].locationname },
        { type: "text", text: INTR3DATE },
        {
          type: "text",
          text: INTR3TIME
        },
        { type: "text", text: companyName },
      ]
    );
    var html2 = `
    <html>
      <body>
        <p>Dear ${interviewer[0][0]?.EMPFIRSTNAME} ${interviewer[0][0]?.EMPLASTNAME},</p>
        <p>We would like to confirm your upcoming interview schedule as an interviewer for the position of ${Candidate[0][0]?.DESIGNATION} at ${Candidate[0][0].locationname}.</p>
        <p>The interview details are as follows:</p>
        <ul>
          <li>Date: ${INTR3DATE}</li>
          <li>Time: ${INTR3TIME}</li>
        </ul>
        <p>Please make sure to review the candidate's resume and prepare any questions or evaluations you may have for the interview.</p>
        <p>If you have any questions or need to reschedule, please don't hesitate to contact us as soon as possible.</p>
        <p>We appreciate your time and effort in assisting with this interview process.</p>
        <p>For more candidate details <a href="https://erp.autovyn.com/autovyn/payroll/interview/zoom">Click Here</a></p>
        <p>Best regards,</p>
        <p>${companyName}</p>
         
      </body>
    </html>
  `;
    sendmail(interviewer[0][0]?.CORPORATEMAILID, `INTERVIEW SCHEDULE 3`, html2);


    const queryParams = {
      TRAN_ID: TRAN_ID,
      comp_code: req.headers.compcode
    };
    const encodedParams = btoa(JSON.stringify(queryParams));
    const url = `https://erp.autovyn.com/autovyn/payroll/interview/zoom?v1=${encodedParams}`;
    await SendWhatsAppMessgae(req.headers.compcode,
      interviewer[0][0]?.MOBILE_NO,
      "whatsup__to_interviewer",
      [
        { type: "text", text: `${interviewer[0][0]?.EMPFIRSTNAME} ${interviewer[0][0]?.EMPLASTNAME}` },
        { type: "text", text: Candidate[0][0].DESIGNATION },
        { type: "text", text: Candidate[0][0].locationname },
        { type: "text", text: INTR3DATE },
        { type: "text", text: INTR3TIME },
        { type: "text", text: url },
        { type: "text", text: companyName },
      ]
    );
    res.status(200).json({ icon: 'success', title: 'Success', text: 'Interview updated' });

  } catch (e) {
    console.log(e);
    res.status(500).send({ Message: 'contact to mohit api me dikkat h.' });

  }
}


exports.Schedule4interview = async function (req, res) {
  try {
    const TRAN_ID = req.body.TRAN_ID;
    if (TRAN_ID == "" || TRAN_ID == undefined || TRAN_ID == null) {
      return res.status(500).send({
        status: false,
        Message: "TRAN_ID is mandatory",
      });
    }
    const sequelize = await dbname(req.headers.compcode);

    const Candidate = await sequelize.query(`select *,(select top 1 misc_name from misc_mst where misc_Code = NEW_JOINING.loc_code and misc_type = 85) as locationname,
    FORMAT(INTR1DATE, 'dd-MMM-yyyy') AS FormattedDate,
    STUFF(RIGHT(CONVERT(VARCHAR, CAST(INTR1TIME AS TIME), 100), 7), 6, 0, ' ') AS FormattedTime  from NEW_JOINING where TRAN_ID='${TRAN_ID}'`)

    const INTR4DATE = Candidate[0][0]?.FormattedDate;
    const INTR4TIME = Candidate[0][0]?.FormattedTime;
    const INTR4BY = Candidate[0][0]?.INTR4BY;
    const interviewer = await sequelize.query(`select  CORPORATEMAILID,MOBILE_NO,EMPFIRSTNAME,EMPLASTNAME,EMPLOYEEDESIGNATION from EMPLOYEEMASTER where EMPCODE='${INTR4BY}'`)
    const companyResult = await sequelize.query(`SELECT comp_name FROM comp_mst`);
    const companyName = companyResult[0][0]?.comp_name;
    var html = `
    <html>
      <body>
        <p>Dear ${Candidate[0][0]?.NAME} ,</p>
        <p>We are excited to invite you to an interview for the position of ${Candidate[0][0]?.DESIGNATION} at ${Candidate[0][0].locationname}.</p>
        <p>The interview details are as follows:</p>
        <ul>
          <li>Date: ${INTR4DATE}</li>
          <li>Time: ${INTR4TIME}</li>
        </ul>
       
        <p>If you have any questions or need to reschedule, please contact us as soon as possible.</p>
        <p>We look forward to meeting you!</p>
         
      </body>
    </html>
  `;

    sendmail(Candidate[0][0]?.EMAIL, `INTERVIEW SCHEDULE 4`, html);
    await SendWhatsAppMessgae(req.headers.compcode,
      Candidate[0][0].MOB_NO,
      "int_1_candidate_msg",
      [
        { type: "text", text: Candidate[0][0].NAME },
        { type: "text", text: Candidate[0][0].DESIGNATION },
        { type: "text", text: Candidate[0][0].locationname },
        { type: "text", text: INTR4DATE },
        {
          type: "text",
          text: INTR4TIME
        },
        { type: "text", text: companyName },
      ]
    );

    var html2 = `
    <html>
      <body>
        <p>Dear ${interviewer[0][0]?.EMPFIRSTNAME} ${interviewer[0][0]?.EMPLASTNAME},</p>
        <p>We would like to confirm your upcoming interview schedule as an interviewer for the position of ${Candidate[0][0]?.DESIGNATION} at ${Candidate[0][0].locationname}.</p>
        <p>The interview details are as follows:</p>
        <ul>
          <li>Date: ${INTR4DATE}</li>
          <li>Time: ${INTR4TIME}</li>
        </ul>
        <p>Please make sure to review the candidate's resume and prepare any questions or evaluations you may have for the interview.</p>
        <p>If you have any questions or need to reschedule, please don't hesitate to contact us as soon as possible.</p>
        <p>We appreciate your time and effort in assisting with this interview process.</p>
        <p>For more candidate details <a href="https://erp.autovyn.com/autovyn/payroll/interview/zoom"> Click Here</a></p>
        <p>Best regards,</p>
        <p>${companyName}</p>
         
      </body>
    </html>
  `;
    sendmail(interviewer[0][0]?.CORPORATEMAILID, `INTERVIEW SCHEDULE 4`, html2);
    const queryParams = {
      TRAN_ID: TRAN_ID,
      comp_code: req.headers.compcode
    };
    const encodedParams = btoa(JSON.stringify(queryParams));
    const url = `https://erp.autovyn.com/autovyn/payroll/interview/zoom?v1=${encodedParams}`;
    await SendWhatsAppMessgae(req.headers.compcode,
      interviewer[0][0]?.MOBILE_NO,
      "whatsup__to_interviewer",
      [
        { type: "text", text: `${interviewer[0][0]?.EMPFIRSTNAME} ${interviewer[0][0]?.EMPLASTNAME}` },
        { type: "text", text: Candidate[0][0].DESIGNATION },
        { type: "text", text: Candidate[0][0].locationname },
        { type: "text", text: INTR4DATE },
        { type: "text", text: INTR4TIME },
        { type: "text", text: url },
        { type: "text", text: companyName },
      ]
    );
    res.status(200).json({ icon: 'success', title: 'Success', text: 'Interview updated' });
  } catch (e) {
    console.log(e);
    res.status(500).send({ Message: 'contact to mohit api me dikkat h.' });

  }
}



exports.candidateresult = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const { tran_id, interviewData } = req.body;

    if (!tran_id) {
      return res.status(500).send({
        status: false,
        Message: "tran_id is mandatory",
      });
    }

    const requiredFields = ['status', 'rating', 'remark', 'salary'];
    const Candidate = await sequelize.query(`select * from NEW_JOINING where TRAN_ID='${tran_id}'`);

    const checkInterviewStatus = (status) => Candidate[0][0]?.[status] == null || Candidate[0][0]?.[status] === '';

    const interviewKeys = ['INTR1STATUS', 'INTR2STATUS', 'INTR3STATUS', 'INTR4STATUS'];
    const interviewIndex = interviewKeys.findIndex(checkInterviewStatus);

    if (interviewIndex !== -1) {
      const currentInterviewData = interviewData[interviewIndex];

      // Check if at least one object in interviewData has all required fields
      const hasAllFields = requiredFields.every(field => currentInterviewData?.hasOwnProperty(field));
      if (!hasAllFields) {
        const missingFields = requiredFields.filter(field => !currentInterviewData?.hasOwnProperty(field));
        return res.status(500).send({
          icon: 'success',
          title: 'Success',
          Message: `Interview no. ${interviewIndex + 1} Reviews are pending`,
          Missing_fields: `The following required fields are missing: ${missingFields.join(', ')}`
        });
      }

      const statusColumn = `INTR${interviewIndex + 1}STATUS`;
      const ratingColumn = `INTR${interviewIndex + 1}RATING`;
      const remarkColumn = `intr${interviewIndex + 1}remark`;
      const salaryColumn = `intr${interviewIndex + 1}salary`;

      await sequelize.query(`UPDATE NEW_JOINING SET ${statusColumn}='${currentInterviewData.status}', ${ratingColumn}='${currentInterviewData.rating}', ${remarkColumn}='${currentInterviewData.remark}', ${salaryColumn}='${currentInterviewData.salary}' WHERE tran_id=${tran_id}`);
      return res.send({ icon: 'success', title: 'Success', Message: 'Interview Review saved successfully' });
    }

    await sequelize.close();
    res.send({ icon: 'info', title: 'wait', Message: 'candidate rejected' });
  } catch (e) {
    console.log(e);
    res.status(500).send({ status: false, Message: 'An error occurred' });
  }
}

exports.PrintHeader = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(12);
  try {
    const multi_loc = req.body.multi_loc;
    if (!multi_loc) {
      return res.status(500).send({ Message: 'Multi_Loc is required' });
    }
    const company = await sequelize.query(`select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,cm.spl_rem,cm.Right_Head1,
      gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No,ck.Comp_Logo
      from comp_mst cm
	  join COMP_KEYDATA ck on ck.Comp_Code = cm.Comp_Code
	  join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
      where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
    res.status(200).send({ company: company[0] });
  }
  catch (e) {
    res.status(500).send({ Message: 'Internal Server Error' });
    console.log(e);
  }
  finally {
    await sequelize.close();
  }
};
exports.findMasters = async function (req, res) {
  let sequelize;
  try {
    sequelize = await dbname(req.headers.compcode);

    const [Sal_Region] = await sequelize.query(`SELECT CAST(misc_code as VARCHAR) AS value, misc_name AS label FROM Misc_Mst WHERE misc_type = 91`);
    const [SECTION] = await sequelize.query(`SELECT CAST(misc_code as VARCHAR) AS value, misc_name AS label FROM Misc_Mst WHERE misc_type = 81`);
    const [DIVISION] = await sequelize.query(`SELECT CAST(misc_code as VARCHAR) AS value, misc_name AS label FROM Misc_Mst WHERE misc_type = 68`);
    const [LOCATION] = await sequelize.query(`SELECT CAST(misc_code as VARCHAR) AS value, misc_name AS label FROM Misc_Mst WHERE misc_type = 85`);
    const [EMP_SHIFT] = await sequelize.query(`SELECT CAST(misc_code as VARCHAR) AS value, CONCAT(misc_name, ' - ', misc_add1, ' - ', misc_add2) AS label FROM Misc_Mst WHERE misc_type = 90`);
    const [EMPLOYEEDESIGNATION] = await sequelize.query(`select distinct(EMPLOYEEDESIGNATION) as value, EMPLOYEEDESIGNATION as label from EMPLOYEEMASTER where EMPLOYEEDESIGNATION is not null and EMPLOYEEDESIGNATION !=''`);
    const [ASSETS] = await sequelize.query(`SELECT CAST(misc_code as VARCHAR) AS value, misc_name AS label FROM Misc_Mst WHERE misc_type = 602`);
    const [CITY] = await sequelize.query(`SELECT CAST(misc_code AS VARCHAR) AS value,misc_name AS label FROM Misc_Mst WHERE misc_type = 1`);
    const [STATE] = await sequelize.query(`SELECT CAST(misc_code as VARCHAR) AS value, misc_name AS label FROM Misc_Mst WHERE misc_type = 3`);

    const data = {
      Sal_Region,
      SECTION,
      DIVISION,
      LOCATION,
      EMP_SHIFT,
      EMPLOYEEDESIGNATION,
      ASSETS,
      CITY,
      STATE
    };

    // console.log(data, "data");

    res.status(200).send({ success: true, data });
  } catch (err) {
    console.error(err);

    if (sequelize && typeof sequelize.close === 'function') {
      await sequelize.close();
    }

    res.status(500).send({ success: false, message: 'An error occurred' });
  }
};


exports.sendwhatsapp = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const tran_ids_str = req.body.tran_id; // Expecting a comma-separated string
  const tran_ids = tran_ids_str.split(',').map(id => id.trim()); // Split and trim each ID
  const messages = [];
  const backgroundTasks = [];
  try {

    // Query for candidate details for all tran_ids
    const candidatesResult = await sequelize.query(`
      SELECT TRAN_ID, NAME, DESIGNATION, LOC_CODE, MOB_NO,
        (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_Code = NEW_JOINING.LOC_CODE AND misc_type = 85) AS locationname
      FROM NEW_JOINING
      WHERE TRAN_ID IN (${tran_ids.map(id => `'${id}'`).join(',')})
    `);

    // Query for company details
    const companyResult = await sequelize.query(`SELECT comp_name FROM comp_mst`);
    const companyName = companyResult[0][0]?.comp_name;

    // Loop through each candidate and send message
    for (const candidate of candidatesResult[0]) {
      // Send WhatsApp message
      const queryParams = {
        tran_id: candidate.TRAN_ID,
        Loc_code: candidate.LOC_CODE,
        Comp_code: req.headers.compcode
      };

      const encodedParams = btoa(JSON.stringify(queryParams));
      const url = `https://erp.autovyn.com/registrationform?v1=${encodedParams}`;

      console.log(url);

      // Send WhatsApp message
      backgroundTasks.push(() => SendWhatsAppMessgae(req.headers.compcode, candidate.MOB_NO, "interview_msg", [
        { type: "text", text: candidate.NAME },
        { type: "text", text: candidate.DESIGNATION },
        { type: "text", text: candidate.locationname },
        // { type: "text", text: `https://erp.autovyn.com/registrationform?tran_id=${candidate.TRAN_ID}&Loc_code=${candidate.LOC_CODE}&Comp_code=${req.headers.compcode}`, },
        { type: "text", text: url },
        { type: "text", text: companyName },
      ]));

      messages.push({
        tran_id: candidate.TRAN_ID,
        status: 'Success',
        message: 'Message sent'
      });
    }

    res.status(200).send({
      Status: true,
      Message: "Messages sent successfully",
      Results: messages
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data or sending messages",
      Results: null
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
    setTimeout(async () => {
      try {
        for (const task of backgroundTasks) {
          await task();
          // await delay(2000);
          // Execute each function in backgroundTasks
        }
      } catch (err) {
        console.error('Error executing background tasks:', err);
      }
    }, 1000);
  }
};
exports.insertnewcandidate = async function (req, res) {
  console.log(req.body)
  console.log(req.files)
  const Emgy_No = req.body.Emgy_No;
  const Emgy_Mob_No = req.body.Emgy_Mob_No;
  const NAME = req.body.NAME;
  const MOB_NO = req.body.MOB_NO;
  const WHATSAPP_NO = req.body.WHATSAPP_NO;
  const EMAIL = req.body.EMAIL;
  const AADHAR_NO = req.body.AADHAR_NO;
  const FATHERS_NAME = req.body.FATHERS_NAME;
  const MOTHERS_NAME = req.body.MOTHERS_NAME;
  const GENDER = req.body.GENDER;
  const ADDRESS = req.body.ADDRESS;
  const DOB = req.body.DOB ? `'${req.body.DOB}'` : null;
  const CITY = req.body.CITY;
  const STATE = req.body.STATE;
  // const DOM = req.body.DOM ? `'${req.body.DOM}'` : null;
  // const PINCODE = req.body.PINCODE;
  const RELIGION = req.body.RELIGION;
  const DESIGNATION = req.body.DESIGNATION;
  const LOC_CODE = req.body.LOC_CODE;
  const HIGH_QUAL = req.body.HIGH_QUAL;
  const PASSING_PER = req.body.PASSING_PER;
  const EXP_IN_YEAR = req.body.EXP_IN_YEAR;
  const SOURCE_OF_REG = req.body.SOURCE_OF_REG;
  const CURRENT_CTC = req.body.CURRENT_CTC;
  const CASTE = req.body.CASTE;
  const CATEGORY = req.body.CATEGORY;
  const DRIVE = req.body.DRIVE;
  const SKILLS = req.body.SKILLS;
  const ppimg = req.files?.find(file => file.fieldname === 'ppimg');
  const cv = req.files?.find(file => file.fieldname === 'cv');
  const adhar = req.files?.find(file => file.fieldname === 'adhar');
  const pancard = req.files?.find(file => file.fieldname === 'pancard');
  const salslip = req.files?.find(file => file.fieldname === 'salslip');
  const explett = req.files?.find(file => file.fieldname === 'explett');

  const currentDate = new Date().toISOString();
  const APPLICATION_DATE = currentDate;
  const sequelize = await dbname(req.headers.compcode);
  try {
    const recordSet = await sequelize.query('SELECT isnull(MAX(TRAN_ID)+1,1) AS Tranid FROM NEW_JOINING');
    const newtranid = recordSet[0][0]?.Tranid;
    const missingFields = [];
    if (!NAME) missingFields.push("NAME");
    if (!MOB_NO) missingFields.push("MOB_NO");
    if (!ADDRESS) missingFields.push("ADDRESS");
    if (!STATE) missingFields.push("STATE");
    if (!CITY) missingFields.push("CITY");
    if (!HIGH_QUAL) missingFields.push("HIGH_QUAL");
    if (!PASSING_PER) missingFields.push("PASSING_PER");
    if (!FATHERS_NAME) missingFields.push("FATHERS_NAME");
    if (!GENDER) missingFields.push("GENDER");
    if (!MOTHERS_NAME) missingFields.push("MOTHERS_NAME");
    if (!EXP_IN_YEAR) missingFields.push("EXP_IN_YEAR");
    if (!CURRENT_CTC) missingFields.push("CURRENT_CTC");
    if (!LOC_CODE) missingFields.push("LOC_CODE");
    if (!DESIGNATION) missingFields.push("DESIGNATION");
    if (!EMAIL) missingFields.push("EMAIL");
    if (!AADHAR_NO) missingFields.push("AADHAR_NO");
    if (!DOB) missingFields.push("DOB");
    if (!RELIGION) missingFields.push("RELIGION");
    if (!SOURCE_OF_REG) missingFields.push("SOURCE_OF_REG");
    if (!SKILLS) missingFields.push("SKILLS");
    if (!ppimg) missingFields.push("ppimg");
    if (!cv) missingFields.push("cv");
    if (!adhar) missingFields.push("adhar");

    if (missingFields.length > 0) {
      // return res.status(500).json({ error: "One or more required fields are missing.", missingFields });
    }
    if (ppimg) {
      const EMP_DOCS_data = await uploadImages(
        [ppimg],
        req.headers.compcode.split("-")[0],
        req.body.NAME,
      );
      const update = `update DOC_UPLOAD set export_type = 33 WHERE TRAN_ID = '${newtranid}' AND SRNO = '1'`;
      const upload1 = `INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
  VALUES ('NCR', '${newtranid}', '1', '${EMP_DOCS_data[0].DOC_PATH}', '${EMP_DOCS_data[0].DOC_NAME}', '${NAME}', CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), '1')`;

      success2 = await sequelize.query(update);
      success1 = await sequelize.query(upload1);
    }
    if (cv) {
      const EMP_DOCS_data = await uploadImages(
        [cv],
        req.headers.compcode.split("-")[0],
        req.body.NAME,
      );
      const update = `update DOC_UPLOAD set export_type = 33 WHERE TRAN_ID = '${newtranid}' AND SRNO = '2'`;
      const upload2 = `INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
      VALUES ('NCR', '${newtranid}', '2', '${EMP_DOCS_data[0].DOC_PATH}', '${EMP_DOCS_data[0].DOC_NAME}', '${NAME}', CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), '1')`;

      success2 = await sequelize.query(update);
      success1 = await sequelize.query(upload2);
    }
    if (adhar) {
      const EMP_DOCS_data = await uploadImages(
        [adhar],
        req.headers.compcode.split("-")[0],
        req.body.NAME,
      );
      const update = `update DOC_UPLOAD set export_type = 33 WHERE TRAN_ID = '${newtranid}' AND SRNO = '3'`;
      const upload3 = `INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
  VALUES ('NCR', '${newtranid}', '3', '${EMP_DOCS_data[0].DOC_PATH}', '${EMP_DOCS_data[0].DOC_NAME}', '${NAME}', CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), '1')`;

      success2 = await sequelize.query(update);
      success1 = await sequelize.query(upload3);
    }
    if (pancard) {
      const EMP_DOCS_data = await uploadImages(
        [pancard],
        req.headers.compcode.split("-")[0],
        req.body.NAME,
      );
      const update = `update DOC_UPLOAD set export_type = 33 WHERE TRAN_ID = '${newtranid}' AND SRNO = '4'`;
      const upload4 = `INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
  VALUES ('NCR', '${newtranid}', '4', '${EMP_DOCS_data[0].DOC_PATH}', '${EMP_DOCS_data[0].DOC_NAME}', '${NAME}', CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), '1')`;

      success2 = await sequelize.query(update);
      success1 = await sequelize.query(upload4);
    }
    if (salslip) {
      const EMP_DOCS_data = await uploadImages(
        [salslip],
        req.headers.compcode.split("-")[0],
        req.body.NAME,
      );
      const update = `update DOC_UPLOAD set export_type = 33 WHERE TRAN_ID = '${newtranid}' AND SRNO = '5'`;
      const upload5 = `INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
  VALUES ('NCR', '${newtranid}', '5', '${EMP_DOCS_data[0].DOC_PATH}', '${EMP_DOCS_data[0].DOC_NAME}', '${NAME}', CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), '1')`;

      success2 = await sequelize.query(update);
      success1 = await sequelize.query(upload5);
    }
    if (explett) {
      const EMP_DOCS_data = await uploadImages(
        [explett],
        req.headers.compcode.split("-")[0],
        req.body.NAME,
      );
      const update = `update DOC_UPLOAD set export_type = 33 WHERE TRAN_ID = '${newtranid}' AND SRNO = '6'`;
      const upload6 = `INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
  VALUES ('NCR', '${newtranid}', '6', '${EMP_DOCS_data[0].DOC_PATH}', '${EMP_DOCS_data[0].DOC_NAME}', '${NAME}', CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), '1')`;

      success2 = await sequelize.query(update);
      success1 = await sequelize.query(upload6);
    }



    const kyahebe = (`INSERT INTO NEW_JOINING 
    (TRAN_ID, NAME, MOB_NO, WHATSAPP_NO, ADDRESS, STATE, CITY,Emgy_Mob_No,Emgy_No,
    HIGH_QUAL, PASSING_PER, FATHERS_NAME, GENDER, MOTHERS_NAME, EXP_IN_YEAR,
     CURRENT_CTC, LOC_CODE, DESIGNATION, EMAIL, AADHAR_NO, DOB, RELIGION, APPLICATION_DATE, INT_STATUS, SOURCE_OF_REG, SKILLS,CASTE,CATEGORY,DRIVE)
    VALUES 
    ('${newtranid}', '${NAME}', '${MOB_NO}', '${WHATSAPP_NO}', '${ADDRESS}', '${STATE}', '${CITY}','${Emgy_Mob_No}','${Emgy_No}',
     '${HIGH_QUAL}', '${PASSING_PER}', '${FATHERS_NAME}', '${GENDER}', '${MOTHERS_NAME}', '${EXP_IN_YEAR}',
      '${CURRENT_CTC}', '${LOC_CODE}', '${DESIGNATION}', '${EMAIL}', '${AADHAR_NO}', ${DOB}, '${RELIGION}', getdate() ,1, '${SOURCE_OF_REG}', '${SKILLS}','${CASTE}','${CATEGORY}','${DRIVE}');
    `);
    const Tbl_Type = {
      EmpExperience: 1,
      EmpEdu: 2,
      EmpItSkill: 3,
      EmpLang: 4,
      References: 5,
      EmpNominee: 6
    }
    let dataWithMeta = [];
    const createdBy = NAME;
    const tranId = newtranid;
    Object.keys(req.body).forEach((key, index) => {
      // Check if the value is an array
      if (Tbl_Type[key]) {
        const tblType = Tbl_Type[key];
        JSON.parse(req.body[key]).forEach((item, i) => {
          if (Object.keys(item).length) { // Only process non-empty objects
            dataWithMeta.push({
              ...item,
              Tbl_Type: tblType,
              Created_by: createdBy,
              SNo: i + 1,
              SRNO: tranId
            });
          }
        });
      }
    });
    const InterviewSideTables = _InterviewSideTables(sequelize, DataTypes);
    await InterviewSideTables.destroy({
      where: {
        SRNO: tranId
      }
    });
    await InterviewSideTables.bulkCreate(
      dataWithMeta,
    );
    await sequelize.query(kyahebe);


    res.send({ kartik: 'chal be ' })
  } catch (err) {
    console.error(err);
    res.status(500).send({ Message: 'api crashed.' });
  }
};

exports.updatenewcandidate = async function (req, res) {
  const TRAN_ID = req.body.TRAN_ID;
  const Emgy_No = req.body.Emgy_No;
  const Emgy_Mob_No = req.body.Emgy_Mob_No;
  const NAME = req.body.NAME;
  const MOB_NO = req.body.MOB_NO;
  const WHATSAPP_NO = req.body.WHATSAPP_NO;
  const EMAIL = req.body.EMAIL;
  const AADHAR_NO = req.body.AADHAR_NO;
  const FATHERS_NAME = req.body.FATHERS_NAME;
  const MOTHERS_NAME = req.body.MOTHERS_NAME;
  const GENDER = req.body.GENDER;
  const ADDRESS = req.body.ADDRESS;
  const DOB = req.body.DOB ? `'${req.body.DOB}'` : null;
  const CITY = req.body.CITY;
  const STATE = req.body.STATE;
  const RELIGION = req.body.RELIGION;
  const DESIGNATION = req.body.DESIGNATION;
  const LOC_CODE = req.body.LOC_CODE;
  const HIGH_QUAL = req.body.HIGH_QUAL;
  const PASSING_PER = req.body.PASSING_PER;
  const EXP_IN_YEAR = req.body.EXP_IN_YEAR;
  const SOURCE_OF_REG = req.body.SOURCE_OF_REG;
  const CURRENT_CTC = req.body.CURRENT_CTC;
  const CASTE = req.body.CASTE;
  const CATEGORY = req.body.CATEGORY;
  const DRIVE = req.body.DRIVE;
  const SKILLS = req.body.SKILLS;
  const ppimg = req.files?.find(file => file.fieldname === 'ppimg');
  const cv = req.files?.find(file => file.fieldname === 'cv');
  const adhar = req.files?.find(file => file.fieldname === 'adhar');
  const pancard = req.files?.find(file => file.fieldname === 'pancard');
  const salslip = req.files?.find(file => file.fieldname === 'salslip');
  const explett = req.files?.find(file => file.fieldname === 'explett');

  const currentDate = new Date().toISOString();
  const APPLICATION_DATE = currentDate;
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "req.body")

  try {
    let newtranid = TRAN_ID;

    if (!TRAN_ID) {
      // If TRAN_ID is not provided, create a new ID
      const recordSet = await sequelize.query('SELECT isnull(MAX(TRAN_ID)+1,1) AS Tranid FROM NEW_JOINING');
      newtranid = recordSet[0][0]?.Tranid;
    }

    const missingFields = [];
    if (!NAME) missingFields.push("NAME");
    if (!MOB_NO) missingFields.push("MOB_NO");
    if (!ADDRESS) missingFields.push("ADDRESS");
    if (!STATE) missingFields.push("STATE");
    if (!CITY) missingFields.push("CITY");
    if (!HIGH_QUAL) missingFields.push("HIGH_QUAL");
    if (!PASSING_PER) missingFields.push("PASSING_PER");
    if (!FATHERS_NAME) missingFields.push("FATHERS_NAME");
    if (!GENDER) missingFields.push("GENDER");
    if (!MOTHERS_NAME) missingFields.push("MOTHERS_NAME");
    if (!EXP_IN_YEAR) missingFields.push("EXP_IN_YEAR");
    if (!CURRENT_CTC) missingFields.push("CURRENT_CTC");
    if (!LOC_CODE) missingFields.push("LOC_CODE");
    if (!DESIGNATION) missingFields.push("DESIGNATION");
    if (!EMAIL) missingFields.push("EMAIL");
    if (!AADHAR_NO) missingFields.push("AADHAR_NO");
    if (!DOB) missingFields.push("DOB");
    if (!RELIGION) missingFields.push("RELIGION");
    if (!SOURCE_OF_REG) missingFields.push("SOURCE_OF_REG");
    if (!SKILLS) missingFields.push("SKILLS");
    if (!ppimg && !TRAN_ID) missingFields.push("ppimg");
    if (!cv && !TRAN_ID) missingFields.push("cv");
    if (!adhar && !TRAN_ID) missingFields.push("adhar");

    if (missingFields.length > 0) {
      // return res.status(500).json({ error: "One or more required fields are missing.", missingFields });
    }

    // Handle file uploads and updates
    const fileFields = {
      ppimg: ppimg,
      cv: cv,
      adhar: adhar,
      pancard: pancard,
      salslip: salslip,
      explett: explett
    };

    for (const [fieldName, file] of Object.entries(fileFields)) {
      if (file) {
        const EMP_DOCS_data = await uploadImages(
          [file],
          req.headers.compcode.split("-")[0],
          req.body.NAME,
        );
        const update = `update DOC_UPLOAD set export_type = 33 WHERE TRAN_ID = '${newtranid}' AND SRNO = '${Object.keys(fileFields).indexOf(fieldName) + 1}'`;
        const upload = `INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
        VALUES ('NCR', '${newtranid}', '${Object.keys(fileFields).indexOf(fieldName) + 1}', '${EMP_DOCS_data[0].DOC_PATH}', '${EMP_DOCS_data[0].DOC_NAME}', '${NAME}', CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), '1')`;

        await sequelize.query(update);
        await sequelize.query(upload);
      }
    }

    const query = TRAN_ID ?
      `UPDATE NEW_JOINING SET 
        NAME = '${NAME}', MOB_NO = '${MOB_NO}', WHATSAPP_NO = '${WHATSAPP_NO}', ADDRESS = '${ADDRESS}', STATE = '${STATE}', CITY = '${CITY}',Emgy_Mob_No ='${Emgy_Mob_No}',Emgy_No ='${Emgy_No}',
        HIGH_QUAL = '${HIGH_QUAL}', PASSING_PER = '${PASSING_PER}', FATHERS_NAME = '${FATHERS_NAME}', GENDER = '${GENDER}', MOTHERS_NAME = '${MOTHERS_NAME}', 
        EXP_IN_YEAR = '${EXP_IN_YEAR}', CURRENT_CTC = '${CURRENT_CTC}', LOC_CODE = '${LOC_CODE}', DESIGNATION = '${DESIGNATION}', EMAIL = '${EMAIL}', 
        AADHAR_NO = '${AADHAR_NO}', DOB = ${DOB}, RELIGION = '${RELIGION}', APPLICATION_DATE = getdate(), INT_STATUS = 1, SOURCE_OF_REG = '${SOURCE_OF_REG}', 
        CASTE='${CASTE}',
        CATEGORY='${CATEGORY}',
        DRIVE='${DRIVE}',
        SKILLS = '${SKILLS}' 
      WHERE TRAN_ID = '${TRAN_ID}'` :
      `INSERT INTO NEW_JOINING 
        (TRAN_ID, NAME, MOB_NO, WHATSAPP_NO, ADDRESS, STATE, CITY,Emgy_Mob_No,Emgy_No,
        HIGH_QUAL, PASSING_PER, FATHERS_NAME, GENDER, MOTHERS_NAME, EXP_IN_YEAR,
        CURRENT_CTC, LOC_CODE, DESIGNATION, EMAIL, AADHAR_NO, DOB, RELIGION, APPLICATION_DATE, INT_STATUS, SOURCE_OF_REG, SKILLS,CASTE,CATEGORY,DRIVE)
      VALUES 
        ('${TRAN_ID}', '${NAME}', '${MOB_NO}', '${WHATSAPP_NO}', '${ADDRESS}', '${STATE}', '${CITY}',
        '${HIGH_QUAL}', '${PASSING_PER}', '${FATHERS_NAME}', '${GENDER}', '${MOTHERS_NAME}', '${EXP_IN_YEAR}',
        '${CURRENT_CTC}', '${LOC_CODE}', '${DESIGNATION}', '${EMAIL}', '${AADHAR_NO}', ${DOB}, '${RELIGION}', getdate() ,1, '${SOURCE_OF_REG}', '${SKILLS}','${CASTE}','${CATEGORY}','${DRIVE}'
          )`;
    const Tbl_Type = {
      EmpExperience: 1,
      EmpEdu: 2,
      EmpItSkill: 3,
      EmpLang: 4,
      References: 5,
      EmpNominee: 6
    }
    let dataWithMeta = [];
    const createdBy = NAME;
    const tranId = TRAN_ID;
    Object.keys(req.body).forEach((key, index) => {
      // Check if the value is an array
      if (Tbl_Type[key]) {
        const tblType = Tbl_Type[key];
        JSON.parse(req.body[key]).forEach((item, i) => {
          if (Object.keys(item).length) { // Only process non-empty objects
            dataWithMeta.push({
              ...item,
              Tbl_Type: tblType,
              Created_by: createdBy,
              SNo: i + 1,
              SRNO: tranId
            });
          }
        });
      }
    });
    const InterviewSideTables = _InterviewSideTables(sequelize, DataTypes);
    await InterviewSideTables.destroy({
      where: {
        SRNO: tranId
      }
    });
    await InterviewSideTables.bulkCreate(
      dataWithMeta);
    await sequelize.query(query);

    res.send({ success: 'Data processed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ Message: 'api crashed.' });
  }
};
exports.getonedata = async function (req, res) {
  const TRAN_ID = req.body.TRAN_ID;
  console.log(TRAN_ID, "TRAN_ID")
  try {
    const sequelize = await dbname(req.headers.compcode);
    const branch = await sequelize.query(`SELECT NAME,LOC_CODE,DESIGNATION,MOB_NO,EMAIL,ADDRESS FROM NEW_JOINING WHERE TRAN_ID=${TRAN_ID}`);
    await sequelize.close();
    res.status(200).send(branch[0]);
  } catch (e) { console.log(e); }
}

exports.hrformupdate = async function (req, res) {
  const { TRAN_ID, NAME, MOB_NO, EMAIL, DESIGNATION, LOC_CODE } = req.body;

  const sequelize = await dbname(req.headers.compcode);
  try {
    if (!TRAN_ID) {
      return res.status(400).json({ error: "TRAN_ID is required." });
    }

    const sql = `
      UPDATE NEW_JOINING
      SET 
        NAME = COALESCE(:NAME, NAME),
        MOB_NO = COALESCE(:MOB_NO, MOB_NO),
        EMAIL = COALESCE(:EMAIL, EMAIL),
        DESIGNATION = COALESCE(:DESIGNATION, DESIGNATION),
        LOC_CODE = COALESCE(:LOC_CODE, LOC_CODE)
      WHERE TRAN_ID = :TRAN_ID;
    `;

    const replacements = {
      TRAN_ID,
      NAME: NAME || null,
      MOB_NO: MOB_NO || null,
      EMAIL: EMAIL || null,
      DESIGNATION: DESIGNATION || null,
      LOC_CODE: LOC_CODE || null
    };

    const [result] = await sequelize.query(sql, {
      replacements,
      type: sequelize.QueryTypes.UPDATE
    });


    if (result[1] === 0) {
      return res.status(404).json({ error: "Record with the specified TRAN_ID not found." });
    }

    res.send({ message: 'Data updated successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'An error occurred while updating the record.' });
  }
};


exports.finallyselectedbyhr = async function (req, res) {
  const { TRAN_ID, HR_REASON } = req.body;
  console.log(req.body, "req.body")
  const sequelize = await dbname(req.headers.compcode);
  try {
    if (!TRAN_ID) {
      return res.status(400).json({ error: "TRAN_ID is required." });
    }
    // const Candidate = await sequelize.query(`select *,(select top 1 misc_name from misc_mst where misc_Code = NEW_JOINING.loc_code and misc_type = 85) as locationname,
    //  STUFF(RIGHT(CONVERT(VARCHAR, CAST(INTR1TIME AS TIME), 100), 7), 6, 0, ' ') AS FormattedTime  from NEW_JOINING where TRAN_ID='${TRAN_ID}'`)
    //  console.log(Candidate[0][0],"Candidate")
    //  const companyResult = await sequelize.query(`SELECT comp_name FROM comp_mst`);
    //  const companyName = companyResult[0][0]?.comp_name;
    const sql = `
      UPDATE NEW_JOINING 
      SET 
       INT_STATUS = '101',
         HR_REASON = '${HR_REASON}'
      WHERE TRAN_ID = :TRAN_ID;
    `;
    const replacements = {
      TRAN_ID,
    };
    const [result] = await sequelize.query(sql, {
      replacements,
      type: sequelize.QueryTypes.UPDATE
    });


    //   var html2 = `<html>
    // <body>
    //   <p>Dear ${Candidate[0][0]?.NAME},</p>
    //   <p>I am delighted to inform you that after careful consideration, we have selected you for the ${Candidate[0][0]?.DESIGNATION} position at ${Candidate[0][0]?.locationname}. Congratulations!</p>
    //   <p>Your skills and experiences impressed us greatly, and we believe you will be a fantastic addition to our team. We are excited about the potential you bring and look forward to seeing the contributions you will make to our team.</p>
    //   <p>In the coming days, we will reach out to you with details about the next steps.</p>
    //   <p>Once again, congratulations on your new role. If you have any questions or need further information in the meantime, please do not hesitate to reach out to us at <a href="mailto:hpyumesh@gmail.com">hardcode h</a>.</p>
    //   <p>Welcome aboard, and we look forward to working with you!</p>
    //   <p>Best regards,</p>
    //   <p>${companyName}</p>
    //   </body>
    //  </html>` 

    //  sendmail(Candidate[0][0]?.EMAIL , `Congratulations! Job Offer for ${companyName} Role`, html2);
    // await SendWhatsAppMessgae(
    //   Candidate[0][0].MOB_NO,
    //   "interview_select_msg",
    //   [
    //     { type: "text", text: Candidate[0][0].NAME },
    //     { type: "text", text: Candidate[0][0].DESIGNATION },
    //     { type: "text", text: Candidate[0][0].locationname },
    //     { type: "text", text: 'umeshkumawatsir@gmail.com' },
    //     { type: "text", text: companyName },
    //   ]
    // );

    if (result[1] === 0) {
      return res.status(404).json({ error: "Record with the specified TRAN_ID not found." });
    }
    res.send({ message: 'Employee Selected' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'An error occurred while updating the record.' });
  }
};


exports.finallyrejectedbyhr = async function (req, res) {
  const { TRAN_ID, HR_REASON } = req.body;
  console.log(req.body, "req.body")
  const sequelize = await dbname(req.headers.compcode);
  try {
    if (!TRAN_ID) {
      return res.status(400).json({ error: "TRAN_ID is required." });
    }
    const sql = `
      UPDATE NEW_JOINING
      SET 
        INT_STATUS = '102' ,
       HR_REASON='${HR_REASON}'
      WHERE TRAN_ID = :TRAN_ID;
    `;
    const replacements = {
      TRAN_ID,
    };
    const [result] = await sequelize.query(sql, {
      replacements,
      type: sequelize.QueryTypes.UPDATE
    });

    if (result[1] === 0) {
      return res.status(404).json({ error: "Record with the specified TRAN_ID not found." });
    }
    res.send({ message: 'Employee Selected' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'An error occurred while updating the record.' });
  }
};


exports.createempmaster = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "req.body");
  try {
    if (!req.body.TRAN_ID) {
      return res.status(500).send({
        status: false,
        Message: "TRAN_ID is mandatory",
      });
    }

    const [results] = await sequelize.query(`
      SELECT isnull(range_code,0), range_name 
      FROM godown_mst 
      WHERE range_code = (SELECT MAX(range_code) FROM godown_mst)
    `);
    const maxEmpCode = parseInt(results[0]?.range_code) + 1;
    const rangeName = results[0]?.range_name;
    const Result = `${rangeName}${maxEmpCode}`;
    // console.log(Result,"Result")
    await sequelize.query(`
      UPDATE godown_mst
      SET 
         range_code = :max_range_code
    `, {
      replacements: { max_range_code: maxEmpCode },
      type: sequelize.QueryTypes.UPDATE
    });


    await sequelize.query(`
      UPDATE SHORtlisted_candidate
      SET 
         CURRENTJOINDATE = :CURRENTJOINDATE,
         Sal_Region = :Sal_Region,
         DIVISION = :DIVISION,
         EMPLOYEEDESIGNATION = :EMPLOYEEDESIGNATION,
         LOCATION = :LOCATION,
         EMPCODE = :EMPCODE
         WHERE SRNO = :TRAN_ID
    `, {
      replacements: {
        CURRENTJOINDATE: req.body.CURRENTJOINDATE,
        Sal_Region: req.body.Sal_Region,
        DIVISION: req.body.DIVISION,
        EMPLOYEEDESIGNATION: req.body.EMPLOYEEDESIGNATION,
        LOCATION: req.body.LOCATION,
        EMPCODE: Result,
        TRAN_ID: req.body.TRAN_ID
      },
      type: sequelize.QueryTypes.UPDATE
    });

    await sequelize.query(`
      UPDATE NEW_JOINING
      SET 
         INT_STATUS = '103',
         EMPCODE = :EMPCODE
        WHERE TRAN_ID = :TRAN_ID
    `, {
      replacements: {
        EMPCODE: Result,
        TRAN_ID: req.body.TRAN_ID
      },
      type: sequelize.QueryTypes.UPDATE
    });

    const images = await sequelize.query(
      `SELECT * FROM doc_upload WHERE tran_id=${req.body.TRAN_ID} AND doc_type = 'NCR' AND EXPORT_TYPE < 5 ORDER BY srno`
    );

    if (images?.[0]?.length > 0) {
      // Define the mapping from SRNO to MISSPUNCH_INOUT
      const srnoToMissPunchMapping = {
        2: 5,
        3: 2,
        4: 3,
        5: 4,
        // Add more mappings as needed
      };

      for (const data of images[0]) {
        // Get the MISSPUNCH_INOUT value from the mapping, default to SRNO if not mapped
        const missPunchInOutValue = srnoToMissPunchMapping[data.SRNO] || data.SRNO;

        const insertEnqDtlQuery = `
          INSERT INTO EMP_DOCS (EMP_CODE, DOC_NAME, DOC_PATH, COLUMNDOC_TYPE, MISSPUNCH_INOUT) VALUES (
            :EMPCODE, :DOC_NAME, :DOC_PATH, :COLOUMNDOC_TYPE, :MISSPUNCH_INOUT
          )
        `;

        const imagess = {
          EMPCODE: req.body.EMPCODE,
          DOC_NAME: data.File_Name,
          DOC_PATH: data.path,
          COLOUMNDOC_TYPE: 'EMPLOYEE',
          MISSPUNCH_INOUT: missPunchInOutValue,
        };

        await sequelize.query(insertEnqDtlQuery, {
          replacements: imagess,
        });
      }
    }


    await sequelize.query(`
     INSERT INTO EMPLOYEEMASTER (
          SRNO, EMPFIRSTNAME, MOBILE_NO, MOBILENO, CURRENTADDRESS1, PPINCODE, pState, PCITY,
          BASICQUALIFICATION, FATHERNAME, GENDER, MOTHERNAME, ALTERNET_MAIL, UID_NO, DOB,
          DOM, Export_Type, EMPCODE, SERVERid, CURRENTJOINDATE, Sal_Region, DIVISION,
          EMPLOYEEDESIGNATION, LOCATION,TITLE,EMPLASTNAME,PERMANENTADDRESS1,PERMANENTADDRESS2,
          PASSPORTNO,ESINO,PFNO,PANNO,EMERGENCYNO,EMERGENCYNAME,LANDLINENO,BLOODGROUP,PASSEXPIRYDATE,
          MARITALSTATUS ,FATHERCONTACTNO,FATHEROCCUPATION,MOTHERCONTACTNO,SPOUSENAME,SPOUSECONTACTNO,
          SPOUSEGENDER,PRECOMPCITY,PRECOMPCONTACTNO,PREJOININGDATE,PREENDDATE,PREDESIGNATION,EMPREFERENCENAME,
          EMP_STATUS, Induction_Done,PROBATIONPERIOD,Prob_period,CORPORATEMAILID,PAY_CODE,SKILLS,
          DRIVINGLIC_ISSUEDATE,DRIVINGLIC_ISSUEPALACE,PREVIOUSCOMPANYNAME,pre_Exp,CNATIONALITY,USR_NAME,
          Acnt_Loc,Interview_Date,SECTION,Father_Mob,EMPHEIGHT,EMPWEIGHT,Mother_Mob,CSTATE,CPINCODE,
          APPLICATION_ID,BIOMETRIC_ID,LEVEL,EXT_NO,PROPOSEDRETIRE_DATE,LASTMODI_ON,LASTMODI_BY,CREATED_ON,CREATED_BY,
          ROLE

      )
      SELECT
          (SELECT COALESCE(MAX(srno) + 1, 0) FROM EMPLOYEEMASTER), sc.EMPFIRSTNAME, sc.MOBILE_NO, sc.MOBILENO, sc.CURRENTADDRESS1, sc.PPINCODE, sc.pState, null, sc.BASICQUALIFICATION,
          sc.FATHERNAME, sc.GENDER, sc.MOTHERNAME, sc.ALTERNET_MAIL, sc.UID_NO, sc.DOB, sc.DOM, 1,
          sc.EMPCODE, 1, sc.CURRENTJOINDATE, sc.Sal_Region, sc.DIVISION, sc.EMPLOYEEDESIGNATION, sc.LOCATION,
          sc.TITLE,sc.EMPLASTNAME,sc.PERMANENTADDRESS1,sc.PERMANENTADDRESS2,
          sc.PASSPORTNO,sc.ESINO,sc.PFNO,sc.PANNO,sc.EMERGENCYNO,sc.EMERGENCYNAME,sc.LANDLINENO,sc.BLOODGROUP,sc.PASSEXPIRYDATE,
          sc.MARITALSTATUS ,sc.FATHERCONTACTNO,sc.FATHEROCCUPATION,sc.MOTHERCONTACTNO,sc.SPOUSENAME,sc.SPOUSECONTACTNO,        
          sc.SPOUSEGENDER,sc.PRECOMPCITY,sc.PRECOMPCONTACTNO,sc.PREJOININGDATE,sc.PREENDDATE,sc.PREDESIGNATION,sc.EMPREFERENCENAME,
          sc.EMP_STATUS, sc.Induction_Done,sc.PROBATIONPERIOD,sc.Prob_period,sc.CORPORATEMAILID,sc.PAY_CODE,sc.SKILLS,
          sc.DRIVINGLIC_ISSUEDATE,sc.DRIVINGLIC_ISSUEPALACE,sc.PREVIOUSCOMPANYNAME,sc.pre_Exp,sc.CNATIONALITY,sc.USR_NAME,     
         sc.Acnt_Loc,sc.Interview_Date,sc.SECTION,sc.Father_Mob,sc.EMPHEIGHT,sc.EMPWEIGHT,sc.Mother_Mob,sc.CSTATE,sc.CPINCODE,
         sc.APPLICATION_ID,sc.BIOMETRIC_ID,sc.LEVEL,sc.EXT_NO,sc.PROPOSEDRETIRE_DATE,sc.LASTMODI_ON,sc.LASTMODI_BY,sc.CREATED_ON,sc.CREATED_BY,
         sc.ROLE
      FROM
          SHORtlisted_candidate sc
          LEFT JOIN EMPLOYEEMASTER em ON sc.EMPCODE = em.EMPCODE
      WHERE sc.SRNO =:TRAN_ID AND em.EMPCODE IS NULL
    `, {
      replacements: { TRAN_ID: req.body.TRAN_ID },
      type: sequelize.QueryTypes.INSERT
    });

    await sequelize.close();
    res.status(200).send({ msg: 'Application Shortlisted', icon: 'success', title: 'Success' });
  } catch (e) {
    console.error(e);
    res.status(500).send({ Message: 'API crashed.' });
  }
};

exports.removefromempmaster = async function (req, res) {
  const { TRAN_ID, empcode } = req.body;
  console.log(req.body, "req.body")
  const sequelize = await dbname(req.headers.compcode);
  try {
    if (!TRAN_ID) {
      return res.status(400).json({ error: "TRAN_ID is required." });
    }
    if (!empcode) {
      return res.status(400).json({ error: "empcode is required." });
    }
    await sequelize.query(`update EMPLOYEEMASTER set export_type='99' where empcode='${empcode}'`);
    const sql = `
      UPDATE NEW_JOINING
      SET 
        INT_STATUS = '104' 
      WHERE TRAN_ID = :TRAN_ID;
    `;
    const replacements = {
      TRAN_ID,
    };
    const [result] = await sequelize.query(sql, {
      replacements,
      type: sequelize.QueryTypes.UPDATE
    });

    if (result[1] === 0) {
      return res.status(404).json({ error: "Record with the specified TRAN_ID not found." });
    }
    res.send({ message: 'Employee Removed' });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'An error occurred while updating the record.' });
  }
};

exports.getmaxemployeeno = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const [results] = await sequelize.query(`
      SELECT range_code, range_name 
      FROM godown_mst 
      WHERE range_code = (SELECT MAX(range_code) FROM godown_mst)
    `);

    const maxno = results[0]?.range_code + 1; // Get the max range_code
    const rangeName = results[0]?.range_name; // Get the associated range_name



    // Concatenate the rangeName and maxEmpCode as a single string
    const maxEmpCode = `${rangeName}${maxno}`;
    console.log(maxEmpCode, "combinedResult");
    res.send({ maxEmpCode });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: 'An error occurred while retrieving the employee code.' });
  }
};




