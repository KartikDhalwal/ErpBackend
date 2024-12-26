const express = require("express");
const router = express.Router();
const Inventory = require("../routes/inventory");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([
  { name: "VendorDocument", maxCount: 1 },
]);
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).fields([{ name: "excel", maxCount: 1 }]);
router.post("/VendorsView", Inventory.VendorsView);
router.post("/findMasters", Inventory.findMasters);
router.post("/VendorMasterSave", upload, Inventory.VendorMasterSave);
router.post("/VendorMasterUpdate", upload, Inventory.VendorMasterUpdate);
router.post("/SaveSaleBill", Inventory.SaveSaleBill);
router.post("/SavePurchaseBill", Inventory.SavePurchaseBill);
router.post("/ItemMasterSave", Inventory.ItemMasterSave);
router.post("/ItemsView", Inventory.ItemsView);
router.post("/ItemDataFetch", Inventory.ItemDataFetch);
router.post("/ItemMasterUpdate", Inventory.ItemMasterUpdate);
router.get("/ItemImportFormat", Inventory.ItemImportFormat);
router.post("/ItemImportExcel", excelUpload, Inventory.ItemImportExcel);
router.post("/VendorDataFetch", Inventory.VendorDataFetch);
router.post("/ItemTaxRates", Inventory.ItemTaxRates);
router.get("/InventoryItemsExport", Inventory.InventoryItemsExport);
router.post("/TransferInStockView", Inventory.TransferInStockView);
router.post("/FetchLocations", Inventory.FetchLocations);
router.post("/fetchCurrentStock", Inventory.fetchCurrentStock);
router.post("/TransferStock", Inventory.TransferStock);
module.exports = router;
