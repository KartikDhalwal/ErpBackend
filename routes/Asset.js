const { dbname } = require("../utils/dbconfig");
const jwt = require("jsonwebtoken");
const { Sequelize, DataTypes, literal, where } = require("sequelize");
const FormData = require("form-data");
const Joi = require("joi");
const axios = require("axios");
const xlsx = require("xlsx");
const ExcelJS = require("exceljs");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { SendWhatsAppMessgae } = require("./user");
const { assetsGroupSchema, _AssetGroup } = require("../models/AssetsGroup");
const {
  assetsGroupSubcategorySchema,
  _AssetGroupSubcategory,
} = require("../models/AssetsGroupSubcategory");
const { _AssetTemplate } = require("../models/AssetTemplate");
const {
  _Asset_Product,
  assetProductSchema,
} = require("../models/AssetProduct");
const {
  _Product_Issue,
  productIssueSchema,
} = require("../models/ProductIssue");
const {
  _Product_Finance,
  productFinanceSchema,
} = require("../models/ProductFinance");
const {
  _Product_Vendor,
  productVendorSchema,
} = require("../models/ProductVendor");
const {
  _Product_Service,
  productServiceSchema,
} = require("../models/ProductService");
const {
  _Product_Extra,
  productExtraSchema,
} = require("../models/ProductExtra");
const {
  _Purchase_Request,
  purchaseRequestSchema,
} = require("../models/PurchaseRequest");
const {
  _Purchase_Req_Product_Details,
  purchaseReqProductDetailsSchema,
} = require("../models/PurchaseReqProductDetails");
const {
  _Purchase_Order,
  purchaseOrderSchema,
} = require("../models/PurchaseOrder");
const {
  _Purchase_Order_Product_Details,
  purchaseOrderProductDetailsSchema,
} = require("../models/PurchaseOrderProductDetails");
const {
  _PurchaseEntryMst,
  PurchaseEntryMstSchema,
} = require("../models/PurchaseEntry");
const {
  _PurchaseEntryDtl,
  PurchaseEntryDtlSchema,
} = require("../models/PurchaseEntryDtl");
const { _DmsRowData, DmsRowDataSchema } = require("../models/DmsRowData");
const {
  _InventoryItems,
  InventoryItemsSchema,
} = require("../models/InventoryItems");
const {
  _Product_Histroy,
  productHistorySchema,
} = require("../models/ProductHistory");
const {
  _ReminderAsset,
  reminderAssetSchema,
} = require("../models/AssetReminder");
const {
  _Product_Issue_Dtl,
  productIssueDtlSchema,
} = require("../models/product_issue_dtl");
const {
  _purchase_Req_Product_Details_Dtl,
  purchaseReqProductDetailsDtlSchema,
} = require("../models/PurchaseReqProductDetailsDtl");
const {
  _PurchaseEntryDtlSr,
  purchaseEntryDtlSRSchema,
} = require("../models/PurchaseEntryDtlSr");
const {
  _AssetPoolingReallocation,
  assetPoolingReallocationSchema,
} = require("../models/AssetPoolingReallocation");
const {
  _AssetPoolingReallocationDtl,
  assetPoolingReallocationDtlSchema,
} = require("../models/AssetPoolingReallocationDtl");
const {
  _AssetPoolingReallocationDtlSr,
  assetPoolingReallocationDtlSrSchema,
} = require("../models/AssetPoolingReallocationDtlSr");
const {
  AssetCharacteristicSchema,
  _AssetCharacteristic,
} = require("../models/AssetCharacteristic");
const {
  _Asset_Request,
  AssetRequestSchema,
} = require("../models/AssetRequest");
const {
  _Asset_Request_Dtl,
  AssetRequestdtlSchema,
} = require("../models/AssetRequestdtl");
const {
  _AssetMonthWisePurchase, AssetMonthWisePurchaseSchema,
} = require("../models/AssetMonthWisePurchasr");

const { Console } = require("console");
const QRCode = require("qrcode");
const bwipjs = require("bwip-js");
const sharp = require("sharp");

const generateQRCode = async (text) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(text);
    console.log("Generated QR Code Data URL:", qrCodeDataURL);
    return qrCodeDataURL;
  } catch (err) {
    console.error("Error generating QR code:", err);
    throw err;
  }
};

async function uploadImages(
  files,
  finalFolderPath,
  Emp_Code,
  Created_by,
  SRNO
) {
  let dataArray = [];

  for (let i = 0; i < 1; i++) {
    // Loop for processing images (update as needed)
    let fileKey = "VendorDocument";

    if (files[fileKey]) {
      const file = files[fileKey][0]; // Extract file from files object
      const fileExtension = path.extname(file.originalname).toLowerCase(); // Get file extension
      const filename = `${uuidv4()}${fileExtension}`; // Create unique filename

      try {
        // Compress the image using sharp before uploading
        let compressedBuffer;

        switch (fileExtension) {
          case ".jpg":
          case ".jpeg":
            compressedBuffer = await sharp(file.buffer)
              .resize({ width: 1024 }) // Resize if needed
              .jpeg({ quality: 80 }) // Compress JPEG
              .toBuffer();
            break;
          case ".png":
            compressedBuffer = await sharp(file.buffer)
              .resize({ width: 1024 })
              .png({ quality: 80, compressionLevel: 8 }) // Compress PNG
              .toBuffer();
            break;
          case ".webp":
            compressedBuffer = await sharp(file.buffer)
              .resize({ width: 1024 })
              .webp({ quality: 80 }) // Compress WebP
              .toBuffer();
            break;
          case ".gif":
            compressedBuffer = await sharp(file.buffer)
              .resize({ width: 1024 })
              .gif() // GIF compression
              .toBuffer();
            break;
          case ".tiff":
            compressedBuffer = await sharp(file.buffer)
              .resize({ width: 1024 })
              .tiff({ quality: 80 }) // Compress TIFF
              .toBuffer();
            break;
          default:
            throw new Error("Unsupported file format");
        }

        // Prepare form data
        const formData = new FormData();
        formData.append("photo", compressedBuffer, filename);
        formData.append("customPath", finalFolderPath);

        // Send the compressed image to the server
        const response = await axios.post(
          "http://cloud.autovyn.com:3000/upload-photo-compress",
          formData,
          {
            headers: formData.getHeaders(), // Set the headers for multipart/form-data
          }
        );

        console.log(`Image ${i} uploaded successfully`);

        // Build data for the current image
        const data = {
          SRNO: SRNO,
          EMP_CODE: Emp_Code,
          Created_by: Created_by,
          DOC_NAME: file.originalname,
          columndoc_type: "VendorDocument",
          DOC_PATH: `${finalFolderPath}\\${filename}`,
        };

        // Push the current image data into the array
        dataArray.push(data);
      } catch (error) {
        console.error(`Error uploading image ${i}:`, error.message);
      }
    }
  }

  // Return the array containing data about the uploaded images
  return dataArray;
}
const generateBarcode = async (data) => {
  try {
    return new Promise((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: "code128", // Barcode type
          text: data, // Data to encode
          scale: 3, // 3x scaling factor
          height: 10, // Bar height, in millimeters
          width: 100, // Bar width, in millimeters
          padding: 10, // Padding around barcode
          background: "white", // Background color
          color: "black", // Foreground color
          includetext: true, // Include text in barcode
          textxalign: "center", // Align text to center
        },
        (err, png) => {
          if (err) {
            reject(err);
          } else {
            resolve(`data: image / png; base64, ${png.toString("base64")}`);
          }
        }
      );
    });
  } catch (error) {
    throw new Error("Error generating barcode");
  }
};
const isEmptyObject = (obj) => {
  return Object.values(obj).every((value) => value === null);
};

exports.GenerateQR = async function (req, res) {
  try {
    const utd = req.params.utd;
    const sequelize = await dbname(req.query.compcode);
    const [results] = await sequelize.query(`
      SELECT 
        Icon,   
        Name,
        (SELECT TOP 1 name FROM Assets_Group WHERE id = Asset_Product.Category) AS CategoryName,
        (SELECT TOP 1 name FROM Assets_Group_Subcategory WHERE id = Asset_Product.Subcategory) AS SubCategoryName,
        model,
        (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Asset_Product.Location) AS LocationName,
        FORMAT(purchase_date, 'dd MMMM yyyy') AS PurchaseDate,
        Unit_Rate AS PurchaseValue,
        Description,
        Serial_No,
        (SELECT TOP 1 Vendor_Name FROM Product_Vendor WHERE Product_Vendor.Asset_Product = Asset_Product.UTD) AS Vendor
      FROM 
        Asset_Product 
      WHERE 
        utd = '${utd}'
    `);

    const asset = results[0];

    const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Asset Details</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f4f4f4;
        color: #333;
      }
      .container {
        max-width: 100%;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        text-align: center;
      }
      .product-card {
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 10px;
        background-color: #fff;
      }
      .product-image-container {
        width: 100%;
        max-width: 100%;
        height: auto;
        margin: 0 auto 20px auto;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #f9f9f9;
      }
      .product-image {
        width: 100%;
        height: auto;
        max-height: 400px; /* Adjusted for better responsiveness */
        object-fit: contain;
      }
      .product-title {
        font-size: 2em;
        margin: 20px 0;
        color: #333;
      }
      .product-details {
        text-align: left;
        margin-top: 20px;
      }
      .product-details .field {
        margin-bottom: 10px;
      }
      .product-details .field label {
        font-weight: bold;
        display: block;
        margin-bottom: 5px;
      }
      .product-details .field div {
        padding: 10px;
        background-color: #f9f9f9;
        border-radius: 4px;
      }

      @media (min-width: 768px) {
        .container {
          max-width: 768px;
        }
      }

      @media (min-width: 1024px) {
        .container {
          max-width: 1024px;
        }
        .product-title {
          font-size: 2.5em;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="product-card">
        <div class="product-image-container">
          <img src="https://erp.autovyn.com/backend/fetch?filePath=${asset.Icon
      }" alt="${asset.Name}" class="product-image">
        </div>
        <h1 class="product-title">${asset.Name ? asset.Name : ""}</h1>
        <div class="product-details">
          <div class="field">
            <label>Category:</label>
            <div>${asset.CategoryName ? asset.CategoryName : ""}</div>
          </div>
          <div class="field">
            <label>Subcategory:</label>
            <div>${asset.SubCategoryName ? asset.SubCategoryName : ""}</div>
          </div>
          <div class="field">
            <label>Model:</label>
            <div>${asset.model ? asset.model : ""}</div>
          </div>
          <div class="field">
            <label>Location:</label>
            <div>${asset.LocationName ? asset.LocationName : ""}</div>
          </div>
          <div class="field">
            <label>Purchase Date:</label>
            <div>${asset.PurchaseDate ? asset.PurchaseDate : ""}</div>
          </div>
          <div class="field">
            <label>Purchase Value:</label>
            <div>${asset.PurchaseValue ? asset.PurchaseValue : ""}</div>
          </div>
          <div class="field">
            <label>Description:</label>
            <div>${asset.Description ? asset.Description : ""}</div>
          </div>
          <div class="field">
            <label>Serial Number:</label>
            <div>${asset.Serial_No ? asset.Serial_No : ""}</div>
          </div>
          <div class="field">
            <label>Vendor:</label>
            <div>${asset.Vendor ? asset.Vendor : ""}</div>
          </div>
        </div>
      </div>
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

exports.addProduct = async function (req, res) {
  const SerialNo = req.body.General.Serial_No?.toUpperCase().trim();
  const Location = req.body.General.Location;
  const { UTD, ...General } = req.body.General;

  // Convert Characteristics array to a string
  if (Array.isArray(General.Characteristics)) {
    General.Characteristics = General.Characteristics.join(", ");
  }

  // Validate Asset Product data
  const { error: assetError, value: Asset_Product } =
    assetProductSchema.validate(General, {
      abortEarly: false,
      stripUnknown: true,
    });
  // Validate Product Services data
  const { error: serviceError, value: ProductServices } = Joi.array()
    .items(productServiceSchema)
    .validate(req.body.Service, {
      abortEarly: false,
      stripUnknown: true,
    });
  // Validate Product Finance data, only if it exists
  let Product_Finance;
  if (req.body.Finance && !isEmptyObject(req.body.Finance)) {
    const { error: financeError, value } = productFinanceSchema.validate(
      req.body.Finance,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );
    if (financeError) {
      const errorMessage = financeError.details
        .map((err) => err.message)
        .join(", ");
      return res.status(400).send({ success: false, message: errorMessage });
    }
    Product_Finance = value;
  }
  let extrafield;
  if (req.body.extrafield && !isEmptyObject(req.body.extrafield)) {
    const { error: extrafieldError, value } = productExtraSchema.validate(
      req.body.extrafield,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );
    if (extrafieldError) {
      const errorMessage = extrafieldError.details
        .map((err) => err.message)
        .join(", ");
      return res.status(400).send({ success: false, message: errorMessage });
    }
    extrafield = value;
  }

  // Validate Product Vendor data, only if it exists
  let Product_Vendor;
  if (req.body.Vendor && !isEmptyObject(req.body.Vendor)) {
    const { error: VendorError, value } = productVendorSchema.validate(
      req.body.Vendor,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );
    if (VendorError) {
      const errorMessage = VendorError.details
        .map((err) => err.message)
        .join(", ");
      return res.status(400).send({ success: false, message: errorMessage });
    }
    Product_Vendor = value;
  }

  // Check if any validation errors occurred
  if (assetError || serviceError) {
    const errors = (assetError ? assetError.details : []).concat(
      serviceError ? serviceError.details : []
    );
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }

  if (Asset_Product.unitsProduced) {
    Asset_Product.unitsProduced = JSON.stringify(Asset_Product.unitsProduced);
  }
  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();

    const iscopy = await sequelize.query(
      `select * from asset_product where Model='${req.body.General.Model}' or Name='${req.body.General.Name}'`
    );
    if (iscopy[0].length > 0) {
      res
        .status(400)
        .send({
          message: "Asset Name or  Vendor Item Code Cannot Be Duplicate",
        });
      return;
    }
    const result =
      await sequelize.query(`SELECT UPPER(REPLACE(LTRIM(RTRIM(Serial_No)), ' ', '')) AS Serial_No 
        FROM Asset_Product 
        WHERE Location = '${Location}' 
        AND (LTRIM(RTRIM(Serial_No))) = '${SerialNo}'`);

    if (result[0].length > 0) {
      res.status(400).send({ message: "Asset Serial Number Already Exist" });
      return;
    }

    const CategoryCode = await sequelize.query(
      `select top 1 name from assets_group where id = '${req.body.General.Category}'`
    );

    const SubcategoryCode = await sequelize.query(
      `select top 1 name from assets_group_Subcategory where id = '${req.body.General.Subcategory}'`
    );

    //save AssetCode
    const code = await sequelize.query(`WITH AssetCounter AS (
    SELECT
        UPPER(
            CASE
                WHEN SUBSTRING(ag.name, 3, 1) = ' ' THEN SUBSTRING(ag.name, 1, 2)
                ELSE SUBSTRING(ag.name, 1, 3)
            END
        ) AS CategoryCode,

        UPPER(
            CASE
                WHEN SUBSTRING(ags.name, 3, 1) = ' ' THEN SUBSTRING(ags.name, 1, 2)
                ELSE SUBSTRING(ags.name, 1, 3)
            END
        ) AS SubcategoryCode,
        
        (SELECT TOP 1 newcar_rcpt FROM godown_mst WHERE godw_code =${req.body.General.Location} AND Export_Type < 3) AS Godw,
        
        -- Use CASE to conditionally count ap.name
        CASE
            WHEN COUNT(ap.name) = 0 THEN 1  -- if no ap.name, set count to 1
            ELSE COUNT(ap.name) + 1          -- otherwise add 1 to the count
        END AS RawAssetNumber
    FROM
        assets_group ag
    JOIN
        assets_group_subcategory ags ON ag.id = ags.Group_Id
    LEFT JOIN
        asset_product ap ON ags.id = ap.Subcategory
    WHERE
        ag.name = '${CategoryCode[0][0].name}'
        AND ags.name = '${SubcategoryCode[0][0].name}' 
    GROUP BY
        ag.name, ags.name
)
SELECT
    CONCAT(CategoryCode, '/', SubcategoryCode, '/', Godw, '/', RIGHT(CONCAT('00000', RawAssetNumber), 5)) AS AssetCode
FROM
    AssetCounter;`);

    const assetCode = code[0][0].AssetCode;

    // Create the Asset Product
    const AssetProduct = _Asset_Product(sequelize, Sequelize.DataTypes);
    const createdAssetProduct = await AssetProduct.create(Asset_Product, {
      transaction: t,
      returning: true,
    });
    // Log Asset Product creation
    if (Asset_Product.End_Date) {
      const nextDueDate = new Date(Asset_Product.End_Date); // Convert to a Date object
      const validityDate = new Date(nextDueDate); // Clone the date to avoid modifying the original
      // Add 1 day to the cloned date for validity
      validityDate.setDate(validityDate.getDate() + 1);
      const formattedValidity = validityDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      const reminder_data = {
        reminder_name: "AMC Expiry",
        date: Asset_Product.End_Date, // Original date remains unchanged
        time: "12:00",
        frequency: "One-Time",
        validity: formattedValidity, // Validity is one day after
        description: Asset_Product.Description,
        Asset: createdAssetProduct.UTD,
        user_id: Asset_Product.Created_By,
        Created_By: Asset_Product.Created_By,
        SubCategory: Asset_Product.Subcategory,
        Category: Asset_Product.Category,

        type: 1,
      };
      const ReminderAsset = _ReminderAsset(sequelize, Sequelize.DataTypes);
      await ReminderAsset.create(reminder_data, {
        transaction: t,
      });
    }

    if (req.body.IshighlightInput && req.body.PurchaseDtl) {
      await sequelize.query(
        `update PurchaseEntryDtlsr set isCreated='1' where tran_id='${req.body.PurchaseDtl}' and serial_no='${SerialNo}'`,
        {
          transaction: t,
        }
      );
    }
    const Product_History = _Product_Histroy(sequelize, Sequelize.DataTypes);
    await Product_History.create(
      {
        Asset_ID: createdAssetProduct.UTD,
        Tran_Type: req.body.IshighlightInput ? 5 : 1,
        Quantity: createdAssetProduct.Qty,
        Category: createdAssetProduct.Category,
        SubCategory: createdAssetProduct.Subcategory,
        Created_By: createdAssetProduct.Created_By,
        Source_Location: createdAssetProduct.Location,
        PurchaseDtl: req.body.PurchaseDtl ? req.body.PurchaseDtl : null,
        Tran_Date: createdAssetProduct.Due_Date
          ? createdAssetProduct.Due_Date
          : new Date(),
      },
      {
        transaction: t,
      }
    );
    // Create Product Issues
    // // Create Product Services
    const ProductService = _Product_Service(sequelize, Sequelize.DataTypes);
    const createdProductServices = await Promise.all(
      ProductServices.map((service) => {
        return ProductService.create(
          {
            ...service,
            Asset_Product: createdAssetProduct.UTD, // Associate each service with the newly created Asset Product UTD
          },
          {
            transaction: t,
            returning: true,
          }
        );
      })
    );
    const ProductExtra = _Product_Extra(sequelize, Sequelize.DataTypes);
    const createProductExtra = await ProductExtra.create(
      {
        ...extrafield,
        Asset_Product: createdAssetProduct.UTD,
      },
      {
        transaction: t,
        returning: true,
      }
    );

    // Log Product Services creation
    // console.log("Product Services created:", createdProductServices);

    // Create Product Finance if it exists
    let createdProductFinance = null;
    if (!isEmptyObject(req.body.Finance)) {
      const ProductFinance1 = _Product_Finance(sequelize, Sequelize.DataTypes);
      createdProductFinance = await ProductFinance1.create(
        {
          ...Product_Finance,
          Asset_Product: createdAssetProduct.UTD, // Associate finance data with the newly created Asset Product UTD
        },
        {
          transaction: t,
          returning: true,
        }
      );
      if (Product_Finance && Product_Finance.Warrent_End) {
        const nextDueDate = new Date(Product_Finance.Warrent_End); // Convert to a Date object
        const validityDate = new Date(nextDueDate); // Clone the date to avoid modifying the original
        // Add 1 day to the cloned date for validity
        validityDate.setDate(validityDate.getDate() + 1);
        const formattedValidity = validityDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
        const reminder_data = {
          reminder_name: "Warranty Expiry",
          date: Product_Finance.Warrent_End, // Original date remains unchanged
          time: "12:00",
          frequency: "One-Time",
          validity: formattedValidity, // Validity is one day after
          description: Asset_Product.Description,
          Asset: createdAssetProduct.UTD,
          user_id: Asset_Product.Created_By,
          Created_By: Asset_Product.Created_By,
          SubCategory: Asset_Product.Subcategory,
          Category: Asset_Product.Category,
          type: 1,
        };
        const ReminderAsset = _ReminderAsset(sequelize, Sequelize.DataTypes);
        await ReminderAsset.create(reminder_data, {
          transaction: t,
        });
      }
      // Log Product Finance creation
      console.log("Product Finance created:", createdProductFinance);
    }

    // Create Product Vendor if it exists
    let createdProductVendor = null;
    if (Product_Vendor && !isEmptyObject(req.body.Vendor)) {
      const ProductVendor1 = _Product_Vendor(sequelize, Sequelize.DataTypes);
      createdProductVendor = await ProductVendor1.create(
        {
          ...Product_Vendor,
          Asset_Product: createdAssetProduct.UTD, // Associate vendor data with the newly created Asset Product UTD
        },
        {
          transaction: t,
          returning: true,
        }
      );
      // Log Product Vendor creation
      console.log("Product Vendor created:", createdProductVendor);
    }
    await t.commit();
    const qrCodeDataURL = await generateQRCode(
      `https://erp.autovyn.com/backend/asset/GenerateQR/${createdAssetProduct.UTD}?compcode=${req.headers.compcode}`
    );
    const barcodeDataURL = await generateBarcode(
      createdAssetProduct.UTD.toString()
    );
    await sequelize.query(
      `UPDATE asset_product SET QRCode='${qrCodeDataURL}',BarCode='${barcodeDataURL}' WHERE utd=${createdAssetProduct.UTD}`
    );
    if (req.body.Attachments) {
      const Attachments = JSON.stringify(req.body.Attachments);
      await sequelize.query(
        `update asset_product set Attachments='${Attachments}' where utd=${createdAssetProduct.UTD}`
      );
    }

    // Save AssetCode in the asset_product table
    await sequelize.query(
      `UPDATE asset_product SET AssetCode = '${assetCode}' WHERE UTD = ${createdAssetProduct.UTD}`
    );

    // Prepare response
    const response = {
      success: true,
      General: createdAssetProduct,
      Service: createdProductServices,
      qrCode: qrCodeDataURL,
      BarCode: barcodeDataURL,
      AssetCode: assetCode,
    };

    if (createdProductFinance) {
      response.Finance = createdProductFinance;
    }

    if (createdProductVendor) {
      response.Vendor = createdProductVendor;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback();
    }
    res.status(500).json({ error: "An error occurred during Saving." });
  }
};

exports.UpdateProduct = async function (req, res) {
  const { UTD, Available, ...General } = req.body.General;
  const { UTD: extrafieldutd, ...extrafield } = req.body.extrafield || {};
  // Convert Characteristics array to a string
  if (Array.isArray(General.Characteristics)) {
    General.Characteristics = General.Characteristics.join(", ");
  }

  // Validate Asset Product data
  const { error: assetError, value: Asset_Product } =
    assetProductSchema.validate(General, {
      abortEarly: false,
      stripUnknown: true,
    });

  // Validate Product Services data
  const { error: serviceError, value: ProductServices } = Joi.array()
    .items(productServiceSchema)
    .validate(req.body.Service, {
      abortEarly: false,
      stripUnknown: true,
    });

  // Validate Product Finance data, only if it exists
  let Product_Finance;
  if (req.body.Finance && !isEmptyObject(req.body.Finance)) {
    const { error: financeError, value } = productFinanceSchema.validate(
      req.body.Finance,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );
    if (financeError) {
      const errorMessage = financeError.details
        .map((err) => err.message)
        .join(", ");
      return res
        .status(400)
        .send({ success: false, message: errorMessage, a: "Product_Finance" });
    }
    Product_Finance = value;
  }

  if (req.body.extrafield && !isEmptyObject(req.body.extrafield)) {
    const { error: extrafieldError, value } = productExtraSchema.validate(
      req.body.extrafield,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );
    if (extrafieldError) {
      const errorMessage = extrafieldError.details
        .map((err) => err.message)
        .join(", ");
      return res.status(400).send({ success: false, message: errorMessage });
    }
  }

  // Validate Product Vendor data, only if it exists
  let Product_Vendor;
  if (req.body.Vendor) {
    const { error: VendorError, value } = productVendorSchema.validate(
      req.body.Vendor,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );
    if (VendorError) {
      const errorMessage = VendorError.details
        .map((err) => err.message)
        .join(", ");
      return res
        .status(400)
        .send({ success: false, message: errorMessage, a: "Vendor" });
    }
    Product_Vendor = value;
  }

  // Check if any validation errors occurred
  if (assetError || serviceError) {
    const errors = (assetError ? assetError.details : []).concat(
      serviceError ? serviceError.details : []
    );
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }

  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const isone = await sequelize.query(
      `select Category,Subcategory from product_history where Asset_ID=${UTD}`
    );
    const productHistoryCategory = isone[0][0].Category;
    const productHistorySubcategory = isone[0][0].Subcategory;

    // Assuming Asset_Product is an object with Category and Subcategory properties
    const isDifferent =
      productHistoryCategory !== Asset_Product.Category ||
      productHistorySubcategory !== Asset_Product.Subcategory;
    if (isDifferent) {
      if (isone[0].length > 1) {
        res
          .status(400)
          .send({ message: "Cannot Chnage The Category / SubCategory" });
        return;
      } else if (isone[0].length == 1) {
        await sequelize.query(
          `update product_history set Category=${Asset_Product.Category},SubCategory=${Asset_Product.Subcategory} where Asset_ID=${UTD}`
        );
      }
    }

    t = await sequelize.transaction();
    if (Asset_Product.unitsProduced) {
      Asset_Product.unitsProduced = JSON.stringify(Asset_Product.unitsProduced);
    }
    // Update the Asset Product
    const AssetProduct = _Asset_Product(sequelize, Sequelize.DataTypes);
    const updatedAssetProduct = await AssetProduct.update(Asset_Product, {
      where: { UTD: UTD },
      transaction: t,
      returning: true,
    });

    // Update or create Product Services
    const ProductService = _Product_Service(sequelize, Sequelize.DataTypes);
    const updatedProductServices = await Promise.all(
      ProductServices.map((service) => {
        if (service.UTD) {
          return ProductService.update(service, {
            where: { UTD: service.UTD },
            transaction: t,
          });
        } else {
          return ProductService.create(
            {
              ...service,
              Asset_Product: UTD, // Associate new service with the updated Asset Product UTD
            },
            {
              transaction: t,
            }
          );
        }
      })
    );
    if (req.body.extrafield && !isEmptyObject(req.body.extrafield)) {
      const Product_Extra = _Product_Extra(sequelize, Sequelize.DataTypes);
      if (extrafieldutd) {
        await Product_Extra.update(extrafield, {
          where: { UTD: extrafieldutd },
          transaction: t,
        });
      } else {
        await Product_Extra.create(
          {
            ...extrafield,
            Asset_Product: UTD,
          },
          {
            transaction: t,
          }
        );
      }
    }
    // Update or create Product Finance if it exists
    let updatedProductFinance = null;
    if (Product_Finance) {
      const ProductFinance1 = _Product_Finance(sequelize, Sequelize.DataTypes);
      if (Product_Finance.UTD) {
        // Create an object excluding UTD from Product_Finance
        const updatableFields = { ...Product_Finance };
        delete updatableFields.UTD; // Remove UTD from the fields to be updated

        // Perform the update using the filtered fields
        updatedProductFinance = await ProductFinance1.update(updatableFields, {
          where: { UTD: Product_Finance.UTD }, // Use UTD for identifying the record
          transaction: t,
        });

        console.log("currently this is Update");
      } else {
        updatedProductFinance = await ProductFinance1.create(
          {
            ...Product_Finance,
            Asset_Product: UTD, // Associate finance data with the updated Asset Product UTD
          },
          {
            transaction: t,
          }
        );
      }
    }

    // Update or create Product Vendor if it exists
    let updatedProductVendor = null;
    if (Product_Vendor) {
      const ProductVendor1 = _Product_Vendor(sequelize, Sequelize.DataTypes);
      if (Product_Vendor.UTD) {
        updatedProductVendor = await ProductVendor1.update(Product_Vendor, {
          where: { UTD: Product_Vendor.UTD },
          transaction: t,
        });
      } else {
        updatedProductVendor = await ProductVendor1.create(
          {
            ...Product_Vendor,
            Asset_Product: UTD, // Associate vendor data with the updated Asset Product UTD
          },
          {
            transaction: t,
          }
        );
      }
    }

    await sequelize.query(
      `update product_history set tran_date='${General.Due_Date ? General.Due_Date : new Date().toISOString().slice(0, 10)}' where asset_id=${UTD} and tran_type=1`
    );

    if (updatedAssetProduct.End_Date) {
      const nextDueDate = new Date(updatedAssetProduct.End_Date); // Convert to a Date object
      const validityDate = new Date(nextDueDate); // Clone the date to avoid modifying the original
      // Add 1 day to the cloned date for validity
      validityDate.setDate(validityDate.getDate() + 1);
      const formattedValidity = validityDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      await sequelize.query(
        `update Reminder_Asset set date='${updatedAssetProduct.End_Date}',validity='${formattedValidity}' where Asset=${UTD} and reminder_name='AMC Expiry'`
      );
    }
    if (Product_Finance && Product_Finance.Warrent_End) {
      const nextDueDate = new Date(Product_Finance.Warrent_End)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "); // Convert to a Date object
      const validityDate = new Date(nextDueDate); // Clone the date to avoid modifying the original
      // Add 1 day to the cloned date for validity
      validityDate.setDate(validityDate.getDate() + 1);
      const formattedValidity = validityDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      await sequelize.query(
        `update Reminder_Asset set date='${nextDueDate}',validity='${formattedValidity}' where Asset=${UTD} and reminder_name='Warranty Expiry'`
      );
    }

    await t.commit();

    if (req.body.Attachments) {
      const Attachments = JSON.stringify(req.body.Attachments);
      await sequelize.query(
        `update asset_product set Attachments='${Attachments}' where utd=${UTD}`
      );
    }
    res.status(200).send("Updated Successfully");
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback();
    }
    res.status(500).json({ error: "An error occurred during Updating." });
  }
};

exports.assetview = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Asset_Type = req.body.Asset_Type;
  try {
    const result = await sequelize.query(`SELECT 
        ag.Id AS Asset_Id,
        ag.name AS Asset_Name,
        ag.icon AS Asset_Icon,
        sc.Id AS Subcategory_Id,
        sc.common As common,
        sc.name AS Subcategory_Name,
        sc.icon AS Subcategory_Icon,
        sc.series as Subcategory_series,
        sc.AMC as Subcategory_AMC,
        sc.Depreciation_Method as Subcategory_Depreciation_Method,
        ag.DPRATE as DPRATE,
        sc.UOM AS UOM,
        sc.HSN AS HSN,
        sc.itemType AS itemType
    FROM 
        Assets_Group ag
    LEFT JOIN 
       Assets_Group_Subcategory sc ON ag.Id = sc.Group_Id
       where  ag.Asset_Type = ${Asset_Type}
    ORDER BY 
        sc.Id;`);

    const fixedAssets = [];
    const assetMap = new Map();

    result[0].forEach((row) => {
      const assetId = row.Asset_Id;

      if (!assetMap.has(assetId)) {
        const asset = {
          id: assetId,
          name: row.Asset_Name,
          icon: row.Asset_Icon,
          DPRATE: row.DPRATE,
          subcategories: [],
        };
        assetMap.set(assetId, asset);
        fixedAssets.push(asset);
      }

      if (row.Subcategory_Id) {
        assetMap.get(assetId).subcategories.push({
          id: row.Subcategory_Id,
          name: row.Subcategory_Name,
          icon: row.Subcategory_Icon,
          Series: row.Subcategory_series,
          AMC: row.Subcategory_AMC,
          common: row.common,
          UOM: row.UOM,
          HSN: row.HSN,
          itemType: row.itemType,
          Depreciation_Method: row.Subcategory_Depreciation_Method,
        });
      }
    });
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: fixedAssets,
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

exports.Productview = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Group_id = req.body.Group_id;
  const loc_code = req.body.loc_code;
  try {
    const result = await sequelize.query(`WITH AvailableAssets AS (
    SELECT 
        utd AS id, 
        name,
        icon, 
        Category AS Group_Id,
        Subcategory AS SubGroup_Id,
        (select top 1 utd from Asset_Pooling_Reallocation where Asset_Pooling_Reallocation.Asset_Product=Asset_Product.UTD)as Pooled_asset,
        (
            SELECT
                SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) + 
                SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +          
                SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +          
                SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) - 
                SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) - 
                SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) - 
                SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) 
                
            FROM
                Product_History
            WHERE
                Product_History.Asset_ID = Asset_Product.UTD
                AND Source_Location IN (${loc_code})
        ) AS Available
    FROM 
        Asset_Product 
    WHERE 
        Subcategory = '${Group_id}'
)
SELECT 
    id, 
    name, 
    icon, 
    Group_Id, 
    SubGroup_Id, 
    Available,
    Pooled_asset
FROM 
    AvailableAssets
`);

    // WHERE
    //     Available > 0;
    // const result =
    //   await sequelize.query(`select utd as id,assets_model as name,icon,asset_category as Category,asset_subcategory as Subcategroy,Group_Id,SubGroup_Id from assets_product where subgroup_id = '${Group_id}' and Loc_Code = '${loc_code}'`);
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
async function uploadImage2(files, Comp_Code, Created_by) {
  try {
    let dataArray = [];
    // console.log(files);
    await Promise.all(
      files?.map(async (file, index) => {
        const customPath = `${Comp_Code}/AssetImage/`;
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

exports.uploadedImage = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
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

exports.uploadedsubImage = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    try {
      if (req.files) {
        const EMP_DOCS_data = await uploadImage2(
          req.files,
          req.headers.compcode.split("-")[0],
          req.body.name
        );
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

exports.Updatecategory = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Id = req.body.id;
  const name = req.body.name;
  const icon = req.body.icon ? `'${req.body.icon}'` : "icon";
  const DPRATE = req.body.DPRATE;
  try {

    const NameNew = name.trim();

    const existingRecord = await sequelize.query(
      `SELECT id FROM Assets_Group WHERE name = '${NameNew}' and id != '${Id}'`
    );

    if (existingRecord[0].length > 0) {
      return res.status(400).send({
        success: false,
        Message: `The Category '${NameNew}' already exists.`,
      });
    }
    await sequelize.query(
      `update Assets_Group set name = '${name}',DPRATE=${
        DPRATE ? DPRATE : null
      }, icon = ${icon ? icon : "icon"} where id = '${Id}'`
    );
    const result1 = await sequelize.query(
      `select id,* from Assets_Group where id ='${Id}'`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result1[0][0],
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

exports.Updatesubcategory = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "kakaka");
  const Id = req.body.id;
  const name = req.body.name;
  const Icon = req.body.icon ? `'${req.body.icon}'` : null;
  const Series = req.body.Series;
  const AMC = req.body.AMC;
  const common = req.body.common;
  const Depreciation_Method = req.body.Depreciation_Method;
  const UOM = req.body.UOM;
  const itemType = req.body.itemType;
  const HSN = req.body.HSN;
  try {

    const NameNew = name.trim();

    const existingRecord = await sequelize.query(
      `SELECT id FROM Assets_Group_Subcategory WHERE name = '${NameNew}' and id != '${Id}'`
    );

    if (existingRecord[0].length > 0) {
      return res.status(400).send({
        success: false,
        Message: `The Subcategory '${NameNew}' already exists.`,
      });
    }

    await sequelize.query(
      `update Assets_Group_Subcategory set name = '${name}' , icon =${Icon ? Icon : "icon"
      }, AMC = ${AMC ? 1 : null} ,common = ${common ? 1 : null
      } , Depreciation_Method = ${Depreciation_Method ? `'${Depreciation_Method}'` : null
      },UOM=${UOM ? `'${UOM}'` : null
      },itemType=${itemType ? `'${itemType}'` : null
      },HSN=${HSN ? `'${HSN}'` : null
      } where id = '${Id}'`
    );
    const isAdded = await sequelize.query(
      `select * from asset_product  where  subcategory='${Id}'`
    );

    if (isAdded[0].length == 0) {
      await sequelize.query(
        `update Assets_Group_Subcategory set Series=${
          Series ? 1 : null
        }  where id = '${Id}'`
      );
    }

    const result1 = await sequelize.query(
      `select id,* from Assets_Group_Subcategory where id ='${Id}'`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result1[0][0],
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

exports.Subcategory = async function (req, res) {
  const { error, value: assetsGroupSubcategorydata } =
    assetsGroupSubcategorySchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    try {
      const sequelize = await dbname(req.headers.compcode);
      const AssetsGroupSubcategory = _AssetGroupSubcategory(
        sequelize,
        DataTypes
      );

      assetsGroupSubcategorydata.name = assetsGroupSubcategorydata.name.trim();

      const existingRecord = await AssetsGroupSubcategory.findOne({
        where: { name: assetsGroupSubcategorydata.name },
      });

      if (existingRecord) {
        return res.status(400).send({
          success: false,
          Message: `The Subcategory '${assetsGroupSubcategorydata.name}' already exists.`,
        });
      }

      const t = await sequelize.transaction();
      const AssetsGroupSubcategory1 = await AssetsGroupSubcategory.create(
        assetsGroupSubcategorydata,
        {
          transaction: t,
          return: true,
        }
      );
      await t.commit();
      const result = await sequelize.query(
        `select id, name, Created_by, Group_Id, icon,Series, AMC, Depreciation_Method,common from Assets_Group_Subcategory where id = '${AssetsGroupSubcategory1.Id}'`
      );
      res.status(200).send(result[0][0]);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred during Saving." });
    }
  }
};

exports.inserData = async function (req, res) {
  console.log(req.body, "req.body");
  const { error, value: AssetGroupdata } = assetsGroupSchema.validate(
    req.body,
    {
      abortEarly: false,
      stripUnknown: true,
    }
  );
  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  } else {
    console.log(AssetGroupdata, "AssetGroupdata");
    try {
      const sequelize = await dbname(req.headers.compcode);
      const AssetGroup = _AssetGroup(sequelize, DataTypes);

      AssetGroupdata.name = AssetGroupdata.name.trim();

      const existingRecord = await AssetGroup.findOne({
        where: { name: AssetGroupdata.name },
      });

      if (existingRecord) {
        return res.status(400).send({
          success: false,
          Message: `The Category '${AssetGroupdata.name}' already exists.`,
        });
      }
      const t = await sequelize.transaction();
      const AssetGroup1 = await AssetGroup.create(AssetGroupdata, {
        transaction: t,
        return: true,
      });
      await t.commit();
      const result = await sequelize.query(
        `select id, name, Created_by, Asset_Type,DPRATE, icon from assets_group where id = '${AssetGroup1.Id}'`
      );
      res.status(200).send(result[0][0]);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred during Saving." });
    }
  }
};


exports.saveAssetTemplate = async function (req, res) {
  const columns = req.body.columns;
  const TemplateName = req.body.Template_Id;
  const Created_By = req.body.Created_By;
  try {
    const sequelize = await dbname(req.headers.compcode);
    const t = await sequelize.transaction();
    try {
      const AssetTemplate = _AssetTemplate(sequelize, DataTypes);
      await sequelize.query(
        `delete from  asset_template where Template_ID = '${TemplateName}' and export_type < 3`
      );
      const columns1 = [];
      let tableFieldCounter = 1; // Counter for generating unique table fields
      let data = [];
      columns.forEach((item, index) => {
        const tableField = columns1.some((column) => column === item.Field_Name)
          ? item.Field_Name
          : `F_${tableFieldCounter}`;

        // Increment the counter for the next iteration
        if (tableField.startsWith("F_")) {
          tableFieldCounter++;
        }
        data.push({
          Created_By: Created_By,
          Template_Id: TemplateName,
          Export_type: 1,
          Table_field: tableField,
          ...item,
        });
      });
      console.log(data);
      await AssetTemplate.bulkCreate(data, { transaction: t });
      t.commit();
      const template1 = await sequelize.query(
        `select distinct Template_Id as id from asset_template where export_type < 3`
      );
      return res.status(200).send({ status: true, data: template1[0] });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: false, Message: "Internal Server Error" });
    }
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};

exports.EditTemplate = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    try {
      const template = await sequelize.query(
        `select UTD, Field_Name	,Field_Type,	Field_Req,	Field_Attr,Table_field from asset_template where template_id = ${req.body.id}`
      );
      return res.status(200).send({ status: true, data: template[0] });
    } catch (e) {
      console.log(e);
      return res
        .status(500)
        .send({ status: false, Message: "Internal Server Error" });
    }
  } catch (e) {
    console.log(e);
    return res
      .status(500)
      .send({ status: false, Message: "Internal Server Error" });
  }
};

exports.branch = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { branch, product, subcategory, category } = req.body;
  try {
    const t = await sequelize.transaction();
    let subcategory_data;
    let formdata;
    let pooling;
    let product_data;
    const branchdata = await sequelize.query(
      `select godw_code as value, godw_name as label from godown_mst where godw_code in (${branch}) and export_type< 3`,
      { transaction: t }
    );
    const templete = await sequelize.query(
      `select UTD	,	Field_Name,	Field_Type,	Field_Req,	Field_Attr,	Table_field from Asset_Template where Template_Id=${category}`
    );
    const assets = await sequelize.query(
      `select id as value,name as label from Assets_Group`
    );
    if (category)
      subcategory_data = await sequelize.query(
        `select id as value,name as label from Assets_Group_Subcategory where Group_Id=${category}`
      );
    if (product) {
      product_data = await sequelize.query(
        `select UTD,	Name,	Icon,	Category,	Subcategory, MRP, Price, Min_Qty,	Location,	Manufacturer,	Model,	Purchase_Date,	Purchase_value,	Description,	Serial_No,	Asset_Status,	Asset_Nature,	Notes,	Life_Span,ITEM_TYPE,	Depreciation_Method,residualValue,	totalUnits,	unitsProduced,Due_Date,QRCode,BarCode,Qty,
        Amc_Vendor,Unit_Rate, Amc_Value, CAST(Start_Date AS DATE) AS Start_Date, CAST(End_Date AS DATE) AS End_Date, AssetCode,Characteristics,
        (
          SELECT 
          SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${branch}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${branch}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${branch}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${branch}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${branch}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${branch}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${branch}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${branch}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${branch}) THEN Quantity ELSE 0 END) 
          
          FROM 
              Product_History
          WHERE 
              Product_History.Asset_ID = Asset_Product.UTD 
              AND Source_Location in (${branch})
      ) AS Available
        from asset_product where utd=${product}`
      );
      const finance = await sequelize.query(`
      SELECT UTD, Vendor, Purchase_Price, Purchase, Ac_Code, Market_value,
       In_Service, 
       Po_No,
       Scrap_Value, Warrent_End, Asset_Product,
       (SELECT TOP 1 Document 
        FROM Purchase_Order 
        WHERE UTD = REPLACE(Po_No, 
                            (SELECT TOP 1 Prefix_Code 
                             FROM Prefix_Name 
                             WHERE Prefix_Name = 'Purchase Order'), '')) AS Document
FROM Product_Finance 
WHERE Asset_Product = ${product}
        `);
      const vendor = await sequelize.query(`
select UTD,	Vendor_Name,Invoice_No,	Vendor_Number,	Contact_Name,	
Email,	Phone_No,	Asset_Product,city,address,
(select top 1 Document from PurchaseEntryMst where INV_NO = Product_Vendor.Invoice_No) as Document from Product_Vendor where asset_product=${product}      
      `);
      const service = await sequelize.query(`
select UTD,	CAST(Service_Date AS DATE) AS Service_Date,	Description,	Part_Amount,	Labour_Amount,	Asset_Product	,CAST(NextDue_Date AS DATE) AS NextDue_Date, Document from Product_Service where asset_product=${product}      `);
      const Attachments = await sequelize.query(
        `select Attachments from asset_product where utd=${product}`
      );
      const Issue = await sequelize.query(`SELECT 
    CAST(Product_Issue.Req_Date AS DATE) AS Req_Date,
    (SELECT TOP 1 CONCAT(EMPLOYEEMASTER.empfirstname, ' ', EMPLOYEEMASTER.emplastname)
     FROM EMPLOYEEMASTER 
     WHERE EMPLOYEEMASTER.empcode = Product_Issue.EmpCode) AS Employee,
    Product_Issue.issuedDate,
    (SELECT TOP 1 GODOWN_MST.godw_name 
     FROM GODOWN_MST 
     WHERE GODOWN_MST.Godw_Code = Product_Issue.Location) AS Branch,
    Product_Issue.Reason,
    Product_Issue.RevokeDate,
    Product_Issue.Revoke_Reason,
    Product_Issue.issuedDate,
	Product_Issue_Dtl.Asset_Issue_Qty

FROM 
    Product_Issue
INNER JOIN 
    Product_Issue_Dtl 
ON 
    Product_Issue_Dtl.product_issue = Product_Issue.tran_id
	where Product_Issue_Dtl.Asset_Product=${product}`);

      const extrafield = await sequelize.query(
        `select UTD,F_1,	F_2	,F_3	,F_4	,F_5	,F_6	,F_7	,F_8	,F_9	,F_10 from product_extra where Asset_Product=${product} `
      );

      pooling = await sequelize.query(
        `select utd from Asset_Pooling_Reallocation where Asset_Product=${product}`
      );
      formdata = {
        General: product_data[0][0],
        Attachments: Attachments[0][0].Attachments
          ? JSON.parse(Attachments[0][0].Attachments)
          : [],
        Finance: finance[0][0],
        Vendor: vendor[0][0],
        Service: service[0],
        templete: templete[0] || [],
        extrafield: extrafield[0][0] || null,
        Issue: Issue[0],
        pooling: pooling[0].length > 0 ? pooling[0] : [],
      };
      if (typeof formdata.General.unitsProduced === "string") {
        try {
          formdata.General.unitsProduced = JSON.parse(
            formdata.General.unitsProduced
          );
        } catch (error) {
          console.error("Failed to parse unitsProduced:", error);
          formdata.General.unitsProduced = []; // Set to an empty array or handle the error as needed
        }
      }
    }

    const UOM = await sequelize.query(
      `SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`
    );
    res.status(200).send({
      branchdata: branchdata[0],
      assets: assets[0],
      subcategory_data: subcategory_data ? subcategory_data[0] : [],
      product_data: product_data ? product_data[0][0] : [],
      formdata: formdata ? formdata : null,
      templete: templete[0],
      UOM: UOM[0],
      extrafield: {},
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.findsubcategory = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const { category } = req.body;
  console.log(category, "category");
  try {
    const t = await sequelize.transaction();
    const data = await sequelize.query(
      `select id as value,name as label,Series,AMC, Depreciation_Method from Assets_Group_Subcategory where Group_Id=${category}`,
      { transaction: t }
    );
    const Asset_Type = await sequelize.query(`
     select Asset_Type  from Assets_Group where Id=${category}`);
    res
      .status(200)
      .send({ data: data[0], Asset_Type: Asset_Type[0][0].Asset_Type });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.paymentmode = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const asset = req.body.asset;
  const UTD = req.body.UTD;
  const Location = req.body.Location;
  try {
    let ItemName;
    let VendorName;
    let PoNumber;
    let result1;
    let assets;
    let purchase_requestData;
    let purchase_request_Dtl_Data;
    let AssetSubcategory;
    let Asset_Type;
    let assetproductforpurchaseorder;
    const Location1 = req.body.Location1;
    const Location = req.body.Location;

    const branch = await sequelize.query(
      `select godw_code as value,godw_Name as label from godown_mst where export_type<3`
    );
    if (asset) {
      if (req.body.Req) {
        ItemName = await sequelize.query(`
        select id as value, name as label,Group_Id,
        (
          SELECT 
          SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) 
          FROM 
              Product_History
          WHERE 
              Product_History.subcategory = Assets_Group_Subcategory.id 
              AND Source_Location in (${Location})
      ) AS Available_Quantity
        from Assets_Group_Subcategory`);
        VendorName =
          await sequelize.query(`SELECT utd as value, Vendor_Name as label 
          FROM Product_Vendor 
          WHERE asset_product IN (SELECT utd FROM Asset_Product WHERE category = '${asset}')`);
      } else {
        assetproductforpurchaseorder =
          await sequelize.query(`select CAST(utd AS VARCHAR) as value, name as label, Subcategory, 
            (
          SELECT 
          SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) 
          
          FROM 
              Product_History
          WHERE 
              Product_History.Asset_ID = Asset_Product.UTD 
              AND Source_Location = '${Location1}'
      ) AS Available_Quantity from Asset_Product where Category = '${asset}'`);

        ItemName =
          await sequelize.query(`select vendor_code from product_vendor where asset_product in
               (select UTD from Asset_Product where Category = '${asset}')`);

        AssetSubcategory = await sequelize.query(`
        SELECT 
    COALESCE(Purchase_Value, 0) - 
    SUM(COALESCE(Purchase_Request, 0) + COALESCE(Purchase_Order, 0) + COALESCE(Purchase_entry, 0)) AS final_value, 
    *
FROM (
    SELECT 
        AMP.Purchase_Value,
        (SELECT SUM(Total_Price)
         FROM Asset_Request_Dtl 
         WHERE Asset_Request_Dtl.Subcategory = AGS.Id 
           AND Fin_Appr = 1 
           AND Request_Id IN (
                SELECT tran_id 
                FROM Asset_Request 
                WHERE MONTH(Req_Date) = MONTH(GETDATE()) 
                  AND YEAR(Req_Date) = YEAR(GETDATE())
				  and tran_id is not null
           ) 
           AND tran_id NOT IN (
                SELECT PurchaseRequest_UTD 
                FROM Purchase_Order_Product_Details where PurchaseRequest_UTD is not null and Purchase_Id in (
				select Utd from Purchase_Order where Fin_Appr=1)
           )
        ) AS Purchase_Request,
        (SELECT SUM(Total_Price) 
         FROM Purchase_Order_Product_Details 
         WHERE Purchase_Order_Product_Details.Subcategory = AGS.Id 
           AND Purchase_Id IN (
                SELECT Utd 
                FROM Purchase_Order 
                WHERE Fin_Appr = 1 
                  AND MONTH(Req_Date) = MONTH(GETDATE()) 
                  AND YEAR(Req_Date) = YEAR(GETDATE())
				  and utd is not null
           ) 
           AND Utd NOT IN (
                SELECT popd 
                FROM PurchaseEntryDtl 
                WHERE Subcategory = AGS.Id
				and POPD is not null
           )
        ) AS Purchase_Order,
        (SELECT SUM(inv_amt) 
         FROM PurchaseEntryDtl 
         WHERE SubCategory = AGS.Id 
           AND TRAN_ID IN (
                SELECT TRAN_ID 
                FROM PurchaseEntryMst 
                WHERE MONTH(VOUCHER_DATE) = MONTH(GETDATE()) 
                  AND YEAR(VOUCHER_DATE) = YEAR(GETDATE())
           )
        ) AS Purchase_entry,
        name AS label,
        CAST(AGS.id AS VARCHAR) AS value,
        Group_Id,
        Series
    FROM 
        Assets_Group_Subcategory AGS
    LEFT JOIN 
        Asset_MonthWise_PurchaseValue AMP 
    ON 
        AMP.SubcategoryId = AGS.Id 
        AND AMP.Month = MONTH(GETDATE())
		 where AGS.Group_Id in (${asset})
) AS Ab 
GROUP BY 
    Purchase_Value, label, value, Group_Id, Series,purchase_request,Purchase_Order,Purchase_entry
`);
      }
      VendorName =
        await sequelize.query(`SELECT utd as value, Vendor_Name as label 
  FROM Product_Vendor 
  WHERE asset_product IN (SELECT utd FROM Asset_Product WHERE category = '${asset}')`);

      Asset_Type = await sequelize.query(`
    select Asset_Type  from Assets_Group where Id=${asset}`);
    } else {
      assets = await sequelize.query(
        `select id as value,name as label from Assets_Group`
      );

      if (req.body.Req) {
        PoNumber = await sequelize.query(
          `SELECT 
      (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(ISNULL(MAX(utd) + 1, 1) AS VARCHAR) AS PoNumber
    FROM Purchase_Request`
        );
      } else {
        PoNumber = await sequelize.query(
          `SELECT 
          (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(ISNULL(MAX(utd) + 1, 1) AS VARCHAR) AS PoNumber
        FROM Purchase_Order;`
        );
      }

      result1 = await sequelize.query(
        `SELECT Misc_Code AS value, Misc_Name AS label 
         FROM misc_mst 
         WHERE misc_type = 39 
           AND export_type < 3`
      );
      ItemName = await sequelize.query(`
        select id as value, name as label,Group_Id from Assets_Group_Subcategory`);
      if (Location) {
        ItemName = await sequelize.query(`
        SELECT 
        id AS value, 
        name AS label, 
        Group_Id,
        (
            SELECT 
            SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)+
            SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
			      SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)-
            SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) 
            
           FROM 
                Product_History
            WHERE 
                Product_History.SubCategory = Assets_Group_Subcategory.Id 
                AND Source_Location = '${Location}'
        ) AS Available_Quantity
    FROM 
        Assets_Group_Subcategory`);
      }
      if (UTD) {
        purchase_requestData = await sequelize.query(
          `select UTD,
              (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(purchase_request.UTD AS VARCHAR) AS Po,
          cast(Req_Date as date)as Req_Date,Contact_Number,Email,Address,City,State,Asset_Category,Location,LocationTo from purchase_request where utd=${UTD}`
        );
        const purchaseRequestDetails = await sequelize.query(
          `SELECT 
          UTD,
          Item,
          Item_Description,
          Quantity,
          Issue_Quantity,
          Unit_Price,
          Total_Price,
          Discount,
          Asset_Category,
          Location,
      
          (
              SELECT 
                  
              SUM(CASE WHEN Tran_Type = 1  THEN Quantity ELSE 0 END)+
                SUM(CASE WHEN Tran_Type = 2  THEN Quantity ELSE 0 END) +
                SUM(CASE WHEN Tran_Type = 4  THEN Quantity ELSE 0 END) +
                SUM(CASE WHEN Tran_Type = 5  THEN Quantity ELSE 0 END)+
                SUM(CASE WHEN Tran_Type = 9  THEN Quantity ELSE 0 END)-
                SUM(CASE WHEN Tran_Type = 3  THEN Quantity ELSE 0 END)-
                SUM(CASE WHEN Tran_Type = 6  THEN Quantity ELSE 0 END)-
                SUM(CASE WHEN Tran_Type = 7  THEN Quantity ELSE 0 END)-
                SUM(CASE WHEN Tran_Type = 8  THEN Quantity ELSE 0 END)
              FROM Product_History PH
              WHERE PH.SubCategory = PRPD.Item
                AND PH.Source_Location = PRPD.Location
          ) AS Available_Quantity,
          (SELECT TOP 1 Asset_Type 
           FROM Assets_Group AG
           WHERE AG.id = PRPD.Asset_Category
          ) AS Asset_Type
      FROM 
          Purchase_Req_Product_Details PRPD where PRPD.Purchase_Id=${UTD}`
        );
        purchase_request_Dtl_Data = purchaseRequestDetails[0];
        ItemName = await sequelize.query(`
          select id as value, name as label,Group_Id from Assets_Group_Subcategory`);
      }
    }
    const UOM = await sequelize.query(
      `SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`
    );

    res.status(200).send({
      PoNumber:
        PoNumber && PoNumber.length > 0 && PoNumber[0].length > 0
          ? PoNumber[0][0].PoNumber
          : [],
      result1: result1 ? result1[0] : [],
      asset: assets ? assets[0] : [],
      VendorName: VendorName ? VendorName[0] : [],
      Item: ItemName ? ItemName[0] : [],
      purchase_requestData: purchase_requestData
        ? purchase_requestData[0][0]
        : [],
      purchase_request_Dtl_Data: purchase_request_Dtl_Data
        ? purchase_request_Dtl_Data
        : [],
      AssetSubcategory: AssetSubcategory ? AssetSubcategory[0] : [],
      branch: branch[0],
      Asset_Type: Asset_Type ? Asset_Type[0][0] : [],
      assetproductforpurchaseorder: assetproductforpurchaseorder
        ? assetproductforpurchaseorder[0]
        : [],
      UOM: UOM[0],
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.VendorName = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Asset_Type = req.body.Asset_Type;
  try {
    const result = await sequelize.query(`SELECT 
       UTD as value, Vendor_Name as  label from Product_Vendor`);

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

exports.VendorDetails = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "requesttt");
  const UTD = req.body.UTD;
  try {
    const result = await sequelize.query(`
      SELECT  
      UTD	as Vendor_Name,	Vendor_Number,	Contact_Name,	Email,	Phone_No,	Asset_Product,		city,	address from Product_Vendor where UTD = '${UTD}'`);

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

exports.purchaseRequest = async function (req, res) {
  console.log(req.body, "req.body");
  const { Po, ...otherpurchaseRequest } = req.body.purchaseRequest;
  const { error: requestError, value: purchaseRequestData } =
    purchaseRequestSchema.validate(otherpurchaseRequest);
  const { error: productError, value: purchaseReqProductDetails } = Joi.array()
    .items(purchaseReqProductDetailsSchema)
    .validate(req.body.PurchaseReqProductDetails, {
      abortEarly: false,
      stripUnknown: true,
    });

  if (requestError || productError) {
    const errors = (requestError ? requestError.details : []).concat(
      productError ? productError.details : []
    );
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }
  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();

    // Create PurchaseRequest
    const purchaseRequest = _Purchase_Request(sequelize, Sequelize.DataTypes);
    const purchaseRequest1 = await purchaseRequest.create(purchaseRequestData, {
      transaction: t,
      return: true,
    });
    // Create PurchaseReqProductDetails associated with PurchaseRequest
    const ProductDetail = _Purchase_Req_Product_Details(
      sequelize,
      Sequelize.DataTypes
    );
    const createdProductDetail = await Promise.all(
      purchaseReqProductDetails.map((product) => {
        return ProductDetail.create(
          {
            ...product,
            Purchase_Id: purchaseRequest1.UTD, // Assuming UTD is the identifier for PurchaseRequest
          },
          {
            transaction: t,
            returning: true,
          }
        );
      })
    );

    // Prepare response

    if (req.body.isBranchTransfer) {
      const purchase_Req_Product_Details_Dtl =
        _purchase_Req_Product_Details_Dtl(sequelize, Sequelize.DataTypes);
      const Product_History = _Product_Histroy(sequelize, Sequelize.DataTypes);
      for (const item of req.body.PurchaseReqProductDetails) {
        if (item.IssuedAsset) {
          const dtlasset = item.IssuedAsset;
          console.log(item.IssuedAsset, "item.IssuedAsset");
          for (const assetId of dtlasset) {
            try {
              const data = await sequelize.query(
                `select subcategory,category from asset_product where utd='${assetId.UTD}'`
              );
              await purchase_Req_Product_Details_Dtl.create(
                {
                  Purchase_Req: purchaseRequest1.UTD,
                  Asset_Product: assetId.UTD,
                  Asset_Issue_Qty: assetId.issue_qty,
                  Purchase_Req_Product: item.UTD,
                  Created_By: req.headers.name,
                },
                {
                  transaction: t,
                }
              );
              await Product_History.create(
                {
                  Asset_ID: assetId.UTD,
                  Quantity: assetId.issue_qty,
                  Tran_Type: 2, // 2 for Issued
                  Created_By: req.headers.name,
                  Source_Location: item.Location,
                  Destination_Location: purchaseRequest1.Location,
                  Category: data[0][0].category,
                  SubCategory: data[0][0].subcategory,
                  Tran_Date: purchaseRequest1.Tran_Date,
                },
                { transaction: t }
              );
              await Product_History.create(
                {
                  Asset_ID: assetId.UTD,
                  Quantity: assetId.issue_qty,
                  Tran_Type: 7, // 2 for Issued
                  Created_By: req.headers.name,
                  Source_Location: purchaseRequest1.Location,
                  Destination_Location: item.Location,
                  Category: data[0][0].category,
                  SubCategory: data[0][0].subcategory,
                  Tran_Date: purchaseRequest1.Tran_Date,
                },
                { transaction: t }
              );
            } catch (err) {
              console.error(`Error creating DTl for Issued :`, err);
              throw err;
            }
          }
        }
      }
    }
    await t.commit();
    const response = {
      success: true,
      purchaseRequest: purchaseRequest1,
      PurchaseReqProductDetails: createdProductDetail,
    };

    res.status(200).json(response);
  } catch (err) {
    if (t) await t.rollback(); // Rollback transaction if an error occurred
    console.error(err);
    res.status(500).json({ error: "Failed to create purchase request" });
  }
};

exports.purchaseOrder = async function (req, res) {
  console.log(req.body);
  const {
    Po,
    Vendor_Phone_No,
    Vendor_Address,
    Vendor_Email,
    Vendor_Name,
    Vendor_Contact_Name,
    ...other
  } = req.body.purchaseOrder;
  const { error: requestError, value: purchaseOrderdata } =
    purchaseOrderSchema.validate(other);

  const { error: productError, value: purchaseOrderProductDetails } =
    Joi.array()
      .items(purchaseOrderProductDetailsSchema)
      .validate(req.body.PurchaseOrderProductDetails, {
        abortEarly: false,
        stripUnknown: true,
      });

  if (requestError || productError) {
    const errors = (requestError ? requestError.details : []).concat(
      productError ? productError.details : []
    );
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }

  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();

    const IsApproval = await sequelize.query(
      `select * from approval_matrix where empcode='${purchaseOrderdata.srm}' and module_code='asset'`,
      {
        transaction: t,
      }
    );
    purchaseOrderdata.Fin_Appr = IsApproval[0].length > 0 ? null : 1;
    // Create PurchaseOrder
    const purchaseOrder = _Purchase_Order(sequelize, Sequelize.DataTypes);
    const purchaseOrder1 = await purchaseOrder.create(purchaseOrderdata, {
      transaction: t,
      return: true,
    });

    // Create PurchaseReqProductDetails associated with PurchaseRequest
    const ProductDetail = _Purchase_Order_Product_Details(
      sequelize,
      Sequelize.DataTypes
    );
    const createdProductDetail = await Promise.all(
      purchaseOrderProductDetails.map((product) => {
        return ProductDetail.create(
          {
            ...product,
            Purchase_Id: purchaseOrder1.UTD,
           
          },
          {
            transaction: t,
            returning: true,
          }
        );
      })
    );

    await t.commit();
    const PoNumber = await sequelize.query(
      `SELECT 
      (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(ISNULL(MAX(utd) + 1, 1) AS VARCHAR) AS PoNumber
    FROM Purchase_Order;`
    );

    // Prepare response
    const response = {
      success: true,
      purchaseOrder: purchaseOrder1,
      PurchaseOrderProductDetails: createdProductDetail,
      PoNumber: PoNumber[0][0].PoNumber,
    };

    res.status(200).json(response);
  } catch (err) {
    // if (t) await t.rollback(); // Rollback transaction if an error occurred
    console.error(err);
    res.status(500).json({ error: "Failed to create purchase request" });
  }
};


exports.updatepurchaseRequest = async function (req, res) {
  const { UTD, Po, ...purchaseRequest } = req.body.purchaseRequest;
  const { error: requestError, value: purchaserequestdata } =
    purchaseRequestSchema.validate(purchaseRequest);
  const { error: productError, value: purchaseReqProductDetails } = Joi.array()
    .items(purchaseReqProductDetailsSchema)
    .validate(req.body.PurchaseReqProductDetails, {
      abortEarly: false,
      stripUnknown: true,
    });

  if (requestError || productError) {
    const errors = (requestError ? requestError.details : []).concat(
      productError ? productError.details : []
    );
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }
  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    const purchaseRequest = _Purchase_Request(sequelize, Sequelize.DataTypes);
    const purchaseRequest1 = await purchaseRequest.update(purchaserequestdata, {
      where: { UTD: UTD },
      transaction: t,
      returning: true,
    });
    const ProductDetail = _Purchase_Req_Product_Details(
      sequelize,
      Sequelize.DataTypes
    );
    await Promise.all(
      purchaseReqProductDetails.map((product) => {
        return ProductDetail.update(product, {
          where: { UTD: product.UTD },
          transaction: t,
        });
      })
    );
    // return
    const purchase_Req_Product_Details_Dtl = _purchase_Req_Product_Details_Dtl(
      sequelize,
      Sequelize.DataTypes
    );
    const Product_History = _Product_Histroy(sequelize, Sequelize.DataTypes);
    for (const item of req.body.PurchaseReqProductDetails) {
      if (item.IssuedAsset) {
        const dtlasset = item.IssuedAsset;
        for (const assetId of dtlasset) {
          try {
            const data = await sequelize.query(
              `select subcategory,category from asset_product where utd='${assetId.UTD}'`
            );
            await purchase_Req_Product_Details_Dtl.create(
              {
                Purchase_Req: UTD,
                Asset_Product: assetId.UTD,
                Asset_Issue_Qty: assetId.issue_qty,
                Purchase_Req_Product: item.UTD,
                Created_By: req.headers.name,
              },
              {
                transaction: t,
              }
            );
            await Product_History.create(
              {
                Asset_ID: assetId.UTD,
                Quantity: assetId.issue_qty,
                Tran_Type: 2, // 2 for Issued
                Created_By: req.headers.name,
                Source_Location: purchaserequestdata.Location,
                Destination_Location: purchaserequestdata.LocationTo,
                Category: data[0][0].category,
                SubCategory: data[0][0].subcategory,
                Tran_Date: purchaserequestdata.Tran_Date,
              },
              { transaction: t }
            );
            await Product_History.create(
              {
                Asset_ID: assetId.UTD,
                Quantity: assetId.issue_qty,
                Tran_Type: 7, // 2 for Issued
                Created_By: req.headers.name,
                Source_Location: purchaserequestdata.LocationTo,
                Destination_Location: purchaserequestdata.Location,
                Category: data[0][0].category,
                SubCategory: data[0][0].subcategory,
                Tran_Date: purchaserequestdata.Tran_Date,
              },
              { transaction: t }
            );
          } catch (err) {
            console.error(`Error creating DTl for Issued :`, err);
            throw err;
          }
        }
      }
    }
    await t.commit();

    res.status(200).send("Updated Successfully");
  } catch (err) {
    res.status(500).json({ error: "Failed to create purchase request" });
  }
};
exports.updatepurchaseOrder = async function (req, res) {
  const {
    UTD,
    Po,
    Vendor_Phone_No,
    Vendor_Address,
    Vendor_Email,
    Vendor_Name,
    Vendor_Contact_Name,
    ...other
  } = req.body.purchaseOrder;
  console.log(req.body, "s;s;s;");
  const { error: requestError, value: purchaseOrderdata } =
    purchaseOrderSchema.validate(other);
  const { error: productError, value: purchaseOrderProductDetails } =
    Joi.array()
      .items(purchaseOrderProductDetailsSchema)
      .validate(req.body.PurchaseOrderProductDetails, {
        abortEarly: false,
        stripUnknown: true,
      });

  if (requestError || productError) {
    const errors = (requestError ? requestError.details : []).concat(
      productError ? productError.details : []
    );
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }

  console.log(purchaseOrderdata, purchaseOrderProductDetails, "purchase order");
  // let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    // t = await sequelize.transaction();
    const purchaseOrder = _Purchase_Order(sequelize, Sequelize.DataTypes);
    const purchaseOrder1 = await purchaseOrder.update(purchaseOrderdata, {
      where: { UTD: UTD },
      // transaction: t,
      returning: true,
    });
    const ProductDetail = _Purchase_Order_Product_Details(
      sequelize,
      Sequelize.DataTypes
    );
    await Promise.all(
      purchaseOrderProductDetails.map((product) => {
        return ProductDetail.update(product, {
          where: { UTD: product.UTD },
          // transaction: t,
        });
      })
    );
    // await t.commit();
    res.status(200).send("Updated Successfully");
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to create purchase request" });
  }
};

exports.viewpurchaserequests = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);

    let query = `
    select
    (select top 1 godw_name from GODOWN_MST where Godw_Code=Location)as branch_name,
    (select top 1 name from Assets_Group where id=Asset_Category)as Asset_Name,
    (select count(utd) from Purchase_Req_Product_Details where Purchase_Id=purchase_request.UTD)as Total_Items,
    (select sum(Total_Price) from Purchase_Req_Product_Details where Purchase_Id=purchase_request.UTD)as Total_Price,
    (select sum(CAST(Issue_Quantity AS int)) from Purchase_Req_Product_Details where Purchase_Id=purchase_request.UTD and Issue_Quantity is not null)as Issued,
    (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster where empcode =srm)as emp_name,
    (SELECT CONVERT(INT, SUM(CONVERT(INT, Quantity))) FROM Purchase_Req_Product_Details WHERE Purchase_Id = purchase_request.UTD) AS Quantity,
    UTD,(SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(purchase_request.UTD AS VARCHAR) AS PoNumber,
	cast(Req_Date as date)as Req_Date,Asset_Category,Contact_Number,Email,Address,City,State from purchase_request where cast(Req_Date as date) between '${dateFrom}' and '${dateto}' and locationTo in (${loc_code}) order by Req_Date desc
                `;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};
exports.viewpurchaseorders = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
select * from (
        select
        iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}'
               IN (approver1_A, approver1_B) and module_code = 'asset' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}'
               IN (approver2_A, approver2_B) and module_code = 'asset' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}'
               IN (approver3_A, approver3_B) and module_code = 'asset' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
                   (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
              where empcode =srm)as srm_name,
                          (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
              where empcode =
                  (select iif(Appr_1_Code is not null,Appr_1_Code,
                  (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                   from Approval_Matrix where module_code = 'asset' and   SRM collate database_default = empcode collate database_default)))
                  and   Export_Type < 3) as apr1_name,
                  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
              where empcode =
                  (select iif(Appr_2_Code is not null,Appr_2_Code,
                  (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                   from Approval_Matrix where  module_code = 'asset' and   SRM collate database_default = empcode collate database_default)))
                  and   Export_Type < 3) as apr2_name,
                  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
              where empcode =
                  (select iif(Appr_3_Code is not null,Appr_3_Code,
                  (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                   from Approval_Matrix where module_code = 'asset' and   SRM collate database_default = empcode collate database_default)))
                  and   Export_Type < 3) as apr3_name,
                  iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}'
                 IN (approver1_A, approver1_B) and module_code = 'asset' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
                 IN (approver2_A, approver2_B) and module_code = 'asset' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
                 IN (approver3_A, approver3_B) and module_code = 'asset' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
                 (select top 1 godw_name from GODOWN_MST where Godw_Code=Location)as branch_name,
                 (select top 1 Ledg_Name from ledg_mst where ledg_code=Vendor)AS vendor,
                         (select top 1 name from Assets_Group where id=Asset_Category)as Asset_Name,
            (select count(utd) from Purchase_Order_Product_Details where Purchase_Id=purchase_order.UTD)as Total_Items,
                         (select sum(Total_Price) from Purchase_Order_Product_Details where Purchase_Id=purchase_order.UTD)as Total_Price,
                         UTD,
                           (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(purchase_order.UTD AS VARCHAR) AS PoNumber,
                         cast(Req_Date as date)as Req_Date,Asset_Category,Contact_Number,Email,Address,City,State,Location,Appr_1_Rem,Appr_2_Rem,Appr_3_Rem,Fin_Appr,srm,srm as emp_code from purchase_order where cast(Req_Date as date) between '${dateFrom}' and '${dateto}' and location in (${loc_code})
                  and srm in  (select empcode from approval_matrix where
                    '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))
                  ) as dasd
                     `;

    if (req.body.status == 2) {
      query += `where  (status_khud_ka is null and status_appr is null) order by UTD desc`;
    } else {
      query += `where  status_khud_ka =${req.body.status}  order by UTD desc`;
    }
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

const processMainData = async (mainData, sequelize, Appr_Code, Remark) => {
  const t = await sequelize.transaction();
  const backgroundTasks = [];
  try {
    // Pre-fetch necessary static data
    const comp_name_result = await sequelize.query(
      `SELECT TOP 1 comp_name FROM comp_mst`
    );
    const comp_name = comp_name_result[0][0]?.comp_name;

    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const UTD = c?.UTD;

      const a = await sequelize.query(
        `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = :empcode AND module_code = 'asset'`,
        { replacements: { empcode }, transaction: t }
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
          throw new Error("You are not the right person to approve this");
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

        let query = "";
        let query2 = null;

        if (ApprovalLevel === 1) {
          query = `
            UPDATE purchase_order
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 1,
                Appr_1_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE UTD = :UTD AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE purchase_order
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 1,
                Appr_2_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE UTD = :UTD AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE purchase_order
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 1,
                Appr_3_Rem = :Remark,
                Fin_Appr = 1
            WHERE UTD = :UTD AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        }

        // Execute the update queries
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM purchase_order WHERE UTD = :UTD`,
          { replacements: { UTD }, transaction: t }
        );

        if (affectedRows.length > 0) {
          if (query2) {
            await sequelize.query(query2, {
              replacements: { ...data, UTD },
              transaction: t,
            });
          }
          await sequelize.query(query, {
            replacements: { ...data, UTD },
            transaction: t,
          });
        }
        // // Prepare message sending tasks for background execution
        // if (ApprovalLevel === 1) {
        //   const result = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   backgroundTasks.push(() => SendWhatsAppMessgae(result[0][0]?.mobile_no, 'approver_1_approve_message', [
        //     { "type": "text", "text": item?.rowData.SRM_Name },
        //     { "type": "text", "text": item?.rowData?.Cust_Name },
        //     { "type": "text", "text": item?.rowData?.Mob },
        //     { "type": "text", "text": item?.rowData?.modl_name },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //     { "type": "text", "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)' },
        //     { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": comp_name }
        //   ]));

        //   if (!Final_apprvl) {
        //     const approver2 = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode=(SELECT TOP 1 approver2_A FROM approval_matrix WHERE empcode='${item?.rowData.SRM}' AND module_code='discount')`);
        //     const outlet_name = await sequelize.query(`SELECT TOP 1 br_extranet FROM godown_mst WHERE godw_code='${item?.rowData.location}' AND export_type<3`);
        //     if (approver2[0]?.length && approver2[0][0].mobile_no) {
        //       backgroundTasks.push(() => SendWhatsAppMessgae(approver2[0][0].mobile_no, 'disc_appr_msg_l2_new', [
        //         { "type": "text", "text": outlet_name[0][0].br_extranet },
        //         { "type": "text", "text": `${item.rowData.Modl_Group_Name} , ${item.rowData.modl_name} , ${item.rowData.Veh_Clr_Name}` },
        //         { "type": "text", "text": item?.rowData?.Cust_Name },
        //         { "type": "text", "text": item?.rowData?.Dise_Amt },
        //         { "type": "text", "text": item?.rowData?.RM_Name },
        //         { "type": "text", "text": item?.rowData?.book_date },
        //         { "type": "text", "text": comp_name }
        //       ]));
        //     }
        //   }
        // } else if (ApprovalLevel === 2) {
        //   const mobile_emp = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
        //     backgroundTasks.push(() => SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_reject_message', [
        //       { "type": "text", "text": item?.rowData?.SRM_Name },
        //       { "type": "text", "text": item?.rowData?.Cust_Name },
        //       { "type": "text", "text": item?.rowData?.Mob },
        //       { "type": "text", "text": item?.rowData?.modl_name },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": comp_name }
        //     ]));
        //   }
        // }
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
    // Respond to the caller immediately
    return {
      success: true,
      message: "Main data processing initiated",
    };
  } catch (e) {
    console.error(e);
    await t.rollback();
    throw e;
  }
  // finally {
  //   setTimeout(async () => {
  //     try {
  //       for (const task of backgroundTasks) {
  //         await task();
  //         await delay(2000);
  //         // Execute each function in backgroundTasks
  //       }
  //     } catch (err) {
  //       console.error('Error executing background tasks:', err);
  //     }
  //   }, 1000);

  // }
};

exports.approveby2 = async function (req, res) {
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
        Message: "Please select the entry to approve",
      });
    }

    await processMainData(mainData, sequelize, Appr_Code, Remark);

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

    await processMainData1(mainData, sequelize, Appr_Code, Remark);

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

async function processMainData1(mainData, sequelize, Appr_Code, Remark) {
  const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const UTD = c?.UTD;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'asset'`,
        { replacements: { empcode }, transaction: t }
      );

      const mobile_emp = await sequelize.query(
        `select top 1 mobile_no from employeemaster where empcode='${item?.rowData.SRM}'`
      );
      const comp_name = await sequelize.query(
        `select top 1 comp_name from comp_mst`
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
          throw new Error("You are not the right person to reject this");
        }

        const data = {
          Appr_Code,
          Remark,
        };

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE purchase_order
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 0,
                Appr_1_Rem = :Remark,
                Fin_Appr = 0
            WHERE UTD = :UTD AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
          `;
          // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
          //   await SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_1_2_reject_messaage', [
          //     {
          //       "type": "text",
          //       "text": item?.rowData.empname
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Cust_Name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Mob
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.modl_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr1_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Appr_1_Rem ? item?.rowData?.Appr_1_Rem : '(Not Given)'
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr1_name
          //     },
          //     {
          //       "type": "text",
          //       "text": comp_name[0][0].comp_name
          //     }
          //   ])
          // }
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE purchase_order
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 0,
                Appr_2_Rem = :Remark,
                Fin_Appr = 0
            WHERE UTD = :UTD AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
          // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
          //   await SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_1_2_reject_messaage', [
          //     {
          //       "type": "text",
          //       "text": item?.rowData.empname
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Cust_Name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Mob
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.modl_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr2_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Appr_2_Rem ? item?.rowData?.Appr_2_Rem : '(Not Given)'
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr2_name
          //     },
          //     {
          //       "type": "text",
          //       "text": comp_name[0][0].comp_name
          //     }
          //   ])
          // }
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE purchase_order
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 0,
                Appr_3_Rem = :Remark,
                Fin_Appr = 0
            WHERE UTD = :UTD AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        }
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM purchase_order WHERE UTD = :UTD;`,
          { replacements: { UTD }, transaction: t }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, UTD },
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
exports.purchaseorderdtl = async function (req, res) {
  try {
    const UTD = req.body.UTD;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
    select UTD,Product_Code, Subcategory,(SELECT TOP 1 name 
      FROM Assets_Group_Subcategory 
      WHERE id = SubCategory) As SubCategory,
      HSN,
  (select top 1 Misc_name from misc_mst where misc_code=uom1 and export_type<3 and misc_type=72)as Uom,
Item_Description,Quantity,Unit_Price,Discount,Total_Price,
(select top 1 Document from Purchase_Order where Purchase_Order.UTD  = Purchase_Id) as Document
from Purchase_Order_Product_Details where Purchase_Id=${UTD}
    `;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.PurchaseEntryDtl = async function (req, res) {
  try {
    const UTD = req.body.UTD;
    const sequelize = await dbname(req.headers.compcode);
    let query = `select UTD,CODE,Description,(SELECT name FroM Assets_Group WHERE ID = CATEGORY) AS CATEGORY,(SELECT TOP 1 GODW_NAME FROM GODOWN_MST WHERE Godw_Code = Location) as Location,Quantity,Rate,Inv_Amt
from PurchaseEntryDtl where tran_id='${UTD}' and tran_type = '1'`;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.AssetMaster = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const UTD = req.body.UTD;
  const Location1 = req.body.Location1;
  try {
    const result = await sequelize.query(`SELECT 
      UTD,
      CODE,
      Description,
      Category as Assetcategory,
      SubCategory as SubCategory,
 (select top 1 cast(REF_DATE  as date) from PurchaseEntryMst where PurchaseEntryMst.tran_id=PurchaseEntryDtl.TRAN_ID and  PurchaseEntryMst.TRAN_TYPE=PurchaseEntryDtl.TRAN_TYPE)as Due_Date,
(select top 1 Series from assets_group_subcategory where id=SubCategory)as Series,
      Location,
	   (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(PO_Number AS VARCHAR) AS PoNumber,
      Quantity,
      Rate,
      Inv_Amt,
      (SELECT TOP 1 INV_NO FROM PurchaseEntryMst WHERE PurchaseEntryMst.TRAN_ID = PurchaseEntryDtl.TRAN_ID AND PurchaseEntryDtl.tran_type = PurchaseEntryDtl.TRAN_TYPE) AS Invoice_No,
	  (SELECT TOP 1 CAST(REF_DATE AS DATE) FROM PurchaseEntryMst WHERE PurchaseEntryMst.TRAN_ID = PurchaseEntryDtl.TRAN_ID AND PurchaseEntryDtl.tran_type = PurchaseEntryDtl.TRAN_TYPE) AS Purchase_Date,
    QUANTITY as Qty,
	HSN_CODE  as Asset_Nature,
	ITEM_TYPE,
  UOM as UOM1,
	(select top 1 Serial_No from PurchaseEntryDtlsr where PurchaseEntryDtl.UTD=PurchaseEntryDtlSR.TRAN_ID and isCreated is null)as Serial_No
  FROM 
      PurchaseEntryDtl
  WHERE 
  UTD = '${UTD}'`);

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

exports.findsub = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Asset_Type = req.body.Asset_Type;
  try {
    let query;
    query = `select CAST(id AS VARCHAR) as value, name as label,Series from Assets_Group_Subcategory where 
    (SELECT TOP 1 asset_type FROM Assets_Group WHERE Assets_Group.id = Assets_Group_Subcategory.group_Id) = '${Asset_Type}'`;

    if (req.body.Category) {
      query += `and  group_Id = '${req.body.Category}'`;
    }

    if (req.body.issue) {
      query = `select CAST(id AS VARCHAR) as value, name as label,Series from Assets_Group_Subcategory where group_Id  in (${req.body.Category ? req.body.Category : "select id from assets_group"
        })`;
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

exports.PurchaseVendor = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const asset = req.body.asset;
  try {
    const result = await sequelize.query(`
    WITH VendorData AS (
      SELECT ledg_code,ledg_name,ledg_ph1,ledg_email,ledg_add1,(SELECT TOP 1 invoice_no FROM Product_Vendor WHERE Vendor_Code = ledg_mst.Ledg_Code 
           ORDER BY invoice_date DESC) AS Invoice_No,(SELECT TOP 1 CAST(invoice_date AS DATE) FROM Product_Vendor 
           WHERE Vendor_Code = ledg_mst.Ledg_Code ORDER BY invoice_date DESC) AS Invoice_Date,ROW_NUMBER() OVER (ORDER BY (SELECT MAX(invoice_date) 
       FROM Product_Vendor WHERE Vendor_Code = ledg_mst.Ledg_Code) DESC) AS RowNum FROM ledg_mst
      WHERE Ledg_Code IN (SELECT vendor_code FROM Product_Vendor WHERE asset_product IN (SELECT UTD FROM Asset_Product 
           WHERE Category = '${asset}')))
  SELECT ledg_code, ledg_name, ledg_ph1, ledg_email, ledg_add1, Invoice_No, Invoice_Date
  FROM VendorData WHERE RowNum <= 5 ORDER BY RowNum;`);

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

exports.PartyRateList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const ledg_code = req.body.ledg_code;
  try {
    const result =
      await sequelize.query(`select ledg_code , item_code,rate,party_rate,CAST(Valid_From AS DATE) AS Valid_From,
    CAST(Valid_Upto AS DATE) AS Valid_Upto, Qty_From, Qty_Upto from ledg_RCN where Ledg_Code = '${ledg_code}'`);

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

exports.SavePrefix = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "request");
  const prefixes = req.body;

  try {
    const results = await Promise.all(
      prefixes.map(async (prefix) => {
        const { Prefix_Name, Prefix_Code } = prefix;

        const isExist = await sequelize.query(
          `SELECT Prefix_Name FROM prefix_name WHERE Prefix_Name = '${Prefix_Name}'`
        );

        if (isExist[0].length > 0) {
          const result = await sequelize.query(
            `UPDATE prefix_name SET Prefix_Code = '${Prefix_Code}' WHERE Prefix_Name = '${Prefix_Name}'`
          );
          return { Prefix_Name, Prefix_Code, action: "updated" };
        } else {
          const result = await sequelize.query(
            `INSERT INTO prefix_name (Prefix_Name, Prefix_Code) VALUES ('${Prefix_Name}', '${Prefix_Code}')`
          );
          return { Prefix_Name, Prefix_Code, action: "inserted" };
        }
      })
    );

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: results,
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

exports.showprefix = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Prefix_Name = req.body.Prefix_Name;
  try {
    const result = await sequelize.query(
      `select Prefix_Code , Prefix_Name from Prefix_Name `
    );

    console.log(result, "akakak");
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

exports.company = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const multi_loc = req.body.multi_loc;
  try {
    const company =
      await sequelize.query(`select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,cm.Right_head2,
    gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No, gm.*
    from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
    where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);

    console.log(company, "akakak");
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: company[0][0],
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
exports.Purchasefill = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const UTD = req.body.UTD;
  try {
    const Purchase_Order = await sequelize.query(`select UTD,
      (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(UTD AS VARCHAR) AS Po,
      Req_Date,Contact_Number,City,State,Address,Asset_Category,Vendor,Location,Document from Purchase_Order where UTD = '${UTD}'`);
    const Purchase_Order_Product = await sequelize.query(
      `select UTD,Product_Code,Item_Description,Subcategory,UOM1,(select top 1 series from assets_group_subcategory where id=subcategory)as isMaintain,ITEM_TYPE,HSN,Quantity,Unit_Price,Total_Price,Discount,
      (select SUM(qty) from asset_product where asset_product.subcategory= Purchase_Order_Product_Details.Subcategory)as Available_Quantity from Purchase_Order_Product_Details where Purchase_Id='${UTD}'`
    );
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Purchase_Order: Purchase_Order[0][0],
      Purchase_Order_Product: Purchase_Order_Product[0],
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

exports.PurchaseView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "requesttt");
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;
  try {
    const result = await sequelize.query(`SELECT 
      (SELECT COUNT(utd) 
       FROM Purchase_Order_Product_Details 
       WHERE Purchase_Id = PO.UTD) AS Total_Items,
  
      (SELECT SUM(Total_Price) 
       FROM Purchase_Order_Product_Details 
       WHERE Purchase_Id = PO.UTD) AS Total_Price,
  
      PO.UTD,
      
      (SELECT Prefix_Code 
       FROM Prefix_Name 
       WHERE Prefix_Name = 'Purchase Order') + CAST(PO.UTD AS VARCHAR) AS PoNumber,
        (select top 1 Ledg_name from Ledg_mst where Ledg_Code=PO.vendor)as Vendor_Name,
      (SELECT TOP 1 utd 
       FROM PurchaseEntryDtl 
       WHERE PO_Number = PO.UTD) AS PurchaseEntryUTD,
  
      CAST(Req_Date AS DATE) AS Req_Date,
      Asset_Category,
      Contact_Number,
      Email,
      Address,
      City,
      State,
      Location,
      Appr_1_Rem,
      Appr_2_Rem,
      Appr_3_Rem,
      Fin_Appr,
      srm,
      srm AS emp_code,
  
      (SELECT name 
       FROM Assets_Group 
       WHERE id = PO.Asset_Category) AS Asset_Name,
  
      (SELECT TOP 1 godw_name 
       FROM GODOWN_MST 
       WHERE Godw_Code = PO.location) AS Location
  
  FROM 
      Purchase_Order AS PO 
  WHERE 
       Req_Date between '${datefrom}' and '${dateto}' and Location = '${loc_code}' order by UTD desc`);

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
exports.PurchaseOrderView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;
  try {
    const result = await sequelize.query(`SELECT 
      (SELECT COUNT(utd) 
       FROM Purchase_Order_Product_Details 
       WHERE Purchase_Id = PO.UTD) AS Total_Items,
       (select top 1 Ledg_name from Ledg_mst where Ledg_Code=PO.vendor)as Vendor_Name,
      (SELECT SUM(Total_Price) 
       FROM Purchase_Order_Product_Details 
       WHERE Purchase_Id = PO.UTD) AS Total_Price,
      PO.UTD,
      (SELECT Prefix_Code 
       FROM Prefix_Name 
       WHERE Prefix_Name = 'Purchase Order') + CAST(PO.UTD AS VARCHAR) AS PoNumber,
      (SELECT TOP 1 utd 
       FROM PurchaseEntryDtl 
       WHERE PO_Number = PO.UTD) AS PurchaseEntryUTD,
      CAST(Req_Date AS DATE) AS Req_Date,
      Asset_Category,
      Contact_Number,
      Email,
      Address,
      City,
      State,
      Location,
      Appr_1_Rem,
      Appr_2_Rem,
      Appr_3_Rem,
      Fin_Appr,
      srm,
      srm AS emp_code,
      (SELECT name 
       FROM Assets_Group 
       WHERE id = PO.Asset_Category) AS Asset_Name,
      (SELECT TOP 1 godw_name 
       FROM GODOWN_MST 
       WHERE Godw_Code = PO.location) AS Location
  FROM 
      Purchase_Order AS PO 
  WHERE 
       Req_Date between '${datefrom}' and '${dateto}' and Location = '${loc_code}' and appr_1_stat is null order by UTD desc`);

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

exports.ManagerView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;

  try {
    const result = await sequelize.query(`SELECT
    PurchaseEntryDtl.QUANTITY,
    COALESCE(
        (
            SELECT 
                SUM(Quantity)
            FROM 
                Product_history
            WHERE 
               PurchaseEntryDtl.UTD=Product_history.PurchaseDtl
        ), 0

    ) AS AVAILABLE,
    PurchaseEntryDtl.UTD,
    PurchaseEntryDtl.CODE,
    PurchaseEntryDtl.HSN_CODE,
    (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(PurchaseEntryDtl.PO_Number AS VARCHAR) AS PoNumber,
    (SELECT TOP 1 cast(VOUCHER_DATE as date) FROM PurchaseEntryMst where PurchaseEntryDtl.TRAN_ID=PurchaseEntryMst.TRAN_ID and PurchaseEntryDtl.TRAN_TYPE=PurchaseEntryMst.TRAN_TYPE ) AS Voucher_Date,
    PurchaseEntryDtl.Description,
    (SELECT name FROM Assets_Group WHERE ID = PurchaseEntryDtl.CATEGORY) AS CATEGORY,
    (SELECT TOP 1 Asset_type FROM Assets_Group WHERE ID = PurchaseEntryDtl.CATEGORY) AS Asset_Type,
    (SELECT name FROM Assets_Group_Subcategory WHERE ID = PurchaseEntryDtl.subcategory) AS SubCategory,
    (SELECT Series FROM Assets_Group_Subcategory WHERE ID = PurchaseEntryDtl.subcategory) AS IsMaintain,
    (SELECT TOP 1 INV_NO FROM PurchaseEntryMst WHERE PurchaseEntryMst.TRAN_ID = PurchaseEntryDtl.TRAN_ID) AS Invoice_No,
    (SELECT TOP 1 GODW_NAME FROM GODOWN_MST WHERE Godw_Code = PurchaseEntryDtl.Location) AS Location,
    PurchaseEntryDtl.Quantity,
    PurchaseEntryDtl.Rate,
    PurchaseEntryDtl.Inv_Amt
FROM
    PurchaseEntryDtl
WHERE
    PurchaseEntryDtl.LOC_CODE IN (${loc_code})
    AND EXISTS (
        SELECT 1
        FROM PurchaseEntryMst
        WHERE PurchaseEntryMst.TRAN_ID = PurchaseEntryDtl.TRAN_ID
          AND PurchaseEntryMst.ref_date BETWEEN '${datefrom}' AND '${dateto}'
    ) order by PurchaseEntryDtl.UTD desc`);
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

exports.findinvoice = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const invoice_No = req.body.invoice_No;
  try {
    const result = await sequelize.query(
      `select LEDG_ACNT,Bill_Date from dms_row_data where Bill_No = '${invoice_No}'`
    );

    const result2 = await sequelize.query(
      `select Ledg_Code,ledg_name, ledg_ph1,ledg_ph2, Ledg_Abbr,ledg_email, Ledg_City,Ledg_Add1 from Ledg_Mst where Ledg_Code = '${result[0][0].LEDG_ACNT}'`
    );
    result2[0][0].Purchase_Date = result[0][0].Bill_Date;

    console.log(result, "ressssss");
    console.log(result2, "result2");
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result2[0][0],
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

exports.DmsRowDataSave = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  const DmsRowData = _DmsRowData(sequelize, DataTypes);
  const PurchaseEntryMst = _PurchaseEntryMst(sequelize, DataTypes);
  const PurchaseEntryDtl = _PurchaseEntryDtl(sequelize, DataTypes);
  let newUtd;
  try {
    const BodyData = req.body;
    const ENTRTYPE = 1;
    // BodyData.INTRYTYPE;
    const formdata = BodyData.formdata;
    const savedata = BodyData.savedata;
    const Created_by = BodyData.Created_By;
    const FindUserCode = await sequelize.query(`
      select User_Code FROM user_tbl where User_Name  = '${Created_by}' AND Export_Type = 1 AND Module_Code = 10`);
    const inv_no =
      await sequelize.query(`SELECT CONCAT((SELECT TOP 1 Book_Prefix FROM book_mst WHERE book_code =
              (SELECT misc_dtl1 FROM misc_mst WHERE misc_code = '${BodyData.formdata.Tran_Type}' and misc_type = 56)),
              isnull(MAX(seq_no) + 1, 1)) AS bill_no FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formdata.Tran_Type}' and Export_type < 3;`);
    const MaxTranId = await sequelize.query(
      `SELECT isnull(max(Tran_Id)+20,1) AS TRAN_ID from DMS_ROW_DATA`
    );
    let Tran_Id = MaxTranId[0][0]?.TRAN_ID;
    const MaxSeq = await sequelize.query(
      `select isnull(MAX(seq_no) + 1, 1) AS SeqNo FROM DMS_ROW_DATA WHERE tran_type ='${BodyData.formdata.Tran_Type}' and Export_type < 3;`
    );
    let Seq_No = MaxSeq[0][0]?.SeqNo;
    const LedgName = await sequelize.query(
      `SELECT Ledg_Name, Ledg_Add6 FROM Ledg_Mst WHERE Ledg_Code ='${formdata.LEDG_ACNT}' and Export_type < 3;`
    );
    // console.log(LedgName, 'LedgName')
    let PurchaseEntryDtlData = [];
    let SRNO = 1;
    BodyData.savedata.forEach((rowData) => {
      let row = {
        SRNO: SRNO++,
        CODE: rowData.Product_Code,
        DESCRIPTION: rowData.Item_Name,
        Location: rowData.Location1,
        SubCategory: rowData.SubCategory,
        CATEGORY: rowData.Category,
        CATEGORYGST: rowData.CategoryGst,
        ITEM_TYPE: rowData.Item_Type,
        UOM: rowData.UOM1,
        HSN_CODE: rowData.HSN ? rowData.HSN : null,
        QUANTITY: rowData.Sup_Qty,
        RATE: rowData.Basic_Price,
        BATCH: rowData.BATCH,
        SGST_PERCT: rowData.SGST_Perc ? rowData.SGST_Perc : null,
        SGST_VALUE: rowData.SGST,
        CGST_PERCT: rowData.CGST_Perc ? rowData.CGST_Perc : null,
        CGST_VALUE: rowData.CGST,
        IGST_PERCT: rowData.IGST_Perc ? rowData.IGST_Perc : null,
        IGST_VALUE: rowData.IGST,
        CESS_PERCT: rowData.Cess_Perc ? rowData.Cess_Perc : null,
        CESS_VALUE: rowData.Cess_Amt,
        DISC_PERCT: rowData.discp ? rowData.discp : null,
        DISC_VALUE: rowData.Disc_Amt,
        LOC_CODE: formdata.Loc_Code,
        EXPORT_TYPE: 1,
        SERVER_ID: 1,
        BRAND: rowData.BRAND1,
        Sale_Ledg: rowData.Sale_ledg1,
        Inv_Amt: rowData.Inv_Amt,
        Cost_Center: rowData.Cost_Center1,
        BATCH: formdata.Bill_No,
        PO_Number: rowData.PO_Number,
        POPD: rowData.PurchaseOrderProductDetails,
      };
      PurchaseEntryDtlData.push(row);
    });

    const PurchaseEntryMstData = {
      BOOK_CODE: formdata.Tran_Type,
      VOUCHER_NO: formdata.Seq_No,
      VOUCHER_DATE: formdata.Bill_Date,
      // INV_NO: formdata.Bill_No,
      PARTY_AC: formdata.LEDG_ACNT,
      DISP_NAME: JSON.stringify(formdata.print_name),
      REF_NO: formdata.Sale_Type,
      REF_DATE: formdata.Ref_Dt,
      NARR: formdata.Narration,
      STATE_CODE: formdata.State_Code,
      SUPP_GST: formdata.GST,
      REG_TYPE: formdata.registration_type,
      REV_CHRGS: formdata.Is_Rcm,
      DISP_ADD: formdata.DISP_ADD,
      Exp_Ledg1: formdata.Exp_Ledg4,
      Exp_Ledg2: formdata.Exp_Ledg5,
      Exp_Ledg3: formdata.Exp_Ledg6,
      Exp_Ledg4: formdata.Exp_Ledg7,
      TDS_Ledg: formdata.Exp_Ledg8,
      Exp_Perc1: formdata.Exp_Perc4,
      Exp_Perc2: formdata.Exp_Perc5,
      Exp_Perc3: formdata.Exp_Perc6,
      Exp_Perc4: formdata.Exp_Perc7,
      Tds_Perc: formdata.Exp_Perc8,
      Exp_Amt1: formdata.Exp_Amt4,
      Exp_Amt2: formdata.Exp_Amt5,
      Exp_Amt3: formdata.Exp_Amt6,
      Exp_Amt4: formdata.Exp_Amt7,
      Tds_Amt: formdata.Exp_Amt8,
      Inv_Amt: formdata.net_total,
      LOC_CODE: formdata.Loc_Code,
      Export_Type: 1,
      ServerId: 1,
    };
    const MaxIItem = await sequelize.query(
      `SELECT isnull(max(TRAN_ID)+1,1) AS TRANID from PurchaseEntryMst WHERE TRAN_TYPE = ${ENTRTYPE}`,
      { transaction: t }
    );
    let MaxItemId = MaxIItem[0][0]?.TRANID;
    const { error: error1, value: value1 } = PurchaseEntryMstSchema.validate(
      PurchaseEntryMstData,
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );
    if (error1) {
      const errorMessage = error1.details.map((err) => err.message).join(", ");
      console.log(errorMessage, "errorMessage1");
      return res.status(400).send({ success: false, message: errorMessage });
    } else {
      newUtd = await PurchaseEntryMst.create(
        {
          ...value1,
          TRAN_ID: MaxItemId,
          TRAN_TYPE: ENTRTYPE,
          INV_NO: inv_no[0][0].bill_no,
          Created_by,
          DRD_ID: Tran_Id,
          VOUCHER_NO: Seq_No,
        },
        { transaction: t }
      );
    }
    const a = Joi.object({
      e: Joi.array().items(PurchaseEntryDtlSchema),
    });
    const { error: error2, value: value2 } = a.validate(
      { e: PurchaseEntryDtlData },
      {
        abortEarly: false,
        stripUnknown: true,
      }
    );

    if (error2) {
      const errorMessage = error2.details.map((err) => err.message).join(", ");
      console.log(errorMessage, "errorMessage2");
      return res.status(400).send({ success: false, message: errorMessage });
    } else {
      const purchaseEntries = await PurchaseEntryDtl.bulkCreate(
        value2.e.map((value2) => ({
          TRAN_ID: MaxItemId,
          TRAN_TYPE: ENTRTYPE,
          SRNO: newUtd.UTD,
          Created_by,
          ...value2,
        })),
        { transaction: t, returning: true }
      );
      for (let i = 0; i < BodyData.savedata.length; i++) {
        const rowData = BodyData.savedata[i];
        if (rowData.isMaintain) {
          const purchaseEntry = purchaseEntries[i]; // This should be in the same order
          const serialNumbers = rowData.serialNumbers || [];
          const nonEmptySerialNumbers = serialNumbers.filter(
            (serial) => serial.trim() !== ""
          );
          // Insert serialNumbers into the other table
          for (const serial of nonEmptySerialNumbers) {
            const purchaseEntryDtlSR = await _PurchaseEntryDtlSr(
              sequelize,
              DataTypes
            );
            await purchaseEntryDtlSR.create(
              {
                TRAN_ID: purchaseEntry.UTD, // Replace this with the actual TRAN_ID value you want to insert
                Serial_No: serial, // Using the current serial number from the loop
                Po: purchaseEntry.PO_Number,
              },
              { transaction: t }
            );
          }
        }
      }
    }
    let DrdFinData = savedata.map((item) => ({ ...formdata, ...item }));
    const currentDate = new Date();
    const ENTR_DATE = currentDate.toISOString().split("T")[0];
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");
    const ENTR_TIME = `${hours}.${minutes}`;
    await Promise.all(
      DrdFinData.map(async (item) => {
        const Cost_Center = item.Cost_Center1;
        const Sale_Ledg = item.Sale_ledg1;
        const LOCATION = item.Location1;
        const UoM = item.UOM1;
        const updateData = {
          ...item,
          UoM,
          Sale_Ledg,
          Cost_Center,
          Inv_Amt: Math.round(formdata.net_total),
          Rnd_Off: (
            Math.round(formdata.net_total) - formdata.net_total
          ).toFixed(2),
          Rnd_Ledg: 23,
          USR_CODE: FindUserCode[0][0].User_Code,
          ENTR_DATE: ENTR_DATE,
          ENTR_TIME: ENTR_TIME,
          LOCATION,
        };
        const StateName = await sequelize.query(
          `SELECT Misc_Name FROM Misc_Mst WHERE Misc_type = 3 AND Misc_Code = ${updateData.State_Code ? `'${updateData.State_Code}'` : null
          }`
        );

        await sequelize.query(
          `
                  INSERT INTO DMS_ROW_DATA (
                    Tran_Id, Item_Code, Ledger_Name, Ledger_Id, Bill_Date, Ref_Dt, Tran_Type, 
                    Seq_No, Bill_No, LEDG_ACNT, 
                    GST, State_Code,
                    Exp_Amt4, Exp_Amt5, 
                    Exp_Amt6, Exp_Amt7, Exp_Amt8, 
                    Exp_Ledg4, 
                    Exp_Perc4, Exp_Ledg5, Exp_Perc5, 
                    Exp_Ledg6, Exp_Perc6, Exp_Ledg7, 
                    Exp_Perc7, Exp_Ledg8, Exp_Perc8, 
                    Sale_Type, Narration, Loc_Code, 
                     Category, 
                    Item_Type, HSN, Sup_Qty, 
                     Basic_Price, 
                     Taxable, Assessable_Rate, 
                    CGST_Perc, CGST, SGST_Perc, 
                    SGST, IGST_Perc, IGST, 
                    Cess_Perc, Cess_Amt, Inv_Amt, 
                    UoM, Sale_Ledg, Cost_Center, 
                    Rnd_Off, Rnd_Ledg, USR_CODE, 
                    ENTR_DATE, ENTR_TIME, LOCATION, Export_Type
                  ) VALUES (
                    ${Tran_Id},
                    ${updateData.ITEM_CODE
            ? `'${updateData.ITEM_CODE}'`
            : `'${updateData.Item_Name}'`
          },
                    '${LedgName[0][0].Ledg_Name}',
                    ${LedgName[0][0].Ledg_Add6
            ? `'${LedgName[0][0].Ledg_Add6}'`
            : null
          },
                    ${updateData.Bill_Date ? `'${updateData.Bill_Date}'` : null
          },
                    ${updateData.Ref_Dt ? `'${updateData.Ref_Dt}'` : null},
                    ${updateData.Tran_Type ? `'${updateData.Tran_Type}'` : null
          },
                    ${updateData.Seq_No ? updateData.Seq_No : null},
                    ${updateData.Bill_No ? `'${updateData.Bill_No}'` : null},
                    ${updateData.LEDG_ACNT ? updateData.LEDG_ACNT : null},
                    ${updateData.GST ? `'${updateData.GST}'` : null},
                    '${StateName[0][0].Misc_Name}',
                    ${updateData.Exp_Amt4 ? updateData.Exp_Amt4 : null},
                    ${updateData.Exp_Amt5 ? updateData.Exp_Amt5 : null},
                    ${updateData.Exp_Amt6 ? updateData.Exp_Amt6 : null},
                    ${updateData.Exp_Amt7 ? updateData.Exp_Amt7 : null},
                    ${updateData.Exp_Amt8 ? updateData.Exp_Amt8 : null},
                    ${updateData.Exp_Ledg4 ? updateData.Exp_Ledg4 : null},
                    ${updateData.Exp_Perc4 ? updateData.Exp_Perc4 : null},
                    ${updateData.Exp_Ledg5 ? updateData.Exp_Ledg5 : null},
                    ${updateData.Exp_Perc5 ? updateData.Exp_Perc5 : null},
                    ${updateData.Exp_Ledg6 ? updateData.Exp_Ledg6 : null},
                    ${updateData.Exp_Perc6 ? updateData.Exp_Perc6 : null},
                    ${updateData.Exp_Ledg7 ? updateData.Exp_Ledg7 : null},
                    ${updateData.Exp_Perc7 ? updateData.Exp_Perc7 : null},
                    ${updateData.Exp_Ledg8 ? updateData.Exp_Ledg8 : null},
                    ${updateData.Exp_Perc8 ? updateData.Exp_Perc8 : null},
                    ${updateData.Sale_Type ? `'${updateData.Sale_Type}'` : null
          },
                    ${updateData.Narration ? `'${updateData.Narration}'` : null
          },
                    ${updateData.Loc_Code ? updateData.Loc_Code : null},
                    ${updateData.CATEGORYGST ? updateData.CATEGORYGST : null},
                    ${updateData.Item_Type ? updateData.Item_Type : null},
                    ${updateData.HSN ? `'${updateData.HSN}'` : null},
                    ${updateData.Sup_Qty ? updateData.Sup_Qty : null},
                    ${updateData.Basic_Price ? updateData.Basic_Price : null},
                    ${updateData.Taxable ? updateData.Taxable : null},
                    ${updateData.Assessable_Rate
            ? updateData.Assessable_Rate
            : null
          },
                    ${updateData.CGST_Perc ? updateData.CGST_Perc : null},
                    ${updateData.CGST ? updateData.CGST : null},
                    ${updateData.SGST_Perc ? updateData.SGST_Perc : null},
                    ${updateData.SGST ? updateData.SGST : null},
                    ${updateData.IGST_Perc ? updateData.IGST_Perc : null},
                    ${updateData.IGST ? updateData.IGST : null},
                    ${updateData.Cess_Perc ? updateData.Cess_Perc : null},
                    ${updateData.Cess_Amt ? updateData.Cess_Amt : null},
                    ${updateData.Inv_Amt ? updateData.Inv_Amt : null},
                    ${updateData.UoM ? updateData.UoM : null},
                    ${updateData.Sale_Ledg ? updateData.Sale_Ledg : null},
                    ${updateData.Cost_Center ? updateData.Cost_Center : null},
                    ${updateData.Rnd_Off ? updateData.Rnd_Off : null},
                    ${updateData.Rnd_Ledg ? updateData.Rnd_Ledg : null},
                    ${updateData.USR_CODE ? updateData.USR_CODE : null},
                    ${updateData.ENTR_DATE ? `'${updateData.ENTR_DATE}'` : null
          },
                    ${updateData.ENTR_TIME ? `'${updateData.ENTR_TIME}'` : null
          },
                    ${updateData.LOCATION ? `'${updateData.LOCATION}'` : null},
                    0)`,
          { transaction: t }
        );
      })
    );
    await t.commit();
    res.status(200).send({
      success: true,
      message: "Data Saved....!",
      data: { Tran_Id: MaxItemId, UTD: newUtd },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Error occurred while Inserting Data `,
      error: error,
    });
    await t.rollback();
  } finally {
    await sequelize.close();
    console.log("Connection has been closed.");
  }
};

exports.FindPoorder = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Ledg_Code = req.body.LEDG_CODE;
  try {
    const result = await sequelize.query(
      `select 
      (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(purchase_order.UTD AS VARCHAR) AS label,CAST(UTD as VARCHAR) as value
      from Purchase_Order where vendor = ('${Ledg_Code}') and fin_appr=1 and UTD  in (SELECT
 pod.Purchase_Id
FROM
    Purchase_Order_Product_Details pod
LEFT JOIN
    (SELECT
        PO_Number,
        CODE,
        SubCategory,
        DESCRIPTION,
        Quantity,POPD
     FROM
        PurchaseEntryDtl
    ) ped
ON
    pod.UTD = ped.POPD
LEFT JOIN
    purchase_order po
ON
    pod.Purchase_Id = po.UTD
        where  (pod.Quantity - COALESCE(ped.Quantity, 0))>0)`
    );
    res.status(200).send(result[0]);
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

exports.potable = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const items = req.body.items;
  const GstsFlag = req.body.GstsFlag;
  const Loc_Code = req.body.Loc_Code;
  const registration_type = req.body.registration_type;
  console.log(typeof registration_type, registration_type, "registration_type");
  // return;

  let gstCalculation = "";
  if (GstsFlag === 1) {
    gstCalculation = `
      ROUND((${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0.00"
        : "0.09"
      } * 
       (
            (CAST(Quantity AS FLOAT) - (
                SELECT COALESCE(SUM(Quantity), 0) 
                FROM PurchaseEntryDtl 
                WHERE popd = Purchase_Order_Product_Details.UTD
            )) * 
            CAST(Unit_Price AS FLOAT) * 
            (1 - (CAST(Discount AS FLOAT) / 100))
        )), 2
    ) AS CGST,  
      ROUND((${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0.00"
        : "0.09"
      } *
      (
            (CAST(Quantity AS FLOAT) - (
                SELECT COALESCE(SUM(Quantity), 0) 
                FROM PurchaseEntryDtl 
                WHERE popd = Purchase_Order_Product_Details.UTD
            )) * 
            CAST(Unit_Price AS FLOAT) * 
            (1 - (CAST(Discount AS FLOAT) / 100))
        )), 2
    ) AS SGST,  
         
      ${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0"
        : "9"
      } AS CGST_Perc,
      ${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0"
        : "9"
      } AS SGST_Perc,
      0 AS IGST_Perc,
      0 AS IGST
    `;
  } else if (GstsFlag === 0) {
    gstCalculation = `
      ROUND((${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0.00"
        : "0.09"
      } * (
            (CAST(Quantity AS FLOAT) - (
                SELECT COALESCE(SUM(Quantity), 0) 
                FROM PurchaseEntryDtl 
                WHERE popd = Purchase_Order_Product_Details.UTD
            )) * 
            CAST(Unit_Price AS FLOAT) * 
            (1 - (CAST(Discount AS FLOAT) / 100))
        )), 2
    ) AS CGST,
         
      ROUND((${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0.00"
        : "0.09"
      } * (
            (CAST(Quantity AS FLOAT) - (
                SELECT COALESCE(SUM(Quantity), 0) 
                FROM PurchaseEntryDtl 
                WHERE popd = Purchase_Order_Product_Details.UTD
            )) * 
            CAST(Unit_Price AS FLOAT) * 
            (1 - (CAST(Discount AS FLOAT) / 100))
        )), 2
    ) AS SGST,  
         
      ROUND((${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0.00"
        : "0.18"
      } * (
            (CAST(Quantity AS FLOAT) - (
                SELECT COALESCE(SUM(Quantity), 0) 
                FROM PurchaseEntryDtl 
                WHERE popd = Purchase_Order_Product_Details.UTD
            )) * 
            CAST(Unit_Price AS FLOAT) * 
            (1 - (CAST(Discount AS FLOAT) / 100))
        )), 2
    ) AS IGST,  
      ${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0"
        : "0"
      } AS CGST_Perc,
      ${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0"
        : "0"
      } AS SGST_Perc,
      ${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0"
        : "18"
      } AS IGST_Perc,
      0 AS SGST,
      0 AS CGST
    `;
  }

  try {
    const result = await sequelize.query(
      `SELECT 
      ROW_NUMBER() OVER (ORDER BY UTD DESC) AS SRNO,
      UTD as PurchaseOrderProductDetails,
      Product_Code,
      Item_Description AS Item_Name,
	  (select top 1 Godw_Name from GODOWN_MST where Godw_Code = '${Loc_Code}') as Location1Label,
    (select top 1 Godw_Code from GODOWN_MST where Godw_Code ='${Loc_Code}') as Location1,
	   (select top 1 asset_category from Purchase_Order where Purchase_Order.utd=Purchase_Id) as Category,
		  subcategory as SubCategory,
      (select top 1 Name from Assets_Group_Subcategory where Assets_Group_Subcategory.id=subcategory) as SubCategory_Name,
      (select top 1 name from Assets_Group where Assets_Group.id =(select top 1 asset_category from Purchase_Order where Purchase_Order.utd=Purchase_Id)) as Category_Name,
      Tax,
      HSN,
       Item_Type,
	    CASE 
      WHEN Item_Type = '1' THEN 'Parts'
      WHEN Item_Type = '2' THEN 'Service'
      WHEN Item_Type = '3' THEN 'Capital Goods'
      ELSE 'Unknown'
      END AS Item_TypeLabel,
      ROUND(CAST(Quantity AS FLOAT) - (SELECT COALESCE(SUM(Quantity), 0) FROM PurchaseEntryDtl WHERE popd = Purchase_Order_Product_Details.UTD), 2) AS Sup_Qty,
      ROUND(CAST(Unit_Price AS FLOAT), 2) AS Basic_Price,
      ROUND((CAST(Quantity AS FLOAT) - 
      (SELECT COALESCE(SUM(Quantity), 0) FROM PurchaseEntryDtl WHERE popd = Purchase_Order_Product_Details.UTD)) * CAST(Unit_Price AS FLOAT), 2) AS Taxable,ROUND(((CAST(Quantity AS FLOAT) - 
      (SELECT COALESCE(SUM(Quantity), 0) FROM PurchaseEntryDtl WHERE popd = Purchase_Order_Product_Details.UTD)) * CAST(Unit_Price AS FLOAT)  * (CAST(Discount AS FLOAT) / 100)), 2) AS Disc_Amt,
      ROUND((CAST(Quantity AS FLOAT) - COALESCE((SELECT SUM(Quantity) FROM PurchaseEntryDtl WHERE popd = Purchase_Order_Product_Details.UTD), 0)) * CAST(Unit_Price AS FLOAT) * (1 - (CAST(Discount AS FLOAT) / 100)), 2) AS Assessable_Rate,
      ROUND(((CAST(Quantity AS FLOAT) - COALESCE((SELECT SUM(Quantity) FROM PurchaseEntryDtl  WHERE popd = Purchase_Order_Product_Details.UTD), 0)) * CAST(Unit_Price AS FLOAT) * (1 - (CAST(Discount AS FLOAT) / 100))) * ${registration_type == "0" ||
        registration_type == "4" ||
        registration_type === null
        ? "0"
        : "1.18"
      }, 2) AS Inv_Amt,
      ROUND((0.09 * ((CAST(Quantity AS FLOAT) - (SELECT COALESCE(SUM(Quantity), 0) FROM PurchaseEntryDtl WHERE popd = Purchase_Order_Product_Details.UTD) * CAST(Unit_Price AS FLOAT)) - ((CAST(Quantity AS FLOAT) - (SELECT COALESCE(SUM(Quantity), 0) FROM PurchaseEntryDtl WHERE popd = Purchase_Order_Product_Details.UTD) * CAST(Unit_Price AS FLOAT)) * (CAST(Discount AS FLOAT) / 100)))), 2) AS CGST,
      ROUND((0.09 * ((CAST(Quantity AS FLOAT) - (SELECT COALESCE(SUM(Quantity), 0) FROM PurchaseEntryDtl WHERE popd = Purchase_Order_Product_Details.UTD) * CAST(Unit_Price AS FLOAT)) - ((CAST(Quantity AS FLOAT) - (SELECT COALESCE(SUM(Quantity), 0) FROM PurchaseEntryDtl WHERE popd = Purchase_Order_Product_Details.UTD) * CAST(Unit_Price AS FLOAT)) * (CAST(Discount AS FLOAT) / 100)))), 2) AS SGST,
      Discount AS discp,
      (select top 1 series from assets_group_subcategory where id=subcategory)as isMaintain,
      CAST(Purchase_Id AS VARCHAR) as PO_Number,
      UOM1,
    (select top 1 Misc_name from misc_mst where misc_type=72 and misc_code=UOM1 and export_type<3)as UOM1Label,
	${gstCalculation}
	FROM 
      Purchase_Order_Product_Details 
  WHERE 
      Purchase_Id IN (${items})
  `
    );
    const Po = await sequelize.query(
      `SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'purchase order'`
    );
    res.status(200).send({ result: result[0], Po: Po[0][0] });
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
exports.PurchaseEntryAsset = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Asset_Type = req.body.Asset_Type;
  try {
    let query;
    query = `SELECT CAST(id AS VARCHAR) AS value, name AS label
      FROM Assets_Group`;
    if (Asset_Type) {
      query += ` where Asset_Type = ${Asset_Type}`;
    }

    const result = await sequelize.query(query);
    res.status(200).send(result[0]);
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

//asset issue
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const processMainDataforassetissue = async (
  mainData,
  sequelize,
  Appr_Code,
  Remark
) => {
  // const t = await sequelize.transaction();
  const backgroundTasks = [];

  try {
    // Pre-fetch necessary static data
    const comp_name_result = await sequelize.query(
      `SELECT TOP 1 comp_name FROM comp_mst`
    );
    const comp_name = comp_name_result[0][0]?.comp_name;

    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.tran_id;
      console.log(item?.rowData, "c");
      const a = await sequelize.query(
        `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = :empcode AND module_code = 'AssetIssue'`,
        {
          replacements: { empcode },
          // , transaction: t
        }
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
          throw new Error("You are not the right person to approve this");
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

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE Product_Issue
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 1,
                Appr_1_Rem = :Remark,
                appr_1_date=GETDATE(),
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE Product_Issue
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 1,
                appr_2_date=GETDATE(),
                Appr_2_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE Tran_id = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE Product_Issue
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 1,
                appr_3_date=GETDATE(),
                Appr_3_Rem = :Remark,
                Fin_Appr = 1
            WHERE Tran_id = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        }

        // Execute the update queries
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Product_Issue WHERE Tran_id = :tran_id`,
          {
            replacements: { tran_id },
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, tran_id },
            // , transaction: t
          });
        }

        // Prepare message sending tasks for background execution
        // if (ApprovalLevel === 1) {
        //   const result = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   backgroundTasks.push(() => SendWhatsAppMessgae(result[0][0]?.mobile_no, 'approver_1_approve_message', [
        //     { "type": "text", "text": item?.rowData.SRM_Name },
        //     { "type": "text", "text": item?.rowData?.Cust_Name },
        //     { "type": "text", "text": item?.rowData?.Mob },
        //     { "type": "text", "text": item?.rowData?.modl_name },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //     { "type": "text", "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)' },
        //     { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": comp_name }
        //   ]));

        //   if (!Final_apprvl) {
        //     const approver2 = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode=(SELECT TOP 1 approver2_A FROM approval_matrix WHERE empcode='${item?.rowData.SRM}' AND module_code='discount')`);
        //     const outlet_name = await sequelize.query(`SELECT TOP 1 br_extranet FROM godown_mst WHERE godw_code='${item?.rowData.location}' AND export_type<3`);
        //     if (approver2[0]?.length && approver2[0][0].mobile_no) {
        //       backgroundTasks.push(() => SendWhatsAppMessgae(approver2[0][0].mobile_no, 'disc_appr_msg_l2_new', [
        //         { "type": "text", "text": outlet_name[0][0].br_extranet },
        //         { "type": "text", "text": `${item.rowData.Modl_Group_Name} , ${item.rowData.modl_name} , ${item.rowData.Veh_Clr_Name}` },
        //         { "type": "text", "text": item?.rowData?.Cust_Name },
        //         { "type": "text", "text": item?.rowData?.Dise_Amt },
        //         { "type": "text", "text": item?.rowData?.RM_Name },
        //         { "type": "text", "text": item?.rowData?.book_date },
        //         { "type": "text", "text": comp_name }
        //       ]));
        //     }
        //   }
        // } else if (ApprovalLevel === 2) {
        //   const mobile_emp = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
        //     backgroundTasks.push(() => SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_reject_message', [
        //       { "type": "text", "text": item?.rowData?.SRM_Name },
        //       { "type": "text", "text": item?.rowData?.Cust_Name },
        //       { "type": "text", "text": item?.rowData?.Mob },
        //       { "type": "text", "text": item?.rowData?.modl_name },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": comp_name }
        //     ]));
        //   }
        // }

        console.log({
          success: true,
          Message:
            affectedRows.length === 0
              ? "Cannot Approve"
              : `Approved on level ${ApprovalLevel}`,
        });
      }
    }
    // await t.commit();
    // Respond to the caller immediately
    return {
      success: true,
      message: "Main data processing initiated",
    };
  } catch (e) {
    console.error(e);
    //p
    throw e;
  } finally {
    setTimeout(async () => {
      try {
        for (const task of backgroundTasks) {
          await task();
          await delay(2000);
          // Execute each function in backgroundTasks
        }
      } catch (err) {
        console.error("Error executing background tasks:", err);
      }
    }, 1000);
  }
};
exports.approveby2forassetIssue = async function (req, res) {
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
        Message: "Please select the entry to approve",
      });
    }

    await processMainDataforassetissue(mainData, sequelize, Appr_Code, Remark);

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

exports.rejectby2forassetIssue = async function (req, res) {
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

    await processMainData1forassetissue(mainData, sequelize, Appr_Code, Remark);

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
async function processMainData1forassetissue(
  mainData,
  sequelize,
  Appr_Code,
  Remark
) {
  // const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.tran_id;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'AssetIssue'`,
        {
          replacements: { empcode },
          // , transaction: t
        }
      );

      const mobile_emp = await sequelize.query(
        `select top 1 mobile_no from employeemaster where empcode='${item?.rowData.SRM}'`
      );
      const comp_name = await sequelize.query(
        `select top 1 comp_name from comp_mst`
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
          throw new Error("You are not the right person to reject this");
        }

        const data = {
          Appr_Code,
          Remark,
        };

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE Product_issue
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 0,
                Appr_1_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
          `;
          // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
          //   await SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_1_2_reject_messaage', [
          //     {
          //       "type": "text",
          //       "text": item?.rowData.empname
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Cust_Name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Mob
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.modl_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr1_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Appr_1_Rem ? item?.rowData?.Appr_1_Rem : '(Not Given)'
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr1_name
          //     },
          //     {
          //       "type": "text",
          //       "text": comp_name[0][0].comp_name
          //     }
          //   ])
          // }
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE Product_issue
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 0,
                Appr_2_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
          // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
          //   await SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_1_2_reject_messaage', [
          //     {
          //       "type": "text",
          //       "text": item?.rowData.empname
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Cust_Name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Mob
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.modl_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr2_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Appr_2_Rem ? item?.rowData?.Appr_2_Rem : '(Not Given)'
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr2_name
          //     },
          //     {
          //       "type": "text",
          //       "text": comp_name[0][0].comp_name
          //     }
          //   ])
          // }
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE Product_issue
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 0,
                Appr_3_Rem = :Remark,
                Fin_Appr = 0
            WHERE Tran_id = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        }
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Product_issue WHERE Tran_id = :tran_id;`,
          {
            replacements: { tran_id },
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, tran_id },
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

    // await t.commit();
  } catch (e) {
    console.error(e);
    // await t.rollback();
    throw e;
  }
}
exports.viewdiscountapproaldataforassetIssue = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    let query;
    query = `
    select * from (
     select
     iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver1_A, approver1_B) and module_code = 'AssetIssue' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver2_A, approver2_B) and module_code = 'AssetIssue' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
            IN (approver3_A, approver3_B) and module_code = 'AssetIssue' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_1_Code is not null,Appr_1_Code,
               (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                from Approval_Matrix where module_code = 'AssetIssue' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr1_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =
               (select iif(Appr_2_Code is not null,Appr_2_Code,
               (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                from Approval_Matrix where  module_code = 'AssetIssue' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr2_name,
               (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
           where empcode =
               (select iif(Appr_3_Code is not null,Appr_3_Code,
               (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                from Approval_Matrix where module_code = 'AssetIssue' and   SRM collate database_default = empcode collate database_default)))
               and   Export_Type < 3) as apr3_name,
               iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}'
              IN (approver1_A, approver1_B) and module_code = 'AssetIssue' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
              IN (approver2_A, approver2_B) and module_code = 'AssetIssue' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
              IN (approver3_A, approver3_B) and module_code = 'AssetIssue' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
               tran_id,Cast(Req_Date as date)as RequestedDate,(select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
           where empcode =srm)as EmpName,
		   (SELECT TOP 1 name FROM Assets_Group WHERE id = Category) AS CategoryName,
        (SELECT TOP 1 name FROM Assets_Group_Subcategory WHERE id =Subcategory) AS SubCategoryName,
		Description, Quantity,Appr1_Qty, Reason,srm as emp_code,
		(SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Location) AS LocationName,
		(
      SELECT 

      SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END) +
        SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)+
        SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)
          
      FROM 
          Product_History
      WHERE 
          Product_History.SubCategory = Product_Issue.SubCategory 
          AND Source_Location = '${loc_code}'
  ) AS Available
		   from Product_Issue where Req_Date between '${dateFrom}' and '${dateto}' and location in (${loc_code}) 
               and srm in  (select empcode from approval_matrix where
                 '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))
               ) as dasd            
                 `;
    if (req.body.status == 2) {
      query += `where  (status_khud_ka is null and status_appr is null)  Order By tran_id desc`;
    } else {
      query += `where  status_khud_ka =${req.body.status}  Order By tran_id desc`;
    }
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.FindallProduct = async function (req, res) {
  try {
    const subcategory = req.body.subcategory;
    const loc_code = req.body.branch;
    const AlreadyIssued = req.body.AlreadyIssued;
    const IssuedAsset = req.body.IssuedAsset;
    const sequelize = await dbname(req.headers.compcode);
    let branch;
    if (AlreadyIssued) {
      const issuedAssetIds = IssuedAsset.join(",");
      branch = await sequelize.query(
        `select UTD,Name,Manufacturer,Model,(
      SELECT 
          SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)
          
      FROM 
          Product_History
      WHERE 
          Product_History.Asset_ID = asset_product.UTD 
          AND Source_Location = '${loc_code}'
  ) AS qty,
  (
      SELECT 
      SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)
          
      FROM 
          Product_History
      WHERE 
          Product_History.Asset_ID = asset_product.UTD 
          AND Source_Location in (${loc_code})
  )  as issue_qty, 
  Serial_No,
  (select top 1 series from assets_group_subcategory where assets_group_subcategory.id = asset_product.subcategory) as flag,Description from asset_product where utd in (${issuedAssetIds})`
      );
    } else {
      branch = await sequelize.query(
        `select UTD,Name,Manufacturer,Model,
        (SELECT 
      SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)
          
      FROM 
          Product_History
      WHERE 
          Product_History.Asset_ID = asset_product.UTD 
          AND Source_Location in (${loc_code})
  ) AS qty
,(
      SELECT 

      SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${loc_code})  THEN Quantity ELSE 0 END)
          
      FROM 
          Product_History
      WHERE 
          Product_History.Asset_ID = asset_product.UTD 
          AND Source_Location in (${loc_code})
  )  as issue_qty,Serial_No,(select top 1 series from assets_group_subcategory where assets_group_subcategory.id = asset_product.subcategory) as flag, Description from asset_product where Subcategory='${subcategory}'`
      );
    }
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.EmployeeAssetSave = async function (req, res) {
  const { tran_id, ...General } = req.body.formdata;
  console.log(req.body, "request.body");
  // Validate Asset Product data
  const { error: assetError, value: validatedData } =
    productIssueSchema.validate(General, {
      abortEarly: false,
      stripUnknown: true,
    });

  // Check if any validation errors occurred
  if (assetError) {
    const errors = assetError.details.map((err) => err.message);
    return res.status(400).send({ success: false, message: errors.join(", ") });
  }

  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    const IsApproval = await sequelize.query(
      `select * from approval_matrix where empcode='${General.EmpCode}' and module_code='AssetIssue'`,
      {
        transaction: t,
      }
    );
    validatedData.Fin_Appr = IsApproval[0].length > 0 ? null : 1;
    // Create the Asset Product
    const ProductIssue = _Product_Issue(sequelize, Sequelize.DataTypes);
    const createdProductIssue = await ProductIssue.create(validatedData, {
      transaction: t,
    });

    // Log Asset Product creation
    console.log("Asset Product created:", createdProductIssue);

    await t.commit();
    const RequestId = await sequelize.query(
      `SELECT  CAST(ISNULL(MAX(tran_id) + 1, 1) AS VARCHAR) AS RequestId
      FROM Product_Issue`
    );
    const EmpName = await sequelize.query(
      `SELECT concat(Empfirstname,' ',Emplastname)as EmpName from employeemaster where empcode='${General.EmpCode}'`
    );

    // Prepare response
    const response = {
      success: true,
      General: createdProductIssue,
      RequestId: RequestId[0][0].RequestId,
      EmpName: EmpName[0][0].EmpName,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback();
    }
    res.status(500).json({ error: "An error occurred during Saving." });
  }
};

exports.ShowRequestId = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const EmpCode = req.body.EmpCode;
  try {
    const result = await sequelize.query(
      `SELECT  CAST(ISNULL(MAX(tran_id) + 1, 1) AS VARCHAR) AS RequestId
      FROM Product_Issue`
    );
    const EmpName = await sequelize.query(
      `SELECT concat(Empfirstname,' ',Emplastname)as EmpName from employeemaster where empcode='${EmpCode}'`
    );
    console.log(result, "rest");
    res.status(200).send({ result: result[0][0], employee: EmpName[0][0] });
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

exports.EmployeeView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const empcode = req.body.empcode;
    const result = await sequelize.query(
      `select * from (
        select
        iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}' 
               IN (approver1_A, approver1_B) and module_code = 'assetIssue' and Product_Issue.EMPCODE collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}' 
               IN (approver2_A, approver2_B) and module_code = 'assetIssue' and Product_Issue.EMPCODE collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${empcode}' 
               IN (approver3_A, approver3_B) and module_code = 'assetIssue' and Product_Issue.EMPCODE collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
        
                  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
              where empcode =
                  (select iif(Appr_1_Code is not null,Appr_1_Code,
                  (select iif(Approver1_A = '${empcode}', Approver1_A, iif(Approver1_B = '${empcode}',Approver1_B,Approver1_A))
                   from Approval_Matrix where module_code = 'assetIssue' and   Product_Issue.EMPCODE collate database_default = empcode collate database_default)))
                  and   Export_Type < 3) as apr1_name,
                                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
              where empcode =
                  (select iif(Appr_2_Code is not null,Appr_2_Code,
                  (select iif(Approver2_A = '${empcode}', Approver2_A, iif(Approver2_B = '${empcode}',Approver2_B,Approver2_A))
                   from Approval_Matrix where  module_code = 'assetIssue' and   Product_Issue.EMPCODE collate database_default = empcode collate database_default)))
                  and   Export_Type < 3) as apr2_name,
                  (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
              where empcode = 
                  (select iif(Appr_3_Code is not null,Appr_3_Code,
                  (select iif(Approver3_A = '${empcode}',Approver3_A,iif(Approver3_B = '${empcode}',Approver3_B,Approver3_A))
                   from Approval_Matrix where module_code = 'assetIssue' and   Product_Issue.EMPCODE collate database_default = empcode collate database_default)))
                  and   Export_Type < 3) as apr3_name,

    
                  iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${empcode}' 
                 IN (approver1_A, approver1_B) and module_code = 'assetIssue' and Product_Issue.EMPCODE collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}' 
                 IN (approver2_A, approver2_B) and module_code = 'assetIssue' and Product_Issue.EMPCODE collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${empcode}' 
                 IN (approver3_A, approver3_B) and module_code = 'assetIssue' and Product_Issue.EMPCODE collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
                  iif(fin_appr is null  ,iif(Appr_1_Stat is null ,1,iif(Appr_2_Stat is null , 2,iif(Appr_3_Stat is null,3,3))),4) as stat, Appr_1_Stat,Appr_2_Stat,Appr_3_Stat,
                  tran_id, CAST(Req_Date as DATE) AS REQ_DATE,fin_appr, (SELECT TOP 1 NAME FROM ASSETS_GROUP WHERE ASSETS_GROUP.ID = Product_Issue.Category) AS CategoryName, 
(SELECT TOP 1 NAME FROM Assets_Group_Subcategory WHERE Assets_Group_Subcategory.ID = Product_Issue.SubCategory) AS SubCategoryName, Description,
Reason from Product_Issue WHERE EmpCode in ('${empcode}')) as dasd order by tran_id desc
        `
    );

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

exports.Assetdashboard = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  // const Insu_Entry = _Insu_Entry(sequelize, DataTypes);
  let { branch } = req.body;
  const t = await sequelize.transaction();
  try {
    const Available_Asset_Category =
      await sequelize.query(`WITH AvailableAssets AS (
      SELECT 
          utd AS id, 
          name,
          icon, 
          (SELECT TOP 1 Name FROM Assets_Group WHERE Id = Asset_Product.Category) AS Category_Name,
          (SELECT TOP 1 Icon FROM Assets_Group WHERE Id = Asset_Product.Category) AS Category_icon,
          Category AS Group_Id,
          Subcategory AS SubGroup_Id,
          (
              SELECT
                  SUM(CASE WHEN Tran_Type IN (1, 2, 4, 5, 9) AND Source_Location IN (${branch}) THEN Quantity ELSE 0 END) - 
                  SUM(CASE WHEN Tran_Type IN (3, 6, 7, 8) AND Source_Location IN (${branch}) THEN Quantity ELSE 0 END) 
              FROM
                  Product_History
              WHERE
                  Product_History.Asset_ID = Asset_Product.UTD
                  AND Source_Location IN (${branch})
          ) AS Available
      FROM 
          Asset_Product 
  )
  SELECT 
   Group_Id,
  Category_icon,
      Category_Name,
      COUNT(id) AS Available_Assets
  FROM 
      AvailableAssets
  WHERE 
      Available > 0
  GROUP BY 
      Category_Name,Category_icon,Group_Id`);

    const Available_Asset_Category_Consumable =
      await sequelize.query(`WITH AvailableAssets AS (
        SELECT 
            utd AS id, 
            name,
            icon, 
            (SELECT TOP 1 Name FROM Assets_Group WHERE Id = Asset_Product.Category) AS Category_Name,
            (SELECT TOP 1 Icon FROM Assets_Group WHERE Id = Asset_Product.Category) AS Category_icon,
            Category AS Group_Id,
            Subcategory AS SubGroup_Id,
            (
                SELECT
                    SUM(CASE WHEN Tran_Type IN (1, 2, 4, 5, 9) AND Source_Location IN (${branch}) THEN Quantity ELSE 0 END) - 
                    SUM(CASE WHEN Tran_Type IN (3, 6, 7, 8) AND Source_Location IN (${branch}) THEN Quantity ELSE 0 END) 
                FROM
                    Product_History
                WHERE
                    Product_History.Asset_ID = Asset_Product.UTD
                    AND Source_Location IN (${branch})
            ) AS Available
        FROM 
            Asset_Product where Category in (select id from Assets_Group where Asset_Type=2 and id is not null)
    )
    SELECT 
     Group_Id,
    Category_icon,
        Category_Name,
        COUNT(id) AS Available_Assets
    FROM 
        AvailableAssets
    WHERE 
        Available > 0
    GROUP BY 
        Category_Name,Category_icon,Group_Id`);

    //     const allresult = await sequelize.query(
    //       `
    //      select count(UTD)  as total from Asset_Product where
    //      Location in (${branch})
    //      union all
    // select count(UTD)  as total from Asset_Product where
    //      Location in (${branch}) and Asset_Status='1'
    //      union all
    // select count(UTD)  as total from Asset_Product where
    //      Location in (${branch}) and Asset_Status='2'
    //      union all
    // select  count(UTD)  as total from Asset_Product where
    //      Location in (${branch}) and Asset_Status='3'

    //       `,
    //       { transaction: t }
    //     );
    //     const CategorywiseAsset = await sequelize.query(
    //       `select count(utd)as Asset,(select top 1 Name from Assets_Group where id=Category)as Category_Name from Asset_Product where Location in (${branch}) group by Category`
    //     );
    //     const CategorywiseAssetInUse = await sequelize.query(
    //       `select count(utd)as Asset,(select top 1 Name from Assets_Group where id=Category)as Category_Name from Asset_Product where Location in (${branch}) and Asset_Status=1 group by Category`
    //     );
    //     const CategorywiseAssetUnderMaintence = await sequelize.query(
    //       `select count(utd)as Asset,(select top 1 Name from Assets_Group where id=Category)as Category_Name from Asset_Product where Location in (${branch}) and Asset_Status=2 group by Category`
    //     );
    //     const CategorywiseAssetRetired = await sequelize.query(
    //       `select count(utd)as Asset,(select top 1 Name from Assets_Group where id=Category)as Category_Name from Asset_Product where Location in (${branch}) and Asset_Status=3 group by Category`
    //     );
    //     const Asset_Purchased = await sequelize.query(
    //       `select concat(Name,' - ',Serial_No)as Asset_Name,Purchase_value,cast(Purchase_Date as date)as Purchase_Date from Asset_Product where Month(Purchase_Date)=${monthFrom} order by Purchase_Date`
    //     );
    //     if (monthFrom == 1) {
    //       monthFrom = 12;
    //       year = year - 1;
    //     } else {
    //       monthFrom = monthFrom - 1;
    //     }
    // const combinedObject = {
    //   Total_Assets: allresult[0][0].total || 0,
    //   Total_InUse: allresult[0][1].total || 0,
    //   Total_UnderMaintenance: allresult[0][2].total || 0,
    //   Total_Retired: allresult[0][3].total || 0,
    // };
    await t.commit();
    res.status(200).send({
      Available_Asset_Category: Available_Asset_Category[0],
      Available_Asset_Category_Consumable:
        Available_Asset_Category_Consumable[0],
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
//ko

exports.StockManagerView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;

  try {
    const result = await sequelize.query(`SELECT 
    tran_id,
    CAST(Req_Date AS DATE) AS Req_Date,
    COALESCE(
    (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) 
     FROM EMPLOYEEMASTER 
     WHERE EMPLOYEEMASTER.EMPCODE = Product_Issue.EmpCode),
    (SELECT TOP 1 Misc_name 
     FROM misc_mst 
     WHERE misc_type = 68 
       AND misc_code = Product_Issue.EmpCode 
       AND export_type < 3)
  ) AS EmpName,
    (SELECT TOP 1 NAME
     FROM ASSETS_GROUP
     WHERE ASSETS_GROUP.Id = Product_Issue.Category) AS CategoryName,
    Category,
    Location,
    srm,
    Issued_Asset,
    Revoked_Asset,
    CAST(IssuedDate AS DATE) AS IssuedDate,  
    Revoke_Reason,
    CAST(RevokeDate AS DATE)  AS RevokeDate,
    (SELECT TOP 1 NAME
     FROM Assets_Group_Subcategory
     WHERE Assets_Group_Subcategory.Id = Product_Issue.SubCategory) AS SubCategoryName,
    SubCategory,
    (
      SELECT 
          
       SUM(CASE WHEN Tran_Type = 1 AND Source_Location in  (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in  (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in  (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in  (${loc_code})  THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in  (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in  (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in  (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in  (${loc_code})  THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in  (${loc_code})  THEN Quantity ELSE 0 END)
          
      FROM 
          Product_History
      WHERE 
          Product_History.SubCategory = Product_Issue.SubCategory 
          AND Source_Location in  (${loc_code}) 
  ) AS Available,
    Description, 
    Reason,
    Quantity,
    Appr1_Qty,
    Created_By,
    CASE WHEN Returnable = '1' THEN 'YES'
	             WHEN Returnable  = '2' THEN 'NO'
				 ELSE '' 
                 END AS isReturnable,Returnable
FROM
    Product_Issue where Fin_Appr = '1' and Location in ('${loc_code}') and Req_Date BETWEEN '${datefrom}' AND '${dateto}' order by tran_id`);

    const subcategory =
      await sequelize.query(`SELECT CAST(id AS VARCHAR) AS value, name AS label
      FROM Assets_Group_subcategory where common is null or common =0`);

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: result[0],
      subcategory: subcategory[0],
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
exports.IssuedAsset = async function (req, res) {
  console.log(req.body, "resurestt");
  const sequelize = await dbname(req.headers.compcode);
  const SubCategory = req.body.SubCategory;
  const Location = req.body.Location;
  const status = req.body.status;
  const tran_id = req.body.tran_id;
  let result;
  try {
    if (status == "2") {
      result = await sequelize.query(
        `SELECT UTD, Name,Category, Subcategory,(select top 1 Name from Assets_Group_Subcategory where Assets_Group_Subcategory.id=Asset_Product.subcategory) as SubCategory_Name,
        (select top 1 name from Assets_Group where Assets_Group.id =Asset_Product.Category) as Category_Name,
            Location,Manufacturer,Model,Description,Serial_No,asset_Status,
            (select top 1 series from Assets_Group_Subcategory 
        where Assets_Group_Subcategory.id = asset_product.Subcategory) as flag, 
        (
        SELECT 
            
        SUM(CASE WHEN Tran_Type = 1 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)
        FROM 
            Product_History
        WHERE 
            Product_History.Asset_ID = Asset_Product.utd 
            AND Source_Location   = '${Location}'
    ) AS Qty
        ,  (
        SELECT 
        SUM(CASE WHEN Tran_Type = 1 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)
          
        FROM 
            Product_History
        WHERE 
            Product_History.Asset_ID = Asset_Product.utd 
            AND Source_Location   = '${Location}'
    )  as issue_qty FROM Asset_Product
        where Subcategory = '${SubCategory}' `
      );
    }
    if (status == "1") {
      result = await sequelize.query(`
      SELECT pid.Asset_Product as UTD,ap.Name as Name,ap.Category as Category,ap.Subcategory,
            (select top 1 Name from Assets_Group_Subcategory where Assets_Group_Subcategory.id=ap.subcategory) as SubCategory_Name,
            (select top 1 name from Assets_Group where Assets_Group.id =ap.Category) as Category_Name,ap.Manufacturer as Manufacturer,ap.Model as Model,
          ap.Description as Description,ap.Serial_No,ap.asset_Status,
          (select top 1 series from Assets_Group_Subcategory 
            where Assets_Group_Subcategory.id = ap.Subcategory) as flag, 
            (SELECT TOP 1 returnable 
              FROM Product_Issue 
              WHERE Product_Issue.tran_id = pid.Product_Issue) AS Returnable,
            pid.UTD as Product_DtlUtd,
            ( SELECT 
           SUM(CASE WHEN Tran_Type = 1 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)
          
            FROM 
                Product_History
            WHERE 
                Product_History.Asset_ID = ap.utd 
                AND Source_Location   = '${Location}'
        ) AS Qty,
        pid.Asset_Issue_Qty as issue_qty
      FROM Product_Issue_dtl AS pid
      JOIN Asset_Product AS ap
      ON pid.Asset_Product = ap.UTD and ap.Subcategory = '${SubCategory}' and pid.Product_Issue = '${tran_id}'
      `);
    }
    if (status == "3") {
      result = await sequelize.query(`
      SELECT pid.Asset_Product as UTD,ap.Name as Name,ap.Category as Category,ap.Subcategory,
            (select top 1 Name from Assets_Group_Subcategory where Assets_Group_Subcategory.id=ap.subcategory) as SubCategory_Name,
            (select top 1 name from Assets_Group where Assets_Group.id =ap.Category) as Category_Name,ap.Manufacturer as Manufacturer,ap.Model as Model,
          ap.Description as Description,ap.Serial_No,ap.asset_Status,
          (select top 1 series from Assets_Group_Subcategory 
            where Assets_Group_Subcategory.id = ap.Subcategory) as flag,  
            (SELECT TOP 1 returnable 
              FROM Product_Issue 
              WHERE Product_Issue.tran_id = pid.Product_Issue) AS Returnable,
            pid.UTD as Product_DtlUtd,
            ( SELECT 
           SUM(CASE WHEN Tran_Type = 1 AND Source_Location  in (${Location}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location  in (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location  in (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location  in (${Location}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location  in (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location  in (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location  in (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location  in (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location  in (${Location}) THEN Quantity ELSE 0 END)
          
            FROM 
                Product_History
            WHERE 
                Product_History.Asset_ID = ap.utd 
                AND Source_Location    in (${Location})
        ) AS Qty,
        pid.Asset_Issue_Qty as issue_qty
      FROM Product_Issue_dtl AS pid
      JOIN Asset_Product AS ap
      ON pid.Asset_Product = ap.UTD and ap.Subcategory = '${SubCategory}' and pid.Product_Issue = '${tran_id}'
      `);
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

exports.UpdateAssetIssue = async function (req, res) {
  if (req.body.selectedRow.Issued_Asset) {
    req.body.selectedRow.Revoked_Asset = "1";
  } else {
    req.body.selectedRow.Issued_Asset = "1";
  }
  try {
    const { tran_id, ...General } = req.body.selectedRow;

    // Validate Asset Product data
    const { error: assetError, value: Asset_Product } =
      productIssueSchema.validate(General, {
        abortEarly: false,
        stripUnknown: true,
      });

    if (assetError) {
      const errors = assetError.details;
      const errorMessage = errors.map((err) => err.message).join(", ");
      return res
        .status(400)
        .send({ success: false, this: "asseterror", message: errorMessage });
    }

    const sequelize = await dbname(req.headers.compcode);
    const ProductIssue = _Product_Issue(sequelize, Sequelize.DataTypes);

    const updatedProductIssue = await ProductIssue.update(Asset_Product, {
      where: { tran_id: tran_id },
      returning: true,
    });

    const Product_IssueDtl = _Product_Issue_Dtl(sequelize, Sequelize.DataTypes);

    const issuedAssetDtl = req.body.selectedrowdata || [];
    if (req.body.Status == "2") {
      for (const assetId of issuedAssetDtl) {
        try {
          await Product_IssueDtl.create({
            Product_Issue: req.body.selectedRow.tran_id,
            Asset_Product: assetId.id,
            Asset_Issue_Qty: assetId.rowData.issue_qty,
            Created_By: req.headers.name,
          });
        } catch (err) {
          console.error(
            `Error creating history for Issued Asset_ID: ${assetId.id}`,
            err
          );
          throw err;
        }
      }
    }
    if (req.body.Status == "1") {
      for (const assetId of issuedAssetDtl) {
        try {
          await Product_IssueDtl.update(
            {
              Revoke: "1",
            },
            {
              where: {
                UTD: assetId.rowData.Product_DtlUtd,
              },
            }
          );
        } catch (err) {
          console.error(`Error updating Asset_ID: ${assetId.id}`, err);
          throw err;
        }
      }
    }

    const Product_History = _Product_Histroy(sequelize, Sequelize.DataTypes);

    // Handle Issued_Asset
    if (req.body.Status == "2") {
      for (const assetId of issuedAssetDtl) {
        try {
          const da = await sequelize.query(
            `select Category,Subcategory from asset_product where utd='${assetId.id}'`
          );
          await Product_History.create({
            Asset_ID: assetId.id,
            Quantity: assetId.rowData.issue_qty,
            Tran_Type: 3, // 2 for Issued
            Issued_To: Asset_Product.srm,
            IssueDate: Asset_Product.IssuedDate,
            Revoke_Reason: Asset_Product.Revoke_Reason,
            RevokeDate: Asset_Product.RevokeDate,
            Created_By: Asset_Product.Created_By,
            Source_Location: Asset_Product.Location,
            Category: da[0][0].Category,
            SubCategory: da[0][0].Subcategory,
            Tran_Date: Asset_Product.IssuedDate,
          });
        } catch (err) {
          console.error(
            `Error creating history for Issued Asset_ID: ${assetId}`,
            err
          );
          throw err;
        }
      }
    }

    // Handle Revoked_Asset
    if (req.body.Status == "1") {
      for (const assetId of issuedAssetDtl) {
        try {
          const da = await sequelize.query(
            `select Category,Subcategory from asset_product where utd='${assetId.id}'`
          );
          console.log(`Creating history for Revoked Asset_ID: ${assetId}`);
          await Product_History.create({
            Asset_ID: assetId.id,
            Quantity: assetId.rowData.issue_qty,
            Tran_Type: 4, // 1 for Revoked
            Issued_To: Asset_Product.srm,
            IssueDate: Asset_Product.IssuedDate,
            Revoke_Reason: Asset_Product.Revoke_Reason,
            RevokeDate: Asset_Product.RevokeDate,
            Created_By: Asset_Product.Created_By,
            Source_Location: Asset_Product.Location,
            Category: da[0][0].Category,
            SubCategory: da[0][0].Subcategory,
            Tran_Date: Asset_Product.RevokeDate,
          });
        } catch (err) {
          console.error(
            `Error creating history for Revoked Asset_ID: ${assetId}`,
            err
          );
          throw err;
        }
      }
    }

    // if (req.body.Status) {
    //   if (req.body.Status == '2') {
    //     const issuedAssetIds = JSON.parse(req.body.selectedRow.Issued_Asset || '[]');
    //     await sequelize.query(
    //       `UPDATE Asset_Product SET Asset_Status = 2 WHERE utd IN (:ids)`,
    //       {
    //         replacements: { ids: issuedAssetIds },
    //         type: sequelize.QueryTypes.UPDATE,
    //       }
    //     );
    //   } else if (req.body.Status == '1') {
    //     const revokedAssetIds = JSON.parse(req.body.selectedRow.Revoked_Asset || '[]');
    //     await sequelize.query(
    //       `UPDATE Asset_Product SET Asset_Status = 1 WHERE utd IN (:ids)`,
    //       {
    //         replacements: { ids: revokedAssetIds },
    //         type: sequelize.QueryTypes.UPDATE,
    //       }
    //     );
    //   }
    // }

    res.status(200).send("Updated Successfully");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during Updating." });
  }
};
exports.EmployeeWiseAssetIssue = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;

  try {
    const result =
      await sequelize.query(`Select tran_id,CAST(Req_Date AS DATE) AS Req_Date,
     COALESCE(
    (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) 
     FROM EMPLOYEEMASTER 
     WHERE EMPLOYEEMASTER.EMPCODE = Product_Issue.EmpCode),
    (SELECT TOP 1 Misc_name 
     FROM misc_mst 
     WHERE misc_type = 68 
       AND misc_code = Product_Issue.EmpCode 
       AND export_type < 3)
  ) AS EmpName,
      (select top 1 EMPLOYEEDESIGNATION  from EMPLOYEEMASTER where empcode= Product_Issue.EmpCode and export_type < 3) as Designation,
      (select top 1 misc_name  from misc_mst where misc_type = 68 and  misc_code =(select top 1 division from EMPLOYEEMASTER where empcode= Product_Issue.EmpCode and export_type < 3))
      as Department,
      (select top 1 name from Assets_Group where Assets_Group.id = Product_Issue.Category) as CategoryName,
      (select top 1 name from Assets_Group_Subcategory where Assets_Group_Subcategory.id = Product_Issue.SubCategory) as SubCategoryName, Description, Reason,       
      (select top 1 Godw_Name from GODOWN_MST where GODOWN_MST.Godw_Code = Product_Issue.Location) as Location,
	  (select top 1 Name from Asset_Product where Asset_Product.UTD = (select top 1 Asset_Product from Product_Issue_dtl where Product_Issue_dtl.Product_Issue=Product_Issue.tran_id))as Issued_Asset,
	  CAST(IssuedDate AS DATE) AS Issued_DateFrom,Revoke_Reason,
      CAST(RevokeDate AS DATE)Revoke_DateFrom
      from Product_Issue  where Req_Date between '${datefrom}' and '${dateto}' and Location in (${loc_code}) order by Req_Date `);

    console.log(result, "komalresult");
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
exports.AssetWiseIssue = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;

  try {
    const result = await sequelize.query(`SELECT 
    ap.UTD,
    ap.Name,
    (SELECT TOP 1 name
     FROM Assets_Group
     WHERE Assets_Group.id = ap.Category) AS CategoryName,

    (SELECT TOP 1 name
     FROM Assets_Group_Subcategory
     WHERE Assets_Group_Subcategory.id = ap.SubCategory) AS SubCategoryName,

    (SELECT TOP 1 Godw_Name
     FROM GODOWN_MST
     WHERE GODOWN_MST.Godw_Code = ap.Location) AS Location,

    ap.Model,
    ap.Description,

     COALESCE(
    (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME)
     FROM EMPLOYEEMASTER
     WHERE EMPLOYEEMASTER.EMPCODE = pi.EmpCode),
    (SELECT TOP 1 Misc_name
     FROM misc_mst
     WHERE misc_type = 68
       AND misc_code = pi.EmpCode
       AND export_type < 3)
  ) AS EmpName,
    pi.Reason,
    CAST(pi.Req_Date AS DATE) AS Req_Date,
    CAST(pi.IssuedDate AS DATE) AS Issued_DateFrom,

    pi.Revoke_Reason,
    CAST(pi.RevokeDate AS DATE) AS Revoke_DateFrom,
    pid.Asset_Issue_Qty 

FROM
    Asset_Product ap
JOIN
    Product_Issue_Dtl pid ON pid.Asset_product = ap.UTD
JOIN
    Product_Issue pi ON pid.Product_issue = pi.tran_id
WHERE 
    pi.Req_Date BETWEEN '${datefrom}' and '${dateto}' 
    AND pi.Location = '${loc_code}'
ORDER BY 
    pi.Req_Date; `);
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
exports.AssetIssueDashboard = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "request.body");
  const Location = req.body.Location;
  const monthFrom = req.body.monthFrom;
  const year = req.body.year;

  const t = await sequelize.transaction();
  try {
    const allresult = await sequelize.query(
      `SELECT 
      COUNT(*) AS total_assets, 
      'Total Assets' AS description  -- Adding a description for clarity
  FROM 
      Asset_Product 
  WHERE 
      Location  in (${Location}) 
  
  UNION ALL
  
  -- Second part: Calculate available quantity
  SELECT 
      SUM(
          CASE 
              WHEN Tran_Type IN (1, 2, 4, 5, 9) AND Source_Location in (${Location}) THEN Quantity 
              WHEN Tran_Type IN (3, 6, 7, 8) AND Source_Location in (${Location}) THEN -Quantity
              ELSE 0 
          END
      ) AS total_assets, 
      'Available Quantity' AS description  -- Adding a description for clarity
  FROM 
      Product_History
  JOIN 
      Asset_Product ON Product_History.Asset_ID = Asset_Product.utd
  WHERE 
      Source_Location in (${Location})
  UNION ALL
  
  --Third Part: Calulate Total Issued Asset
  SELECT count(*) AS total_assets, 'Total Issued Asset' AS description  -- Adding a description for clarity
  FROM product_issue 
  WHERE Issued_Asset IS NOT NULL AND MONTH(IssuedDate) = '${monthFrom}'
          AND YEAR(IssuedDate) = '${year}' and Location in (${Location})
  UNION ALL

   --Fourth Part: Calulate Currently Issued Asset
  SELECT count(*) AS total_assets, 'Currently Issued Asset' AS description  -- Adding a description for clarity
  FROM product_issue 
  WHERE Issued_Asset IS NOT NULL and Revoked_Asset IS NULL AND MONTH(IssuedDate) = '${monthFrom}'
          AND YEAR(IssuedDate) = '${year}' and Location in (${Location})
  UNION ALL
  
  --Fifth Part: Calculate Revoke Asset
  SELECT count(*) AS total_assets, 'Revoke Asset' AS description  -- Adding a description for clarity
  FROM product_issue 
  WHERE Revoked_Asset IS NOT NULL AND MONTH(IssuedDate) = '${monthFrom}'
          AND YEAR(IssuedDate) = '${year}' and Location in (${Location})
  UNION ALL
  
  --Sixth Part: Calculate Pending Asset Issue
  SELECT count(*) AS total_assets, 'Pending Asset Issue' AS description  -- Adding a description for clarity
  FROM product_issue 
  WHERE Issued_Asset IS NULL and Fin_Appr = '${Location}' AND MONTH(IssuedDate) = '${monthFrom}'
          AND YEAR(IssuedDate) = '${year}' and Location in (${Location})
      `,
      { transaction: t }
    );

    const CategoryWise = await sequelize.query(`WITH Available AS (
      SELECT 
          SUM(
              CASE 
                  WHEN Tran_Type IN (1, 2, 4, 5, 9) AND Source_Location = 1 THEN Quantity 
                  WHEN Tran_Type IN (3, 6, 7, 8) AND Source_Location = 1 THEN -Quantity
                  ELSE 0 
              END
          ) AS Issue_Qty, 
          (SELECT TOP 1 name FROM Assets_Group WHERE Assets_Group.id = Asset_Product.Category) AS Category
      FROM 
          Product_History
      JOIN 
          Asset_Product ON Product_History.Asset_ID = Asset_Product.utd
      WHERE 
          Source_Location in (${Location})
      GROUP BY 
          Asset_Product.Category
  ),
  Issue AS (
      SELECT 
          COUNT(tran_id) AS Issue_Qty,
          (SELECT TOP 1 name FROM Assets_Group WHERE Assets_Group.id = Product_Issue.Category) AS Category
      FROM 
          Product_Issue
      WHERE 
          Issued_Asset IS NOT NULL
          AND Location in (${Location})
          AND MONTH(IssuedDate) = '${monthFrom}'
          AND YEAR(IssuedDate) = '${year}'
      GROUP BY 
          Product_Issue.Category
  )
  
  -- Combine the results from both queries
  SELECT 
      COALESCE(Available.Category, Issue.Category) AS Category,
      COALESCE(Available.Issue_Qty, 0) AS Available,
      COALESCE(Issue.Issue_Qty, 0) AS Issue
  FROM 
      Available
  FULL OUTER JOIN 
      Issue ON Available.Category = Issue.Category`);

    const setLineChartData = await sequelize.query(`
    SELECT 
        'Week ' + CAST(DATEPART(WEEK, IssuedDate) AS VARCHAR) AS period,
        COUNT(*) AS Issue_Qty,
        'Weekly' AS periodType
    FROM 
        Product_Issue
    WHERE 
        Issued_Asset IS NOT NULL AND Location IN (${Location})
    GROUP BY 
        DATEPART(WEEK, IssuedDate)
    
    UNION ALL
    
    SELECT 
        DATENAME(MONTH, IssuedDate) AS period,
        COUNT(*) AS Issue_Qty,
        'Monthly' AS periodType
    FROM 
        Product_Issue
    WHERE 
        Issued_Asset IS NOT NULL AND Location IN (${Location})
    GROUP BY 
        DATENAME(MONTH, IssuedDate)  -- Group by the name of the month
    
    UNION ALL
    
    SELECT 
        'Quarter ' + CAST(DATEPART(QUARTER, IssuedDate) AS VARCHAR) AS period,
        COUNT(*) AS Issue_Qty,
        'Quarterly' AS periodType
    FROM 
        Product_Issue
    WHERE 
        Issued_Asset IS NOT NULL AND Location IN (${Location})
    GROUP BY 
        DATEPART(QUARTER, IssuedDate)  -- Group by the quarter number
    
    ORDER BY 
        periodType, period
`);

    const setChartData = await sequelize.query(`
    SELECT 
    (SELECT CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) 
     FROM EMPLOYEEMASTER 
     WHERE EMPLOYEEMASTER.EMPCODE = PI.EmpCode) AS EMPNAME, 
	  COUNT(tran_id) AS Total_Assets,
    COUNT(CASE WHEN PI.Issued_Asset IS NOT NULL AND Fin_Appr = '1' THEN tran_id END) AS Total_Issued,
	COUNT(CASE WHEN PI.Issued_Asset IS NOT NULL AND Fin_Appr = '1' AND Revoked_Asset IS NOT NULL THEN tran_id END) AS Total_Revoke,
    COUNT(CASE WHEN PI.Issued_Asset IS NULL THEN tran_id END) AS Pending_Issue
   
FROM 
    Product_Issue PI
WHERE 
      Location in (${Location})
      AND MONTH(PI.IssuedDate) = '${monthFrom}'
      AND YEAR(PI.IssuedDate) = '${year}'
GROUP BY 
    PI.EmpCode
`);

    const SetDepartWiseData = await sequelize.query(`
    SELECT 
    (SELECT TOP 1 Misc_Name 
     FROM Misc_Mst 
     WHERE Misc_Type = 81 
       AND Misc_Code = EM.SECTION 
       AND Export_Type < 3) AS Category,
    COUNT(PI.tran_id) AS Issue_Qty
FROM 
    Product_Issue PI
JOIN 
    EMPLOYEEMASTER EM ON EM.EMPCODE = PI.EmpCode
WHERE 
    PI.Issued_Asset IS NOT NULL AND PI.Revoked_Asset IS NULL AND PI.Location in (${Location}) AND MONTH(PI.IssuedDate) = '${monthFrom}'
    AND YEAR(PI.IssuedDate) = '${year}'
GROUP BY 
    EM.SECTION
`);

    const combinedObject = {
      Available: allresult[0][1].total_assets || 0,
      TotalIssueAsset: allresult[0][2].total_assets || 0,
      CurrentlyIssueAsset: allresult[0][3].total_assets || 0,
      RevokeAsset: allresult[0][4].total_assets || 0,
      PendingAsset: allresult[0][5].total_assets || 0,
    };

    console.log(combinedObject, "combineobject");

    await t.commit();
    res.status(200).send({
      current: combinedObject,
      CategoryWise: CategoryWise[0],
      setLineChartData: setLineChartData[0],
      setChartData: setChartData[0],
      SetDepartWiseData: SetDepartWiseData[0],
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.LocationWiseReport = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  try {
    let query = `
    SELECT 
        ag.name AS category,
        ags.name AS subcategory,
        ap.Name,
        ph.Asset_ID,
        ap.Model,
        ap.Description,
        ap.Purchase_Date,
        ap.Purchase_Value,
        ap.Life_Span,
        ph.Source_Location,
        gm.Godw_Name AS Location,
        SUM(CASE 
                WHEN ph.Tran_Type IN (1, 2, 4, 5) THEN ph.Quantity  
                WHEN ph.Tran_Type IN (3, 6, 7) THEN -ph.Quantity    
                ELSE 0
            END) AS total_qty
    FROM 
        Asset_Product AS ap 
    JOIN 
        Product_History AS ph 
        ON ap.utd = ph.Asset_ID
    JOIN 
        Assets_Group AS ag 
        ON ag.Id = ph.Category
    JOIN 
        Assets_Group_Subcategory AS ags
        ON ags.Id = ph.SubCategory
    JOIN 
        GODOWN_MST AS gm
        ON gm.Godw_Code = ph.Source_Location
    WHERE 
        ph.Source_Location IN (${loc_code})
    GROUP BY 
        ag.name,
        ags.name,
        ph.Source_Location, 
        gm.Godw_Name,
        ph.Asset_ID, 
        ap.Name, 
        ap.Model, 
        ap.Description, 
        ap.Purchase_Date, 
        ap.Purchase_Value, 
        ap.Life_Span
    HAVING 
        SUM(CASE 
                WHEN ph.Tran_Type IN (1, 2, 4, 5) THEN ph.Quantity  
                WHEN ph.Tran_Type IN (3, 6, 7) THEN -ph.Quantity    
                ELSE 0
            END) > 0
    `;

    // Add dynamic conditions
    if (req.body.Category) {
      query = query.replace(
        /WHERE/,
        `WHERE ag.Id = '${req.body.Category}' AND`
      );
    }

    if (req.body.SubCategory) {
      query = query.replace(
        /WHERE/,
        `WHERE ags.Id = '${req.body.SubCategory}' AND`
      );
    }

    const result = await sequelize.query(query);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: query,
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

exports.FindBranchAddress = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.Location;
  try {
    const query = `
		select Mob_No as Contact_Number,City,State,CONCAT(Godw_Add1,' ',Godw_Add2,' ',Godw_Add3)as Address from GODOWN_MST where godw_code in (${loc_code})`;
    const result = await sequelize.query(query);
    res.status(200).send(result[0][0]);
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
exports.FindAvailable_Quantity = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.Location;
  console.log(req.body, "sksk");

  try {
    const query = `
		select Mob_No as Contact_Number,City,State,CONCAT(Godw_Add1,' ',Godw_Add2)as Address from GODOWN_MST where godw_code in (${loc_code})`;
    const result = await sequelize.query(query);
    res.status(200).send(result[0][0]);
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

//ku
exports.AssetMasterView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  try {
    let query = "";
    query += `SELECT 
    utd, 
    name, 
   (
        SELECT 
            
        SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)
        FROM 
            Product_History
        WHERE 
            Product_History.Asset_ID = Asset_Product.utd 
            AND Source_Location   in (${loc_code})
    ) AS qty,
    CASE
        WHEN (SELECT TOP 1 asset_type FROM Assets_Group WHERE Assets_Group.id = Asset_Product.Category) = 1 THEN 'Fixed Asset'
        WHEN (SELECT TOP 1 asset_type FROM Assets_Group WHERE Assets_Group.id = Asset_Product.Category) = 2 THEN 'Consumable Asset'
        ELSE 'Unknown'
    END AS Asset_Type,
    Category,
    (SELECT TOP 1 name FROM Assets_Group WHERE Assets_Group.id = Asset_Product.Category) AS CategoryName, 
    SubCategory,
    (SELECT TOP 1 name FROM Assets_Group_Subcategory WHERE Assets_Group_Subcategory.id = Asset_Product.SubCategory) AS SubCategoryName,
    (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE GODOWN_MST.Godw_Code = Asset_Product.Location) AS Location, 
    Model,
    CAST(Purchase_Date AS DATE) AS Purchase_Date, 
    Purchase_value,
    Description, Life_Span
FROM 
    Asset_Product `;

    if (req.body.Asset_Type) {
      query += `and  (SELECT TOP 1 asset_type FROM Assets_Group WHERE Assets_Group.id = Asset_Product.Category) ='${req.body.Asset_Type}'`;
    }

    if (req.body.Category) {
      query += `and  Category ='${req.body.Category}'`;
    }

    if (req.body.SubCategory) {
      query += `and  Subcategory ='${req.body.SubCategory}'`;
    }

    query += `order by utd desc`;
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

exports.viewBranchequests = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);

    let query = `
     SELECT
    (SELECT TOP 1 godw_name
     FROM GODOWN_MST
     WHERE Godw_Code = Location) AS FromBranch,
    (SELECT TOP 1 godw_name
     FROM GODOWN_MST
     WHERE Godw_Code = LocationTo) AS ToBranch,
    (SELECT TOP 1 name
     FROM Assets_Group
     WHERE id = Asset_Category) AS Asset_Name,
    (SELECT TOP 1 name
     FROM Assets_Group_Subcategory
     WHERE id = (SELECT top 1 Item
                 FROM Purchase_Req_Product_Details
                 WHERE Purchase_Id = purchase_request.UTD)) AS Item,
UTD,
(SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(purchase_request.UTD AS VARCHAR) AS PoNumber,
cast(Req_Date as date)as Req_Date,
    (SELECT COUNT(utd)
     FROM Purchase_Req_Product_Details
     WHERE Purchase_Id = purchase_request.UTD) AS Total_Items,
    (SELECT SUM(Total_Price)
     FROM Purchase_Req_Product_Details
     WHERE Purchase_Id = purchase_request.UTD) AS Total_Price,
      (SELECT CONVERT(INT, SUM(CONVERT(INT, Issue_Quantity))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS IsIssued,
    (SELECT top 1 Item_Description
     FROM Purchase_Req_Product_Details
     WHERE Purchase_Id = purchase_request.UTD) AS Item_Description,
   (SELECT CONVERT(INT, SUM(CONVERT(INT, Quantity))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS Quantity,
 (SELECT CONVERT(INT, SUM(CONVERT(INT, Issue_Quantity))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS Issue_Quantity,
(SELECT CONVERT(INT, SUM(CONVERT(DECIMAL(10, 2), Unit_Price))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS Unit_Price,

(SELECT CONVERT(INT, SUM(CONVERT(DECIMAL(10, 2), Discount))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS Discount

FROM
    purchase_request
WHERE 
    CAST(Req_Date AS date) BETWEEN '${dateFrom}' and '${dateto}' and location in (${loc_code}) and LocationTo is not null order by Req_Date desc
                `;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};
exports.viewItemDtl = async function (req, res) {
  try {
    const UTD = req.body.UTD;
    const sequelize = await dbname(req.headers.compcode);

    let query = `SELECT UTD, Item,(select top 1 name from Assets_Group_Subcategory where Assets_Group_Subcategory.id = Item) as Item_Name
,Item_Description,Quantity,Unit_Price,Total_Price,Discount 
FROM Purchase_Req_Product_Details WHERE Purchase_Id = '${UTD}'`;

    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};
exports.LedgerView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Loc_Code = req.body.Loc_Code;
    const searchText = req.body.searchText;
    const Data = await sequelize.query(`SELECT TOP 20
      Ledg_Code AS SRNO,
      Group_Code AS LedgerGroup,
      (SELECT TOP 1 Group_Name FROM Grup_Mst WHERE Group_Code = Ledg_Mst.Group_Code) AS GroupName,
      Ledg_Name AS Ledger_NAME,
      Ledg_Abbr AS PrintName,
      Ledg_Add6 AS AbbrName,
      Loc_Code AS Branch,
      (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Ledg_Mst.Loc_Code) AS BranchName,
      Ledg_Add1 AS ADDRESS1,
      Ledg_Add2 AS ADDRESS2,
      State_Code AS LedgerState,
      Ledg_Pan AS Pan,
      GSTTYPE AS RegistrationType,
      GST_No AS LedgerGstin,
      PARTYTYPE AS partyType,
      Ledg_Email AS EMAIL_ID,
      Ledg_Pin AS Pincode,
      Ledg_Ph1 AS MobileNo,
      MSME, ECC_No,
      CONCAT('https://erp.autovyn.com/backend/fetch?filePath=',(SELECT TOP 1 path FROM DOC_UPLOAD WHERE Export_Type = 1 AND Doc_Type = 'LEDG' AND TRAN_ID = Ledg_Code) ) AS DOCUMENT
   FROM
      Ledg_Mst
  WHERE
      (Loc_Code IN (0) OR Loc_Code IN (${Loc_Code})) And Ledg_Class=21
      AND Export_Type  <> 33                                                                                                                                                                      
      AND (Ledg_Name LIKE '%${searchText}%' OR Ledg_Abbr LIKE '%${searchText}%' OR Ledg_Code LIKE '%${searchText}%' )`);
    res.send({
      success: true,
      Data: Data[0],
    });
  } catch (err) {
    console.log(err);
  } finally {
    await sequelize.close();
  }
};
exports.FindAsset = async function (req, res) {
  try {
    const Subcategory = req.body.Subcategory;
    const sequelize = await dbname(req.headers.compcode);
    const loc_code = req.body.Location;

    let query = `WITH AvailableAssets AS (
    SELECT 
        utd AS id, 
        name,
        (
            SELECT
                SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) + 
                SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +          
                SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +          
                SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END)- 
                SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) - 
                SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) - 
                SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location  IN (${loc_code}) THEN Quantity ELSE 0 END)
          
            FROM
                Product_History
            WHERE
                Product_History.Asset_ID = Asset_Product.UTD
                AND Source_Location IN (${loc_code})
        ) AS Available
    FROM 
        Asset_Product 
    WHERE 
        Subcategory = '${Subcategory}'
)
SELECT 
   CAST(id AS VARCHAR) as value , 
    name as label,
    Available
FROM 
    AvailableAssets
WHERE 
    Available > 0;`;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.AssetWiseReport = async function (req, res) {
  console.log(req.body, "request.body");
  try {
    const Category = req.body.Category;
    const Subcategory = req.body.SubCategory;
    const product = req.body.product;
    const sequelize = await dbname(req.headers.compcode);

    let query = `SELECT
    CASE
       WHEN Tran_Type = '1' THEN 'ASSET OPENING'
       WHEN Tran_Type = '2' THEN 'ASSET TRANSFER(IN)'
       WHEN Tran_Type = '3' THEN 'ASSET ISSUE'
       WHEN Tran_Type = '4' THEN 'ASSET REVOKE'
       WHEN Tran_Type = '5' THEN 'ASSET PURCHASED'
       WHEN Tran_Type = '6' THEN 'ASSET SCRAP'
       WHEN Tran_Type = '7' THEN 'ASSET TRANSFER(out)'
       ELSE 'Unknown'
    END AS Tran_Type,
        (SELECT TOP 1 name FROM Asset_Product WHERE Asset_Product.utd = product_history.asset_ID) AS Asset_Name,asset_ID,
        (SELECT TOP 1 name
         FROM assets_group
         WHERE assets_group.id = (SELECT TOP 1 category FROM Asset_Product WHERE Asset_Product.utd = product_history.asset_ID)) AS Category_Name,
             (SELECT TOP 1 category FROM Asset_Product WHERE Asset_Product.utd = product_history.asset_ID) AS Category,
             (SELECT TOP 1 NAME FROM Assets_Group_Subcategory WHERE Assets_Group_Subcategory.Id = (SELECT TOP 1 SUBCATEGORY FROM Asset_Product WHERE Asset_Product.UTD = 
    product_history.asset_ID)) AS SubCategory_Name,
             (SELECT TOP 1 Subcategory FROM Asset_Product WHERE Asset_Product.utd = product_history.asset_ID) AS SubCategory,
              Quantity,
    (select top 1 godw_name from GODOWN_MST where Godw_Code=Source_Location)as Source_Location, Issued_To, Revoke_Reason, Created_by, Created_At, IssueDate, RevokeDate
    FROM
        product_history`;

    if (Category) {
      query += ` WHERE 
      EXISTS (
          SELECT 1 
          FROM Asset_Product 
          WHERE Asset_Product.utd = product_history.asset_ID 
          AND Asset_Product.category = '${Category}' 
      `;
    }
    if (Subcategory) {
      query += `AND Asset_Product.subcategory = '${Subcategory}' `;
    }
    if (product) {
      query += `AND Asset_Product.utd = '${product}'`;
    }
    if (Category) {
      query += `) ORDER BY 
    Created_At DESC;`;
    }

    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.UpdateQtyIssue = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Quantity = req.body.Quantity;
  const UTD = req.body.UTD;
  try {
    const query = `UPDATE Product_Issue set Appr1_qty = '${Quantity}' where tran_id = '${UTD}'`;
    const result = await sequelize.query(query);
    res.status(200).send(result[0][0]);
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

exports.ServiceView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;

  try {
    const result = await sequelize.query(`
    select UTD, (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
    where empcode =srm)as EmpName, Asset_Product,
	(select top 1 name from Asset_Product where Asset_Product.utd = Product_Service.Asset_Product) as AssetName, Description, Category, SubCategory,
Reason, Priority,CASE 
WHEN Priority = 1 THEN 'Daily Routine'
WHEN Priority = 2 THEN 'Minor Issue'
WHEN Priority = 3 THEN 'Urgent Need'
ELSE 'Unknown Priority'
END AS PriorityName, Cast(EmpDue_Date as date)as EmpDue_Date,Service_Type, Service_Status,
CASE 
    WHEN service_type = 1 THEN 'Routine Service'
    WHEN service_type = 2 THEN 'Paid Service'
    WHEN service_type = 3 THEN 'Warranty Service'
    WHEN service_type = 4 THEN 'Emergency Service'
    WHEN service_type = 5 THEN 'Annual Maintenance Contract (AMC)'
    WHEN service_type = 6 THEN 'Upgrade Service'
    ELSE 'Unknown Service Type'
END AS Service_TypeName,Flag,CAST(Service_Date AS DATE) AS Service_Date,Part_Amount, Labour_Amount,CAST(NextDue_Date AS DATE) AS NextDue_Date, Document,New_Description  from product_service
  WHERE 
      CAST(product_service.EmpDue_Date AS DATE) BETWEEN '${datefrom}' AND '${dateto}'
      AND Location in (${loc_code}) AND Fin_Appr = '1'
      `);

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

exports.AddService = async function (req, res) {
  const { UTD, ...General } = req.body.selectedRow;
  // Validate Asset Product data
  const { error: assetError, value: validatedData } =
    productServiceSchema.validate(General, {
      abortEarly: false,
      stripUnknown: true,
    });

  // Check if any validation errors occurred
  if (assetError) {
    const errors = assetError.details.map((err) => err.message);
    return res.status(400).send({ success: false, message: errors.join(", ") });
  }
  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();

    const ProductService = _Product_Service(sequelize, Sequelize.DataTypes);
    const createdProductService = await ProductService.update(validatedData, {
      where: { UTD: UTD },
      transaction: t,
      returning: true,
    });
    if (General.NextDue_Date) {
      const nextDueDate = new Date(General.NextDue_Date); // Convert to a Date object
      const validityDate = new Date(nextDueDate); // Clone the date to avoid modifying the original
      // Add 1 day to the cloned date for validity
      validityDate.setDate(validityDate.getDate() + 1);
      const formattedValidity = validityDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      const reminder_data = {
        reminder_name: "Service Reminder",
        date: General.NextDue_Date, // Original date remains unchanged
        time: "10:00",
        frequency: "One-Time",
        validity: formattedValidity, // Validity is one day after
        description: General.Description,
        Asset: General.Asset_Product,
        user_id: req.headers.user,
        Created_By: req.headers.user,
        type: 1,
      };
      const ReminderAsset = _ReminderAsset(sequelize, Sequelize.DataTypes);
      await ReminderAsset.create(reminder_data, {
        transaction: t,
      });
    }
    await t.commit();
    // Update the flag based on the new UTD
    await sequelize.query(
      `UPDATE Product_Service SET flag = '1' WHERE UTD = '${UTD}'`
    );

    const response = {
      success: true,
      General: createdProductService,
    };
    res.status(200).send(response);
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback();
    }
    res.status(500).json({ error: "An error occurred during Updating." });
  }
};

exports.PreReminder = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  const Category = req.body.Category;
  const SubCategory = req.body.SubCategory;
  let Group_Result;
  let SubGroup_Result;
  let Asset_Result;
  let query;
  console.log(req.body, "hsos");
  try {
    Group_Result = await sequelize.query(
      `select id as value,Name as label from Assets_Group`
    );
    if (Category)
      SubGroup_Result = await sequelize.query(`
       select id as value,Name as label from Assets_Group_Subcategory where Group_id in (${Category})`);
    query = `select UTD as value,Name as label from Asset_Product where Location in (${loc_code})`;
    if (Category) query += ` and Category in (${Category})`;
    if (SubCategory) query += ` and SubCategory in (${SubCategory})`;
    if (query) Asset_Result = await sequelize.query(query);
    res.status(200).send({
      Group_Result: Group_Result[0],
      SubGroup_Result: SubGroup_Result ? SubGroup_Result[0] : [],
      Asset_Result: Asset_Result ? Asset_Result[0] : [],
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

exports.home = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const data = await sequelize.query(
      `select convert(varchar,time )as newtime,* from reminder_asset where user_id='${req.query.user_code}' and validity>CURRENT_TIMESTAMP and type = '1'`
    );
    res.status(200).send(data[0]);
  } catch (err) {
    console.log(err);
  }
};

exports.AddReminder = async function (req, res) {
  const { reminder_id, ...General } = req.body;
  console.log(req.body, "request.body");

  // Validate Asset Product data _ReminderAsset, reminderAssetSchema
  const { error: assetError, value: validatedData } =
    reminderAssetSchema.validate(General, {
      abortEarly: false,
      stripUnknown: true,
    });

  // Check if any validation errors occurred
  if (assetError) {
    const errors = assetError.details.map((err) => err.message);
    return res.status(400).send({ success: false, message: errors.join(", ") });
  }

  // Ensure 'type' is always set to '1'
  validatedData.type = "1";

  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();

    if (req.body.reminder_id) {
      await sequelize.query(
        `update reminder_asset set type=33 where reminder_id=${req.body.reminder_id} `
      );
    }
    // Create the Reminder Asset with type='1'
    const ReminderAsset = _ReminderAsset(sequelize, Sequelize.DataTypes);
    const createdReminderAsset = await ReminderAsset.create(validatedData, {
      transaction: t,
    });

    // Log the Reminder Asset creation
    console.log("Reminder Asset created:", createdReminderAsset);

    await t.commit();
    const response = {
      success: true,
      General: createdReminderAsset,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback();
    }
    res.status(500).json({ error: "An error occurred during Saving." });
  }
};

exports.DeleteReminder = async function (req, res) {
  console.log(req.body, "sn");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const reminder_id = req.body.reminder_id;
    await sequelize.query(
      `update reminder_asset set type=33 where reminder_id=${reminder_id} `
    );
    res.status(200).send("done");
  } catch (err) {
    console.log(err);
  }
};

const schedule = require("node-schedule");
// Schedule the task to run every minute
const job = schedule.scheduleJob("*/1  * * * *  ", myTask);
async function myTask() {
  try {
    const sequelize = await dbname("demo1");

    const res = await sequelize.query(`SELECT DISTINCT qy.*, 
    (SELECT TOP 1 name FROM Assets_Group WHERE Assets_Group.Id = qy.Category) AS CategoryName,
  (SELECT TOP 1 name FROM Assets_Group_Subcategory WHERE Assets_Group_Subcategory.Id = qy.SubCategory) AS SubCategoryName,
  (SELECT TOP 1 name FROM Asset_Product WHERE Asset_Product.UTD = qy.Asset) AS AssetName
FROM
(
 SELECT r.*, ru.User_Mob, ru.User_Name
 FROM Reminder_Asset r
 JOIN user_tbl ru ON ru.User_Code = r.User_id
 WHERE
 (
     (r.frequency = 'daily' AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') AND r.type = 1) OR
     (r.frequency = 'one-time' AND r.date = CONVERT(date, CURRENT_TIMESTAMP) AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') AND r.type = 1) OR
     (r.frequency = 'monthly' AND DAY(r.date) = DAY(CONVERT(date, CURRENT_TIMESTAMP)) AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') AND r.type = 1) OR
     (r.frequency = 'yearly' AND MONTH(r.date) = MONTH(CONVERT(date, CURRENT_TIMESTAMP)) AND DAY(r.date) = DAY(CONVERT(date, CURRENT_TIMESTAMP)) AND r.time = FORMAT(CURRENT_TIMESTAMP, 'HH:mm') AND r.type = 1)
 )
 AND r.validity >= CONVERT(date, CURRENT_TIMESTAMP)
 AND ru.export_type < 3
 AND ru.Module_Code = 10
 AND ISNULL(ru.User_mob, '') <> ''
) AS qy`);

    const comapny = await sequelize.query(`select comp_name from comp_mst `);

    for (let i = 0; i < res[0].length; i++) {
      console.log(res[i], "komalnuwal");
      await SendWhatsAppMessgae("demo1", res[0][i]?.User_Mob, "reminder_msg", [
        {
          type: "text",
          text: res[0][i].reminder_name,
        },
        {
          type: "text",
          text: res[0][i].User_Name,
        },
        {
          type: "text",
          text: res[0][i].reminder_name,
        },
        {
          type: "text",
          text: res[0][i].date,
        },
        {
          type: "text",
          text: res[0][i].time,
        },
        {
          type: "text",
          text: res[0][i].description,
        },
        {
          type: "text",
          text:
            res[0][i].AssetName ||
            res[0][i].SubCategoryName ||
            res[0][i].CategoryName ||
            "",
        },
        {
          type: "text",
          text: comapny[0][0]?.comp_name,
        },
      ]);

      //   const res1 = await sequelize.query(`INSERT INTO Reminder_Asset_Msg (reminder_name, date, time,
      //     frequency, description, Category,  SubCategory, Asset, user_id,type,Created_By)
      // VALUES ('${res[0][i]?.reminder_name}', '${res[0][i]?.date}', '${res[0][i]?.time}',
      // '${res[0][i]?.frequency}', '${res[0][i]?.description}', '${res[0][i]?.category}',
      // '${res[0][i]?.subcategory}', '${res[0][i]?.Asset}', '${res[0][i]?.user_id}', '${}');
      // `)
    }
  } catch (e) {
    console.log(e);
  }
}

exports.AssetType = async function (req, res) {
  console.log(req.body, "sn");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const Asset_Id = req.body.Asset_Id;
    const res = await sequelize.query(
      `select asset_type from Assets_Group where Id = '${Asset_Id}'`
    );
    res.status(200).send(res);
  } catch (err) {
    console.log(err);
  }
};
exports.EmployeeData = async function (req, res) {
  console.log(req.body, "sn");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const EmpCode = req.body.EmpCode;

    const res1 = await sequelize.query(
      `select mobile_no,CORPORATEMAILID,EMPLOYEEDESIGNATION,(select top 1 Misc_name from Misc_Mst where misc_code=LOCATION and Misc_Type=85 and Export_Type<3)as EMPLOCATION 
from EMPLOYEEMASTER where empcode = '${EmpCode}'`
    );

    const DocumentNo =
      await sequelize.query(`SELECT CAST(ISNULL(MAX(tran_id) + 1, 1) AS VARCHAR) AS DocumentNo
    FROM Product_Issue;`);

    console.log(DocumentNo, "DocumentNo");
    res.status(200).send({
      res1: res1[0][0],
      DocumentNo: DocumentNo[0][0].DocumentNo,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.DirectIssueAssetCategory = async function (req, res) {
  console.log(req.body, "sn");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const SubCategory = req.body.SubCategory;
    const Location = req.body.location;
    const res1 = await sequelize.query(
      `select CAST(UTD AS VARCHAR) as value, name as label,Serial_No, Qty from asset_product where SubCategory = '${SubCategory}' and Location = '${Location}' `
    );

    console.log(res1);

    res.status(200).send(res1[0]);
  } catch (err) {
    console.log(err);
  }
};
exports.IssueDirectItemAdd = async function (req, res) {
  let t;
  try {
    const { Formdata, Service } = req.body;

    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();

    for (const service of Service) {
      // Prepare general data to save for the product issue
      const generalData = {
        Req_Date: Formdata.IssuedDate,
        EmpCode: Formdata.EmpCode,
        Location: Formdata.Location,
        srm: Formdata.EmpCode,
        Created_By: Formdata.Created_By,
        Category: service.Category,
        SubCategory: service.SubCategory,
        Issued_Asset: "1",
        Fin_Appr: "1",
        IssuedDate: Formdata.IssuedDate,
        Description: service.Description,
        Reason: service.Reason,
        Quantity: service.Issue_Quantity,
        Returnable: service.Returnable,
      };

      console.log(generalData, "first this will save understood");

      // Validate general data
      const { error: assetError, value: validatedGeneralData } =
        productIssueSchema.validate(generalData, {
          abortEarly: false,
          stripUnknown: true,
        });

      if (assetError) {
        const errors = assetError.details.map((err) => err.message);
        return res
          .status(400)
          .send({ success: false, message: errors.join(", ") });
      }

      // Create the general product issue record
      const ProductIssue = _Product_Issue(sequelize, Sequelize.DataTypes);
      const createdProductIssue = await ProductIssue.create(
        validatedGeneralData,
        { transaction: t, return: true }
      );
      // Save Issued_Asset details for each asset in the service
      const Issued_Assets = service.Issued_Asset; // Array of assets

      // const assetDetails = Issued_Assets.map(asset => ({
      // Product_Issue: createdProductIssue.tran_id,
      // Asset_Product: asset.UTD,
      // Asset_Issue_Qty: asset.issue_qty,
      // Created_By: createdProductIssue.Created_By
      // }));

      // console.log(assetDetails, "dtl save data will be saved by map");

      // // Bulk insert asset details
      // const ProductIssueDetail = _Product_Issue_Dtl(sequelize, Sequelize.DataTypes);
      // await ProductIssueDetail.bulkCreate(assetDetails, { transaction: t });

      for (const Issued_Asset of Issued_Assets) {
        const Data = {
          Product_Issue: createdProductIssue.tran_id,
          Asset_Product: Issued_Asset.UTD,
          Asset_Issue_Qty: Issued_Asset.issue_qty,
          Created_By: createdProductIssue.Created_By,
        };

        const ProductIssueDtl = _Product_Issue_Dtl(
          sequelize,
          Sequelize.DataTypes
        );
        const createdProductIssueDtl = await ProductIssueDtl.create(Data, {
          transaction: t,
          return: true,
        });

        const Product_History = _Product_Histroy(
          sequelize,
          Sequelize.DataTypes
        );
        await Product_History.create(
          {
            Asset_ID: createdProductIssueDtl.Asset_Product,
            Quantity: createdProductIssueDtl.Asset_Issue_Qty,
            Issued_To: createdProductIssue.EmpCode,
            IssueDate: createdProductIssue.IssuedDate,
            Tran_Type: 3, // 3 for Issued
            Created_By: createdProductIssueDtl.Created_By,
            Source_Location: createdProductIssue.Location,
            Category: createdProductIssue.Category,
            SubCategory: createdProductIssue.SubCategory,
            Tran_Date: createdProductIssue.IssuedDate,
            common: req.body.common ? 1 : null,
          },
          { transaction: t }
        );
      }
    }

    // Commit the transaction
    await t.commit();

    // Retrieve the newly created RequestId
    const RequestId = await sequelize.query(
      `SELECT CAST(ISNULL(MAX(tran_id) + 1, 1) AS VARCHAR) AS DocumentNo
       FROM Product_Issue`
    );

    // Prepare and send the response
    res.status(200).json({
      success: true,
      message: "Data processed successfully",
      data: RequestId[0][0].DocumentNo,
    });
  } catch (error) {
    console.error("Error:", error);

    // Rollback the transaction if there's an error
    if (t) {
      await t.rollback();
    }

    res.status(500).json({ error: "An error occurred during saving." });
  }
};
exports.EmployeeAssetServiceSave = async function (req, res) {
  const { UTD, ...General } = req.body.formdata;
  // Validate Asset Product data  _Product_Service productServiceSchema
  const { error: assetError, value: validatedData } =
    productServiceSchema.validate(General, {
      abortEarly: false,
      stripUnknown: true,
    });

  // Check if any validation errors occurred
  if (assetError) {
    const errors = assetError.details.map((err) => err.message);
    return res.status(400).send({ success: false, message: errors.join(", ") });
  }
  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();

    const IsApproval = await sequelize.query(
      `select * from approval_matrix where empcode='${General.EmpCode}' and module_code='AssetService'`,
      {
        transaction: t,
      }
    );
    validatedData.Fin_Appr = IsApproval[0].length > 0 ? null : 1;
    // Create the Asset Product
    const ProductService1 = _Product_Service(sequelize, Sequelize.DataTypes);
    const createdProductService1 = await ProductService1.create(validatedData, {
      transaction: t,
    });

    // Log Asset Product creation
    console.log("Asset Product created:", createdProductService1);

    await t.commit();
    const RequestId = await sequelize.query(
      `SELECT  CAST(ISNULL(MAX(UTD) + 1, 1) AS VARCHAR) AS RequestId
      FROM Product_Service`
    );

    // Prepare response
    const response = {
      success: true,
      General: createdProductService1,
      RequestId: RequestId[0][0].RequestId,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback();
    }
    res.status(500).json({ error: "An error occurred during Saving." });
  }
};

exports.EmployeeServiceView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    console.log(req.body, "gh");
    const empcode = req.body.empcode;
    const result = await sequelize.query(
      `SELECT * FROM (
        SELECT
            iif((SELECT TOP 1 EmpCode FROM Approval_Matrix WHERE '${empcode}' 
                 IN (approver1_A, approver1_B) AND module_code = 'AssetService' 
                 AND Product_Service.EmpCode COLLATE database_default = EmpCode COLLATE database_default) IS NOT NULL, 
                Appr_1_Stat,
                iif((SELECT TOP 1 EmpCode FROM Approval_Matrix WHERE '${empcode}' 
                     IN (approver2_A, approver2_B) AND module_code = 'AssetService' 
                     AND Product_Service.EmpCode COLLATE database_default = EmpCode COLLATE database_default) IS NOT NULL, 
                    Appr_2_Stat,
                    iif((SELECT TOP 1 EmpCode FROM Approval_Matrix WHERE '${empcode}' 
                         IN (approver3_A, approver3_B) AND module_code = 'AssetService' 
                         AND Product_Service.EmpCode COLLATE database_default = EmpCode COLLATE database_default) IS NOT NULL, 
                        Appr_3_Stat,
                        NULL)
                    )
                ) AS status_khud_ka,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) FROM employeemaster 
             WHERE EmpCode = (SELECT iif(Appr_1_Code IS NOT NULL, Appr_1_Code, 
                            (SELECT iif(Approver1_A = '${empcode}', Approver1_A, iif(Approver1_B = '${empcode}', Approver1_B, Approver1_A))
                             FROM Approval_Matrix WHERE module_code = 'AssetService' 
                             AND Product_Service.EmpCode COLLATE database_default = EmpCode COLLATE database_default)))
             AND Export_Type < 3) AS apr1_name,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) FROM employeemaster 
             WHERE EmpCode = (SELECT iif(Appr_2_Code IS NOT NULL, Appr_2_Code, 
                            (SELECT iif(Approver2_A = '${empcode}', Approver2_A, iif(Approver2_B = '${empcode}', Approver2_B, Approver2_A))
                             FROM Approval_Matrix WHERE module_code = 'AssetService' 
                             AND Product_Service.EmpCode COLLATE database_default = EmpCode COLLATE database_default)))
             AND Export_Type < 3) AS apr2_name,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) FROM employeemaster 
             WHERE EmpCode = (SELECT iif(Appr_3_Code IS NOT NULL, Appr_3_Code, 
                            (SELECT iif(Approver3_A = '${empcode}', Approver3_A, iif(Approver3_B = '${empcode}', Approver3_B, Approver3_A))
                             FROM Approval_Matrix WHERE module_code = 'AssetService' 
                             AND Product_Service.EmpCode COLLATE database_default = EmpCode COLLATE database_default)))
             AND Export_Type < 3) AS apr3_name,
            iif(fin_appr IS NULL,
                iif((SELECT TOP 1 EmpCode FROM Approval_Matrix WHERE '${empcode}' 
                     IN (approver1_A, approver1_B) AND module_code = 'AssetService' 
                     AND Product_Service.EmpCode COLLATE database_default = EmpCode COLLATE database_default) IS NOT NULL, 
                    Appr_1_Stat,
                    iif((SELECT TOP 1 1 AS result FROM Approval_Matrix WHERE '${empcode}' 
                         IN (approver2_A, approver2_B) AND module_code = 'AssetService' 
                         AND Product_Service.EmpCode COLLATE database_default = EmpCode COLLATE database_default) IS NOT NULL,
                        iif(Appr_1_Stat IS NULL, 1, Appr_2_Stat),
                        iif((SELECT TOP 1 1 AS result FROM Approval_Matrix WHERE '${empcode}' 
                             IN (approver3_A, approver3_B) AND module_code = 'AssetService' 
                             AND Product_Service.EmpCode COLLATE database_default = EmpCode COLLATE database_default) IS NOT NULL,
                            iif(Appr_2_Stat IS NULL, 1, Appr_3_Stat),
                            1)
                        )
                    ),
                1) AS status_appr,
            iif(fin_appr IS NULL, 
                iif(Appr_1_Stat IS NULL, 1, 
                    iif(Appr_2_Stat IS NULL, 2, 
                        iif(Appr_3_Stat IS NULL, 3, 3)
                    )
                ), 
                4) AS stat, 
            Appr_1_Stat, Appr_2_Stat, Appr_3_Stat,
            UTD, 
            CAST(Req_Date AS DATE) AS REQ_DATE, 
            (SELECT TOP 1 NAME FROM ASSETS_GROUP WHERE ASSETS_GROUP.ID = Product_Service.Category) AS CategoryName, Category,
            (SELECT TOP 1 NAME FROM Assets_Group_Subcategory WHERE Assets_Group_Subcategory.ID = Product_Service.SubCategory) AS SubCategoryName, SubCategory,
            (SELECT TOP 1 NAME FROM Asset_Product WHERE Asset_Product.UTD = Product_Service.Asset_Product) AS AssetName,Asset_Product, Priority,
            CASE 
            WHEN Priority = 1 THEN 'Daily Routine'
            WHEN Priority = 2 THEN 'Minor Issue'
            WHEN Priority = 3 THEN 'Urgent Need'
            ELSE 'Unknown Priority'
        END AS PriorityName, Service_Type, CASE 
        WHEN service_type = 1 THEN 'Routine Service'
        WHEN service_type = 2 THEN 'Paid Service'
        WHEN service_type = 3 THEN 'Warranty Service'
        WHEN service_type = 4 THEN 'Emergency Service'
        WHEN service_type = 5 THEN 'Annual Maintenance Contract (AMC)'
        WHEN service_type = 6 THEN 'Upgrade Service'
        ELSE 'Unknown Service Type'
    END AS Service_TypeName,
            Description,
            Reason 
        FROM Product_Service 
        WHERE EmpCode IN ('${empcode}')
    ) AS dasd
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

exports.ShowRequestIdService = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const result = await sequelize.query(
      `SELECT  CAST(ISNULL(MAX(UTD) + 1, 1) AS VARCHAR) AS RequestId
      FROM Product_Service`
    );
    console.log(result, "rest");
    res.status(200).send(result[0][0]);
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

exports.AssetServiceApproverView = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    let query;
    query = `
    select * from (
      select
      iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver1_A, approver1_B) and module_code = 'AssetService' and SRM collate database_default = empcode collate database_default) is not null ,Appr_1_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver2_A, approver2_B) and module_code = 'AssetService' and SRM collate database_default = empcode collate database_default) is not null , Appr_2_Stat,iif((SELECT top 1 empcode FROM Approval_Matrix WHERE '${Appr_Code}' 
             IN (approver3_A, approver3_B) and module_code = 'AssetService' and SRM collate database_default = empcode collate database_default) is not null,Appr_3_Stat,null))) as status_khud_ka,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode =
                (select iif(Appr_1_Code is not null,Appr_1_Code,
                (select iif(Approver1_A = '${Appr_Code}', Approver1_A, iif(Approver1_B = '${Appr_Code}',Approver1_B,Approver1_A))
                 from Approval_Matrix where module_code = 'AssetService' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr1_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode =
                (select iif(Appr_2_Code is not null,Appr_2_Code,
                (select iif(Approver2_A = '${Appr_Code}', Approver2_A, iif(Approver2_B = '${Appr_Code}',Approver2_B,Approver2_A))
                 from Approval_Matrix where  module_code = 'AssetService' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr2_name,
                (select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster
            where empcode =
                (select iif(Appr_3_Code is not null,Appr_3_Code,
                (select iif(Approver3_A = '${Appr_Code}',Approver3_A,iif(Approver3_B = '${Appr_Code}',Approver3_B,Approver3_A))
                 from Approval_Matrix where module_code = 'AssetService' and   SRM collate database_default = empcode collate database_default)))
                and   Export_Type < 3) as apr3_name,
                iif(fin_appr is null,iif((SELECT top 1 empcode FROM Approval_Matrix  WHERE '${Appr_Code}'
               IN (approver1_A, approver1_B) and module_code = 'AssetService' and SRM collate database_default = empcode collate database_default) is not null,Appr_1_Stat,iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
               IN (approver2_A, approver2_B) and module_code = 'AssetService' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_1_Stat is null ,1,Appr_2_Stat),iif((SELECT top 1 1 as result FROM Approval_Matrix WHERE '${Appr_Code}'
               IN (approver3_A, approver3_B) and module_code = 'AssetService' and SRM collate database_default = empcode collate database_default) is not null,iif(Appr_2_Stat is null ,1,Appr_3_Stat),1))),1) as status_appr,
                UTD,Cast(Req_Date as date)as RequestedDate,(select top 1 concat(EMPFIRSTNAME , ' ' , EMPLASTNAME)  FROM employeemaster 
            where empcode =srm)as EmpName,
        (SELECT TOP 1 name FROM Assets_Group WHERE id = Category) AS CategoryName,
         (SELECT TOP 1 name FROM Assets_Group_Subcategory WHERE id =Subcategory) AS SubCategoryName,
     (SELECT TOP 1 name FROM Asset_Product WHERE UTD =Asset_Product) AS AssetName,
     Description, Reason,srm as emp_code,CASE 
     WHEN Priority = 1 THEN 'Daily Routine'
     WHEN Priority = 2 THEN 'Minor Issue'
     WHEN Priority = 3 THEN 'Urgent Need'
     ELSE 'Unknown Priority'
 END AS Priority, Cast(EmpDue_Date as date)as EmpDue_Date,
 CASE 
            WHEN service_type = 1 THEN 'Routine Service'
            WHEN service_type = 2 THEN 'Paid Service'
            WHEN service_type = 3 THEN 'Warranty Service'
            WHEN service_type = 4 THEN 'Emergency Service'
            WHEN service_type = 5 THEN 'Annual Maintenance Contract (AMC)'
            WHEN service_type = 6 THEN 'Upgrade Service'
            ELSE 'Unknown Service Type'
        END AS Service_Type, REPLACE(Appr_1_Rem, '"', '') as Appr_1_Rem,
        REPLACE(Appr_2_Rem, '"', '') as Appr_2_Rem,
        REPLACE(Appr_3_Rem, '"', '') as Appr_3_Rem,
     (SELECT TOP 1 Godw_Name FROM GODOWN_MST WHERE Godw_Code = Location) AS LocationName,
     (select Count(*) from Asset_Product where Asset_Product.Subcategory=Product_Service.SubCategory and Asset_Product.Location=Product_Service.Location)as Available
        from Product_Service where Req_Date between '${dateFrom}' and '${dateto}' and location in (1) 
                and srm in  (select empcode from approval_matrix where
                  '${Appr_Code}'  IN (approver1_A, approver1_B,approver2_A, approver2_B,approver3_A, approver3_B))
                ) as dasd`;
    if (req.body.status == 2) {
      query += ` where (status_khud_ka is null and status_appr is null) order by RequestedDate`;
    } else {
      query += ` where status_khud_ka =${req.body.status}  order by RequestedDate`;
    }
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.approveby2forassetservice = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const mainData = req.body.UTD;
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
        Message: "Please select the entry to approve",
      });
    }

    await processMainDataforassetService(
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

exports.rejectby2forassetservice = async function (req, res) {
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

    await processMainData1forassetService(
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

const processMainDataforassetService = async (
  mainData,
  sequelize,
  Appr_Code,
  Remark
) => {
  // const t = await sequelize.transaction();
  const backgroundTasks = [];

  try {
    // Pre-fetch necessary static data
    const comp_name_result = await sequelize.query(
      `SELECT TOP 1 comp_name FROM comp_mst`
    );
    const comp_name = comp_name_result[0][0]?.comp_name;
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.UTD;
      console.log(item?.rowData, "c");
      const a = await sequelize.query(
        `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = :empcode AND module_code = 'AssetService'`,
        {
          replacements: { empcode },
          // , transaction: t
        }
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
          throw new Error("You are not the right person to approve this");
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

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE Product_Service
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 1,
                Appr_1_Rem = :Remark,
                appr_1_date=GETDATE(),
                Fin_Appr = :Final_apprvl
            WHERE UTD = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE Product_Service
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 1,
                appr_2_date=GETDATE(),
                Appr_2_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE UTD = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE Product_Service
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 1,
                appr_3_date=GETDATE(),
                Appr_3_Rem = :Remark,
                Fin_Appr = 1
            WHERE UTD = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        }

        // Execute the update queries
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Product_Service WHERE UTD = :tran_id`,
          {
            replacements: { tran_id },
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, tran_id },
            // , transaction: t
          });
        }

        // Prepare message sending tasks for background execution
        // if (ApprovalLevel === 1) {
        //   const result = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   backgroundTasks.push(() => SendWhatsAppMessgae(result[0][0]?.mobile_no, 'approver_1_approve_message', [
        //     { "type": "text", "text": item?.rowData.SRM_Name },
        //     { "type": "text", "text": item?.rowData?.Cust_Name },
        //     { "type": "text", "text": item?.rowData?.Mob },
        //     { "type": "text", "text": item?.rowData?.modl_name },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //     { "type": "text", "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)' },
        //     { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": comp_name }
        //   ]));

        //   if (!Final_apprvl) {
        //     const approver2 = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode=(SELECT TOP 1 approver2_A FROM approval_matrix WHERE empcode='${item?.rowData.SRM}' AND module_code='discount')`);
        //     const outlet_name = await sequelize.query(`SELECT TOP 1 br_extranet FROM godown_mst WHERE godw_code='${item?.rowData.location}' AND export_type<3`);
        //     if (approver2[0]?.length && approver2[0][0].mobile_no) {
        //       backgroundTasks.push(() => SendWhatsAppMessgae(approver2[0][0].mobile_no, 'disc_appr_msg_l2_new', [
        //         { "type": "text", "text": outlet_name[0][0].br_extranet },
        //         { "type": "text", "text": `${item.rowData.Modl_Group_Name} , ${item.rowData.modl_name} , ${item.rowData.Veh_Clr_Name}` },
        //         { "type": "text", "text": item?.rowData?.Cust_Name },
        //         { "type": "text", "text": item?.rowData?.Dise_Amt },
        //         { "type": "text", "text": item?.rowData?.RM_Name },
        //         { "type": "text", "text": item?.rowData?.book_date },
        //         { "type": "text", "text": comp_name }
        //       ]));
        //     }
        //   }
        // } else if (ApprovalLevel === 2) {
        //   const mobile_emp = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
        //     backgroundTasks.push(() => SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_reject_message', [
        //       { "type": "text", "text": item?.rowData?.SRM_Name },
        //       { "type": "text", "text": item?.rowData?.Cust_Name },
        //       { "type": "text", "text": item?.rowData?.Mob },
        //       { "type": "text", "text": item?.rowData?.modl_name },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": comp_name }
        //     ]));
        //   }
        // }

        console.log({
          success: true,
          Message:
            affectedRows.length === 0
              ? "Cannot Approve"
              : `Approved on level ${ApprovalLevel}`,
        });
      }
    }
    // await t.commit();
    // Respond to the caller immediately
    return {
      success: true,
      message: "Main data processing initiated",
    };
  } catch (e) {
    console.error(e);
    //p
    throw e;
  } finally {
    setTimeout(async () => {
      try {
        for (const task of backgroundTasks) {
          await task();
          await delay(2000);
          // Execute each function in backgroundTasks
        }
      } catch (err) {
        console.error("Error executing background tasks:", err);
      }
    }, 1000);
  }
};

async function processMainData1forassetService(
  mainData,
  sequelize,
  Appr_Code,
  Remark
) {
  // const t = await sequelize.transaction();
  try {
    console.log(mainData, "maindata");
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const tran_id = c?.UTD;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'AssetService'`,
        {
          replacements: { empcode },
          // , transaction: t
        }
      );

      const mobile_emp = await sequelize.query(
        `select top 1 mobile_no from employeemaster where empcode='${item?.rowData.SRM}'`
      );

      const comp_name = await sequelize.query(
        `select top 1 comp_name from comp_mst`
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
          throw new Error("You are not the right person to reject this");
        }

        const data = {
          Appr_Code,
          Remark,
        };

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE Product_Service
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 0,
                Appr_1_Rem = :Remark,
                Fin_Appr = 0
            WHERE UTD = :tran_id AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
          `;
          // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
          //   await SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_1_2_reject_messaage', [
          //     {
          //       "type": "text",
          //       "text": item?.rowData.empname
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Cust_Name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Mob
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.modl_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr1_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Appr_1_Rem ? item?.rowData?.Appr_1_Rem : '(Not Given)'
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr1_name
          //     },
          //     {
          //       "type": "text",
          //       "text": comp_name[0][0].comp_name
          //     }
          //   ])
          // }
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE Product_Service
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 0,
                Appr_2_Rem = :Remark,
                Fin_Appr = 0
            WHERE UTD = :tran_id AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
          // if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
          //   await SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_1_2_reject_messaage', [
          //     {
          //       "type": "text",
          //       "text": item?.rowData.empname
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Cust_Name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Mob
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.modl_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr2_name
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.Appr_2_Rem ? item?.rowData?.Appr_2_Rem : '(Not Given)'
          //     },
          //     {
          //       "type": "text",
          //       "text": item?.rowData?.apr2_name
          //     },
          //     {
          //       "type": "text",
          //       "text": comp_name[0][0].comp_name
          //     }
          //   ])
          // }
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE Product_Service
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 0,
                Appr_3_Rem = :Remark,
                Fin_Appr = 0
            WHERE UTD = :tran_id AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        }
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Product_Service WHERE UTD = :tran_id;`,
          {
            replacements: { tran_id },
            // , transaction: t
          }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, tran_id },
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

    // await t.commit();
  } catch (e) {
    console.error(e);
    // await t.rollback();
    throw e;
  }
}

exports.LedgVendordtl = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const multi_loc = req.body.multi_loc;

  try {
    const result = await sequelize.query(
      `SELECT 
      CAST(Ledg_Code AS DECIMAL(10, 0)) AS value, 
      Ledg_Name AS label 
  FROM Ledg_Mst 
  WHERE LEDG_CLASS = 21 
    AND EXPORT_tYPE < 5 
    AND Loc_code IN (${multi_loc}, 0) 
  ORDER BY Ledg_Name`
    );
    console.log(result, "rest");
    res.status(200).send(result[0]);
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

exports.LedgVendordtloptions = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "request.body");
  const Ledg_Code = req.body.Ledg_Code;

  try {
    const result = await sequelize.query(
      `select ledg_code, ledg_name, ledg_ph1, ledg_email, ledg_add1,Ledg_Name3 from ledg_mst where ledg_code = '${Ledg_Code}' and export_type < 3`
    );
    console.log(result, "rest");
    res.status(200).send(result[0][0]);
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

exports.AddPartRateList = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "request.body");
  const Ledg_Code = req.body.Ledg_Code;

  try {
    if (req.body.EmpExperience) {
      await sequelize.query(
        `Delete from ledg_RCN where ledg_Code = '${Ledg_Code}'`
      );

      for (const data of req.body.EmpExperience) {
        await sequelize.query(`
                      INSERT INTO ledg_RCN (ledg_Code, Item_Code, Rate, Party_Rate, Valid_From, Valid_Upto, Qty_From, Qty_Upto) 
                      VALUES ('${Ledg_Code}','${data.Item_Code}', ${data.Rate}, ${data.Party_Rate}, '${data.Valid_From}', '${data.Valid_Upto}', ${data.Qty_From}, ${data.Qty_Upto});
                  `);
      }
    }

    const result =
      await sequelize.query(`select ledg_code , item_code,rate,party_rate,CAST(Valid_From AS DATE) AS Valid_From,
    CAST(Valid_Upto AS DATE) AS Valid_Upto, Qty_From, Qty_Upto from ledg_RCN where Ledg_Code = '${Ledg_Code}'`);

    console.log(result, "rest");
    res.status(200).send(result[0]);
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

// exports.findMasters = async function (req, res) {
//   const sequelize = await dbname(req.headers.compcode);
//   const InventoryItems = _InventoryItems(sequelize, DataTypes);

//   try {
//     const flag = req.body.flag
//     const multi_loc = req.body.multi_loc;
//     let book_mst;
//     if (flag == 1) {
//       book_mst = await sequelize.query(`select CAST(Book_Code AS VARCHAR) as value , Book_Name as label, Inv_Book from Book_Mst where export_type < 3 and Book_Type = 7 AND Loc_Code in (${multi_loc}) AND Inv_Book = 1`);
//     }
//     else {
//       book_mst = await sequelize.query(`select CAST(Book_Code AS VARCHAR) as value , Book_Name as label, Inv_Book from Book_Mst where export_type < 3 and Book_Type = 8 AND Loc_Code in (${multi_loc}) AND Inv_Book = 1`);
//     }
//     const Ledgers = await sequelize.query(`select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name As label from Ledg_Mst where Group_Code in (52,53) AND Loc_Code in (${multi_loc}) AND export_type < 3`);
//     let PostLedg
//     if (flag == 1) {
//       PostLedg = await sequelize.query(`WITH RecursiveSubGroups AS (
//              SELECT Group_Code, Sub_Group
//              FROM Grup_Mst
//              WHERE Sub_Group in (13)
//              UNION ALL
//              SELECT g.Group_Code, g.Sub_Group
//              FROM Grup_Mst g
//              INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
//          )
//          select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (
//          SELECT Group_Code
//          FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 1;`); //Posting Ledger
//     } else {
//       PostLedg = await sequelize.query(`WITH RecursiveSubGroups AS (
//               SELECT Group_Code, Sub_Group
//               FROM Grup_Mst
//               WHERE Sub_Group in (14)
//               UNION ALL
//               SELECT g.Group_Code, g.Sub_Group
//               FROM Grup_Mst g
//               INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
//           )
//           select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (
//           SELECT Group_Code
//           FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 1;`); //Posting Ledger
//     }
//     const States = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value,  MIsc_Name AS label from Misc_Mst WHERE Misc_Type = 3`);
//     const AllBranches = await sequelize.query('select CAST(Godw_Name AS VARCHAR) AS label, CAST(Godw_Code AS VARCHAR) AS value from Godown_Mst WHERE Export_Type < 3');
//     const ItemNames = await sequelize.query(`select top 1000 COALESCE(CAST(ITEM_CODE AS VARCHAR), CAST(UTD AS VARCHAR)) +' | ' + ITEM_NAME + ' | ' + (SELECT TOP 1 Godw_Name FROM Godown_mst Where Godw_Code = LOC_CODE) AS label, CAST(UTD AS VARCHAR) as value from InventoryItems`);
//     const UOM = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`);
//     const BRANDS = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 617`);
//     const Cost_Center = await sequelize.query(`SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 401`);
//     const ExpenseLedger = await sequelize.query(`select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE ServerId = 13`);
//     const IncomeLedger = await sequelize.query(`select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE ServerId = 14`);
//     const VendorAc = await sequelize.query(`	SELECT CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label FROM Ledg_Mst WHERE  LEDG_CLASS=21 AND EXPORT_tYPE<5 AND Loc_code in (${multi_loc},0) ORDER BY Ledg_Name`);
//     const ExpLedger = await sequelize.query(`WITH RecursiveSubGroups AS (
//           SELECT Group_Code, Sub_Group
//           FROM Grup_Mst
//           WHERE Sub_Group in (2,3)
//           UNION ALL
//           SELECT g.Group_Code, g.Sub_Group
//           FROM Grup_Mst g
//           INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
//       )
//       select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (
//       SELECT Group_Code
//       FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc}) AND Export_Type < 1;`) // vendor ac

//     res.send({
//       success: true, book_mst: book_mst[0],
//       Ledgers: Ledgers[0], PostLedg: PostLedg[0],
//       States: States[0], AllBranches: AllBranches[0],
//       ItemNames: ItemNames[0], UOM: UOM[0], BRANDS: BRANDS[0],
//       Cost_Center: Cost_Center[0], ExpLedger: ExpLedger[0],
//       VendorAc: VendorAc[0], ExpenseLedger: ExpenseLedger[0],
//       IncomeLedger: IncomeLedger[0]
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).send({
//       success: false,
//       message: "An error occurred while Fetching Data.",
//       err,
//     });
//   }
//   finally {
//     await sequelize.close();
//   }
// };

exports.findMastersPurchase = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const InventoryItems = _InventoryItems(sequelize, DataTypes);

  try {
    const flag = req.body.flag;
    const multi_loc = req.body.multi_loc;
    let book_mst;
    if (flag == 1) {
      book_mst = await sequelize.query(
        `select CAST(Book_Code AS VARCHAR) as value , Book_Name as label, Inv_Book from Book_Mst where export_type < 3 and Book_Type = 7 AND Loc_Code in (${multi_loc}) AND Inv_Book = 0`
      );
    } else {
      book_mst = await sequelize.query(
        `select CAST(Book_Code AS VARCHAR) as value , Book_Name as label, Inv_Book from Book_Mst where export_type < 3 and Book_Type = 8 AND Loc_Code in (${multi_loc}) AND Inv_Book = 0`
      );
    }
    const Ledgers = await sequelize.query(
      `select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name As label from Ledg_Mst where Group_Code in (52,53) AND Loc_Code in (${multi_loc}) AND export_type < 3`
    );
    let PostLedg;
    if (flag == 1) {
      PostLedg = await sequelize.query(`WITH RecursiveSubGroups AS (
             SELECT Group_Code, Sub_Group
             FROM Grup_Mst
             WHERE Sub_Group in (13) 
             UNION ALL
             SELECT g.Group_Code, g.Sub_Group
             FROM Grup_Mst g
             INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
         )
         select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (
         SELECT Group_Code
         FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 1;`); //Posting Ledger
    } else {
      PostLedg = await sequelize.query(`WITH RecursiveSubGroups AS (
              SELECT Group_Code, Sub_Group
              FROM Grup_Mst
              WHERE Sub_Group in (14) 
              UNION ALL
              SELECT g.Group_Code, g.Sub_Group
              FROM Grup_Mst g
              INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
          )
          select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (
          SELECT Group_Code
          FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc},0) AND Export_Type < 1;`); //Posting Ledger
    }
    const States = await sequelize.query(
      `SELECT CAST(Misc_Code AS VARCHAR) AS value,  MIsc_Name AS label from Misc_Mst WHERE Misc_Type = 3`
    );
    const AllBranches = await sequelize.query(
      `select CAST(Godw_Name AS VARCHAR) AS label, CAST(Godw_Code AS VARCHAR) AS value from Godown_Mst WHERE Export_Type < 3 and godw_code in (${multi_loc})`
    );
    const ItemNames = await sequelize.query(
      `select top 1000 COALESCE(CAST(ITEM_CODE AS VARCHAR), CAST(UTD AS VARCHAR)) +' | ' + ITEM_NAME + ' | ' + (SELECT TOP 1 Godw_Name FROM Godown_mst Where Godw_Code = LOC_CODE) AS label, CAST(UTD AS VARCHAR) as value from InventoryItems`
    );
    const UOM = await sequelize.query(
      `SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`
    );
    const BRANDS = await sequelize.query(
      `SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 617`
    );
    const Cost_Center = await sequelize.query(
      `SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 401`
    );
    const ExpenseLedger = await sequelize.query(
      `select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE ServerId = 13`
    );
    const IncomeLedger = await sequelize.query(
      `select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE ServerId = 14`
    );
    const VendorAc = await sequelize.query(
      `SELECT 
      CAST(Ledg_Code AS DECIMAL(10, 0)) AS value, 
      Ledg_Name AS label 
  FROM Ledg_Mst 
  WHERE LEDG_CLASS = 21 
    AND EXPORT_tYPE < 5 
    AND Loc_code IN (${multi_loc}, 0) 
  ORDER BY Ledg_Name`
    );
    const ExpLedger = await sequelize.query(`WITH RecursiveSubGroups AS (
          SELECT Group_Code, Sub_Group
          FROM Grup_Mst
          WHERE Sub_Group in (2,3) 
          UNION ALL
          SELECT g.Group_Code, g.Sub_Group
          FROM Grup_Mst g
          INNER JOIN RecursiveSubGroups r ON g.Sub_Group = r.Group_Code
      )
      select CAST(Ledg_Code AS VARCHAR) as value, Ledg_Name as label from Ledg_mst WHERE  Group_Code in (
      SELECT Group_Code
      FROM RecursiveSubGroups) AND Loc_Code in (${multi_loc}) AND Export_Type < 1;`); // vendor ac

    res.send({
      success: true,
      book_mst: book_mst[0],
      Ledgers: Ledgers[0],
      PostLedg: PostLedg[0],
      States: States[0],
      AllBranches: AllBranches[0],
      ItemNames: ItemNames[0],
      UOM: UOM[0],
      BRANDS: BRANDS[0],
      Cost_Center: Cost_Center[0],
      ExpLedger: ExpLedger[0],
      VendorAc: VendorAc[0],
      ExpenseLedger: ExpenseLedger[0],
      IncomeLedger: IncomeLedger[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "An error occurred while Fetching Data.",
      err,
    });
  } finally {
    await sequelize.close();
  }
};

exports.stockview = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  const dateFrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  try {
    let query = "";
    query += `SELECT
    Category,
    Category_Name as [Category Name],
    (SELECT
            SUM(CASE WHEN Tran_Type = 1 and source_location in (${loc_code}) AND cast(tran_date as date) <= '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 2 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 4 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 5 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
            SUM(CASE WHEN Tran_Type = 3 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 6 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)) as [Opening Stock],
    SUM(CASE WHEN Tran_Type = 2 AND source_location in (${loc_code}) AND cast(tran_date as date) Between '${dateFrom}' and '${dateto}' 
THEN TotalQuantity ELSE 0 END) AS
[Transfer In],
    SUM(CASE WHEN Tran_Type = 3 AND source_location in (${loc_code}) AND cast(tran_date as date) Between '${dateFrom}' and '${dateto}' 
THEN TotalQuantity ELSE 0 END) AS
[Asset Issue],
    SUM(CASE WHEN Tran_Type = 4 AND source_location in (${loc_code}) AND cast(tran_date as date) Between '${dateFrom}' and '${dateto}' 
THEN TotalQuantity ELSE 0 END) AS
[Asset Revoke],
    SUM(CASE WHEN Tran_Type = 5 AND source_location in (${loc_code}) AND cast(tran_date as date) Between '${dateFrom}' and '${dateto}' 
THEN TotalQuantity ELSE 0 END) AS
[Asset Purchase],
    SUM(CASE WHEN Tran_Type = 6 AND source_location in (${loc_code}) AND cast(tran_date as date) Between '${dateFrom}' and '${dateto}' 
THEN TotalQuantity ELSE 0 END) AS
[Asset Scrap],
    SUM(CASE WHEN Tran_Type = 7 AND source_location in (${loc_code}) AND cast(tran_date as date) Between '${dateFrom}' and '${dateto}' 
THEN TotalQuantity ELSE 0 END) AS
[Transfer Out],
    SUM(CASE WHEN Tran_Type = 8 AND source_location in (${loc_code}) AND cast(tran_date as date) Between '${dateFrom}' and '${dateto}' 
THEN TotalQuantity ELSE 0 END) AS
[Asset Pooling],
    SUM(CASE WHEN Tran_Type = 9 AND source_location in (${loc_code}) AND cast(tran_date as date) Between '${dateFrom}' and '${dateto}' 
THEN TotalQuantity ELSE 0 END) AS
[Asset Reallocation],
        (SELECT
           
		   (SELECT
            SUM(CASE WHEN Tran_Type = 1 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 2 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 4 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 5 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
            SUM(CASE WHEN Tran_Type = 3 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 6 and source_location in (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) AND cast(tran_date as date) < '${dateFrom}' THEN TotalQuantity ELSE 0 END))+
            SUM(CASE WHEN Tran_Type = 1 and source_location in (${loc_code}) AND cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 2 and source_location in (${loc_code}) AND cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 4 and source_location in (${loc_code}) AND cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 5 and source_location in (${loc_code}) AND cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) AND cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END)-
            SUM(CASE WHEN Tran_Type = 3 and source_location in (${loc_code}) AND cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 6 and source_location in (${loc_code}) AND cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) AND  cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END)-
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) AND  cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END)) as [Closing Stock]
FROM
    (SELECT
        Tran_Type,
        tran_date,
        source_location,
        SUM(Quantity) AS TotalQuantity,
        (SELECT TOP 1 Name
         FROM Assets_Group
         WHERE Id = p.Category) AS Category_Name,
         Category
     FROM
         Product_History p
     WHERE
         Category IN (
             SELECT Id
             FROM Assets_Group
              WHERE Asset_Type IN (${req.body.Asset_Type ? req.body.Asset_Type : "1, 2"
      }))
                          group by
         Tran_Type,
         Category,
         tran_date,
         source_location
    ) AS Subquery
GROUP BY
    Category_Name,
        Category
`;

    if (req.body.Category) {
      query = `SELECT
      SubCategory,
      SubCategory_Name as [SubCategory Name],
      (SELECT
              SUM(CASE WHEN Tran_Type = 1 and source_location in (${loc_code}) AND CAST(tran_date as DATE) <= '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 2 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 4 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 5 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 3 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 6 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)) as [Opening Stock],
      SUM(CASE WHEN Tran_Type = 2 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Transfer In],
      SUM(CASE WHEN Tran_Type = 3 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Issue],
      SUM(CASE WHEN Tran_Type = 4 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Revoke],
      SUM(CASE WHEN Tran_Type = 5 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Purchase],
      SUM(CASE WHEN Tran_Type = 6 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Scrap],
      SUM(CASE WHEN Tran_Type = 7 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Transfer Out],
      SUM(CASE WHEN Tran_Type = 8 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Pooling],
      SUM(CASE WHEN Tran_Type = 9 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Reallocation],
          (SELECT
  
                 (SELECT
              SUM(CASE WHEN Tran_Type = 1 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 2 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 4 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 5 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 3 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 6 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END))+
            SUM(CASE WHEN Tran_Type = 1 and source_location in (${loc_code}) AND cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 2 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 4 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 5 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 3 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 6 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END)) as [Closing Stock]
  FROM
      (SELECT
          Tran_Type,
          tran_date,
          source_location,
          SUM(Quantity) AS TotalQuantity,
          (SELECT TOP 1 Name
           FROM Assets_Group_Subcategory
           WHERE Id = p.SubCategory) AS SubCategory_Name,
           SubCategory
       FROM
           Product_History p
       WHERE
           Category IN (${req.body.Category})
                            group by
           Tran_Type,
           Category,
       SubCategory,
           tran_date,
           source_location
      ) AS Subquery
  GROUP BY
      SubCategory_Name,
          SubCategory`;
    }

    if (req.body.SubCategory) {
      query = `SELECT
      Asset_ID,
      Asset_Name as [Asset Name],
      (SELECT
              SUM(CASE WHEN Tran_Type = 1 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) <= '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 2 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 4 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 5 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 3 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 6 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)) as [Opening Stock],
      SUM(CASE WHEN Tran_Type = 2 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Transfer In],
      SUM(CASE WHEN Tran_Type = 3 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Issue],
      SUM(CASE WHEN Tran_Type = 4 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Revoke],
      SUM(CASE WHEN Tran_Type = 5 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Purchase],
      SUM(CASE WHEN Tran_Type = 6 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Scrap],
      SUM(CASE WHEN Tran_Type = 7 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Transfer Out],
      SUM(CASE WHEN Tran_Type = 8 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Pooling],
      SUM(CASE WHEN Tran_Type = 9 AND source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between '${dateFrom}' and '${dateto}'
  THEN TotalQuantity ELSE 0 END) AS
  [Asset Reallocation],
          (SELECT
  
                 (SELECT
              SUM(CASE WHEN Tran_Type = 1 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 2 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 4 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 5 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 3 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 6 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) < '${dateFrom}' THEN TotalQuantity ELSE 0 END))+
            SUM(CASE WHEN Tran_Type = 1 and source_location in (${loc_code}) AND cast(tran_date as date) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +

              SUM(CASE WHEN Tran_Type = 2 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 4 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 5 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) +
              SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 3 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 6 and source_location in (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END) -
              SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END)-
              SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) AND CAST(tran_date AS DATE) Between  '${dateFrom}' and '${dateto}' THEN TotalQuantity ELSE 0 END)) as [Closing Stock]
  FROM
      (SELECT
          Tran_Type,
          tran_date,
          source_location,
          SUM(Quantity) AS TotalQuantity,
          (SELECT TOP 1 Name
           FROM Asset_Product
           WHERE UTD = p.Asset_ID) AS Asset_Name,
           Asset_ID
       FROM
           Product_History p
       WHERE
           SubCategory IN (${req.body.SubCategory})
                            group by
           Tran_Type,
           
       Asset_ID,
           tran_date,
           source_location
      ) AS Subquery
  GROUP BY
      Asset_Name,
          Asset_ID
`;
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

exports.findMasters = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const multi_loc = req.body.multi_loc;
    const MaxId = await sequelize.query(
      `SELECT (MAX(Ledg_Code) + 1) AS id FROM Ledg_Mst`
    );
    const STATE = await sequelize.query(
      `
SELECT Misc_Code AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 91
and misc_code in (select distinct(br_region) from Godown_Mst)`
    );
    const District = await sequelize.query(
      `SELECT Misc_Code AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 2`
    );
    const Tehsil = await sequelize.query(
      `SELECT Misc_Code AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 1`
    );
    const Groups = await sequelize.query(`WITH RecursiveCTE AS (
            -- Anchor member: Select the starting group (the given Group_Code)
            SELECT Group_Code, Sub_Group, Group_Name
            FROM Grup_Mst
            WHERE Group_Code = '21' 

            UNION ALL

            -- Recursive member: Select children of the current Group_Code
            SELECT gm.Group_Code, gm.Sub_Group, gm.Group_Name
            FROM Grup_Mst gm
            INNER JOIN RecursiveCTE r ON gm.Sub_Group = r.Group_Code
        )
        -- Select all descendants of the given Group_Code
        SELECT Group_Code as value, Sub_Group, Group_Name as label
        FROM RecursiveCTE;`);
    const Branches =
      await sequelize.query(`SELECT Godw_Code AS value, Godw_Name AS label FROM 
      GODOWN_MST WHERE Godw_Code in (${multi_loc}) AND Export_type < 3`);
    const UOM = await sequelize.query(
      `SELECT Misc_Code AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`
    );
    const BRANDS = await sequelize.query(
      `SELECT Misc_Code AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 617`
    );
    const Models = await sequelize.query(
      `WITH MiscData AS (
          SELECT 
              Misc_Name AS label,
              CAST(Misc_Code AS VARCHAR(MAX)) AS value
          FROM Misc_Mst
          WHERE Misc_Type = 14 and Misc_Name !=''
      )

      -- Get the 'ALL' row for Misc
      SELECT 
          'ALL' AS label, 
          STRING_AGG(CAST(Misc_Code AS VARCHAR(MAX)), ',') AS value,
          0 AS sort_order  -- 'ALL' row first
      FROM Misc_Mst
      WHERE Misc_Type = 14 and Misc_Name !=''

      UNION ALL

      -- Get Misc_Mst data
      SELECT 
          label, 
          value,
          1 AS sort_order  -- Other rows after 'ALL'
      FROM MiscData
      ORDER BY sort_order;`
    );
    const Vendors = await sequelize.query(
      `select Ledg_Code AS value, Ledg_Name AS label from ledg_mst Where Group_Code = 51`
    );
    const book_mst = await sequelize.query(
      `select Book_Code as value , Book_Name as label from Book_Mst where export_type < 3 and Book_Type = 3 AND INV_Book = 1`
    );
    const Items = await sequelize.query(
      `select  top 100 UTD as value, COALESCE(CAST(ITEM_CODE AS VARCHAR), CAST(UTD AS VARCHAR)) AS label from InventoryItems`
    );
    const Channel = await sequelize.query(
      `WITH MiscData AS (
          SELECT 
              Misc_Name AS label,
              CAST(Misc_Code AS VARCHAR(MAX)) AS value
          FROM Misc_Mst
          WHERE Misc_Type = 302
      )

      -- Get the 'ALL' row for Misc
      SELECT 
          'ALL' AS label, 
          STRING_AGG(CAST(Misc_Code AS VARCHAR(MAX)), ',') AS value,
          0 AS sort_order  -- 'ALL' row first
      FROM Misc_Mst
      WHERE Misc_Type = 302

      UNION ALL

      -- Get Misc_Mst data
      SELECT 
          label, 
          value,
          1 AS sort_order  -- Other rows after 'ALL'
      FROM MiscData
      ORDER BY sort_order;`
    );
    const Branches1 =
      await sequelize.query(`SELECT Godw_Code AS value, Godw_Name AS label FROM 
      GODOWN_MST WHERE  Export_type < 3`);
    res.send({
      success: true,
      STATE: STATE[0],
      Groups: Groups[0],
      District: District[0],
      Tehsil: Tehsil[0],
      Branches: Branches[0],
      MaxId: MaxId[0][0].id,
      UOM: UOM[0],
      BRANDS: BRANDS[0],
      Models: Models[0],
      Vendors: Vendors[0],
      Books: book_mst[0],
      Items: Items[0],
      Channel: Channel[0],
      Branches1: Branches1[0]
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "An error occurred while Fetching Data.",
      err,
    });
  } finally {
    await sequelize.close();
  }
};
exports.VendorMasterSave = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const a = JSON.parse(req.body.VendorData);
    const Ledger_NAME = a.Ledger_NAME;
    const AbbrName = a.AbbrName;
    const LedgerGroup = a.LedgerGroup;
    const Branch = a.Branch;
    const PrintName = a.PrintName;
    const LedgerState = a.LedgerState;
    const Pan = a.Pan;
    const RegistrationType = a.RegistrationType;
    const LedgerGstin = a.LedgerGstin;
    const partyType = a.partyType;
    const EMAIL_ID = a.EMAIL_ID;
    const Pincode = a.Pincode;
    const MobileNo = a.MobileNo;
    const ADDRESS1 = a.ADDRESS1;
    const ADDRESS2 = a.ADDRESS2;
    const EMPCODE = a.EMPCODE;
    const USERNAME = a.USERNAME;
    const MSME = a.MSME;
    const ECC_No = a.ECC_No;
    const finalFolderPath = path.join(
      req.headers.compcode?.split("-")[0]?.toLowerCase(),
      new Date().getFullYear().toString(),
      String(new Date().getMonth() + 1).padStart(2, "0"),
      String(new Date().getDate()).padStart(2, "0"),
      "VendorDocument"
    );
    let EMP_DOCS_data = [];
    if (req.files) {
      EMP_DOCS_data = await uploadImages(
        req.files,
        finalFolderPath,
        EMPCODE,
        EMPCODE,
        EMPCODE
      );
    }
    const brmstid = await sequelize.query(
      `select MAX(Ledg_Code) AS maxMstId FROM Ledg_Mst `,
      { transaction: t }
    );
    const MiscMaxId = brmstid[0][0].maxMstId;
    let newtranid;
    if (MiscMaxId !== null) {
      newtranid = MiscMaxId + 1;
    } else {
      newtranid = 1;
    }
    await sequelize.query(
      `INSERT INTO Ledg_Mst (
      Ledg_Code, Group_Code, Ledg_Name, Ledg_Abbr, Ledg_Add6 , Loc_Code,
      Ledg_Add1, Ledg_Add2, State_Code, Ledg_Pan, GSTTYPE, GST_No, PARTYTYPE,
      Ledg_Email, Ledg_Pin, Ledg_Ph1, ServerId, Export_Type,
      MSME, ECC_No,Ledg_Class) VALUES
      ('${newtranid}','${LedgerGroup}', '${Ledger_NAME}', '${PrintName}','${AbbrName}','${Branch}',
      '${ADDRESS1}','${ADDRESS2}','${LedgerState}','${Pan}',${RegistrationType},'${LedgerGstin}','${partyType}',
      '${EMAIL_ID}','${Pincode}', '${MobileNo}',1,1,
      ${MSME}, '${ECC_No}','21')`,
      { transaction: t }
    );
    await sequelize.query(
      `INSERT INTO DOC_UPLOAD (
      Doc_Type, TRAN_ID, SRNO, path, User_Name ,Upload_Date, Export_Type) VALUES
      ('LEDG','${newtranid}', '1', '${EMP_DOCS_data[0]?.DOC_PATH}','${USERNAME}',GETDATE(),'1')`,
      { transaction: t }
    );
    await t.commit();

    const NextLedgCode = await sequelize.query(
      `select MAX(Ledg_Code+1) AS maxMstId FROM Ledg_Mst `
    );
    res.status(200).send({
      success: true,
      message: "Ledger Created",
      NextLedgCode: NextLedgCode[0][0],
    });
  } catch (e) {
    console.log(e);
    await t.rollback();
    res.status(500).send({
      success: false,
      message: "An error occurred while Inserting Data",
      e,
    });
  } finally {
    await sequelize.close();
    console.log("Connection has Been Closed....");
  }
};
exports.VendorMasterUpdate = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  try {
    const a = JSON.parse(req.body.VendorData);
    const SRNO = a.SRNO;
    const Ledger_NAME = a.Ledger_NAME;
    const AbbrName = a.AbbrName;
    const LedgerGroup = a.LedgerGroup;
    const Branch = a.Branch;
    const PrintName = a.PrintName;
    const LedgerState = a.LedgerState;
    const Pan = a.Pan;
    const RegistrationType = a.RegistrationType;
    const LedgerGstin = a.LedgerGstin;
    const partyType = a.partyType;
    const EMAIL_ID = a.EMAIL_ID;
    const Pincode = a.Pincode;
    const MobileNo = a.MobileNo;
    const ADDRESS1 = a.ADDRESS1;
    const ADDRESS2 = a.ADDRESS2;
    const USERNAME = a.USERNAME;
    const EMPCODE = a.EMPCODE;
    const MSME = a.MSME;
    const ECC_No = a.ECC_No;
    const finalFolderPath = path.join(
      req.headers.compcode?.split("-")[0]?.toLowerCase(),
      new Date().getFullYear().toString(),
      String(new Date().getMonth() + 1).padStart(2, "0"),
      String(new Date().getDate()).padStart(2, "0"),
      "VendorDocument"
    );
    let EMP_DOCS_data = [];
    let filePath = "";
    if (req.files.VendorDocument) {
      EMP_DOCS_data = await uploadImages(
        req.files,
        finalFolderPath,
        EMPCODE,
        EMPCODE,
        EMPCODE
      );
      filePath = EMP_DOCS_data[0]?.DOC_PATH;
    } else {
      const a = await sequelize.query(
        `SELECT path FROM DOC_UPLOAD 
          WHERE TRAN_ID = '${SRNO}' AND Export_type = 1`,
        { transaction: t }
      );
      filePath = a[0][0].path;
    }

    // await sequelize.query(
    //   `INSERT INTO Ledg_Mst_Hst
    //       SELECT * FROM Ledg_mst
    //       WHERE Ledg_Code = ${SRNO};`,
    //   { transaction: t }
    // );
    await sequelize.query(
      `UPDATE DOC_UPLOAD
      SET
          Export_Type = 33
      WHERE
      Doc_Type = 'LEDG'
          AND TRAN_ID = ${SRNO};`,
      { transaction: t }
    );
    await sequelize.query(
      `UPDATE Ledg_Mst
      SET Group_Code = '${LedgerGroup}',
          Ledg_Name = '${Ledger_NAME}',
          Ledg_Abbr = '${PrintName}',
          Ledg_Add6 = '${AbbrName}',
          Loc_Code = '${Branch}',
          Ledg_Add1 = '${ADDRESS1}',
          Ledg_Add2 = '${ADDRESS2}',
          State_Code = '${LedgerState}',
          Ledg_Pan = '${Pan}',
          GSTTYPE = ${RegistrationType},
          GST_No = '${LedgerGstin}',
          PARTYTYPE = '${partyType}',
          Ledg_Email = '${EMAIL_ID}',
          Ledg_Pin = '${Pincode}',
          Ledg_Ph1 = '${MobileNo}',
          MSME = ${MSME},
          ECC_No = '${ECC_No}'
      WHERE Ledg_Code = '${SRNO}';`,
      { transaction: t }
    );
    await sequelize.query(
      `INSERT INTO DOC_UPLOAD (
      Doc_Type, TRAN_ID, SRNO, path, User_Name ,Upload_Date,  Export_Type) VALUES
      ('LEDG','${SRNO}', '1', '${filePath}','${USERNAME}',GETDATE(),'1')`,
      { transaction: t }
    );
    await t.commit();

    const NextLedgCode = await sequelize.query(
      `select MAX(Ledg_Code+1) AS maxMstId FROM Ledg_Mst `
    );

    res.status(200).send({
      success: true,
      message: "Ledger updated",
      NextLedgCode: NextLedgCode[0][0],
    });
  } catch (e) {
    console.log(e);
    await t.rollback();
    res.status(500).send({
      success: false,
      message: "An error occurred while updating Data",
      e,
    });
  } finally {
    await sequelize.close();
    console.log("Connection has Been Closed....");
  }
};

exports.FindItems = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const SubCategory = req.body.SubCategory;
  const Location = req.body.Location;
  try {
    const result = await sequelize.query(
      `select Name,Model as Product_Code,
CASE 
        WHEN ITEM_TYPE IS  NULL THEN
		(select top 1 ITEM_TYPE from Assets_Group_Subcategory where id=Asset_Product.Subcategory) 
		else ITEM_TYPE
		END AS ITEM_TYPE, 
Description as Item_Description,
CASE 
        WHEN UOM1 IS  NULL THEN 
		(SELECT TOP 1 Misc_Name 
             FROM misc_mst 
             WHERE misc_code =(select top 1 UOM from Assets_Group_Subcategory where id=Asset_Product.Subcategory) 
               AND export_type < 3 
               AND misc_type = 72)
        ELSE  (SELECT TOP 1 Misc_Name 
             FROM misc_mst 
             WHERE misc_code = UOM1 
               AND export_type < 3 
               AND misc_type = 72)
    END AS UOMName,
	CASE 
        WHEN UOM1 IS  NULL THEN 
		(select top 1 UOM from Assets_Group_Subcategory where id=Asset_Product.Subcategory)
		Else UOM1
		END AS UOM1,
      Unit_Rate as Unit_Price,
	  CASE 
        WHEN Asset_Nature IS  NULL THEN 
		(select top 1 HSN from Assets_Group_Subcategory where id=Asset_Product.Subcategory)
		Else
	  Asset_Nature 
	  END AS  HSN,
	  0 as Discount,
      (
          SELECT 
          SUM(CASE WHEN Tran_Type = 1 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)
          
          FROM 
              Product_History
          WHERE 
              Product_History.Asset_ID = Asset_Product.UTD 
              AND Source_Location in (${Location})
      ) AS Available_Quantity
         from Asset_Product where Subcategory=${SubCategory}`
    );
    res.status(200).send(result[0]);
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
exports.backOrders = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;
  try {
    const result = await sequelize.query(`
 SELECT
    pod.Quantity AS QuantityOrdered,
    COALESCE(ped.Quantity, 0) AS QuantityofPurchase,
        (select top 1 Godw_Name from Godown_mst where godw_code=po.location and export_type<3)as Branch,
         (select top 1 Ledg_name from Ledg_mst where Ledg_Code=PO.vendor)as Vendor_Name,
    (pod.Quantity - COALESCE(ped.Quantity, 0)) AS PendingQuantity,
   pod.Product_Code,pod.Item_Description,pod.Tax,pod.Quantity,pod.Unit_Price,pod.Discount,pod.Total_Price,pod.Purchase_Id,
   pod.Subcategory,pod.ITEM_TYPE,pod.HSN,
    (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(po.UTD AS VARCHAR) AS PoNumber,
        (select top 1 Name from Assets_Group_Subcategory where id=pod.subcategory)as SubCategoryName,
    po.Location,
    po.Req_date
FROM
    Purchase_Order_Product_Details pod
LEFT JOIN
    (SELECT
        PO_Number,
        CODE,
        SubCategory,
        DESCRIPTION,
        Quantity,POPD
     FROM
        PurchaseEntryDtl
    ) ped
ON
    pod.UTD = ped.POPD
LEFT JOIN
    purchase_order po
ON
    pod.Purchase_Id = po.UTD
        where po.Location='${loc_code}'
        and Req_Date between '${datefrom}' and '${dateto}' and  (pod.Quantity - COALESCE(ped.Quantity, 0))>0 
       `);

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

exports.AssetModel = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  try {
    let query = `
    select UTD,Serial_No, NAME, (select top 1 name from Assets_Group where id= Asset_Product.Category) AS Category, Category as CategoryId,
(SELECT TOP 1 Name from Assets_Group_Subcategory where Id = Asset_Product.Subcategory) AS SubCategory, Model, Characteristics, Description, 
CAST(Purchase_Date as DATE) AS Purchase_Date, Purchase_value, (select top 1 godw_name from GODOWN_MST where Godw_Code in (${loc_code}) ) AS Location,
(
        SELECT 
            
        SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${loc_code}) THEN Quantity ELSE 0 END)
          
        FROM 
            Product_History
        WHERE 
            Product_History.Asset_ID = Asset_Product.utd 
            AND Source_Location   in (${loc_code})
    ) AS Qty
from Asset_Product
    `;

    const result = await sequelize.query(query);
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: query,
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

exports.UpdateEmployeeAssetIssue = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  const tran_id = req.body.UTD;
  const EmpCode = req.body.EmpCode;
  try {
    let query = `select tran_id, CAST(Req_Date as DATE) AS REQ_DATE, 
    (SELECT TOP 1 NAME FROM ASSETS_GROUP WHERE ASSETS_GROUP.ID = Product_Issue.Category) AS CategoryName, Category,
    (SELECT TOP 1 NAME FROM Assets_Group_Subcategory WHERE Assets_Group_Subcategory.ID = Product_Issue.SubCategory) AS SubCategoryName, SubCategory,
    (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME ) AS EmpName FROM EMPLOYEEMASTER WHERE EMPCODE='${EmpCode}') AS EMPNAME,
    Description, Reason,Quantity from Product_Issue where tran_id = '${tran_id}' and Location in (${loc_code})`;

    const result = await sequelize.query(query);
    console.log(result, "komalnuwal");
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: query,
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

exports.EmployeeAssetUpdate = async function (req, res) {
  console.log(req.body, "req.body");
  try {
    const { tran_id, ...General } = req.body.formdata;

    // Validate Asset Product data
    const { error: assetError, value: Asset_Product } =
      productIssueSchema.validate(General, {
        abortEarly: false,
        stripUnknown: true,
      });

    if (assetError) {
      const errors = assetError.details;
      const errorMessage = errors.map((err) => err.message).join(", ");
      return res
        .status(400)
        .send({ success: false, this: "asseterror", message: errorMessage });
    }

    const sequelize = await dbname(req.headers.compcode);
    const ProductIssue = _Product_Issue(sequelize, Sequelize.DataTypes);

    const updatedProductIssue = await ProductIssue.update(Asset_Product, {
      where: { tran_id: tran_id },
      returning: true,
    });

    const RequestId = await sequelize.query(
      `SELECT  CAST(ISNULL(MAX(tran_id) + 1, 1) AS VARCHAR) AS RequestId
      FROM Product_Issue`
    );

    const EmpName = await sequelize.query(
      `SELECT concat(Empfirstname,' ',Emplastname)as EmpName from employeemaster where empcode='${General.EmpCode}'`
    );

    // Prepare response
    const response = {
      success: true,
      RequestId: RequestId[0][0].RequestId,
      EmpName: EmpName[0][0].EmpName,
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during Updating." });
  }
};
exports.AddQtyToProducthistory = async function (req, res) {
  const UTD = req.body.UTD;
  const username = req.body.username;
  const loc_code = req.body.loc_code;
  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    const data = await sequelize.query(
      `select (select top 1 UTD from Asset_Product where Asset_Product.Model=PurchaseEntryDtl.CODE)as Asset_ID,
(select top 1 Voucher_Date from PurchaseEntryMst where PurchaseEntryMst.TRAN_ID=PurchaseEntryDtl.TRAN_ID and PurchaseEntryMst.TRAN_TYPE=PurchaseEntryDtl.TRAN_TYPE)as Voucher_Date
,UTD as PurchaseDtl,QUANTITY,CATEGORY,SubCategory,Location as Source_Location from PurchaseEntryDtl where utd='${UTD}'`
    );
    const Product_History = _Product_Histroy(sequelize, Sequelize.DataTypes);
    await Product_History.create(
      {
        Asset_ID: data[0][0].Asset_ID,
        Tran_Type: 5,
        Quantity: data[0][0].QUANTITY,
        Category: data[0][0].CATEGORY,
        SubCategory: data[0][0].SubCategory,
        Created_By: username,
        Source_Location: data[0][0].Source_Location,
        PurchaseDtl: data[0][0].PurchaseDtl,
        Tran_Date: data[0][0].Voucher_Date,
      },
      {
        transaction: t,
      }
    );
    await t.commit();
    // Prepare response
    res.status(200).json("done");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during Updating." });
  }
};
exports.EntryView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const Loc_Code = req.body.Loc_Code;
    const TRAN_TYPE = req.body.TRAN_TYPE;
    const Data = await sequelize.query(`
      SELECT 
      UTD, TRAN_ID, DRD_ID, TRAN_TYPE,
  INV_NO, 
  FORMAT(Created_at, 'dd-MM-yyyy') AS InvoiceDate, 
  (SELECT TOP 1 Ledg_Name 
   FROM Ledg_mst 
   WHERE Ledg_Code = PARTY_AC AND Export_Type < 3) AS LedgerName,
  REF_NO AS VendorInvNo, 
  FORMAT(REF_DATE, 'dd-MM-yyyy') AS VendorInvDate, 
  Inv_Amt 
  FROM 
  purchaseentrymst WHERE Export_Type = 1 AND LOC_CODE = ${Loc_Code} AND TRAN_TYPE = ${TRAN_TYPE} order by UTD desc`);
    res.send({
      success: true,
      Data: Data[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "An error occurred while Fetching Data.",
      err,
    });
  } finally {
    await sequelize.close();
  }
};
exports.EntryDataFetch = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const UTD = req.body.UTD;
    const TRAN_TYPE = req.body.TRAN_TYPE;
    const Data = await sequelize.query(`SELECT UTD, TRAN_ID, DRD_ID,
       CAST(BOOK_CODE AS VARCHAR) AS Tran_Type,
      CAST(PARTY_AC AS VARCHAR) AS LEDG_ACNT,
      CAST(STATE_CODE AS VARCHAR) AS State_Code,
      CAST(REG_TYPE AS VARCHAR) AS registration_type,
      CAST(REV_CHRGS AS VARCHAR) AS Is_Rcm,
      CAST(Exp_Ledg1 AS VARCHAR) AS Exp_Ledg41,
      CAST(Exp_Ledg2 AS VARCHAR) AS Exp_Ledg5,
      CAST(Exp_Ledg3 AS VARCHAR) AS Exp_Ledg6,
      CAST(Exp_Ledg4 AS VARCHAR) AS Exp_Ledg7,
      CAST(TDS_Ledg AS VARCHAR) AS Exp_Ledg8,Document,* from PurchaseEntryMst WHERE UTD = ${UTD}`);

    const Data1 = await sequelize.query(`
      SELECT UTD, SRNO, CAST (Sale_ledg AS VARCHAR) AS Sale_ledg1,
      (SELECT TOP 1 Ledg_Name FROM Ledg_Mst WHERE Ledg_Code = Sale_ledg) AS Sale_ledg1Label,
       CAST (CODE AS VARCHAR) AS Item_Name, DESCRIPTION AS Item_NameLabel, BATCH, 
       CAST(BRAND AS VARCHAR) AS BRAND1,
       (SELECT TOP 1 Misc_Name  FROM Misc_Mst WHERE Misc_Type = 617 AND Misc_Code = BRAND) AS BRAND1Label,
       CAST(Location AS VARCHAR) AS Location1,
      (SELECT TOP 1 Godw_Name  FROM Godown_Mst WHERE Export_Type < 3 AND Godw_Code = Location) AS Location1Label,
      CAST(Cost_Center AS VARCHAR) AS Cost_Center1,
      (SELECT TOP 1 Misc_Name  FROM Misc_Mst WHERE Misc_Type = 401 AND Misc_Code = Cost_Center) AS Cost_Center1Label,
       CAST(CATEGORY AS VARCHAR) AS Category,CAST(ITEM_TYPE AS VARCHAR) AS Item_Type, 
      HSN_CODE AS HSN,QUANTITY AS Sup_Qty,  CAST(UOM AS VARCHAR) UOM1,
      (SELECT TOP 1 Misc_Name  FROM Misc_Mst WHERE Misc_Type = 72 AND Misc_Code = UOM) AS UOM1Label,
      RATE AS Basic_Price, DISC_PERCT AS discp,
      DISC_VALUE AS Disc_Amt,CGST_PERCT AS CGST_Perc,SGST_PERCT AS SGST_Perc,IGST_PERCT AS IGST_Perc,
      CGST_VALUE AS CGST,IGST_VALUE AS IGST,SGST_VALUE AS SGST, CESS_PERCT AS Cess_Perc, 
	  (select top 1 Name from Assets_Group where id=Category)as Category_Name,
	  (select top 1 Name from Assets_Group_Subcategory where id=SubCategory)as SubCategory_Name,
      CESS_VALUE AS Cess_Amt, Inv_Amt, CURR_STOCK,Category,SubCategory,PO_Number from PurchaseEntryDTl WHERE TRAN_ID = ${Data[0][0].TRAN_ID} AND TRAN_TYPE =${TRAN_TYPE}`);
    res.send({
      success: true,
      MstData: Data[0],
      DtlData: Data1[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "An error occurred while Fetching Data.",
      err,
    });
  } finally {
    await sequelize.close();
  }
};

function numWords(input) {
  var a = [
    "",
    "one ",
    "two ",
    "three ",
    "four ",
    "five ",
    "six ",
    "seven ",
    "eight ",
    "nine ",
    "ten ",
    "eleven ",
    "twelve ",
    "thirteen ",
    "fourteen ",
    "fifteen ",
    "sixteen ",
    "seventeen ",
    "eighteen ",
    "nineteen ",
  ];
  var b = [
    "",
    "",
    "twenty ",
    "thirty ",
    "forty ",
    "fifty ",
    "sixty ",
    "seventy ",
    "eighty ",
    "ninety ",
  ];
  var num = parseInt(input);
  if (isNaN(num)) return "Invalid number";
  if (num === 0) return "zero";
  if (num.toString().length > 13) return "overflow";
  function convert(n) {
    if (n < 20) return a[n];
    else if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    else
      return (
        a[Math.floor(n / 100)] + "hundred " + (n % 100 ? convert(n % 100) : "")
      );
  }
  function convertLargeNumber(n) {
    if (n >= 10000000)
      return (
        convertLargeNumber(Math.floor(n / 10000000)) +
        "crore " +
        convertLargeNumber(n % 10000000)
      );
    else if (n >= 100000)
      return (
        convert(Math.floor(n / 100000)) +
        "lakh " +
        convertLargeNumber(n % 100000)
      );
    else if (n >= 1000)
      return (
        convert(Math.floor(n / 1000)) +
        "thousand " +
        convertLargeNumber(n % 1000)
      );
    else return convert(n);
  }
  let words = convertLargeNumber(num);
  return capitalizeFirstLetter(words.trim());
}
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

exports.EntryPrint = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const multi_loc = req.body.multi_loc;
    const UTD = req.body.UTD;
    const BranchData = await sequelize.query(`
          select cm.Comp_Code, gm.Comp_Code, gm.Godw_Code, gm.Godw_Name, cm.Comp_Name,
          gm.Godw_Add1, gm.Godw_Add2, gm.Godw_Add3, gm.PAN_No, gm.GST_No
          from comp_mst cm join Godown_Mst gm on cm.Comp_Code = gm.Comp_Code
          where  gm.Export_Type < 3 AND gm.Godw_code  in (${multi_loc})`);
    const MstData = await sequelize.query(`select 
          TRAN_ID,
          TRAN_TYPE,
          (SELECT TOP 1 Ledg_Name FROM Ledg_Mst where Ledg_Code = PARTY_AC AND Export_Type < 3) AS PartyName,
          (SELECT TOP 1 Misc_Name FROM Misc_mst where Misc_Code = STATE_CODE AND Misc_type = 3) AS PlaceOfSupply,
          INV_NO,
          REF_NO,
          SUPP_GST,
          FORMAT(VOUCHER_DATE, 'dd-MM-yyyy') AS VOUCHER_DATE,
          (SELECT TOP 1 Ledg_Pan FROM Ledg_Mst where Ledg_Code = PARTY_AC AND Export_Type < 3) AS pan,
          NARR,
          Created_by,
          CASE 
              WHEN REV_CHRGS = 1 THEN 'Y'
              WHEN REV_CHRGS = 0 THEN 'N'
          END AS RevChrgsApp, 
          DISP_NAME,
    (SELECT TOP 1 Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order')as Prefix,
          Inv_Amt
          from purchaseentrymst where UTD = ${UTD}`);
    const roundedInvAmt = Math.round(MstData[0][0].Inv_Amt.toFixed(2));
    const roundOffDifference = roundedInvAmt - MstData[0][0].Inv_Amt;
    const amountInIndianCurrency = numWords(roundedInvAmt);
    const MasterData = {
      ...MstData[0][0],
      Inv_Amt_Rounded: roundedInvAmt.toFixed(2),
      Round_Off_Difference: roundOffDifference.toFixed(2),
      Inv_Amt_In_Words: amountInIndianCurrency,
    };
    const DtlData1 = await sequelize.query(`SELECT 
      CAST(SUM(CAST(QUANTITY AS DECIMAL(18, 2)) * CAST(RATE AS DECIMAL(18, 2)) - CAST(DISC_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS AsseVal,
      CAST(SUM(CAST(SGST_PERCT AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS sgstPerct,
      CAST(SUM(CAST(SGST_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS sgst,
      CAST(SUM(CAST(CGST_PERCT AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS cgstPerct,
      CAST(SUM(CAST(CGST_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS cgst,
      CAST(SUM(CAST(IGST_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS igst,
      CAST(SUM(CAST(IGST_PERCT AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS igstPerct,
      CAST(SUM(CAST(CESS_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS cess,
      CAST(SUM(CAST(CESS_PERCT AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS cessPerct,
      CAST(SUM(CAST(SGST_VALUE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS sgst,
      CAST(SUM(CAST(QUANTITY AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS QtyTtl,
      CAST(SUM(CAST(RATE AS DECIMAL(18, 2))) AS DECIMAL(18, 2)) AS RateTtl,
      CAST(SUM(ROUND((((QUANTITY * RATE) - DISC_VALUE) + IGST_VALUE + SGST_VALUE + CGST_VALUE + CESS_VALUE), 2)) AS DECIMAL(18,2)) AS TOTAL
  FROM purchaseentryDtl 
  WHERE TRAN_ID = ${MstData[0][0].TRAN_ID} AND TRAN_TYPE = ${MstData[0][0].TRAN_TYPE}`);
    const DtlDataTab = await sequelize.query(`SELECT 
          UTD, 
          SRNO, 
          DESCRIPTION,
          HSN_CODE, 
          CAST(QUANTITY AS DECIMAL(10, 2)) AS QUANTITY, 
          CAST(RATE AS DECIMAL(10, 2)) AS RATE, 
          ROUND(((QUANTITY * RATE) - DISC_VALUE), 2) AS Taxable, 
          CAST(IGST_PERCT AS DECIMAL(5, 2)) AS IGST_PERCT, 
          ROUND(IGST_VALUE, 2) AS IGST_VALUE, 
          CAST(SGST_PERCT AS DECIMAL(5, 2)) AS SGST_PERCT, 
          ROUND(SGST_VALUE, 2) AS SGST_VALUE, 
          CAST(CGST_PERCT AS DECIMAL(5, 2)) AS CGST_PERCT, 
          ROUND(CGST_VALUE, 2) AS CGST_VALUE, 
          CAST(CESS_PERCT AS DECIMAL(5, 2)) AS CESS_PERCT, 
          ROUND(CESS_VALUE, 2) AS CESS_VALUE, 
          CAST(DISC_PERCT AS DECIMAL(5, 2)) AS DISC_PERCT, 
          ROUND(DISC_VALUE, 2) AS DISC_VALUE,
          ROUND((((QUANTITY * RATE) - DISC_VALUE) + IGST_VALUE + SGST_VALUE + CGST_VALUE + CESS_VALUE), 2) AS TOTAL 
             FROM 
          purchaseentryDtl
             where TRAN_ID = ${MstData[0][0].TRAN_ID} AND TRAN_TYPE = ${MstData[0][0].TRAN_TYPE}`);
    const DtlDataTax =
      await sequelize.query(` select HSN_CODE , ROUND(((QUANTITY * RATE) - DISC_VALUE), 2) AS Taxable, CAST(IGST_PERCT AS DECIMAL(5, 2)) AS IGST_PERCT,
          (CAST(SGST_PERCT AS DECIMAL(5, 2))  + CAST(CGST_PERCT AS DECIMAL(5, 2))) AS SGSTCGSTPerct, ROUND(IGST_VALUE, 2) AS IGST_VALUE,
          ROUND((SGST_VALUE + CGST_VALUE), 2) AS SGSTCGSTVal FROM 
       purchaseentryDtl
          where TRAN_ID = ${MstData[0][0].TRAN_ID} AND TRAN_TYPE = ${MstData[0][0].TRAN_TYPE}`);
    console.log(DtlDataTax, "DtlDataTax");
    res.send({
      success: true,
      BranchData: BranchData[0][0],
      MstData: MasterData,
      DtlData1: DtlData1[0],
      DtlDataTab1: DtlDataTab[0],
      DtlDataTax: DtlDataTax[0],
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({
      success: false,
      message: "An error occurred while Fetching Data.",
      err,
    });
  } finally {
    await sequelize.close();
  }
};

exports.UOM = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    console.log("himanshu");
    const UOM = await sequelize.query(
      `SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`
    );
    res.status(200).send(UOM[0]);
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.finassetdprate = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const RAte = await sequelize.query(
      `SELECT DPRATE from assets_group where id='${req.body.category}'`
    );
    res.status(200).send(RAte[0][0]);
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.ViewAssetPolling = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;
  try {
    const result = await sequelize.query(`
      select UTD,Cast(Transfer_Date as date)as Transfer_Date,
(select top 1 Name from Assets_Group where id=Category) as Category_Name,
(select top 1 Name from Assets_Group_Subcategory where id=SubCategory) as SubCategory_Name,
(Select top 1 Name from Asset_Product where UTD=Asset_Product)as Asset_Name,
(Select top 1 Model from Asset_Product where UTD=Asset_Product)as Asset_Model,
(Select top 1 Description from Asset_Product where UTD=Asset_Product)as Asset_Description,
(select top 1 Godw_Name from GODOWN_MST where Godw_Code=Location)as Branch_Name
from asset_pooling_reallocation where Transfer_Date between '${datefrom}' and '${dateto}' and Location In (${loc_code}) order by UTD desc`);

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

exports.ViewAssetReallocation = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;
  try {
    const result = await sequelize.query(`
      select 
      UTD,
      (select top 1 Name from Assets_Group where id=Category) as Category_Name,
      (select top 1 Name from Assets_Group_Subcategory where id=SubCategory) as SubCategory_Name,
      (Select top 1 Name from Asset_Product where UTD=Asset_Product)as Asset_Name,
      (Select top 1 Model from Asset_Product where UTD=Asset_Product)as Asset_Model,
      (Select top 1 Description from Asset_Product where UTD=Asset_Product)as Asset_Description,
      (select count(*) from Asset_Pooling_Reallocation_Dtl where PoolingId=asset_pooling_reallocation.UTD)as Items_Pooled,
      (select top 1 Godw_Name from GODOWN_MST where Godw_Code=Location)as Branch_Name,
      Cast(Transfer_Date as date) as Transfer_Date,
      Cast(Revoke_Date as date)as Revoke_Date,
      Created_By
      from asset_pooling_reallocation where Transfer_Date between '${datefrom}' and '${dateto}' and Location In (${loc_code}) order by UTD desc`);

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

exports.AssetTransferSave = async function (req, res) {
  const {
    Manufacturer,
    SerialNo,
    Model,
    Quantity,
    Description,
    Serial_No,
    UTD,
    ...General
  } = req.body.Formdata;

  const { Service } = req.body; // Adjusted to directly extract 'Service' from req.body

  // Validate General Data
  const { error: requestError, value: Orderdata } =
    assetPoolingReallocationSchema.validate(General);

  if (requestError) {
    const errors = requestError.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errors });
  }

  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();

    // Insert into main table
    const OrderData = _AssetPoolingReallocation(sequelize, Sequelize.DataTypes);
    const OrderData1 = await OrderData.create(Orderdata, {
      transaction: t,
      return: true,
    });

    // Loop over each service
    for (const service of Service) {
      const OrderDataDtl = {
        PoolingId: OrderData1.UTD,
        Category: service.Category,
        SubCategory: service.SubCategory,
        Description: service.Description,
        Transfer_Date: OrderData1.Transfer_Date,
        Issue_Quantity: service.Issue_Quantity,
        Reason: service.Reason,
        Location: OrderData1.Location,
        Created_By: OrderData1.Created_By,
      };

      // Validate each detail data
      const { error: assetError, value: validatedGeneralData } =
        assetPoolingReallocationDtlSchema.validate(OrderDataDtl, {
          abortEarly: false,
          stripUnknown: true,
        });

      if (assetError) {
        throw new Error(
          `Validation error: ${assetError.details
            .map((err) => err.message)
            .join(", ")}`
        );
      }

      // Insert each service detail into detail table
      const AssetPoolingDtl = _AssetPoolingReallocationDtl(
        sequelize,
        Sequelize.DataTypes
      );
      const AssetPoolingDataDtl = await AssetPoolingDtl.create(
        validatedGeneralData,
        { transaction: t, return: true }
      );
      // Handle Issued_Assets
      const Issued_Assets = service.Issued_Asset;
      if (Issued_Assets && Array.isArray(Issued_Assets)) {
        for (const Issued_Asset of Issued_Assets) {
          const Data = {
            Asset_Pooling_Id: OrderData1.UTD,
            Asset_PoolingDtl_Id: AssetPoolingDataDtl.UTD,
            Asset_Product: Issued_Asset.UTD, // Correct this to fetch from Issued_Asset
            Asset_Issue_Qty: Issued_Asset.issue_qty,
            Created_By: OrderData1.Created_By,
          };
          // Insert each issued asset into Issued_Asset detail table
          const AssetPoolingDtlSR = _AssetPoolingReallocationDtlSr(
            sequelize,
            Sequelize.DataTypes
          );
          await AssetPoolingDtlSR.create(Data, {
            transaction: t,
            return: true,
          });
          const Product_History = _Product_Histroy(
            sequelize,
            Sequelize.DataTypes
          );
          // Handle Issued_Asset
          await Product_History.create(
            {
              Asset_ID: Issued_Asset.UTD,
              Quantity: Issued_Asset.issue_qty,
              Tran_Type: 8, // 8 for Transfer Out
              Created_By: OrderData1.Created_By,
              Source_Location: AssetPoolingDataDtl.Location,
              Category: AssetPoolingDataDtl.Category,
              SubCategory: AssetPoolingDataDtl.SubCategory,
              TransferTo: OrderData1.Asset_Product,
              Tran_Date: OrderData1.Transfer_Date,
            },
            {
              transaction: t,
              return: true,
            }
          );
        }
      }
    }

    await t.commit();
    res
      .status(200)
      .json({ success: true, message: "Asset transfer saved successfully!" });
  } catch (err) {
    if (t) await t.rollback(); // Rollback transaction on error
    console.error(err);
    res.status(500).json({ error: "Failed to save asset transfer." });
  }
};

exports.GetAssetDtlForTransfer = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Asset_Product = req.body.Asset_Product;
  const Location = req.body.Location;
  try {
    const result =
      await sequelize.query(`select UTD,Manufacturer,Model,Serial_No,Description,(
        SELECT 
            
        SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)
        FROM 
            Product_History
        WHERE 
            Product_History.Asset_ID = Asset_Product.utd 
            AND Source_Location   in (${Location})
    ) AS Quantity from Asset_Product where UTD = '${Asset_Product}'`);

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

exports.Poolingfill = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const UTD = req.body.UTD;
  try {
    const Asset_Pooling_Dtl = await sequelize.query(
      `SELECT 
      DTL.UTD,
      (SELECT TOP 1 Name FROM Assets_Group_Subcategory WHERE id = DTL.SubCategory) AS SubCategory,
      DTL.Description,
      DTL.Reason,
      (SELECT TOP 1 Name FROM Asset_Product WHERE UTD = DTL_SR.Asset_Product) AS ProductName,
      (SELECT TOP 1 Serial_No FROM Asset_Product WHERE UTD = DTL_SR.Asset_Product) AS SerialNo,
      DTL_SR.Asset_Issue_Qty
  FROM 
      Asset_Pooling_Reallocation_Dtl DTL
  JOIN 
      Asset_Pooling_Reallocation_DtlSR DTL_SR
      ON DTL.UTD = DTL_SR.asset_PoolingDtl_Id
  WHERE 
      DTL.poolingid = '${UTD}'`
    );

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Asset_Pooling_Dtl: Asset_Pooling_Dtl[0],
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
exports.Reallocationfill = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const UTD = req.body.UTD;
  try {
    const Asset_Reallocation = await sequelize.query(
      `select UTD as asset_pooling_reallocation, CAST(Transfer_Date AS DATE) Transfer_Date,(select top 1 name from assets_group where id=Category)as Category,(select top 1 name from assets_group_subcategory where id=SubCategory)as SubCategory,(select top 1 name from Asset_Product where utd=Asset_Product)as Asset_Product,Asset_Product as FindAsset_Product, Remark  from Asset_Pooling_Reallocation WHERE UTD = '${UTD}'`
    );
    const Asset_Reallocation_DtlSR = await sequelize.query(
      `select UTD,(select top 1 Name from Asset_Product where Asset_Product.UTD=Asset_Product)as Asset_Name,
(select top 1 subcategory from Asset_Pooling_Reallocation_Dtl where Asset_Pooling_Reallocation_Dtl.UTD=Asset_Pooling_Reallocation_Dtlsr.Asset_PoolingDtl_Id)as SubCategory,
(select top 1 category from Asset_Pooling_Reallocation_Dtl where Asset_Pooling_Reallocation_Dtl.UTD=Asset_Pooling_Reallocation_Dtlsr.Asset_PoolingDtl_Id)as Category,
(select top 1 Description from Asset_Pooling_Reallocation_Dtl where Asset_Pooling_Reallocation_Dtl.UTD=Asset_Pooling_Reallocation_Dtlsr.Asset_PoolingDtl_Id)as Description,
(select top 1 Reason from Asset_Pooling_Reallocation_Dtl where Asset_Pooling_Reallocation_Dtl.UTD=Asset_Pooling_Reallocation_Dtlsr.Asset_PoolingDtl_Id)as Reason,
Asset_Issue_Qty,Asset_Product,(CAST(Asset_Issue_Qty AS INT) - ISNULL(CAST(Asset_Revoke_Qty AS INT), 0)) AS Available_Revoke
from Asset_Pooling_Reallocation_Dtlsr where Asset_Pooling_Id in (${UTD})`
    );

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Asset_Reallocation: Asset_Reallocation[0][0],
      Asset_Reallocation_DtlSR: Asset_Reallocation_DtlSR[0],
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

exports.AssetTransferRevoke = async function (req, res) {
  const {
    Manufacturer,
    SerialNo,
    Model,
    Quantity,
    Description,
    Serial_No,
    UTD,
    ...General
  } = req.body.Formdata;
  const { Service } = req.body; // Adjusted to directly extract 'Service' from req.body
  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    await sequelize.query(
      `update asset_pooling_reallocation set Revoke_Date='${General.reallocation_date}',reallocation_date='${General.reallocation_date}' where utd='${General.asset_pooling_reallocation}'`,
      { transaction: t }
    );
    // Loop over each service
    for (const service of Service) {
      // Insert each issued asset into Issued_Asset detail table
      const AssetPoolingDtlSR = _AssetPoolingReallocationDtlSr(
        sequelize,
        Sequelize.DataTypes
      );
      await AssetPoolingDtlSR.update(
        { Asset_Revoke_Qty: service.Asset_Revoke_Qty },
        {
          where: {
            UTD: service.UTD,
          },
          transaction: t,
          return: true,
        }
      );
      const adddata = await sequelize.query(
        `select SubCategory,Category from asset_product where utd='${service.Asset_Product}'`
      );
      const Product_History = _Product_Histroy(sequelize, Sequelize.DataTypes);
      if (
        service.Asset_Revoke_Qty &&
        service.Asset_Revoke_Qty != "" &&
        service.Asset_Revoke_Qty != null &&
        service.Asset_Revoke_Qty != 0 &&
        service.Asset_Revoke_Qty != "null"
      ) {
        await Product_History.create(
          {
            Asset_ID: service.Asset_Product,
            Quantity: service.Asset_Revoke_Qty,
            Tran_Type: 9,
            Created_By: req.body.username,
            Source_Location: General.Location,
            Category: adddata[0][0].Category,
            SubCategory: adddata[0][0].SubCategory,
            TransferTo: General.FindAsset_Product,
            Tran_Date: General.reallocation_date,
          },
          {
            transaction: t,
            return: true,
          }
        );
      }
    }
    await t.commit();
    res
      .status(200)
      .json({ success: true, message: "Asset Revoked saved successfully!" });
  } catch (err) {
    if (t) await t.rollback(); // Rollback transaction on error
    console.error(err);
    res.status(500).json({ error: "Failed to save asset transfer." });
  }
};
exports.MasterPoolingView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const UTD = req.body.UTD;
  try {
    const Asset_Pooling_Dtl = await sequelize.query(
      `SELECT
    (select top 1 Cast(transfer_date as date) from asset_pooling_reallocation where asset_pooling_reallocation.UTD=DTL_SR.Asset_Pooling_Id)as Transfer_Date,
    (SELECT TOP 1 Name
     FROM Assets_Group_Subcategory
     WHERE Id = (SELECT TOP 1 SubCategory
                 FROM Asset_Pooling_Reallocation_Dtl
                 WHERE UTD = Asset_PoolingDtl_Id)) AS SubCategory,
    (SELECT TOP 1 Name
     FROM Asset_Product
     WHERE UTD = DTL_SR.Asset_Product) AS AssetName,
    (SELECT TOP 1 Serial_No
     FROM Asset_Product
     WHERE UTD = DTL_SR.Asset_Product) AS SerialNo,
    (SELECT TOP 1 Description
     FROM Asset_Product
     WHERE UTD = DTL_SR.Asset_Product) AS Asset_Description,
    (SELECT TOP 1 Unit_Rate 
     FROM Asset_Product 
     WHERE Asset_Product.UTD = DTL_SR.Asset_Product) AS Unit_price,
    (SELECT TOP 1 Reason
     FROM Asset_Pooling_Reallocation_Dtl
     WHERE UTD = DTL_SR.Asset_PoolingDtl_Id) AS Transfer_Remark,
    CASE
        WHEN DTL_SR.Asset_Revoke_Qty IS NOT NULL THEN
            CAST(DTL_SR.Asset_Issue_Qty AS INT) - CAST(DTL_SR.Asset_Revoke_Qty AS INT)
        ELSE
            CAST(DTL_SR.Asset_Issue_Qty AS INT)
    END AS Final_Asset_Issue_Qty,
    -- Calculating the Final Price
    CASE
        WHEN DTL_SR.Asset_Revoke_Qty IS NOT NULL THEN
            (CAST(DTL_SR.Asset_Issue_Qty AS INT) - CAST(DTL_SR.Asset_Revoke_Qty AS INT)) * 
            (SELECT TOP 1 purchase_value FROM Asset_Product WHERE Asset_Product.UTD = DTL_SR.Asset_Product)
        ELSE
            CAST(DTL_SR.Asset_Issue_Qty AS INT) * 
            (SELECT TOP 1 purchase_value FROM Asset_Product WHERE Asset_Product.UTD = DTL_SR.Asset_Product)
    END AS Final_Price

FROM
    Asset_Pooling_Reallocation_DtlSR DTL_SR
WHERE
    DTL_SR.Asset_Pooling_Id IN (SELECT UTD
                                FROM Asset_Pooling_Reallocation
                                WHERE Asset_Product = '${UTD}')`
    );

    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Asset_Pooling_Dtl: Asset_Pooling_Dtl[0],
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

exports.AssetViewEmployeeMaster = async function (req, res) {
  try {
    const EmpCode = req.query.EmpCode;
    const sequelize = await dbname(req.query.compcode);

    // Query for the asset details
    const results = await sequelize.query(`
      SELECT 
      (SELECT TOP 1 NAME 
       FROM Assets_Group 
       WHERE ID = Category) AS Category,
      (SELECT TOP 1 NAME 
       FROM Assets_Group_Subcategory 
       WHERE ID = SubCategory) AS SubCategory,
      (SELECT TOP 1 NAME 
       FROM Asset_Product 
       WHERE UTD = (SELECT TOP 1 ASSET_PRODUCT 
                    FROM product_issue_dtl 
                    WHERE PRODUCT_ISSUE = Product_Issue.Tran_Id)) AS AssetName,
      Description, 
      Reason, 
      (SELECT TOP 1 GODW_NAME 
       FROM GODOWN_MST 
       WHERE Godw_Code = Location) AS Location,
      IssuedDate, 
      COALESCE(
          (SELECT TOP 1 Asset_Issue_Qty 
           FROM product_issue_dtl 
           WHERE Product_Issue = tran_id), 0) AS Issue_Qty
    FROM Product_Issue 
    WHERE EmpCode = '${EmpCode}' 
      AND Revoked_Asset IS NULL;
    `);

    // Query for employee details (result1)
    const result1 = await sequelize.query(`
      SELECT EMPCODE, CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) AS EMPNAME, 
             EMPLOYEEDESIGNATION, 
             (SELECT TOP 1 MISC_NAME FROM Misc_Mst 
              WHERE Misc_Type = 85 
                AND Misc_Code = Location 
                AND Export_Type < 3) AS EmpLocation  
      FROM EMPLOYEEMASTER 
      WHERE EMPCODE = '${EmpCode}'
    `);

    // Generate HTML response with improved styling
    let html = `
      <html>
        <head>
          <title>Asset View for Employee</title>
          <style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    margin: 20px;
    background-color: #f9f9f9;
    color: #333;
  }
  h2 {
    color: #4CAF50;
    border-bottom: 2px solid #4CAF50;
    padding-bottom: 5px;
  }
  .employee-info {
    margin-bottom: 20px;
    padding: 10px;
    background-color: #e9f5e9;
    border: 1px solid #4CAF50;
    border-radius: 8px;
  }
  .employee-info p {
    margin: 6px 0;
    font-size: 16px; /* Larger font size */
    text-transform: uppercase; /* Uppercase text */
  }
  .employee-info p strong {
    font-weight: bold;
    color: #333;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    background-color: #fff;
  }
  table, th, td {
    border: 1px solid #ddd;
    padding: 10px;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
    color: #333;
    text-transform: uppercase;
    font-size: 12px;
  }
  td {
    font-size: 14px;
  }
  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  tr:hover {
    background-color: #f1f1f1;
  }
</style>

        </head>
        <body>
          <h2>EMPLOYEE DETAILS</h2>
          <div class="employee-info">
            <p><strong>Employee Code:</strong> ${result1[0][0]?.EMPCODE || "N/A"
      }</p>
            <p><strong>Employee Name:</strong> ${result1[0][0]?.EMPNAME || "N/A"
      }</p>
            <p><strong>Designation:</strong> ${result1[0][0]?.EMPLOYEEDESIGNATION || "N/A"
      }</p>
            <p><strong>Location:</strong> ${result1[0][0]?.EmpLocation || "N/A"
      }</p>
          </div>

          <h2>ASSET DETAILS</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>SubCategory</th>
                <th>Asset Name</th>
                <th>Description</th>
                <th>Reason</th>
                <th>Location</th>
                <th>Issued Date</th>
                <th>Issue Quantity</th>
              </tr>
            </thead>
            <tbody>
    `;

    results[0].forEach((row) => {
      html += `
        <tr>
          <td>${row.Category}</td>
          <td>${row.SubCategory}</td>
          <td>${row.AssetName}</td>
          <td>${row.Description}</td>
          <td>${row.Reason}</td>
          <td>${row.Location}</td>
          <td>${new Date(row.IssuedDate).toLocaleDateString()}</td>
          <td>${row.Issue_Qty}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send("An error occurred while fetching employee asset data");
  }
};

exports.AssetdashboardCategoryWise = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  // const Insu_Entry = _Insu_Entry(sequelize, DataTypes);
  let { branch, subCategory } = req.body;
  const t = await sequelize.transaction();
  try {
    const Available_Asset_SubCategory =
      await sequelize.query(`WITH AvailableAssets AS (
      SELECT 
          utd AS id, 
          name,
          icon, 
          (SELECT TOP 1 Name FROM Assets_Group_Subcategory WHERE Id = Asset_Product.Subcategory) AS Category_Name,
          (SELECT TOP 1 Icon FROM Assets_Group_Subcategory WHERE Id = Asset_Product.Subcategory) AS Category_icon,
          Subcategory AS Group_Id,
          (
              SELECT
                  SUM(CASE WHEN Tran_Type IN (1, 2, 4, 5, 9) AND Source_Location IN (${branch}) THEN Quantity ELSE 0 END) - 
                  SUM(CASE WHEN Tran_Type IN (3, 6, 7, 8) AND Source_Location IN (${branch}) THEN Quantity ELSE 0 END) 
              FROM
                  Product_History
              WHERE
                  Product_History.Asset_ID = Asset_Product.UTD
                  AND Source_Location IN (${branch})
          ) AS Available
      FROM 
          Asset_Product where Category in (${subCategory})
  )
  SELECT 
   Group_Id,
  Category_icon,
      Category_Name,
      COUNT(id) AS Available_Assets
  FROM 
      AvailableAssets
  WHERE 
      Available > 0
  GROUP BY 
      Category_Name,Category_icon,Group_Id`);
    await t.commit();
    res.status(200).send({
      Available_Asset_Category: Available_Asset_SubCategory[0],
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};
exports.AssetdashboardSubCategoryWise = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  // const Insu_Entry = _Insu_Entry(sequelize, DataTypes);
  let { branch, subCategory } = req.body;
  const t = await sequelize.transaction();
  try {
    const Available_Asset_SubCategory =
      await sequelize.query(`WITH AvailableAssets AS (
      SELECT
          utd,
          name,
          icon,   
          (
              SELECT
                  SUM(CASE WHEN Tran_Type IN (1, 2, 4, 5, 9) AND Source_Location IN (${branch}) THEN Quantity ELSE 0 END) -  
                  SUM(CASE WHEN Tran_Type IN (3, 6, 7, 8) AND Source_Location IN (${branch}) THEN Quantity ELSE 0 END)       
              FROM
                  Product_History
              WHERE
                  Product_History.Asset_ID = Asset_Product.UTD
                  AND Source_Location IN (${branch})
          ) AS Available
      FROM
          Asset_Product where Subcategory in (${subCategory})
  )
  SELECT
  utd as Group_Id,
 icon as Category_icon,
  name as  Category_Name,
  Available AS Available_Assets
  FROM
      AvailableAssets
  WHERE
      Available > 0`);
    await t.commit();
    res.status(200).send({
      Available_Asset_Category: Available_Asset_SubCategory[0],
    });
  } catch (err) {
    if (t) await t.rollback();
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.viewDirect = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
     SELECT
     UTD,
    (SELECT TOP 1 godw_name
     FROM GODOWN_MST
     WHERE Godw_Code = Location) AS FromBranch,
    'Multilocation' AS ToBranch,
    (SELECT TOP 1 name
     FROM Assets_Group
     WHERE id = Asset_Category) AS Asset_Name,
    (SELECT TOP 1 name
     FROM Assets_Group_Subcategory
     WHERE id = (SELECT top 1 Item
                 FROM Purchase_Req_Product_Details
                 WHERE Purchase_Id = purchase_request.UTD)) AS Item,
UTD,
(SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(purchase_request.UTD AS VARCHAR) AS PoNumber,
cast(Req_Date as date)as Req_Date,
    (SELECT COUNT(utd)
     FROM Purchase_Req_Product_Details
     WHERE Purchase_Id = purchase_request.UTD) AS Total_Items,
    (SELECT SUM(Total_Price)
     FROM Purchase_Req_Product_Details
     WHERE Purchase_Id = purchase_request.UTD) AS Total_Price,
      (SELECT CONVERT(INT, SUM(CONVERT(INT, Issue_Quantity))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS IsIssued,
    (SELECT top 1 Item_Description
     FROM Purchase_Req_Product_Details
     WHERE Purchase_Id = purchase_request.UTD) AS Item_Description,
   (SELECT CONVERT(INT, SUM(CONVERT(INT, Quantity))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS Quantity,
 (SELECT CONVERT(INT, SUM(CONVERT(INT, Issue_Quantity))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS Issue_Quantity,
(SELECT CONVERT(INT, SUM(CONVERT(DECIMAL(10, 2), Unit_Price))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS Unit_Price,

(SELECT CONVERT(INT, SUM(CONVERT(DECIMAL(10, 2), Discount))) 
 FROM Purchase_Req_Product_Details 
 WHERE Purchase_Id = purchase_request.UTD) AS Discount
FROM
    purchase_request
WHERE 
    CAST(Req_Date AS date) BETWEEN '${dateFrom}' and '${dateto}' and location in (${loc_code}) and LocationTo is  null order by Req_Date desc
                `;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.viewDirectTransferedassets = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
    SELECT 
 pr.UTD,
  (SELECT TOP 1 godw_name
     FROM GODOWN_MST
     WHERE Godw_Code = pr.Location) AS FromBranch,
	 (SELECT TOP 1 godw_name
     FROM GODOWN_MST
     WHERE Godw_Code = prd.Location) AS ToBranch,
	 (SELECT TOP 1 name
     FROM Assets_Group
     WHERE id = prd.Asset_Category) AS Asset_Category,
	 (SELECT TOP 1 name
     FROM Assets_Group_Subcategory
     WHERE id = prd.Item) AS Item,
	 (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(pr.UTD AS VARCHAR) AS PoNumber,
	 cast(pr.Req_Date as date)as Req_Date,
	prd.Total_Price,
	prd.Issue_Quantity

FROM 
    purchase_request pr
JOIN 
    purchase_req_product_details prd
    ON prd.Purchase_Id = pr.UTD -- Joining condition
WHERE 
    CAST(pr.Req_Date AS date) BETWEEN '${dateFrom}' and '${dateto}' -- Date range condition
    AND prd.Location IN (${loc_code})
    AND pr.LocationTo IS NULL 
ORDER BY 
    pr.Req_Date DESC;  
    `;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.AssetTransferReprot = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  console.log(req.body, "komal");
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;
  const Type = req.body.Type;

  try {
    let result;
    if (Type == 2) {
      result =
        await sequelize.query(`select  Tran_Type, Asset_Id, (Select top 1 name from Asset_Product where Asset_Product.UTD = Product_History.Asset_ID) AS AssetName,
      (SELECT TOP 1 name
      FROM Assets_Group
      WHERE Assets_Group.id = Product_History.Category) AS CategoryName,
    (SELECT TOP 1 name
      FROM Assets_Group_Subcategory
      WHERE Assets_Group_Subcategory.id = Product_History.SubCategory) AS SubCategoryName, 
    (Select top 1 Model from Asset_Product where Asset_Product.UTD= Product_History.Asset_ID) AS Model,
    (Select top 1 Description from Asset_Product where Asset_Product.UTD= Product_History.Asset_ID) AS Description,
    (SELECT TOP 1 Godw_Name
      FROM GODOWN_MST
      WHERE GODOWN_MST.Godw_Code = Product_History.Source_Location) AS ToBranch,
    (SELECT TOP 1 Godw_Name
      FROM GODOWN_MST
      WHERE GODOWN_MST.Godw_Code = Product_History.Destination_Location) AS FromBranch,
    CAST(Created_At AS DATE) AS Transfer_Date, Quantity
    from Product_History WHERE Tran_Type IN (2) and Source_Location in (${loc_code}) and CAST(Created_At AS DATE) BETWEEN '${datefrom}' and '${dateto}'`);
    } else if (Type == 7) {
      result =
        await sequelize.query(`select  Tran_Type, Asset_Id, (Select top 1 name from Asset_Product where Asset_Product.UTD = Product_History.Asset_ID) AS AssetName,
      (SELECT TOP 1 name
      FROM Assets_Group
      WHERE Assets_Group.id = Product_History.Category) AS CategoryName,
    (SELECT TOP 1 name
      FROM Assets_Group_Subcategory
      WHERE Assets_Group_Subcategory.id = Product_History.SubCategory) AS SubCategoryName, 
    (Select top 1 Model from Asset_Product where Asset_Product.UTD= Product_History.Asset_ID) AS Model,
    (Select top 1 Description from Asset_Product where Asset_Product.UTD= Product_History.Asset_ID) AS Description,
    (SELECT TOP 1 Godw_Name
      FROM GODOWN_MST
      WHERE GODOWN_MST.Godw_Code = Product_History.Source_Location) AS FromBranch,
    (SELECT TOP 1 Godw_Name
      FROM GODOWN_MST
      WHERE GODOWN_MST.Godw_Code = Product_History.Destination_Location) AS ToBranch,
    CAST(Created_At AS DATE) AS Transfer_Date, Quantity
    from Product_History WHERE Tran_Type IN (7) and Source_Location in (${loc_code}) and CAST(Created_At AS DATE) BETWEEN '${datefrom}' and '${dateto}'`);
    }

    console.log(result, "komalresult");
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

exports.PurchaseEntryAssetSub = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Asset_Type = req.body.Asset_Type;
  try {
    let query;
    query = `SELECT CAST(id AS VARCHAR) AS value, name AS label
      FROM Assets_Group_subcategory where  common is null or common =0`;
    const result = await sequelize.query(query);
    res.status(200).send(result[0]);
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

exports.AllAssetview = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const loc_code = req.body.loc_code;
  try {
    let query = "";
    query = ` WITH AvailableAssets AS (
    SELECT
        utd,
		QRCode,
        name,
        assetcode,
		(select top 1 godw_name from GODOWN_MST where Godw_Code=(${loc_code}) and Export_Type<3)as location_code,
		Description,
    Category,
        (select top 1 Name from Assets_Group where id=Category)as CategoryName,
        (select top 1 Name from Assets_Group_Subcategory where id=Subcategory)as SubCategoryName,
        (
            SELECT
                SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END)
            FROM
                Product_History
            WHERE
                Product_History.Asset_ID = Asset_Product.UTD
                AND Source_Location IN (${loc_code})
        ) AS Available
    FROM
        Asset_Product
)
SELECT
    utd,
    name,
	CategoryName,
  Category,
	SubCategoryName,
	Description,
	QRCode,
    Available ,
    assetcode,
	location_code
FROM
    AvailableAssets
WHERE
    Available > 0`;

    if (req.body.Category) {
      query = ` WITH AvailableAssets AS (
        SELECT
            utd,
        QRCode,
            name,
            assetcode,
        (select top 1 godw_name from GODOWN_MST where Godw_Code=(${loc_code}) and Export_Type<3)as location_code,
        Description,
        Category,
            (select top 1 Name from Assets_Group where id=Category)as CategoryName,
            (select top 1 Name from Assets_Group_Subcategory where id=Subcategory)as SubCategoryName,
            (
                SELECT
                    SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                    SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                    SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                    SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                    SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                    SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                    SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                    SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                    SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END)
                FROM
                    Product_History
                WHERE
                    Product_History.Asset_ID = Asset_Product.UTD
                    AND Source_Location IN (${loc_code}) and category in (${req.body.Category})
            ) AS Available
        FROM
            Asset_Product
    )
    SELECT
        utd,
        name,
      CategoryName,
      Category,
      SubCategoryName,
      Description,
      QRCode,
        Available ,
        assetcode,
      location_code
    FROM
        AvailableAssets
    WHERE
        Available > 0`;
    }
    if (req.body.SubCategory) {
      query = ` WITH AvailableAssets AS (
        SELECT
            utd,
        QRCode,
        assetcode,
            name,
        (select top 1 godw_name from GODOWN_MST where Godw_Code=(${loc_code}) and Export_Type<3)as location_code,
        Description,
        Category,
            (select top 1 Name from Assets_Group where id=Category)as CategoryName,
            (select top 1 Name from Assets_Group_Subcategory where id=Subcategory)as SubCategoryName,
            (
                SELECT
                    SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                    SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                    SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                    SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) +
                    SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                    SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                    SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                    SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END) -
                    SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (${loc_code}) THEN Quantity ELSE 0 END)
                FROM
                    Product_History
                WHERE
                    Product_History.Asset_ID = Asset_Product.UTD
                    AND Source_Location IN (${loc_code}) and SubCategory in (${req.body.SubCategory})
            ) AS Available
        FROM
            Asset_Product
    )
    SELECT
        utd,
        name,
      CategoryName,
      Category,
      SubCategoryName,
      Description,
      QRCode,
        Available ,
        assetcode,
      location_code
    FROM
        AvailableAssets
    WHERE
        Available > 0`;
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

exports.filldirectissue = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Assets = req.body.Assets;
  const Location = req.body.Location;
  console.log(Assets, "Assets");

  try {
    const assetsArray = Assets.split(",").map((asset) =>
      parseInt(asset.trim())
    );

    // Array to store all query results
    const allResults = [];

    // Loop through each asset in the array
    for (const item of assetsArray) {
      // First query for SubCategory and Category
      const query = await sequelize.query(
        `
        select SubCategory, Category,
        (
          SELECT
            SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) + 
            SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
            SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
            SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) 
          FROM Product_History
          WHERE Product_History.SubCategory = Asset_Product.Subcategory
          AND Source_Location IN (:location)
        ) AS Available,
        (select top 1 asset_type from Assets_Group where id=Category)as Returnable,
		    Description,
        1 as Issue_Quantity
        from asset_product 
        where utd = :item
      `,
        {
          replacements: { location: Location, item: item },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      // Second query for issued assets
      const issued_asset = await sequelize.query(
        `
        select UTD, Name, Manufacturer, Model,
        (
          SELECT
            SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) + 
            SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
            SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
            SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) 
          FROM Product_History
          WHERE Product_History.SubCategory = Asset_Product.Subcategory
          AND Source_Location IN (:location)
        ) AS qty,
        1 as issue_qty,
        Serial_No,
        1 as flag,
        Description,
        1 as [check]
        from asset_product 
        where utd = :item
      `,
        {
          replacements: { location: Location, item: item },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      // Add the issued_asset array to the result of the first query
      query[0].Issued_Asset = issued_asset;

      // Collect the result in allResults array
      allResults.push(query[0]);
    }

    // Return all collected results in response
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: allResults,
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

exports.filldirectbranch = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Assets = req.body.Assets;
  const Location = req.body.Location;
  try {
    const assetsArray = Assets.split(",").map((asset) =>
      parseInt(asset.trim())
    );

    // Array to store all query results
    const allResults = [];

    // Loop through each asset in the array
    for (const item of assetsArray) {
      // First query for SubCategory and Category
      const query = await sequelize.query(
        `
        select SubCategory as Item, Category as Asset_Category,
        (
          SELECT
            SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) + 
            SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
            SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
            SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) 
          FROM Product_History
          WHERE Product_History.SubCategory = Asset_Product.Subcategory
          AND Source_Location IN (:location)
        ) AS Available_Quantity,
		    Description as Item_Description,
        1 as Issue_Quantity
        from asset_product 
        where utd = :item
      `,
        {
          replacements: { location: Location, item: item },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      // Second query for issued assets
      const issued_asset = await sequelize.query(
        `
        select UTD, Name, Manufacturer, Model,
        (
          SELECT
            SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) + 
            SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
            SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
            SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) 
          FROM Product_History
          WHERE Product_History.SubCategory = Asset_Product.Subcategory
          AND Source_Location IN (:location)
        ) AS qty,
        1 as issue_qty,
        Serial_No,
        1 as flag,
        Description,
        1 as [check]
        from asset_product 
        where utd = :item
      `,
        {
          replacements: { location: Location, item: item },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      // Add the issued_asset array to the result of the first query
      query[0].IssuedAsset = issued_asset;

      // Collect the result in allResults array
      allResults.push(query[0]);
    }

    // Return all collected results in response
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: allResults,
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

exports.AllSubCategoryView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    let query = "";
    query = `select id as UTD,(select top 1 Name from Assets_Group where Assets_Group.id=Assets_Group_Subcategory.Group_Id)as Category,
    (select top 1 UTD from Asset_Characteristic where SubCategory=Id)as Characteristic,
    name,Series,AMC,Depreciation_Method,common from Assets_Group_Subcategory`;

    if (req.body.Category) {
      query = ` select id as UTD,(select top 1 Name from Assets_Group where Assets_Group.id=Assets_Group_Subcategory.Group_Id)as Category,
          (select top 1 UTD from Asset_Characteristic where SubCategory=Id)as Characteristic,
      name,Series,AMC,Depreciation_Method,common from Assets_Group_Subcategory where group_id in (${req.body.Category})`;
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

exports.AddCharacter = async function (req, res) {
  const { UTD, ...General } = req.body;
  console.log(req.body, "request.body");

  const { error: assetError, value: validatedData } =
    AssetCharacteristicSchema.validate(General, {
      abortEarly: false,
      stripUnknown: true,
    });

  if (assetError) {
    const errors = assetError.details.map((err) => err.message);
    return res.status(400).send({ success: false, message: errors.join(", ") });
  }

  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    const AssetCharacteristic = _AssetCharacteristic(
      sequelize,
      Sequelize.DataTypes
    );

    const NewTypeValue =
      await sequelize.query(`SELECT COALESCE(MAX(TypeValue+1), 1)  AS TypeValue
    FROM Asset_Characteristic`);

    const TypeValue = NewTypeValue[0][0].TypeValue;

    for (let name of validatedData.Name) {
      name = name.replace(/['"]+/g, "");
      await AssetCharacteristic.create(
        {
          Type: validatedData.Type,
          Name: name,
          Category: validatedData.Category,
          SubCategory: validatedData.SubCategory,
          Created_By: validatedData.Created_By,
          TypeValue: TypeValue,
        },
        { transaction: t }
      );
    }

    await t.commit();

    const response = {
      success: true,
      message: "Asset characteristics saved successfully.",
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback(); // Rollback transaction on failure
    }
    res.status(500).json({ error: "An error occurred during saving." });
  }
};

exports.UpdateCharacter = async function (req, res) {
  console.log(req.body, "request.body");
  const { UTD, ...General } = req.body;
  const { error: assetError, value: validatedData } =
    AssetCharacteristicSchema.validate(General, {
      abortEarly: false,
      stripUnknown: true,
    });

  if (assetError) {
    const errors = assetError.details.map((err) => err.message);
    return res.status(400).send({ success: false, message: errors.join(", ") });
  }

  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    const AssetCharacteristic = _AssetCharacteristic(
      sequelize,
      Sequelize.DataTypes
    );

    console.log(validatedData, "validatedData");

    await AssetCharacteristic.destroy({
      where: {
        TypeValue: validatedData.TypeValue,
      },
      transaction: t,
    });

    for (let name of validatedData.Name) {
      name = name.replace(/['"]+/g, "");
      await AssetCharacteristic.create(
        {
          Type: validatedData.Type,
          TypeValue: validatedData.TypeValue,
          Name: name,
          Category: validatedData.Category,
          SubCategory: validatedData.SubCategory,
          Created_By: validatedData.Created_By,
        },
        { transaction: t }
      );
    }

    await t.commit();
    const response = {
      success: true,
      message: "Asset characteristics updated successfully.",
    };
    res.status(200).json(response);
  } catch (error) {
    console.error("Error:", error);
    if (t) {
      await t.rollback(); // Rollback transaction on failure
    }
    res.status(500).json({ error: "An error occurred during the update." });
  }
};

exports.ShowCharacteristic = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const SubCategory = req.body.SubCategory;
  try {
    let query;
    query = `select type , name, TypeValue from asset_characteristic where Subcategory = '${SubCategory}'`;
    const result = await sequelize.query(query);
    res.status(200).send(result[0]);
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

exports.CharacteristicAssetProduct = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const SubCategory = req.body.SubCategory;
  console.log(req.body, "komallll");
  try {
    const result = await sequelize.query(
      `Select CONCAT(Type , ' - ', Name) as label , CONCAT(Type , ' - ', Name) as value  from asset_characteristic where Subcategory = '${SubCategory}'`
    );
    res.status(200).send(result[0]);
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

exports.paymentmode1 = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const asset = req.body.asset;
  const UTD = req.body.UTD;
  const Location = req.body.Location;
  try {
    let ItemName;
    let VendorName;
    let PoNumber;
    let result1;
    let assets;
    let purchase_requestData;
    let purchase_request_Dtl_Data;
    let AssetSubcategory;
    let Asset_Type;
    let assetproductforpurchaseorder;
    const Location1 = req.body.Location1;

    const branch = await sequelize.query(
      `select godw_code as value,godw_Name as label from godown_mst where export_type<3`
    );
    if (asset) {
      if (req.body.Req) {
        ItemName = await sequelize.query(`
        select id as value, name as label,Group_Id from Assets_Group_Subcategory where common is null or common =0`);
        if (Location) {
          ItemName = await sequelize.query(`
          select id as value, name as label,Group_Id,
       (select SUM(qty) from Asset_Product where Subcategory=Id and Location='${Location}')as Available_Quantity
      from Assets_Group_Subcategory where common is null or common =0`);
        }
        VendorName =
          await sequelize.query(`SELECT utd as value, Vendor_Name as label 
          FROM Product_Vendor 
          WHERE asset_product IN (SELECT utd FROM Asset_Product WHERE category = '${asset}')`);
      } else {
        assetproductforpurchaseorder =
          await sequelize.query(`select CAST(utd AS VARCHAR) as value, name as label, Subcategory, 
            (
          SELECT 
          SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) 
          
          FROM 
              Product_History
          WHERE 
              Product_History.Asset_ID = Asset_Product.UTD 
              AND Source_Location = '${Location1}'
      ) AS Available_Quantity from Asset_Product where Category = '${asset}'`);

        ItemName =
          await sequelize.query(`select vendor_code from product_vendor where asset_product in
               (select UTD from Asset_Product where Category = '${asset}')`);

        AssetSubcategory = await sequelize.query(`
                select CAST(id AS VARCHAR) as value, name as label,Group_Id,Series from Assets_Group_Subcategory where group_Id = '${asset}'`);
      }
      VendorName =
        await sequelize.query(`SELECT utd as value, Vendor_Name as label 
  FROM Product_Vendor 
  WHERE asset_product IN (SELECT utd FROM Asset_Product WHERE category = '${asset}')`);

      Asset_Type = await sequelize.query(`
    select Asset_Type  from Assets_Group where Id=${asset}`);
    } else {
      assets = await sequelize.query(
        `select id as value,name as label from Assets_Group`
      );

      if (req.body.Req) {
        PoNumber = await sequelize.query(
          `SELECT 
      (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(ISNULL(MAX(utd) + 1, 1) AS VARCHAR) AS PoNumber
    FROM Purchase_Request`
        );
      } else {
        PoNumber = await sequelize.query(
          `SELECT 
          (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(ISNULL(MAX(utd) + 1, 1) AS VARCHAR) AS PoNumber
        FROM Purchase_Order;`
        );
      }

      result1 = await sequelize.query(
        `SELECT Misc_Code AS value, Misc_Name AS label 
         FROM misc_mst 
         WHERE misc_type = 39 
           AND export_type < 3`
      );
      ItemName = await sequelize.query(`
        select id as value, name as label,Group_Id from Assets_Group_Subcategory where common is null or common =0`);
      if (Location) {
        ItemName = await sequelize.query(`
        SELECT 
        id AS value, 
        name AS label, 
        Group_Id,
        (
            SELECT 
            SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)+
            SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
			      SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)-
            SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) 
            
           FROM 
                Product_History
            WHERE 
                Product_History.SubCategory = Assets_Group_Subcategory.Id 
                AND Source_Location = '${Location}'
        ) AS Available_Quantity
    FROM 
        Assets_Group_Subcategory where common is null or common =0`);
      }
      if (UTD) {
        purchase_requestData = await sequelize.query(
          `select UTD,
              (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(purchase_request.UTD AS VARCHAR) AS Po,
          cast(Req_Date as date)as Req_Date,Contact_Number,Email,Address,City,State,Asset_Category,Location,LocationTo from purchase_request where utd=${UTD}`
        );
        const purchaseRequestDetails = await sequelize.query(
          `SELECT 
    UTD,
    Item,
    Item_Description,
    Quantity,
    Issue_Quantity,
    Unit_Price,
    Total_Price,
    Discount,
    Asset_Category,
    Location,

    ( 
        SELECT  
            SUM(CASE WHEN Tran_Type = 1 THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 2 THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 4 THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 5 THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 3 THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 6 THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 7 THEN Quantity ELSE 0 END)
        FROM Product_History PH
        WHERE PH.SubCategory = PRPD.Item
          AND PH.Source_Location = PRPD.Location
    ) AS Available_Quantity,
    (SELECT TOP 1 Asset_Type 
     FROM Assets_Group AG
     WHERE AG.id = PRPD.Asset_Category
    ) AS Asset_Type
FROM 
    Purchase_Req_Product_Details PRPD where PRPD.Purchase_Id=${UTD}`
        );
        purchase_request_Dtl_Data = purchaseRequestDetails[0];
        ItemName = await sequelize.query(`
          select id as value, name as label,Group_Id from Assets_Group_Subcategory`);
      }
    }
    const UOM = await sequelize.query(
      `SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`
    );

    res.status(200).send({
      PoNumber:
        PoNumber && PoNumber.length > 0 && PoNumber[0].length > 0
          ? PoNumber[0][0].PoNumber
          : [],
      result1: result1 ? result1[0] : [],
      asset: assets ? assets[0] : [],
      VendorName: VendorName ? VendorName[0] : [],
      Item: ItemName ? ItemName[0] : [],
      purchase_requestData: purchase_requestData
        ? purchase_requestData[0][0]
        : [],
      purchase_request_Dtl_Data: purchase_request_Dtl_Data
        ? purchase_request_Dtl_Data
        : [],
      AssetSubcategory: AssetSubcategory ? AssetSubcategory[0] : [],
      branch: branch[0],
      Asset_Type: Asset_Type ? Asset_Type[0][0] : [],
      assetproductforpurchaseorder: assetproductforpurchaseorder
        ? assetproductforpurchaseorder[0]
        : [],
      UOM: UOM[0],
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.FindItemsforPurchase = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Location = req.body.Location;
  try {
    const result = await sequelize.query(
      `select Name,Model as Product_Code,Item_Type,Description as Item_Name,Category,SubCategory,
    (select top 1 Misc_Name from misc_mst where misc_code=UOM1 and export_type<3 and misc_type=72)as UOM1Label,
      UOM1,
      1 as Sup_Qty,
      Unit_Rate as Basic_Price,Asset_Nature as HSN,0 as discp,0 as Disc_Amt,
      (
          SELECT 
          SUM(CASE WHEN Tran_Type = 1 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in  (${Location}) THEN Quantity ELSE 0 END)
          FROM 
              Product_History
          WHERE 
              Product_History.Asset_ID = Asset_Product.UTD 
              AND Source_Location in (${Location})
      ) AS Available_Quantity
         from Asset_Product`
    );
    res.status(200).send(result[0]);
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

exports.paymentmode2 = async function (req, res, next) {
  const sequelize = await dbname(req.headers.compcode);
  const asset = req.body.asset;
  const UTD = req.body.UTD;
  const Location = req.body.Location;
  try {
    let ItemName;
    let VendorName;
    let PoNumber;
    let result1;
    let assets;
    let purchase_requestData;
    let purchase_request_Dtl_Data;
    let AssetSubcategory;
    let Asset_Type;
    let assetproductforpurchaseorder;
    const Location1 = req.body.Location1;

    const branch = await sequelize.query(
      `select godw_code as value,godw_Name as label from godown_mst where export_type<3`
    );
    if (asset) {
      if (req.body.Req) {
        ItemName = await sequelize.query(`
        select id as value, name as label,Group_Id from Assets_Group_Subcategory where common is null or common =0`);
        if (Location) {
          ItemName = await sequelize.query(`
          select id as value, name as label,Group_Id,
       (select SUM(qty) from Asset_Product where Subcategory=Id and Location='${Location}')as Available_Quantity
      from Assets_Group_Subcategory where common is null or common =0`);
        }
        VendorName =
          await sequelize.query(`SELECT utd as value, Vendor_Name as label 
          FROM Product_Vendor 
          WHERE asset_product IN (SELECT utd FROM Asset_Product WHERE category = '${asset}')`);
      } else {
        assetproductforpurchaseorder =
          await sequelize.query(`select CAST(utd AS VARCHAR) as value, name as label, Subcategory, 
            (
          SELECT 
          SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) -
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${Location1}) THEN Quantity ELSE 0 END) 
          
          FROM 
              Product_History
          WHERE 
              Product_History.Asset_ID = Asset_Product.UTD 
              AND Source_Location = '${Location1}'
      ) AS Available_Quantity from Asset_Product where Category = '${asset}'`);

        ItemName =
          await sequelize.query(`select vendor_code from product_vendor where asset_product in
               (select UTD from Asset_Product where Category = '${asset}')`);

        AssetSubcategory = await sequelize.query(`
                select CAST(id AS VARCHAR) as value, name as label,Group_Id,Series from Assets_Group_Subcategory where group_Id = '${asset}'`);
      }
      VendorName =
        await sequelize.query(`SELECT utd as value, Vendor_Name as label 
  FROM Product_Vendor 
  WHERE asset_product IN (SELECT utd FROM Asset_Product WHERE category = '${asset}')`);

      Asset_Type = await sequelize.query(`
    select Asset_Type  from Assets_Group where Id=${asset}`);
    } else {
      assets = await sequelize.query(
        `select id as value,name as label from Assets_Group`
      );

      if (req.body.Req) {
        PoNumber = await sequelize.query(
          `SELECT 
      (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(ISNULL(MAX(utd) + 1, 1) AS VARCHAR) AS PoNumber
    FROM Purchase_Request`
        );
      } else {
        PoNumber = await sequelize.query(
          `SELECT 
          (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Order') + CAST(ISNULL(MAX(utd) + 1, 1) AS VARCHAR) AS PoNumber
        FROM Purchase_Order;`
        );
      }

      result1 = await sequelize.query(
        `SELECT Misc_Code AS value, Misc_Name AS label 
         FROM misc_mst 
         WHERE misc_type = 39 
           AND export_type < 3`
      );
      ItemName = await sequelize.query(`
        select id as value, name as label,Group_Id from Assets_Group_Subcategory where common is null or common =0`);
      if (Location) {
        ItemName = await sequelize.query(`
        SELECT 
        id AS value, 
        name AS label, 
        Group_Id,
        (
            SELECT 
            SUM(CASE WHEN Tran_Type = 1 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)+
            SUM(CASE WHEN Tran_Type = 2 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 4 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
			      SUM(CASE WHEN Tran_Type = 5 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 9 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END)-
            SUM(CASE WHEN Tran_Type = 3 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 6 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 7 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 8 AND Source_Location in (${Location}) THEN Quantity ELSE 0 END) 
            
           FROM 
                Product_History
            WHERE 
                Product_History.SubCategory = Assets_Group_Subcategory.Id 
                AND Source_Location = '${Location}'
        ) AS Available_Quantity
    FROM 
        Assets_Group_Subcategory where common=1`);
      }
      if (UTD) {
        purchase_requestData = await sequelize.query(
          `select UTD,
              (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Inventory Issue') + CAST(purchase_request.UTD AS VARCHAR) AS Po,
          cast(Req_Date as date)as Req_Date,Contact_Number,Email,Address,City,State,Asset_Category,Location,LocationTo from purchase_request where utd=${UTD}`
        );
        const purchaseRequestDetails = await sequelize.query(
          `SELECT 
    UTD,
    Item,
    Item_Description,
    Quantity,
    Issue_Quantity,
    Unit_Price,
    Total_Price,
    Discount,
    Asset_Category,
    Location,

    ( 
        SELECT  
            SUM(CASE WHEN Tran_Type = 1 THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 2 THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 4 THEN Quantity ELSE 0 END) +
            SUM(CASE WHEN Tran_Type = 5 THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 3 THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 6 THEN Quantity ELSE 0 END) -
            SUM(CASE WHEN Tran_Type = 7 THEN Quantity ELSE 0 END)
        FROM Product_History PH
        WHERE PH.SubCategory = PRPD.Item
          AND PH.Source_Location = PRPD.Location
    ) AS Available_Quantity,
    (SELECT TOP 1 Asset_Type 
     FROM Assets_Group AG
     WHERE AG.id = PRPD.Asset_Category
    ) AS Asset_Type
FROM 
    Purchase_Req_Product_Details PRPD where PRPD.Purchase_Id=${UTD}`
        );
        purchase_request_Dtl_Data = purchaseRequestDetails[0];
        ItemName = await sequelize.query(`
          select id as value, name as label,Group_Id from Assets_Group_Subcategory where common=1`);
      }
    }
    const UOM = await sequelize.query(
      `SELECT CAST(Misc_Code AS VARCHAR) AS value, Misc_Name AS label FROM Misc_Mst WHERE Misc_Type = 72`
    );

    res.status(200).send({
      PoNumber:
        PoNumber && PoNumber.length > 0 && PoNumber[0].length > 0
          ? PoNumber[0][0].PoNumber
          : [],
      result1: result1 ? result1[0] : [],
      asset: assets ? assets[0] : [],
      VendorName: VendorName ? VendorName[0] : [],
      Item: ItemName ? ItemName[0] : [],
      purchase_requestData: purchase_requestData
        ? purchase_requestData[0][0]
        : [],
      purchase_request_Dtl_Data: purchase_request_Dtl_Data
        ? purchase_request_Dtl_Data
        : [],
      AssetSubcategory: AssetSubcategory ? AssetSubcategory[0] : [],
      branch: branch[0],
      Asset_Type: Asset_Type ? Asset_Type[0][0] : [],
      assetproductforpurchaseorder: assetproductforpurchaseorder
        ? assetproductforpurchaseorder[0]
        : [],
      UOM: UOM[0],
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred during updating." });
    console.log(err);
  }
};

exports.AMCReport = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Location = req.body.Location;
  try {
    const result = await sequelize.query(
      `select Name,Model ,Description,Amc_Vendor,Amc_Value,Start_Date,End_Date from Asset_Product
where End_Date between '${req.body.dateFrom}' and '${req.body.dateto}'`
    );
    res.status(200).send(result[0]);
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

exports.LimetedAssetReport = async function (req, res) {
  console.log(req.body, "request.body");
  try {
    const loc_code = req.body.loc_code;
    const sequelize = await dbname(req.headers.compcode);

    let query = `SELECT 
    (SELECT TOP 1 name FROM Asset_Product WHERE Asset_Product.utd = ph.asset_ID) AS Asset_Name,
    ph.asset_ID, ap.Manufacturer,ap.Model, ap.Description, ap.Serial_No, 
    (SELECT TOP 1 name
     FROM assets_group
     WHERE assets_group.id = (SELECT TOP 1 category FROM Asset_Product WHERE Asset_Product.utd = ph.asset_ID)) AS Category_Name,
    (SELECT TOP 1 category FROM Asset_Product WHERE Asset_Product.utd = ph.asset_ID) AS Category,
    (SELECT TOP 1 NAME 
     FROM Assets_Group_Subcategory 
     WHERE Assets_Group_Subcategory.Id = (SELECT TOP 1 SUBCATEGORY FROM Asset_Product WHERE Asset_Product.UTD = ph.asset_ID)) AS SubCategory_Name,
    (SELECT TOP 1 Subcategory FROM Asset_Product WHERE Asset_Product.utd = ph.asset_ID) AS SubCategory,
    (SELECT TOP 1 godw_name FROM GODOWN_MST WHERE Godw_Code = ph.Source_Location) AS Source_Location,
    (
        SELECT 
            SUM(CASE WHEN ph.Tran_Type = 1 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) +
            SUM(CASE WHEN ph.Tran_Type = 2 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) +
            SUM(CASE WHEN ph.Tran_Type = 4 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) +
            SUM(CASE WHEN ph.Tran_Type = 5 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) +
            SUM(CASE WHEN ph.Tran_Type = 9 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) -
            SUM(CASE WHEN ph.Tran_Type = 3 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) -
            SUM(CASE WHEN ph.Tran_Type = 6 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) -
            SUM(CASE WHEN ph.Tran_Type = 7 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) -
            SUM(CASE WHEN ph.Tran_Type = 8 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END)
        FROM 
            Product_History ph
        WHERE 
            ph.Asset_ID = ap.utd
            AND ph.Source_Location = '${loc_code}'
    ) AS Available,ap.min_qty, ap.Depreciation_Method
FROM 
    Asset_Product ap
INNER JOIN 
    Product_History ph ON ap.utd = ph.asset_ID
WHERE 
    ap.min_qty >= (
        SELECT 
            SUM(CASE WHEN ph.Tran_Type = 1 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) +
            SUM(CASE WHEN ph.Tran_Type = 2 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) +
            SUM(CASE WHEN ph.Tran_Type = 4 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) +
            SUM(CASE WHEN ph.Tran_Type = 5 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) +
            SUM(CASE WHEN ph.Tran_Type = 9 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) -
            SUM(CASE WHEN ph.Tran_Type = 3 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) -
            SUM(CASE WHEN ph.Tran_Type = 6 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) -
            SUM(CASE WHEN ph.Tran_Type = 7 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END) -
            SUM(CASE WHEN ph.Tran_Type = 8 AND ph.Source_Location = '${loc_code}' THEN ph.Quantity ELSE 0 END)
        FROM 
            Product_History ph
        WHERE 
            ph.Asset_ID = ap.utd
            AND ph.Source_Location = '${loc_code}'
    );`;

    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.AssetRequestPoNumber = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  try {
    const EmpCode = req.body.EmpCode;
    const result = await sequelize.query(
      `SELECT 
      (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Request') + CAST(ISNULL(MAX(tran_id) + 1, 1) AS VARCHAR) AS PrNumber
        FROM Asset_Request`
    );

    const EmpName = await sequelize.query(
      `SELECT concat(Empfirstname,' ',Emplastname)as EmpName from employeemaster where empcode='${EmpCode}'`
    );

    console.log(result[0][0], "result");
    console.log(EmpName[0][0], "EmpName");
    res.status(200).send({
      PrNumber: result[0][0].PrNumber,
      EmpName: EmpName[0][0].EmpName,
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

exports.AssetRequest = async function (req, res) {
  const {
    PrNumber,
    EmpName,
    Contact_Number,
    Designation,
    EmpLocation,
    ...other
  } = req.body.purchaseOrder;
  const { error: requestError, value: AssetRequestData } =
    AssetRequestSchema.validate(other);

  //_Asset_Request_Dtl,AssetRequestdtlSchema
  const { error: productError, value: AssetRequestDtlData } = Joi.array()
    .items(AssetRequestdtlSchema)
    .validate(req.body.PurchaseOrderProductDetails, {
      abortEarly: false,
      stripUnknown: true,
    });

  if (requestError || productError) {
    const errors = (requestError ? requestError.details : []).concat(
      productError ? productError.details : []
    );
    const errorMessage = errors.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }

  let t;
  try {
    const sequelize = await dbname(req.headers.compcode);
    t = await sequelize.transaction();
    // Create PurchaseOrder
    const AssetRequest = _Asset_Request(sequelize, Sequelize.DataTypes);
    const AssetRequest1 = await AssetRequest.create(AssetRequestData, {
      transaction: t,
      return: true,
    });

    const IsApproval = await sequelize.query(
      `select * from approval_matrix where empcode='${AssetRequest1.EmpCode}' and module_code='asset'`,
      {
        transaction: t,
      }
    );
    // Create PurchaseReqProductDetails associated with PurchaseRequest
    const AssetDetail = _Asset_Request_Dtl(sequelize, Sequelize.DataTypes);
    const createdAssetDetail = await Promise.all(
      AssetRequestDtlData.map((product) => {
        return AssetDetail.create(
          {
            ...product,
            Request_Id: AssetRequest1.tran_id, // Assuming UTD is the identifier for PurchaseRequest
            Created_By: AssetRequest1.Created_By, // Assuming UTD is the identifier for PurchaseRequest
            srm: AssetRequest1.EmpCode, // Assuming UTD is the identifier for PurchaseRequest
            Location: AssetRequest1.Location, // Assuming UTD is the identifier for PurchaseRequest
            Fin_Appr: IsApproval[0].length > 0 ? null : 1,
          },
          {
            transaction: t,
            returning: true,
          }
        );
      })
    );

    await t.commit();
    const PrNumber = await sequelize.query(
      `SELECT 
      (SELECT Prefix_Code FROM Prefix_Name WHERE Prefix_Name = 'Purchase Request') + CAST(ISNULL(MAX(tran_id) + 1, 1) AS VARCHAR) AS PrNumber
        FROM Asset_Request`
    );

    // Prepare response
    const response = {
      success: true,
      AssetRequest: AssetRequest1,
      AssetRequestDtl: createdAssetDetail,
      PrNumber: PrNumber[0][0].PrNumber,
    };

    res.status(200).json(response);
  } catch (err) {
    // if (t) await t.rollback(); // Rollback transaction if an error occurred
    console.error(err);
    res.status(500).json({ error: "Failed to create purchase request" });
  }
};

exports.PurchaseRequestView = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const datefrom = req.body.dateFrom;
  const dateto = req.body.dateto;
  const loc_code = req.body.loc_code;
  try {
    const result = await sequelize.query(`select tran_id, (SELECT Prefix_Code 
      FROM Prefix_Name 
      WHERE Prefix_Name = 'Purchase Request') + CAST(asset_request.tran_id AS VARCHAR) AS PrNumber,  (SELECT TOP 1 godw_name 
      FROM GODOWN_MST 
      WHERE Godw_Code = asset_request.location) AS Location, 
    (SELECT concat(Empfirstname,' ',Emplastname)as EmpName from employeemaster where empcode = asset_request.EmpCode) AS Request_Raiser, 
    (SELECT concat(Empfirstname,' ',Emplastname)as EmpName from employeemaster where empcode = asset_request.OnBehalfEmpCode) AS EmployeeName,
    CAST(Req_Date AS DATE) AS Req_Date, (SELECT SUM(Total_Price) from asset_request_dtl where asset_request_dtl.request_id = asset_request.tran_id)
    AS Total_Price, (select top 1 name from Assets_Group where Assets_Group.id = asset_request.asset_category) AS CategoryName, 
    (SELECT COUNT(tran_id) from asset_request_dtl where asset_request_dtl.request_id = asset_request.tran_id)
    AS Total_Items from asset_request WHERE 
      Req_Date between '${datefrom}' and '${dateto}' and Location in (${loc_code}) order by tran_id desc`);

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

exports.AssetRequestdtlView = async function (req, res) {
  try {
    const UTD = req.body.UTD;
    const Location = req.body.Location;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
    select tran_id as UTD,(select top 1 tran_id from asset_request where asset_request.tran_id = asset_request_dtl.request_id) as AssetRequestUTD,Product_Code, Subcategory, IsApproval, (SELECT TOP 1 name 
      FROM Assets_Group_Subcategory 
      WHERE id = SubCategory) As SubCategory,
      HSN,
  (select top 1 Misc_name from misc_mst where misc_code=uom1 and export_type<3 and misc_type=72)as Uom,
Item_Description,Quantity,Unit_Price,Discount,Total_Price,  (
        SELECT 
            
        SUM(CASE WHEN Tran_Type = 1 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 2 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 4 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END) +
          SUM(CASE WHEN Tran_Type = 5 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)+
          SUM(CASE WHEN Tran_Type = 9 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 3 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 6 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 7 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)-
          SUM(CASE WHEN Tran_Type = 8 AND Source_Location = '${Location}' THEN Quantity ELSE 0 END)
        FROM 
            Product_History
        WHERE 
            Product_History.SubCategory = Asset_request_dtl.subcategory 
            AND Source_Location   = '${Location}'
    ) AS Available, CASE WHEN IsApproval = '1' THEN 'Already Raised For Approval'
      WHEN IsApproval = '2' THEN 'Already Send For Issue' WHEN IsApproval = '3' THEN 'Send for special approval' ELSE null
      END AS status from Asset_request_dtl where Request_Id = ${UTD}
    `;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.IsApproval = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const UTD = req.body.UTD;
    const status = req.body.status;
    console.log(req.body, "req.bhtyntynody");
    let result;
    // if(status == '1'){
    //   result = await sequelize.query(
    //     `UPDATE Asset_Request_Dtl SET ISAPPROVAL = '1' WHERE tran_id in (${UTD}) and ISApproval is null`
    //   );
    // }
    if (status == "2") {
      result = await sequelize.query(
        `UPDATE Asset_Request_Dtl SET ISAPPROVAL = '2' WHERE tran_id in (${UTD}) and ISApproval is null`
      );
    }

    res.status(200).send(result);
  } catch (e) {
    console.log(e);
  }
};

exports.VirePurchaseRequestForApproval = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
    SELECT * 
    FROM (
        SELECT
            IIF(
                (SELECT TOP 1 empcode 
                 FROM Approval_Matrix 
                 WHERE '${Appr_Code}' IN (approver1_A, approver1_B) 
                 AND module_code = 'asset' 
                 AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT
                ) IS NOT NULL, 
                Appr_1_Stat, 
                IIF(
                    (SELECT TOP 1 empcode 
                     FROM Approval_Matrix 
                     WHERE '${Appr_Code}' IN (approver2_A, approver2_B) 
                     AND module_code = 'asset' 
                     AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT
                    ) IS NOT NULL, 
                    Appr_2_Stat, 
                    IIF(
                        (SELECT TOP 1 empcode 
                         FROM Approval_Matrix 
                         WHERE '${Appr_Code}' IN (approver3_A, approver3_B) 
                         AND module_code = 'asset' 
                         AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT
                        ) IS NOT NULL, 
                        Appr_3_Stat, 
                        NULL
                    )
                )
            ) AS status_khud_ka,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME) 
             FROM employeemaster 
             WHERE empcode = srm
            ) AS srm_name,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME)  
             FROM employeemaster
             WHERE empcode = (
                 SELECT IIF(Appr_1_Code IS NOT NULL, Appr_1_Code,
                     (SELECT IIF(Approver1_A = '${Appr_Code}', Approver1_A, 
                         IIF(Approver1_B = '${Appr_Code}', Approver1_B, Approver1_A))
                      FROM Approval_Matrix 
                      WHERE module_code = 'asset' 
                      AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT)
                 )
             ) AND Export_Type < 3) AS apr1_name,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME)  
             FROM employeemaster
             WHERE empcode = (
                 SELECT IIF(Appr_2_Code IS NOT NULL, Appr_2_Code,
                     (SELECT IIF(Approver2_A = '${Appr_Code}', Approver2_A, 
                         IIF(Approver2_B = '${Appr_Code}', Approver2_B, Approver2_A))
                      FROM Approval_Matrix 
                      WHERE module_code = 'asset' 
                      AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT)
                 )
             ) AND Export_Type < 3) AS apr2_name,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME)  
             FROM employeemaster
             WHERE empcode = (
                 SELECT IIF(Appr_3_Code IS NOT NULL, Appr_3_Code,
                     (SELECT IIF(Approver3_A = '${Appr_Code}', Approver3_A, 
                         IIF(Approver3_B = '${Appr_Code}', Approver3_B, Approver3_A))
                      FROM Approval_Matrix 
                      WHERE module_code = 'asset' 
                      AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT)
                 )
             ) AND Export_Type < 3) AS apr3_name,
            IIF(fin_appr IS NULL, 
                IIF((SELECT TOP 1 empcode 
                     FROM Approval_Matrix  
                     WHERE '${Appr_Code}' IN (approver1_A, approver1_B) 
                     AND module_code = 'asset' 
                     AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT) IS NOT NULL,
                     Appr_1_Stat,
                    IIF((SELECT TOP 1 1 AS result 
                         FROM Approval_Matrix 
                         WHERE '${Appr_Code}' IN (approver2_A, approver2_B) 
                         AND module_code = 'asset' 
                         AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT) IS NOT NULL,
                        IIF(Appr_1_Stat IS NULL, 1, Appr_2_Stat),
                        IIF((SELECT TOP 1 1 AS result 
                             FROM Approval_Matrix 
                             WHERE '${Appr_Code}' IN (approver3_A, approver3_B) 
                             AND module_code = 'asset' 
                             AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT) IS NOT NULL,
                        IIF(Appr_2_Stat IS NULL, 1, Appr_3_Stat), 1))), 1) AS status_appr,
            Asset_Request_dtl.tran_id, 
			CAST(Req_Date AS date) AS Req_Date,
            (SELECT Prefix_Code 
             FROM Prefix_Name 
             WHERE Prefix_Name = 'Purchase Request') + CAST(Asset_Request.tran_id AS VARCHAR) AS PrNumber,
            (SELECT TOP 1 godw_name 
             FROM GODOWN_MST 
             WHERE Godw_Code = Asset_Request_Dtl.Location) AS branch_name,
            (SELECT TOP 1 name 
             FROM Assets_Group 
             WHERE id = Asset_Request.Asset_Category) AS Asset_Name,
			  (SELECT TOP 1 name 
             FROM Assets_Group_Subcategory
             WHERE id = Asset_Request_Dtl.Subcategory) AS SubcategoryName,
          Item_Description, Quantity, Unit_Price, Total_price,
            (SELECT TOP 1 CONCAT(EMPLOYEEMASTER.empfirstname, ' ', EMPLOYEEMASTER.emplastname) 
             FROM EMPLOYEEMASTER 
             WHERE EMPLOYEEMASTER.empcode = Asset_Request.EmpCode) AS EmployeeName,
            (SELECT TOP 1 CONCAT(EMPLOYEEMASTER.empfirstname, ' ', EMPLOYEEMASTER.emplastname) 
             FROM EMPLOYEEMASTER 
             WHERE EMPLOYEEMASTER.empcode = Asset_Request.OnBehalfEmpCode) AS RequestedBy, 
            Asset_Category,
            Asset_Request_Dtl.Location,
            Appr_1_Rem,
            Appr_2_Rem,
            Appr_3_Rem,
            Fin_Appr,
            srm,
            srm AS emp_code
        FROM Asset_Request_dtl
        INNER JOIN Asset_Request 
            ON Asset_Request_Dtl.request_id = Asset_Request.tran_id
        WHERE 
    CAST(Req_Date AS date) BETWEEN '${dateFrom}' AND '${dateto}' AND
    Asset_Request_Dtl.Location IN (${loc_code})
    AND Asset_Request_Dtl.IsApproval=1
    AND srm IN (
        SELECT empcode 
        FROM approval_matrix 
        WHERE '${Appr_Code}' IN (approver1_A, approver1_B, approver2_A, approver2_B, approver3_A, approver3_B)
        )
    ) AS dasd `;

    if (req.body.status == 2) {
      query += `where  (status_khud_ka is null and status_appr is null) order by tran_id desc`;
    } else {
      query += `where  status_khud_ka =${req.body.status}  order by tran_id desc`;
    }
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

const processMainDataforAssetRequest = async (
  mainData,
  sequelize,
  Appr_Code,
  Remark
) => {
  const t = await sequelize.transaction();
  const backgroundTasks = [];
  try {
    // Pre-fetch necessary static data
    const comp_name_result = await sequelize.query(
      `SELECT TOP 1 comp_name FROM comp_mst`
    );
    const comp_name = comp_name_result[0][0]?.comp_name;

    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      console.log(c, "c");
      const UTD = c?.tran_id;

      const a = await sequelize.query(
        `SELECT TOP 1 * FROM Approval_Matrix WHERE empcode = :empcode AND module_code = 'asset'`,
        { replacements: { empcode }, transaction: t }
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
          throw new Error("You are not the right person to approve this");
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

        let query = "";
        let query2 = null;

        if (ApprovalLevel === 1) {
          query = `
            UPDATE Asset_Request_dtl
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 1,
                Appr_1_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE tran_id = :UTD AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE Asset_Request_dtl
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 1,
                Appr_2_Rem = :Remark,
                Fin_Appr = :Final_apprvl
            WHERE tran_id = :UTD AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE Asset_Request_dtl
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 1,
                Appr_3_Rem = :Remark,
                Fin_Appr = 1
            WHERE tran_id = :UTD AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL
          `;
        }

        // Execute the update queries
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Asset_Request_dtl WHERE tran_id = :UTD`,
          { replacements: { UTD }, transaction: t }
        );

        if (affectedRows.length > 0) {
          if (query2) {
            await sequelize.query(query2, {
              replacements: { ...data, UTD },
              transaction: t,
            });
          }
          await sequelize.query(query, {
            replacements: { ...data, UTD },
            transaction: t,
          });
        }
        // // Prepare message sending tasks for background execution
        // if (ApprovalLevel === 1) {
        //   const result = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   backgroundTasks.push(() => SendWhatsAppMessgae(result[0][0]?.mobile_no, 'approver_1_approve_message', [
        //     { "type": "text", "text": item?.rowData.SRM_Name },
        //     { "type": "text", "text": item?.rowData?.Cust_Name },
        //     { "type": "text", "text": item?.rowData?.Mob },
        //     { "type": "text", "text": item?.rowData?.modl_name },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //     { "type": "text", "text": item?.rowData?.Dise_Amt ? item?.rowData?.Dise_Amt : '(Not Given)' },
        //     { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //     { "type": "text", "text": item?.rowData?.apr1_name },
        //     { "type": "text", "text": comp_name }
        //   ]));

        //   if (!Final_apprvl) {
        //     const approver2 = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode=(SELECT TOP 1 approver2_A FROM approval_matrix WHERE empcode='${item?.rowData.SRM}' AND module_code='discount')`);
        //     const outlet_name = await sequelize.query(`SELECT TOP 1 br_extranet FROM godown_mst WHERE godw_code='${item?.rowData.location}' AND export_type<3`);
        //     if (approver2[0]?.length && approver2[0][0].mobile_no) {
        //       backgroundTasks.push(() => SendWhatsAppMessgae(approver2[0][0].mobile_no, 'disc_appr_msg_l2_new', [
        //         { "type": "text", "text": outlet_name[0][0].br_extranet },
        //         { "type": "text", "text": `${item.rowData.Modl_Group_Name} , ${item.rowData.modl_name} , ${item.rowData.Veh_Clr_Name}` },
        //         { "type": "text", "text": item?.rowData?.Cust_Name },
        //         { "type": "text", "text": item?.rowData?.Dise_Amt },
        //         { "type": "text", "text": item?.rowData?.RM_Name },
        //         { "type": "text", "text": item?.rowData?.book_date },
        //         { "type": "text", "text": comp_name }
        //       ]));
        //     }
        //   }
        // } else if (ApprovalLevel === 2) {
        //   const mobile_emp = await sequelize.query(`SELECT TOP 1 mobile_no FROM employeemaster WHERE empcode='${item?.rowData.SRM}'`);
        //   if (mobile_emp[0]?.length && mobile_emp[0][0]?.mobile_no) {
        //     backgroundTasks.push(() => SendWhatsAppMessgae(mobile_emp[0][0].mobile_no, 'approver_reject_message', [
        //       { "type": "text", "text": item?.rowData?.SRM_Name },
        //       { "type": "text", "text": item?.rowData?.Cust_Name },
        //       { "type": "text", "text": item?.rowData?.Mob },
        //       { "type": "text", "text": item?.rowData?.modl_name },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": item?.rowData?.Approved_amt ? item?.rowData?.Approved_amt : item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": item?.rowData?.Dise_Amt },
        //       { "type": "text", "text": Remark ? Remark : '(Not Given)' },
        //       { "type": "text", "text": item?.rowData?.apr2_name },
        //       { "type": "text", "text": comp_name }
        //     ]));
        //   }
        // }
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
    // Respond to the caller immediately
    return {
      success: true,
      message: "Main data processing initiated",
    };
  } catch (e) {
    console.error(e);
    await t.rollback();
    throw e;
  }
  // finally {
  //   setTimeout(async () => {
  //     try {
  //       for (const task of backgroundTasks) {
  //         await task();
  //         await delay(2000);
  //         // Execute each function in backgroundTasks
  //       }
  //     } catch (err) {
  //       console.error('Error executing background tasks:', err);
  //     }
  //   }, 1000);

  // }
};

exports.approveby2forAseetRequest = async function (req, res) {
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
        Message: "Please select the entry to approve",
      });
    }

    await processMainDataforAssetRequest(
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

exports.rejectby2forAseetRequest = async function (req, res) {
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

    await processMainData1forAssetRequest(
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

async function processMainData1forAssetRequest(
  mainData,
  sequelize,
  Appr_Code,
  Remark
) {
  const t = await sequelize.transaction();
  try {
    for (const item of mainData) {
      const c = item?.rowData;
      const empcode = c?.emp_code;
      const UTD = c?.tran_id;

      const a = await sequelize.query(
        `SELECT top 1 * from Approval_Matrix where empcode = :empcode and module_code = 'asset'`,
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
          throw new Error("You are not the right person to reject this");
        }

        const data = {
          Appr_Code,
          Remark,
        };

        let query = "";
        if (ApprovalLevel === 1) {
          query = `
            UPDATE Asset_Request_Dtl
            SET Appr_1_Code = :Appr_Code,
                Appr_1_Stat = 0,
                Appr_1_Rem = :Remark,
                Fin_Appr = 0
            WHERE tran_id = :UTD AND Appr_1_Stat IS NULL AND Fin_Appr IS NULL;
          `;
        } else if (ApprovalLevel === 2) {
          query = `
            UPDATE Asset_Request_Dtl
            SET Appr_2_Code = :Appr_Code,
                Appr_2_Stat = 0,
                Appr_2_Rem = :Remark,
                Fin_Appr = 0
            WHERE tran_id = :UTD AND Appr_2_Stat IS NULL AND Appr_1_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        } else if (ApprovalLevel === 3) {
          query = `
            UPDATE Asset_Request_Dtl
            SET Appr_3_Code = :Appr_Code,
                Appr_3_Stat = 0,
                Appr_3_Rem = :Remark,
                Fin_Appr = 0
            WHERE tran_id = :UTD AND Appr_3_Stat IS NULL AND Appr_2_Stat IS NOT NULL AND Fin_Appr IS NULL;
          `;
        }
        const [affectedRows] = await sequelize.query(
          `SELECT * FROM Asset_Request_Dtl WHERE tran_id = :UTD;`,
          { replacements: { UTD }, transaction: t }
        );

        if (affectedRows.length > 0) {
          await sequelize.query(query, {
            replacements: { ...data, UTD },
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

exports.filldirectissueforAssetRequest = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Assets = req.body.Assets;
  const AssetRequestUTD = req.body.AssetRequestUTD;
  const Location = req.body.Location;

  try {
    const assetsArray = Assets.split(",").map((asset) =>
      parseInt(asset.trim())
    );

    // Array to store all query results
    const allResults = [];

    // Loop through each asset in the array
    for (const item of assetsArray) {
      // First query for SubCategory and Category
      const query = await sequelize.query(
        `
        select SubCategory,
        (Select top 1 id from Assets_Group where Assets_Group.id =
        (select top 1 asset_category from Asset_Request where Asset_Request.tran_id = Asset_Request_Dtl.Request_Id)) as Category,
              (
                SELECT
                  SUM(CASE WHEN Tran_Type = 1 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) + 
                  SUM(CASE WHEN Tran_Type = 2 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
                  SUM(CASE WHEN Tran_Type = 4 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +          
                  SUM(CASE WHEN Tran_Type = 5 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) +
                  SUM(CASE WHEN Tran_Type = 9 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
                  SUM(CASE WHEN Tran_Type = 3 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
                  SUM(CASE WHEN Tran_Type = 6 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) - 
                  SUM(CASE WHEN Tran_Type = 7 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) -
                  SUM(CASE WHEN Tran_Type = 8 AND Source_Location IN (:location) THEN Quantity ELSE 0 END) 
                FROM Product_History
                WHERE Product_History.SubCategory = Asset_Request_Dtl.Subcategory
                AND Source_Location IN (:location)
              ) AS Available, Item_Description AS Description,
              1 as Issue_Quantity
              from Asset_Request_Dtl 
              where tran_id = :item
      `,
        {
          replacements: { location: Location, item: item },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      allResults.push(query[0]);
    }

    const Result = await sequelize.query(
      `select OnBehalfEmpCode from Asset_Request where tran_id = '${AssetRequestUTD}'`
    );

    console.log(allResults, "allResults");
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: allResults,
      UTD: Result[0][0],
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

exports.PurchaseRequestToOrderView = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const sequelize = await dbname(req.headers.compcode);
    let query = `select * from (select ard.tran_id, 
    CAST(Req_Date AS date) AS Req_Date,
          (SELECT Prefix_Code 
           FROM Prefix_Name 
           WHERE Prefix_Name = 'Purchase Request') + CAST(ar.tran_id AS VARCHAR) AS PrNumber,
          (SELECT TOP 1 godw_name 
           FROM GODOWN_MST 
           WHERE Godw_Code = ard.Location) AS branch_name,
          (SELECT TOP 1 name 
           FROM Assets_Group 
           WHERE id = ar.Asset_Category) AS Asset_Name,
      (SELECT TOP 1 name 
           FROM Assets_Group_Subcategory
           WHERE id = ard.Subcategory) AS SubcategoryName,
        ard.Item_Description,ard.Quantity AS RequestedQty,
    popd.Quantity AS OrderedQty,
    CAST(COALESCE(TRY_CAST(ard.Quantity AS FLOAT), 0) AS FLOAT) - CAST(COALESCE(TRY_CAST(popd.Quantity AS FLOAT), 0) AS FLOAT) AS Quantity,
    ard.Unit_Price,
    (CAST(COALESCE(TRY_CAST(ard.Quantity AS FLOAT), 0) AS FLOAT) - CAST(COALESCE(TRY_CAST(popd.Quantity AS FLOAT), 0) AS FLOAT)) * COALESCE(TRY_CAST(ard.Unit_Price AS FLOAT), 0) AS Total_price,
          (SELECT TOP 1 CONCAT(EMPLOYEEMASTER.empfirstname, ' ', EMPLOYEEMASTER.emplastname) 
           FROM EMPLOYEEMASTER 
           WHERE EMPLOYEEMASTER.empcode = ar.EmpCode) AS RequestedBy, 
          ard.Location
      FROM Asset_Request_Dtl ard
      INNER JOIN Asset_Request ar
          ON ard.request_id = ar.tran_id 
      LEFT JOIN Purchase_Order_Product_Details popd
	      on ard.tran_id = popd.purchaseRequest_UTD
      WHERE 
 CAST(Req_Date AS date) BETWEEN '${dateFrom}' AND '${dateto}'
  AND ard.Location IN (${loc_code}) and
   ard.fin_appr = '1') AS ab 
   WHERE Quantity > 0 
   ORDER BY tran_id DESC`

    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};


exports.FillTabledataforAssetRequest = async function (req, res) {
  console.log(req.body, "sn");
  try {
    const sequelize = await dbname(req.headers.compcode);
    const EmpCode = req.body.EmpCode;

    const res1 = await sequelize.query(
      `select mobile_no,CORPORATEMAILID,EMPLOYEEDESIGNATION,(select top 1 Misc_name from Misc_Mst where misc_code=LOCATION and Misc_Type=85 and Export_Type<3)as EMPLOCATION 
from EMPLOYEEMASTER where empcode = '${EmpCode}'`
    );

    const DocumentNo =
      await sequelize.query(`SELECT CAST(ISNULL(MAX(tran_id) + 1, 1) AS VARCHAR) AS DocumentNo
    FROM Product_Issue;`);

    console.log(DocumentNo, "DocumentNo");
    res.status(200).send({
      res1: res1[0][0],
      DocumentNo: DocumentNo[0][0].DocumentNo,
    });
  } catch (err) {
    console.log(err);
  }
};

exports.FillDataforAssetRequestInPO = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const Assets = req.body.Assets;
  const Location = req.body.Location;

  try {
    const assetsArray = Assets.split(",").map((asset) =>
      parseInt(asset.trim())
    );

    // Array to store all query results
    const allResults = [];

    const result = await sequelize.query(
      `select top 1 Asset_Category  from asset_request where tran_id = (select top 1 request_id from Asset_Request_Dtl where tran_id in (${assetsArray}))`
    );

    // Loop through each asset in the array
    for (const item of assetsArray) {
      // First query for SubCategory and Category
      const query = await sequelize.query(
        `
        select Subcategory,
        (Select top 1 id from Assets_Group where Assets_Group.id =
        (select top 1 asset_category from Asset_Request where Asset_Request.tran_id = Asset_Request_Dtl.Request_Id)) as Category,
             Item_Description, ITEM_TYPE, HSN, UOM1, Quantity, Unit_Price, Total_Price,tran_id as PurchaseRequest_UTD
              from Asset_Request_Dtl 
              where tran_id = :item
      `,
        {
          replacements: { location: Location, item: item },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      allResults.push(query[0]);
    }

    console.log(allResults, "allResults");
    res.status(200).send({
      Status: true,
      Message: "Success",
      Query: "",
      Result: allResults,
      Category: result[0][0],
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

exports.IsQuotation = async function (req, res) {
  try {
    const sequelize = await dbname(req.headers.compcode);
    const UTD = req.body.UTD;
    const selectedRow = req.body.selectedRow;
    const Quotation1 = selectedRow.Quotation1
      ? `'${selectedRow.Quotation1}'`
      : null;
    const Quotation2 = selectedRow.Quotation2
      ? `'${selectedRow.Quotation2}'`
      : null;
    const Quotation3 = selectedRow.Quotation3
      ? `'${selectedRow.Quotation3}'`
      : null;
    console.log(
      Quotation1,
      Quotation2,
      Quotation3,
      "Quotation3Quotation3Quotation3"
    );
    console.log(req.body, "req.bhtyntynody");

    const result =
      await sequelize.query(`UPDATE Asset_Request_Dtl set Quotation1 = ${Quotation1}, 
    Quotation2 = ${Quotation2}, Quotation3 = ${Quotation3}, ISAPPROVAL = '1' WHERE tran_id in (${UTD}) and ISApproval is null`);

    res.status(200).send(result);
  } catch (e) {
    console.log(e);
  }
};


//_AssetMonthWisePurchase, AssetMonthWisePurchaseSchema
exports.AddPurchaseMonth = async function (req, res) {
  console.log(req.body, "komalnuwal");

  const { SubcategoryId, purchaseData } = req.body;
  const { error } = AssetMonthWisePurchaseSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((err) => err.message).join(", ");
    return res.status(400).send({ success: false, message: errorMessage });
  }

  try {
    const sequelize = await dbname(req.headers.compcode);
    const AssetMonthWisePurchase = _AssetMonthWisePurchase(sequelize, DataTypes);

    // Start a transaction
    const t = await sequelize.transaction();

    try {
      const purchasePromises = purchaseData.map(async (data) => {
        // Check if record already exists
        const existingRecord = await AssetMonthWisePurchase.findOne({
          where: {
            SubcategoryId: SubcategoryId,
            Month: data.Month,
          },
          transaction: t,
        });

        if (existingRecord) {
          // Update existing record
          return existingRecord.update(
            { Purchase_Value: data.Purchase_Value },
            { transaction: t }
          );
        } else {
          // Create new record
          return AssetMonthWisePurchase.create(
            {
              SubcategoryId: SubcategoryId,
              Month: data.Month,
              Purchase_Value: data.Purchase_Value,
            },
            { transaction: t }
          );
        }
      });

      await Promise.all(purchasePromises);
      await t.commit();

      res.status(200).send({
        success: true,
        message: "Data successfully added or updated.",
      });
    } catch (err) {
      await t.rollback();
      console.error("Error during transaction:", err);
      res.status(500).json({ error: "An error occurred during saving." });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred during initialization." });
  }
};


exports.ViewPurchaseMonth = async function (req, res) {
  console.log(req.body,'komalnuwa;l')
  try {
    const subId = req.body.subId;
    const sequelize = await dbname(req.headers.compcode);
    let query = `SELECT * FROM Asset_MonthWise_PurchaseValue WHERE SubcategoryId = '${subId}'`;
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};


exports.importformatmini = async function (req, res) {
  const sequelize = await dbname(req.query.compcode);
  try {
    let reportName = "Asset Excel Import";
    const Headeres = [
      "Asset Name",
      "Asset Code",
      "Asset Category",
      "Asset SubCategory",
      "Branch",
      "Asset Description",
      "Asset Serial No.",
      "Opening Date",
      "Opening Quantity",
      "Manufacturer",
      "Model",
      "Asset Characteristic",
      "Depreciation Method",
      "Purchase Date",
      "Purchase Value",
      "HSN",
      "Notes",
      "Useful life",
      // "Item Type",
      // "UOM",
      "AMC Start Date",
      "AMC End Date",
      "AMC Value",
      "AMC Vendor",
      "Minimum Qty",
      "Unit Rate",
      "MRP",
      "Price",
      "Residual Value",
    ];

    const Company_Name = await sequelize.query(
      `select top 1 comp_name from Comp_Mst`
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    const headerRow = worksheet.addRow(Headeres);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white font color
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF006400" }, // dark green background color
      };
    });

    worksheet.addRow();
    worksheet.addRow();
    worksheet.columns.forEach((column) => {
      let maxWidth = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnWidth = cell.value ? cell.value.toString().length : 10; // Minimum width 10
        maxWidth = Math.max(maxWidth, columnWidth);
      });
      column.width = maxWidth < 30 ? maxWidth : 30; // Set maximum width to 30
    });
    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Asset_Import_Template.xlsx"'
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
    console.log(e);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet1");

    res
      .status(200)
      .setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Asset_Import_Tamplate.xlsx"'
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
  } finally {
    // Close the Sequelize connection
    if (sequelize) {
      await sequelize.close();
    }
  }
};

exports.excelimportmini = async function (req, res) {
  const sequelize = await dbname(req.headers.compcode);
  const t = await sequelize.transaction();
  console.log(req.body, "komalnuwlaa");

  try {
    const AssetProduct = _Asset_Product(sequelize, DataTypes);
    const AssetsGroup = _AssetGroup(sequelize, DataTypes); // Assuming `assets_group` table
    const AssetsGroupSubcategory = _AssetGroupSubcategory(sequelize, DataTypes); // Assuming `assets_group_subcategory` table

    const excelFile = req.files["excel"][0]; // Access the uploaded Excel file
    if (!excelFile) {
      await sequelize.close();
      return res.status(400).send({ Message: "No file uploaded" });
    }

    const user = req.body.user;

    const workbook = xlsx.read(excelFile.buffer, {
      type: "buffer",
      cellDates: true,
    });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const transformedData = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    if (!transformedData.length) {
      await sequelize.close();
      return res
        .status(400)
        .send({ Message: "No data found in Excel or invalid format" });
    }

    // Define column mappings for the tables
    const renameKeys = (obj) => {
      const keyMap = {
        "Asset Name": "Name",
        "Asset Code": "AssetCode",
        "Asset Category": "Category",
        "Asset SubCategory": "Subcategory",
        Branch: "Location",
        "Asset Description": "Description",
        "Asset Serial No.": "Serial_No",
        "Opening Date": "Due_Date",
        "Opening Quantity": "Qty",
        Manufacturer: "Manufacturer",
        Model: "Model",
        "Asset Characteristic": "Characteristics",
        "Depreciation Method": "Depreciation_Method",
        "Purchase Date": "Purchase_Date",
        "Purchase Value": "Purchase_value",
        HSN: "Asset_Nature",
        Notes: "Notes",
        "Useful life": "Life_Span",
        "AMC Start Date": "Start_Date",
        "AMC End Date": "End_Date",
        "AMC Value": "Amc_Value",
        "AMC Vendor": "Amc_Vendor",
        "Minimum Qty": "Min_Qty",
        "Unit Rate": "Unit_Rate",
        MRP: "MRP",
        Price: "Price",
        "Residual Value": "residualValue",
      };

      return Object.keys(obj).reduce((acc, key) => {
        const newKey = keyMap[key] || key; // Use the new key if found, otherwise keep the original key
        // Treat Engine_No and Chassis_No as strings
        if (
          newKey === "Due_Date" ||
          newKey === "Purchase_Date" ||
          newKey === "Start_Date" ||
          newKey === "End_Date"
        ) {
          if (obj[key]) {
            acc[newKey] = adjustToIST(obj[key]);
            // Convert Policy_Due to YYYY-MM-DD format
          } else {
            acc[newKey] = null; // Handle empty string or null value
          }
        } else {
          // Convert empty string values to null
          acc[newKey] = obj[key] === "" ? null : String(obj[key]);
        }
        return acc;
      }, {});
    };

    // Transform the data
    const data = transformedData.map(renameKeys);

    function adjustToIST(dateStr) {
      try {
        const date = new Date(dateStr+1);
        date.setHours(date.getHours() + 5);
        date.setMinutes(date.getMinutes() + 31);
        const ISTDateStr = date.toISOString();
        return ISTDateStr.slice(0, 10);
      } catch (err) {
        return parseDate(dateStr);
      }
    }

    function parseDate(dateStr) {
      const [day, month, year] = dateStr.split("/");
      const date = new Date(`${year}-${month}-${day}`);
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10); // Convert to YYYY-MM-DD format
      }
      return null; // Handle invalid date
    }

    for (const obj of data) {
      const categoryRecord = await AssetsGroup.findOne({
        where: { Name: obj.Category },
        attributes: ["Id"],
      });
      console.log(categoryRecord, "categoryRecord");

      if (categoryRecord) {
        obj.Category = categoryRecord.Id; // Replace Category name with ID
      } else {
        obj.Category = null; // Handle missing ID
      }

      // Fetch Subcategory ID from assets_group_subcategory table
      const subcategoryRecord = await AssetsGroupSubcategory.findOne({
        where: { Name: obj.Subcategory },
        attributes: ["Id", "icon"],
      });

      console.log(subcategoryRecord, "categoryRecord");
      if (subcategoryRecord) {
        obj.Subcategory = subcategoryRecord.Id;
        obj.icon = subcategoryRecord.icon;
      } else {
        obj.Subcategory = null; // Handle missing ID
      }
    }
    console.log(data, "data");

    const empCodesdata = data.map((obj) => obj.Name);
    const empcode = await sequelize.query(
      `SELECT DISTINCT Name FROM Asset_Product WHERE Name IN (:empCodesdata)`,
      {
        replacements: { empCodesdata },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    const ErroredData = [];
    const CorrectData = [];

    data.forEach((obj) => {
      let oldObj = { ...obj };
      const rejectionReasons = [];

      if (
        empcode.some((item) => item.Name?.toString() === obj.Name?.toString())
      ) {
        rejectionReasons.push(`Duplicate Asset Name ${obj.Name}`, " | ");
      }

      if (rejectionReasons.length > 0) {
        ErroredData.push({
          ...oldObj,
          rejectionReasons: rejectionReasons.join(""),
        });
      } else {
        obj.Created_By = user;
        CorrectData.push(obj);
      }
    });

    const AssetProductData = CorrectData.map((obj) => ({
      Name: obj.Name,
      AssetCode: obj.AssetCode,
      Category: obj.Category,
      Subcategory: obj.Subcategory,
      Location: obj.Location,
      Description: obj.Description,
      Serial_No: obj.Serial_No,
      Due_Date: obj.Due_Date,
      Qty: obj.Qty,
      Manufacturer: obj.Manufacturer,
      Model: obj.Model,
      Characteristics: obj.Characteristics,
      Depreciation_Method: obj.Depreciation_Method,
      Purchase_Date: obj.Purchase_Date,
      Purchase_value: obj.Purchase_value,
      Asset_Nature: obj.Asset_Nature,
      Notes: obj.Notes,
      Life_Span: obj.Life_Span,
      Start_Date: obj.Start_Date,
      End_Date: obj.End_Date,
      Amc_Value: obj.Amc_Value,
      Amc_Vendor: obj.Amc_Vendor,
      Min_Qty: obj.Min_Qty,
      Unit_Rate: obj.Unit_Rate,
      MRP: obj.MRP,
      Price: obj.Price,
      Icon: obj.icon,
      residualValue: obj.residualValue,
      Created_By: obj.Created_By,
    }));

    console.log(AssetProductData, "AssetProductData");
    // Insert data into tables
    const InsuData1 = await AssetProduct.bulkCreate(AssetProductData, {
      transaction: t,
    });

    console.log(InsuData1, "InsuData1");

    const Product_History = _Product_Histroy(sequelize, Sequelize.DataTypes);

    for (const item of InsuData1) {
      await Product_History.create(
        {
          Asset_ID: item.dataValues.UTD, // Ensure you access the correct field
          Tran_Type: 1,
          Quantity: item.dataValues.Qty,
          Category: item.dataValues.Category,
          SubCategory: item.dataValues.Subcategory,
          Created_By: item.dataValues.Created_By,
          Source_Location: item.dataValues.Location,
          Tran_Date: item.dataValues.Due_Date
            ? item.dataValues.Due_Date
            : new Date(),
        },
        { transaction: t } // Include the transaction for consistency
      );
    }

    await t.commit();
    await sequelize.close();

    res.status(200).send({
      ErroredData: ErroredData,
      CorrectData: CorrectData,
      Message: `${CorrectData.length} Records Inserted`,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error during import:", error);
    res
      .status(500)
      .send({
        Message: "An error occurred during file import",
        Error: error.message,
      });
  }
};

exports.ViewPurchaseRequestForSpecialApproval = async function (req, res) {
  try {
    const dateFrom = req.body.dateFrom;
    const dateto = req.body.dateto;
    const loc_code = req.body.loc_code;
    const Appr_Code = req.body.Appr_Code;
    const sequelize = await dbname(req.headers.compcode);
    let query = `
    SELECT *
    FROM (
        SELECT
            IIF(
                (SELECT TOP 1 empcode
                 FROM Approval_Matrix
                 WHERE '${Appr_Code}'  IN (approver1_A, approver1_B)
                 AND module_code = 'SpecialAprAsset'
                 AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT
                ) IS NOT NULL,
                Appr_1_Stat,
                IIF(
                    (SELECT TOP 1 empcode
                     FROM Approval_Matrix
                     WHERE '${Appr_Code}'  IN (approver2_A, approver2_B)      
                     AND module_code = 'SpecialAprAsset'
                     AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT
                    ) IS NOT NULL,
                    Appr_2_Stat,
                    IIF(
                        (SELECT TOP 1 empcode
                         FROM Approval_Matrix
                         WHERE '${Appr_Code}'  IN (approver3_A, approver3_B)  
                         AND module_code = 'SpecialAprAsset'
                         AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT
                        ) IS NOT NULL,
                        Appr_3_Stat,
                        NULL
                    )
                )
            ) AS status_khud_ka,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME)       
             FROM employeemaster
             WHERE empcode = srm
            ) AS srm_name,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME)       
             FROM employeemaster
             WHERE empcode = (
                 SELECT IIF(Appr_1_Code IS NOT NULL, Appr_1_Code,      
                     (SELECT IIF(Approver1_A = '${Appr_Code}' , Approver1_A,  
                         IIF(Approver1_B = '${Appr_Code}' , Approver1_B, Approver1_A))
                      FROM Approval_Matrix
                      WHERE module_code = 'SpecialAprAsset'
                      AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT)
                 )
             ) AND Export_Type < 3) AS apr1_name,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME)       
             FROM employeemaster
             WHERE empcode = (
                 SELECT IIF(Appr_2_Code IS NOT NULL, Appr_2_Code,      
                     (SELECT IIF(Approver2_A = '${Appr_Code}' , Approver2_A,  
                         IIF(Approver2_B = '${Appr_Code}' , Approver2_B, Approver2_A))
                      FROM Approval_Matrix
                      WHERE module_code = 'SpecialAprAsset'
                      AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT)
                 )
             ) AND Export_Type < 3) AS apr2_name,
            (SELECT TOP 1 CONCAT(EMPFIRSTNAME, ' ', EMPLASTNAME)       
             FROM employeemaster
             WHERE empcode = (
                 SELECT IIF(Appr_3_Code IS NOT NULL, Appr_3_Code,      
                     (SELECT IIF(Approver3_A = '${Appr_Code}' , Approver3_A,  
                         IIF(Approver3_B = '${Appr_Code}' , Approver3_B, Approver3_A))
                      FROM Approval_Matrix
                      WHERE module_code = 'SpecialAprAsset'
                      AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT)
                 )
             ) AND Export_Type < 3) AS apr3_name,
            IIF(fin_appr IS NULL,
                IIF((SELECT TOP 1 empcode
                     FROM Approval_Matrix
                     WHERE '${Appr_Code}'  IN (approver1_A, approver1_B)      
                     AND module_code = 'SpecialAprAsset'
                     AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT) IS NOT NULL,
                     Appr_1_Stat,
                    IIF((SELECT TOP 1 1 AS result
                         FROM Approval_Matrix
                         WHERE '${Appr_Code}'  IN (approver2_A, approver2_B)  
                         AND module_code = 'SpecialAprAsset'
                         AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT) IS NOT NULL,
                        IIF(Appr_1_Stat IS NULL, 1, Appr_2_Stat),      
                        IIF((SELECT TOP 1 1 AS result
                             FROM Approval_Matrix
                             WHERE '${Appr_Code}'  IN (approver3_A, approver3_B)
                             AND module_code = 'SpecialAprAsset'       
                             AND SRM COLLATE DATABASE_DEFAULT = empcode COLLATE DATABASE_DEFAULT) IS NOT NULL,
                        IIF(Appr_2_Stat IS NULL, 1, Appr_3_Stat), 1))), 1) AS status_appr,
            Asset_Request_dtl.tran_id,
                     CAST(Req_Date AS date) AS Req_Date,
            (SELECT Prefix_Code
             FROM Prefix_Name
             WHERE Prefix_Name = 'Purchase Request') + CAST(Asset_Request.tran_id AS VARCHAR) AS PrNumber,
            (SELECT TOP 1 godw_name
             FROM GODOWN_MST
             WHERE Godw_Code = Asset_Request_Dtl.Location) AS branch_name,
            (SELECT TOP 1 name
             FROM Assets_Group
             WHERE id = Asset_Request.Asset_Category) AS Asset_Name,   
                       (SELECT TOP 1 name
             FROM Assets_Group_Subcategory
             WHERE id = Asset_Request_Dtl.Subcategory) AS SubcategoryName,
             Item_Description, Quantity, 
		      (SELECT TOP 1 purchase_value from Asset_MonthWise_PurchaseValue where SubcategoryId = Asset_Request_Dtl.Subcategory 
			 and Asset_MonthWise_PurchaseValue.month =  MONTH(Asset_Request.Req_Date))AS Purchase_Limit,
			 (SELECT SUM(inv_amt) 
             FROM PurchaseEntryDtl 
             WHERE PurchaseEntryDtl.SubCategory = Asset_Request_Dtl.Subcategory
             AND TRAN_ID IN (SELECT TRAN_ID FROM PurchaseEntryMst WHERE MONTH(VOUCHER_DATE) = MONTH(GETDATE()) AND YEAR(VOUCHER_DATE) = YEAR(GETDATE()))) AS Total_Purchased,
			 (SELECT SUM(Total_Price) 
                 FROM Purchase_Order_Product_Details 
                WHERE Purchase_Order_Product_Details.Subcategory = Asset_Request_Dtl.Subcategory 
                AND Purchase_Id IN (
                SELECT Utd 
                FROM Purchase_Order 
                WHERE Fin_Appr = 1 
                  AND MONTH(Req_Date) = MONTH(GETDATE()) 
                  AND YEAR(Req_Date) = YEAR(GETDATE())) 
                AND Utd NOT IN (
                SELECT popd 
                FROM PurchaseEntryDtl 
                WHERE Subcategory = Asset_Request_Dtl.Subcategory)) AS Purchase_Pending,
				(SELECT SUM(Total_Price) 
         FROM Asset_Request_Dtl ArD
         WHERE ArD.Subcategory = Asset_Request_Dtl.Subcategory
           AND Fin_Appr = 1 
           AND Request_Id IN (
                SELECT tran_id 
                FROM Asset_Request 
                WHERE MONTH(Req_Date) = MONTH(GETDATE()) 
                  AND YEAR(Req_Date) = YEAR(GETDATE())

           ) 
           AND tran_id NOT IN (
                SELECT PurchaseRequest_UTD 
                FROM Purchase_Order_Product_Details
				where PurchaseRequest_UTD is not null  and Purchase_Id in (
				select Utd from Purchase_Order where Fin_Appr=1)
           )
        ) AS Approved_Purchase_Request,
			 Total_price,
            (SELECT TOP 1 CONCAT(EMPLOYEEMASTER.empfirstname, ' ', EMPLOYEEMASTER.emplastname)
             FROM EMPLOYEEMASTER
             WHERE EMPLOYEEMASTER.empcode = Asset_Request.EmpCode) AS EmployeeName,
            (SELECT TOP 1 CONCAT(EMPLOYEEMASTER.empfirstname, ' ', EMPLOYEEMASTER.emplastname)
             FROM EMPLOYEEMASTER
             WHERE EMPLOYEEMASTER.empcode = Asset_Request.OnBehalfEmpCode) AS RequestedBy,
            Asset_Category,
            Asset_Request_Dtl.Location,
            Appr_1_Rem,
            Appr_2_Rem,
            Appr_3_Rem,
            Fin_Appr,
            srm,
            srm AS emp_code,
            SpecialApr_Stat
        FROM Asset_Request_dtl
        INNER JOIN Asset_Request
            ON Asset_Request_Dtl.request_id = Asset_Request.tran_id    
        WHERE
    CAST(Req_Date AS date) BETWEEN '${dateFrom}' AND '${dateto}' AND   
    Asset_Request_Dtl.Location IN (${loc_code})
    AND (Asset_Request_Dtl.IsApproval = '3' or SpecialApr_Stat is not null)
    AND srm IN (
        SELECT empcode
        FROM approval_matrix
        WHERE '${Appr_Code}'  IN (approver1_A, approver1_B, approver2_A, approver2_B, approver3_A, approver3_B)
        )
    ) AS dasd  `;

    if (req.body.status == 2) {
      query += `where  (status_khud_ka is null and status_appr is null and SpecialApr_Stat is null) order by tran_id desc`;
    } else {
      query += `where  SpecialApr_Stat =${req.body.status}  order by tran_id desc`;
    }
    const branch = await sequelize.query(query);
    res.status(200).send(branch[0]);
  } catch (e) {
    console.log(e);
  }
};

exports.approveby2forSpecialAseetRequest = async function (req, res) {
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
        Message: "Please select the entry to approve",
      });
    }

    const id = mainData.map((item) => item.id);
    await sequelize.query(
      `UPDATE ASSET_REQUEST_DTL SET SpecialApr_Code = '${Appr_Code}', SpecialApr_Stat = '1',	SpecialApr_Remark = ${Remark},IsApproval=null where tran_id in (${id})`
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

exports.rejectby2forSpecialAseetRequest = async function (req, res) {
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
        Message: "Please select the entry to approve",
      });
    }

    const id = mainData.map((item) => item.id);
    await sequelize.query(
      `UPDATE ASSET_REQUEST_DTL SET SpecialApr_Code = '${Appr_Code}', SpecialApr_Stat = '0',	SpecialApr_Remark = ${Remark} where tran_id in (${id})`
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
