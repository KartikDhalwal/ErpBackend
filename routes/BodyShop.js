const { Sequelize, DataTypes } = require('sequelize');
const { dbname } = require('../utils/dbconfig');
const Joi = require('joi');
const XLSX = require("xlsx");
const ExcelJS = require("exceljs");
const fs = require('fs');
const path = require('path');
const {
    _BodyShopA,
    _BodyShopB,
    _BodyShopC,
    _BodyShopD,
    _BodyShopE,
    _BodyShopF,
    _BodyShopG,
    _BodyShopH,
    _BodyShopI,
    _BodyShopJ,
    _BodyShopK,
    _BodyShopL } = require("../models/BodyShopA");

const tableMapper = {
    'BI_Part_Issue': 'BodyShop_A', // Table ''BodyShop_A'' corresponds to 'BI_Part_Issue'
    'Extranet_Allocation_Status': 'BodyShop_B', // Table ''BodyShop_B'' corresponds to 'Extranet_Allocation_Status'
    'Extranet_Back_Order_Status': 'BodyShop_C', // Table ''BodyShop_C'' corresponds to 'Extranet_Back_Order_Status'
    'Extranet_Dispatch_Status': 'BodyShop_D', // Table ''BodyShop_D'' corresponds to 'Extranet_Dispatch_Status'
    'Extranet_Invoice_Status': 'BodyShop_E', // Table ''BodyShop_E'' corresponds to 'Extranet_Invoice_Status'
    'Extranet_Order_Received_Status': 'BodyShop_F', // Table ''BodyShop_F'' corresponds to 'Extranet_Order_Received_Status'
    'Extranet_Under_Picking_Status': 'BodyShop_G', // Table ''BodyShop_G'' corresponds to 'Extranet_Under_Picking_Status'
    'Hold_Up_report': 'BodyShop_H', // Table ''BodyShop_H'' corresponds to 'Holdup'
    'Part_Requisition_Details': 'BodyShop_I', // Table ''BodyShop_I'' corresponds to 'Part_Requisition_Details'
    'Extranet_Under_Invoicing_Status': 'BodyShop_J', // Table ''BodyShop_J'' corresponds to 'Extranet_Under_Invoicing_Status.xlsx'
    'Order_Part_Error_Details': 'BodyShop_K', // Table ''BodyShop_J'' corresponds to 'Extranet_Under_Invoicing_Status.xlsx'
    'ETA_Order_Report': 'BodyShop_L', // Table ''BodyShop_J'' corresponds to 'Extranet_Under_Invoicing_Status.xlsx'
};
const headerMappings = {
    'BI_Part_Issue': {
        'Region': 'Region',
        'Consignee Code': 'Consignee_Code',
        'Dealer Code': 'Dealer_Code',
        'FOR Code': 'FOR_Code',
        'Outlet code': 'Outlet_code',
        'Location Code': 'Location_Code',
        'Part Category': 'Part_Category',
        'Part Num': 'Part_Num',
        'Root Part Num': 'Root_Part_Num',
        'Part Description': 'Part_Description',
        'Financial Year': 'Financial_Year',
        'Financial Month': 'Financial_Month',
        'Month Year': 'Month_Year',
        'Day': 'Day',
        'Sale Type': 'Sale_Type',
        'Service Description': 'Service_Description',
        'Variant Name': 'Variant_Name',
        'Variant Code': 'Variant_Code',
        'JobCard Num': 'JobCard_Num',
        'Dealer Seq No': 'Dealer_Seq_No',
        'Document Num': 'Document_Num',
        'Service Advisor': 'Service_Advisor',
        'Vehicle Registration Num': 'Vehicle_Registration_Num',
        'Base Model Name': 'Base_Model_Name',
        'Net Retail DDL w/o CO-DDL DDT': 'Net_Retail_DDL_wo_CO_DDL_DDT',
        'Net Retail Qty w/o CO-DDL DDT': 'Net_Retail_Qty_wo_CO_DDL_DDT'
    },
    'Extranet_Allocation_Status': {
        'Dealer Code': 'DEALER_CODE',
        'Consignee Code': 'CONSIGNEE_CODE',
        'Maruti Order No': 'MARUTI_ORDER_NO',
        'Dealer Order No': 'DEALER_ORDER_NO',
        'Order Type': 'ORDER_TYPE',
        'Part Number': 'PART_NUMBER',
        'Part Name': 'PART_NAME',
        'ALLOCATED_QTY': 'ALLOCATED_QTY',
        'Location': 'LOCATION'
    },
    'Extranet_Back_Order_Status': {
        'Dealer Code': 'Dealer_Code',
        'Consignee Code': 'Consignee_Code',
        'Maruti Order No': 'Maruti_Order_No',
        'Dealer Order No': 'Dealer_Order_No',
        'Part Number': 'Part_Number',
        'Part Name': 'Part_Name',
        'Order Type': 'Order_Type',
        'Order Qty': 'Order_Qty',
        'Advanced Order Qty': 'Advanced_Order_Qty',
        'Back Order Qty': 'Back_Order_Qty',
        'Location': 'Location'
    },
    'Extranet_Dispatch_Status': {
        'Dealer Code': 'Dealer_Code',
        'Consignee Code': 'Consignee_Code',
        'Type': 'Type',
        'FIN Ctrl No': 'FIN_Ctrl_No',
        'Invoice Date': 'Invoice_Date',
        'Value': 'Value',
        'Gate Pass No': 'Gate_Pass_No',
        'Gate Pass Date': 'Gate_Pass_Date',
        'GRN': 'Goods_Reciept_No',
        'Goods Reciept Date': 'Goods_Reciept_Date',
        'Transporter': 'Transporter',
        'Truck No': 'Truck_No',
        'Location': 'Location'
    },
    'Extranet_Invoice_Status': {
        'Dealer Code': 'Dlr_Code',
        'Consignee Code': 'Con_Code',
        'Maruti Order No': 'MSIL_Order_No',
        'Dealer Order No': 'Dlr_Order_No',
        'Part Number': 'Part_No',
        'Part Name': 'Part_Name',
        'PICKED_QTY': 'Pick_Qty',
        'Pick Ticket No': 'Pick_Ticket_No',
        'Type': 'Type',
        'FIN Ctrl No': 'FIN_Ctrl_No',
        'Invoice No': 'Invoice_No',
        'Invoice_Date': 'Invoice_Date',
        'Gate Pass No': 'Gate_Pass_No',
        'Gate_Pass_Date': 'Gate_Pass_Date',
        'Location': 'Location'
    },
    'Extranet_Order_Received_Status': {
        'Category': 'Category',
        'Dlr Code': 'Dlr_Code',
        'Cons Code': 'Cons_Code',
        'MSIL_Batch_No': 'MSIL_Batch_No',
        'Batch Date': 'Batch_Date',
        'Dealer Order No': 'Dealer_Order_No',
        'Order Category': 'Order_Category',
        'Order Type': 'Order_Type',
        'VALUE': 'VALUE',
        'Status': 'Status',
        'Location': 'Location'
    },
    'Extranet_Under_Picking_Status': {
        'Maruti Order No': 'Maruti_Ord_No',
        'Dealer Order No': 'Dlr_Ord_No',
        'ORD_DATE': 'ORD_DATE',
        'Order Type': 'ORD_TYPE',
        'Pick Ticket No': 'Pick_Ticket_No',
        'Part Number': 'Part_No',
        'Part Name': 'PART_NAME',
        'ALLOC_QTY': 'ALLOC_QTY',
        'Location': 'LOCATION'
    },
    'Hold_Up_report': {
        'Dealer Region Code': 'Dealer_Region_Code',
        'Dealer City': 'Dealer_City',
        'MSIL Service Dealer Code': 'MSIL_Service_Dealer_Code',
        'Dealer FOR Code': 'Dealer_FOR_Code',
        'Dealer Outlet Code': 'Dealer_Outlet_Code',
        'Dealer Name': 'Dealer_Name',
        'Service Type Description': 'Service_Type_Description',
        'Holdup JobCard No.': 'Holdup_JobCard_No',
        'JobCard Status': 'JobCard_Status',
        'JobCard Open Date': 'JobCard_Open_Date',
        'Promised Date': 'Promised_Date',
        'Date': 'Date',
        'Holdup Reason': 'Holdup_Reason',
        'Odometer Reading': 'Odometer_Reading',
        'Model Name': 'Model_Name',
        'Repeat Flag': 'Repeat_Flag',
        'Revised Sugg Promise Date': 'Revised_Sugg_Promise_Date',
        'Suggested Promise Date': 'Suggested_Promise_Date',
        'Eng/Tran Repair': 'Eng_Tran_Repair',
        'Part Replacement': 'Part_Replacement',
        'Cutting/Welding': 'Cutting_Welding',
        'No of Panels': 'No_of_Panels',
        'Type of Insurance': 'Type_of_Insurance',
        'Revised Promise Date': 'Revised_Promise_Date',
        'Insurance Approval Date': 'Insurance_Approval_Date',
        'Payable By': 'Payable_By',
        'Reg Num': 'Reg_Num',
        'HoldUp days from JC opening': 'HoldUp_days_from_JC_opening',
        'Holdup day (Beyond Promise Time)': 'Holdup_day_Beyond_Promise_Time',
        'Colour Code': 'Colour_Code',
        'Colour  Description': 'Colour_Description'
    },
    'Part_Requisition_Details': {
        'DMS Loc': 'DMS_Loc',
        'Requisition No': 'Requisition_No',
        'Requisition Dt': 'Requisition_Dt',
        'Reg No': 'Reg_No',
        'Job Card No': 'Job_Card_No',
        'Customer Name': 'Customer_Name',
        'Part No': 'Part_No',
        'Part Desc': 'Part_Desc',
        'Bin Location': 'Bin_Location',
        'Requested Qty': 'Requested_Qty',
        'Issued Qty': 'Issued_Qty',
        'Pending Qty': 'Pending_Qty',
        'Stock Qty': 'Stock_Qty',
        'Selling Price': 'Selling_Price',
        'Part Flagging': 'Part_Flagging',
        'DMS Order No.': 'DMS_Order_No',
        'Order Date': 'Order_Date'
    },
    'Order_Part_Error_Details': {
        'Dealer Order No': 'Dealer_Ord_No',
        'MSIL Batch No': 'MSIL_Batch_No',
        'Maruti Order No': 'MSIL_Ord_No',
        'ORD_DATE': 'Ord_Date',
        'Part Number': 'Part_No',
        'Error': 'Error',
    },
    'Extranet_Under_Invoicing_Status': {
        'Dealer Code': 'DLR_CODE',
        'Consignee Code': 'CONS_CODE',
        'Maruti Order No': 'Maruti_Ord_No',
        'Dealer Order No': 'DlrOrd_No',
        'Order Type': 'ORD_TYPE',
        'Pick Ticket No': 'Pick_Ticket_No',
        'Part Number': 'PART_NUMBER',
        'Part Name': 'PART_NAME',
        'PICKED_QTY': 'PICKED_QTY',
        'Location': 'LOCATION',
    },
    'ETA_Order_Report': {
        'LOCATION': 'LOCATION',
        'STAGE': 'STAGE',
        'CUSTOMER': 'CUSTOMER',
        'CONSIGNEE': 'CONSIGNEE',
        'ORDER_REFRENCE_NO': 'ORDER_REFRENCE_NO',
        'BATCH_NUMBER': 'BATCH_NUMBER',
        'ORDER_NUMBER': 'ORDER_NUMBER',
        'ORDER_CATG': 'ORDER_CATG',
        'ORDER_TYPE': 'ORDER_TYPE',
        'BATCH/ORDER_DATE':'BATCH_ORDER_DATE',
        'ORDER_PART_NUMBER': 'ORDER_PART_NUMBER',
        'SERVE_PART_NUMBER': 'SERVE_PART_NUMBER',
        'ORDER_QTY': 'ORDER_QTY',
        'ACTUAL_QTY': 'ACTUAL_QTY',
        'PICT_TICKET_NO': 'PICT_TICKET_NO',
        'PICT_TICKET_DATE': 'PICT_TICKET_DATE',
        'INVOICE_NUMBER': 'INVOICE_NUMBER',
        'INVOICE_DATE': 'INVOICE_DATE',
        'GRVR_NUMBER': 'GRVR_NUMBER',
        'GRVR_DATE': 'GRVR_DATE',
        'MGPA_NUMBER': 'MGPA_NUMBER',
        'MGPA_DATE': 'MGPA_DATE',
        'EXPECTED_TIME_OF_ARRIVAL': 'EXPECTED_TIME_OF_ARRIVAL'
    }

};


function normalizeData(jsonData, tableName, batchId) {
    try {
        const mappings = headerMappings[tableName];
        return jsonData.map(row => {
            const normalizedRow = {};
            Object.keys(row).forEach(header => {
                // Normalize the header names
                const normalizedHeader = mappings[header] || header.replace(/ /g, '_').replace(/\//g, '');
                let value = row[header]?.toString();

                // Check if the value is a date and normalize it if needed
                if (isDateField(normalizedHeader) && value) {
                    value = normalizeDate(value);
                }

                normalizedRow[normalizedHeader] = value;
            });
            return { ...normalizedRow, batch_id: batchId };
        });
    } catch (e) {
        console.log(e);
    }
}

// Helper function to check if a field is a date
function isDateField(header) {
    const dateFields = ['JobCard_Open_Date', 'Promised_Date', 'Date', 'Suggested_Promise_Date', 'Revised_Sugg_Promise_Date', 'Revised_Promise_Date', 'Insurance_Approval_Date',
        'Month_Year', 'Invoice_Date', 'Gate_Pass_Date', 'Goods_Reciept_Date', 'Invoice_Date', 'Gate_Pass_Date', 'Batch_Date', 'ORD_DATE', 'Order_Date', 'Ord_Date'
    ]; // Add all date fields here
    return dateFields.includes(header);
}

// Helper function to normalize the date format
function normalizeDate(dateStr) {
    const date = new Date(dateStr);
    // If date is invalid, return the original string; otherwise, format as needed (e.g., 'YYYY-MM-DD')
    return isNaN(date.getTime()) ? dateStr : date.toISOString().split('T')[0]; // 'YYYY-MM-DD' format
}
// function normalizeData(jsonData, tableName) {
//     try {
//         const mappings = headerMappings[tableName];
//         return jsonData.map(row => {
//             const normalizedRow = {};
//             Object.keys(row).forEach(header => {

//                 const normalizedHeader = mappings[header] || header.replace(/ /g, '_').replace(/\//g, '');
//                 normalizedRow[normalizedHeader] = row[header]?.toString();
//             });
//             return normalizedRow;
//         });
//     } catch (e) {
//         console.log(e);
//     }
// }
async function processFile(file, table, Table_fieldName, DBNAME, batchId) {
    const sequelize = await dbname(DBNAME);
    const t = await sequelize.transaction();

    try {
        const workbook = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        var BodyShopA = _BodyShopA(sequelize, DataTypes);
        var BodyShopB = _BodyShopB(sequelize, DataTypes);
        var BodyShopC = _BodyShopC(sequelize, DataTypes);
        var BodyShopD = _BodyShopD(sequelize, DataTypes);
        var BodyShopE = _BodyShopE(sequelize, DataTypes);
        var BodyShopF = _BodyShopF(sequelize, DataTypes);
        var BodyShopG = _BodyShopG(sequelize, DataTypes);
        var BodyShopH = _BodyShopH(sequelize, DataTypes);
        var BodyShopI = _BodyShopI(sequelize, DataTypes);
        var BodyShopJ = _BodyShopJ(sequelize, DataTypes);
        var BodyShopK = _BodyShopK(sequelize, DataTypes);
        var BodyShopL = _BodyShopL(sequelize, DataTypes);
        // Add batch_id to each record
        const dataWithBatchId = normalizeData(jsonData, Table_fieldName, batchId);

        const BATCH_SIZE = 10000; // Define your batch size
        let batchCount = Math.ceil(dataWithBatchId.length / BATCH_SIZE);
        console.log(table)
        switch (table) {
            case 'BodyShop_A':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopA.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_B':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopB.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_C':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopC.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_D':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopD.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_E':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopE.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_F':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopF.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_G':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopG.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_H':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopH.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_I':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopI.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_J':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopJ.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_K':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopK.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            case 'BodyShop_L':
                for (let i = 0; i < batchCount; i++) {
                    const batchStart = i * BATCH_SIZE;
                    const batchEnd = batchStart + BATCH_SIZE;
                    const dataBatch = dataWithBatchId.slice(batchStart, batchEnd)
                    await BodyShopL.bulkCreate(dataBatch, { transaction: t });
                }
                break;
            default:
                // throw new Error(`Unknown table: ${table}`);
                break;
        }
        await t.commit();
        // });
    } catch (e) {
        await t.rollback();

        console.log(e);
    }
}
async function formatDate(date) {
    const pad = (num) => String(num).padStart(2, '0');

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `BATCH-${day}${month}${year}${hours}${minutes}${seconds}`;
};
exports.BodyShopReports = async function (req, res, next) {
    // const t = await sequelize.transaction();
    try {
        const batchId = await formatDate(new Date());
        console.log(req.files)
        const processingPromises = req.files.map(async (file) => {
            console.log(`Processing file: ${file.fieldname}`);

            const table = tableMapper[file.fieldname];
            if (!table) {
                console.error(`No table mapping found for file: ${file.fieldname}`);
                return; // Skip to the next file
            }
            // if (file.fieldname == 'Extranet_Allocation_Status')
            await processFile(file, table, file.fieldname, req.headers.compcode, batchId);

        });

        // Wait for all files to be processed
        await Promise.all(processingPromises);
        console.log("res.sent all files uploaded")
        res.status(200).send({ message: "Ok" })
    } catch (error) {
        // t.rollback();
        console.error("Error:", error);
        res.status(500).json({ Message: "An error occurred during file import." });
    }
};



// Call the function wi
exports.BodyShopDownload = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        let reportName = "DSE Excel Import";
        const data1 = await sequelize.query(`SELECT distinct batch_id,cast(created_date as date) FROM Bodyshop_H order by cast(created_date as date) desc`)


        const hold_updata = await sequelize.query(`select (select newcar_rcpt from GODOWN_MST where MSIL_Service_Dealer_Code = Div_Code and Div_Add1 = Dealer_FOR_Code	and Div_Add2 = Dealer_Outlet_Code ) as Dms_Loc,* from Bodyshop_H where batch_id = '${data1[0][0].batch_id}' `)
        const data12 = await sequelize.query(`   
             WITH PreprocessedOrders AS (
                SELECT 
                    iif(InventoryItems.root_part_no is null , Part_No,InventoryItems.root_part_no ) as Part_No,
                    Part_Desc,
					Part_No as Part_No2,
                    DMS_Order_No,
                    Requested_Qty,
                    Reg_No,
                    batch_id,
                    DMS_Loc,
					Order_Date,
					Job_Card_No,
                    -- Precompute the cleaned DMS_Order_No without special characters
                    REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') AS Cleaned_Order_No
                FROM BodyShop_I
				left join InventoryItems on BodyShop_I.part_no = InventoryItems.ITEM_CODE
                WHERE batch_id = '${data1[0][0].batch_id}'
            ),
			 OrderStatuses AS (
                SELECT 
                    pi.Part_No2,
                    pi.Part_Desc,
                    pi.DMS_Order_No,
                    pi.Requested_Qty,
                    pi.Reg_No,
                    pi.DMS_Loc,
					pi.Order_Date,
					pi.Job_Card_No,
					CASE
                        WHEN EXISTS (SELECT 1 FROM BodyShop_A WHERE batch_id = pi.batch_id and  (Part_num = pi.Part_No or Root_Part_Num = pi.Part_No) AND Vehicle_Registration_Num = pi.Reg_No ) THEN 'Issued'
						else 'Pending'
                    end as [Issue Status],
                    CASE
                        --WHEN EXISTS (SELECT 1 FROM BodyShop_A WHERE batch_id = pi.batch_id and  Root_Part_num = pi.Part_No AND Vehicle_Registration_Num = pi.Reg_No ) THEN 'Issued'
                        WHEN EXISTS (SELECT 1 FROM BodyShop_D WHERE batch_id = pi.batch_id and  FIN_Ctrl_No IN (SELECT FIN_Ctrl_No FROM BodyShop_E WHERE batch_id = pi.batch_id and REPLACE(REPLACE(REPLACE(Dlr_Order_No, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%' AND Part_No = pi.Part_No)) THEN 'Transit'
                        WHEN EXISTS (SELECT 1 FROM BodyShop_E WHERE batch_id = pi.batch_id and  REPLACE(REPLACE(REPLACE(Dlr_Order_No, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%' AND Part_No = pi.Part_No) THEN 'Invoiced'
                        WHEN EXISTS (SELECT 1 FROM BodyShop_J WHERE batch_id = pi.batch_id and  REPLACE(REPLACE(REPLACE(DlrOrd_No, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%' AND PART_NUMBER = pi.Part_No) THEN 'Under Invoicing'
                        WHEN EXISTS (SELECT 1 FROM BodyShop_G WHERE batch_id = pi.batch_id and  REPLACE(REPLACE(REPLACE(Dlr_Ord_No, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%' AND Part_No = pi.Part_No) THEN 'Picking'
                        WHEN EXISTS (SELECT 1 FROM BodyShop_B WHERE batch_id = pi.batch_id and  REPLACE(REPLACE(REPLACE(DEALER_ORDER_NO, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%' AND PART_NUMBER = pi.Part_No) THEN 'Allocating'
                        WHEN EXISTS (SELECT 1 FROM BodyShop_C WHERE batch_id = pi.batch_id and  REPLACE(REPLACE(REPLACE(DEALER_ORDER_NO, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%' AND Part_Number = pi.Part_No) THEN 'Back Order'
                        WHEN EXISTS (SELECT 1 FROM BodyShop_K WHERE batch_id = pi.batch_id and  REPLACE(REPLACE(REPLACE(Dealer_Ord_No, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%' AND Part_No = pi.Part_No) THEN 
						  (SELECT TOP 1 error FROM BodyShop_K WHERE batch_id = pi.batch_id and  REPLACE(REPLACE(REPLACE(Dealer_Ord_No, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%' AND Part_No = pi.Part_No) 
                        WHEN EXISTS (SELECT top 1 1 FROM BodyShop_F WHERE batch_id = pi.batch_id and  REPLACE(REPLACE(REPLACE(Dealer_Order_No, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%' ) THEN (SELECT top 1 Status FROM BodyShop_F WHERE batch_id = pi.batch_id and  REPLACE(REPLACE(REPLACE(Dealer_Order_No, '_', ''), '/', ''), '-', '') LIKE '%' + pi.Cleaned_Order_No + '%')
                        ELSE 'Unknown State'
                    END AS detail
                FROM PreprocessedOrders pi
                JOIN (select distinct Reg_Num from Bodyshop_H) as bh ON pi.Reg_No = bh.Reg_num AND pi.batch_id = '${data1[0][0].batch_id}'
            )
            SELECT				
                    os.Part_No2,
                    os.Part_Desc,
                    os.DMS_Order_No,
                    os.Requested_Qty,
                    os.Reg_No,
                    os.DMS_Loc,
					os.Job_Card_No,
					os.Order_Date,
                    os.detail,
                    os.[Issue Status]
                FROM OrderStatuses os
            `);
        console.log(data12[0][0]);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('BodyShop Data');
        const sheet1 = workbook.addWorksheet('>=1 Parts');
        const sheet2 = workbook.addWorksheet('>=2 Parts');
        const sheet3 = workbook.addWorksheet('>=3 Parts');
        const sheet4 = workbook.addWorksheet('>=4 Parts');
        async function generateExcel() {
            // Define headers for static part
            const headers = [
                'Batch ID', 'Dealer Region Code', 'Dealer City', 'MSIL Service Dealer Code',
                'Dealer FOR Code', 'Dealer Outlet Code', 'Dms Loc', 'Dealer Name', 'Service Type Description',
                'Holdup JobCard No', 'JobCard Status', 'JobCard Open Date', 'Promised Date', 'Date',
                'Holdup Reason', 'Odometer Reading', 'Model Name', 'Repeat Flag', 'Revised Sugg Promise Date',
                'Suggested Promise Date', 'Eng Tran Repair', 'Part Replacement', 'Cutting Welding',
                'No of Panels', 'Type of Insurance', 'Revised Promise Date', 'Insurance Approval Date',
                'Payable By', 'Reg Num', 'HoldUp days from JC opening', 'Holdup day Beyond Promise Time',
                'Colour Code', 'Colour Description', 'Created Date'
            ];
            // return data1.map(item => ({
            //     ...item,
            //     details: data2.filter(detail => detail.req_num === item.reg_num)
            //   }));
            // Add static headers
            worksheet.addRow(headers);
            sheet1.addRow([...headers]);
            sheet2.addRow([...headers]);
            sheet3.addRow([...headers]);
            sheet4.addRow([...headers]);

            const summaryReport = {};
            const summaryReportDueToparts = {};
            const summaryReportDMS = {};
            const summaryReportDueTopartsDMS = {};

            // Loop through each object and append data dynamically
            const pivot_array = []
            hold_updata[0].forEach(item => {
                const mainData = [
                    item.batch_id,
                    item.Dealer_Region_Code,
                    item.Dealer_City,
                    item.MSIL_Service_Dealer_Code,
                    item.Dealer_FOR_Code,
                    item.Dealer_Outlet_Code,
                    item.Dms_Loc,
                    item.Dealer_Name,
                    item.Service_Type_Description,
                    item.Holdup_JobCard_No,
                    item.JobCard_Status,
                    adjustToIST(item.JobCard_Open_Date),
                    adjustToIST(item.Promised_Date),
                    adjustToIST(item.Date),
                    item.Holdup_Reason,
                    item.Odometer_Reading,
                    item.Model_Name,
                    item.Repeat_Flag,
                    adjustToIST(item.Revised_Sugg_Promise_Date),
                    adjustToIST(item.Suggested_Promise_Date),
                    item.Eng_Tran_Repair,
                    item.Part_Replacement,
                    item.Cutting_Welding,
                    item.No_of_Panels,
                    item.Type_of_Insurance,
                    adjustToIST(item.Revised_Promise_Date),
                    adjustToIST(item.Insurance_Approval_Date),
                    item.Payable_By,
                    item.Reg_Num,
                    item.HoldUp_days_from_JC_opening,
                    item.Holdup_day_Beyond_Promise_Time,
                    item.Colour_Code,
                    item.Colour_Description,
                    item.Created_date.toISOString().slice(0, 10)
                ];
                const city = item.Dealer_City;
                const cityDMS = item.Dms_Loc;

                // If the city is already in the summaryReport, increment the count, else initialize it
                if (summaryReport[city]) {
                    summaryReport[city] += 1; // Increment the count
                } else {
                    summaryReport[city] = 1;  // Initialize the count
                }
                if (summaryReportDMS[cityDMS]) {
                    summaryReportDMS[cityDMS] += 1; // Increment the count
                } else {
                    summaryReportDMS[cityDMS] = 1;  // Initialize the count
                }
                // Parse the details array
                // const detailsArray = JSON.parse(item.details);
                const detailsArray = data12[0].filter(detail => detail.Reg_No == item.Reg_Num);

                // Dynamically add part-related data
                const partNumbers = detailsArray.map(d => d.Part_No);
                const partDescs = detailsArray.map(d => d.Part_Desc);
                const requestedQtys = detailsArray.map(d => d.Requested_Qty);
                const states = detailsArray.map(d => d.detail);

                // Create row for the main data
                if (detailsArray.length) {
                    pivot_array.push({ serviceType: item.Service_Type_Description, parts: detailsArray })

                    if (summaryReportDueToparts[city]) {
                        summaryReportDueToparts[city] += 1; // Increment the count
                    } else {
                        summaryReportDueToparts[city] = 1;  // Initialize the count
                    }
                    if (summaryReportDueTopartsDMS[cityDMS]) {
                        summaryReportDueTopartsDMS[cityDMS] += 1; // Increment the count
                    } else {
                        summaryReportDueTopartsDMS[cityDMS] = 1;  // Initialize the count
                    }
                    const row = worksheet.addRow([...mainData, `Total:- ${detailsArray.length}`, ...partNumbers]);
                    const issuedcount = detailsArray.filter(itmm => itmm.detail == 'Issued')
                    const Transitcount = detailsArray.filter(itmm => itmm.detail == 'Transit')
                    const asd = detailsArray.length - issuedcount.length;
                    // Add description, quantity, and state rows dynamically
                    worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', `Issued:- ${issuedcount.length}`, ...partDescs]);
                    worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', `Transit:- ${Transitcount.length}`, ...requestedQtys]);
                    worksheet.addRow(['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', `${asd >= 4 ? ">= 4" : asd >= 3 ? ">= 3" : asd >= 2 ? ">= 2" : asd >= 1 ? ">= 1" : " - "}`, ...states]);
                    if (asd >= 4) {
                        sheet4.addRow([...mainData, `Total:- ${detailsArray.length}`, ...partNumbers]);
                        // sheet4.addRow(descriptionRow);
                        // sheet4.addRow(quantityRow);
                        // sheet4.addRow(stateRow);
                    } else if (asd >= 3) {
                        sheet3.addRow([...mainData, `Total:- ${detailsArray.length}`, ...partNumbers]);
                        // sheet3.addRow(descriptionRow);
                        // sheet3.addRow(quantityRow);
                        // sheet3.addRow(stateRow);
                    } else if (asd >= 2) {
                        sheet2.addRow([...mainData, `Total:- ${detailsArray.length}`, ...partNumbers]);
                        // sheet2.addRow(descriptionRow);
                        // sheet2.addRow(quantityRow);
                        // sheet2.addRow(stateRow);
                    } else if (asd >= 1) {
                        sheet1.addRow([...mainData, `Total:- ${detailsArray.length}`, ...partNumbers]);
                        // sheet1.addRow(descriptionRow);
                        // sheet1.addRow(quantityRow);
                        // sheet1.addRow(stateRow);
                    }
                }

            });
            const pivotData = {};

            pivot_array.forEach((vehicle) => {
                const serviceType = vehicle.serviceType;

                if (!pivotData[serviceType]) {
                    pivotData[serviceType] = {};
                }

                vehicle.parts.forEach((part) => {
                    const partStatus = part.detail;

                    if (!pivotData[serviceType][partStatus]) {
                        pivotData[serviceType][partStatus] = 0;
                    }

                    pivotData[serviceType][partStatus] += 1;
                });
            });
            Object.keys(pivotData).forEach((serviceType) => {
                const totalParts = Object.values(pivotData[serviceType]).reduce(
                    (acc, count) => acc + count,
                    0
                );

                // Object.keys(pivotData[serviceType]).forEach((partStatus) => {
                //     const count = pivotData[serviceType][partStatus];
                //     const percentage = ((count / totalParts) * 100).toFixed(2);
                //     pivotData[serviceType][partStatus] = `${count} (${percentage}%)`;
                // });
            });
            const secondSheet = workbook.addWorksheet('City-wise Summary');
            const ThridSheet = workbook.addWorksheet('Parts Detail');
            const FourthSheet = workbook.addWorksheet('Parts Summary');

            const partStatuses = new Set();
            Object.values(pivotData).forEach((data) => {
                Object.keys(data).forEach((status) => {
                    partStatuses.add(status);
                });
            });

            const statusArray = Array.from(partStatuses);
            const forthheaders = ['Part Status / Service Type', ...Object.keys(pivotData), "Grand Total", "%"];

            FourthSheet.addRow(forthheaders);

            // Add data for each part status row
            statusArray.forEach((status) => {
                const rowData = [status];
                Object.keys(pivotData).forEach((serviceType) => {
                    rowData.push(pivotData[serviceType][status] || 0);
                });
                FourthSheet.addRow(rowData);
            });
            FourthSheet.addRow(["Grand Total"]);

            const lastRowNumber = FourthSheet.lastRow.number - 1; // Find the last row number
            const lastColumnNumber = forthheaders.length - 2; // Find the last column number based on the header row


            // Calculate row-wise totals and insert them in the last column
            for (let rowNumber = 2; rowNumber <= lastRowNumber; rowNumber++) { // Skip the header row
                let rowTotal = 0;
                for (let colNumber = 2; colNumber <= lastColumnNumber; colNumber++) { // Skip the first column (labels)
                    const cellValue = FourthSheet.getCell(rowNumber, colNumber).text;
                    const value = parseFloat(cellValue.replace(/[^0-9.]/g, "")); // Extract numeric value, ignoring percentages
                    rowTotal += value || 0; // Add to row total if value is valid
                }
                FourthSheet.getCell(rowNumber, lastColumnNumber + 1).value = rowTotal; // Put row total in the next column
            }

            // Calculate column-wise totals and insert them in the last row
            for (let colNumber = 2; colNumber <= lastColumnNumber; colNumber++) {
                let colTotal = 0;
                for (let rowNumber = 2; rowNumber <= lastRowNumber; rowNumber++) { // Skip the header row
                    const cellValue = FourthSheet.getCell(rowNumber, colNumber).text;
                    const value = parseFloat(cellValue.replace(/[^0-9.]/g, "")); // Extract numeric value, ignoring percentages
                    colTotal += value || 0; // Add to column total if value is valid
                }
                FourthSheet.getCell(lastRowNumber + 1, colNumber).value = colTotal; // Put column total in the next row
            }

            // Calculate the grand total from the last row
            let grandTotal = 0;
            for (let colNumber = 2; colNumber <= lastColumnNumber; colNumber++) {
                grandTotal += FourthSheet.getCell(lastRowNumber + 1, colNumber).value || 0; // Sum the column totals for grand total
            }

            // Set grand total in the last cell of the last row
            FourthSheet.getCell(lastRowNumber + 1, lastColumnNumber + 1).value = grandTotal;

            // Calculate percentage for each row in the last column
            for (let colNumber = 2; colNumber <= lastColumnNumber; colNumber++) { // Skip the header row
                const rowTotal = FourthSheet.getCell(lastRowNumber + 1, colNumber).value || 0;
                const percentage = (rowTotal / grandTotal) * 100; // Calculate percentage based on grand total
                FourthSheet.getCell(lastRowNumber + 2, colNumber).value = percentage.toFixed(2) + '%'; // Add percentage to the next column
            }
            for (let rowNumber = 2; rowNumber <= lastRowNumber; rowNumber++) { // Skip the header row
                const rowTotal = FourthSheet.getCell(rowNumber, lastColumnNumber + 1).value || 0;
                const percentage = (rowTotal / grandTotal) * 100; // Calculate percentage based on grand total
                FourthSheet.getCell(rowNumber, lastColumnNumber + 2).value = percentage.toFixed(2) + '%'; // Add percentage to the next column
            }
            // Set headers for percentage column
            FourthSheet.getCell(lastRowNumber + 1, lastColumnNumber + 2).value = "100 %"; // Header for percentage column
            FourthSheet.getCell(lastRowNumber + 2, lastColumnNumber + 1).value = "100 %"; // Header for percentage column
            FourthSheet.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: '000000' } },
                        left: { style: 'thin', color: { argb: '000000' } },
                        bottom: { style: 'thin', color: { argb: '000000' } },
                        right: { style: 'thin', color: { argb: '000000' } }
                    };
                });
            });

            // Center align the Grand Total cell
            FourthSheet.getCell(lastRowNumber + 1, lastColumnNumber + 1).alignment = { vertical: 'middle', horizontal: 'center' };
            const ThridSheetHeaders = Object.keys(data12[0][0]);
            const ThirdheaderRow = ThridSheet.addRow(ThridSheetHeaders);
            ThirdheaderRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FF006400" }, // dark green background color
                };
            });

            data12[0]?.forEach((obj) => {
                const values = Object.values(obj);

                // Assuming Order_date is one of the properties of obj
                const orderDateIndex = Object.keys(obj).indexOf('Order_Date'); // Get the index of Order_date
                if (orderDateIndex !== -1) { // Check if Order_date exists
                    const processedOrderDate = adjustToIST(obj.Order_Date); // Process Order_date
                    values[orderDateIndex] = processedOrderDate; // Replace the Order_date in the values array
                }

                ThridSheet.addRow(values);
            });
            ThridSheet.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: '000000' } },
                        left: { style: 'thin', color: { argb: '000000' } },
                        bottom: { style: 'thin', color: { argb: '000000' } },
                        right: { style: 'thin', color: { argb: '000000' } }
                    };
                });
            });
            sheet1.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: '000000' } },
                        left: { style: 'thin', color: { argb: '000000' } },
                        bottom: { style: 'thin', color: { argb: '000000' } },
                        right: { style: 'thin', color: { argb: '000000' } }
                    };
                });
            });
            sheet2.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: '000000' } },
                        left: { style: 'thin', color: { argb: '000000' } },
                        bottom: { style: 'thin', color: { argb: '000000' } },
                        right: { style: 'thin', color: { argb: '000000' } }
                    };
                });
            });
            sheet3.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: '000000' } },
                        left: { style: 'thin', color: { argb: '000000' } },
                        bottom: { style: 'thin', color: { argb: '000000' } },
                        right: { style: 'thin', color: { argb: '000000' } }
                    };
                });
            });
            sheet4.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: '000000' } },
                        left: { style: 'thin', color: { argb: '000000' } },
                        bottom: { style: 'thin', color: { argb: '000000' } },
                        right: { style: 'thin', color: { argb: '000000' } }
                    };
                });
            });

            // Adding headers to the second worksheet
            secondSheet.addRow(['City', 'Hold Up Vehicles Count', "Hold Up Due To Parts"]);
            // Adding city-wise data
            console.log(summaryReport);
            console.log(summaryReportDMS);
            const cityDataArray = Object.keys(summaryReport).map(city => ({
                city,
                holdUpVehiclesCount: summaryReport[city],
                "Hold Up Due To Parts": summaryReportDueToparts[city] ? summaryReportDueToparts[city] : 0
            }));
            cityDataArray.forEach((item) => {
                secondSheet.addRow([item.city, item.holdUpVehiclesCount, item["Hold Up Due To Parts"]]);
            });
            secondSheet.addRow([]); // Empty row
            secondSheet.addRow([]); // Another empty row

            // Second table for summaryReportDMS
            const thisRow = secondSheet.addRow(['Dms Location', 'Hold Up Vehicles Count', "Hold Up Due To Parts"]); // Header row for summaryReportDMS

            // Adding city-wise data for summaryReportDMS
            const cityDataArrayDMS = Object.keys(summaryReportDMS).map(city => ({
                city,
                holdUpVehiclesCount: summaryReportDMS[city],
                "Hold Up Due To Parts (DMS)": summaryReportDueTopartsDMS[city] ? summaryReportDueTopartsDMS[city] : 0
            }));

            // Adding rows to the second table (summaryReportDMS)
            cityDataArrayDMS.forEach((item) => {
                secondSheet.addRow([item.city, item.holdUpVehiclesCount, item["Hold Up Due To Parts (DMS)"]]);
            });
            secondSheet.eachRow({ includeEmpty: true }, (row) => {
                row.eachCell({ includeEmpty: true }, (cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: '000000' } },
                        left: { style: 'thin', color: { argb: '000000' } },
                        bottom: { style: 'thin', color: { argb: '000000' } },
                        right: { style: 'thin', color: { argb: '000000' } }
                    };
                });
            });
            // Adjust column widths
            worksheet.getRow(1).eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00FF00' } // Green background for the headers
                };
                cell.font = { bold: true }; // Making header font bold
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
            thisRow.eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00FF00' } // Green background for the headers
                };
                cell.font = { bold: true }; // Making header font bold
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
            secondSheet.getRow(1).eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00FF00' } // Green background for the headers
                };
                cell.font = { bold: true }; // Making header font bold
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
            sheet1.getRow(1).eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00FF00' } // Green background for the headers
                };
                cell.font = { bold: true }; // Making header font bold
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
            sheet2.getRow(1).eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00FF00' } // Green background for the headers
                };
                cell.font = { bold: true }; // Making header font bold
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
            sheet3.getRow(1).eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00FF00' } // Green background for the headers
                };
                cell.font = { bold: true }; // Making header font bold
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
            sheet4.getRow(1).eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00FF00' } // Green background for the headers
                };
                cell.font = { bold: true }; // Making header font bold
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });
            FourthSheet.getRow(1).eachCell(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF00FF00' } // Green background for the headers
                };
                cell.font = { bold: true }; // Making header font bold
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FF000000' } },
                    left: { style: 'thin', color: { argb: 'FF000000' } },
                    bottom: { style: 'thin', color: { argb: 'FF000000' } },
                    right: { style: 'thin', color: { argb: 'FF000000' } }
                };
            });

            // Define colors for alternating rows
            const alternateColors = ['FFE0E0E0', 'FFFFFFFF']; // Light gray and white

            // Function to apply colors to rows
            const applyRowColor = (startRow, endRow, color) => {
                for (let i = startRow; i <= endRow; i++) {
                    worksheet.getRow(i).eachCell(cell => {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: color }
                        };
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FF000000' } },
                            left: { style: 'thin', color: { argb: 'FF000000' } },
                            bottom: { style: 'thin', color: { argb: 'FF000000' } },
                            right: { style: 'thin', color: { argb: 'FF000000' } }
                        };
                    });
                }
            };

            // Assuming you start adding data from row 2 (first row has headers)
            const startingRow = 2;
            const rowsPerBlock = 4; // You have 4 rows per block (main data + 3 dynamic rows)

            for (let i = startingRow; i <= worksheet.lastRow.number; i += rowsPerBlock) {
                const endRow = i + rowsPerBlock - 1;

                // Determine color based on the block position (alternate row colors)
                const blockColor = alternateColors[(i - startingRow) / rowsPerBlock % alternateColors.length];

                // Apply color to the entire block
                applyRowColor(i, endRow, blockColor);

                // Merge cells from A to AG for each block of 4 rows and center align
                const columns = [
                    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P',
                    'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE',
                    'AF', 'AG', 'AH'
                ];

                columns.forEach(col => {
                    worksheet.mergeCells(`${col}${i}:${col}${endRow}`);

                    // Center align the merged cell content
                    const mergedCell = worksheet.getCell(`${col}${i}`);
                    mergedCell.alignment = {
                        vertical: 'middle',
                        horizontal: 'center'
                    };

                    // Apply the same background color for the merged cell block
                    mergedCell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: blockColor }
                    };
                    mergedCell.border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } }
                    };
                });
            }
            worksheet.columns.forEach((column, colNumber) => {
                let maxLength = 0;

                // Calculate the maximum content length in each column
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (rowNumber <= 50) { // Only consider the first 38 rows
                        maxLength = Math.max(maxLength, cellValue.length);
                    } else {
                        return; // Break the loop after processing the first 38 rows
                    }
                });

                // Apply the calculated width or the minimum width, whichever is greater
                column.width = Math.max(maxLength + 2, 10);
            });
            sheet1.columns.forEach((column, colNumber) => {
                let maxLength = 0;

                // Calculate the maximum content length in each column
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (rowNumber <= 50) { // Only consider the first 38 rows
                        maxLength = Math.max(maxLength, cellValue.length);
                    } else {
                        return; // Break the loop after processing the first 38 rows
                    }
                });

                // Apply the calculated width or the minimum width, whichever is greater
                column.width = Math.max(maxLength + 2, 10);
            });
            sheet2.columns.forEach((column, colNumber) => {
                let maxLength = 0;

                // Calculate the maximum content length in each column
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (rowNumber <= 50) { // Only consider the first 38 rows
                        maxLength = Math.max(maxLength, cellValue.length);
                    } else {
                        return; // Break the loop after processing the first 38 rows
                    }
                });

                // Apply the calculated width or the minimum width, whichever is greater
                column.width = Math.max(maxLength + 2, 10);
            });
            sheet3.columns.forEach((column, colNumber) => {
                let maxLength = 0;

                // Calculate the maximum content length in each column
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (rowNumber <= 50) { // Only consider the first 38 rows
                        maxLength = Math.max(maxLength, cellValue.length);
                    } else {
                        return; // Break the loop after processing the first 38 rows
                    }
                });

                // Apply the calculated width or the minimum width, whichever is greater
                column.width = Math.max(maxLength + 2, 10);
            });
            sheet4.columns.forEach((column, colNumber) => {
                let maxLength = 0;

                // Calculate the maximum content length in each column
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (rowNumber <= 50) { // Only consider the first 38 rows
                        maxLength = Math.max(maxLength, cellValue.length);
                    } else {
                        return; // Break the loop after processing the first 38 rows
                    }
                });

                // Apply the calculated width or the minimum width, whichever is greater
                column.width = Math.max(maxLength + 2, 10);
            });
            secondSheet.columns.forEach((column, colNumber) => {
                let maxLength = 0;

                // Calculate the maximum content length in each column
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (rowNumber <= 50) { // Only consider the first 38 rows
                        maxLength = Math.max(maxLength, cellValue.length);
                    } else {
                        return; // Break the loop after processing the first 38 rows
                    }
                });

                // Apply the calculated width or the minimum width, whichever is greater
                column.width = Math.max(maxLength + 2, 10);
            });
            ThridSheet.columns.forEach((column, colNumber) => {
                let maxLength = 0;

                // Calculate the maximum content length in each column
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (rowNumber <= 50) { // Only consider the first 38 rows
                        maxLength = Math.max(maxLength, cellValue.length);
                    } else {
                        return; // Break the loop after processing the first 38 rows
                    }
                });

                // Apply the calculated width or the minimum width, whichever is greater
                column.width = Math.max(maxLength + 2, 10);
            });
            FourthSheet.columns.forEach((column, colNumber) => {
                let maxLength = 0;

                // Calculate the maximum content length in each column
                column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
                    const cellValue = cell.value ? cell.value.toString() : '';
                    if (rowNumber <= 50) { // Only consider the first 38 rows
                        maxLength = Math.max(maxLength, cellValue.length);
                    } else {
                        return; // Break the loop after processing the first 38 rows
                    }
                });

                // Apply the calculated width or the minimum width, whichever is greater
                column.width = Math.max(maxLength + 2, 10);
            });


            // Write to file
            // return workbook;
            console.log('Excel file created successfully.');
        }
        await generateExcel();
        res.status(200).setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="Body_shop_holdUpReport ${new Date().toDateString()}.xlsx"`
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
function adjustToIST(dateStr) {
    return dateStr;
    const date = new Date(dateStr);

    // Define options for date formatting
    const options = {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false, // Use 24-hour format
        timeZone: 'Asia/Kolkata' // Set timezone explicitly if needed
    };

    // Format the date according to the options
    const formattedDate = date.toLocaleString('en-GB', options);

    return formattedDate == 'Invalid Date' ? dateStr : formattedDate;
};
exports.BodyShopOrderCheck = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const data12 = await sequelize.query(`SELECT distinct batch_id,cast(created_date as date) FROM Bodyshop_H order by cast(created_date as date) desc`)

        const data = await sequelize.query(`SELECT * FROM (
                SELECT *,
                CASE
                WHEN cast(isnull(HoldUp_days_from_JC_opening,0) as int) > 30 THEN '> 30 Days'
                WHEN cast(isnull(HoldUp_days_from_JC_opening,0) as int) BETWEEN 9 AND 30 THEN '9 to 30 days'
                WHEN cast(isnull(HoldUp_days_from_JC_opening,0) as int) BETWEEN 1 AND 8 THEN '1 to 8 days'
                ELSE 'Unknown' -- Optional: Handles cases where the condition doesn't match any criteria
                END as acbcddc,
                (SELECT 
                   DMS_Loc,
                    Part_No,
                    Part_Desc,
                    DMS_Order_No,
                    Order_Date,
                    Requested_Qty,
                    Reg_No,
                    IIF( EXISTS (SELECT 1 FROM BodyShop_A WHERE Root_Part_num = BodyShop_I.Part_No AND JobCard_Num = Holdup_JobCard_No), 'Issued',
                    IIF( EXISTS (SELECT 1 FROM BodyShop_F WHERE Dealer_Order_No IN 
                        (SELECT FIN_Ctrl_No FROM BodyShop_E 
                        WHERE REPLACE(REPLACE(REPLACE(Dlr_Order_No, '_', ''), '/', ''), '-', '') LIKE '%' + REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') + '%' 
                        AND Part_No = BodyShop_I.Part_No)), 'Order Received',
                    IIF( EXISTS (SELECT 1 FROM BodyShop_D WHERE FIN_Ctrl_No IN 
                        (SELECT FIN_Ctrl_No FROM BodyShop_E 
                        WHERE REPLACE(REPLACE(REPLACE(Dlr_Order_No, '_', ''), '/', ''), '-', '') LIKE '%' + REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') + '%' 
                        AND Part_No = BodyShop_I.Part_No)), 'Transit',
                    IIF( EXISTS (SELECT 1 FROM BodyShop_E 
                        WHERE REPLACE(REPLACE(REPLACE(Dlr_Order_No, '_', ''), '/', ''), '-', '') LIKE '%' + REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') + '%' 
                        AND Part_No = BodyShop_I.Part_No), 'Invoiced',
                    IIF( EXISTS (SELECT 1 FROM BodyShop_J 
                        WHERE REPLACE(REPLACE(REPLACE(DlrOrd_No, '_', ''), '/', ''), '-', '') LIKE '%' + REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') + '%' 
                        AND PART_NUMBER = BodyShop_I.Part_No), 'Under Invoicing',
                    IIF( EXISTS (SELECT 1 FROM BodyShop_G 
                        WHERE REPLACE(REPLACE(REPLACE(Dlr_Ord_No, '_', ''), '/', ''), '-', '') LIKE '%' + REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') + '%' 
                        AND Part_No = BodyShop_I.Part_No), 'Picking',
                    IIF( EXISTS (SELECT 1 FROM BodyShop_B 
                        WHERE REPLACE(REPLACE(REPLACE(DEALER_ORDER_NO, '_', ''), '/', ''), '-', '') LIKE '%' + REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') + '%' 
                        AND PART_NUMBER = BodyShop_I.Part_No), 'Allocating',
                    IIF( EXISTS (SELECT 1 FROM BodyShop_C 
                        WHERE REPLACE(REPLACE(REPLACE(DEALER_ORDER_NO, '_', ''), '/', ''), '-', '') LIKE '%' + REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') + '%' 
                        AND Part_Number = BodyShop_I.Part_No), 'Back Order',
                    IIF( EXISTS (SELECT 1 FROM BodyShop_K 
                        WHERE REPLACE(REPLACE(REPLACE(Dealer_Ord_No, '_', ''), '/', ''), '-', '') LIKE '%' + REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') + '%' 
                        AND Part_No = BodyShop_I.Part_No), 
                        (SELECT TOP 1 error FROM BodyShop_K WHERE REPLACE(REPLACE(REPLACE(Dealer_Ord_No, '_', ''), '/', ''), '-', '') LIKE '%' + REPLACE(REPLACE(REPLACE(DMS_Order_No, '_', ''), '/', ''), '-', '') + '%' 
                            AND Part_No = BodyShop_I.Part_No), 
                    'Unknown State')))))))))
                AS detail
                FROM BodyShop_I 
                WHERE Reg_No = Reg_num
                AND batch_id = '${data12[0][0].batch_id}' 
                FOR JSON PATH, INCLUDE_NULL_VALUES
                ) AS details 
                FROM Bodyshop_H where batch_id = '${data12[0][0].batch_id}' and reg_num = '${req.body.reg_no}'
                ) AS aas 
                WHERE details IS NOT NULL;
        `)
        console.log(data[0]);

        const { details,
            JobCard_Open_Date,
            Promised_Date,
            Date,
            Revised_Sugg_Promise_Date,
            Suggested_Promise_Date,
            Revised_Promise_Date,
            Insurance_Approval_Date, ...data1 } = data[0][0];

        const newJobCard_Open_Date = adjustToIST(JobCard_Open_Date);
        const newPromised_Date = adjustToIST(Promised_Date);
        const newDate = adjustToIST(Date);
        const newRevised_Sugg_Promise_Date = adjustToIST(Revised_Sugg_Promise_Date);
        const newSuggested_Promise_Date = adjustToIST(Suggested_Promise_Date);
        const newRevised_Promise_Date = adjustToIST(Revised_Promise_Date);
        const newInsurance_Approval_Date = adjustToIST(Insurance_Approval_Date);
        const newdataaa = JSON.parse(details).map((item) => ({
            ...item,
            Order_Date: adjustToIST(item.Order_Date)
        }))


        const newdata = {
            details: newdataaa,
            JobCard_Open_Date: newJobCard_Open_Date,
            Promised_Date: newPromised_Date,
            Date: newDate,
            Revised_Sugg_Promise_Date: newRevised_Sugg_Promise_Date,
            Suggested_Promise_Date: newSuggested_Promise_Date,
            Revised_Promise_Date: newRevised_Promise_Date,
            Insurance_Approval_Date: newInsurance_Approval_Date, ...data1
        }
        res.status(200).send(newdata);
    } catch (e) {
        console.log(e);
        res.status(500).send({});
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};
exports.GetBtachAndCount = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const data1 = await sequelize.query(`SELECT distinct top 5  batch_id,batch_id as value,batch_id as label,cast(created_date as date) as date_ FROM Bodyshop_H order by cast(created_date as date) desc`)

        const data = await sequelize.query(`
            select * from (
                select count(*) as count_,'BodyShop_A' as [name] from BodyShop_A where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_B' as [name] from BodyShop_B where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_C' as [name] from BodyShop_C where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_D' as [name] from BodyShop_D where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_E' as [name] from BodyShop_E where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_F' as [name] from BodyShop_F where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_G' as [name] from BodyShop_G where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_H' as [name] from BodyShop_H where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_I' as [name] from BodyShop_I where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_J' as [name] from BodyShop_J where batch_id = '${data1[0][0].batch_id}'
                    union all select count(*),'BodyShop_K' as [name] from BodyShop_K where batch_id = '${data1[0][0].batch_id}'
                ) as abce`)
        console.log(data[0]);


        res.status(200).send({ data: data[0], tableMapper, batches: data1[0] });
    } catch (e) {
        console.log(e);
        res.status(500).send({});
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};







