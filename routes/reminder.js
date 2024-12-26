const { dbname } = require("../utils/dbconfig");
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "AUTOVYN.MAILER@gmail.com",
    pass: "lamdgvthpjetawtr",
  },
});

function sendmail(EMAIL, subject, html) {
  var BCCMAIL = ["devs@autovyn.com", "yuvraj@autovyn.com", "gopal@autovyn.com"];
  let mailOptions = {
    from: "AUTOVYN.MAILER@gmail.com",
    to: EMAIL,
    bcc: BCCMAIL,
    subject: subject,
    html: html,
    attachments: [
      {
        filename: "favicon.png",
        path: "public/favicon.png",
        cid: "favicon",
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(error);
    }
    console.log("Email sent: For Reminder" + info.response);
  });
}

exports.home = async function (req, res) {
  console.log("s");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const data = await sequelize.query(
      `select convert(varchar,time )as newtime,* from reminder_table where user_id='${req.query.user_code}' and validity>CURRENT_TIMESTAMP and type=1`
    );
    res.status(200).send(data[0]);
  } catch (err) {
    console.log(err);
  }
};

exports.expiredreminder = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const data = await sequelize.query(
      `select convert(varchar,time )as newtime,* from reminder_table where user_id='${req.body.user_code}' and validity<CURRENT_TIMESTAMP and type!=33`
    );
    res.status(200).send(data[0]);
  } catch (err) {
    console.log(err);
  }
};

exports.addreminderforteam = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const employee = await sequelize.query(
      `SELECT User_Name As NAME ,User_code As EMPCODE  From User_tbl where export_type<3`
    );
    res.status(200).send(employee[0]);
  } catch (err) {}
};

exports.addreminder = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const data = await sequelize.query(
      `select * from reminder_table where user_id='${req.body.user_code}' and validity>CURRENT_TIMESTAMP`
    );
    res.status(200).send(data[0]);
  } catch (err) {
    console.log(err);
  }
};

exports.addreminderpost = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const reminderName = req.body.reminder_name;
    const date = req.body.date ? `'${req.body.date}'` : null;
    const time = req.body.time;
    const frequency = req.body.frequency;
    const validity = req.body.validity ? `'${req.body.validity}'` : null;
    const description = req.body.description;
    const reminder_id = req.body.reminder_id
      ? `'${req.body.reminder_id}'`
      : null;
    const IsAvaliable = await sequelize.query(
      `select * from reminder_table where  reminder_id=${reminder_id}`
    );
    if (IsAvaliable[0].length > 0) {
      await sequelize.query(
        `delete from reminder_table where  reminder_id=${reminder_id}`
      );
    }
    await sequelize.query(
      `insert into reminder_table (reminder_name,date,time,frequency,validity,description,user_id,type)values ('${reminderName}',${date},'${time}','${frequency}',${validity},'${description}','${req.body.user_id}',1)`
    );
    res.status(200).send("insert successful");
  } catch (err) {
    console.log(err);
  }
};

exports.addreminderforotherpost = async function (req, res) {
  console.log(req.body, "boduy");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const reminderName = req.body.reminder_name;
    const date = req.body.date ? `'${req.body.date}'` : null;
    const time = req.body.time;
    const frequency = req.body.frequency;
    const validity = req.body.validity ? `'${req.body.validity}'` : null;
    const description = req.body.description;
    const emp = req.body.interviewer1;
    const emails = req.body.recipientEmail;
    let emailsArray;

    if (req.body.reminder_id) {
      await sequelize.query(
        `delete from reminder_table where reminder_id=${req.body.reminder_id}`
      );
      await sequelize.query(
        `delete from reminder_emp where reminder_id=${req.body.reminder_id}`
      );
    }

    let reminder_id;

    if (emails) {
      emailsArray = emails.split(",");
    }

    if (emp) {
      const result = await sequelize.query(`
    BEGIN TRANSACTION;
    
    DECLARE @abcd TABLE (reminder_id INT);
    
    INSERT INTO reminder_table (reminder_name, date, time, frequency, validity, description, user_id, type)
    OUTPUT INSERTED.reminder_id INTO @abcd
    VALUES ('${reminderName}', ${date}, '${time}', '${frequency}', ${validity}, '${description}','${req.body.user_id}',1);
    
    INSERT INTO reminder_emp (reminder_id, empcode, email, mobile)
    SELECT a.reminder_id, e.user_code, e.user_email, e.user_mob
    FROM user_tbl e
    JOIN @abcd a ON e.user_code IN (${emp})  where e.export_type<3;
    
    COMMIT TRANSACTION;`);

      const reminder =
        await sequelize.query(`select reminder_id from reminder_table where reminder_name='${reminderName}' AND
    date=${date} AND time='${time}' ANd frequency='${frequency}' AND validity= ${validity} AND user_id='${req.body.user_id}'
    
    `);

      reminder_id = reminder[0][0].reminder_id;
    }

    if (emails) {
      if (!reminder_id) {
        await sequelize.query(` INSERT INTO reminder_table (reminder_name, date, time, frequency, validity, description, user_id, type)
      VALUES ('${reminderName}', ${date}, '${time}', '${frequency}', ${validity}, '${description}','${req.body.user_id}',1);
      `);

        const reminder =
          await sequelize.query(`select reminder_id from reminder_table where reminder_name='${reminderName}' AND
    date=${date} AND time='${time}' ANd frequency='${frequency}' AND validity= ${validity} AND user_id='${req.body.user_id}'`);
        reminder_id = reminder[0][0].reminder_id;
      }

      for (const email of emailsArray) {
        console.log(reminder_id, "reminder_id");
        await sequelize.query(
          `insert into reminder_emp (reminder_id,email) Values(${reminder_id},'${email}')`
        );
      }
    }

    res.status(200).send("ok");
  } catch (err) {
    console.log(err);
  }
};

exports.findreminder = async function (req, res) {
  try {
    const reminder_id = req.body.LEDGCODE;
    const sequelize = await dbname(req.headers.compcode);
    const data = await sequelize.query(
      `select * from reminder_table where reminder_id=${reminder_id}`
    );
    const employee = await sequelize.query(
      `SELECT empcode,email from reminder_emp where reminder_id=${reminder_id}`
    );

    const responseObj = {
      reminder_table: data[0],
      reminder_emp: employee[0],
    };
    res.status(200).json(responseObj);
  } catch (err) {
    console.log(err);
  }
};

exports.updatereminder = async function (req, res) {
  try {
    const reminder_id = req.query.id;
    const sequelize = await dbname(req.headers.compcode);
    const data = await sequelize.query(
      `select * from reminder_table where reminder_id=${reminder_id}`
    );
    // const employee = await sequelize.query(`SELECT EMPCODE,CONCAT(EMPFIRSTNAME,' ',EMPLASTNAME)AS NAME FROM EMPLOYEEMASTER`);
    const employee = await sequelize.query(
      `SELECT User_Name As NAME ,User_code As EMPCODE  From User_tbl where export_type<3`
    );

    res.status(200).send({
      reminder: data[0],
      employee: employee[0],
    });
  } catch (err) {
    console.log(err);
  }
};

exports.updatereminderpost = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const reminder_id1 = req.body.reminder_id;
    const reminderName = req.body.reminderName;
    const date = req.body.date ? `'${req.body.date}'` : null;
    const time = req.body.time;
    const frequency = req.body.frequency;
    const validity = req.body.validity ? `'${req.body.validity}'` : null;
    const description = req.body.description;
    const emp = req.body.interviewer1;
    const emails = req.body.recipientEmail;
    let reminder_id;

    if (emails) {
      emailsArray = emails.split(",");
    }

    await sequelize.query(
      `delete from reminder_emp where reminder_id='${reminder_id1}'`
    );
    await sequelize.query(
      `update  reminder_table set type=33 where  reminder_id='${reminder_id1}' `
    );

    if (emp) {
      const result = await sequelize.query(`
  BEGIN TRANSACTION;
  
  DECLARE @abcd TABLE (reminder_id INT);
  
  INSERT INTO reminder_table (reminder_name, date, time, frequency, validity, description, user_id, type)
  OUTPUT INSERTED.reminder_id INTO @abcd
  VALUES ('${reminderName}', ${date}, '${time}', '${frequency}', ${validity}, '${description}','${req.body.user_code}',1);
  
  
  INSERT INTO reminder_emp (reminder_id, empcode, email, mobile)
  SELECT a.reminder_id, e.user_code, e.user_email, e.user_mob
  FROM user_tbl e
  JOIN @abcd a ON e.user_code IN (${emp}) Where e.export_type<3;
  
  COMMIT TRANSACTION;`);

      const reminder =
        await sequelize.query(`select reminder_id from reminder_table where reminder_name='${reminderName}' AND
  date=${date} AND time='${time}' ANd frequency='${frequency}' AND validity= ${validity} AND user_id='${req.body.user_code}'
  
  `);

      reminder_id = reminder[0].reminder_id;
    }

    if (emails) {
      if (!reminder_id) {
        await sequelize.query(` INSERT INTO reminder_table (reminder_name, date, time, frequency, validity, description, user_id, type)
  VALUES ('${reminderName}', ${date}, '${time}', '${frequency}', ${validity}, '${description}','${req.body.user_code}',1);
  `);

        const reminder =
          await sequelize.query(`select reminder_id from reminder_table where reminder_name='${reminderName}' AND
date=${date} AND time='${time}' ANd frequency='${frequency}' AND validity= ${validity} AND user_id='${req.body.user_code}'

`);
        reminder_id = reminder.recordset[0].reminder_id;
      }

      for (const email of emailsArray) {
        await sequelize.query(
          `insert into reminder_emp (reminder_id,email) Values(${reminder_id},'${email}')`
        );
      }
    }

    res.status(200).send("ok");
  } catch (err) {
    console.log(err);
  }
};

exports.activatereminder = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const reminder_id = req.query.id;
    const reminder = await sequelize.query(
      `select * from reminder_table where reminder_id=${reminder_id}`
    );

    if (reminder[0].length > 0) {
      const newvalidity = new Date();
      const resultDate = new Date(newvalidity);
      resultDate.setFullYear(resultDate.getFullYear() + 1);
      const inputDate = new Date(resultDate);

      // Check if the inputDate is valid
      if (isNaN(inputDate.getTime())) {
        return null; // Invalid date string
      }

      // Get year, month, and day components from the Date object
      const year = inputDate.getFullYear();
      const month = String(inputDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
      const day = String(inputDate.getDate()).padStart(2, "0");

      // Format the result date as "yyyy-mm-dd"
      const formattedDate = `${year}-${month}-${day}`;

      await sequelize.query(
        `UPDATE reminder_table SET validity = '${formattedDate}' WHERE reminder_id = ${reminder_id}`
      );
    }
    res.status(200).send("done");
  } catch (err) {}
};
exports.deletereminder = async function (req, res) {
  console.log(req.body, "sn");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const reminder_id = req.body.reminder_id;
    await sequelize.query(
      `update reminder_table set type=33 where reminder_id=${reminder_id} `
    );
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};

// const schedule = require('node-schedule');

// // Schedule the task to run every minute
// const job = schedule.scheduleJob('*/1  * * * *  ', myTask);
// async function myTask() {
//   var find_db;

//   try {
//     const pool = new sql.ConnectionPool(config);
//     await pool.connect();
//     const request = new sql.Request(pool);
//     find_db = await sequelize.query(`SELECT db_name + year as dbname,* FROM DB_CON WHERE  export_type=1 `);
//     pool.close();
//   } catch (err) { console.log(err) }
//   try{

//   for (let i = 0; i < find_db.recordset.length; i++) {

//     const databasename = find_db.recordset[i].dbname;
//     var session_db = {
//       user: find_db.recordset[i].username,
//       password: find_db.recordset[i].password,
//       server: find_db.recordset[i].server_ip,
//       port: find_db.recordset[i].port_no,
//       database: databasename,
//       options: {
//         encrypt: false,
//         trustServerCertificate: true
//       }
//     }

//     try {
//       const pool = new sql.ConnectionPool(session_db);
//       await pool.connect();
//       const request = new sql.Request(pool);

//       const query = `
//   select distinct * from
//   (SELECT r.*,ru.User_Mob,ru.User_Email FROM reminder_table r join user_tbl ru on ru.User_Code = r.User_id
//   WHERE
//    ( (r.frequency = 'daily' AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') and type=1 ) OR
//     (r.frequency = 'one-time' AND r.date = CONVERT(date, CURRENT_TIMESTAMP) AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') and type = 1) OR
//     (r.frequency = 'monthly' AND DAY(r.date) = DAY(CONVERT(date, CURRENT_TIMESTAMP)) AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') and type=1) OR
//     (r.frequency = 'yearly' AND MONTH(r.date) = MONTH(CONVERT(date, CURRENT_TIMESTAMP)) AND DAY(r.date) = DAY(CONVERT(date, CURRENT_TIMESTAMP) ) ) and type =1 AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm'))AND validity >= CONVERT(date, CURRENT_TIMESTAMP) and ru.export_type<3 and ru.Module_Code=10 and isNull( ru.User_mob,'')<>'') as qy
//   `;

//       const reminder = await sequelize.query(query);

//       if (reminder.recordset) {
//         console.log(reminder.recordset)
//         reminder.recordset.forEach(async (row) => {
//           const reminder_id=row.reminder_id;
//           const recipientNumber = '91' + row.User_Mob;
//           // const time=row.time;

//           // Replace with the recipient's phone number
//           // const message = " Reminder For " + `${row.reminder_name}`;
//           // const apiKey = 'b7bb5cecab0f94922762b271ffec8f04db5437ce';
//           // const instance = 'GXh6SeK9lv45PIC';

// const html = `
// <html>
//   <body>
//     <p>Dear  Sir/Madam,</p>
//     <p>This Mail is To Remind You About ${row.reminder_name}</p>
//     <p>On ${row.time}  .With Description ${row.description}</p>
//     <img src="cid:favicon" alt="Company Favicon">
//   </body>
// </html>
// `;

// sendmail(row.User_Email, `Reminder`, html);

// const other=await sequelize.query(`select email from reminder_emp where reminder_id='${row.reminder_id}'`)

// if(other.recordset.length>0){
//   console.log(other.recordset)

// for(let i=0;i<other.recordset.length;i++){
//   const email=other.recordset[i];
//   if(email.email){
//     sendmail(email.email, `Reminder`, html);

//   }

// }

// }

//         });
//       }

//     } catch (err) {

//       console.log(err) }
//   }
// }catch(e){console.log(e)}

// }

// ///old

// // const schedule = require('node-schedule');

// // // Schedule the task to run every minute
// // const job = schedule.scheduleJob('*/1  * * * *  ', myTask);
// // async function myTask() {
// //   var find_db;

// //   try {
// //     const pool = new sql.ConnectionPool(config);
// //     await pool.connect();
// //     const request = new sql.Request(pool);
// //     find_db = await sequelize.query(`SELECT db_name + year as dbname,* FROM DB_CON WHERE  export_type=1 `);
// //     pool.close();
// //   } catch (err) { console.log(err) }
// //   try{

// //   for (let i = 0; i < find_db.recordset.length; i++) {

// //     const databasename = find_db.recordset[i].dbname;
// //     var session_db = {
// //       user: find_db.recordset[i].username,
// //       password: find_db.recordset[i].password,
// //       server: find_db.recordset[i].server_ip,
// //       port: find_db.recordset[i].port_no,
// //       database: databasename,
// //       options: {
// //         encrypt: false,
// //         trustServerCertificate: true
// //       }
// //     }

// //     try {
// //       const pool = new sql.ConnectionPool(session_db);
// //       await pool.connect();
// //       const request = new sql.Request(pool);

// //       const query = `
// //   select distinct * from
// //   (SELECT r.*,ru.User_Mob FROM reminder_table r join user_tbl ru on ru.User_Code = r.User_id
// //   WHERE
// //    ( (r.frequency = 'daily' AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') and type=1 ) OR
// //     (r.frequency = 'one-time' AND r.date = CONVERT(date, CURRENT_TIMESTAMP) AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') and type = 1) OR
// //     (r.frequency = 'monthly' AND DAY(r.date) = DAY(CONVERT(date, CURRENT_TIMESTAMP)) AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') and type=1) OR
// //     (r.frequency = 'yearly' AND MONTH(r.date) = MONTH(CONVERT(date, CURRENT_TIMESTAMP)) AND DAY(r.date) = DAY(CONVERT(date, CURRENT_TIMESTAMP) ) ) and type =1 AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm'))AND validity >= CONVERT(date, CURRENT_TIMESTAMP) and ru.export_type<3 and ru.Module_Code=10 and isNull( ru.User_mob,'')<>'') as qy
// //   `;

// //       const reminder = await sequelize.query(query);
// //       pool.close();

// //       if (reminder.recordset) {
// //         reminder.recordset.forEach(async (row) => {

// //           const recipientNumber = '91' + row.User_Mob; // Replace with the recipient's phone number
// //           const message = " Reminder For " + `${row.reminder_name}`;
// //           const apiKey = 'b7bb5cecab0f94922762b271ffec8f04db5437ce';
// //           const instance = 'GXh6SeK9lv45PIC';

// //           // Construct the URL with query parameters
// //           const url = `https://app.nationalbulksms.com/api/send-text.php?number=${encodeURIComponent(recipientNumber)}&msg=${encodeURIComponent(message)}&apikey=${apiKey}&instance=${instance}`;
// //           // Send the HTTP GET request
// //           https.get(url, (response) => {
// //             let data = '';

// //             // Handle data received from the response
// //             response.on('data', (chunk) => {
// //               data += chunk;
// //             });

// //             // Handle the end of the response
// //             response.on('end', () => {
// //               if (response.statusCode === 200) {
// //                 console.log('SMS sent successfully:', data);
// //               } else {
// //                 console.error('Error sending SMS:', data);
// //               }
// //             });
// //           }).on('error', (error) => {
// //             console.error('Error sending SMS:', error);
// //           });
// //         });
// //       }

// //     } catch (err) {
// //       console.log('hisefjkdskjdfkbdfjvdksdjksdkjvdskjdskvdskbjsdvjbkd')
// //       console.log(err) }
// //   }
// // }catch(e){console.log(e)}

// // }
