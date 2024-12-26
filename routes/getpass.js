const { dbname } = require("../utils/dbconfig");
const { CarGetPassSchema, _CarGetPass } = require("../models/CarGetPass");
const { Sequelize, DataTypes, literal, where } = require("sequelize");

exports.insertgetpass = async function (req, res) {
  const { UTD, getPassNO, ...other } = req.body.formData
  const { error, value: CarGetPass } =
    CarGetPassSchema.validate(other, {
      abortEarly: false,
      stripUnknown: true,
    });
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    try {
      const sequelize = await dbname(req.headers.compcode);

      const getpassno = await sequelize.query(`
        SELECT 
          isnull(MAX(getPassNO+1),1) AS FullPassNumber
  FROM 
      Car_GetPass
  WHERE 
      loc_code = ${other.loc_code}
  `)


      const AssetsGroupSubcategory = _CarGetPass(
        sequelize,
        DataTypes
      );
      const t = await sequelize.transaction();
      const AssetsGroupSubcategory1 = await AssetsGroupSubcategory.create(
        {
          ...CarGetPass, // Spread CarGetPass properties
          getPassNO: getpassno[0][0].FullPassNumber, // Assign getPassNO property
        },
        {
          transaction: t,
          return: true,
        }
      );
      await t.commit();
      res.status(200).send(AssetsGroupSubcategory1);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred during Saving." });
    }
  }
};
exports.updategetpass = async function (req, res) {
  const { UTD, ...other } = req.body.formData
  const { error, value: CarGetPass } =
    CarGetPassSchema.validate(other, {
      abortEarly: false,
      stripUnknown: true,
    });
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    try {
      const sequelize = await dbname(req.headers.compcode);
      const AssetsGroupSubcategory = _CarGetPass(
        sequelize,
        DataTypes
      );
      const t = await sequelize.transaction();
      const AssetsGroupSubcategory1 = await AssetsGroupSubcategory.update(
        CarGetPass,
        {
          where: { UTD },
          returning: true, // Return updated rows
          transaction: t, // Use the provided transaction
        }
      );
      await t.commit();
      res.status(200).send(AssetsGroupSubcategory1);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred during Update." });
    }
  }
};
exports.findcust = async function (req, res) {
  const cust_id = req.body.cust_id
  const loc_code = req.body.loc_code;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const data = await sequelize.query(`
      select Ledg_Name as CustName,Ledg_Add1  as Address,Ledg_Pan as Pan_NO,Ledg_PIN as Pin from Ledg_Mst where Loc_code='${loc_code}' and Ledg_Add6='${cust_id}'`)
    res.status(200).send(data[0][0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during Update." });
  }
}
exports.findmaster = async function (req, res) {
  const location = req.body.loc_code
  try {
    const sequelize = await dbname(req.headers.compcode);
    const Models = await sequelize.query(`
          SELECT 
              Misc_Name AS label,
              CAST(Misc_Code AS VARCHAR(MAX)) AS value
          FROM Misc_Mst
          WHERE Misc_Type = 14 and Misc_Name !=''
          order by Misc_Code`
    );
    const color = await sequelize.query(
      `select Misc_Name AS label,Misc_Code AS value from Misc_mst where Misc_type=10 and export_type<3 and misc_name!='' and misc_name is not null`
    );
    const employee = await sequelize.query(`SELECT [EMPCODE] AS [value], concat(EMPCODE ,' ' , EMPFIRSTNAME , ' ' , EMPLASTNAME ) AS [label] FROM [dbo].[EMPLOYEEMASTER] AS [Employeemaster] 
      where  export_type < 3
     `);

    const financer = await sequelize.query(
      `SELECT DISTINCT Misc_Code AS value,Misc_Name AS label FROM Misc_Mst where misc_type = 8 and export_type < 3`
    );
    const getpassno = await sequelize.query(`
      SELECT 
    CONCAT(
       (SELECT replace(newcar_rcpt,'-S','')
         FROM GODOWN_MST 
         WHERE godw_code = ${location} AND Export_Type < 3),
        '/',
        isnull(MAX(getPassNO+1),1)
    ) AS FullPassNumber
FROM 
    Car_GetPass
WHERE 
    loc_code = ${location}
`)

    res.status(200).send({ Models: Models[0], color: color[0], employee: employee[0], financer: financer[0], getpassno: getpassno[0][0] });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during Update." });
  }
}
exports.findvarient = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Misc_Code = req.body.Veh_Model;
    const varient = await sequelize.query(
      `select Modl_Name as label,Item_Code as value,Modl_Code from Modl_mst where Modl_Grp='${Misc_Code}'`
    );
    res.status(200).json(varient[0]);
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};
exports.viewgetpass = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const DateFrom = req.body.DateFrom;
    const DateTo = req.body.DateTo;
    const Loc_code = req.body.Loc_code;
    const varient = await sequelize.query(
      `select UTD,getPassNO,CustDate,CustName,
(select Misc_Name from Misc_mst where Misc_type=14 and Misc_Code=Veh_Model) as Veh_Model,
(select top 1 Modl_Name from  Modl_Mst where item_code=Car_GetPass.Modl_Var)as Modl_Var,
EngineNO,ChasNo,
(select top 1 Misc_Name from Misc_mst where Misc_type=10 and export_type<3 and misc_code=Car_GetPass.Color)as color,
CREATED_BY
from Car_GetPass
where CustDate between '${DateFrom}' And '${DateTo}' and loc_code='${Loc_code}'`
    );
    res.status(200).json(varient[0]);
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};
exports.findgetpass = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const UTD = req.body.UTD;
    const data = await sequelize.query(
      `select	UTD,	getPassNO,	CustDate,	RegNo,	CustId,	CustName,	FatherName	,Address,	EW	,CCP,	MSR,	MSSF,	RTO,	DRTO,	EXCHANGE,	FastagNO,	Veh_Model	,EngineNO	,
      ChasNo,	Color,	Remark, loc_code,	CREATED_BY, Modl_Var,Pin,Pan_No,FIN_NAME,tl,Executive,MSR
      from Car_GetPass where utd='${UTD}'`
    );
    const varient = await sequelize.query(
      `select Modl_Name as label,Item_Code as value,Modl_Code from Modl_mst where Modl_Grp='${data[0][0].Veh_Model}'`
    );
    res.status(200).json({ data: data[0][0], varient: varient[0] });
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};
exports.finddatabyvin = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Vin = req.body.Vin;
    const Location = req.body.Location;
    const varient = await sequelize.query(
      `select Invoice_Cust_Id as CustId,Ledger_Name as CustName,
      Ledger_Name2 as FatherName,Param_Address as Address,PAN_NO as Pan_No,
      (select modl_grp from Modl_Mst where Modl_Code=BHATIA_INVOICE.MODEL_INV)as Veh_Model,
      (select Item_Code from Modl_Mst where Modl_Code=BHATIA_INVOICE.MODEL_INV)as Modl_Var,
      (select top 1 Chas_No from Chas_mst where vin=BHATIA_INVOICE.VIN_INV and Export_Type<5)as ChasNo,
      (select top 1 Eng_No from Chas_mst where vin=BHATIA_INVOICE.VIN_INV and Export_Type<5)as EngineNO,
      (select top 1 Misc_Code from misc_mst where Misc_Type=10 and Misc_Abbr=(select top 1 Clr_Abbr from CHAS_MST where CHAS_MST.vin=BHATIA_INVOICE.VIN_INV and Export_Type<5))as color,
      (select top 1 empcode from employeemaster where srno=(select top 1 ERP_DSE from ICM_MST where ICM_MST.TRAN_ID=BHATIA_INVOICE.ICM_ID))as Executive,
      (select top 1 empcode from employeemaster where srno=(select top 1 ERP_TL from ICM_MST where ICM_MST.TRAN_ID=BHATIA_INVOICE.ICM_ID))as tl,
      (select top 1 Fin_Code from ICM_MST where ICM_MST.TRAN_ID=BHATIA_INVOICE.ICM_ID)as FIN_NAME
      from BHATIA_INVOICE where VIN_INV='${Vin}' and loc_code='${Location}'`);

    res.status(200).json(varient[0][0]);
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};

exports.findgetpassprint = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const UTD = req.body.UTD;
    const varient = await sequelize.query(
      `select	UTD,	
      CONCAT(
       (SELECT replace(newcar_rcpt,'-S','')
         FROM GODOWN_MST 
         WHERE godw_code =loc_code AND Export_Type < 3),
        '/',
        getPassNO
    ) AS getPassNO,	
     (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= Executive and export_type < 3) as Executive,
     (select top 1 concat(title,' ',empfirstname,' ',EMPLASTNAME)  from EMPLOYEEMASTER where empcode= tl and export_type < 3) as tl,
     (select top 1 misc_name from misc_mst where misc_type=10 and misc_code=color)as Color,
     (select top 1 misc_name from misc_mst where misc_type=8 and misc_code=FIN_NAME)as FIN_NAME,
     (select top 1 misc_name from misc_mst where misc_type=14 and misc_code=Veh_Model)as Veh_Model,
     (select top 1 modl_name from modl_mst where item_code=Modl_Var)as Modl_Var,
      CustDate,	RegNo,	CustId,	CustName,	FatherName	,Address,	EW	,CCP,	MSR	MSSF,	RTO,	DRTO,	EXCHANGE,	FastagNO,EngineNO	,
      ChasNo,Remark, loc_code,	CREATED_BY,Pin,Pan_No,MSR
      from Car_GetPass where utd='${UTD}'`
    );
    res.status(200).json(varient[0][0]);
  } catch (e) {
    console.log(e);
  } finally {
    sequelize.close();
  }
};