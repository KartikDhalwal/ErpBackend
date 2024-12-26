const { Sequelize, DataTypes, literal, Op, where } = require("sequelize");
const { dbname } = require("../utils/dbconfig");
const cron = require('node-cron');
const _GstFilings = require("../models/GstFilings");
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const FormData = require("form-data");
const path = require('path');


exports.validate = async function (req, res) {
    try {

        console.log(req.body.option)
        console.log(req.body.value)
        if (!req.body.option && !req.body.value) {

        }
        let body = 0;
        let data = '';
        var instance = '';
        const apikey = process.env.SANDBOX_API_KEY;
        const secret_key = process.env.SANDBOX_SECRET_KEY;
        console.log(apikey, secret_key);
        const headers1 = new Headers({
            'Accept': 'application/json',
            'x-api-key': apikey,
            'x-api-secret': secret_key,
            'x-api-version': '1.0'
        });
        try {

            const response = await fetch('https://api.sandbox.co.in/authenticate', { method: 'POST', headers: headers1 });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            var access_token = await response.json();
            console.log(access_token)
            instance = access_token.access_token;
        } catch (error) {
            console.error('Error:', error);
            res.status(200).send({ error: 'Internal Server Error' });
            return;
        }

        var result = 'error no data found', api = '';
        const headers = new Headers({
            'Authorization': instance,
            'Accept': 'application/json',
            'x-api-key': apikey,
            'x-api-version': '1.0'
        });
        switch (parseInt(req.body.option)) {
            case 1:
                api = `/pans/${req.body.value}/verify?consent=y&reason=For%20KYC%20of%20Userqweqweqweqwe`
                break;
            case 2:
                api = `/itd/reporting-portal/tds/206-ab/${req.body.value}`;
                break;
            case 3:
                api = `/it-tools/pans/${req.body.value}/pan-aadhaar-status?aadhaar_number=${req.body.value2}`;
                break;
            case 4:
                api = `/gsp/public/gstin/${req.body.value}`;
                break;
            case 5:
                api = `/itd/portal/public/tans/${req.body.value}?consent=y&reason=For%20KYC%20of%20Userqweqweqweqwe`;
                break;
            case 6:
                api = `/mca/directors/${req.body.value}?consent=Y&reason=For%20GST%20registration`;
                break;
            case 7:
                api = `/mca/companies/${req.body.value}?consent=Y&reason=For%20GST%20registration`;
                break;
            case 8:
                api = `/kyc/aadhaar/okyc/otp`;
                data = { aadhaar_number: req.body.value }
                body = 1;
                break;
            case 9:
                api = `/kyc/aadhaar/okyc/otp/verify`;
                data = { otp: req.body.value2, ref_id: req.body.value }
                body = 1;
                break;
            default:

                result = { error: 'Invalid dropdown option' };
        }
        var url = `https://api.sandbox.co.in${api}`;

        try {
            if (body == 0) {
                console.log(url)
                const response = await fetch(url, { method: 'GET', headers: headers });
                result = await response.json();
                res.send(result);
            } else {
                const response = await fetch(url, { method: "POST", headers: headers, body: JSON.stringify(data) })
                result = await response.json();
                res.send(result);
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(200).send(result);
        }


    } catch (e) { console.log(e) }

}
var instance = '';
// Function to format JSON data according to the table structure
function formatData(data, GSTNo) {
    const formattedData = {};
    formattedData['GSTNo'] = GSTNo;
    const reversedData = data.data.EFiledlist.reverse(); // Reverse the array
    formattedData['index'] = data.code;

    // Loop through the filings
    reversedData.forEach((filing, index) => {
        const month = parseInt(filing.dof.substring(3)); // Extract month from ret_prd
        const retDate = `${filing.dof.substring(6)}-${filing.dof.substring(3, 5)}-${filing.dof.substring(0, 2)}`; // Reformat dof
        const valid = filing.valid; // Reformat dof
        if (filing.rtntype === 'GSTR1') {
            formattedData[`GSTR1_${month}`] = retDate;
            formattedData[`valid_GSTR1_${month}`] = valid;
        } else if (filing.rtntype === 'GSTR3B') {
            formattedData[`GSTR3B_${month}`] = retDate;
            formattedData[`valid_GSTR3B_${month}`] = valid;

        }
    });
    // console.log(formattedData)


    return formattedData;
}
async function generate_token() {
    try {
        const apikey = 'key_live_ZyInyKHOlhGisrnOL1KB0OOFACcP7ITy'
        const secret_key = 'secret_live_g0dwrbOTgAdVNmHEXBXGCloebqAMvgxO';
        const headers1 = new Headers({
            'Accept': 'application/json',
            'x-api-key': apikey,
            'x-api-secret': secret_key,
            'x-api-version': '1.0'
        });
        const response = await fetch('https://api.sandbox.co.in/authenticate', { method: 'POST', headers: headers1 });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        var access_token = await response.json();
        instance = access_token.access_token;
        return access_token.access_token;
    } catch (error) {
        console.error('Error:', error);
    }
}
// insertData();
async function insertData() {

    const sequelize = await dbname('patl');
    try {
        const apikey = 'key_live_ZyInyKHOlhGisrnOL1KB0OOFACcP7ITy'
        const secret_key = 'secret_live_g0dwrbOTgAdVNmHEXBXGCloebqAMvgxO';
        const headers1 = new Headers({
            'Accept': 'application/json',
            'x-api-key': apikey,
            'x-api-secret': secret_key,
            'x-api-version': '1.0'
        });
        const response = await fetch('https://api.sandbox.co.in/authenticate', { method: 'POST', headers: headers1 });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        var access_token = await response.json();
        instance = access_token.access_token;
        const query = `select top 5 * from (select distinct(GST_No) as GST_No  from Ledg_Mst where GST_no is not null and GST_no !='') as ab`;
        const [results] = await sequelize.query(query);
        const validGSTNumbersArray = results
            .filter(entry => isValidGSTNumber(entry.GST_No))
            .map(entry => entry.GST_No);

        const gstNumberChunks = chunkArray(validGSTNumbersArray, 25);

        makeAPICallsSequentially(gstNumberChunks)
            .then(() => {
                console.log('All API calls completed successfully.');
            })
            .catch(error => {
                console.error('Error in one or more API calls:', error);
            });


    } catch (error) {
        console.log(error);
    } finally {
        await sequelize.close();
        // console.log('Connection has been closed.');
    }



}
async function saveToDatabase(data) {
    const sequelize1 = await dbname('patl');
    const GstFilings = _GstFilings(sequelize1, DataTypes);
    const t = await sequelize1.transaction();
    try {


        const [instance, created] = await GstFilings.findOrCreate({
            where: { GSTNo: data.GSTNo }, // Condition to find existing entry
            defaults: data, // Data to be inserted if entry doesn't exist
            transaction: t // Transaction object
        });

        if (!created) {
            await instance.destroy({ transaction: t });
            await GstFilings.create(data, { transaction: t });
        }

        await t.commit();
    } catch (error) {
        await t.rollback();
    } finally {
        await sequelize1.close();
        console.log('Connection has been closed.');
    }
}
async function makeAPICallsSequentially(gstNumberChunks) {
    for (const chunk of gstNumberChunks) {
        console.log(chunk)
        await makeAPICallsForChunk(chunk, 'FY 2023-24');
        await wait(1500)
    }
}
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function makeAPICallsForChunk(gstNumbersChunk, financialYear) {
    const apiPromises = [];

    for (const gstNumber of gstNumbersChunk) {
        apiPromises.push(makeAPICall(gstNumber, financialYear));
    }

    return Promise.all(apiPromises);
}
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}
async function makeAPICall(gstNumber) {
    try {
        console.log(gstNumber, 'asdasdadd')
        // Make API call
        const headers = new Headers({
            'Authorization': instance,
            'Accept': 'application/json',
            'x-api-key': 'key_live_ZyInyKHOlhGisrnOL1KB0OOFACcP7ITy',
            'x-api-version': '1.0'
        });
        var url = `https://api.sandbox.co.in/gsp/public/gstr?gstin=${gstNumber}&financial_year=FY%202023-24`;
        const response = await fetch(url, { method: 'GET', headers: headers });
        result = await response.json();
        console.log(result)

        // Process response using formatting function
        const formattedData = formatData(result, gstNumber);
        console.log(formattedData);
        await saveToDatabase(formattedData);

    } catch (error) {
        console.error('Error processing API response for GST number:', gstNumber, error);
    }
}
function isValidGSTNumber(gstNumber) {
    const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstPattern.test(gstNumber);
}
// insertData();
// cron.schedule('0 0 12,22 * *', insertData);

// This schedule will run at midnight on the 12th and 22nd of every month

exports.GST = async function (req, res) {
    try {
        await generate_token();
        await makeAPICall(req.query.GST);
        return res.send('data updated');

    } catch (e) {
        console.log(e);
    }
}



const jwt = require('jsonwebtoken');

async function uploadImage2(files, Comp_Code, Created_by) {
    try {
        let dataArray = [];
        // console.log(files);

        await Promise.all(files?.map(async (file, index) => {
            const customPath = `${Comp_Code}/VERIFICATION/`;
            const ext = path.extname(file.originalname);
            // Generate randomUUID
            const randomUUID = uuidv4();

            // Append extension to randomUUID
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
                console.error(`Error uploading image ${index}:`, error.message);
            }
            // Doc_Type	TRAN_ID	SRNO	path	File_Name	User_Name	Upload_Date	Export_type
        }));

        console.log(dataArray, 'dataArray');
        return dataArray;
    } catch (e) {
        console.log(e);
    }
}
exports.validateSprintVerify = async function (req, res) {
    try {
        var EMP_DOCS_data;
        if (req.files) {
            EMP_DOCS_data = await uploadImage2(
                req.files,
                req.headers.compcode?.split("-")[0],
                1,
            );
            console.log(EMP_DOCS_data, 'EMP_DOCS_data')
        }

        let body = 0;
        let data = '';
        var instance = '';
        const apikey = "TVRJek5EVTJOelUwTnpKRFQxSlFNREF3TURFPQ==";
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const randomNumber = Math.floor(Math.random() * 9999999) + 1;
        const SECRET_KEY = 'UTA5U1VEQXdNREF4TkRBM1QwUkpNMDlVU1hkTmFsRTFUMUU5UFE9PQ==';
        const payload = {
            timestamp: currentTimestamp,  // Timestamp
            partnerId: "CORP00001407",       // Partner ID
            reqid: randomNumber           // Request ID
        };
        instance = jwt.sign(payload, SECRET_KEY, { algorithm: 'HS256' });
        var result = 'error no data found', api = '';
        const headers = {
            'Token': instance,
            'Accept': 'application/json',
        };
        switch (req.body.option) {
            case "AADHAR_WITHOUT_OTP":
                api = `/verification/aadhaar_without_otp`;
                const aadhaarRegex = /^\d{12}$/;
                if (aadhaarRegex.test(req.body.value)) {
                    data = { id_number: req.body.value };
                    body = 1;
                } else {
                    result = { error: 'Invalid Aadhaar number' };
                    return res.status(500).send(result);
                    break;
                }
                break;
            case "PAN_COMPREHENSIVE":
                api = `/verification/pan_comprehensive`;
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (panRegex.test(req.body.value)) {
                    data = { pan_number: req.body.value };
                    body = 1;
                } else {
                    result = { error: 'Invalid PAN number' };
                    return res.status(500).send(result);
                    break;
                }
                break;
            case "CHEQUE_OCR":
                api = `/verification/ocr_doc`;
                const chequeLink = `https://erp.autovyn.com/backend/fetch?filePath=${EMP_DOCS_data[0]?.path}`;
                if (EMP_DOCS_data[0]?.path) {
                    data = { type: "CHEQUE", link: chequeLink };
                    body = 1;
                } else {
                    result = { error: 'Invalid link for cheque image' };
                    return res.status(500).send(result);
                    break;
                }
                break;
            case "PAN_OCR":
                api = `/verification/ocr_doc`;
                const panLink = `https://erp.autovyn.com/backend/fetch?filePath=${EMP_DOCS_data[0]?.path}`;
                if (EMP_DOCS_data[0]?.path) {
                    data = { type: "PAN", link: panLink };
                    body = 1;
                } else {
                    result = { error: 'Invalid link for PAN image' };
                    return res.status(500).send(result);
                    break;
                }
                break;
            default:
                result = { error: 'Invalid dropdown option' };
                return res.status(500).send(result);

        }

        var url = `https://api.verifya2z.com/api/v1${api}`;

        try {
            console.log(url)
            console.log(data);
            try {
                const response = await axios.post(url,
                    data,
                    {
                        headers: headers
                    }
                );
                console.log(response.data)
                switch (req.body.option) {
                    case "AADHAR_WITHOUT_OTP":
                        return res.send({ ...response.data, ...data });
                        break;
                    case "PAN_COMPREHENSIVE":
                        return res.send({ ...response.data, ...data });
                        break;
                    case "CHEQUE_OCR":
                        return res.send({ ...response.data, ...data });
                        break;
                    case "PAN_OCR":
                        return res.send({ ...response.data, ...data });
                        break;
                    default:
                        return res.send({ ...data, status: false });
                }
                // res.send(response.data);
                // res.send({ done: "done" });
            } catch (error) {
                res.send(error);
                console.error("Error fetching branches:", error);
                // return { error: "Unknown Error Found" }; // Return a meaningful error message
            }

            // }
        } catch (error) {
            console.error('Error:', error);
            res.status(200).send(error);
        }


    } catch (e) { console.log(e) }

}
exports.uatValidateSprintVerify = async function (req, res) {
    try {
        const checkorc = {
            "statuscode": 200,
            "status": true,
            "message": "Success.",
            "reference_id": 27367857,
            "data": {
                "client_id": "ocr_cheque_eHChYYhebhERjICzCgfB",
                "account_number": {
                    "value": "019705009882",
                    "confidence": 94
                },
                "ifsc_code": {
                    "value": "ICIC0006759",
                    "confidence": 98
                },
                "micr": {
                    "value": "C000857C 302229057A 009882C 29",
                    "confidence": 75
                }
            }
        }
        const panocr = {
            "statuscode": 200,
            "status": true,
            "message": "Success.",
            "reference_id": 27368078,
            "data": [
                {
                    "document_type": "pan",
                    "pan_number": {
                        "value": "CJWPG7098H",
                        "confidence": 99
                    },
                    "full_name": {
                        "value": "Gourav",
                        "confidence": 94
                    },
                    "father_name": {
                        "value": "Kanwar Singh",
                        "confidence": 98
                    },
                    "dob": {
                        "value": "18/02/1998",
                        "confidence": 99
                    }
                }
            ]
        }
        const pancomprohencive = {
            "statuscode": 200,
            "status": true,
            "message": "success",
            "reference_id": 27368092,
            "data": {
                "client_id": "e43861a5-b36f-4f50-bb47-63922440f122",
                "pan_number": "DBJPG8400H",
                "full_name": "HIMANSHU GARG",
                "full_name_split": [
                    "HIMANSHU",
                    "",
                    "GARG"
                ],
                "masked_aadhaar": "XXXXXXXX0252",
                "address": {
                    "line_1": "",
                    "line_2": "",
                    "street_name": "",
                    "zip": "",
                    "city": "",
                    "state": "",
                    "country": "",
                    "full": ""
                },
                "email": null,
                "phone_number": null,
                "gender": "M",
                "dob": "2000-12-09",
                "input_dob": null,
                "aadhaar_linked": true,
                "dob_verified": false,
                "dob_check": false,
                "category": "Person",
                "less_info": false
            }
        }
        const aadharWithoutOtp = {
            "statuscode": 200,
            "status": true,
            "message": "success",
            "reference_id": 27368108,
            "data": {
                "client_id": "7f80e454-2d96-4504-b9b7-312793f09a6b",
                "age_range": "20-30",
                "aadhaar_number": "339264733789",
                "state": "Rajasthan",
                "gender": "M",
                "last_digits": "304",
                "is_mobile": true,
                "remarks": "success",
                "less_info": false
            }
        }
        const failedverification = {
            "statuscode": 200,
            "status": true,
            "message": "Verification Failed.",
            "reference_id": 27368137,
            "data": {
                "client_id": "ocr_cheque_LXdkHXrKgxAmhewmFxwq",
                "account_number": {
                    "value": "",
                    "confidence": 0
                },
                "ifsc_code": {
                    "value": "",
                    "confidence": 0
                },
                "micr": {
                    "value": "",
                    "confidence": 0
                }
            }
        }
        var EMP_DOCS_data;
        if (req.files) {
            EMP_DOCS_data = await uploadImage2(
                req.files,
                req.headers.compcode?.split("-")[0],
                1,
            );
            console.log(EMP_DOCS_data, 'EMP_DOCS_data')
        }

        let body = 0;
        let data = '';
        var instance = '';
        const apikey = "TVRJek5EVTJOelUwTnpKRFQxSlFNREF3TURFPQ==";
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const randomNumber = Math.floor(Math.random() * 9999999) + 1;
        const SECRET_KEY = 'UTA5U1VEQXdNREF4TkRBM1QwUkpNMDlVU1hkTmFsRTFUMUU5UFE9PQ==';
        const payload = {
            timestamp: currentTimestamp,  // Timestamp
            partnerId: "CORP00001407",       // Partner ID
            reqid: randomNumber           // Request ID
        };
        instance = jwt.sign(payload, SECRET_KEY, { algorithm: 'HS256' });
        var result = 'error no data found', api = '';
        const headers = {
            'Token': instance,
            'Accept': 'application/json',
        };
        switch (req.body.option) {
            case "AADHAR_WITHOUT_OTP":
                api = `/verification/aadhaar_without_otp`;
                const aadhaarRegex = /^\d{12}$/;
                if (aadhaarRegex.test(req.body.value)) {
                    data = { id_number: req.body.value };
                    body = 1;
                } else {
                    result = { error: 'Invalid Aadhaar number' };
                    return res.status(500).send(result);
                    break;
                }
                break;
            case "PAN_COMPREHENSIVE":
                api = `/verification/pan_comprehensive`;
                const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
                if (panRegex.test(req.body.value)) {
                    data = { pan_number: req.body.value };
                    body = 1;
                } else {
                    result = { error: 'Invalid PAN number' };
                    return res.status(500).send(result);
                    break;
                }
                break;
            case "CHEQUE_OCR":
                api = `/verification/ocr_doc`;
                const chequeLink = `https://erp.autovyn.com/backend/fetch?filePath=${EMP_DOCS_data[0]?.path}`;
                if (EMP_DOCS_data[0]?.path) {
                    data = { type: "CHEQUE", link: chequeLink };
                    body = 1;
                } else {
                    result = { error: 'Invalid link for cheque image' };
                    return res.status(500).send(result);
                    break;
                }
                break;
            case "PAN_OCR":
                api = `/verification/ocr_doc`;
                const panLink = `https://erp.autovyn.com/backend/fetch?filePath=${EMP_DOCS_data[0]?.path}`;
                if (EMP_DOCS_data[0]?.path) {
                    data = { type: "PAN", link: panLink };
                    body = 1;
                } else {
                    result = { error: 'Invalid link for PAN image' };
                    return res.status(500).send(result);
                    break;
                }
                break;
            default:
                result = { error: 'Invalid dropdown option' };
                return res.status(500).send(result);

        }

        var url = `https://api.verifya2z.com/api/v1${api}`;

        try {
            console.log(url)
            console.log(data);
            try {

                const data1 = checkorc;

                switch (req.body.option) {
                    case "AADHAR_WITHOUT_OTP":
                        return res.send({ ...aadharWithoutOtp, ...data });
                        break;
                    case "PAN_COMPREHENSIVE":
                        return res.send({ ...pancomprohencive, ...data });
                        break;
                    case "CHEQUE_OCR":
                        return res.send({ ...checkorc, ...data });
                        break;
                    case "PAN_OCR":
                        return res.send({ ...panocr, ...data });
                        break;
                    default:
                        res.send({ ...checkorc, ...data });
                }
                // res.send({ done: "done" });
            } catch (error) {
                res.send(error);
                console.error("Error fetching branches:", error);
                // return { error: "Unknown Error Found" }; // Return a meaningful error message
            }

            // }
        } catch (error) {
            console.error('Error:', error);
            res.status(200).send(error);
        }


    } catch (e) { console.log(e) }

}






