const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const Joi = require("joi");
const FormData = require("form-data");
const axios = require("axios");

const { _DemoCarMaster, demoCarMasterSchema } = require("../models/DemoCarMaster");
const { _FuelSlip, fuelSlipSchema } = require("../models/FuelSlip");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { SendWhatsAppMessgae } = require("./user");

async function uploadImages(
    files,
    finalFolderPath,
    Emp_Code,
    Created_by,
    SRNO
) {
    let dataArray = [];

    for (let i = 0; i < 1; i++) {
        let fileKey = "FuelSlip";

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
                columndoc_type: "DemoCarFuelSlip",
                DOC_PATH: `${finalFolderPath}\\${filename}`,
            };
            dataArray.push(data);
        }
    }
    return dataArray;
};

exports.branchDistanceSave = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const DEPARTURE_BRANCH = req.body.DEPARTURE_BRANCH;
        const DESTINATION_BRANCH = req.body.DESTINATION_BRANCH;
        const DISTANCE = req.body.DISTANCE;
        const FuelQty = req.body.FuelQty;
        const multi_loc = req.body.multi_loc;
        const brmstid = await sequelize.query(`select MAX(Misc_Code) AS maxMstId FROM Misc_Mst where Misc_Type = 614`);
        const MiscMaxId = brmstid[0][0].maxMstId;
        let newtranid;
        if (MiscMaxId !== null) {
            newtranid = MiscMaxId + 1;
        } else {
            newtranid = 1;
        }
        await sequelize.query(`INSERT INTO Misc_Mst (Misc_Type,
            Misc_Code, Misc_Add1,  Misc_Add2, Misc_Add3, Misc_Dtl1,
            Export_Type, ServerId, Loc_code) VALUES
                (614,${newtranid}, ${DEPARTURE_BRANCH},${DESTINATION_BRANCH},${DISTANCE}, ${FuelQty},
                1,1,'${multi_loc}') `);
        res.status(200).send({
            success: true,
            message: "Data Saved",
        });
    }
    catch (e) {
        console.log(e);
        res.status(500).send({
            success: false,
            message: "An error occurred while Saving Data.",
            e,
        });
    }
    finally {
        await sequelize.close();
    }
};
exports.branchDistance = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const addedbranches = await sequelize.query(`SELECT 
    Misc_Code AS UTD,
    CASE 
        WHEN Misc_Add1 = 999 THEN 'OTHER'
        ELSE (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Misc_Add1)
    END AS DEPARTURE_BRANCH,
    CASE 
        WHEN  Misc_Add2 = 999 THEN 'OTHER'
        ELSE (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Misc_Add2)
    END AS DESTINATION_BRANCH,
    Misc_Add3 AS DISTANCE,
    Misc_Dtl1 AS FuelQty
FROM Misc_Mst
WHERE Misc_Type = 614
  AND Loc_Code IN ('${multi_loc}')
  AND Export_Type = 1;
`);
        res.status(200).send({
            success: true,
            branches: addedbranches[0]
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
exports.DistanceBetw = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const LOC_FROM = req.body.LOC_FROM;
        const LOC_TO = req.body.LOC_TO;

        const Dist_bet = await sequelize.query(`SELECT 
        Misc_Add3, Misc_Dtl1 FROM Misc_Mst 
        WHERE 
        Misc_Add1 = ${LOC_FROM} AND Misc_Add2 = ${LOC_TO} AND  Misc_Type = 614 AND Export_Type = 1`);
        res.status(200).send({
            success: true,
            branches: Dist_bet[0]
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
exports.branchAddr = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const branches = await sequelize.query(`select 
        (Godw_Add1 + ' ' + Godw_Add2 + ' ' + isnull(Godw_Add3,'' ) ) AS ADDRESS
        from Godown_Mst WHERE Godw_Code = '${req.body.branch}'`);
        res.status(200).send({
            success: true,
            branchAdd: branches[0][0]
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
exports.Masters = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const branches = await sequelize.query(`SELECT Godw_Name AS label, Godw_Code AS value FROM GODOWN_MST WHERE Export_type < 3`);
        const modelGrp = await sequelize.query(`select Misc_Code AS value, Misc_Name AS label from Misc_Mst where Misc_type = 14`);
        const FuelVendors = await sequelize.query(`select Misc_Code AS value, Misc_Name AS label from Misc_Mst where Misc_type = 618 AND Loc_Code in (${multi_loc},0)`);
        const color = await sequelize.query(`select Misc_abbr AS value, Misc_Name AS label from Misc_Mst where Misc_Type = 10 AND Misc_Name IS NOT NULL`)
        const Drivers = await sequelize.query(`select EMPCODE as value ,concat(EMPFIRSTNAME,' ',EMPLASTNAME)as label from EMPLOYEEMASTER where EMPLOYEEDESIGNATION like '%driver%'`);
        const Dse = await sequelize.query(`select EMPCODE as value ,concat(EMPFIRSTNAME,' ',EMPLASTNAME)as label from EMPLOYEEMASTER where EMPLOYEEDESIGNATION in ('RELATIONSHIP MANAGER' , 'SR. RELATIONSHIP MANAGER', 'SENIEOR RELATIONSHIP MANAGER')`);
        res.status(200).send({
            success: true,
            branch: branches[0],
            ModelGroup: modelGrp[0],
            color: color[0],
            Drivers: Drivers[0],
            FuelVendors: FuelVendors[0],
            Dse: Dse[0]
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
exports.ModelDetails = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const ModelGroup = req.body.ModelGroup;
        const Models = await sequelize.query(`select Modl_Name AS label, item_code AS value from Modl_Mst where Modl_Grp = ${ModelGroup}`);
        res.status(200).send({
            success: true,
            Models: Models[0]
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
exports.branchDistanceUpdate = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const UTD = req.body.UTD;
        await sequelize.query(`UPDATE Misc_Mst SET Export_type = 33 WHERE Misc_type = 614 AND Misc_Code = ${UTD}`)
        const DEPARTURE_BRANCH = req.body.DEPARTURE_BRANCH;
        const DESTINATION_BRANCH = req.body.DESTINATION_BRANCH;
        const DISTANCE = req.body.DISTANCE;
        const multi_loc = req.body.multi_loc;
        const FuelQty = req.body.FuelQty;
        const brmstid = await sequelize.query(`select MAX(Misc_Code) AS maxMstId FROM Misc_Mst where Misc_Type = 614`);
        const MiscMaxId = brmstid[0][0].maxMstId;
        let newtranid;
        if (MiscMaxId !== null) {
            newtranid = MiscMaxId + 1;
        } else {
            newtranid = 1;
        }
        await sequelize.query(`INSERT INTO Misc_Mst (Misc_Type,
            Misc_Code, Misc_Add1,  Misc_Add2, Misc_Add3, Misc_Dtl1,
            Export_Type, ServerId, Loc_code) VALUES
                (614,${newtranid}, ${DEPARTURE_BRANCH},${DESTINATION_BRANCH},${DISTANCE}, ${FuelQty},
                1,1,'${multi_loc}')`);
        res.status(200).send({
            success: true,
            Done: "Data Saved...!"
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
exports.insertData = async function (req, res) {
    const BodyData = req.body;
    const { error, value } = demoCarMasterSchema.validate(BodyData, {
        abortEarly: false,
        stripUnknown: true
    });
    const DemoCarData = value;
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        return res.status(400).send({ success: false, message: errorMessage });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const DuplicateEntry = await sequelize.query(`SELECT * FROM DemoCarMaster WHERE VEH_REGNO = '${DemoCarData.VEH_REGNO}'`)
        if (DuplicateEntry[0].length > 0) {
            return res.status(201).send({ success: false, message: "Duplicate Registration Number Found" });
        }
        const DuplicateEntryChas = await sequelize.query(`SELECT * FROM DemoCarMaster WHERE CHAS_NO = '${DemoCarData.CHAS_NO}'`)
        if (DuplicateEntryChas[0].length > 0) {
            return res.status(201).send({ success: false, message: "Duplicate Chassis Number Found" });
        }
        const DuplicateEntryEng = await sequelize.query(`SELECT * FROM DemoCarMaster WHERE ENGINE_NO = '${DemoCarData.ENGINE_NO}'`)
        if (DuplicateEntryEng[0].length > 0) {
            return res.status(201).send({ success: false, message: "Duplicate Engine Number Found" });
        }
        const t = await sequelize.transaction();
        const DemoCarMaster = _DemoCarMaster(sequelize, DataTypes);
        try {
            await DemoCarMaster.create({ ...DemoCarData }, { transaction: t });
            await t.commit();
            res.status(200).send({
                success: true,
                Done: "Data Saved...!"
            });
        } catch (error) {
            res.status(500).send({
                success: false,
                message: "An error occurred while Saving Data.",
                error,
            });
            await t.rollback();
        } finally {
            await sequelize.close();
            console.log('Connection has been closed.');
        }
    }
};
exports.DemoCarFetch = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const DemoCarFetch = await sequelize.query(`
        SELECT 
        (SELECT TOP 1 Misc_Name FROM Misc_mst Where Misc_type = 14 AND Misc_Code = MODEL_GROUP) As ModelGroup,
        (SELECT TOP 1 Modl_Name FROM Modl_Mst Where item_code = MODEL_NAME) As ModelName,
        (SELECT TOP 1 Godw_Name FROM Godown_Mst Where Godw_Code = REG_BRANCH AND Export_Type < 3) As RegisteredBranch,
        (SELECT TOP 1 Misc_Name FROM Misc_mst Where  Misc_abbr = VEH_COLOUR) As CarColour, *
        FROM DemoCarMaster
        WHERE LOC_CODE in (${multi_loc})`);
        res.status(200).send({
            success: true,
            DemoCar: DemoCarFetch[0]
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
exports.NewCarDataFetch = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const DMS_INV = req.body.DMS_INV;
        const Loc_Code = req.body.Loc_Code;
        const CheckInvoice = await sequelize.query(`SELECT * FROM FuelSlip WHERE DMS_INV = '${DMS_INV}'`);
        if (CheckInvoice[0].length > 0) {
            return res.status(201).send({
                success: false,
                message: "Fuel Slip Already Created on this Invoice"
            });
        }
        const Data = await sequelize.query(`
        SELECT 
    (SELECT TOP 1 (ISNULL(Title, '') + ' ' + EmpFirstName + ' ' + EmpLastName) AS name 
     FROM EMPLOYEEMASTER 
     WHERE SRNO = im.DMS_DSE) AS DSE_NAME,
    (SELECT TOP 1 Godw_Name 
     FROM GODOWN_MST 
     WHERE godw_code = im.LOC_CODE) AS BranchName,
    (SELECT TOP 1 Modl_Name 
     FROM Modl_Mst 
     WHERE Item_Code = im.Modl_Code) AS ModelName,
    im.Modl_Code,     
    im.GP_DATETIME, 
    im.GP_Seq, 
    im.Delv_Date, 
    im.FUEL_TYPE, 
    (ISNULL(im.drpTitle, '') + ' ' + im.Ledg_Name) AS CUSTOMER_NAME, 
    im.Loc_Code, 
    im.Veh_Del 
FROM 
    ICM_MST im
LEFT JOIN 
    BHATIA_INVOICE bi 
    ON bi.ICM_ID = im.Tran_Id 
    AND CONCAT(bi.SALE_INV_PREFIX, bi.Invoice_No) = '${DMS_INV}'
WHERE 
    im.DMS_Inv = '${DMS_INV}'
    OR CONCAT(bi.SALE_INV_PREFIX, bi.Invoice_No) = '${DMS_INV}';
`);
        console.log(Data)
        if (Data[0][0] && Data[0][0].Loc_Code !== Loc_Code) {
            res.status(201).send({
                success: false,
                message: "DMS Invoice is not of the Current Login Branch"
            });
        }
        else if (Data[0][0] && Data[0][0].Veh_Del !== 1) {
            res.status(201).send({
                success: false,
                message: "Vehicle Not Delivered In ICM"
            });
        }
        else if (Data[0].length != 0) {
            res.status(200).send({
                success: true,
                Data: Data[0]
            });
        }
        else {
            res.status(201).send({
                success: false,
                message: "Invalid DMS Invoice"
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
exports.MaxTranId = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const TYPE = req.body.TYPE;
        const LOC_CODE = req.body.LOC_CODE;
        const MaxId = await sequelize.query(`SELECT MAX(TRAN_ID) AS SEQ_NO FROM FuelSlip WHERE LOC_CODE = '${LOC_CODE}'`);
        let TRAN_ID = 0;
        if (MaxId[0][0].SEQ_NO == null) {
            TRAN_ID = TRAN_ID + 1;
        }
        else {
            TRAN_ID = MaxId[0][0].SEQ_NO + 1;
        }
        res.send({ TRAN_ID: TRAN_ID });
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
exports.FuelSlipSave = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData, 'BodyData')
    const { error, value } = fuelSlipSchema.validate(BodyData, {
        abortEarly: false,
        stripUnknown: true
    });
    console.log(error, 'error')
    const Data = value;
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
        console.log(errorMessage);
        return res.status(400).send({ success: false, message: error.details[0].message });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        const FuelSlip = _FuelSlip(sequelize, DataTypes);
        const DemoCarMaster = _DemoCarMaster(sequelize, DataTypes);
        try {
            const finalFolderPath = path.join(
                req.headers.compcode?.split("-")[0]?.toLowerCase(),
                new Date().getFullYear().toString(),
                String(new Date().getMonth() + 1).padStart(2, "0"),
                String(new Date().getDate()).padStart(2, "0"),
                "DemoCarFuelSlip"
            );
            let EMP_DOCS_data = [];
            if (req.files) {
                EMP_DOCS_data = await uploadImages(
                    req.files,
                    finalFolderPath,
                    BodyData.EMPCODE,
                    BodyData.EMPCODE,
                    BodyData.EMPCODE
                );
            }
            console.log(Data, 'FFF')
            const MaxId = await sequelize.query(`SELECT isnull(max(TRAN_ID)+1,1) AS SEQ_NO FROM FuelSlip WHERE  LOC_CODE = '${Data.LOC_CODE}'`, { transaction: t });
            let TRAN_ID = MaxId[0][0].SEQ_NO;
            const UTD = await FuelSlip.create({ ...Data, TRAN_ID, IMAGE_PATH: EMP_DOCS_data[0]?.DOC_PATH }, { transaction: t });
            if (Data.TRAN_TYPE == "2") {
                await DemoCarMaster.update({ KM_DRIVEN: BodyData.CURR_ODO_KM, Created_by: Data.Created_by }, {
                    where: { VEH_REGNO: Data.VEH_REGNO }
                }, { transaction: t });
            }
            await t.commit();
            res.status(200).send({
                success: true,
                UTD: UTD.UTD
            });
        } catch (error) {
            console.log(error)
            res.status(500).send({
                success: false,
                message: "An error occurred while Saving Data.",
                error,
            });
            await t.rollback();
        } finally {
            await sequelize.close();
            console.log('Connection has been closed...');
        }
    }
};
exports.PrintNewCar = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const UTD = req.body.UTD;
        const multi_loc = req.body.multi_loc;
        const company = await sequelize.query(`select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
        gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
        from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
        where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
        const DemoCarFetch = await sequelize.query(`
        SELECT (SELECT TOP 1 Modl_Name FROM Modl_Mst Where item_code = MODEL_NAME) As ModelName,
        (SELECT TOP 1 Misc_name FROM Misc_Mst WHERE Misc_Code = FUEL_VENDOR AND Misc_type = 618) AS FuelVendor,* FROM FuelSlip
        WHERE UTD = ${UTD}`);
        res.status(200).send({
            success: true, DemoCarFetch: DemoCarFetch[0], company: company[0]
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
exports.DemoCarDataFetch = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const VEH_REGNO = req.body.VEH_REGNO;
        const DemoCarFetch = await sequelize.query(`
        SELECT 
        (SELECT TOP 1 Misc_Name FROM Misc_mst Where Misc_type = 14 AND Misc_Code = MODEL_GROUP) As ModelGroup,
        (SELECT TOP 1 Modl_Name FROM Modl_Mst Where item_code = MODEL_NAME) As ModelName,
        (SELECT TOP 1 Godw_Name FROM Godown_Mst Where Godw_Code = REG_BRANCH) As RegisteredBranch,
        (SELECT TOP 1 Misc_Name FROM Misc_mst Where  Misc_abbr = VEH_COLOUR) As CarColour, *
        FROM DemoCarMaster
        WHERE VEH_REGNO = '${VEH_REGNO}'`);
        const LastFillQty = await sequelize.query(`SELECT QUANTITY AS LastQuantity  
        FROM FuelSlip 
        WHERE VEH_REGNO = '${req.body.VEH_REGNO}' AND TRAN_TYPE = 2 
              AND TRAN_ID = (SELECT MAX(TRAN_ID) FROM FuelSlip WHERE VEH_REGNO = '${req.body.VEH_REGNO}' AND TRAN_TYPE = 2)`)
        res.status(200).send({
            success: true, DemoCar: DemoCarFetch[0], LastFillQty: LastFillQty[0][0]
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
exports.DemoCarDataView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const TRAN_TYPE = req.body.TRAN_TYPE;
        const DemoCarFetch = await sequelize.query(`SELECT
    CASE
        WHEN TRAN_TYPE = 2 THEN (SELECT TOP 1 Modl_Name FROM Modl_Mst WHERE item_code = MODEL_NAME)
        WHEN TRAN_TYPE = 3 THEN MODEL_NAME
        ELSE ''
    END AS ModelName,
    CASE
        WHEN TRAN_TYPE = 2 THEN LOC_FROM
        WHEN TRAN_TYPE = 3 THEN 
            CASE 
                WHEN LOC_FROM = 999 THEN 'OTHER' 
                ELSE (SELECT Godw_name FROM Godown_Mst WHERE Godw_Code = LOC_FROM AND Export_type < 3)
            END
        ELSE ''   
    END AS LOC_FROM1,
    CASE 
        WHEN TRAN_TYPE = 2 THEN LOC_TO  
        WHEN TRAN_TYPE = 3 THEN 
            CASE 
                WHEN LOC_TO = 999 THEN 'OTHER' 
                ELSE (SELECT Godw_name FROM Godown_Mst WHERE Godw_Code = LOC_TO AND Export_type < 3)
            END
        ELSE ''
    END AS LOC_TO1,
    FORMAT(Created_at, 'dd/MM/yyyy') AS CrateDate, 
     CASE
        WHEN QUANTITY = 999 THEN 'FULL TANK'
        ELSE CAST(QUANTITY AS VARCHAR)
    END AS Qty,
    *
FROM FuelSlip
WHERE LOC_CODE IN (${multi_loc}) 
  AND TRAN_TYPE = ${TRAN_TYPE} 
  AND FUEL_SLIP_FLAG IS NULL;
`);

        res.status(200).send({
            success: true, DemoCarData: DemoCarFetch[0]
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
exports.PrintDemoCar = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const UTD = req.body.UTD;
        const multi_loc = req.body.multi_loc;
        const company = await sequelize.query(`select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
        gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
        from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
        where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
        const DemoCarFetch = await sequelize.query(`
        SELECT CASE
        WHEN TRAN_TYPE = 2 THEN (SELECT TOP 1 Modl_Name FROM Modl_Mst Where item_code = MODEL_NAME)
        WHEN TRAN_TYPE = 3 THEN MODEL_NAME
        ELSE ''
        END AS ModelName,
        (SELECT TOP 1 Godw_Name FROM Godown_mst WHERE Godw_Code = LOC_CODE AND Export_Type = 1) AS LocationCode,
        (SELECT TOP 1 concat(EMPFIRSTNAME,' ',EMPLASTNAME) FROM EMPLOYEEMASTER WHERE EMPCODE = DRIVER_NAME AND Export_Type = 1) AS DriverName,
        (SELECT TOP 1 Misc_name FROM Misc_Mst WHERE Misc_Code = FUEL_VENDOR AND Misc_type = 618) AS FuelVendor,
        * FROM FuelSlip
        WHERE UTD = ${UTD}`);
        const image = `https://erp.autovyn.com/backend/fetch?filePath=${DemoCarFetch[0][0].IMAGE_PATH}`
        await sequelize.query(`UPDATE FuelSlip SET FUEL_SLIP_FLAG = 1 WHERE UTD = ${UTD}`);
        res.status(200).send({
            success: true, DemoCarFetch: DemoCarFetch[0], company: company[0], image: image
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
exports.FuelReport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const TRAN_TYPE = req.body.TRAN_TYPE;
        const LOC_CODE = req.body.LOC_CODE;
        const DATE_FROM = req.body.DATE_FROM;
        const DATE_TO = req.body.DATE_TO;
        const DemoCarFetch = await sequelize.query(`SELECT 
    TRAN_ID,
    CUSTOMER_NAME,
    (SELECT TOP 1 Misc_Name 
     FROM Misc_Mst 
     WHERE Misc_Code = FUEL_VENDOR 
       AND Misc_type = 618) AS FuelVendors,
    CASE
        WHEN TRAN_TYPE = 1 THEN (SELECT TOP 1 CONCAT(EMPFIRSTNAME, '', EMPLASTNAME)  
                                 FROM EMPLOYEEMASTER 
                                 WHERE EMPCODE = SLIP_GIVEN_TO)
        WHEN TRAN_TYPE = 2 THEN (SELECT TOP 1 CONCAT(EMPFIRSTNAME, '', EMPLASTNAME)  
                                 FROM EMPLOYEEMASTER 
                                 WHERE EMPCODE = DRIVER_NAME)
        WHEN TRAN_TYPE = 3 THEN (SELECT TOP 1 CONCAT(EMPFIRSTNAME, '', EMPLASTNAME)  
                                 FROM EMPLOYEEMASTER 
                                 WHERE EMPCODE = DRIVER_NAME)
        ELSE NULL
    END AS SlipGivenDriver,
    CASE
        WHEN TRAN_TYPE = 2 THEN LOC_FROM
        WHEN TRAN_TYPE = 3 THEN 
            CASE 
                WHEN TRY_CAST(LOC_FROM AS INT) = 999 THEN 'OTHER'
                ELSE (SELECT TOP 1 Godw_Name  
                      FROM Godown_Mst 
                      WHERE Godw_Code = LOC_FROM)
            END
        ELSE NULL
    END AS FromLoc,
    CASE
        WHEN TRAN_TYPE = 2 THEN LOC_TO
        WHEN TRAN_TYPE = 3 THEN CASE 
                WHEN TRY_CAST(LOC_TO AS INT) = 999 THEN 'OTHER'
                ELSE (SELECT TOP 1 Godw_Name  
                      FROM Godown_Mst 
                      WHERE Godw_Code = LOC_TO)
            END
        ELSE NULL
    END AS FromTo,
    QUANTITY, 
    DISTANCE_BET, 
    REMARK, 
    TYPE_OF_FUEL,
    CHAS_NO, 
    VEH_REGNO, 
    ENGINE_NO, 
    Created_At, 
    KM_DRIVEN,
    CURR_ODO_KM,
    LOC_FROM,
    LOC_TO
FROM 
    FuelSlip 
WHERE 
            TRAN_TYPE = ${TRAN_TYPE} AND LOC_CODE in (${LOC_CODE})
            AND Created_At >= '${DATE_FROM}'
            AND Created_At <= '${DATE_TO} 23:59:59.999';`);

        if (DemoCarFetch[0].length != 0) {
            res.status(200).send({
                success: true, Data: DemoCarFetch[0]
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
exports.InterBranchDataFetch = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {

        const CHAS_NO = req.body.CHAS_NO;
        const ENGINE_NO = req.body.ENGINE_NO;
        const Loc_Code = req.body.Loc_Code;
        if (CHAS_NO == "" || CHAS_NO == undefined || CHAS_NO == null) {
            return res.status(500).send({
                status: false,
                Message: "Please Fill Chassis No",
            });
        }
        if (ENGINE_NO == "" || ENGINE_NO == undefined || ENGINE_NO == null) {
            return res.status(500).send({
                status: false,
                Message: "Please Fill Engine No",
            });
        }
        const DemoCarFetch = await sequelize.query(`SELECT 
        (SELECT TOP 1 Modl_Name FROM Modl_Mst WHERE Item_Code = CHAS_MST.Modl_Code) AS  MODEL_NAME,
        (select TOP 1 gm.Godw_Name as Location from CHAS_TRAN ct
        JOIN
        GODOWN_MST gm on gm.Godw_Code = ct.Loc_Code
        where ct.TRAN_TYPE in (1,0) and ct.CHAS_ID = CHAS_MST.Chas_Id) AS REG_BRANCH,
		(select TOP 1 gm.Godw_Name as currlocation from CHAS_TRAN ct
        JOIN
        GODOWN_MST gm on gm.Godw_Code = ct.Loc_Code
        where ct.TRAN_TYPE in (5) and ct.CHAS_ID = CHAS_MST.Chas_Id) AS REG_LOC_CODE,Eng_No AS ENGINE_NO, Chas_no  AS CHAS_NO 
        FROM CHAS_MST WHERE CHAS_NO = '${CHAS_NO}' AND Eng_No = '${ENGINE_NO}'`);

        const CurrentLocation = await sequelize.query(`
        SELECT (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = LOC_CODE AND Export_type < 3) AS REG_LOC_CODE, 
        LOC_CODE FROM FuelSlip WHERE CHAS_NO = '${CHAS_NO}' AND ENGINE_NO = '${ENGINE_NO}' AND TRAN_TYPE = 3 AND  
        TRAN_ID = (SELECT MAX(TRAN_ID) FROM FuelSlip WHERE CHAS_NO = '${CHAS_NO}' AND ENGINE_NO = '${ENGINE_NO}' AND TRAN_TYPE = 3)`)
        const REG_LOC_CODE = CurrentLocation[0]
        if (DemoCarFetch[0].length != 0) {
            res.status(200).send({
                success: true, InterBranch: DemoCarFetch[0], REG_LOC_CODE: REG_LOC_CODE
            });
        } else {
            res.status(500).send({
                success: false,
                Message: "Invalid Chassis No. or Engine No.",

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


exports.RePrintNewCar = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const UTD = req.body.UTD;
        const multi_loc = req.body.multi_loc;
        const company = await sequelize.query(`select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
        gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
        from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
        where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
        const DemoCarFetch = await sequelize.query(`
        SELECT CASE 
            WHEN TRAN_TYPE = 1 THEN (SELECT TOP 1 Modl_Name FROM Modl_Mst Where item_code = MODEL_NAME)
            WHEN TRAN_TYPE = 2 THEN (SELECT TOP 1 Modl_Name FROM Modl_Mst Where item_code = MODEL_NAME)
            WHEN TRAN_TYPE = 3 THEN MODEL_NAME
            else null
            END AS ModelName,
            CASE 
             WHEN TRAN_TYPE = 1 THEN 'N'
        WHEN TRAN_TYPE = 2 THEN 'D'
        WHEN TRAN_TYPE = 3 THEN 'I'
            else null
            END AS Tag,
            CASE
        WHEN TRAN_TYPE = 2 THEN 'https://erp.autovyn.com/backend/fetch?filePath=' + IMAGE_PATH      
        WHEN TRAN_TYPE = 3 THEN 'https://erp.autovyn.com/backend/fetch?filePath=' + IMAGE_PATH
        ELSE NULL
    END AS ImageLink,
        (SELECT TOP 1 Misc_name FROM Misc_Mst WHERE Misc_Code = FUEL_VENDOR AND Misc_type = 618) AS FuelVendor,
        FORMAT(Created_At, 'dd-MM-yyyy') AS CreatedAt,* FROM FuelSlip
        WHERE UTD = ${UTD}`);
        await sequelize.query(`UPDATE FuelSlip SET FUEL_SLIP_FLAG = COALESCE(FUEL_SLIP_FLAG, 0) + 1 WHERE UTD = ${UTD}`);

        res.status(200).send({
            success: true, DemoCarFetch: DemoCarFetch[0], company: company[0]
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
exports.NewCarRePrintView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const multi_loc = req.body.multi_loc;
        const DATE_FROM = req.body.DATE_FROM;
        const DATE_TO = req.body.DATE_TO;
        const TRAN_TYPE = req.body.TRAN_TYPE;
        const DemoCarFetch = await sequelize.query(`
        select UTD,TRAN_ID,CUSTOMER_NAME,
            (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = FUEL_VENDOR AND Misc_type = 618) AS FuelVendors,
            CASE 
            WHEN TRAN_TYPE = 1 THEN (SELECT TOP 1 concat(EMPFIRSTNAME,'',EMPLASTNAME)  FROM EMPLOYEEMASTER WHERE EMPCODE = SLIP_GIVEN_TO)
            WHEN TRAN_TYPE = 2 THEN (SELECT TOP 1 concat(EMPFIRSTNAME,'',EMPLASTNAME)  FROM EMPLOYEEMASTER WHERE EMPCODE = DRIVER_NAME)
            WHEN TRAN_TYPE = 3 THEN (SELECT TOP 1 concat(EMPFIRSTNAME,'',EMPLASTNAME)  FROM EMPLOYEEMASTER WHERE EMPCODE = DRIVER_NAME)
            else null
            END AS SlipGivenDriver,
            CASE 
            WHEN TRAN_TYPE = 1 THEN (SELECT TOP 1 Modl_Name FROM Modl_Mst Where item_code = MODEL_NAME)
            WHEN TRAN_TYPE = 2 THEN (SELECT TOP 1 Modl_Name FROM Modl_Mst Where item_code = MODEL_NAME)
            WHEN TRAN_TYPE = 3 THEN MODEL_NAME
            else null
            END AS ModelName,
            QUANTITY, DISTANCE_BET, REMARK, TYPE_OF_FUEL,CHAS_NO, VEH_REGNO, ENGINE_NO, FORMAT(Created_At, 'dd-MM-yyyy') AS CreatedAt, KM_DRIVEN,CURR_ODO_KM, FUEL_SLIP_FLAG from FuelSlip WHERE 
            TRAN_TYPE = ${TRAN_TYPE} AND LOC_CODE in (${multi_loc})
            AND Created_At >= '${DATE_FROM}'
            AND Created_At <= '${DATE_TO} 23:59:59.999';`);
        console.log(DemoCarFetch[0].length)
        res.status(200).send({
            success: true, DemoCarFetch: DemoCarFetch[0]
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

exports.SendOtp = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        const Details = await sequelize.query(`SELECT User_mob FROM User_tbl where User_Code = '${BodyData.SenderID}' AND Module_Code = 10 AND Export_type = 1`);
        await SendWhatsAppMessgae(req.headers.compcode, BodyData.User_Mob, "fuel_re_print", [
            {
                type: "text",
                text: BodyData.User_Name,
            },
            {
                type: "text",
                text: BodyData.RowData.UTD,
            },
            {
                type: "text",
                text: BodyData.otp,
            },
            {
                type: "text",
                text: BodyData.Sender,
            },
            {
                type: "text",
                text: Details[0][0].User_mob ? Details[0][0].User_mob : '',
            },
            {
                type: "text",
                text: BodyData.RowData.CreatedAt,
            },
            
        ]);
        res.status(200).send({
            success: true
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
exports.RePrintMaster = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const UserDetails = await sequelize.query(`select top 1  *,
        (SELECT TOP 1 User_Name FROM User_tbl WHERE User_tbl.User_Code = User_Rights.User_Code AND User_tbl.Module_Code= 10 AND Export_Type = 1) AS User_Name,
        (SELECT TOP 1 User_mob FROM User_tbl WHERE User_tbl.User_Code = User_Rights.User_Code AND User_tbl.Module_Code= 10 AND Export_Type = 1) AS User_Mob
        from User_Rights where Module_Code= 99 AND Optn_Name = '5.1.1'`);
        res.status(200).send({
            success: true,
            UserDetails: UserDetails[0]
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