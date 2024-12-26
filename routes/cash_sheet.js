const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const axios = require("axios");
const { SendWhatsAppMessgae } = require("./user");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
let otpStorage;
const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
const fs = require('fs');

pdfMake.vfs = pdfFonts?.pdfMake?.vfs;







exports.savecashsheet = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.formData;
    console.log(data, "datadata");

    try {
        // Step 1: Check if the entry already exists
        const existingEntryQuery = `
            SELECT * FROM CASH_SHEET 
            WHERE Acnt_Date = :Acnt_Date AND Loc_Code = :Loc_Code and user_code = :user_code
        `;

        const existingEntry = await sequelize.query(existingEntryQuery, {
            replacements: {
                Acnt_Date: data.Acnt_Date,
                Loc_Code: data.Loc_Code,
                user_code: data.user_code
            },
            type: sequelize.QueryTypes.SELECT,
            transaction: t
        });

        // Step 2: If it exists, update the export_type
        if (existingEntry.length > 0) {
            const updateQuery = `
                UPDATE CASH_SHEET 
                SET export_type = 33 
                WHERE Acnt_Date = :Acnt_Date AND Loc_Code = :Loc_Code and user_code = :user_code
            `;
            await sequelize.query(updateQuery, {
                replacements: {
                    Acnt_Date: data.Acnt_Date,
                    Loc_Code: data.Loc_Code,
                    user_code: data.user_code
                },
                transaction: t
            });
        }

        // Step 3: Insert the new entry
        const insertCashSheetQuery = `
            INSERT INTO CASH_SHEET (
                user_code, Loc_Code, Cash_Ledg, Acnt_Date, Opening_Bal, 
                Cash_Receipt, Cash_Payment,bank_deposit, Closing_Bal, Physical_Bal, 
                Cash_Short, Cash_Access, Note_2000, Note_500, Note_200, 
                Note_100, Note_50, Note_20, Note_10, Note_5, Note_2, 
                Note_1, Qty_2000, Qty_500, Qty_200, Qty_100, 
                Qty_50, Qty_20, Qty_10, Qty_5, Qty_2, 
                Qty_1, Remark, Day_Close, Close_Time, CSI_Receipt, 
                BC_Receipt, export_type
            ) VALUES (
                :user_code, :Loc_Code, :Cash_Ledg, :Acnt_Date, :Opening_Bal, 
                :Cash_Receipt, :Cash_Payment,:bank_deposit, :Closing_Bal, :Physical_Bal, 
                :Cash_Short, :Cash_Access, :Note_2000, :Note_500, :Note_200, 
                :Note_100, :Note_50, :Note_20, :Note_10, :Note_5, :Note_2, 
                :Note_1, :Qty_2000, :Qty_500, :Qty_200, :Qty_100, 
                :Qty_50, :Qty_20, :Qty_10, :Qty_5, :Qty_2, 
                :Qty_1, :Remark, :Day_Close, :Close_Time, :CSI_Receipt, 
                :BC_Receipt, :export_type
            )
        `;

        const replacements = {
            user_code: Number(data.user_code) || 0,
            Loc_Code: data.Loc_Code || 0,
            Cash_Ledg: data.Cash_Ledg || '',
            Acnt_Date: data.Acnt_Date || null,
            Opening_Bal: data.Opening_Bal || 0,
            Cash_Receipt: data.Cash_Receipt || 0,
            Cash_Payment: data.Cash_Payment || 0,
            bank_deposit: data.bank_deposit || 0,
            Closing_Bal: data.Closing_Bal || 0,
            Physical_Bal: data.Physical_Bal || 0,
            Cash_Short: data.Cash_Short || 0,
            Cash_Access: data.Cash_Access || 0,
            Note_2000: data.Note_2000 || 0,
            Note_500: data.Note_500 || 0,
            Note_200: data.Note_200 || 0,
            Note_100: data.Note_100 || 0,
            Note_50: data.Note_50 || 0,
            Note_20: data.Note_20 || 0,
            Note_10: data.Note_10 || 0,
            Note_5: data.Note_5 || 0,
            Note_2: data.Note_2 || 0,
            Note_1: data.Note_1 || 0,
            Qty_2000: data.Qty_2000 || 0,
            Qty_500: data.Qty_500 || 0,
            Qty_200: data.Qty_200 || 0,
            Qty_100: data.Qty_100 || 0,
            Qty_50: data.Qty_50 || 0,
            Qty_20: data.Qty_20 || 0,
            Qty_10: data.Qty_10 || 0,
            Qty_5: data.Qty_5 || 0,
            Qty_2: data.Qty_2 || 0,
            Qty_1: data.Qty_1 || 0,
            Remark: data.Remark || '',
            Day_Close: data.Day_Close || 0,
            Close_Time: data.Close_Time || null,
            CSI_Receipt: data.CSI_Receipt || 0,
            BC_Receipt: data.BC_Receipt || 0,
            export_type: 1,
        };

        await sequelize.query(insertCashSheetQuery, {
            replacements,
            transaction: t
        });

        await t.commit();
        res.status(200).send({
            Status: 'true',
            Message: "Success",
            Result: null
        });

    }
    catch (e) {
        console.error(e);
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null
        });
    } finally {
        if (sequelize) {
            try {
                await sequelize.close();
            } catch (closeError) {
                console.error("Error closing sequelize:", closeError);
            }
        }
    }
};









exports.getClosingBal = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const Loc_Code = req.body.loc_code
    const User_Code = req.body.user_code
    try {
        const results = await sequelize.query(
            `SELECT TOP 1 Closing_Bal 
FROM cash_sheet 
WHERE Loc_Code = ${Loc_Code} 
and user_code= ${User_Code}
and export_type=1
ORDER BY Acnt_Date DESC`
        );

        if (results[0].length > 0) {
            res.send({
                Status: "true",
                Message: "Success",
                Result: results[0][0]
            });
        } else {
            res.send({
                Status: "false",
                Message: "No data found",
                Result: null
            });
        }
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



exports.sendOtp = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const empcode = req.body.empcode;
    console.log(empcode, "datadatadata")
    try {
        //     const existingDateQuery = `
        //     SELECT COUNT(*) as count FROM CASH_SHEET WHERE Acnt_Date = :Acnt_Date
        // `;
        // const existingDateResult = await sequelize.query(existingDateQuery, {
        //     replacements: { Acnt_Date: data.Acnt_Date },
        //     transaction: t
        // });
        // const exists = existingDateResult[0][0].count > 0;
        // if (exists) {
        //     return res.status(200).send({
        //         Status: 'false',
        //         Message: "Data with the same account date already exists",
        //         Result: null
        //     });
        // }
        const otp = crypto.randomInt(100000, 999999).toString();
        const comapny = await sequelize.query(`select comp_name from comp_mst`);
        const MOBILE = await sequelize.query(` select MOBILENO from EMPLOYEEMASTER WHERE EMPCODE ='${empcode}'`);

        console.log(MOBILE[0][0].MOBILENO, "MOBILE[0][0].MOBILENOMOBILE[0][0].MOBILENO")
        const a = MOBILE[0][0].MOBILENO

        console.log(a, "dvsdfdsfmobile")
        const ab = await SendWhatsAppMessgae(req.headers.compcode,
            a,
            "msg_code_2",
            [
                {
                    type: "text",
                    text: otp,
                },
                {
                    type: "text",
                    text: comapny[0][0].comp_name,
                },
            ]
        );
        console.log(ab, "abbabaabs")
        res.status(200).send({
            Status: "true",
            Message: "OTP generated successfully",
            Otp: otp
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message
        });
    }
};




exports.getreport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const Loc_Code = req.body.loc_code;
    const user_code = req.body.user_code;
    const dateFrom = req.body.dateFrom; // Make sure these are in the correct format (YYYY-MM-DD)
    const dateTo = req.body.dateTo;

    try {
        const results = await sequelize.query(
            `SELECT *
             FROM cash_sheet 
             WHERE Loc_Code = :Loc_Code 
             and user_code = :user_code
             AND export_type = 1 
             AND Acnt_Date BETWEEN :dateFrom AND :dateTo`,
            {
                replacements: { Loc_Code, dateFrom, dateTo, user_code },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (results.length > 0) {
            res.send({
                Status: "true",
                Message: "Success",
                Result: results // Return all results instead of just the first one
            });
        } else {
            res.send({
                Status: "false",
                Message: "No data found",
                Result: null
            });
        }
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


exports.getupdatedreport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const Loc_Code = req.body.loc_code;
    const user_code = req.body.user_code;
    const acnt_date = req.body.acnt_date;
    try {
        const results = await sequelize.query(
            `SELECT *
             FROM cash_sheet 
             WHERE Loc_Code = :Loc_Code 
             and user_code = :user_code
             AND export_type = 33 and
             acnt_date = :acnt_date
              `,
            {
                replacements: { Loc_Code, acnt_date, user_code },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (results.length > 0) {
            res.send({
                Status: "true",
                Message: "Success",
                Result: results
            });
        } else {
            res.send({
                Status: "false",
                Message: "No data found",
                Result: null
            });
        }
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

exports.getceobranchreport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const date = req.body.date;
    console.log(req.body, "req.body");

    try {
        const results = await sequelize.query(
            `SELECT loc_code, 
                    SUM(Opening_Bal) AS total_opening_bal, 
                    SUM(cash_receipt) AS total_cash_receipt,
                    SUM(cash_payment) AS total_cash_payment,
                    SUM(closing_bal) AS total_closing_bal,
                    SUM(physical_bal) AS total_physical_bal,
                    SUM(cash_short) AS total_cash_short,
                    SUM(bank_deposit) AS total_bank_deposite
             FROM cash_sheet 
             WHERE export_type = 1 
             AND acnt_date = :date
             GROUP BY loc_code`,
            {
                replacements: { date },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (results.length > 0) {
            res.send({
                Status: "true",
                Message: "Success",
                Result: results
            });
        } else {
            res.send({
                Status: "false",
                Message: "No data found",
                Result: null
            });
        }
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

exports.getceoledgerreport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const date = req.body.date;

    try {
        // Step 1: Fetch cash sheet results with user_name using JOIN
        const results = await sequelize.query(
            `SELECT cs.*, ut.user_name 
             FROM cash_sheet cs
             JOIN user_tbl ut ON cs.user_code = ut.user_code 
             WHERE cs.export_type = 1 
             AND ut.export_type = 1 
             AND ut.module_code = 10 
             AND cs.acnt_date = :date
             ORDER BY cs.loc_code ASC`,
            {
                replacements: { date },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (results.length > 0) {
            // Step 2: Transform results into an object keyed by loc_code
            const groupedResults = results.reduce((acc, item) => {
                const locCode = item.loc_code;
                if (!acc[locCode]) {
                    acc[locCode] = [];
                }
                acc[locCode].push(item);
                return acc;
            }, {});

            res.send({
                Status: "true",
                Message: "Success",
                Result: groupedResults.undefined
            });
        } else {
            res.send({
                Status: "false",
                Message: "No data found",
                Result: null
            });
        }
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




exports.sendEmailtoceo = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const date = new Date().toISOString().split('T')[0];

    const subject = "Daily Cash Sheet Updation";
    // const to = 'umeshkumawatsir@gmail.com';



    try {
        const results = await sequelize.query(
            `SELECT loc_code,
            ( SELECT 
             Godw_Name AS label
             FROM 
             Godown_Mst 
              WHERE 
             Export_Type < 3 
             and Godw_Code=loc_code)as branch ,
                    SUM(Opening_Bal) AS total_opening_bal, 
                    SUM(cash_receipt) AS total_cash_receipt,
                    SUM(cash_payment) AS total_cash_payment,
                    SUM(closing_bal) AS total_closing_bal,
                    SUM(physical_bal) AS total_physical_bal,
                    SUM(cash_short) AS total_cash_short,
                    SUM(bank_deposit) AS total_bank_deposite
             FROM cash_sheet 
             WHERE export_type = 1 
             AND acnt_date = :date
             GROUP BY loc_code`,
            {
                replacements: { date },
                type: sequelize.QueryTypes.SELECT,
            }
        );
        const company = await sequelize.query(`SELECT Comp_Name, City,State FROM comp_mst`);
        const companyName = company[0][0].Comp_Name || 'Company name';
        const companycity = company[0][0].City || ' Company city';
        const companystate = company[0][0].State || 'Company state';

        // console.log(company,"companycompany")
        function formatCurrency(value) {
            if (value === null || value === undefined) return '0.00';
            return parseFloat(value).toFixed(2); // Ensures two decimal places
        }




        const docDefinition = {
            content: [
                {
                    text: companyName,
                    style: 'headerCentered',
                    alignment: 'center',
                    margin: [0, 20, 0, 5]
                },
                {
                    text: `${companycity}, ${companystate}`,
                    style: 'subHeader',
                    alignment: 'center',
                    margin: [0, 0, 0, 10]
                },
                {
                    table: {
                        widths: ['*', 'auto'], // Flexible width for header and fixed for date
                        body: [
                            [
                                {
                                    text: 'Daily Cash Sheet Report',
                                    style: 'header',
                                    margin: [0, 0, 0, 10]
                                },
                                {
                                    text: `Date: ${date}`,
                                    style: 'dateText',
                                    alignment: 'right',
                                    margin: [0, 0, 0, 10]
                                }
                            ]
                        ]
                    },
                    layout: 'noBorders' // To remove borders around the table
                },
                {
                    style: 'tableExample',
                    table: {
                        headerRows: 1,
                        widths: ['23%', '11%', '11%', '11%', '11%', '11%', '11%', '11%'],
                        body: [
                            [
                                { text: 'Branch', style: 'tableHeader' },
                                { text: 'Opening Balance', style: 'tableHeader', alignment: 'right' },
                                { text: 'Cash Receipt', style: 'tableHeader', alignment: 'right' },
                                { text: 'Cash Payment', style: 'tableHeader', alignment: 'right' },
                                { text: 'Bank Deposit', style: 'tableHeader', alignment: 'right' },
                                { text: 'Closing Balance', style: 'tableHeader', alignment: 'right' },
                                { text: 'Physical Balance', style: 'tableHeader', alignment: 'right' },
                                { text: 'Cash Short', style: 'tableHeader', alignment: 'right' }
                            ],
                            ...results.map(result => [
                                { text: result.branch, style: 'tableData' },
                                { text: formatCurrency(result.total_opening_bal), style: 'tableData', alignment: 'right' },
                                { text: formatCurrency(result.total_cash_receipt), style: 'tableData', alignment: 'right' },
                                { text: formatCurrency(result.total_cash_payment), style: 'tableData', alignment: 'right' },
                                { text: formatCurrency(result.total_closing_bal), style: 'tableData', alignment: 'right' },
                                { text: formatCurrency(result.total_physical_bal), style: 'tableData', alignment: 'right' },
                                { text: formatCurrency(result.total_bank_deposite), style: 'tableData', alignment: 'right' },
                                { text: formatCurrency(result.total_cash_short), style: 'tableData', alignment: 'right' }
                            ])
                        ]
                    },
                    layout: {
                        hLineWidth: function (i, node) { return 1; },
                        vLineWidth: function (i, node) { return 1; },
                        hLineColor: function (i, node) { return 'black'; },
                        vLineColor: function (i, node) { return 'black'; },
                        paddingLeft: function (i, node) { return 4; },
                        paddingRight: function (i, node) { return 4; },
                        paddingTop: function (i, node) { return 4; },
                        paddingBottom: function (i, node) { return 4; }
                    }
                }
            ],
            styles: {
                headerCentered: {
                    fontSize: 16,
                    bold: true,
                },
                subHeader: {
                    fontSize: 12,
                },
                header: {
                    fontSize: 14,
                    bold: true,
                    margin: [0, 20, 0, 8]
                },
                dateText: {
                    fontSize: 10,
                },
                tableHeader: {
                    bold: true,
                    fontSize: 9,
                    color: 'black'
                },
                tableData: {
                    fontSize: 8,
                    margin: [0, 2, 0, 2]
                },
                tableExample: {
                    margin: [0, 5, 0, 10]
                }
            }
        };

        // Function to format the date




        const pdfDoc = pdfMake.createPdf(docDefinition);
        const tempPdfFilePath = './tempCashSheet.pdf';

        pdfDoc.getBuffer((buffer) => {
            fs.writeFileSync(tempPdfFilePath, buffer);
        });

        // Main email content
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Daily Cash Sheet Report</title>
            </head>
            <body>
              <div>
                <h2>Daily Cash Sheet Report</h2>
                <p>Dear [CEO's Name],</p>
                <p>I hope this message finds you well.</p>
                <p>Attached is the daily cash sheet report for your review. This report provides an overview of our cash flow and financial status as of ${date}.</p>
                <p>Please let me know if you have any questions or need further information.</p>
                <div class="footer">
                  <p>Best regards,<br>${companyName}</p>
                </div>
              </div>
            </body>
            </html>
        `;

        await sendEmail(to, subject, htmlContent, tempPdfFilePath);
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

async function sendEmail(toEmail, subject, htmlContent, attachmentPath) {
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "uk9468698254@gmail.com",
                pass: "jcqa xolr augk ichu", // Use environment variables for sensitive data
            },
        });

        let mailOptions = {
            from: "uk9468698254@gmail.com",
            to: toEmail,
            subject: subject,
            html: htmlContent,
            attachments: [
                {
                    filename: 'cash_sheet_report.pdf',
                    path: attachmentPath, // Attach the PDF file
                }
            ]
        };

        let info = await transporter.sendMail(mailOptions);
        fs.unlinkSync(attachmentPath); // Optionally, delete the temporary file after sending the email
        console.log('Email sent:', info.response);
    } catch (error) {
        console.error("Error occurred while sending email:", error);
        throw error;
    }
}



