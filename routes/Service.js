const { Sequelize, DataTypes, literal, QueryTypes, Op } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const path = require('path');
const QRCode = require('qrcode');
const axios = require('axios');
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");
const { SendWhatsAppMessgaeHindi } = require("./user");
const { SendWhatsAppMessgae } = require("./user");
const translatte = require('translatte');

const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");
const { _OfferMaster, OfferMasterSchema } = require("../models/OfferMaster");
const { _ServOffCust, ServOffCustSchema } = require("../models/ServOffCust");
const { _OfferDtl, OfferDtlSchema } = require("../models/OfferDtl");
const { _BodyShopClaim, bodyShopClaimSchema } = require("../models/BodyShopClaim");
const { _WaHstWeb } = require("../models/WaHstWeb");
const { _GpMst, gpMstSchema } = require("../models/GpMst");
const { _GpDtl, gpDtlSchema } = require("../models/GpDtl");
const { _DmsImportBodyShop } = require("../models/DmsImportBodyShop");
const {
    _Pick_Drop_Collection,
    PickDropCollectionSchema,
} = require("../models/PicknDrop");
const { _In_Service, InServiceSchema } = require("../models/InService");

exports.FindMaster = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const MiscMst = _MiscMst(sequelize, DataTypes);
        const Offer = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ['misc_name', 'label'],
            ],
            where: {
                misc_type: 622,
                Export_Type: 1
            },
        });
        const OfferOn = [
            { label: "Parts", value: "Parts" },
            { label: "Labour", value: "Labour" },
            { label: "Oil", value: "Oil" },
            { label: "MGA", value: "MGA" },
            { label: "EW", value: "EW" },
        ];
        let data = {
            Offer, OfferOn

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
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        console.log(BodyData)
        const { error, value: OfferData } = OfferMasterSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true,
        });
        console.log(error, 'error')
        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            const t = await sequelize.transaction();
            const OfferMaster = _OfferMaster(sequelize, DataTypes);
            try {
                const Om = await OfferMaster.create(
                    { ...OfferData },
                    { transaction: t }
                );
                console.log(Om.UTD, 'Om')
                if (BodyData.TcData) {
                    const OfferDtl = _OfferDtl(sequelize, DataTypes);
                    console.log(BodyData.TcData, 'BodyData.TcData')
                    const OfferDtl_ = await OfferDtl.bulkCreate(
                        BodyData.TcData.map((item, index) => ({
                            ...item,
                            Mst_ID: Om.UTD
                        })),
                        { transaction: t }
                    )
                }
                await t.commit();
                res.status(200).send({ success: true, Message: "Master Created" });
            } catch (error) {
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
exports.UpdateData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        console.log(BodyData)
        const { error, value: OfferData } = OfferMasterSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true,
        });
        console.log(error, 'v')
        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            const t = await sequelize.transaction();
            const OfferMaster = _OfferMaster(sequelize, DataTypes);
            try {
                await OfferMaster.update(
                    { ...OfferData },
                    { where: { UTD: BodyData.UTD } },
                    { transaction: t }
                );
                if (
                    BodyData.TcData &&
                    BodyData.TcData.length > 0
                ) {
                    const OfferDtl = _OfferDtl(sequelize, DataTypes);
                    await OfferDtl.destroy({ where: { Mst_ID: BodyData.UTD }, transaction: t });
                    await OfferDtl.bulkCreate(
                        BodyData.TcData.map((item, index) => ({
                            ...item,
                            Mst_ID: BodyData.UTD
                        })),
                        { transaction: t }
                    )
                }
                await t.commit();
                res.status(200).send({ success: true, Message: "Master Updated" });
            } catch (error) {
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
exports.OffersView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Month = req.body.Month;
        const a = await sequelize.query(`SELECT (SELECT TC_DESC from OfferDtl WHERE Mst_ID = OfferMaster.UTD FOR JSON PATH , INCLUDE_NULL_VALUES) AS x,*,
            CASE 
            WHEN Offers = 9999 THEN 'Amount'
            WHEN Offers = 9998 THEN 'Percentage'
            ELSE 
        (SELECT Misc_Name FROM Misc_Mst WHERE Misc_Type = 622 AND Misc_Code = Offers AND Export_Type = 1) END AS OfferLabel FROM OfferMaster
        WHERE Month = ${Month}`);
        if (a[0] && Array.isArray(a[0])) {
            a[0] = a[0].map(row => {
                if (row.x) {
                    row.x = JSON.parse(row.x);
                }
                return row;
            });
        }

        console.log(a[0]);
        res.status(200).send({ success: true, data: a[0] });
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
};
exports.CustomerImportFormat = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    try {
        let reportName = "Customer Excel Import";
        const Headeres = ['CUSTOMER_NAME', 'MOBILE', 'EMAIL', 'VEH_REG_NO', 'VIN_NO', 'MODEL', 'CUST_ID'];
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
exports.CustomerImportExcel = async function (req, res, next) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    try {
        const ServOffCust = _ServOffCust(sequelize, DataTypes);
        const excelFile = req.files["excel"][0]; // Accessing the uploaded file
        const workbook = xlsx.read(excelFile.buffer, { type: "buffer", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        if (!data?.length) {
            sequelize.close();
            return res.status(500).send({ Message: "No data found in Excel or may be Invalid format" })
        }
        const ErroredData = [];
        const CorrectData = [];
        data.map(obj => {
            let oldObj = { ...obj };
            const rejectionReasons = [];
            const duplicateItemCode = data.filter(item => item.VEH_REG_NO?.toString() === obj.VEH_REG_NO?.toString());
            if (duplicateItemCode?.length >= 2 && obj.VEH_REG_NO) {
                rejectionReasons.push(`Duplicate Registration No  (${obj.VEH_REG_NO}) found ${duplicateItemCode.length} times in this Excel`, ' | ');
            }
            const duplicateVIN_NO = data.filter(item => item.VIN_NO?.toString() === obj.VIN_NO?.toString());
            if (duplicateVIN_NO?.length >= 2 && obj.VIN_NO) {
                rejectionReasons.push(`Duplicate VIN No  (${obj.VIN_NO}) found ${duplicateVIN_NO.length} times in this Excel`, ' | ');
            }
            if (rejectionReasons.length > 0) {
                ErroredData.push({
                    ...oldObj,
                    rejectionReasons: rejectionReasons?.slice(0, -1)
                });
            } else {
                CorrectData.push(obj);
            }
        });
        console.log(CorrectData, 'CorrectData');
        console.log(ErroredData, "ErroredData");
        const maxBatchId = await ServOffCust.max("BATCH_ID", {
            transaction: t,
        });
        let newBatchId = maxBatchId + 1;
        const ServOffCust_ = await ServOffCust.bulkCreate(
            CorrectData.map((item, index) => ({
                ...item,
                BATCH_ID: newBatchId,
                BATCH_NAME: formatDate(new Date()),
                Loc_Code: req.body.Loc_Code,
                Created_by: req.body.created_by,
                ImportMonth: req.body.ImportMonth,
            })),
            { transaction: t }
        )
        console.log(ServOffCust_.length);
        t.commit();
        await sequelize.close();
        res.status(200).send({ ErroredData: ErroredData, CorrectData: CorrectData, Message: `${ServOffCust_.length} Records Inserted` })
    } catch (error) {
        t.rollback();
        console.error("Error:", error);
        res.status(500).json({ Message: "An error occurred during file import." });
    }
};
exports.ViewOfferCustomer = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Month = req.body.Month;
        const a = await sequelize.query(`SELECT *,
            CASE 
            WHEN Offers = 9999 THEN CONCAT('Amount', ' - Rs. ', OfferValue)
            WHEN Offers = 9998 THEN CONCAT('Percentage', ' - ', OfferValue,' %')
            ELSE 
        (SELECT Misc_Name FROM Misc_Mst WHERE 
        Misc_Type = 622 AND Misc_Code = Offers AND Export_Type = 1) END AS OfferLabel 
        FROM OfferMaster WHERE Month = '${Month}'`);
        const b = await sequelize.query(`SELECT * FROM ServOffCust WHERE ImportMonth = '${Month}' AND isAvailed is  NULL`);
        res.status(200).send({ success: true, Offers: a[0], Customers: b[0] });
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
};
exports.ApplyOffer = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const { OfferData, CustUtd, Created_by, User_Code } = req.body;
        CustUtd.sort(() => Math.random() - 0.5);
        const totalWeightage = OfferData.reduce((total, offer) => total + offer.Weightage, 0);
        let remainingCustomers = CustUtd.length;
        const customerDistribution = OfferData.map((offer) => {
            const calculatedSlots = Math.floor((offer.Weightage / totalWeightage) * CustUtd.length);
            remainingCustomers -= calculatedSlots;
            return {
                offerUTD: offer.UTD,
                remainingSlots: calculatedSlots,
                weightageRatio: offer.Weightage / totalWeightage,
            };
        });
        customerDistribution.sort((a, b) => b.weightageRatio - a.weightageRatio);
        if (remainingCustomers > 0) {
            customerDistribution[0].remainingSlots += remainingCustomers;
        }
        const assignedOffers = [];
        const qrCodes = [];

        const qrCodePromises = CustUtd.map(async (custId) => {
            const availableOffers = customerDistribution.filter(offer => offer.remainingSlots > 0);
            const selectedOffer = availableOffers[0];
            assignedOffers.push({
                CustUtd: custId,
                AssignedOffer: selectedOffer.offerUTD,
            });
            selectedOffer.remainingSlots--;

            const qrCodeText = `CustomerID: ${custId}, AssignedOffer: ${selectedOffer.offerUTD}`;
            const qrCodeBuffer = await QRCode.toBuffer(qrCodeText);
            const qrCodeFileName = `QRCode_${custId}_${selectedOffer.offerUTD}.png`;

            qrCodes.push({
                buffer: qrCodeBuffer,
                encoding: '7bit',
                originalname: qrCodeFileName,
                mimetype: 'image/png',
                size: qrCodeBuffer.length,
                CustUtd: custId,
                AssignedOffer: selectedOffer.offerUTD
            });
        });

        await Promise.all(qrCodePromises);
        const uploadResults = await uploadImages(qrCodes, req.headers.compcode, Created_by);
        const ServOffCust = _ServOffCust(sequelize, DataTypes);
        await Promise.all(uploadResults.map(async (result) => {
            await ServOffCust.update(
                {
                    isApplied: 1,
                    isAppliedDate: sequelize.literal('GETDATE()'),
                    QR_PATH: result.DOC_PATH,
                    OFF_ID: result.misspunch_inout,
                },
                { where: { UTD: result.SRNO } }
            );
        }));
        processMainData(uploadResults, req.headers.compcode, User_Code, Created_by)
        res.status(200).send({ success: true, assignedOffers });
    } catch (e) {
        console.log(e);
        res.status(500).send({ success: false, message: 'An error occurred while applying offers.' });
    } finally {
        await sequelize.close();
    }
};
exports.ScanQrResult = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const OfferId = req.body.OfferId;
        const CustId = req.body.CustId;
        const a = await sequelize.query(`SELECT (SELECT TC_DESC from OfferDtl WHERE Mst_ID = OfferMaster.UTD FOR JSON PATH , INCLUDE_NULL_VALUES) AS x,*,
            CASE 
             WHEN Offers = 9999 THEN CONCAT('Amount', ' - Rs. ', OfferValue)
            WHEN Offers = 9998 THEN CONCAT('Percentage', ' - ', OfferValue,' %')
            ELSE 
        (SELECT Misc_Name FROM Misc_Mst 
        WHERE Misc_Type = 622 AND Misc_Code = Offers AND Export_Type = 1) 
        END AS OfferLabel FROM OfferMaster WHERE UTD = ${OfferId}`);

        if (a[0] && Array.isArray(a[0])) {
            a[0] = a[0].map(row => {
                if (row.x) {
                    row.x = JSON.parse(row.x);
                    row.x = row.x.map(item => Object.values(item).join('| ')).join('| ');
                }
                return row;
            });
        }
        const b = await sequelize.query(`SELECT *,
        (SELECT TOP 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EmpName FROM EMPLOYEEMASTER WHERE EMPCODE = AVAIL_EMP) AS OffAVailEmp
            from ServOffCust WHERE UTD = ${CustId} AND OFF_ID = ${OfferId}`);
        console.log(a, b)
        const DataFromCheck = new Date(a[0][0].DateFrom);
        const DataToCheck = new Date(a[0][0].DateUpto);
        const CurrentDate = new Date();
        const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (!b[0][0] || !a[0][0]) {
            res.status(201).send({ Status: false, Message: "❌----Invalid QR----❌", offerData: a[0], CustData: b[0] });
        } else if (b[0] && b[0][0]?.AVAIL_EMP !== null) {
            res.status(201).send({ Status: false, Message: "❌----Offer Already Availed----❌", offerData: a[0], CustData: b[0] });
        } else if (normalizeDate(CurrentDate) < normalizeDate(DataFromCheck) || normalizeDate(CurrentDate) > normalizeDate(DataToCheck)) {
            const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];
            const monthName = monthNames[a[0][0].Month - 1];
            res.status(201).send({ Status: false, Message: `❌----This Offer is for the ${monthName} Month----❌`, offerData: a[0], CustData: b[0] });
        }
        else if (b[0][0]) {
            res.status(200).send({ Status: true, Message: "Offer Unlocked", offerData: a[0], CustData: b[0] });
        }
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
};
exports.AvailOffer = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        const a = await sequelize.query(`SELECT * FROM ServOffCust WHERE UTD = ${BodyData.CustUtd} AND OFF_ID = ${BodyData.OfferUtd}`);
        const b = await sequelize.query(`SELECT * FROM OfferMaster WHERE  UTD = ${BodyData.OfferUtd}`);
        const CurrentDate = new Date();
        const DataFromCheck = new Date(a[0][0].DateFrom);
        const DataToCheck = new Date(a[0][0].DateUpto);
        const normalizeDate = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

        if (normalizeDate(DataFromCheck) < normalizeDate(CurrentDate) || normalizeDate(DataToCheck) > normalizeDate(CurrentDate)) {
            res.status(201).send({
                Status: "false",
                Message: `Invalid Offer Period`,
            });
        }
        else if (parseFloat(b[0][0].MIN_INV_AMT) > parseFloat(BodyData.FIN_INV_AMT)) {
            res.status(201).send({
                Status: "false",
                Message: `The Minimum Total Invoice Amount Should be Rs. ${b[0][0].MIN_INV_AMT}/- to Avail this Offer`,
            });
        }
        else if (b[0][0].OfferOn !== BodyData.INV_ON) {
            res.status(201).send({
                Status: "false",
                Message: `This Offer is only Applicable on ${b[0][0].OfferOn}`,
            });
        }
        else if (a[0][0].isAvailed === null) {
            try {
                const t = await sequelize.transaction();
                const ServOffCust = _ServOffCust(sequelize, DataTypes);
                await ServOffCust.update(
                    {
                        isAvailed: 1,
                        isAvailedDate: sequelize.literal('GETDATE()'),
                        AVAIL_EMP: BodyData.EMP_CODE,
                        FIN_INV_AMT: BodyData.FIN_INV_AMT,
                        INV_ON: BodyData.INV_ON,
                    },
                    {
                        where: {
                            UTD: BodyData.CustUtd,
                            OFF_ID: BodyData.OfferUtd
                        }
                    },
                    { transaction: t }
                );
                await t.commit();
                res.status(200).send({ Status: "true", Message: "Offer Availed" });
            } catch (error) {
                console.log(error)
                res.status(500).send({
                    Status: "false",
                    Message: "An error occurred while Availing Offer",
                    error,
                });
                await t.rollback();
            }
        }
        else {
            res.status(201).send({
                Status: "false",
                Message: "Offer Already Availed",
            });
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Availing Offer",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.OfferReport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body)
        const TRAN_TYPE = req.body.TRAN_TYPE;
        const LOC_CODE = req.body.LOC_CODE;
        const Month = req.body.Month;
        let a;
        if (TRAN_TYPE === '1') {
            a = await sequelize.query(`SELECT soc.* ,
            (SELECT CASE 
            WHEN om.Offers = 9999 THEN CONCAT('Amount', ' - Rs. ', om.OfferValue)
            WHEN om.Offers = 9998 THEN CONCAT('Percentage', ' - ', om.OfferValue,' %')
            ELSE 
            (SELECT Misc_Name FROM Misc_Mst 
            WHERE Misc_Type = 622 AND Misc_Code = om.Offers AND Export_Type = 1) 
            END AS OfferLabel) AS AssignedOfferName,
            (SELECT TOP 1 
            concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EmpName 
            FROM EMPLOYEEMASTER WHERE EMPCODE = soc.AVAIL_EMP) AS 
            OffAVailEmp
            FROM ServOffCust soc
            JOIN 
            OfferMaster om ON soc.OFF_ID = om.UTD 
            WHERE soc.isApplied is not null 
            AND soc.Loc_Code in (${LOC_CODE}) 
            AND soc.ImportMonth = ${Month}`);
        } else if (TRAN_TYPE === '2') {
            a = await sequelize.query(`SELECT soc.* ,
            (SELECT CASE 
            WHEN om.Offers = 9999 THEN CONCAT('Amount', ' - Rs. ', om.OfferValue)
            WHEN om.Offers = 9998 THEN CONCAT('Percentage', ' - ', om.OfferValue,' %')
            ELSE 
            (SELECT Misc_Name FROM Misc_Mst 
            WHERE Misc_Type = 622 AND Misc_Code = om.Offers AND Export_Type = 1) 
            END AS OfferLabel) AS AssignedOfferName,
            (SELECT TOP 1 
            concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EmpName 
            FROM EMPLOYEEMASTER WHERE EMPCODE = soc.AVAIL_EMP) AS 
            OffAVailEmp
            FROM ServOffCust soc
            JOIN 
            OfferMaster om ON soc.OFF_ID = om.UTD  
            WHERE soc.isApplied is not null 
            AND soc.isAvailed is not null 
            AND soc.Loc_Code in (${LOC_CODE}) 
            AND soc.ImportMonth = ${Month}`);
        } else if (TRAN_TYPE === '3') {
            a = await sequelize.query(`SELECT soc.* ,
            (SELECT CASE 
            WHEN om.Offers = 9999 THEN CONCAT('Amount', ' - Rs. ', om.OfferValue)
            WHEN om.Offers = 9998 THEN CONCAT('Percentage', ' - ', om.OfferValue,' %')
            ELSE 
            (SELECT Misc_Name FROM Misc_Mst 
            WHERE Misc_Type = 622 AND Misc_Code = om.Offers AND Export_Type = 1) 
            END AS OfferLabel) AS AssignedOfferName,
            (SELECT TOP 1 
            concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EmpName 
            FROM EMPLOYEEMASTER WHERE EMPCODE = soc.AVAIL_EMP) AS 
            OffAVailEmp
            FROM ServOffCust soc
            JOIN 
            OfferMaster om ON soc.OFF_ID = om.UTD 
            WHERE soc.isApplied is not null 
            AND soc.isAvailed is null 
            AND soc.Loc_Code in (${LOC_CODE}) 
            AND soc.ImportMonth = ${Month}`);
        }
        if (a[0].length != 0) {
            res.status(200).send({
                success: true, Data: a[0]
            });
        } else {
            res.status(201).send({
                success: false
            });
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.WaHstReport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body)
        const DATE_FROM = req.body.DATE_FROM;
        const DATE_TO = req.body.DATE_TO;
        const a = await sequelize.query(`select soc.CUSTOMER_NAME,FORMAT(whb.Created_At, 'dd/MM/yyyy') AS Created_Date,
    FORMAT(whb.Created_At, 'HH:mm') AS Created_Time,whb.* from WA_HST_WEB whb JOIN ServOffCust soc ON whb.TRAN_ID = soc.UTD
        WHERE whb.Created_At BETWEEN '${DATE_FROM} 00:00:00.000' AND '${DATE_TO} 23:59:59.999'`);

        if (a[0].length != 0) {
            res.status(200).send({
                success: true, Data: a[0]
            });
        } else {
            res.status(201).send({
                success: false
            });
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.DashData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        console.log(req.body)
        const LOC_CODE = req.body.multi_loc;

        const AppliedCount = await sequelize.query(`SELECT 
             ImportMonth AS Month,
            COUNT(*) AS Count
        FROM 
            ServOffCust
        WHERE 
            isApplied IS NOT NULL AND Loc_Code in (${LOC_CODE})
        GROUP BY 
            ImportMonth
        ORDER BY 
            ImportMonth;`);

        const AvailedCount = await sequelize.query(`SELECT 
            ImportMonth AS Month,
           COUNT(*) AS Count
        FROM 
           ServOffCust
        WHERE 
           isApplied IS NOT NULL AND isAvailed is NOT NULL AND Loc_Code in (${LOC_CODE})
        GROUP BY 
           ImportMonth
        ORDER BY 
           ImportMonth;`);

        const MonthOffer = await sequelize.query(`
        SELECT 
             Month,
            COUNT(*) AS Count
        FROM 
            OfferMaster
        WHERE 
        	LOC_CODE in (${LOC_CODE})
        GROUP BY 
            Month
        ORDER BY 
            Month;
        `);
        const MonthCust = await sequelize.query(`
        SELECT 
            ImportMonth AS Month,
           COUNT(*) AS Count
        FROM 
           ServOffCust
        WHERE 
           Loc_Code in (${LOC_CODE})
        GROUP BY 
           ImportMonth
        ORDER BY 
           ImportMonth;
        `);

        if (AppliedCount[0].length != 0) {
            res.status(200).send({
                success: true, AppliedCount: AppliedCount,
                AvailedCount: AvailedCount,
                MonthOffer: MonthOffer,
                MonthCust: MonthCust,
            });
        } else {
            res.status(201).send({
                success: false
            });
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.FindGpSeq = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const LOC_CODE = req.body.LOC_CODE
        const GpSeq = await sequelize.query(`SELECT DMS_HSN_Code from Godown_Mst where Godw_Code = ${LOC_CODE}`);
        const MaxId = await sequelize.query(`SELECT isnull(MAX(GP_Seq) + 1, 1) AS MaxTran_Id FROM GP_MST WHERE Loc_Code = ${LOC_CODE}`);
        const Tran_Id = MaxId[0][0].MaxTran_Id;
        const GP_No = GpSeq[0][0].DMS_HSN_Code + '/TGP/' + `${Tran_Id}`;
        let data = {
            GP_No
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
exports.FindMasterBodyShop = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const LOC_CODE = req.body.LOC_CODE
        const MiscMst = _MiscMst(sequelize, DataTypes);
        const IncComp = await MiscMst.findAll({
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
        const ModlGrp = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ['misc_name', 'label'],
            ],
            where: {
                misc_type: 14,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });
        let data = {
            IncComp,
            ModlGrp
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
exports.FIndModlVar = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const MOD_GRP = req.body.MOD_GRP;
        if (!MOD_GRP) {
            return res.status(500).send({
                success: false,
                message: "Model Group Not selected",
            });
        }
        const a = await sequelize.query(`select CAST(Item_Code AS VARCHAR) AS value, Modl_Name AS label from Modl_mst WHERE 
        Modl_grp in (SELECT Misc_Code FROM Misc_Mst 
        where Misc_type = 14 AND Misc_Code = ${MOD_GRP})`);
        res.status(200).send({ success: true, MOD_NAME: a[0] });
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
};
exports.BodyShopClaimSave = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {

        const BodyData = JSON.parse(req.body.formData);
        const CheckActiveEntry = await sequelize.query(`SELECT * from BodyShopClaim where VEHREGNO = '${BodyData.VEHREGNO}' AND BI_INV is NULL and BR_INV is null`);
        if (CheckActiveEntry[0].length > 0) {
            return res.status(400).send({
                success: false, message: "Entry is Pending on this Registration No."
            })
        }
        const { error, value: BodyShopData } = bodyShopClaimSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true,
        });
        console.log(error, 'error')
        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            const t = await sequelize.transaction();
            const BodyShopClaim = _BodyShopClaim(sequelize, DataTypes);
            try {
                const id = await BodyShopClaim.create(
                    { ...BodyShopData, MAN_APPR_STAT: 5 },
                    { transaction: t }
                );
                if (req.files.length > 0) {
                    const EMP_DOCS_data = await uploadImagesTravel(
                        req.files,
                        req.headers?.compcode?.split("-")[0],
                        BodyShopData.Created_by,
                    );
                    const arr = [
                        "DrivingLiscence",
                        "IDCard",
                        "InsurancePolicy",
                        "CarPapers",
                        "SurveyReport",
                        "EstimateDocument",
                        "InsuranceDocument",
                        "CustInvoiceDocument",
                        "AssessmentReport"];

                    const values = EMP_DOCS_data.forEach(async (doc) => {
                        const originalIndex = arr.indexOf(doc.fieldname); // Get the index in the array
                        const srnoIndex = originalIndex >= 0 ? originalIndex + 1 : 0; // If found, add 1; if not, return 0

                        console.log(doc.fieldname, 'original Field');
                        console.log(originalIndex + 1, 'original Index'); // Display 1-based index
                        console.log(srnoIndex, 'srnoIndex');
                        if (srnoIndex > 0) {
                            const insertQuery = `
                          INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO,  path, File_Name, User_Name, Upload_Date, Export_type)
                          VALUES (
                            'BSCD', 
                            '${id.UTD}', 
                            ${srnoIndex}, 
                            '${doc.DOC_PATH}', 
                            '${doc.fieldname}', 
                            '${BodyShopData.Created_by}', 
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
                if (BodyShopData.MOBILE) {
                    const comp_name_result = await sequelize.query(`SELECT TOP 1 comp_name FROM comp_mst`);
                    const comp_name = comp_name_result[0][0]?.comp_name;
                    const Gdw_name_result = await sequelize.query(`select TOP 1 Godw_Name from Godown_Mst where Godw_Code = ${BodyData.LOC_CODE}`);
                    const Godw_name = Gdw_name_result[0][0]?.Godw_Name;
                    await SendWhatsAppMessgae(req.headers.compcode, BodyShopData.MOBILE, "bsc_recvd", [
                        {
                            type: "text",
                            text: BodyShopData.CUST_NAME,
                        },
                        {
                            type: "text",
                            text: BodyShopData.VEHREGNO,
                        },
                        {
                            type: "text",
                            text: comp_name,
                        },
                        {
                            type: "text",
                            text: Godw_name,
                        },
                    ]);
                }
                await t.commit();
                res.status(200).send({ success: true, Message: "Data Saved", UTD: id.UTD });
            } catch (error) {
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
exports.BodyShopClaimUpdate = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = JSON.parse(req.body.formData);
        const { error, value: BodyShopData } = bodyShopClaimSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true,
        });
        console.log(error, 'error')
        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            const BodyShopClaim = _BodyShopClaim(sequelize, DataTypes);
            const a = await sequelize.query(`SELECT JOB_STATUS FROM BodyShopClaim WHERE UTD = ${BodyData.UTD}`)
            if (BodyShopData.JOB_STATUS !== a[0][0].JOB_STATUS) {
                const option = [
                    {
                        value: "1",
                        label: "Vehicle Received",
                    },
                    {
                        value: "2",
                        label: "Documents Pending",
                    },
                    {
                        value: "3",
                        label: "Claim Intimation Done",
                    },
                    {
                        value: "4",
                        label: "Survery Done",
                    },
                    {
                        value: "5",
                        label: "Surveyor Approval DOne",
                    },
                    {
                        value: "6",
                        label: "Vehicle Under Investigation",
                    },
                    {
                        value: "7",
                        label: "Parts Ordered",
                    },
                    {
                        value: "8",
                        label: "Parts Received",
                    },
                    {
                        value: "9",
                        label: "Vehicle Dissmental",
                    },
                    {
                        value: "10",
                        label: "Vehicle Denting",
                    },
                    {
                        value: "11",
                        label: "Vehicle Painting",
                    },
                    {
                        value: "12",
                        label: "Vehicle Fitting",
                    },
                    {
                        value: "13",
                        label: "Vehicle Under Invoice",
                    },
                    {
                        value: "14",
                        label: "Vehicle Order Process",
                    },
                    {
                        value: "15",
                        label: "Vehicle Ready for Delivery",
                    },
                    {
                        value: "16",
                        label: "Surveyor Approval Pending",
                    },
                ];
                const jobStatusLabel = option.find((item) => item.value === BodyShopData.JOB_STATUS.toString())?.label || "Unknown Status";
                const previousJobStatusLabel = option.find((item) => item.value === a[0][0].JOB_STATUS.toString())?.label || "Unknown Status";

                const comp_name_result = await sequelize.query(`SELECT TOP 1 comp_name FROM comp_mst`);
                const comp_name = comp_name_result[0][0]?.comp_name;
                const Gdw_name_result = await sequelize.query(`select TOP 1 Godw_Name from Godown_Mst where Godw_Code = ${BodyData.LOC_CODE}`);
                const Godw_name = Gdw_name_result[0][0]?.Godw_Name;
                await SendWhatsAppMessgae(req.headers.compcode, BodyShopData.MOBILE, "bsc_stat_update", [
                    {
                        type: "text",
                        text: BodyShopData.CUST_NAME,
                    },
                    {
                        type: "text",
                        text: BodyShopData.VEHREGNO,
                    },
                    {
                        type: "text",
                        text: previousJobStatusLabel,
                    },
                    {
                        type: "text",
                        text: jobStatusLabel,
                    },
                    {
                        type: "text",
                        text: comp_name,
                    },
                    {
                        type: "text",
                        text: Godw_name,
                    },
                ]);
            }
            await BodyShopClaim.update(
                { ...BodyShopData },
                { where: { UTD: BodyData.UTD } }
            );

            if (req.files.length > 0) {
                const EMP_DOCS_data = await uploadImagesTravel(
                    req.files,
                    req.headers?.compcode?.split("-")[0],
                    BodyShopData.Created_by,
                );

                const arr = ["DrivingLiscence",
                    "IDCard",
                    "InsurancePolicy",
                    "CarPapers",
                    "SurveyReport",
                    "EstimateDocument",
                    "InsuranceDocument",
                    "CustInvoiceDocument",
                    "AssessmentReport"];
                const uploadPromises = EMP_DOCS_data.map(async (doc) => {
                    const originalIndex = arr.indexOf(doc.fieldname);
                    const srnoIndex = originalIndex >= 0 ? originalIndex + 1 : 0;

                    if (srnoIndex > 0) {
                        await sequelize.query(`
                            UPDATE DOC_UPLOAD 
                            SET export_type = 33 
                            WHERE TRAN_ID = '${BodyData.UTD}' 
                            AND SRNO = '${srnoIndex}' 
                            AND doc_type = 'BSCD'
                        `);

                        await sequelize.query(`
                            INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
                            VALUES (
                                'BSCD', 
                                '${BodyData.UTD}', 
                                ${srnoIndex}, 
                                '${doc.DOC_PATH}', 
                                '${doc.fieldname}', 
                                '${BodyShopData.Created_by}', 
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

            res.status(200).send({ success: true, Message: "Data Updated", UTD: BodyData.UTD });
        }
    } catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while updating data",
            e,
        });
    } finally {
        if (sequelize) await sequelize.close();
    }
};
exports.FindBillDataBodySHop = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const LOC_CODE = req.body.LOC_CODE;
        const BI_INV = req.body.BI_INV;
        const BR_INV = req.body.BR_INV;
        let BIBillsData = [];
        let BRBillsData = [];
        let BIRcptsData = [];
        let BRRcptsData = [];
        if (BI_INV) {
            BIBillsData = await sequelize.query(`select bill_no,bill_date, Chassis, Engine, Ledger_Name, Inv_Amt, Ledger_Id, LEDG_ACNT, Loc_Code from 
                DMS_ROW_DATA 
                WHERE bill_no = '${BI_INV}' AND CHARINDEX('BI', bill_no) > 0;`);
            console.log(BIBillsData[0].length, 'BIBillsData[0].length')
            if (BIBillsData[0].length == 0) {
                return res.status(500).send({
                    success: false,
                    message: "Invalid BI Invoice",
                });
            }
            BIRcptsData = await sequelize.query(`SELECT
                    DMS_REF1 AS rcp_no,
                    ap.Acnt_Date, ap.Post_Amt, ap.Cost_Cntr, ap.Chq_No, ap.Chq_Date, ap.Bank_Date, ap.Ledg_Ac, lm.Ledg_Name, lm.Ledg_Code from
                    acnt_post ap JOIN Ledg_Mst lm on ap.Ledg_Ac = lm.Ledg_Code
                    WHERE 
                    ap.ledg_Ac = '${BIBillsData[0][0].LEDG_ACNT}'
                    AND
                    ap.acnt_type = 1
                    AND
                    ap.bill_ref = '${BI_INV}'  
                    AND 
                    ap.Loc_Code in (${BIBillsData[0][0].Loc_Code})`);

            if (BIBillsData[0][0].Engine) {

                BRBillsData = await sequelize.query(`SELECT bill_no, bill_date, Chassis, Engine, Ledger_Name, Inv_Amt, Ledger_Id, LEDG_ACNT, Loc_Code 
                    FROM DMS_ROW_DATA 
                    WHERE Engine = '${BIBillsData[0][0].Engine}' 
                      AND Chassis = '${BIBillsData[0][0].Chassis}' 
                      AND CHARINDEX('BR', bill_no) > 0;`);

                if (BRBillsData[0].length !== 0) {
                    BRRcptsData = await sequelize.query(`SELECT
                        DMS_REF1 AS rcp_no,
                        ap.Acnt_Date, ap.Post_Amt, ap.Cost_Cntr, ap.Chq_No, ap.Chq_Date, ap.Bank_Date, ap.Ledg_Ac, lm.Ledg_Name, lm.Ledg_Code from
                        acnt_post ap JOIN Ledg_Mst lm on ap.Ledg_Ac = lm.Ledg_Code
                        WHERE 
                        ap.ledg_Ac = '${BRBillsData[0][0].LEDG_ACNT}'
                        AND
                        ap.acnt_type = 1 
                        AND 
                        ap.bill_ref = '${BRBillsData[0][0].bill_no}'
                        AND 
                        ap.Loc_Code in (${BRBillsData[0][0].Loc_Code})`);
                }
            }
        }
        if (BR_INV) {
            BRBillsData = await sequelize.query(`select bill_no,bill_date, Chassis, Engine, Ledger_Name, Inv_Amt, Ledger_Id, LEDG_ACNT, Loc_Code from 
                DMS_ROW_DATA 
                WHERE bill_no = '${BR_INV}' AND CHARINDEX('BR', bill_no) > 0;`);
            if (BRBillsData[0].length == 0) {
                return res.status(500).send({
                    success: false,
                    message: "Invalid BR Invoice",
                });
            }
            BRRcptsData = await sequelize.query(`SELECT
                    DMS_REF1 AS rcp_no,
                    ap.Acnt_Date, ap.Post_Amt, ap.Cost_Cntr, ap.Chq_No, ap.Chq_Date, ap.Bank_Date, ap.Ledg_Ac, lm.Ledg_Name, lm.Ledg_Code from
                    acnt_post ap JOIN Ledg_Mst lm on ap.Ledg_Ac = lm.Ledg_Code
                    WHERE 
                    ap.ledg_Ac = '${BRBillsData[0][0].LEDG_ACNT}'
                    AND
                    ap.acnt_type = 1
                    AND
                    ap.bill_ref = '${BR_INV}'  
                    AND 
                    ap.Loc_Code in (${BRBillsData[0][0].Loc_Code})`);

            if (BRBillsData[0][0].Engine) {
                BIBillsData = await sequelize.query(`SELECT bill_no, bill_date, Chassis, Engine, Ledger_Name, Inv_Amt, Ledger_Id, LEDG_ACNT, Loc_Code 
                FROM DMS_ROW_DATA 
                WHERE Engine = '${BRBillsData[0][0].Engine}' 
                  AND Chassis = '${BRBillsData[0][0].Chassis}' 
                  AND CHARINDEX('BI', bill_no) > 0;`);
                if (BIBillsData[0].length !== 0) {
                    BIRcptsData = await sequelize.query(`SELECT
                        DMS_REF1 AS rcp_no,
                        ap.Acnt_Date, ap.Post_Amt, ap.Cost_Cntr, ap.Chq_No, ap.Chq_Date, ap.Bank_Date, ap.Ledg_Ac, lm.Ledg_Name, lm.Ledg_Code from
                        acnt_post ap JOIN Ledg_Mst lm on ap.Ledg_Ac = lm.Ledg_Code
                        WHERE 
                        ap.ledg_Ac = '${BIBillsData[0][0].LEDG_ACNT}'
                        AND
                        ap.acnt_type = 1 
                        AND 
                        ap.bill_ref = '${BIBillsData[0][0].bill_no}'
                        AND 
                        ap.Loc_Code in (${BIBillsData[0][0].Loc_Code})`);
                }
            }
        }
        const TTL_INV =
            (BIBillsData[0] ? parseFloat(BIBillsData[0][0] ? BIBillsData[0][0]?.Inv_Amt : 0) : 0) +
            (BRBillsData[0] ? parseFloat(BRBillsData[0][0] ? BRBillsData[0][0]?.Inv_Amt : 0) : 0);

        console.log(TTL_INV, 'TTL_INV')
        res.status(200).send({ success: true, BIBillsData, BIRcptsData, BRBillsData, BRRcptsData, TTL_INV });
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
};
exports.BodyShopGatePassSave = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body.formData;
        console.log(BodyData)
        if (!BodyData.Totl_Inv_Amt || parseInt(BodyData.Totl_Inv_Amt !== '' ? BodyData.Totl_Inv_Amt : 0) <= 0) {
            return res.status(500).send({ success: false, message: "Please Fill Bill Details" })
        }
        const BodyShopClaim = _BodyShopClaim(sequelize, DataTypes);
        const t = await sequelize.transaction();
        let isVer = 0;
        if (req.body?.Rights?.includes("3.1.2") && req.body?.Rights?.includes("3.1.2")) {
            await BodyShopClaim.update(
                { isVerified: 1, VER_DATE: literal('GETDATE()'), BI_INV: BodyData.DMS_InvNo, BR_INV: BodyData.BR_InvNo },
                { where: { UTD: BodyData.UTD } },
                { transaction: t }
            );
        } else if (req.body?.Rights?.includes("3.1.1")) {
            const a = await sequelize.query(`Select isVerified from BodyShopClaim where UTD = ${BodyData.UTD}`);
            isVer = a[0][0].isVerified
            if (isVer !== 1) {
                return res.status(500).send({
                    success: false,
                    message: "Entry Not Verified by Accounts Department",
                });
            }
        }
        const { error, value: GatePassData } = gpMstSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true,
        });
        console.log(error, 'error')
        if (error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            return res.status(400).send({ success: false, message: errorMessage });
        } else {

            const GpMst = _GpMst(sequelize, DataTypes);
            const GpDtl = _GpDtl(sequelize, DataTypes);
            let InsuComp = ''
            if (BodyData.INS_COMP) {
                const InsuranceCompanyName = await sequelize.query(`SELECT Misc_Name FROM Misc_Mst where Misc_Type = 9 and Misc_Code = ${BodyData.INS_COMP}`);
                InsuComp = InsuranceCompanyName[0][0].Misc_Name;
            }
            const MaxId = await sequelize.query(`SELECT isnull(MAX(Tran_Id) + 1, 1) AS MaxTran_Id FROM GP_MST`);
            const Tran_Id = MaxId[0][0].MaxTran_Id;
            const GpSeq = await sequelize.query(`SELECT DMS_HSN_Code from Godown_Mst where Godw_Code = ${BodyData.LOC_CODE}`);
            const MaxIdNo = await sequelize.query(`SELECT isnull(MAX(GP_Seq) + 1, 1) AS MaxTran_Id FROM GP_MST WHERE Loc_Code = ${BodyData.LOC_CODE}`);
            const GP_Seq = MaxIdNo[0][0].MaxTran_Id;
            const GP_No = GpSeq[0][0].DMS_HSN_Code + '/TGP/' + `${GP_Seq}`;
            const Created_by = BodyData.Created_by;
            const Loc_Code = BodyData.LOC_CODE;
            const gpDtl = BodyData.GP_DTL
            const mapGP_DTLToColumns = (gpDtl) => {
                const mappedData = {
                    Rect1_No: gpDtl[0]?.rcp_no || null,
                    Rect2_No: gpDtl[1]?.rcp_no || null,
                    Rect3_No: gpDtl[2]?.rcp_no || null,
                    Rect4_No: gpDtl[3]?.rcp_no || null,
                    Rect5_No: gpDtl[4]?.rcp_no || null,
                    Rect1_Date: gpDtl[0]?.Acnt_Date || null,
                    Rect2_Date: gpDtl[1]?.Acnt_Date || null,
                    Rect3_Date: gpDtl[2]?.Acnt_Date || null,
                    Rect4_Date: gpDtl[3]?.Acnt_Date || null,
                    Rect5_Date: gpDtl[4]?.Acnt_Date || null,
                    Rcpt1_Amt: gpDtl[0]?.Post_Amt || null,
                    Rcpt2_Amt: gpDtl[1]?.Post_Amt || null,
                    Rcpt3_Amt: gpDtl[2]?.Post_Amt || null,
                    Rcpt4_Amt: gpDtl[3]?.Post_Amt || null,
                    Rcpt5_Amt: gpDtl[4]?.Post_Amt || null,
                    Inst_No1: gpDtl[0]?.Chq_No || null,
                    Inst_No2: gpDtl[1]?.Chq_No || null,
                    Inst_No3: gpDtl[2]?.Chq_No || null,
                    Inst_No4: gpDtl[3]?.Chq_No || null,
                    Inst_No5: gpDtl[4]?.Chq_No || null,
                    Inst_Dt1: gpDtl[0]?.Chq_Date || null,
                    Inst_Dt2: gpDtl[1]?.Chq_Date || null,
                    Inst_Dt3: gpDtl[2]?.Chq_Date || null,
                    Inst_Dt4: gpDtl[3]?.Chq_Date || null,
                    Inst_Dt5: gpDtl[4]?.Chq_Date || null
                };
                return mappedData;
            };
            const mappedData = mapGP_DTLToColumns(gpDtl);
            try {

                const GUID = await GpMst.create(
                    {
                        ...GatePassData, Tran_Id, Created_by,
                        Loc_Code, GP_No, GP_Seq, Export_Type: 1,
                        Surveyor_Name: BodyData.SURV_NAME,
                        Claim_No: BodyData.CLAIM_NO,
                        Insu_Name: InsuComp,
                        Delay_Reason: BodyData.RES_DELAY,
                        File_Date: BodyData.FILE_SUB_DATE,
                        RptRecd_date: BodyData.RPT_RECD_DATE,
                    },
                    { transaction: t }
                );
                await GpDtl.create(
                    { ...mappedData, Tran_Id, Created_by },
                    { transaction: t }
                );
                if (req.body?.Rights?.includes("3.1.1")) {
                    await BodyShopClaim.update(
                        { BI_INV: BodyData.DMS_InvNo, BR_INV: BodyData.BR_InvNo },
                        { where: { UTD: BodyData.UTD } },
                        { transaction: t }
                    );
                }
                await t.commit();
                res.status(200).send({ success: true, Message: "Data Saved", GUID: GUID.GUID });
            } catch (error) {
                console.log(error)
                res.status(500).send({
                    success: false,
                    message: "An error occurred while Saving GatePass",
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
            message: "An error occurred while Saving GatePass",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.PrintGatePass = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const GUID = req.body.GUID;
        const multi_loc = req.body.multi_loc;
        const company = await sequelize.query(`select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
        gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
        from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
        where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
        const GpData = await sequelize.query(`
        select * from GP_MST WHERE GUID = ${GUID}`);
        const GpDtlData = await sequelize.query(`
        select * from GP_DTL WHERE Tran_Id = ${GpData[0][0].Tran_Id}`);
        const BscData = await sequelize.query(`
        select * from BodyShopClaim WHERE BI_INV = '${GpData[0][0].DMS_InvNo}' OR BR_INV = '${GpData[0][0].BR_InvNo}'`);

        const reverseMappedDataToArray = (mappedData) => {
            const result = [];
            for (let i = 1; i <= 5; i++) {
                const rcp_no = mappedData[`Rect${i}_No`];
                const Acnt_Date = mappedData[`Rect${i}_Date`];
                const Post_Amt = mappedData[`Rcpt${i}_Amt`];
                const Chq_No = mappedData[`Inst_No${i}`];
                const Chq_Date = mappedData[`Inst_Dt${i}`];

                if (rcp_no || Acnt_Date || Post_Amt || Chq_No || Chq_Date) { // Only add the object if there's data
                    result.push({
                        rcp_no: rcp_no || null,
                        Acnt_Date: Acnt_Date || null,
                        Post_Amt: Post_Amt || null,
                        Chq_No: Chq_No || null,
                        Chq_Date: Chq_Date || null,
                    });
                }
            }

            return result;
        };
        const gpDtlArray = reverseMappedDataToArray(GpDtlData[0][0]);

        res.status(200).send({
            success: true, GpData: GpData[0], GpDtlData: gpDtlArray, company: company[0], BscData: BscData[0]
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.BodyShopViewTable = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc
        const BscData = await sequelize.query(`
        select 
        (SELECT TOP 1  Modl_Name FROM Modl_mst WHERE Item_Code = MOD_NAME) As ModlName,
        * from BodyShopClaim WHERE LOC_CODE in (${multi_loc})`);
        res.status(200).send({
            success: true, BscData: BscData[0]
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.BodyShopViewManager = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const STATUS = req.body.STATUS;

        const BscData = await sequelize.query(`
        select 
        (SELECT TOP 1  Modl_Name FROM Modl_mst WHERE Item_Code = MOD_NAME) As ModlName,
        (SELECT TOP 1  Misc_Name FROM Misc_Mst WHERE Misc_Type = 9 AND Misc_Code = INS_COMP) As IncCompName,
        CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1  path FROM DOC_UPLOAD WHERE Doc_Type = 'BSCD' AND DOC_UPLOAD.TRAN_ID = UTD AND Export_Type = 1 AND SRNO = 6)) As EstimateDocPath,
        CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1  path FROM DOC_UPLOAD WHERE Doc_Type = 'BSCD' AND DOC_UPLOAD.TRAN_ID = UTD AND Export_Type = 1 AND SRNO = 1)) As Image1,
        CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1  path FROM DOC_UPLOAD WHERE Doc_Type = 'BSCD' AND DOC_UPLOAD.TRAN_ID = UTD AND Export_Type = 1 AND SRNO = 2)) As Image2,
        CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1  path FROM DOC_UPLOAD WHERE Doc_Type = 'BSCD' AND DOC_UPLOAD.TRAN_ID = UTD AND Export_Type = 1 AND SRNO = 3)) As Image3,
        CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1  path FROM DOC_UPLOAD WHERE Doc_Type = 'BSCD' AND DOC_UPLOAD.TRAN_ID = UTD AND Export_Type = 1 AND SRNO = 9)) As AssessmentReportPath,
        CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1  path FROM DOC_UPLOAD WHERE Doc_Type = 'BSCD' AND DOC_UPLOAD.TRAN_ID = UTD AND Export_Type = 1 AND SRNO = 4)) As CarPapersPath,
        CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1  path FROM DOC_UPLOAD WHERE Doc_Type = 'BSCD' AND DOC_UPLOAD.TRAN_ID = UTD AND Export_Type = 1 AND SRNO = 5)) As SurveyReportPath,
        CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1  path FROM DOC_UPLOAD WHERE Doc_Type = 'BSCD' AND DOC_UPLOAD.TRAN_ID = UTD AND Export_Type = 1 AND SRNO = 8)) As CustInvoiceDocumentPath,
        CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1  path FROM DOC_UPLOAD WHERE Doc_Type = 'BSCD' AND DOC_UPLOAD.TRAN_ID = UTD AND Export_Type = 1 AND SRNO = 7)) As InsuranceDocumentPath,
        * from BodyShopClaim WHERE LOC_CODE in (${multi_loc}) AND MAN_APPR_STAT  = ${STATUS}`);
        res.status(200).send({
            success: true, BscData: BscData[0]
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.BodyShopViewPrev = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const VEHREGNO = req.body.VEHREGNO
        const CheckActiveEntry = await sequelize.query(`SELECT * from BodyShopClaim where VEHREGNO = '${VEHREGNO}' AND BI_INV is NULL and BR_INV is null`);
        console.log(CheckActiveEntry[0].length)
        if (CheckActiveEntry[0].length > 0) {
            return res.status(400).send({
                success: false, message: "Entry is Pending on this Registration No."
            })
        }
        const multi_loc = req.body.multi_loc
        let BscData;
        BscData = await sequelize.query(`
            SELECT TOP 1 
    CustomerName as CUST_NAME,
    ENGINENUM as ENGINE_NUM,
    CHASSIS as CHASSIS_NUM,
    SA as EXECUTIVE,
    RegistrationNo as GE1,
    MobileNo,
    Email,
    EstLabAmt,
    RevEstLabAmt,
    EstPartAmt,
    RevEstPartAmt,
    PromisedDt,
    RevPromisedDt,
    JobCardNo
    FROM 
        DmsImportBodyShop
    WHERE 
    RegistrationNo = '${VEHREGNO}'`);

        if (BscData[0].length > 0) {
            res.status(200).send({
                success: true, BscData, message: "Data Fetched",
            });
        } else {
            BscData = await sequelize.query(`
                SELECT TOP 1 
            CUST_NAME,
            ENGINE_NUM,
            CHASSIS_NUM,
            GE1,
            VARIANT_CD,
            (SELECT TOP 1 MOBILE2 FROM gd_fdi_trans_customer WHERE gd_fdi_trans.utd = gd_fdi_trans_customer.UTD) AS MobileNo,
            CAST(M.Modl_Grp AS VARCHAR) AS ModelGroup
            FROM 
                gd_fdi_trans
            JOIN 
            Modl_Mst M ON LEFT(M.Modl_Code, 4) = LEFT(gd_fdi_trans.VARIANT_CD, 4)
            WHERE 
            GE1 = '${VEHREGNO}' 
            AND TRANS_ID LIKE '%br%'`);
            if (BscData[0].length > 0) {
                res.status(200).send({
                    success: true, BscData, message: "Data Fetched",
                });
            } else {
                res.status(400).send({
                    success: false, BscData, message: "No Data Found",
                });
            }
        }
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.BodyShopView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const UTD = req.body.UTD;
        const BscData = await sequelize.query(`
            select * from BodyShopClaim WHERE UTD = ${UTD}`);
        const images = await sequelize.query(`select * from doc_upload 
                where tran_id='${UTD}' and doc_type = 'BSCD' AND EXPORT_TYPE < 5 order by srno`);
        let GpData = []
        let GpDtlData = []
        if (BscData[0][0].BI_INV || BscData[0][0].BR_INV) {
            GpData = await sequelize.query(`
                select * from GP_MST WHERE DMS_InvNo = '${BscData[0][0].BI_INV}' OR BR_InvNo = '${BscData[0][0].BR_INV}'`);
            if (GpData[0].length > 0) {
                GpDtlData = await sequelize.query(`
                    select * from GP_DTL WHERE Tran_Id = ${GpData[0][0].Tran_Id}`);
            }
        }
        const reverseMappedDataToArray = (mappedData) => {
            const result = [];
            for (let i = 1; i <= 5; i++) {
                const rcp_no = mappedData[`Rect${i}_No`];
                const Acnt_Date = mappedData[`Rect${i}_Date`];
                const Post_Amt = mappedData[`Rcpt${i}_Amt`];
                const Chq_No = mappedData[`Inst_No${i}`];
                const Chq_Date = mappedData[`Inst_Dt${i}`];

                if (rcp_no || Acnt_Date || Post_Amt || Chq_No || Chq_Date) { // Only add the object if there's data
                    result.push({
                        rcp_no: rcp_no || null,
                        Acnt_Date: Acnt_Date || null,
                        Post_Amt: Post_Amt || null,
                        Chq_No: Chq_No || null,
                        Chq_Date: Chq_Date || null,
                    });
                }
            }
            return result;
        };
        let gpDtlArray = [];
        if (GpDtlData[0]) {
            gpDtlArray = reverseMappedDataToArray(GpDtlData[0][0]);
        }
        res.status(200).send({
            success: true, GpData: GpData[0] ? GpData[0] : [], images: images[0] ? images[0] : [], GpDtlData: gpDtlArray ? gpDtlArray : [], BscData: BscData[0] ? BscData[0] : []
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.VerifyEstMan = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        console.log(BodyData)
        const BodyShopClaim = _BodyShopClaim(sequelize, DataTypes);
        await BodyShopClaim.update(
            { MAN_APPR_STAT: 5 },
            { where: { UTD: BodyData.UTD } }
        );
        res.status(200).send({ success: true, Message: "Data Updated" });

    } catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while updating data",
            e,
        });
    } finally {
        if (sequelize) await sequelize.close();
    }
};
exports.VerifyClaim = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        console.log(BodyData)
        const BodyShopClaim = _BodyShopClaim(sequelize, DataTypes);
        await BodyShopClaim.update(
            { isVerified: 1, ACC_APPR_CODE: BodyData.ACC_APPR_CODE, VER_REM: BodyData.VER_REM, VER_DATE: literal('GETDATE()') },
            { where: { UTD: BodyData.UTD } }
        );
        res.status(200).send({ success: true, Message: "Data Updated" });

    } catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while updating data",
            e,
        });
    } finally {
        if (sequelize) await sequelize.close();
    }
};
exports.VerifyEstimateMan = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        console.log(BodyData)
        const BodyShopClaim = _BodyShopClaim(sequelize, DataTypes);
        await BodyShopClaim.update(
            { BSM_APPR_CODE: BodyData.user_code, MAN_APPR_STAT: 1, MAN_APPR_REM: BodyData.MAN_APPR_REM, MAN_APPR_DATE: literal('GETDATE()') },
            { where: { UTD: BodyData.UTD } }
        );
        res.status(200).send({ success: true, Message: "Data Updated" });

    } catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while updating data",
            e,
        });
    } finally {
        if (sequelize) await sequelize.close();
    }
};
exports.RejectEstimateMan = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        console.log(BodyData)
        const BodyShopClaim = _BodyShopClaim(sequelize, DataTypes);
        await BodyShopClaim.update(
            { MAN_APPR_STAT: 0, MAN_APPR_REM: BodyData.MAN_APPR_REM, MAN_APPR_DATE: literal('GETDATE()') },
            { where: { UTD: BodyData.UTD } }
        );
        res.status(200).send({ success: true, Message: "Data Updated" });

    } catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while updating data",
            e,
        });
    } finally {
        if (sequelize) await sequelize.close();
    }
};
exports.DMSImportExcel = async function (req, res, next) {
    console.log(req.body);
    const sequelize = await dbname(req.headers.compcode);

    try {
        const DmsImportBodyShop = _DmsImportBodyShop(sequelize, DataTypes);
        const excelFile = req.files["excel"][0];
        const workbook = xlsx.read(excelFile.buffer, { type: "buffer", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        const headers = rawData[6];
        const data = [];

        const toCamelCase = (str) => {
            return str
                .trim()
                .replace(/[^\w\s]/g, '')
                .replace(/\s+([a-zA-Z])/g, (_, chr) => chr.toUpperCase())
                .replace(/^./, (chr) => chr.toUpperCase());
        };

        for (let i = 7; i < rawData.length; i++) {
            const row = rawData[i];
            if (row.every(cell => cell === undefined || cell === null || cell === '')) {
                break;
            }
            let rowData = {};
            headers.forEach((header, index) => {
                const formattedHeader = toCamelCase(header);
                rowData[formattedHeader] = row[index] !== undefined ? row[index] : "";
            });
            data.push(rowData);
        }
        console.log(data.length, 'datadata')
        if (data.length == 0) {
            await sequelize.close();
            return res.status(500).send({ Message: "No valid data found in Excel or invalid format" });
        }
        // const t = await sequelize.transaction();
        const ErroredData = [];
        const CorrectData = [];
        const itemCode = data.map(obj => `'${obj.JobCardNo}'`);

        const item_code = await sequelize.query(`select distinct(JobCardNo) AS ic from DmsImportBodyShop where JobCardNo in (${itemCode.length ? itemCode : `''`})`);
        function validateRegistrationNo(RegistrationNo) {
            if (RegistrationNo == '' || RegistrationNo == null || RegistrationNo == undefined) {
                return false;
            }
            else {
                return true;
            }
        }

        data.map((obj) => {
            const rejectionReasons = [];
            const duplicateChassis = data.filter(item => item.CHASSIS?.toString() === obj.CHASSIS?.toString());
            if (duplicateChassis.length >= 2 && obj.CHASSIS) {
                rejectionReasons.push(`Duplicate CHASSIS No (${obj.CHASSIS}) found ${duplicateChassis.length} times in this Excel`);
            }
            const duplicateEngineNum = data.filter(item => item.ENGINENUM?.toString() === obj.ENGINENUM?.toString());
            if (duplicateEngineNum.length >= 2 && obj.ENGINENUM) {
                rejectionReasons.push(`Duplicate ENGINENUM No (${obj.ENGINENUM}) found ${duplicateEngineNum.length} times in this Excel`);
            }
            const duplicateRegistrationNo = data.filter(item => item.RegistrationNo?.toString() === obj.RegistrationNo?.toString());
            if (duplicateRegistrationNo.length >= 2 && obj.RegistrationNo) {
                rejectionReasons.push(`Duplicate Registration No (${obj.RegistrationNo}) found ${duplicateRegistrationNo.length} times in this Excel`);
            }
            const BlankRegistrationNo = data.filter(item => validateRegistrationNo(item.RegistrationNo?.toString()));

            if (BlankRegistrationNo.length >= 2 && !obj.RegistrationNo) {
                rejectionReasons.push(`Registration No. Not found`);
            }


            if (item_code[0].some(item => item.ic?.toString().toUpperCase() == obj.JobCardNo?.toString().toUpperCase())) {
                rejectionReasons.push(`Job Card No  ${obj.JobCardNo} Already Exist`, ' | ');
            }
            if (rejectionReasons.length > 0) {
                ErroredData.push({
                    ...obj,
                    rejectionReasons: rejectionReasons.join(' | ')
                });
            } else {
                CorrectData.push(obj);
            }
        });
        console.log(CorrectData, 'CorrectData')
        let DmsImportBodyShop_
        if (CorrectData.length) {
            try {
                const a = CorrectData.map(item => {
                    const dateFields = ['JCDateTime', 'SaleDate', 'RevPromisedDt', 'PromisedDt', 'CHKIN_DT', 'CHKOUT_DT'];

                    const convertedItem = Object.keys(item).reduce((acc, key) => {
                        acc[key] = dateFields.includes(key)
                            ? (item[key] ? adjustToIST(item[key]) : null)
                            : (item[key] ? item[key].toString() : '');
                        return acc;
                    }, {});

                    return {
                        ...convertedItem,
                        Created_by: req.body.created_by,
                        Loc_Code: req.body.Loc_Code,
                        ImportDate: req.body.IMPORT_DATE,
                    };
                });

                DmsImportBodyShop_ = await DmsImportBodyShop.bulkCreate(
                    a,
                    // { transaction: t }
                );

            } catch (error) {
                console.error('Error inserting data into DmsImportBodyShop:', error);
                // await t.rollback();
            }
            // await t.commit();
            return res.status(200).send({
                ErroredData: ErroredData,
                CorrectData: CorrectData,
                Message: `${DmsImportBodyShop_?.length} Records Inserted`,
                Type: 'success'
            });
        } else {
            return res.status(200).send({
                ErroredData: ErroredData,
                CorrectData: CorrectData,
                Message: `No Valid Data`,
                Type: 'warning'
            });
        }
    } catch (error) {
        // if (t && !t.finished) {
        //     await t.rollback();
        // }
        console.error("Error:", error);
        res.status(500).json({ Message: "An error occurred during file import." });
    } finally {
        await sequelize.close();
        console.error("Connection has been closed");

    }
};
exports.JobcardsTrack = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const Date = adjustToIST(req.body.Date);

        const ImportData = await sequelize.query(`
            SELECT COUNT(*) AS Tot, FORMAT(ImportDate, 'dd-MM-yyyy') AS Created_At 
            FROM DmsImportBodyShop 
            WHERE CAST(ImportDate AS DATE) = CAST('${Date}' AS DATE) 
            AND Loc_Code IN (${multi_loc}) 
            GROUP BY ImportDate
        `);

        const BscData = await sequelize.query(`
            SELECT COUNT(*) AS Tot, FORMAT(Created_At, 'dd-MM-yyyy') AS Created_At 
            FROM BodyShopClaim 
            WHERE CAST(Created_At AS DATE) = CAST('${Date}' AS DATE) 
            AND LOC_CODE IN (${multi_loc}) 
            GROUP BY FORMAT(Created_At, 'dd-MM-yyyy');
        `);
        const ImportDataDtl = await sequelize.query(`
            SELECT * 
            FROM DmsImportBodyShop 
            WHERE CAST(ImportDate AS DATE) = CAST('${Date}' AS DATE) 
            AND Loc_Code IN (${multi_loc}) 
        `);

        const BscDataDtl = await sequelize.query(`
            SELECT * 
            FROM BodyShopClaim 
            WHERE CAST(Created_At AS DATE) = CAST('${Date}' AS DATE) 
            AND LOC_CODE IN (${multi_loc}) 
        `);
        const Pending = await sequelize.query(`
            SELECT * 
            FROM DmsImportBodyShop WHERE
            RegistrationNo NOT in (SELECT VEHREGNO FROM BodyShopClaim WHERE CAST(Created_At AS DATE) = CAST('${Date}' AS DATE) 
            AND LOC_CODE IN (${multi_loc}))  AND CAST(ImportDate AS DATE) = CAST('${Date}' AS DATE) 
            AND Loc_Code IN (${multi_loc})
        `);

        res.status(200).send({
            success: true,
            BscData: BscData[0],
            ImportData: ImportData[0],
            ImportDataDtl: ImportDataDtl[0],
            BscDataDtl: BscDataDtl[0],
            Pending: Pending[0]
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while fetching data.",
            error: e,
        });
    } finally {
        await sequelize.close();
    }
};

exports.claimReport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const DATE_FROM = req.body.DATE_FROM
        const DATE_TO = req.body.DATE_TO
        const multi_loc = req.body.multi_loc
        const Status = req.body.Status
        let BscData = [];
        if (Status == 7) {
            BscData = await sequelize.query(`
           select 
   (SELECT Tran_Id from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TranId,
   (SELECT Totl_inv_Amt from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TotalInvAmt,
   (SELECT GP_Date from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as GpDate,
   CASE WHEN ACC_APPR_CODE is null THEN (SELECT Created_by from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) 
   ELSE (SELECT TOP 1 User_Name from user_tbl where User_Code = ACC_APPR_CODE) END AS GatePassApprover,
   * from BodyShopClaim WHERE LOC_CODE in (${multi_loc}) and Created_At BETWEEN '${DATE_FROM}' AND '${DATE_TO}'`);
        } else if (Status == 1) {
            BscData = await sequelize.query(`
                select 
        (SELECT Tran_Id from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TranId,
        (SELECT Totl_inv_Amt from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TotalInvAmt,
        (SELECT GP_Date from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as GpDate,
        CASE WHEN ACC_APPR_CODE is null THEN (SELECT Created_by from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) 
        ELSE (SELECT TOP 1 User_Name from user_tbl where User_Code = ACC_APPR_CODE) END AS GatePassApprover,
        * from BodyShopClaim WHERE BI_INV is null AND BR_INV is null AND  LOC_CODE in (${multi_loc}) and Created_At BETWEEN '${DATE_FROM}' AND '${DATE_TO}' `);
        } else if (Status == 2) {
            BscData = await sequelize.query(`
                select 
        (SELECT Tran_Id from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TranId,
        (SELECT Totl_inv_Amt from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TotalInvAmt,
        (SELECT GP_Date from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as GpDate,
        CASE WHEN ACC_APPR_CODE is null THEN (SELECT Created_by from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) 
        ELSE (SELECT TOP 1 User_Name from user_tbl where User_Code = ACC_APPR_CODE) END AS GatePassApprover,
        * from BodyShopClaim WHERE (BI_INV is not null OR BR_INV is not null) AND  LOC_CODE in (${multi_loc}) and Created_At BETWEEN '${DATE_FROM}' AND '${DATE_TO}' `);
        } else if (Status == 3) {
            BscData = await sequelize.query(`
                select 
        (SELECT Tran_Id from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TranId,
        (SELECT Totl_inv_Amt from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TotalInvAmt,
        (SELECT GP_Date from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as GpDate,
        CASE WHEN ACC_APPR_CODE is null THEN (SELECT Created_by from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) 
        ELSE (SELECT TOP 1 User_Name from user_tbl where User_Code = ACC_APPR_CODE) END AS GatePassApprover,
        * from BodyShopClaim WHERE MAN_APPR_STAT = 5 AND  LOC_CODE in (${multi_loc}) and Created_At BETWEEN '${DATE_FROM}' AND '${DATE_TO}' `);
        } else if (Status == 4) {
            BscData = await sequelize.query(`
                select 
        (SELECT Tran_Id from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TranId,
        (SELECT Totl_inv_Amt from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TotalInvAmt,
        (SELECT GP_Date from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as GpDate,
        CASE WHEN ACC_APPR_CODE is null THEN (SELECT Created_by from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) 
        ELSE (SELECT TOP 1 User_Name from user_tbl where User_Code = ACC_APPR_CODE) END AS GatePassApprover,
        * from BodyShopClaim WHERE MAN_APPR_STAT = 1 AND  LOC_CODE in (${multi_loc}) and Created_At BETWEEN '${DATE_FROM}' AND '${DATE_TO}' `);
        } else if (Status == 5) {
            BscData = await sequelize.query(`
                select 
        (SELECT Tran_Id from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TranId,
        (SELECT Totl_inv_Amt from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TotalInvAmt,
        (SELECT GP_Date from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as GpDate,
        CASE WHEN ACC_APPR_CODE is null THEN (SELECT Created_by from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) 
        ELSE (SELECT TOP 1 User_Name from user_tbl where User_Code = ACC_APPR_CODE) END AS GatePassApprover,
        * from BodyShopClaim WHERE isVerified is null AND  LOC_CODE in (${multi_loc}) and Created_At BETWEEN '${DATE_FROM}' AND '${DATE_TO}' `);
        } else if (Status == 6) {
            BscData = await sequelize.query(`
                select 
        (SELECT Tran_Id from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TranId,
        (SELECT Totl_inv_Amt from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as TotalInvAmt,
        (SELECT GP_Date from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) as GpDate,
        CASE WHEN ACC_APPR_CODE is null THEN (SELECT Created_by from GP_MST where (BI_INV = DMS_InvNo OR BR_INV = BR_InvNo)) 
        ELSE (SELECT TOP 1 User_Name from user_tbl where User_Code = ACC_APPR_CODE) END AS GatePassApprover,
        * from BodyShopClaim WHERE isVerified = 1 AND  LOC_CODE in (${multi_loc}) and Created_At BETWEEN '${DATE_FROM}' AND '${DATE_TO}' `);
        }
        res.status(200).send({
            success: true, BscData: BscData[0]
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Fetching Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};

exports.GlanceExport = async function (req, res) {
    const sequelize = await dbname(req.query.compcode);
    const data = req.query;
    const dateto = data.dateto;
    const dateFrom = data.dateFrom;
    const Loc_Code = data.Loc_Code;

    try {
        const txnDetails = await sequelize.query(
            `SELECT JobCardNo AS Job_Card_No, CAST(JCDateTime AS DATE) as Job_Card_Date, ServiceType,
CustomerName AS Customer_Name, RegistrationNo AS Registration_No,  CHASSIS AS Chassis_No, ENGINENUM AS Engine_No, Model, Variant, Color, SA AS Service_Advisor ,
(SELECT TOP 1 CLAIM_TYPE FROM  BodyShopClaim WHERE VEHREGNO = RegistrationNo AND BodyShopClaim.JOB_CARD_NO = DmsImportBodyShop.JobCardNo) AS Created_transaction_type,
(SELECT TOP 1 TOT_EST FROM  BodyShopClaim WHERE VEHREGNO = RegistrationNo AND BodyShopClaim.JOB_CARD_NO = DmsImportBodyShop.JobCardNo) AS Total_Estimate,
(SELECT TOP 1 CLAIM_NO FROM  BodyShopClaim WHERE VEHREGNO = RegistrationNo AND BodyShopClaim.JOB_CARD_NO = DmsImportBodyShop.JobCardNo) AS Claim_No,
(SELECT TOP 1 CAST(EXP_DELV_DATE AS DATE) FROM  BodyShopClaim WHERE VEHREGNO = RegistrationNo AND BodyShopClaim.JOB_CARD_NO = DmsImportBodyShop.JobCardNo) AS Expected_Delivery_Date,
(SELECT TOP 1 UTR_NO FROM  BodyShopClaim WHERE VEHREGNO = RegistrationNo AND BodyShopClaim.JOB_CARD_NO = DmsImportBodyShop.JobCardNo) AS UTR_NO,
(SELECT TOP 1 INS_DO_NO FROM  BodyShopClaim WHERE VEHREGNO = RegistrationNo AND BodyShopClaim.JOB_CARD_NO = DmsImportBodyShop.JobCardNo) AS Insurance_DO_NO,
(SELECT TOP 1 CAST(FILE_SUB_DATE AS DATE) FROM  BodyShopClaim WHERE VEHREGNO = RegistrationNo AND BodyShopClaim.JOB_CARD_NO = DmsImportBodyShop.JobCardNo) AS File_Submission_Date
FROM DmsImportBodyShop WHERE Loc_Code in (${Loc_Code})`);
        const Company_Name = await sequelize.query(
            `select top 1 comp_name from Comp_Mst`
        );
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
        worksheet.getCell("A2").value = `All BodyShop Data Imported vs Created Entries`;
        worksheet.getCell("A2").alignment = {
            vertical: "middle",
            horizontal: "center",
        };

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
            const row = worksheet.addRow(values);
            row.eachCell((cell, colNumber) => {
                if (colNumber >= 12) {
                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFB6C1" }
                    };
                }
            });
        });

        res.status(200)
            .setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="AllJobCards.xlsx"'
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
        if (sequelize) {
            await sequelize.close();
        }
    }
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const processMainData = async (mainData, CompCode, User_Code, Created_by) => {
    const backgroundTasks = [];
    const sequelize = await dbname(CompCode);
    try {
        const comp_name_result = await sequelize.query(`SELECT TOP 1 comp_name FROM comp_mst`);
        const comp_name = comp_name_result[0][0]?.comp_name;
        translateToHindi(comp_name_result[0][0]?.comp_name);
        for (const item of mainData) {
            const CustDetails = await sequelize.query(`select * from ServOffCust WHERE UTD = ${item.SRNO}`);
            const a = await sequelize.query(`SELECT (SELECT TC_DESC from OfferDtl WHERE Mst_ID = OfferMaster.UTD FOR JSON PATH , INCLUDE_NULL_VALUES) AS x,*,
            CASE 
             WHEN Offers = 9999 THEN CONCAT('Amount', ' - Rs. ', OfferValue)
            WHEN Offers = 9998 THEN CONCAT('Percentage', ' - ', OfferValue,' %')
            ELSE 
        (SELECT Misc_Name FROM Misc_Mst 
        WHERE Misc_Type = 622 AND Misc_Code = Offers AND Export_Type = 1) 
        END AS OfferLabel FROM OfferMaster WHERE UTD = ${CustDetails[0][0].OFF_ID}`);

            if (a[0] && Array.isArray(a[0])) {
                a[0] = a[0].map(row => {
                    if (row.x) {
                        row.x = JSON.parse(row.x);
                        row.x = row.x.map(item => Object.values(item).join('| ')).join('| ');
                    }
                    return row;
                });
            }
            console.log(a[0][0].x)
            if (CustDetails[0][0].MOBILE?.length && CustDetails[0][0].MOBILE) {
                backgroundTasks.push(async () => {
                    const translatedCustomerName = CustDetails[0][0]?.CUSTOMER_NAME;
                    const translatedCompName1 = await translateToHindi(comp_name);
                    const qrLink = `https://erp.autovyn.com/backend/fetch?filePath=${CustDetails[0][0].QR_PATH}`;
                    const translatedX = a[0][0].x;

                    await SendWhatsAppMessgaeHindi(CompCode, CustDetails[0][0].MOBILE, 'kmpl_offer', [
                        { "type": "text", "text": translatedCustomerName },
                        { "type": "text", "text": qrLink },
                        { "type": "text", "text": translatedX }
                    ]);

                    const sequelizeBackground = await dbname(CompCode);
                    const WaHstWeb = _WaHstWeb(sequelizeBackground, DataTypes);
                    try {
                        await WaHstWeb.create({
                            User_Code: User_Code,
                            Temp_Name: "kmpl_offer",
                            Mobile_No: CustDetails[0][0].MOBILE,
                            Created_by: Created_by,
                            TRAN_ID: item.SRNO
                        });
                    } catch (error) {
                        console.error('Error inserting into WaHstWeb:', error);
                    } finally {
                        await sequelizeBackground.close();
                    }
                });
            }
            console.log({
                success: true,
                Message: `${backgroundTasks.length} Messages in queue`
            });
        }

        return {
            success: true,
            message: 'Main data processing initiated'
        };
    } catch (e) {
        console.error(e);
        throw e;
    } finally {
        await sequelize.close();
        setTimeout(async () => {
            try {
                for (const task of backgroundTasks) {
                    await task();
                    await delay(2000);
                }
            } catch (err) {
                console.error('Error executing background tasks:', err);
            }
        }, 1000);
    }
};
async function uploadImagesTravel(files, Comp_Code, Created_by) {
    try {
        let dataArray = [];
        console.log(files);
        await Promise.all(files?.map(async (file, index) => {
            const customPath = `${Comp_Code}/BodyShopClaimDocs/`;
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
                columndoc_type: "BODYSHOP",
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
function formatDate(date) {
    const pad = (num) => String(num).padStart(2, '0');

    const day = pad(date.getDate());
    const month = pad(date.getMonth() + 1);
    const year = date.getFullYear();
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `BATCH-${day}${month}${year}${hours}${minutes}${seconds}`;
};
async function translateToHindiWithDelay(text, delayTime = 1000) {
    await delay(delayTime);
    return translateToHindi(text);
};
async function translateToHindi(text) {
    try {
        const res = await translatte(text, { to: 'hi' });
        console.log(`Translated text: ${res.text}`);
        return res.text;
    } catch (err) {
        console.error(err);
        return text;
    }
};
async function uploadImages(files, Comp_Code, Created_by) {
    try {
        let dataArray = [];
        await Promise.all(files?.map(async (file, index) => {
            const customPath = `${Comp_Code}/SERV_OFF/`;
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
                SRNO: file.CustUtd,
                Created_by: Created_by,
                DOC_NAME: file.originalname,
                misspunch_inout: file.AssignedOffer,
                columndoc_type: "SERV_OFF",
                DOC_PATH: `${customPath}${fileName}`,
            };
            dataArray.push(data);
        }));
        return dataArray;
    } catch (e) {
        console.log(e);
    }
};
function adjustToIST(dateStr) {
    if (!dateStr) return null; // Handle null or undefined date
    const date = new Date(dateStr);
    if (isNaN(date)) return null; // Return null if invalid date
    date.setHours(date.getHours() + 5); // Add 5 hours
    date.setMinutes(date.getMinutes() + 31); // Add 31 minutes
    const ISTDateStr = date.toISOString();
    return ISTDateStr.slice(0, 10); // Return date in YYYY-MM-DD format
};



//komal
//_Pick_Drop_Collection, PickDropCollectionSchema
exports.SavePicknDrop = async function (req, res) {
    const { tran_id, ...General } = req.body.Formdata;
    const UTD = req.body.UTD;
    const Location = General.Location;
    const Veh_Req = General.Veh_Req;
    const Bill_No = General.Bill_No;
    console.log(req.body, "request.body");
    // Validate Asset Product data
    const { error: requestError, value: validatedData } =
        PickDropCollectionSchema.validate(General, {
            abortEarly: false,
            stripUnknown: true,
        });

    // Check if any validation errors occurred
    if (requestError) {
        const errors = requestError.details.map((err) => err.message);
        return res.status(400).send({ success: false, message: errors.join(", ") });
    }

    let t;
    try {
        const sequelize = await dbname(req.headers.compcode);
        t = await sequelize.transaction();

        // const result =
        //     await sequelize.query(`SELECT UPPER(REPLACE(LTRIM(RTRIM(Veh_Req)), ' ', '')) AS Veh_Req , UPPER(REPLACE(LTRIM(RTRIM(Bill_No)), ' ', '')) AS Bill_No
        // FROM Pick_Drop_Collection 
        // WHERE Location = '${Location}' 
        // AND (LTRIM(RTRIM(Veh_Req))) = '${Veh_Req}' AND (LTRIM(RTRIM(Bill_No))) = '${Bill_No}' `);

        // if (result[0].length > 0) {
        //     res.status(400).send({ message: "Already Out" });
        //     return;
        // }

        console.log(validatedData, "validatedData");
        // Create the Asset Product
        const PickDrop = _Pick_Drop_Collection(sequelize, DataTypes);
        const createdPickDrop = await PickDrop.create(validatedData, {
            transaction: t,
        });
        const Update = await sequelize.query(`Update  In_service set outTime = getdate() where outtime is null and UTD = ${UTD ? UTD : "''"}`)
        await t.commit();

        // Prepare response
        const response = {
            Status: "true",
            Message: "Out Sucessfully",
            Result: {},
            General: PickDrop,
        };
        res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error.original);
        if (t) {
            await t.rollback();
        }
        res.status(500).json({ error: "An error occurred during Saving." });
    }
};

exports.PaymentMode = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);

        const Driver_Code = req.body.Driver_Code;
        const branchQuery = `
          SELECT Misc_Code AS value, Misc_Name AS label 
          FROM misc_mst 
          WHERE misc_type = 39 AND export_type < 3`;

        const mobileQuery = `select MOBILE_NO from EMPLOYEEMASTER where empcode = '${Driver_Code}'`;

        const branch = await sequelize.query(branchQuery);
        const result = await sequelize.query(mobileQuery);

        res.status(200).send({
            Branch: branch[0],
            result: result[0][0],
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: "An error occurred while fetching data." });
    }
};

exports.PickDropView = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const Location = req.body.Location;
        const DateFrom = req.body.DateFrom;
        const DateTo = req.body.DateTo;
        let query = `Select tran_id, Req_Date, Bill_Date, time, Veh_Req, Customer_Name, Customer_Mob, Performa_Inv, Bill_No, Inv_Amt, Driver_Name AS Driver_Code,
        (SELECT CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.EMPCODE = Driver_Name) AS Driver_Name, Driver_Mob,
        (select top 1 godw_name from GODOWN_MST where GODOWN_MST.Godw_Code = Pick_Drop_Collection.Location) as Loc_Code, Location, IsUpdate, CASE 
        WHEN Mode_Payment = '3' THEN 'Pick and drop' 
        ELSE Mode_Payment 
    END AS Mode_Payment, Amount_Paid, Short_Access from Pick_Drop_Collection where  Mode_Payment = '3' and Location in (${Location}) and CAST(Req_Date AS DATE) BETWEEN '${DateFrom}' and '${DateTo}' order by tran_id desc`;

        const branch = await sequelize.query(query);
        res.status(200).send(branch[0]);
    } catch (e) {
        console.log(e);
    }
};

exports.PickDropViewForUpdate = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const Tran_id = req.body.Tran_id;
        let query = `Select Bill_Date, time, Veh_Req, Customer_Name, Customer_Mob, Performa_Inv, Bill_No, Inv_Amt, Driver_Name, Driver_Mob, Mode_Payment from Pick_Drop_Collection where tran_id = '${Tran_id}';`;

        const branch = await sequelize.query(query);
        res.status(200).send(branch[0][0]);
    } catch (e) {
        console.log(e);
    }
};

//_Pick_Drop_Collection, PickDropCollectionSchema
exports.UpdateDataforPicknDrop = async function (req, res) {
    console.log(req.body, "s;s;s;");
    const {
        Bill_Date,
        Time,
        Veh_Req,
        Customer_Name,
        Customer_Mob,
        Performa_Inv,
        Bill_No,
        Inv_Amt,
        Driver_Name,
        Driver_Mob,
        Receipt_Amt,
        ...other
    } = req.body.Formdata;
    const { tran_id } = req.body;
    const { error: requestError, value: PickData } =
        PickDropCollectionSchema.validate(other);

    if (requestError) {
        const errors = requestError ? requestError.details : [];
        const errorMessage = errors.map((err) => err.message).join(", ");
        return res.status(400).send({ success: false, message: errorMessage });
    }

    // let t;
    try {
        const sequelize = await dbname(req.headers.compcode);
        // t = await sequelize.transaction();
        console.log(tran_id, "tran_id");
        const PickDropData = _Pick_Drop_Collection(sequelize, Sequelize.DataTypes);
        const PickDropData1 = await PickDropData.update(PickData, {
            where: { tran_id: tran_id },
            // transaction: t,
            returning: true,
        });

        const IsUpdate = await sequelize.query(
            `update Pick_Drop_Collection set IsUpdate = '1' where tran_id = '${tran_id}'`
        );
        // await t.commit();
        const response = {
            Status: true,
            Message: "Updated Successfully",
        };
        res.status(200).json(response);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to create purchase request" });
    }
};

exports.PickDropBeforeView = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const Location = req.body.Location;
        const DateFrom = req.body.DateFrom;
        const DateTo = req.body.DateTo;
        //   let query = `Select tran_id, Bill_Date,Bill_No,MAX(Ledger_Name) AS Ledger_Name,(select top 1 ledg_ph1 from Ledg_Mst where Ledg_Mst.Ledg_Code = DMS_ROW_DATA.LEDG_ACNT) as Customer_Mob,
        //   (select top 1 Reg_No from CHAS_MST where Chas_No = DMS_ROW_DATA.Chassis) as Veh_Reg,
        // SUM(taxable + CGST +SGST+IGST+Cess_Amt ) AS Inv_Amt, (select top 1 godw_name from GODOWN_MST where Godw_Code = DMS_ROW_DATA.Loc_Code) as Location, Chassis, Engine, VIN from DMS_ROW_DATA
        //   WHERE Tran_Type = 4 AND Export_Type IN (1,2) and Loc_Code in (${Location}) and CAST(Bill_Date AS DATE) BETWEEN '${DateFrom}' and '${DateTo}'
        // group by bill_no, LEDG_ACNT, Chassis , tran_id, Bill_Date, Loc_Code, Engine, VIN, Chassis`;

        let query = `SELECT 
        MAX(gd_fdi_trans.utd) AS tran_id, MAX(TRANS_DATE) AS Bill_Date, 
      TRANS_ID AS Bill_No, 
      MAX(gd_fdi_trans.CUST_NAME) AS Ledger_Name, 
      MAX(gd_fdi_trans_customer.MOBILE2) AS Customer_Mob,
      MAX(GE1) AS Veh_Reg, 
      ROUND(SUM(SERVICE_AMOUNT), 2) AS Inv_Amt, 
      (SELECT TOP 1 godw_name 
       FROM GODOWN_MST 
       WHERE REPLACE(NEWCAR_RCPT, '-S', '') = MAX(gd_fdi_trans.LOC_CD)) AS Location,
       (SELECT TOP 1 Godw_Code
        FROM GODOWN_MST
        WHERE REPLACE(NEWCAR_RCPT, '-S', '') = MAX(gd_fdi_trans.LOC_CD)) AS Loc_Code
    FROM 
      gd_fdi_trans
    LEFT JOIN 
      gd_fdi_trans_customer ON gd_fdi_trans_customer.UTD = gd_fdi_trans.UTD
    WHERE 
      TRANS_TYPE = 'WI' 
      AND TRANS_SEGMENT NOT IN ('BANDP') 
      AND CAST(TRANS_DATE AS DATE) BETWEEN '${DateFrom}' and '${DateTo}' 
      AND gd_fdi_trans.LOC_CD IN (SELECT REPLACE(NEWCAR_RCPT, '-S', '') 
                                  FROM GODOWN_MST 
                                  WHERE GODW_CODE IN (${Location}))
    GROUP BY 
      TRANS_ID ORDER BY tran_id DESC`;
        const branch = await sequelize.query(query);
        res.status(200).send(branch[0]);
    } catch (e) {
        console.log(e);
    }
};

exports.PickDropBeforeViewForMobile = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const Location = req.body.Location;
        const DateFrom = req.body.DateFrom;
        const DateTo = req.body.DateTo;
        const Veh_Req = req.body.Veh_Req;
        let query = `SELECT 
          MAX(gd_fdi_trans.utd) AS tran_id, MAX(TRANS_DATE) AS Bill_Date, 
        TRANS_ID AS Bill_No, 
        MAX(gd_fdi_trans.CUST_NAME) AS Ledger_Name, 
        MAX(gd_fdi_trans_customer.MOBILE2) AS Customer_Mob,
        MAX(GE1) AS Veh_Reg, 
        ROUND(SUM(SERVICE_AMOUNT), 2) AS Inv_Amt, 
        (SELECT TOP 1 godw_name 
         FROM GODOWN_MST 
         WHERE REPLACE(NEWCAR_RCPT, '-S', '') = MAX(gd_fdi_trans.LOC_CD)) AS Location,
         (SELECT TOP 1 Godw_Code
          FROM GODOWN_MST
          WHERE REPLACE(NEWCAR_RCPT, '-S', '') = MAX(gd_fdi_trans.LOC_CD)) AS Loc_Code
      FROM 
        gd_fdi_trans
      LEFT JOIN 
        gd_fdi_trans_customer ON gd_fdi_trans_customer.UTD = gd_fdi_trans.UTD
      WHERE 
        TRANS_TYPE = 'WI' 
        AND TRANS_SEGMENT NOT IN ('BANDP') 
        AND CAST(TRANS_DATE AS DATE) BETWEEN '${DateFrom}' and '${DateTo}' 
        AND gd_fdi_trans.LOC_CD IN (SELECT REPLACE(NEWCAR_RCPT, '-S', '') 
                                    FROM GODOWN_MST 
                                    WHERE GODW_CODE IN (${Location})) AND GE1 = '${Veh_Req}'
      GROUP BY 
        TRANS_ID ORDER BY tran_id DESC`;
        const branch = await sequelize.query(query);
        res.status(200).send(branch[0]);
    } catch (e) {
        console.log(e);
    }
};

exports.FillDatabyRegNo = async function (req, res) {
    try {
        const Veh_Req = req.body.Veh_Req;
        const Loc_Code = req.body.Loc_Code;
        const UTD = req.body.UTD;
        console.log(req.body, "komal");
        const sequelize = await dbname(req.headers.compcode);

        // First query to get the branch details
        const branch = await sequelize.query(`
        SELECT 
              MAX(gd_fdi_trans.utd) AS tran_id, 
              MAX(TRANS_DATE) AS Bill_Date, 
              MAX(TRANS_ID) AS Bill_No, 
              MAX(gd_fdi_trans.CUST_NAME) AS Ledger_Name, 
              MAX(gd_fdi_trans_customer.MOBILE2) AS Customer_Mob,
              MAX(GE1) AS Veh_Reg, 
              ROUND(SUM(SERVICE_AMOUNT), 2) AS Inv_Amt
          FROM 
              gd_fdi_trans
          LEFT JOIN 
              gd_fdi_trans_customer ON gd_fdi_trans_customer.UTD = gd_fdi_trans.UTD
          WHERE 
              TRANS_TYPE = 'WI' 
              AND TRANS_SEGMENT NOT IN ('BANDP')
              AND gd_fdi_trans.LOC_CD IN (
                  SELECT REPLACE(NEWCAR_RCPT, '-S', '') 
                  FROM GODOWN_MST 
                  WHERE GODW_CODE IN (${Loc_Code})
              )
              AND GE1 = '${Veh_Req}'
              AND TRANS_DATE BETWEEN DATEADD(DAY, -3, CAST(GETDATE() AS DATE)) AND DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
          GROUP BY 
              GE1 
          ORDER BY 
              tran_id DESC
      `);

        const Bill_No = branch[0][0]?.Bill_No;

        // Conditional execution of the second query only if Bill_No has a value
        let result = [];
        if (Bill_No) {
            result = await sequelize.query(`
          SELECT 
              TRANS_ID, 
              TRANS_DATE, 
              TRANS_REF_DATE, 
              TRANS_REF_NUM,     
              CASE
                  WHEN TRANS_TYPE = 'RC' THEN '-' + CAST(TAXABLE_VALUE AS VARCHAR)
                  ELSE CAST(TAXABLE_VALUE AS VARCHAR)
              END AS TAXABLE_VALUE, 
              TRANS_TYPE, 
              CASE 
                  WHEN TRANS_TYPE = 'R' THEN 'Receipt'
                  WHEN TRANS_TYPE = 'RC' THEN 'Cancelled Receipt' 
              END AS TRANS_DESCRIPTION 
          FROM 
              GD_FDI_TRANS t
          LEFT JOIN 
              GD_FDI_TRANS_CHARGES tc ON t.UTD = tc.UTD
          WHERE 
              t.TRANS_TYPE IN ('R', 'RC') 
              AND t.CUST_ID IN (
                  SELECT DISTINCT CUST_ID 
                  FROM GD_FDI_TRANS gd 
                  WHERE 
                      TRANS_TYPE = 'WI' 
                      AND TRANS_SEGMENT NOT IN ('BANDP')
                      AND gd.LOC_CD IN (
                          SELECT REPLACE(NEWCAR_RCPT, '-S', '') 
                          FROM GODOWN_MST 
                          WHERE GODW_CODE IN (${Loc_Code})
                      )
                      AND GE1 = '${Veh_Req}' 
                      AND TRANS_ID = '${Bill_No}'
                      AND TRANS_DATE BETWEEN DATEADD(DAY, -3, CAST(GETDATE() AS DATE)) 
                      AND DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
              )
              AND tc.CHARGE_DESC IN (
                  SELECT DISTINCT TRANS_ID 
                  FROM GD_FDI_TRANS gd 
                  WHERE 
                      TRANS_TYPE = 'WI' 
                      AND TRANS_SEGMENT NOT IN ('BANDP')
                      AND gd.LOC_CD IN (
                          SELECT REPLACE(NEWCAR_RCPT, '-S', '') 
                          FROM GODOWN_MST 
                          WHERE GODW_CODE IN (${Loc_Code})
                      )
                      AND GE1 = '${Veh_Req}'  
                      AND TRANS_ID = '${Bill_No}'
                      AND TRANS_DATE BETWEEN DATEADD(DAY, -3, CAST(GETDATE() AS DATE)) 
                      AND DATEADD(DAY, 1, CAST(GETDATE() AS DATE))
          )`);
        }
        let OldData;
        if (UTD) {
            OldData = await sequelize.query(`
               select   '' as tran_id,'' as Bill_Date,'' as Bill_No,Customer_Name as Ledger_Name,Cust_Mob as Customer_Mob,Veh_Req as Veh_Reg,'0' as Inv_Amt from in_service where UTD = ${UTD}
              `);
        }
        // Send the response with branch data and optionally result data
        console.log({
            branch: UTD && !branch[0][0] ? OldData[0][0] : branch[0][0],
            result: result[0] || [], // Empty array if the second query did not run
        })
        res.status(200).send({
            branch: UTD && !branch[0][0] ? OldData[0][0] : branch[0][0],
            result: result[0] || [], // Empty array if the second query did not run
        });
    } catch (e) {
        console.log(e);
        res.status(500).send({ error: 'An error occurred while processing your request.' });
    }
};

exports.InServiceView = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const Location = req.body.Location;
        const DateFrom = req.body.DateFrom;
        const DateTo = req.body.DateTo;
        let query = `SELECT 
        UTD, 
        Veh_Req, 
        Req_Date,
        Customer_Name, 
        CASE 
            WHEN Visit_Purpose = '1' THEN 'Service' 
            WHEN Visit_Purpose = '2' THEN 'Bodyshop'
            ELSE 'Unknown Purpose'
        END AS Visit_Purpose , InTime, OutTime, Cust_Mob,
        (select top 1 godw_name from GODOWN_MST where GODOWN_MST.Godw_Code = In_Service.Location) as Loc_Code, Location
    FROM 
        In_Service
        where Location in (${Location}) and CAST(Req_Date AS DATE) BETWEEN '${DateFrom}' and '${DateTo}' order by UTD desc`;

        const branch = await sequelize.query(query);
        res.status(200).send(branch[0]);
    } catch (e) {
        console.log(e);
    }
};

exports.SaveInService = async function (req, res) {
    console.log(req.body, "request.body");
    const { UTD, ...General } = req.body.Formdata;
    // Validate Asset Product data
    const { error: requestError, value: validatedData } =
        InServiceSchema.validate(General, {
            abortEarly: false,
            stripUnknown: true,
        });

    // Check if any validation errors occurred
    if (requestError) {
        const errors = requestError.details.map((err) => err.message);
        return res.status(400).send({ success: false, message: errors.join(", ") });
    }

    let t;
    try {
        const sequelize = await dbname(req.headers.compcode);
        t = await sequelize.transaction();

        console.log(validatedData, "validatedData");
        // Create the Asset Product
        const InService = _In_Service(sequelize, Sequelize.DataTypes);
        const createdInService = await InService.create(validatedData, {
            transaction: t,
        });

        // Log Asset Product creation
        console.log("createdInService:", createdInService);

        await t.commit();

        // Prepare response
        const response = {
            Status: true,
            Result: createdInService,
            Message: "IN Sucessfully",
            General: createdInService,
        };
        res.status(200).json(response);
    } catch (error) {
        console.error("Error:", error);
        if (t) {
            await t.rollback();
        }
        res.status(500).json({ error: "An error occurred during Saving." });
    }
};

// exports.RegNo = async function (req, res) {
//     try {
//         const sequelize = await dbname(req.headers.compcode);

//         const Location = req.body.Location;
//         const VehQuery = `SELECT Veh_Req AS value, Veh_Req AS label FROM In_Service where Location in (${Location}) and InTime IS NOT NULL and OutTime IS NULL`;

//         const RegNo = await sequelize.query(VehQuery);

//         res.status(200).send({
//             RegNo: RegNo[0],
//         });
//     } catch (e) {
//         console.log(e);
//         res.status(500).send({ error: "An error occurred while fetching data." });
//     }
// };
//   exports.FillDatabyDMS = async function (req, res) {
//     try {
//       const sequelize = await dbname(req.headers.compcode);
//       const Trans_id = req.body.Tran_id;
//       console.log(Trans_id,'Trans_id')
//       let query = `SELECT MAX(gd_fdi_trans.utd) AS tran_id, MAX(TRANS_DATE) AS Bill_Date,
//       TRANS_ID AS Bill_No,
//       MAX(gd_fdi_trans.CUST_NAME) AS Customer_Name,
//       MAX(gd_fdi_trans_customer.MOBILE2) AS Customer_Mob,
//       MAX(gd_fdi_trans.GE1) AS Veh_Req,
//       ROUND(SUM(gd_fdi_trans.SERVICE_AMOUNT), 2) AS Inv_Amt
//     FROM
//       gd_fdi_trans
//     LEFT JOIN
//       gd_fdi_trans_customer ON gd_fdi_trans_customer.UTD = gd_fdi_trans.UTD
//     WHERE
//       gd_fdi_trans.TRANS_ID = '${Trans_id}' AND
//       TRANS_TYPE = 'WI'
//       AND TRANS_SEGMENT NOT IN ('BANDP')
//     GROUP BY
//       TRANS_ID ORDER BY tran_id DESC
//     `;

//       const branch = await sequelize.query(query);
//       res.status(200).send(branch[0][0]);
//     } catch (e) {
//       console.log(e);
//     }
//   };

//   exports.FillData = async function (req, res) {
//     try {
//       const Bill_No = req.body.Bill_No;
//       const Loc_Code = req.body.Loc_Code;
//       console.log(req.body, "komal");
//       const sequelize = await dbname(req.headers.compcode);
//       let query = `
//         select TOP 1 Bill_No, SUM(taxable + CGST +SGST+IGST+Cess_Amt ) AS Inv_Amt, MAX(Ledger_Name) AS Customer_Name,
//   (select top 1 ledg_ph1 from Ledg_Mst where Ledg_Mst.Ledg_Code = DMS_ROW_DATA.LEDG_ACNT) as Customer_Mob,
//   (select top 1 Reg_No from CHAS_MST where CHAS_MST.Chas_No = DMS_ROW_DATA.Chassis) as Veh_Req from DMS_ROW_DATA
//   where bill_no = '${Bill_No}' and Export_Type < 3 and Tran_Type = '4' AND Loc_Code = '${Loc_Code}' group by bill_no, LEDG_ACNT, Chassis
//         `;
//       const branch = await sequelize.query(query);
//       res.status(200).send(branch[0][0]);
//     } catch (e) {
//       console.log(e);
//     }
//   };

exports.OutServiceView = async function (req, res) {
    try {
        const sequelize = await dbname(req.headers.compcode);
        const Location = req.body.Location;
        const DateFrom = req.body.DateFrom;
        const DateTo = req.body.DateTo;
        let query = `SELECT 
        tran_id, 
        Veh_Req, 
        Customer_Name, Customer_Mob, Bill_No, Bill_Date, Req_Date, Performa_Inv, Inv_Amt, Mode_Payment, Amount_Paid, Remark, Driver_Name AS Driver_Code, CASE 
        WHEN Mode_Payment = '1' THEN 'Payment Recieved Yes' 
        WHEN Mode_Payment = '2' THEN 'Scheduled Service' 
        WHEN Mode_Payment = '3' THEN 'Pick & Drop Driver' 
        WHEN Mode_Payment = '4' THEN 'Out Without Billing'
        ELSE 'Unknown Purpose'
    END AS Mode_Payment,
        (SELECT CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME FROM EMPLOYEEMASTER WHERE EMPLOYEEMASTER.EMPCODE = Driver_Name) AS Driver_Name,
        (select top 1 godw_name from GODOWN_MST where GODOWN_MST.Godw_Code = Pick_Drop_Collection.Location) as Loc_Code, Location
    FROM 
    Pick_Drop_Collection
        where Location in (${Location}) and CAST(Req_Date AS DATE) BETWEEN '${DateFrom}' and '${DateTo}' order by tran_id desc`;

        const branch = await sequelize.query(query);
        res.status(200).send(branch[0]);
    } catch (e) {
        console.log(e);
    }
};