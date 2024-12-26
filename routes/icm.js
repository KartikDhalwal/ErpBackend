const { Sequelize, DataTypes, literal, QueryTypes, Op, fn, col } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const path = require('path');
const QRCode = require('qrcode');
const axios = require('axios');
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");
const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");
const { _IcmMst, IcmMstSchema } = require("../models/IcmMst");
const { _IcmDtl, icmDtlSchema } = require("../models/IcmDtl");
const { _BhatiaInvoice, bhatiaInvoiceSchema } = require("../models/BhatiaInvoice");
const { _ExchVeh, exchVehSchema } = require("../models/ExchVeh");
const { _SpotInc, spotIncSchema } = require("../models/SpotInc");
const { _NmDtl, nmDtlSchema } = require("../models/NmDtl");
const { _ICM_Post_Ac, ICMPostAcSchema } = require("../models/ICMPostAc");

exports.FindMasters = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const LOC_CODE = req.body.LOC_CODE
        const MiscMst = _MiscMst(sequelize, DataTypes);
        const INSURANCE_COMP = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ['misc_name', 'label'],
            ],
            where: {
                misc_type: 9,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });
        const SALE_FINANCIER = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ["misc_name", "label"],
            ],
            where: {
                misc_type: 8,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });

        const SALE_FIN_TYPE = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ["misc_name", "label"],
            ],
            where: {
                misc_type: 18,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });
        const SALE_CUST_CITY = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ['misc_name', 'label'],
            ],
            where: {
                misc_type: 1,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });

        const SALE_CUST_STATE = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ["misc_name", "label"],
            ],
            where: {
                misc_type: 3,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });
        const SALE_CUST_TEHSIL = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ["misc_name", "label"],
            ],
            where: {
                misc_type: 2,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });
        const SALE_CUST_DISTRICT = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ["misc_name", "label"],
            ],
            where: {
                misc_type: 51,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });
        const LOAN_TYPE = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ["misc_name", "label"],
            ],
            where: {
                misc_type: 18,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });
        const DSE = await sequelize.query(`select EMPCODE as value, (EMPCODE +' ' + EMPFIRSTNAME + ' ' + EMPLASTNAME) as label from EMPLOYEEMASTER WHERE EMPLOYEEDESIGNATION like '%DSE%' or EMPLOYEEDESIGNATION like '%SALES EXECUTIVE%' or EMPLOYEEDESIGNATION like '%RELATIONSHIP MANAGER%'`);
        const TL = await sequelize.query(`select EMPCODE as value, (EMPCODE +' ' + EMPFIRSTNAME + ' ' + EMPLASTNAME) as label from EMPLOYEEMASTER WHERE EMPLOYEEDESIGNATION like '%TL%'`);
        const NonMgaItemList = await sequelize.query(`select Item_No as value, Item_Name as label from Item_MSt`);


        let data = {
            SALE_CUST_STATE,
            SALE_CUST_CITY,
            SALE_FIN_TYPE,
            SALE_FINANCIER,
            INSURANCE_COMP,
            SALE_CUST_TEHSIL,
            SALE_CUST_DISTRICT,
            LOAN_TYPE,
            DSE,
            TL,
            NonMgaItemList,
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

exports.IcmSave = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = JSON.parse(req.body.formData);
        const Created_by = BodyData.Created_by;
        const Loc_Code = BodyData.Loc_Code;
        const ICM_MST_RCPT_POST = BodyData.ICM_MST_RCPT_POST;
        const ICM_MST_RCPT_UNPOST = BodyData.ICM_MST_RCPT_UNPOST;
        const NM_DTL = BodyData.NM_DTL;
        const SPOT_INC = BodyData.SPOT_INC;
        const t = await sequelize.transaction();
        const IcmMst = _IcmMst(sequelize, DataTypes);
        const IcmDtl = _IcmDtl(sequelize, DataTypes);
        const BhatiaInvoice = _BhatiaInvoice(sequelize, DataTypes);
        const ExchVeh = _ExchVeh(sequelize, DataTypes);
        const NmDtl = _NmDtl(sequelize, DataTypes);
        const SpotInc = _SpotInc(sequelize, DataTypes);
        try {
            let IcmMst_, IcmDtl_, BhatiaInvoice_, ExchVeh_, SpotInc_
            const ICmRcptData = (ICM_MST_RCPT_POST) => {
                const mappedData = {
                    Prty_Name_1: ICM_MST_RCPT_POST[0]?.Prty_Name || null,
                    Prty_Name_2: ICM_MST_RCPT_POST[1]?.Prty_Name || null,
                    Prty_Name_3: ICM_MST_RCPT_POST[2]?.Prty_Name || null,
                    Party_Trf_Amt_1: ICM_MST_RCPT_POST[0]?.Party_Trf_Amt || null,
                    Party_Trf_Amt_2: ICM_MST_RCPT_POST[1]?.Party_Trf_Amt || null,
                    Party_Trf_Amt_3: ICM_MST_RCPT_POST[2]?.Party_Trf_Amt || null,
                    Party_Rem_1: ICM_MST_RCPT_POST[0]?.Party_Rem || null,
                    Party_Rem_2: ICM_MST_RCPT_POST[1]?.Party_Rem || null,
                    Party_Rem_3: ICM_MST_RCPT_POST[2]?.Party_Rem || null,
                };
                return mappedData;
            };
            const mappedData = ICmRcptData(ICM_MST_RCPT_POST);
            const ICmRcptData1 = (ICM_MST_RCPT_POST) => {
                const mappedData = {
                    Prty_Name_4: ICM_MST_RCPT_POST[0]?.Prty_Name || null,
                    Prty_Name_5: ICM_MST_RCPT_POST[1]?.Prty_Name || null,
                    Prty_Name_6: ICM_MST_RCPT_POST[2]?.Prty_Name || null,
                    Party_Trf_Amt_4: ICM_MST_RCPT_POST[0]?.Party_Trf_Amt || null,
                    Party_Trf_Amt_5: ICM_MST_RCPT_POST[1]?.Party_Trf_Amt || null,
                    Party_Trf_Amt_6: ICM_MST_RCPT_POST[2]?.Party_Trf_Amt || null,
                    Party_Rem_4: ICM_MST_RCPT_POST[0]?.Party_Rem || null,
                    Party_Rem_5: ICM_MST_RCPT_POST[1]?.Party_Rem || null,
                    Party_Rem_6: ICM_MST_RCPT_POST[2]?.Party_Rem || null,
                };
                return mappedData;
            };
            const mappedData2 = ICmRcptData1(ICM_MST_RCPT_UNPOST);
            const ICmMStFinalData = {
                ...mappedData, ...BodyData.IcmMst, ...mappedData2
            }
            const TranID = await sequelize.query(`SELECT isnull(MAX(Tran_Id) + 1, 1) as MaxTranId from ICM_MST`);
            const TRAN_ID = TranID[0][0].MaxTranId
            const { error: error, value: IcmMstData } = IcmMstSchema.validate(ICmMStFinalData, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error, 'error')
            if (error) {
                const errorMessage = error.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                IcmMst_ = await IcmMst.create({ ...IcmMstData, TRAN_ID, Export_Type: 1, Created_by, Loc_Code }, { transaction: t });
            }
            const { error: error1, value: IcmDtlData } = icmDtlSchema.validate(BodyData.IcmDtl, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error1, 'error1')
            if (error1) {
                const errorMessage = error1.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                IcmDtl_ = await IcmDtl.create({ ...IcmDtlData, TRAN_ID, Export_Type: 1, Created_by }, { transaction: t });
            }

            const { error: error2, value: BhatiaInvoiceData } = bhatiaInvoiceSchema.validate(BodyData.BhatiaInvoice, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error2, 'error2')
            if (error2) {
                const errorMessage = error2.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                BhatiaInvoice_ = await BhatiaInvoice.create({ ...BhatiaInvoiceData, ICM_ID: TRAN_ID, Export_Type: 1, Created_by, Loc_Code }, { transaction: t });
            }
            const { error: error3, value: ExchVehData } = exchVehSchema.validate(BodyData.IcmMst, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error3, 'error3')
            if (error3) {
                const errorMessage = error3.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                ExchVeh_ = await ExchVeh.create({ ...ExchVehData, Export_Type: 1, Tran_Id: TRAN_ID, Created_by, Loc_Code }, { transaction: t });
            }
            if (NM_DTL && NM_DTL.length > 0) {
                await NmDtl.bulkCreate(
                    NM_DTL.map((NM_DTL) => ({
                        Tran_Id: TRAN_ID,
                        Loc_Code,
                        Created_by,
                        Export_Type: 1,
                        ...NM_DTL,
                    })),
                    { transaction: t }
                );
            }
            const SpotIncentiveData = (SPOT_INC) => {
                const mappedData = {
                    DSE1: SPOT_INC[0]?.DSE || null,
                    DSE2: SPOT_INC[1]?.DSE || null,
                    DSE3: SPOT_INC[2]?.DSE || null,
                    DSE4: SPOT_INC[3]?.DSE || null,
                    DSE5: SPOT_INC[4]?.DSE || null,
                    Spot_Desig1: SPOT_INC[0]?.Spot_Desig || null,
                    Spot_Desig2: SPOT_INC[1]?.Spot_Desig || null,
                    Spot_Desig3: SPOT_INC[2]?.Spot_Desig || null,
                    Spot_Desig4: SPOT_INC[3]?.Spot_Desig || null,
                    Spot_Desig5: SPOT_INC[4]?.Spot_Desig || null,
                    Spot_Scheme1: SPOT_INC[0]?.Spot_Scheme || null,
                    Spot_Scheme2: SPOT_INC[1]?.Spot_Scheme || null,
                    Spot_Scheme3: SPOT_INC[2]?.Spot_Scheme || null,
                    Spot_Scheme4: SPOT_INC[3]?.Spot_Scheme || null,
                    Spot_Scheme5: SPOT_INC[4]?.Spot_Scheme || null,
                    Spot_Inc1: SPOT_INC[0]?.Spot_Inc || null,
                    Spot_Inc2: SPOT_INC[1]?.Spot_Inc || null,
                    Spot_Inc3: SPOT_INC[2]?.Spot_Inc || null,
                    Spot_Inc4: SPOT_INC[3]?.Spot_Inc || null,
                    Spot_Inc5: SPOT_INC[4]?.Spot_Inc || null,
                    IncDrCr1: SPOT_INC[0]?.IncDrCr || null,
                    IncDrCr2: SPOT_INC[1]?.IncDrCr || null,
                    IncDrCr3: SPOT_INC[2]?.IncDrCr || null,
                    IncDrCr4: SPOT_INC[3]?.IncDrCr || null,
                    IncDrCr5: SPOT_INC[4]?.IncDrCr || null,
                };
                return mappedData;
            };
            const SpotIncentiveDataInsert = SpotIncentiveData(SPOT_INC);
            const { error: error4, value: SpotIncData } = spotIncSchema.validate(SpotIncentiveDataInsert, {
                abortEarly: false,
                stripUnknown: true
            });
            console.log(error4, 'error4')
            if (error4) {
                const errorMessage = error4.details.map(err => err.message).join(', ');
                return res.status(400).send({ success: false, message: errorMessage });
            } else {
                SpotInc_ = await SpotInc.create({ ...SpotIncData, TRAN_ID, Export_Type: 1, Created_by }, { transaction: t });
            }
            if (req.files.length > 0) {
                const EMP_DOCS_data = await uploadImagesTravel(
                    req.files,
                    req.headers?.compcode?.split("-")[0],
                    Created_by,
                );
                const arr = [
                    "PanCard",
                    "AadharCard",
                    "CorpDoc1",
                    "CorpDoc2",
                    "FinDelOrder",
                    "SaleCoverLetter",
                    "ExchDoc1",
                    "ExchDoc2",
                ];
                EMP_DOCS_data.forEach(doc => {
                    if (doc.fieldname.startsWith('image_')) {
                        arr.push(doc.fieldname);
                    }
                });
                await Promise.all(EMP_DOCS_data.map(async (doc) => {
                    const originalIndex = arr.indexOf(doc.fieldname);
                    const srnoIndex = originalIndex >= 0 ? originalIndex + 1 : 0;
                    if (srnoIndex > 0) {
                        const insertQuery = `
                            INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
                            VALUES (
                                'ICM', 
                                '${IcmMst_.TRAN_ID}', 
                                ${srnoIndex}, 
                                '${doc.DOC_PATH}', 
                                '${doc.fieldname}', 
                                '${Created_by}', 
                                CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), 
                                '1'
                            )`;
                        await sequelize.query(insertQuery);
                    } else {
                        console.error(`Fieldname ${doc.fieldname} not found in arr.`);
                    }
                }));
            }
            await t.commit();
            res.status(200).send({ success: true, Message: "Data Saved" });
        } catch (error) {
            console.error("Error while creating Master:", error);
            res.status(500).send({
                success: false,
                message: "An error occurred while creating Master",
                error,
            });
            await t.rollback();
        }
    } catch (e) {
        console.error("Error in FirstSave function:", e);
        res.status(500).send({
            success: false,
            message: "An error occurred while creating Master",
            e,
        });
    } finally {
        await sequelize.close();
    }
};

exports.FindNewCarSaleData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const Customer_Id = req.body.Customer_Id;
        const BscData = await sequelize.query(`
            SELECT * 
            FROM NEWCAR_SALE_REGISTER 
            WHERE Customer_Id = '${Customer_Id}'
            AND Location_Code = (
                SELECT NEWCAR_RCPT 
                FROM Godown_Mst 
                WHERE Godw_Code = ${multi_loc} 
                AND Export_Type < 3
            ) 
            order by Inv_dt desc
        `);
        try {
            let taxTotResult = await sequelize.query(`
                SELECT 
                    COALESCE(CGS_Perc, 0) + COALESCE(SGS_Perc, 0) + COALESCE(IGS_Perc, 0) + COALESCE(Cess_Perc, 0) AS TaxTotal
                FROM NEWCAR_Sale_Register 
                WHERE Inv_No = '${BscData[0][0].Inv_No}' AND Customer_Id = '${Customer_Id}'
            `);
            console.log(taxTotResult[0][0]?.TaxTotal, 'taxTotResult[0][0]?.TaxTotal')
            let TaxTot = parseFloat(taxTotResult[0][0]?.TaxTotal || 0);
            let Cons_Disc = 0, Corp_Disc = 0, Exch_Disc = 0;

            let consDiscResult = await sequelize.query(`
                        SELECT MAX(Discount) AS MaxDiscount 
                        FROM NEWCAR_Sale_Register 
                        WHERE Inv_No = '${BscData[0][0].Inv_No}' AND Customer_Id = '${Customer_Id}'
                    `);
            Cons_Disc = Math.round(consDiscResult[0][0]?.MaxDiscount * (1 + TaxTot / 100));

            let corpDiscResult = await sequelize.query(`
                            SELECT MAX(Discount_for_Corp_Institutional_Customer) AS MaxCorpDiscount 
                            FROM NEWCAR_Sale_Register 
                            WHERE Inv_No = '${BscData[0][0].Inv_No}' AND Customer_Id = '${Customer_Id}'
                        `);
            Corp_Disc = Math.round(corpDiscResult[0][0]?.MaxCorpDiscount * (1 + TaxTot / 100));


            let exchDiscResult = await sequelize.query(`
                            SELECT MAX(Exchange_Loyalty_Bonus_Discount) AS MaxExchDiscount 
                            FROM NEWCAR_Sale_Register 
                            WHERE Inv_No = '${BscData[0][0].Inv_No}' AND Customer_Id = '${Customer_Id}'
                        `);
            Exch_Disc = Math.round(exchDiscResult[0][0]?.MaxExchDiscount * (1 + TaxTot / 100));

            let Total_Disc = parseFloat(Cons_Disc) + parseFloat(Corp_Disc) + parseFloat(Exch_Disc);
            let MRP_Price = 0;
            let priceQuery = `
                    SELECT Inv_Amt, TCS
                    FROM NewCar_Sale_Register 
                    WHERE Inv_No = '${BscData[0][0].Inv_No}' AND CUSTOMER_ID = '${Customer_Id}'
                `;
            let priceResult = await sequelize.query(priceQuery);
            if (priceResult.length > 0) {
                let row = priceResult[0][0];
                MRP_Price = parseFloat(row.Inv_Amt) + Total_Disc - parseFloat(row.TCS || 0);
            }
            BscData[0] = BscData[0].map(item => ({
                ...item,
                MRP_Price: MRP_Price
            }));

        } catch (error) {
            console.error("Error calculating discounts: ", error);
        }
        if (BscData[0].length > 0) {
            res.status(200).send({
                success: true,
                BscData: BscData[0],
                message: "Data Fetched"
            });
        } else {
            res.status(500).send({
                success: false,
                message: "No Details Found"
            });
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e
        });
    } finally {
        await sequelize.close();
    }
};

exports.IcmView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body)
        const GUID = req.body.GUID ? req.body.GUID : '';
        const multi_loc = req.body.multi_loc;
        const IcmMst = _IcmMst(sequelize, DataTypes);
        const IcmDtl = _IcmDtl(sequelize, DataTypes);
        const BhatiaInvoice = _BhatiaInvoice(sequelize, DataTypes);
        const ExchVeh = _ExchVeh(sequelize, DataTypes);
        const NmDtl = _NmDtl(sequelize, DataTypes);
        const SpotInc = _SpotInc(sequelize, DataTypes);
        let data = [];
        if (GUID) {
            const a = await IcmMst.findOne({
                where: {
                    GUID: GUID,
                    Loc_Code: multi_loc
                },
            });
            const b = await IcmDtl.findOne({
                where: {
                    TRAN_ID: a.dataValues.TRAN_ID
                },
            });
            const c = await BhatiaInvoice.findOne({
                where: {
                    ICM_ID: a.dataValues.TRAN_ID
                },
            });
            const d = await ExchVeh.findOne({
                where: {
                    TRAN_ID: a.dataValues.TRAN_ID
                },
            });
            const e = await NmDtl.findOne({
                where: {
                    TRAN_ID: a.dataValues.TRAN_ID
                },
            });
            const f = await SpotInc.findOne({
                where: {
                    TRAN_ID: a.dataValues.TRAN_ID
                },
            });
            const g = await sequelize.query(`select * from doc_upload 
                where TRAN_ID='${a.dataValues.TRAN_ID}' and doc_type = 'ICM' AND EXPORT_TYPE < 5 order by srno`);
            console.log(c, 'fvfv')
            data = {
                IcmMst: a.dataValues,
                IcmDtl: b.dataValues,
                BhatiaInvoice: c ? c.dataValues : null,
                ExchVeh: d.dataValues,
                NmDtl: e.dataValues,
                SpotInc: f.dataValues,
                images: g[0] ? g[0] : []
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
exports.IcmViewTable = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const IcmMst = _IcmMst(sequelize, DataTypes);
        let data = [];
        const { Op, fn, col } = require('sequelize');

        const a = await IcmMst.findAll({
            where: {
                Loc_Code: multi_loc,
                [Op.and]: Sequelize.where(fn('MONTH', col('Inv_Date')), 10)
            }
        });


        console.log(a[0], 'fvfv')
        data = {
            IcmMst: a
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

async function uploadImagesTravel(files, Comp_Code, Created_by) {
    try {
        let dataArray = [];
        await Promise.all(files?.map(async (file, index) => {
            const customPath = `${Comp_Code}/ICM/`;
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
                columndoc_type: "ICM",
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

exports.VoucherCodeData = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const Location = req.body.Location;
          const Status = req.body.Status;
        let result;
          if (Status == 0) {
        result = await sequelize.query(
            `select Book_Name as label, CAST(Book_Code AS VARCHAR) as value, book_type from Book_Mst where book_type in (2,8,3) and Export_Type < 3 and Loc_Code in (${Location})`
        );
          }
          if (Status == 1) {
            result = await sequelize.query(
              `select Book_Name as label, CAST(Book_Code AS VARCHAR) as value from Book_Mst where book_type = 8 and Export_Type < 3 and Loc_Code in (${Location})`
            );
          }
          if (Status == 2) {
            result = await sequelize.query(
              `select Book_Name as label, CAST(Book_Code AS VARCHAR) as value from Book_Mst where book_type = 2 and Export_Type < 3 and Loc_Code in (${Location})`
            );
          }

        console.log(result, "result");
        res.status(200).send({
            Status: true,
            Query: "",
            Result: result[0],
        });
    } catch (e) {
        console.log(e);
    }
};

exports.savedata = async function (req, res) {
    console.log(req.body, "request.body");
    const { gpPrefix, Location } = req.body;
    const General = req.body.formData.map(({ Id, ...rest }) => rest);
    let t;

    try {
        const sequelize = await dbname(req.headers.compcode);
        t = await sequelize.transaction();

        for (const data of General) {
            data.GP_Prefix = gpPrefix;
            data.Loc_Code = Location;

            const { error } = ICMPostAcSchema.validate(data);
            if (error) {
                return res.status(400).json({ message: error.details[0].message });
            }

            console.log(data, "komalnuwall");
            const ICMPostAc = _ICM_Post_Ac(sequelize, Sequelize.DataTypes);
            await ICMPostAc.create(data, {
                transaction: t,
                return: true,
            });
        }

        await t.commit();
        return res.status(201).json({ message: "Data saved successfully" });
    } catch (error) {
        if (t) await t.rollback();
        console.error("Error saving data:", error);
        return res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};

exports.findMastersLedger = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const searchText = req.body.search;
        const multi_loc = req.body.Loc_Code;
        let query;
        query = `SELECT TOP 20 
      CAST(ledg_code AS VARCHAR) AS value,
      ledg_name AS label 
  FROM 
      ledg_mst findMastersLedgerselected
  WHERE (ledg_code LIKE '%${searchText}%' OR ledg_name LIKE '%${searchText}%') 
      AND loc_code IN (${multi_loc}, 0) 
      AND export_type < 3;`;
        const LedgerNames = await sequelize.query(query);
        res.send({
            success: true,
            LedgerNames: LedgerNames[0],
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

exports.findMastersLedgerselected = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const searchText = req.body.search;
        console.log(searchText, 'searchText')
        const multi_loc = req.body.Loc_Code;
        let query;
        query = `SELECT TOP 20 
      CAST(ledg_code AS VARCHAR) AS value,
      ledg_name AS label 
  FROM 
      ledg_mst 
  WHERE ledg_code in (${searchText})  
      AND export_type < 3;`;
        const LedgerNames = await sequelize.query(query);
        console.log(LedgerNames, 'LedgerNames')
        res.send({
            success: true,
            LedgerNames: LedgerNames[0],
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

exports.updatedata = async function (req, res) {
    console.log(req.body, "request.body");
    const { formData, gpPrefix, Location } = req.body;
    let t;

    try {
        const sequelize = await dbname(req.headers.compcode);
        t = await sequelize.transaction();

        for (const data of formData) {
            // Set GP_Prefix in each object
            data.GP_Prefix = gpPrefix;
            data.Loc_Code = Location;

            // Validate the data
            const { error } = ICMPostAcSchema.validate(data);
            if (error) {
                return res.status(400).json({ message: error.details[0].message });
            }

            const ICMPostAc = _ICM_Post_Ac(sequelize, Sequelize.DataTypes);

            // Update each record by using Seq_No as the identifier
            await ICMPostAc.update(data, {
                where: { Seq_No: data.Seq_No }, // Use Seq_No instead of Id
                transaction: t,
                returning: true,
            });
        }

        await t.commit();
        return res.status(201).json({ message: "Data updated successfully" });
    } catch (error) {
        if (t) await t.rollback();
        console.error("Error saving data:", error);
        return res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
};

exports.ShowData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.Loc_Code;
        let query;
        query = `SELECT 
        CAST(Payable_Ac AS VARCHAR) AS Payable_Ac,
        Seq_No,
        CAST(Voucher_Code AS VARCHAR) AS Voucher_Code,
        CAST(Voucher_Type AS VARCHAR) AS Voucher_Type,
        GP_Prefix
      FROM 
        ICM_Post_Ac
      WHERE 
        Loc_Code IN (${multi_loc}, 0)
      `;

        const Result = await sequelize.query(query);
        console.log(Result, "komalalala");

        if (Result[0].length === 0) {
            // If no data, return a custom message or empty array
            return res.send({
                success: false,
                message: "No data found for the given location.",
            });
        }

        // If there are results, send them back
        res.send({
            success: true,
            Result: Result[0],
        });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            success: false,
            message: "An error occurred while fetching data.",
            err,
        });
    } finally {
        await sequelize.close();
    }
};

exports.ViewAllData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const Result = await sequelize.query(`SELECT 
          Ledg_Code  as value, 
          Ledg_Name as label 
        FROM 
          Ledg_mst 
        WHERE 
          Loc_Code IN (${multi_loc}, 0) 
          AND Export_Type < 3`)

        const VoucherData = await sequelize.query(`SELECT 
          Ledg_Code  as value, 
          Ledg_Name as label 
        FROM 
          Ledg_mst 
        WHERE 
          Loc_Code IN (${multi_loc}, 0) 
          AND Export_Type < 3`)

        console.log(Result, "komalalala");

        // Check if data exists in the result
        if (Result[0].length === 0) {
            return res.send({
                success: false,
                message: "No data found for the given location.",
            });
        }

        // If data exists, send the result
        res.send({
            success: true,
            Result: Result[0],
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

exports.FindMastersDocUpload = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const LOC_CODE = req.body.LOC_CODE
        const MiscMst = _MiscMst(sequelize, DataTypes);
        const DocumentType = await MiscMst.findAll({
            attributes: [
                [literal('CAST([Misc_Abbr] AS VARCHAR)'), 'value'],
                ['Misc_Name', 'label'],
            ],
            where: {
                misc_type: 624,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });

        let data = {
            DocumentType
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

exports.SaveNewDocumentType = async function (req, res) {
    const BodyData = req.body
    const sequelize = await dbname(req.headers.compcode);
    let t = await sequelize.transaction();
    try {
        const MiscMst = _MiscMst(sequelize, DataTypes);
        const Check = await sequelize.query(`SELECT Misc_Name FROM Misc_Mst WHERE Misc_Name = '${BodyData.Misc_Name}' AND Misc_Type = 624`);
        if (Check[0].length > 0) {
            return res.status(400).send({ success: false, message: "This Document Type Already Exist" });
        }
        const maxMiscCode = await MiscMst.max("Misc_Code", {
            where: { Misc_Type: 624 },
            transaction: t,
        });
        const newMiscCode = maxMiscCode + 1;
        await MiscMst.create(
            {
                Misc_Type: 624,
                Misc_Code: newMiscCode,
                Misc_Name: BodyData.Misc_Name,
                Misc_Abbr: toCamelCase(BodyData.Misc_Name),
                Export_Type: 1,
                ServerId: 1,
                Loc_code: BodyData.Loc_Code
            },
            {
                transaction: t,
            }
        );

        await t.commit();
        return res.status(201).json({ message: "Document Type Created...!" });
    } catch (error) {
        if (t) await t.rollback();
        console.error("Error saving data:", error);
        return res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
    finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};
exports.SaveDocuments = async function (req, res) {
    const BodyData = JSON.parse(req.body.formData)
    console.log(BodyData)
    console.log(req.files)
    const sequelize = await dbname(req.headers.compcode);
    let t = await sequelize.transaction();
    try {
        if (req.files.length > 0) {
            const EMP_DOCS_data = await uploadImagesTravel1(
                req.files,
                req.headers?.compcode?.split("-")[0],
                req.body.Created_by,
            );
            await Promise.all(EMP_DOCS_data.map(async (doc, index) => {

                const insertQuery = `
                        INSERT INTO DOC_UPLOAD (Doc_Type, INV_NO, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
                        VALUES (
                            'ICM_DOC', 
                            '${BodyData.InvoiceNo}', 
                            ${index}, 
                            '${doc.DOC_PATH}', 
                            '${doc.fieldname}', 
                            '${req.body.Created_by}', 
                            CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), 
                            '1'
                        )`;
                await sequelize.query(insertQuery);
            }));
        }

        await t.commit();
        return res.status(201).json({ message: "Document Type Created...!" });
    } catch (error) {
        if (t) await t.rollback();
        console.error("Error saving data:", error);
        return res
            .status(500)
            .json({ message: "Internal Server Error", error: error.message });
    }
    finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};

exports.IcmDocumentsView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body);
        const INV_NO = req.body.INV_NO ? req.body.INV_NO : '';
        let data = {};
        let finalData = [];
        let DocketImages = [];
        if (INV_NO) {
            const [docuMasterData] = await sequelize.query(`
                SELECT Misc_Abbr FROM Misc_mst WHERE Misc_Type = 624 and EXPORT_TYPE < 5
            `);
            const miscAbbrList = docuMasterData.map(doc => doc.Misc_Abbr);

            const [imagesData] = await sequelize.query(`
                SELECT * FROM doc_upload 
                WHERE INV_NO='${INV_NO}' AND doc_type = 'ICM_DOC' AND EXPORT_TYPE < 5 
                ORDER BY srno
            `);

            const imagesMappedByAbbr = imagesData.reduce((acc, image) => {
                const matchingAbbr = miscAbbrList.find(abbr => image.File_Name.includes(abbr));
                if (matchingAbbr) {
                    acc[image.File_Name] = image.path;
                }
                return acc;
            }, {});

            DocketImages = imagesData
                .filter(image => image.File_Name.startsWith('image_'))
                .map(image => 'https://erp.autovyn.com/backend/fetch?filePath=' + image.path);

            miscAbbrList.forEach(abbr => {
                const matchingImages = imagesData.filter(image => image.File_Name.includes(abbr));
                if (matchingImages.length > 0) {
                    const fileImage = matchingImages.find(image => image.File_Name.endsWith('-File'));
                    const captImgImage = matchingImages.find(image => image.File_Name.endsWith('-CaptImg'));
                    finalData.push({
                        Doc_Type: abbr,
                        File:  fileImage ? 'https://erp.autovyn.com/backend/fetch?filePath=' + fileImage.path : null,
                        DOC:  captImgImage ? 'https://erp.autovyn.com/backend/fetch?filePath=' + captImgImage.path : null
                    });
                }
            });
        }
        data = {
            finalData,DocketImages,INV_NO
        }
        console.log(data);
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error Occurred While Fetching Data");
    } finally {
        await sequelize.close();
        console.log('Connection has been closed.');
    }
};



async function uploadImagesTravel1(files, Comp_Code, Created_by) {
    try {
        let dataArray = [];
        await Promise.all(files?.map(async (file, index) => {
            const customPath = `${Comp_Code}/ICM_DOC/`;
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
                columndoc_type: "ICM_DOC",
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

function toCamelCase(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map((word, index) =>
            index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
        )
        .join('');
}