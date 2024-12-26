const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const jose = require('node-jose');
const axios = require('axios');
const cron = require('node-cron');
const { Sequelize, DataTypes, literal } = require("sequelize");
const { dbname } = require("../utils/dbconfig");

const message = {
    "Request": {
        "body": {
            "srcAccountDetails": {
                "identity": "B001",
                "currency": "INR",
                "branchCode": "1228"
            },
            "destAccountDetails": {
                "identity": "B001",
                "currency": "INR"
            },
            "txnCurrency": "INR",
            "ifscCode": "HDFC0000792",
            "narration": "sprintneft22023",
            "paymentMode": "N",
            "valueDate": "12-06-2024",
            "encryptData": {
                "Authorization": 'Basic U1lFREFQSUFVVEg6MmE4OGE5MWE5MmE2NGEx',
                "txnPassword": '2a88a91a92a64a1a1a3',
                "srcAcctNumber": '1228201003092',
                "destAcctNumber": '9833111000032',
                "customerID": '13961989',
                "txnAmount": '10.00',
                "benefName": 'Aktar',
                "userRefNo": 'tyala4'
            }
        }
    }
};
const adtaa = {
    "Authorization": "Basic U1lFREFQSUFVVEg6MmE4OGE5MWE5MmE2NGEx",
    "acctNumber": "1228201003092",
    "customerID": "13961989",
    "NUMBEROFTXN": "",
    "FROMDATE": "01-04-2022",
    "TODATE": "18-05-2022",
    "searchBy": "3",
    "branchCode": "1228"
};
const hexToBase64url = (hex) => {
    const base64 = Buffer.from(hex, 'hex').toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const hexKey = '6e816c5fb9101cde9d913af1a6c3564deb6d0cefa89e8a4d1c53f33d4b2f5ca6';
const base64urlKey = hexToBase64url(hexKey);
const secretKey = {
    kty: 'oct',
    k: base64urlKey, // Replace with your base64url encoded secret key
    alg: 'A256KW',
    enc: 'A128CBC-HS256'
};
const res = "eyJhbGciOiJBMjU2S1ciLCJlbmMiOiJBMTI4Q0JDLUhTMjU2Iiwia2lkIjoialFVRFZPbGRiSktMREI1MmE5QW0xQzljWWxLbmVrS3dRYmhzMm0xSmxXdyJ9.4fTyfkyVpJUu1bKJL4BQTutUpIk-wCr8pnzyiDCpYa8hAg6TxU3KLA.Mc96bbvhIVzTnl6zqBufIA.WPB1bZzExpUmv0WdCXznOrV5M0cJYK3B2QkTdM_qyEiD9NbyjGJdyUx199O0Bvm8bH3HbWD93CUknGpkmLNliTrfid4qGzWy9z5uZpFH8DORZ8C3peb5NZpd8MHJ6s2t7V34M3nxz5LzWJ9ZVVKtTNmcq-EgTM0EjXD2bR8GZch_-CvhcDNLlWZVdarC61ABGdpC4e1eFKEbF2U3i-EYODVT393UvHU4s02m-1dB3ZATna874dQm5yGgqE7Qfy_oLvE4eQDopwbfx83bJcyfEHZcBlecGzP_i1r8TMvmLFurxSiM6-T2S12hd4NKNwVJTPF_648DTPFPYYSqTUI7w_gz0cHwzz0Frf-qrJYCQQs.rrvtwASYiE_85L6cTTp6uA";
function sign(message) {
    // Read the private key from the PEM file
    const privateKeyPath = path.join(__dirname, '../utils/Private.pem'); // Adjust the path to your private.pem file
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    // Sign the message
    const signer = crypto.createSign('sha256');
    signer.update(message);
    signer.end();

    const signature = signer.sign(privateKey, 'base64');
    return signature;
};
function verify(message, signature) {
    // Read the public key from the PEM file
    const publicKeyPath = path.join(__dirname, '../utils/Public.pem'); // Adjust the path to your public.pem file
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

    // Verify the signature
    const verifier = crypto.createVerify('sha256');
    verifier.update(message);
    verifier.end();

    const isVerified = verifier.verify(publicKey, signature, 'base64');
    return isVerified;
};

async function decryptData(encryptedData, secretKey) {
    try {
        const keystore = jose.JWK.createKeyStore();

        // Import the symmetric key
        const key = await keystore.add(secretKey, 'oct');

        // Decrypt the data
        const decryptedResult = await jose.JWE.createDecrypt(key).decrypt(encryptedData);

        // Convert the decrypted data to a string
        const decryptedData = decryptedResult.plaintext.toString('utf8');

        return decryptedData;
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Decryption failed');
    }
}
async function encryptData(plainText, base64urlKey) {
    try {
        // Create a key store
        const keystore = jose.JWK.createKeyStore();

        // Import the symmetric key
        const secretKey = {
            kty: 'oct',
            k: base64urlKey,
            alg: 'A256KW',
            enc: 'A128CBC-HS256'
        };
        const key = await keystore.add(secretKey, 'oct');

        // Encrypt the data
        const encryptor = jose.JWE.createEncrypt(
            {
                format: 'compact',
                fields: { alg: 'A256KW', enc: 'A128CBC-HS256' }
            },
            key
        );

        const encryptedData = await encryptor.update(plainText).final();

        return encryptedData;
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Encryption failed');
    }
}
const plainText = JSON.stringify(adtaa)
async function abcd() {
    const signature = sign(JSON.stringify(message));
    console.log("Signature:", signature);
    console.log("===============================================");


    const encyptedData = await encryptData(plainText, base64urlKey)
    console.log(encyptedData)
    console.log("===============================================");

    const decryptedData = await decryptData(res, secretKey)
    console.log(JSON.parse(decryptedData))
    console.log("===============================================");

}
// abcd();

async function getStatement(requestBody) {

    const signature = sign(JSON.stringify(requestBody));
    const encyptedData = await encryptData(JSON.stringify(requestBody.Request.body.encryptData), base64urlKey)
    requestBody.Request.body.encryptData = encyptedData
    // Define the headers
    const headers = {
        'x-client-id': 'QGAjFcR7oV8ZVKtgAovqt1CYsqNzTPMV',
        'x-client-secret': 'kIg2Ki0VXesjb8QZYCbdnKnqMB79rVOK',
        'x-api-interaction-id': 'interactionId', // Replace with actual interactionId if needed
        'x-timestamp': '20240601',
        'x-client-certificate': 'MIIDkDCCAngCCQDyXxxC5oRTgjANBgkqhkiG9w0BAQsFADCBiTELMAkGA1UEBhMCSU4xCzAJBgNVBAgMAktMMRIwEAYDVQQHDAlCQU5HQUxPUkUxDzANBgNVBAoMBkNBTkFSQTEPMA0GA1UECwwGQ0FOQVJBMQ8wDQYDVQQDDAZDQU5BUkExJjAkBgkqhkiG9w0BCQEWF3JlbmppdGhnQGNhbmFyYWJhbmsuY29tMB4XDTIzMDcyNTA1Mjc1OVoXDTI0MDcyNDA1Mjc1OVowgYkxCzAJBgNVBAYTAklOMQswCQYDVQQIDAJLTDESMBAGA1UEBwwJQkFOR0FMT1JFMQ8wDQYDVQQKDAZDQU5BUkExDzANBgNVBAsMBkNBTkFSQTEPMA0GA1UEAwwGQ0FOQVJBMSYwJAYJKoZIhvcNAQkBFhdyZW5qaXRoZ0BjYW5hcmFiYW5rLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALBn4r5THaRGkeMM/ZKC8KRIRoy5Lyai3wfmonMFKCHLJfLYiiy7KttCkauZIQoKBqYm4YmpEFSBlex1qXRCmKdOLNph0NFo8/4MKfKUr3IATJMQZTp2ZMdFQx7Vp79jcSdNZKxgcACU8c9Unn6kkuS6o0chdmdkerI8oBfN6Nxje+U4PrDqqk8oK/d0a+/uyqnCeEHrtMZifTMSGbu2eNxDqhkauM1Uhln0gCa1+I0k97mH5fKy4pDqzLl6ABdi4XQkMgdbZjkloeqO2tbMDfHG6eP18CrXQWFDfuRVUcLc35j2xdjFgenjMeiDnzPH7bVlg/Iq5bwlfy7KEGmPgu0CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAlIB7CyTDUF5R+q2/OEs/WHFTwnOoTbTeg3LTeTnbPVcn8LT0n36xZTHNHcDnjj2B4lS5W91fp5q8DFnTK1d8mmTD1a9wSZaTIR1t0nvFIacmxR+yP7QljaQ4KiFTD+saRFWM/4yatvzqCDvNlJpkuOlIG9KtlAOxbxKQgF50Jmst2dGWFtrX9mNUhhVvfSuVOdxOqiunVXYTJwVHc+IHw33RkNiEEiPtH7kk8iYzb845+KbDv9GhQPiNgf682QQLZJmh2wtQ1ZR+DY4cR7V/eblb+2RmEPV6HpvMLV9TvcXgE8RpFmB7YSNj+rmah1JHjak/COQYcgrPzeFRDyr34Q==',
        'x-signature': signature,
        'Content-Type': 'application/json',
        'Cookie': 'jjj',
        'x-forwarded-for': '10.255.22.232'
    };



    // Make the POST request
    try {
        const result = await axios.post('https://uat-apibanking.canarabank.in/v1/paymentinquiry/acc-statement', requestBody, { headers })

        const decryptedData = await decryptData(result.data.Response.body.encryptData, secretKey)
        result.data.Response.body.encryptData = JSON.parse(decryptedData)
        return { data: result.data, status: 200 };

    } catch (e) {
        return { data: { error: e }, status: 500 };
    }
}
exports.neft = async function (req, res) {
    // const requestBody = {
    //     "Request": {
    //         "body": {
    //             "srcAccountDetails": {
    //                 "identity": "B001",
    //                 "currency": "INR",
    //                 "branchCode": "1228"
    //             },
    //             "destAccountDetails": {
    //                 "identity": "B001",
    //                 "currency": "INR"
    //             },
    //             "txnCurrency": "INR",
    //             "ifscCode": "HDFC0000792",
    //             "narration": "sprintneft22023",
    //             "paymentMode": "N",
    //             "valueDate": "12-06-2024",
    //             "encryptData": {
    //                 "Authorization": 'Basic U1lFREFQSUFVVEg6MmE4OGE5MWE5MmE2NGEx',
    //                 "txnPassword": '2a88a91a92a64a1a1a3',
    //                 "srcAcctNumber": '1228201003092',
    //                 "destAcctNumber": '9833111000032',
    //                 "customerID": '13961989',
    //                 "txnAmount": '10.00',
    //                 "benefName": 'Aktar',
    //                 "userRefNo": 'tyala4'
    //             }
    //         }
    //     }
    // };
    const requestBody = req.body
    const signature = sign(JSON.stringify(requestBody));
    const encyptedData = await encryptData(JSON.stringify(requestBody.Request.body.encryptData), base64urlKey)
    requestBody.Request.body.encryptData = encyptedData
    // Define the headers
    const headers = {
        'x-client-id': 'QGAjFcR7oV8ZVKtgAovqt1CYsqNzTPMV',
        'x-client-secret': 'kIg2Ki0VXesjb8QZYCbdnKnqMB79rVOK',
        'x-api-interaction-id': 'interactionId', // Replace with actual interactionId if needed
        'x-timestamp': '20240601',
        'x-client-certificate': 'MIIDkDCCAngCCQDyXxxC5oRTgjANBgkqhkiG9w0BAQsFADCBiTELMAkGA1UEBhMCSU4xCzAJBgNVBAgMAktMMRIwEAYDVQQHDAlCQU5HQUxPUkUxDzANBgNVBAoMBkNBTkFSQTEPMA0GA1UECwwGQ0FOQVJBMQ8wDQYDVQQDDAZDQU5BUkExJjAkBgkqhkiG9w0BCQEWF3JlbmppdGhnQGNhbmFyYWJhbmsuY29tMB4XDTIzMDcyNTA1Mjc1OVoXDTI0MDcyNDA1Mjc1OVowgYkxCzAJBgNVBAYTAklOMQswCQYDVQQIDAJLTDESMBAGA1UEBwwJQkFOR0FMT1JFMQ8wDQYDVQQKDAZDQU5BUkExDzANBgNVBAsMBkNBTkFSQTEPMA0GA1UEAwwGQ0FOQVJBMSYwJAYJKoZIhvcNAQkBFhdyZW5qaXRoZ0BjYW5hcmFiYW5rLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALBn4r5THaRGkeMM/ZKC8KRIRoy5Lyai3wfmonMFKCHLJfLYiiy7KttCkauZIQoKBqYm4YmpEFSBlex1qXRCmKdOLNph0NFo8/4MKfKUr3IATJMQZTp2ZMdFQx7Vp79jcSdNZKxgcACU8c9Unn6kkuS6o0chdmdkerI8oBfN6Nxje+U4PrDqqk8oK/d0a+/uyqnCeEHrtMZifTMSGbu2eNxDqhkauM1Uhln0gCa1+I0k97mH5fKy4pDqzLl6ABdi4XQkMgdbZjkloeqO2tbMDfHG6eP18CrXQWFDfuRVUcLc35j2xdjFgenjMeiDnzPH7bVlg/Iq5bwlfy7KEGmPgu0CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAlIB7CyTDUF5R+q2/OEs/WHFTwnOoTbTeg3LTeTnbPVcn8LT0n36xZTHNHcDnjj2B4lS5W91fp5q8DFnTK1d8mmTD1a9wSZaTIR1t0nvFIacmxR+yP7QljaQ4KiFTD+saRFWM/4yatvzqCDvNlJpkuOlIG9KtlAOxbxKQgF50Jmst2dGWFtrX9mNUhhVvfSuVOdxOqiunVXYTJwVHc+IHw33RkNiEEiPtH7kk8iYzb845+KbDv9GhQPiNgf682QQLZJmh2wtQ1ZR+DY4cR7V/eblb+2RmEPV6HpvMLV9TvcXgE8RpFmB7YSNj+rmah1JHjak/COQYcgrPzeFRDyr34Q==',
        'x-signature': signature,
        'Content-Type': 'application/json',
        'Cookie': 'jjj',
        'x-forwarded-for': '10.255.22.232'
    };



    try {
        // Make the POST request
        const result = await axios.post('https://uat-apibanking.canarabank.in/uat/apib/payment/neft', requestBody, { headers })

        const decryptedData = await decryptData(result.data.Response.body.encryptData, secretKey)
        result.data.Response.body.encryptData = JSON.parse(decryptedData)
        // console.log(result.data.Response.body.encryptData)
        // console.log(JSON.parse(decryptedData))
        res.send(result.data);
    } catch (e) {
        console.log(e)
        res.status(500).send({ error: e });
    }

};
exports.rtgs = async function (req, res) {
    // const requestBody = {
    //     "Request": {
    //         "body": {
    //             "srcAccountDetails": {
    //                 "currency": "INR",
    //                 "branchCode": "2709"
    //             },
    //             "destAccountDetails": {
    //                 "identity": "B001",
    //                 "currency": "INR"
    //             },
    //             "txnCurrency": "INR",
    //             "benefBankName": "icici Bank",
    //             "benefBranchName": "M G Road Bangalore",
    //             "ifscCode": "ICIC0000002",
    //             "narration": "RTGStest2233",
    //             "encryptData": {
    //                 "Authorization": 'Basic OTk0ODQ3MjJNOjJhODhhOTFhOTJhNjRhMQ==',
    //                 "txnPassword": '2a88a91a92a64a1a1a3',
    //                 "srcAcctNumber": '2709214000005',
    //                 "destAcctNumber": '5072500101670801',
    //                 "customerID": '99484722',
    //                 "txnAmount": '10',
    //                 "benefName": 'SHRIDHAR',
    //                 "userRefNo": '1000'
    //             }
    //         }
    //     }
    // };
    const requestBody = req.body;
    const signature = sign(JSON.stringify(requestBody));
    const encyptedData = await encryptData(JSON.stringify(requestBody.Request.body.encryptData), base64urlKey)
    requestBody.Request.body.encryptData = encyptedData
    // Define the headers
    const headers = {
        'x-client-id': 'QGAjFcR7oV8ZVKtgAovqt1CYsqNzTPMV',
        'x-client-secret': 'kIg2Ki0VXesjb8QZYCbdnKnqMB79rVOK',
        'x-api-interaction-id': 'interactionId', // Replace with actual interactionId if needed
        'x-timestamp': '20240601',
        'x-client-certificate': 'MIIDkDCCAngCCQDyXxxC5oRTgjANBgkqhkiG9w0BAQsFADCBiTELMAkGA1UEBhMCSU4xCzAJBgNVBAgMAktMMRIwEAYDVQQHDAlCQU5HQUxPUkUxDzANBgNVBAoMBkNBTkFSQTEPMA0GA1UECwwGQ0FOQVJBMQ8wDQYDVQQDDAZDQU5BUkExJjAkBgkqhkiG9w0BCQEWF3JlbmppdGhnQGNhbmFyYWJhbmsuY29tMB4XDTIzMDcyNTA1Mjc1OVoXDTI0MDcyNDA1Mjc1OVowgYkxCzAJBgNVBAYTAklOMQswCQYDVQQIDAJLTDESMBAGA1UEBwwJQkFOR0FMT1JFMQ8wDQYDVQQKDAZDQU5BUkExDzANBgNVBAsMBkNBTkFSQTEPMA0GA1UEAwwGQ0FOQVJBMSYwJAYJKoZIhvcNAQkBFhdyZW5qaXRoZ0BjYW5hcmFiYW5rLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALBn4r5THaRGkeMM/ZKC8KRIRoy5Lyai3wfmonMFKCHLJfLYiiy7KttCkauZIQoKBqYm4YmpEFSBlex1qXRCmKdOLNph0NFo8/4MKfKUr3IATJMQZTp2ZMdFQx7Vp79jcSdNZKxgcACU8c9Unn6kkuS6o0chdmdkerI8oBfN6Nxje+U4PrDqqk8oK/d0a+/uyqnCeEHrtMZifTMSGbu2eNxDqhkauM1Uhln0gCa1+I0k97mH5fKy4pDqzLl6ABdi4XQkMgdbZjkloeqO2tbMDfHG6eP18CrXQWFDfuRVUcLc35j2xdjFgenjMeiDnzPH7bVlg/Iq5bwlfy7KEGmPgu0CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAlIB7CyTDUF5R+q2/OEs/WHFTwnOoTbTeg3LTeTnbPVcn8LT0n36xZTHNHcDnjj2B4lS5W91fp5q8DFnTK1d8mmTD1a9wSZaTIR1t0nvFIacmxR+yP7QljaQ4KiFTD+saRFWM/4yatvzqCDvNlJpkuOlIG9KtlAOxbxKQgF50Jmst2dGWFtrX9mNUhhVvfSuVOdxOqiunVXYTJwVHc+IHw33RkNiEEiPtH7kk8iYzb845+KbDv9GhQPiNgf682QQLZJmh2wtQ1ZR+DY4cR7V/eblb+2RmEPV6HpvMLV9TvcXgE8RpFmB7YSNj+rmah1JHjak/COQYcgrPzeFRDyr34Q==',
        'x-signature': signature,
        'Content-Type': 'application/json',
        'Cookie': 'jjj',
        'x-forwarded-for': '10.255.22.232'
    };



    // Make the POST request
    try {
        const result = await axios.post('https://uat-apibanking.canarabank.in/uat/apib/payment/rtgs', requestBody, { headers })

        const decryptedData = await decryptData(result.data.Response.body.encryptData, secretKey)
        result.data.Response.body.encryptData = JSON.parse(decryptedData)
        res.send(result.data);

    } catch (e) {
        console.log(e)
        res.status(500).send({ error: e });
    }

};
exports.imps = async function (req, res) {
    // const requestBody = {
    //     "Request": {
    //         "body": {
    //             "srcAccountDetails": {
    //                 "currency": "INR",
    //                 "branchCode": "2774",
    //                 "branchName": "POLLACHI"
    //             },
    //             "destAccountDetails": {
    //                 "ifscCode": "ICIC0000002",
    //                 "benefBankName": "Minnie Lee"
    //             },
    //             "txnCurrency": "INR",
    //             "purpose": "SIT IMPS TC1",
    //             "encryptData": {
    //                 "Authorization": "Basic U1lFREFQSUFVVEg6MmE4OGE5MWE5MmE2NGEx",
    //                 "txnPassword": "2a88a91a92a64a1a1a3",
    //                 "srcAcctNumber": "2774201000179",
    //                 "destAcctNumber": "5072500101670801",
    //                 "customerID": "13961989",
    //                 "benefName": "Lucy",
    //                 "txnAmount": "100",
    //                 "userRefNo": "IMPSr546456447457"
    //             }
    //         }
    //     }
    // };
    const requestBody = req.body;
    const signature = sign(JSON.stringify(requestBody));
    const encyptedData = await encryptData(JSON.stringify(requestBody.Request.body.encryptData), base64urlKey)
    requestBody.Request.body.encryptData = encyptedData
    // Define the headers
    const headers = {
        'x-client-id': 'QGAjFcR7oV8ZVKtgAovqt1CYsqNzTPMV',
        'x-client-secret': 'kIg2Ki0VXesjb8QZYCbdnKnqMB79rVOK',
        'x-api-interaction-id': 'interactionId', // Replace with actual interactionId if needed
        'x-timestamp': '20240601',
        'x-client-certificate': 'MIIDkDCCAngCCQDyXxxC5oRTgjANBgkqhkiG9w0BAQsFADCBiTELMAkGA1UEBhMCSU4xCzAJBgNVBAgMAktMMRIwEAYDVQQHDAlCQU5HQUxPUkUxDzANBgNVBAoMBkNBTkFSQTEPMA0GA1UECwwGQ0FOQVJBMQ8wDQYDVQQDDAZDQU5BUkExJjAkBgkqhkiG9w0BCQEWF3JlbmppdGhnQGNhbmFyYWJhbmsuY29tMB4XDTIzMDcyNTA1Mjc1OVoXDTI0MDcyNDA1Mjc1OVowgYkxCzAJBgNVBAYTAklOMQswCQYDVQQIDAJLTDESMBAGA1UEBwwJQkFOR0FMT1JFMQ8wDQYDVQQKDAZDQU5BUkExDzANBgNVBAsMBkNBTkFSQTEPMA0GA1UEAwwGQ0FOQVJBMSYwJAYJKoZIhvcNAQkBFhdyZW5qaXRoZ0BjYW5hcmFiYW5rLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALBn4r5THaRGkeMM/ZKC8KRIRoy5Lyai3wfmonMFKCHLJfLYiiy7KttCkauZIQoKBqYm4YmpEFSBlex1qXRCmKdOLNph0NFo8/4MKfKUr3IATJMQZTp2ZMdFQx7Vp79jcSdNZKxgcACU8c9Unn6kkuS6o0chdmdkerI8oBfN6Nxje+U4PrDqqk8oK/d0a+/uyqnCeEHrtMZifTMSGbu2eNxDqhkauM1Uhln0gCa1+I0k97mH5fKy4pDqzLl6ABdi4XQkMgdbZjkloeqO2tbMDfHG6eP18CrXQWFDfuRVUcLc35j2xdjFgenjMeiDnzPH7bVlg/Iq5bwlfy7KEGmPgu0CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAlIB7CyTDUF5R+q2/OEs/WHFTwnOoTbTeg3LTeTnbPVcn8LT0n36xZTHNHcDnjj2B4lS5W91fp5q8DFnTK1d8mmTD1a9wSZaTIR1t0nvFIacmxR+yP7QljaQ4KiFTD+saRFWM/4yatvzqCDvNlJpkuOlIG9KtlAOxbxKQgF50Jmst2dGWFtrX9mNUhhVvfSuVOdxOqiunVXYTJwVHc+IHw33RkNiEEiPtH7kk8iYzb845+KbDv9GhQPiNgf682QQLZJmh2wtQ1ZR+DY4cR7V/eblb+2RmEPV6HpvMLV9TvcXgE8RpFmB7YSNj+rmah1JHjak/COQYcgrPzeFRDyr34Q==',
        'x-signature': signature,
        'Content-Type': 'application/json',
        'Cookie': 'jjj',
        'x-forwarded-for': '10.255.22.232'
    };



    // Make the POST request
    try {
        const result = await axios.post('https://uat-apibanking.canarabank.in/uat/apib/payment/imps', requestBody, { headers })

        const decryptedData = await decryptData(result.data.Response.body.encryptData, secretKey)
        result.data.Response.body.encryptData = JSON.parse(decryptedData)
        res.send(result.data);

    } catch (e) {
        console.log(e)
        res.status(500).send({ error: e });
    }

};
exports.statement = async function (req, res) {
    // const requestBody = {
    //     "Request": {
    //         "body": {
    //             "encryptData": {
    //                 "Authorization": "Basic U1lFREFQSUFVVEg6MmE4OGE5MWE5MmE2NGEx",
    //                 "acctNumber": "1228201003092",
    //                 "customerID": "13961989",
    //                 "NUMBEROFTXN": "",
    //                 "FROMDATE": "01-04-2022",
    //                 "TODATE": "18-06-2022",
    //                 "searchBy": "3",
    //                 "branchCode": "1228"
    //             }
    //         }
    //     }
    // }
    try {
        const result = await myTask(req.body);
        console.log(result.status);
        return res.status(result.status ? result.status : 500).send(result.data)
    } catch (e) {
        return res.send({ message: "Internal server error" })
    }
};
exports.balance = async function (req, res) {
    // const requestBody = {
    //     "Request": {
    //         "body": {
    //             "branchCode": "2774",
    //             "encryptData": {
    //                 "Authorization": "Basic U1lFREFQSUFVVEg6MmE4OGE5MWE5MmE2NGEx",
    //                 "acctNumber": "2774201000198",
    //                 "customerID": "13961989"
    //             }
    //         }
    //     }
    // }
    const requestBody = req.body


    const signature = sign(JSON.stringify(requestBody));
    const encyptedData = await encryptData(JSON.stringify(requestBody.Request.body.encryptData), base64urlKey)
    requestBody.Request.body.encryptData = encyptedData
    // Define the headers
    const headers = {
        'x-client-id': 'QGAjFcR7oV8ZVKtgAovqt1CYsqNzTPMV',
        'x-client-secret': 'kIg2Ki0VXesjb8QZYCbdnKnqMB79rVOK',
        'x-api-interaction-id': 'interactionId', // Replace with actual interactionId if needed
        'x-timestamp': '20240601',
        'x-client-certificate': 'MIIDkDCCAngCCQDyXxxC5oRTgjANBgkqhkiG9w0BAQsFADCBiTELMAkGA1UEBhMCSU4xCzAJBgNVBAgMAktMMRIwEAYDVQQHDAlCQU5HQUxPUkUxDzANBgNVBAoMBkNBTkFSQTEPMA0GA1UECwwGQ0FOQVJBMQ8wDQYDVQQDDAZDQU5BUkExJjAkBgkqhkiG9w0BCQEWF3JlbmppdGhnQGNhbmFyYWJhbmsuY29tMB4XDTIzMDcyNTA1Mjc1OVoXDTI0MDcyNDA1Mjc1OVowgYkxCzAJBgNVBAYTAklOMQswCQYDVQQIDAJLTDESMBAGA1UEBwwJQkFOR0FMT1JFMQ8wDQYDVQQKDAZDQU5BUkExDzANBgNVBAsMBkNBTkFSQTEPMA0GA1UEAwwGQ0FOQVJBMSYwJAYJKoZIhvcNAQkBFhdyZW5qaXRoZ0BjYW5hcmFiYW5rLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALBn4r5THaRGkeMM/ZKC8KRIRoy5Lyai3wfmonMFKCHLJfLYiiy7KttCkauZIQoKBqYm4YmpEFSBlex1qXRCmKdOLNph0NFo8/4MKfKUr3IATJMQZTp2ZMdFQx7Vp79jcSdNZKxgcACU8c9Unn6kkuS6o0chdmdkerI8oBfN6Nxje+U4PrDqqk8oK/d0a+/uyqnCeEHrtMZifTMSGbu2eNxDqhkauM1Uhln0gCa1+I0k97mH5fKy4pDqzLl6ABdi4XQkMgdbZjkloeqO2tbMDfHG6eP18CrXQWFDfuRVUcLc35j2xdjFgenjMeiDnzPH7bVlg/Iq5bwlfy7KEGmPgu0CAwEAATANBgkqhkiG9w0BAQsFAAOCAQEAlIB7CyTDUF5R+q2/OEs/WHFTwnOoTbTeg3LTeTnbPVcn8LT0n36xZTHNHcDnjj2B4lS5W91fp5q8DFnTK1d8mmTD1a9wSZaTIR1t0nvFIacmxR+yP7QljaQ4KiFTD+saRFWM/4yatvzqCDvNlJpkuOlIG9KtlAOxbxKQgF50Jmst2dGWFtrX9mNUhhVvfSuVOdxOqiunVXYTJwVHc+IHw33RkNiEEiPtH7kk8iYzb845+KbDv9GhQPiNgf682QQLZJmh2wtQ1ZR+DY4cR7V/eblb+2RmEPV6HpvMLV9TvcXgE8RpFmB7YSNj+rmah1JHjak/COQYcgrPzeFRDyr34Q==',
        'x-signature': signature,
        'Content-Type': 'application/json',
        'Cookie': 'jjj',
        'x-forwarded-for': '10.255.22.232'
    };



    // Make the POST request
    try {
        const result = await axios.post('https://uat-apibanking.canarabank.in/v1/paymentinquiry/balanceinquiry', requestBody, { headers })

        const decryptedData = await decryptData(result.data.Response.body.encryptData, secretKey)
        result.data.Response.body.encryptData = JSON.parse(decryptedData)
        res.send(result.data);

    } catch (e) {
        console.log(e)
        res.status(500).send({ error: e });
    }

};
const myTask = async (requestBodyFromApi) => {
    try {


        const formatDate = (date) => {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };

        // Get current date
        const currentDate = new Date();

        // Create date 10 days before current date
        const fromDate = new Date(currentDate);
        fromDate.setDate(currentDate.getDate() - 10);

        // Format dates
        const formattedFromDate = formatDate(fromDate);
        const formattedCurrentDate = formatDate(currentDate);
        const requestBody = {
            "Request": {
                "body": {
                    "encryptData": {
                        "Authorization": "Basic U1lFREFQSUFVVEg6MmE4OGE5MWE5MmE2NGEx",
                        "acctNumber": "1228201003092",
                        "customerID": "13961989",
                        "NUMBEROFTXN": "",
                        "FROMDATE": "01-01-2023",
                        "TODATE": "01-02-2023",
                        "searchBy": "3",
                        "branchCode": "1228"
                    }
                }
            }
        }

        console.log(requestBody.Request.body.encryptData)
        const apidata = await getStatement(requestBodyFromApi ? requestBodyFromApi : requestBody);


        const formatTransactionData = (data) => {
            return data.map((txn, index) => {
                // Parse transaction dates
                const txnDate = new Date(
                    txn.transactionDate.substring(0, 4),   // Year
                    parseInt(txn.transactionDate.substring(4, 6)) - 1, // Month (subtract 1 because months are 0-indexed in JavaScript)
                    txn.transactionDate.substring(6, 8),   // Day
                    txn.transactionDate.substring(8, 10),  // Hours
                    txn.transactionDate.substring(10, 12), // Minutes
                    txn.transactionDate.substring(12, 14)  // Seconds
                );

                const txnValueDate = new Date(
                    txn.valueDate.substring(0, 4),   // Year
                    parseInt(txn.valueDate.substring(4, 6)) - 1, // Month (subtract 1 because months are 0-indexed in JavaScript)
                    txn.valueDate.substring(6, 8)    // Day
                );

                // Format dates as strings
                const txnDateString = txnDate.toLocaleString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                const txnValueDateString = txnValueDate.toLocaleString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                });

                return {
                    BANK_CODE: 1228,
                    BANK_NAME: 'YOUR_BANK_NAME',
                    TXN_NO: index + 1, // Assuming TXN_NO is an auto-increment field
                    TXNDATE: txnDateString,
                    CHEQUENO: txn.chequeNumber,
                    Debit: txn.creditDebitFlag === 'D' ? parseFloat(txn.transactionAmount) : null,
                    Credit: txn.creditDebitFlag === 'C' ? parseFloat(txn.transactionAmount) : null,
                    BALANCE: parseFloat(txn.runningBalance),
                    REMARKS: txn.description,
                    TXN_DATE: txnValueDateString,
                    IMPORT_DATE: new Date()
                };
            });
        };
        // Format the data
        console.log(apidata.data)
        const formattedData = await formatTransactionData(apidata.data.Response?.body.encryptData.transactions);
        console.log(formattedData);
        const sequelize = await dbname("OMLL");

        for (const item of formattedData) {
            // Construct the SQL insert query
            const query = `
      INSERT INTO API_BANK_STATEMENT (
        BANK_CODE, BANK_NAME, TXN_NO, TXNDATE, CHEQUENO, Debit, Credit, BALANCE, REMARKS, TXN_DATE, IMPORT_DATE
      )
      SELECT :BANK_CODE, :BANK_NAME, :TXN_NO, :TXNDATE, :CHEQUENO, :Debit, :Credit, :BALANCE, :REMARKS, :TXN_DATE, :IMPORT_DATE
      WHERE NOT EXISTS (
        SELECT 1 FROM API_BANK_STATEMENT WHERE CHEQUENO = :CHEQUENO
      );
    `;

            // Execute the query with parameters
            await sequelize.query(query, {
                replacements: {
                    BANK_CODE: item.BANK_CODE,
                    BANK_NAME: item.BANK_NAME,
                    TXN_NO: item.TXN_NO,
                    TXNDATE: item.TXNDATE,
                    CHEQUENO: item.CHEQUENO ? item.CHEQUENO : null,
                    Debit: item.Debit,
                    Credit: item.Credit,
                    BALANCE: item.BALANCE,
                    REMARKS: item.REMARKS,
                    UNIQUEID: item.UNIQUEID,
                    TXN_DATE: item.TXN_DATE,
                    IMPORT_DATE: item.IMPORT_DATE,
                },
                type: Sequelize.QueryTypes.INSERT, // Specify the query type
            });
        }
    } catch (e) {
        console.log(e);
    }
};

// myTask();

// setInterval(myTask, 1000);
// setInterval(myTask, 30 * 60 * 1000);




