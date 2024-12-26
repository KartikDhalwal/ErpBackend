const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const axios = require("axios");
const nodemailer = require('nodemailer');


 
 



// exports.saveexpense = async function (req, res) {
//     const sequelize = await dbname(req.headers.compcode);
//     const t = await sequelize.transaction();
//     const data  = req.body;
//    // console.log(data,"datadtaa")

//     try {
//         const [maxCodeResult] = await sequelize.query(
//             'SELECT COALESCE(MAX(UID), 0) AS MaxUID FROM Exp_Allot',
//             { transaction: t }
//         );
//         const maxUID = maxCodeResult[0].MaxUID;

//         // console.log(maxUID+1)
//         const currentDate = new Date();
//         const formattedDate = currentDate.toISOString().split('T')[0];  

       
//         const recordsToInsert = data?.data1?.map(item => ({
//                 UID: maxUID + 1,
//                 Exp_Ledg_Code: item.Exp_Ledg_Code,
//                 Br_code: item.Br_code,
//                 Exp_perc: parseFloat(String(item.Exp_perc).trim()),
//                 Export_type: 1,  
//                 User_code:data?.user_code,  
//                 Modify_date: formattedDate 
//             }));

//         if (recordsToInsert.length > 0) {
//             await sequelize.getQueryInterface().bulkInsert('Exp_Allot', recordsToInsert, { transaction: t });
//         }

//         await t.commit();

//         res.status(200).send({
//             Status: true,
//             Message: "Success",
//             Result: null, 
//         });
//     } catch (e) {
//         console.error(e);
//         // Rollback the transaction on error
//         if (t) {
//             await t.rollback();
//         }
//         res.status(500).send({
//             Status: false,
//             Message: "Error occurred while inserting data",
//             Result: null,
//         });
//     } finally {
//         if (sequelize) {
//             await sequelize.close();
//         }
//     }
// };


exports.updateexpense = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data  = req.body;
     // console.log(data,"datadtaa")
    try {
       const a= await sequelize.query(`select * from Exp_Allot`);
        // console.log(a,"aaaaaaaaaaaaa")
        if (a[0].length > 0) {
            await sequelize.query(`UPDATE Exp_Allot SET
                Export_Type = 33
                WHERE UID = 1`);
        }
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];  
        const recordsToInsert = data?.data1?.map(item => ({
                UID:1,
                Exp_Ledg_Code: item.Exp_Ledg_Code,
                Br_code: item.Br_code,
                Exp_perc: parseFloat(String(item.Exp_perc).trim()),
                Export_type:1,  
                User_code:data?.user_code,  
                Modify_date: formattedDate 
            }));

        if (recordsToInsert.length > 0) {
            await sequelize.getQueryInterface().bulkInsert('Exp_Allot', recordsToInsert, { transaction: t });
        }

        await t.commit();

        res.status(200).send({
            Status: true,
            Message: "Success",
            Result: null, 
        });
    } catch (e) {
        console.error(e);
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null,
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};
 
exports.expenseledger = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const ledger = await sequelize.query('select ledg_code  ,ledg_name from Ledg_Mst where br_wise_exp=1 and ServerId=13 and Export_Type <3 order by Ledg_Name');
        const branch = await sequelize.query('select Godw_Code as code,Godw_Name as name from Godown_Mst where Export_Type < 3 order by Godw_Code');
        // console.log(branch[0],"ledgerledgerledger")
        res.send({
          Status: "true",
          Message: "Success",
          Result: {Ledgre:ledger[0],Branch:branch[0] } 
        });
    } catch (err) { 
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
  };

exports.ExpAllotdata = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const data = await sequelize.query('select Exp_Ledg_Code,Br_code,Exp_perc from Exp_Allot where Export_type=1 and UID=1');
        // console.log(data[0],"data")
        res.send({
          Status: "true",
          Message: "Success",
          Result: data[0]  
        });
    } catch (err) { 
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
  };













exports.Brexpsubmit = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data  = req.body;
     // console.log(data,"datadtaa")
    try {
        const [b]= await sequelize.query(`SELECT isnull(max(TRAN_ID)+1,1) AS TRAN_ID from  Br_Exp`);
        const tran_id=b[0].TRAN_ID;

        // console.log(b[0].TRAN_ID,"bbbbbbbbbb:")
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];  
        const recordsToInsert = data?.data1?.map(item => ({
                TRAN_ID:tran_id,
                Exp_Ledg_Code: item.Exp_Ledg_Code,
                Br_code: item.Br_code,
                Exp_Amt:item.Exp_Amt,
                Export_type:1,  
                Month:data.month,
                Year:data.year,
                User_code:data?.user_code,  
                Modify_date: formattedDate 
            }));
        if (recordsToInsert.length > 0) {
            await sequelize.getQueryInterface().bulkInsert('Br_Exp', recordsToInsert, { transaction: t });
        }

        await t.commit();

        res.status(200).send({
            Status: true,
            Message: "Success",
            Result: null, 
        });
    } catch (e) {
        console.error(e);
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null,
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};

exports.BrExpData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const datas=req.body
    // console.log(datas,"req.body")
    try {
        const data = await sequelize.query(`select TRAN_ID,Exp_Ledg_Code,Br_code,Exp_Amt from Br_Exp where Export_type=1 and Month=${datas.month} and Year=${datas.year}`);
        // console.log(data[0],"data")
        res.send({
          Status: "true",
          Message: "Success",
          Result: data[0]  
        });
    } catch (err) { 
        console.log(err);
    }
    finally {
        await sequelize.close();
    }
  };


exports.Brexpupdate = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    const data  = req.body;
     // console.log(data,"datadtaa")

    try {
            await sequelize.query(`UPDATE Br_Exp SET
                Export_Type = 33
                WHERE TRAN_ID = ${data.TRAN_ID}`);
  
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];  
        const recordsToInsert = data?.data1?.map(item => ({
                TRAN_ID:data.TRAN_ID,
                Exp_Ledg_Code: item.Exp_Ledg_Code,
                Br_code: item.Br_code,
                Exp_Amt:item.Exp_Amt,
                Export_type:1,  
                Month:data.month,
                Year:data.year,
                User_code:data?.user_code,  
                Modify_date: formattedDate 
            }));
        if (recordsToInsert.length > 0) {
            await sequelize.getQueryInterface().bulkInsert('Br_Exp', recordsToInsert, { transaction: t });
        }
        await t.commit();
        res.status(200).send({
            Status: true,
            Message: "Success",
            Result: null, 
        });
    } catch (e) {
        console.error(e);
        if (t) {
            await t.rollback();
        }
        res.status(500).send({
            Status: false,
            Message: "Error occurred while inserting data",
            Result: null,
        });
    } finally {
        if (sequelize) {
            await sequelize.close();
        }
    }
};



 

exports.savenewcarppc = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
  
     const data = req.body.formData;
     // console.log(data,"datadatadatadatda")
    try {
  
      const [MaxCode] = await sequelize.query('SELECT isnull(max(Tran_id)+1,1) AS Tran_id from PPC_PARAM');
    //   const Tran_id=MaxCode[0].Tran_id;
      const Tran_id=1
      // console.log(Tran_id,"maxcode")
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];  
     

      await sequelize.query(
        `INSERT INTO PPC_PARAM (
            Tran_id, Interest, Payout_Insurance, Commission_Ew, Commission_CCP,
            Commission_TCU, Margin_Card, Margin_Fastag, Margin_Accessory,
            Margin_VAS, Margin_Outsider, Loc_code, Export_type, Modify_date, Create_by
        ) VALUES (
            :Tran_id, :Interest, :Payout_Insurance, :Commission_Ew, :Commission_CCP,
            :Commission_TCU, :Margin_Card, :Margin_Fastag, :Margin_Accessory,
            :Margin_VAS, :Margin_Outsider, :Loc_code, :Export_type, :Modify_date, :Create_by
        )`,
        {
            replacements: {
                Tran_id:Tran_id,
                Interest: data.Interest || null, 
                Payout_Insurance: data.Payout_Insurance || null, 
                Commission_Ew: data.Commission_Ew || null, 
                Commission_CCP: data.Commission_CCP || null, 
                Commission_TCU: data.Commission_TCU || null, 
                Margin_Card: data.Margin_Card || null, 
                Margin_Fastag: data.Margin_Fastag || null, 
                Margin_Accessory: data.Margin_Accessory || null, 
                Margin_VAS: data.Margin_VAS || null, 
                Margin_Outsider: data.Margin_Outsider || null, 
                Loc_code: data.Loc_code,
                Export_type: 1,   
                Modify_date: formattedDate,   
                Create_by: data.Create_by 
            },
            transaction: t
        }
    );
 
      await t.commit();
      res.status(200).send({
        Status: true,
        Message: "Success",
        Result: null,  
      });
    } catch (e) {
      console.error(e);
      if (t) {
        await t.rollback();
      }
      res.status(500).send({
        Status: false,
        Message: "Error occurred while inserting data",
        Result: null,
      });
    } finally {
      if (sequelize) {
        await sequelize.close();
      }
    }
  };


  exports.viewcarppc = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    try {
    const [Result]=  await sequelize.query(`select * from PPC_PARAM where tran_id=1 and export_type<3 `);
        // console.log(Result[0],"Result")                          
 
      await t.commit();
      res.status(200).send({
        Status: true,
        Message: "Success",
        Result: Result[0] ,  
      });
    } catch (e) {
      console.error(e);
      if (t) {
        await t.rollback();
      }
      res.status(500).send({
        Status: false,
        Message: "Error occurred while inserting data",
        Result: null,
      });
    } finally {
      if (sequelize) {
        await sequelize.close();
      }
    }
  };


  exports.updatenewcarppc = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
  
      const data = req.body.formData;
     // console.log(data,"datadatadatadatda")
    try {

        await sequelize.query(`UPDATE PPC_PARAM SET
            Export_Type = 33
            WHERE Tran_id =1 `);
  
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString().split('T')[0];  
      await sequelize.query(
        `INSERT INTO PPC_PARAM (
            Tran_id, Interest, Payout_Insurance, Commission_Ew, Commission_CCP,
            Commission_TCU, Margin_Card, Margin_Fastag, Margin_Accessory,
            Margin_VAS, Margin_Outsider, Loc_code, Export_type, Modify_date, Create_by
        ) VALUES (
            :Tran_id, :Interest, :Payout_Insurance, :Commission_Ew, :Commission_CCP,
            :Commission_TCU, :Margin_Card, :Margin_Fastag, :Margin_Accessory,
            :Margin_VAS, :Margin_Outsider, :Loc_code, :Export_type, :Modify_date, :Create_by
        )`,
        {
            replacements: {
                Tran_id:1,
                Interest: data.Interest || null, 
                Payout_Insurance: data.Payout_Insurance || null, 
                Commission_Ew: data.Commission_Ew || null, 
                Commission_CCP: data.Commission_CCP || null, 
                Commission_TCU: data.Commission_TCU || null, 
                Margin_Card: data.Margin_Card || null, 
                Margin_Fastag: data.Margin_Fastag || null, 
                Margin_Accessory: data.Margin_Accessory || null, 
                Margin_VAS: data.Margin_VAS || null, 
                Margin_Outsider: data.Margin_Outsider || null, 
                Loc_code: data.Loc_code,
                Export_type: 1,   
                Modify_date: formattedDate,   
                Create_by: data.Create_by 
            },
            transaction: t
        }
    );
 
      await t.commit();
      res.status(200).send({
        Status: true,
        Message: "Success",
        Result: null,  
      });
    } catch (e) {
      console.error(e);
      if (t) {
        await t.rollback();
      }
      res.status(500).send({
        Status: false,
        Message: "Error occurred while inserting data",
        Result: null,
      });
    } finally {
      if (sequelize) {
        await sequelize.close();
      }
    }
  };
