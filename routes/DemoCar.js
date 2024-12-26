const { dbname } = require("../utils/dbconfig");
const jwt = require("jsonwebtoken");
const FormData = require("form-data");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { SendWhatsAppMessgae } = require("./user");

async function uploadImage2(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    // console.log(files);
    await Promise.all(
      files?.map(async (file, index) => {
        const customPath = `${Comp_Code}/DemogatepassImage/`;
        const ext = path.extname(file.originalname);
        // Generate randomUUID
        const randomUUID = uuidv4();
        // Append extension to randomUUID
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
          const data = {
            SRNO: index,
            User_Name: Created_by,
            DOC_NAME: file.originalname,
            fieldname: file.fieldname,
            path: `${customPath}${fileName}`,
          };
          // console.log(data, 'data');
          dataArray.push(data);
          console.log(`Image uploaded successfully`);
        } catch (error) {
          console.log(error);
          console.error(`Error uploading image ${index}:, error.message`);
        }
        // Doc_Type	TRAN_ID	SRNO	path	File_Name	User_Name	Upload_Date	Export_type
      })
    );
    return dataArray;
  } catch (e) {
    console.log(e);
  }
}
exports.uploadedCarImage = async function (req, res) {
  console.log(req.files, "files");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const UTD = req.body.UTD;
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
          req.body.name
        );
        console.log(EMP_DOCS_data, "EMP_DOCS_data");
        res.status(200).send(EMP_DOCS_data[0].path);
      } else {
        res.status(200).send("No File Uploaded");
      }
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};

exports.Demogatepassadd = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "qqq");
  let response = {
    Status: false,
    Message: "",
  };

  const OutTime = req.body.formdata.OutTime
    ? `'${req.body.formdata.OutTime}'`
    : null;
  const gatepass = req.body.formdata.gatepass
    ? `'${req.body.formdata.gatepass}'`
    : null;
  const Remark = req.body.formdata.Remark
    ? `'${req.body.formdata.Remark}'`
    : null;
  const CustomerName = req.body.formdata.CustomerName
    ? `'${req.body.formdata.CustomerName}'`
    : null;
  const Customer_Mobileno = req.body.formdata.Customer_Mobileno
    ? `'${req.body.formdata.Customer_Mobileno}'`
    : null;
  const ModelName = req.body.formdata.ModelName
    ? `'${req.body.formdata.ModelName}'`
    : null;
  const Branch = req.body.formdata.Branch
    ? `'${req.body.formdata.Branch}'`
    : null;
  const DriverName = req.body.formdata.DriverName
    ? `'${req.body.formdata.DriverName}'`
    : null;
  const veh_regno = req.body.formdata.veh_regno
    ? `'${req.body.formdata.veh_regno}'`
    : null;
  const km_driven = req.body.formdata.km_driven
    ? `'${req.body.formdata.km_driven}'`
    : null;
  const EMPCODE = req.body.formdata.EMPCODE
    ? `'${req.body.formdata.EMPCODE}'`
    : null;
  const Modelvalue = req.body.formdata.Modelvalue
    ? `'${req.body.formdata.Modelvalue}'`
    : null;
  const Branch_Name = req.body.formdata.Branch_Name
    ? `'${req.body.formdata.Branch_Name}'`
    : null;
  const Enquiry_No = req.body.formdata.Enquiry_No
    ? `'${req.body.formdata.Enquiry_No}'`
    : null;

  const InterBranch_Loc = Branch ? `${Branch}` : null;
  try {
    const res1 = await sequelize.query(
      `select EMPCODE FROM APPROVAL_MATRIX WHERE EMPCODE = ${EMPCODE} AND MODULE_CODE = 'democar'`
    );

    console.log(res1, "resresres");

    console.log(res1[0], res1[0].length, "slsl");
    if (res1[0].length == 0) {
      return res.status(400).send({
        Status: false,
        Message:
          "Empcode not found in approval matrix. Defined your Approvers first",
      });
    }
    const result =
      await sequelize.query(`INSERT INTO Demo_Car_Gatepass (empcode,GP_TYPE,Customer_Name,Customer_Mobile,Driver_code,model_code,OUT_TIME,
            Remark,VEH_REG,last_km,LOC_CODE, InterBranch_Loc, Enquiry_No)
                     VALUES(${EMPCODE},${gatepass},${CustomerName},${Customer_Mobileno},${DriverName},
                     ${Modelvalue},${OutTime}, ${Remark}, ${veh_regno}, ${km_driven}, ${Branch_Name}, ${InterBranch_Loc}, ${Enquiry_No})`);

    await sequelize.query(
      `update DemoCarMaster set available = 1 where veh_regno = ${veh_regno}`
    );
    const mobile_no = await sequelize.query(
      `select mobile_no from employeemaster where empcode=(select top 1 Approver1_A from Approval_matrix where module_code = 'democar' and  Empcode = (select top 1 empcode from demo_car_gatepass where veh_reg=${veh_regno}))`
    );
    const emp1 = await sequelize.query(
      `select Mobile_no,concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EMPNAME from employeemaster where empcode=${EMPCODE} `
    );
    const branch = await sequelize.query(
      `select Godw_Name from GODOWN_MST where Godw_Code in (${Branch_Name})  and export_type<3`
    );
    const comapny = await sequelize.query(`select comp_name from comp_mst `);
    await SendWhatsAppMessgae(
      req.headers.compcode,
      mobile_no[0][0]?.mobile_no,
      "gatepass_approver_msg",
      [
        {
          type: "text",
          text: emp1[0][0]?.EMPNAME,
        },
        {
          type: "text",
          text: emp1[0][0]?.Mobile_no,
        },
        {
          type: "text",
          text: CustomerName,
        },
        {
          type: "text",
          text: ModelName,
        },
        {
          type: "text",
          text: veh_regno,
        },
        {
          type: "text",
          text: branch[0][0]?.Godw_Name,
        },
        {
          type: "text",
          text: `https://erp.autovyn.com/autovyn/payroll/DemoGatePass/approvergrid`,
        },
        {
          type: "text",
          text: comapny[0][0]?.comp_name,
        },
      ]
    );
    console.log(result);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0][0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.Demogatepassdashboard = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  console.log(req.body, "dddd");
  const loc_code = req.body.loc_code;
  try {
    let query = "";
    query += `SELECT 
    (SELECT MODL_NAME FROM Modl_Mst WHERE ITEM_CODE = MODEL_NAME) AS label,
    available,
    Image,
    MODEL_NAME AS value,
    veh_regno,
    km_driven,
    FUEL_TYPE,
    -- Determine the location based on the most recent entry in Demo_Car_Gatepass or reg_branch from DemoCarMaster
    ISNULL(
      (
        SELECT TOP 1 
          CASE 
            WHEN ACT_OUT_TIME IS NOT NULL AND  Interbranch_Loc IS NOT NULL THEN Interbranch_Loc 
            ELSE LOC_CODE
          END 
        FROM Demo_Car_Gatepass 
        WHERE Demo_Car_Gatepass.VEH_REG = DemoCarMaster.VEH_REGNO 
        ORDER BY utd DESC
      ), 
      reg_branch 
    ) AS REG_BRANCH
  FROM DemoCarMaster
  -- Filter only those entries where the calculated REG_BRANCH equals the passed location
  WHERE ISNULL(
      (
        SELECT TOP 1 
          CASE 
            WHEN ACT_OUT_TIME IS NOT NULL AND  Interbranch_Loc IS NOT NULL THEN Interbranch_Loc 
            ELSE LOC_CODE
          END 
        FROM Demo_Car_Gatepass 
        WHERE Demo_Car_Gatepass.VEH_REG = DemoCarMaster.VEH_REGNO 
        ORDER BY utd DESC
      ), 
      reg_branch 
    ) In (${loc_code})  `;

    if (req.body.veh_regno) {
      query += `and veh_regno='${req.body.veh_regno}'`;
    }

    const result = await sequelize.query(query);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.modelnamefetch = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    const result = await sequelize.query(
      `SELECT (SELECT MODL_NAME FROM Modl_Mst WHERE  ITEM_CODE=MODEL_NAME) AS label ,MODEL_NAME as value,veh_regno,km_driven FROM DemoCarMaster`
    );

    const driver = await sequelize.query(
      `SELECT [EMPCODE] AS [value], concat(EMPCODE ,' ' , EMPFIRSTNAME , ' ' , EMPLASTNAME ) AS [label] FROM [dbo].[EMPLOYEEMASTER] AS [Employeemaster] where  export_type < 3 and LASTWOR_DATE IS NULL`
    );

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
      Driver: driver[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.demogetpassview = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    console.log(req.body, "gh");
    const empcode = req.body.empcode;
    const result = await sequelize.query(
      `select * from (
        select
        iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}'
               IN (approver1_A, approver1_B) and module_code = 'democar' and Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default) is not null ,APPR_1_STAT,iif((SELECT top 1 empcode 
                FROM Approval_Matrix WHERE '${empcode}'
                              IN (approver2_A, approver2_B) and module_code = 'democar' and Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default) is not null , APPR_2_STAT,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}'
                              IN (approver3_A, approver3_B) and module_code = 'democar' and Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default) is not null,APPR_3_STAT,null))) as status_khud_ka, 

                                  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                              where empcode =
                                  (select iif(Appr_1_Code is not null,Appr_1_Code,
                                  (select iif(Approver1_A = '${empcode}', Approver1_A, iif(Approver1_B = '${empcode}',Approver1_B,Approver1_A))
                                  from Approval_Matrix where module_code = 'democar' and   Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default)))
                                  and   Export_Type < 3) as apr1_name,
                                                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                              where empcode =
                                  (select iif(Appr_2_Code is not null,Appr_2_Code,
                                  (select iif(Approver2_A = '${empcode}', Approver2_A, iif(Approver2_B = '${empcode}',Approver2_B,Approver2_A))
                                  from Approval_Matrix where  module_code = 'democar' and   Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default)))
                                  and   Export_Type < 3) as apr2_name,
                                  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                              where empcode =
                                  (select iif(Appr_3_Code is not null,Appr_3_Code,
                                  (select iif(Approver3_A = '${empcode}',Approver3_A,iif(Approver3_B = '${empcode}',Approver3_B,Approver3_A))
                                  from Approval_Matrix where module_code = 'democar' and   Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default)))
                                  and   Export_Type < 3) as apr3_name,

                                  iif(fin_appr is null,iif((SELECT 
                top 1 empcode FROM Approval_Matrix  WHERE '${empcode}'     
                                IN (approver1_A, approver1_B) and 
                module_code = 'democar' and Demo_Car_Gatepass.EMPCODE 
                collate database_default = empcode collate database_default) is not null,APPR_1_STAT,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}'
                                IN (approver2_A, approver2_B) and 
                module_code = 'democar' and Demo_Car_Gatepass.EMPCODE 
                collate database_default = empcode collate database_default) is not null,iif(APPR_1_STAT is null ,1,APPR_2_STAT),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}'
                                IN (approver3_A, approver3_B) and 
                module_code = 'democar' and Demo_Car_Gatepass.EMPCODE 
                collate database_default = empcode collate database_default) is not null,iif(APPR_2_STAT is null ,1,APPR_3_STAT),1))),1) as status_appr,
                            iif(fin_appr is null  ,iif(APPR_1_STAT is null ,1,iif(APPR_2_STAT is null , 2,iif(APPR_3_STAT is null,3,3))),4) as stat,
                            empcode,customer_name,customer_mobile,(SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE) as driver_code,last_km,model_code,
                            (SELECT top 1 concat(empfirstname,' ',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE)as driver_name,APPR_1_STAT,APPR_2_STAT, APPR_3_STAT,   
                            (SELECT top 1 concat(empfirstname,' ',emplastname) from EMPLOYEEMASTER where empcode=Demo_Car_Gatepass.empcode)as emp_name,
                    (SELECT top 1 MODL_NAME FROM Modl_Mst WHERE  ITEM_CODE= MODEL_CODE)as Model_Name, Remark, (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Demo_Car_Gatepass.InterBranch_Loc) as InterBranch_Loc, 
                (select top 1 Image from DemoCarMaster where DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG) as Image,
                (select top 1 FUEL_TYPE from DemoCarMaster where DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG) as FUEL_TYPE,LOC_CODE,
                (select top 1 Available from DemoCarMaster where DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG) as Available,APPR_1_CODE,APPR_2_CODE,APPR_3_CODE,Fin_appr,
                Appr_1_rem,Appr_2_rem,Appr_3_rem,act_out_time,ACT_IN_TIME, IN_TIME,OUT_TIME,CASE WHEN Gp_Type = '0' THEN 'DEMO' 
                WHEN GP_TYPE = '1' THEN 'PERSONAL'
              WHEN GP_TYPE = '2' THEN 'INTERBRANCH'
              WHEN GP_TYPE = '3' THEN 'EVENT'
           END AS Gp_Type,veh_reg ,CAST(REQ_DATE AS DATE) AS REQ_DATE,utd from Demo_Car_Gatepass 
                where cast (REQ_DATE  as date) = cast(getdate() as date)
                  and EMPCODE
                  in ('${empcode}')) as dasd ORDER BY UTD DESC
        `
    );
    console.log(result);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
exports.demogetpassapr1 = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  try {
    console.log(req.body, "req.body");
    const empcode = req.body.Appr_Code;
    const DateFrom = req.body.DateFrom;
    const DateTo = req.body.DateTo;
    const result = await sequelize.query(`select * from (
      select
      iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}'
             IN (approver1_A, approver1_B) and module_code = 'democar' and Demo_Car_Gatepass.EMPCODE 
              collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 
              1 empcode FROM Approval_Matrix WHERE '${empcode}'      
                          IN (approver2_A, approver2_B) and module_code = 'democar' and Demo_Car_Gatepass.EMPCODE 
              collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}'     
                          IN (approver3_A, approver3_B) and module_code = 'democar' and Demo_Car_Gatepass.EMPCODE 
              collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,

                              (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                          where empcode =
                              (select iif(Appr_1_Code is not null,Appr_1_Code,
                              (select iif(Approver1_A = '${empcode}', Approver1_A, iif(Approver1_B = '${empcode}',Approver1_B,Approver1_A))
                              from Approval_Matrix where module_code = 'democar' and   Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default)))
                              and   Export_Type < 3) as apr1_name,
                                            (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                          where empcode =
                              (select iif(Appr_2_Code is not null,Appr_2_Code,
                              (select iif(Approver2_A = '${empcode}', Approver2_A, iif(Approver2_B = '${empcode}',Approver2_B,Approver2_A))
                              from Approval_Matrix where  module_code = 'democar' and   Demo_Car_Gatepass.EMPCODE 
              collate database_default = empcode collate database_default)))
                              and   Export_Type < 3) as apr2_name,
                              (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
                          where empcode =
                              (select iif(Appr_3_Code is not null,Appr_3_Code,
                              (select iif(Approver3_A = '${empcode}',Approver3_A,iif(Approver3_B = '${empcode}',Approver3_B,Approver3_A))
                              from Approval_Matrix where module_code = 'democar' and   Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default)))
                              and   Export_Type < 3) as apr3_name,

                              iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${empcode}'   
                            IN (approver1_A, approver1_B) and module_code = 'democar' and Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}' 
                            IN (approver2_A, approver2_B) and module_code = 'democar' and Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}'
                            IN (approver3_A, approver3_B) and module_code = 'democar' and Demo_Car_Gatepass.EMPCODE collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
                              iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4) as stat,
                              (SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=Demo_Car_Gatepass.EMPCODE) as emp_name, empcode,  (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE) as From_Loc, LOC_CODE, customer_name, customer_mobile,(SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE) as driver_code, (SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE)as driver_name,    
              (SELECT top 1 MODL_NAME FROM Modl_Mst WHERE  ITEM_CODE= MODEL_CODE)as Model_Name,last_km, model_code, ISNULL((SELECT TOP 1 Godw_Name 
                FROM GODOWN_MST 
                WHERE Godw_Code = Demo_Car_Gatepass.InterBranch_Loc), 
               (SELECT TOP 1 Godw_Name 
                FROM GODOWN_MST 
                WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE)) AS InterBranch_Loc,
              OUT_TIME, act_out_time,ACT_IN_TIME,
                   veh_reg, utd, APPR_1_CODE, APPR_2_CODE, APPR_3_CODE,APPR_1_STAT,
                  fin_appr, Appr_1_rem,Appr_2_rem,Appr_3_rem,APPR_2_STAT,APPR_3_STAT,REQ_DATE, Remark,
              (select top 1 Image from DemoCarMaster where DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG) as Image,
              (select top 1 FUEL_TYPE from DemoCarMaster where DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG) 
              as FUEL_TYPE,
              CASE WHEN Gp_Type = '0' THEN 'DEMO' 
              WHEN GP_TYPE = '1' THEN 'PERSONAL'
            WHEN GP_TYPE = '2' THEN 'INTERBRANCH'
            WHEN GP_TYPE = '3' THEN 'EVENT'
         END AS Gp_Type,
              (select top 1 Available from DemoCarMaster where DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG) 
              as Available from Demo_Car_Gatepass where cast (REQ_DATE  as date) BETWEEN '${DateFrom}' AND '${DateTo}'
                and EMPCODE
                in  (select empcode from approval_matrix where '${empcode}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))) as dasd
                where (status_khud_ka is not null and status_appr is not null)
                or (status_khud_ka is null and status_appr is null ) order by status_appr `);

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};
// exports.demogetpassapprove = async function (req, res) {
//   const sequelize = await dbname(req.headers.compcode);
//   let response = {
//     Status: false,
//     Message: "",
//   };
//   console.log(req.query, "hjhgfd");
//   try {
//     const utd = req.query.utd;
//     const RPA_Managercode = req.query.RPA_Managercode;
//     const buttonclicked = req.query.buttonclicked;
//     const remark = req.query.Remark;

//     let result = [];

//     // Loop through each utd and collect results
//     console.log(utd.length, "lengthhhh");
//     for (let i = 0; i < utd.length; i++) {
//       const queryResult = await sequelize.query(
//         `SELECT appr_1_code,EMPCODE, appr_2_code, Appr_1_stat, Appr_2_stat , CUSTOMER_NAME,CUSTOMER_MOBILE ,ModelName,veh_regno FROM Demo_Car_Gatepass WHERE utd IN (${utd[i]})`
//       );
//       result.push(queryResult[0][0]);
//     }
//     console.log(result, "akaaka");

//     if (buttonclicked === "1") {
//       // Approve the request
//       for (let i = 0; i < result.length; i++) {
//         const resItem = result[i];
//         if (resItem.appr_1_code == RPA_Managercode) {
//           await sequelize.query(
//             `UPDATE Demo_Car_Gatepass SET Appr_1_stat = 1, Appr_1_Rem ='${remark}',Appr_2_stat = 0 WHERE utd= ${utd[i]} AND ISNULL(Appr_1_stat, '') = 0 AND appr_1_code = '${RPA_Managercode}'`
//           );
//           response.Status = true;
//           response.Message = "1st Approval done";

//           // const mobile_no = await sequelize.query(
//           //   `select mobile_no, Reporting_1 from employeemaster where empcode=(select top 1 Appr1_code from Demo_car_gatepass where veh_reg = '${veh_regno}')`
//           // );
//           // const emp1 = await sequelize.query(
//           //   `select Mobile_no,concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EMPNAME from employeemaster where empcode='${resultEMPCODE}' `
//           // );
//           // const branch = await sequelize.query(
//           //   `select Godw_Name from GODOWN_MST where Godw_Code in (${Branch_Name})  and export_type<3`
//           // );
//           // const comapny = await sequelize.query(`select comp_name from comp_mst `);
//           // await SendWhatsAppMessgae(req.headers.compcode,mobile_no[0][0]?.mobile_no, "aaprove_msg", [
//           //   {
//           //     type: "text",
//           //     text: emp1[0][0]?.EMPNAME,
//           //   },
//           //   {
//           //     type: "text",
//           //     text: result[0][0]?.CUSTOMER_NAME,
//           //   },

//           //   {
//           //     type: "text",
//           //     text: result[0][0]?.CUSTOMER_MOBILE,
//           //   },
//           //   {
//           //     type: "text",
//           //     text: result[0][0]?.ModelName,
//           //   },
//           //   {
//           //     type: "text",
//           //     text: result[0][0]?.veh_regno,
//           //   },
//           //   {
//           //     type: "text",
//           //     text: branch[0][0]?.Godw_Name,
//           //   },
//           //   {
//           //     type: "text",
//           //     text: `https://erp.autovyn.com/autovyn/payroll/DemoGatePass/Approver`,
//           //   },
//           //   {
//           //     type: "text",
//           //     text: comapny[0][0]?.comp_name,
//           //   },
//           // ]);
//         } else if (
//           resItem.appr_2_code == RPA_Managercode &&
//           resItem.Appr_1_stat == 1 &&
//           resItem.Appr_2_stat == 0
//         ) {
//           await sequelize.query(
//             `UPDATE Demo_Car_Gatepass SET Appr_2_stat = 1,Appr_2_Rem ='${remark}', FINAL_STATUS = 1 WHERE utd= ${utd[i]} AND Appr_2_stat = 0 AND appr_2_code='${RPA_Managercode}' AND Appr_1_stat=1`
//           );
//           response.Status = true;
//           response.Message = "Final Approval done";
//         } else {
//           if (
//             resItem.appr_2_code == RPA_Managercode &&
//             resItem.Appr_1_stat == 0
//           ) {
//             response.Status = false;
//             response.Message = "Approval 1 is pending";
//           } else if (
//             (resItem.appr_1_code == RPA_Managercode ||
//               resItem.appr_2_code == RPA_Managercode) &&
//             (resItem.Appr_1_stat == 1 || resItem.Appr_2_stat == 1)
//           ) {
//             response.Message = "Already approved";
//           } else if (resItem.Appr_1_stat == 2 && resItem.Appr_2_stat == 0) {
//             response.Message = "This Entry rejected at Level 1";
//           } else if (resItem.Appr_1_stat == 1 && resItem.Appr_2_stat == 2) {
//             response.Message = "This Entry rejected at Level 2";
//           }
//         }
//       }
//     } else if (buttonclicked == "2") {
//       // Reject the request
//       for (let i = 0; i < result.length; i++) {
//         const resItem = result[i];
//         if (
//           resItem.appr1_code == RPA_Managercode &&
//           resItem.APPR1_STATUS == 0
//         ) {
//           await sequelize.query(
//             `UPDATE Demo_Car_Gatepass SET APPR1_STATUS = 2, Appr1_Remark ='${remark}',FINAL_STATUS = 2 WHERE utd= ${utd[i]} AND appr1_status = 0 AND appr1_code= '${RPA_Managercode}'`
//           );
//           response.Status = true;
//           response.Message = "1st Approval rejected";
//         } else if (
//           resItem.appr2_code == RPA_Managercode &&
//           resItem.APPR1_STATUS == 1 &&
//           resItem.APPR2_STATUS == 0
//         ) {
//           await sequelize.query(
//             `UPDATE Demo_Car_Gatepass SET APPR2_STATUS = 2, Appr2_Remark ='${remark}',FINAL_STATUS = 2 WHERE utd= ${utd[i]} AND appr2_status= 0 AND appr2_code= '${RPA_Managercode}' AND appr1_status=1`
//           );
//           response.Status = true;
//           response.Message = "Final Approval rejected";
//         } else {
//           response.Status = false;
//           if (
//             resItem.appr2_code == RPA_Managercode &&
//             resItem.APPR1_STATUS == 0
//           ) {
//             response.Message = "Approval 1 rejection is pending";
//           } else if (
//             (resItem.appr1_code == RPA_Managercode ||
//               resItem.appr2_code == RPA_Managercode) &&
//             (resItem.APPR1_STATUS == 2 || resItem.APPR2_STATUS == 2)
//           ) {
//             response.Message = "Already rejected";
//           } else if (resItem.APPR1_STATUS == 1 && resItem.APPR2_STATUS == 0) {
//             response.Message = "This Entry approved at Level 1";
//           } else if (resItem.APPR1_STATUS == 1 && resItem.APPR2_STATUS == 2) {
//             response.Message = "This Entry rejected at Level 2";
//           }
//         }
//       }
//     } else {
//       response.Status = false;
//       response.Message = "Unknown Status";
//     }

//     res.status(200).send({
//       Status: true,
//       Message: response.Message,
//       Query: "",
//       Result: result,
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).send({
//       Status: false,
//       Message: "Error occurred while fetching data",
//       Query: "",
//       Result: null,
//     });
//   } finally {
//     if (sequelize) {
//       await sequelize.close();
//     }
//   }
// };
async function processMainData(
  compcodePassed,
  mainData,
  sequelize,
  Appr_Code,
  Remark
) {
  const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      console.log(mainData, "kkkkk");
      const empcode = c?.empcode;
      const tran_id = c?.utd;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'democar'`,
        { replacements: { empcode }, transaction: t }
      );
      const comp_name = await sequelize.query(
        `select top 1 comp_name from comp_mst`
      );
      if (a[0]?.length > 0) {
        const approvers = a[0][0];
        let ApprovalLevel = 0;
        let Final_apprvl = null;
        if (
          [
            approvers.approver1_A?.toLowerCase(),
            approvers.approver1_B?.toLowerCase(),
          ].includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 1;
        } else if (
          [
            approvers.approver2_A?.toLowerCase(),
            approvers.approver2_B?.toLowerCase(),
          ].includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 2;
        } else if (
          [
            approvers.approver3_A?.toLowerCase(),
            approvers.approver3_B?.toLowerCase(),
          ].includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel === 0) {
          return res.status(201).send({
            Status: "false",
            Message: "You are not the right person to approve this",
            Query: "",
          });
        }

        if (
          (ApprovalLevel === 1 &&
            !approvers.approver2_A &&
            !approvers.approver2_B &&
            !approvers.approver2_C) ||
          (ApprovalLevel === 2 &&
            !approvers.approver3_A &&
            !approvers.approver3_B &&
            !approvers.approver3_C)
        ) {
          Final_apprvl = 1;
        }

        const data = {
          Appr_Code,
          Remark,
          Final_apprvl,
        };

        console.log(ApprovalLevel, "ApprovalLevel");
        console.log(data, "data");
        let query = "";
        let query2 = null;
        if (ApprovalLevel === 1) {
          query = `
              UPDATE Demo_Car_Gatepass
              SET Appr_1_Code = :Appr_Code,
                  Appr_1_Stat = 1,
                  Appr_1_Rem = :Remark,
                  Fin_Appr = :Final_apprvl
              WHERE utd = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
            `;

          if (!Final_apprvl) {
            const result = await sequelize.query(
              `select mobile_no,CONCAT(EMPFIRSTNAME,' ', EMPLASTNAME)AS EMPNAME from employeemaster where empcode='${item?.rowData.empcode}'`
            );

            const comapny = await sequelize.query(
              `select comp_name from comp_mst `
            );
            await SendWhatsAppMessgae(
              compcodePassed,
              result[0][0]?.mobile_no,
              "aaprove_msg",
              [
                {
                  type: "text",
                  text: result[0][0]?.EMPNAME,
                },
                {
                  type: "text",
                  text: item?.rowData?.customer_name,
                },
                {
                  type: "text",
                  text: item?.rowData?.customer_mobile,
                },
                {
                  type: "text",
                  text: item?.rowData?.Model_Name,
                },
                {
                  type: "text",
                  text: item?.rowData?.veh_reg,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr1_name,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr1_name,
                },

                {
                  type: "text",
                  text: comapny[0][0]?.comp_name,
                },
              ]
            );

            const approver2 = await sequelize.query(
              `select top 1 mobile_no from employeemaster where empcode=(select top 1 approver2_A from approval_matrix  where module_code = 'democar' and   empcode='${item?.rowData.empcode}' and module_code='democar')`
            );
            const mobile_emp = await sequelize.query(
              `select mobile_no,concat(EMPFIRSTNAME , ' ' , EMPLASTNAME) AS EMPNAME  from employeemaster where empcode='${item?.rowData.empcode}'`
            );
            const branch = await sequelize.query(
              `select Godw_Name from GODOWN_MST where Godw_Code in (${item?.rowData.LOC_CODE})  and export_type<3`
            );

            console.log(item, "itemmmm");
            await SendWhatsAppMessgae(
              compcodePassed,
              approver2[0][0]?.mobile_no,
              "gatepass_approver_msg",
              [
                {
                  type: "text",
                  text: mobile_emp[0][0]?.EMPNAME,
                },
                {
                  type: "text",
                  text: mobile_emp[0][0]?.mobile_no,
                },
                {
                  type: "text",
                  text: item?.rowData.customer_name,
                },
                {
                  type: "text",
                  text: item?.rowData.Model_Name,
                },
                {
                  type: "text",
                  text: item?.rowData.veh_reg,
                },
                {
                  type: "text",
                  text: branch[0][0]?.Godw_Name,
                },
                {
                  type: "text",
                  text: `https://erp.autovyn.com/autovyn/payroll/DemoGatePass/approvergrid`,
                },
                {
                  type: "text",
                  text: comapny[0][0]?.comp_name,
                },
              ]
            );
          }
        } else if (ApprovalLevel === 2) {
          query = `
              UPDATE Demo_Car_Gatepass
              SET Appr_2_Code = :Appr_Code,
                  Appr_2_Stat = 1,
                  Appr_2_Rem = :Remark,
                  Fin_Appr = :Final_apprvl
              WHERE utd = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
            `;
          // const mobile_emp = await sequelize.query(
          //   `select mobile_no,(SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode='${item?.rowData.driver_code}')as driver_name,CONCAT(EMPFIRSTNAME,' ', EMPLASTNAME)AS EMPNAME from employeemaster where empcode='${item?.rowData.empcode}'`
          // );
          // const comapny = await sequelize.query(
          //   `select comp_name from comp_mst `
          // );

          // await SendWhatsAppMessgae(compcodePassed, mobile_emp[0][0].mobile_no, "guard_msg", [
          //   {
          //     type: "text",
          //     text: `Sir`,
          //   },
          //   {
          //     type: "text",
          //     text: mobile_emp[0][0].EMPNAME,
          //   },
          //   {
          //     type: "text",
          //     text: mobile_emp[0][0].mobile_no,
          //   },
          //   {
          //     type: "text",
          //     text: item?.rowData?.Model_Name,
          //   },
          //   {
          //     type: "text",
          //     text: item?.rowData?.veh_reg,
          //   },
          //   {
          //     type: "text",
          //     text: `https://erp.autovyn.com/autovyn/payroll/DemoGatePass/GuardView`,
          //   },
          //   {
          //     type: "text",
          //     text: comp_name[0][0]?.comp_name,
          //   },
          // ]);
        } else if (ApprovalLevel === 3) {
          query = `
              UPDATE Demo_Car_Gatepass
              SET Appr_3_Code = :Appr_Code,
                  Appr_3_Stat = 1,
                  Appr_3_Rem = :Remark,
                  Fin_Appr = 1
              WHERE utd = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
            `;
        }

        if (Final_apprvl === 1) {
          const mobile_emp = await sequelize.query(
            `select mobile_no,(SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode='${item?.rowData.driver_code}')as driver_name,CONCAT(EMPFIRSTNAME,' ', EMPLASTNAME)AS EMPNAME from employeemaster where empcode='${item?.rowData.empcode}'`
          );
          const comapny = await sequelize.query(
            `select comp_name from comp_mst `
          );

          await SendWhatsAppMessgae(
            compcodePassed,
            mobile_emp[0][0].mobile_no,
            "guard_msg",
            [
              {
                type: "text",
                text: `Sir`,
              },
              {
                type: "text",
                text: mobile_emp[0][0].EMPNAME,
              },
              {
                type: "text",
                text: mobile_emp[0][0].mobile_no,
              },
              {
                type: "text",
                text: item?.rowData?.Model_Name,
              },
              {
                type: "text",
                text: item?.rowData?.veh_reg,
              },
              {
                type: "text",
                text: `https://erp.autovyn.com/autovyn/payroll/DemoGatePass/GuardView`,
              },
              {
                type: "text",
                text: comp_name[0][0]?.comp_name,
              },
            ]
          );
        }

        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Demo_Car_Gatepass WHERE utd = :tran_id;`,
          { replacements: { tran_id }, transaction: t }
        );

        if (affectedRows.length > 0) {
          if (query2) {
            await sequelize.query(query2, {
              replacements: { ...data, tran_id },
              transaction: t,
            });
          }
          await sequelize.query(query, {
            replacements: { ...data, tran_id },
            transaction: t,
          });
        }

        console.log({
          success: true,
          Message:
            affectedRows.length === 0
              ? "Cannot Approve"
              : `Approved on level ${ApprovalLevel}`,
        });
      }
    }

    await t.commit();
  } catch (e) {
    console.error(e);
    await t.rollback();
    throw e;
  }
}
exports.approveby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    console.log(req.body, "req.body");
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;
    if (!Appr_Code) {
      return res.status(400).send({
        status: false,
        Message: "Appr_Code is mandatory",
      });
    }

    console.log(mainData?.length, "mainData?.length");
    if (!mainData?.length) {
      return res.status(400).send({
        status: false,
        Message: "Please select the entry to approve",
      });
    }

    await processMainData(
      req.headers.compcode,
      mainData,
      sequelize,
      Appr_Code,
      Remark
    );

    return res
      .status(200)
      .send({ success: true, Message: "Approved Successfully" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};
exports.rejectby2 = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.tran_id;
    const Appr_Code = req.body.Appr_Code;
    const Remark = req.body.Remark ? `'${req.body.Remark}'` : null;

    if (!Appr_Code) {
      return res.status(400).send({
        status: false,
        Message: "Appr_Code is mandatory",
      });
    }

    if (!mainData?.length) {
      return res.status(400).send({
        status: false,
        Message: "Please select the entry to reject",
      });
    }

    await processMainData1(
      req.headers.compcode,
      mainData,
      sequelize,
      Appr_Code,
      Remark
    );

    return res
      .status(200)
      .send({ success: true, Message: "Request Rejected Successfully" });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};
async function processMainData1(
  compcodePassed,
  mainData,
  sequelize,
  Appr_Code,
  Remark
) {
  const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.empcode;
      const tran_id = c?.utd;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'democar'`,
        { replacements: { empcode }, transaction: t }
      );

      if (a[0]?.length > 0) {
        const approvers = a[0][0];
        let ApprovalLevel = 0;

        if (
          [
            approvers.approver1_A?.toLowerCase(),
            approvers.approver1_B?.toLowerCase(),
          ]
            .map((approver) => approver?.toLowerCase())
            .includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 1;
        } else if (
          [approvers.approver2_A, approvers.approver2_B]
            .map((approver) => approver?.toLowerCase())
            .includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 2;
        } else if (
          [approvers.approver3_A, approvers.approver3_B]
            .map((approver) => approver?.toLowerCase())
            .includes(Appr_Code?.toLowerCase())
        ) {
          ApprovalLevel = 3;
        }

        if (ApprovalLevel === 0) {
          return res.status(201).send({
            Status: "false",
            Message: "You are not the right person to approve this",
            Query: "",
          });
        }

        const data = {
          Appr_Code,
          Remark,
        };

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
              UPDATE Demo_Car_Gatepass
              SET Appr_1_Code = :Appr_Code,
                  Appr_1_Stat = 0,
                  Appr_1_Rem = :Remark,
                  Fin_Appr = 0
              WHERE utd = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
            `;

          const mobile_emp = await sequelize.query(
            `select mobile_no,CONCAT(EMPFIRSTNAME,' ', EMPLASTNAME)AS EMPNAME from employeemaster where empcode='${item?.rowData.empcode}'`
          );
          const comp_name = await sequelize.query(
            `select top 1 comp_name from comp_mst`
          );
          await sequelize.query(
            `UPDATE DemoCarMaster SET available = null WHERE VEH_REGNO= '${item?.rowData.veh_reg}'`
          );
          if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
            await SendWhatsAppMessgae(
              compcodePassed,
              mobile_emp[0][0].mobile_no,
              "reject_msg",
              [
                {
                  type: "text",
                  text: mobile_emp[0][0]?.EMPNAME,
                },
                {
                  type: "text",
                  text: item?.rowData?.customer_name,
                },
                {
                  type: "text",
                  text: item?.rowData?.customer_mobile,
                },
                {
                  type: "text",
                  text: item?.rowData?.Model_Name,
                },
                {
                  type: "text",
                  text: item?.rowData?.veh_reg,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr1_name,
                },
                {
                  type: "text",
                  text: Remark,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr1_name,
                },
                {
                  type: "text",
                  text: comp_name[0][0].comp_name,
                },
              ]
            );
          }
        } else if (ApprovalLevel === 2) {
          query = `
              UPDATE Demo_car_Gatepass
              SET Appr_2_Code = :Appr_Code,
                  Appr_2_Stat = 0,
                  Appr_2_Rem = :Remark,
                  Fin_Appr = 0
              WHERE utd = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
            `;

          const mobile_emp = await sequelize.query(
            `select mobile_no,CONCAT(EMPFIRSTNAME,' ', EMPLASTNAME)AS EMPNAME from employeemaster where empcode='${item?.rowData.empcode}'`
          );
          const comp_name = await sequelize.query(
            `select top 1 comp_name from comp_mst`
          );
          await sequelize.query(
            `UPDATE DemoCarMaster SET available = null WHERE VEH_REGNO= '${item?.rowData.veh_reg}'`
          );
          if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
            await SendWhatsAppMessgae(
              compcodePassed,
              mobile_emp[0][0].mobile_no,
              "reject_msg",
              [
                {
                  type: "text",
                  text: mobile_emp[0][0]?.EMPNAME,
                },
                {
                  type: "text",
                  text: item?.rowData?.customer_name,
                },
                {
                  type: "text",
                  text: item?.rowData?.customer_mobile,
                },
                {
                  type: "text",
                  text: item?.rowData?.Model_Name,
                },
                {
                  type: "text",
                  text: item?.rowData?.veh_reg,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr2_name,
                },
                {
                  type: "text",
                  text: Remark,
                },
                {
                  type: "text",
                  text: item?.rowData?.apr2_name,
                },
                {
                  type: "text",
                  text: comp_name[0][0].comp_name,
                },
              ]
            );
          }
        } else if (ApprovalLevel === 3) {
          query = `
              UPDATE Demo_Car_Gatepass
              SET Appr_3_Code = :Appr_Code,
                  Appr_3_Stat = 0,
                  Appr_3_Rem = :Remark,
                  Fin_Appr = 0
              WHERE utd = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
            `;
        }
        await sequelize.query(
          `UPDATE DemoCarMaster SET available = null WHERE VEH_REGNO= '${item?.rowData.veh_reg}'`
        );
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Demo_Car_Gatepass WHERE utd = :tran_id;`,
          { replacements: { tran_id }, transaction: t }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, tran_id },
            transaction: t,
          });
        }

        console.log({
          success: true,
          Message:
            affectedRows.length === 0
              ? "Cannot Reject"
              : `Rejected on level ${ApprovalLevel}`,
        });
      }
    }

    await t.commit();
  } catch (e) {
    console.error(e);
    await t.rollback();
    throw e;
  }
}
exports.demogetpassinout = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  console.log(req.body, "jhgfd");
  try {
    const utd = req.body.utd;
    const empcode = req.body.empcode;
    const TYPE = req.body.TYPE;
    const result = await sequelize.query(
      `SELECT Fin_Appr FROM Demo_Car_Gatepass WHERE utd= ${utd} `
    );

    if (result[0][0].Fin_Appr == 1) {
      if (TYPE == "OUT") {
        const VEH_REG = req.body.VEH_REG;
        const LAST_KM = req.body.LAST_KM;

        await sequelize.query(
          `UPDATE Demo_Car_Gatepass SET ACT_OUT_TIME = GETDATE(), GUARD_CODE = '${empcode}', LAST_KM = '${LAST_KM}' WHERE utd= '${utd}'`
        );

        await sequelize.query(
          `UPDATE DemoCarMaster SET KM_DRIVEN = '${LAST_KM}', available = 0 WHERE VEH_REGNO= '${VEH_REG}'`
        );
      } else if (TYPE == "IN") {
        const VEH_REG = req.body.VEH_REG;
        const KM = req.body.KM;

        const LAST_KM = req.body.LAST_KM;
        await sequelize.query(
          `UPDATE Demo_Car_Gatepass SET ACT_IN_TIME = GETDATE(), GUARD_CODE_IN = '${empcode}', KM = '${KM}', ISFLAG = '1' WHERE utd= '${utd}'`
        );

        await sequelize.query(
          `UPDATE DemoCarMaster SET KM_DRIVEN = '${KM}', available = null WHERE VEH_REGNO= '${VEH_REG}'`
        );
      }
    }

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.demogetpassguardview = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  console.log(req.body, "hhh");
  try {
    // console.log(req.query);
    const start_date = req.body.start_date;
    const end_date = req.body.end_date;
    const emp_code = req.body.emp_code;
    const Status = req.body.Status;
    let result;
    if (Status == 1) {
      result =
        await sequelize.query(`SELECT UTD, Out_Image, In_Image, REQ_DATE, (SELECT top 1 concat(empfirstname,' ',emplastname) from EMPLOYEEMASTER where empcode=Demo_Car_Gatepass.EMPCODE) as EMP_NAME,
      CUSTOMER_NAME, CUSTOMER_MOBILE, DRIVER_CODE, REMARK,
      (SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE)as driver_name, MODEL_CODE,
      (SELECT top 1 MODL_NAME FROM Modl_Mst WHERE  ITEM_CODE= MODEL_CODE)as Model_Name, LAST_KM, KM, VEH_REG, EMPCODE, ACT_OUT_TIME, ISNULL((SELECT TOP 1 Godw_Name 
        FROM GODOWN_MST 
        WHERE Godw_Code = Demo_Car_Gatepass.InterBranch_Loc), 
       (SELECT TOP 1 Godw_Name 
        FROM GODOWN_MST 
        WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE)) AS InterBranch_Loc,
      (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE) as From_Loc, CASE WHEN Gp_Type = '0' THEN 'DEMO' 
      WHEN GP_TYPE = '1' THEN 'PERSONAL'
    WHEN GP_TYPE = '2' THEN 'INTERBRANCH'
    WHEN GP_TYPE = '3' THEN 'EVENT'
 END AS GP_TYPE,
      ACT_IN_TIME, OUT_TIME, IN_TIME ,Appr_1_Code,Appr_2_Code,Appr_3_Code,Fin_Appr
            FROM Demo_Car_Gatepass
            WHERE Fin_Appr = '1' AND
            CAST(REQ_DATE AS DATE) BETWEEN '${start_date}' AND '${end_date}'  and LOC_CODE COLLATE DATABASE_DEFAULT in      (select top 1 location COLLATE DATABASE_DEFAULT from employeemaster where empcode COLLATE DATABASE_DEFAULT= '${emp_code}' COLLATE DATABASE_DEFAULT and export_type < 3)
      and ACT_OUT_TIME is null and Fin_Appr = '1'
            ORDER BY UTD DESC`);
    }
    if (Status == 2) {
      result =
        await sequelize.query(`SELECT UTD,Out_Image, In_Image, REQ_DATE, (SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=Demo_Car_Gatepass.EMPCODE) as EMP_NAME,
      CUSTOMER_NAME, CUSTOMER_MOBILE, DRIVER_CODE,
      (SELECT TOP 1 CONCAT(empfirstname, ' ', emplastname) 
       FROM EMPLOYEEMASTER 
       WHERE empcode = DRIVER_CODE) AS driver_name, 
      MODEL_CODE,
      (SELECT TOP 1 MODL_NAME 
       FROM Modl_Mst 
       WHERE ITEM_CODE = MODEL_CODE) AS Model_Name, 
      LAST_KM, KM, VEH_REG, EMPCODE, ACT_OUT_TIME, 
      CASE WHEN Gp_Type = '0' THEN 'DEMO' 
      WHEN GP_TYPE = '1' THEN 'PERSONAL'
    WHEN GP_TYPE = '2' THEN 'INTERBRANCH'
    WHEN GP_TYPE = '3' THEN 'EVENT'
 END AS GP_TYPE,
      ISNULL((SELECT TOP 1 Godw_Name 
        FROM GODOWN_MST 
        WHERE Godw_Code = Demo_Car_Gatepass.InterBranch_Loc), 
       (SELECT TOP 1 Godw_Name 
        FROM GODOWN_MST 
        WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE)) AS InterBranch_Loc,  (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE) as From_Loc,
      ACT_IN_TIME, OUT_TIME, IN_TIME, Appr_1_Code, Appr_2_Code, Appr_3_Code, Fin_Appr, LOC_CODE
  FROM Demo_Car_Gatepass
  WHERE Fin_Appr = '1'
      AND CAST(REQ_DATE AS DATE) BETWEEN '${start_date}' AND '${end_date}'
      AND ACT_OUT_TIME IS NOT NULL
      AND ACT_IN_TIME IS NULL
      AND (
          -- If InterBranch_Loc is not null and differs from LOC_CODE, prioritize InterBranch_Loc
          (InterBranch_Loc IS NOT NULL AND InterBranch_Loc <> LOC_CODE 
              AND InterBranch_Loc = (select top 1 location COLLATE DATABASE_DEFAULT from employeemaster where empcode COLLATE DATABASE_DEFAULT= '${emp_code}' COLLATE DATABASE_DEFAULT and export_type < 3)
          )
          -- Otherwise, check if LOC_CODE matches the logged-in branch
          OR (InterBranch_Loc IS NULL OR InterBranch_Loc = LOC_CODE)
              AND LOC_CODE = (select top 1 location COLLATE DATABASE_DEFAULT from employeemaster where empcode COLLATE DATABASE_DEFAULT= '${emp_code}' COLLATE DATABASE_DEFAULT and export_type < 3)
      )
  ORDER BY UTD DESC
  `);
    }
    if (Status == 3) {
      result =
        await sequelize.query(`SELECT UTD, Out_Image, In_Image, REQ_DATE, (SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=Demo_Car_Gatepass.EMPCODE) as EMP_NAME,
      CUSTOMER_NAME, CUSTOMER_MOBILE, DRIVER_CODE,
      (SELECT TOP 1 CONCAT(empfirstname, ' ', emplastname) 
       FROM EMPLOYEEMASTER 
       WHERE empcode = DRIVER_CODE) AS driver_name, 
      MODEL_CODE,
      (SELECT TOP 1 MODL_NAME 
       FROM Modl_Mst 
       WHERE ITEM_CODE = MODEL_CODE) AS Model_Name, 
      LAST_KM, KM, VEH_REG, EMPCODE, ACT_OUT_TIME,
      CASE WHEN Gp_Type = '0' THEN 'DEMO' 
      WHEN GP_TYPE = '1' THEN 'PERSONAL'
    WHEN GP_TYPE = '2' THEN 'INTERBRANCH'
    WHEN GP_TYPE = '3' THEN 'EVENT'
 END AS GP_TYPE, 
      ISNULL((SELECT TOP 1 Godw_Name 
        FROM GODOWN_MST 
        WHERE Godw_Code = Demo_Car_Gatepass.InterBranch_Loc), 
       (SELECT TOP 1 Godw_Name 
        FROM GODOWN_MST 
        WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE)) AS InterBranch_Loc,  (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE) as From_Loc,
      ACT_IN_TIME, OUT_TIME, IN_TIME, Appr_1_Code, Appr_2_Code, Appr_3_Code, Fin_Appr, LOC_CODE
  FROM Demo_Car_Gatepass
  WHERE Fin_Appr = '1'
      AND CAST(REQ_DATE AS DATE) BETWEEN '${start_date}' AND '${end_date}'
      AND ACT_OUT_TIME IS NOT NULL
      AND ACT_IN_TIME IS NOT NULL
      AND (
          -- If InterBranch_Loc is not null and differs from LOC_CODE, prioritize InterBranch_Loc
          (InterBranch_Loc IS NOT NULL AND InterBranch_Loc <> LOC_CODE 
              AND InterBranch_Loc = (select top 1 location COLLATE DATABASE_DEFAULT from employeemaster where empcode COLLATE DATABASE_DEFAULT= '${emp_code}' COLLATE DATABASE_DEFAULT and export_type < 3)
          )
          -- Otherwise, check if LOC_CODE matches the logged-in branch
          OR (InterBranch_Loc IS NULL OR InterBranch_Loc = LOC_CODE)
              AND LOC_CODE = (select top 1 location COLLATE DATABASE_DEFAULT from employeemaster where empcode COLLATE DATABASE_DEFAULT= '${emp_code}' COLLATE DATABASE_DEFAULT and export_type < 3)
      )
  ORDER BY UTD DESC
  `);
    }

    console.log(result, "result");
    response.Status = true;
    response.Message = "";
    // console.log(result);
    res.status(200).send({
      Status: true,
      Message: response.Message,
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.uploadeddocumentOutImage = async function (req, res) {
  console.log(req.files, "files");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const SRNo = req.body.UTD;
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
          req.body.name
        );
        console.log(EMP_DOCS_data, "EMP_DOCS_data");
        const result1 = await sequelize.query(
          `select 
          Act_Out_Time, Act_In_Time
              from Demo_Car_Gatepass where UTD='${SRNo}'`
        );
        if (result1[0][0].Act_Out_Time == null) {
          console.log("resutte");
          await sequelize.query(
            `Update Demo_Car_Gatepass set Out_Image='${EMP_DOCS_data[0].path}' where UTD='${SRNo}'`
          );
        }
        if (
          result1[0][0].Act_In_Time == null &&
          result1[0][0].Act_Out_Time != null
        ) {
          await sequelize.query(
            `Update Demo_Car_Gatepass set In_Image='${EMP_DOCS_data[0].path}' where UTD='${SRNo}'`
          );
        }

        const result = await sequelize.query(
          `select 
            Out_Image, In_Image
              from Demo_Car_Gatepass where UTD='${SRNo}'`
        );
        const outImageUrl = `https://erp.autovyn.com/backend/fetch?filePath=${result[0][0].Out_Image}`;
        const inImageUrl = `https://erp.autovyn.com/backend/fetch?filePath=${result[0][0].In_Image}`;
        res.status(200).send({ Out_Image: outImageUrl, In_Image: inImageUrl });
      } else {
        res.status(200).send("No File Uploaded");
      }
    } catch (e) {
      console.log(e);
    }
  } catch (e) {
    console.log(e);
  }
};

exports.getEmpDetails = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  let response = {
    Status: false,
    Message: "",
  };
  console.log(req.body, "dddd");
  const VEH_REG = req.body.VEH_REG;
  try {
    let query = "";
    query += `select TOP 1 UTD, CUSTOMER_NAME, CONVERT(VARCHAR(5), ACT_OUT_TIME, 108) AS ACT_OUT_TIME,
    (SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where EMPLOYEEMASTER.empcode=Demo_Car_Gatepass.EMPCODE)as EmpName, IIF(GP_TYPE = '0' , 'DEMO', 'PERSONAL') AS GP_TYPE, 
    (SELECT top 1 concat(empfirstname,'',emplastname) from EMPLOYEEMASTER where empcode=DRIVER_CODE)as DRIVER_NAME, 
    (SELECT top 1 MOBILE_NO from EMPLOYEEMASTER where empcode=Demo_Car_Gatepass.DRIVER_CODE)  AS DRIVER_NUMBER,
    REMARK from Demo_Car_Gatepass WHERE VEH_REG = '${VEH_REG}' ORDER BY UTD DESC`;

    const result = await sequelize.query(query);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0][0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.GatepassReport = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const datefrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;

    const result = await sequelize.query(`SELECT 
      UTD, 
      (SELECT TOP 1 CONCAT(empfirstname, '', emplastname) FROM EMPLOYEEMASTER WHERE empcode = Demo_Car_Gatepass.EMPCODE) AS EmployeeName,
      CASE WHEN Gp_Type = '0' THEN 'DEMO' 
      WHEN GP_TYPE = '1' THEN 'PERSONAL'
    WHEN GP_TYPE = '2' THEN 'INTERBRANCH'
 END AS GP_TYPE,
      (SELECT TOP 1 CONCAT(empfirstname, '', emplastname) FROM EMPLOYEEMASTER WHERE empcode = Demo_Car_Gatepass.DRIVER_CODE) AS DRIVER_NAME,
      (SELECT TOP 1 MOBILE_NO FROM EMPLOYEEMASTER WHERE empcode = Demo_Car_Gatepass.DRIVER_CODE) AS DRIVER_NUMBER,
      CUSTOMER_NAME, CUSTOMER_MOBILE, VEH_REG, 
      (SELECT MODL_NAME FROM Modl_Mst WHERE ITEM_CODE = Demo_Car_Gatepass.MODEL_CODE) AS Model_Name, 
      CAST(REQ_DATE AS DATE) AS Req_Date,
      KM - Last_KM AS KM_DRIVEN, 
      (SELECT TOP 1 Image FROM DemoCarMaster WHERE DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG) AS Image, 
      ISNULL((SELECT TOP 1 Godw_Name 
        FROM GODOWN_MST 
        WHERE Godw_Code = Demo_Car_Gatepass.InterBranch_Loc), 
       (SELECT TOP 1 Godw_Name 
        FROM GODOWN_MST 
        WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE)) AS InterBranch_Loc,
      (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE) as From_Loc,
      ACT_OUT_TIME, ACT_IN_TIME, REMARK, ISFLAG, 
      (SELECT TOP 1 available FROM DemoCarMaster WHERE DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG) AS Available, loc_code
  
  FROM Demo_Car_Gatepass
  WHERE 
      CAST(REQ_DATE AS DATE) BETWEEN '${datefrom}' and '${dateto}' 
      AND ISNULL((SELECT TOP 1 available FROM DemoCarMaster WHERE DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG ), 0) = 0
      AND Fin_Appr = '1'
      AND (
        (InterBranch_Loc IS NOT NULL AND ACT_OUT_TIME IS NOT NULL AND ACT_IN_TIME IS NULL AND LOC_CODE in 
(${loc_code})) OR
        (InterBranch_Loc IS NOT NULL AND ACT_OUT_TIME IS NOT NULL AND ACT_IN_TIME IS NOT NULL AND ISFLAG = '1' AND (InterBranch_Loc in (${loc_code}) or LOC_CODE IN (${loc_code}))) OR
        (InterBranch_Loc IS NULL AND LOC_CODE in (${loc_code}))
    )
  ORDER BY UTD DESC`);

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.GatepassRdieWiseReport = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);

  try {
    const datefrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;

    const result = await sequelize.query(`SELECT 
    UTD,
    (SELECT TOP 1 CONCAT(empfirstname, '', emplastname) FROM EMPLOYEEMASTER WHERE empcode = Demo_Car_Gatepass.EMPCODE) AS EmployeeName,
    CASE WHEN Gp_Type = '0' THEN 'DEMO' 
      WHEN GP_TYPE = '1' THEN 'PERSONAL'
    WHEN GP_TYPE = '2' THEN 'INTERBRANCH'
 END AS GP_TYPE,
    (SELECT TOP 1 CONCAT(empfirstname, '', emplastname) FROM EMPLOYEEMASTER WHERE empcode = Demo_Car_Gatepass.DRIVER_CODE) AS DRIVER_NAME,        
    (SELECT TOP 1 MOBILE_NO FROM EMPLOYEEMASTER WHERE empcode = Demo_Car_Gatepass.DRIVER_CODE) AS DRIVER_NUMBER,
    CUSTOMER_NAME, VEH_REG,
    CAST(REQ_DATE AS DATE) AS Req_Date,
    KM - Last_KM AS KM_DRIVEN,
    ISNULL((SELECT TOP 1 Godw_Name
      FROM GODOWN_MST
      WHERE Godw_Code = Demo_Car_Gatepass.InterBranch_Loc),
     (SELECT TOP 1 Godw_Name
      FROM GODOWN_MST
      WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE)) AS InterBranch_Loc,     
  (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Demo_Car_Gatepass.LOC_CODE) as From_Loc,
    ACT_OUT_TIME, ACT_IN_TIME, LAST_KM, KM, loc_code

FROM Demo_Car_Gatepass
  WHERE 
      CAST(REQ_DATE AS DATE) BETWEEN '${datefrom}' and '${dateto}' 
      AND ISNULL((SELECT TOP 1 available FROM DemoCarMaster WHERE DemoCarMaster.VEH_REGNO = Demo_Car_Gatepass.VEH_REG ), 0) = 0
      AND Fin_Appr = '1'
      AND (
        (InterBranch_Loc IS NOT NULL AND ACT_OUT_TIME IS NOT NULL AND ACT_IN_TIME IS NULL AND LOC_CODE in 
(${loc_code})) OR
        (InterBranch_Loc IS NOT NULL AND ACT_OUT_TIME IS NOT NULL AND ACT_IN_TIME IS NOT NULL AND ISFLAG = '1' AND (InterBranch_Loc in (${loc_code}) or LOC_CODE IN (${loc_code}))) OR
        (InterBranch_Loc IS NULL AND LOC_CODE in (${loc_code}))
    )
  ORDER BY UTD DESC`);

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.RejectEntry = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "dddd");
  const utd = req.body.utd;
  const Location = req.body.Location;
  try {
    let query = "";
    query += `update Demo_car_Gatepass set Fin_Appr = 0 where UTD ='${utd}' and loc_code = '${Location}'`;

    const regno = await sequelize.query(
      `select UTD from DemoCarMaster where VEH_REGNO = (select veh_reg from Demo_Car_Gatepass where UTD ='${utd}')`
    );

    console.log(regno, "regno");
    const updateResult = await sequelize.query(
      `update democarmaster set available = null WHERE utd = '${regno[0]?.[0]?.UTD}'`
    );

    const result = await sequelize.query(query);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
    });
  } catch (e) {
    console.error(e);
    res.status(500).send({
      Status: false,
      Message: "Error occurred while fetching data",
      Query: "",
      Result: null,
    });
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.uploadedCarImageDirect = async function (req, res) {
  console.log(req.files, "Uploaded files");
  console.log(req.body, "Request body");

  try {
    const sequelize = await dbname(req.headers.compcode);
    const { veh_regno, name } = req.body;

    if (!veh_regno || !name) {
      return res.status(400).send("Missing required fields (veh_regno, name)");
    }

    if (req.files) {
      try {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
          name
        );

        console.log(EMP_DOCS_data, "Uploaded File Details");
        await sequelize.query(
          `update DemoCarMaster set Image = '${EMP_DOCS_data[0]?.path}' where veh_regno = '${veh_regno}'`
        );

        return res.status(200).send({
          success: true,
          filePath:
            EMP_DOCS_data[0]?.path || "File uploaded, but no path returned",
        });
      } catch (err) {
        console.error("Error uploading file:", err);
        return res.status(500).send("Error uploading file");
      }
    } else {
      return res.status(400).send("No File Uploaded");
    }
  } catch (err) {
    console.error("Error in backend:", err);
    res.status(500).send("Server Error");
  }
};
