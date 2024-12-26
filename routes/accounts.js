const { Sequelize, DataTypes, literal, QueryTypes, Op } = require('sequelize');
const { dbname } = require('../utils/dbconfig');
const Joi = require('joi');
const { _DmsRowData, DmsRowDataSchema } = require("../models/DmsRowData");

const { _BookMst, bookMstSchema } = require("../models/BookMst");
const { _ItemsMst, itemsMstSchema } = require("../models/ItemsMst");
const { _ItemsDtl, itemsDtlSchema } = require("../models/ItemsDtl");
const { _InventoryItems, InventoryItemsSchema } = require("../models/InventoryItems");
const { _BranchWiseItemOpening, branchWiseItemOpeningSchema } = require("../models/BranchWiseItemOpening");
const numberToWords = require('number-to-words');
const FormData = require("form-data");
const axios = require("axios");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");
const e = require('cors');

exports.BrWiseItemsOpSave = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        console.log(BodyData, 'BodyData')
        const { error, value: OpeningData } = branchWiseItemOpeningSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true,
        });
        console.log(error, 'error')
        const Created_by = OpeningData.Created_by;
        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            const t = await sequelize.transaction();
            const BranchWiseItemOpening = _BranchWiseItemOpening(sequelize, DataTypes);
            try {
                await BranchWiseItemOpening.bulkCreate(
                    OpeningData.map((items) => ({ ...items })),
                    { transaction: t }
                );
                await t.commit();
                res.status(200).send({ success: true, Message: "Data saved" });
            } catch (error) {
                res.status(200).send({
                    success: false,
                    message: "An error occurred while creating Budget Data.",
                    error,
                });
                await t.rollback();
            }
        }
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
}
exports.QueryWindow = async function (req, res) {
    console.log('kjhgcxvgh')
    const sequelize = await dbname(req.headers.compcode);
    const { query } = req.body.query;
    if (!query) {
        return res.status(400).send({ error: "Query is required" });
    }
    try {
        const result = await sequelize.query(query);
        res.status(200).send({ data: result[0] });
    } catch (e) {
        console.error("SQL Error:", error.message);
        res.status(500).send({ error: "Error executing query", details: error.message });
    } finally {
        sequelize.close();
    }
};
exports.DmsRowDataSave = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const BodyData = req.body.data;
    const ENTRTYPE = BodyData.INTRYTYPE;
    const formdata = BodyData.formdata;
    console.log(BodyData.savedata,'formdata')
    if (ENTRTYPE == 1) {
        const FindPrevBills = await sequelize.query(`SELECT * FROM DMS_ROW_DATA where bill_no = '${formdata.Sale_Type}' AND GST = '${formdata.GST}'`);
        if (FindPrevBills[0].length !== 0) {
            return res.status(400).send({
                success: false,
                message: "Vendor Invoice Already Exist on the Provided GST No."
            });
        }
    }
    const t = await sequelize.transaction();
    const DmsRowData = _DmsRowData(sequelize, DataTypes);
    const ItemsMst = _ItemsMst(sequelize, DataTypes);
    const ItemsDtl = _ItemsDtl(sequelize, DataTypes);
    const InventoryItems = _InventoryItems(sequelize, DataTypes);
    try {
        const savedata = BodyData.savedata;
        const Created_by = BodyData.Created_By;
        const FindUserCode = await sequelize.query(`
        select User_Code FROM user_tbl where User_Name  = '${Created_by}' AND Export_Type = 1 AND Module_Code = 10`);
        console.log(FindUserCode[0][0].User_Code)
        const inv_no = await sequelize.query(`SELECT CONCAT((SELECT TOP 1 Book_Prefix FROM book_mst WHERE book_code =
                (SELECT misc_dtl1 FROM misc_mst WHERE misc_code = '${BodyData.formdata.Tran_Type}' and misc_type = 56)),
                isnull(MAX(seq_no) + 1, 1)) AS bill_no FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formdata.Tran_Type}' and Export_type < 3;`);
        const MaxTranId = await sequelize.query(`SELECT isnull(max(Tran_Id)+20,1) AS TRAN_ID from DMS_ROW_DATA`);
        let Tran_Id = MaxTranId[0][0]?.TRAN_ID;
        const MaxSeq = await sequelize.query(`select isnull(MAX(seq_no) + 1, 1) AS SeqNo FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formdata.Tran_Type}' and Export_type < 3;`);
        let Seq_No = MaxSeq[0][0]?.SeqNo;
        const LedgName = await sequelize.query(`SELECT Ledg_Name, Ledg_Add6 FROM Ledg_Mst WHERE Ledg_Code ='${formdata.LEDG_ACNT}' and Export_type < 3;`);
        const MaxIItem = await sequelize.query(`SELECT isnull(max(TRAN_ID)+1,1) AS TRANID from ItemsMst WHERE TRAN_TYPE = ${ENTRTYPE}`);
        let MaxItemId = MaxIItem[0][0]?.TRANID;
        let SavedUTD;
        let TotalInvAmount = 0
        if (ENTRTYPE == 1 || ENTRTYPE == 2) {
            let ItemsDtlData = [];
            let SRNO = 1;
            BodyData.savedata.forEach((rowData) => {
                console.log(rowData)

                let row = {
                    SRNO: SRNO++,
                    CODE: rowData.Item_Name,
                    DESCRIPTION: rowData.Item_NameLabel,
                    Location: rowData.Location1,
                    CATEGORY: rowData.Category,
                    ITEM_TYPE: rowData.Item_Type,
                    UOM: rowData.UOM1,
                    HSN_CODE: rowData.HSN,
                    QUANTITY: rowData.Sup_Qty,
                    RATE: rowData.Basic_Price,
                    BATCH: rowData.BATCH,
                    SGST_PERCT: rowData.SGST_Perc ? rowData.SGST_Perc : null,
                    SGST_VALUE: rowData.SGST,
                    CGST_PERCT: rowData.CGST_Perc ? rowData.CGST_Perc : null,
                    CGST_VALUE: rowData.CGST,
                    IGST_PERCT: rowData.IGST_Perc ? rowData.IGST_Perc : null,
                    IGST_VALUE: rowData.IGST,
                    CESS_PERCT: rowData.Cess_Perc ? rowData.Cess_Perc : null,
                    CESS_VALUE: rowData.Cess_Amt,
                    DISC_PERCT: rowData.discp ? rowData.discp : null,
                    DISC_VALUE: rowData.Disc_Amt,
                    LOC_CODE: rowData.Loc_Code,
                    EXPORT_TYPE: 1,
                    SERVER_ID: 1,
                    BRAND: rowData.BRAND1,
                    Sale_Ledg: rowData.Sale_ledg1,
                    Inv_Amt: rowData.Inv_Amt,
                    Cost_Center: rowData.Cost_Center1
                };
                ItemsDtlData.push(row);
            });
            let TotalSgst = 0;
            let TotalCgst = 0;
            let TotalIgst = 0;
            let TotalBasic_Price = 0;
            console.log(ItemsDtlData,'ItemsDtlDataItemsDtlData')
            ItemsDtlData.forEach((rowData) => {
                TotalSgst += parseFloat(rowData.SGST_VALUE || 0);
                TotalCgst += parseFloat(rowData.CGST_VALUE || 0);
                TotalIgst += parseFloat(rowData.IGST_VALUE || 0);
                TotalBasic_Price += parseFloat(rowData.RATE || 0);
            })
             TotalInvAmount = TotalSgst + TotalCgst + TotalIgst + TotalBasic_Price;

             console.log(TotalInvAmount,'TotalInvAmount')
            const ItemsMstData = {
                BOOK_CODE: formdata.Tran_Type,
                VOUCHER_NO: formdata.Seq_No,
                VOUCHER_DATE: formdata.Bill_Date,
                // INV_NO: formdata.Bill_No,
                PARTY_AC: formdata.LEDG_ACNT,
                DISP_NAME: formdata.print_name,
                REF_NO: formdata.Sale_Type,
                REF_DATE: formdata.Ref_Dt,
                NARR: formdata.Narration,
                STATE_CODE: formdata.State_Code,
                SUPP_GST: formdata.GST,
                REG_TYPE: formdata.registration_type,
                REV_CHRGS: formdata.Is_Rcm,
                DISP_ADD: formdata.DISP_ADD,
                Exp_Ledg1: formdata.Exp_Ledg4,
                Exp_Ledg2: formdata.Exp_Ledg5,
                Exp_Ledg3: formdata.Exp_Ledg6,
                Exp_Ledg4: formdata.Exp_Ledg7,
                TDS_Ledg: formdata.Exp_Ledg8,
                Exp_Perc1: formdata.Exp_Perc4,
                Exp_Perc2: formdata.Exp_Perc5,
                Exp_Perc3: formdata.Exp_Perc6,
                Exp_Perc4: formdata.Exp_Perc7,
                Tds_Perc: formdata.Exp_Perc8,
                Exp_Amt1: formdata.Exp_Amt4,
                Exp_Amt2: formdata.Exp_Amt5,
                Exp_Amt3: formdata.Exp_Amt6,
                Exp_Amt4: formdata.Exp_Amt7,
                Tds_Amt: formdata.Exp_Amt8,
                Inv_Amt: formdata.net_total,
                LOC_CODE: formdata.Loc_Code,
                CUST_PAN: formdata.CUST_PAN,
                Export_Type: 1,
                ServerId: 1,
            };

            const { error: error1, value: value1 } = itemsMstSchema.validate(ItemsMstData, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error1, 'error1')
            console.log(value1, 'value1')
            // if (error1) {
            //     const errorMessage = error1.details.map((err) => err.message).join(", ");
            //     console.log(errorMessage, 'errorMessage1')
            //     return res.status(400).send({ success: false, message: errorMessage });
            // } else {
            if ((ENTRTYPE == 1 && req.body.Purchase) || (ENTRTYPE == 2 && req.body.Sale)) {
                SavedUTD = await ItemsMst.create({
                    ...value1, TRAN_ID: MaxItemId, TRAN_TYPE: ENTRTYPE,
                    INV_NO: inv_no[0][0].bill_no, Created_by, DRD_ID: Tran_Id,
                    VOUCHER_NO: Seq_No
                }, { transaction: t });
            } else {
                SavedUTD = await ItemsMst.create({
                    ...value1, TRAN_ID: MaxItemId, TRAN_TYPE: ENTRTYPE,
                    Created_by
                }, { transaction: t });
            }
            // }
            const a = Joi.object({
                e: Joi.array().items(itemsDtlSchema)
            });
            const { error: error2, value: value2 } = a.validate({ e: ItemsDtlData }, {
                abortEarly: false,
                stripUnknown: true
            });
            // if (error2) {
            //     const errorMessage = error2.details.map((err) => err.message).join(", ");
            //     console.log(errorMessage, 'errorMessage2')
            //     return res.status(400).send({ success: false, message: errorMessage });
            // } else {
            await ItemsDtl.bulkCreate(
                value2.e.map((value2) => ({
                    TRAN_ID: MaxItemId,
                    TRAN_TYPE: ENTRTYPE,
                    Created_by,
                    ...value2,
                })),
                { transaction: t });
            // }
            const items = ItemsDtlData;

            const codeMap = {};
            items.forEach(item => {
                const { CODE, QUANTITY } = item;
                if (codeMap[CODE]) {
                    codeMap[CODE] += parseFloat(QUANTITY);
                } else {
                    codeMap[CODE] = parseFloat(QUANTITY);
                }
            });
            const result = Object.keys(codeMap).map(CODE => ({
                CODE,
                QUANTITY: codeMap[CODE]
            }));
            const updatePromises = result.map(async (item) => {
                const CurrentQty = await InventoryItems.findOne({
                    attributes: ["IN_STOCK_QTY"],
                    where: { UTD: item.CODE },
                });
                let currQty = CurrentQty.IN_STOCK_QTY ? CurrentQty.IN_STOCK_QTY : 0;
                if (ENTRTYPE === 1) {
                    let cutie = parseFloat(currQty) + parseFloat(item.QUANTITY);
                    await InventoryItems.update(
                        { IN_STOCK_QTY: cutie, Created_by },
                        { where: { UTD: item.CODE } }
                    );
                } else if (ENTRTYPE === 2) {
                    let cutie = parseFloat(currQty) - parseFloat(item.QUANTITY);
                    await InventoryItems.update(
                        { IN_STOCK_QTY: cutie, Created_by },
                        { where: { UTD: item.CODE } }
                    );
                }
            });
            await Promise.all(updatePromises);
        }
        let DrdFinData = savedata.map(item => ({ ...formdata, ...item }));
        if (ENTRTYPE == 1 || ENTRTYPE == 2) {
            let ItemsUtd = DrdFinData.map(item => item["Item_Name"]).join(',');
            let ItemCodes = await sequelize.query(`SELECT ITEM_CODE,UTD FROM InventoryItems WHERE UTD in (${ItemsUtd})`);
            let itemCodeMap = {};
            ItemCodes[0].forEach(row => {
                itemCodeMap[row.UTD] = row.ITEM_CODE;
            });
            DrdFinData = DrdFinData.map(item => ({
                ...item,
                ITEM_CODE: itemCodeMap[item["Item_Name"]] || null
            }));
        }
        const currentDate = new Date();
        const ENTR_DATE = currentDate.toISOString().split('T')[0];
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const ENTR_TIME = `${hours}.${minutes}`;
        
        if ((ENTRTYPE == 1 && req.body.Purchase) || (ENTRTYPE == 2 && req.body.Sale)) {
            await Promise.all(DrdFinData.map(async (item) => {
                const Cost_Center = item.Cost_Center1;
                const Sale_Ledg = item.Sale_ledg1;
                const LOCATION = item.Location1;
                const UoM = item.UOM1;
                console.log(formdata.net_total,'formdata.net_totalformdata.net_totalformdata.net_total')
                console.log(TotalInvAmount,'TotalInvAmountta.net_total')
                const updateData = {
                    ...item,
                    UoM,
                    Sale_Ledg,
                    Cost_Center,
                    Inv_Amt: Math.round(formdata.net_total),
                    Rnd_Off: (Math.round(formdata.net_total) - TotalInvAmount).toFixed(2),
                    Rnd_Ledg: 23,
                    USR_CODE: FindUserCode[0][0].User_Code,
                    ENTR_DATE: ENTR_DATE,
                    ENTR_TIME: ENTR_TIME,
                    LOCATION
                }
                console.log(updateData,'updateData')
                const StateName = await sequelize.query(`SELECT Misc_Name FROM Misc_Mst WHERE Misc_type = 3 AND Misc_Code = ${updateData.State_Code ? `'${updateData.State_Code}'` : null}`);
                await sequelize.query(`
                    INSERT INTO DMS_ROW_DATA (
                      Tran_Id, Item_Code, Ledger_Name, Ledger_Id, Bill_Date, Ref_Dt, Tran_Type, 
                      Seq_No, Bill_No, LEDG_ACNT, 
                      GST, State_Code,
                      Exp_Amt4, Exp_Amt5, 
                      Exp_Amt6, Exp_Amt7, Exp_Amt8, 
                      Exp_Ledg4, 
                      Exp_Perc4, Exp_Ledg5, Exp_Perc5, 
                      Exp_Ledg6, Exp_Perc6, Exp_Ledg7, 
                      Exp_Perc7, Exp_Ledg8, Exp_Perc8, 
                      Sale_Type, Narration, Loc_Code, 
                       Category, 
                      Item_Type, HSN, Sup_Qty, 
                       Basic_Price, 
                       Taxable, Assessable_Rate, 
                      CGST_Perc, CGST, SGST_Perc, 
                      SGST, IGST_Perc, IGST, 
                      Cess_Perc, Cess_Amt, Inv_Amt, 
                      UoM, Sale_Ledg, Cost_Center, 
                      Rnd_Off, Rnd_Ledg, USR_CODE, 
                      ENTR_DATE, ENTR_TIME, LOCATION, ENTRY_BATCH, Export_Type
                    ) VALUES (
                      ${Tran_Id},
                      ${updateData.ITEM_CODE ? `'${updateData.ITEM_CODE}'` : `'${updateData.Item_Name}'`},
                      '${LedgName[0][0].Ledg_Name}',
                      ${LedgName[0][0].Ledg_Add6 ? `'${LedgName[0][0].Ledg_Add6}'` : null},
                      ${updateData.Bill_Date ? `'${updateData.Bill_Date}'` : null},
                      ${updateData.Ref_Dt ? `'${updateData.Ref_Dt}'` : null},
                      ${updateData.Tran_Type ? `'${updateData.Tran_Type}'` : null},
                      ${updateData.Seq_No ? updateData.Seq_No : null},
                      ${updateData.Bill_No ? `'${updateData.Bill_No}'` : null},
                      ${updateData.LEDG_ACNT ? updateData.LEDG_ACNT : null},
                      ${updateData.GST ? `'${updateData.GST}'` : null},
                      '${StateName[0][0].Misc_Name}',
                      ${updateData.Exp_Amt4 ? updateData.Exp_Amt4 : null},
                      ${updateData.Exp_Amt5 ? updateData.Exp_Amt5 : null},
                      ${updateData.Exp_Amt6 ? updateData.Exp_Amt6 : null},
                      ${updateData.Exp_Amt7 ? updateData.Exp_Amt7 : null},
                      ${updateData.Exp_Amt8 ? updateData.Exp_Amt8 : null},
                      ${updateData.Exp_Ledg4 ? updateData.Exp_Ledg4 : null},
                      ${updateData.Exp_Perc4 ? updateData.Exp_Perc4 : null},
                      ${updateData.Exp_Ledg5 ? updateData.Exp_Ledg5 : null},
                      ${updateData.Exp_Perc5 ? updateData.Exp_Perc5 : null},
                      ${updateData.Exp_Ledg6 ? updateData.Exp_Ledg6 : null},
                      ${updateData.Exp_Perc6 ? updateData.Exp_Perc6 : null},
                      ${updateData.Exp_Ledg7 ? updateData.Exp_Ledg7 : null},
                      ${updateData.Exp_Perc7 ? updateData.Exp_Perc7 : null},
                      ${updateData.Exp_Ledg8 ? updateData.Exp_Ledg8 : null},
                      ${updateData.Exp_Perc8 ? updateData.Exp_Perc8 : null},
                      ${updateData.Sale_Type ? `'${updateData.Sale_Type}'` : null},
                      ${updateData.Narration ? `'${updateData.Narration}'` : null},
                      ${updateData.Loc_Code ? updateData.Loc_Code : null},
                      ${updateData.Category ? updateData.Category : null},
                      ${updateData.Item_Type ? updateData.Item_Type : null},
                      ${updateData.HSN ? `'${updateData.HSN}'` : null},
                      ${updateData.Sup_Qty ? updateData.Sup_Qty : null},
                      ${updateData.Basic_Price ? updateData.Basic_Price : null},
                      ${updateData.Taxable ? updateData.Taxable : null},
                      ${updateData.Assessable_Rate ? updateData.Assessable_Rate : null},
                      ${updateData.CGST_Perc ? updateData.CGST_Perc : null},
                      ${updateData.CGST ? updateData.CGST : null},
                      ${updateData.SGST_Perc ? updateData.SGST_Perc : null},
                      ${updateData.SGST ? updateData.SGST : null},
                      ${updateData.IGST_Perc ? updateData.IGST_Perc : null},
                      ${updateData.IGST ? updateData.IGST : null},
                      ${updateData.Cess_Perc ? updateData.Cess_Perc : null},
                      ${updateData.Cess_Amt ? updateData.Cess_Amt : null},
                      ${updateData.Inv_Amt ? updateData.Inv_Amt : null},
                      ${updateData.UoM ? updateData.UoM : null},
                      ${updateData.Sale_Ledg ? updateData.Sale_Ledg : null},
                      ${updateData.Cost_Center ? updateData.Cost_Center : null},
                      ${updateData.Rnd_Off ? updateData.Rnd_Off : null},
                      ${updateData.Rnd_Ledg ? updateData.Rnd_Ledg : null},
                      ${updateData.USR_CODE ? updateData.USR_CODE : null},
                      ${updateData.ENTR_DATE ? `'${updateData.ENTR_DATE}'` : null},
                      ${updateData.ENTR_TIME ? `'${updateData.ENTR_TIME}'` : null},
                      ${updateData.LOCATION ? `'${updateData.LOCATION}'` : null},
                      'CLOUD-${Tran_Id}',
                      0)`, { transaction: t });
            }));
        }

        if ((ENTRTYPE == 1 && req.body.Purchase) || (ENTRTYPE == 2 && req.body.Sale)) {
            await sequelize.query(`INSERT INTO VAS_TEMP 
                (TRAN_ID, EXPORT_TYPE) 
                VALUES 
                (${Tran_Id}, 1)
                `, { transaction: t });
        }
        await t.commit();
        res.status(200).send({ success: true, message: "Data Saved....!", MaxItemId: SavedUTD });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: `Error occurred while Inserting Data `,
            error: error,
        });
        await t.rollback();
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.DmsRowDataUpdate = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const DmsRowData = _DmsRowData(sequelize, DataTypes);
    const ItemsMst = _ItemsMst(sequelize, DataTypes);
    const ItemsDtl = _ItemsDtl(sequelize, DataTypes);
    const InventoryItems = _InventoryItems(sequelize, DataTypes);
    try {
        const BodyData = req.body;
        console.log(BodyData.TRAN_ID, 'TRAN_ID')
        const ENTRTYPE = BodyData.INTRYTYPE;
        const formdata = BodyData.formdata;
        const savedata = BodyData.savedata;
        const Created_by = BodyData.Created_By;
        const LedgName = await sequelize.query(`SELECT Ledg_Name, Ledg_Add6 FROM Ledg_Mst WHERE Ledg_Code ='${formdata.LEDG_ACNT}' and Export_type < 3;`);

        if (ENTRTYPE == 1 || ENTRTYPE == 2) {
            let ItemsDtlData = [];
            let SRNO = 1;
            BodyData.savedata.forEach((rowData) => {
                console.log(rowData)
                let row = {
                    // UTD: rowData.UTD,
                    SRNO: SRNO++,
                    CODE: rowData.Item_Name,
                    DESCRIPTION: rowData.Item_NameLabel,
                    Location: rowData.Location1,
                    CATEGORY: rowData.Category,
                    ITEM_TYPE: rowData.Item_Type,
                    UOM: rowData.UOM1,
                    HSN_CODE: rowData.HSN,
                    QUANTITY: rowData.Sup_Qty,
                    RATE: rowData.Basic_Price,
                    BATCH: rowData.BATCH,
                    SGST_PERCT: rowData.SGST_Perc ? parseFloat(rowData.SGST_Perc) : null,
                    SGST_VALUE: rowData.SGST,
                    CGST_PERCT: rowData.CGST_Perc ? parseFloat(rowData.CGST_Perc) : null,
                    CGST_VALUE: rowData.CGST,
                    IGST_PERCT: rowData.IGST_Perc ? parseFloat(rowData.IGST_Perc) : null,
                    IGST_VALUE: rowData.IGST,
                    CESS_PERCT: rowData.Cess_Perc ? parseFloat(rowData.Cess_Perc) : null,
                    CESS_VALUE: rowData.Cess_Amt,
                    DISC_PERCT: rowData.discp ? rowData.discp : null,
                    DISC_VALUE: rowData.Disc_Amt,
                    LOC_CODE: rowData.Loc_Code,
                    EXPORT_TYPE: 1,
                    SERVER_ID: 1,
                    BRAND: rowData.BRAND1,
                    Sale_Ledg: rowData.Sale_ledg1,
                    Inv_Amt: rowData.Inv_Amt,
                    Cost_Center: rowData.Cost_Center1
                };
                ItemsDtlData.push(row);
            });
            // console.log(ItemsDtlData,'ItemsDtlData')

            let FinalData = [];
            const SavedDtlData = await ItemsDtl.findAll({
                where: { TRAN_ID: BodyData.TRAN_ID },
            });
            const allDataValues = SavedDtlData.map(item => item.dataValues);
            await Promise.all(allDataValues.map(async (item) => {
                const SavedQty = await ItemsDtl.findOne({
                    attributes: ["QUANTITY"],
                    where: { UTD: item.UTD },
                });
                let updatedItem = {
                    ...item,
                    SavedQuantity: SavedQty ? SavedQty.QUANTITY : null
                };
                FinalData.push(updatedItem);
            }));
            await Promise.all(FinalData.map(async (item, index) => {
                const InStockQty = await InventoryItems.findOne({
                    attributes: ["IN_STOCK_QTY"],
                    where: { UTD: item.CODE },
                });
                FinalData[index] = {
                    ...item,
                    InStockQty: InStockQty ? InStockQty.IN_STOCK_QTY : null
                };
            }));
            const ItemsMstData = {
                BOOK_CODE: formdata.Tran_Type,
                VOUCHER_NO: formdata.Seq_No,
                VOUCHER_DATE: formdata.Bill_Date,
                // INV_NO: formdata.Bill_No,
                PARTY_AC: formdata.LEDG_ACNT,
                DISP_NAME: formdata.print_name,
                REF_NO: formdata.Sale_Type,
                REF_DATE: formdata.Ref_Dt,
                NARR: formdata.Narration,
                STATE_CODE: formdata.State_Code,
                SUPP_GST: formdata.GST,
                REG_TYPE: formdata.registration_type,
                REV_CHRGS: formdata.Is_Rcm,
                DISP_ADD: formdata.DISP_ADD,
                Exp_Ledg1: formdata.Exp_Ledg4,
                Exp_Ledg2: formdata.Exp_Ledg5,
                Exp_Ledg3: formdata.Exp_Ledg6,
                Exp_Ledg4: formdata.Exp_Ledg7,
                TDS_Ledg: formdata.Exp_Ledg8,
                Exp_Perc1: formdata.Exp_Perc4,
                Exp_Perc2: formdata.Exp_Perc5,
                Exp_Perc3: formdata.Exp_Perc6,
                Exp_Perc4: formdata.Exp_Perc7,
                Tds_Perc: formdata.Exp_Perc8,
                Exp_Amt1: formdata.Exp_Amt4,
                Exp_Amt2: formdata.Exp_Amt5,
                Exp_Amt3: formdata.Exp_Amt6,
                Exp_Amt4: formdata.Exp_Amt7,
                Tds_Amt: formdata.Exp_Amt8,
                Inv_Amt: formdata.net_total,
                LOC_CODE: formdata.Loc_Code,
                Export_Type: 1,
                ServerId: 1,
            };
            const { error: error1, value: value1 } = itemsMstSchema.validate(ItemsMstData, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error1, 'error1')
            if (error1) {
                const errorMessage = error1.details.map((err) => err.message).join(", ");
                console.log(errorMessage, 'errorMessage1')
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                await ItemsMst.update({ ...value1, Created_by }, {
                    where: { UTD: BodyData.UTD }
                }, { transaction: t });
            }
            const a = Joi.object({
                e: Joi.array().items(itemsDtlSchema)
            });
            const { error: error2, value: value2 } = a.validate({ e: ItemsDtlData }, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error2, 'error2')
            if (error2) {
                const errorMessage = error2.details.map((err) => err.message).join(", ");
                console.log(errorMessage, 'errorMessage2')
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                await ItemsDtl.destroy({
                    where: {
                        TRAN_ID: BodyData.TRAN_ID,
                        TRAN_TYPE: ENTRTYPE
                    }
                }, { transaction: t });

                await ItemsDtl.bulkCreate(
                    value2.e.map((value2) => ({
                        TRAN_ID: BodyData.TRAN_ID,
                        TRAN_TYPE: ENTRTYPE,
                        Created_by,
                        ...value2,
                    })), { transaction: t });
                let OriginalQty = 0;
                const ReverseStockImpact = FinalData.map(async (item) => {
                    const inStockQty = parseFloat(item.InStockQty);
                    const savedQty = parseFloat(item.SavedQuantity);
                    if (!isNaN(inStockQty) && !isNaN(savedQty)) {
                        if (ENTRTYPE === 1) {
                            OriginalQty = inStockQty - savedQty;
                        } else if (ENTRTYPE === 2) {
                            OriginalQty = inStockQty + savedQty;
                        }
                        console.log(OriginalQty, 'OriginalQty')
                    } else {
                        console.error('Invalid number detected:', { InStockQty: item.InStockQty, SavedQty: item.SavedQty });
                    }
                });
                await Promise.all(ReverseStockImpact);
                const updatePromises = ItemsDtlData.map(async (item) => {
                    if (ENTRTYPE === 1) {
                        let cutie = parseFloat(OriginalQty) + parseFloat(item.QUANTITY);
                        await InventoryItems.update(
                            { IN_STOCK_QTY: cutie, Created_by },
                            { where: { UTD: item.CODE } }
                        );
                    } else if (ENTRTYPE === 2) {
                        let cutie = parseFloat(OriginalQty) - parseFloat(item.QUANTITY);
                        await InventoryItems.update(
                            { IN_STOCK_QTY: cutie, Created_by },
                            { where: { UTD: item.CODE } }
                        );
                    }
                });
                await Promise.all(updatePromises);
            }
        }
        let DrdFinData = savedata.map(item => ({ ...formdata, ...item }));
        let ItemsUtd = DrdFinData.map(item => item["Item_Name"]).join(',');
        let ItemCodes = await sequelize.query(`SELECT ITEM_CODE,UTD FROM InventoryItems WHERE UTD in (${ItemsUtd})`);
        let itemCodeMap = {};
        ItemCodes[0].forEach(row => {
            itemCodeMap[row.UTD] = row.ITEM_CODE;
        });
        DrdFinData = DrdFinData.map(item => ({
            ...item,
            ITEM_CODE: itemCodeMap[item["Item_Name"]] || null
        }));
        const StateName = await sequelize.query(`SELECT Misc_Name FROM Misc_Mst WHERE Misc_type = 3 AND Misc_Code = ${DrdFinData[0].State_Code}`);

        await sequelize.query(`UPDATE DMS_ROW_DATA SET Export_Type = 33 WHERE Tran_Id = '${BodyData.DRD_ID}'`, { transaction: t })
        await Promise.all(DrdFinData.map(async (item) => {
            const Cost_Center = item.Cost_Center1;
            const Sale_Ledg = item.Sale_ledg1;
            const LOCATION = item.Location1;
            const UoM = item.UOM1;
            const updateData = {
                ...item,
                UoM,
                Sale_Ledg,
                Cost_Center,
                Inv_Amt: Math.round(formdata.net_total),
                Rnd_Off: Math.round(formdata.net_total) - formdata.net_total,
                Rnd_Ledg: 23,
                LOCATION
            }
            await sequelize.query(`
                    INSERT INTO DMS_ROW_DATA (
                      Tran_Id, Item_Code, Ledger_Name, Ledger_Id, Bill_Date, Ref_Dt, Tran_Type, 
                      Seq_No, Bill_No, LEDG_ACNT, 
                      GST, State_Code,
                      Exp_Amt4, Exp_Amt5, 
                      Exp_Amt6, Exp_Amt7, Exp_Amt8, 
                      Exp_Ledg4, 
                      Exp_Perc4, Exp_Ledg5, Exp_Perc5, 
                      Exp_Ledg6, Exp_Perc6, Exp_Ledg7, 
                      Exp_Perc7, Exp_Ledg8, Exp_Perc8, 
                      Sale_Type, Narration, Loc_Code, 
                       Category, 
                      Item_Type, HSN, Sup_Qty, 
                       Basic_Price, 
                       Taxable, Assessable_Rate, 
                      CGST_Perc, CGST, SGST_Perc, 
                      SGST, IGST_Perc, IGST, 
                      Cess_Perc, Cess_Amt, Inv_Amt, 
                      UoM, Sale_Ledg, Cost_Center, 
                      Rnd_Off, Rnd_Ledg, USR_CODE, 
                      ENTR_DATE, ENTR_TIME, LOCATION, Export_Type
                    ) VALUES (
                      ${BodyData.DRD_ID},
                       ${updateData.ITEM_CODE ? `'${updateData.ITEM_CODE}'` : `'${updateData.Item_Name}'`},
                      '${LedgName[0][0].Ledg_Name}',
                      ${LedgName[0][0].Ledg_Add6 ? `'${LedgName[0][0].Ledg_Add6}'` : null},
                      ${updateData.Bill_Date ? `'${updateData.Bill_Date}'` : null},
                      ${updateData.Ref_Dt ? `'${updateData.Ref_Dt}'` : null},
                      ${updateData.Tran_Type ? `'${updateData.Tran_Type}'` : null},
                      ${formdata.Seq_No ? formdata.Seq_No : null},
                      ${formdata.Bill_No ? `'${formdata.Bill_No}'` : null},
                      ${updateData.LEDG_ACNT ? updateData.LEDG_ACNT : null},
                      ${updateData.GST ? `'${updateData.GST}'` : null},
                      ${StateName[0][0].Misc_Name ? `'${StateName[0][0].Misc_Name}'` : null},
                      ${updateData.Exp_Amt4 ? updateData.Exp_Amt4 : null},
                      ${updateData.Exp_Amt5 ? updateData.Exp_Amt5 : null},
                      ${updateData.Exp_Amt6 ? updateData.Exp_Amt6 : null},
                      ${updateData.Exp_Amt7 ? updateData.Exp_Amt7 : null},
                      ${updateData.Exp_Amt8 ? updateData.Exp_Amt8 : null},
                      ${updateData.Exp_Ledg4 ? updateData.Exp_Ledg4 : null},
                      ${updateData.Exp_Perc4 ? updateData.Exp_Perc4 : null},
                      ${updateData.Exp_Ledg5 ? updateData.Exp_Ledg5 : null},
                      ${updateData.Exp_Perc5 ? updateData.Exp_Perc5 : null},
                      ${updateData.Exp_Ledg6 ? updateData.Exp_Ledg6 : null},
                      ${updateData.Exp_Perc6 ? updateData.Exp_Perc6 : null},
                      ${updateData.Exp_Ledg7 ? updateData.Exp_Ledg7 : null},
                      ${updateData.Exp_Perc7 ? updateData.Exp_Perc7 : null},
                      ${updateData.Exp_Ledg8 ? updateData.Exp_Ledg8 : null},
                      ${updateData.Exp_Perc8 ? updateData.Exp_Perc8 : null},
                      ${updateData.Sale_Type ? `'${updateData.Sale_Type}'` : null},
                      ${updateData.Narration ? `'${updateData.Narration}'` : null},
                      ${updateData.Loc_Code ? updateData.Loc_Code : null},
                      ${updateData.Category ? updateData.Category : null},
                      ${updateData.Item_Type ? updateData.Item_Type : null},
                      ${updateData.HSN ? `'${updateData.HSN}'` : null},
                      ${updateData.Sup_Qty ? updateData.Sup_Qty : null},
                      ${updateData.Basic_Price ? updateData.Basic_Price : null},
                      ${updateData.Taxable ? updateData.Taxable : null},
                      ${updateData.Assessable_Rate ? updateData.Assessable_Rate : null},
                      ${updateData.CGST_Perc ? updateData.CGST_Perc : null},
                      ${updateData.CGST ? updateData.CGST : null},
                      ${updateData.SGST_Perc ? updateData.SGST_Perc : null},
                      ${updateData.SGST ? updateData.SGST : null},
                      ${updateData.IGST_Perc ? updateData.IGST_Perc : null},
                      ${updateData.IGST ? updateData.IGST : null},
                      ${updateData.Cess_Perc ? updateData.Cess_Perc : null},
                      ${updateData.Cess_Amt ? updateData.Cess_Amt : null},
                      ${updateData.Inv_Amt ? updateData.Inv_Amt : null},
                      ${updateData.UoM ? updateData.UoM : null},
                      ${updateData.Sale_Ledg ? updateData.Sale_Ledg : null},
                      ${updateData.Cost_Center ? updateData.Cost_Center : null},
                      ${updateData.Rnd_Off ? updateData.Rnd_Off : null},
                      ${updateData.Rnd_Ledg ? updateData.Rnd_Ledg : null},
                      ${updateData.USR_CODE ? updateData.USR_CODE : null},
                      ${updateData.ENTR_DATE ? `'${updateData.ENTR_DATE}'` : null},
                      ${updateData.ENTR_TIME ? `'${updateData.ENTR_TIME}'` : null},
                      ${updateData.LOCATION ? `'${updateData.LOCATION}'` : null},
                      0
                    )`, { transaction: t });

        }));

        // }
        await t.commit();
        res.status(200).send({ success: true, message: "Data Saved....!" });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success: false,
            message: `Error occurred while Inserting Data `,
            error: error,
        });
        await t.rollback();
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.findMasters = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const InventoryItems = _InventoryItems(sequelize, DataTypes);

    try {
        const flag = req.body.flag
        const multi_loc = req.body.multi_loc;
        let book_mst;
        if (flag == 1) {
            book_mst = await sequelize.query(`select (SELECT CAST(Misc_Code AS VARCHAR) from Misc_mst where Misc_type  = 56 and Misc_Dtl1  = Book_Code AND Export_Type < 3) as value , Book_Name as label, Inv_Book from Book_Mst where export_type < 3 and Book_Type = 7 AND Loc_Code in (${multi_loc}) AND Inv_Book = 1`);
        }
        else {
            book_mst = await sequelize.query(`select (SELECT CAST(Misc_Code AS VARCHAR) from Misc_mst where Misc_type  = 56 and Misc_Dtl1  = Book_Code AND Export_Type < 3) as value , Book_Name as label, Inv_Book from Book_Mst where export_type < 3 and Book_Type = 8 AND Loc_Code in (${multi_loc}) AND Inv_Book = 1`);
        }
        const Ledgers = await sequelize.query(`select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name As label from Ledg_Mst where Group_Code in (52,53) AND Loc_Code in (${multi_loc}) AND export_type < 3`);
        let PostLedg
        if (flag == 1) {
            PostLedg = await sequelize.query(`WITH RecursiveSubGroups AS (
               SELECT Group_Code, Sub_Group
               FROM Grup_Mst
               WHERE Sub_Group in (13) 
               UNION ALL
               SELECT g.Group_Code, g.Sub_Group
               FROM Grup_Mst g
               INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
           )
           select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (
           SELECT Group_Code
           FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 3;`);
        } else {
            PostLedg = await sequelize.query(`WITH RecursiveSubGroups AS (
                SELECT Group_Code, Sub_Group
                FROM Grup_Mst
                WHERE Sub_Group in (14) 
                UNION ALL
                SELECT g.Group_Code, g.Sub_Group
                FROM Grup_Mst g
                INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
            )
            select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (
            SELECT Group_Code
            FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 3;`);
        }
        const States = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value,  MIsc_Name AS label from Misc_Mst WHERE Misc_Type = 3`);
        const AllBranches = await sequelize.query('select CAST(Godw_Name AS VARCHAR) AS label, CAST(Godw_Code AS VARCHAR) AS value from Godown_Mst WHERE Export_Type < 3');
        const ItemNames = await sequelize.query(`select top 1000 COALESCE(CAST(ITEM_CODE AS VARCHAR), CAST(UTD AS VARCHAR)) +' | ' + ITEM_NAME + ' | ' + (SELECT TOP 1 Godw_Name FROM Godown_mst Where Godw_Code = LOC_CODE) AS label, CAST(UTD AS VARCHAR) as value from InventoryItems`);
        const UOM = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`);
        const BRANDS = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 617`);
        const Cost_Center = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 401`);
        const ExpenseLedger = await sequelize.query(`select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE ServerId = 13`);
        const IncomeLedger = await sequelize.query(`select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE ServerId = 14`);
        const VendorAc = await sequelize.query(`	WITH RecursiveSubGroups AS (      
            SELECT Group_Code, Sub_Group
            FROM Grup_Mst
            WHERE Sub_Group in (21)
            UNION ALL
            SELECT g.Group_Code, g.Sub_Group
            FROM Grup_Mst g
            INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
        )
        select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (   
        SELECT Group_Code
        FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 3`);
        const VendorAcSale = await sequelize.query(`	WITH RecursiveSubGroups AS (      
            SELECT Group_Code, Sub_Group
            FROM Grup_Mst
            WHERE Sub_Group in (29)
            UNION ALL
            SELECT g.Group_Code, g.Sub_Group
            FROM Grup_Mst g
            INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
        )
        select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (   
        SELECT Group_Code
        FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 3`);
        const ExpLedger = await sequelize.query(`WITH RecursiveSubGroups AS (
            SELECT Group_Code, Sub_Group
            FROM Grup_Mst
            WHERE Sub_Group in (2,3) 
            UNION ALL
            SELECT g.Group_Code, g.Sub_Group
            FROM Grup_Mst g
            INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
        )
        select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (
        SELECT Group_Code
        FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc}) AND Export_Type < 3;`) // vendor ac

        res.send({
            success: true, book_mst: book_mst[0],
            Ledgers: Ledgers[0], PostLedg: PostLedg[0],
            States: States[0], AllBranches: AllBranches[0],
            ItemNames: ItemNames[0], UOM: UOM[0], BRANDS: BRANDS[0],
            Cost_Center: Cost_Center[0], ExpLedger: ExpLedger[0],
            VendorAc: VendorAc[0], ExpenseLedger: ExpenseLedger[0],
            IncomeLedger: IncomeLedger[0], VendorAcSale: VendorAcSale[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.findMastersItems = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const searchText = req.body.search;
        const Loc_Code = req.body.Loc_Code;
        const TRAN_TYPE = req.body.TRAN_TYPE;
        let query;
        if (!isNaN(searchText)) {
            query = `SELECT TOP 20 
            COALESCE(CAST(ITEM_CODE AS VARCHAR), CAST(UTD AS VARCHAR)) + ' | ' + ITEM_NAME + ' | ' + (SELECT TOP 1 Godw_Name FROM Godown_mst WHERE Godw_Code = ${Loc_Code}) AS label, 
            CAST(UTD AS VARCHAR) AS value 
            FROM InventoryItems 
            WHERE UTD IN (${searchText})`;
        } else {
            if (TRAN_TYPE == 1) {
                query = `SELECT TOP 20 
            COALESCE(CAST(ITEM_CODE AS VARCHAR), CAST(UTD AS VARCHAR)) + ' | ' + ITEM_NAME + ' | ' + 
            (SELECT TOP 1 Godw_Name FROM Godown_mst WHERE Godw_Code = ${Loc_Code}) AS label, 
            CAST(UTD AS VARCHAR) AS value 
            FROM InventoryItems 
            WHERE 
            (ITEM_TYPE IS NULL OR ITEM_TYPE IN ('1')) 
            AND (ITEM_CODE LIKE '%${searchText}%' OR ITEM_NAME LIKE '%${searchText}%');`;
            } else if (TRAN_TYPE == 2) {
                query = `SELECT TOP 20 
                        COALESCE(CAST(ITEM_CODE AS VARCHAR), CAST(UTD AS VARCHAR)) + ' | ' + ITEM_NAME + ' | ' + (SELECT TOP 1 Godw_Name FROM Godown_mst WHERE Godw_Code = ${Loc_Code}) AS label, 
                        CAST(UTD AS VARCHAR) AS value 
                        FROM InventoryItems 
                        WHERE (ITEM_TYPE IS NULL OR ITEM_TYPE IN ('1','2')) AND (ITEM_CODE LIKE '%${searchText}%' OR ITEM_NAME LIKE '%${searchText}%')`;
            }
        }

        const ItemNames = await sequelize.query(query);
        res.send({
            success: true,
            ItemNames: ItemNames[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    } finally {
        await sequelize.close();
    }
};
exports.findMastersLedger = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const searchText = req.body.search;
        const ENTRTYPE = req.body.ENTRTYPE;
        const multi_loc = req.body.Loc_Code;
        let query;
        query = `WITH RecursiveSubGroups AS (      
            SELECT Group_Code, Sub_Group
            FROM Grup_Mst
            WHERE Sub_Group in (${ENTRTYPE == 1 ? 21 : 29})
            UNION ALL
            SELECT g.Group_Code, g.Sub_Group
            FROM Grup_Mst g
            INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
        )
        select TOP 20 CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (   
        SELECT Group_Code
        FROM RecursiveSubGroups) AND 
        (Ledg_Code like '%${searchText}%' OR 
        Ledg_Name like '%${searchText}%') AND 
        Loc_Code in (${multi_loc},0) AND Export_Type < 3`;
        const LedgerNames = await sequelize.query(query);
        res.send({
            success: true,
            LedgerNames: LedgerNames[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    } finally {
        await sequelize.close();
    }
};
exports.FindInvNo = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        if (!req.body.book || req.body.book == '') {
            return res.send({ inv_no: 'Book Code is Empty..' });
        }
        const inv_no = await sequelize.query(`SELECT CONCAT((SELECT TOP 1 Book_Prefix FROM book_mst WHERE book_code =
             (SELECT misc_dtl1 FROM misc_mst WHERE misc_code = '${req.body.book}' and misc_type = 56)),
             isnull(MAX(seq_no) + 1, 1)) AS bill_no FROM DMS_ROW_DATA WHERE tran_type ='${req.body.book}' and Export_type < 33;`);
        const nature = await sequelize.query(` SELECT  INV_Book , Book_type , DateFrom, DateUpto FROM Book_Mst where Book_Code in (SELECT Misc_Dtl1 FROM Misc_Mst WHERE Misc_Code = ${req.body.book})`)

        res.send({
            inv_no: inv_no[0] ? inv_no[0][0] : '',
            nature: nature[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.FindLedgerData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Ledg_Code = req.body.Ledg_Code;
        const inv_no = await sequelize.query(`SELECT State_Code, GST_No, Ledg_Abbr AS print_name, Ledg_Pan, CONCAT(Ledg_Add1,', ' ,Ledg_Add2,', ',Ledg_Add3) AS DISP_ADD FROM Ledg_Mst Where Ledg_Code = ${Ledg_Code}`);
        res.send({ Data: inv_no[0][0] });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.BranchState = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const BranchCheck = await sequelize.query(`select State_Code from GODOWN_MST Where Godw_Code = ${Loc_Code} AND Export_type < 3`);
        res.send({ State_Code: BranchCheck[0][0].State_Code });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.VoucherView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.multi_loc;
        const Vouchers = await sequelize.query(`SELECT GUID, Book_Code, Book_Name, 
        (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = Loc_Code) AS BranchName, Loc_Code
        FROM Book_Mst WHERE Loc_Code = ${Loc_Code}`);
        res.send(Vouchers[0]);
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.SaveVoucher = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    let t;
    try {
        const BodyData = req.body;
        const { error, value: VoucherData } = bookMstSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true,
        });
        const Created_by = VoucherData.Created_By;
        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            console.log(errorMessage)
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            t = await sequelize.transaction();
            const BookMst = _BookMst(sequelize, DataTypes);
            try {
                const MaxTranId = await sequelize.query(`SELECT isnull(max(Book_Code)+1,1) AS TRAN_ID from Book_Mst`, { transaction: t });
                let Book_Code = MaxTranId[0][0]?.TRAN_ID;
                await BookMst.create({ ...VoucherData, Book_Code, Created_by }, { transaction: t });
                await t.commit();
                res.status(200).send({ success: true, Message: "Data saved" });
            } catch (error) {
                await t.rollback();
                res.status(500).send({
                    success: false,
                    message: "An error occurred while Saving Data.",
                    error,
                });
            }
        }
    }
    catch (error) {
        if (t) {
            try {
                await t.rollback();
            } catch (rollbackError) {
                console.error("Rollback transaction failed:", rollbackError);
            }
        }
        console.error("An error occurred while saving data:", error);
        return res.status(500).send({
            success: false,
            message: "An error occurred while saving data.",
            error: error.message || error,
        });
    }
    finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};
exports.UpdateVoucher = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    let t;
    try {
        const BodyData = req.body;
        const { error, value: VoucherData } = bookMstSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true,
        });
        const Created_By = VoucherData.Created_By;
        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            console.log(errorMessage)
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            t = await sequelize.transaction();
            const BookMst = _BookMst(sequelize, DataTypes);
            try {
                await BookMst.update({ ...VoucherData, Created_By }, {
                    where: { GUID: BodyData.GUID }
                }, { transaction: t });
                await t.commit();
                res.status(200).send({ success: true, Message: "Data Updated" });
            } catch (error) {
                await t.rollback();
                res.status(500).send({
                    success: false,
                    message: "An error occurred while Updating Data.",
                    error,
                });
            }
        }
    }
    catch (error) {
        if (t) {
            try {
                await t.rollback();
            } catch (rollbackError) {
                console.error("Rollback transaction failed:", rollbackError);
            }
        }
        console.error("An error occurred while saving data:", error);
        return res.status(500).send({
            success: false,
            message: "An error occurred while saving data.",
            error: error.message || error,
        });
    }
    finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};
exports.FinVoucher = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const GUID = req.body.GUID;
        const BookMst = _BookMst(sequelize, DataTypes);
        const VouherData = await BookMst.findOne({ where: { GUID: GUID } });
        res.send({
            success: true, VouherData: VouherData
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.FindSeqNo = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body)
        const Tran_Type = req.body.Tran_Type;
        const Data = await sequelize.query(`
        select isnull(MAX(seq_no) + 1, 1) AS Seq_No from DMS_ROW_DATA where Tran_Type = ${Tran_Type}`);

        const ValidDates = await sequelize.query(`
select DateFrom, DateUpto from Book_Mst where  Book_Code = ${Tran_Type}`)
        res.send({
            success: true, Seq_No: Data[0][0].Seq_No, ValidDates: ValidDates[0][0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.EntryView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const TRAN_TYPE = req.body.TRAN_TYPE;
        const Data = await sequelize
            .query(`
        SELECT 
        UTD, TRAN_ID, DRD_ID, TRAN_TYPE,
    INV_NO, 
    FORMAT(Created_at, 'dd-MM-yyyy') AS InvoiceDate, 
    (SELECT TOP 1 Ledg_Name 
     FROM Ledg_mst 
     WHERE Ledg_Code = PARTY_AC AND Export_Type < 3) AS LedgerName,
    REF_NO AS VendorInvNo, 
    FORMAT(REF_DATE, 'dd-MM-yyyy') AS VendorInvDate, 
    Inv_Amt 
    FROM 
    ItemsMst WHERE Export_Type = 1 AND LOC_CODE = ${Loc_Code} AND TRAN_TYPE = ${TRAN_TYPE};`);
        res.send({
            success: true, Data: Data[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.EntryDataFetch = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const UTD = req.body.UTD;
        const TRAN_TYPE = req.body.TRAN_TYPE;
        const Data = await sequelize
            .query(`SELECT UTD, TRAN_ID, DRD_ID,
         CAST(BOOK_CODE AS VARCHAR) AS Tran_Type,
        CAST(PARTY_AC AS VARCHAR) AS LEDG_ACNT,
        CAST(STATE_CODE AS VARCHAR) AS State_Code,
        CAST(REG_TYPE AS VARCHAR) AS registration_type,
        CAST(REV_CHRGS AS VARCHAR) AS Is_Rcm,
        CAST(Exp_Ledg1 AS VARCHAR) AS Exp_Ledg41,
        CAST(Exp_Ledg2 AS VARCHAR) AS Exp_Ledg5,
        CAST(Exp_Ledg3 AS VARCHAR) AS Exp_Ledg6,
        CAST(Exp_Ledg4 AS VARCHAR) AS Exp_Ledg7,
        CAST(TDS_Ledg AS VARCHAR) AS Exp_Ledg8,* from ItemsMst WHERE UTD = ${UTD}`);

        const Data1 = await sequelize
            .query(`
        SELECT UTD, SRNO, CAST (Sale_ledg AS VARCHAR) AS Sale_ledg1,
        (SELECT TOP 1 Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = Sale_ledg) AS Sale_ledg1Label,
         CAST (CODE AS VARCHAR) AS Item_Name, DESCRIPTION AS Item_NameLabel, BATCH, 
         CAST(BRAND AS VARCHAR) AS BRAND1,
         (SELECT TOP 1 Misc_Name  FROM Misc_Mst WHERE Misc_Type = 617 AND Misc_Code = BRAND) AS BRAND1Label,
         CAST(Location AS VARCHAR) AS Location1,
        (SELECT TOP 1 Godw_Name  FROM Godown_Mst WHERE Export_Type < 3 AND Godw_Code = Location) AS Location1Label,
        CAST(Cost_Center AS VARCHAR) AS Cost_Center1,
        (SELECT TOP 1 Misc_Name  FROM Misc_Mst WHERE Misc_Type = 401 AND Misc_Code = Cost_Center) AS Cost_Center1Label,
         CAST(CATEGORY AS VARCHAR) AS Category,CAST(ITEM_TYPE AS VARCHAR) AS Item_Type, 
        HSN_CODE AS HSN,QUANTITY AS Sup_Qty,  CAST(UOM AS VARCHAR) UOM1,
        (SELECT TOP 1 Misc_Name  FROM Misc_Mst WHERE Misc_Type = 72 AND Misc_Code = UOM) AS UOM1Label,
        RATE AS Basic_Price, DISC_PERCT AS discp,
        DISC_VALUE AS Disc_Amt,CGST_PERCT AS CGST_Perc,SGST_PERCT AS SGST_Perc,IGST_PERCT AS IGST_Perc,
        CGST_VALUE AS CGST,IGST_VALUE AS IGST,SGST_VALUE AS SGST, CESS_PERCT AS Cess_Perc, 
        CESS_VALUE AS Cess_Amt, Inv_Amt, CURR_STOCK from ItemsDtl WHERE TRAN_ID = ${Data[0][0].TRAN_ID} AND TRAN_TYPE =${TRAN_TYPE}`);
        res.send({
            success: true, MstData: Data[0], DtlData: Data1[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.ItemWiseTransaction = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const DateFrom = req.body.DateFrom;
        const DateTo = req.body.DateTo;
        const searchText = req.body.searchText;

        const Data = await sequelize.query(`WITH PurchaseData AS (
            SELECT 
                CODE,
                SUM(QUANTITY) AS TotalPurchase
            FROM 
                ItemsDtl
            WHERE 
                TRAN_TYPE = 1 
                AND TRAN_ID IN (SELECT TRAN_ID FROM Itemsmst WHERE 
                LOC_CODE in (${Loc_Code}) AND EXPORT_TYPE = 1 
                AND TRAN_TYPE = 1 AND ITEM_TYPE = 1
                AND VOUCHER_DATE BETWEEN '${DateFrom}' AND '${DateTo}')
            GROUP BY 
                CODE
        ),
        SaleData AS (
            SELECT 
                CODE,
                SUM(QUANTITY) AS TotalSale
            FROM 
                ItemsDtl
            WHERE 
                TRAN_TYPE = 2
                AND TRAN_ID IN (SELECT TRAN_ID FROM Itemsmst WHERE 
                LOC_CODE in (${Loc_Code}) AND EXPORT_TYPE = 1 AND 
                TRAN_TYPE = 2
                AND VOUCHER_DATE BETWEEN '${DateFrom}' AND '${DateTo}')
            GROUP BY 
                CODE
        ),
        TransferOutData AS (
            SELECT ItemsDtl.CODE AS CODE, SUM(QUANTITY) AS TotalOut
    FROM ItemsDtl
    INNER JOIN Itemsmst 
        ON ItemsDtl.TRAN_ID = Itemsmst.UTD
    WHERE Itemsmst.EXPORT_TYPE = 1 
      AND ItemsDtl.TRAN_TYPE = 3
      AND ItemsDtl.Location = ${Loc_Code}
      AND ItemsMst.Created_At BETWEEN '${DateFrom} 00:00:00.000' AND '${DateTo} 23:59:59.999'
    GROUP BY ItemsDtl.CODE
        ),
        TransferInData AS (
            SELECT ItemsDtl.CODE AS CODE, SUM(QUANTITY) AS TotalIn
    FROM ItemsDtl
    INNER JOIN Itemsmst 
        ON ItemsDtl.TRAN_ID = Itemsmst.UTD
    WHERE Itemsmst.EXPORT_TYPE = 1 
      AND ItemsDtl.TRAN_TYPE = 4
      AND ItemsDtl.LOCATION = ${Loc_Code}
      AND ItemsMst.Created_At BETWEEN '${DateFrom} 00:00:00.000' AND '${DateTo} 23:59:59.999'
    GROUP BY ItemsDtl.CODE
        )
        SELECT top 200
            InventoryItems.UTD,
            InventoryItems.ITEM_CODE,
            InventoryItems.ITEM_NAME,
            COALESCE(COALESCE(InventoryItems.OPENING_QTY,0) + COALESCE(BranchWiseItemOpening.Opening_Qty,0),0) AS OPENING_QTY,
            CASE WHEN InventoryItems.ITEM_TYPE = 1 THEN
            COALESCE((COALESCE(PurchaseData.TotalPurchase, 0) + COALESCE(TransferInData.TotalIn, 0) + COALESCE(BranchWiseItemOpening.Opening_Qty, 0) + COALESCE(InventoryItems.OPENING_QTY, 0)) - (COALESCE(SaleData.TotalSale, 0) + COALESCE(TransferOutData.TotalOut, 0)),0)
            ELSE '0' END AS InStockQty,
            COALESCE(PurchaseData.TotalPurchase, 0) AS TotalPurchase,
            COALESCE(SaleData.TotalSale, 0) AS TotalSale,
            COALESCE(TransferOutData.TotalOut, 0) AS TotalOut,
            COALESCE(TransferInData.TotalIn, 0) AS TotalIn
        FROM 
            InventoryItems
        LEFT JOIN
            BranchWiseItemOpening ON InventoryItems.UTD = BranchWiseItemOpening.id AND BranchWiseItemOpening.Loc_Code = ${Loc_Code}
        LEFT JOIN 
            PurchaseData ON InventoryItems.UTD = PurchaseData.CODE
        LEFT JOIN 
            SaleData ON InventoryItems.UTD = SaleData.CODE
        LEFT JOIN 
            TransferOutData ON InventoryItems.UTD = TransferOutData.CODE
        LEFT JOIN 
            TransferInData ON InventoryItems.UTD = TransferInData.CODE
            WHERE InventoryItems.ITEM_CODE like '%${searchText}%' OR InventoryItems.ITEM_NAME like '%${searchText}%'
            ORDER BY InventoryItems.ITEM_NAME
            `);
        res.send({
            success: true, Data: Data[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.BatchWiseTransaction = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;
        const DateFrom = req.body.DateFrom;
        const DateTo = req.body.DateTo;
        const Data = await sequelize.query(`WITH PurchaseData AS (
    SELECT
        BATCH,
        SUM(QUANTITY * RATE) AS TotalPurchaseCost
    FROM
        ItemsDtl
    WHERE
        TRAN_TYPE = 1
        AND TRAN_ID IN (SELECT TRAN_ID FROM Itemsmst WHERE LOC_CODE IN (${Loc_Code}))
    GROUP BY
        BATCH
),
SaleData AS (
    SELECT
        BATCH,
        SUM(QUANTITY * RATE) AS TotalSaleCost
    FROM
        ItemsDtl
    WHERE
        TRAN_TYPE = 2
        AND TRAN_ID IN (SELECT TRAN_ID FROM Itemsmst WHERE LOC_CODE IN (${Loc_Code}))
    GROUP BY
        BATCH
)

SELECT
    COALESCE(PurchaseData.BATCH, SaleData.BATCH) AS Batch,
    COALESCE(PurchaseData.TotalPurchaseCost, 0) AS TotalPurchaseCost,
    COALESCE(SaleData.TotalSaleCost, 0) AS TotalSaleCost,
    COALESCE(PurchaseData.TotalPurchaseCost, 0) - COALESCE(SaleData.TotalSaleCost, 0) AS PendingCost
FROM
    PurchaseData
FULL JOIN
    SaleData ON PurchaseData.BATCH = SaleData.BATCH;`);
        res.send({
            success: true, Data: Data[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.EntryPrint = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const UTD = req.body.UTD;
        const BranchData = await sequelize.query(`
            select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
            gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
            from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
            where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
        const MstData = await sequelize.query(`select 
            TRAN_ID,
            TRAN_TYPE,
            (SELECT TOP 1 Ledg_Name FROM Ledg_Mst where Ledg_Code = PARTY_AC AND Export_Type < 3) AS PartyName,
            (SELECT TOP 1 Misc_Name FROM Misc_mst where Misc_Code = STATE_CODE AND Misc_type = 3) AS PlaceOfSupply,
            INV_NO,
            REF_NO,
            SUPP_GST,
            FORMAT(VOUCHER_DATE, 'dd-MM-yyyy') AS VOUCHER_DATE,
            (SELECT TOP 1 Ledg_Pan FROM Ledg_Mst where Ledg_Code = PARTY_AC AND Export_Type < 3) AS pan,
            (SELECT TOP 1 Rnd_Off FROM DMS_ROW_DATA where DMS_ROW_DATA.Tran_Id = ItemsMst.DRD_ID AND Export_Type < 3) AS RndOff,
            NARR,
            Created_by,
            CASE 
                WHEN REV_CHRGS = 1 THEN 'Y'
                WHEN REV_CHRGS = 0 THEN 'N'
            END AS RevChrgsApp, 
            Inv_Amt
            from ItemsMst where UTD = ${UTD}`);
        const roundedInvAmt = Math.round(MstData[0][0].Inv_Amt).toFixed(2);
        const roundOffDifference = roundedInvAmt - MstData[0][0].Inv_Amt;
        const amountInIndianCurrency = numWords(roundedInvAmt);
        const MasterData = {
            ...MstData[0][0],
            Inv_Amt_Rounded: roundedInvAmt,
            Round_Off_Difference: MstData[0][0].RndOff,
            Inv_Amt_In_Words: amountInIndianCurrency
        };
        const DtlData1 = await sequelize.query(`SELECT 
        CAST(SUM(CAST(QUANTITY AS DECIMAL(18, 2)) * CAST(RATE AS DECIMAL(18, 2)) - CAST(DISC_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS AsseVal,
        CAST(SUM(CAST(SGST_PERCT AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS sgstPerct,
        CAST(SUM(CAST(SGST_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS sgst,
        CAST(SUM(CAST(CGST_PERCT AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS cgstPerct,
        CAST(SUM(CAST(CGST_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS cgst,
        CAST(SUM(CAST(IGST_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS igst,
        CAST(SUM(CAST(IGST_PERCT AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS igstPerct,
        CAST(SUM(CAST(CESS_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS cess,
        CAST(SUM(CAST(CESS_PERCT AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS cessPerct,
        CAST(SUM(CAST(SGST_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS sgst,
        CAST(SUM(CAST(QUANTITY AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS QtyTtl,
        CAST(SUM(CAST(RATE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS RateTtl,
        CAST(SUM(ROUND((((QUANTITY * RATE) - DISC_VALUE) + IGST_VALUE + SGST_VALUE + CGST_VALUE + CESS_VALUE), 2)) AS DECIMAL(18,2)) AS TOTAL
    FROM ItemsDtl 
    WHERE TRAN_ID = ${MstData[0][0].TRAN_ID} AND TRAN_TYPE = ${MstData[0][0].TRAN_TYPE}`);
    console.log(DtlData1,'DtlData1')

        const DtlDataTab = await sequelize.query(`SELECT 
            UTD, 
            SRNO, 
            DESCRIPTION,
            HSN_CODE, 
            CAST(QUANTITY AS DECIMAL(10, 2)) AS QUANTITY, 
            CAST(RATE AS DECIMAL(10, 2)) AS RATE, 
            ROUND(((QUANTITY * RATE) - DISC_VALUE), 2) AS Taxable, 
            CAST(IGST_PERCT AS DECIMAL(5, 2)) AS IGST_PERCT, 
            ROUND(IGST_VALUE, 2) AS IGST_VALUE, 
            CAST(SGST_PERCT AS DECIMAL(5, 2)) AS SGST_PERCT, 
            ROUND(SGST_VALUE, 2) AS SGST_VALUE, 
            CAST(CGST_PERCT AS DECIMAL(5, 2)) AS CGST_PERCT, 
            ROUND(CGST_VALUE, 2) AS CGST_VALUE, 
            CAST(CESS_PERCT AS DECIMAL(5, 2)) AS CESS_PERCT, 
            ROUND(CESS_VALUE, 2) AS CESS_VALUE, 
            CAST(DISC_PERCT AS DECIMAL(5, 2)) AS DISC_PERCT, 
            ROUND(DISC_VALUE, 2) AS DISC_VALUE,
            ROUND((((QUANTITY * RATE) - DISC_VALUE) + IGST_VALUE + SGST_VALUE + CGST_VALUE + CESS_VALUE), 2) AS TOTAL 
               FROM 
            ItemsDtl
               where TRAN_ID = ${MstData[0][0].TRAN_ID} AND TRAN_TYPE = ${MstData[0][0].TRAN_TYPE}`);
               console.log(DtlDataTab,'DtlDataTab')
        const DtlDataTax = await sequelize.query(` select HSN_CODE , ROUND(((QUANTITY * RATE) - DISC_VALUE), 2) AS Taxable, CAST(IGST_PERCT AS DECIMAL(5, 2)) AS IGST_PERCT,
            (CAST(SGST_PERCT AS DECIMAL(5, 2))  + CAST(CGST_PERCT AS DECIMAL(5, 2))) AS SGSTCGSTPerct, ROUND(IGST_VALUE, 2) AS IGST_VALUE,
            ROUND((SGST_VALUE + CGST_VALUE), 2) AS SGSTCGSTVal FROM 
         ItemsDtl
            where TRAN_ID = ${MstData[0][0].TRAN_ID} AND TRAN_TYPE = ${MstData[0][0].TRAN_TYPE}`);
        console.log(DtlDataTax, 'DtlDataTax')
        res.send({
            success: true, BranchData: BranchData[0][0],
            MstData: MasterData, DtlData1: DtlData1[0],
            DtlDataTab1: DtlDataTab[0], DtlDataTax: DtlDataTax[0]
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            err,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.CancelEntry = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body, 'bhvcxcfvgbh')
        const UTD = req.body.UTD;
        const User_Code = req.body.User_Code;
        const ENTRTYPE = req.body.ENTRTYPE;
        const CAN_RES = req.body.CAN_RES;
        const User_Name = req.body.User_Name;
        const Loc_Code = req.body.Loc_Code;
        const DRD_ID = await sequelize.query(`SELECT DRD_ID, TRAN_ID, TRAN_TYPE FROM ItemsMst WHERE UTD = ${UTD}`);
        let flag = 0;
        if ((ENTRTYPE == 1 && req.body.Purchase) || (ENTRTYPE == 2 && req.body.Sale)) {
            const id = DRD_ID[0][0].DRD_ID;
            const check = await sequelize.query(`SELECT IRN, Bill_Date FROM DMS_ROW_DATA WHERE Tran_Id = ${id}`);
            const chk = check[0][0].IRN;
            const chkDate = check[0][0].Bill_Date;
            const checkDateDb = await sequelize.query(`select GST_Lock_Date from user_tbl where User_Code = ${User_Code}`);
            const chkDateuser = checkDateDb[0][0].GST_Lock_Date;
            if (!chk) {
                const currentDate = new Date();
                const savedate = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

                const thresholdDate = new Date(chkDateuser);
                const thresholdDate1 = new Date(chkDate);
                console.log(thresholdDate1, 'thresholdDate1')
                console.log(thresholdDate, 'thresholdDate')
                if (thresholdDate1 > thresholdDate) {
                    await sequelize.query(`UPDATE ItemsMst SET EXPORT_TYPE = 5 WHERE UTD = '${UTD}'`);
                    await sequelize.query(`UPDATE ItemsDtl SET EXPORT_TYPE = 5 WHERE TRAN_ID = '${DRD_ID[0][0].TRAN_ID}' AND TRAN_TYPE = ${DRD_ID[0][0].TRAN_TYPE}`);
                    await sequelize.query(`UPDATE DMS_ROW_DATA SET Export_Type = 5,  IsCncl = 1, CANCEL_Date = GETDATE() WHERE Tran_Id = '${DRD_ID[0][0].DRD_ID}'`);
                    await sequelize.query(`INSERT INTO CANCEL_HST 
                (ACNT_ID, Narration, User_Code, User_Name,Date_Time, Loc_Code, Export_Type, DRD_ID)
                values (0,'${CAN_RES}',${User_Code} ,'${User_Name}','${savedate}',${Loc_Code},5,${DRD_ID[0][0].DRD_ID})`);
                    await sequelize.query(`INSERT INTO VAS_TEMP (TRAN_ID, EXPORT_TYPE) values('${id}', 5)`);
                    flag = 1;
                }
                else {
                    flag = 3
                }
            }
        } else {
            await sequelize.query(`UPDATE ItemsMst SET EXPORT_TYPE = 5 WHERE UTD = '${UTD}'`);
            await sequelize.query(`UPDATE ItemsDtl SET EXPORT_TYPE = 5 WHERE TRAN_ID = '${DRD_ID[0][0].TRAN_ID}' AND TRAN_TYPE = ${DRD_ID[0][0].TRAN_TYPE}`);
            flag = 1;
        }
        res.send({ Cancelled: flag });
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
}


function numWords(input) {
    var a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
    var b = ['', '', 'twenty ', 'thirty ', 'forty ', 'fifty ', 'sixty ', 'seventy ', 'eighty ', 'ninety '];
    var num = parseInt(input);
    if (isNaN(num)) return 'Invalid number';
    if (num === 0) return 'zero';
    if (num.toString().length > 13) return 'overflow';
    function convert(n) {
        if (n < 20) return a[n];
        else if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
        else return a[Math.floor(n / 100)] + "hundred " + (n % 100 ? convert(n % 100) : "");
    }
    function convertLargeNumber(n) {
        if (n >= 10000000) return convertLargeNumber(Math.floor(n / 10000000)) + "crore " + convertLargeNumber(n % 10000000);
        else if (n >= 100000) return convert(Math.floor(n / 100000)) + "lakh " + convertLargeNumber(n % 100000);
        else if (n >= 1000) return convert(Math.floor(n / 1000)) + "thousand " + convertLargeNumber(n % 1000);
        else return convert(n);
    }
    let words = convertLargeNumber(num);
    return capitalizeFirstLetter(words.trim());
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


// function add(a, b, c) {
//     return a + b + c;
// }
// console.log(add(1, 2, 3))
// function xxxx(a) {
//     return function (b) {
//         return function (c) {
//             return a + b + c;
//         }
//     }
// }
// console.log(xxxx(1)(2)(3))

// const addOne = xxxx(1);  
// const addTwo = addOne(2); 
// console.log(addTwo(3));  
