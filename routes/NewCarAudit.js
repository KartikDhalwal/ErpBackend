const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const axios = require("axios");
const nodemailer = require('nodemailer');
const { _NewCarAuditLogs, _NewCarStockAudit } = require('../models/NewCarStockAudit');
const ExcelJS = require("exceljs");

const isBase64 = (str) => {
    try {
        return btoa(atob(str)) === str;
    } catch (err) {
        return false;
    }
};

exports.GetVechileDataByVin = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    let VIN = '';
    let TxnData;
    let CarData;
    if (isBase64(req.body.VIN)) {
        const data = JSON.parse(atob(req.body.VIN))
        VIN = data.VIN;
    } else {
        VIN = req.body.VIN
    }
    try {
        CarData = await sequelize.query(
            `select VIN, Chassis, Engine,(select Clr_No  from CHAS_MST where VIN =dms_row_data.VIN) as Modl_Clr,
            (select Modl_Name from modl_mst where Item_Code = (select Modl_Code  from CHAS_MST where VIN =dms_row_data.VIN)) as Modl_Name,
            (select Modl_Code from modl_mst where Item_Code = (select Modl_Code  from CHAS_MST where VIN =dms_row_data.VIN)) as Modl_Code,
            (select godw_name from Godown_Mst where Godw_Code = Loc_Code and export_type < 3) as Location,Loc_Code,
                (select top 1 1 from NewCar_StockAudit where VIN = DMS_ROW_DATA.VIN) as IsQR
            from DMS_ROW_DATA where VIN = '${VIN}' and Tran_Type = 2 and Export_Type < 3`);
        if (CarData[0].length == 0) {
            CarData = await sequelize.query(`	select VIN,Chas_No as Chassis,Eng_No as Engine,
            (SELECT TOP 1 Misc_name FROM misc_mst WHERE CHAS_MST.Clr_Abbr = misc_abbr AND misc_type = 10) AS Modl_Clr,
            (select Modl_Name from modl_mst where Item_Code = CHAS_MST.Modl_Code ) as Modl_Name,
            (select Modl_Code from modl_mst where Item_Code = CHAS_MST.Modl_Code ) as Modl_Code,
            (select godw_name from Godown_Mst where Godw_Code = Loc_Code and export_type < 3) as Location,
            Loc_Code,
            (select top 1 1 from NewCar_StockAudit where VIN =CHAS_MST.VIN) as IsQR
            from CHAS_MST where VIN = '${VIN}'`)
        }
        const auditHistory = await sequelize.query(`select (select top 1 godw_name from Godown_Mst where Godw_Code = Loc_Code) as Location,
        (select top 1 User_Name from user_tbl where User_Code = NewCar_AuditLogs.User_Code and Module_Code = 10 and Export_Type < 3) as user_name,
        (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= NewCar_AuditLogs.empcode and export_type < 3) as EmployeeName,
        	UTD,	qr_id,	User_Code,	EMPCODE,	Loc_Code,	AuditTime,	Latitude,	Longitude,	VIN,	Remark,	Type,status
         from NewCar_AuditLogs where VIN = '${VIN}' and type=1 order by utd desc`);
        const InternalHistory = await sequelize.query(`select ISNULL(
                (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = NewCar_AuditLogs.Loc_Code AND Misc_Type = 631), 
                (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = NewCar_AuditLogs.Loc_Code)
            ) as Location,
        (select top 1 User_Name from user_tbl where User_Code = NewCar_AuditLogs.User_Code and Module_Code = 10 and Export_Type < 3) as user_name,
        (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= NewCar_AuditLogs.empcode and export_type < 3) as EmployeeName,
         UTD,	qr_id,	User_Code,	EMPCODE,	Loc_Code,	AuditTime,	Latitude,	Longitude,	VIN,	Remark,	Type,status
        from NewCar_AuditLogs where VIN = '${VIN}' and type=2 order by utd desc`);
        const externalHistory = await sequelize.query(`select (select top 1 godw_name from Godown_Mst where Godw_Code = Loc_Code) as Location,
        (select top 1 User_Name from user_tbl where User_Code = NewCar_AuditLogs.User_Code and Module_Code = 10 and Export_Type < 3) as user_name,
        (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= NewCar_AuditLogs.empcode and export_type < 3) as EmployeeName,
         UTD,	qr_id,	User_Code,	EMPCODE,	Loc_Code,	AuditTime,	Latitude,	Longitude,	VIN,	Remark,	Type,status 
        from NewCar_AuditLogs where VIN = '${VIN}' and type=3 order by utd desc`);
        TxnData = await sequelize.query(`select * from CHAS_TRAN where chas_id = (select CHAS_ID  from CHAS_MST where VIN ='${VIN}')`);
        if (TxnData[0].length == 0) {
            TxnData = await sequelize.query(`select * from CHAS_TRANsit where chas_id = (select CHAS_ID  from CHAS_MST where VIN ='${VIN}')`);
        }
        const Journey = await sequelize.query(`select 
        CASE 
        WHEN Type = 2 THEN 
            ISNULL(
                (SELECT TOP 1 Misc_Name FROM Misc_Mst WHERE Misc_Code = NewCar_AuditLogs.Loc_Code AND Misc_Type = 631), 
                (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = NewCar_AuditLogs.Loc_Code)
            )
        ELSE 
            (SELECT TOP 1 Godw_Name FROM Godown_Mst WHERE Godw_Code = NewCar_AuditLogs.Loc_Code)
    END AS Location1,
        (select top 1 Misc_Name from Misc_Mst where Misc_Code = NewCar_AuditLogs.Loc_Code and Misc_HOD=
        (select top 1 Loc_code from NewCar_StockAudit where NewCar_StockAudit.Utd=NewCar_AuditLogs.qr_id) and Misc_Type=631) as InBranch,            
        (select top 1 User_Name from user_tbl where User_Code = NewCar_AuditLogs.User_Code and Module_Code = 10 and Export_Type < 3) as user_name,
        (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= 
        NewCar_AuditLogs.empcode and export_type < 3) as EmployeeName,
        * from NewCar_AuditLogs where VIN = '${VIN}'  order by utd `);

        const current_location = await sequelize.query(`select Loc_code from chas_mst where  VIN = '${VIN}' `)

        const result1 = await sequelize.query(
            `select misc_code as value, Misc_Name as label
             from  Misc_Mst where  Misc_Type = '631' and misc_hod in (${current_location[0][0].Loc_code})
             			 union all
            select godw_code as value,godw_name as label 
             from Godown_Mst where Godw_Code in  (${current_location[0][0].Loc_code}) and Export_Type<3`
        );

        console.log(auditHistory, "auditHistory")

        res.send({
            Status: "true",
            Message: "Success",
            Result: {
                CarData: CarData[0][0]
                , TxnData: TxnData[0],
                auditHistory: auditHistory[0],
                InternalHistory: InternalHistory[0],
                externalHistory: externalHistory[0],
                Journey: Journey[0],
                current_location: current_location[0][0].Loc_code,
                result1: result1[0]

            }
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
exports.GenerateQr = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const NewCarStockAudit = _NewCarStockAudit(sequelize, DataTypes);
        const qrData = {
            vin: req.body.VIN,
            chassis: req.body.Chassis,
            engine: req.body.Engine,
            model_color: req.body.Modl_Clr,
            model_name: req.body.Modl_Name,
            model_code: req.body.Modl_Code,
            Loc_Code: req.body.Loc_Code,
        };
        const [record, created] = await NewCarStockAudit.findOrCreate({
            where: { vin: qrData.vin },
            defaults: qrData
        });
        res.json({
            success: true,
            UTD: record.UTD, // Return the id of the found or created record
            Message: created ? 'Qr created successfully' : 'Qr already exists',
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
exports.AddAuditOfCar = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const NewCarAuditLogs = _NewCarAuditLogs(sequelize, DataTypes);
        const { QrData } = req.body;
        const data = JSON.parse(atob(QrData));
        const qr_id = data.qr_id;
        const VIN = data.VIN;
        let { User_Code, EMPCODE, Loc_Code, Latitude, Longitude, Remark, Type, status } = req.body;
        let Location;
        // Validate input (basic validation)
        // if (!User_Code || !EMPCODE) {
        //     return res.status(400).json({ message: 'User_Code, EMPCODE, and AuditTime are required.' });
        // }
        // Create the new audit log entry
        if (Type == 3) {
            const currentDate = new Date();
            const hours = String(currentDate.getHours()).padStart(2, "0");
            const minutes = String(currentDate.getMinutes()).padStart(2, "0");
            const ENTR_TIME = `${hours}.${minutes}`;
            const isPurchased = await sequelize.query(`select * from chas_mst where chas_no='${data.Chassis}' and Purc_Id is not null`)
            if (isPurchased[0].length == 0) {
                console.log('Vehicle is Not Purchased')
                return res.status(404).send({ Message: 'Vehicle is Not Purchased' })
            }
            const Amount = await sequelize.query(`select Tran_Amt from Chas_tran where (tran_type=1 or tran_type=0) and Chas_id='${isPurchased[0][0].Chas_Id}'`)
            const OutLocationLedg_id = await sequelize.query(`select DMS_Purc_Code,State,GST_No,Godw_name,DMS_HSN_Code  from Godown_Mst where Godw_Code='${isPurchased[0][0].Loc_Code}' and Export_Type<3`)
            const INLocationLedg_Name = await sequelize.query(`select DMS_Purc_Code,State,GST_No,Godw_name,DMS_HSN_Code from Godown_Mst where Godw_Code='${Loc_Code}' and Export_Type<3`)
            if (status == 'Out') {
                const maxseq = await sequelize.query(`select isnull(max(Seq_No),24000001)as seq_no  from Dms_row_Data where Loc_code='${isPurchased[0][0].Loc_Code}' and tran_type=11`)
                Location = Loc_Code
                Loc_Code = isPurchased[0][0].Loc_Code
                const ModlMst = await sequelize.query(`SELECT top 1 Item_Code,HSN,Asset_Ledg,Income_Ledg,Modl_Code,Modl_Name,Modl_Abbr,Modl_Grp,Purc_Ledg,Sale_Ledg FROM modl_Mst WHERE Item_Code='${isPurchased[0][0].Modl_Code}'`)
                const bill_no = `${OutLocationLedg_id[0][0].DMS_HSN_Code}/STS/${maxseq[0][0].seq_no}`
                await sequelize.query(
                    `
                        INSERT INTO DMS_ROW_DATA (
                          Tran_Id, Tran_Type,Bill_Date,Chassis,Engine,VIN,
                          Ledger_Id,Ledger_Name,State_Code,Gst,
                          Taxable,Cess_Amt,Rnd_Off,Export_Type,Loc_Code,Sup_Qty,
                          Narration,USR_CODE,ENTR_DATE,ENTR_TIME,TCS,TCS_Perc,Inv_Amt,HSN,Item_Code,bill_no,seq_no
                        ) VALUES (
                          (SELECT isnull(max(Tran_Id)+1,1) AS TRAN_ID from DMS_ROW_DATA),11,GETDATE(),'${isPurchased[0][0].Chas_No}','${isPurchased[0][0].Eng_No}','${isPurchased[0][0].VIN}',
                          '${OutLocationLedg_id[0][0].DMS_Purc_Code}','${INLocationLedg_Name[0][0].DMS_Purc_Code}','${OutLocationLedg_id[0][0].State}','${OutLocationLedg_id[0][0].GST_No}',
                           ${Amount[0][0].Tran_Amt},0.00,0.00,0,'${isPurchased[0][0].Loc_Code}',1.00,
                           'Transfer From ${OutLocationLedg_id[0][0].Godw_name} To ${INLocationLedg_Name[0][0].Godw_name}',
                           '${User_Code ? User_Code : EMPCODE}',GETDATE(),'${ENTR_TIME}',0.00,0.00,${Amount[0][0].Tran_Amt},87032291,'${ModlMst[0][0].Modl_Code}','${bill_no}',${maxseq[0][0].seq_no})
                          `);

                const MaxChasTranId = await sequelize.query(`SELECT ISNULL(MAX(Tran_Id) + 1, 1) AS MaxChasTranId FROM CHAS_TRAN`)
                sequelize.query(
                    `INSERT INTO CHAS_TRAN (Tran_Id, CHAS_ID, TRAN_TYPE, Tran_Date, Tran_Amt, Asset_Ledg, Income_Ledg, Loc_Code, Export_Type, Item_Type, Item_Seq)
                             VALUES (${MaxChasTranId[0][0]?.MaxChasTranId}, ${isPurchased[0][0].Chas_Id}, 6,GETDATE() , '${Amount[0][0].Tran_Amt}', 
                             ${ModlMst[0][0]?.Asset_Ledg || null}, ${ModlMst[0][0]?.Income_Ledg || null}, '${isPurchased[0][0].Loc_Code}', 1, 2, 1)`
                )
                await sequelize.query(`update chas_mst set Int_Location=null where chas_no='${data.Chassis}'`)

            } else if (status == 'In') {
                const OutLocation = await sequelize.query(`select DMS_Purc_Code,State,GST_No,Godw_name,Godw_Code,DMS_HSN_Code from Godown_Mst where Godw_Code=(select top 1 Location from NewCar_AuditLogs where type=3 and status='Out' and vin='${data.VIN}'  order by utd desc ) and Export_Type<3`)
                const maxseq = await sequelize.query(`select isnull(max(Seq_No),24000001)as seq_no  from Dms_row_Data where Loc_code='${OutLocation[0][0].Godw_Code}' and tran_type=12`)

                const ModlMst = await sequelize.query(`SELECT top 1 Item_Code,HSN,Asset_Ledg,Income_Ledg,Modl_Code,Modl_Name,Modl_Abbr,Modl_Grp,Purc_Ledg,Sale_Ledg FROM modl_Mst WHERE Item_Code='${isPurchased[0][0].Modl_Code}'`)
                const bill_no = `${OutLocation[0][0].DMS_HSN_Code}/STC/${maxseq[0][0].seq_no}`
                await sequelize.query(
                    `
                        INSERT INTO DMS_ROW_DATA (
                          Tran_Id, Tran_Type,Bill_Date,Chassis,Engine,VIN,
                          Ledger_Id,Ledger_Name,State_Code,Gst,
                          Taxable,Cess_Amt,Rnd_Off,Export_Type,Loc_Code,Sup_Qty,
                          Narration,USR_CODE,ENTR_DATE,ENTR_TIME,TCS,TCS_Perc,Inv_Amt,HSN,Item_Code,bill_no,seq_no
                        ) VALUES (
                          (SELECT isnull(max(Tran_Id)+1,1) AS TRAN_ID from DMS_ROW_DATA),12,GETDATE(),'${isPurchased[0][0].Chas_No}','${isPurchased[0][0].Eng_No}','${isPurchased[0][0].VIN}',
                          '${OutLocation[0][0].DMS_Purc_Code}','${OutLocationLedg_id[0][0].DMS_Purc_Code}','${OutLocation[0][0].State}','${OutLocation[0][0].GST_No}',
                           ${Amount[0][0].Tran_Amt},0.00,0.00,0,'${OutLocation[0][0].Godw_Code}',1.00,
                           'Transfer From ${OutLocationLedg_id[0][0].Godw_name} To ${OutLocation[0][0].Godw_name}',
                           '${User_Code ? User_Code : EMPCODE}',GETDATE(),'${ENTR_TIME}',0.00,0.00,${Amount[0][0].Tran_Amt},87032291,'${ModlMst[0][0].Modl_Code}','${bill_no}',${maxseq[0][0].seq_no})
                          `);

                const MaxChasTranId = await sequelize.query(`SELECT ISNULL(MAX(Tran_Id) + 1, 1) AS MaxChasTranId FROM CHAS_TRAN`)
                sequelize.query(
                    `INSERT INTO CHAS_TRAN (Tran_Id, CHAS_ID, TRAN_TYPE, Tran_Date, Tran_Amt, Asset_Ledg, Income_Ledg, Loc_Code, Export_Type, Item_Type, Item_Seq)
                               VALUES (${MaxChasTranId[0][0]?.MaxChasTranId}, ${isPurchased[0][0].Chas_Id}, 5,GETDATE() , '${Amount[0][0].Tran_Amt}', 
                               ${ModlMst[0][0]?.Asset_Ledg || null}, ${ModlMst[0][0]?.Income_Ledg || null}, '${OutLocation[0][0].Godw_Code}', 1, 2, 1)`
                )

                await sequelize.query(`update chas_mst set Int_Location='${OutLocation[0][0].Godw_Code}' where chas_no='${data.Chassis}'`)
                Loc_Code = OutLocation[0][0].Godw_Code
                Location = isPurchased[0][0].Loc_Code
            }
            //Dms Row Data

        }
        if (Type == 2) {
            const isPurchased = await sequelize.query(`select * from chas_mst where chas_no='${data.Chassis}' and Purc_Id is not null`)
            if (isPurchased[0].length == 0) {
                console.log('Vehicle is Not Purchased')
                return res.status(404).send({ Message: 'Vehicle is Not Purchased' })
            }
            if (status == 'Out') {
                Location = Loc_Code
                Loc_Code = isPurchased[0][0].Int_Location ? isPurchased[0][0].Int_Location : isPurchased[0][0].Loc_Code
                await sequelize.query(`update chas_mst set Int_Location='${isPurchased[0][0].Int_Location ? isPurchased[0][0].Int_Location : isPurchased[0][0].Loc_Code}' where chas_no='${data.Chassis}'`)
            }
            else if (status == 'In') {
                const InLocation = await sequelize.query(`select Location from newcar_auditlogs where type=2 and status='out' order by utd desc`)
                Loc_Code = InLocation[0][0].Location
                Location = isPurchased[0][0].Int_Location ? isPurchased[0][0].Int_Location : isPurchased[0][0].Loc_Code
                await sequelize.query(`update chas_mst set Int_Location='${InLocation[0][0].Location}' where chas_no='${data.Chassis}'`)
            }
        }

        const newAuditLog = await NewCarAuditLogs.create({
            qr_id,
            User_Code,
            EMPCODE,
            Loc_Code,
            Latitude,
            Longitude,
            VIN,
            Remark,
            Type: Type ?? 1, // Default to 1 if Type is undefined or null
            status: status ?? null, // Default to null if Status is undefined or null
            Location
        });
        res.json({
            success: true,
            UTD: newAuditLog.UTD, // Return the id of the found or created record
            // message: created ? 'Record created successfully' : 'Record already exists',
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

exports.GetVechileData = async function (req, res) {
    try {
        const utd = req.params.utd;
        const sequelize = await dbname(req.query.compcode);


        const htmlContent = `
        <html>
          <head>
            <style>
             @import url('https://fonts.googleapis.com/css?family=Lato');
              * {
              position: relative;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Lato', sans-serif;
              }
  
              body {
              height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              background: linear-gradient(to bottom right, #EEE, #AAA);
              }
  
              h1 {
              margin: 40px 0 20px;
              }
  
              .lock {
              border-radius: 5px;
              width: 55px;
              height: 45px;
              background-color: #333;
              animation: dip 1s;
              animation-delay: (2s - .5);
              
              &::before,
              &::after {
                  content: '';
                  position: absolute;
                  border-left: 5px solid #333;
                  height: 20px;
                  width: 15px;
                  left: calc(50% - 12.5px);
              }
              
              &::before {
                  top: -30px;
                  border: 5px solid #333;
                  border-bottom-color: transparent;
                  border-radius: 15px 15px 0 0;
                  height: 30px;
                  animation: lock 2s, spin 2s;
              }
              
              &::after {
                  top: -10px; 
                  border-right: 5px solid transparent;
                  animation: spin 2s;
              }
              }
  
              @keyframes lock {
              0% {
                  top: -45px;
              }
              65% {
                  top: -45px;
              }
              100% {
                  top: -30px;
              }
              }
  
              @keyframes spin {
              0% {
                  transform: scaleX(-1);
                  left: calc(50% - 30px);
              }
              65% {
                  transform: scaleX(1);
                  left: calc(50% - 12.5px);
              }
              }
  
              @keyframes dip {
              0% {
                  transform: translateY(0px);
              }
              50% {
                  transform: translateY(10px);
              }
              100% {
                  transform: translateY(0px);
              }
              }
  
            </style>
          </head>
          <body>
           <div class="lock"></div>
              <div class="message">
              <h1>Access to this page is restricted</h1>            
              <p>Please scan this Qr code using AutoVyn HRMS mobile application</p>
              <p>Or visit out website <a href="http://erp.autovyn.com/"> AutoVyn</a> </p>
              </div>
          </body>
        </html>
    `;

        res.send(htmlContent);
    } catch (e) {
        console.error("Error fetching asset details:", e);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.AuditReport = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const data = req.query;
        const Loc_Code = data.Loc_Code;

        let reportName = "New Car Audit Report";

        const txnDetails = await sequelize.query(
            `WITH LatestAuditPerVIN AS (
    SELECT 
        NA.VIN,
        NA.EMPCODE,
        (SELECT TOP 1 CONCAT(title, ' ', empfirstname, ' ', EMPLASTNAME)  
         FROM EMPLOYEEMASTER 
         WHERE empcode = NA.empcode 
           AND export_type < 3) AS [Auditor Name],
        NA.loc_code AS [Loc Code],
        (SELECT TOP 1 godw_name 
         FROM Godown_Mst 
         WHERE Godw_Code = NA.Loc_Code) AS Location,
        NA.Latitude,
        NA.Longitude,
        FORMAT(NA.AuditTime, 'MM/dd/yyyy hh:mm tt') AS [Audit Date],
        NA.Remark,
        ns.Chassis,
        ns.Engine,
        ns.model_name AS [Model Name],
        ns.model_color AS [Model Color],
        ns.model_code AS [Model Code],
        ROW_NUMBER() OVER (PARTITION BY NA.VIN ORDER BY NA.AuditTime DESC) AS row_num
    FROM 
        NewCar_AuditLogs AS NA
    LEFT JOIN 
        NewCar_StockAudit AS ns ON ns.Utd = NA.qr_id
)
SELECT 
    VIN,
    EMPCODE,
    [Auditor Name],
    [Loc Code],
    Location,
    Latitude,
    Longitude,
    [Audit Date],
    Remark,
    Chassis,
    Engine,
    [Model Name],
    [Model Color],
    [Model Code]
FROM 
    LatestAuditPerVIN
WHERE 
    row_num = 1 
    AND [Loc Code] IN (${Loc_Code})  -- Filter for the specific location after identifying the latest audit for each VIN
ORDER BY 
    [Audit Date] DESC;`
        );
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
        }; // Center the text
        worksheet.getCell("A1").font = { bold: true, size: 16 }; // Make the text bold and increase font size
        worksheet.mergeCells("A2:E2");
        worksheet.getCell("A2").value = `${reportName}`; // Replace with your company name
        worksheet.getCell("A2").alignment = {
            vertical: "middle",
            horizontal: "center",
        }; // Center the text

        // Add headers for the data starting from the 3rd row

        const headers = Object.keys(txnDetails[0][0]);
        const headerRow = worksheet.addRow(headers);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
            cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF006400" }, // dark green background color
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
            'attachment; filename="GatePass_Report.xlsx"'
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
        // console.log(e);
        // const workbook = new ExcelJS.Workbook();
        // const worksheet = workbook.addWorksheet("Sheet1");

        // res
        //     .status(200)
        //     .setHeader(
        //         "Content-Type",
        //         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        //     );
        // res.setHeader(
        //     "Content-Disposition",
        //     'attachment; filename="Gatepassreport.xlsx"'
        // );
        // return workbook.xlsx
        //     .write(res)
        //     .then(() => {
        //         res.end();
        //     })
        //     .catch((error) => {
        //         console.error("Error creating workbook:", error);
        //         res.status(500).send("Internal Server Error");
        //     });

        return res.status(500).send({ message: "Internal server error" })
    } finally {
        // Close the Sequelize connection
        if (sequelize) {
            await sequelize.close();
        }
    }
};