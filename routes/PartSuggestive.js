const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const axios = require("axios");
const nodemailer = require('nodemailer');
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");

exports.branch = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const branch = await sequelize.query(`SELECT 
            CAST(Godw_Code AS VARCHAR) AS value,
            Godw_Name AS label
           FROM 
            Godown_Mst 
           WHERE 
            Export_Type < 3 
           ORDER BY 
            Godw_Code`);
        // console.log(branch[0],"ledgerledgerledger")
        res.send({
            Status: "true",
            Message: "Success",
            Result: { Branch: branch[0] }
        });
    } catch (err) {
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
};

exports.minstockexcelimport = async function (req, res, next) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    console.log(req.body);
    const excelFile = req.files["excel"][0];

    if (!excelFile) {
        await sequelize.close();
        return res.status(400).send({ Message: "No file uploaded" });
    }

    const workbook = xlsx.read(excelFile.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    // console.log(transformedData, "transformedData");

    try {
        const [results] = await sequelize.query(
            `SELECT COALESCE(MAX(tran_id), 0) AS maxno FROM Part_MinStock`
        );
        console.log(results[0], "resultsresults");
        const newtran_id = results[0].maxno + 1;

        await sequelize.query(
            `UPDATE Part_MinStock 
             SET Export_Type = 33 
             WHERE Br_Code = :Br_Code`,
            {
                replacements: {
                    Br_Code: req.body.branch
                },
                transaction: t
            }
        );

        const BATCH_SIZE = 1000; // Define your batch size
        let batchCount = Math.ceil(transformedData.length / BATCH_SIZE);
        try {
            for (let i = 0; i < batchCount; i++) {
                const batchStart = i * BATCH_SIZE;
                const batchEnd = batchStart + BATCH_SIZE;
                const dataBatch = transformedData.slice(batchStart, batchEnd).map((item, index) => ({
                    TRAN_ID: newtran_id,
                    Export_Type: 1,
                    Create_By: req.body.Create_By,
                    Br_Code: req.body.branch,
                    Part_No: item.Part_No || null,
                    Descr: item.Descr || null,
                    Min_Stock_Qty: item.Min_Stock_Qty || null,
                    srno: index + 1 // Assuming you want a unique srno for each item
                }));

                // Construct the VALUES part of the query
                const values = dataBatch.map(item => `(:TRAN_ID_${item.srno}, :Part_No_${item.srno}, :Descr_${item.srno}, :Min_Stock_Qty_${item.srno}, :Br_Code_${item.srno}, :Export_Type_${item.srno}, :srno_${item.srno}, :Create_By_${item.srno})`).join(', ');
                
                // Create the replacements object
                const replacements = {};
                dataBatch.forEach(item => {
                    replacements[`TRAN_ID_${item.srno}`] = item.TRAN_ID;
                    replacements[`Part_No_${item.srno}`] = item.Part_No;
                    replacements[`Descr_${item.srno}`] = item.Descr;
                    replacements[`Min_Stock_Qty_${item.srno}`] = item.Min_Stock_Qty;
                    replacements[`Br_Code_${item.srno}`] = item.Br_Code;
                    replacements[`Export_Type_${item.srno}`] = item.Export_Type;
                    replacements[`srno_${item.srno}`] = item.srno;
                    replacements[`Create_By_${item.srno}`] = item.Create_By;
                });

                await sequelize.query(
                    `INSERT INTO Part_MinStock (TRAN_ID, Part_No, Descr, Min_Stock_Qty, Br_Code, Export_Type, srno, Create_By)
                    VALUES ${values}`,
                    {
                        replacements: replacements,
                        transaction: t
                    }
                );

                console.log(`Inserted batch ${i + 1} with ${dataBatch.length} items`);
            }

            await t.commit(); // Commit the transaction

            // Send only the top 10 transformed data
            const resultData = transformedData.slice(0, 10);

            res.send({
                Status: "true",
                Message: "Success",
                Result: resultData // Send only the top 10 entries
            });
        } catch (error) {
            await t.rollback();
            console.error('Transaction rolled back due to error:', error);
            res.status(500).send({ Message: "Error inserting data" });
        }
    } catch (error) {
        await t.rollback(); // Rollback the transaction in case of error
        console.error("Error inserting data:", error);
        res.status(500).send({ Message: "Error inserting data" });
    } finally {
        await sequelize.close(); // Close the database connection
        console.log('Database connection closed');
    }
};


exports.minStockImportFormat = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        let reportName = "Item Master Excel Import";
        const Headeres = ['ITEM_CODE', 'ITEM_NAME', 'ITEM_CAT', 'BIN_LOC', 'HSN', 'ITEM_TYPE', 'GST_RATE', 'PRE_VENDOR', 'DLR_PRICE', 'PURCH_PRICE', 'MRP_PRICE', 'SALE_PRICE', 'OLD_PRICE', 'UOM', 'ALLOW_DECIMAL', 'CLASSIFICATION'];
        const Headeres2 = ['ITEM TYPE', 'Allow Decimal Value', 'Gst Applicable', 'Part Category', 'UOM', 'Vendor'];

        const ITEMTYPEARRAY = ['GOODS', 'SERVICE'];
        const PARTCATARRAY = ['General Inventory', 'MGA', 'Non-MGA'];
        const ALLOWDECIMALARRAY = ['YES', 'NO'];
        // const REGISTRATIONARRAY = ['Unknown', 'Composition', 'Consumer', 'Regular', 'UnRegistered'];
        const GSTARRAY = ['5', '12', '18', '28']

        const UOM = await sequelize.query(`select Misc_Name from misc_mst where misc_type = 72`);
        const UOMARRAY = UOM[0]?.map(obj => obj.Misc_Name);

        // const BRANDS = await sequelize.query(`select Misc_Name from misc_mst where misc_type = 617`);
        // const BRANDSARRAY = BRANDS[0]?.map(obj => obj.Misc_Name);

        // const MODELS = await sequelize.query(`select Misc_Name from misc_mst where misc_type = 14`);
        // const MODELSARRAY = MODELS[0]?.map(obj => obj.Misc_Name);

        const VENDORS = await sequelize.query(`select Ledg_Name from ledg_mst Where Group_Code = 51`);
        const VENDORSARRAY = VENDORS[0]?.map(obj => obj.Ledg_Name);

        const twoDArray = [ITEMTYPEARRAY, ALLOWDECIMALARRAY, GSTARRAY, PARTCATARRAY,
            UOMARRAY, VENDORSARRAY];
        let maxLength = Math.max(...twoDArray.map(arr => arr.length));

        twoDArray.forEach(arr => {
            while (arr.length < maxLength) {
                arr.push(null);
            }
        });

        let transposedArray = [];
        for (let i = 0; i < maxLength; i++) {
            transposedArray.push(twoDArray.map(arr => arr[i]));
        }

        const Company_Name = await sequelize.query(
            `select top 1 comp_name from Comp_Mst`
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");
        worksheet.mergeCells("A1:E1");
        worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name}`; // Replace with your company name
        worksheet.getCell("A1").alignment = {
            vertical: "middle",
            horizontal: "center",
        };
        worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
        worksheet.mergeCells("A2:E2");
        worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
        worksheet.getCell("A2").alignment = {
            vertical: "middle",
            horizontal: "center",
        };
        worksheet.mergeCells("A3:L3");
        let reportName1 = "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
        worksheet.getCell("A3").value = `${reportName1}`;

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
        const headerRow1 = worksheet.addRow(Headeres2);
        headerRow1.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF006400" }, // dark green background color
            };
        });
        console.log(transposedArray, 'askdaksdjklj');

        transposedArray?.forEach((item) => {
            worksheet.addRow(item);
        });
        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
            console.error("Error creating workbook:", error);
            res.status(500).send("Internal Server Error");
        });
    } catch (e) {
        console.log(e)
        const workbook = new ExcelJS.Workbook();
        workbook.addWorksheet("Sheet1");

        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
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



exports.excelimport = async function (req, res, next) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction(); // Start the transaction
    console.log(req.body);
    const excelFile = req.files["excel"][0];

    if (!excelFile) {
        await sequelize.close();
        return res.status(400).send({ Message: "No file uploaded" });
    }

    const workbook = xlsx.read(excelFile.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    console.log(transformedData, "transformedData");

    try {
        const [results] = await sequelize.query(
            `SELECT COALESCE(MAX(tran_id), 0) AS maxno, 
             CAST(MAX(Date) AS DATE) AS last_import_date 
             FROM Part_Stock`
        );
        const newtran_id = results[0].maxno + 1;

        const [results1] = await sequelize.query(
            `SELECT CAST(MAX(Date) AS DATE) AS last_import_date 
             FROM Part_Stock WHERE Br_Code = :Br_Code`,
            {
                replacements: { Br_Code: req.body.branch },
            }
        );
        console.log(results1[0], "resultsresults");

        const today = new Date().toISOString().split('T')[0];
        if (results1[0].last_import_date === today) {
            await sequelize.query(
                `UPDATE Part_Stock 
                 SET Export_Type = 33 
                 WHERE Br_Code = :Br_Code 
                 AND CAST(Date AS DATE) = CAST(GETDATE() AS DATE);`,
                {
                    replacements: {
                        Br_Code: req.body.branch
                    },
                    transaction: t
                }
            );
        }

        const BATCH_SIZE = 1000; // Define your batch size
        let batchCount = Math.ceil(transformedData.length / BATCH_SIZE);
        let globalSrno = 1; // Initialize a global srno counter

        for (let i = 0; i < batchCount; i++) {
            const batchStart = i * BATCH_SIZE;
            const batchEnd = batchStart + BATCH_SIZE;
            const dataBatch = transformedData.slice(batchStart, batchEnd).map((item) => ({
                TRAN_ID: newtran_id,
                Export_Type: 1,
                Create_By: req.body.Create_By,
                Br_Code: req.body.branch,
                Part_No: item.Part_No || null,
                Descr: item.Descr || null,
                Stock_Qty: item.Stock_Qty || null,
                srno: globalSrno++ // Increment global srno for each item
            }));

            // Construct the VALUES part of the query
            const values = dataBatch.map(item => `(:TRAN_ID_${item.srno}, :Part_No_${item.srno}, :Descr_${item.srno}, :Stock_Qty_${item.srno}, :Br_Code_${item.srno}, :Export_Type_${item.srno}, :srno_${item.srno}, :Create_By_${item.srno})`).join(', ');

            // Create the replacements object
            const replacements = {};
            dataBatch.forEach(item => {
                replacements[`TRAN_ID_${item.srno}`] = item.TRAN_ID;
                replacements[`Part_No_${item.srno}`] = item.Part_No;
                replacements[`Descr_${item.srno}`] = item.Descr;
                replacements[`Stock_Qty_${item.srno}`] = item.Stock_Qty;
                replacements[`Br_Code_${item.srno}`] = item.Br_Code;
                replacements[`Export_Type_${item.srno}`] = item.Export_Type;
                replacements[`srno_${item.srno}`] = item.srno;
                replacements[`Create_By_${item.srno}`] = item.Create_By;
            });

            await sequelize.query(
                `INSERT INTO Part_Stock (TRAN_ID, Part_No, Descr, Stock_Qty, Br_Code, Export_Type, srno, Create_By)
                VALUES ${values}`,
                {
                    replacements: replacements,
                    transaction: t
                }
            );

            console.log(`Inserted batch ${i + 1} with ${dataBatch.length} items`);
        }

        await t.commit(); // Commit the transaction

        // Send only the top 10 transformed data
        const resultData = transformedData.slice(0, 10);

        res.send({
            Status: "true",
            Message: "Success",
            Result: resultData // Send only the top 10 entries
        });
    } catch (error) {
        await t.rollback(); // Rollback the transaction in case of error
        console.error("Error inserting data:", error);
        res.status(500).send({ Message: "Error inserting data" });
    } finally {
        await sequelize.close(); // Close the database connection
    }
};




exports.maxorderno = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    // Loc_Code=req.body.Loc_Code;
    // console.log(req.body,"misc_type")
    try {
        const [results] = await sequelize.query(
            ` SELECT COALESCE(MAX(tran_id), 0) AS Order_No from Suggestive_Order`
        );
        console.log(results[0], "resultsresults")
        res.send({
            Status: "true",
            Message: "Success",
            Result: results[0].Order_No + 1
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



exports.generatestock = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const fromdata = req.body.formData;
    console.log(fromdata, "misc_type");

    try {
        const [minstock] = await sequelize.query(
            `SELECT * FROM Part_MinStock WHERE Export_Type < 3 AND Br_Code = ${fromdata.Br_Code}`
        );

        if (minstock.length == 0) {
            return res.status(200).send({
                Status: false,
                Message: "Please import minimum part order excel sheet on this Branch",
                Result: null
            });
        }


        const [stock] = await sequelize.query(
            `SELECT * FROM Part_Stock WHERE Export_Type < 3 AND Br_Code = ${fromdata.Br_Code}`
        );
        if (stock.length == 0) {
            return res.status(200).send({
                Status: false,
                Message: "Please import part stock  excel sheet on this Branch",
                Result: null
            });
        }


        const [results] = await sequelize.query(
            `SELECT 
                pm.Part_No,
                pm.Min_Stock_Qty,
                ps.Descr,
                ps.Date,
                ps.Stock_Qty,
                (pm.Min_Stock_Qty - ps.Stock_Qty) AS Order_Qty,
                ps.Br_Code
            FROM 
                Part_MinStock pm
            JOIN 
                Part_Stock ps ON pm.Part_No = ps.Part_No   
            WHERE 
                ps.Stock_Qty < pm.Min_Stock_Qty
                AND ps.Br_Code = ${fromdata.Br_Code}
                AND pm.Br_Code = ${fromdata.Br_Code}
                AND ps.Export_Type < 3 
                AND pm.Export_Type < 3 
                AND CAST(ps.Date AS DATE) = (SELECT CAST(MAX(Date) AS DATE) FROM Part_Stock);`
        );

        console.log(results, "resultsresults");

        res.send({
            Status: true,
            Message: "Generete Suggestive Order successfully",
            Result: results
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



exports.savesuggestive = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data = req.body.Datatable;
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    try {
        const [results] = await sequelize.query(
            `SELECT COALESCE(MAX(tran_id), 0) AS Order_No FROM Suggestive_Order`
        );
        const maxtranit = results[0].Order_No + 1;

        // Update Export_Type for entries with the same Br_Code and today's date
        await sequelize.query(
            `UPDATE Suggestive_Order 
             SET Export_Type = '33' 
             WHERE Br_Code = ${data[0].Br_Code} 
             AND CAST(Date AS DATE) = '${today}'`, // Use CAST for SQL Server
            { transaction: t }
        );

        const values = data.map((order, index) => {
            const srno = index + 1; // Assuming srno is an incrementing index
            return `(${maxtranit + index}, 'Order${maxtranit + index}', ${order.Br_Code || null}, '${order.Part_No || ''}', '${order.Descr || ''}', '${order.Remark || ''}', ${order.Stock_Qty || 0}, ${order.Min_Stock_Qty || 0}, ${order.Order_Qty || 0}, 1, ${srno},'${req.body.Create_By}')`;
        }).join(", ");

        const query = `
            INSERT INTO Suggestive_Order (Tran_id, Order_No, Br_Code, Part_No, Descr, Remark, Stock_Qty, Min_Stock_Qty, Order_Qty, Export_Type, srno,Create_By)
            VALUES ${values}
        `;

        await sequelize.query(query, { transaction: t });
        await t.commit();

        res.status(200).send({
            Status: "true",
            Message: "Success",
            Result: null,
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



exports.getreport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    Br_Code = req.body.Br_Code
    date = req.body.date;
    console.log(Br_Code, "date")
    try {
        const results = await sequelize.query(
            `SELECT * FROM Suggestive_Order 
             WHERE Br_Code IN (:Br_Code) 
             AND Export_Type < 3 
             AND CAST(Date AS DATE) = :date`,
            {
                replacements: { Br_Code, date },
                type: sequelize.QueryTypes.SELECT
            }
        );
        console.log(results, "resultsresults");
        res.send({
            Status: "true",
            Message: "Success",
            Result: results
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


exports.getreportall = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const Br_Codes = req.body.Br_Code; // Expecting a string like "1,2,3,4,5"
    const date = req.body.date

    console.log(Br_Codes, "Br_Codes");

    try {
        // Split the string into an array and trim whitespace
        const brCodeArray = Br_Codes.split(',').map(code => code.trim());
        const brCodeList = brCodeArray.join(", ");

        const results = await sequelize.query(
            `
            SELECT 
                part_no,
                descr,
                ${brCodeArray.map(code => `COALESCE(SUM(CASE WHEN br_code = ${code} THEN stock_qty END), 0) AS stock_qty_${code}`).join(", ")} ,
                ${brCodeArray.map(code => `COALESCE(SUM(CASE WHEN br_code = ${code} THEN Min_Stock_Qty END), 0) AS Min_Stock_Qty_${code}`).join(", ")} ,
                ${brCodeArray.map(code => `COALESCE(SUM(CASE WHEN br_code = ${code} THEN Order_Qty END), 0) AS Order_Qty_${code}`).join(", ")}
            FROM 
                Suggestive_Order 
            WHERE 
                br_code IN (${brCodeList})
                AND Export_type < 3 
                AND CAST(date AS DATE) =  '${date}' 
            GROUP BY 
                part_no, descr;
            `,
            {
                type: sequelize.QueryTypes.SELECT
            }
        );

        console.log(results, "resultsresults");

        // Add total to each result
        const modifiedResults = results.map(result => {
            const totalOrderQty = brCodeArray.reduce((total, code) => {
                return total + (result[`Order_Qty_${code}`] || 0);
            }, 0);
            return {
                ...result,
                total: totalOrderQty
            };
        });

        res.send({
            Status: "true",
            Message: "Success",
            Result: modifiedResults
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




exports.formateministock = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        const Headeres = ['Part_No', 'Descr', 'Min_Stock_Qty'];

       
        const Company_Name = await sequelize.query(
            `select top 1 comp_name from Comp_Mst`
        );

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
    
        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
            console.error("Error creating workbook:", error);
            res.status(500).send("Internal Server Error");
        });
    } catch (e) {
        console.log(e)
        const workbook = new ExcelJS.Workbook();
        workbook.addWorksheet("Sheet1");

        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
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


exports.formatstock = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        const Headeres = ['Part_No', 'Descr', 'Stock_Qty'];

       
        const Company_Name = await sequelize.query(
            `select top 1 comp_name from Comp_Mst`
        );

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
    
        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
            console.error("Error creating workbook:", error);
            res.status(500).send("Internal Server Error");
        });
    } catch (e) {
        console.log(e)
        const workbook = new ExcelJS.Workbook();
        workbook.addWorksheet("Sheet1");

        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Excel_import_Tamplate.xlsx"'
        );
        return workbook.xlsx.write(res).then(() => {
            res.end();
        }).catch((error) => {
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