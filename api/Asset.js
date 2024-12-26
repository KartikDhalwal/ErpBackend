const express = require("express");
const router = express.Router();
const Asset = require("../routes/Asset");
const multer = require("multer");
const upload1 = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: 100 * 1024 * 1024, // 100 MB in bytes
  },
}).any();
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

router.post("/assetview", Asset.assetview);
router.post("/Productview", Asset.Productview);
router.post("/", Asset.inserData);
router.post("/Subcategory", Asset.Subcategory);
router.post("/Updatecategory", Asset.Updatecategory);
router.post("/Updatesubcategory", Asset.Updatesubcategory);
router.post("/saveAssetTemplate", Asset.saveAssetTemplate);
router.post("/EditTemplate", Asset.EditTemplate);
router.post("/uploadedImage", upload1, Asset.uploadedImage);
router.post("/uploadedsubImage", upload1, Asset.uploadedsubImage);
router.post("/addProduct", Asset.addProduct);
router.post("/UpdateProduct", Asset.UpdateProduct);
router.post("/branch", Asset.branch);
router.post("/findsubcategory", Asset.findsubcategory);
router.post("/paymentmode", Asset.paymentmode);
router.post("/VendorName", Asset.VendorName);
router.post("/VendorDetails", Asset.VendorDetails);
router.post("/purchaseRequest", Asset.purchaseRequest);
router.post("/purchaseOrder", Asset.purchaseOrder);
router.post("/updatepurchaseRequest", Asset.updatepurchaseRequest);
router.post("/updatepurchaseOrder", Asset.updatepurchaseOrder);
router.post("/viewpurchaserequests", Asset.viewpurchaserequests);
router.post("/viewpurchaseorders", Asset.viewpurchaseorders);
router.post("/approveby2", Asset.approveby2);
router.post("/rejectby2", Asset.rejectby2);
router.post("/purchaseorderdtl", Asset.purchaseorderdtl);
router.post("/PurchaseVendor", Asset.PurchaseVendor);
router.post("/PurchaseView", Asset.PurchaseView);
router.post("/Purchasefill", Asset.Purchasefill);
router.post("/findinvoice", Asset.findinvoice);
router.post("/PartyRateList", Asset.PartyRateList);
router.post("/SavePrefix", Asset.SavePrefix);
router.post("/showprefix", Asset.showprefix);
router.post("/company", Asset.company);
router.post("/DmsRowDataSave", Asset.DmsRowDataSave);
router.post("/FindPoorder", Asset.FindPoorder);
router.post("/potable", Asset.potable);
router.post("/PurchaseEntryAsset", Asset.PurchaseEntryAsset);
router.post("/PurchaseEntryAssetSub", Asset.PurchaseEntryAssetSub);
router.post("/ManagerView", Asset.ManagerView);
router.post("/PurchaseEntryDtl", Asset.PurchaseEntryDtl);
router.post("/AssetMaster", Asset.AssetMaster);
router.post("/findsub", Asset.findsub);
router.get("/GenerateQR/:utd", Asset.GenerateQR);
//asset issue
router.post("/EmployeeAssetSave", Asset.EmployeeAssetSave);
router.post("/ShowRequestId", Asset.ShowRequestId);
router.post("/EmployeeView", Asset.EmployeeView);
router.post("/approveby2forassetIssue", Asset.approveby2forassetIssue);
router.post("/rejectby2forassetIssue", Asset.rejectby2forassetIssue);
router.post("/viewdiscountapproaldataforassetIssue", Asset.viewdiscountapproaldataforassetIssue);
router.post("/FindallProduct", Asset.FindallProduct);
router.post("/Assetdashboard", Asset.Assetdashboard);
router.post("/AssetdashboardCategoryWise", Asset.AssetdashboardCategoryWise);
router.post("/AssetdashboardSubCategoryWise", Asset.AssetdashboardSubCategoryWise);

//ko
router.post("/StockManagerView", Asset.StockManagerView);
router.post("/IssuedAsset", Asset.IssuedAsset);
router.post("/UpdateAssetIssue", Asset.UpdateAssetIssue);
router.post("/EmployeeWiseAssetIssue", Asset.EmployeeWiseAssetIssue);
router.post("/AssetWiseIssue", Asset.AssetWiseIssue);
router.post("/AssetIssueDashboard", Asset.AssetIssueDashboard);
router.post("/LocationWiseReport", Asset.LocationWiseReport);
router.post("/viewBranchequests", Asset.viewBranchequests);
router.post("/viewItemDtl", Asset.viewItemDtl);
router.post("/FindAsset", Asset.FindAsset);
router.post("/AssetWiseReport", Asset.AssetWiseReport);


router.post("/AssetMasterView", Asset.AssetMasterView);

router.post("/LedgerView", Asset.LedgerView);


//hi
router.post("/FindBranchAddress", Asset.FindBranchAddress);
router.post("/FindAvailable_Quantity", Asset.FindAvailable_Quantity);
router.post("/UpdateQtyIssue", Asset.UpdateQtyIssue);

//service
router.post("/ServiceView", Asset.ServiceView);
router.post("/AddService", Asset.AddService);



//Reminders
router.post("/PreReminder", Asset.PreReminder);
router.get("/reminder", Asset.home);
router.post("/AddReminder", Asset.AddReminder);
router.post("/DeleteReminder", Asset.DeleteReminder);

//30-08-2024
router.post("/AssetType", Asset.AssetType);
router.post("/EmployeeData", Asset.EmployeeData);
router.post("/DirectIssueAssetCategory", Asset.DirectIssueAssetCategory);
router.post("/IssueDirectItemAdd", Asset.IssueDirectItemAdd);

//03-09-2024
router.post("/EmployeeAssetServiceSave", Asset.EmployeeAssetServiceSave);
router.post("/EmployeeServiceView", Asset.EmployeeServiceView);
router.post("/ShowRequestIdService", Asset.ShowRequestIdService);
router.post("/AssetServiceApproverView", Asset.AssetServiceApproverView);
router.post("/approveby2forassetservice", Asset.approveby2forassetservice);
router.post("/rejectby2forassetservice", Asset.rejectby2forassetservice);


router.post("/LedgVendordtl", Asset.LedgVendordtl);
router.post("/LedgVendordtloptions", Asset.LedgVendordtloptions);
router.post("/AddPartRateList", Asset.AddPartRateList);
router.post("/findMastersPurchase", Asset.findMastersPurchase);

//stock view
router.post("/stockview", Asset.stockview);
router.post("/findMasters", Asset.findMasters);
router.post("/VendorMasterSave", upload, Asset.VendorMasterSave);
router.post("/VendorMasterUpdate", upload, Asset.VendorMasterUpdate);
router.post("/FindItems", Asset.FindItems);
router.post("/PurchaseOrderView", Asset.PurchaseOrderView);

//backorders
router.post('/backOrders', Asset.backOrders)

router.post("/AssetModel", Asset.AssetModel);
router.post("/UpdateEmployeeAssetIssue", Asset.UpdateEmployeeAssetIssue);
router.post("/EmployeeAssetUpdate", Asset.EmployeeAssetUpdate);
router.post("/AddQtyToProducthistory", Asset.AddQtyToProducthistory);

router.post("/EntryView", Asset.EntryView);
router.post("/EntryDataFetch", Asset.EntryDataFetch);
router.post("/EntryPrint", Asset.EntryPrint);
router.post("/UOM", Asset.UOM);
router.post("/finassetdprate", Asset.finassetdprate);

//assetPooing
router.post("/ViewAssetPolling", Asset.ViewAssetPolling);
router.post("/ViewAssetReallocation", Asset.ViewAssetReallocation);
router.post("/AssetTransferSave", Asset.AssetTransferSave);
router.post("/GetAssetDtlForTransfer", Asset.GetAssetDtlForTransfer);
router.post("/Poolingfill", Asset.Poolingfill);
router.post("/Reallocationfill", Asset.Reallocationfill);
router.post("/AssetTransferRevoke", Asset.AssetTransferRevoke);
router.post("/MasterPoolingView", Asset.MasterPoolingView);
router.get("/AssetViewEmployeeMaster", Asset.AssetViewEmployeeMaster);


router.post("/viewDirect", Asset.viewDirect);
router.post("/viewDirectTransferedassets", Asset.viewDirectTransferedassets);
router.post("/AssetTransferReprot", Asset.AssetTransferReprot);

router.post("/AllAssetview", Asset.AllAssetview);
router.post("/filldirectissue", Asset.filldirectissue);
router.post("/filldirectbranch", Asset.filldirectbranch);
router.post("/AllSubCategoryView", Asset.AllSubCategoryView);

router.post("/AddCharacter", Asset.AddCharacter);
router.post("/UpdateCharacter", Asset.UpdateCharacter);
router.post("/ShowCharacteristic", Asset.ShowCharacteristic);
router.post("/paymentmode1", Asset.paymentmode1);
router.post("/CharacteristicAssetProduct", Asset.CharacteristicAssetProduct);

router.post("/FindItemsforPurchase", Asset.FindItemsforPurchase);
router.post("/AMCReport", Asset.AMCReport);

router.post("/paymentmode2", Asset.paymentmode2);

router.post("/LimetedAssetReport", Asset.LimetedAssetReport);


//15-10-2024
router.post("/AssetRequestPoNumber", Asset.AssetRequestPoNumber);
router.post("/AssetRequest", Asset.AssetRequest);
router.post("/PurchaseRequestView", Asset.PurchaseRequestView);
router.post("/AssetRequestdtlView", Asset.AssetRequestdtlView);
router.post("/IsApproval", Asset.IsApproval);


router.post("/VirePurchaseRequestForApproval", Asset.VirePurchaseRequestForApproval);
router.post("/approveby2forAseetRequest", Asset.approveby2forAseetRequest);
router.post("/rejectby2forAseetRequest", Asset.rejectby2forAseetRequest);
router.post("/filldirectissueforAssetRequest", Asset.filldirectissueforAssetRequest);
router.post("/PurchaseRequestToOrderView", Asset.PurchaseRequestToOrderView);
router.post("/FillTabledataforAssetRequest", Asset.FillTabledataforAssetRequest);
router.post("/FillDataforAssetRequestInPO", Asset.FillDataforAssetRequestInPO);

router.post("/IsQuotation", Asset.IsQuotation);

//25-11-2024
router.post("/AddPurchaseMonth", Asset.AddPurchaseMonth);
router.post("/ViewPurchaseMonth", Asset.ViewPurchaseMonth);
router.get("/importformatmini", Asset.importformatmini);
router.post("/excelimportmini", excelUpload, Asset.excelimportmini);


router.post("/ViewPurchaseRequestForSpecialApproval", Asset.ViewPurchaseRequestForSpecialApproval);
router.post("/approveby2forSpecialAseetRequest", Asset.approveby2forSpecialAseetRequest);
router.post("/rejectby2forSpecialAseetRequest", Asset.rejectby2forSpecialAseetRequest);

module.exports = router;  