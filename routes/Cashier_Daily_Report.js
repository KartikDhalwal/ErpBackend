const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const axios = require("axios");
const nodemailer = require('nodemailer');
const { SendWhatsAppMessgae } = require("./user");




// exports.getData = async function (req, res) {
//     const sequelize = await dbname(req.headers.compcode);
//     console.log(req.body, "bodyyyyyy");

//     const { Date, loc_code, user_code } = req.body;

//     try {




//         // const [Opening_Bal] = await sequelize.query(
//         //     `SELECT TOP 1 Closing_Bal 
//         //      FROM Daily_Cash_sum 
//         //      WHERE Loc_Code = ${loc_code} 
//         //      and user_code= ${user_code}
//         //      and export_type=1
//         //      ORDER BY Tran_Date DESC`
//         // );
//         // console.log(Opening_Bal[0]?.Closing_Bal,"Opening_Bal[0].Closing_Bal,")



//         const results = await sequelize.query(
//             `SELECT 
//                 D.Tran_Id, 
//                 D.loc_code,
//                 D.Tran_Type, 
//                 D.Bill_No, 
//                 D.Bill_Date, 
//                 D.Engine AS Job_No, 
//                 D.VIN AS Service_Type, 
//                 D.Chassis AS Reg_No, 
//                 D.Ledger_Name, 
//                 D.Inv_Amt AS Bill_Amt, 
//                 D.Inv_Amt - ISNULL(A.Post_Amt, 0) AS Credit, 
//                 A.DMS_ref1 AS Rcpt_No, 
//                 A.Post_Amt AS Rcpt_Amt, 
//                 (SELECT TOP 1 Misc_Name 
//                  FROM Misc_Mst 
//                  WHERE Misc_Type = 39 
//                    AND Misc_Mst.Export_Type < 3 
//                    AND Misc_Code = ISNULL(A.Cost_Cntr, 0)) AS Pymt_Mode
//             FROM 
//                 (SELECT DISTINCT 
//                     DMS_ROW_DATA.Tran_Id, 
//                     DMS_ROW_DATA.loc_code,
//                     DMS_ROW_DATA.Tran_Type, 
//                     DMS_ROW_DATA.Bill_No, 
//                     DMS_ROW_DATA.Bill_Date, 
//                     DMS_ROW_DATA.Engine, 
//                     DMS_ROW_DATA.VIN, 
//                     DMS_ROW_DATA.Chassis, 
//                     DMS_ROW_DATA.Ledger_Name, 
//                     DMS_ROW_DATA.Inv_Amt 
//                  FROM DMS_ROW_DATA 
//                  INNER JOIN Misc_Mst ON Misc_Mst.Misc_Type = 56 
//                                      AND Misc_Mst.Misc_Num1 = 2 
//                                      AND Misc_Mst.Misc_Code = DMS_ROW_DATA.Tran_Type
//                  WHERE DMS_ROW_DATA.Bill_Date = :date
//                    AND DMS_ROW_DATA.loc_code = :locCode
//                    AND DMS_ROW_DATA.Tran_Type NOT IN (13, 14) 
//                    AND ISNULL(DMS_ROW_DATA.Export_Type, 0) IN (1, 2)
//                 ) D
//             LEFT JOIN 
//                 (SELECT 
//                     Bill_Ref, 
//                     DMS_ref1, 
//                     Post_Amt, 
//                     Cost_Cntr 
//                  FROM Acnt_Post 
//                  WHERE Acnt_Type = 1 
//                    AND Loc_Code = :locCode
//                    AND Acnt_Date = :date
//                    AND seq_no = 1
//                 ) A ON D.Bill_No = A.Bill_Ref
//             ORDER BY 
//                 D.Tran_Type, 
//                 D.Bill_No;`,
//             {
//                 replacements: { date: Date, locCode: loc_code },
//                 type: sequelize.QueryTypes.SELECT,
//             }
//         );


//         const results1 = await sequelize.query(
//             `SELECT Acnt_Id, USR_CODE, Seq_No, acnt_no, acnt_date, Bill_Ref AS Bill_No,
//             DMS_ref1 AS Rcpt_No, Post_Amt AS Rcpt_Amt,
//             (SELECT TOP 1 Misc_Name FROM Misc_Mst 
//              WHERE Misc_Type = 39 
//              AND Misc_Mst.Export_Type < 3 
//              AND Misc_Code = ISNULL(Cost_Cntr, 0)) AS Pymt_Mode,
//              (select top 1 Ledg_Name from ledg_mst where ledg_code=ledg_ac and ledg_mst.Export_Type<3 ) as Ledger_Name
//             FROM Acnt_Post X
//             WHERE Acnt_Type = 1 
//             AND Loc_Code = :locCode
//             AND Acnt_Date = :date 
//             AND Seq_No = 2 
//             AND X.Acnt_Id IN (
//                 SELECT Acnt_Id 
//                 FROM Acnt_Post 
//                 WHERE Acnt_Type = 1 
//                 AND Loc_Code = :locCode 
//                 AND Acnt_Date = :date 
//                 AND Seq_No = 2
//                 AND Bill_Ref NOT IN (
//                     SELECT DISTINCT Bill_No 
//                     FROM DMS_ROW_DATA, Misc_Mst 
//                     WHERE Misc_Type = 56 
//                     AND Misc_Num1 = 2 
//                     AND Misc_Code = Tran_Type 
//                     AND Bill_Date = :date 
//                     AND DMS_ROW_DATA.loc_code = :locCode 
//                     AND Tran_Type NOT IN (13, 14) 
//                     AND ISNULL(DMS_ROW_DATA.Export_Type, 0) IN (1, 2)
//                 )
//             )`,
//             {
//                 replacements: { date:Date, locCode:loc_code },
//                 type: sequelize.QueryTypes.SELECT,
//             }
//         );


//         res.send({
//             Status: "true",
//             Message: "Success",
//             Result: results,
//             old:results1,
//             // Opening_Bal: Opening_Bal[0].Closing_Bal,

//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).send({
//             Status: "false",
//             Message: "Error occurred",
//             Error: err.message,
//         });
//     } finally {
//         await sequelize.close();
//     }
// };




exports.getData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body, "bodyyyyyy");

    const { Date, loc_code, user_code } = req.body;

    try {


        const [results3] = await sequelize.query(
            `SELECT top 1 Closing_Bal 
             FROM Daily_Cash_sum 
             WHERE Loc_Code = ${loc_code} 
             AND user_code = ${user_code} 
             AND export_type = 1
             ORDER BY Tran_Date DESC`
        );

        const Opening_Bal = results3.length > 0 ? results3[0].Closing_Bal : 0;


        const results = await sequelize.query(
            `SELECT 
                ROW_NUMBER() OVER (ORDER BY (select null)) AS Sl_No,
                D.Tran_Id, 
                D.loc_code,
                D.Tran_Type, 
                D.Bill_No, 
                D.Bill_Date, 
                D.Engine AS Job_No, 
                D.VIN AS Service_Type, 
                D.Chassis AS Reg_No, 
                D.Ledger_Name, 
                D.Inv_Amt AS Bill_Amt, 
                D.Inv_Amt - ISNULL(A.Post_Amt, 0) AS Credit, 
                A.DMS_ref1 AS Rcpt_No, 
                A.Post_Amt AS Rcpt_Amt, 
                (SELECT TOP 1 Misc_Name 
                 FROM Misc_Mst 
                 WHERE Misc_Type = 39 
                   AND Misc_Mst.Export_Type < 3 
                   AND Misc_Code = ISNULL(A.Cost_Cntr, 0)) AS Pymt_Mode
            FROM 
                (SELECT DISTINCT 
                    DMS_ROW_DATA.Tran_Id, 
                    DMS_ROW_DATA.loc_code,
                    DMS_ROW_DATA.Tran_Type, 
                    DMS_ROW_DATA.Bill_No, 
                    DMS_ROW_DATA.Bill_Date, 
                    DMS_ROW_DATA.Engine, 
                    DMS_ROW_DATA.VIN, 
                    DMS_ROW_DATA.Chassis, 
                    DMS_ROW_DATA.Ledger_Name, 
                    DMS_ROW_DATA.Inv_Amt 
                 FROM DMS_ROW_DATA 
                 INNER JOIN Misc_Mst ON Misc_Mst.Misc_Type = 56 
                                     AND Misc_Mst.Misc_Num1 = 2 
                                     AND Misc_Mst.Misc_Code = DMS_ROW_DATA.Tran_Type
                 WHERE DMS_ROW_DATA.Bill_Date = :date
                   AND DMS_ROW_DATA.loc_code = :locCode
                   AND DMS_ROW_DATA.Tran_Type NOT IN (13, 14) 
                   AND ISNULL(DMS_ROW_DATA.Export_Type, 0) IN (1, 2)
                ) D
            LEFT JOIN 
                (SELECT 
                    Bill_Ref, 
                    DMS_ref1, 
                    Post_Amt, 
                    Cost_Cntr 
                 FROM Acnt_Post 
                 WHERE Acnt_Type = 1 
                   AND Loc_Code = :locCode
                   AND Acnt_Date = :date
                   AND seq_no = 1
                ) A ON D.Bill_No = A.Bill_Ref
            ORDER BY Sl_No,
                D.Tran_Type, 
                D.Bill_No `,
            {
                replacements: { date: Date, locCode: loc_code },
                type: sequelize.QueryTypes.SELECT,
            }
        );


        const results1 = await sequelize.query(
            `SELECT 
            ROW_NUMBER() OVER (ORDER BY Bill_Ref) AS Sl_No,
            Acnt_Id, USR_CODE, Seq_No, acnt_no, acnt_date, Bill_Ref AS Bill_No,
            DMS_ref1 AS Rcpt_No, Post_Amt AS Rcpt_Amt,
            (SELECT TOP 1 Misc_Name FROM Misc_Mst 
             WHERE Misc_Type = 39 
             AND Misc_Mst.Export_Type < 3 
             AND Misc_Code = ISNULL(Cost_Cntr, 0)) AS Pymt_Mode
            FROM Acnt_Post X
            WHERE Acnt_Type = 1 
            AND Loc_Code = :locCode
            AND Acnt_Date = :date 
            AND Seq_No = 2 
            AND X.Acnt_Id IN (
                SELECT Acnt_Id 
                FROM Acnt_Post 
                WHERE Acnt_Type = 1 
                AND Loc_Code = :locCode 
                AND Acnt_Date = :date 
                AND Seq_No = 2
                AND Bill_Ref NOT IN (
                    SELECT DISTINCT Bill_No 
                    FROM DMS_ROW_DATA, Misc_Mst 
                    WHERE Misc_Type = 56 
                    AND Misc_Num1 = 2 
                    AND Misc_Code = Tran_Type 
                    AND Bill_Date = :date 
                    AND DMS_ROW_DATA.loc_code = :locCode 
                    AND Tran_Type NOT IN (13, 14) 
                    AND ISNULL(DMS_ROW_DATA.Export_Type, 0) IN (1, 2) 
                )
            ) order by Sl_No `,
            {
                replacements: { date: Date, locCode: loc_code },
                type: sequelize.QueryTypes.SELECT,
            }
        );


        res.send({
            Status: "true",
            Message: "Success",
            Result: results,
            old: results1,
            Opening_Bal: Opening_Bal,

        });
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred",
            Error: err.message,
        });
    } finally {
        await sequelize.close();
    }
};





exports.insertData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const data = req.body.mergedRecords;
    const formData = req.body.formData;
    console.log(formData);
    const t = await sequelize.transaction();
    try {
        const t = await sequelize.transaction();
        const [existingRecord] = await sequelize.query(
            `SELECT COUNT(*) AS count FROM Daily_Cash_Sum WHERE Tran_Date = '${formData?.Date}' and loc_code = ${formData?.loc_code}`,
        );
        console.log(existingRecord, "existingRecord")
        if (existingRecord[0].count > 0) {
            return res.status(200).send({
                Status: "false",
                Message: `Data for date ${formData.Tran_Date} already exists. Insertion aborted.`
            });
        } else {

            const [UID] = await sequelize.query('SELECT isnull(max(UID)+1,1) AS UID from Daily_Cash_Sum');
            await sequelize.query(
                `INSERT INTO Daily_Cash_Sum (
                UID, Loc_code, user_code, Tran_Date, Opening_Bal, 
                Today_Coll, Cash_to_bank, Cash_to_petty_cash, Payment_voucher, 
                Closing_Bal, Books_Closing_Bal, Diffe_Bal, export_type
            ) VALUES (
                :UID, :Loc_code, :user_code, :Tran_Date, :Opening_Bal, 
                :Today_Coll, :Cash_to_bank, :Cash_to_petty_cash, :Payment_voucher, 
                :Closing_Bal, :Books_Closing_Bal, :Diffe_Bal, :export_type  
            )`,
                {
                    replacements: {
                        UID: UID[0].UID,
                        Loc_code: formData.loc_code || null,
                        user_code: formData.user_id || null,
                        Tran_Date: formData.Tran_Date || null,
                        Opening_Bal: formData.Opening_Bal || null,
                        Today_Coll: formData.Today_Coll || null,
                        Cash_to_bank: formData.Cash_to_bank || null,
                        Cash_to_petty_cash: formData.Cash_to_petty_cash || null,
                        Payment_voucher: formData.Payment_voucher || null,
                        Closing_Bal: formData.Closing_Bal || null,
                        Books_Closing_Bal: formData.Books_Closing_Bal || null,
                        Diffe_Bal: formData.Diffe_Bal || null,
                        Tran_Date: formData.Date || null,
                        export_type: 1
                    }
                }
            );

            const batchSize = 100; // Size of each batch
            const totalBatches = Math.ceil(data.length / batchSize); // Calculate the number of batches

            for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
                // Get a slice of the data for the current batch
                const batchData = data.slice(batchIndex * batchSize, (batchIndex + 1) * batchSize);

                // Construct the SQL query with placeholders for values
                const insertQuery = `
                INSERT INTO Daily_Cash (
                    Bill_Amt, Bill_Date, Bill_No, Cash, Credit, Job_No, Ledger_Name,
                    Pymt_Mode, Rcpt_Amt, Rcpt_No, Reg_No, Service_Type,
                    Tran_Date, Tran_Id, Type, UID, Loc_Code, user_code
                ) VALUES
                ${batchData.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ')}
            `;

                // Flatten the batch data into a single array for query replacements
                const values = batchData.flatMap(record => [
                    record.Bill_Amt || null,
                    record.Bill_Date || null,
                    record.Bill_No || null,
                    record.Cash || null,
                    record.Credit || null,
                    record.Job_No || null,
                    record.Ledger_Name || null,
                    record.Pymt_Mode || null,
                    record.Rcpt_Amt || null,
                    record.Rcpt_No || null,
                    record.Reg_No || null,
                    record.Service_Type || null,
                    record.Tran_Date || null,
                    record.Tran_Id || null,
                    record.Type || null,
                    record.UID || null,
                    record.loc_code || null,
                    record.user_code || null
                ]);

                // Perform the batch insert
                await sequelize.query(insertQuery, {
                    replacements: values
                });

                console.log(`Batch ${batchIndex + 1} of ${totalBatches} inserted successfully.`);
            }

            res.send({
                Status: "true",
                Message: "Data inserted successfully in batches"
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({
            Status: "false",
            Message: "Error occurred during data insertion",
            Error: err.message
        });
    } finally {
        await sequelize.close();
    }
};





exports.view = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const date = req.body.date;
    console.log(req.body, "req.body");

    try {
        const results = await sequelize.query(
            ` 
             
             
             SELECT 
    loc_code, 
    SUM(Opening_Bal) AS Opening_Bal, 
    SUM(today_coll) AS today_coll,   
    SUM(cash_to_bank) AS cash_to_bank,
    SUM(cash_to_petty_cash) AS cash_to_petty_cash,
    SUM(payment_voucher) AS payment_voucher,
    SUM(closing_bal) AS closing_bal, 
    SUM(books_closing_bal) AS books_closing_bal, 
    SUM(diffe_bal) AS diffe_bal     
FROM 
    daily_cash_sum
WHERE 
    export_type = 1
    AND tran_date = :date
GROUP BY 
    loc_code;
`,
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




























