const { Sequelize, DataTypes, literal, QueryTypes, Op, fn, col } = require('sequelize');
const { dbname } = require('../utils/dbconfig');
const Joi = require('joi');
const path = require('path');
const { v4: uuidv4 } = require("uuid");

const { _TvIcmMst, TvIcmMstSchema } = require("../models/TvIcmMst");
const { _TvIcmDtl, TvIcmDtlSchema } = require("../models/TvIcmDtl");
const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");
const { _ChasMst, chasMstSchema } = require("../models/ChasMst");
const { _ChasTran, chasTranSchema } = require("../models/ChasTran");
const { _Employeemaster, EmployeemasterSchema } = require("../models/Employeemaster");
const { _DmsRowData, DmsRowDataSchema } = require("../models/DmsRowData");
const { _TvOffPr, TvOffPrSchema } = require("../models/TvOffPr");
const { _TvAudit, tvAuditSchema } = require("../models/TvAudit");
const { _TvFields } = require("../models/TvFields");
const { _TvDo, TvDoSchema } = require("../models/TvDo");
const { _ExpenseApprovalMatrix, expenseApprovalMatrixSchema } = require("../models/ExpenseApprovalMatrix");

const { SendWhatsAppMessgae } = require("./user");
const qrcode = require('qrcode');

const fs = require('fs');
const { promisify } = require('util');

const unlinkAsync = promisify(fs.unlink);
const FormData = require('form-data');
const axios = require('axios');

const TvDataSchemaPurchase = Joi.object({
    formData: {
        TvIcmMst: TvIcmMstSchema,
        TvIcmDtl: TvIcmDtlSchema,
        Created_by: Joi.string().max(30).required(),
    }
});
const TvDataSchema = Joi.object({
    TvIcmMst: TvIcmMstSchema,
    TvIcmDtl: TvIcmDtlSchema,
    Created_by: Joi.string().max(30).required(),
});
const TvDataSchemaDms = Joi.object({
    Created_by: Joi.string().max(30).required(),
    formData: {
        TvIcmMst: TvIcmMstSchema,
        TvIcmDtl: TvIcmDtlSchema
    }
});

exports.InsertTvMapper = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData, 'BodyData')
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const TvFields = _TvFields(sequelize, DataTypes);

    try {
        await TvFields.bulkCreate(
            BodyData.map((items) => ({ ...items })),
            { transaction: t }
        );

        await t.commit();
        res.status(200).send({ success: true, message: "Purchase Data Saved....!" });

    } catch (error) {
        console.log(error)
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
exports.insertDataPur = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData, 'BodyData')
    const tvIcmMst = BodyData.formData.TvIcmMst;
    const tvIcmDtl = BodyData.formData.TvIcmDtl;
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
    const TvIcmDtl = _TvIcmDtl(sequelize, DataTypes);

    try {
        const [
            CheckChassis,
            CheckEngine,
            CheckVehRegNo,
        ] = await Promise.all([
            sequelize.query(`select * FROM Chas_Mst WHERE Chas_No = '${tvIcmMst.CHAS_NO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
            sequelize.query(`select * FROM Chas_Mst WHERE Eng_No = '${tvIcmMst.ENGINE_NO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
            sequelize.query(`select * FROM Chas_Mst WHERE Reg_No = '${tvIcmMst.VEHREGNO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
        ]);
        const [
            CheckChassisICM,
            CheckEngineICM,
            CheckVehRegNoICM,
        ] = await Promise.all([
            sequelize.query(`select * FROM TV_ICM_MST WHERE CHAS_NO = '${tvIcmMst.CHAS_NO}' AND YEAR(PUR_DATE) = YEAR(GETDATE()) AND MONTH(PUR_DATE) > 3;`),
            sequelize.query(`select * FROM TV_ICM_MST WHERE ENGINE_NO = '${tvIcmMst.ENGINE_NO}' AND YEAR(PUR_DATE) = YEAR(GETDATE()) AND MONTH(PUR_DATE) > 3;`),
            sequelize.query(`select * FROM TV_ICM_MST WHERE VEHREGNO = '${tvIcmMst.VEHREGNO}' AND YEAR(PUR_DATE) = YEAR(GETDATE()) AND MONTH(PUR_DATE) > 3;`),
        ]);
        if (CheckChassis[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Chassis No. Found" });
        }
        if (CheckEngine[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Engine No. Found" });
        }
        if (CheckVehRegNo[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Registration No. Found" });
        }
        if (CheckChassisICM[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Chassis No. Found" });
        }
        if (CheckEngineICM[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Engine No. Found" });
        }
        if (CheckVehRegNoICM[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Registration No. Found" });
        }
        const [
            MaxChasId,
            MaxChasTranId,
            ModlMst,
            Purgst,
            FindUserCode,
            MaxTranId,
            PurInvNo,
            MaxPurSeq,
            LedgCode,
            StateName,
            EvalName,
        ] = await Promise.all([
            sequelize.query(`select isnull(MAX(Chas_Id) + 1, 1) AS SeqNo FROM CHAS_MST`),
            sequelize.query(`select isnull(MAX(Tran_Id) + 1, 1) AS SeqNo FROM CHAS_TRAN`),
            sequelize.query(`select HSN,Asset_Ledg, Income_Ledg, Modl_Code, Modl_Name,Modl_Abbr,Modl_Grp,Purc_Ledg,Sale_Ledg from modl_Mst WHERE Item_Code = 1742`),
            sequelize.query(`select * from GSTRATE WHERE Head_Type = 5 AND RATE = 0.00`),
            sequelize.query(`select User_Code FROM user_tbl where User_Name  = '${BodyData.formData.Created_by}' AND Export_Type = 1 AND Module_Code = 10`),
            sequelize.query(`SELECT isnull(max(Tran_Id)+1,1) AS TRAN_ID from DMS_ROW_DATA`),
            sequelize.query(`SELECT CONCAT((SELECT TOP 1 Book_Prefix FROM book_mst WHERE book_code =
                (SELECT misc_dtl1 FROM misc_mst WHERE misc_code = '${BodyData.formData.TvIcmMst.PUR_BOOK ? BodyData.formData.TvIcmMst.PUR_BOOK : ''}' and misc_type = 56)),
                isnull(MAX(seq_no) + 1, 1)) AS bill_no FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formData.TvIcmMst.PUR_BOOK ? BodyData.formData.TvIcmMst.PUR_BOOK : ''}' and Export_type < 3;`),
            sequelize.query(`select isnull(MAX(seq_no) + 1, 1) AS SeqNo FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formData.TvIcmMst.PUR_BOOK ? BodyData.formData.TvIcmMst.PUR_BOOK : ''}' and Export_type < 3;`),
            sequelize.query(`Select Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = '${tvIcmMst.SELLER_NAME}'`),
            sequelize.query(`SELECT TOP 1 Misc_Name From Misc_mst WHERE Misc_Code = ${tvIcmMst.PUR_CUST_STATE} AND Misc_type = 3`),
            sequelize.query(`SELECT TOP 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where  EMPCODE = '${tvIcmMst.PUR_EVAL_NAME}'`),
        ]);
        let Chas_Id = MaxChasId[0][0]?.SeqNo;
        let ChasTran_Id = MaxChasTranId[0][0]?.SeqNo;
        let Tran_Id = MaxTranId[0][0]?.TRAN_ID;
        let PurSeq = MaxPurSeq[0][0]?.SeqNo;
        let PurDmsInv = PurInvNo[0][0]?.bill_no;
        let RndOff = Math.round(tvIcmMst.PURCHASE_COST) - parseFloat(tvIcmMst.PURCHASE_COST);
        const currentDate = new Date();
        const ENTR_DATE = currentDate.toISOString().split('T')[0];
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const ENTR_TIME = `${hours}.${minutes}`;
        const Created_by = BodyData.formData.Created_by;
        // const DmsPur = {
        //     Tran_Id: Tran_Id,
        //     Tran_Type: tvIcmMst.PUR_BOOK,
        //     Bill_No: PurDmsInv,
        //     Bill_Date: tvIcmMst.PUR_DATE,
        //     Chassis: tvIcmMst.CHAS_NO,
        //     Engine: tvIcmMst.ENGINE_NO,
        //     Ledger_Name: LedgCode[0][0].Ledg_Name,
        //     State_Code: tvIcmMst.PUR_CUST_STATE,
        //     GST: tvIcmMst.SALE_CUST_GST,
        //     Item_Code: ModlMst[0][0].Modl_Code,
        //     HSN: ModlMst[0][0].HSN,
        //     Basic_Price: tvIcmMst.PURCHASE_COST,
        //     Taxable: tvIcmMst.PURCHASE_COST,
        //     CGST_Perc: 0,
        //     SGST_Perc: 0,
        //     IGST_Perc: 0,
        //     CGST: 0,
        //     SGST: 0,
        //     IGST: 0,
        //     Rnd_Off: RndOff,
        //     Export_Type: 0,
        //     Inv_Amt: tvIcmMst.PURCHASE_COST,
        //     Rnd_Ledg: 23,
        //     CGST_ACNT: Purgst[0][0].CGST_INPUT,
        //     SGST_ACNT: Purgst[0][0].SGST_INPUT,
        //     IGST_ACNT: Purgst[0][0].IGST_INPUT,
        //     Loc_Code: tvIcmMst.LOC_CODE,
        //     LOCATION: tvIcmMst.LOC_CODE,
        //     Sup_Qty: 1,
        //     Sale_Ledg: ModlMst[0][0].Purc_Ledg,
        //     Narration: tvIcmMst.REMARKS,
        //     Server_id: 1,
        //     Item_Type: 5,
        //     Assessable_Rate: 0,
        //     LEDG_ACNT: tvIcmMst.SELLER_NAME,
        //     Seq_No: PurSeq,
        //     Item_Seq: 1,
        //     Modl_Code: 1742,
        //     USR_CODE: FindUserCode[0][0].User_Code,
        //     ENTR_DATE: ENTR_DATE,
        //     ENTR_TIME: ENTR_TIME,
        //     Ref_Dt: tvIcmMst.PUR_DATE,
        // }
        // const ChasTranDataPur = {
        //     Tran_Id: ChasTran_Id,
        //     CHAS_ID: Chas_Id,
        //     TRAN_TYPE: 1,
        //     Tran_Date: tvIcmMst.PUR_DATE,
        //     Tran_Amt: tvIcmMst.PURCHASE_COST,
        //     Asset_Ledg: ModlMst[0][0].Asset_Ledg,
        //     Income_Ledg: ModlMst[0][0].Income_Ledg,
        //     Loc_Code: tvIcmMst.LOC_CODE,
        //     Export_Type: 0,
        //     Item_Type: 3,
        //     Item_Seq: 1,
        //     Created_By: BodyData.Created_by,
        // }
        // const ChasMstData = {
        //     Chas_Id: Chas_Id,
        //     Chas_No: BodyData.formData.TvIcmMst.CHAS_NO,
        //     Eng_No: BodyData.formData.TvIcmMst.ENGINE_NO,
        //     Reg_No: BodyData.formData.TvIcmMst.VEHREGNO,
        //     Modl_Code: 1742,
        //     Purc_Id: Tran_Id,
        //     PInv_No: PurDmsInv,
        //     PInv_Date: tvIcmMst.PUR_DATE,
        //     Purc_Amt: tvIcmMst.PURCHASE_COST,
        //     Chs_Dtl1: BodyData.formData.TvIcmMst.SELLER_NAME,
        //     Chs_Dtl2: BodyData.formData.TvIcmMst.MODEL_VARIANT,
        //     Chs_Dtl3: BodyData.formData.TvIcmMst.MODEL_VAR,
        //     Chs_Dtl4: BodyData.formData.TvIcmMst.REG_YEAR,
        //     Loc_Code: BodyData.formData.TvIcmMst.LOC_CODE,
        //     Export_Type: 1,
        //     Created_By: BodyData.Created_by,
        // }
        const { error: error1, value: tvData } = TvDataSchemaPurchase.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true
        });
        console.log(error1, 'error1')
        if (error1) {
            const errorMessage = error1.details.map(err => err.message).join(', ');
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            const TvIcmMst1 = await TvIcmMst.create({ ...tvData.formData.TvIcmMst, DMS_BI: tvIcmMst.TV_PUR_INV_DMS, Export_Type: 1, Created_by: Created_by, VIEW_FLAG: 0 }, { transaction: t });
            await TvIcmDtl.create({ TRAN_ID: TvIcmMst1.UTD, ...tvData.formData.TvIcmDtl, Created_by: Created_by }, { transaction: t });
        }
        const LedgerState = await sequelize.query(`SELECT State_Code FROM Ledg_Mst where Ledg_Code = '${tvData.formData.TvIcmMst.SELLER_NAME}'`);
        if (LedgerState[0][0].State_Code == 0) {
            await sequelize.query(`UPDATE Ledg_Mst set State_Code = '${tvData.formData.TvIcmMst.PUR_CUST_STATE}' WHERE Ledg_Code = '${tvData.formData.TvIcmMst.SELLER_NAME}'`);
        }
        // const { error: error3, value: DmsData } = DmsRowDataSchema.validate(DmsPur, {
        //     abortEarly: false,
        //     stripUnknown: true
        // });
        // console.log(error3, 'error3')
        // if (error3) {
        //     const errorMessage = error2.details.map(err => err.message).join(', ');
        //     return res.status(400).send({ success: false, message: errorMessage });
        // } else {
        //     await DmsRowData.create({ ...DmsData }, { transaction: t });
        // }
        // await sequelize.query(`INSERT INTO DMS_ROW_DATA (Tran_Id, Tran_Type, Bill_No, Bill_Date, Chassis, Engine, Ledger_Name, State_Code, Item_Code, HSN, Basic_Price, Taxable, CGST_Perc, SGST_Perc, IGST_Perc, CGST, SGST, IGST, Rnd_Off, Export_Type, Inv_Amt, Rnd_Ledg, CGST_ACNT, SGST_ACNT, IGST_ACNT, Loc_Code, LOCATION, Sup_Qty, Sale_Ledg, Narration, Server_id, Item_Type, Assessable_Rate, LEDG_ACNT, Seq_No, Item_Seq, Modl_Code, USR_CODE, ENTR_DATE, ENTR_TIME, Ref_Dt, ENTRY_BATCH) 
        //     VALUES (${Tran_Id}, '${tvIcmMst.PUR_BOOK}', '${PurDmsInv}', '${tvIcmMst.PUR_DATE}', '${tvIcmMst.CHAS_NO}', '${tvIcmMst.ENGINE_NO}', '${LedgCode[0][0].Ledg_Name}', ' ${StateName[0][0].Misc_Name}', '${ModlMst[0][0].Modl_Code}', '${ModlMst[0][0].HSN}', '${tvIcmMst.PURCHASE_COST}', '${tvIcmMst.PURCHASE_COST}', 0, 0, 0, 0, 0, 0, '${RndOff}', 0, '${tvIcmMst.PURCHASE_COST}', 23, '${Purgst[0][0].CGST_INPUT}', '${Purgst[0][0].SGST_INPUT}', '${Purgst[0][0].IGST_INPUT}', '${tvIcmMst.LOC_CODE}', '${tvIcmMst.LOC_CODE}', 1, '${ModlMst[0][0].Purc_Ledg}', '${tvIcmMst.REMARKS}', 1, 5, 0, '${tvIcmMst.SELLER_NAME}', '${PurSeq}', 1, 1742, '${FindUserCode[0][0].User_Code}', '${ENTR_DATE}', '${ENTR_TIME}', '${tvIcmMst.PUR_DATE}', 'CLOUD-${Tran_Id}')`, { transaction: t })

        // const { error: error5, value: ChasTran1 } = chasTranSchema.validate(ChasTranDataPur, {
        //     abortEarly: false,
        //     stripUnknown: true
        // });
        // console.log(error5, 'error5')
        // if (error5) {
        //     const errorMessage = error2.details.map(err => err.message).join(', ');
        //     return res.status(400).send({ success: false, message: errorMessage });
        // } else {
        //     await ChasTran.create({ ...ChasTran1 }, { transaction: t });
        // }
        // await sequelize.query(`INSERT INTO CHAS_TRAN (Tran_Id, CHAS_ID, TRAN_TYPE, Tran_Date, Tran_Amt, Asset_Ledg, Income_Ledg, Loc_Code, Export_Type, Item_Type, Item_Seq) 
        //     VALUES (${Tran_Id} ,${Chas_Id}, 1, '${tvIcmMst.PUR_DATE}', '${tvIcmMst.PURCHASE_COST}', '${ModlMst[0][0].Asset_Ledg}', '${ModlMst[0][0].Income_Ledg}', '${tvIcmMst.LOC_CODE}', 0, 3, 1)
        //     `, { transaction: t })
        // const { error: error2, value: ChasMst1 } = chasMstSchema.validate(ChasMstData, {
        //     abortEarly: false,
        //     stripUnknown: true
        // });
        // console.log(error2, 'error2')
        // if (error2) {
        //     const errorMessage = error2.details.map(err => err.message).join(', ');
        //     return res.status(400).send({ success: false, message: errorMessage });
        // } else {
        //     await ChasMst.create({ ...ChasMst1 }, { transaction: t });
        // }
        // await sequelize.query(`INSERT INTO CHAS_MST (Chas_Id, Chas_No, Eng_No, Reg_No, Modl_Code, Purc_Id, PInv_No, PInv_Date, Purc_Amt, Chs_Dtl1, Chs_Dtl2, Chs_Dtl3, Chs_Dtl4, Loc_Code, Export_Type) 
        //     VALUES (${Chas_Id}, '${BodyData.formData.TvIcmMst.CHAS_NO}', '${BodyData.formData.TvIcmMst.ENGINE_NO}', '${BodyData.formData.TvIcmMst.VEHREGNO}', 1742, ${Tran_Id}, '${PurDmsInv}', '${tvIcmMst.PUR_DATE}', ${tvIcmMst.PURCHASE_COST}, '${EvalName[0][0].EMPFIRSTNAME}', '${BodyData.formData.TvIcmMst.MODEL_VARIANT}', '${BodyData.formData.TvIcmMst.MODEL_VAR}', '${BodyData.formData.TvIcmMst.REG_YEAR}', ${BodyData.formData.TvIcmMst.LOC_CODE}, 1 )
        // `, { transaction: t });
        // await sequelize.query(`INSERT INTO VAS_TEMP 
        //     (TRAN_ID, EXPORT_TYPE) 
        //     VALUES 
        //     (${Tran_Id}, 1)
        //     `, { transaction: t });
        await t.commit();
        res.status(200).send({ success: true, message: "Purchase Data Saved....!" });

    } catch (error) {
        console.log(error)
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
exports.PostPurchase = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData, 'BodyData')
    const tvIcmMst = BodyData.formData.TvIcmMst;
    const tvIcmDtl = BodyData.formData.TvIcmDtl;
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
    const TvIcmDtl = _TvIcmDtl(sequelize, DataTypes);

    try {
        const [
            CheckChassis,
            CheckEngine,
            CheckVehRegNo,
        ] = await Promise.all([
            sequelize.query(`select * FROM Chas_Mst WHERE Chas_No = '${tvIcmMst.CHAS_NO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
            sequelize.query(`select * FROM Chas_Mst WHERE Eng_No = '${tvIcmMst.ENGINE_NO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
            sequelize.query(`select * FROM Chas_Mst WHERE Reg_No = '${tvIcmMst.VEHREGNO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
        ]);
        if (CheckChassis[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Chassis No. Found" });
        }
        if (CheckEngine[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Engine No. Found" });
        }
        if (CheckVehRegNo[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Registration No. Found" });
        }
        const [
            MaxChasId,
            MaxChasTranId,
            ModlMst,
            Purgst,
            FindUserCode,
            MaxTranId,
            PurInvNo,
            MaxPurSeq,
            LedgCode,
            StateName,
            EvalName,
        ] = await Promise.all([
            sequelize.query(`select isnull(MAX(Chas_Id) + 1, 1) AS SeqNo FROM CHAS_MST`),
            sequelize.query(`select isnull(MAX(Tran_Id) + 1, 1) AS SeqNo FROM CHAS_TRAN`),
            sequelize.query(`select HSN,Asset_Ledg, Income_Ledg, Modl_Code, Modl_Name,Modl_Abbr,Modl_Grp,Purc_Ledg,Sale_Ledg from modl_Mst WHERE Item_Code = 1742`),
            sequelize.query(`select * from GSTRATE WHERE Head_Type = 5 AND RATE = 0.00`),
            sequelize.query(`select User_Code FROM user_tbl where User_Name  = '${BodyData.formData.Created_by}' AND Export_Type = 1 AND Module_Code = 10`),
            sequelize.query(`SELECT isnull(max(Tran_Id)+1,1) AS TRAN_ID from DMS_ROW_DATA`),
            sequelize.query(`SELECT CONCAT((SELECT TOP 1 Book_Prefix FROM book_mst WHERE book_code =
                (SELECT misc_dtl1 FROM misc_mst WHERE misc_code = '${BodyData.formData.TvIcmMst.PUR_BOOK ? BodyData.formData.TvIcmMst.PUR_BOOK : ''}' and misc_type = 56)),
                isnull(MAX(seq_no) + 1, 1)) AS bill_no FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formData.TvIcmMst.PUR_BOOK ? BodyData.formData.TvIcmMst.PUR_BOOK : ''}' and Export_type < 3;`),
            sequelize.query(`select isnull(MAX(seq_no) + 1, 1) AS SeqNo FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formData.TvIcmMst.PUR_BOOK ? BodyData.formData.TvIcmMst.PUR_BOOK : ''}' and Export_type < 3;`),
            sequelize.query(`Select Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = '${tvIcmMst.SELLER_NAME}'`),
            sequelize.query(`SELECT TOP 1 Misc_Name From Misc_mst WHERE Misc_Code = ${tvIcmMst.PUR_CUST_STATE} AND Misc_type = 3`),
            sequelize.query(`SELECT TOP 1 EMPFIRSTNAME FROM EMPLOYEEMASTER where  EMPCODE = '${tvIcmMst.PUR_EVAL_NAME}'`),
        ]);
        let Chas_Id = MaxChasId[0][0]?.SeqNo;
        let ChasTran_Id = MaxChasTranId[0][0]?.SeqNo;
        let Tran_Id = MaxTranId[0][0]?.TRAN_ID;
        let PurSeq = MaxPurSeq[0][0]?.SeqNo;
        let PurDmsInv = PurInvNo[0][0]?.bill_no;
        let RndOff = Math.round(tvIcmMst.PURCHASE_COST) - parseFloat(tvIcmMst.PURCHASE_COST);
        const currentDate = new Date();
        const ENTR_DATE = currentDate.toISOString().split('T')[0];
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const ENTR_TIME = `${hours}.${minutes}`;
        const Created_by = BodyData.formData.Created_by;

        const { error: error1, value: tvData } = TvDataSchemaPurchase.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true
        });
        console.log(error1, 'error1')
        if (error1) {
            const errorMessage = error1.details.map(err => err.message).join(', ');
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            await TvIcmMst.update({ TV_PUR_INV: PurDmsInv, Created_by: Created_by, DRD_ID: Tran_Id, VIEW_FLAG: 1, ...tvData.TvIcmMst },
                { where: { UTD: tvIcmMst.UTD } }
                , { transaction: t });
            await TvIcmDtl.update({ ...tvData.TvIcmDtl, Created_by: tvData.Created_by }, {
                where: { TRAN_ID: tvIcmMst.UTD }
            }, { transaction: t });
        }

        await sequelize.query(`INSERT INTO DMS_ROW_DATA (Tran_Id, Tran_Type, Bill_No, Bill_Date, Chassis, Engine, Ledger_Name, State_Code, Item_Code, HSN, Basic_Price, Taxable, CGST_Perc, SGST_Perc, IGST_Perc, CGST, SGST, IGST, Rnd_Off, Export_Type, Inv_Amt, Rnd_Ledg, CGST_ACNT, SGST_ACNT, IGST_ACNT, Loc_Code, LOCATION, Sup_Qty, Sale_Ledg, Narration, Server_id, Item_Type, Assessable_Rate, LEDG_ACNT, Seq_No, Item_Seq, Modl_Code, USR_CODE, ENTR_DATE, ENTR_TIME, Ref_Dt, ENTRY_BATCH) 
            VALUES (${Tran_Id}, '${tvIcmMst.PUR_BOOK}', '${PurDmsInv}', '${tvIcmMst.PUR_DATE}', '${tvIcmMst.CHAS_NO}', '${tvIcmMst.ENGINE_NO}', '${LedgCode[0][0].Ledg_Name}', ' ${StateName[0][0].Misc_Name}', '${ModlMst[0][0].Modl_Code}', '${ModlMst[0][0].HSN}', '${tvIcmMst.PURCHASE_COST}', '${tvIcmMst.PURCHASE_COST}', 0, 0, 0, 0, 0, 0, '${RndOff}', 0, '${tvIcmMst.PURCHASE_COST}', 23, '${Purgst[0][0].CGST_INPUT}', '${Purgst[0][0].SGST_INPUT}', '${Purgst[0][0].IGST_INPUT}', '${tvIcmMst.LOC_CODE}', '${tvIcmMst.LOC_CODE}', 1, '${ModlMst[0][0].Purc_Ledg}', '${tvIcmMst.REMARKS}', 1, 5, 0, '${tvIcmMst.SELLER_NAME}', '${PurSeq}', 1, 1742, '${FindUserCode[0][0].User_Code}', '${ENTR_DATE}', '${ENTR_TIME}', '${tvIcmMst.PUR_DATE}', 'CLOUD-${Tran_Id}')`, { transaction: t })


        await sequelize.query(`INSERT INTO CHAS_TRAN (Tran_Id, CHAS_ID, TRAN_TYPE, Tran_Date, Tran_Amt, Asset_Ledg, Income_Ledg, Loc_Code, Export_Type, Item_Type, Item_Seq) 
            VALUES (${Tran_Id} ,${Chas_Id}, 1, '${tvIcmMst.PUR_DATE}', '${tvIcmMst.PURCHASE_COST}', '${ModlMst[0][0].Asset_Ledg}', '${ModlMst[0][0].Income_Ledg}', '${tvIcmMst.LOC_CODE}', 0, 3, 1)
            `, { transaction: t })

        await sequelize.query(`INSERT INTO CHAS_MST (Chas_Id, Chas_No, Eng_No, Reg_No, Modl_Code, Purc_Id, PInv_No, PInv_Date, Purc_Amt, Chs_Dtl1, Chs_Dtl2, Chs_Dtl3, Chs_Dtl4, Loc_Code, Export_Type) 
            VALUES (${Chas_Id}, '${BodyData.formData.TvIcmMst.CHAS_NO}', '${BodyData.formData.TvIcmMst.ENGINE_NO}', '${BodyData.formData.TvIcmMst.VEHREGNO}', 1742, ${Tran_Id}, '${PurDmsInv}', '${tvIcmMst.PUR_DATE}', ${tvIcmMst.PURCHASE_COST}, '${EvalName[0][0].EMPFIRSTNAME}', '${BodyData.formData.TvIcmMst.MODEL_VARIANT}', '${BodyData.formData.TvIcmMst.MODEL_VAR}', '${BodyData.formData.TvIcmMst.REG_YEAR}', ${BodyData.formData.TvIcmMst.LOC_CODE}, 1 )
        `, { transaction: t });
        await sequelize.query(`INSERT INTO VAS_TEMP 
            (TRAN_ID, EXPORT_TYPE) 
            VALUES 
            (${Tran_Id}, 1)
            `, { transaction: t });
        await t.commit();
        res.status(200).send({ success: true, message: "Purchase Data Saved....!" });

    } catch (error) {
        console.log(error)
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
exports.insertDataSale = async function (req, res) {
    const BodyData = JSON.parse(req.body.formData);
    const tvIcmMst = BodyData.TvIcmMst;
    const tvIcmDtl = BodyData.TvIcmDtl;
    const LedgStateFlag = BodyData.LedgStateCheck;
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
    const TvIcmDtl = _TvIcmDtl(sequelize, DataTypes);
    const ChasMst = _ChasMst(sequelize, DataTypes);
    const ChasTran = _ChasTran(sequelize, DataTypes);
    const DmsRowData = _DmsRowData(sequelize, DataTypes);
    try {
        const [
            MaxChasTranId,
            ModlMst,
            Salegst,
            FindUserCode,
            MaxTranId,
            SaleInvNo,
            MaxSaleSeq,
            StateCode,
            ChasID,
            LedgCode,
            StateName
        ] = await Promise.all([
            sequelize.query(`select isnull(MAX(Tran_Id) + 1, 1) AS SeqNo FROM CHAS_TRAN`),
            sequelize.query(`select HSN,Asset_Ledg, Income_Ledg, Modl_Code, Modl_Name,Modl_Abbr,Modl_Grp,Purc_Ledg,Sale_Ledg from modl_Mst WHERE Item_Code = 1742`),
            sequelize.query(`select * from GSTRATE WHERE Head_Type = 5 AND RATE = ${tvIcmDtl.GST_PERCT ? tvIcmDtl.GST_PERCT : null} `),
            sequelize.query(`select User_Code FROM user_tbl where User_Name  = '${BodyData.Created_by}' AND Export_Type = 1 AND Module_Code = 10`),
            sequelize.query(`SELECT isnull(max(Tran_Id)+1,1) AS TRAN_ID from DMS_ROW_DATA`),
            sequelize.query(`SELECT CONCAT((SELECT TOP 1 Book_Prefix FROM book_mst WHERE book_code =
                (SELECT misc_dtl1 FROM misc_mst WHERE misc_code = '${BodyData.TvIcmMst.SALE_BOOK ? BodyData.TvIcmMst.SALE_BOOK : ''}' and misc_type = 56)),
                isnull(MAX(seq_no) + 1, 1)) AS bill_no FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.TvIcmMst.SALE_BOOK ? BodyData.TvIcmMst.SALE_BOOK : ''}' and Export_type < 3;`),
            sequelize.query(`select isnull(MAX(seq_no) + 1, 1) AS SeqNo FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.TvIcmMst.SALE_BOOK ? BodyData.TvIcmMst.SALE_BOOK : ''}' and Export_type < 3;`),
            sequelize.query(`select (SELECT Misc_Code from Misc_Mst where Misc_type = 3 and Misc_Name = State) AS LoginState from Godown_Mst where Godw_Code = ${tvIcmMst.LOC_CODE} AND Export_type  < 3`),
            sequelize.query(`select Chas_Id from CHAS_MST where Chas_No = '${BodyData.TvIcmMst.CHAS_NO}'`),
            sequelize.query(`Select Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = '${tvIcmMst.SALE_CUST_CODE}'`),
            sequelize.query(`SELECT TOP 1 Misc_Name From Misc_mst WHERE Misc_Code = ${tvIcmMst.SALE_CUST_STATE} AND Misc_type = 3`),

        ]);

        // let Chas_Id = MaxChasId[0][0]?.SeqNo;
        let ChasTran_Id = MaxChasTranId[0][0]?.SeqNo;
        let Tran_Id = MaxTranId[0][0]?.TRAN_ID;
        let SaleSeq = MaxSaleSeq[0][0]?.SeqNo;
        let SaleDmsInv = SaleInvNo[0][0]?.bill_no;
        let sgstPerct = 0;
        let cgstPerct = 0;
        let igstPerct = 0;
        let sgstVal = 0;
        let cgstVal = 0;
        let igstVal = 0;

        if (parseInt(StateCode[0][0].LoginState) === parseInt(tvIcmMst.SALE_CUST_STATE)) {
            sgstPerct = parseFloat(tvIcmDtl.GST_PERCT) / 2;
            cgstPerct = parseFloat(tvIcmDtl.GST_PERCT) / 2;
            sgstVal = parseFloat(tvIcmDtl.GST_AMT) / 2;
            cgstVal = parseFloat(tvIcmDtl.GST_AMT) / 2;
        } else {
            igstPerct = parseFloat(tvIcmDtl.GST_PERCT);
            igstVal = parseFloat(tvIcmDtl.GST_AMT);
        }
        const TtlGst = parseFloat(sgstVal) + parseFloat(cgstVal) + parseFloat(igstVal);
        let RndOff = Math.round(tvIcmDtl.TTL_CTC) - parseFloat(tvIcmDtl.TTL_CTC);
        const currentDate = new Date();
        const ENTR_DATE = currentDate.toISOString().split('T')[0];
        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');
        const ENTR_TIME = `${hours}.${minutes}`;

        const Created_by = BodyData.Created_by;
        const { error: error1, value: tvData } = TvDataSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true
        });
        console.log(error1, 'error1')
        if (error1) {
            const errorMessage = error1.details.map(err => err.message).join(', ');
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            await TvIcmMst.update({ ...tvData.TvIcmMst, VIEW_FLAG: 2, Created_by: tvData.Created_by }, {
                where: { UTD: tvData.TvIcmMst.UTD }
            }, { transaction: t });
            await TvIcmDtl.update({ ...tvData.TvIcmDtl, Created_by: tvData.Created_by }, {
                where: { TRAN_ID: tvData.TvIcmMst.UTD }
            }, { transaction: t });
            if (LedgStateFlag == 1) {
                await sequelize.query(`UPDATE Ledg_Mst Set State_Code = ${tvData.TvIcmMst.SALE_CUST_STATE} WHERE Ledg_Code = '${tvData.TvIcmMst.SALE_CUST_CODE}'`, { transaction: t })
            }
            if (req.files.length > 0) {
                const EMP_DOCS_data = await uploadImagesTravel(
                    req.files,
                    req.headers?.compcode?.split("-")[0],
                    Created_by,
                );
                const arr = [
                    "Rc",
                    "Insurance",
                    "Dl",
                    "ss"];

                const values = EMP_DOCS_data.forEach(async (doc) => {
                    const originalIndex = arr.indexOf(doc.fieldname); // Get the index in the array
                    const srnoIndex = originalIndex >= 0 ? originalIndex + 1 : 0; // If found, add 1; if not, return 0
                    if (srnoIndex > 0) {
                        const insertQuery = `
                      INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO,  path, File_Name, User_Name, Upload_Date, Export_type)
                      VALUES (
                        'TVICM', 
                        '${tvData.TvIcmMst.UTD}', 
                        ${srnoIndex}, 
                        '${doc.DOC_PATH}', 
                        '${doc.fieldname}', 
                        '${Created_by}', 
                        CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), 
                        '1'
                      )
                    `;
                        await sequelize.query(insertQuery);
                    } else {
                        console.error(`Fieldname ${doc.fieldname} not found in arr.`);
                    }
                });
            }
        }
        await t.commit();
        res.status(200).send({ success: true, message: "Data Saved....!" });

    } catch (error) {
        console.log(error)
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
exports.UpdatePur = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData)
    const DrdPur = BodyData.formData.TvIcmMst.DRD_ID;
    const tvIcmMst = BodyData.formData.TvIcmMst;
    const tvIcmDtl = BodyData.formData.TvIcmDtl;
    const sequelize = await dbname(req.headers.compcode);

    const t = await sequelize.transaction();
    const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
    const TvIcmDtl = _TvIcmDtl(sequelize, DataTypes);
    try {
        if (tvIcmMst.UTD) {
            // const InvNo = await sequelize.query(`select TV_PUR_INV, TV_SALE_INV, Created_At from TV_ICM_MST WHERE  UTD = '${tvIcmMst.UTD}'`)
            // const inputGstLockDate = new Date(BodyData.PurGstDate.INPUT_GST_Lock_Date);
            // const createdAt = new Date(InvNo[0][0].Created_At);
            // if (BodyData.PurGstDate.INPUT_GST_Lock_Date && inputGstLockDate >= createdAt) {
            //     return res.status(201).send({ success: true, message: "GST Filled Against this Entry. Updations Not Allowed" });
            // }
            // if (!BodyData.PurGstDate.INPUT_GST_Lock_Date) {
            //     return res.status(201).send({ success: true, message: "You Don't have Rights to Update this Entry" });
            // }
            // const ChasId = await sequelize.query(`select CHAS_ID from CHAS_MST WHERE  Chas_No = '${BodyData.formData.TvIcmMst.CHAS_NO}'`)
            // const StateName = await sequelize.query(`SELECT TOP 1 Misc_Name From Misc_mst WHERE Misc_Code = ${tvIcmMst.PUR_CUST_STATE} AND Misc_type = 3`)
            // const a = await sequelize.query(`select * from DMS_ROW_DATA WHERE Tran_Id = '${DrdPur}' AND Export_Type <> 33`)
            // const DrdData = a[0][0];
            // let RndOff = Math.round(tvIcmMst.PURCHASE_COST) - parseFloat(tvIcmMst.PURCHASE_COST);

            const { error, value: tvData } = TvDataSchemaPurchase.validate(BodyData, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error, 'error')
            if (error) {
                const errorMessage = error.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                await TvIcmMst.update({ ...tvData.formData.TvIcmMst, Created_by: tvData.formData.Created_by, Export_Type: 1 }, {
                    where: { UTD: tvIcmMst.UTD }
                }, { transaction: t });
                await TvIcmDtl.update({ ...tvData.formData.TvIcmDtl, Created_by: tvData.formData.Created_by }, {
                    where: { TRAN_ID: tvIcmMst.UTD }
                }, { transaction: t });
                // await sequelize.query(`UPDATE DMS_ROW_DATA set Export_type = 33 WHERE Tran_Id = ${DrdPur}`)
                // await sequelize.query(`
                //            INSERT INTO DMS_ROW_DATA (
                //     Tran_Id, Tran_Type, Bill_No, Bill_Date, CANCEL_No, CANCEL_Date, Sale_Type, Chassis, Engine, VIN,
                //     Ledger_Id, Ledger_Name, State_Code, GST, Item_Code, HSN, Basic_Price, Disc_1, Disc_2, Disc_3,
                //     Disc_4, Taxable, CGST_Perc, SGST_Perc, IGST_Perc, Cess_Perc, CGST, SGST, IGST, Cess_Amt,
                //     Rnd_Off, Export_Type, Inv_Amt, Rnd_Ledg, Disc_Perc, CGST_ACNT, SGST_ACNT, IGST_ACNT, CGST_Post,
                //     SGST_Post, IGST_Post, Loc_Code, LOCATION, Sup_Qty, Sale_Ledg, Narration, Server_id, Category,
                //     Item_Type, Assessable_Rate, Cess_Acnt, Cess_Post, Exp_Ledg4, Exp_Perc4, Exp_Amt4, Exp_Ledg5,
                //     Exp_Perc5, Exp_Amt5, Exp_Ledg6, Exp_Perc6, Exp_Amt6, IsRCM, UoM, IsCncl, IsReverse, DrCR_Id,
                //     LEDG_ACNT, Seq_No, Item_Seq, Modl_Code, DRD_BillRef, Hypo_Chrgs, Insu_Chrgs, Oth_Chrgs,
                //     Parking_Chrgs, RoadTax_Chrgs, SmartCard_Chrgs, ENTR_MODE, USR_CODE, ENTR_DATE, ENTR_TIME,
                //     Wrty_GST, ExtWrnty_Chrgs, TmpRegn_Chrgs, Ref_Dt, TCS_TDS, SECTION_ID, SECTION_LEDGER,
                //     SECTION_RATE, SECTION_AMT, PAN_NO, Cost_Center, UTD, Executive, MSIL_1, MSIL_2, MSIL_3,
                //     DLR_1, DLR_2, DLR_3, EW_From, EW_Upto, EW_Chas, EW_Eng, EW_MAKE, EW_VSL, PC_NAME, IRN,
                //     TCS, TCS_Perc, PAN, B2C_QR, ENTRY_BATCH, Exp_Ledg7, Exp_Ledg8, Exp_Amt7, Exp_Amt8,
                //     RECO_DATE, FIN_CTRL, MODL_GRP, TAX_RATE, RES_CITY, GSTR_FILLING, Exp_Perc7, Exp_Perc8,
                //     Ledg_Add, Cons_Add, GST_REM, DISP_ADD, TDS_RECO_DATE, TDS_RECO_REM
                // ) VALUES (
                //     ${DrdData.Tran_Id}, ${DrdData.Tran_Type ? `'${DrdData.Tran_Type}'` : null}, ${DrdData.Bill_No ? `'${DrdData.Bill_No}'` : null}, 
                //     ${DrdData.Bill_Date ? `'${DrdData.Bill_Date}'` : null}, ${DrdData.CANCEL_No ? `'${DrdData.CANCEL_No}'` : null}, 
                //     ${DrdData.CANCEL_Date ? `'${DrdData.CANCEL_Date}'` : null}, ${DrdData.Sale_Type ? `'${DrdData.Sale_Type}'` : null}, 
                //     ${DrdData.Chassis ? `'${DrdData.Chassis}'` : null}, ${DrdData.Engine ? `'${DrdData.Engine}'` : null}, 
                //     ${DrdData.VIN ? `'${DrdData.VIN}'` : null}, ${DrdData.Ledger_Id ? `'${DrdData.Ledger_Id}'` : null}, 
                //     ${DrdData.Ledger_Name ? `'${DrdData.Ledger_Name}'` : null}, '${StateName[0][0].Misc_Name}', 
                //     ${DrdData.GST ? `'${DrdData.GST}'` : null}, ${DrdData.Item_Code ? `'${DrdData.Item_Code}'` : null}, 
                //     ${DrdData.HSN ? `'${DrdData.HSN}'` : null}, ${tvIcmMst.PURCHASE_COST}, ${DrdData.Disc_1}, ${DrdData.Disc_2}, 
                //     ${DrdData.Disc_3}, ${DrdData.Disc_4}, ${tvIcmMst.PURCHASE_COST}, ${DrdData.CGST_Perc}, ${DrdData.SGST_Perc}, 
                //     ${DrdData.IGST_Perc}, ${DrdData.Cess_Perc}, ${DrdData.CGST}, ${DrdData.SGST}, ${DrdData.IGST}, 
                //     ${DrdData.Cess_Amt}, ${RndOff}, 0, ${tvIcmMst.PURCHASE_COST}, ${DrdData.Rnd_Ledg}, 
                //     ${DrdData.Disc_Perc}, ${DrdData.CGST_ACNT}, ${DrdData.SGST_ACNT}, ${DrdData.IGST_ACNT}, ${DrdData.CGST_Post}, 
                //     ${DrdData.SGST_Post}, ${DrdData.IGST_Post}, ${DrdData.Loc_Code}, ${DrdData.LOCATION ? `'${DrdData.LOCATION}'` : null}, 
                //     ${DrdData.Sup_Qty}, ${DrdData.Sale_Ledg}, ${tvIcmMst.REMARKS ? `'${tvIcmMst.REMARKS}'` : null}, ${DrdData.Server_id}, 
                //     ${DrdData.Category}, ${DrdData.Item_Type}, ${DrdData.Assessable_Rate}, ${DrdData.Cess_Acnt}, ${DrdData.Cess_Post}, 
                //     ${DrdData.Exp_Ledg4}, ${DrdData.Exp_Perc4}, ${DrdData.Exp_Amt4}, ${DrdData.Exp_Ledg5}, ${DrdData.Exp_Perc5}, 
                //     ${DrdData.Exp_Amt5}, ${DrdData.Exp_Ledg6}, ${DrdData.Exp_Perc6}, ${DrdData.Exp_Amt6}, ${DrdData.IsRCM}, 
                //     ${DrdData.UoM}, ${DrdData.IsCncl}, ${DrdData.IsReverse}, ${DrdData.DrCR_Id}, ${DrdData.LEDG_ACNT}, ${DrdData.Seq_No}, 
                //     ${DrdData.Item_Seq}, ${DrdData.Modl_Code}, ${DrdData.DRD_BillRef ? `'${DrdData.DRD_BillRef}'` : null}, ${DrdData.Hypo_Chrgs}, 
                //     ${DrdData.Insu_Chrgs}, ${DrdData.Oth_Chrgs}, ${DrdData.Parking_Chrgs}, ${DrdData.RoadTax_Chrgs}, ${DrdData.SmartCard_Chrgs}, 
                //     ${DrdData.ENTR_MODE}, ${DrdData.USR_CODE}, ${DrdData.ENTR_DATE ? `'${DrdData.ENTR_DATE}'` : null}, ${DrdData.ENTR_TIME}, 
                //     ${DrdData.Wrty_GST}, ${DrdData.ExtWrnty_Chrgs}, ${DrdData.TmpRegn_Chrgs}, ${DrdData.Ref_Dt ? `'${DrdData.Ref_Dt}'` : null}, 
                //     ${DrdData.TCS_TDS}, ${DrdData.SECTION_ID}, ${DrdData.SECTION_LEDGER}, ${DrdData.SECTION_RATE}, ${DrdData.SECTION_AMT}, 
                //     ${DrdData.PAN_NO ? `'${DrdData.PAN_NO}'` : null}, ${DrdData.Cost_Center}, ${DrdData.UTD}, ${DrdData.Executive ? `'${DrdData.Executive}'` : null}, 
                //     ${DrdData.MSIL_1}, ${DrdData.MSIL_2}, ${DrdData.MSIL_3}, ${DrdData.DLR_1}, ${DrdData.DLR_2}, ${DrdData.DLR_3}, 
                //     ${DrdData.EW_From ? `'${DrdData.EW_From}'` : null}, ${DrdData.EW_Upto ? `'${DrdData.EW_Upto}'` : null}, 
                //     ${DrdData.EW_Chas ? `'${DrdData.EW_Chas}'` : null}, ${DrdData.EW_Eng ? `'${DrdData.EW_Eng}'` : null}, 
                //     ${DrdData.EW_MAKE ? `'${DrdData.EW_MAKE}'` : null}, ${DrdData.EW_VSL ? `'${DrdData.EW_VSL}'` : null}, 
                //     ${DrdData.PC_NAME ? `'${DrdData.PC_NAME}'` : null}, ${DrdData.IRN ? `'${DrdData.IRN}'` : null}, 
                //     ${DrdData.TCS}, ${DrdData.TCS_Perc}, ${DrdData.PAN ? `'${DrdData.PAN}'` : null}, ${DrdData.B2C_QR ? `'${DrdData.B2C_QR}'` : null}, 
                //     ${DrdData.ENTRY_BATCH ? `'${DrdData.ENTRY_BATCH}'` : null}, ${DrdData.Exp_Ledg7}, ${DrdData.Exp_Ledg8}, 
                //     ${DrdData.Exp_Amt7}, ${DrdData.Exp_Amt8}, ${DrdData.RECO_DATE ? `'${DrdData.RECO_DATE}'` : null}, ${DrdData.FIN_CTRL}, 
                //     ${DrdData.MODL_GRP}, ${DrdData.TAX_RATE}, ${DrdData.RES_CITY}, ${DrdData.GSTR_FILLING}, ${DrdData.Exp_Perc7}, 
                //     ${DrdData.Exp_Perc8}, ${DrdData.Ledg_Add ? `'${DrdData.Ledg_Add}'` : null}, ${DrdData.Cons_Add ? `'${DrdData.Cons_Add}'` : null}, 
                //     ${DrdData.GST_REM ? `'${DrdData.GST_REM}'` : null}, ${DrdData.DISP_ADD ? `'${DrdData.DISP_ADD}'` : null}, 
                //     ${DrdData.TDS_RECO_DATE ? `'${DrdData.TDS_RECO_DATE}'` : null}, ${DrdData.TDS_RECO_REM ? `'${DrdData.TDS_RECO_REM}'` : null})`);

                // await sequelize.query(`UPDATE CHAS_TRAN SET Tran_Amt = ${tvIcmMst.PURCHASE_COST} WHERE CHAS_ID = '${ChasId[0][0].CHAS_ID}' AND TRAN_TYPE = 1`, { transaction: t });

                // await sequelize.query(`UPDATE CHAS_MST SET Purc_Amt = ${tvIcmMst.PURCHASE_COST} WHERE Chas_Id = '${ChasId[0][0].CHAS_ID}'`, { transaction: t });
                // await sequelize.query(`INSERT INTO VAS_TEMP 
                //     (TRAN_ID, EXPORT_TYPE) 
                //     VALUES 
                //     (${DrdData.Tran_Id}, 1)
                //     `, { transaction: t });
            }
        } else {
            const { error, value: tvData } = TvDataSchema.validate(BodyData.formData, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error, 'error')
            if (error) {
                const errorMessage = error.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                const TvIcmMst1 = await TvIcmMst.create({ ...tvData.TvIcmMst, Export_Type: 1, Created_by: tvData.Created_by, VIEW_FLAG: 1 }, { transaction: t });
                await TvIcmDtl.create({ TRAN_ID: TvIcmMst1.UTD, ...tvData.TvIcmDtl, Created_by: tvData.Created_by }, { transaction: t });
            }
        }
        await t.commit();
        res.status(200).send({ success: true, message: "Data Saved....!" });
    } catch (error) {
        console.log(error)
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
exports.UpdateSale = async function (req, res) {
    console.log(req.body, 'req.body')
    const BodyData = JSON.parse(req.body.formData);
    // const DrdSale = BodyData.formData.TvIcmMst.DRD_ID_SALE;
    const tvIcmMst = BodyData.TvIcmMst;
    const tvIcmDtl = BodyData.TvIcmDtl;
    const sequelize = await dbname(req.headers.compcode);

    const t = await sequelize.transaction();
    const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
    const TvIcmDtl = _TvIcmDtl(sequelize, DataTypes);
    // const ChasMst = _ChasMst(sequelize, DataTypes);
    // const ChasTran = _ChasTran(sequelize, DataTypes);
    // const DmsRowData = _DmsRowData(sequelize, DataTypes);
    try {
        const ChasId = await sequelize.query(`select CHAS_ID from CHAS_MST WHERE  Chas_No = '${BodyData.TvIcmMst.CHAS_NO}'`)
        const StateCode = await sequelize.query(`select (SELECT Misc_Code from Misc_Mst where Misc_type = 3 and Misc_Name = State) AS LoginState from Godown_Mst where Godw_Code = ${tvIcmMst.LOC_CODE} AND Export_type  < 3`)
        const Salegst = await sequelize.query(`select * from GSTRATE WHERE Head_Type = 5 AND RATE = ${tvIcmDtl.GST_PERCT ? tvIcmDtl.GST_PERCT : null} `)
        const InvNo = await sequelize.query(`select TV_PUR_INV, TV_SALE_INV from TV_ICM_MST WHERE  UTD = '${tvIcmMst.UTD}'`)
        // const a = await sequelize.query(`select * from DMS_ROW_DATA WHERE Tran_Id = '${DrdSale}' AND Export_Type <> 33`)
        // const DrdData = a[0][0];
        let RndOff = Math.round(tvIcmDtl.TTL_CTC) - parseFloat(tvIcmDtl.TTL_CTC);
        let sgstPerct = 0;
        let cgstPerct = 0;
        let igstPerct = 0;
        let sgstVal = 0;
        let cgstVal = 0;
        let igstVal = 0;
        if (parseInt(StateCode[0][0].LoginState) === parseInt(tvIcmMst.SALE_CUST_STATE)) {
            sgstPerct = parseFloat(tvIcmDtl.GST_PERCT) / 2;
            cgstPerct = parseFloat(tvIcmDtl.GST_PERCT) / 2;
            sgstVal = parseFloat(tvIcmDtl.GST_AMT) / 2;
            cgstVal = parseFloat(tvIcmDtl.GST_AMT) / 2;
        } else {
            igstPerct = parseFloat(tvIcmDtl.GST_PERCT);
            igstVal = parseFloat(tvIcmDtl.GST_AMT);
        }
        const TtlGst = parseFloat(sgstVal) + parseFloat(cgstVal) + parseFloat(igstVal);
        console.log(parseFloat(TtlGst))
        console.log(tvIcmDtl.SALE_INV_AMT)
        // const DmsSale = {
        //     Basic_Price: (parseFloat(tvIcmDtl.SALE_INV_AMT) - parseFloat(TtlGst)).toFixed(2),
        //     Taxable: (parseFloat(tvIcmDtl.SALE_INV_AMT) - parseFloat(TtlGst)).toFixed(2),
        //     CGST_Perc: cgstPerct.toFixed(2),
        //     SGST_Perc: sgstPerct.toFixed(2),
        //     IGST_Perc: igstPerct.toFixed(2),
        //     CGST: cgstVal.toFixed(2),
        //     SGST: sgstVal.toFixed(2),
        //     IGST: igstVal.toFixed(2),
        //     CGST_ACNT: cgstVal !== 0 ? Salegst[0][0].CGST_OUTPUT : null,
        //     SGST_ACNT: sgstVal !== 0 ? Salegst[0][0].SGST_OUTPUT : null,
        //     IGST_ACNT: igstVal !== 0 ? Salegst[0][0].IGST_OUTPUT : null,
        //     Rnd_Off: RndOff.toFixed(2),
        //     Export_Type: 0,
        //     Inv_Amt: Math.round(tvIcmDtl.SALE_INV_AMT),
        //     Assessable_Rate: tvIcmDtl.TOTAL_MARGIN,
        //     Created_By: BodyData.formData.Created_by,
        // }
        // const ChasTranDataPur = {
        //     Tran_Amt: Math.round(tvIcmDtl.PURCHASE_COST),
        //     Created_By: BodyData.formData.Created_by,
        // }
        // const ChasMstData = {
        //     Purc_Amt: Math.round(tvIcmDtl.PURCHASE_COST),
        //     Created_By: BodyData.formData.Created_by,
        // }
        const { error, value: tvData } = TvDataSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true
        });
        console.log(error, 'error')
        if (error) {
            const errorMessage = error.details.map(err => err.message).join(', ');
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            await TvIcmMst.update({ ...tvData.TvIcmMst, TV_PUR_INV: InvNo[0][0].TV_PUR_INV, TV_SALE_INV: InvNo[0][0].TV_SALE_INV, Created_by: tvData.Created_by }, {
                where: { UTD: tvData.TvIcmMst.UTD }
            }, { transaction: t });
            await TvIcmDtl.update({ ...tvData.TvIcmDtl, Created_by: tvData.Created_by }, {
                where: { TRAN_ID: tvData.TvIcmMst.UTD }
            }, { transaction: t });
        }
        if (req.files.length > 0) {
            const EMP_DOCS_data = await uploadImagesTravel(
                req.files,
                req.headers?.compcode?.split("-")[0],
                tvData.Created_by,
            );

            const arr = ["Rc",
                "Insurance",
                "Dl",
                "ss"];
            const uploadPromises = EMP_DOCS_data.map(async (doc) => {
                const originalIndex = arr.indexOf(doc.fieldname);
                const srnoIndex = originalIndex >= 0 ? originalIndex + 1 : 0;

                if (srnoIndex > 0) {
                    await sequelize.query(`
                        UPDATE DOC_UPLOAD 
                        SET export_type = 33 
                        WHERE TRAN_ID = '${tvData.TvIcmMst.UTD}' 
                        AND SRNO = '${srnoIndex}' 
                        AND doc_type = 'TVICM'
                    `);

                    await sequelize.query(`
                        INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
                        VALUES (
                            'TVICM', 
                            '${tvData.TvIcmMst.UTD}', 
                            ${srnoIndex}, 
                            '${doc.DOC_PATH}', 
                            '${doc.fieldname}', 
                            '${tvData.Created_by}', 
                            CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), 
                            '1'
                        )
                    `);
                } else {
                    console.error(`Fieldname ${doc.fieldname} not found in arr.`);
                }
            });

            // Wait for all upload operations to finish
            await Promise.all(uploadPromises);
        }
        // console.log(DmsSale, 'DmsSale')
        // const { error: error1, value: DmsSaleData } = DmsRowDataSchema.validate(DmsSale, {
        //     abortEarly: false,
        //     stripUnknown: true
        // });
        // console.log(error1, 'error1')
        // if (error1) {
        //     const errorMessage = error.details.map(err => err.message).join(', ');
        //     return res.status(400).send({ success: false, message: errorMessage });
        // } else {
        //     await DmsRowData.update({ ...DmsSaleData, Created_by: tvData.Created_by }, {
        //         where: { Tran_Id: DrdSale }
        //     }, { transaction: t });
        // }
        //         await sequelize.query(`UPDATE DMS_ROW_DATA set Export_type = 33 WHERE Tran_Id = ${DrdSale}`)
        //         await sequelize.query(`
        //            INSERT INTO DMS_ROW_DATA (
        //     Tran_Id, Tran_Type, Bill_No, Bill_Date, CANCEL_No, CANCEL_Date, Sale_Type, Chassis, Engine, VIN,
        //     Ledger_Id, Ledger_Name, State_Code, GST, Item_Code, HSN, Basic_Price, Disc_1, Disc_2, Disc_3,
        //     Disc_4, Taxable, CGST_Perc, SGST_Perc, IGST_Perc, Cess_Perc, CGST, SGST, IGST, Cess_Amt,
        //     Rnd_Off, Export_Type, Inv_Amt, Rnd_Ledg, Disc_Perc, CGST_ACNT, SGST_ACNT, IGST_ACNT, CGST_Post,
        //     SGST_Post, IGST_Post, Loc_Code, LOCATION, Sup_Qty, Sale_Ledg, Narration, Server_id, Category,
        //     Item_Type, Assessable_Rate, Cess_Acnt, Cess_Post, Exp_Ledg4, Exp_Perc4, Exp_Amt4, Exp_Ledg5,
        //     Exp_Perc5, Exp_Amt5, Exp_Ledg6, Exp_Perc6, Exp_Amt6, IsRCM, UoM, IsCncl, IsReverse, DrCR_Id,
        //     LEDG_ACNT, Seq_No, Item_Seq, Modl_Code, DRD_BillRef, Hypo_Chrgs, Insu_Chrgs, Oth_Chrgs,
        //     Parking_Chrgs, RoadTax_Chrgs, SmartCard_Chrgs, ENTR_MODE, USR_CODE, ENTR_DATE, ENTR_TIME,
        //     Wrty_GST, ExtWrnty_Chrgs, TmpRegn_Chrgs, Ref_Dt, TCS_TDS, SECTION_ID, SECTION_LEDGER,
        //     SECTION_RATE, SECTION_AMT, PAN_NO, Cost_Center, UTD, Executive, MSIL_1, MSIL_2, MSIL_3,
        //     DLR_1, DLR_2, DLR_3, EW_From, EW_Upto, EW_Chas, EW_Eng, EW_MAKE, EW_VSL, PC_NAME, IRN,
        //     TCS, TCS_Perc, PAN, B2C_QR, ENTRY_BATCH, Exp_Ledg7, Exp_Ledg8, Exp_Amt7, Exp_Amt8,
        //     RECO_DATE, FIN_CTRL, MODL_GRP, TAX_RATE, RES_CITY, GSTR_FILLING, Exp_Perc7, Exp_Perc8,
        //     Ledg_Add, Cons_Add, GST_REM, DISP_ADD, TDS_RECO_DATE, TDS_RECO_REM
        // ) VALUES (
        //     ${DrdData.Tran_Id}, ${DrdData.Tran_Type ? `'${DrdData.Tran_Type}'` : null}, ${DrdData.Bill_No ? `'${DrdData.Bill_No}'` : null}, 
        //     ${DrdData.Bill_Date ? `'${DrdData.Bill_Date}'` : null}, ${DrdData.CANCEL_No ? `'${DrdData.CANCEL_No}'` : null}, 
        //     ${DrdData.CANCEL_Date ? `'${DrdData.CANCEL_Date}'` : null}, ${DrdData.Sale_Type ? `'${DrdData.Sale_Type}'` : null}, 
        //     ${DrdData.Chassis ? `'${DrdData.Chassis}'` : null}, ${DrdData.Engine ? `'${DrdData.Engine}'` : null}, 
        //     ${DrdData.VIN ? `'${DrdData.VIN}'` : null}, ${DrdData.Ledger_Id ? `'${DrdData.Ledger_Id}'` : null}, 
        //     ${DrdData.Ledger_Name ? `'${DrdData.Ledger_Name}'` : null}, ${DrdData.State_Code ? `'${DrdData.State_Code}'` : null}, 
        //     ${DrdData.GST ? `'${DrdData.GST}'` : null}, ${DrdData.Item_Code ? `'${DrdData.Item_Code}'` : null}, 
        //     ${DrdData.HSN ? `'${DrdData.HSN}'` : null}, ${(parseFloat(tvIcmDtl.SALE_INV_AMT) - parseFloat(TtlGst)).toFixed(2)}, ${DrdData.Disc_1}, ${DrdData.Disc_2}, 
        //     ${DrdData.Disc_3}, ${DrdData.Disc_4}, ${(parseFloat(tvIcmDtl.SALE_INV_AMT) - parseFloat(TtlGst)).toFixed(2)}, ${cgstPerct.toFixed(2)}, ${sgstPerct.toFixed(2)}, 
        //     ${igstPerct.toFixed(2)}, ${DrdData.Cess_Perc}, ${cgstVal.toFixed(2)}, ${sgstVal.toFixed(2)}, ${igstVal.toFixed(2)}, 
        //     ${DrdData.Cess_Amt}, ${RndOff.toFixed(2)}, ${DrdData.Export_Type}, ${Math.round(tvIcmDtl.SALE_INV_AMT)}, ${DrdData.Rnd_Ledg}, 
        //     ${DrdData.Disc_Perc}, ${cgstVal !== 0 ? Salegst[0][0].CGST_OUTPUT : null}, ${sgstVal !== 0 ? Salegst[0][0].SGST_OUTPUT : null}, ${igstVal !== 0 ? Salegst[0][0].IGST_OUTPUT : null}, ${DrdData.CGST_Post}, 
        //     ${DrdData.SGST_Post}, ${DrdData.IGST_Post}, ${DrdData.Loc_Code}, ${DrdData.LOCATION ? `'${DrdData.LOCATION}'` : null}, 
        //     ${DrdData.Sup_Qty}, ${DrdData.Sale_Ledg}, ${DrdData.Narration ? `'${DrdData.Narration}'` : null}, ${DrdData.Server_id}, 
        //     ${DrdData.Category}, ${DrdData.Item_Type}, ${tvIcmDtl.TOTAL_MARGIN}, ${DrdData.Cess_Acnt}, ${DrdData.Cess_Post}, 
        //     ${DrdData.Exp_Ledg4}, ${DrdData.Exp_Perc4}, ${DrdData.Exp_Amt4}, ${DrdData.Exp_Ledg5}, ${DrdData.Exp_Perc5}, 
        //     ${DrdData.Exp_Amt5}, ${DrdData.Exp_Ledg6}, ${DrdData.Exp_Perc6}, ${DrdData.Exp_Amt6}, ${DrdData.IsRCM}, 
        //     ${DrdData.UoM}, ${DrdData.IsCncl}, ${DrdData.IsReverse}, ${DrdData.DrCR_Id}, ${DrdData.LEDG_ACNT}, ${DrdData.Seq_No}, 
        //     ${DrdData.Item_Seq}, ${DrdData.Modl_Code}, ${DrdData.DRD_BillRef ? `'${DrdData.DRD_BillRef}'` : null}, ${DrdData.Hypo_Chrgs}, 
        //     ${DrdData.Insu_Chrgs}, ${DrdData.Oth_Chrgs}, ${DrdData.Parking_Chrgs}, ${DrdData.RoadTax_Chrgs}, ${DrdData.SmartCard_Chrgs}, 
        //     ${DrdData.ENTR_MODE}, ${DrdData.USR_CODE}, ${DrdData.ENTR_DATE ? `'${DrdData.ENTR_DATE}'` : null}, ${DrdData.ENTR_TIME}, 
        //     ${DrdData.Wrty_GST}, ${DrdData.ExtWrnty_Chrgs}, ${DrdData.TmpRegn_Chrgs}, ${DrdData.Ref_Dt ? `'${DrdData.Ref_Dt}'` : null}, 
        //     ${DrdData.TCS_TDS}, ${DrdData.SECTION_ID}, ${DrdData.SECTION_LEDGER}, ${DrdData.SECTION_RATE}, ${DrdData.SECTION_AMT}, 
        //     ${DrdData.PAN_NO ? `'${DrdData.PAN_NO}'` : null}, ${DrdData.Cost_Center}, ${DrdData.UTD}, ${DrdData.Executive ? `'${DrdData.Executive}'` : null}, 
        //     ${DrdData.MSIL_1}, ${DrdData.MSIL_2}, ${DrdData.MSIL_3}, ${DrdData.DLR_1}, ${DrdData.DLR_2}, ${DrdData.DLR_3}, 
        //     ${DrdData.EW_From ? `'${DrdData.EW_From}'` : null}, ${DrdData.EW_Upto ? `'${DrdData.EW_Upto}'` : null}, 
        //     ${DrdData.EW_Chas ? `'${DrdData.EW_Chas}'` : null}, ${DrdData.EW_Eng ? `'${DrdData.EW_Eng}'` : null}, 
        //     ${DrdData.EW_MAKE ? `'${DrdData.EW_MAKE}'` : null}, ${DrdData.EW_VSL ? `'${DrdData.EW_VSL}'` : null}, 
        //     ${DrdData.PC_NAME ? `'${DrdData.PC_NAME}'` : null}, ${DrdData.IRN ? `'${DrdData.IRN}'` : null}, 
        //     ${DrdData.TCS}, ${DrdData.TCS_Perc}, ${DrdData.PAN ? `'${DrdData.PAN}'` : null}, ${DrdData.B2C_QR ? `'${DrdData.B2C_QR}'` : null}, 
        //     ${DrdData.ENTRY_BATCH ? `'${DrdData.ENTRY_BATCH}'` : null}, ${DrdData.Exp_Ledg7}, ${DrdData.Exp_Ledg8}, 
        //     ${DrdData.Exp_Amt7}, ${DrdData.Exp_Amt8}, ${DrdData.RECO_DATE ? `'${DrdData.RECO_DATE}'` : null}, ${DrdData.FIN_CTRL}, 
        //     ${DrdData.MODL_GRP}, ${DrdData.TAX_RATE}, ${DrdData.RES_CITY}, ${DrdData.GSTR_FILLING}, ${DrdData.Exp_Perc7}, 
        //     ${DrdData.Exp_Perc8}, ${DrdData.Ledg_Add ? `'${DrdData.Ledg_Add}'` : null}, ${DrdData.Cons_Add ? `'${DrdData.Cons_Add}'` : null}, 
        //     ${DrdData.GST_REM ? `'${DrdData.GST_REM}'` : null}, ${DrdData.DISP_ADD ? `'${DrdData.DISP_ADD}'` : null}, 
        //     ${DrdData.TDS_RECO_DATE ? `'${DrdData.TDS_RECO_DATE}'` : null}, ${DrdData.TDS_RECO_REM ? `'${DrdData.TDS_RECO_REM}'` : null})`);

        // const { error: error2, value: ChasTranDataPur1 } = chasTranSchema.validate(ChasTranDataPur, {
        //     abortEarly: false,
        //     stripUnknown: true
        // });
        // console.log(error2, 'error2')
        // if (error2) {
        //     const errorMessage = error.details.map(err => err.message).join(', ');
        //     return res.status(400).send({ success: false, message: errorMessage });
        // } else {
        //     await ChasTran.update({ ...ChasTranDataPur1 },
        //         {
        //             where: {
        //                 CHAS_ID: ChasId[0][0].CHAS_ID,
        //                 TRAN_TYPE: 2
        //             }, transaction: t
        //         });
        // }
        // await sequelize.query(`UPDATE CHAS_TRAN SET Tran_Amt = ${Math.round(tvIcmDtl.PURCHASE_COST)} WHERE CHAS_ID = '${ChasId[0][0].CHAS_ID}' AND TRAN_TYPE = 1`, { transaction: t });

        // const { error: error3, value: ChasMstData1 } = chasMstSchema.validate(ChasMstData, {
        //     abortEarly: false,
        //     stripUnknown: true
        // });
        // console.log(error3, 'error3')
        // if (error3) {
        //     const errorMessage = error.details.map(err => err.message).join(', ');
        //     return res.status(400).send({ success: false, message: errorMessage });
        // } else {
        //     await ChasMst.update({ ...ChasMstData1 }, {
        //         where: { Chas_Id: ChasId[0][0].CHAS_ID }
        //     }, { transaction: t });
        // }
        // await sequelize.query(`UPDATE CHAS_MST SET Purc_Amt = ${Math.round(tvIcmDtl.PURCHASE_COST)} WHERE Chas_Id = '${ChasId[0][0].CHAS_ID}'`, { transaction: t });
        // const upi = await sequelize.query(`select UPI_ID,TRADE_NAME,GST_No from Godown_Mst where Godw_Code = '${tvIcmMst.LOC_CODE}' and Export_Type < 3`)
        // const upi_id = upi[0][0].UPI_ID;
        // const trade_name = upi[0][0].TRADE_NAME;
        // const GST_No = upi[0][0].GST_No;
        // const dataToEncode = `upi://pay?pa=${upi_id}&pn=${trade_name}&am=${parseFloat(tvIcmDtl.TTL_CTC)}&cu=INR&tn=InvNo:${DrdData.Bill_No},InvDt:${DrdData.Bill_Date},GSTIN:${GST_No},GSTAmt:${TtlGst}`;
        // const qrCodeBuffer = await qrcode.toBuffer(dataToEncode);
        // const qrCodeBase64 = qrCodeBuffer.toString('base64');
        // const sqlQuery = `UPDATE  B2C_QR Set B2CQR = '${qrCodeBase64}' WHERE Tran_Id = '${DrdData.Tran_Id}'`;
        // await sequelize.query(sqlQuery, { transaction: t });
        // console.log('QR code saved to database successfully!');
        await t.commit();
        res.status(200).send({ success: true, message: "Data Saved....!" });
    } catch (error) {
        console.log(error)
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
exports.PendingPurchaseData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const dateFrom = req.body.dateFrom;
        const dateto = req.body.dateto;
        const multi_loc = req.body.multi_loc;

        const data = await sequelize.query(`select * from GD_FDI_TRANS where CHASSIS_NUM in (SELECT gd.CHASSIS_NUM
FROM GD_FDI_TRANS gd
LEFT JOIN TV_ICM_MST tv ON gd.CHASSIS_NUM = tv.CHAS_NO
LEFT JOIN GD_FDI_TRANS gd2 ON gd.CHASSIS_NUM = gd2.CHASSIS_NUM AND gd2.TRANS_TYPE IN ('bc', 'ps')
JOIN Godown_Mst gm1 ON gd.LOC_CD = gm1.NEWCAR_RCPT
JOIN Godown_Mst gm2 ON gm1.DMS_TV_Code = gm2.NEWCAR_RCPT
WHERE gd.TRANS_TYPE = 'b'
  AND gd.AUTOVYN_FLAG <> -1
  AND tv.CHAS_NO IS NULL
  AND gd2.CHASSIS_NUM IS NULL
  AND gm2.Godw_Code in (${multi_loc})
  AND gd.TRANS_DATE BETWEEN '${dateFrom}' AND '${dateto}') AND TRANS_TYPE = 'b'`);
        res.status(200).send(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.UnpostPurchaseData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const dateFrom = req.body.dateFrom;
        const dateto = req.body.dateto;
        const multi_loc = req.body.multi_loc;

        const data = await sequelize.query(`select (SELECT Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = SELLER_NAME)  AS SellerName,
            FORMAT(PUR_DATE, 'dd-MM-yyyy') AS PurchaseDate,* from TV_ICM_MST WHERE LOC_CODE in (${multi_loc})
  AND PUR_DATE BETWEEN '${dateFrom}' AND '${dateto}' AND VIEW_FLAG = 0 AND Export_Type = 1`);
        res.status(200).send(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.PendingSaleDataManual = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body)
        const dateFrom = req.body.dateFrom;
        const dateto = req.body.dateto;
        const multi_loc = req.body.multi_loc;
        const data = await sequelize.query(
            `select  CASE WHEN 
 (SELECT PInv_Date FROM CHAS_Mst where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) < (SELECT TOP 1 FIn_SYear FROM Comp_Mst) THEN 0 
 else 
 TRAN_TYPE END AS TRAN_TYPE,
(SELECT TOP 1 UTD FROM TV_ICM_MST where TV_ICM_MST.DRD_ID = CHAS_TRAN.Tran_Id) AS UTD,
    (SELECT TOP 1 AUDIT_STATUS FROM TV_Audit WHERE ICM_ID = (SELECT TOP 1 UTD FROM TV_ICM_MST where TV_ICM_MST.DRD_ID = CHAS_TRAN.Tran_Id)) AS AUDIT_STATUS,
    (SELECT TOP 1 AUDIT_REMARK FROM TV_Audit WHERE ICM_ID = (SELECT TOP 1 UTD FROM TV_ICM_MST where TV_ICM_MST.DRD_ID = CHAS_TRAN.Tran_Id)) AS AUDIT_REMARK,
    DATEDIFF(day, (SELECT TOP 1 bill_Date FROM DMS_ROW_DATA where DMS_ROW_DATA.Tran_Id = CHAS_TRAN.Tran_Id), GETDATE()) AS AgeingInDays,
    (SELECT path from DOC_UPLOAD WHERE Doc_Type = 'TVAUDIT' AND TRAN_ID = (SELECT TOP 1 UTD FROM TV_ICM_MST where TV_ICM_MST.DRD_ID = CHAS_TRAN.Tran_Id) FOR JSON PATH , INCLUDE_NULL_VALUES) AS images,
    (SELECT TOP 1 Upload_Date from DOC_UPLOAD WHERE Doc_Type = 'TVAUDIT' AND TRAN_ID = (SELECT TOP 1 UTD FROM TV_ICM_MST where TV_ICM_MST.DRD_ID = CHAS_TRAN.Tran_Id)) AS ImgDateTime,       
(SELECT TOP 1 EXPECT_SALEVAL FROM TV_ICM_DTL where TRAN_ID = (SELECT UTD FROM TV_ICM_MST WHERE TV_ICM_MST.DRD_ID = CHAS_TRAN.Tran_Id)) AS EXPECT_SALEVAL,       
(SELECT  * FROM TV_OFF_PR where TV_ICM_ID = (SELECT UTD FROM TV_ICM_MST WHERE TV_ICM_MST.DRD_ID = CHAS_TRAN.Tran_Id) ORDER BY Created_at desc FOR JSON PATH , INCLUDE_NULL_VALUES) AS LAST_OFFERED_PRICE,
 CASE WHEN 
 (SELECT PInv_Date FROM CHAS_Mst where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) < (SELECT TOP 1 FIn_SYear FROM Comp_Mst) THEN Tran_Id
 ELSE
(SELECT TOP 1 Tran_Id FROM DMS_ROW_DATA where DMS_ROW_DATA.Tran_Id = CHAS_TRAN.Tran_Id) end AS DRD_ID,
CASE 
WHEN TRAN_TYPE = 0 THEN 'Opening'
ELSE
(SELECT TOP 1 bill_no FROM DMS_ROW_DATA where DMS_ROW_DATA.Tran_Id = CHAS_TRAN.Tran_Id) END AS TV_PUR_INV,
Tran_Amt AS PURCHASE_COST,
(SELECT TOP 1 Narration FROM DMS_ROW_DATA where DMS_ROW_DATA.Tran_Id = CHAS_TRAN.Tran_Id) AS REMARK,
CASE 
WHEN TRAN_TYPE = 0 THEN '9999'
ELSE
(SELECT TOP 1 Misc_Code FROM Misc_mst where Misc_type = 3 AND  Misc_Name = (SELECT TOP 1 State_Code FROM DMS_ROW_DATA where DMS_ROW_DATA.Tran_Id = CHAS_TRAN.Tran_Id)) END AS PUR_CUST_STATE, 
(SELECT FORMAT(PInv_Date, 'dd-MM-yyyy') FROM CHAS_Mst where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) AS PurchaseDate,
(SELECT TOP 1 Chas_No FROM CHAS_MST where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) AS CHAS_NO,  
(SELECT TOP 1 Eng_No FROM CHAS_MST where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) AS ENGINE_NO, 
CASE 
WHEN TRAN_TYPE = 0 THEN 'Opening'
ELSE
(SELECT TOP 1 Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = (SELECT TOP 1 Ledg_Acnt FROM DMS_ROW_DATA where DMS_ROW_DATA.Tran_Id = CHAS_TRAN.Tran_Id)) END AS SellerName,
(SELECT TOP 1 Chs_Dtl2 FROM CHAS_MST where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) AS MODEL_VARIANT,
(SELECT TOP 1 Chs_Dtl3 FROM CHAS_MST where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) AS MODEL_VAR,
(SELECT TOP 1 Chs_Dtl4 FROM CHAS_MST where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) AS REG_YEAR,
(SELECT TOP 1 Reg_No FROM CHAS_MST where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) AS VEHREGNO,  
(select TOP 1 EMPCODE from EMPLOYEEMASTER where EMPFIRSTNAME COLLATE DATABASE_DEFAULT = (SELECT TOP 1 Chs_Dtl1 FROM CHAS_MST where CHAS_MST.Chas_Id = CHAS_TRAN.CHAS_ID) COLLATE DATABASE_DEFAULT) AS PUR_EVAL_NAME 
FROM CHAS_TRAN WHERE Export_Type < 5 AND TRAN_TYPE not  IN (2,4) AND  CHAS_ID in (SELECT CHAS_ID
    FROM CHAS_TRAN
    WHERE ITEM_TYPE = 3
    AND Export_Type < 5 group by CHAS_ID
    having Sum(iif(TRAN_TYPE IN (0, 1,4,5),1,-1))>0)   AND Tran_Date BETWEEN '${dateFrom}' AND '${dateto}' AND Loc_Code in (${multi_loc})
	 
`);
        if (data[0] && Array.isArray(data[0])) {
            data[0] = data[0].map(row => {
                if (row.images) {
                    try {
                        row.images = JSON.parse(row.images);
                        if (Array.isArray(row.images)) {
                            row.images = row.images.map(item => Object.values(item).join(','));
                        } else {
                            row.images = [];
                        }
                    } catch (e) {
                        console.error("Failed to parse images", e);
                        row.images = [];
                    }
                }
                return row;
            });
        }

        res.status(200).send([data[0]]);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.PendingSaleData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const dateFrom = req.body.dateFrom;
        const dateto = req.body.dateto;
        const multi_loc = req.body.multi_loc;

        const data = await sequelize.query(
            `SELECT * FROM GD_FDI_TRANS 
            WHERE TRANS_TYPE = 'ps' AND AUTOVYN_FLAG NOT IN (-1) 
            AND GE1 IN (SELECT TRANS_REF_NUM FROM GD_FDI_TRANS 
            WHERE TRANS_TYPE = 'b') AND 
            GE1 NOT IN (SELECT VEHREGNO FROM tv_icm_mst) 
            AND GE1 NOT IN (SELECT ge1 FROM GD_FDI_TRANS 
            where TRANS_TYPE = 'pc') AND 
            LOC_CD in (SELECT NEWCAR_RCPT 
            from Godown_Mst Where 
            DMS_TV_Code in (SELECT DMS_TV_Code from Godown_Mst Where Godw_Code in (${multi_loc}))) AND TRANS_DATE BETWEEN '${dateFrom}' AND '${dateto}' ORDER BY TRANS_DATE`
        );
        // const data = await sequelize.query(
        //     `SELECT g1.* 
        //     FROM GD_FDI_TRANS g1
        //     JOIN Godown_Mst gm1 ON g1.LOC_CD = gm1.NEWCAR_RCPT
        //     JOIN Godown_Mst gm2 ON gm1.DMS_TV_Code = gm2.DMS_TV_Code
        //     WHERE g1.TRANS_TYPE = 'ps' 
        //       AND g1.AUTOVYN_FLAG NOT IN (-1) 
        //       AND g1.GE1 NOT IN (
        //         SELECT VEHREGNO 
        //         FROM tv_icm_mst
        //       )
        //       AND g1.GE1 NOT IN (
        //         SELECT ge1 
        //         FROM GD_FDI_TRANS 
        //         WHERE TRANS_TYPE = 'pc'
        //       )
        //       AND EXISTS (
        //         SELECT 1 
        //         FROM GD_FDI_TRANS g2 
        //         WHERE g2.TRANS_TYPE = 'b' 
        //           AND g2.TRANS_REF_NUM = g1.GE1
        //       )
        //       AND gm2.Godw_Code in (${multi_loc})
        //       AND g1.TRANS_DATE BETWEEN '${dateFrom}' AND '${dateto}'
        //     ORDER BY g1.TRANS_DATE;`
        // );
        res.status(200).send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.GetLedgerDataManual = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const SALE_CUST_CODE = req.body.SALE_CUST_CODE;
        const multi_loc = req.body.multi_loc;

        const a = await sequelize.query(
            `SELECT
            CASE WHEN 
            ap.Export_Type = 99  then 'Unposted-Voucher'
            WHEN  ap.Export_Type < 3  then 'Posted-Voucher'
            WHEN  ap.Export_Type = 4  then 'Reverse-Voucher'
            ELSE '' END AS RecieptStatus,
            (select max(book_prefix) from book_mst where book_mst.book_code=ap.book_code) + convert(varchar,acnt_no) AS rcp_no,
            ap.Acnt_Date, ap.Post_Amt, ap.Cost_Cntr, ap.Chq_No, ap.Chq_Date, ap.Bank_Date, ap.Ledg_Ac, lm.Ledg_Name, lm.Ledg_Code from
            acnt_post ap JOIN Ledg_Mst lm on ap.Ledg_Ac = lm.Ledg_Code
            WHERE 
               ap.ledg_Ac = '${SALE_CUST_CODE}'
            AND
               ap.acnt_type < 4 
            AND 
               ap.Amt_drcr = 2  
               AND 
               ap.Loc_Code in (${multi_loc}) AND ap.Export_type not in (5,33) `
        );
        const b = await sequelize.query(
            `SELECT * FROM Ledg_Mst WHERE Ledg_Code = '${SALE_CUST_CODE}' AND Loc_Code in (${multi_loc})`
        );
        let data = { a, b };
        res.status(200).send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.GetLedgerDataDMS = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const SALE_CUST_CODE = req.body.SALE_CUST_CODE;
        const multi_loc = req.body.multi_loc;
        console.log(typeof SALE_CUST_CODE, 'SALE_CUST_CODE')
        console.log(multi_loc, 'multi_loc')
        const a = await sequelize.query(
            `SELECT
            (select max(book_prefix) from book_mst where book_mst.book_code=ap.book_code) + convert(varchar,acnt_no) AS rcp_no,
            ap.Acnt_Date, ap.Post_Amt, ap.Cost_Cntr, ap.Chq_No, ap.Chq_Date, ap.Bank_Date, ap.Ledg_Ac, lm.Ledg_Name, lm.Ledg_Code from
            acnt_post ap JOIN Ledg_Mst lm on ap.Ledg_Ac = lm.Ledg_Code
            WHERE 
               ap.ledg_Ac = '${SALE_CUST_CODE}'
            AND
               ap.acnt_type < 4 
            AND 
               ap.Amt_drcr = 2  
               AND 
               ap.Loc_Code in (${multi_loc}) `
        );
        const b = await sequelize.query(`SELECT Ledg_Add6 AS CUST_ID,* FROM Ledg_Mst WHERE Ledg_Code = '${SALE_CUST_CODE}' AND Loc_Code in (${multi_loc})`);
        let data = { a, b };
        res.status(200).send(data);
    }
    catch (error) {
        console.log(error, 'errordfdfvbdfvbdfv');
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.findMasters = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const MiscMst = _MiscMst(sequelize, DataTypes);
        const multi_loc = req.body.multi_loc;
        const DMSMode = req.body.DMSMode;
        const SaleTab = req.body.SaleTab;
        const VEHREGNO = req.body.VEHREGNO;

        const SALE_CUST_CITY = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ['misc_name', 'label'],
            ],
            where: { misc_type: 1 },
        });

        const SALE_CUST_STATE = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ["misc_name", "label"],
            ],
            where: { misc_type: 3 },
        });

        const SALE_FINANCIER = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ["misc_name", "label"],
            ],
            where: { misc_type: 8 },
        });

        const SALE_FIN_TYPE = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ["misc_name", "label"],
            ],
            where: { misc_type: 18 },
        });
        const SALE_EXEC_DESG = await sequelize.query(`SELECT EMPLOYEEDESIGNATION AS value, EMPLOYEEDESIGNATION AS label 
      FROM EMPLOYEEMASTER 
      WHERE EMPLOYEEDESIGNATION IS NOT NULL AND  EMPLOYEEDESIGNATION <> ''
      GROUP BY EMPLOYEEDESIGNATION`);
        const SALE_CUST_CODE = await sequelize.query(`select  LTRIM(STR(Ledg_Code, 20, 0)) as value, Ledg_Name AS label from Ledg_Mst where group_code = 58 AND Loc_code in (${multi_loc}) AND Ledg_Name <> '' AND Ledg_Name is not null`);
        const PurcBook = await sequelize.query(`select (SELECT CAST(Misc_Code AS VARCHAR) from Misc_mst where Misc_type  = 56 and Misc_Dtl1  = Book_Code AND Export_Type < 3) as value, Book_Name as label from book_mst WHERE Inv_Book = 3 AND Book_Type = 7 AND Loc_Code in (${multi_loc},${DMSMode ? 0 : null}) AND Export_Type < 3`);
        const Evaluators = await sequelize.query(`select EMPCODE as value, (EMPCODE +' ' + EMPFIRSTNAME + ' ' + EMPLASTNAME) as label from EMPLOYEEMASTER WHERE EMPLOYEEDESIGNATION like '%evaluator%' OR EMPLOYEEDESIGNATION like '%EVALUATER%'`);
        const Dse = await sequelize.query(`select EMPCODE as value, (EMPCODE +' ' + EMPFIRSTNAME + ' ' + EMPLASTNAME) as label from EMPLOYEEMASTER WHERE EMPLOYEEDESIGNATION like '%TVDSE%' or EMPLOYEEDESIGNATION like '%TV SALES EXECUTIVE%'`);
        const SaleBook = await sequelize.query(`select (SELECT CAST(Misc_Code AS VARCHAR) from Misc_mst where Misc_type  = 56 and Misc_Dtl1  = Book_Code AND Export_Type < 3) as value, Book_Name as label from book_mst WHERE Inv_Book = 3 AND Book_Type = 8 AND Loc_Code in (${multi_loc},${DMSMode ? 0 : null}) AND Export_Type < 3`);
        const ExpLedger = await sequelize.query(`select LTRIM(STR(Ledg_Code, 20, 0)) as value, Ledg_Name AS label from Ledg_Mst where group_code in (21,58,59,2394,53) AND Loc_code in (${multi_loc}) AND Ledg_Name <> '' AND Ledg_Name is not null`);
        const CreatedDo = await sequelize.query(`select CONCAT(UTD ,'-',VEHREGNO) AS label, CAST(UTD AS VARCHAR)  AS value from TV_DO where LOC_CODE in (${multi_loc}) AND Export_Type = 1`);
        const MaxDoNo = await sequelize.query(`select (MAX(UTD) + 1) AS MaxDoNo from TV_DO`);
        const UsersList = await sequelize.query(`select CAST(User_Code AS VARCHAR) AS value , User_Name AS label FROM user_Tbl WHERE Module_Code = 10 AND Export_type < 3`);
        const Branches = await sequelize.query(`select CAST(Godw_Code AS VARCHAR) AS value , Godw_Name AS label FROM Godown_Mst WHERE  Export_type < 3`);
        const ApproverlistSale = await sequelize.query(`select * FROM  Expense_Approval_Matrix WHERE module = 'tv' AND Branch_Code in (${multi_loc})`);
        const ApproverlistPurchase = await sequelize.query(`select * FROM  Expense_Approval_Matrix WHERE module = 'tvp' AND Branch_Code in (${multi_loc})`);
        const Approvers = await sequelize.query(`SELECT COALESCE(MAX(Approver_Count), 0) AS Approver_Count
FROM (
    SELECT 
        (CASE 
            WHEN Approver_1A IS NOT NULL AND Approver_2A IS NOT NULL AND Approver_3A IS NOT NULL THEN 3
            WHEN (Approver_1A IS NOT NULL AND Approver_2A IS NOT NULL) OR
                 (Approver_1A IS NOT NULL AND Approver_3A IS NOT NULL) OR
                 (Approver_2A IS NOT NULL AND Approver_3A IS NOT NULL) THEN 2
            WHEN Approver_1A IS NOT NULL OR Approver_2A IS NOT NULL OR Approver_3A IS NOT NULL THEN 1
            ELSE 0
        END) AS Approver_Count
    FROM 
        Expense_Approval_Matrix
    WHERE 
        module = 'tv'
        AND Branch_Code in (${multi_loc})
) AS subquery;
`);
        const ApproverContact = await sequelize.query(`SELECT 
    (u1.user_name + ' - ' + u1.user_mob) AS Approver_1A_Mob,
    (u2.user_name + ' - ' + u2.user_mob) AS Approver_2A_Mob,
    (u3.user_name + ' - ' + u3.user_mob) AS Approver_3A_Mob
FROM 
    Expense_Approval_Matrix e
LEFT JOIN 
    USER_TBL u1 ON e.Approver_1A = u1.user_Code AND u1.Export_type = 1 AND u1.Module_Code = 10
LEFT JOIN 
    USER_TBL u2 ON e.Approver_2A = u2.user_Code AND u2.Export_type = 1 AND u2.Module_Code = 10
LEFT JOIN 
    USER_TBL u3 ON e.Approver_3A = u3.user_Code AND u3.Export_type = 1 AND u3.Module_Code = 10
WHERE 
    e.module = 'tv';`);
        let SaleInvoice = ""
        if (SaleTab) {
            SaleInvoice = await sequelize.query(`SELECT TRANS_ID FROM GD_FDI_TRANS 
            WHERE TRANS_TYPE = 'ps' AND AUTOVYN_FLAG NOT IN (-1) 
            AND GE1 IN (SELECT TRANS_REF_NUM FROM GD_FDI_TRANS 
            WHERE TRANS_TYPE = 'b') 
            AND GE1 NOT IN (SELECT ge1 FROM GD_FDI_TRANS 
            where TRANS_TYPE = 'pc') AND 
            GE1 = '${VEHREGNO}' AND
            LOC_CD in (SELECT NEWCAR_RCPT 
            from Godown_Mst Where 
            DMS_TV_Code in (SELECT DMS_TV_Code from Godown_Mst Where Godw_Code in (${multi_loc})))`)
        }
        console.log(SaleInvoice, 'SaleInvoice')
        const ApprCount = Approvers[0][0].Approver_Count;
        let data = {
            SALE_CUST_CITY,
            SALE_CUST_STATE,
            SALE_FINANCIER,
            SALE_FIN_TYPE,
            SALE_CUST_CODE,
            SALE_EXEC_DESG,
            PurcBook,
            SaleBook,
            ExpLedger,
            ApprCount,
            Branches,
            ApproverContact,
            Evaluators,
            Dse,
            CreatedDo,
            UsersList,
            ApproverlistSale,
            ApproverlistPurchase,
            DMS_SALE_INV: SaleInvoice[0] ? SaleInvoice[0][0]?.TRANS_ID : "",
            DoNo: MaxDoNo[0] ? MaxDoNo[0][0]?.MaxDoNo : 1,
        };
        await sequelize.close();
        res.send({ success: true, data: data });
    } catch (err) {
        res.status(500).send("Error Occured While Fetching Data");
        console.log(err);
    } finally {
        await sequelize.close();

    }
};
exports.TvView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    let flag = 1;
    try {
        let data = {};
        const TvIcmMst1 = _TvIcmMst(sequelize, DataTypes);
        const TvIcmDtl1 = _TvIcmDtl(sequelize, DataTypes);
        const UTD = req.body.UTD;
        const CHAS_NO = req.body.CHAS_NO;
        const ENGINE_NO = req.body.ENGINE_NO;
        if (UTD) {
            const TvIcmMst = await TvIcmMst1.findOne({ where: { UTD: UTD } });
            const TvIcmDtl = await TvIcmDtl1.findOne({ where: { TRAN_ID: UTD } });
            flag = 2;
            data = { TvIcmMst, TvIcmDtl, flag };
        } else if (CHAS_NO && ENGINE_NO) {
            const a = await sequelize.query(`select 
            CHASSIS_NUM AS CHAS_NO,
            ENGINE_NUM AS ENGINE_NO,
            CUST_NAME AS SELLER_NAME,
            EXECUTIVE AS PUR_EVAL_NAME,
            VARIANT_CD AS MODEL_VARIANT,
            TRANS_REF_NUM AS VEHREGNO,
            BASIC_PRICE AS PURCHASE_COST,
            TRANS_ID AS TV_PUR_INV,
            TRANS_SEGMENT,
            CONVERT(VARCHAR(10), TRANS_DATE, 23) AS PUR_DATE,
            LEFT(TRANS_REF_DATE, 4) AS REG_YEAR,
            GE6 AS VEH_TYPE
            from GD_FDI_TRANS 
            where 
            TRANS_TYPE in ('b') AND
            CHASSIS_NUM = '${CHAS_NO}'
            AND ENGINE_NUM = '${ENGINE_NO}'
            ORDER BY TRANS_TYPE`);
            console.log(a, 'kj')
            data = {
                TvIcmMst: {
                    TV_PUR_INV: a[0][0].TV_PUR_INV,
                    VEHREGNO: a[0][0].VEHREGNO,
                    CHAS_NO: a[0][0].CHAS_NO,
                    ENGINE_NO: a[0][0].ENGINE_NO,
                    SELLER_NAME: a[0][0].SELLER_NAME,
                    MODEL_VARIANT: a[0][0].MODEL_VARIANT,
                    REG_YEAR: a[0][0].REG_YEAR,
                    VEH_TYPE: a[0][0].VEH_TYPE,
                    PURCHASE_COST: a[0][0].PURCHASE_COST,
                    PUR_DATE: a[0][0].PUR_DATE,
                    PUR_EVAL_NAME: a[0][0].PUR_EVAL_NAME,
                },
                flag: flag
            };
            const b = await sequelize.query(`select 
            CHASSIS_NUM AS Chas_No,
            ENGINE_NUM AS ENGINE_NO,
            CUST_NAME AS SALE_CUST_CODE,
            EXECUTIVE AS Chs_Dtl1,
            VARIANT_CD AS Chs_Dtl2,
            TRANS_REF_NUM AS reg_no,
            BASIC_PRICE AS SALE_INV_AMT,
            TRANS_ID AS TV_SALE_INV,
            CONVERT(VARCHAR(10), TRANS_DATE, 23) AS SALE_DATE,
            TRANS_SEGMENT,
            UTD,
            AUTOVYN_FLAG,
            CUST_ID,
            TAXABLE_VALUE AS TOTAL_MARGIN
            from GD_FDI_TRANS 
            where 
            TRANS_TYPE in ('ps') AND
            CHASSIS_NUM = '${CHAS_NO}'
            AND ENGINE_NUM = '${ENGINE_NO}'
            ORDER BY TRANS_TYPE`);
            flag = 3;
            const TvIcmDtl = b[0][0];
            if (TvIcmDtl) {
                const c = await sequelize.query(`Select * from GD_FDI_TRANS_CHARGES 
                where UTD = '${b[0][0].UTD}' ORDER BY CHARGE_TYPE `)
                console.log(c)
                const chargtype = {};
                let totalGSTChargeRate = 0;

                if (c[0].length) {
                    c[0].forEach(item => {
                        chargtype[item.CHARGE_TYPE] = item.CHARGE_AMT;

                        if (item.CHARGE_TYPE === 'SGS' || item.CHARGE_TYPE === 'CGS' || item.CHARGE_TYPE === 'IGS') {
                            totalGSTChargeRate += item.CHARGE_RATE;
                        }
                    });
                }

                chargtype['TOTAL_GST_CHARGE_RATE'] = totalGSTChargeRate;
                console.log(chargtype);

                const ledger = await sequelize.query(`select CONCAT(RES_ADDRESS1, ',' , RES_ADDRESS2, ',' , RES_ADDRESS3 , ',' , RES_CITY , ',' , STATE) as addresssss ,* from GD_FDI_TRANS_CUSTOMER where CUST_ID = '${TvIcmDtl.CUST_ID}'`)
                const customer = ledger[0][0];
                const ledger_main = await sequelize.query(`select LTRIM(STR(Ledg_Code, 20, 0)) AS LedgCode, Ledg_Name, State_Code, Teh_Code from LEDG_MST where Ledg_Name like '%${TvIcmDtl.CUST_ID}%'`)
                const customer_main = ledger_main[0][0];
                data = {
                    TvIcmMst: {
                        TV_PUR_INV: a[0][0].TV_PUR_INV,
                        TV_SALE_INV: b[0][0].TV_SALE_INV,
                        CUST_ID: TvIcmDtl.CUST_ID,
                        VEHREGNO: a[0][0].VEHREGNO,
                        CHAS_NO: a[0][0].CHAS_NO,
                        ENGINE_NO: a[0][0].ENGINE_NO,
                        SELLER_NAME: a[0][0].SELLER_NAME,
                        MODEL_VARIANT: a[0][0].MODEL_VARIANT,
                        REG_YEAR: a[0][0].REG_YEAR,
                        VEH_TYPE: a[0][0].VEH_TYPE,
                        PURCHASE_COST: a[0][0].PURCHASE_COST,
                        PUR_DATE: a[0][0].PUR_DATE,
                        PUR_EVAL_NAME: a[0][0].PUR_EVAL_NAME,
                        SALE_CUST_TYPE: b[0][0].TRANS_SEGMENT,
                        SALE_DATE: b[0][0].SALE_DATE,
                        SALE_CUST_CODE: customer_main ? customer_main.LedgCode : null,
                        SALE_CUST_MOB: customer.MOBILE2,
                        SALE_CUST_ADD: customer.addresssss,
                        SALE_CUST_PINCD: customer.RES_PIN_CD,
                        SALE_CUST_PAN: customer.PAN_NO,
                        SALE_CUST_CITY: customer_main ? customer_main.Teh_Code : null,
                        SALE_CUST_STATE: customer_main ? customer_main.State_Code : null,
                        SALE_CUST_GST: customer.GST_NUM,
                    },
                    TvIcmDtl: {
                        SRNO: 1,
                        SALE_INV_AMT: b[0][0].SALE_INV_AMT,
                        PUR_WARR_EXP: chargtype.EXT,
                        PUR_MNGMT_EXP: 1000,
                        GST_AMT: chargtype.SGS + chargtype.CGS,
                        TOTAL_MARGIN: b[0][0].TOTAL_MARGIN,
                        TOTAL_VALUE: b[0][0].TOTAL_MARGIN + chargtype.SGS + chargtype.CGS,
                        SALE_RTO: chargtype.TRN,
                        SALE_INS: chargtype.INS,
                        SALE_OC: chargtype.OTR,
                        GST_PERCT: chargtype.TOTAL_GST_CHARGE_RATE,
                    },
                    flag: flag
                };
            }
        }
        console.log(data)
        res.send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.nonDelivered = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
        const b = await sequelize.query(`SELECT *,(SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code = SELLER_NAME) AS SellerName
            FROM TV_ICM_MST WHERE LOC_CODE in (${multi_loc}) AND (VIEW_FLAG = 2 OR VIEW_FLAG = 3) `);
        // const a = await TvIcmMst.findAll({
        //     where: {
        //         LOC_CODE: multi_loc,
        //         DELV_STAT: null,
        //         TV_SALE_INV: { [Sequelize.Op.not]: null },
        //     }
        // });
        res.send({ success: true, data: b[0] });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error Occurred While Fetching Data");
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.nonDeliveredDms = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
        const a = await TvIcmMst.findAll({
            where: {
                LOC_CODE: multi_loc,
                [Op.or]: [
                    { DELV_STAT: null },
                    { DELV_STAT: 0 }
                ]
            }
        });
        res.send({ success: true, data: a });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error Occurred While Fetching Data");
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.Delivered = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const TvIcmMst = await sequelize.query(`SELECT (SELECT TOP 1 Ledg_Name 
            FROM Ledg_Mst WHERE Ledg_Code = TIM.SALE_CUST_CODE) AS CUSTOMERNAME, 
            FORMAT(TIM.DELV_DATE, 'dd-MM-yyyy') AS DeliveryDate,
            TIM.*,TID.TTL_CTC FROM 
            TV_ICM_MST TIM JOIN TV_ICM_DTL TID ON TIM.UTD = TID.TRAN_ID WHERE 
            TIM.LOC_CODE = ${multi_loc} AND DELV_STAT = 1 and VIEW_FLAG = 4`)
        res.send(TvIcmMst[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error Occurred While Fetching Data");
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.findEmployee = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Employeemaster = _Employeemaster(sequelize, DataTypes);
        const EMPLOYEEDESIGNATION = req.body.EMPLOYEEDESIGNATION;
        const a = await Employeemaster.findAll({
            attributes: [
                ["EMPCODE", "value"],
                [
                    sequelize.literal("EMPCODE +' ' + EMPFIRSTNAME + ' ' + EMPLASTNAME "),
                    "label",
                ],
            ],
            where: { EMPLOYEEDESIGNATION: EMPLOYEEDESIGNATION },
        });
        // console.log(a)
        res.send({ success: true, data: a });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occurred While Fetching Data");
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.PrintData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log('oiu')
        const UTD = req.body.UTD;
        const multi_loc = req.body.multi_loc;
        // const Company = await sequelize.query(`select * from Comp_Mst`);
        const a = await sequelize.query(
            `select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,cm.Right_head2,
            gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No, gm.*
            from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
            where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
        let b
        let c
        let base64QrCode
        let PurChaseDms
        let SaleDms
        let PurAmtInWords
        let SaleAmtInWords
        if (UTD) {
            b = await sequelize.query(
                `SELECT 
            (SELECT TOP 1 EMPFIRSTNAME FROM EMPLOYEEMASTER WHERE EMPCODE = SALE_EXEC_NAME) EXECUTIVENAME,
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Type = 1 AND Misc_Code = SALE_CUST_CITY) AS CITY,
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Type = 3 AND Misc_Code = SALE_CUST_CITY) AS STATES,
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Type = 8 AND Misc_Code = SALE_FINANCIER) AS FINANCIER,
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Type = 18 AND Misc_Code = SALE_FIN_TYPE) AS FIN_TYPE,
            (SELECT TOP 1 Ledg_Name from Ledg_Mst WHERE Ledg_Code = SALE_CUST_CODE) AS Customer,
            (SELECT TOP 1 Seq_No from DMS_ROW_DATA WHERE tim.DRD_ID_SALE = Tran_Id) AS GPSeq,
            (SELECT TOP 1 B2CQR from B2C_QR WHERE tim.DRD_ID_SALE = Tran_Id) AS Qr,
            tim.*, tid.* from TV_ICM_MST tim JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
            WHERE tim.UTD = ${UTD} AND LOC_CODE = '${multi_loc}'`);

            if (b[0][0].Qr) {

                const buffer = Buffer.from(b[0][0].Qr);
                base64QrCode = buffer.toString('base64');
            }
            c = await sequelize.query(`SELECT
            (select max(book_prefix) from book_mst where book_mst.book_code=ap.book_code) + convert(varchar,acnt_no) AS rcp_no,
            CONVERT(VARCHAR, ap.Acnt_Date, 103) as daaatteeee,FORMAT(ap.Post_Amt, 'c', 'en-IN') AS recptamount, ap.Post_Amt, ap.Cost_Cntr, ap.Chq_No, ap.acnt_id, ap.Chq_Date,ap.Bill_Ref, gft.PAYMENT_MODE ,ap.Bank_Date, ap.Ledg_Ac, lm.Ledg_Name,lm.* from
            acnt_post ap JOIN Ledg_Mst lm on ap.Ledg_Ac = lm.Ledg_Code
            JOIN GD_FDI_TRANS gft on gft.AUTOVYN_FLAG = ap.Acnt_Id
            WHERE 
               ap.ledg_Ac = '${b[0][0].SALE_CUST_CODE}'
            AND
               ap.acnt_type < 4 
            AND 
               ap.Amt_drcr = 2  
               AND 
               ap.Loc_Code in (${multi_loc})`);
            PurChaseDms = await sequelize.query(`SELECT * FROM DMS_ROW_DATA WHERE Tran_Id = ${b[0][0].DRD_ID}`);
            SaleDms = await sequelize.query(`SELECT * FROM DMS_ROW_DATA WHERE Tran_Id = ${b[0][0].DRD_ID_SALE}`);
            PurAmtInWords = numWords(b[0][0].PURCHASE_COST);
            SaleAmtInWords = numWords(b[0][0].TTL_CTC);
            console.log(SaleDms, 'ferffvgfdv')
        }
        let data = { a, b, c, PurChaseDms, SaleDms, PurAmtInWords, SaleAmtInWords, base64QrCode };
        res.status(200).send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.TvViewManual = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body)
        const UTD = req.body.UTD ? req.body.UTD : '';
        const DRD_ID = req.body.DRD_ID ? req.body.DRD_ID : '';
        const multi_loc = req.body.multi_loc;
        const TRAN_TYPE = req.body.TRAN_TYPE ? req.body.TRAN_TYPE : '1';
        const VEHREGNO = req.body.VEHREGNO ? req.body.VEHREGNO : '';
        const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
        const TvIcmDtl = _TvIcmDtl(sequelize, DataTypes);
        let data = [];
        console.log(UTD, 'UTD')
        if (UTD) {
            const a = await TvIcmMst.findOne({
                where: {
                    UTD: UTD,
                    LOC_CODE: multi_loc
                },
            });
            const b = await TvIcmDtl.findOne({
                where: {
                    TRAN_ID: a.dataValues.UTD
                },
            });
            const c = await sequelize.query(`select * from doc_upload 
                where tran_id='${UTD}' and doc_type = 'TVICM' AND EXPORT_TYPE < 5 order by srno`);
            data = {
                TvIcmMst: a.dataValues,
                TvIcmDtl: b.dataValues,
                images: c[0] ? c[0] : []
            }
        }
        else {
            let c
            if (TRAN_TYPE === 1) {
                c = await sequelize.query(
                    `SELECT  
    ct.Tran_Id AS DRD_ID,
	CASE WHEN ct.TRAN_TYPE = 0 THEN ''
	ELSE 
    drd.bill_no END AS TV_PUR_INV, 
    cm.Chas_No AS CHAS_NO, 
    cm.Eng_No AS ENGINE_NO,
	CASE WHEN ct.TRAN_TYPE = 0 THEN ''
	ELSE 
    CAST(drd.Ledg_Acnt AS VARCHAR) END AS SellerName,
    cm.Chs_Dtl2 AS MODEL_VARIANT,
    Chs_Dtl3 AS MODEL_VAR, 
    Chs_Dtl4 AS REG_YEAR,
    cm.Reg_No AS VEHREGNO,
    (SELECT TOP 1 CAST(UTD AS VARCHAR) FROM TV_DO WHERE TV_DO.VEHREGNO = cm.Reg_No) AS TvDo,
	CASE WHEN ct.TRAN_TYPE = 0 THEN ''
	ELSE 
    CAST(drd.Tran_Type AS VARCHAR) END AS PUR_BOOK,
	CASE WHEN ct.TRAN_TYPE = 0 THEN ct.Tran_Date
	ELSE 
    drd.bill_Date END AS PurchaseDate,
    ct.Tran_Amt AS PURCHASE_COST, 
	CASE WHEN ct.TRAN_TYPE = 0 THEN ''
	ELSE 
    (SELECT TOP 1 Misc_Code 
     FROM Misc_mst 
     WHERE REPLACE(UPPER(Misc_Name), ' ', '') = REPLACE(UPPER(drd.State_Code), ' ', '') 
     AND Misc_type = 3) END AS PUR_CUST_STATE,
    (SELECT top 1 EMPCODE 
     FROM EMPLOYEEMASTER 
     WHERE EMPFIRSTNAME COLLATE DATABASE_DEFAULT = cm.Chs_Dtl1 COLLATE DATABASE_DEFAULT) AS PUR_EVAL_NAME,
	 CASE WHEN ct.TRAN_TYPE = 0 THEN ''
	ELSE 
    drd.Narration END AS REMARKS
FROM 
    DMS_ROW_DATA drd      
JOIN 
    CHAS_TRAN ct ON drd.Tran_Id = ct.Tran_Id
JOIN 
    CHAS_MST cm ON ct.Chas_Id = cm.Chas_Id 
JOIN 
    ACNT_POST ap ON ap.Link_Id = drd.Tran_Id
    WHERE drd.Tran_Id = ${DRD_ID}  AND drd.Tran_Id IN (
        SELECT Tran_Id
        FROM CHAS_TRAN
        WHERE ITEM_TYPE = 3
        AND Export_Type < 5 group by Tran_Id
    having Sum(iif(TRAN_TYPE IN (0, 1, 4,5),1,-1))>0
    );` );
            } else {
                c = await sequelize.query(
                    `SELECT ct.Tran_Id AS DRD_ID,cm.Chas_No AS CHAS_NO, 
    cm.Eng_No AS ENGINE_NO,cm.Chs_Dtl2 AS MODEL_VARIANT,cm.Chs_Dtl3 AS MODEL_VAR, 
    cm.Chs_Dtl4 AS REG_YEAR,
    cm.Reg_No AS VEHREGNO,ct.Tran_Amt AS PURCHASE_COST, ct.Tran_Date as PurchaseDate FROM CHAS_TRAN ct JOIN 
    CHAS_MST cm ON ct.Chas_Id = cm.Chas_Id WHERE ct.Tran_Id = ${DRD_ID} `);
            }

            data = {
                TvIcmMst: {
                    TV_PUR_INV: c[0][0].TV_PUR_INV ? c[0][0].TV_PUR_INV : null,
                    VEHREGNO: c[0][0].VEHREGNO,
                    CHAS_NO: c[0][0].CHAS_NO,
                    ENGINE_NO: c[0][0].ENGINE_NO,
                    SELLER_NAME: c[0][0].SellerName ? c[0][0].SellerName : null,
                    MODEL_VARIANT: c[0][0].MODEL_VARIANT ? c[0][0].MODEL_VARIANT : null,
                    MODEL_VAR: c[0][0].MODEL_VAR,
                    REG_YEAR: c[0][0].REG_YEAR,
                    PUR_EVAL_NAME: c[0][0].PUR_EVAL_NAME ? c[0][0].PUR_EVAL_NAME : null,
                    PURCHASE_COST: c[0][0].PURCHASE_COST,
                    DRD_ID: c[0][0].DRD_ID,
                    PUR_BOOK: c[0][0].PUR_BOOK ? c[0][0].PUR_BOOK : null,
                    PUR_CUST_STATE: c[0][0].PUR_CUST_STATE ? c[0][0].PUR_CUST_STATE : null,
                    PUR_DATE: c[0][0].PurchaseDate,
                    REMARKS: c[0][0].REMARKS ? c[0][0].REMARKS : null,
                    TvDo: c[0][0].TvDo ? c[0][0].TvDo : null,
                },
                TvIcmDtl: {
                    PURCHASE_COST: c[0][0].PURCHASE_COST,
                }
            }
        }
        console.log(data)
        res.status(200).send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.FindDMSBillsData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body)
        const TV_PUR_INV_DMS = req.body.TV_PUR_INV_DMS ? req.body.TV_PUR_INV_DMS : '';
        const multi_loc = req.body.multi_loc;
        let data = [];

        const c = await sequelize.query(
            `select (SELECT TOP 1 MODEL_DESC FROM model_variant_master where model_variant_master.MODEL_CD = GD_FDI_TRANS.MODEL_CD) As ModelGroup,
(SELECT TOP 1 VARIANT_DESC FROM model_variant_master where model_variant_master.VARIANT_CD = GD_FDI_TRANS.VARIANT_CD) As VariantName,* from GD_FDI_TRANS where TRANS_TYPE = 'b' 
                AND 
                LOC_CD = (SELECT top 1 NEWCAR_RCPT from Godown_Mst where Godw_Code = ${multi_loc} AND Export_type < 3)
                AND TRANS_ID = '${TV_PUR_INV_DMS}'`);
        console.log(c)
        let b
        if (c[0].length !== 0) {
            b = await sequelize.query(
                `SELECT * FROM GD_FDI_TRANS 
            WHERE TRANS_TYPE = 'ps' AND AUTOVYN_FLAG NOT IN (-1) 
            AND GE1 IN (SELECT TRANS_REF_NUM FROM GD_FDI_TRANS 
            WHERE TRANS_TYPE = 'b') AND 
            GE1 NOT IN (SELECT VEHREGNO FROM tv_icm_mst) 
            AND GE1 NOT IN (SELECT ge1 FROM GD_FDI_TRANS 
            where TRANS_TYPE = 'pc') AND 
            LOC_CD in (SELECT NEWCAR_RCPT 
            from Godown_Mst Where 
            DMS_TV_Code in (SELECT DMS_TV_Code from Godown_Mst 
            Where Godw_Code in (${multi_loc}))) AND GE1 in ('${c[0][0].TRANS_REF_NUM}') 
            ORDER BY TRANS_DATE`);
            console.log(b, 'sdfscfsc')
            if (b[0].length == 0) {
                return res.status(400).send({ Message: "Invalid Buying ID" });
            }
            // else if (b[0].length > 0) {
            //     return res.status(400).send({ Message: "Buying ID is not of the Current login location" });
            // }
        }
        console.log(b, 'saledata')
        data = {
            TvIcmMst: {
                VEHREGNO: c[0][0].TRANS_REF_NUM,
                CHAS_NO: c[0][0].CHASSIS_NUM,
                ENGINE_NO: c[0][0].ENGINE_NUM,
                SELLER_NAME: c[0][0].CUST_NAME,
                MODEL_VARIANT: c[0][0].ModelGroup,
                MODEL_VAR: c[0][0].VariantName,
                REG_YEAR: c[0][0]?.TRANS_REF_DATE ? new Date(c[0][0].TRANS_REF_DATE).getFullYear().toString() : null, // Extract year
                PUR_EVAL_NAME: c[0][0].EXECUTIVE,
                PURCHASE_COST: c[0][0].BASIC_PRICE,
                TV_PUR_INV_DMS: c[0][0].TRANS_ID,
                VEH_TYPE: c[0][0].GE6,
                PUR_DATE: formatDate(c[0][0].TRANS_DATE),
            },
            TvIcmDtl: {
                PURCHASE_COST: c[0][0].BASIC_PRICE,
            }
        }
        console.log(data)
        res.status(200).send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.TvApprView = async function (req, res) {
    try {
        const loc_code = req.body.loc_code;
        const userId = req.body.user_code;
        const dateFrom = req.body.dateFrom;
        const dateTo = req.body.dateTo;
        if (userId == "" || userId == undefined || userId == null) {
            return res.status(500).send({
                status: false,
                Message: "user_code is mandatory",
            });
        }
        if (loc_code == "" || loc_code == undefined || loc_code == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        // if (dateTo == "" || dateTo == undefined || dateTo == null) {
        //     return res.status(500).send({
        //         status: false,
        //         Message: "Date_to is mandatory",
        //     });
        // }
        // if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
        //     return res.status(500).send({
        //         status: false,
        //         Message: "dateFrom is mandatory",
        //     });
        // }
        const sequelize = await dbname(req.headers.compcode);

        const data = await sequelize.query(`SELECT 
    tim.UTD AS Srno,
    (SELECT Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = tim.SELLER_NAME) AS Seller_Name1,
    (SELECT Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = tim.Sale_cust_Code) AS Purchaser,
    tim.CHAS_NO, tim.ENGINE_NO, tim.VEHREGNO, tid.*, tim.Appr_1_Code, tim.Appr_2_Code,
    tim.Appr_3_Code,  tim.Appr_1_Stat, tim.Appr_2_Stat, tim.Appr_3_Stat,
    (CASE 
        WHEN ${userId} IN (Expense_Approval_Matrix.Approver_1A, Expense_Approval_Matrix.Approver_1B, Expense_Approval_Matrix.Approver_1C) THEN 
            CASE 
                WHEN tim.Appr_1_Stat IS NULL THEN 'Pending'
                WHEN tim.Appr_1_Stat = 0 THEN 'Rejected'
                WHEN tim.Appr_1_Stat = 1 THEN 'Approved'
                ELSE ''
            END
        ELSE ''
    END) AS Appr1_Status,
    (CASE 
        WHEN ${userId} IN (Expense_Approval_Matrix.Approver_2A, Expense_Approval_Matrix.Approver_2B, Expense_Approval_Matrix.Approver_2C) THEN 
            CASE 
                WHEN tim.Appr_2_Stat IS NULL THEN 'Pending'
                WHEN tim.Appr_2_Stat = 0 THEN 'Rejected'
                WHEN tim.Appr_2_Stat = 1 THEN 'Approved'
                ELSE ''
            END
        ELSE ''
    END) AS Appr2_Status,
    (CASE 
        WHEN ${userId} IN (Expense_Approval_Matrix.Approver_3A, Expense_Approval_Matrix.Approver_3B, Expense_Approval_Matrix.Approver_3C) THEN 
            CASE 
                WHEN tim.Appr_3_Stat IS NULL THEN 'Pending'
                WHEN tim.Appr_3_Stat = 0 THEN 'Rejected'
                WHEN tim.Appr_3_Stat = 1 THEN 'Approved'
                ELSE ''
            END
        ELSE ''
    END) AS Appr3_Status
        FROM 
            tv_icm_dtl tid 
        JOIN 
            TV_ICM_MST tim 
        ON 
            tim.UTD = tid.TRAN_ID
        JOIN 
            Expense_Approval_Matrix 
        ON 
            Expense_Approval_Matrix.module = 'TV'
        WHERE 
         tim.TV_SALE_INV is not null
            AND (
    (${userId} IN (Expense_Approval_Matrix.Approver_1A, Expense_Approval_Matrix.Approver_1B, Expense_Approval_Matrix.Approver_1C) AND tim.Appr_1_Stat = 3)
    OR (${userId} IN (Expense_Approval_Matrix.Approver_2A, Expense_Approval_Matrix.Approver_2B, Expense_Approval_Matrix.Approver_2C) AND tim.Appr_1_Stat = 1 AND tim.Appr_2_Stat IS NULL)
    OR (${userId} IN (Expense_Approval_Matrix.Approver_3A, Expense_Approval_Matrix.Approver_3B, Expense_Approval_Matrix.Approver_3C) AND tim.Appr_1_Stat = 1 AND tim.Appr_2_Stat = 1 AND tim.Appr_3_Stat IS NULL));`);

        await sequelize.close();
        console.log(data[0])
        res.status(200).send({ success: true, data: data[0] });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ success: "false", message: "Internal Server Error" });
    }
};
exports.TvApprViewDms = async function (req, res) {
    try {
        const loc_code = req.body.loc_code;
        const userId = req.body.user_code;
        const dateFrom = req.body.dateFrom;
        const dateTo = req.body.dateTo;
        const STATUS = req.body.STATUS;
        console.log(STATUS, 'STATUS')
        if (userId == "" || userId == undefined || userId == null) {
            return res.status(500).send({
                status: false,
                Message: "user_code is mandatory",
            });
        }
        if (loc_code == "" || loc_code == undefined || loc_code == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        // if (dateTo == "" || dateTo == undefined || dateTo == null) {
        //     return res.status(500).send({
        //         status: false,
        //         Message: "Date_to is mandatory",
        //     });
        // }
        // if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
        //     return res.status(500).send({
        //         status: false,
        //         Message: "dateFrom is mandatory",
        //     });
        // }
        const sequelize = await dbname(req.headers.compcode);
        const a = await sequelize.query(
            `SELECT top 1 * from Expense_Approval_Matrix where Branch_Code  = '${loc_code}' AND module ='tv'`);

        let ApprovalLevel = 0;
        let Final_apprvl = 0;
        const Approver_1A = a[0][0]?.Approver_1A;
        const Approver_1B = a[0][0]?.Approver_1B;
        const Approver_1C = a[0][0]?.Approver_1C;
        const Approver_2A = a[0][0]?.Approver_2A;
        const Approver_2B = a[0][0]?.Approver_2B;
        const Approver_2C = a[0][0]?.Approver_2C;
        const Approver_3A = a[0][0]?.Approver_3A;
        const Approver_3B = a[0][0]?.Approver_3B;
        const Approver_3C = a[0][0]?.Approver_3C;
        let ApproverCode = "";
        let ApproverStatus = "";
        if (Approver_1A == userId || Approver_1B == userId || Approver_1C == userId) {
            ApprovalLevel = 1;
            ApproverCode = "Appr_1_Code"
            ApproverStatus = "Appr_1_Stat"
        } else if (Approver_2A == userId || Approver_2B == userId || Approver_2C == userId) {
            ApprovalLevel = 2;
            ApproverCode = "Appr_2_Code"
            ApproverStatus = "Appr_2_Stat"
        } else if (Approver_3A == userId || Approver_3B == userId || Approver_3C == userId) {
            ApprovalLevel = 3;
            ApproverCode = "Appr_3_Code"
            ApproverStatus = "Appr_3_Stat"
        }
        if (ApprovalLevel == 2 && !a[0][0].Approver_3A && !a[0][0].Approver_3B && !a[0][0].Approver_3C) {
            Final_apprvl = 1;
        } else if (ApprovalLevel == 1 && !a[0][0].Approver_2A && !a[0][0].Approver_2B && !a[0][0].Approver_2C) {
            Final_apprvl = 1;
        }
        if (ApprovalLevel == 0) {
            return res.status(200).send({
                status: false,
                Message: "you are not the right person to approve this",
            });
        }
        let data
        if (STATUS == 1 || STATUS == "") {
            data = await sequelize.query(`SELECT 
    tim.UTD AS Srno,
    (SELECT Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = tim.SELLER_NAME) AS Seller_Name1,
    (SELECT Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = tim.Sale_cust_Code) AS Purchaser,
    tim.CHAS_NO, tim.ENGINE_NO, tim.VEHREGNO, tid.*, tim.Appr_1_Code, tim.Appr_2_Code,
    tim.Appr_3_Code, tim.seller_name as Seller_Name,  tim.Appr_1_Stat, tim.Appr_2_Stat, tim.Appr_3_Stat,
    (CASE 
        WHEN ${userId} IN (Expense_Approval_Matrix.Approver_1A, Expense_Approval_Matrix.Approver_1B, Expense_Approval_Matrix.Approver_1C) THEN 
            CASE 
                WHEN tim.Appr_1_Stat IS NULL THEN 'Pending'
                WHEN tim.Appr_1_Stat = 0 THEN 'Rejected'
                WHEN tim.Appr_1_Stat = 1 THEN 'Approved'
                ELSE ''
            END
        ELSE ''
    END) AS Appr1_Status,
    (CASE 
        WHEN ${userId} IN (Expense_Approval_Matrix.Approver_2A, Expense_Approval_Matrix.Approver_2B, Expense_Approval_Matrix.Approver_2C) THEN 
            CASE 
                WHEN tim.Appr_2_Stat IS NULL THEN 'Pending'
                WHEN tim.Appr_2_Stat = 0 THEN 'Rejected'
                WHEN tim.Appr_2_Stat = 1 THEN 'Approved'
                ELSE ''
            END
        ELSE ''
    END) AS Appr2_Status,
    (CASE 
        WHEN ${userId} IN (Expense_Approval_Matrix.Approver_3A, Expense_Approval_Matrix.Approver_3B, Expense_Approval_Matrix.Approver_3C) THEN 
            CASE 
                WHEN tim.Appr_3_Stat IS NULL THEN 'Pending'
                WHEN tim.Appr_3_Stat = 0 THEN 'Rejected'
                WHEN tim.Appr_3_Stat = 1 THEN 'Approved'
                ELSE ''
            END
        ELSE ''
    END) AS Appr3_Status
    FROM 
        tv_icm_dtl tid 
    JOIN 
        TV_ICM_MST tim 
    ON 
        tim.UTD = tid.TRAN_ID
    JOIN 
        Expense_Approval_Matrix 
    ON 
        Expense_Approval_Matrix.module = 'TV'
    WHERE 
      (
    (${userId} IN (Expense_Approval_Matrix.Approver_1A, Expense_Approval_Matrix.Approver_1B, Expense_Approval_Matrix.Approver_1C) AND tim.Appr_1_Stat = 3 AND tim.Fin_Appr is NULL)
    OR (${userId} IN (Expense_Approval_Matrix.Approver_2A, Expense_Approval_Matrix.Approver_2B, Expense_Approval_Matrix.Approver_2C) AND tim.Appr_1_Stat = 1 AND tim.Appr_2_Stat IS NULL AND tim.Fin_Appr is NULL)
            OR (${userId} IN (Expense_Approval_Matrix.Approver_3A, Expense_Approval_Matrix.Approver_3B, Expense_Approval_Matrix.Approver_3C) AND tim.Appr_1_Stat = 1 AND tim.Appr_2_Stat = 1 AND tim.Appr_3_Stat IS NULL AND tim.Fin_Appr is NULL));`);
        } else if (STATUS == 2) {
            data = await sequelize.query(`select  tim.UTD AS Srno,
    (SELECT Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = tim.Sale_cust_Code) AS Purchaser,tim.seller_name as Seller_Name,* from TV_ICM_MST tim JOIN TV_ICM_DTL tid 
                ON tim.UTD = tid.TRAN_ID WHERE ${ApproverCode} = '${userId}' AND ${ApproverStatus} = 1`);
        } else if (STATUS == 3) {
            data = await sequelize.query(`select  tim.UTD AS Srno,
    (SELECT Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = tim.Sale_cust_Code) AS Purchaser,tim.seller_name as Seller_Name,* from TV_ICM_MST tim JOIN TV_ICM_DTL tid 
                ON tim.UTD = tid.TRAN_ID WHERE ${ApproverCode} = '${userId}' AND ${ApproverStatus} = 0`);
        }
        await sequelize.close();
        res.status(200).send({ success: true, data: data[0] });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ success: "false", message: "Internal Server Error" });
    }
};
exports.ApproveTvTran = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        const bodyData = req.body;
        const LOC_CODE = req.body.loc_code;
        const userId = req.body.user_code;
        const UTD = req.body.UTD;
        const REMARK = req.body.REMARK;
        const currentDate = new Date();
        const ENTR_DATE = currentDate.toISOString().split('T')[0];
        if (userId == "" || userId == undefined || userId == null) {
            return res.status(500).send({
                status: false,
                Message: "user_code is mandatory",
            });
        }
        if (LOC_CODE == "" || LOC_CODE == undefined || LOC_CODE == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        if (req.body.UTD == "" || req.body.UTD == undefined || req.body.UTD == null) {
            return res.status(500).send({
                status: false,
                Message: "UTD is mandatory",
            });
        }
        try {

            const a = await sequelize.query(
                `SELECT top 1 * from Expense_Approval_Matrix where Branch_Code  = '${LOC_CODE}' AND module ='tv'`);
            const CreateBy = await sequelize.query(
                `select  User_Name from USER_TBL where User_Code = '${userId}'`);
            const b = await sequelize.query(
                `SELECT 
            (SELECT TOP 1 Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = SALE_CUST_CODE) AS CustomerName,
                * FROM TV_ICM_MST WHERE UTD = ${UTD}`);
            console.log(b, 'b')
            const branch = await sequelize.query(
                `select Godw_Name from GODOWN_MST where Godw_Code in (${LOC_CODE})  and export_type<3`);
            const comapny = await sequelize.query(`select comp_name from comp_mst `);
            let ApprovalLevel = 0;
            let Final_apprvl = 0;
            let rowsAffected = 0;
            const Approver_1A = a[0][0]?.Approver_1A;
            const Approver_1B = a[0][0]?.Approver_1B;
            const Approver_1C = a[0][0]?.Approver_1C;
            const Approver_2A = a[0][0]?.Approver_2A;
            const Approver_2B = a[0][0]?.Approver_2B;
            const Approver_2C = a[0][0]?.Approver_2C;
            const Approver_3A = a[0][0]?.Approver_3A;
            const Approver_3B = a[0][0]?.Approver_3B;
            const Approver_3C = a[0][0]?.Approver_3C;
            let MsgUserId = "";
            if (Approver_1A == userId || Approver_1B == userId || Approver_1C == userId) {
                ApprovalLevel = 1;
                MsgUserId = "Approver_2A"
            } else if (Approver_2A == userId || Approver_2B == userId || Approver_2C == userId) {
                ApprovalLevel = 2;
                MsgUserId = "Approver_3A"
            } else if (Approver_3A == userId || Approver_3B == userId || Approver_3C == userId) {
                ApprovalLevel = 3;
            }
            if (ApprovalLevel == 2 && !a[0][0].Approver_3A && !a[0][0].Approver_3B && !a[0][0].Approver_3C) {
                Final_apprvl = 1;
            } else if (ApprovalLevel == 1 && !a[0][0].Approver_2A && !a[0][0].Approver_2B && !a[0][0].Approver_2C) {
                Final_apprvl = 1;
            }
            console.log(ApprovalLevel)
            console.log(Final_apprvl)
            if (ApprovalLevel == 0) {
                return res.status(200).send({
                    status: false,
                    Message: "you are not the right person to approve this",
                });
            }
            const TvApproval = _TvIcmMst(sequelize, DataTypes);
            if (ApprovalLevel === 1) {
                const data = { Appr_1_Code: userId, Appr_1_Stat: 1, Appr_1_Rem: REMARK, Fin_Appr: Final_apprvl == 1 ? 1 : null, VIEW_FLAG: Final_apprvl == 1 ? 3 : null, VERF_DATE: Final_apprvl == 1 ? ENTR_DATE : null }
                console.log(data, 'data')
                console.log(UTD, 'UTD')
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    { where: { UTD: UTD, Appr_1_Stat: 3, Fin_Appr: null } },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
                const mobile_no = await sequelize.query(
                    `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 ${MsgUserId} from Expense_Approval_Matrix where module='tv')`,
                    { transaction: t }
                );
                await SendWhatsAppMessgae(req.headers.compcode, mobile_no[0][0]?.User_mob, "tv_appr_msg", [
                    {
                        type: "text",
                        text: CreateBy[0][0].User_Name,
                    },
                    {
                        type: "text",
                        text: b[0][0]?.VEHREGNO,
                    },
                    {
                        type: "text",
                        text: b[0][0]?.CHAS_NO,
                    },
                    {
                        type: "text",
                        text: branch[0][0]?.Godw_Name,
                    },
                    {
                        type: "text",
                        text: comapny[0][0]?.comp_name,
                    },
                    {
                        type: "text",
                        text: `https://erp.autovyn.com/autovyn/truevalue/approver`,
                    },
                ]);
            }
            else if (ApprovalLevel === 2) {
                const data = { Appr_2_Code: userId, Appr_2_Stat: 1, Appr_2_Rem: REMARK, Fin_Appr: Final_apprvl == 1 ? 1 : null, VIEW_FLAG: Final_apprvl == 1 ? 3 : null, VERF_DATE: Final_apprvl == 1 ? ENTR_DATE : null }
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    {
                        where: {
                            UTD: UTD,
                            Appr_1_Stat: { [Sequelize.Op.not]: null },
                            Appr_2_Stat: null,
                            Fin_Appr: null
                        }
                    },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
                const mobile_no3 = await sequelize.query(
                    `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 ${Approver_3A} from Expense_Approval_Matrix where module='tv')`,
                    { transaction: t }
                );
                await SendWhatsAppMessgae(req.headers.compcode, mobile_no3[0][0]?.User_mob, "tv_appr_msg", [
                    {
                        type: "text",
                        text: CreateBy[0][0].User_Name,
                    },
                    {
                        type: "text",
                        text: b[0][0]?.VEHREGNO,
                    },
                    {
                        type: "text",
                        text: b[0][0]?.CHAS_NO,
                    },
                    {
                        type: "text",
                        text: branch[0][0]?.Godw_Name,
                    },
                    {
                        type: "text",
                        text: comapny[0][0]?.comp_name,
                    },
                    {
                        type: "text",
                        text: `https://erp.autovyn.com/autovyn/truevalue/approver`,
                    },
                ]);
            }
            else if (ApprovalLevel === 3) {
                Final_apprvl = 1;
                const data = { Appr_3_Code: userId, Appr_3_Stat: 1, Appr_3_Rem: REMARK, Fin_Appr: 1, VIEW_FLAG: 3, VERF_DATE: ENTR_DATE }
                console.log(data, 'fgvefv')
                console.log(UTD, 'UTD')
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    {
                        where:
                        {
                            UTD: UTD,
                            Appr_2_Stat: { [Sequelize.Op.not]: null },
                            Appr_3_Code: null,
                            Fin_Appr: null
                        }
                    },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
            }
            if (Final_apprvl === 1) {

                await SendWhatsAppMessgae(req.headers.compcode, b[0][0]?.SALE_CUST_MOB, "tv_cust_delv", [
                    {
                        type: "text",
                        text: b[0][0]?.CustomerName,
                    },
                    {
                        type: "text",
                        text: branch[0][0]?.Godw_Name,
                    },
                    {
                        type: "text",
                        text: comapny[0][0]?.comp_name,
                    },
                ]);
            }
            t.commit();
            if (rowsAffected == 0) {
                return res.status(200).send({ success: true, Message: 'Can Not Approve' });
            }
            if (Final_apprvl == 1) {
                return res.status(200).send({ success: true, Message: 'Final Approval Done' });
            }
            if (ApprovalLevel == 1) {
                return res.status(200).send({ success: true, Message: 'Approved on level 1' });
            }
            if (ApprovalLevel == 2) {
                return res.status(200).send({ success: true, Message: 'Approved on level 2' });
            }
            if (ApprovalLevel == 3) {
                return res.status(200).send({ success: true, Message: 'Approved on level 3' });
            }
        } catch (e) {
            console.log(e);
            t.rollback();
            return res.status(500).send({ status: false, Message: "Internal Server Error", });
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
};
exports.RejectTvTran = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        const bodyData = req.body;
        const LOC_CODE = req.body.loc_code;
        const userId = req.body.user_code;
        const UTD = req.body.UTD;
        const REMARK = req.body.REMARK;
        const currentDate = new Date();
        const ENTR_DATE = currentDate.toISOString().split('T')[0];
        if (userId == "" || userId == undefined || userId == null) {
            return res.status(500).send({
                status: false,
                Message: "user_code is mandatory",
            });
        }
        if (LOC_CODE == "" || LOC_CODE == undefined || LOC_CODE == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        if (req.body.UTD == "" || req.body.UTD == undefined || req.body.UTD == null) {
            return res.status(500).send({
                status: false,
                Message: "UTD is mandatory",
            });
        }
        try {

            const a = await sequelize.query(
                `SELECT top 1 * from Expense_Approval_Matrix where Branch_Code  = '${LOC_CODE}' AND module ='tv'`);

            let ApprovalLevel = 0;
            let Final_apprvl = 0;
            let rowsAffected = 0;
            const Approver_1A = a[0][0]?.Approver_1A;
            const Approver_1B = a[0][0]?.Approver_1B;
            const Approver_1C = a[0][0]?.Approver_1C;
            const Approver_2A = a[0][0]?.Approver_2A;
            const Approver_2B = a[0][0]?.Approver_2B;
            const Approver_2C = a[0][0]?.Approver_2C;
            const Approver_3A = a[0][0]?.Approver_3A;
            const Approver_3B = a[0][0]?.Approver_3B;
            const Approver_3C = a[0][0]?.Approver_3C;

            if (Approver_1A == userId || Approver_1B == userId || Approver_1C == userId) {
                ApprovalLevel = 1;
            } else if (Approver_2A == userId || Approver_2B == userId || Approver_2C == userId) {
                ApprovalLevel = 2;
            } else if (Approver_3A == userId || Approver_3B == userId || Approver_3C == userId) {
                ApprovalLevel = 3;
            }
            if (ApprovalLevel == 2 && !a[0][0].Approver_3A && !a[0][0].Approver_3B && !a[0][0].Approver_3C) {
                Final_apprvl = 1;
            } else if (ApprovalLevel == 1 && !a[0][0].Approver_2A && !a[0][0].Approver_2B && !a[0][0].Approver_2C) {
                Final_apprvl = 1;
            }

            if (ApprovalLevel == 0) {
                return res.status(200).send({
                    status: false,
                    Message: "you are not the right person to approve this",
                });
            }
            const TvApproval = _TvIcmMst(sequelize, DataTypes);
            if (ApprovalLevel === 1) {
                const data = { Appr_1_Code: userId, Appr_1_Stat: 0, Fin_Appr: 0, Appr_1_Rem: REMARK, VERF_DATE: Final_apprvl == 1 ? ENTR_DATE : null }
                console.log(data)
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    { where: { UTD: UTD, Appr_1_Stat: 3, Fin_Appr: null } },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
            }
            else if (ApprovalLevel === 2) {
                const data = { Appr_2_Code: userId, Appr_2_Stat: 0, Fin_Appr: 0, Appr_2_Rem: REMARK, VERF_DATE: Final_apprvl == 1 ? ENTR_DATE : null }
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    {
                        where: {
                            UTD: UTD,
                            Appr_1_Stat: { [Sequelize.Op.not]: null },
                            Appr_2_Stat: null,
                            Fin_Appr: null
                        }
                    },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
            }
            else if (ApprovalLevel === 3) {
                Final_apprvl = 1;
                const data = { Appr_3_Code: userId, Appr_3_Stat: 1, Fin_Appr: 0, Appr_3_Rem: REMARK, VERF_DATE: ENTR_DATE }
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    {
                        where:
                        {
                            UTD: bodyData.UTD,
                            Appr_2_Stat: { [Sequelize.Op.not]: null },
                            Appr_3_Code: null,
                            Fin_Appr: null
                        }
                    },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
            }

            t.commit();
            if (rowsAffected == 0) {
                return res.status(200).send({ success: true, Message: 'Can Not Reject' });
            }
            if (Final_apprvl == 1) {
                return res.status(200).send({ success: true, Message: 'Final Reject Done' });
            }
            if (ApprovalLevel == 1) {
                return res.status(200).send({ success: true, Message: 'Rejected on level 1' });
            }
            if (ApprovalLevel == 2) {
                return res.status(200).send({ success: true, Message: 'Rejected on level 2' });
            }
            if (ApprovalLevel == 3) {
                return res.status(200).send({ success: true, Message: 'Rejected on level 3' });
            }
        } catch (e) {
            console.log(e);
            t.rollback();
            return res.status(500).send({ status: false, Message: "Internal Server Error", });
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
};


exports.VerificationReq = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const TvApproval = _TvIcmMst(sequelize, DataTypes);

    console.log(req.body)
    try {
        const UTD = req.body.UTD;
        const multi_loc = req.body.multi_loc;
        const user_code = req.body.user_code;
        const a = await sequelize.query(
            `SELECT * FROM TV_ICM_MST WHERE UTD = ${UTD}`);
        const branch = await sequelize.query(
            `select Godw_Name from GODOWN_MST where Godw_Code in (${multi_loc})  and export_type<3`,
            { transaction: t }
        );
        const comapny = await sequelize.query(`select comp_name from comp_mst `, {
            transaction: t,
        });
        const mobile_no1 = await sequelize.query(
            `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 Approver_1A from Expense_Approval_Matrix where module='tv')`,
            { transaction: t }
        );
        const mobile_no2 = await sequelize.query(
            `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 Approver_1B from Expense_Approval_Matrix where module='tv')`,
            { transaction: t }
        );
        const mobile_no3 = await sequelize.query(
            `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 Approver_1C from Expense_Approval_Matrix where module='tv')`,
            { transaction: t }
        );
        const CreateBy = await sequelize.query(
            `select  User_Name from USER_TBL where User_Code = '${user_code}'`,
            { transaction: t }
        );
        const data = { Appr_1_Stat: 3 }
        console.log(data)
        const [affectedRowsCount] = await TvApproval.update({ ...data, Created_By: CreateBy[0][0].User_Name },
            { where: { UTD: UTD, Appr_1_Stat: null, Fin_Appr: null } },
            { transaction: t });
        rowsAffected = affectedRowsCount;
        console.log(affectedRowsCount, 'asdkaskdjldas')
        await SendWhatsAppMessgae(req.headers.compcode, mobile_no1[0][0]?.User_mob, "tv_appr_msg", [
            {
                type: "text",
                text: CreateBy[0][0].User_Name,
            },
            {
                type: "text",
                text: a[0][0]?.VEHREGNO,
            },
            {
                type: "text",
                text: a[0][0]?.CHAS_NO,
            },
            {
                type: "text",
                text: branch[0][0]?.Godw_Name,
            },
            {
                type: "text",
                text: comapny[0][0]?.comp_name,
            },
            {
                type: "text",
                text: `https://erp.autovyn.com/autovyn/truevalue/approver`,
            },
        ]);
        await SendWhatsAppMessgae(req.headers.compcode, mobile_no2[0][0]?.User_mob, "tv_appr_msg", [
            {
                type: "text",
                text: CreateBy[0][0].User_Name,
            },
            {
                type: "text",
                text: a[0][0]?.VEHREGNO,
            },
            {
                type: "text",
                text: a[0][0]?.CHAS_NO,
            },
            {
                type: "text",
                text: branch[0][0]?.Godw_Name,
            },
            {
                type: "text",
                text: comapny[0][0]?.comp_name,
            },
            {
                type: "text",
                text: `https://erp.autovyn.com/autovyn/truevalue/approver`,
            },
        ]);
        await SendWhatsAppMessgae(req.headers.compcode, mobile_no3[0][0]?.User_mob, "tv_appr_msg", [
            {
                type: "text",
                text: CreateBy[0][0].User_Name,
            },
            {
                type: "text",
                text: a[0][0]?.VEHREGNO,
            },
            {
                type: "text",
                text: a[0][0]?.CHAS_NO,
            },
            {
                type: "text",
                text: branch[0][0]?.Godw_Name,
            },
            {
                type: "text",
                text: comapny[0][0]?.comp_name,
            },
            {
                type: "text",
                text: `https://erp.autovyn.com/autovyn/truevalue/approver`,
            },
        ]);
        const UserDetails = mobile_no1[0][0]
        const UserDetails1 = mobile_no2[0][0]
        res.status(200).send(UserDetails);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.ReVerificationReq = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const TvApproval = _TvIcmMst(sequelize, DataTypes);

    console.log(req.body)
    try {
        const UTD = req.body.UTD;
        const multi_loc = req.body.multi_loc;
        const user_code = req.body.user_code;
        const a = await sequelize.query(
            `SELECT * FROM TV_ICM_MST WHERE UTD = ${UTD}`);
        const branch = await sequelize.query(
            `select Godw_Name from GODOWN_MST where Godw_Code in (${multi_loc})  and export_type<3`,
            { transaction: t }
        );
        const comapny = await sequelize.query(`select comp_name from comp_mst `, {
            transaction: t,
        });
        const mobile_no = await sequelize.query(
            `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 Approver_1A from Expense_Approval_Matrix where module='tv')`,
            { transaction: t }
        );
        const CreateBy = await sequelize.query(
            `select  User_Name from USER_TBL where User_Code = '${user_code}'`,
            { transaction: t }
        );
        const data = { Appr_1_Stat: 3, Appr_1_Code: null, Fin_Appr: null }
        console.log(data)
        const [affectedRowsCount] = await TvApproval.update({ ...data },
            { where: { UTD: UTD } },
            { transaction: t });
        rowsAffected = affectedRowsCount;
        console.log(affectedRowsCount, 'asdkaskdjldas')
        await SendWhatsAppMessgae(req.headers.compcode, mobile_no[0][0]?.User_mob, "tv_appr_msg", [
            {
                type: "text",
                text: CreateBy[0][0].User_Name,
            },
            {
                type: "text",
                text: a[0][0]?.VEHREGNO,
            },
            {
                type: "text",
                text: a[0][0]?.CHAS_NO,
            },
            {
                type: "text",
                text: branch[0][0]?.Godw_Name,
            },
            {
                type: "text",
                text: comapny[0][0]?.comp_name,
            },
            {
                type: "text",
                text: `https://erp.autovyn.com/autovyn/truevalue/approver`,
            },
        ]);
        const UserDetails = mobile_no[0][0]
        res.status(200).send(UserDetails);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
// exports.ReVerificationReq = async function (req, res) {
//     const sequelize = await dbname(req.headers.compcode);
//     const t = await sequelize.transaction();
//     const TvApproval = _TvIcmMst(sequelize, DataTypes);

//     console.log(req.body)
//     try {
//         const UTD = req.body.UTD;
//         console.log(UTD)
//         const multi_loc = req.body.multi_loc;
//         const user_code = req.body.user_code;
//         const a = await sequelize.query(
//             `SELECT * FROM TV_ICM_MST WHERE UTD = ${UTD}`);
//         const branch = await sequelize.query(
//             `select Godw_Name from GODOWN_MST where Godw_Code in (${multi_loc})  and export_type<3`);
//         const comapny = await sequelize.query(`select comp_name from comp_mst `);
//         const mobile_no = await sequelize.query(
//             `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 Approver_1A from Expense_Approval_Matrix where module='tv')`);
//         const CreateBy = await sequelize.query(
//             `select  User_Name from USER_TBL where User_Code = '${user_code}'`);
//         const data = { ...a[0][0], Appr_1_Stat: 3, Appr_1_Code: null, Appr_1_Rem: null, Fin_Appr: null}
//             console.log(data)
//         const { error: error1, value: tvData } = TvIcmMstSchema.validate(data, {
//             abortEarly: false,
//             stripUnknown: true
//         });
//         console.log(error1, 'error1')
//         console.log(tvData,'tvData')
//         if (error1) {
//             const errorMessage = error1.details.map(err => err.message).join(', ');
//             return res.status(400).send({ success: false, message: errorMessage });
//         } else {
//             await TvApproval.update({ Export_Type: 9 },
//                 { where: { UTD: UTD } },
//                 { transaction: t });
//             const [affectedRowsCount] = await TvApproval.create({ ...tvData },
//                 { transaction: t });
//             rowsAffected = affectedRowsCount;
//             console.log(affectedRowsCount, 'asdkaskdjldas')

//             await SendWhatsAppMessgae(mobile_no[0][0]?.User_mob, "tv_appr_msg", [
//                 {
//                     type: "text",
//                     text: CreateBy[0][0].User_Name,
//                 },
//                 {
//                     type: "text",
//                     text: a[0][0]?.VEHREGNO,
//                 },
//                 {
//                     type: "text",
//                     text: a[0][0]?.CHAS_NO,
//                 },
//                 {
//                     type: "text",
//                     text: branch[0][0]?.Godw_Name,
//                 },
//                 {
//                     type: "text",
//                     text: comapny[0][0]?.comp_name,
//                 },
//                 {
//                     type: "text",
//                     text: `https://erp.autovyn.com/autovyn/truevalue/approver`,
//                 },
//             ]);
//         }
//         const UserDetails = mobile_no[0][0]
//         res.status(200).send(UserDetails);
//     }
//     catch (error) {
//         console.error(error);
//         res.status(500).send("Error Occured While Fetching Data");
//     }
//     finally {
//         await sequelize.close();
//         console.log('Connection has been closed.');
//     }
// };
exports.DelvrUpdate = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const BodyData = req.body;
    console.log(BodyData, 'BodyData')
    const tvIcmMst = BodyData.formData.TvIcmMst;
    const tvIcmDtl = BodyData.formData.TvIcmDtl;
    console.log(BodyData.formData.TvIcmMst);
    const UTD = req.body.UTD;
    const Created_by = req.body.Created_by;
    const DELV_DATE = req.body.DELV_DATE;
    const t = await sequelize.transaction();
    try {
        const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
        if (!BodyData.DmsMode) {
            const [
                MaxChasTranId,
                ModlMst,
                Salegst,
                FindUserCode,
                MaxTranId,
                SaleInvNo,
                MaxSaleSeq,
                StateCode,
                ChasID,
                LedgCode,
                StateName,
                IsOldEntry,
            ] = await Promise.all([
                sequelize.query(`select isnull(MAX(Tran_Id) + 1, 1) AS SeqNo FROM CHAS_TRAN`),
                sequelize.query(`select HSN,Asset_Ledg, Income_Ledg, Modl_Code, Modl_Name,Modl_Abbr,Modl_Grp,Purc_Ledg,Sale_Ledg from modl_Mst WHERE Item_Code = 1742`),
                sequelize.query(`select * from GSTRATE WHERE Head_Type = 5 AND RATE = ${tvIcmDtl.GST_PERCT ? tvIcmDtl.GST_PERCT : null} `),
                sequelize.query(`select User_Code FROM user_tbl where User_Name  = '${BodyData.formData.Created_by}' AND Export_Type = 1 AND Module_Code = 10`),
                sequelize.query(`SELECT isnull(max(Tran_Id)+1,1) AS TRAN_ID from DMS_ROW_DATA`),
                sequelize.query(`SELECT CONCAT((SELECT TOP 1 Book_Prefix FROM book_mst WHERE book_code =
                (SELECT misc_dtl1 FROM misc_mst WHERE misc_code = '${BodyData.formData.TvIcmMst.SALE_BOOK ? BodyData.formData.TvIcmMst.SALE_BOOK : ''}' and misc_type = 56)),
                isnull(MAX(seq_no) + 1, 1)) AS bill_no FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formData.TvIcmMst.SALE_BOOK ? BodyData.formData.TvIcmMst.SALE_BOOK : ''}' and Export_type < 3;`),
                sequelize.query(`select isnull(MAX(seq_no) + 1, 1) AS SeqNo FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formData.TvIcmMst.SALE_BOOK ? BodyData.formData.TvIcmMst.SALE_BOOK : ''}' and Export_type < 3;`),
                sequelize.query(`select (SELECT Misc_Code from Misc_Mst where Misc_type = 3 and Misc_Name = State) AS LoginState from Godown_Mst where Godw_Code = ${tvIcmMst.LOC_CODE} AND Export_type  < 3`),
                sequelize.query(`select Chas_Id from CHAS_MST where Chas_No = '${BodyData.formData.TvIcmMst.CHAS_NO}'`),
                sequelize.query(`Select Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = '${tvIcmMst.SALE_CUST_CODE}'`),
                sequelize.query(`SELECT TOP 1 Misc_Name From Misc_mst WHERE Misc_Code = ${tvIcmMst.SALE_CUST_STATE} AND Misc_type = 3`),
                sequelize.query(`SELECT (select top 1 seq_no from DMS_ROW_DATA where tran_id = DRD_ID_SALE) as seq_no,* From TV_ICM_MST WHERE Utd =  ${req.body.UTD}`),

            ]);

            let ChasTran_Id = MaxChasTranId[0][0]?.SeqNo;
            let Tran_Id = MaxTranId[0][0]?.TRAN_ID;
            let SaleSeq = MaxSaleSeq[0][0]?.SeqNo;
            let SaleDmsInv = SaleInvNo[0][0]?.bill_no;
            let sgstPerct = 0;
            let cgstPerct = 0;
            let igstPerct = 0;
            let sgstVal = 0;
            let cgstVal = 0;
            let igstVal = 0;
            let Category = 0;
            if (IsOldEntry[0][0]?.TV_SALE_INV != null) {
                sequelize.query(`update dms_row_data set export_type = 33 where tran_id = '${IsOldEntry[0][0]?.DRD_ID_SALE}'`);
                sequelize.query(`update CHAS_TRAN set Export_Type = 33 where tran_id = '${IsOldEntry[0][0]?.DRD_ID_SALE}'`);

                SaleDmsInv = IsOldEntry[0][0]?.TV_SALE_INV;
                Tran_Id = IsOldEntry[0][0]?.DRD_ID_SALE;
                SaleSeq = IsOldEntry[0][0]?.seq_no;
            }
            if (parseInt(StateCode[0][0].LoginState) === parseInt(tvIcmMst.SALE_CUST_STATE)) {
                sgstPerct = parseFloat(tvIcmDtl.GST_PERCT) / 2;
                cgstPerct = parseFloat(tvIcmDtl.GST_PERCT) / 2;
                sgstVal = parseFloat(tvIcmDtl.GST_AMT) / 2;
                cgstVal = parseFloat(tvIcmDtl.GST_AMT) / 2;
            } else {
                igstPerct = parseFloat(tvIcmDtl.GST_PERCT);
                igstVal = parseFloat(tvIcmDtl.GST_AMT);
            }
            if (tvIcmDtl.TOTAL_VALUE == 0) {
                Category = 3
            }
            const TtlGst = parseFloat(sgstVal) + parseFloat(cgstVal) + parseFloat(igstVal);
            let RndOff = Math.round(tvIcmDtl.TTL_CTC) - parseFloat(tvIcmDtl.TTL_CTC);
            const currentDate = new Date();
            const ENTR_DATE = currentDate.toISOString().split('T')[0];
            const hours = String(currentDate.getHours()).padStart(2, '0');
            const minutes = String(currentDate.getMinutes()).padStart(2, '0');
            const ENTR_TIME = `${hours}.${minutes}`;


            const { error: error1, value: tvData } = TvDataSchemaPurchase.validate(BodyData, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error1, 'error1')
            if (error1) {
                const errorMessage = error1.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                await TvIcmMst.update({ ...tvData.formData.TvIcmMst, TV_SALE_INV: SaleDmsInv, DELV_STAT: 1, DELV_DATE: DELV_DATE, DRD_ID_SALE: Tran_Id, VIEW_FLAG: 4, Created_by: Created_by }, {
                    where: { UTD: tvData.formData.TvIcmMst.UTD }
                }, { transaction: t });

            }
            // await TvIcmMst.update({ DELV_STAT: 1, DELV_DATE: DELV_DATE, Created_by: Created_by }, {
            //     where: { UTD: UTD }
            // }, { transaction: t });
            await sequelize.query(`INSERT INTO DMS_ROW_DATA 
            (Tran_Id, Tran_Type, Bill_No, 
            Bill_Date, Chassis, Engine, 
            Ledger_Name, State_Code, GST, 
            Item_Code, HSN, Basic_Price, 
            Taxable, CGST_Perc, SGST_Perc, 
            IGST_Perc, CGST, SGST, 
            IGST, Rnd_Off, Export_Type, 
            Inv_Amt, Rnd_Ledg, CGST_ACNT, 
            SGST_ACNT, IGST_ACNT, Loc_Code, 
            LOCATION, Sup_Qty, Sale_Ledg, 
            Narration, Server_id, Item_Type, 
            Assessable_Rate, LEDG_ACNT, Seq_No, 
            Item_Seq, Modl_Code, USR_CODE, 
            ENTR_DATE, ENTR_TIME, Ref_Dt, ENTRY_BATCH, TCS, TCS_Perc,Category) 
            VALUES (${Tran_Id}, '${tvIcmMst.SALE_BOOK}', '${SaleDmsInv}', 
            '${tvIcmMst.SALE_DATE}', '${tvIcmMst.CHAS_NO}', '${tvIcmMst.ENGINE_NO}', 
            '${LedgCode[0][0].Ledg_Name}','${StateName[0][0].Misc_Name}',  ${tvIcmMst.SALE_CUST_GST ? `'${tvIcmMst.SALE_CUST_GST}'` : null}, 
            '${ModlMst[0][0].Modl_Code}', '${ModlMst[0][0].HSN}', '${parseFloat(tvIcmDtl.SALE_INV_AMT) - parseFloat(TtlGst)}', 
            '${parseFloat(tvIcmDtl.SALE_INV_AMT) - parseFloat(TtlGst)}', '${cgstPerct.toFixed(2)}', '${sgstPerct.toFixed(2)}', 
            '${igstPerct.toFixed(2)}', '${cgstVal.toFixed(2)}', '${sgstVal.toFixed(2)}', 
            '${igstVal.toFixed(2)}', '${RndOff.toFixed(2)}', 0, 
            '${Math.round(tvIcmDtl.SALE_INV_AMT)}', 23, ${cgstVal !== 0 ? Salegst[0][0].CGST_OUTPUT : null}, 
            ${sgstVal !== 0 ? Salegst[0][0].SGST_OUTPUT : null}, ${igstVal !== 0 ? Salegst[0][0].IGST_OUTPUT : null}, '${tvIcmMst.LOC_CODE}', 
            '${tvIcmMst.LOC_CODE}', 1, '${ModlMst[0][0].Sale_Ledg}', 
            '${tvIcmMst.SALE_REMARKS}', 1, 5, 
            '${tvIcmDtl.TOTAL_VALUE}', '${tvIcmMst.SALE_CUST_CODE}', '${SaleSeq}', 
            1, 1742, '${FindUserCode[0][0].User_Code}', 
            '${ENTR_DATE}', FORMAT(GETDATE(), 'HH.mm'), '${tvIcmMst.SALE_DATE}','CLOUD-${Tran_Id}',${tvIcmDtl.SALE_TCS ? tvIcmDtl.SALE_TCS : null},${tvIcmDtl.SALE_TCS_PERCT ? tvIcmDtl.SALE_TCS_PERCT : null},${Category})`,
                { transaction: t });

            await sequelize.query(`INSERT INTO CHAS_TRAN 
                (Tran_Id, CHAS_ID, TRAN_TYPE, 
                Tran_Date, Tran_Amt, Asset_Ledg, 
                Income_Ledg, Loc_Code, Export_Type, 
                Item_Type, Item_Seq) 
                VALUES 
                (${Tran_Id}, ${ChasID[0][0].Chas_Id}, 2, 
                '${tvIcmMst.SALE_DATE}', ${Math.round(tvIcmDtl.PURCHASE_COST)}, '${ModlMst[0][0].Asset_Ledg}', 
                '${ModlMst[0][0].Income_Ledg}', ${tvIcmMst.LOC_CODE}, 0, 
                3, 1)
                `, { transaction: t });

            await sequelize.query(`UPDATE CHAS_MST SET 
            Sale_Id =  '${tvIcmMst.SALE_BOOK && tvIcmMst.SALE_DATE ? Tran_Id : null}',
            SInv_No = '${tvIcmMst.SALE_BOOK && tvIcmMst.SALE_DATE ? SaleDmsInv : null}',
            SInv_Date = '${tvIcmMst.SALE_BOOK && tvIcmMst.SALE_DATE ? tvIcmMst.SALE_DATE : null}'
       WHERE Chas_Id = ${ChasID[0][0].Chas_Id}`, { transaction: t });
            await sequelize.query(`INSERT INTO VAS_TEMP 
        (TRAN_ID, EXPORT_TYPE) 
        VALUES 
        (${Tran_Id}, 1)
        `, { transaction: t });
            const upi = await sequelize.query(`select UPI_ID,TRADE_NAME,GST_No from Godown_Mst where Godw_Code = '${tvIcmMst.LOC_CODE}' and Export_Type < 3`)
            const upi_id = upi[0][0].UPI_ID;
            const trade_name = upi[0][0].TRADE_NAME;
            const GST_No = upi[0][0].GST_No;
            const dataToEncode = `upi://pay?pa=${upi_id}&pn=${trade_name}&am=${parseFloat(tvIcmDtl.TTL_CTC)}&cu=INR&tn=InvNo:${SaleDmsInv},InvDt:${tvIcmMst.SALE_DATE},GSTIN:${GST_No},GSTAmt:${TtlGst}`;
            const qrCodeBuffer = await qrcode.toBuffer(dataToEncode);
            const qrCodeBase64 = qrCodeBuffer.toString('base64');
            const sqlQuery = `INSERT INTO B2C_QR (Tran_Id, B2CQR) VALUES (${Tran_Id}, '${qrCodeBase64}')`;
            await sequelize.query(sqlQuery, { transaction: t });
            console.log('QR code saved to database successfully!');
        } else {
            const { error: error1, value: tvData } = TvDataSchemaPurchase.validate(BodyData, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error1, 'error1')
            if (error1) {
                const errorMessage = error1.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                await TvIcmMst.update({ ...tvData.formData.TvIcmMst, DELV_STAT: 1, DELV_DATE: DELV_DATE, VIEW_FLAG: 4, Created_by: Created_by }, {
                    where: { UTD: tvData.formData.TvIcmMst.UTD }
                }, { transaction: t });

            }
        }
        await t.commit();
        const Message = 'Vehicle Delivered';
        res.status(200).send(Message);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.TvDashBoard = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const loc_code = req.body.multi_loc;
        const dateFrom = req.body.DATE_FROM;
        const dateTo = req.body.DATE_TO;
        if (loc_code == "" || loc_code == undefined || loc_code == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        const MonthWisePurchase = await sequelize.query(`
DECLARE @FinancialYearStart DATE, @FinancialYearEnd DATE;
SET @FinancialYearStart = DATEFROMPARTS(YEAR(GETDATE()) - CASE WHEN MONTH(GETDATE()) < 4 THEN 1 ELSE 0 END, 4, 1);
SET @FinancialYearEnd = DATEFROMPARTS(YEAR(GETDATE()) + CASE WHEN MONTH(GETDATE()) >= 4 THEN 1 ELSE 0 END, 3, 31);

SELECT
    DATENAME(MONTH, PUR_DATE) AS Month_Name,
    SUM(PURCHASE_COST) AS Total_Purchase_Cost,
    COUNT(*) AS total_number_of_purchases
FROM
    TV_ICM_MST
WHERE
    PUR_DATE >= @FinancialYearStart
    AND PUR_DATE <= @FinancialYearEnd
    AND LOC_CODE in (${loc_code})
GROUP BY
    DATENAME(MONTH, PUR_DATE)
ORDER BY
    MIN(MONTH(PUR_DATE));`);
        const MonthWiseSale = await sequelize.query(`DECLARE @FinancialYearStart DATE, @FinancialYearEnd DATE;
SET @FinancialYearStart = DATEFROMPARTS(YEAR(GETDATE()) - CASE WHEN MONTH(GETDATE()) < 4 THEN 1 ELSE 0 END, 4, 1);
SET @FinancialYearEnd = DATEFROMPARTS(YEAR(GETDATE()) + CASE WHEN MONTH(GETDATE()) >= 4 THEN 1 ELSE 0 END, 3, 31);
SELECT
    SUM(tid.SALE_INV_AMT) AS Monthwise_Total_CTC,
    DATENAME(MONTH, tim.SALE_DATE) AS Month_Name,
    COUNT(*) AS total_number_of_sale
FROM
    TV_ICM_MST tim
    JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
WHERE
    tim.SALE_DATE >= @FinancialYearStart
    AND tim.SALE_DATE <= @FinancialYearEnd
    AND tim.TV_SALE_INV is NOT NULL
    AND tim.LOC_CODE in (${loc_code})
GROUP BY
    MONTH(tim.SALE_DATE),
    DATENAME(MONTH, tim.SALE_DATE)`);
        const MonthWiseMargin = await sequelize.query(`DECLARE @FinancialYearStart DATE, @FinancialYearEnd DATE;
SET @FinancialYearStart = DATEFROMPARTS(YEAR(GETDATE()) - CASE WHEN MONTH(GETDATE()) < 4 THEN 1 ELSE 0 END, 4, 1);
SET @FinancialYearEnd = DATEFROMPARTS(YEAR(GETDATE()) + CASE WHEN MONTH(GETDATE()) >= 4 THEN 1 ELSE 0 END, 3, 31);
SELECT
    SUM(tid.TOTAL_MARGIN) AS Monthwise_Total_Margin,
    DATENAME(MONTH, tim.SALE_DATE) AS Month_Name
FROM
    TV_ICM_MST tim
    JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
WHERE
    tim.SALE_DATE >= @FinancialYearStart
    AND tim.SALE_DATE <= @FinancialYearEnd
    AND tim.LOC_CODE in (${loc_code})
GROUP BY
    MONTH(tim.SALE_DATE),
    DATENAME(MONTH, tim.SALE_DATE)`);
        const MonthWisePnL = await sequelize.query(`DECLARE @FinancialYearStart DATE, @FinancialYearEnd DATE;
SET @FinancialYearStart = DATEFROMPARTS(YEAR(GETDATE()) - CASE WHEN MONTH(GETDATE()) < 4 THEN 1 ELSE 0 END, 4, 1);
SET @FinancialYearEnd = DATEFROMPARTS(YEAR(GETDATE()) + CASE WHEN MONTH(GETDATE()) >= 4 THEN 1 ELSE 0 END, 3, 31);
SELECT
    SUM(tid.NET_PNL) AS Monthwise_Total_PNL,
    DATENAME(MONTH, tim.SALE_DATE) AS Month_Name
FROM
    TV_ICM_MST tim
    JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
WHERE
    tim.SALE_DATE >= @FinancialYearStart
    AND tim.SALE_DATE <= @FinancialYearEnd
    AND tim.LOC_CODE in (${loc_code})
GROUP BY
    MONTH(tim.SALE_DATE),
    DATENAME(MONTH, tim.SALE_DATE)`);
        const MonthWiseExp = await sequelize.query(`DECLARE @FinancialYearStart DATE, @FinancialYearEnd DATE;
SET @FinancialYearStart = DATEFROMPARTS(YEAR(GETDATE()) - CASE WHEN MONTH(GETDATE()) < 4 THEN 1 ELSE 0 END, 4, 1);
SET @FinancialYearEnd = DATEFROMPARTS(YEAR(GETDATE()) + CASE WHEN MONTH(GETDATE()) >= 4 THEN 1 ELSE 0 END, 3, 31);
SELECT
    SUM(
        COALESCE(tid.RF, 0) + 
        COALESCE(tid.PUR_MGA_EXP, 0) + 
        COALESCE(tid.PUR_INS_EXP, 0) + 
        COALESCE(tid.PUR_WARR_EXP, 0) + 
        COALESCE(tid.PUR_MNGMT_EXP, 0) + 
        COALESCE(tid.PUR_EXCH_EXP, 0) + 
        COALESCE(tid.PUR_FUEL_EXP, 0) + 
        COALESCE(tid.PUR_INTEREST_EXP, 0) + 
        COALESCE(tid.PUR_OTHER_EXP, 0)
    ) AS total_Exp,
    DATENAME(MONTH, tim.SALE_DATE) AS Month_Name
FROM
    TV_ICM_MST tim
    JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
WHERE
    tim.SALE_DATE >= @FinancialYearStart
    AND tim.SALE_DATE <= @FinancialYearEnd
    AND tim.LOC_CODE in (${loc_code})
GROUP BY
    MONTH(tim.SALE_DATE),
    DATENAME(MONTH, tim.SALE_DATE)`);
        const CurrMonthPur = await sequelize.query(`SELECT 
    SUM(PURCHASE_COST) AS total_purchase_amount,
    COUNT(*) AS total_number_of_purchases
FROM 
    TV_ICM_MST
WHERE 
    PUR_DATE BETWEEN '${dateFrom}' AND '${dateTo}'
    AND LOC_CODE in (${loc_code});`);
        const CurrMonthSale = await sequelize.query(`SELECT 
    SUM(tid.SALE_INV_AMT) AS total_sales_amount,
    COUNT(tid.SALE_INV_AMT) AS total_number_of_sales
FROM 
    TV_ICM_MST tim
JOIN 
    TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
WHERE 
    tim.SALE_DATE BETWEEN '${dateFrom}' AND '${dateTo}'
    AND tim.LOC_CODE in (${loc_code});`);
        const CurrMonthMargin = await sequelize.query(`SELECT 
    SUM(tid.TOTAL_MARGIN) AS total_Margin_amount,
    COUNT(*) AS total_number_of_sales
FROM 
    TV_ICM_MST tim
JOIN 
    TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
WHERE 
tim.SALE_DATE BETWEEN '${dateFrom}' AND '${dateTo}'
AND tim.LOC_CODE in (${loc_code});`);
        const TatData = await sequelize.query(`WITH DateRange AS (
    SELECT 
        CASE 
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) <= 0 THEN '0 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) BETWEEN 0 AND 30 THEN '0-30 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) BETWEEN 31 AND 60 THEN '31-60 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) BETWEEN 61 AND 90 THEN '61-90 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) > 90 THEN '+90 Days'
        END AS TatRange,
        COUNT(tim.VEHREGNO) AS VehicleCount
    FROM
        TV_ICM_MST tim
    JOIN
        TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
    WHERE 
 tim.LOC_CODE in (${loc_code})
        AND tim.DRD_ID_SALE IS NOT NULL
    GROUP BY 
        CASE 
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) <= 0 THEN '0 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) BETWEEN 0 AND 30 THEN '0-30 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) BETWEEN 31 AND 60 THEN '31-60 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) BETWEEN 61 AND 90 THEN '61-90 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) > 90 THEN '+90 Days'
        END
)
SELECT 
    TatRange,
    VehicleCount
FROM 
    DateRange
ORDER BY 
    CASE
        WHEN TatRange = '0 Days' THEN 1
        WHEN TatRange = '0-30 Days' THEN 2
        WHEN TatRange = '31-60 Days' THEN 3
        WHEN TatRange = '61-90 Days' THEN 4
        WHEN TatRange = '+90 Days' THEN 5
    END;
`);
        const AgeingData = await sequelize.query(`WITH DateRange AS (
    SELECT 
        CASE
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 0 AND 30 THEN '0-30 Days'    
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 31 AND 60 THEN '31-60 Days'   
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 61 AND 90 THEN '61-90 Days'   
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 91 AND 120 THEN '91-120 Days' 
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 121 AND 150 THEN '121-150 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 151 AND 180 THEN '151-180 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 181 AND 210 THEN '181-210 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 211 AND 240 THEN '211-240 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 241 AND 270 THEN '241-270 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 271 AND 300 THEN '271-300 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 301 AND 330 THEN '301-330 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 331 AND 360 THEN '331-360 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) > 360 THEN '+360 Days'
        END AS TatRange,
        COUNT(tim.VEHREGNO) AS VehicleCount
    FROM
        TV_ICM_MST tim
    JOIN
        TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
    WHERE
         tim.LOC_CODE IN (${loc_code})
        AND tim.DRD_ID_SALE IS NULL
    GROUP BY
        CASE
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 0 AND 30 THEN '0-30 Days'    
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 31 AND 60 THEN '31-60 Days'   
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 61 AND 90 THEN '61-90 Days'   
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 91 AND 120 THEN '91-120 Days' 
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 121 AND 150 THEN '121-150 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 151 AND 180 THEN '151-180 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 181 AND 210 THEN '181-210 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 211 AND 240 THEN '211-240 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 241 AND 270 THEN '241-270 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 271 AND 300 THEN '271-300 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 301 AND 330 THEN '301-330 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) BETWEEN 331 AND 360 THEN '331-360 Days'
            WHEN DATEDIFF(day, tim.PUR_DATE, GETDATE()) > 360 THEN '+360 Days'
        END
)
SELECT 
    TatRange,
    VehicleCount
FROM 
    DateRange
ORDER BY 
    CASE
        WHEN TatRange = '0-30 Days' THEN 1
        WHEN TatRange = '31-60 Days' THEN 2
        WHEN TatRange = '61-90 Days' THEN 3
        WHEN TatRange = '91-120 Days' THEN 4
        WHEN TatRange = '121-150 Days' THEN 5
        WHEN TatRange = '151-180 Days' THEN 6
        WHEN TatRange = '181-210 Days' THEN 7
        WHEN TatRange = '211-240 Days' THEN 8
        WHEN TatRange = '241-270 Days' THEN 9
        WHEN TatRange = '271-300 Days' THEN 10
        WHEN TatRange = '301-330 Days' THEN 11
        WHEN TatRange = '331-360 Days' THEN 12
        WHEN TatRange = '+360 Days' THEN 13
    END;`);
        const CurrMonthExp = await sequelize.query(`SELECT 
    SUM(
        COALESCE(tid.RF, 0) + 
        COALESCE(tid.PUR_MGA_EXP, 0) + 
        COALESCE(tid.PUR_INS_EXP, 0) + 
        COALESCE(tid.PUR_WARR_EXP, 0) + 
        COALESCE(tid.PUR_MNGMT_EXP, 0) + 
        COALESCE(tid.PUR_EXCH_EXP, 0) + 
        COALESCE(tid.PUR_FUEL_EXP, 0) + 
        COALESCE(tid.PUR_INTEREST_EXP, 0) + 
        COALESCE(tid.PUR_OTHER_EXP, 0)
    ) AS total_sum,
	COUNT(*) AS total_number_of_Pur
FROM 
    TV_ICM_MST tim
JOIN 
    TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
WHERE 
    tim.PUR_DATE BETWEEN '${dateFrom}' AND '${dateTo}'
    AND tim.LOC_CODE in (${loc_code})
`);
        const Opening = await sequelize.query(`select COUNT(*) AS Opening 
            FROM TV_ICM_MST WHERE  PUR_DATE < '${dateFrom}' 
            AND (SALE_DATE IS NULL OR SALE_DATE > '${dateFrom}')
            AND LOC_CODE in (${loc_code})`);
        const AveragePurCost = await sequelize.query(`SELECT 
    AVG(Purchase_Cost) AS AveragePurchaseCost,
    COUNT(*) AS RecordCount
FROM 
    TV_ICM_MST
WHERE PUR_DATE BETWEEN '${dateFrom}' AND '${dateTo}' AND LOC_CODE in (${loc_code})`);
        const AverageSaleCost = await sequelize.query(`SELECT 
    AVG(tid.SALE_INV_AMT) AS AverageSaleCost,
    COUNT(*) AS RecordCount
FROM
    TV_ICM_DTL tid
	JOIN TV_ICM_MST tim on tim.UTD = tid.TRAN_ID
	WHERE tim.PUR_DATE BETWEEN '${dateFrom}' AND '${dateTo}' AND tim.LOC_CODE in (${loc_code})`);
        const CurrentStock = await sequelize.query(`SELECT COUNT(drd.Tran_Id) As TotalStock
    FROM DMS_ROW_DATA drd
    JOIN CHAS_TRAN ct
    ON drd.Tran_Id = ct.Tran_Id
    JOIN CHAS_MST cm
    ON ct.Chas_Id = cm.Chas_Id
    LEFT JOIN TV_ICM_MST tim
        ON tim.DRD_ID = drd.Tran_Id
    WHERE tim.VIEW_FLAG = 1 AND drd.Loc_Code in (${loc_code})  AND drd.Export_Type <> 33 AND ct.Export_Type <> 33 AND  drd.Tran_Id IN (
        SELECT Tran_Id
        FROM CHAS_TRAN
        WHERE ITEM_TYPE = 3
        AND Export_Type < 5
        AND tran_type = 1
        AND chas_id NOT IN (
            SELECT chas_id
            FROM CHAS_TRAN
            WHERE ITEM_TYPE = 3
            AND Export_Type < 5
            AND tran_type = 2
        )
    );`);
        let data = {
            MonthWisePurchase,
            MonthWiseSale,
            MonthWiseMargin,
            CurrMonthPur,
            CurrMonthSale,
            CurrMonthMargin,
            MonthWiseExp,
            CurrMonthExp,
            Opening,
            TatData,
            CurrentStock,
            AveragePurCost,
            AverageSaleCost,
            MonthWisePnL,
            AgeingData
        };
        await sequelize.close();
        res.send({ success: true, data: data });
    } catch (err) {
        res.status(500).send("Error Occured While Fetching Data");

        console.log(err);
    } finally {
        await sequelize.close();

    }
};
exports.insertData = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData)

    const { error, value } = TvDataSchemaDms.validate(BodyData, {
        abortEarly: false,
        stripUnknown: true
    });
    const tvData = value;
    const Created_by = BodyData.Created_by;
    console.log(error, 'error')
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return res.status(400).send({ success: false, message: errorMessage });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();

        const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
        const TvIcmDtl = _TvIcmDtl(sequelize, DataTypes);
        try {
            const TvIcmMst1 = await TvIcmMst.create({ ...tvData.formData.TvIcmMst, Created_by: Created_by }, { transaction: t });
            const TvIcmDtl1 = await TvIcmDtl.create({ TRAN_ID: TvIcmMst1.UTD, ...tvData.formData.TvIcmDtl, Created_by: Created_by }, { transaction: t });
            await t.commit();
            res.send({ success: true, data: 'Data Saved' });
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
exports.UpdateData = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData)
    const { error, value: tvData } = TvDataSchemaDms.validate(BodyData, {
        abortEarly: false,
        stripUnknown: true
    });
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return res.status(400).send({ success: false, message: errorMessage });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        const TvIcmMst = _TvIcmMst(sequelize, DataTypes);
        const TvIcmDtl = _TvIcmDtl(sequelize, DataTypes);
        try {
            await TvIcmMst.update({ ...tvData.formData.TvIcmMst, Created_by: tvData.Created_by }, {
                where: { UTD: tvData.formData.TvIcmMst.UTD }
            }, { transaction: t });
            await TvIcmDtl.update({ ...tvData.formData.TvIcmDtl, Created_by: tvData.Created_by }, {
                where: { TRAN_ID: tvData.formData.TvIcmMst.UTD }
            }, { transaction: t });
            await t.commit();
            res.send({ success: true, data: 'Data Updated' });
        } catch (error) {
            console.log(error)
            res.send({ success: false, message: 'An error occurred while Updating Data', error });
            await t.rollback();
        } finally {
            await sequelize.close();
            console.log('Connection has been closed.');
        }
    }
};
exports.PurReport = async function (req, res) {
    try {
        const loc_code = req.body.Loc_Code;
        const userId = req.body.user_code;
        const dateFrom = req.body.DateFrom;
        const dateTo = req.body.DateTo;
        if (loc_code == "" || loc_code == undefined || loc_code == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        if (dateTo == "" || dateTo == undefined || dateTo == null) {
            return res.status(500).send({
                status: false,
                Message: "Date_to is mandatory",
            });
        }
        if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
            return res.status(500).send({
                status: false,
                Message: "dateFrom is mandatory",
            });
        }
        const sequelize = await dbname(req.headers.compcode);

        const data = await sequelize.query(`select tim.UTD AS aaaaaaaaaaa,(SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code  = tim.Seller_Name) AS LedgerName,
            (SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code  = tim.SALE_CUST_CODE) AS LedgerNameSale,
            (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.SALE_EXEC_NAME) AS DSENAME,    
            (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.PUR_EVAL_NAME) AS EvalName,    
            (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = tim.LOC_CODE) AS Location,
            FORMAT(tim.PUR_DATE, 'dd-MM-yyyy') AS PurDate,
            FORMAT(tim.SALE_DATE, 'dd-MM-yyyy') AS SaleDate,
            tim.*, tid.*,drd.*  from TV_ICM_MST tim
            JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
            JOIN DMS_ROW_DATA  drd on drd.Tran_Id = tim.DRD_ID
            AND tim.PUR_DATE BETWEEN '${dateFrom}' AND '${dateTo}'  AND drd.Export_Type <> 33`);
        await sequelize.close();
        res.status(200).send({ success: true, data: data[0] });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ success: "false", message: "Internal Server Error" });
    }
};
exports.StockReport = async function (req, res) {
    try {
        const loc_code = req.body.Loc_Code;
        const userId = req.body.user_code;
        const dateFrom = req.body.DateFrom;
        const dateTo = req.body.DateTo;
        if (loc_code == "" || loc_code == undefined || loc_code == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        if (dateTo == "" || dateTo == undefined || dateTo == null) {
            return res.status(500).send({
                status: false,
                Message: "Date_to is mandatory",
            });
        }
        if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
            return res.status(500).send({
                status: false,
                Message: "dateFrom is mandatory",
            });
        }
        const sequelize = await dbname(req.headers.compcode);

        const data = await sequelize.query(`select tim.UTD AS aaaaaaaaaaa,(SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code  = tim.Seller_Name) AS LedgerName,
            (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.SALE_EXEC_NAME) AS DSENAME,    
            (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.PUR_EVAL_NAME) AS EvalName,    
            (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = tim.LOC_CODE) AS Location,
            FORMAT(tim.PUR_DATE, 'dd-MM-yyyy') AS PurDate,
            DATEDIFF(day, tim.PUR_DATE, GETDATE()) AS AgeingInDays,
            tim.*, tid.*,drd.*  from TV_ICM_MST tim
            JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
            JOIN DMS_ROW_DATA  drd on drd.Tran_Id = tim.DRD_ID
            AND tim.PUR_DATE BETWEEN '${dateFrom}' AND '${dateTo}'  AND drd.Export_Type <> 33 AND tim.VIEW_FLAG = 1
            ORDER BY 
            AgeingInDays desc`);
        await sequelize.close();
        res.status(200).send({ success: true, data: data[0] });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ success: "false", message: "Internal Server Error" });
    }
};
exports.SaleReport = async function (req, res) {
    try {
        const loc_code = req.body.Loc_Code;
        const dateFrom = req.body.DateFrom;
        const dateTo = req.body.DateTo;
        if (loc_code == "" || loc_code == undefined || loc_code == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        if (dateTo == "" || dateTo == undefined || dateTo == null) {
            return res.status(500).send({
                status: false,
                Message: "Date_to is mandatory",
            });
        }
        if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
            return res.status(500).send({
                status: false,
                Message: "dateFrom is mandatory",
            });
        }
        const sequelize = await dbname(req.headers.compcode);

        const data = await sequelize.query(`SELECT tim.UTD AS aaaaaaaaaaa,(SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code  = tim.Seller_Name) AS LedgerName,
            (SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code  = tim.SALE_CUST_CODE) AS LedgerNameSale,
            (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.SALE_EXEC_NAME) AS DSENAME,    
            (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.PUR_EVAL_NAME) AS EvalName,    
            (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = tim.LOC_CODE) AS Location,
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.SALE_FINANCIER and Misc_Type = 8) AS FinancierName,
            FORMAT(tim.PUR_DATE, 'dd-MM-yyyy') AS PurDate,
            FORMAT(tim.SALE_DATE, 'dd-MM-yyyy') AS SaleDate,
            DATEDIFF(day, tim.PUR_DATE, tim.SALE_DATE) AS Tat,
            DATENAME(month, tim.SALE_DATE) AS SaleMonth,
            YEAR(tim.SALE_DATE) AS SaleYear,
            tim.*, tid.*,drd.*  from TV_ICM_MST tim
            JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
            JOIN DMS_ROW_DATA  drd on drd.Tran_Id = tim.DRD_ID_SALE
            AND tim.SALE_DATE BETWEEN '${dateFrom}' AND '${dateTo}'
            AND tim.TV_SALE_INV is NOT NULL AND drd.Export_Type <> 33`);
        await sequelize.close();
        res.status(200).send({ success: true, data: data[0] });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ success: "false", message: "Internal Server Error" });
    }
};
exports.IcmRegister = async function (req, res) {
    console.log('dfvesvsevsfv')
    try {
        const loc_code = req.body.Loc_Code;
        const dateFrom = req.body.DateFrom;
        const dateTo = req.body.DateTo;
        if (loc_code == "" || loc_code == undefined || loc_code == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        if (dateTo == "" || dateTo == undefined || dateTo == null) {
            return res.status(500).send({
                status: false,
                Message: "Date_to is mandatory",
            });
        }
        if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
            return res.status(500).send({
                status: false,
                Message: "dateFrom is mandatory",
            });
        }
        const sequelize = await dbname(req.headers.compcode);

        const data = await sequelize.query(`SELECT 
    tim.UTD AS aaaaaaaaaaa,(SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code  = tim.Seller_Name) AS LedgerName,
    (SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code  = tim.SALE_CUST_CODE) AS LedgerNameSale,
    (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.SALE_EXEC_NAME) AS DSENAME,    
    (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.PUR_EVAL_NAME) AS EvalName,    
    (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = tim.LOC_CODE) AS Location,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.PUR_BOOK AND Misc_Type = 56) AS PurBook,
    (SELECT TOP 1 Book_Name FROM Book_Mst WHERE Book_Code = tim.SALE_BOOK) AS SaleBook,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.SALE_CUST_CITY AND Misc_Type = 1) AS SaleCity,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.SALE_CUST_STATE AND Misc_Type = 3) AS SaleState,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.SALE_FINANCIER AND Misc_Type = 8) AS SaleFinancier,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.SALE_FIN_TYPE AND Misc_Type = 18) AS SaleFintype,
    FORMAT(tim.PUR_DATE, 'dd-MM-yyyy') AS PurDate,
    FORMAT(tim.SALE_DATE, 'dd-MM-yyyy') AS SaleDate,
    tim.*, 
    tid.*, 
    drd1.SGST, 
    drd1.CGST, 
    drd1.IGST, 
    drd1.Rnd_Off as RoundOffPur,
    drd2.Rnd_Off as RoundOffSale,
    drd2.SGST AS sgstSale, 
    drd2.CGST AS cgstSale, 
    drd2.IGST AS igstSale,
    drd2.Inv_Amt, drd2.Assessable_Rate, drd2.Taxable
FROM TV_ICM_MST tim
JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
JOIN TV_ICM_MST tim1 ON tim1.DRD_ID = tim.DRD_ID 
JOIN DMS_ROW_DATA drd1 ON tim1.DRD_ID = drd1.Tran_ID 
LEFT JOIN TV_ICM_MST tim2 ON tim2.DRD_ID_SALE = tim.DRD_ID_SALE
LEFT JOIN DMS_ROW_DATA drd2 ON tim2.DRD_ID_SALE = drd2.Tran_ID
WHERE tim.LOC_CODE in (${loc_code})
AND tim.Created_At BETWEEN '${dateFrom}' AND '${dateTo}' 
AND drd1.Export_Type <> 33; `);
        await sequelize.close();
        res.status(200).send({ success: true, data: data[0] });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ success: "false", message: "Internal Server Error" });
    }
};
exports.IcmRegisterNew = async function (req, res) {
    try {
        const loc_code = req.body.Loc_Code;
        const dateFrom = req.body.DateFrom;
        const dateTo = req.body.DateTo;
        if (loc_code == "" || loc_code == undefined || loc_code == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        if (dateTo == "" || dateTo == undefined || dateTo == null) {
            return res.status(500).send({
                status: false,
                Message: "Date_to is mandatory",
            });
        }
        if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
            return res.status(500).send({
                status: false,
                Message: "dateFrom is mandatory",
            });
        }
        const sequelize = await dbname(req.headers.compcode);

        const data = await sequelize.query(`SELECT 
    tim.UTD AS aaaaaaaaaaa,(SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code  = tim.Seller_Name) AS LedgerName,
    (SELECT TOP 1 Ledg_Name From Ledg_Mst WHERE Ledg_Code  = tim.SALE_CUST_CODE) AS LedgerNameSale,
    (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.SALE_EXEC_NAME) AS DSENAME,    
    (SELECT TOP 1 EMPFIRSTNAME From EMPLOYEEMASTER WHERE EMPCODE  = tim.PUR_EVAL_NAME) AS EvalName,    
    (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = tim.LOC_CODE) AS Location,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.PUR_BOOK AND Misc_Type = 56) AS PurBook,
    (SELECT TOP 1 Book_Name FROM Book_Mst WHERE Book_Code = tim.SALE_BOOK) AS SaleBook,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.SALE_CUST_CITY AND Misc_Type = 1) AS SaleCity,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.SALE_CUST_STATE AND Misc_Type = 3) AS SaleState,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.SALE_FINANCIER AND Misc_Type = 8) AS SaleFinancier,
    (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = tim.SALE_FIN_TYPE AND Misc_Type = 18) AS SaleFintype,
    FORMAT(tim.PUR_DATE, 'dd-MM-yyyy') AS PurDate,
    FORMAT(tim.SALE_DATE, 'dd-MM-yyyy') AS SaleDate,
    tim.*, 
    tid.*, 
    drd1.SGST, 
    drd1.CGST, 
    drd1.IGST, 
    drd1.Rnd_Off as RoundOffPur,
    drd2.Rnd_Off as RoundOffSale,
    drd2.SGST AS sgstSale, 
    drd2.CGST AS cgstSale, 
    drd2.IGST AS igstSale,
    drd2.Inv_Amt, drd2.Assessable_Rate, drd2.Taxable
FROM TV_ICM_MST tim
JOIN TV_ICM_DTL tid ON tim.UTD = tid.TRAN_ID
JOIN TV_ICM_MST tim1 ON tim1.DRD_ID = tim.DRD_ID 
JOIN DMS_ROW_DATA drd1 ON tim1.DRD_ID = drd1.Tran_ID 
LEFT JOIN TV_ICM_MST tim2 ON tim2.DRD_ID_SALE = tim.DRD_ID_SALE
LEFT JOIN DMS_ROW_DATA drd2 ON tim2.DRD_ID_SALE = drd2.Tran_ID
WHERE tim.LOC_CODE in (${loc_code})
AND tim.VIEW_FLAG = 4
AND tim.DELV_DATE BETWEEN '${dateFrom}' AND '${dateTo}' 
AND drd1.Export_Type <> 33 AND drd2.Export_Type <> 33;`);
        await sequelize.close();
        res.status(200).send({ success: true, data: data[0] });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ success: "false", message: "Internal Server Error" });
    }
};

exports.CancelSale = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();

    try {
        const UTD = req.body.UTD;
        const User_Code = req.body.User_Code;
        const CAN_RES = req.body.CAN_RES;
        const User_Name = req.body.User_Name;
        const Loc_Code = req.body.Loc_Code;
        const DRD_ID = await sequelize.query(`SELECT DRD_ID_SALE FROM TV_ICM_MST WHERE UTD = ${UTD}`);
        const id = DRD_ID[0][0].DRD_ID_SALE;
        const check = await sequelize.query(`SELECT IRN, Bill_Date FROM DMS_ROW_DATA WHERE Tran_Id = ${id}`);
        const chk = check[0][0].IRN;
        const chkDate = check[0][0].Bill_Date;
        const checkDateDb = await sequelize.query(`select GST_Lock_Date from user_tbl where User_Code = ${User_Code}`);
        const chkDateuser = checkDateDb[0][0].GST_Lock_Date;
        let flag = 0;
        if (!chk) {
            const currentDate = new Date();
            const savedate = new Date().toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            const thresholdDate = new Date(chkDateuser);
            const thresholdDate1 = new Date(chkDate);
            console.log(thresholdDate1)
            console.log(thresholdDate)
            // 2024-08-18T00:00:00.000Z > 2024-09-11T18:30:00.000Z
            if (thresholdDate < thresholdDate1) {
                await sequelize.query(`UPDATE TV_ICM_MST SET 
                    TV_SALE_INV = null,
                    DELV_STAT = null, 
                    DELV_DATE = null, 
                    Appr_1_Code = null,
                    Appr_1_Stat = null,
                    Appr_1_Rem = null,
                    Appr_2_Code = null,
                    Appr_2_Stat = null,
                    Appr_2_Rem = null,
                    Appr_3_Code = null,
                    Appr_3_Stat = null,
                    Appr_3_Rem = null, 
                    Fin_Appr = null, 
                    DRD_ID_SALE = null,
                    VERF_DATE = null,
                    VIEW_FLAG = 1
                    WHERE UTD = '${UTD}'`, { transaction: t });
                await sequelize.query(`UPDATE DMS_ROW_DATA SET Export_Type = 5,  IsCncl = 1, CANCEL_Date = GETDATE() WHERE Tran_Id = '${DRD_ID[0][0].DRD_ID_SALE}'`, { transaction: t });
                // const ChasId = await sequelize.query(`select Chas_Id from CHAS_MST WHERE Sale_Id ='${DRD_ID[0][0].DRD_ID_SALE}'`)
                // await sequelize.query(`UPDATE chas_tran SET Export_Type = 5 WHERE Chas_Id = '${ChasId[0][0].Chas_Id}' AND TRAN_TYPE = 2`, { transaction: t });
                // await sequelize.query(`UPDATE CHAS_MST SET Sale_Id =  null,
                // SInv_No = null,
                // SInv_Date = null WHERE Sale_Id ='${DRD_ID[0][0].DRD_ID_SALE}'`, { transaction: t });
                await sequelize.query(`INSERT INTO CANCEL_HST 
                (ACNT_ID, Narration, User_Code, User_Name,Date_Time, Loc_Code, Export_Type, DRD_ID)
                values (null,'${CAN_RES}',${User_Code} ,'${User_Name}','${savedate}',${Loc_Code},5,${DRD_ID[0][0].DRD_ID_SALE})`, { transaction: t });
                await sequelize.query(`INSERT INTO VAS_TEMP (TRAN_ID, EXPORT_TYPE) values('${id}', 5)`, { transaction: t });
                flag = 1;
            }
            else {
                flag = 3
            }
        }
        await t.commit();
        res.send({ Cancelled: flag });
    }
    catch (e) {
        console.log(e);
        await t.rollback();
    }
    finally {
        await sequelize.close();
    }
};

exports.DeliveredDMs = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const TvIcmMst = await sequelize.query(`SELECT (SELECT TOP 1 Ledg_Name 
            FROM Ledg_Mst WHERE Ledg_Code = TIM.SALE_CUST_CODE) AS CUSTOMERNAME, 
            FORMAT(TIM.DELV_DATE, 'dd-MM-yyyy') AS DeliveryDate,
            TIM.*,TID.TTL_CTC FROM 
            TV_ICM_MST TIM JOIN TV_ICM_DTL TID ON TIM.UTD = TID.TRAN_ID WHERE 
            TIM.LOC_CODE = ${multi_loc} AND DELV_STAT = 1`)
        res.send(TvIcmMst[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error Occurred While Fetching Data");
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.CreateNewLedgerOldCar = async function (req, res) {
    const LedgData = req.body;
    const sequelize = await dbname(req.headers.compcode);
    console.log(LedgData, 'hjgjgyvkgkgv')
    const bodyLedgNameUpper = LedgData.Ledg_Name.toUpperCase().trim();
    let Ledg_Code = null;
    const result =
        await sequelize.query(`SELECT Ledg_Code 
      FROM Ledg_Mst 
      WHERE Loc_code = '1' 
      AND Export_Type < 3 
      AND (LTRIM(RTRIM(Ledg_Name))) = '${bodyLedgNameUpper}'`);
    if (result[0].length > 0) {
        Ledg_Code = result[0][0].Ledg_Code;
        res.status(200).send({ message: "Ledger Account Already Exist", Ledg_Code: Ledg_Code })
        return;
    }
    const t = await sequelize.transaction();
    try {
        const MaxLedgCode = await sequelize.query(`SELECT isnull(max(Ledg_Code)+1,1) AS LedgCode from Ledg_Mst`, { transaction: t });
        Ledg_Code = MaxLedgCode[0][0]?.LedgCode;
        await sequelize.query(`INSERT INTO Ledg_Mst (
    Ledg_Code,
    Ledg_Class, 
    Ledg_Name, 
    Group_Code, 
    Loc_code, 
    Post_Branch, 
    State_Code, 
    Export_Type, 
    ENTR_PC,
    ServerId,
    ENTR_USER
) VALUES (
    ${Ledg_Code}, 
    29, 
    ${LedgData.Ledg_Name ? `'${LedgData.Ledg_Name}'` : null}, 
    59, 
    ${LedgData.Loc_code ? LedgData.Loc_code : null}, 
    ${LedgData.Loc_code ? `'${LedgData.Loc_code}'` : null},  
    0, 
    1, 
    'CLOUD-${LedgData.Created_By}',
    3,
    ${LedgData.ENTR_USER ? `'${LedgData.ENTR_USER}'` : null});`,
            { transaction: t });
        await t.commit();
        res.status(200).send({ success: true, message: 'Ledger Saved', Ledg_Code });
    } catch (error) {
        await t.rollback();
        console.log(error)
        res.status(500).send({ success: false, message: 'An error occurred while Saving Data', error, icon: 'warning' });
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.UpdateLastOffer = async function (req, res) {
    const BodyData = req.body;
    const sequelize = await dbname(req.headers.compcode);
    console.log(BodyData, 'hjgjgyvkgkgv')
    const t = await sequelize.transaction();
    const TvOffPr = _TvOffPr(sequelize, DataTypes);
    try {
        await TvOffPr.create({ ...BodyData }, { transaction: t });
        await t.commit();
        res.status(200).send({ success: true, message: 'last Offered Price Updated' });
    } catch (error) {
        await t.rollback();
        console.log(error)
        res.status(500).send({ success: false, message: 'An error occurred while updating price', error, icon: 'warning' });
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};

exports.TVAuditSave = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = JSON.parse(req.body.body);
        const data = await sequelize.query(`SELECT * from TV_ICM_MST WHERE UTD = ${BodyData.UTD}`)
        const { error, value: TVData } = tvAuditSchema.validate(data[0][0], {
            abortEarly: false,
            stripUnknown: true,
        });
        console.log(error, 'error')
        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            const t = await sequelize.transaction();
            const TvAudit = _TvAudit(sequelize, DataTypes);
            try {
                const id = await TvAudit.create(
                    { ...TVData, PUR_DATE: TVData.PUR_DATE.toString().slice(0, 10), AGEING: BodyData.AGEING, AUDIT_STATUS: BodyData.AUDIT_STATUS, AUDIT_REMARK: BodyData.AUDIT_REMARK, ICM_ID: BodyData.UTD, Created_by: BodyData.EMPCODE },
                    { transaction: t }
                );
                if (req.files.length > 0) {
                    const EMP_DOCS_data = await uploadImagesTravel1(
                        req.files,
                        req.headers?.compcode?.split("-")[0],
                        BodyData.EMPCODE,
                    );
                    const values = EMP_DOCS_data.map((doc, index) => (
                        `('TVAUDIT', '${BodyData.UTD}', ${index + 1}, '${doc.DOC_PATH}', '${doc.DOC_NAME}', '${BodyData.EMPCODE}', CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), '1')`
                    )).join(',');
                    const query = `
                        INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
                        VALUES ${values}
                    `;
                    await sequelize.query(query);
                } else {
                    console.error(`No Images Found`);
                }
                await t.commit();
                res.status(200).send({ Status: "true", Message: "Data Saved", UTD: id.UTD });
            }
            catch (error) {
                console.log(error)
                res.status(500).send({
                    success: false,
                    message: "An error occurred while creating Master",
                    error,
                });
                await t.rollback();
            }
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while creating Master",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};

exports.PurEnqSave = async function (req, res) {
    const BodyData = req.body;
    const tvIcmMst = BodyData.formData.TvIcmMst;
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const TvDo = _TvDo(sequelize, DataTypes);
    console.log(BodyData)
    try {
        const [
            CheckChassis,
            CheckEngine,
            CheckVehRegNo,
        ] = await Promise.all([
            sequelize.query(`select * FROM Chas_Mst WHERE Chas_No = '${tvIcmMst.CHAS_NO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
            sequelize.query(`select * FROM Chas_Mst WHERE Eng_No = '${tvIcmMst.ENGINE_NO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
            sequelize.query(`select * FROM Chas_Mst WHERE Reg_No = '${tvIcmMst.VEHREGNO}' AND YEAR(PInv_Date) = YEAR(GETDATE()) AND MONTH(PInv_Date) > 3;`),
        ]);
        const [
            CheckChassisICM,
            CheckEngineICM,
            CheckVehRegNoICM,
        ] = await Promise.all([
            sequelize.query(`select * FROM TV_ICM_MST WHERE CHAS_NO = '${tvIcmMst.CHAS_NO}' AND YEAR(PUR_DATE) = YEAR(GETDATE()) AND MONTH(PUR_DATE) > 3;`),
            sequelize.query(`select * FROM TV_ICM_MST WHERE ENGINE_NO = '${tvIcmMst.ENGINE_NO}' AND YEAR(PUR_DATE) = YEAR(GETDATE()) AND MONTH(PUR_DATE) > 3;`),
            sequelize.query(`select * FROM TV_ICM_MST WHERE VEHREGNO = '${tvIcmMst.VEHREGNO}' AND YEAR(PUR_DATE) = YEAR(GETDATE()) AND MONTH(PUR_DATE) > 3;`),
        ]);
        const [
            CheckChassisDo,
            CheckEngineDo,
            CheckVehRegNoDo,
        ] = await Promise.all([
            sequelize.query(`select * FROM TV_DO WHERE CHAS_NO = '${tvIcmMst.CHAS_NO}'`),
            sequelize.query(`select * FROM TV_DO WHERE ENGINE_NO = '${tvIcmMst.ENGINE_NO}'`),
            sequelize.query(`select * FROM TV_DO WHERE VEHREGNO = '${tvIcmMst.VEHREGNO}'`),
        ]);
        if (CheckChassis[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Chassis No. Found" });
        }
        if (CheckEngine[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Engine No. Found" });
        }
        if (CheckVehRegNo[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Registration No. Found" });
        }
        if (CheckChassisICM[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Chassis No. Found" });
        }
        if (CheckEngineICM[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Engine No. Found" });
        }
        if (CheckVehRegNoICM[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Registration No. Found" });
        }
        if (CheckChassisDo[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Chassis No. Found" });
        }
        if (CheckEngineDo[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Engine No. Found" });
        }
        if (CheckVehRegNoDo[0].length > 0) {
            return res.status(201).send({ success: true, message: "Duplicate Registration No. Found" });
        }


        const { error: error1, value: tvData } = TvDoSchema.validate(BodyData.formData.TvIcmMst, {
            abortEarly: false,
            stripUnknown: true
        });
        console.log(error1, 'error1')
        if (error1) {
            const errorMessage = error1.details.map(err => err.message).join(', ');
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            await TvDo.create({ ...tvData, Created_by: BodyData.formData.Created_by, Export_Type: 0 }, { transaction: t });
        }

        await t.commit();
        res.status(200).send({ success: true, message: "Purchase Data Saved....!" });

    } catch (error) {
        console.log(error)
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

exports.PurEnqUpdate = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData)
    const tvIcmMst = BodyData.formData.TvIcmMst;
    const sequelize = await dbname(req.headers.compcode);

    const t = await sequelize.transaction();
    const TvDo = _TvDo(sequelize, DataTypes);
    try {
        if (tvIcmMst.UTD) {
            const { error, value: tvData } = TvDoSchema.validate(BodyData.formData.TvIcmMst, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error, 'error')
            if (error) {
                const errorMessage = error.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                await TvDo.update({ ...tvData, Created_by: BodyData.formData.Created_by }, {
                    where: { UTD: tvIcmMst.UTD }
                }, { transaction: t });

            }
        }
        await t.commit();
        res.status(200).send({ success: true, message: "Data Saved....!" });
    } catch (error) {
        console.log(error)
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

exports.sendVerification = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData)
    const tvIcmMst = BodyData.formData.TvIcmMst;
    const sequelize = await dbname(req.headers.compcode);

    const t = await sequelize.transaction();
    const TvDo = _TvDo(sequelize, DataTypes);
    try {
        if (tvIcmMst.UTD) {
            const a = await sequelize.query(
                `SELECT * FROM TV_DO WHERE UTD = ${tvIcmMst.UTD}`);
            const branch = await sequelize.query(
                `select Godw_Name from GODOWN_MST where Godw_Code in (${BodyData.formData.TvIcmMst.LOC_CODE})  and export_type<3`
            );
            const comapny = await sequelize.query(`select comp_name from comp_mst `);
            const mobile_no1 = await sequelize.query(
                `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 Approver_1A from Expense_Approval_Matrix where module='tv') AND Export_Type < 3`
            );
            const mobile_no2 = await sequelize.query(
                `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 Approver_1B from Expense_Approval_Matrix where module='tv' AND Export_Type < 3)`
            );
            const mobile_no3 = await sequelize.query(
                `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 Approver_1C from Expense_Approval_Matrix where module='tv' AND Export_Type < 3)`
            );
            const CreateBy = await sequelize.query(
                `select  User_Name from USER_TBL where User_Code = '${BodyData.User_Code}'`
            );
            console.log(a)
            const { error, value: tvData } = TvDoSchema.validate(tvIcmMst, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error, 'error')
            if (error) {
                const errorMessage = error.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                await TvDo.update({ APPR_21_STAT: 5, Created_by: BodyData.formData.Created_by }, {
                    where: { UTD: tvIcmMst.UTD }
                }, { transaction: t });

                await SendWhatsAppMessgae(req.headers.compcode, mobile_no1[0][0]?.User_mob, "tv_appr_msg", [
                    {
                        type: "text",
                        text: CreateBy[0][0].User_Name,
                    },
                    {
                        type: "text",
                        text: a[0][0]?.VEHREGNO,
                    },
                    {
                        type: "text",
                        text: a[0][0]?.CHAS_NO,
                    },
                    {
                        type: "text",
                        text: branch[0][0]?.Godw_Name,
                    },
                    {
                        type: "text",
                        text: comapny[0][0]?.comp_name,
                    },
                    {
                        type: "text",
                        text: `https://erp.autovyn.com/autovyn/truevalue/approverPurchase`,
                    },
                ]);
                await SendWhatsAppMessgae(req.headers.compcode, mobile_no2[0][0]?.User_mob, "tv_appr_msg", [
                    {
                        type: "text",
                        text: CreateBy[0][0].User_Name,
                    },
                    {
                        type: "text",
                        text: a[0][0]?.VEHREGNO,
                    },
                    {
                        type: "text",
                        text: a[0][0]?.CHAS_NO,
                    },
                    {
                        type: "text",
                        text: branch[0][0]?.Godw_Name,
                    },
                    {
                        type: "text",
                        text: comapny[0][0]?.comp_name,
                    },
                    {
                        type: "text",
                        text: `https://erp.autovyn.com/autovyn/truevalue/approverPurchase`,
                    },
                ]);
                await SendWhatsAppMessgae(req.headers.compcode, mobile_no3[0][0]?.User_mob, "tv_appr_msg", [
                    {
                        type: "text",
                        text: CreateBy[0][0].User_Name,
                    },
                    {
                        type: "text",
                        text: a[0][0]?.VEHREGNO,
                    },
                    {
                        type: "text",
                        text: a[0][0]?.CHAS_NO,
                    },
                    {
                        type: "text",
                        text: branch[0][0]?.Godw_Name,
                    },
                    {
                        type: "text",
                        text: comapny[0][0]?.comp_name,
                    },
                    {
                        type: "text",
                        text: `https://erp.autovyn.com/autovyn/truevalue/approverPurchase`,
                    },
                ]);
            }
        }
        await t.commit();
        res.status(200).send({ success: true, message: "Data Saved....!" });
    } catch (error) {
        console.log(error)
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
exports.PurchaseEnquiryData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const dateFrom = req.body.dateFrom;
        const dateto = req.body.dateto;
        const multi_loc = req.body.multi_loc;

        const data = await sequelize.query(`SELECT * from TV_DO WHERE LOC_CODE in (${multi_loc})
  AND Created_At BETWEEN '${dateFrom} 00:00:00.000' AND '${dateto} 23:59:59.999'`);
        res.status(200).send(data);
    }
    catch (err) {
        console.error(err);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.TvApprViewPurchase = async function (req, res) {
    try {
        const loc_code = req.body.loc_code;
        const userId = req.body.user_code;
        const dateFrom = req.body.dateFrom;
        const dateTo = req.body.dateTo;
        const STATUS = req.body.STATUS;
        console.log(STATUS, 'STATUS')
        if (userId == "" || userId == undefined || userId == null) {
            return res.status(500).send({
                status: false,
                Message: "user_code is mandatory",
            });
        }
        if (loc_code == "" || loc_code == undefined || loc_code == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        // if (dateTo == "" || dateTo == undefined || dateTo == null) {
        //     return res.status(500).send({
        //         status: false,
        //         Message: "Date_to is mandatory",
        //     });
        // }
        // if (dateFrom == "" || dateFrom == undefined || dateFrom == null) {
        //     return res.status(500).send({
        //         status: false,
        //         Message: "dateFrom is mandatory",
        //     });
        // }
        const sequelize = await dbname(req.headers.compcode);
        const a = await sequelize.query(
            `SELECT top 1 * from Expense_Approval_Matrix where Branch_Code  = '${loc_code}' AND module ='tvp'`);

        let ApprovalLevel = 0;
        let Final_apprvl = 0;
        const Approver_1A = a[0][0]?.Approver_1A;
        const Approver_1B = a[0][0]?.Approver_1B;
        const Approver_1C = a[0][0]?.Approver_1C;
        const Approver_2A = a[0][0]?.Approver_2A;
        const Approver_2B = a[0][0]?.Approver_2B;
        const Approver_2C = a[0][0]?.Approver_2C;
        const Approver_3A = a[0][0]?.Approver_3A;
        const Approver_3B = a[0][0]?.Approver_3B;
        const Approver_3C = a[0][0]?.Approver_3C;
        let ApproverCode = "";
        let ApproverStatus = "";
        if (Approver_1A == userId || Approver_1B == userId || Approver_1C == userId) {
            ApprovalLevel = 1;
            ApproverCode = "APPR_21_CODE"
            ApproverStatus = "APPR_21_STAT"
        } else if (Approver_2A == userId || Approver_2B == userId || Approver_2C == userId) {
            ApprovalLevel = 2;
            ApproverCode = "APPR_22_CODE"
            ApproverStatus = "APPR_22_STAT"
        } else if (Approver_3A == userId || Approver_3B == userId || Approver_3C == userId) {
            ApprovalLevel = 3;
            ApproverCode = "APPR_23_CODE"
            ApproverStatus = "APPR_23_STAT"
        }
        if (ApprovalLevel == 2 && !a[0][0].Approver_3A && !a[0][0].Approver_3B && !a[0][0].Approver_3C) {
            Final_apprvl = 1;
        } else if (ApprovalLevel == 1 && !a[0][0].Approver_2A && !a[0][0].Approver_2B && !a[0][0].Approver_2C) {
            Final_apprvl = 1;
        }
        if (ApprovalLevel == 0) {
            return res.status(200).send({
                status: false,
                Message: "you are not the right person to approve this",
            });
        }
        let data
        if (STATUS == 1 || STATUS == "") {
            data = await sequelize.query(`SELECT 
    tim.UTD AS Srno,
    tim.CHAS_NO, tim.ENGINE_NO, tim.VEHREGNO, tim.APPR_21_CODE, tim.APPR_22_CODE,
    tim.APPR_23_CODE,  tim.APPR_21_STAT, tim.APPR_22_STAT, tim.APPR_23_STAT, tim.*,
    (CASE 
        WHEN ${userId} IN (Expense_Approval_Matrix.Approver_1A, Expense_Approval_Matrix.Approver_1B, Expense_Approval_Matrix.Approver_1C) THEN 
            CASE 
                WHEN tim.APPR_21_STAT IS NULL THEN 'Pending'
                WHEN tim.APPR_21_STAT = 0 THEN 'Rejected'
                WHEN tim.APPR_21_STAT = 1 THEN 'Approved'
                ELSE ''
            END
        ELSE ''
    END) AS Appr1_Status,
    (CASE 
        WHEN ${userId} IN (Expense_Approval_Matrix.Approver_2A, Expense_Approval_Matrix.Approver_2B, Expense_Approval_Matrix.Approver_2C) THEN 
            CASE 
                WHEN tim.APPR_22_STAT IS NULL THEN 'Pending'
                WHEN tim.APPR_22_STAT = 0 THEN 'Rejected'
                WHEN tim.APPR_22_STAT = 1 THEN 'Approved'
                ELSE ''
            END
        ELSE ''
    END) AS Appr2_Status,
    (CASE 
        WHEN ${userId} IN (Expense_Approval_Matrix.Approver_3A, Expense_Approval_Matrix.Approver_3B, Expense_Approval_Matrix.Approver_3C) THEN 
            CASE 
                WHEN tim.APPR_23_STAT IS NULL THEN 'Pending'
                WHEN tim.APPR_23_STAT = 0 THEN 'Rejected'
                WHEN tim.APPR_23_STAT = 1 THEN 'Approved'
                ELSE ''
            END
        ELSE ''
    END) AS Appr3_Status
    FROM 
        TV_DO tim 
    JOIN 
        Expense_Approval_Matrix 
    ON 
        Expense_Approval_Matrix.module = 'tvp'
    WHERE 
      (
    (${userId} IN (Expense_Approval_Matrix.Approver_1A, Expense_Approval_Matrix.Approver_1B, Expense_Approval_Matrix.Approver_1C) AND tim.APPR_21_STAT = 5 AND tim.FIN_APPR_2 is NULL)
    OR (${userId} IN (Expense_Approval_Matrix.Approver_2A, Expense_Approval_Matrix.Approver_2B, Expense_Approval_Matrix.Approver_2C) AND tim.APPR_21_STAT = 1 AND tim.APPR_22_STAT IS NULL AND tim.FIN_APPR_2 is NULL)
            OR (${userId} IN (Expense_Approval_Matrix.Approver_3A, Expense_Approval_Matrix.Approver_3B, Expense_Approval_Matrix.Approver_3C) AND tim.APPR_21_STAT = 1 AND tim.APPR_22_STAT = 1 AND tim.APPR_23_STAT IS NULL AND tim.FIN_APPR_2 is NULL));`);
        } else if (STATUS == 2) {
            data = await sequelize.query(`select  tim.UTD AS Srno,
    * from TV_ICM_MST tim JOIN TV_ICM_DTL tid 
                ON tim.UTD = tid.TRAN_ID WHERE ${ApproverCode} = '${userId}' AND ${ApproverStatus} = 1`);
        } else if (STATUS == 3) {
            data = await sequelize.query(`select  tim.UTD AS Srno,
    * from TV_ICM_MST tim JOIN TV_ICM_DTL tid 
                ON tim.UTD = tid.TRAN_ID WHERE ${ApproverCode} = '${userId}' AND ${ApproverStatus} = 0`);
        }
        await sequelize.close();
        res.status(200).send({ success: true, data: data[0] });
    } catch (e) {
        console.log(e);
        return res
            .status(500)
            .send({ success: "false", message: "Internal Server Error" });
    }
};
exports.TvViewDo = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body)
        const UTD = req.body.UTD ? req.body.UTD : '';
        const multi_loc = req.body.multi_loc;
        const TvDo = _TvDo(sequelize, DataTypes);
        let data = [];
        if (UTD) {
            const a = await sequelize.query(`SELECT CONVERT(VARCHAR, Created_At, 103) as DoDate,UTD AS DoNo,* FROM TV_DO WHERE UTD = ${UTD} AND LOC_CODE = ${multi_loc}`);

            data = {
                TvIcmMst: a[0][0]
            }
        }

        console.log(data)
        res.status(200).send(data);
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Error Occured While Fetching Data");
    }
    finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};
exports.ApproveTvPurchase = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        const bodyData = req.body;
        const LOC_CODE = req.body.loc_code;
        const userId = req.body.user_code;
        const UTD = req.body.UTD;
        const REMARK = req.body.REMARK;
        const currentDate = new Date();
        const ENTR_DATE = currentDate.toISOString().split('T')[0];
        if (userId == "" || userId == undefined || userId == null) {
            return res.status(500).send({
                status: false,
                Message: "user_code is mandatory",
            });
        }
        if (LOC_CODE == "" || LOC_CODE == undefined || LOC_CODE == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        if (req.body.UTD == "" || req.body.UTD == undefined || req.body.UTD == null) {
            return res.status(500).send({
                status: false,
                Message: "UTD is mandatory",
            });
        }
        try {

            const a = await sequelize.query(
                `SELECT top 1 * from Expense_Approval_Matrix where Branch_Code  = '${LOC_CODE}' AND module ='tvp'`);
            const CreateBy = await sequelize.query(
                `select  User_Name from USER_TBL where User_Code = '${userId}'`);

            const branch = await sequelize.query(
                `select Godw_Name from GODOWN_MST where Godw_Code in (${LOC_CODE})  and export_type<3`);
            const comapny = await sequelize.query(`select comp_name from comp_mst `);
            let ApprovalLevel = 0;
            let Final_apprvl = 0;
            let rowsAffected = 0;
            const Approver_1A = a[0][0]?.Approver_1A;
            const Approver_1B = a[0][0]?.Approver_1B;
            const Approver_1C = a[0][0]?.Approver_1C;
            const Approver_2A = a[0][0]?.Approver_2A;
            const Approver_2B = a[0][0]?.Approver_2B;
            const Approver_2C = a[0][0]?.Approver_2C;
            const Approver_3A = a[0][0]?.Approver_3A;
            const Approver_3B = a[0][0]?.Approver_3B;
            const Approver_3C = a[0][0]?.Approver_3C;
            let MsgUserId = "";
            if (Approver_1A == userId || Approver_1B == userId || Approver_1C == userId) {
                ApprovalLevel = 1;
                MsgUserId = "Approver_2A"
            } else if (Approver_2A == userId || Approver_2B == userId || Approver_2C == userId) {
                ApprovalLevel = 2;
                MsgUserId = "Approver_3A"
            } else if (Approver_3A == userId || Approver_3B == userId || Approver_3C == userId) {
                ApprovalLevel = 3;
            }
            if (ApprovalLevel == 2 && !a[0][0].Approver_3A && !a[0][0].Approver_3B && !a[0][0].Approver_3C) {
                Final_apprvl = 1;
            } else if (ApprovalLevel == 1 && !a[0][0].Approver_2A && !a[0][0].Approver_2B && !a[0][0].Approver_2C) {
                Final_apprvl = 1;
            }
            console.log(ApprovalLevel)
            console.log(Final_apprvl)
            if (ApprovalLevel == 0) {
                return res.status(200).send({
                    status: false,
                    Message: "you are not the right person to approve this",
                });
            }
            const TvApproval = _TvDo(sequelize, DataTypes);
            if (ApprovalLevel === 1) {
                const data = { APPR_21_CODE: userId, APPR_21_STAT: 1, APPR_21_REM: REMARK, FIN_APPR_2: Final_apprvl == 1 ? 1 : null, Export_Type: Final_apprvl == 1 ? 1 : 0, VERF_DATE_2: Final_apprvl == 1 ? ENTR_DATE : null }
                console.log(data, 'data')
                console.log(UTD, 'UTD')
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    { where: { UTD: UTD, APPR_21_STAT: 5, FIN_APPR_2: null } },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
                const mobile_no = await sequelize.query(
                    `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 ${MsgUserId} from Expense_Approval_Matrix where module='tvp')`,
                    { transaction: t }
                );
                // await SendWhatsAppMessgae(req.headers.compcode, mobile_no[0][0]?.User_mob, "tv_appr_msg", [
                //     {
                //         type: "text",
                //         text: CreateBy[0][0].User_Name,
                //     },
                //     {
                //         type: "text",
                //         text: b[0][0]?.VEHREGNO,
                //     },
                //     {
                //         type: "text",
                //         text: b[0][0]?.CHAS_NO,
                //     },
                //     {
                //         type: "text",
                //         text: branch[0][0]?.Godw_Name,
                //     },
                //     {
                //         type: "text",
                //         text: comapny[0][0]?.comp_name,
                //     },
                //     {
                //         type: "text",
                //         text: `https://erp.autovyn.com/autovyn/truevalue/approver`,
                //     },
                // ]);
            }
            else if (ApprovalLevel === 2) {
                const data = { APPR_22_CODE: userId, APPR_22_STAT: 1, APPR_22_REM: REMARK, FIN_APPR_2: Final_apprvl == 1 ? 1 : null, Export_Type: Final_apprvl == 1 ? 1 : 0, VERF_DATE_2: Final_apprvl == 1 ? ENTR_DATE : null }
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    {
                        where: {
                            UTD: UTD,
                            APPR_21_CODE: { [Sequelize.Op.not]: null },
                            APPR_22_STAT: null,
                            FIN_APPR_2: null
                        }
                    },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
                const mobile_no3 = await sequelize.query(
                    `select User_mob, User_Name from USER_TBL where User_Code = (select top 1 ${Approver_3A} from Expense_Approval_Matrix where module='tvp')`,
                    { transaction: t }
                );
                // await SendWhatsAppMessgae(req.headers.compcode, mobile_no3[0][0]?.User_mob, "tv_appr_msg", [
                //     {
                //         type: "text",
                //         text: CreateBy[0][0].User_Name,
                //     },
                //     {
                //         type: "text",
                //         text: b[0][0]?.VEHREGNO,
                //     },
                //     {
                //         type: "text",
                //         text: b[0][0]?.CHAS_NO,
                //     },
                //     {
                //         type: "text",
                //         text: branch[0][0]?.Godw_Name,
                //     },
                //     {
                //         type: "text",
                //         text: comapny[0][0]?.comp_name,
                //     },
                //     {
                //         type: "text",
                //         text: `https://erp.autovyn.com/autovyn/truevalue/approver`,
                //     },
                // ]);
            }
            else if (ApprovalLevel === 3) {
                Final_apprvl = 1;
                const data = { APPR_23_CODE: userId, APPR_23_STAT: 1, APPR_23_REM: REMARK, FIN_APPR_2: 1, Export_Type: 1, VERF_DATE_2: ENTR_DATE }
                console.log(data, 'fgvefv')
                console.log(UTD, 'UTD')
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    {
                        where:
                        {
                            UTD: UTD,
                            APPR_22_STAT: { [Sequelize.Op.not]: null },
                            APPR_23_STAT: null,
                            FIN_APPR_2: null
                        }
                    },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
            }
            // if (Final_apprvl === 1) {

            //     await SendWhatsAppMessgae(req.headers.compcode, b[0][0]?.SALE_CUST_MOB, "tv_cust_delv", [
            //         {
            //             type: "text",
            //             text: b[0][0] ? b[0][0]?.CustomerName ? ,
            //         },
            //         {
            //             type: "text",
            //             text: branch[0][0]?.Godw_Name,
            //         },
            //         {
            //             type: "text",
            //             text: comapny[0][0]?.comp_name,
            //         },
            //     ]);
            // }
            t.commit();
            if (rowsAffected == 0) {
                return res.status(200).send({ success: true, Message: 'Can Not Approve' });
            }
            if (Final_apprvl == 1) {
                return res.status(200).send({ success: true, Message: 'Final Approval Done' });
            }
            if (ApprovalLevel == 1) {
                return res.status(200).send({ success: true, Message: 'Approved on level 1' });
            }
            if (ApprovalLevel == 2) {
                return res.status(200).send({ success: true, Message: 'Approved on level 2' });
            }
            if (ApprovalLevel == 3) {
                return res.status(200).send({ success: true, Message: 'Approved on level 3' });
            }
        } catch (e) {
            console.log(e);
            t.rollback();
            return res.status(500).send({ status: false, Message: "Internal Server Error", });
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
};
exports.RejectTvPurchase = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        const bodyData = req.body;
        const LOC_CODE = req.body.loc_code;
        const userId = req.body.user_code;
        const UTD = req.body.UTD;
        const REMARK = req.body.REMARK;
        const currentDate = new Date();
        const ENTR_DATE = currentDate.toISOString().split('T')[0];
        if (userId == "" || userId == undefined || userId == null) {
            return res.status(500).send({
                status: false,
                Message: "user_code is mandatory",
            });
        }
        if (LOC_CODE == "" || LOC_CODE == undefined || LOC_CODE == null) {
            return res.status(500).send({
                status: false,
                Message: "loc_code is mandatory",
            });
        }
        if (req.body.UTD == "" || req.body.UTD == undefined || req.body.UTD == null) {
            return res.status(500).send({
                status: false,
                Message: "UTD is mandatory",
            });
        }
        try {

            const a = await sequelize.query(
                `SELECT top 1 * from Expense_Approval_Matrix where Branch_Code  = '${LOC_CODE}' AND module ='tvp'`);

            let ApprovalLevel = 0;
            let Final_apprvl = 0;
            let rowsAffected = 0;
            const Approver_1A = a[0][0]?.Approver_1A;
            const Approver_1B = a[0][0]?.Approver_1B;
            const Approver_1C = a[0][0]?.Approver_1C;
            const Approver_2A = a[0][0]?.Approver_2A;
            const Approver_2B = a[0][0]?.Approver_2B;
            const Approver_2C = a[0][0]?.Approver_2C;
            const Approver_3A = a[0][0]?.Approver_3A;
            const Approver_3B = a[0][0]?.Approver_3B;
            const Approver_3C = a[0][0]?.Approver_3C;

            if (Approver_1A == userId || Approver_1B == userId || Approver_1C == userId) {
                ApprovalLevel = 1;
            } else if (Approver_2A == userId || Approver_2B == userId || Approver_2C == userId) {
                ApprovalLevel = 2;
            } else if (Approver_3A == userId || Approver_3B == userId || Approver_3C == userId) {
                ApprovalLevel = 3;
            }
            if (ApprovalLevel == 2 && !a[0][0].Approver_3A && !a[0][0].Approver_3B && !a[0][0].Approver_3C) {
                Final_apprvl = 1;
            } else if (ApprovalLevel == 1 && !a[0][0].Approver_2A && !a[0][0].Approver_2B && !a[0][0].Approver_2C) {
                Final_apprvl = 1;
            }

            if (ApprovalLevel == 0) {
                return res.status(200).send({
                    status: false,
                    Message: "you are not the right person to approve this",
                });
            }
            const TvApproval = _TvDo(sequelize, DataTypes);
            if (ApprovalLevel === 1) {
                const data = { APPR_21_CODE: userId, APPR_21_STAT: 0, FIN_APPR_2: 0, APPR_21_REM: REMARK, VERF_DATE_2: Final_apprvl == 1 ? ENTR_DATE : null }
                console.log(data)
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    { where: { UTD: UTD, APPR_21_STAT: 3, FIN_APPR_2: null } },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
            }
            else if (ApprovalLevel === 2) {
                const data = { APPR_22_CODE: userId, APPR_22_STAT: 0, FIN_APPR_2: 0, APPR_22_REM: REMARK, VERF_DATE_2: Final_apprvl == 1 ? ENTR_DATE : null }
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    {
                        where: {
                            UTD: UTD,
                            APPR_21_CODE: { [Sequelize.Op.not]: null },
                            APPR_22_STAT: null,
                            FIN_APPR_2: null
                        }
                    },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
            }
            else if (ApprovalLevel === 3) {
                Final_apprvl = 1;
                const data = { APPR_23_CODE: userId, APPR_23_STAT: 1, FIN_APPR_2: 0, APPR_23_REM: REMARK, VERF_DATE_2: ENTR_DATE }
                const [affectedRowsCount] = await TvApproval.update({ ...data },
                    {
                        where:
                        {
                            UTD: bodyData.UTD,
                            APPR_22_STAT: { [Sequelize.Op.not]: null },
                            APPR_23_STAT: null,
                            FIN_APPR_2: null
                        }
                    },
                    { transaction: t });
                rowsAffected = affectedRowsCount;
                console.log(affectedRowsCount, 'asdkaskdjldas')
            }

            t.commit();
            if (rowsAffected == 0) {
                return res.status(200).send({ success: true, Message: 'Can Not Reject' });
            }
            if (Final_apprvl == 1) {
                return res.status(200).send({ success: true, Message: 'Final Reject Done' });
            }
            if (ApprovalLevel == 1) {
                return res.status(200).send({ success: true, Message: 'Rejected on level 1' });
            }
            if (ApprovalLevel == 2) {
                return res.status(200).send({ success: true, Message: 'Rejected on level 2' });
            }
            if (ApprovalLevel == 3) {
                return res.status(200).send({ success: true, Message: 'Rejected on level 3' });
            }
        } catch (e) {
            console.log(e);
            t.rollback();
            return res.status(500).send({ status: false, Message: "Internal Server Error", });
        }
    } catch (e) {
        console.log(e);
        return res.status(500).send({ status: false, Message: "Internal Server Error", });
    }
};
exports.insertDataApproval = async function (req, res) {
    const formData = req.body.formData;
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const ExpenseApprovalMatrix = _ExpenseApprovalMatrix(sequelize, DataTypes);
    try {
        const { error: error1, value: tvData } = expenseApprovalMatrixSchema.validate(formData, {
            abortEarly: false,
            stripUnknown: true
        });
        console.log(error1, 'error1')
        if (formData?.UTD) {
            if (error1) {
                const errorMessage = error1.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                await ExpenseApprovalMatrix.update({ ...tvData }, {
                    where: { UTD: formData?.UTD }
                }, { transaction: t });
            }
        } else {
            if (error1) {
                const errorMessage = error1.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                await ExpenseApprovalMatrix.create({ ...tvData }, { transaction: t });
            }
        }
        await t.commit();
        res.status(200).send({ success: true, message: "Purchase Data Saved....!" });

    } catch (error) {
        console.log(error)
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
exports.DoHandover = async function (req, res) {
    const BodyData = req.body.formData;
    console.log(BodyData)
    const sequelize = await dbname(req.headers.compcode);

    const t = await sequelize.transaction();
    const TvDo = _TvDo(sequelize, DataTypes);
    try {
        if (BodyData.UTD) {
            await TvDo.update({ HANDOVER_STAT: BodyData.HANDOVER_STAT, HANDOVER_PERSON: BodyData.HANDOVER_PERSON, }, {
                where: { UTD: BodyData.UTD }
            }, { transaction: t });
        }
        await t.commit();
        res.status(200).send({ success: true, message: "Data Saved....!" });
    } catch (error) {
        console.log(error)
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
};
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so we add 1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

async function uploadImagesTravel(files, Comp_Code, Created_by) {
    try {
        let dataArray = [];
        console.log(files);
        await Promise.all(files?.map(async (file, index) => {
            const customPath = `${Comp_Code}/TvCostSheet/`;
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
                columndoc_type: "TVICM",
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
};

async function uploadImagesTravel1(files, Comp_Code, EMPCODE) {
    try {
        let dataArray = [];
        await Promise.all(files?.map(async (file, index) => {
            const customPath = `${Comp_Code}/TVAUDIT/`;
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
                console.log(`Image uploaded successfully`);
            } catch (error) {
                console.error(`Error uploading image ${index}:`, error.message);
            }
            const data = {
                SRNO: index,
                EMP_CODE: EMPCODE,
                Created_by: EMPCODE,
                DOC_NAME: file.originalname,
                misspunch_inout: index,
                columndoc_type: "TVAUDIT",
                DOC_PATH: `${customPath}${fileName}`,
            };
            dataArray.push(data);
        }));
        return dataArray;
    } catch (e) {
        console.log(e);
    }
}