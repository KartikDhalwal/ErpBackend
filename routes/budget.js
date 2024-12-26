const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const Joi = require("joi");
const { _Budget, BudgetSchema } = require("../models/Budget");

exports.master = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const Locations = await sequelize.query(`SELECT Godw_Code as value, Godw_Name as label from Godown_Mst where Export_type < 3`);
        res.status(200)
            .send({ success: true, data: Locations[0] });
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
}

exports.type = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const CATEGORY = req.body.CATEGORY;
        let TYPE = ``;
        if (CATEGORY == 1) {
            TYPE = `SELECT Misc_Name AS label, Misc_Code as value from Misc_Mst WHERE Misc_Type = 68 AND Export_Type < 3`;
        }
        else if (CATEGORY == 2) {
            TYPE = `SELECT DISTINCT(EMPLOYEEDESIGNATION) AS value, EMPLOYEEDESIGNATION AS label FROM EMPLOYEEMASTER WHERE EMPLOYEEDESIGNATION is NOT NULL AND EMPLOYEEDESIGNATIOn <> ''`;
        }
        const a = await sequelize.query(TYPE);
        res.status(200)
            .send({ success: true, data: a[0] });
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
}

exports.finOpenings = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const a = await sequelize.query(`SELECT 
        (SELECT TOP 1 Misc_Name FROm Misc_Mst WHERE Misc_Type = 68 AND Misc_Code = E.DIVISION) AS DEPARTMENT,
        ((SELECT SUM(UNIT) AS Total_Units
        FROM BUDGET
        WHERE TYPE = E.DIVISION AND LOC_CODE = Loc_Code) ) -  ((SELECT COUNT(*) AS Department_Count
        FROM EMPLOYEEMASTER
        WHERE DIVISION = E.DIVISION AND LOC_CODE = Loc_Code)) AS Openings
            FROM
        (SELECT DISTINCT DIVISION FROM EMPLOYEEMASTER) AS E;`);
        const filteredData = a[0].filter(entry => entry.Openings !== null && entry.DIVISION !== null && entry.Openings > 0);
        const filteredData2 = a[0].filter(entry => entry.Openings !== null && entry.DIVISION !== null && entry.Openings < 0);
        const b = await sequelize.query(`
		SELECT 
        EMPLOYEEDESIGNATION,
        ((SELECT SUM(UNIT) AS Total_Units
        FROM BUDGET
        WHERE TYPE = E.EMPLOYEEDESIGNATION AND LOC_CODE = Loc_Code) ) -  ((SELECT COUNT(*) AS Department_Count
        FROM EMPLOYEEMASTER
        WHERE EMPLOYEEDESIGNATION = E.EMPLOYEEDESIGNATION AND LOC_CODE = Loc_Code)) AS Openings
            FROM
        (SELECT DISTINCT EMPLOYEEDESIGNATION FROM EMPLOYEEMASTER WHERE EMPLOYEEDESIGNATION is NOT NULL AND EMPLOYEEDESIGNATION <> '') AS E;`);
        const filteredData1 = b[0].filter(entry => entry.Openings !== null && entry.EMPLOYEEDESIGNATION !== null && entry.Openings > 0);
        const filteredData3 = b[0].filter(entry => entry.Openings !== null && entry.EMPLOYEEDESIGNATION !== null && entry.Openings < 0);
        const c = await sequelize.query(`select EMPCODE, (isnull(Title,'' ) + ' ' + EmpFirstName + ' ' + EmpLastName) AS name, CONVERT(VARCHAR, CURRENTJOINDATE, 103) AS Date from EMPLOYEEMASTER where Export_Type = 1 AND MONTH(CURRENTJOINDATE) = MONTH(GETDATE()) AND YEAR(CURRENTJOINDATE) = YEAR(GETDATE())`);
        const d = await sequelize.query(`select EMPCODE, (isnull(Title,'' ) + ' ' + EmpFirstName + ' ' + EmpLastName) AS name, CONVERT(VARCHAR, LASTWOR_DATE, 103) AS Date from EMPLOYEEMASTER where Export_Type = 1 AND MONTH(LASTWOR_DATE) = MONTH(GETDATE()) AND YEAR(LASTWOR_DATE) = YEAR(GETDATE())`);
        const e = await sequelize.query(`select EMPCODE, (isnull(Title,'' ) + ' ' + EmpFirstName + ' ' + EmpLastName) AS name  from EMPLOYEEMASTER where Export_Type = 1 AND MONTH(LASTWOR_DATE) < 4 OR LASTWOR_DATE is NULL`);
        const newJoin = c[0].length;
        const leaveEmp = d[0].length;
        const ttlEmp = e[0].length;
        const grossemp = ttlEmp - leaveEmp - newJoin;
        const f = await sequelize.query(`SELECT (SELECT Misc_Name from Misc_Mst WHERE Misc_Type = 68 AND Misc_Code = Salary.Division AND Export_Type < 3) AS SalaryDivision, Salary.Total_Gross_Salary - Budget.Total_Gross_Salary AS Salary_Budget_Difference
        FROM 
            (SELECT EMPLOYEEMASTER.Division, SUM(SALARYSTRUCTURE.Gross_Salary) AS Total_Gross_Salary
            FROM EMPLOYEEMASTER
            JOIN SALARYSTRUCTURE ON EMPLOYEEMASTER.EMPCODE = SALARYSTRUCTURE.Emp_Code
            GROUP BY EMPLOYEEMASTER.Division) AS Salary
        JOIN 
            (SELECT TYPE AS Division, SUM(VALUE) AS Total_Gross_Salary FROM BUDGET
            WHERE CATEGORY = 'department'
            GROUP BY TYPE) AS Budget
        ON 
            Salary.Division = Budget.Division;`);
            const filteredData5 = f[0].filter(entry => entry.Salary_Budget_Difference !== null && entry.SalaryDivision !== null && entry.Salary_Budget_Difference > 0);
            const filteredData6 = f[0].filter(entry => entry.Salary_Budget_Difference !== null && entry.SalaryDivision !== null && entry.Salary_Budget_Difference < 0);

        const g = await sequelize.query(`SELECT Salary.EMPLOYEEDESIGNATION, Salary.Total_Gross_Salary - Budget.Total_Gross_Salary AS Salary_Budget_Difference
        FROM 
            (SELECT EMPLOYEEMASTER.EMPLOYEEDESIGNATION, SUM(SALARYSTRUCTURE.Gross_Salary) AS Total_Gross_Salary
            FROM EMPLOYEEMASTER
            JOIN SALARYSTRUCTURE ON EMPLOYEEMASTER.EMPCODE = SALARYSTRUCTURE.Emp_Code
            GROUP BY EMPLOYEEMASTER.EMPLOYEEDESIGNATION) AS Salary
        JOIN 
            (SELECT TYPE AS EMPLOYEEDESIGNATION, SUM(VALUE) AS Total_Gross_Salary FROM BUDGET
            WHERE CATEGORY = 'designation'
            GROUP BY TYPE) AS Budget
        ON 
            Salary.EMPLOYEEDESIGNATION = Budget.EMPLOYEEDESIGNATION;`);
            const filteredData7 = g[0].filter(entry => entry.Salary_Budget_Difference !== null && entry.EMPLOYEEDESIGNATION !== null && entry.Salary_Budget_Difference > 0);
            const filteredData8 = g[0].filter(entry => entry.Salary_Budget_Difference !== null && entry.EMPLOYEEDESIGNATION !== null && entry.Salary_Budget_Difference < 0);
        res.status(200).send({ success: true, data: filteredData, 
            data1: filteredData1, data2: filteredData2, 
            data3: newJoin, data4: leaveEmp, data5: ttlEmp, 
            data6: filteredData3, data7:filteredData5,
            data8: filteredData6, data9: filteredData7, data10: filteredData8,
            data11: grossemp, data12: c[0], data13: d[0]});
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
}

exports.BudgetView = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const a = await sequelize.query(`SELECT Utd,TYPE,CATEGORY,
        CASE
        WHEN CATEGORY = 'department' THEN (SELECT Misc_Name from Misc_Mst WHERE Misc_Type = 68 AND Misc_Code = TYPE AND Export_Type < 3)
        WHEN CATEGORY = 'designation' THEN TYPE
        END AS TYPE_label,
        (SELECT TOP 1 Godw_Name from GODOWN_MST WHERE Godw_Code = LOC_CODE) AS LOC_CODE_label, 
        LOC_CODE,UNIT,VALUE from BUDGET`);
        res.status(200).send({ success: true, data: a[0] });
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
}

exports.insertData = async function (req, res) {
    const sequelize = await dbname(req.headers.compcode);
    try {
        const BodyData = req.body;
        const { error, value: BudgetData } = BudgetSchema.validate(BodyData, {
            abortEarly: false,
            stripUnknown: true,
        });
        const Created_by = BudgetData.Created_by;
        if (!error) {
            const errorMessage = error.details.map((err) => err.message).join(", ");
            return res.status(400).send({ success: false, message: errorMessage });
        } else {
            const t = await sequelize.transaction();
            console.log(BodyData)
            const budgetmaster = _Budget(sequelize, DataTypes);
            try {
                await budgetmaster.bulkCreate(
                    BodyData.map((items) => ({ ...items })),
                    { transaction: t }
                );
                await t.commit();
                res.status(200).send({ success: true, Message: "Data saved" });
            } catch (error) {
                res.status(200).send({
                    success: false,
                    message: "An error occurred while creating Budget Data.",
                    error,
                });
                await t.rollback();
            }
        }
    }
    catch (e) {
        console.log(e);
    }
    finally {
        await sequelize.close();
    }
}

exports.UpdateData = async function (req, res) {
    const BodyData = req.body;
    console.log(BodyData)
    const { error, value: BudgetData } = BudgetSchema.validate(BodyData, {
        abortEarly: false,
        stripUnknown: true,
    });
    const Created_by = BudgetData.Created_by;
    if (error) {
        const errorMessage = error.details.map(err => err.message).join(', ');
       console.log(errorMessage)
        return res.status(400).send({ success: false, message: errorMessage });
    } else {
        const sequelize = await dbname(req.headers.compcode);
        const t = await sequelize.transaction();
        console.log(BodyData)
        const budgetmaster = _Budget(sequelize, DataTypes);
        try {
            await budgetmaster.update({ ...BodyData, Created_by: BodyData.Created_by }, {
                where: { Utd: BodyData.Utd }
            }, { transaction: t });
            await t.commit();
            res.send(`Data Updated Successfully`)
        } catch (error) {
            console.log(error)
            await t.rollback();
            res.send({ success: false, message: 'An error occurred while Updating Data', error });
        } finally {
            await sequelize.close();
            console.log('Connection has been closed.');
        }
    }
};