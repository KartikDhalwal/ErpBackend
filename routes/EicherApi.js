const { dbname } = require("../utils/dbconfig");
const { Sequelize, DataTypes, literal } = require("sequelize");
const { _VecvPurc } = require("../models/VecvPurc");
const { _VecvSale } = require("../models/VecvSale");
const { _VecvWart } = require("../models/VecvWart");
const axios = require('axios');
require('dotenv').config();

const fs = require('fs');
// 9160

let G_variable = '5040';

async function invnoarray(objects) {
    try {
        const invoiceNumbersArray = objects.map(bill => bill.InvoiceNo);
        return invoiceNumbersArray;
    } catch (e) { console.log(e) }
}
async function PurchOrdNoarray(objects) {
    try {
        const invoiceNumbersArray = objects.map(bill => bill.PurchOrdNo);
        return invoiceNumbersArray;
    } catch (e) { console.log(e) }
}
async function ZsalesOrderNoarray(objects) {
    try {
        const invoiceNumbersArray = objects.map(bill => bill.ZsalesOrderNo);
        return invoiceNumbersArray;
    } catch (e) { console.log(e) }
}
function removeObjectsFromArray(array1, array2) {
    const invoiceNumbersToRemove = array2.map(obj => obj.InvoiceNo);
    const newArray1 = array1.filter(obj => !invoiceNumbersToRemove.includes(obj.InvoiceNo));
    return newArray1;
}
function removeObjectspurch(array1, array2) {
    const invoiceNumbersToRemove = array2.map(obj => obj.PurchOrdNo);
    console.log(invoiceNumbersToRemove)
    const newArray1 = array1.filter(obj => !invoiceNumbersToRemove.includes(obj.PurchOrdNo));
    return newArray1;
}
function removeObjectsWart(array1, array2) {
    const invoiceNumbersToRemove = array2.map(obj => obj.ZsalesOrderNo);
    console.log(invoiceNumbersToRemove)
    const newArray1 = array1.filter(obj => !invoiceNumbersToRemove.includes(obj.ZsalesOrderNo));
    return newArray1;
}
async function getdatasale(data) {
    try {
        const invoiceNumbersArray = await invnoarray(data)
        if (!invoiceNumbersArray.length) {
            return 'no data';
        }
        const sequelize = await dbname("DEMO1");
        const invno = await sequelize.query(`select distinct(InvoiceNo) from vecv_sale where InvoiceNo in (${invoiceNumbersArray})`)
        const newdata = removeObjectsFromArray(data, invno[0]);
        await sequelize.close();
        return await saleData(newdata);
    } catch (e) { console.log(e) }

}
const path = require('path')
async function getdatapurchase(data) {
    try {
        const invoiceNumbersArray = await PurchOrdNoarray(data)
        console.log(invoiceNumbersArray)
        // const filePath = path.join(__dirname, 'newFile.json'); // Using __dirname to get the current directory
        // fs.writeFile(filePath, JSON.stringify(data), (err) => {
        //   if (err) {
        //     console.error('Error writing file:', err);
        //     return;
        //   }
        //   console.log('Invoice numbers array has been saved to newFile.json');
        // });
        if (!invoiceNumbersArray.length) {
            return 'no data';
        }
        const sequelize = await dbname("DEMO1");
        const invno = await sequelize.query(`select distinct(PurchOrdNo) from vecv_purc where PurchOrdNo in (${invoiceNumbersArray})`)
        const newdata = removeObjectspurch(data, invno[0]);
        await sequelize.close();
        return await purchaseData(newdata);
    } catch (e) { console.log(e) }

}
async function getdatawarranty(data) {
    try {
        const invoiceNumbersArray = await ZsalesOrderNoarray(data)
        if (!invoiceNumbersArray.length) {
            return 'no data';
        }
        const sequelize = await dbname("DEMO1");
        const invno = await sequelize.query(`select distinct(ZsalesOrderNo) from vecv_wart where ZsalesOrderNo in (${invoiceNumbersArray})`)
        const newdata = removeObjectsWart(data, invno[0]);
        await sequelize.close();
        return await warrantyData(newdata);
    } catch (e) { console.log(e) }

}
// function trimData(dataArray) {
//     return dataArray.map(item => {
//         const trimmedItem = {};
//         for (const key in item) {
//             trimmedItem[key] = item[key].toString().trim();
//         }
//         return trimmedItem;
//     });
// }
async function trimData(dataArray) {
    // Create an array of promises to trim each object
    const trimPromises = dataArray.map(item => {
        return new Promise(resolve => {
            const trimmedItem = {};
            Object.keys(item).forEach(key => {
                trimmedItem[key] = item[key] !== null && item[key] !== undefined ? item[key].toString().trim() : '';
            });
            resolve(trimmedItem);
        });
    });
    return Promise.all(trimPromises);
}
async function warrantyData(newdata) {
    try {
        const sequelize = await dbname("DEMO1");
        const VecvWart = _VecvWart(sequelize, DataTypes);
        const trimmedData = await trimData(newdata);
        await VecvWart.bulkCreate(trimmedData);
    } catch (e) { console.log(e) }
    finally {
        return `${newdata.length} records inserted`;
    }
}
async function purchaseData(newdata) {
    try {
        const sequelize = await dbname("DEMO1");
        const VecvPurc = _VecvPurc(sequelize, DataTypes);
        const trimmedData =  await trimData(newdata);
        await VecvPurc.bulkCreate(trimmedData);
    } catch (e) { console.log(e) }
    finally {
        return `${newdata.length} records inserted`;
    }
}
async function saleData(newdata) {
    try {
        const sequelize = await dbname("DEMO1");
        const VecvSale = _VecvSale(sequelize, DataTypes);
        const trimmedData = await trimData(newdata);
        await VecvSale.bulkCreate(trimmedData);
    } catch (e) { console.log(e) }
    finally {
        return `${newdata.length} records inserted`;
    }

}
async function myTasksale(item, start, end) {
    let date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let datastart = date;
    if (start && end) {
        date = end;
        datastart = start;
    }
    console.log('sale task at', new Date());
    // const item = '04';
    const url = `https://udaanmobility.vecv.net/sap/opu/odata/sap/ZAPI_SALES_DATA_SRV_01/ItOutputSet?$filter=PostingDate ge '${datastart}' and PostingDate le '${date}' and CompanyCode eq '${G_variable}' and SalesType eq '${item}' and Vbeln eq ' '`;
    let xmlData;
    try {
        const response = await axios.get(url, {
            auth: {
                username: `${process.env.EICHERAPI_USERNAME}`,
                password: `${process.env.EICHERAPI_PASSWORD}`
            }
        });

        xmlData = await response.data.d.results;
        const data = await getdatasale(xmlData);
        return data;
    } catch (error) {
        console.error('Error making the request:', error.message);
        return error.message;
    }
}

async function myTaskPurchase(item, start, end) {
    let date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let datastart = date;
    if (start && end) {
        date = end;
        datastart = start;
    }
    console.log('Purchase task at', new Date());

    const url = `https://udaanmobility.vecv.net/sap/opu/odata/sap/ZODATA_PURCHASE_SRV/ItOutputSet?$filter=GrDate ge '${datastart}' and GrDate le '${date}' and PurchType eq '${item}' and CompanyCode eq '${G_variable}'`;

    let xmlData;

    try {
        const response = await axios.get(url, {
            auth: {
                username: `${process.env.EICHERAPI_USERNAME}`,
                password: `${process.env.EICHERAPI_PASSWORD}`
            }
        });

        xmlData = await response.data.d.results;
        const data = await getdatapurchase(xmlData);
        return data;
    } catch (error) {
        return error.message;
    }
}
async function myTaskwarranty(start, end) {
    let date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let datastart = date;
    if (start && end) {
        date = end;
        datastart = start;
    }
    console.log('warranty task at', new Date());
    const url = `https://udaanmobility.vecv.net/sap/opu/odata/sap/ZAPI_WARRANTY_DETAILS_SRV/ET_DATASet?$filter=Zdate ge '${datastart}' and Zdate le '${date}' and ZclaimNo eq '' and Zbukrs eq 'C001'`;
    let xmlData;
    try {
        const response = await axios.get(url, {
            auth: {
                username: `${process.env.EICHERAPI_USERNAME}`,
                password: `${process.env.EICHERAPI_PASSWORD}`
            }
        });
        xmlData = await response.data.d.results;
        const data = await getdatawarranty(xmlData);

        return data;
    } catch (error) {
        return error.message;
    }
}

// Schedule the task to run every 1 hour (adjust the interval as needed)
// const intervalInMilliseconds = 60 * 2000; // 1 minute
// const scheduler = setInterval(alltask, intervalInMilliseconds);

let sequence = 1, loopcomplete = 0;

async function alltask() {
    console.log(G_variable);

    if (sequence) {
        loopcomplete = 0;
        console.log(await myTasksale('01'));
        console.log(await myTasksale('03'));
        console.log(await myTasksale('04'));
        console.log(await myTaskPurchase('1'));
        console.log(await myTaskPurchase('2'));
        // console.log(await myTaskwarranty());
        const sequelize = await dbname("DEMO1");
        const data = await sequelize.query(`exec EicherApiToDmsRowData`);
        console.log(data[0],'asdaskjhsahksdhkjas')
        loopcomplete = 1;
        // if (G_variable == '9160')
        //   G_variable = '5040';
        // else
        //   G_variable = '9160';
    }
    setTimeout(alltask, 30 * 5000);

}
// alltask();


exports.datarefresh = async function (req, res) {
    const data = req.body;
    let message = 'Enter date';

    if (!req.body.startDate || req.body.startDate == '') {
        return res.send({ message: message });
    }
    if (!req.body.endDate || req.body.endDate == '') {
        return res.send({ message: message });
    }
    console.log('Received data:', data);
    const loopIteration = async () => {
        console.log(`Loop iteration , Flag:`);
        await new Promise(resolve => setTimeout(resolve, 3000));
    };
    while (loopcomplete !== 1) {
        await loopIteration();
    }
    console.log('loop nikl gya ')
    const start = data.startDate.split("-").join("");
    const end = data.endDate.split("-").join("");
    try {
        switch (data.buttonId) {
            case 'VEHICLE_PURCHASE':
                message = await myTaskPurchase('1', start, end)
                sequence = 1;
                break;
            case 'SPARE_PARTS_PURCHASE':
                message = await myTaskPurchase('2', start, end);
                sequence = 1;
                break;
            case 'Vehicle_Sales':
                message = await myTasksale('01', start, end);
                sequence = 1;
                break;
            case 'Counter_Sales':
                message = await myTasksale('04', start, end)
                sequence = 1;
                break;
            case 'Workshop_Sales':
                message = await myTasksale('03', start, end);
                sequence = 1;
                break;
            case 'warranty':
                message = await myTaskwarranty(start, end);
                sequence = 1;
                break;
            default:
                sequence = 1;
                console.log("Unknown button clicked");
        }
        console.log("message:", message);
        res.send({ message: message });

    } catch (error) {
        // Log the error for debugging purposes
        console.error('Error:', error);

        // Return an error response
        res.status(500).json({ success: false, message: 'An error occurred while processing the request.' });
    }
}