const { Sequelize, DataTypes, literal, QueryTypes, Op } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const path = require('path');
const QRCode = require('qrcode');
const axios = require('axios');
const { v4: uuidv4 } = require("uuid");
const FormData = require("form-data");

const { _MiscMst, MiscMstSchema } = require("../models/MiscMst");
const { _DocketMst, docketMstSchema } = require("../models/DocketMst");


exports.findBookingData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc
        const BOOKING_ID = req.body.BOOKING_ID
        const BscData = await sequelize.query(`
            select * from ( SELECT UTD, Trans_ID, Trans_Date, Trans_Ref_Date, GD_FDI_TRANS.Variant_CD, GD_FDI_TRANS.ECOLOR_CD, Cust_Name, Team_Head, Loc_Cd,
            		(SELECT top 1 MOBILE2 from gd_fdi_trans_customer where GD_FDI_TRANS.UTD = gd_fdi_trans_customer.UTD) AS MobileNo,
      (SELECT TOP 1 godw_code FROM godown_mst WHERE GD_FDI_TRANS.loc_cd =REPLACE(godown_mst.newcar_rcpt ,'-S','') and  godown_mst.export_type<=3) AS Godown_Code,   
        (SELECT TOP 1 Godw_Name FROM godown_mst WHERE GD_FDI_TRANS.loc_cd = godown_mst.newcar_rcpt and godown_mst.export_type<=3) AS godw_name,
             (SELECT TOP 1 modl_name FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Name, 
                 (SELECT TOP 1 item_code FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS item_code,   
                   (SELECT TOP 1 Modl_Grp FROM Modl_Mst WHERE VARIANT_CD = Modl_Code) AS Modl_Grp,   
                    (SELECT TOP 1 Chas_No FROM CHAS_MST WHERE CHAS_MST.Chas_Id = (Select TOP 1 Chas_Id from Chas_Alot where Booking_ID = TRANS_ID)) AS ChasNo,
                   (SELECT TOP 1 Eng_No FROM CHAS_MST WHERE CHAS_MST.Chas_Id = (Select TOP 1 Chas_Id from Chas_Alot where Booking_ID = TRANS_ID)) AS ENgineNo,
                   (SELECT TOP 1 Clr_No FROM CHAS_MST WHERE CHAS_MST.Chas_Id = (Select TOP 1 Chas_Id from Chas_Alot where Booking_ID = TRANS_ID)) AS ColourName,
                   (SELECT Modl_Name From Modl_Mst where Item_Code = (SELECT TOP 1 Modl_Code FROM CHAS_MST WHERE CHAS_MST.Chas_Id = (Select TOP 1 Chas_Id from Chas_Alot where Booking_ID = TRANS_ID))) AS ModelName,
                     (SELECT TOP 1 is_gd FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS isgd,
                     (SELECT TOP 1 Appr_1_Stat FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS status1, 
                     (SELECT TOP 1 Appr_2_Stat FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS status2, 
                     (SELECT TOP 1 reapp_emp FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS reapp_emp, 
    (SELECT TOP 1 Appr_1_Rem FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS Appr_1_Rem, 
                     (SELECT TOP 1 Appr_2_Rem FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS Appr_2_Rem, 
                     (SELECT TOP 1 fin_appr FROM dise_aprvl WHERE UTD = GD_FDI_TRANS.UTD and export_type<3 order by tran_id) AS final, 
   (SELECT TOP 1 Misc_name FROM misc_mst WHERE ECOLOR_CD = misc_abbr AND misc_type = 10) AS Color FROM GD_FDI_TRANS 
   WHERE TRANS_ID = '${BOOKING_ID}' AND TRANS_TYPE = 'ORDBK'  
   and TRANS_ID not in (select trans_id from GD_FDI_TRANS gda where gda.TRANS_ID=GD_FDI_TRANS.TRANS_ID 
   and gda.LOC_CD=GD_FDI_TRANS.LOC_CD and gda.TRANS_TYPE='ordbc') 
    And loc_cd in (select Replace(newcar_rcpt,'-S','')from godown_mst where godw_code in (${multi_loc})) ) as ab 
    where Godown_Code in (${multi_loc})`);
        console.log(BscData)
        if (BscData[0].length > 0) {
            res.status(200).send({
                success: true, BscData, message: "Data Fetched",
            });
        } else {
            res.status(500).send({
                success: false,
                message: "No Details Found",
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
exports.FindMastericmTracker = async function (req, res) {
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
        const Financiers = await MiscMst.findAll({
            attributes: [
                [literal('CAST([misc_code] AS VARCHAR)'), 'value'],
                ['misc_name', 'label'],
            ],
            where: {
                misc_type: 8,
                Export_Type: {
                    [Op.lt]: 3
                }
            },
        });
        const OldCarSellers = await sequelize.query(`select LTRIM(STR(Ledg_Code, 20, 0)) as value, Ledg_Name AS label from Ledg_Mst where group_code in (59, 53) AND Ledg_Name <> '' AND Ledg_Name is not null`)
        const DseList = await sequelize.query(`select User_Code as value , User_Name as label from User_Tbl where user_Code in (SELECT DSE_FLAG FROM DocketMst) AND Module_Code = 10 and Export_Type <>33`)

        console.log(DseList, 'DseList')
        let data = {
            IncComp,
            Financiers,
            OldCarSellers,
            DseList,
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
exports.FirstSave = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = JSON.parse(req.body.formData);
        delete BodyData.UTD;
        function convertBooleansToIntegers(obj) {
            for (let key in obj) {
                if (typeof obj[key] === 'boolean') {
                    obj[key] = obj[key] ? '1' : '0';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertBooleansToIntegers(obj[key]);
                }
            }
        }
        convertBooleansToIntegers(BodyData);
        console.log(BodyData, 'BodyData')
        const t = await sequelize.transaction();
        const DocketMst = _DocketMst(sequelize, DataTypes);
        try {
            const id = await DocketMst.create(
                { ...BodyData, DSE_FLAG: 1, DSE_CODE: BodyData.Id },
                { transaction: t }
            );
            if (req.files.length > 0) {
                const EMP_DOCS_data = await uploadImagesTravel(
                    req.files,
                    req.headers?.compcode?.split("-")[0],
                    BodyData.Created_by,
                );
                const arr = [
                    "DealDocument",
                    "InvoiceDoc",
                    "MsrDoc",
                    "EwDoc",
                    "CcpDoc",
                    "FastagDoc",
                    "InsuDoc",
                    "FinDoc",
                    "GatePass",
                    "OldCarRc",
                    "OldCarInsu",
                    "CustId",
                    "RtoNoc",
                    "BankNoc",
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
                                'Docket', 
                                '${id.UTD}', 
                                ${srnoIndex}, 
                                '${doc.DOC_PATH}', 
                                '${doc.fieldname}', 
                                '${BodyData.Created_by}', 
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
            res.status(200).send({ success: true, Message: "Data Saved", UTD: id.UTD });
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
exports.DocketUpdate = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = JSON.parse(req.body.formData);
        function convertBooleansToIntegers(obj) {
            for (let key in obj) {
                if (typeof obj[key] === 'boolean') {
                    obj[key] = obj[key] ? '1' : '0';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertBooleansToIntegers(obj[key]);
                }
            }
        }
        convertBooleansToIntegers(BodyData);
        console.log(BodyData, 'BodyData')
        const UserFlag = req.body.UserFlag;
        const UserFlagCode = req.body.UserFlagCode;
        if (BodyData.DocketVerified == 1) {
            return res.status(500).send({
                success: false,
                UTD: BodyData.UTD,
                message: "Docket Verified...! Updations not Allowed"
            });
        }
        const DocketMst = _DocketMst(sequelize, DataTypes);
        await DocketMst.update(
            {
                ...BodyData,
                [UserFlag]: 1,
                [UserFlagCode]: BodyData.Id
            },
            { where: { UTD: BodyData.UTD } }
        );

        console.log(req.files, 'req.files')
        if (req.files.length > 0) {
            const EMP_DOCS_data = await uploadImagesTravel(
                req.files,
                req.headers?.compcode?.split("-")[0],
                BodyData.Created_by,
            );

            const arr = ["DealDocument",
                "InvoiceDoc",
                "MsrDoc",
                "EwDoc",
                "CcpDoc",
                "FastagDoc",
                "InsuDoc",
                "FinDoc",
                "GatePass",
                "OldCarRc",
                "OldCarInsu",
                "CustId",
                "RtoNoc",
                "BankNoc"];
            EMP_DOCS_data.forEach(doc => {
                if (doc.fieldname.startsWith('image_')) {
                    arr.push(doc.fieldname);
                }
            });
            console.log(arr, 'arr')
            const uploadPromises = EMP_DOCS_data.map(async (doc) => {
                const originalIndex = arr.indexOf(doc.fieldname);
                const srnoIndex = originalIndex >= 0 ? originalIndex + 1 : 0;

                if (srnoIndex > 0) {
                    await sequelize.query(`
                            UPDATE DOC_UPLOAD 
                            SET export_type = 33 
                            WHERE TRAN_ID = '${BodyData.UTD}' 
                            AND SRNO = '${srnoIndex}' 
                            AND doc_type = 'Docket'
                        `);

                    await sequelize.query(`
                            INSERT INTO DOC_UPLOAD (Doc_Type, TRAN_ID, SRNO, path, File_Name, User_Name, Upload_Date, Export_type)
                            VALUES (
                                'Docket', 
                                '${BodyData.UTD}', 
                                ${srnoIndex}, 
                                '${doc.DOC_PATH}', 
                                '${doc.fieldname}', 
                                '${BodyData.Created_by}', 
                                CONVERT(varchar, GETDATE(), 3) + ' ' + CONVERT(varchar, GETDATE(), 8), 
                                '1'
                            )
                        `);
                } else {
                    console.error(`Fieldname ${doc.fieldname} not found in arr.`);
                }
            });

            await Promise.all(uploadPromises);


        }
        res.status(200).send({ success: true, Message: "Data Updated", UTD: BodyData.UTD });
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
exports.IcmTrackerViewTable = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc
        const BscData = await sequelize.query(`
        select * from DocketMst WHERE LOC_CODE in (${multi_loc})`);
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
exports.DeliveryRegister = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc
        const BodyData = req.body.fromData
        const BscData = await sequelize.query(`
        select FORMAT(EXP_DEL_DATE, 'dd-MM-yyyy') AS ExpDelvDate,* from DocketMst WHERE LOC_CODE in (${multi_loc}) AND  DSE_CODE = ${BodyData.DSE_CODE} and EXP_DEL_DATE between '${BodyData.DATE_FROM}' AND '${BodyData.DATE_TO}'`);
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
exports.IcmTrackerView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const UTD = req.body.UTD;
        const BscData = await sequelize.query(`
            select * from DocketMst WHERE UTD = ${UTD}`);
        const images = await sequelize.query(`select * from doc_upload 
                where tran_id='${UTD}' and doc_type = 'Docket' AND EXPORT_TYPE < 5 order by srno`);
        const images1 = await sequelize.query(`select CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',path) as ImagePath from doc_upload 
                where tran_id='${UTD}' and doc_type = 'Docket' AND EXPORT_TYPE < 5 AND srno > 14 order by srno`);
        const imageUrls = images1[0].map(item => item.ImagePath);
        res.status(200).send({
            success: true, images: images[0] ? images[0] : [], images1: imageUrls ? imageUrls : [], BscData: BscData[0] ? BscData[0] : []
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
exports.VerifyDocket = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        console.log(BodyData)
        const DocketMst = _DocketMst(sequelize, DataTypes);
        await DocketMst.update(
            { DocketVerified: 1, VER_CODE: BodyData.VER_CODE, VER_REM: BodyData.VER_REM, VER_DATE: literal('GETDATE()') },
            { where: { UTD: BodyData.UTD } }
        );
        res.status(200).send({ success: true, Message: "Docket verified" });

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
exports.GetReceipts = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BOOKING_ID = req.body.BOOKING_ID;
        const SALE_INV = req.body.SALE_INV;
        const multi_loc = req.body.multi_loc;
        const CustId = await sequelize.query(`select Cust_Id from 
            GD_FDI_TRANS where  Trans_Type = 'ORDBK'  AND TRANS_ID = '${BOOKING_ID}'
            AND  GE3 != 'Cancelled' AND 
            LOC_CD = (SELECT top 1 NEWCAR_RCPT 
            FROM Godown_Mst where Godw_Code = ${multi_loc})`);
        let LedgMst = null
        if (CustId) {
            LedgMst = await sequelize.query(`SELECT Ledg_Acnt,GP_Seq,GP_Prefix, DMS_Inv FROM ICM_MST WHERE Cust_Id = '${CustId[0][0].Cust_Id}'`)
        }
        console.log(LedgMst[0].length, 'LedgMst')
        let Receipts = [];
        if (LedgMst[0].length != 0) {
            Receipts = await sequelize.query(
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
                   ap.ledg_Ac = '${LedgMst[0][0].Ledg_Acnt}'
                AND
                   ap.acnt_type < 4 
                AND 
                   ap.Amt_drcr = 2  
                   AND 
                   ap.Loc_Code in (${multi_loc}) AND ap.Export_type not in (5,33) `);
        }
        console.log(Receipts, 'Receipts')
        let Gp = ''
        if (LedgMst[0].length != 0) {
            if (LedgMst[0][0].GP_Seq !== null) {
                Gp = LedgMst[0][0].GP_Prefix ? LedgMst[0][0].GP_Prefix : '' + '/' + LedgMst[0][0].GP_Seq ? LedgMst[0][0].GP_Seq : ''
            }
        }
        console.log(Gp, 'hgvububhi')
        let data = { Receipts, GpSeq: Gp, InvNo: LedgMst[0].length != 0 ? LedgMst[0][0].DMS_Inv : '' };
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
        const dataArray = [];
        await Promise.all(files.map(async (file, index) => {
            const customPath = `${Comp_Code}/Docket/`;
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
                    { headers: formData.getHeaders() }
                );
                console.log(`Image uploaded successfully: ${file.originalname}`);
            } catch (error) {
                console.error(`Error uploading image ${index} (${file.originalname}):`, error.message);
            }

            const data = {
                SRNO: index,
                EMP_CODE: Created_by,
                fieldname: file.fieldname,
                Created_by: Created_by,
                DOC_NAME: file.originalname,
                misspunch_inout: index,
                columndoc_type: "Docket",
                DOC_PATH: `${customPath}${fileName}`,
            };
            dataArray.push(data);
        }));
        return dataArray;
    } catch (e) {
        console.error("Error in uploadImagesTravel function:", e);
        throw e;
    }
};
