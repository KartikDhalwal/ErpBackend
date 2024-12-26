const { Sequelize, DataTypes, literal, QueryTypes, Op } = require('sequelize');
const { dbname } = require('../utils/dbconfig');
const { dbname2 } = require('../utils/dbconfig');
const Joi = require('joi');
const fs = require("fs");
const path = require("path");
const { _ItemsMst, itemsMstSchema } = require("../models/ItemsMst");
const { _ItemsDtl, itemsDtlSchema } = require("../models/ItemsDtl");
const { _InventoryItems, InventoryItemsSchema } = require("../models/InventoryItems"); const FormData = require("form-data");
const { _BranchWiseItemOpening, branchWiseItemOpeningSchema } = require("../models/BranchWiseItemOpening");

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const ExcelJS = require("exceljs");
const xlsx = require("xlsx");


async function uploadImages(
    files,
    finalFolderPath,
    Emp_Code,
    Created_by,
    SRNO
) {
    let dataArray = [];

    for (let i = 0; i < 1; i++) {
        let fileKey = "VendorDocument";

        if (files[fileKey]) {
            const file = files[fileKey][0];
            const formData = new FormData();
            const filename = `${uuidv4()}${path.extname(file.originalname)}`;
            formData.append("photo", file.buffer, filename);
            formData.append("customPath", finalFolderPath);
            try {
                const response = await axios.post(
                    "http://cloud.autovyn.com:3000/upload-photo",
                    formData,
                    {
                        headers: formData.getHeaders(),
                    }
                );
                console.log(`Image ${i} uploaded successfully`);
            } catch (error) {
                console.error(`Error uploading image ${i}:`, error.message);
            }
            data = {
                SRNO: SRNO,
                EMP_CODE: Emp_Code,
                Created_by: Created_by,
                DOC_NAME: file.originalname,
                columndoc_type: "VendorDocument",
                DOC_PATH: `${finalFolderPath}\\${filename}`,
            };
            dataArray.push(data);
        }
    }
    return dataArray;
};
exports.VendorMasterSave = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    try {
        const a = JSON.parse(req.body.VendorData);
        const Ledger_NAME = a.Ledger_NAME;
        const AbbrName = a.AbbrName;
        const LedgerGroup = a.LedgerGroup;
        const Branch = a.Branch;
        const PrintName = a.PrintName;
        const LedgerState = a.LedgerState;
        const Pan = a.Pan;
        const RegistrationType = a.RegistrationType;
        const LedgerGstin = a.LedgerGstin;
        const partyType = a.partyType;
        const EMAIL_ID = a.EMAIL_ID;
        const Pincode = a.Pincode;
        const MobileNo = a.MobileNo;
        const ADDRESS1 = a.ADDRESS1;
        const ADDRESS2 = a.ADDRESS2;
        const EMPCODE = a.EMPCODE;
        const USERNAME = a.USERNAME;
        const MSME = a.MSME;
        const ECC_No = a.ECC_No;
        const finalFolderPath = path.join(
            req.headers.compcode?.split("-")[0]?.toLowerCase(),
            new Date().getFullYear().toString(),
            String(new Date().getMonth() + 1).padStart(2, "0"),
            String(new Date().getDate()).padStart(2, "0"),
            "VendorDocument"
        );
        let EMP_DOCS_data = [];
        if (req.files) {
            EMP_DOCS_data = await uploadImages(
                req.files,
                finalFolderPath,
                EMPCODE,
                EMPCODE,
                EMPCODE
            );
        }
        const brmstid = await sequelize.query(`select MAX(Ledg_Code) AS maxMstId FROM Ledg_Mst `,
            { transaction: t });
        const MiscMaxId = brmstid[0][0].maxMstId;
        let newtranid;
        if (MiscMaxId !== null) {
            newtranid = MiscMaxId + 1;
        } else {
            newtranid = 1;
        }
        await sequelize.query(`INSERT INTO Ledg_Mst (
        Ledg_Code, Group_Code, Ledg_Name, Ledg_Abbr, Ledg_Add6 , Loc_Code,
        Ledg_Add1, Ledg_Add2, State_Code, Ledg_Pan, GSTTYPE, GST_No, PARTYTYPE,
        Ledg_Email, Ledg_Pin, Ledg_Ph1, ServerId, Export_Type,
        MSME, ECC_No,Ledg_Class) VALUES
        ('${newtranid}','${LedgerGroup}', '${Ledger_NAME}', '${PrintName}','${AbbrName}','${Branch}',
        '${ADDRESS1}','${ADDRESS2}','${LedgerState}','${Pan}',${RegistrationType},'${LedgerGstin}','${partyType}',
        '${EMAIL_ID}','${Pincode}', '${MobileNo}',1,1,
        ${MSME}, '${ECC_No}','21')`,
            { transaction: t });
        await sequelize.query(`INSERT INTO DOC_UPLOAD (
        Doc_Type, TRAN_ID, SRNO, path, User_Name ,Upload_Date, Export_Type) VALUES
        ('LEDG','${newtranid}', '1', '${EMP_DOCS_data[0]?.DOC_PATH}','${USERNAME}',GETDATE(),'1')`,
            { transaction: t });
        await t.commit();
        res.status(200).send({ success: true, message: "Ledger Created" });
    }
    catch (e) {
        console.log(e);
        await t.rollback();
        res.status(500).send({
            success: false,
            message: "An error occurred while Inserting Data",
            e,
        });
    }
    finally {
        await sequelize.close();
        console.log('Connection has Been Closed....');
    }
};
exports.VendorMasterUpdate = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    try {
        const a = JSON.parse(req.body.VendorData);
        console.log(a)
        const SRNO = a.SRNO;
        const Ledger_NAME = a.Ledger_NAME;
        const AbbrName = a.AbbrName;
        const LedgerGroup = a.LedgerGroup;
        const Branch = a.Branch;
        const PrintName = a.PrintName;
        const LedgerState = a.LedgerState;
        const Pan = a.Pan;
        const RegistrationType = a.RegistrationType;
        const LedgerGstin = a.LedgerGstin;
        const partyType = a.partyType;
        const EMAIL_ID = a.EMAIL_ID;
        const Pincode = a.Pincode;
        const MobileNo = a.MobileNo;
        const ADDRESS1 = a.ADDRESS1;
        const ADDRESS2 = a.ADDRESS2;
        const USERNAME = a.USERNAME;
        const EMPCODE = a.EMPCODE;
        const MSME = a.MSME;
        const ECC_No = a.ECC_No;

        const finalFolderPath = path.join(
            req.headers.compcode?.split("-")[0]?.toLowerCase(),
            new Date().getFullYear().toString(),
            String(new Date().getMonth() + 1).padStart(2, "0"),
            String(new Date().getDate()).padStart(2, "0"),
            "VendorDocument"
        );
        let EMP_DOCS_data = [];
        let filePath = '';
        if (req.files.VendorDocument) {
            EMP_DOCS_data = await uploadImages(
                req.files,
                finalFolderPath,
                EMPCODE,
                EMPCODE,
                EMPCODE
            );
            filePath = EMP_DOCS_data[0]?.DOC_PATH
        }
        else {
            const a = await sequelize.query(`SELECT path FROM DOC_UPLOAD 
            WHERE TRAN_ID = '${SRNO}' AND Export_type = 1`,
                { transaction: t });
            filePath = a[0][0].path;
        }

        await sequelize.query(`INSERT INTO Ledg_Mst_Hst
            SELECT * FROM Ledg_mst
            WHERE Ledg_Code = ${SRNO};`,
            { transaction: t });
        await sequelize.query(`UPDATE DOC_UPLOAD
        SET
            Export_Type = 33
        WHERE
        Doc_Type = 'LEDG'
            AND TRAN_ID = ${SRNO};`,
            { transaction: t });
        await sequelize.query(`UPDATE Ledg_Mst
        SET Group_Code = '${LedgerGroup}',
            Ledg_Name = '${Ledger_NAME}',
            Ledg_Abbr = '${PrintName}',
            Ledg_Add6 = '${AbbrName}',
            Loc_Code = '${Branch}',
            Ledg_Add1 = '${ADDRESS1}',
            Ledg_Add2 = '${ADDRESS2}',
            State_Code = '${LedgerState}',
            Ledg_Pan = '${Pan}',
            GSTTYPE = ${RegistrationType},
            GST_No = '${LedgerGstin}',
            PARTYTYPE = '${partyType}',
            Ledg_Email = '${EMAIL_ID}',
            Ledg_Pin = '${Pincode}',
            Ledg_Ph1 = '${MobileNo}',
            MSME = ${MSME},
            ECC_No = '${ECC_No}'
        WHERE Ledg_Code = '${SRNO}';`,
            { transaction: t });
        await sequelize.query(`INSERT INTO DOC_UPLOAD (
        Doc_Type, TRAN_ID, SRNO, path, User_Name ,Upload_Date,  Export_Type) VALUES
        ('LEDG','${SRNO}', '1', '${filePath}','${USERNAME}',GETDATE(),'1')`,
            { transaction: t });
        await t.commit();

        res.status(200).send({
            success: true,
            message: "Ledger updated"
        });
    }
    catch (e) {
        console.log(e);
        await t.rollback();
        res.status(500).send({
            success: false,
            message: "An error occurred while updating Data",
            e,
        });
    }
    finally {
        await sequelize.close();
        console.log('Connection has Been Closed....');
    }
};
exports.ItemMasterSave = async function (req, res) {
    const BodyData = req.body;
    const { error, value } = InventoryItemsSchema.validate(BodyData, {
        abortEarly: false,
        stripUnknown: true
    });
    const ItemData = value;
    const Created_by = ItemData.Created_by;
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return res.status(400).send({ success: false, message: errorMessage });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        const InventoryItems = _InventoryItems(sequelize, DataTypes);
        const BranchWiseItemOpening = _BranchWiseItemOpening(sequelize, DataTypes);

        try {
            const OPENING_QTY = ItemData.OPENING_QTY
            const OPENING_VAL = ItemData.OPENING_VAL

            delete ItemData.OPENING_QTY
            delete ItemData.OPENING_VAL
            const result = await InventoryItems.create({ ...ItemData, Created_by: Created_by }, { transaction: t });
            await BranchWiseItemOpening.create({
                Id: result.UTD,
                Item_Code: ItemData.ITEM_CODE,
                Loc_Code: ItemData.LOC_CODE,
                Opening_Qty: OPENING_QTY,
                Opening_Val: OPENING_VAL,
                Created_by: Created_by
            }, { transaction: t });
            await t.commit();
            res.send(`data saved`)
        } catch (error) {
            console.log(error)
            res.send({ success: false, message: 'An error occurred while Saving Data', error });
            await t.rollback();
        } finally {
            await sequelize.close();
            console.log('Connection has been closed.');
        }
    }
};
exports.ItemMasterUpdate = async function (req, res) {
    const BodyData = req.body;
    const { error, value: ItemData } = InventoryItemsSchema.validate(BodyData, {
        abortEarly: false,
        stripUnknown: true
    });
    console.log(error, 'error')
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return res.status(400).send({ success: false, message: errorMessage });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        const InventoryItems = _InventoryItems(sequelize, DataTypes);
        try {
            delete ItemData.OPENING_QTY
            delete ItemData.OPENING_VAL
            await InventoryItems.update({ ...ItemData, Created_by: ItemData.Created_by }, {
                where: { UTD: BodyData.UTD }
            }, { transaction: t });
            await t.commit();
            res.status(200).send({
                success: true,
                message: "Item updated"
            });
        }
        catch (e) {
            console.log(e);
            await t.rollback();
            res.status(500).send({
                success: false,
                message: "An error occurred while updating Data",
                e,
            });
        }
        finally {
            await sequelize.close();
            console.log('Connection has Been Closed....');
        }
    }
};
exports.VendorsView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Vendors = await sequelize.query(`SELECT
        Ledg_Code AS SRNO,
        Group_Code AS LedgerGroup,
        (SELECT TOP 1 Group_Name FROM Grup_Mst WHERE Group_Code = Ledg_Mst.Group_Code) AS GroupName,
        Ledg_Name AS Ledger_NAME,
        Ledg_Abbr AS PrintName,
        Ledg_Add6 AS AbbrName,
        Loc_Code AS Branch,
        (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Loc_Code) AS BranchName,
        Ledg_Add1 AS ADDRESS1,
        Ledg_Add2 AS ADDRESS2,
        State_Code AS LedgerState,
        Ledg_Pan AS Pan,
        GSTTYPE AS RegistrationType,
        GST_No AS LedgerGstin,
        PARTYTYPE AS partyType,
        Ledg_Email AS EMAIL_ID,
        Ledg_Pin AS Pincode,
        Ledg_Ph1 AS MobileNo,
        MSME, ECC_No,
        CONCAT('https://test.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1 path FROM DOC_UPLOAD WHERE Export_Type = 1 AND Doc_Type = 'LEDG' AND TRAN_ID = Ledg_Code) ) AS DOCUMENT
    FROM
        Ledg_Mst
    WHERE
        Export_Type = 1;`);
        res.send({ success: true, Vendors: Vendors[0] });
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
exports.ItemsView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const searchText = req.body.searchText;
        const Loc_Code = req.body.Loc_Code;
        const Items = await sequelize.query(`WITH PurchaseData AS (
            SELECT
                CODE,
                SUM(QUANTITY) AS TotalPurchase
            FROM
                ItemsDtl
            WHERE
                TRAN_TYPE = 1     
                AND TRAN_ID IN (SELECT TRAN_ID FROM Itemsmst WHERE  
                LOC_CODE in (${Loc_Code}) AND EXPORT_TYPE = 1
                AND TRAN_TYPE = 1 AND ITEM_TYPE = 1)
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
                TRAN_TYPE = 2)
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
    GROUP BY ItemsDtl.CODE        
        )
        SELECT top 200
            InventoryItems.UTD,   
            InventoryItems.ITEM_CODE,
            InventoryItems.ITEM_NAME,
			 InventoryItems.HSN, InventoryItems.ITEM_TYPE,
InventoryItems.PURCH_PRICE, CAST(ROUND(InventoryItems.SALE_PRICE, 2) AS DECIMAL(10, 2)) AS MrpPr,  
InventoryItems.BIN_LOC, InventoryItems.SALE_PRICE,
            COALESCE(COALESCE(InventoryItems.OPENING_QTY,0) + COALESCE(BranchWiseItemOpening.Opening_Qty,0),0) AS OpenQty,
            CASE WHEN InventoryItems.ITEM_TYPE = 1 THEN
            COALESCE((COALESCE(PurchaseData.TotalPurchase, 0) + COALESCE(TransferInData.TotalIn, 0) + COALESCE(BranchWiseItemOpening.Opening_Qty, 0) + COALESCE(InventoryItems.OPENING_QTY, 0)) - (COALESCE(SaleData.TotalSale, 0) + COALESCE(TransferOutData.TotalOut, 0)),0)  
            ELSE '0' END AS InStockQty,
            CASE
            WHEN InventoryItems.ITEM_TYPE = 1 THEN 'PARTS'
            WHEN InventoryItems.ITEM_TYPE = 2 THEN 'SERVICE'
            END AS ItemType ,
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
        res.send({ success: true, Items: Items[0] });
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

exports.ItemDataFetch = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const UTD = req.body.UTD;
        const Loc_Code = req.body.Loc_Code;
        const Items = await sequelize.query(`WITH PurchaseQty AS (
    SELECT 
                CODE,
                SUM(QUANTITY) AS TotalPurchase
            FROM 
                ItemsDtl
            WHERE 
                TRAN_TYPE = 1 
                AND TRAN_ID IN (SELECT TRAN_ID FROM Itemsmst WHERE LOC_CODE in (${Loc_Code}) AND EXPORT_TYPE = 1 AND TRAN_TYPE = 1)
            GROUP BY 
                CODE
),
TransferInQty AS (
    SELECT ItemsDtl.CODE, SUM(QUANTITY) AS TotalTransferIn
    FROM ItemsDtl
    INNER JOIN Itemsmst 
        ON ItemsDtl.TRAN_ID = Itemsmst.UTD
    WHERE Itemsmst.EXPORT_TYPE = 1 
      AND ItemsDtl.TRAN_TYPE = 4
      AND ItemsDtl.LOCATION = ${Loc_Code}
    GROUP BY ItemsDtl.CODE
),
SaleQty AS (
    SELECT 
                CODE,
                SUM(QUANTITY) AS TotalSale
            FROM 
                ItemsDtl
            WHERE 
                TRAN_TYPE = 2 
                AND TRAN_ID IN (SELECT TRAN_ID FROM Itemsmst WHERE LOC_CODE in (${Loc_Code}) AND EXPORT_TYPE = 1 AND TRAN_TYPE = 2)
            GROUP BY 
                CODE
),
TransferOutQty AS (
    SELECT ItemsDtl.CODE, SUM(QUANTITY) AS TotalTransferOut
    FROM ItemsDtl
    INNER JOIN Itemsmst 
        ON ItemsDtl.TRAN_ID = Itemsmst.UTD
    WHERE Itemsmst.EXPORT_TYPE = 1 
      AND ItemsDtl.TRAN_TYPE = 3
      AND ItemsDtl.Location = ${Loc_Code}
    GROUP BY ItemsDtl.CODE
),
OpeningStock AS (
    SELECT InventoryItems.UTD, COALESCE(OPENING_QTY, 0) AS OpeningStock
    FROM InventoryItems
),
BranchOpeningStock AS (
    SELECT Loc_Code, COALESCE(SUM(Opening_Qty), 0) AS BranchOpening, COALESCE(SUM(Opening_Val), 0) AS OpeningVal
    FROM BranchWiseItemOpening
    WHERE Loc_Code = ${Loc_Code} AND id = ${UTD}
    GROUP BY Loc_Code
)
SELECT 
    II.*, CAST(II.GST_RATE AS VARCHAR) AS GST_RATE,
	OS.OpeningStock ,BOS.BranchOpening AS OPENING_QTY,BOS.OpeningVal AS OPENING_VAL, PQ.TotalPurchase,TIQ.TotalTransferIn,SQ.TotalSale,TOQ.TotalTransferOut,
    ((COALESCE(OS.OpeningStock, 0) 
    + COALESCE(BOS.BranchOpening, 0) 
    + COALESCE(PQ.TotalPurchase, 0) 
    + COALESCE(TIQ.TotalTransferIn, 0)) 
    - (COALESCE(SQ.TotalSale, 0) 
    + COALESCE(TOQ.TotalTransferOut, 0))) AS CURR_STOCK
FROM 
    InventoryItems II
LEFT JOIN OpeningStock OS ON II.UTD = OS.UTD
LEFT JOIN BranchOpeningStock BOS ON BOS.Loc_Code = ${Loc_Code}
LEFT JOIN PurchaseQty PQ ON II.UTD = PQ.CODE
LEFT JOIN TransferInQty TIQ ON II.UTD = TIQ.CODE
LEFT JOIN SaleQty SQ ON II.UTD = SQ.CODE
LEFT JOIN TransferOutQty TOQ ON II.UTD = TOQ.CODE
WHERE 
    II.UTD = ${UTD};`);
        const Batch = await sequelize.query(`SELECT DISTINCT BATCH AS value, BATCH AS label
        FROM ItemsDtl
        WHERE CODE = ${UTD}
          AND Created_At = (
      SELECT MIN(Created_At)
      FROM ItemsDtl
      WHERE CODE = ${UTD}
        AND (
            COALESCE(
                (SELECT SUM(QUANTITY)
                 FROM ItemsDtl AS sub
                 WHERE sub.CODE = ItemsDtl.CODE AND sub.TRAN_TYPE = 1 AND sub.BATCH = ItemsDtl.BATCH), 0
            ) -
            COALESCE(
                (SELECT SUM(QUANTITY)
                 FROM ItemsDtl AS sub
                 WHERE sub.CODE = ItemsDtl.CODE AND sub.TRAN_TYPE = 2 AND sub.BATCH = ItemsDtl.BATCH), 0
            )
          ) != 0);`);
        const Batches = await sequelize.query(` SELECT DISTINCT BATCH AS value, BATCH AS label
FROM ItemsDtl
WHERE CODE = ${UTD}
  AND (
    COALESCE(
        (SELECT SUM(QUANTITY)  
         FROM ItemsDtl AS sub  
         WHERE sub.CODE = ItemsDtl.CODE AND sub.TRAN_TYPE = 1 AND sub.BATCH = ItemsDtl.BATCH), 0
    ) -
    COALESCE(
        (SELECT SUM(QUANTITY)  
         FROM ItemsDtl AS sub  
         WHERE sub.CODE = ItemsDtl.CODE AND sub.TRAN_TYPE = 2 AND sub.BATCH = ItemsDtl.BATCH), 0
    )) != 0;`);

        console.log(Items[0][0], 'Items[0][0]')
        res.send({ success: true, Items: Items[0][0], BATCH: Batch[0], BATCHES: Batches[0] });
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
exports.findMasters = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const MaxId = await sequelize.query(`SELECT (MAX(Ledg_Code) + 1) AS id FROM Ledg_Mst`);
        const STATE = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 3`);
        const District = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 2`);
        const Tehsil = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 1`);
        const Groups = await sequelize.query(`SELECT CAST(Group_Code AS VARCHAR) AS value, Group_Name AS label FROM Grup_Mst`);
        const Branches = await sequelize.query(`SELECT CAST(Godw_Code AS VARCHAR) AS value, Godw_Name AS label FROM 
        GODOWN_MST WHERE Godw_Code in (${multi_loc}) AND Export_type < 3`);
        const UOM = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`);
        const BRANDS = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 617`);
        const Models = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 14`);
        const Vendors = await sequelize.query(`select CAST(Ledg_Code AS VARCHAR) AS value, Ledg_Name AS label from ledg_mst Where Group_Code = 51`);
        const book_mst = await sequelize.query(`select CAST(Book_Code AS VARCHAR) as value , Book_Name as label from Book_Mst where export_type < 3 and Book_Type = 3 AND INV_Book = 1`);
        const Items = await sequelize.query(`select  top 100 UTD as value, COALESCE(CAST(ITEM_CODE AS VARCHAR), CAST(UTD AS VARCHAR)) AS label from InventoryItems`);

        const PurchasePostLedg = await sequelize.query(`WITH RecursiveSubGroups AS (
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
           FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 3;`); //Posting Ledger

        const SalePostLedg = await sequelize.query(`WITH RecursiveSubGroups AS (
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
            FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 3;`); //Posting Ledger


        res.send({
            success: true, STATE: STATE[0], Groups: Groups[0],
            District: District[0], Tehsil: Tehsil[0],
            Branches: Branches[0], MaxId: MaxId[0][0].id,
            UOM: UOM[0], BRANDS: BRANDS[0], Models: Models[0],
            Vendors: Vendors[0], Books: book_mst[0], Items: Items[0],
            PurchasePostLedg: PurchasePostLedg[0], SalePostLedg: SalePostLedg[0]
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
exports.FetchLocations = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.Loc_Code;

        const Branches = await sequelize.query(`SELECT CAST(Godw_Code AS VARCHAR) AS value, Godw_Name AS label FROM 
        GODOWN_MST WHERE Export_type < 3`);
        const Items = await sequelize.query(`SELECT TOP 1000 
    COALESCE(CAST(UTD AS VARCHAR), '') AS value, 
    CAST(ITEM_NAME AS VARCHAR) AS label
        FROM InventoryItems WHERE ITEM_TYPE = 1;`);

        res.send({
            success: true, Branches: Branches[0], Items: Items[0]
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
exports.fetchCurrentStock = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Branch = req.body.Branch;
        const Item = req.body.Item;
        const Stock = await sequelize.query(`WITH PurchaseQty AS (
     SELECT 
                CODE,
                SUM(QUANTITY) AS TotalPurchase
            FROM 
                ItemsDtl
            WHERE 
                TRAN_TYPE = 1 
                AND TRAN_ID IN (SELECT TRAN_ID FROM Itemsmst WHERE LOC_CODE in (${Branch}) AND EXPORT_TYPE = 1 AND TRAN_TYPE = 1)
            GROUP BY 
                CODE
),
TransferInQty AS (
    SELECT ItemsDtl.CODE, SUM(QUANTITY) AS TotalTransferIn
    FROM ItemsDtl
    INNER JOIN Itemsmst 
        ON ItemsDtl.TRAN_ID = Itemsmst.UTD
    WHERE Itemsmst.EXPORT_TYPE = 1 
      AND ItemsDtl.TRAN_TYPE = 4
      AND ItemsDtl.LOCATION = ${Branch}
    GROUP BY ItemsDtl.CODE
),
SaleQty AS (
    SELECT 
                CODE,
                SUM(QUANTITY) AS TotalSale
            FROM 
                ItemsDtl
            WHERE 
                TRAN_TYPE = 2
                AND TRAN_ID IN (SELECT TRAN_ID FROM Itemsmst WHERE LOC_CODE in (${Branch}) AND EXPORT_TYPE = 1 AND TRAN_TYPE = 2)
            GROUP BY 
                CODE
),
TransferOutQty AS (
    SELECT ItemsDtl.CODE, SUM(QUANTITY) AS TotalTransferOut
    FROM ItemsDtl
    INNER JOIN Itemsmst 
        ON ItemsDtl.TRAN_ID = Itemsmst.UTD
    WHERE Itemsmst.EXPORT_TYPE = 1 
      AND ItemsDtl.TRAN_TYPE = 3
      AND ItemsDtl.Location = ${Branch}
    GROUP BY ItemsDtl.CODE
),
OpeningStock AS (
    SELECT InventoryItems.UTD, COALESCE(OPENING_QTY, 0) AS OpeningStock, COALESCE(SALE_PRICE, 0) AS Amount
    FROM InventoryItems
),
BranchOpeningStock AS (
    SELECT Loc_Code, COALESCE(SUM(Opening_Qty), 0) AS BranchOpening
    FROM BranchWiseItemOpening
    WHERE Loc_Code = ${Branch} AND id = ${Item}
    GROUP BY Loc_Code
)
SELECT 
    II.*, 
	OS.OpeningStock,BOS.BranchOpening,PQ.TotalPurchase,TIQ.TotalTransferIn,SQ.TotalSale,TOQ.TotalTransferOut,
    OS.Amount,
    ((COALESCE(OS.OpeningStock, 0) 
    + COALESCE(BOS.BranchOpening, 0) 
    + COALESCE(PQ.TotalPurchase, 0) 
    + COALESCE(TIQ.TotalTransferIn, 0)) 
    - (COALESCE(SQ.TotalSale, 0) 
    + COALESCE(TOQ.TotalTransferOut, 0))) AS CURR_STOCK
FROM 
    InventoryItems II
LEFT JOIN OpeningStock OS ON II.UTD = OS.UTD
LEFT JOIN BranchOpeningStock BOS ON BOS.Loc_Code = ${Branch}
LEFT JOIN PurchaseQty PQ ON II.UTD = PQ.CODE
LEFT JOIN TransferInQty TIQ ON II.UTD = TIQ.CODE
LEFT JOIN SaleQty SQ ON II.UTD = SQ.CODE
LEFT JOIN TransferOutQty TOQ ON II.UTD = TOQ.CODE
WHERE 
    II.UTD = ${Item};
`);
        console.log(Stock[0], 'Stock[0]')
        res.send({
            success: true, Stock: Stock[0]
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
exports.SaveSaleBill = async function (req, res) {
    const BodyData = req.body;
    const { error, value } = SaleInvSchema.validate(BodyData, {
        abortEarly: false,
        stripUnknown: true
    });
    const InvData = value;
    const Created_by = InvData.Created_by;
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return res.status(400).send({ success: false, message: errorMessage });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();

        // const InvMst = _InvMst(sequelize, DataTypes);
        // const InvDtl = _InvDtl(sequelize, DataTypes);
        try {
            const InvMst_ = await InvMst.create({ ...InvData.InvMst, Created_by: Created_by }, { transaction: t });
            await InvDtl.create({ TRAN_ID: InvMst_.TRAN_ID, ...InvData.InvDtl, Created_by: Created_by }, { transaction: t });
            await t.commit();
            res.send(`data saved`)
        } catch (error) {
            console.log(error)
            res.send({ success: false, message: 'An error occurred while Saving Data', error });
            await t.rollback();
        } finally {
            await sequelize.close();
            console.log('Connection has been closed.');
        }
    }
};

exports.SavePurchaseBill = async function (req, res) {
    const BodyData = req.body;
    const { error, value } = PurchaseInvSchema.validate(BodyData, {
        abortEarly: false,
        stripUnknown: true
    });
    const PurData = value;
    const Created_by = PurData.Created_by;
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return res.status(400).send({ success: false, message: errorMessage });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        // const MrnMst = _MrnMst(sequelize, DataTypes);
        // const MrnDtl = _MrnDtl(sequelize, DataTypes);
        try {
            const InvMst_ = await MrnMst.create({ ...PurData.InvMst, Created_by: Created_by }, { transaction: t });
            await MrnDtl.create({ TRAN_ID: InvMst_.TRAN_ID, ...PurData.InvDtl, Created_by: Created_by }, { transaction: t });
            await t.commit();
            res.send(`data saved`)
        } catch (error) {
            console.log(error)
            res.send({ success: false, message: 'An error occurred while Saving Data', error });
            await t.rollback();
        } finally {
            await sequelize.close();
            console.log('Connection has been closed.');
        }
    }
};
exports.ItemImportExcel = async function (req, res, next) {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body.created_by)

    const t = await sequelize.transaction();
    try {
        const InventoryItems = _InventoryItems(sequelize, DataTypes);
        const BranchWiseItemOpening = _BranchWiseItemOpening(sequelize, DataTypes);
        const excelFile = req.files["excel"][0];
        const workbook = xlsx.read(excelFile.buffer, { type: "buffer", cellDates: true });
        const sheetNames = workbook.SheetNames;
        const sheetData = [];
        sheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);
            sheetData.push(data);
        });
        const firstSheetData = sheetData[0];
        const secondSheetData = sheetData[1];
        const Branches = await sequelize.query(`select Godw_Code, Godw_Name from Godown_Mst where Export_Type < 3`);
        const transformedData = secondSheetData.map(obj => {
            const newObj = {};
            for (const [key, value] of Object.entries(obj)) {
                const matchedBranch = Branches[0].find(branch => branch.Godw_Name.toUpperCase() === key.toUpperCase());
                if (matchedBranch) {
                    newObj[matchedBranch.Godw_Code] = value;
                } else if (key === 'ITEM_NAME') {
                    newObj[key] = value;
                } else {
                    console.log(`Invalid Godown name: ${key}`);
                }
            }
            return newObj;
        });
        if (!firstSheetData?.length) {
            sequelize.close();
            return res.status(500).send({ Message: "No data found in Excel or may be Invalid format" })
        }

        const gst = ['5', '12', '18', '28'];
        const itemType = ['PRODUCT', 'SERVICE'];

        const partCatType = { 'General Inventory': 1, 'MGA': 2, 'Non-MGA': 3 }
        const allowDecimal = { 'YES': 1, "NO": 0 }

        const itemName = firstSheetData.map(obj => `'${obj.ITEM_NAME}'`);
        const hsnNo = firstSheetData.map(obj => `'${obj.HSN}'`);
        const itemCode = firstSheetData
            .filter(obj => obj.ITEM_CODE) 
            .map(obj => `'${obj.ITEM_CODE}'`); 

        const itemCodeList = itemCode.length ? itemCode.join(",") : `''`;

        const item_code = await sequelize.query(`
        SELECT DISTINCT(ITEM_CODE) AS ic 
        FROM InventoryItems 
        WHERE ITEM_CODE IN (${itemCodeList})
      `);

        const hsn = await sequelize.query(`select distinct(HSN) from InventoryItems where HSN in (${hsnNo.length ? hsnNo : `''`})`);
        const vendors = await sequelize.query(`select Ledg_Name, Ledg_Code from ledg_mst Where Group_Code = 51`);
        const unitOfMeasurement = await sequelize.query(`select Misc_Name, Misc_Code from misc_mst where misc_type = 616`);
        const brands = await sequelize.query(`select Misc_Name, Misc_Code from misc_mst where misc_type = 617`);

        function validateitemType(itemType) {
            return itemType.includes(itemType?.toString().toUpperCase());
        }
        function validategst(gst) {
            return gst.includes(gst?.toString().toUpperCase());
        }

        const ErroredData = [];
        const CorrectData = [];
        firstSheetData.map(obj => {
            let oldObj = { ...obj };
            const rejectionReasons = [];
            const duplicateItemCode = firstSheetData.filter(item => item.ITEM_CODE?.toString() === obj.ITEM_CODE?.toString());
            if (duplicateItemCode?.length >= 2 && obj.ITEM_CODE) {
                rejectionReasons.push(`Duplicate Item Code (${obj.ITEM_CODE}) found ${duplicateItemCode.length} times in this Excel`, ' | ');
            }
            const duplicateItemName = firstSheetData.filter(item => item.ITEM_NAME?.toString() === obj.ITEM_NAME?.toString());
            if (duplicateItemName?.length >= 2 && obj.ITEM_NAME) {
                rejectionReasons.push(`Duplicate Item Name (${obj.ITEM_NAME}) found ${duplicateItemName.length} times in this Excel`, ' | ');
            }
            // const duplicateHSN = data.filter(item => item.HSN?.toString() === obj.HSN?.toString());
            // if (duplicateHSN?.length >= 2 && obj.HSN) {
            //     rejectionReasons.push(`Duplicate HSN (${obj.HSN}) found ${duplicateHSN.length} times in this Excel`, ' | ');
            // }
            if (item_code[0].some(item => item.ic?.toString() == obj.ITEM_CODE?.toString())) {
                rejectionReasons.push(`Item Code  ${obj.ITEM_CODE} Already Exist In Master`, ' | ');
            }
            if (obj.ITEM_TYPE?.toUpperCase() == 'PRODUCT' || obj.ITEM_TYPE?.toUpperCase() == 'SERVICE') {
                obj.ITEM_TYPE = obj.ITEM_TYPE?.toUpperCase() == 'PRODUCT' ? '1' : '2'
            }
            // if (obj.ALLOW_DECIMAL?.toUpperCase() == 'YES' || obj.ALLOW_DECIMAL?.toUpperCase() == 'NO') {
            //     obj.ALLOW_DECIMAL = obj.ALLOW_DECIMAL?.toUpperCase() == 'YES' ? 1 : 0
            // } else {
            //     rejectionReasons.push("Invalid ITEM_TYPE", ' | ');
            // }
            // if (obj.ITEM_CAT?.toUpperCase() == 'GENERAL INVENTORY' || obj.ITEM_CAT?.toUpperCase() == 'MGA' || obj.ITEM_CAT?.toUpperCase() == 'NON-MGA') {
            //     obj.ITEM_CAT = obj.ITEM_CAT?.toUpperCase() == 'General Inventory' ? 1 : obj.ITEM_CAT = obj.ITEM_CAT?.toUpperCase() == 'MGA' ? 2 : 3
            // } else {
            //     rejectionReasons.push("Invalid Part Category", ' | ');
            // }
            // const uomObject = unitOfMeasurement[0].find(item => item.Misc_Name?.toUpperCase() == obj.UOM?.toString().toUpperCase());
            // if (uomObject) {
            //     obj.UOM = uomObject.Misc_Code;
            // } else {
            //     rejectionReasons.push("Invalid UOM", ' | ');
            // }
            // const brandsObject = brands[0].find(item => item.Misc_Name?.toUpperCase() == obj.BRAND?.toString().toUpperCase());
            // if (brandsObject) {
            //     obj.BRAND = brandsObject.Misc_Code;
            // } else {
            //     rejectionReasons.push("Invalid UOM", ' | ');
            // }
            // console.log(vendors[0].find(item => item.Ledg_Name?.toUpperCase()))
            // console.log(obj.PRE_VENDOR?.toString().toUpperCase())
            // if (obj.PRE_VENDOR) {

            //     const vendorObject = vendors[0].find(item => item.Ledg_Name?.toUpperCase() == obj.PRE_VENDOR?.toString().toUpperCase());
            //     if (vendorObject) {
            //         obj.PRE_VENDOR = vendorObject.Ledg_Code;
            //     } else {
            //         rejectionReasons.push("Invalid Vendor name", ' | ');
            //     }
            // }
            // console.log(rejectionReasons, 'kkkk')
            if (rejectionReasons.length > 0) {
                ErroredData.push({
                    ...oldObj,
                    rejectionReasons: rejectionReasons?.slice(0, -1)
                });
            } else {
                CorrectData.push(obj);
            }
        });
        const BATCH_SIZE = 10000; // Define your batch size
        let batchCount = Math.ceil(CorrectData.length / BATCH_SIZE);

        let InventoryItems_ = 0;
        try {
            for (let i = 0; i < batchCount; i++) {
                const batchStart = i * BATCH_SIZE;
                const batchEnd = batchStart + BATCH_SIZE;
                const dataBatch = CorrectData.slice(batchStart, batchEnd).map((item) => ({
                    ...item,
                    ITEM_CODE: typeof item?.ITEM_CODE === 'string' ? item.ITEM_CODE.replace(/'/g, "") : String(item?.ITEM_CODE || ""),
                    ITEM_NAME: typeof item?.ITEM_NAME === 'string' ? item.ITEM_NAME.replace(/'/g, "") : String(item?.ITEM_NAME || ""),
                    Created_by: req.body.created_by,
                    LOC_CODE: req.body.branch
                }));

                InventoryItems_ = await InventoryItems.bulkCreate(dataBatch, { transaction: t });

                console.log(`Inserted batch ${i + 1} with ${InventoryItems_.length} items`);
            }
            const inutd = InventoryItems_.map(obj => ({
                UTD: obj.UTD,
                ITEM_NAME: obj.ITEM_NAME
            }));

            const transformedData1 = transformedData.flatMap(item => {
                const matchedItem = inutd.find(obj => obj.ITEM_NAME === item.ITEM_NAME);
                if (matchedItem) {
                    return Object.entries(item)
                        .filter(([key]) => key !== 'ITEM_NAME')
                        .map(([Loc_Code, Opening_Qty]) => ({
                            Id: matchedItem.UTD,
                            Loc_Code,
                            Opening_Qty,
                            Created_by: req.body.created_by
                        }));
                }
                return [];
            });

            await BranchWiseItemOpening.bulkCreate(
                transformedData1.map((items) => ({ ...items })),
                { transaction: t }
            );
            await t.commit();
            console.log('Transaction committed successfully');
        } catch (error) {
            await t.rollback();
            console.error('Transaction rolled back due to error:', error);
        } finally {
            await sequelize.close();
            console.log('Database connection closed');
        }

        res.status(200).send({ ErroredData: ErroredData, Message: `${InventoryItems_.length} Records Inserted` })
        
    } catch (error) {
        t.rollback();
        console.error("Error:", error);
        // const errorLogDir = path.join(__dirname, 'errorLogs');
        //         if (!fs.existsSync(errorLogDir)) {
        //             fs.mkdirSync(errorLogDir, { recursive: true });
        //         }
        //         const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        //         const errorLogFile = path.join(errorLogDir, `errorLog-${sequelize?.config?.database}-${timestamp}.json`);
        //         fs.writeFileSync(errorLogFile, JSON.stringify(error.sql, null, 2), 'utf8');
        //         console.log(`Errors logged to ${errorLogFile}`);
        res.status(500).json({ Message: "An error occurred during file import." });
    }
};
exports.ItemImportFormat = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        let reportName = "Item Master Excel Import";
        let Headeres = ['ITEM_CODE', 'ITEM_NAME', 'ITEM_CAT', 'BIN_LOC', 'HSN', 'ITEM_TYPE', 'GST_RATE', 'PRE_VENDOR', 'DLR_PRICE', 'PURCH_PRICE', 'MRP_PRICE', 'SALE_PRICE', 'OLD_PRICE', 'UOM', 'ALLOW_DECIMAL', 'CLASSIFICATION'];
        const Headeres2 = ['ITEM TYPE', 'Allow Decimal Value', 'Gst Applicable', 'Part Category', 'UOM', 'Vendor'];

        const ITEMTYPEARRAY = ['GOODS', 'SERVICE'];
        const PARTCATARRAY = ['General Inventory', 'MGA', 'Non-MGA'];
        const ALLOWDECIMALARRAY = ['YES', 'NO'];
        // const REGISTRATIONARRAY = ['Unknown', 'Composition', 'Consumer', 'Regular', 'UnRegistered'];
        const GSTARRAY = ['5', '12', '18', '28']

        const UOM = await sequelize.query(`select Misc_Name from misc_mst where misc_type = 72`);
        const Branches = await sequelize.query(`select Godw_Name from Godown_Mst where Export_type < 3`);
        const UOMARRAY = UOM[0]?.map(obj => obj.Misc_Name);
        let BranchNames = Branches[0]?.map(obj => obj.Godw_Name);
       
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
        const worksheet = workbook.addWorksheet("MasterData");
        const worksheet1 = workbook.addWorksheet("BrItemOp");
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
        worksheet.mergeCells("A3:P3");
        let reportName1 = "COPY THESE HEADINGS IN A NEW EXCEL, THEN FILL DATA AND IMPORT THE NEW SHEET INTO WEB PORTAL";
        worksheet.getCell("A3").value = `${reportName1}`;

        const headerRow = worksheet.addRow(Headeres);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF006400" },
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
        BranchNames = ["ITEM_NAME",...BranchNames]
        const headerRow2 = worksheet1.addRow(BranchNames);
        headerRow2.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF006400" }, // dark green background color
            };
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
exports.VendorDataFetch = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const LedgerCode = req.body.LedgerCode;
        const Branch = req.body.Branch;

        const LedgerData = await sequelize.query(`select GSTTYPE AS RegistrationType, GST_No, State_Code, Ledg_Pan from Ledg_Mst WHERE Ledg_Code = ${LedgerCode}`);
        const state = await sequelize.query(`SELECT State_Code from Godown_Mst Where Godw_Code = ${Branch} `)
        res.send({ success: true, LedgerData: LedgerData[0][0], state: state[0][0] });
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
exports.ItemTaxRates = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const ITEM_TYPE = parseInt(req.body.ITEM_TYPE);
        console.log(ITEM_TYPE, 'ITEM_TYPE')
        let GstRates = [];
        let CessRates = [];
        let GstHalfRates = [];
        let GSTRATE;
        let CESSRATE;
        if (ITEM_TYPE === 1) {
            GSTRATE = await sequelize.query(`SELECT RATE FROM GSTRATE WHERE HEAD_TYPE = 2`);
            CESSRATE = await sequelize.query(`SELECT RATE FROM CESSRATE WHERE HEAD_TYPE = 2`);
        } else if (ITEM_TYPE === 2) {
            GSTRATE = await sequelize.query(`SELECT RATE FROM GSTRATE WHERE HEAD_TYPE = 3`);
            CESSRATE = await sequelize.query(`SELECT RATE FROM CESSRATE WHERE HEAD_TYPE = 3`);
        } else if (ITEM_TYPE === 3) {
            GSTRATE = await sequelize.query(`SELECT RATE FROM GSTRATE WHERE HEAD_TYPE = 4`);
            CESSRATE = await sequelize.query(`SELECT RATE FROM CESSRATE WHERE HEAD_TYPE = 4`);
        }

        if (GSTRATE && GSTRATE[0]) {
            GstHalfRates = GSTRATE[0].map(rateObj => rateObj.RATE / 2);
            GstRates = GSTRATE[0].map(rateObj => rateObj.RATE);
        }
        if (CESSRATE && CESSRATE[0]) {
            CessRates = CESSRATE[0].map(rateObj => rateObj.RATE);
        }
        res.send({ success: true, GstHalfRates: GstHalfRates, GstRates: GstRates, CessRates: CessRates });
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
exports.InventoryItemsExport = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const Loc_Code = data.Loc_Code;

    try {
        const txnDetails = await sequelize.query(
            `SELECT 
    ITEM_CODE, 
    ITEM_NAME,
    HSN,
    BIN_LOC,
    PURCH_PRICE,  
    MRP_PRICE, 
    SALE_PRICE, 
    OPENING_VAL,
    COALESCE(
        COALESCE(OPENING_QTY, 0) + 
        ISNULL((
            SELECT TOP 1 Opening_Qty 
            FROM BranchWiseItemOpening 
            WHERE InventoryItems.UTD = BranchWiseItemOpening.Id 
            AND (BranchWiseItemOpening.Loc_Code in (${Loc_Code}) OR BranchWiseItemOpening.Loc_Code IS NULL)
        ), 0),
    0) AS Total_Opening_Value
FROM InventoryItems;
`
        );
        const Company_Name = await sequelize.query(
            `select top 1 comp_name from Comp_Mst`
        );

        console.log("Transaction Details:", txnDetails);
        console.log("Company Name:", Company_Name);

        if (!txnDetails || !txnDetails[0] || txnDetails[0].length === 0) {
            throw new Error("No transaction details found");
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Sheet1");

        worksheet.mergeCells("A1:E1");
        worksheet.getCell("A1").value = `${Company_Name[0][0]?.comp_name}`;
        worksheet.getCell("A1").alignment = {
            vertical: "middle",
            horizontal: "center",
        };
        worksheet.getCell("A1").font = { bold: true, size: 16 };

        worksheet.mergeCells("A2:E2");
        worksheet.getCell("A2").value = `Inventory Items`;
        worksheet.getCell("A2").alignment = {
            vertical: "middle",
            horizontal: "center",
        };

        // Add headers for the data starting from the 3rd row
        const headers = Object.keys(txnDetails[0][0]);
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF006400" },
            };
        });

        txnDetails[0]?.forEach((obj) => {
            const values = Object.values(obj);
            worksheet.addRow(values);
        });

        res
            .status(200)
            .setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="InventoryItems.xlsx"'
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
        console.error("Error:", e);
        res.status(500).send("Internal Server Error");
    } finally {
        // Close the Sequelize connection
        if (sequelize) {
            await sequelize.close();
        }
    }
};

exports.TransferStock = async function (req, res) {
    console.log(req.body, 'BodyData')
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const BodyData = req.body;
    const ENTRTYPE = BodyData.ENTRTYPE;
    const formdata = BodyData.formData;
    let DtlData = BodyData.formData.DtlData;
    const Created_by = BodyData.formData.Created_by;
    const ItemsMst = _ItemsMst(sequelize, DataTypes);
    const ItemsDtl = _ItemsDtl(sequelize, DataTypes);
    try {
        const FindUserCode = await sequelize.query(`
        select User_Code FROM user_tbl where User_Name  = '${Created_by}' AND Export_Type = 1 AND Module_Code = 10`);
        const inv_no = await sequelize.query(`SELECT CONCAT((SELECT TOP 1 Book_Prefix FROM book_mst WHERE book_code =
                (SELECT misc_dtl1 FROM misc_mst WHERE misc_code = '${ENTRTYPE == 3 ? 13 : ENTRTYPE == 4 ? 14 : null}' and misc_type = 56)),
                isnull(MAX(seq_no) + 1, 1)) AS bill_no FROM DMS_ROW_DATA WHERE tran_type ='${ENTRTYPE == 3 ? 13 : ENTRTYPE == 4 ? 14 : null}' and Export_type < 3;`);
        const MaxTranId = await sequelize.query(`SELECT isnull(max(Tran_Id)+20,1) AS TRAN_ID from DMS_ROW_DATA`);
        let Tran_Id = MaxTranId[0][0]?.TRAN_ID;
        const MaxSeq = await sequelize.query(`select isnull(MAX(seq_no) + 1, 1) AS SeqNo FROM DMS_ROW_DATA WHERE tran_type ='${ENTRTYPE == 3 ? 13 : ENTRTYPE == 4 ? 14 : null}' and Export_type < 3;`);
        let Seq_No = MaxSeq[0][0]?.SeqNo;
        const TrfOut = await sequelize.query(`select DMS_PART_TRFOUT,GST_No from GODOWN_MST WHERE Export_Type <> 33 AND Godw_Code = ${formdata.FromBranch}`);
        const TrfIn = await sequelize.query(`select DMS_PART_TRFIN, CONCAT(State_Code,'-' ,State) as StateName from GODOWN_MST WHERE Export_Type <> 33 AND Godw_Code = ${formdata.ToBranch}`);
        const MaxIItem = await sequelize.query(`SELECT isnull(max(TRAN_ID)+1,1) AS TRANID from ItemsMst WHERE TRAN_TYPE = ${ENTRTYPE}`);
        let MaxItemId = MaxIItem[0][0]?.TRANID;
        let SavedUTD;
        if (ENTRTYPE == 3 || ENTRTYPE == 4) {
            let ItemsUtd = DtlData.map(item => `'${item["Item"]}'`).join(',');
            let ItemCodes = await sequelize.query(
                `SELECT HSN, UTD FROM InventoryItems WHERE UTD IN (${ItemsUtd})`,
                { type: sequelize.QueryTypes.SELECT }
            );
            let itemCodeMap = {};
            ItemCodes.forEach(row => {
                itemCodeMap[row.UTD] = row.HSN;
            });
            DtlData = DtlData.map(item => ({
                ...item,
                Tran_Id: Tran_Id,
                Bill_No: inv_no[0][0].bill_no,
                Tran_Type: ENTRTYPE == 3 ? 13 : ENTRTYPE == 4 ? 14 : null,
                LOCATION: TrfOut[0][0].DMS_PART_TRFOUT,
                Ledger_Name: TrfIn[0][0].DMS_PART_TRFIN,
                State_Code: TrfIn[0][0].StateName,
                VIN: TrfOut[0][0].GST_No,
                GST: TrfOut[0][0].GST_No,
                Basic_Price: item.TotalValue,
                Taxable: item.TotalValue,
                Inv_Amt: item.TotalValue,
                Sup_Qty: item.TransferQty,
                HSN: itemCodeMap[item["Item"]] || null,
                Item_Code: itemCodeMap[item["Item"]] || null
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
            SavedUTD = await ItemsMst.create({
                TRAN_ID: MaxItemId,
                TRAN_TYPE: ENTRTYPE,
                Book_Code: ENTRTYPE == 3 ? 13 : ENTRTYPE == 4 ? 14 : null,
                INV_NO: inv_no[0][0].bill_no,
                Created_by,
                DRD_ID: Tran_Id,
                VOUCHER_NO: Seq_No,
                LOC_CODE: formdata.FromBranch,
                Export_Type: 1,
                ServerId: 1,
            }, { transaction: t });

            let SRNO = 1
            await ItemsDtl.bulkCreate(
                DtlData.map((value) => ({
                    SRNO: SRNO++,
                    TRAN_ID: SavedUTD.UTD,
                    TRAN_TYPE: ENTRTYPE,
                    CODE: value.Item,
                    Location: formdata.FromBranch,
                    LOC_CODE: formdata.ToBranch,
                    QUANTITY: value.Sup_Qty,
                    RATE: value.Amount,
                    Inv_Amt: value.Inv_Amt,
                    Created_by: Created_by,
                })),
                { transaction: t });

        }
        const currentDate = new Date();
        const ENTR_DATE = currentDate.toISOString().split('T')[0];
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const ENTR_TIME = `${hours}.${minutes}`;
        await Promise.all(
            DtlData.map((item) => {
                const updateData = {
                    ...item,
                    USR_CODE: FindUserCode[0][0].User_Code,
                    ENTR_DATE: ENTR_DATE,
                    ENTR_TIME: ENTR_TIME,
                };

                const insertPromise = sequelize.query(
                    `
                INSERT INTO DMS_ROW_DATA (
                  Tran_Id, 
                  Item_Code, 
                  Ledger_Name,  
                  Bill_Date,  
                  Tran_Type,  
                  Bill_No, 
                  GST, 
                  State_Code, 
                  Loc_Code, 
                  HSN, 
                  Sup_Qty, 
                  Basic_Price, 
                  Taxable, 
                  Inv_Amt, 
                  USR_CODE, 
                  ENTR_DATE, 
                  ENTR_TIME, 
                  LOCATION, 
                  ENTRY_BATCH, 
                  Export_Type,
                  Seq_No,
                  VIN,
                  ENTR_MODE,
                  Ledger_Id ,
                  Sale_Type
                ) VALUES (
                  ${Tran_Id},
                  '${updateData.Item_Code}',
                  '${updateData.Ledger_Name}',
                  GETDATE(),
                  ${updateData.Tran_Type ? `'${updateData.Tran_Type}'` : null},
                  ${updateData.Bill_No ? `'${updateData.Bill_No}'` : null},
                  ${updateData.GST ? `'${updateData.GST}'` : null},
                  '${updateData.State_Code}',
                  ${formdata.FromBranch ? formdata.FromBranch : null},
                  ${updateData.HSN ? `'${updateData.HSN}'` : null},
                  ${updateData.Sup_Qty ? updateData.Sup_Qty : null},
                  ${updateData.Basic_Price ? updateData.Basic_Price : null},
                  ${updateData.Taxable ? updateData.Taxable : null},
                  ${updateData.Inv_Amt ? updateData.Inv_Amt : null},
                  ${updateData.USR_CODE ? updateData.USR_CODE : null},
                  ${updateData.ENTR_DATE ? `'${updateData.ENTR_DATE}'` : null},
                  ${updateData.ENTR_TIME ? `'${updateData.ENTR_TIME}'` : null},
                  ${updateData.LOCATION ? `'${updateData.LOCATION}'` : null},
                  'CLOUD-${Tran_Id}',
                  0,
                  '${Seq_No}',
                  ${updateData.GST ? `'${updateData.GST}'` : null},
                  1,
                  ${ENTRTYPE == 4 ? `'${updateData.LOCATION}'` : null},
                  ${ENTRTYPE == 4 ? `'${updateData.Sale_Type}'` : null}
                )`,
                    { transaction: t }
                );

                const updatePromise =
                    ENTRTYPE === 4
                        ? sequelize.query(
                            `
                      UPDATE ItemsMst 
                      SET REF_NO = '${updateData.Bill_No}' 
                      WHERE INV_NO = '${updateData.Sale_Type}'
                      `,
                            { transaction: t }
                        )
                        : Promise.resolve();
                return Promise.all([insertPromise, updatePromise]);
            })
        );

        await sequelize.query(`INSERT INTO VAS_TEMP 
                (TRAN_ID, EXPORT_TYPE,TRAN_TYPE) 
                VALUES 
                (${Tran_Id}, 1,${ENTRTYPE == 3 ? 13 : 14})
                `, { transaction: t });

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

exports.TransferInStockView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Loc_Code = req.body.loc_code;
        const Items = await sequelize.query(`
SELECT UTD,(SELECT TOP 1 ITEM_NAME FROM InventoryItems WHERE UTD = CODE) Itemname ,CODE AS Item,
(SELECT TOP 1 Godw_name FROM Godown_Mst where Godw_Code = LOCATION and Export_Type < 3) as FromBranch1,
(SELECT TOP 1 INV_NO FROM ItemsMst where ItemsMst.UTD = ItemsDtl.TRAN_ID and Export_Type < 3) as Sale_Type,
LOCATION AS FromBranch,LOC_CODE AS ToBranch, QUANTITY AS TransferQty, RATE AS Amount, Inv_Amt AS TotalValue, Created_At
FROM ItemsDtl where TRAN_ID in (SELECT UTD FROM ItemsMst where REF_NO is null AND TRAN_TYPE = 3) AND LOC_CODE = ${Loc_Code}
          `);
        res.send({ success: true, Items: Items[0] });
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