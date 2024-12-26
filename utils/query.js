const DBQUERIES = [
  {
    comments: "Interview process",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[SHORTLISTED_CANDIDATE](
                        [SRNO] [smallint] NULL,
                        [EMPCODE] [varchar](100) NOT NULL,
                        [MSPIN] [nvarchar](50) NULL,
                        [TITLE] [nvarchar](15) NULL,
                        [EMPFIRSTNAME] [nvarchar](150) NULL,
                        [EMPLASTNAME] [nvarchar](150) NULL,
                        [PERMANENTADDRESS1] [nvarchar](250) NULL,
                        [PERMANENTADDRESS2] [nvarchar](150) NULL,
                        [PCITY] [smallint] NULL,
                        [PPINCODE] [nvarchar](12) NULL,
                        [PSTATE] [smallint] NULL,
                        [CURRENTADDRESS1] [nvarchar](250) NULL,
                        [CURRENTADDRESS2] [nvarchar](150) NULL,
                        [CCITY] [smallint] NULL,
                        [CPINCODE] [nvarchar](12) NULL,
                        [CSTATE] [smallint] NULL,
                        [LANDLINENO] [nvarchar](25) NULL,
                        [MOBILENO] [nvarchar](25) NULL,
                        [EMERGENCYNAME] [nvarchar](100) NULL,
                        [EMERGENCYNO] [nvarchar](25) NULL,
                        [PANNO] [nvarchar](25) NULL,
                        [PFNO] [nvarchar](25) NULL,
                        [ESINO] [nvarchar](25) NULL,
                        [PASSPORTNO] [nvarchar](25) NULL,
                        [PASSEXPIRYDATE] [smalldatetime] NULL,
                        [BLOODGROUP] [nvarchar](15) NULL,
                        [DOB] [smalldatetime] NULL,
                        [GENDER] [nvarchar](15) NULL,
                        [MARITALSTATUS] [nvarchar](15) NULL,
                        [DOM] [smalldatetime] NULL,
                        [SKILLS] [nvarchar](25) NULL,
                        [BASICQUALIFICATION] [nvarchar](50) NULL,
                        [PROFESSIONALQUALIFICATION] [nvarchar](50) NULL,
                        [FATHERNAME] [nvarchar](100) NULL,
                        [FATHEROCCUPATION] [smallint] NULL,
                        [FATHERCONTACTNO] [nvarchar](25) NULL,
                        [MOTHERNAME] [nvarchar](100) NULL,
                        [MOTHERCONTACTNO] [nvarchar](25) NULL,
                        [SPOUSENAME] [nvarchar](100) NULL,
                        [SPOUSECONTACTNO] [nvarchar](25) NULL,
                        [SPOUSEGENDER] [nvarchar](15) NULL,
                        [SIBLINGNAME] [nvarchar](100) NULL,
                        [SIBLINGCONTACTNO] [nvarchar](25) NULL,
                        [PREVIOUSCOMPANYNAME] [nvarchar](100) NULL,
                        [PRECOMPCITY] [smallint] NULL,
                        [PRECOMPCONTACTNO] [nvarchar](25) NULL,
                        [PREJOININGDATE] [smalldatetime] NULL,
                        [PREENDDATE] [smalldatetime] NULL,
                        [PREDESIGNATION] [nvarchar](50) NULL,
                        [EMPREFERENCENAME] [nvarchar](100) NULL,
                        [REFERENCEDESIGNATION] [nvarchar](50) NULL,
                        [ISMEDICALATTENTION] [nvarchar](30) NULL,
                        [ISSERIOUSILLNESS] [nvarchar](30) NULL,
                        [ISALLERGIES] [nvarchar](30) NULL,
                        [CORPORATEMAILID] [nvarchar](70) NULL,
                        [CURRENTJOINDATE] [smalldatetime] NULL,
                        [PAYMENTMODE] [nvarchar](15) NULL,
                        [BANKNAME] [nvarchar](100) NULL,
                        [BANKACCOUNTNO] [nvarchar](30) NULL,
                        [EMPLOYEETYPE] [nvarchar](30) NULL,
                        [ORGANISATIONNAME] [nvarchar](100) NULL,
                        [SBU_FUNCTION] [nvarchar](30) NULL,
                        [DIVISION] [nvarchar](30) NULL,
                        [REGION] [smallint] NULL,
                        [UNIT] [nvarchar](25) NULL,
                        [SECTION] [nvarchar](25) NULL,
                        [LEVEL] [nvarchar](25) NULL,
                        [LOCATION] [nvarchar](30) NULL,
                        [ROLE] [nvarchar](50) NULL,
                        [EMPLOYEEDESIGNATION] [nvarchar](50) NULL,
                        [GRADE] [nvarchar](30) NULL,
                        [SUPERVISORID] [smallint] NULL,
                        [SUPERVISOR] [nvarchar](50) NULL,
                        [ISTIMEVALIDATION] [nvarchar](25) NULL,
                        [ISPAYROLL] [nvarchar](25) NULL,
                        [PAYCYCLEDURATION] [nvarchar](50) NULL,
                        [PROBATIONPERIOD] [nvarchar](20) NULL,
                        [PROBATIONLEAVES] [nvarchar](20) NULL,
                        [NOTICEPERIOD] [nvarchar](20) NULL,
                        [RELCODE] [smallint] NULL,
                        [Exp_Date] [smalldatetime] NULL,
                        [Export_Type] [tinyint] NOT NULL,
                        [Loc_Code] [smallint] NULL,
                        [ServerId] [int] NOT NULL,
                        [DRIVINGLIC_ISSUEDATE] [smalldatetime] NULL,
                        [DRIVINGLIC_ISSUEPALACE] [nvarchar](30) NULL,
                        [ACCOUNT_TYPE] [nvarchar](15) NULL,
                        [PFTRUST_NO] [nvarchar](25) NULL,
                        [EMPHEIGHT] [money] NULL,
                        [EMPWEIGHT] [money] NULL,
                        [P_NATIONALITY] [nvarchar](25) NULL,
                        [UID_NO] [nvarchar](30) NULL,
                        [ALTERNET_MAIL] [nvarchar](30) NULL,
                        [EMPDEPENDENT] [smallint] NULL,
                        [CHILDREN_DETAIL] [nvarchar](150) NULL,
                        [LANGUAGE_DETAIL] [nvarchar](150) NULL,
                        [NOMINEE_DETAIL] [smallint] NULL,
                        [EMP_SHIFT] [nvarchar](30) NULL,
                        [PF] [money] NULL,
                        [PFSALARY_LIMIT] [money] NULL,
                        [LWF] [money] NULL,
                        [ESI_AMOUNT] [money] NULL,
                        [BONUS_AMOUNT] [money] NULL,
                        [MONTHLY_CTC] [money] NULL,
                        [ANNUAL_CTC] [money] NULL,
                        [COMP_NAME] [nvarchar](70) NULL,
                        [JOINING_TYPE] [nvarchar](30) NULL,
                        [BRANCH] [nvarchar](50) NULL,
                        [EMP_STATUS] [nvarchar](20) NULL,
                        [USR_NAME] [nvarchar](50) NULL,
                        [APPLICATION_ID] [nvarchar](30) NULL,
                        [APPROVED_AUTHO] [nvarchar](30) NULL,
                        [CREATED_BY] [nvarchar](20) NULL,
                        [CREATED_ON] [smalldatetime] NULL,
                        [LASTMODI_BY] [nvarchar](20) NULL,
                        [LASTMODI_ON] [smalldatetime] NULL,
                        [BIOMETRIC_ID] [nvarchar](25) NULL,
                        [PROPOSEDRETIRE_DATE] [smalldatetime] NULL,
                        [LASTWOR_DATE] [smalldatetime] NULL,
                        [RELEVE_STATUS] [nvarchar](25) NULL,
                        [ADUSER_NAME] [nvarchar](40) NULL,
                        [EXT_NO] [nvarchar](20) NULL,
                        [AUTOMAILER] [nvarchar](3) NULL,
                        [WEEKLYOFF] [nvarchar](15) NULL,
                        [RESIGN_APPR] [nvarchar](10) NULL,
                        [AX_EMP_CODE] [nvarchar](200) NULL,
                        [AX_BAL] [real] NULL,
                        [Prob_period] [smalldatetime] NULL,
                        [empcode2] [nvarchar](30) NULL,
                        [empcode3] [nvarchar](30) NULL,
                        [empcode4] [nvarchar](30) NULL,
                        [ADHARNO] [nvarchar](50) NULL,
                        [pfnumber] [nvarchar](30) NULL,
                        [esinumber] [nvarchar](30) NULL,
                        [ein] [nvarchar](100) NULL,
                        [mobile_limit] [nvarchar](10) NULL,
                        [Rec_Date] [date] NULL,
                        [ifsc_code] [nvarchar](100) NULL,
                        [MOBILE_NO] [nvarchar](15) NULL,
                        [pre_Exp] [nvarchar](100) NULL,
                        [landline_no] [nvarchar](15) NULL,
                        [uidno] [varchar](20) NULL,
                        [CNATIONALITY] [nvarchar](50) NULL,
                        [Father_Mob] [nvarchar](30) NULL,
                        [Mother_Mob] [nvarchar](30) NULL,
                        [Spouse_Mob] [nvarchar](30) NULL,
                        [pfper] [real] NULL,
                        [esiper] [money] NULL,
                        [IEMI] [nvarchar](15) NULL,
                        [IsRW] [int] NULL,
                        [Reporting_1] [nvarchar](30) NULL,
                        [Reporting_2] [nvarchar](30) NULL,
                        [Reporting_3] [nvarchar](30) NULL,
                        [App_Mispunch] [nvarchar](10) NULL,
                        [App_Leave] [nvarchar](10) NULL,
                        [App_Attendance] [nvarchar](10) NULL,
                        [InBudget] [bit] NULL,
                        [Induction_Done] [bit] NULL,
                        [ExitInterview_Done] [bit] NULL,
                        [Sal_Region] [smallint] NULL,
                        [Tocken_Id] [nvarchar](50) NULL,
                        [Interview_Date] [date] NULL,
                        [LWFNO] [int] NULL,
                        [Emp_Ac_Name] [nvarchar](50) NULL,
                        [PF_Date] [date] NULL,
                        [ESI_Date] [date] NULL,
                        [PASSPORT_EXPDATE] [date] NULL,
                        [Punch_Type] [int] NULL,
                        [PAY_CODE] [nvarchar](30) NULL,
                        [Sal_Hold] [int] NULL,
                        [Relaxation_Type] [int] NULL,
                        [ShiftIn_Relaxation] [money] NULL,
                        [ShiftOut_Relaxation] [money] NULL,
                        [Cumulative_Relaxation] [money] NULL,
                        [Spl_Rem] [nvarchar](500) NULL,
                        [Acnt_Loc] [int] NULL,
                        [UAN_No] [nvarchar](50) NULL,
                        [EmpType] [int] NULL,
                        [FCM_TockenId] [nvarchar](100) NULL,
                        [TCS_Rate] [int] NULL,
                        [MSPN_Id] [nvarchar](30) NULL,
                        [Android_ID] [nvarchar](100) NULL,
                        [multi_loc] [nvarchar](100) NULL,
                        [Ledger_Code] [int] NULL,
                        [IsMSPN] [int] NULL,
                        [MSPN_DTL] [nvarchar](70) NULL,
                        [ESI_DEDUCTION] [int] NULL,
                        [PF_DEDUCTION] [int] NULL,
                        [pro_tax] [int] NULL,
                        [Token] [nvarchar](500) NULL,
                        [Is_Profile_Filled] [int] NULL,
                        [driving_licence] [nvarchar](50) NULL,
                        [columndoc_type] [nvarchar](50) NULL,
                        [mPunch] [nvarchar](1) NULL,
                        [mApprove] [nvarchar](1) NULL,
                        [mMispunch] [nvarchar](1) NULL,
                        [mLeave] [nvarchar](1) NULL,
                        [mCalender] [nvarchar](1) NULL,
                        [mDeviceLog] [nvarchar](1) NULL,
                        [mAttendanceLog] [nvarchar](1) NULL,
                        [mLocationLog] [nvarchar](1) NULL,
                        [mToDoList] [nvarchar](1) NULL,
                        [mSuggestions] [nvarchar](1) NULL,
                        [mUpdateIMEI] [nvarchar](1) NULL,
                        [mTrackingReport] [nvarchar](1) NULL,
                        [mLiveLocation] [nvarchar](1) NULL,
                        [mAssetScan] [nvarchar](1) NULL,
                        [mGeoFenceSetting] [nvarchar](1) NULL
                    ) ON [PRIMARY]
                    `,
      `CREATE TABLE [dbo].[NEW_JOINING](
                    [TRAN_ID] [int] NULL,
                    [NAME] [nvarchar](80) NULL,
                    [MOB_NO] [nvarchar](15) NULL,
                    [WHATSAPP_NO] [nchar](15) NULL,
                    [ADDRESS] [nchar](150) NULL,
                    [PINCODE] [nchar](10) NULL,
                    [STATE] [int] NULL,
                    [CITY] [varchar](40) NULL,
                    [HIGH_QUAL] [nchar](50) NULL,
                    [PASSING_PER] [int] NULL,
                    [FATHERS_NAME] [nchar](80) NULL,
                    [GENDER] [nchar](20) NULL,
                    [MOTHERS_NAME] [nchar](80) NULL,
                    [EXP_IN_YEAR] [int] NULL,
                    [CURRENT_CTC] [money] NULL,
                    [LOC_CODE] [int] NULL,
                    [DESIGNATION] [varchar](50) NULL,
                    [EMAIL] [nchar](50) NULL,
                    [AADHAR_NO] [varchar](20) NULL,
                    [DOB] [date] NULL,
                    [DOM] [date] NULL,
                    [RELIGION] [nchar](10) NULL,
                    [APPLICATION_DATE] [date] NULL,
                    [INT_STATUS] [int] NULL,
                    [INTR1DATE] [date] NULL,
                    [INTR1TIME] [time](7) NULL,
                    [INTR2TIME] [time](7) NULL,
                    [INTR2DATE] [date] NULL,
                    [INTR1BY] [varchar](25) NULL,
                    [INTR2BY] [varchar](25) NULL,
                    [INTR3BY] [varchar](25) NULL,
                    [INTR4BY] [varchar](25) NULL,
                    [INTR4TIME] [time](7) NULL,
                    [INTR3TIME] [time](7) NULL,
                    [INTR3DATE] [date] NULL,
                    [INTR4DATE] [date] NULL,
                    [REJECTION_REMARK] [varchar](200) NULL,
                    [INTR1STATUS] [int] NULL,
                    [INTR2STATUS] [int] NULL,
                    [INTR3STATUS] [int] NULL,
                    [INTR4STATUS] [int] NULL,
                    [SKILLS] [nvarchar](50) NULL,
                    [SOURCE_OF_REG] [int] NULL,
                    [INTR1REMARK] [varchar](100) NULL,
                    [INTR1RATING] [int] NULL,
                    [INTR1SALARY] [money] NULL,
                    [INTR2REMARK] [varchar](100) NULL,
                    [INTR2RATING] [int] NULL,
                    [INTR2SALARY] [money] NULL,
                    [INTR4REMARK] [varchar](100) NULL,
                    [INTR4RATING] [int] NULL,
                    [INTR4SALARY] [money] NULL,
                    [INTR3REMARK] [varchar](100) NULL,
                    [INTR3RATING] [int] NULL,
                    [INTR3SALARY] [money] NULL,
                    [UNIQUE_ID] [varchar](100) NULL
                ) ON [PRIMARY]
                `,
    ],
  },
  {
    comments: "finanace payout",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[newcar_financedetails](
                            [loan_type] [varchar](10) NULL,
                            [financer] [varchar](10) NULL,
                            [fin_dono] [varchar](25) NULL,
                            [fin_do_date] [date] NULL,
                            [fin_doamt] [money] NULL,
                            [fin_paymt_recd] [money] NULL,
                            [finpaymtrec_date] [date] NULL,
                            [losNo] [varchar](50) NULL,
                            [mssf_id] [varchar](50) NULL,
                            [roi] [varchar](50) NULL,
                            [tendermonth] [varchar](50) NULL,
                            [cust_id] [varchar](25) NULL,
                            [vin] [varchar](30) NULL,
                            [inv_no] [varchar](30) NULL,
                            [date] [date] NULL,
                            [entertime] [datetime] NULL,
                            [loc_code] [varchar](10) NULL,
                            [export_type] [varchar](10) NULL,
                            [username] [varchar](50) NULL
                        ) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[newcar_financedetails] ADD  DEFAULT (getdate()) FOR [entertime]`,
      "alter table newcar_financedetails add  [loan_amount] [float] NULL;",
      "alter table newcar_financedetails add  [loan_account_number] [varchar](30) NULL;",
      "alter table newcar_financedetails add  [payoutpertentative] [varchar](20) NULL;",
      `CREATE TABLE [dbo].[icm_ext](
                            [tran_id] [varchar](20) NULL,
                            [fdo_date] [date] NULL,
                            [d_perc] [float] NULL,
                            [fpfcharge] [float] NULL,
                            [invoice_num] [varchar](25) NULL,
                            [date] [date] NULL,
                            [gstAmount1] [float] NULL,
                            [totalfin] [float] NULL,
                            [gstinc] [bit] NULL,
                            [finreceivedate] [date] NULL,
                            [d_amt] [varchar](25) NULL
                        ) ON [PRIMARY]
                        `,
      "alter table icm_ext add	[entertime] [datetime] NULL;",
      "alter table icm_ext add	[createdby] [varchar](50) NULL;",
    ],
  },
  {
    comments: "Employeemaster",
    ID: 1000,
    queries: [
      "ALTER TABLE [Asset_Issue] ADD [Asset_Serial_no] [nvarchar](100) NULL;",
      "ALTER TABLE [Asset_Issue] ADD [Asset_Type] [nvarchar](100) NULL;",
      "ALTER TABLE [Asset_Issue] ADD [Lost_Date] [date] NULL;",
      "ALTER TABLE [Asset_Issue] ADD [sr_no] [int] NULL;",
      `CREATE TABLE [dbo].[Employee_Assesment](
                        [Emp_Code] [nvarchar](10) NULL,
                        [Emp_Srno] [nvarchar](10) NULL,
                        [Emp_K_Name] [nvarchar](30) NULL,
                        [Emp_K_Designation] [datetime] NULL,
                        [Emp_K_Emailid] [nvarchar](30) NULL,
                        [Emp_K_Contact] [nvarchar](30) NULL,
                        [Export_Type] [int] NULL,
                        [Loc_Code] [int] NULL,
                        [Serverid] [int] NULL
                    ) ON [PRIMARY]`,
      `CREATE TABLE [dbo].[Employee_Experience](
                        [Emp_Code] [nvarchar](10) NULL,
                        [Emp_Srno] [nvarchar](10) NULL,
                        [Emp_Company] [nvarchar](30) NULL,
                        [Emp_Designation] [nvarchar](30) NULL,
                        [Emp_Responsibility] [nvarchar](30) NULL,
                        [Emp_From_Date] [datetime] NULL,
                        [Emp_To_Date] [datetime] NULL,
                        [Emp_Settlement_Done] [nvarchar](30) NULL,
                        [Emp_Drawn_Salary] [money] NULL,
                        [Emp_Leaving_Reason] [nvarchar](50) NULL,
                        [Export_Type] [int] NULL,
                        [Loc_Code] [int] NULL,
                        [Serverid] [int] NULL,
                        [SRNO] [int] NULL,
                        [CREATED_BY] [varchar](50) NULL,
                        [CREATED_ON] [date] NULL,
                        [lASTMODI_BY] [varchar](50) NULL,
                        [LASTMODI_ON] [date] NULL
                    ) ON [PRIMARY]
                    `,
      `CREATE TABLE [dbo].[Employee_Family](
                        [Emp_Code] [nvarchar](10) NULL,
                        [Emp_Srno] [nvarchar](10) NULL,
                        [Emp_Family_name] [nvarchar](30) NULL,
                        [Emp_Family_DOB] [datetime] NULL,
                        [Emp_Family_Relation] [nvarchar](30) NULL,
                        [Emp_Family_Address] [nvarchar](30) NULL,
                        [Emp_Family_Bloodgroup] [nvarchar](30) NULL,
                        [Emp_Family_Gender] [nvarchar](30) NULL,
                        [Emp_Family_Mobileno] [nvarchar](30) NULL,
                        [Emp_Family_emailid] [nvarchar](30) NULL,
                        [Emp_Family_Profession] [nvarchar](30) NULL,
                        [Export_Type] [int] NULL,
                        [Loc_Code] [int] NULL,
                        [Serverid] [int] NULL,
                        [Srno] [int] NULL
                    ) ON [PRIMARY]
                    `,
      `CREATE TABLE [dbo].[Employee_Interviewer](
                        [Emp_Code] [nvarchar](10) NULL,
                        [Emp_Srno] [nvarchar](10) NULL,
                        [Emp_Parameter] [nvarchar](30) NULL,
                        [Emp_I_Name] [datetime] NULL,
                        [Emp_I_Desig] [nvarchar](30) NULL,
                        [Emp_I_Remarks] [nvarchar](50) NULL,
                        [Export_Type] [int] NULL,
                        [Loc_Code] [int] NULL,
                        [Serverid] [int] NULL
                    ) ON [PRIMARY]
                    `,
      `CREATE TABLE [dbo].[Employee_ITSkill](
                        [Emp_Code] [nvarchar](10) NULL,
                        [Emp_Srno] [nvarchar](10) NULL,
                        [Emp_Tool] [nvarchar](30) NULL,
                        [Emp_Version] [nvarchar](30) NULL,
                        [Emp_Proficiency] [nvarchar](30) NULL,
                        [Emp_Last_Used] [nvarchar](4) NULL,
                        [Emp_Experience] [nvarchar](4) NULL,
                        [Export_Type] [int] NULL,
                        [Loc_Code] [int] NULL,
                        [Serverid] [int] NULL,
                        [srno] [int] NULL,
                        [CREATED_BY] [varchar](50) NULL,
                        [CREATED_ON] [date] NULL,
                        [lASTMODI_BY] [varchar](50) NULL,
                        [LASTMODI_ON] [date] NULL
                    ) ON [PRIMARY]
                    `,
      `CREATE TABLE [dbo].[Employee_Language](
                        [Emp_Code] [nvarchar](10) NULL,
                        [Emp_Srno] [nvarchar](10) NULL,
                        [Emp_Language] [nvarchar](30) NULL,
                        [Emp_Language_Understand] [nvarchar](30) NULL,
                        [Emp_Language_Speak] [nvarchar](30) NULL,
                        [Emp_Language_Read] [nvarchar](30) NULL,
                        [Emp_Language_Write] [nvarchar](30) NULL,
                        [Export_Type] [int] NULL,
                        [Loc_Code] [int] NULL,
                        [Serverid] [int] NULL,
                        [Srno] [int] NULL,
                        [CREATED_BY] [varchar](50) NULL,
                        [CREATED_ON] [date] NULL,
                        [lASTMODI_BY] [varchar](50) NULL,
                        [LASTMODI_ON] [date] NULL
                    ) ON [PRIMARY]`,
      `CREATE TABLE [dbo].[Employee_Reference](
                        [Emp_Code] [nvarchar](10) NULL,
                        [Emp_Srno] [nvarchar](10) NULL,
                        [Emp_Ref_Name] [nvarchar](30) NULL,
                        [Emp_Ref_Occup] [nvarchar](30) NULL,
                        [Emp_Ref_Address] [nvarchar](30) NULL,
                        [Emp_Ref_Mobile] [nvarchar](30) NULL,
                        [Emp_Ref_emailid] [nvarchar](30) NULL,
                        [Emp_Ref_relation] [nvarchar](30) NULL,
                        [Export_Type] [int] NULL,
                        [Loc_Code] [int] NULL,
                        [Serverid] [int] NULL,
                        [SRNO] [int] NULL
                    ) ON [PRIMARY]`,
      `CREATE TABLE [dbo].[EmployeeInterview](
                        [Applicant_Code] [nvarchar](10) NULL,
                        [Region] [nvarchar](20) NULL,
                        [Location] [nvarchar](20) NULL,
                        [Division] [nvarchar](20) NULL,
                        [Department] [nvarchar](20) NULL,
                        [Designation] [nvarchar](20) NULL,
                        [Applicant_Title] [nvarchar](20) NULL,
                        [Applicant_Firstname] [nvarchar](20) NULL,
                        [Applicant_Lastname] [nvarchar](20) NULL,
                        [Interview_Date] [datetime] NULL,
                        [Applicant_Status] [nvarchar](20) NULL,
                        [Exp_Join_Date] [datetime] NULL,
                        [Induction_Done] [nvarchar](20) NULL,
                        [Prob_Days] [int] NULL,
                        [Prob_Date] [datetime] NULL,
                        [Notice_Days] [int] NULL,
                        [Skills] [nvarchar](20) NULL,
                        [Applicant_Relocate] [int] NULL,
                        [Conveyance_Mode] [nvarchar](20) NULL,
                        [Existing_MSPIN] [nvarchar](20) NULL,
                        [MSIL_Certified] [int] NULL,
                        [Applicant_Certification] [nvarchar](30) NULL,
                        [Training_Done] [nvarchar](30) NULL,
                        [Pan_No] [nvarchar](30) NULL,
                        [Pan_Verified] [int] NULL,
                        [Aadhar_No] [nvarchar](30) NULL,
                        [Aadhar_Verified] [int] NULL,
                        [Passport_No] [nvarchar](30) NULL,
                        [Passport_Expiry_Date] [datetime] NULL,
                        [DL_No] [nvarchar](30) NULL,
                        [DL_Expiry_Date] [datetime] NULL,
                        [DL_Verified] [int] NULL,
                        [Current_Salary] [money] NULL,
                        [Expected_Salary] [money] NULL,
                        [Open_Position_Reason] [nvarchar](30) NULL,
                        [EIN_No] [nvarchar](20) NULL,
                        [P_Address1] [nvarchar](50) NULL,
                        [P_Address2] [nvarchar](50) NULL,
                        [P_City] [nvarchar](30) NULL,
                        [O_email] [nvarchar](30) NULL,
                        [P_pincode] [nvarchar](10) NULL,
                        [P_landline] [nvarchar](11) NULL,
                        [P_mobile] [nvarchar](10) NULL,
                        [P_State] [nvarchar](30) NULL,
                        [IEMI] [nvarchar](16) NULL,
                        [C_Address1] [nvarchar](50) NULL,
                        [C_Address2] [nvarchar](50) NULL,
                        [C_City] [nvarchar](30) NULL,
                        [Uid_no] [nvarchar](30) NULL,
                        [C_pincode] [nvarchar](10) NULL,
                        [C_landline] [nvarchar](11) NULL,
                        [C_mobile] [nvarchar](10) NULL,
                        [C_State] [nvarchar](30) NULL,
                        [Grade] [nvarchar](30) NULL,
                        [Nationality] [nvarchar](30) NULL,
                        [F_Name] [nvarchar](50) NULL,
                        [M_Name] [nvarchar](50) NULL,
                        [Aniv_Date] [datetime] NULL,
                        [Marital_Status] [int] NULL,
                        [Spouse_Name] [nvarchar](50) NULL,
                        [P_Email] [nvarchar](50) NULL,
                        [Height] [nvarchar](10) NULL,
                        [Weight] [nvarchar](10) NULL,
                        [DOB] [datetime] NULL,
                        [Blood_Group] [nvarchar](20) NULL,
                        [Religion] [nvarchar](30) NULL,
                        [Gender] [nvarchar](30) NULL,
                        [Emp_Code2] [nvarchar](30) NULL,
                        [Emp_Code3] [nvarchar](30) NULL,
                        [Emp_Code4] [nvarchar](30) NULL,
                        [Created_By] [nvarchar](30) NULL,
                        [Created_On] [nvarchar](30) NULL,
                        [Last_Modified_by] [nvarchar](30) NULL,
                        [Last_Modified_Date] [datetime] NULL,
                        [Machine_Name] [nvarchar](30) NULL,
                        [Machine_Serialno] [nvarchar](30) NULL,
                        [Machine_driveno] [nvarchar](30) NULL,
                        [PF_App] [int] NULL,
                        [PF_Perc] [money] NULL,
                        [Uan_No] [nvarchar](30) NULL,
                        [ESIC_App] [int] NULL,
                        [ESIC_No] [nvarchar](30) NULL,
                        [LWF_App] [int] NULL,
                        [Bonus_App] [int] NULL,
                        [Weekly_off] [nvarchar](10) NULL,
                        [Emp_Shift] [nvarchar](10) NULL,
                        [Bank_Name] [nvarchar](30) NULL,
                        [Account_Type] [nvarchar](30) NULL,
                        [Account_Number] [nvarchar](30) NULL,
                        [Branch_Name] [nvarchar](30) NULL,
                        [Payment_Mode] [nvarchar](30) NULL,
                        [IFSC_Code] [nvarchar](30) NULL,
                        [BankAccount_Verified] [int] NULL,
                        [BankAccount_Name] [nvarchar](30) NULL,
                        [Salary_Effectivedate] [datetime] NULL,
                        [Salary_Basic] [money] NULL,
                        [Salary_HRA] [money] NULL,
                        [Salary_Conv] [money] NULL,
                        [Salary_Medical] [money] NULL,
                        [Salary_Washing] [money] NULL,
                        [Salary_MGross] [money] NULL,
                        [Salary_YGross] [money] NULL,
                        [Emp_Salary] [money] NULL,
                        [Salary_PF] [money] NULL,
                        [Salary_Esic] [money] NULL,
                        [Salary_LWF] [money] NULL,
                        [PF_Salary_Limit] [money] NULL,
                        [Salary_Bonus] [money] NULL,
                        [Mobile_Limit] [money] NULL,
                        [Export_Type] [int] NULL,
                        [Loc_Code] [int] NULL,
                        [Serverid] [int] NULL
                    ) ON [PRIMARY]`,
      "alter table EMPLOYEEMASTER alter column FCM_TockenId varchar (300)",
      "alter table EMP_DOcs add  Created_Date DATETIME DEFAULT GETDATE();",
      "alter table EMPLOYEEMASTER add mUserGeoLocation varchar (1)",
      "alter table EMP_DOcs ADD Utd INT IDENTITY(1,1);",
      "alter table employeemaster add UTD int identity(1,1)",
    ],
  },
  {
    comments: "templates",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[Templates](
                        [TEMPLATE_NO] [int] IDENTITY(1,1) NOT NULL,
                        [TEMPLATE_NAME] [nvarchar](50) NULL,
                        [CONTENT] [nvarchar](max) NULL,
                        [KEYWORDS] [nvarchar](max) NULL,
                        [SEND_DATE] [nvarchar](50) NULL,
                        [SCHEDULED] [smallint] NULL,
                        [Created_At] [datetime] NOT NULL,
                        [Created_by] [varchar](100) NULL,
                        [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                        [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                    PRIMARY KEY CLUSTERED 
                    (
                        [TEMPLATE_NO] ASC
                    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                        PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
                    WITH
                    (
                    SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Templates_Hst])
                    )
                    
                    
                    ALTER TABLE [dbo].[Templates] ADD  DEFAULT (getdate()) FOR [Created_At]
                    
                    
                    ALTER TABLE [dbo].[Templates] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                    
                    `,
      `CREATE TABLE [dbo].[TEMPLATE_GEN](
                        [TEMPLATE_NO] [int] NOT NULL,
                        [TEMPLATE_NAME] [nvarchar](50) NULL,
                        [CONTENT] [nvarchar](max) NULL,
                        [CREATED_DATE] [date] NULL,
                        [SEND_DATE] [nvarchar](50) NULL
                    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
                    `,
    ],
  },
  {
    comments: "fuel slip",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[FuelSlip](
                        [UTD] [int] IDENTITY(1,1) NOT NULL,
                        [TRAN_ID] [int] NULL,
                        [TRAN_TYPE] [nvarchar](50) NULL,
                        [DMS_INV] [nvarchar](50) NULL,
                        [GATEPASS_NO] [nvarchar](50) NULL,
                        [GATEPASS_DATE] [nvarchar](50) NULL,
                        [CUSTOMER_NAME] [nvarchar](200) NULL,
                        [BRANCH] [nvarchar](200) NULL,
                        [DSE_NAME] [nvarchar](50) NULL,
                        [MODEL_NAME] [nvarchar](50) NULL,
                        [DELIVERY_DATE] [date] NULL,
                        [TYPE_OF_FUEL] [nvarchar](50) NULL,
                        [QUANTITY] [int] NULL,
                        [SLIP_GIVEN_TO] [nvarchar](100) NULL,
                        [FUEL_SLIP_FLAG] [int] NULL,
                        [LOC_CODE] [int] NULL,
                        [EXPORT_TYPE] [int] NULL,
                        [SERVER_ID] [int] NULL,
                        [REMARK] [nvarchar](250) NULL,
                        [PRINTED_BY] [nvarchar](100) NULL,
                        [VEH_REGNO] [nvarchar](30) NULL,
                        [DEMO_CAR_ID] [int] NULL,
                        [CHAS_NO] [nvarchar](50) NULL,
                        [ENGINE_NO] [nvarchar](50) NULL,
                        [MODEL_GROUP] [int] NULL,
                        [VEH_COLOUR] [nvarchar](10) NULL,
                        [KM_DRIVEN] [int] NULL,
                        [REG_BRANCH] [nvarchar](100) NULL,
                        [AVERAGE] [int] NULL,
                        [LOC_FROM] [varchar](200) NULL,
                        [LOC_TO] [varchar](200) NULL,
                        [DISTANCE_BET] [int] NULL,
                        [DRIVER_NAME] [nvarchar](100) NULL,
                        [ENQUIRY_NO] [int] NULL,
                        [LAST_KM_DRIVEN] [int] NULL,
                        [REG_LOC_CODE] [nvarchar](100) NULL,
                        [Created_At] [datetime] NOT NULL,
                        [Created_by] [varchar](100) NULL,
                        [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                        [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                        [IMAGE_PATH] [nvarchar](1000) NULL,
                    PRIMARY KEY CLUSTERED 
                    (
                        [UTD] ASC
                    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                        PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                    ) ON [PRIMARY]
                    WITH
                    (
                    SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[FuelSlip_Hst])
                    )
                    
                    
                    ALTER TABLE [dbo].[FuelSlip] ADD  DEFAULT (getdate()) FOR [Created_At]
                    
                    
                    ALTER TABLE [dbo].[FuelSlip] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                    `,
      `CREATE TABLE [dbo].[DemoCarMaster](
                        [UTD] [int] IDENTITY(1,1) NOT NULL,
                        [VEH_REGNO] [nvarchar](25) NULL,
                        [CHAS_NO] [nvarchar](30) NULL,
                        [ENGINE_NO] [nvarchar](50) NULL,
                        [MODEL_GROUP] [int] NULL,
                        [MODEL_NAME] [int] NULL,
                        [VEH_COLOUR] [nvarchar](30) NULL,
                        [KM_DRIVEN] [int] NULL,
                        [REG_BRANCH] [int] NULL,
                        [EXPORT_TYPE] [int] NULL,
                        [LOC_CODE] [int] NULL,
                        [SERVER_ID] [int] NULL,
                        [FUEL_TYPE] [nvarchar](25) NULL,
                        [AVERAGE] [int] NULL,
                        [Created_At] [datetime] NOT NULL,
                        [Created_by] [varchar](100) NULL,
                        [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                        [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                    PRIMARY KEY CLUSTERED 
                    (
                        [UTD] ASC
                    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                        PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                    ) ON [PRIMARY]
                    WITH
                    (
                    SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[DemoCarMaster_Hst])
                    )
                    
                    
                    ALTER TABLE [dbo].[DemoCarMaster] ADD  DEFAULT (getdate()) FOR [Created_At]
                    
                    
                    ALTER TABLE [dbo].[DemoCarMaster] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                    
                    
                    `,
      `ALTER TABLE FuelSlip ADD FUEL_VENDOR int`,
      `ALTER TABLE DemoCarMaster ADD Available [varchar](10)`,
      `ALTER TABLE DemoCarMaster ADD Image [varchar](100)`,
    ],
  },
  {
    comments: "Reminder",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[reminder_emp](
                        [reminder_id] [int] NOT NULL,
                        [empcode] [varchar](15) NULL,
                        [email] [varchar](50) NULL,
                        [mobile] [varchar](12) NULL
                    ) ON [PRIMARY]
                    `,
      `CREATE TABLE [dbo].[reminder_table](
                        [reminder_id] [int] IDENTITY(1,1) NOT NULL,
                        [reminder_name] [varchar](50) NULL,
                        [date] [date] NULL,
                        [time] [varchar](255) NULL,
                        [frequency] [nvarchar](255) NULL,
                        [validity] [date] NULL,
                        [description] [varchar](255) NULL,
                        [user_id] [int] NULL,
                        [type] [varchar](255) NULL
                    ) ON [PRIMARY]
                    `,
    ],
  },
  {
    comments: "COMP_KEYDATA",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[COMP_KEYDATA](
                        [Comp_Code] [int] NULL,
                        [M1] [bit] NULL,
                        [M2] [bit] NULL,
                        [M3] [bit] NULL,
                        [M4] [bit] NULL,
                        [M5] [bit] NULL,
                        [M6] [bit] NULL,
                        [M7] [bit] NULL,
                        [M8] [bit] NULL,
                        [M9] [bit] NULL,
                        [M10] [bit] NULL,
                        [M11] [bit] NULL,
                        [DISC_DUAL_APRVL] [bit] NULL,
                        [DUAL_APRVL_MSG] [bit] NULL
                    ) ON [PRIMARY]
                    `,
      `alter table Comp_keydata add New_dev_code int`,
    ],
  },
  {
    comments: "User table and rights",
    ID: 1000,
    queries: [
      "alter table user_tbl add emp_dms_code varchar(15)",
      "alter table user_tbl add EMPCODE varchar(15)",
      "alter table user_tbl add seva_item_type varchar(20)",
      "alter table user_tbl add VAS_bookCode varchar(200)",
      "ALTER TABLE user_tbl ADD UTD INT IDENTITY(1,1) PRIMARY KEY;",
      `CREATE TABLE [dbo].[User_Rights](
                            [utd] [int] IDENTITY(1,1) NOT NULL,
                            [User_Code] [int] NOT NULL,
                            [Optn_Name] [nvarchar](255) NOT NULL,
                            [Module_Code] [int] NOT NULL,
                            [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                            [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                        PRIMARY KEY CLUSTERED 
                        (
                            [utd] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                            PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                        ) ON [PRIMARY]
                        WITH
                        (
                        SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[User_Rights_Hst])
                        )
                        
                        
                        ALTER TABLE [dbo].[User_Rights] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                        `,
    ],
  },
  // {
  //     comments: "VAS",
  //     ID:1000,
  //     queries: [
  //         `CREATE TABLE [dbo].[SPARE_LAB_MST](
  //             [TRAN_ID] [int] NULL,
  //             [DEPARTMENT] [nvarchar](25) NULL,
  //             [CUST_NAME] [nvarchar](200) NULL,
  //             [MOBILE_NO] [nvarchar](15) NULL,
  //             [VEHREGNO] [nvarchar](25) NULL,
  //             [JOB_NO] [nvarchar](25) NULL,
  //             [MODEL_NAME] [nvarchar](50) NULL,
  //             [CHASS_NO] [nvarchar](50) NULL,
  //             [SERVICE_TYPE] [nvarchar](30) NULL,
  //             [TECHNICIAN] [nvarchar](30) NULL,
  //             [SA_TL] [nvarchar](100) NULL,
  //             [MILAGE_KMS] [int] NULL,
  //             [MODE_Q] [int] NULL,
  //             [LOC_CODE] [int] NULL,
  //             [SERVER_ID] [int] NULL,
  //             [EXPORT_TYPE] [int] NULL,
  //             [REMARKS] [nvarchar](100) NULL,
  //             [DEPARTMENT_CAT] [nvarchar](25) NULL,
  //             [GROSS_PARTS_TOTAL] [money] NULL,
  //             [PARTS_TOTAL_GST] [money] NULL,
  //             [PARTS_NET_TOTAL] [money] NULL,
  //             [GROSS_LAB_TOTAL] [money] NULL,
  //             [LAB_TOTAL_GST] [money] NULL,
  //             [LAB_NET_TOTAL] [money] NULL,
  //             [TTL_INV_AMNT] [money] NULL,
  //             [TTL_GST_AMNT] [money] NULL,
  //             [INV_DATE] [datetime] NULL,
  //             [INV_NO] [varchar](50) NULL,
  //             [GST] [varchar](40) NULL,
  //             [STATE_CODE] [int] NULL,
  //             [VAS_TYPE] [nvarchar](20) NULL,
  //             [book_code] [nvarchar](20) NULL,
  //             [SALES_INV] [nvarchar](20) NULL,
  //             [SALES_INV_DATE] [datetime] NULL,
  //             [CUST_ADD] [varchar](300) NULL,
  //             [PAN_NO] [nvarchar](15) NULL,
  //             [MODEL_DESC] [nvarchar](80) NULL,
  //             [ENGINE_NO] [nvarchar](20) NULL,
  //             [DRD_ID] [varchar](30) NULL,
  //             [CUST_ID] [nvarchar](50) NULL,
  //             [EXECUTIVE] [nvarchar](50) NULL
  //         ) ON [PRIMARY]
  //

  //         ALTER TABLE [dbo].[SPARE_LAB_MST] ADD  DEFAULT (getdate()) FOR [INV_DATE]
  //         `,
  //         `CREATE TABLE [dbo].[VAS_TEMP](
  //             [TRAN_ID] [int] NULL
  //         )`,
  //         `CREATE TABLE [dbo].[SPARE_LAB_DTL](
  //             [TRAN_ID] [int] NULL,
  //             [TRAN_TYPE] [nvarchar](20) NULL,
  //             [CODE] [nvarchar](20) NULL,
  //             [DESCRIPTION] [nvarchar](50) NULL,
  //             [RATE] [money] NULL,
  //             [GST_PERCT] [int] NULL,
  //             [GST_VALUE] [money] NULL,
  //             [QUANTITY] [int] NULL,
  //             [LOC_CODE] [int] NULL,
  //             [EXPORT_TYPE] [int] NULL,
  //             [SERVER_ID] [int] NULL,
  //             [DISCOUNT] [money] NULL,
  //             [SRNO] [int] NULL,
  //             [GST_TYPE] [nvarchar](10) NULL,
  //             [INV_DATE] [datetime] NULL,
  //             [HSN_CODE] [nvarchar](50) NULL,
  //             [ITEM_CODE] [nvarchar](50) NULL
  //         ) ON [PRIMARY]
  //

  //         ALTER TABLE [dbo].[SPARE_LAB_DTL] ADD  DEFAULT (getdate()) FOR [INV_DATE]
  //         `,
  //         `drop PROCEDURE GetPivotedData`,
  //         `CREATE PROCEDURE GetPivotedData
  //      @itemcode INT,
  //      @type INT
  //  AS
  //  BEGIN
  //      DECLARE @columns NVARCHAR(MAX), @sql NVARCHAR(MAX);

  //      -- Create a comma-separated list of distinct modl_code values
  //      SELECT @columns = COALESCE(@columns + ', ', '') + QUOTENAME(modl_code)
  //      FROM (
  //          SELECT DISTINCT modl_code
  //          FROM branchwiseitemmst
  //          WHERE itemcode = @itemcode
  //      ) AS modl_codes;

  //      -- Create the dynamic SQL query
  //      SET @sql = '
  //      SELECT loc_code, ' + @columns + '
  //      FROM (
  //          SELECT modl_code, loc_code, price
  //          FROM branchwiseitemmst
  //          WHERE export_type < 3 and itemcode = ' + CAST(@itemcode AS NVARCHAR) + ' and item_labour = '+ CAST(@type AS NVARCHAR) +'
  //      ) AS SourceData
  //      PIVOT (
  //          MAX(price) FOR modl_code IN (' + @columns + ')
  //      ) AS PivotTable
  //      ORDER BY loc_code;';

  //      -- Execute the dynamic SQL query
  //      EXEC sp_executesql @sql;
  //     END;`,
  //         `drop PROCEDURE SevaSprDrdQuery`,
  //         `CREATE PROCEDURE SevaSprDrdQuery
  //     @tran_id INT,
  //     @location_code INT,
  //     @user_code INT
  // AS
  // BEGIN

  //     DECLARE @billno VARCHAR(255),
  //             @ledgcode INT,
  //             @seq INT,
  //             @drd_id VARCHAR(30),
  //    @rnd_off decimal(19,6),
  //    @total_inv decimal(19,6);
  //    SELECT @total_inv = round(SUM(ROUND(rate, 2) + (ROUND(rate, 2)* gst_value / 100)),0) FROM spare_lab_dtl where tran_id = @tran_id;

  //    SELECT @rnd_off = round(round(SUM(ROUND(rate, 2) + (ROUND(rate, 2)* gst_value / 100)),0)-SUM(ROUND(rate, 2) + (ROUND(rate, 2)* gst_value / 100)),2) FROM spare_lab_dtl where tran_id = @tran_id;

  //     SELECT @seq = ISNULL(MAX(seq_no) + 1, 1)
  //     FROM dms_row_data
  //     WHERE Export_Type < 3 and tran_type collate database_default= (SELECT top 1 book_code FROM spare_lab_mst WHERE tran_id = @tran_id and Export_Type < 3) collate database_default;

  //     SELECT  @drd_id = ISNULL(MAX(tran_id) + 1, 1)
  //     FROM DMS_ROW_DATA;

  //     -- Generate bill number
  //     SELECT @billno = CONCAT(
  //         (SELECT TOP 1 Book_Prefix
  //          FROM book_mst
  //          WHERE book_code  = (SELECT misc_dtl1 FROM misc_mst WHERE misc_code  = (SELECT top 1 book_code FROM spare_lab_mst WHERE tran_id = @tran_id and Export_Type < 3))
  //         ),
  //         @seq
  //     )

  //     -- Get ledger code
  //     SELECT @ledgcode = (SELECT cust_name FROM SPARE_LAB_MST WHERE TRAN_ID = @tran_id AND EXPORT_TYPE < 3);

  //     -- Insert data into dms_row_data table
  //     INSERT INTO dms_row_data (
  //         Tran_Id,
  //         tran_type,
  //         bill_no,
  //         Bill_Date,
  //         state_code,
  //         Item_Code,
  //         hsn,
  //         Basic_Price,
  //         Disc_1,
  //         Taxable,
  //         CGST_Perc,
  //         SGST_Perc,
  //         IGST_Perc,
  //         CGST,
  //         SGST,
  //         IGST,
  //         Export_Type,
  //         Server_id,
  //         Rnd_Ledg,
  //         Rnd_Off,
  //         inv_amt,
  //         Loc_Code,
  //         Sup_Qty,
  //         Catery,
  //         Item_Type,
  //         Sale_Type,
  //         Chassis,
  //         Engine,
  //         Ledger_Id,
  //         Ledger_Name,
  //         Narration,
  //         GST,
  //         LEDG_ACNT,
  //         Seq_No,
  //         PAN_NO,
  //         Executive,
  //         USR_CODE,
  //         ENTR_DATE,
  //         ENTR_TIME
  //     )
  //     SELECT
  //         @drd_id,
  //         (SELECT top 1 book_code FROM spare_lab_mst WHERE tran_id = @tran_id and Export_Type < 3),
  //         @billno,
  //         (SELECT top 1 INV_DATE FROM spare_lab_mst WHERE tran_id = @tran_id and Export_Type < 3),
  //         (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND misc_type = 3 AND EXPORT_TYPE < 3)),
  //   IIF(tran_type = 'parts', (select top 1 misc_name from misc_mst where misc_code = item_code and misc_type = 604), (select top 1 misc_name from misc_mst where misc_code = item_code and misc_type = 605)),
  //         hsn_code,
  //         rate,
  //         discount,
  //         IIF(quantity IS NULL, 1, quantity) * rate,
  //         IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, GST_VALUE / 2, 0),
  //         IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, GST_VALUE / 2, 0),
  //         IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, 0,GST_VALUE),
  //         ROUND(((IIF(quantity IS NULL, 1, quantity) * rate - DISCOUNT) * IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, GST_VALUE / 2, 0))/100,2),
  //         ROUND(((IIF(quantity IS NULL, 1, quantity) * rate - DISCOUNT) * IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, GST_VALUE / 2, 0))/100,2),
  //         ROUND(((IIF(quantity IS NULL, 1, quantity) * rate - DISCOUNT) * IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, 0,GST_VALUE))/100,2),
  //         0,
  //         1,
  //   '23',
  //   @rnd_off,
  //   @total_inv,
  //   --(SELECT TOP 1 TTL_INV_AMNT FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //   @location_code,
  //         IIF(quantity IS NULL, 1, quantity),
  //         0,
  //         IIF(tran_type = 'parts', 2, 3),
  //         IIF(tran_type = 'parts', 'ods', 'Service'),
  //         (SELECT TOP 1 CHASS_NO FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         (SELECT TOP 1 VEHREGNO FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         (SELECT CUST_ID FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         (SELECT TOP 1 ledg_name FROM ledg_mst WHERE ledg_mst.ledg_code = @ledgcode AND Export_Type < 3),
  //         (SELECT TOP 1 REMARKS FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         (SELECT TOP 1 GST FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         @ledgcode,
  //         @seq,
  //         (SELECT TOP 1 Ledg_Pan FROM ledg_mst WHERE ledg_mst.ledg_code = @ledgcode AND Export_Type < 3),
  //         (SELECT TOP 1 SA_TL FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         @user_code,
  //         GETDATE(),
  //         FORMAT(GETDATE(), 'HH.mm')
  //     FROM SPARE_LAB_dtl
  //     WHERE tran_id = @tran_id AND EXPORT_TYPE < 3;
  //         print @billno
  //     -- Update inv_no in SPARE_LAB_mst
  //  UPDATE DMS_ROW_DATA
  //  SET Rnd_Off = inv_amt-(select top 1 sum(taxable + sgst + cgst + igst) from DMS_ROW_DATA where tran_id =@drd_id )
  //  WHERE tran_id = @drd_id;
  //  UPDATE SPARE_LAB_mst
  //     SET inv_no = @billno , DRD_ID = @drd_id
  //     WHERE TRAN_ID = @tran_id AND EXPORT_TYPE < 3;

  //     --Insert drd into VAS_TEMP for Financial Posting
  //     INSERT INTO VAS_TEMP (TRAN_ID, Export_Type) VALUES (@drd_id, 1);
  //     END;`,
  //         `drop PROCEDURE SevaSprDrdQueryServ`,
  //         `CREATE PROCEDURE SevaSprDrdQueryServ
  //     @tran_id INT,
  //     @location_code INT,
  //     @user_code INT
  // AS
  // BEGIN

  //     DECLARE @billno VARCHAR(255),
  //             @customerName VARCHAR(500),
  //             @remark VARCHAR(500),
  //    @narration VARCHAR(500),
  //             @seq INT,
  //             @drd_id VARCHAR(30),
  //    @rnd_off decimal(19,6),
  //    @total_inv decimal(19,6);
  //    SELECT @total_inv = round(SUM(ROUND(rate, 2) + (ROUND(rate, 2)* gst_value / 100)),0) FROM spare_lab_dtl where tran_id = @tran_id;

  //    SELECT @rnd_off = round(round(SUM(ROUND(rate, 2) + (ROUND(rate, 2)* gst_value / 100)),0)-SUM(ROUND(rate, 2) + (ROUND(rate, 2)* gst_value / 100)),2) FROM spare_lab_dtl where tran_id = @tran_id;

  //     SELECT @seq = ISNULL(MAX(seq_no) + 1, 1)
  //     FROM dms_row_data
  //     WHERE Export_Type < 3 and tran_type collate database_default= (SELECT top 1 book_code FROM spare_lab_mst WHERE tran_id = @tran_id and Export_Type < 3) collate database_default;

  //     SELECT  @drd_id = ISNULL(MAX(tran_id) + 1, 1)
  //     FROM DMS_ROW_DATA;

  //     -- Generate bill number
  //     SELECT @billno = CONCAT(
  //         (SELECT TOP 1 Book_Prefix
  //          FROM book_mst
  //          WHERE book_code  = (SELECT misc_dtl1 FROM misc_mst WHERE misc_code  = (SELECT top 1 book_code FROM spare_lab_mst WHERE tran_id = @tran_id and Export_Type < 3))
  //         ),
  //         @seq
  //     )

  //     -- Get ledger code
  //     SELECT @customerName = (SELECT cust_name FROM SPARE_LAB_MST WHERE TRAN_ID = @tran_id AND EXPORT_TYPE < 3);
  //     SELECT @remark = (SELECT REMARKS FROM SPARE_LAB_MST WHERE TRAN_ID = @tran_id AND EXPORT_TYPE < 3);

  //  SELECT @narration = CONCAT(@customerName, CHAR(13) + CHAR(10), @remark);

  //     -- Insert data into dms_row_data table
  //     INSERT INTO dms_row_data (
  //         Tran_Id,
  //         tran_type,
  //         bill_no,
  //         Bill_Date,
  //         state_code,
  //         Item_Code,
  //         hsn,
  //         Basic_Price,
  //         Disc_1,
  //         Taxable,
  //         CGST_Perc,
  //         SGST_Perc,
  //         IGST_Perc,
  //         CGST,
  //         SGST,
  //         IGST,
  //         Export_Type,
  //         Server_id,
  //         Rnd_Ledg,
  //         Rnd_Off,
  //         inv_amt,
  //         Loc_Code,
  //         Sup_Qty,
  //         Catery,
  //         Item_Type,
  //         Sale_Type,
  //         Chassis,
  //         Engine,
  //         Ledger_Name,
  //   Ledg_Add,
  //         Narration,
  //         GST,
  //         LEDG_ACNT,
  //         Seq_No,
  //         PAN_NO,
  //         Executive,
  //         USR_CODE,
  //         ENTR_DATE,
  //         ENTR_TIME
  //     )
  //     SELECT
  //         @drd_id,
  //         (SELECT top 1 book_code FROM spare_lab_mst WHERE tran_id = @tran_id and Export_Type < 3),
  //         @billno,
  //         (SELECT top 1 INV_DATE FROM spare_lab_mst WHERE tran_id = @tran_id and Export_Type < 3),
  //         (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND misc_type = 3 AND EXPORT_TYPE < 3)),
  //   IIF(tran_type = 'parts', (select top 1 misc_name from misc_mst where misc_code = item_code and misc_type = 604), (select top 1 misc_name from misc_mst where misc_code = item_code and misc_type = 605)),
  //         hsn_code,
  //         rate,
  //         discount,
  //         IIF(quantity IS NULL, 1, quantity) * rate,
  //         IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, GST_VALUE / 2, 0),
  //         IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, GST_VALUE / 2, 0),
  //         IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, 0,GST_VALUE),
  //         ROUND(((IIF(quantity IS NULL, 1, quantity) * rate - DISCOUNT) * IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, GST_VALUE / 2, 0))/100,2),
  //         ROUND(((IIF(quantity IS NULL, 1, quantity) * rate - DISCOUNT) * IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, GST_VALUE / 2, 0))/100,2),
  //         ROUND(((IIF(quantity IS NULL, 1, quantity) * rate - DISCOUNT) * IIF((SELECT State FROM down_mst WHERE dw_code = @location_code AND Export_Type < 3) collate database_default = (SELECT TOP 1 misc_name FROM misc_mst WHERE misc_mst.misc_code = (SELECT TOP 1 State_code FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID and export_type<3) AND misc_type = 3 AND EXPORT_TYPE < 3) collate database_default, 0,GST_VALUE))/100,2),
  //         0,
  //         1,
  //   '23',
  //   @rnd_off,
  //   @total_inv,
  //   --(SELECT TOP 1 TTL_INV_AMNT FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //   @location_code,
  //         IIF(quantity IS NULL, 1, quantity),
  //         0,
  //         IIF(tran_type = 'parts', 2, 3),
  //         IIF(tran_type = 'parts', 'ods', 'Service'),
  //         (SELECT TOP 1 CHASS_NO FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         (SELECT TOP 1 VEHREGNO FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         'VAS SERVICE CUSTOMER CONTROL A/C',
  //   (SELECT TOP 1 CUST_NAME FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         @narration,
  //         (SELECT TOP 1 GST FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         '361634',
  //         @seq,
  //         (SELECT TOP 1 PAN_NO FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         (SELECT TOP 1 SA_TL FROM SPARE_LAB_MST WHERE SPARE_LAB_MST.TRAN_ID = SPARE_LAB_DTL.TRAN_ID AND EXPORT_TYPE < 3),
  //         @user_code,
  //         GETDATE(),
  //         FORMAT(GETDATE(), 'HH.mm')
  //     FROM SPARE_LAB_dtl
  //     WHERE tran_id = @tran_id AND EXPORT_TYPE < 3;
  //         print @billno
  //     -- Update inv_no in SPARE_LAB_mst
  //  UPDATE DMS_ROW_DATA
  //  SET Rnd_Off = inv_amt-(select top 1 sum(taxable + sgst + cgst + igst) from DMS_ROW_DATA where tran_id =@drd_id )
  //  WHERE tran_id = @drd_id;
  //  UPDATE SPARE_LAB_mst
  //     SET inv_no = @billno , DRD_ID = @drd_id
  //     WHERE TRAN_ID = @tran_id AND EXPORT_TYPE < 3;

  //     --Insert drd into VAS_TEMP for Financial Posting
  //     INSERT INTO VAS_TEMP (TRAN_ID, Export_Type) VALUES (@drd_id, 99);
  //     END;`,

  //     ]
  // },
  {
    comments: "Discount",
    ID: 1000,
    queries: [
      `CREATE TABLE Dise_Criteria ( 
                        tran_id INT,
                        optn_id NVARCHAR(255),
                        cell_index int,
                        value NVARCHAR(255),
                        Range_1 INT, 
                        Range_2 INT,
                        color NVARCHAR(50)
                    );`,
      `

                    CREATE TABLE [dbo].[dise_aprvl](
                        [Mob] [varchar](10) NOT NULL,
                        [Pan_No] [varchar](20) NOT NULL,
                        [Cust_Name] [varchar](100) NULL,
                        [Modl_Var] [varchar](20) NOT NULL,
                        [Veh_Clr] [varchar](20) NOT NULL,
                        [Delv_Date] [date] NULL,
                        [Loan] [varchar](20) NOT NULL,
                        [MGA_Amt] [money] NULL,
                        [Insurance] [varchar](10) NOT NULL,
                        [RTO_Chrg] [varchar](20) NOT NULL,
                        [Loyalty_Card] [varchar](20) NOT NULL,
                        [Car_Exch] [varchar](20) NOT NULL,
                        [FastTeg] [varchar](20) NOT NULL,
                        [SRM] [varchar](20) NOT NULL,
                        [RM] [varchar](20) NOT NULL,
                        [Consumer] [money] NULL,
                        [Corporate] [money] NULL,
                        [Exch] [money] NULL,
                        [Aprvl_Offer] [money] NULL,
                        [Dise_Amt] [money] NULL,
                        [Aprvl_By] [varchar](20) NULL,
                        [Status] [varchar](10) NULL,
                        [Remark] [varchar](100) NULL,
                        [Curr_Date] [date] NULL,
                        [location] [varchar](50) NULL,
                        [Approved_amt] [money] NULL,
                        [aprvl_by2] [varchar](50) NULL,
                        [dual_apr] [varchar](2) NULL,
                        [modl_group] [int] NULL,
                        [tran_id] [int] IDENTITY(1,1) NOT NULL,
                        [wa_link] [nvarchar](100) NULL,
                        [apr2_apr] [int] NULL,
                        [export_type] [int] NULL,
                        [remark_dse] [varchar](150) NULL
                        )
                    `,
      "alter table dise_aprvl add[booking_id][varchar](20) NULL;",
      "alter table dise_aprvl add[UTD][varchar](20) NULL;",
      "alter table dise_aprvl add[isapp1][varchar](10) NULL;",
      "alter table dise_aprvl add[is_gd][varchar](10) NULL;",
      "alter table dise_aprvl add[CCP][int] NULL;",
      "alter table dise_aprvl add[EW][int] NULL;",
      "alter table dise_aprvl add[Fuel_Type][varchar](20) NULL;",
      "alter table dise_aprvl add[Var_Cd][varchar](20) NULL;",
      "alter table dise_aprvl add[waiting][int] NULL;",
      "alter table dise_aprvl add[reapp_remark][varchar](100) NULL;",
      "alter table dise_aprvl add[reapp_emp][varchar](20) NULL;",
      "alter table dise_aprvl add[Appr_1_Code][varchar](100) NULL;",
      "alter table dise_aprvl add[Appr_1_Stat][tinyint] NULL;",
      "alter table dise_aprvl add[Appr_1_Rem][varchar](300) NULL;",
      "alter table dise_aprvl add[Appr_2_Code][varchar](100) NULL;",
      "alter table dise_aprvl add[Appr_2_Stat][tinyint] NULL;",
      "alter table dise_aprvl add[Appr_2_Rem][varchar](300) NULL;",
      "alter table dise_aprvl add[Appr_3_Code][varchar](100) NULL;",
      "alter table dise_aprvl add[Appr_3_Stat][tinyint] NULL;",
      "alter table dise_aprvl add[Appr_3_Rem][varchar](300) NULL;",
      "alter table dise_aprvl add[Fin_Appr][tinyint] NULL;",
      "alter table dise_aprvl add[Created_At][datetime] NOT NULL;",
    ],
  },
  {
    comments: "gatepass",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[DIG_GP](
                        [UTD] [int] IDENTITY(1,1) NOT NULL,
                        [GP_TYPE] [int] NULL,
                        [RETURN_STAT] [int] NULL,
                        [OUT_TIME] [datetime] NULL,
                        [IN_TIME] [datetime] NULL,
                        [REASON] [varchar](100) NULL,
                        [REQ_DATE] [datetime] NOT NULL,
                        [APPR_1_CODE_A] [nvarchar](25) NULL,
                        [APPR_1_CODE_B] [nvarchar](25) NULL,
                        [APPR_2_CODE_A] [nvarchar](25) NULL,
                        [APPR_2_CODE_B] [nvarchar](25) NULL,
                        [APPR_3_CODE_A] [nvarchar](25) NULL,
                        [APPR_3_CODE_B] [nvarchar](25) NULL,
                        [APPR_BY_CODE_1] [nvarchar](25) NULL,
                        [APPR_BY_CODE_2] [nvarchar](25) NULL,
                        [APPR_BY_CODE_3] [nvarchar](25) NULL,
                        [APPR_STAT_1] [tinyint] NULL,
                        [APPR_STAT_2] [tinyint] NULL,
                        [APPR_STAT_3] [tinyint] NULL,
                        [ACT_OUT_TIME] [time](7) NULL,
                        [ACT_IN_TIME] [time](7) NULL,
                        [EMPCODE] [varchar](50) NULL,
                        [EMP_NAME] [varchar](100) NULL,
                        [FINAL_STAT] [varchar](1) NULL,
                    PRIMARY KEY CLUSTERED 
                    (
                        [UTD] ASC
                    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
                    ) ON [PRIMARY]
                    
                    
                    ALTER TABLE [dbo].[DIG_GP] ADD  DEFAULT (getdate()) FOR [REQ_DATE]
                    
                    `,
    ],
  },
  {
    comments: "Messages",
    ID: 1000,
    queries: [
      `
                    CREATE TABLE [dbo].[MessageLog](
                        [msg_id] [int] IDENTITY(1,1) NOT NULL,
                        [messageDesc] [varchar](max) NULL,
                        [msgReceiverId] [varchar](20) NULL,
                        [msgSenderId] [varchar](20) NULL,
                        [msgTime] [datetime] NULL,
                        [msgTitle] [varchar](255) NULL,
                        [msgSenderName] [varchar](255) NULL,
                        [msgReceiverName] [varchar](255) NULL,
                    PRIMARY KEY CLUSTERED 
                    (
                        [msg_id] ASC
                    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
                    ) ON [PRIMARY] TEXTIMAGE_ON 
                    [PRIMARY]
                    
                    
                    ALTER TABLE [dbo].[MessageLog] ADD  DEFAULT (getdate()) FOR [msgTime]
                    
                    `,
    ],
  },
  {
    comments: "Attendance table",
    ID: 1000,
    queries: [
      "ALTER TABLE attendancetable ADD Appr_1_Code VARCHAR(20);",
      "ALTER TABLE attendancetable ADD Appr_1_Stat int;",
      "ALTER TABLE attendancetable ADD Appr_1_Rem VARCHAR(255);",
      "ALTER TABLE attendancetable ADD Appr_2_Code VARCHAR(20);",
      "ALTER TABLE attendancetable ADD Appr_2_Stat int;",
      "ALTER TABLE attendancetable ADD Appr_2_Rem VARCHAR(255);",
      "ALTER TABLE attendancetable ADD Appr_3_Code VARCHAR(20);",
      "ALTER TABLE attendancetable ADD Appr_3_Stat int;",
      "ALTER TABLE attendancetable ADD Appr_3_Rem VARCHAR(255);",
      "ALTER TABLE attendancetable ADD Mi_Type int;",
      "ALTER TABLE attendancetable ADD UTD INT IDENTITY(1,1) PRIMARY KEY;",
      `CREATE TABLE [dbo].[Employee_AtnStatus](
                            [Utd] [int] IDENTITY(1,1) NOT NULL,
                            [Status] [varchar](50) NULL,
                            [Present] [int] NULL,
                            [Absent] [int] NULL,
                            [HalfDay] [int] NULL,
                            [WeekOff] [int] NULL,
                            [Relaxation] [int] NULL,
                            [Holiday] [int] NULL,
                            [colorCode] [varchar](10) NULL,
                            [Created_At] [datetime] NULL,
                            [Created_By] [varchar](255) NULL,
                            [Value] [decimal](10, 2) NULL,
                            [Present_Value] [decimal](10, 2) NULL,
                            [Absent_Value] [decimal](10, 2) NULL,
                            [HalfDay_Value] [decimal](10, 2) NULL,
                            [WeekOff_Value] [decimal](10, 2) NULL,
                            [Relaxation_Value] [decimal](10, 2) NULL,
                            [Holiday_Value] [decimal](10, 2) NULL,
                        ) ON [PRIMARY]

                        ALTER TABLE [dbo].[Employee_AtnStatus] ADD  DEFAULT (getdate()) FOR [Created_At]
                        `,
      `alter table Employee_AtnStatus add [penalty_days] [decimal](19, 2) NULL`,
    ],
  },
  {
    comments: "Approval matrix",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[Approval_Matrix](
                            [UTD] [int] IDENTITY(1,1) NOT NULL,
                            [module_code] [varchar](20) NULL,
                            [empcode] [varchar](20) NULL,
                            [approver1_A] [varchar](20) NULL,
                            [approver1_B] [varchar](20) NULL,
                            [approver2_A] [varchar](20) NULL,
                            [approver2_B] [varchar](20) NULL,
                            [approver3_A] [varchar](25) NULL,
                            [approver3_B] [varchar](25) NULL,
                            [Created_At] [datetime] NOT NULL,
                            [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                            [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                            [Created_by] [varchar](30) NULL,
                        PRIMARY KEY CLUSTERED 
                        (
                            [UTD] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                            PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                        ) ON [PRIMARY]
                        WITH
                        (
                        SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Approval_Matrix_Hst])
                        )
                        
                        
                        ALTER TABLE [dbo].[Approval_Matrix] ADD  DEFAULT (getdate()) FOR [Created_At]
                        
                        
                        ALTER TABLE [dbo].[Approval_Matrix] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                        
                        `,
    ],
  },
  {
    comments: "emp track",
    ID: 1000,
    queries: [
      "alter table EMP_TRACK add ID int identity(1,1)",
      "alter table EMP_TRACK add TRACK_DATETIME datetime default getdate()",
      "alter table EMP_TRACK add [GEO_LOCATION] [nvarchar](100) NULL",
    ],
  },
  {
    comments: "Travel",
    ID: 1000,
    queries: [
      "ALTER TABLE TRAVEL_DTL add [Remark] [varchar](200) NULL;",
      "ALTER TABLE TRAVEL_DTL add [Appr_1_Code] [varchar](100) NULL;",
      "ALTER TABLE TRAVEL_DTL add [Appr_2_Code] [varchar](100) NULL;",
      "ALTER TABLE TRAVEL_DTL add [Appr_3_Code] [varchar](100) NULL;",
      "ALTER TABLE TRAVEL_DTL add [Appr_3_Stat] [tinyint] NULL;",
      "ALTER TABLE TRAVEL_DTL add [Appr_2_Stat] [tinyint] NULL;",
      "ALTER TABLE TRAVEL_DTL add [Appr_1_Stat] [tinyint] NULL;",
      "ALTER TABLE TRAVEL_DTL add [Appr_1_Rem] [varchar](300) NULL;",
      "ALTER TABLE TRAVEL_DTL add [Appr_2_Rem] [varchar](300) NULL;",
      "ALTER TABLE TRAVEL_DTL add [Appr_3_Rem] [varchar](300) NULL;",
      "ALTER TABLE TRAVEL_DTL add [Fin_Appr] [tinyint] NULL;",
    ],
  },
  {
    comments: "demo car gatepass",
    ID: 1000,
    queries: [
      `

                    CREATE TABLE [dbo].[Demo_Car_Gatepass](
                      [UTD] [int] IDENTITY(1,1) NOT NULL,
                      [EMPCODE] [varchar](50) NULL,
                      [EMP_NAME] [varchar](100) NULL,
                      [GP_TYPE] [int] NULL,
                      [CUSTOMER_NAME] [varchar](100) NULL,
                      [CUSTOMER_MOBILE] [varchar](100) NULL,
                      [DRIVER_CODE] [varchar](100) NULL,
                      [VEH_REG] [varchar](20) NULL,
                      [MODEL_CODE] [varchar](100) NULL,
                      [REQ_DATE] [datetime] NOT NULL,
                      [ACT_OUT_TIME] [time](7) NULL,
                      [ACT_IN_TIME] [time](7) NULL,
                      [KM] [float] NULL,
                      [LAST_KM] [float] NULL,
                      [OUT_TIME] [datetime] NULL,
                      [IN_TIME] [datetime] NULL,
                      [REMARK] [varchar](100) NULL,
                      [GUARD_CODE] [varchar](50) NULL,
                      [GUARD_CODE_IN] [varchar](255) NULL,
                      [Out_Image] [varchar](100) NULL,
                      [In_Image] [varchar](100) NULL,
                      [Appr_1_Code] [varchar](100) NULL,
                      [Appr_1_Stat] [tinyint] NULL,
                      [Appr_1_Rem] [varchar](300) NULL,
                      [Appr_2_Code] [varchar](100) NULL,
                      [Appr_2_Stat] [tinyint] NULL,
                      [Appr_2_Rem] [varchar](300) NULL,
                      [Appr_3_Code] [varchar](100) NULL,
                      [Appr_3_Stat] [tinyint] NULL,
                      [Appr_3_Rem] [varchar](300) NULL,
                      [Fin_Appr] [tinyint] NULL,
                      [LOC_CODE] [varchar](20) NULL,
                      [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                      [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                    PRIMARY KEY CLUSTERED 
                    (
                  [UTD] ASC
                      )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                        PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                      ) ON [PRIMARY]
                      WITH
                      (
                          SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Demo_Car_Gatepass_hst])
                      )`,
      `ALTER TABLE [dbo].[Demo_Car_Gatepass] ADD  DEFAULT (getdate()) FOR [REQ_DATE]`,
    ],
  },
  {
    comments: "Petty cash",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[PETTY_CASH](
                            [UTD] [int] IDENTITY(1,1) NOT NULL,
                            [Requested_Date] [datetime] NOT NULL,
                            [EmpCode] [nvarchar](20) NULL,
                            [Req_Amount] [money] NULL,
                            [Apr_Amt] [money] NULL,
                            [Purpose] [nvarchar](300) NULL,
                            [Remark] [nvarchar](300) NULL,
                            [Loc_Code] [int] NULL,
                            [Pymt_Mode] [int] NULL,
                            [Status] [varchar](50) NULL,
                            [Created_At] [datetime] NOT NULL,
                            [Remark1] [varchar](100) NULL,
                            [Remark2] [varchar](100) NULL,
                            [Remark3] [varchar](100) NULL,
                            [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                            [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                            [Created_by] [varchar](50) NULL,
                        PRIMARY KEY CLUSTERED 
                        (
                            [UTD] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                            PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                        ) ON [PRIMARY]
                        WITH
                        (
                        SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[PETTY_CASH__HST])
                        )
                        
                        ALTER TABLE [dbo].[PETTY_CASH] ADD  DEFAULT (getdate()) FOR [Requested_Date]
                        
                        ALTER TABLE [dbo].[PETTY_CASH] ADD  DEFAULT (getdate()) FOR [Created_At]
                        
                        ALTER TABLE [dbo].[PETTY_CASH] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                        
                        `,
    ],
  },
  {
    comments: "BUDGET",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[BUDGET](
                            [Utd] [int] IDENTITY(1,1) NOT NULL,
                            [TYPE] [nvarchar](40) NULL,
                            [CATERY] [nvarchar](40) NOT NULL,
                            [LOC_CODE] [int] NULL,
                            [UNIT] [int] NULL,
                            [VALUE] [money] NULL,
                            [Created_by] [nvarchar](30) NOT NULL,
                            [Created_At] [datetime] NOT NULL,
                            [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                            [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                        PRIMARY KEY CLUSTERED 
                        (
                            [Utd] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                            PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                        ) ON [PRIMARY]
                        WITH
                        (
                        SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[BUDGET_Hst])
                        )
                        
                        
                        ALTER TABLE [dbo].[BUDGET] ADD  DEFAULT (getdate()) FOR [Created_At]
                        
                        
                        ALTER TABLE [dbo].[BUDGET] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                        
                        `,
    ],
  },
  {
    comments: "Expense Approval",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[Expense_Approval_Matrix](
                            [UTD] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
                            [Branch_Code] [int] NOT NULL,
                            [Approver_1A] [int] NULL,
                            [Approver_1B] [int] NULL,
                            [Approver_1C] [int] NULL,
                            [Approver_2A] [int] NULL,
                            [Approver_2B] [int] NULL,
                            [Approver_2C] [int] NULL,
                            [Approver_3A] [int] NULL,
                            [Approver_3B] [int] NULL,
                            [Approver_3C] [int] NULL,
                            [Created_By] [int] NULL,
                            [Created_At] [datetime] NOT NULL DEFAULT GETDATE(),
                            [ValidFrom] DATETIME2 GENERATED ALWAYS AS ROW START DEFAULT GETDATE(),
                            [ValidTo] DATETIME2 GENERATED ALWAYS AS ROW END,
                            PERIOD FOR SYSTEM_TIME(ValidFrom, ValidTo)
                        )
                        WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.Expense_Approval_Matrix_Hst));
                        `,
      `CREATE TABLE [dbo].[Expense_Approval](
                            [UTD] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
                            [Drd_Id] [int] NOT NULL,
                            [Acnt_Id] [int] NULL,
                            [Utr_no] [varchar](100),
                            [Utr_Date] [date],
                            [Autovyn_Pymt_Vch] varchar(300),
                            [Pymt_Done] [tinyint] NULL,
                            [Appr_1_Code] [int] NULL,
                            [Appr_1_Stat] [tinyint] NULL,
                            [Appr_1_Rem] [varchar](300) NULL,
                            [Appr_2_Code] [int] NULL,
                            [Appr_2_Stat] [tinyint] NULL,
                            [Appr_2_Rem] [varchar](300) NULL,
                            [Appr_3_Code] [int] NULL,
                            [Appr_3_Stat] [tinyint] NULL,
                            [Appr_3_Rem] [varchar](300) NULL,
                            [Fin_Appr] [tinyint] NULL,
                            [Created_By] [int] NULL,
                            [Created_At] [datetime] NOT NULL DEFAULT GETDATE(),
                            [ValidFrom] DATETIME2 GENERATED ALWAYS AS ROW START DEFAULT GETDATE(),
                            [ValidTo] DATETIME2 GENERATED ALWAYS AS ROW END,
                            PERIOD FOR SYSTEM_TIME(ValidFrom, ValidTo)
                        )
                        WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.Expense_Approval_Hst));
                        `,
      `alter table Expense_Approval_Matrix ADD module nvarchar(50)`,
    ],
  },
  {
    comments: "Expense Management",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[Expense_Template](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Template_Id] [int] NOT NULL,
              [Template_Name] [varchar](100) NOT NULL,
              [Field_Name] [varchar](255) NOT NULL,
              [Field_Type] [varchar](255) NULL,
              [Field_Req] [int] NULL,
              [Field_Attr] [int] NULL,
              [Table_field] [varchar](30) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Export_type] [int] NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Expense_Template_Hst])
            )
            ALTER TABLE [dbo].[Expense_Template] ADD  DEFAULT (getdate()) FOR [Created_At]
            ALTER TABLE [dbo].[Expense_Template] ADD  DEFAULT (getdate()) FOR [ValidFrom]
            `,
      `CREATE TABLE [dbo].[Expense_Mng](
              [Expense_Id] [int] IDENTITY(1,1) NOT NULL,
              [Template_Id] [int] NOT NULL,
              [REMARK] [varchar](100) NULL,
              [EMP_CODE] [varchar](30) NULL,
              [LOCATION] [varchar](20) NULL,
              [Appr_1_Code] [varchar](30) NULL,
              [Appr_1_Stat] [tinyint] NULL,
              [Appr_1_Rem] [varchar](300) NULL,
              [Appr_2_Code] [varchar](30) NULL,
              [Appr_2_Stat] [tinyint] NULL,
              [Appr_2_Rem] [varchar](300) NULL,
              [Appr_3_Code] [varchar](30) NULL,
              [Appr_3_Stat] [tinyint] NULL,
              [Appr_3_Rem] [varchar](300) NULL,
              [Fin_Appr] [tinyint] NULL,
              [Created_By] [varchar](30) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [Expense_Id] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Expense_Mng_Hst])
            )
            ALTER TABLE [dbo].[Expense_Mng] ADD  DEFAULT (getdate()) FOR [Created_At]
            ALTER TABLE [dbo].[Expense_Mng] ADD  DEFAULT (getdate()) FOR [ValidFrom]
            `,
      `CREATE TABLE [dbo].[Expense_Mng_Dtl](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Expense_Id] [int] NOT NULL,
              [Template_Id] [int] NOT NULL,
              [DESCRIPTION] [varchar](100) NULL,
              [LOCATION] [varchar](255) NULL,
              [RATE] [decimal](19, 2) NULL,
              [QTY] [decimal](19, 2) NULL,
              [AMOUNT] [decimal](19, 2) NULL,
              [F_1] [varchar](150) NULL,
              [F_2] [varchar](150) NULL,
              [F_3] [varchar](150) NULL,
              [F_4] [varchar](150) NULL,
              [F_5] [varchar](150) NULL,
              [F_6] [varchar](150) NULL,
              [F_7] [varchar](150) NULL,
              [F_8] [varchar](150) NULL,
              [F_9] [varchar](150) NULL,
              [F_10] [varchar](150) NULL,
              [Export_type] [int] NULL,
              [Created_By] [varchar](30) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Expense_Mng_Dtl_Hst])
            )
            ALTER TABLE [dbo].[Expense_Mng_Dtl] ADD  DEFAULT (getdate()) FOR [Created_At]
            ALTER TABLE [dbo].[Expense_Mng_Dtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]
            `,
    ],
  },
  {
    comments: "mandatory fields",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[Mandatory_Fields](
                            [Utd] [int] IDENTITY(1,1) NOT NULL,
                            [Form_Name] [varchar](255) NOT NULL,
                            [Field_Name] [varchar](255) NOT NULL,
                            [Label_Id] [varchar](255) NULL,
                            [Field_Id] [varchar](255) NOT NULL,
                            [Table_ColumnName] [varchar](255) NULL,
                            [Is_Mandatory] [bit] NOT NULL,
                            [created_by] [varchar](255) NULL,
                            [created_at] [datetime] NOT NULL,
                            [Is_Image] [int] NULL,
                        PRIMARY KEY CLUSTERED 
                        (
                            [Utd] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
                        ) ON [PRIMARY]
                        
                        
                        ALTER TABLE [dbo].[Mandatory_Fields] ADD  DEFAULT (getdate()) FOR [created_at]
                        `,
      `drop PROCEDURE CheckMandatoryFields`,
      `CREATE PROCEDURE CheckMandatoryFields  
                        @empCode VARCHAR(50)  
                    AS  
                    BEGIN  
                    DECLARE @sql NVARCHAR(MAX) = '';
                    SELECT @sql = @sql + 
                      'SELECT IIF(' + Table_ColumnName + ' IS NULL OR ' + Table_ColumnName + ' = '''', 1, 0) AS result, ' + 
                      CAST(Utd AS NVARCHAR) + ' AS Utd, ''' + Field_Name + ''' AS Field_Name, ''' + Label_Id + ''' AS Label_Id, ''' + Field_Id + ''' AS Field_Id, ''' + Table_ColumnName + ''' AS Table_ColumnName, ' + 
                      CAST(Is_Mandatory AS NVARCHAR) + ' AS Is_Mandatory FROM employeemaster WHERE empcode  collate database_default = ''' + @empCode + ''' collate database_default UNION ALL ' 
                    FROM Mandatory_Fields
                    WHERE Is_Image = 0 AND Is_Mandatory = 1;
                    
                    select @sql = @sql + 
                      'SELECT IIF((
                      select DOC_PATH from EMP_DOCS where EMP_CODE collate database_default = empcode collate database_default and columndoc_type = ''EMPLOYEE'' and misspunch_inout = ' + Table_ColumnName + ' 
                    ) IS NULL OR (
                      select DOC_PATH from EMP_DOCS where EMP_CODE collate database_default = empcode collate database_default and columndoc_type = ''EMPLOYEE'' and misspunch_inout = ' + Table_ColumnName + ' 
                    ) = '''', 1, 0) AS result, ' + 
                      CAST(Utd AS NVARCHAR) + ' AS Utd, ''' + Field_Name + ''' AS Field_Name, ''' + Label_Id + ''' AS Label_Id, ''' + Field_Id + ''' AS Field_Id, ''' + Table_ColumnName + ''' AS Table_ColumnName, ' + 
                      CAST(Is_Mandatory AS NVARCHAR) + ' AS Is_Mandatory FROM employeemaster WHERE empcode collate database_default = ''' + @empCode + ''' collate database_default UNION ALL ' 
                    FROM Mandatory_Fields
                    WHERE Is_Image = 1 AND Is_Mandatory = 1;
                    
                    IF LEN(@sql) >= LEN(' UNION ALL ')
                    SET @sql = LEFT(@sql, LEN(@sql) - LEN(' UNION ALL '));
                IF LEN(@sql) >= LEN(' UNION ALL ')
                set @sql = 'select * from ('+ @sql +') as dg where result = 1 and Is_Mandatory = 1';
                ELSE set @sql = 'select top 0  1 as result,	Utd	,Field_Name	,Label_Id	,Field_Id	,Table_ColumnName	,Is_Mandatory from Mandatory_Fields'	
                print @sql;
                EXEC sp_executesql @sql;
                  END;`,
    ],
  },
  {
    comments: "Loan Advance",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[Advance_Mst](
                            [UTD] [int] IDENTITY(1,1) NOT NULL,
                            [EMPCODE] [varchar](50) NULL,
                            [SRNO] [int] NULL,
                            [REQUEST_DATE] [date] NULL,
                            [TRAN_TYPE] [varchar](25) NULL,
                            [REQ_AMOUNT] [money] NULL,
                            [SANC_AMOUNT] [money] NULL,
                            [TENURE_MONTH] [int] NULL,
                            [REPAYMENT_START_DATE] [date] NULL,
                            [PENDING_BAL] [money] NULL,
                            [TOTAL_RECIEVED] [money] NULL,
                            [APPR_1_CODE] [varchar](25) NULL,
                            [APPR_1_DATE] [date] NULL,
                            [APPR_2_CODE] [varchar](25) NULL,
                            [APPR_2_DATE] [date] NULL,
                            [APPR_3_CODE] [varchar](25) NULL,
                            [APPR_3_DATE] [date] NULL,
                            [APPR_1_STATUS] [smallint] NULL,
                            [APPR_2_STATUS] [smallint] NULL,
                            [APPR_3_STATUS] [smallint] NULL,
                            [FINAL_APPRV] [smallint] NULL,
                            [REPAYMENT_DONE] [smallint] NULL,
                            [LOC_CODE] [int] NULL,
                            [CREATED_BY] [varchar](200) NULL,
                            [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                            [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                            [Reason] [varchar](300) NULL,
                            [appr_1_remark] [varchar](400) NULL,
                            [appr_2_remark] [varchar](400) NULL,
                            [appr_3_remark] [varchar](400) NULL,
                            [account_remark] [varchar](300) NULL,
                        PRIMARY KEY CLUSTERED 
                        (
                            [UTD] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                            PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                        ) ON [PRIMARY]
                        WITH
                        (
                        SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Advance_Mst_Hst])
                        )
                        
                        
                        ALTER TABLE [dbo].[Advance_Mst] ADD  DEFAULT (getdate()) FOR [REQUEST_DATE]
                        
                        
                        ALTER TABLE [dbo].[Advance_Mst] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                        `,
      `CREATE TABLE [dbo].[Advance_Dtl](
                            [UTD] [int] IDENTITY(1,1) NOT NULL,
                            [TRAN_ID] [int] NULL,
                            [INO] [int] NULL,
                            [INST_DATE] [date] NULL,
                            [INST_AMT] [money] NULL,
                            [REM_BAL] [money] NULL,
                            [PYMT_RECVD] [smallint] NULL,
                            [PYMT_REC_DATE] [date] NULL,
                            [CREATED_BY] [varchar](200) NULL,
                            [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                            [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                        PRIMARY KEY CLUSTERED 
                        (
                            [UTD] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                            PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                        ) ON [PRIMARY]
                        WITH
                        (
                        SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Advance_Dtl_Hst])
                        )
                        
                        
                        ALTER TABLE [dbo].[Advance_Dtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                        `,
    ],
  },
  {
    comments: "Booking Refund",
    ID: 1000,
    queries: [
      `CREATE TABLE [dbo].[Booking_Refund](
                            [Tran_id] [int] IDENTITY(1,1) NOT NULL,
                            [SRM] [varchar](20) NOT NULL,
                            [location] [varchar](50) NULL,
                            [export_type] [int] NULL,
                            [remark_dse] [varchar](150) NULL,
                            [booking_id] [varchar](20) NULL,
                            [UTD] [varchar](20) NULL,
                            [Appr_1_Code] [varchar](100) NULL,
                            [Appr_1_Stat] [tinyint] NULL,
                            [Appr_1_Rem] [varchar](300) NULL,
                            [Appr_2_Code] [varchar](100) NULL,
                            [Appr_2_Stat] [tinyint] NULL,
                            [Appr_2_Rem] [varchar](300) NULL,
                            [Appr_3_Code] [varchar](100) NULL,
                            [Appr_3_Stat] [tinyint] NULL,
                            [Appr_3_Rem] [varchar](300) NULL,
                            [Fin_Appr] [tinyint] NULL,
                            [Created_date] [date] NULL,
                            [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                            [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                            [Dms_Code] [varchar](20) NULL,
                            [Created_by] [varchar](40) NULL,
                            [is_gd] [tinyint] NULL,
                            [Booking_Amt] [decimal](19, 2) NULL,
                            [Approved_Amt] [decimal](19, 2) NULL,
                            [Refund_id] [varchar](50) NULL,
                        PRIMARY KEY CLUSTERED 
                        (
                            [Tran_id] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                            PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
                        ) ON [PRIMARY]
                        WITH
                        (
                        SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Booking_Refund_Hst])
                        )
                        ALTER TABLE [dbo].[Booking_Refund] ADD  DEFAULT (getdate()) FOR [Created_date]
                        ALTER TABLE [dbo].[Booking_Refund] ADD  DEFAULT (getdate()) FOR [ValidFrom]          
                        `,
      `alter table booking_refund add 	[Booking_Amt_Actual] [decimal](19, 2) NULL;`,
      `alter table booking_refund add 	[Adnl_Amt] [decimal](19, 2) NULL;`,
      `alter table booking_refund add 	[Cncl_Charges] [decimal](19, 2) NULL;`,
      `alter table booking_refund add 	[Final_Amount] [decimal](19, 2) NULL;`,
    ],
  },
  {
    comments: "mandatory Inserts",
    ID: 1000,
    queries: [
      `IF NOT EXISTS (SELECT 1 FROM user_tbl WHERE user_code = 1 AND user_name = 'ADMIN' AND module_code = 10 AND export_type = 1)
                        BEGIN
                            INSERT INTO user_tbl (user_code, user_name, user_pwd, module_code, multi_loc, export_type, serverid)
                            VALUES (1, 'ADMIN', 'user@123', 10, 1, 1, 1)
                        END            
                        `,
      `IF NOT EXISTS (SELECT 1 FROM rights WHERE  User_Code = 1 AND Optn_Name = 'O_ADDUSER' AND Optn_Valu = 1 AND Module_Code = 10)
                        BEGIN
                            INSERT INTO rights (Comp_Code, User_Code, Optn_Name, Optn_Valu, Module_Code, LOC_CODE, USR_CODE, SERVERID)
                            VALUES (1, 1, 'O_ADDUSER', 1, 10, NULL, NULL, 0)
                        END
                        `,
      `IF NOT EXISTS (SELECT 1 FROM user_rights WHERE user_code = 1 AND module_code = 10 AND optn_name = '8.1.1')
                        BEGIN
                            INSERT INTO user_rights (user_code, module_code, optn_name)
                            VALUES (1, 10, '8.1.1')
                        END
                        `,
      `IF NOT EXISTS (SELECT top 1 1 FROM comp_keydata)
                        BEGIN
                            INSERT INTO comp_keydata (Comp_Code	,M1	,M2	,M3	,M4	,M5	,M6	,M7,M8,	M9,	M10,M11,DISC_DUAL_APRVL,DUAL_APRVL_MSG)
							VALUES (1,1,1,1,1,1,1,1,1,1,1,1,1,1)
                        END
                        `,
      `DECLARE @MandatoryFields TABLE (
                            Utd INT,
                            Form_Name NVARCHAR(255),
                            Field_Name NVARCHAR(255),
                            Label_Id NVARCHAR(255),
                            Field_Id NVARCHAR(255),
                            Table_ColumnName NVARCHAR(255),
                            Is_Mandatory BIT,
                            created_by NVARCHAR(255),
                            created_at DATETIME,
                            Is_Image BIT
                        );

                        INSERT INTO @MandatoryFields (Utd, Form_Name, Field_Name, Label_Id, Field_Id, Table_ColumnName, Is_Mandatory, created_by, created_at, Is_Image)
                        VALUES
                        (1, 'ProfileUpdateMobile', 'Mobile Number', 'input_layout_mobile', 'edtMobileNumber', 'MOBILENO', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (2, 'ProfileUpdateMobile', 'Land Line', 'inputLandLine', 'edtLandLineNumber', 'landline_no', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (3, 'ProfileUpdateMobile', 'Company Email', 'input_layout_email', 'edtEmail', 'CORPORATEMAILID', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (4, 'ProfileUpdateMobile', 'Personal Email', 'input_layout_AlternateEmail', 'edtAlternateEmail', 'ALTERNET_MAIL', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (5, 'ProfileUpdateMobile', 'Gender', 'txtGender', 'spinGender', 'GENDER', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (6, 'ProfileUpdateMobile', 'DOB', 'input_layout_DOB', 'edtDOB', 'DOB', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (7, 'ProfileUpdateMobile', 'Marital Status', 'txtMaritalStatus', 'spinMaritalStatus', 'MARITALSTATUS', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (8, 'ProfileUpdateMobile', 'DOM', 'input_layout_DOM', 'edtDOM', 'DOM', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (9, 'ProfileUpdateMobile', 'Father Name', 'input_layout_fatherName', 'edtFatherName', 'FATHERNAME', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (10, 'ProfileUpdateMobile', 'Father Occupation', 'txtFatherOccupation', 'spinFatherOccupation', 'FATHEROCCUPATION', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (11, 'ProfileUpdateMobile', 'Father Mobile', 'inputFatherMobile', 'edtFatherMobile', 'Father_Mob', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (12, 'ProfileUpdateMobile', 'Mother Name', 'inputMotherName', 'edtMotherName', 'MOTHERNAME', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (13, 'ProfileUpdateMobile', 'Mother Mobile', 'inputMotherMobile', 'edtMotherMobile', 'Mother_Mob', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (14, 'ProfileUpdateMobile', 'Spouse Name', 'inputSpouseName', 'edtSpouseName', 'SPOUSENAME', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (15, 'ProfileUpdateMobile', 'Spouse Mobile', 'inputSpouseMobile', 'edtSpouseMobile', 'Spouse_Mob', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (16, 'ProfileUpdateMobile', 'Spouse Gender', 'txtSpouseGender', 'spinSpouseGender', 'SPOUSEGENDER', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (17, 'ProfileUpdateMobile', 'Sibling Name', 'inputSiblingName', 'edtSiblingName', 'SIBLINGNAME', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (18, 'ProfileUpdateMobile', 'Sibling Mobile', 'inputSiblingMobile', 'edtSiblingMobile', 'SIBLINGCONTACTNO', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (19, 'ProfileUpdateMobile', 'Emergency Name', 'inputEmergencyName', 'edtEmergencyName', 'EMERGENCYNAME', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (20, 'ProfileUpdateMobile', 'Emergency Mobile', 'inputEmergencyMobile', 'edtEmergencyMobile', 'EMERGENCYNO', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (21, 'ProfileUpdateMobile', 'PAN NO', 'input_layout_PANNO', 'edtPANNO', 'PANNO', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (22, 'ProfileUpdateMobile', 'Aadhar No', 'input_layout_ADHARNO', 'edtADHARNO', 'uid_no', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (23, 'ProfileUpdateMobile', 'Permanent Address 1', 'inputPermanentAddress1', 'edtPermanentAddress1', 'PERMANENTADDRESS1', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (24, 'ProfileUpdateMobile', 'Permanent Address 2', 'inputPermanentAddress2', 'edtPermanentAddress2', 'PERMANENTADDRESS2', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (25, 'ProfileUpdateMobile', 'Permanent City', 'txtPCity', 'spinPCity', 'PCITY', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (26, 'ProfileUpdateMobile', 'Permanent State', 'txtPState', 'spinPState', 'PSTATE', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (27, 'ProfileUpdateMobile', 'Permanent Pincode', 'inputPermanentPincode', 'edtPermanentPincode', 'PPINCODE', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (28, 'ProfileUpdateMobile', 'Current Address 1', 'inputCurrentAddress1', 'edtCurrentAddress1', 'CURRENTADDRESS1', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (29, 'ProfileUpdateMobile', 'Current Address 2', 'inputCurrentAddress2', 'edtCurrentAddress2', 'CURRENTADDRESS2', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (30, 'ProfileUpdateMobile', 'Current City', 'txtCCity', 'spinCCity', 'CCITY', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (31, 'ProfileUpdateMobile', 'Current State', 'txtCState', 'spinCState', 'CSTATE', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (32, 'ProfileUpdateMobile', 'CurrentPincode', 'inputCurrentPincode', 'edtCurrentPincode', 'CPINCODE', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (33, 'ProfileUpdateMobile', 'Blood Group', 'txtBloodGroup', 'spinBloodGroup', 'BLOODGROUP', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (34, 'ProfileUpdateMobile', 'Skills', 'inputSKILLS', 'edtSkills', 'SKILLS', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (37, 'ProfileUpdateMobile', 'Previous Company', 'inputPreviousCompanyName', 'edtPreviousCompanyName', 'PREVIOUSCOMPANYNAME', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (38, 'ProfileUpdateMobile', 'Previous Company Contact', 'inputPreviousCompanyContact', 'edtPreviousCompanyContact', 'PRECOMPCONTACTNO', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (39, 'ProfileUpdateMobile', 'Previous Company City', 'txtPreCity', 'spinPreviousCompanyCity', 'PRECOMPCITY', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (40, 'ProfileUpdateMobile', 'Previous Joining', 'inputPreviousJoiningDate', 'edtPreviousJoiningDate', 'PREJOININGDATE', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (41, 'ProfileUpdateMobile', 'Previous Leaving', 'inputPreviousEndDate', 'edtPreviousEndDate', 'PREENDDATE', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (42, 'ProfileUpdateMobile', 'Previous Designation', 'inputPreviousDesignation', 'edtPreviousDesignation', 'PREDESIGNATION', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (43, 'ProfileUpdateMobile', 'Passport No', 'inputPassportNo', 'edtPassportNo', 'PASSPORTNO', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (44, 'ProfileUpdateMobile', 'Passport Expiry', 'input_layout_PassportExpiryDate', 'edtPassportExpiryDate', 'PASSEXPIRYDATE', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (45, 'ProfileUpdateMobile', 'PF', 'input_layout_Pfnumber', 'edtPfnumber', 'pfnumber', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (46, 'ProfileUpdateMobile', 'ESI No', 'input_layout_Esinumber', 'edtEsinumber', 'esinumber', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (47, 'ProfileUpdateMobile', 'Driving License Number', 'inputDrivingLicNumber', 'edtDrivingLicNumber', 'driving_licence', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (48, 'ProfileUpdateMobile', 'Driving License Date', 'inputDrivingLicDate', 'edtDrivingLicDate', 'DRIVINGLIC_ISSUEDATE', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (49, 'ProfileUpdateMobile', 'Driving License', 'inputDrivingLicPlace', 'edtDrivingLicPlace', 'DRIVINGLIC_ISSUEPALACE', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (50, 'ProfileUpdateMobile', 'Employee Height', 'inputEmployeeHeight', 'edtEmployeeHeight', 'EMPHEIGHT', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (51, 'ProfileUpdateMobile', 'Employee Weight', 'inputEmployeeWeight', 'edtEmployeeWeight', 'EMPWEIGHT', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (52, 'ProfileUpdateMobile', 'Children Detail', 'inputChildrenDetail', 'edtChildrenDetail', 'CHILDREN_DETAIL', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (53, 'ProfileUpdateMobile', 'Language Known', 'inputLanguageDetail', 'edtLanguageDetail', 'LANGUAGE_DETAIL', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (54, 'ProfileUpdateMobile', 'Religion', 'txtReligion', 'spinReligion', 'relcode', 0, NULL, '2024-04-18 11:48:05.843', 0),
                        (55, 'ProfileUpdateMobile', 'Upload Aadhar Card Image', 'imgAadharCont', 'imgSelectAadhar', '2', 0, NULL, '2024-04-18 11:48:05.843', 1),
                        (56, 'ProfileUpdateMobile', 'Upload PAN Card Image', 'imgPANCont', 'imgSelectPAN', '3', 0, NULL, '2024-04-18 11:48:05.843', 1),
                        (57, 'ProfileUpdateMobile', 'Upload Salary Slip Image', 'imgSalarySlipCont', 'imgSelectSalarySlip', '4', 0, NULL, '2024-04-18 11:48:05.843', 1),
                        (58, 'ProfileUpdateMobile', 'Upload Other Document', 'imgOtherCont', 'imgSelectOther', '5', 0, NULL, '2024-04-18 11:48:05.843', 1),
                        (59, 'ProfileUpdateMobile', 'Profile Image', 'imgProfileCont', 'imgSelectProfile', '1', 0, NULL, '2024-04-18 11:48:05.843', 1);

                        -- Insert data if not exists
                        INSERT INTO Mandatory_Fields (Form_Name, Field_Name, Label_Id, Field_Id, Table_ColumnName, Is_Mandatory, created_by, created_at, Is_Image)
                        SELECT d.Form_Name, d.Field_Name, d.Label_Id, d.Field_Id, d.Table_ColumnName, d.Is_Mandatory, d.created_by, d.created_at, d.Is_Image
                        FROM @MandatoryFields d
                        WHERE NOT EXISTS (
                            SELECT 1
                            FROM Mandatory_Fields m
                            WHERE m.Label_Id = d.Label_Id
                        );`,
    ],
  },
  {
    comments: "EMP_TRACK",
    ID: 1003,
    queries: [
      `ALTER TABLE [dbo].[EMP_TRACK] ADD  DEFAULT (getdate()) FOR [TRACK_DATETIME]`,
    ],
  },
  {
    comments: "Color theme",
    ID: 1007,
    queries: [
      `CREATE TABLE [dbo].[AppTheme](
              [UTD] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
              [Emp_Code] [varchar](20) NULL,
              [App_theme] [varchar](20) NULL,
              [Date_Time] [datetime] NOT NULL DEFAULT GETDATE(),
            )`,
    ],
  },

  {
    comments: "user_tbl",
    ID: 1008,
    queries: [`alter table User_tbl ADD ERP_User_Code Integer  Null`],
  },
  {
    comments: "mandatory fields",
    ID: 1008,
    queries: [
      `drop PROCEDURE CheckMandatoryFields`,
      `CREATE PROCEDURE CheckMandatoryFields  
                        @empCode VARCHAR(50)  
                    AS  
                    BEGIN  
                    DECLARE @sql NVARCHAR(MAX) = '';
                    SELECT @sql = @sql + 
                      'SELECT IIF(' + Table_ColumnName + ' IS NULL OR ' + Table_ColumnName + ' = '''', 1, 0) AS result, ' + 
                      CAST(Utd AS NVARCHAR) + ' AS Utd, ''' + Field_Name + ''' AS Field_Name, ''' + Label_Id + ''' AS Label_Id, ''' + Field_Id + ''' AS Field_Id, ''' + Table_ColumnName + ''' AS Table_ColumnName, ' + 
                      CAST(Is_Mandatory AS NVARCHAR) + ' AS Is_Mandatory FROM employeemaster WHERE empcode  collate database_default = ''' + @empCode + ''' collate database_default UNION ALL ' 
                    FROM Mandatory_Fields
                    WHERE Is_Image = 0 AND Is_Mandatory = 1;
                    
                    select @sql = @sql + 
                      'SELECT IIF((
                      select DOC_PATH from EMP_DOCS where EMP_CODE collate database_default = empcode collate database_default and columndoc_type = ''EMPLOYEE'' and misspunch_inout = ' + Table_ColumnName + ' 
                    ) IS NULL OR (
                      select DOC_PATH from EMP_DOCS where EMP_CODE collate database_default = empcode collate database_default and columndoc_type = ''EMPLOYEE'' and misspunch_inout = ' + Table_ColumnName + ' 
                    ) = '''', 1, 0) AS result, ' + 
                      CAST(Utd AS NVARCHAR) + ' AS Utd, ''' + Field_Name + ''' AS Field_Name, ''' + Label_Id + ''' AS Label_Id, ''' + Field_Id + ''' AS Field_Id, ''' + Table_ColumnName + ''' AS Table_ColumnName, ' + 
                      CAST(Is_Mandatory AS NVARCHAR) + ' AS Is_Mandatory FROM employeemaster WHERE empcode collate database_default = ''' + @empCode + ''' collate database_default UNION ALL ' 
                    FROM Mandatory_Fields
                    WHERE Is_Image = 1 AND Is_Mandatory = 1;
                    
                    IF LEN(@sql) >= LEN(' UNION ALL ')
                    SET @sql = LEFT(@sql, LEN(@sql) - LEN(' UNION ALL '));
                IF LEN(@sql) >= LEN(' UNION ALL ')
                set @sql = 'select * from ('+ @sql +') as dg where result = 1 and Is_Mandatory = 1';
                ELSE set @sql = 'select top 0  1 as result,	Utd	,Field_Name	,Label_Id	,Field_Id	,Table_ColumnName	,Is_Mandatory from Mandatory_Fields'	
                print @sql;
                EXEC sp_executesql @sql;
                  END;`,
    ],
  },
  {
    comments: "Invetory",
    ID: 1009,
    queries: [
      `CREATE TABLE [dbo].[InventoryItems](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [ITEM_CODE] [nvarchar](50) NULL,
              [ITEM_NAME] [nvarchar](400) NULL,
              [HSN] [nvarchar](50) NULL,
              [ITEM_TYPE] [nvarchar](20) NULL,
              [PROD_TYPE] [nvarchar](100) NULL,
              [ITEM_TYPE_DEPT] [nvarchar](50) NULL,
              [ITEM_CAT] [nvarchar](50) NULL,
              [CLASSIFICATION] [nvarchar](100) NULL,
              [BIN_LOC] [nvarchar](200) NULL,
              [GST_RATE] [float] NULL,
              [DLR_PRICE] [money] NULL,
              [PURCH_PRICE] [money] NULL,
              [DISCOUNT_PERCT] [money] NULL,
              [SALE_PRICE] [money] NULL,
              [MRP_PRICE] [money] NULL,
              [OLD_PRICE] [money] NULL,
              [UOM] [nvarchar](25) NULL,
              [ALLOW_DECIMAL] [int] NULL,
              [CONN_MODELS] [nvarchar](25) NULL,
              [BRAND] [nvarchar](25) NULL,
              [MS] [nvarchar](10) NULL,
              [LOC_CODE] [int] NULL,
              [Created_At] [datetime] NOT NULL,
              [Created_by] [varchar](100) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [IN_STOCK_QTY] [float] NULL,
              [PRE_VENDOR] [nvarchar](40) NULL,
              [MODEL_VARIANT] [nvarchar](100) NULL,
              [BATCH_TRAN] [int] NULL,
              [OPENING_QTY] [float] NULL,
              [OPENING_VAL] [float] NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[MSSQL_TemporalHistoryFor_1739671649_AA7E38D0])
            )`,
      `ALTER TABLE [dbo].[InventoryItems] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[InventoryItems] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `CREATE TABLE [dbo].[ItemsMst](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [TRAN_ID] [int] NULL,
              [TRAN_TYPE] [int] NULL,
              [BOOK_CODE] [int] NULL,
              [VOUCHER_NO] [int] NULL,
              [VOUCHER_DATE] [datetime] NULL,
              [INV_NO] [nvarchar](30) NULL,
              [PARTY_AC] [int] NULL,
              [DISP_NAME] [nvarchar](150) NULL,
              [REF_NO] [nvarchar](50) NULL,
              [REF_DATE] [datetime] NULL,
              [NARR] [nvarchar](300) NULL,
              [STATE_CODE] [int] NULL,
              [SUPP_GST] [nvarchar](30) NULL,
              [REG_TYPE] [int] NULL,
              [REV_CHRGS] [int] NULL,
              [DISP_ADD] [nvarchar](300) NULL,
              [Created_At] [datetime] NOT NULL,
              [Created_by] [varchar](100) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [DRD_ID] [int] NULL,
              [Exp_Ledg1] [int] NULL,
              [Exp_Ledg2] [int] NULL,
              [Exp_Ledg3] [int] NULL,
              [Exp_Ledg4] [int] NULL,
              [TDS_Ledg] [int] NULL,
              [Exp_Perc1] [int] NULL,
              [Exp_Perc2] [int] NULL,
              [Exp_Perc3] [int] NULL,
              [Exp_Perc4] [int] NULL,
              [Tds_Perc] [int] NULL,
              [Exp_Amt1] [money] NULL,
              [Exp_Amt2] [money] NULL,
              [Exp_Amt3] [money] NULL,
              [Exp_Amt4] [money] NULL,
              [Tds_Amt] [money] NULL,
              [Inv_Amt] [money] NULL,
              [LOC_CODE] [int] NULL,
              [Export_Type] [int] NULL,
              [ServerId] [int] NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[ItemsMst_Hst])
            )`,

      `ALTER TABLE [dbo].[ItemsMst] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[ItemsMst] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `CREATE TABLE [dbo].[ItemsDtl](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [TRAN_ID] [int] NULL,
              [TRAN_TYPE] [nvarchar](20) NULL,
              [CODE] [nvarchar](20) NULL,
              [DESCRIPTION] [nvarchar](50) NULL,
              [Location] [int] NULL,
              [CATEGORY] [nvarchar](20) NULL,
              [ITEM_TYPE] [nvarchar](20) NULL,
              [UOM] [int] NULL,
              [HSN_CODE] [nvarchar](50) NULL,
              [QUANTITY] [float] NULL,
              [RATE] [money] NULL,
              [SGST_PERCT] [int] NULL,
              [SGST_VALUE] [money] NULL,
              [CGST_PERCT] [int] NULL,
              [CGST_VALUE] [money] NULL,
              [IGST_PERCT] [int] NULL,
              [IGST_VALUE] [money] NULL,
              [CESS_PERCT] [int] NULL,
              [CESS_VALUE] [money] NULL,
              [DISC_PERCT] [int] NULL,
              [DISC_VALUE] [money] NULL,
              [LOC_CODE] [int] NULL,
              [EXPORT_TYPE] [int] NULL,
              [SERVER_ID] [int] NULL,
              [INV_DATE] [datetime] NULL,
              [Created_At] [datetime] NOT NULL,
              [Created_by] [varchar](100) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [BATCH] [nvarchar](50) NULL,
              [BRAND] [int] NULL,
              [Sale_Ledg] [int] NULL,
              [Cost_Center] [int] NULL,
              [Inv_Amt] [money] NULL,
              [SRNO] [int] NULL,
              [CURR_STOCK] [int] NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[ItemsDtl_Hst])
            )`,

      `ALTER TABLE [dbo].[ItemsDtl] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[ItemsDtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1010,
    queries: [
      `CREATE TABLE [dbo].[BranchWiseItemOpening](
              [UTD] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY CLUSTERED,
              [Id] [int] NULL,
              [Item_Code] [nvarchar](75) NULL,
              [Loc_Code] [int] NULL,
              [Opening_Qty] [int] NULL,
              [Opening_Val] [money] NULL,
              [Created_At] [datetime] NOT NULL DEFAULT GETDATE(),
              [Created_by] [varchar](100),
              [ValidFrom] DATETIME2 GENERATED ALWAYS AS ROW START DEFAULT GETDATE(),
                [ValidTo] DATETIME2 GENERATED ALWAYS AS ROW END,
                PERIOD FOR SYSTEM_TIME(ValidFrom, ValidTo)
            )
            WITH (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.BranchWiseItemOpening_Hst));`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1011,
    queries: [
      `ALTER TABLE ItemsMst
                  ADD CUST_PAN nvarchar(15);`,
    ],
  },
  {
    comments: "refund process",
    ID: 1012,
    queries: [`alter table booking_refund add Is_Reapp int`],
  },
  {
    comments: "Attendance procedure",
    ID: 1012,
    queries: [
      `drop procedure GetEmployeeLocation`,
      `CREATE PROCEDURE GetEmployeeLocation    
                @EmployeeCode NVARCHAR(50),    
                @Latitude VARCHAR(20),    
                @Longitude VARCHAR(20)    
            AS    
            BEGIN    
                DECLARE @GeoLocationString NVARCHAR(MAX);    
                DECLARE @Geofence GEOMETRY;    
                DECLARE @Geofence_concat VARCHAR(300);    
                DECLARE @Usergeofence VARCHAR(5);  
                  
                SELECT @Usergeofence = (SELECT mUserGeoLocation FROM EMPLOYEEMASTER  
                                        WHERE EMPCODE = @EmployeeCode AND Export_Type < 3);  
              
                IF ( @Usergeofence = 'Y' OR @Usergeofence = 'y')  
                BEGIN  
                    -- If @Usergeofence is NULL or 'N', return without further processing  
                    SELECT '1' AS Result;  
                    RETURN;  
                END  
                  
                IF (@Usergeofence IS NULL OR @Usergeofence = 'N')  
                BEGIN  
                    SELECT @GeoLocationString = (    
                        SELECT TOP 1 Spl_Rem   
                        FROM Misc_Mst    
                        WHERE Misc_Code = LOCATION and Misc_Type = 85 AND Export_Type < 3    
                    )    
                    FROM EMPLOYEEMASTER    
                    WHERE EMPCODE = @EmployeeCode AND Export_Type < 3;    
              
                    IF @GeoLocationString IS NULL    
                    BEGIN    
                        SELECT 'Geo location is not set for this location' AS Result;    
                        RETURN;    
                    END    
              
                    SET @Geofence_concat = 'POLYGON((' +     
                        (SELECT STRING_AGG(    
                            CONVERT(NVARCHAR, CAST(SUBSTRING(value, 1, CHARINDEX(',', value) - 1) AS DECIMAL(30, 6))) + ' ' +    
                            CONVERT(NVARCHAR, CAST(SUBSTRING(value, CHARINDEX(',', value) + 1, LEN(value)) AS DECIMAL(30, 6))),     
                            ','    
                        )     
                        FROM STRING_SPLIT(@GeoLocationString, '@')) +     
                        '))';    
              
                    SET @Geofence = GEOMETRY::STGeomFromText(@Geofence_concat ,4326);         
                    SELECT @Geofence.STContains(GEOMETRY::STPointFromText('POINT('+ @Latitude + ' ' + @Longitude +')', 4326)) AS Result;    
                END  
            END;`,
    ],
  },
  {
    comments: "interview",
    ID: 1013,
    queries: [
      `CREATE TABLE [dbo].[Interview_sideTables](
              [Utd] [int] IDENTITY(1,1) NOT NULL,
              [SRNO] [int] NULL,
              [SNo] [int] NULL,
              [Tbl_Type] [int] NULL,
              [Emp_Company] [nvarchar](30) NULL,
              [Emp_Designation] [nvarchar](30) NULL,
              [Emp_Responsibility] [nvarchar](30) NULL,
              [Emp_From_Date] [date] NULL,
              [Emp_To_Date] [date] NULL,
              [Emp_Settlement_Done] [nvarchar](30) NULL,
              [Emp_Drawn_Salary] [money] NULL,
              [Emp_Leaving_Reason] [nvarchar](50) NULL,
              [Emp_Degree] [nvarchar](30) NULL,
              [Emp_Board] [nvarchar](30) NULL,
              [Emp_College] [nvarchar](30) NULL,
              [Emp_Passing_year] [nvarchar](4) NULL,
              [Emp_Percentage] [money] NULL,
              [Emp_Tool] [nvarchar](30) NULL,
              [Emp_Version] [nvarchar](30) NULL,
              [Emp_Proficiency] [nvarchar](30) NULL,
              [Emp_Last_Used] [nvarchar](4) NULL,
              [Emp_Experience] [nvarchar](4) NULL,
              [Emp_Language] [nvarchar](30) NULL,
              [Emp_Language_Understand] [nvarchar](30) NULL,
              [Emp_Language_Speak] [nvarchar](30) NULL,
              [Emp_Language_Read] [nvarchar](30) NULL,
              [Emp_Language_Write] [nvarchar](30) NULL,
              [Emp_Ref_Name] [nvarchar](30) NULL,
              [Emp_Ref_Occup] [nvarchar](30) NULL,
              [Emp_Ref_Address] [nvarchar](30) NULL,
              [Emp_Ref_Mobile] [nvarchar](30) NULL,
              [Emp_Ref_emailid] [nvarchar](30) NULL,
              [Emp_Ref_relation] [nvarchar](30) NULL,
              [Nominee_Name] [nvarchar](100) NULL,
              [Member_Name] [nvarchar](100) NULL,
              [Relation] [nvarchar](50) NULL,
              [Percentage] [decimal](5, 2) NULL,
              [Is_Minor] [nvarchar](20) NULL,
              [Created_by] [nvarchar](30) NOT NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [Utd] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Interview_sideTables_Hst])
            )`,
      `ALTER TABLE [dbo].[Interview_sideTables] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[Interview_sideTables] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "interview",
    ID: 1014,
    queries: [
      `alter table new_joining add CASTE nvarchar (30)`,
      `alter table new_joining add CATEGORY nvarchar (30)`,
      `alter table new_joining add DRIVE nvarchar (2)`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1015,
    queries: [
      `CREATE TABLE [dbo].[notification_temp](
              [id] [int] IDENTITY(1,1) NOT NULL,
              [title] [nvarchar](300) NULL,
              [message] [nvarchar](300) NULL,
              [created_at] [datetime] NULL,
            PRIMARY KEY CLUSTERED 
            (
              [id] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
            ) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[notification_temp] ADD  DEFAULT (getdate()) FOR [created_at]`,
    ],
  },
  {
    comments: "OfferMaster",
    ID: 1020,
    queries: [
      `CREATE TABLE [dbo].[ServOffCust](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [CUSTOMER_NAME] [nvarchar](500) NULL,
              [MOBILE] [nvarchar](14) NULL,
              [EMAIL] [nvarchar](200) NULL,
              [VEH_REG_NO] [nvarchar](20) NULL,
              [MODEL] [nvarchar](400) NULL,
              [CUST_ID] [nvarchar](50) NULL,
              [Loc_Code] [smallint] NULL,
              [BATCH_ID] [smallint] NULL,
              [BATCH_NAME] [nvarchar](100) NULL,
              [isApplied] [smallint] NULL,
              [isAppliedDate] [datetime] NULL,
              [isAvailed] [smallint] NULL,
              [isAvailedDate] [datetime] NULL,
              [Created_At] [datetime] NOT NULL,
              [Created_by] [varchar](100) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [ImportMonth] [int] NULL,
              [OFF_ID] [int] NULL,
              [QR_PATH] [nvarchar](500) NULL,
              [AVAIL_EMP] [nvarchar](100) NULL,
              [VIN_NO] [nvarchar](100) NULL,
              [FIN_INV_AMT] [money] NULL,
              [INV_ON] [nvarchar](20) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[ServOffCust_Hst])
            )`,
      `ALTER TABLE [dbo].[ServOffCust] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[ServOffCust] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "OfferMaster",
    ID: 1021,
    queries: [
      `CREATE TABLE [dbo].[OfferMaster](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Month] [int] NULL,
              [DateFrom] [date] NULL,
              [DateUpto] [date] NULL,
              [OfferName] [nvarchar](100) NULL,
              [Offers] [nvarchar](50) NULL,
              [OfferValue] [int] NULL,
              [Weightage] [int] NULL,
              [Created_At] [datetime] NOT NULL,
              [Created_by] [varchar](100) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [LOC_CODE] [int] NULL,
              [MIN_INV_AMT] [int] NULL,
              [OfferOn] [nvarchar](20) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[OfferMaster_Hst])
            )`,
      `ALTER TABLE [dbo].[OfferMaster] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[OfferMaster] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "OfferMaster",
    ID: 1022,
    queries: [
      `CREATE TABLE [dbo].[OfferDtl](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Mst_ID] [int] NULL,
              [TC_DESC] [nvarchar](1000) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[OfferDtl_Hst])
            )`,
      `ALTER TABLE [dbo].[OfferDtl] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[OfferDtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "interview",
    ID: 1023,
    queries: [
      `alter table NEW_JOINING alter column EXP_IN_YEAR decimal(19,2)`,
      `alter table NEW_JOINING alter column PASSING_PER decimal(19,2)`,
      `ALTER TABLE NEW_JOINING ADD HR_REASON nvarchar(200) null;`,
      `ALTER TABLE NEW_JOINING ADD EMPCODE varchar(20) NULL;`,
      `ALTER TABLE SHORTLISTED_CANDIDATE ADD INTR1DATE [datetime] NULL`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1024,
    queries: [`alter table comp_keydata add Comp_Logo nvarchar(60)`],
  },
  {
    comments: "New_dev_Code",
    ID: 1025,
    queries: [`alter table comp_keydata add TV_Mode int`],
  },
  {
    comments: "Asset Managemnet",
    ID: 1028,
    queries: [
      `

            CREATE TABLE [dbo].[Assets_Group](
              [Id] [int] IDENTITY(1,1) NOT NULL,
              [name] [varchar](255) NOT NULL,
              [icon] [varchar](255) NOT NULL,
              [Created_At] [datetime2](7) NULL,
              [Created_by] [varchar](100) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Asset_Type] [int] NULL,
            PRIMARY KEY CLUSTERED 
            (
              [Id] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Assets_Group_Hst])
            )


            ALTER TABLE [dbo].[Assets_Group] ADD  DEFAULT (getdate()) FOR [Created_At]




            `,
      `CREATE TABLE [dbo].[Assets_Group_Subcategory](
              [Id] [int] IDENTITY(1,1) NOT NULL,
              [name] [varchar](255) NOT NULL,
              [icon] [varchar](255) NOT NULL,
              [Group_Id] [varchar](255) NOT NULL,
              [Created_At] [datetime2](7) NULL,
              [Created_by] [varchar](100) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [Id] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Assets_Group_Subcategory_Hst])
            )


            ALTER TABLE [dbo].[Assets_Group_Subcategory] ADD  DEFAULT (getdate()) FOR [Created_At]



            `,
      `CREATE TABLE [dbo].[Asset_Template](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Template_Id] [int] NOT NULL,
              [Field_Name] [varchar](255) NOT NULL,
              [Field_Type] [varchar](255) NULL,
              [Field_Req] [int] NULL,
              [Field_Attr] [int] NULL,
              [Table_field] [varchar](30) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Export_type] [int] NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Template_Hst])
            )


            ALTER TABLE [dbo].[Asset_Template] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Asset_Template] ADD  DEFAULT (getdate()) FOR [ValidFrom]

            `,
      `

            CREATE TABLE [dbo].[Asset_Product](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Name] [varchar](100) NOT NULL,
              [Icon] [varchar](100) NULL,
              [Category] [varchar](10) NOT NULL,
              [Subcategory] [varchar](10) NOT NULL,
              [Location] [varchar](100) NOT NULL,
              [Manufacturer] [varchar](50) NULL,
              [Model] [varchar](50) NULL,
              [Purchase_Date] [datetime2](7) NULL,
              [Purchase_value] [money] NULL,
              [Description] [varchar](200) NULL,
              [Serial_No] [varchar](30) NULL,
              [Asset_Status] [varchar](50) NULL,
              [Asset_Nature] [varchar](10) NULL,
              [Notes] [varchar](400) NULL,
              [Life_Span] [int] NULL,
              [Depreciation_Method] [varchar](30) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [residualValue] [money] NULL,
              [totalUnits] [int] NULL,
              [unitsProduced] [varchar](200) NULL,
              [Attachments] [nvarchar](max) NULL,
              [Due_Date] [datetime2](7) NULL,
              [QRCode] [varchar](4000) NULL,
              [BarCode] [nvarchar](max) NULL,
              [Qty] [float] NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Product_Hst])
            )


            ALTER TABLE [dbo].[Asset_Product] ADD  DEFAULT (getdate()) FOR [Created_At]

            ALTER TABLE [dbo].[Asset_Product] ADD  DEFAULT (getdate()) FOR [ValidFrom]




            `,
      `

            CREATE TABLE [dbo].[Product_Issue](
              [tran_id] [int] IDENTITY(1,1) NOT NULL,
              [Req_Date] [datetime2](7) NULL,
              [EmpCode] [varchar](10) NULL,
              [Category] [varchar](20) NOT NULL,
              [SubCategory] [varchar](20) NOT NULL,
              [Description] [varchar](200) NOT NULL,
              [Reason] [varchar](200)  NULL,
              [Location] [varchar](10) NULL,
              [Appr_1_Code] [varchar](100) NULL,
              [Appr_1_Stat] [tinyint] NULL,
              [Appr_1_Date] [datetime2](7) NULL,
              [Appr_1_Rem] [varchar](300) NULL,
              [Appr_2_Code] [varchar](100) NULL,
              [Appr_2_Stat] [tinyint] NULL,
              [Appr_2_Date] [datetime2](7) NULL,
              [Appr_2_Rem] [varchar](300) NULL,
              [Appr_3_Code] [varchar](100) NULL,
              [Appr_3_Stat] [tinyint] NULL,
              [Appr_3_Date] [datetime2](7) NULL,
              [Appr_3_Rem] [varchar](300) NULL,
              [Fin_Appr] [tinyint] NULL,
              [srm] [varchar](20) NULL,
              [Issued_Asset] [varchar](4000) NULL,
              [IssuedDate] [datetime2](7) NULL,
              [Returnable] [varchar](50) NULL,
              [Revoke_Reason] [varchar](200) NULL,
              [RevokeDate] [datetime2](7) NULL,
              [Quantity] [varchar](100) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Appr1_Qty] [varchar](50) NULL,
              [Appr2_Qty] [varchar](50) NULL,
              [Appr3_Qty] [varchar](50) NULL,
              [Revoked_Asset] [varchar](4000) NULL,
              [Type] [varchar](20) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [tran_id] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Product_Issue_Hst])
            )


            ALTER TABLE [dbo].[Product_Issue] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Product_Issue] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `
            CREATE TABLE [dbo].[Product_Finance](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Vendor] [varchar](100) NOT NULL,
              [Purchase_Price] [money] NULL,
              [Purchase] [varchar](10) NULL,
              [Ac_Code] [varchar](20) NULL,
              [Market_value] [money] NULL,
              [In_Service] [varchar](10) NULL,
              [Po_No] [varchar](20) NULL,
              [Scrap_Value] [money] NULL,
              [Warrent_End] [datetime2](7) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Asset_Product] [varchar](10) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Product_Finance_Hst])
            )


            ALTER TABLE [dbo].[Product_Finance] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Product_Finance] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `CREATE TABLE [dbo].[Product_Vendor](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Vendor_Name] [varchar](100) NULL,
              [Vendor_Number] [varchar](20) NULL,
              [Contact_Name] [varchar](100) NULL,
              [Email] [varchar](100) NULL,
              [Phone_No] [varchar](20) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [Asset_Product] [varchar](10) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [city] [varchar](100) NULL,
              [address] [varchar](200) NULL,
              [Invoice_No] [varchar](100) NULL,
              [Vendor_Code] [varchar](100) NULL,
              [Invoice_Date] [datetime2](7) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Product_Vendor_Hst])
            )


            ALTER TABLE [dbo].[Product_Vendor] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Product_Vendor] ADD  DEFAULT (getdate()) FOR [ValidFrom]

            `,
      `

            CREATE TABLE [dbo].[Product_Service](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Req_Date] [datetime2](7) NULL,
              [EmpCode] [varchar](10) NULL,
              [Category] [varchar](20) NULL,
              [SubCategory] [varchar](20) NULL,
              [Description] [varchar](100) NOT NULL,
              [Reason] [varchar](200) NULL,
              [Location] [varchar](10) NULL,
              [Priority] [varchar](100) NULL,
              [Service_Date] [datetime2](7) NULL,
              [Part_Amount] [money] NULL,
              [Labour_Amount] [money] NULL,
              [NextDue_Date] [datetime2](7) NULL,
              [Flag] [varchar](10) NULL,
              [Asset_Product] [varchar](4000) NULL,
              [Appr_1_Code] [varchar](100) NULL,
              [Appr_1_Stat] [tinyint] NULL,
              [Appr_1_Date] [datetime2](7) NULL,
              [Appr_1_Rem] [varchar](300) NULL,
              [Appr_2_Code] [varchar](100) NULL,
              [Appr_2_Stat] [tinyint] NULL,
              [Appr_2_Date] [datetime2](7) NULL,
              [Appr_2_Rem] [varchar](300) NULL,
              [Appr_3_Code] [varchar](100) NULL,
              [Appr_3_Stat] [tinyint] NULL,
              [Appr_3_Date] [datetime2](7) NULL,
              [Appr_3_Rem] [varchar](300) NULL,
              [Fin_Appr] [tinyint] NULL,
              [srm] [varchar](20) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Service_Type] [varchar](100) NULL,
              [EmpDue_Date] [datetime2](7) NULL,
              [New_Description] [varchar](50) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Product_Service_Hst])
            )


            ALTER TABLE [dbo].[Product_Service] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Product_Service] ADD  DEFAULT (getdate()) FOR [ValidFrom]



            `,
      `
            CREATE TABLE [dbo].[Product_Extra](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [F_1] [varchar](150) NULL,
              [F_2] [varchar](150) NULL,
              [F_3] [varchar](150) NULL,
              [F_4] [varchar](150) NULL,
              [F_5] [varchar](150) NULL,
              [F_6] [varchar](150) NULL,
              [F_7] [varchar](150) NULL,
              [F_8] [varchar](150) NULL,
              [F_9] [varchar](150) NULL,
              [F_10] [varchar](150) NULL,
              [Asset_Product] [varchar](10) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Product_Extra_Hst])
            )


            ALTER TABLE [dbo].[Product_Extra] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Product_Extra] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `

            CREATE TABLE [dbo].[purchase_request](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Req_Date] [datetime2](7) NULL,
              [Asset_Category] [varchar](20) NULL,
              [Contact_Number] [varchar](20) NOT NULL,
              [Email] [varchar](100) NULL,
              [Address] [varchar](200) NULL,
              [City] [varchar](20) NULL,
              [State] [varchar](20) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Location] [varchar](10) NULL,
              [Appr_1_Code] [varchar](100) NULL,
              [Appr_1_Stat] [tinyint] NULL,
              [Appr_1_Rem] [varchar](300) NULL,
              [Appr_2_Code] [varchar](100) NULL,
              [Appr_2_Stat] [tinyint] NULL,
              [Appr_2_Rem] [varchar](300) NULL,
              [Appr_3_Code] [varchar](100) NULL,
              [Appr_3_Stat] [tinyint] NULL,
              [Appr_3_Rem] [varchar](300) NULL,
              [Fin_Appr] [tinyint] NULL,
              [srm] [varchar](20) NULL,
              [LocationTo] [varchar](10) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[purchase_request_Hst])
            )


            ALTER TABLE [dbo].[purchase_request] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[purchase_request] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `CREATE TABLE [dbo].[Purchase_Req_Product_Details](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Item] [varchar](50) NOT NULL,
              [Item_Description] [varchar](100) NULL,
              [Asset_Category] [varchar](20) NULL,
              [Quantity] [varchar](20) NULL,
              [Unit_Price] [varchar](20) NULL,
              [Discount] [varchar](20) NULL,
              [Total_Price] [money] NULL,
              [Purchase_Id] [varchar](20) NULL,
              [Issue_Quantity] [varchar](20) NULL,
              [IsIssued] [varchar](10) NULL,
              [Location] [varchar](10) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Purchase_Req_Product_Details_Hst])
            )


            ALTER TABLE [dbo].[Purchase_Req_Product_Details] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Purchase_Req_Product_Details] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `

            CREATE TABLE [dbo].[Purchase_Order](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Req_Date] [datetime2](7) NULL,
              [Asset_Category] [varchar](20) NOT NULL,
              [Contact_Number] [varchar](20) NOT NULL,
              [Email] [varchar](100) NULL,
              [Address] [varchar](200) NULL,
              [City] [varchar](20) NULL,
              [State] [varchar](20) NULL,
              [Location] [varchar](10) NULL,
              [Appr_1_Code] [varchar](100) NULL,
              [Appr_1_Stat] [tinyint] NULL,
              [Appr_1_Rem] [varchar](300) NULL,
              [Appr_2_Code] [varchar](100) NULL,
              [Appr_2_Stat] [tinyint] NULL,
              [Appr_2_Rem] [varchar](300) NULL,
              [Appr_3_Code] [varchar](100) NULL,
              [Appr_3_Stat] [tinyint] NULL,
              [Appr_3_Rem] [varchar](300) NULL,
              [Fin_Appr] [tinyint] NULL,
              [srm] [varchar](20) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Vendor] [varchar](20) NULL,
              [Subcategory] [varchar](20) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Purchase_Order_Hst])
            )


            ALTER TABLE [dbo].[Purchase_Order] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Purchase_Order] ADD  DEFAULT (getdate()) FOR [ValidFrom]

            `,
      `
            CREATE TABLE [dbo].[Purchase_Order_Product_Details](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Product_Code] [varchar](20) NULL,
              [Item_Description] [varchar](100) NULL,
              [Tax] [varchar](20) NULL,
              [Quantity] [varchar](20) NOT NULL,
              [Unit_Price] [varchar](20) NULL,
              [Discount] [varchar](20) NULL,
              [Total_Price] [money] NULL,
              [Purchase_Id] [varchar](20) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Subcategory] [varchar](20) NULL,
              [ITEM_TYPE] [varchar](20) NULL,
              [HSN] [varchar](20) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Purchase_Order_Product_Details_Hst])
            )


            ALTER TABLE [dbo].[Purchase_Order_Product_Details] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Purchase_Order_Product_Details] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `
            CREATE TABLE [dbo].[PurchaseEntryMst](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [TRAN_ID] [int] NULL,
              [TRAN_TYPE] [int] NULL,
              [BOOK_CODE] [int] NULL,
              [VOUCHER_NO] [int] NULL,
              [VOUCHER_DATE] [datetime] NULL,
              [INV_NO] [nvarchar](30) NULL,
              [PARTY_AC] [int] NULL,
              [DISP_NAME] [nvarchar](150) NULL,
              [REF_NO] [nvarchar](50) NULL,
              [REF_DATE] [datetime] NULL,
              [NARR] [nvarchar](300) NULL,
              [STATE_CODE] [int] NULL,
              [SUPP_GST] [nvarchar](30) NULL,
              [REG_TYPE] [int] NULL,
              [REV_CHRGS] [int] NULL,
              [DISP_ADD] [nvarchar](300) NULL,
              [Created_At] [datetime] NOT NULL,
              [Created_by] [varchar](100) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [DRD_ID] [int] NULL,
              [Exp_Ledg1] [int] NULL,
              [Exp_Ledg2] [int] NULL,
              [Exp_Ledg3] [int] NULL,
              [Exp_Ledg4] [int] NULL,
              [TDS_Ledg] [int] NULL,
              [Exp_Perc1] [int] NULL,
              [Exp_Perc2] [int] NULL,
              [Exp_Perc3] [int] NULL,
              [Exp_Perc4] [int] NULL,
              [Tds_Perc] [int] NULL,
              [Exp_Amt1] [money] NULL,
              [Exp_Amt2] [money] NULL,
              [Exp_Amt3] [money] NULL,
              [Exp_Amt4] [money] NULL,
              [Tds_Amt] [money] NULL,
              [Inv_Amt] [money] NULL,
              [LOC_CODE] [int] NULL,
              [Export_Type] [int] NULL,
              [ServerId] [int] NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[PurchaseEntryMst_Hst])
            )


            ALTER TABLE [dbo].[PurchaseEntryMst] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[PurchaseEntryMst] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `
            CREATE TABLE [dbo].[PurchaseEntryDtl](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [TRAN_ID] [int] NULL,
              [TRAN_TYPE] [nvarchar](20) NULL,
              [CODE] [nvarchar](20) NULL,
              [DESCRIPTION] [nvarchar](50) NULL,
              [Location] [int] NULL,
              [CATEGORY] [nvarchar](20) NULL,
              [ITEM_TYPE] [nvarchar](20) NULL,
              [UOM] [int] NULL,
              [HSN_CODE] [nvarchar](50) NULL,
              [QUANTITY] [float] NULL,
              [RATE] [money] NULL,
              [SGST_PERCT] [int] NULL,
              [SGST_VALUE] [money] NULL,
              [CGST_PERCT] [int] NULL,
              [CGST_VALUE] [money] NULL,
              [IGST_PERCT] [int] NULL,
              [IGST_VALUE] [money] NULL,
              [CESS_PERCT] [int] NULL,
              [CESS_VALUE] [money] NULL,
              [DISC_PERCT] [int] NULL,
              [DISC_VALUE] [money] NULL,
              [LOC_CODE] [int] NULL,
              [EXPORT_TYPE] [int] NULL,
              [SERVER_ID] [int] NULL,
              [INV_DATE] [datetime] NULL,
              [Created_At] [datetime] NOT NULL,
              [Created_by] [varchar](100) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [BATCH] [nvarchar](50) NULL,
              [BRAND] [int] NULL,
              [Sale_Ledg] [int] NULL,
              [Cost_Center] [int] NULL,
              [Inv_Amt] [money] NULL,
              [SRNO] [int] NULL,
              [CURR_STOCK] [int] NULL,
              [SubCategory] [varchar](20) NULL,
              [CATEGORYGST] [varchar](20) NULL,
              [PO_Number] [varchar](50) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[PurchaseEntryDtl_Hst])
            )


            ALTER TABLE [dbo].[PurchaseEntryDtl] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[PurchaseEntryDtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `
            CREATE TABLE [dbo].[Product_History](
              [tran_id] [int] IDENTITY(1,1) NOT NULL,
              [Asset_ID] [varchar](10) NULL,
              [Tran_Type] [varchar](10) NULL,
              [Quantity] [float] NULL,
              [Source_Location] [varchar](10) NULL,
              [Destination_Location] [varchar](10) NULL,
              [Issued_To] [varchar](10) NULL,
              [Revoke_Reason] [varchar](100) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [IssueDate] [datetime2](7) NULL,
              [RevokeDate] [datetime2](7) NULL,
              [Category] [varchar](50) NULL,
              [SubCategory] [varchar](50) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [tran_id] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Product_History_Hst])
            )


            ALTER TABLE [dbo].[Product_History] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Product_History] ADD  DEFAULT (getdate()) FOR [ValidFrom]



            `,
      `
            CREATE TABLE [dbo].[Reminder_Asset](
              [reminder_id] [int] IDENTITY(1,1) NOT NULL,
              [reminder_name] [varchar](50) NULL,
              [date] [date] NULL,
              [time] [varchar](255) NULL,
              [frequency] [nvarchar](255) NULL,
              [validity] [date] NULL,
              [description] [varchar](255) NULL,
              [Category] [varchar](20) NULL,
              [SubCategory] [varchar](20) NULL,
              [Asset] [varchar](20) NULL,
              [user_id] [int] NULL,
              [type] [varchar](255) NULL,
              [Created_By] [nvarchar](30) NOT NULL,
              [Created_At] [datetime] NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [reminder_id] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Reminder_Asset_hst])
            )


            ALTER TABLE [dbo].[Reminder_Asset] ADD  DEFAULT (getdate()) FOR [Created_At]


            `,
      `
            CREATE TABLE [dbo].[Product_Issue_dtl](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Product_Issue] [varchar](10) NOT NULL,
              [Asset_Product] [varchar](20) NOT NULL,
              [Asset_Issue_Qty] [varchar](20) NOT NULL,
              [Revoke] [varchar](20) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Product_Issue_dtl_Hst])
            )


            ALTER TABLE [dbo].[Product_Issue_dtl] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Product_Issue_dtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `
            CREATE TABLE [dbo].[Purchase_Req_Product_Details_dtl](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Purchase_Req] [varchar](10) NOT NULL,
              [Asset_Product] [varchar](20) NOT NULL,
              [Asset_Issue_Qty] [varchar](20) NOT NULL,
              [Purchase_Req_Product] [varchar](20) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Purchase_Req_Product_Details_dtl_Hst])
            )


            ALTER TABLE [dbo].[Purchase_Req_Product_Details_dtl] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Purchase_Req_Product_Details_dtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]


            `,
      `CREATE TABLE [dbo].[Prefix_Name](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Prefix_Name] [varchar](100) NOT NULL,
              [Prefix_Code] [varchar](50) NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Prefix_Name_Hst])
            )


            ALTER TABLE [dbo].[Prefix_Name] ADD  DEFAULT (getdate()) FOR [Created_At]


            ALTER TABLE [dbo].[Prefix_Name] ADD  DEFAULT (getdate()) FOR [ValidFrom]
            `,
      `CREATE TABLE [dbo].[PurchaseEntryDtlSR](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [TRAN_ID] [int] NULL,
              [Serial_No] [varchar](50) NULL,
              [isCreated] [varchar](10) NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
              [Po] [varchar](50) NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[PurchaseEntryDtlSR_Hst])
            )
            ALTER TABLE [dbo].[PurchaseEntryDtlSR] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "Asset changes",
    ID: 1031,
    queries: [
      `
                  


            ALTER TABLE [dbo].[Assets_Group] ADD  [DPRATE] [varchar](10) NULL
            ALTER TABLE [dbo].[Assets_Group_Subcategory] ADD  [Series] [bit] NULL
            ALTER TABLE [dbo].[Asset_Product] ADD  [ITEM_TYPE] [varchar](10) NULL
            ALTER TABLE [dbo].[Asset_Product] ADD 	[UOM1] [varchar](10) NULL
            ALTER TABLE [dbo].[Asset_Product] ADD 	[Duration] [varchar](10) NULL
            ALTER TABLE [dbo].[Product_Service] ADD  [Document] [varchar](255) NULL
            ALTER TABLE [dbo].[Purchase_Order] ADD [Document] [varchar](255) NULL
            ALTER TABLE [dbo].[Purchase_Order_Product_Details] ADD  [UOM1] [varchar](10) NULL
            ALTER TABLE [dbo].[PurchaseEntryMst] ADD  [Document] [varchar](255) NULL
            ALTER TABLE [dbo].[PurchaseEntryDtl] ADD  [POPD] [varchar](20) NULL
            ALTER TABLE [dbo].[Product_History] ADD  [PurchaseDtl] [varchar](10) NULL
                  `,
    ],
  },
  {
    comments: "Asset Pooling And Reallocation",
    ID: 1032,
    queries: [
      `
            CREATE TABLE [dbo].[asset_pooling_reallocation](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Transfer_Date] [datetime2] NOT NULL,
              [Category] [varchar](50) NOT NULL,
              [SubCategory] [varchar](50) NOT NULL,
              [Asset_Product] [varchar](50) NOT NULL,
              [Remark] [varchar](200)  NULL,
              [Location] [varchar](50) NOT NULL,
              [Revoke_Date] [datetime] NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Poolin_Reallocation_Hst])
            )
            ALTER TABLE [dbo].[asset_pooling_reallocation] ADD  DEFAULT (getdate()) FOR [Created_At]
            ALTER TABLE [dbo].[asset_pooling_reallocation] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                  `,
      `
                  

            CREATE TABLE [dbo].[Asset_Pooling_Reallocation_Dtl](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Transfer_Date] [datetime2] NULL,
              [Category] [varchar](50) NOT NULL,
              [SubCategory] [varchar](50) NOT NULL,
              [PoolingId] [varchar](20) NOT NULL,
              [Issue_Quantity] [varchar](50) NOT NULL,
              [Description] [varchar](200) NOT NULL,
              [Revoke] [varchar](10)  NULL,
              [Revoke_Date] [datetime2]  NULL,
              [Reason] [varchar](200)  NULL,
              [Location] [varchar](50) NOT NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Pooling_Reallocation_Dtl_Hst])
            )

            ALTER TABLE [dbo].[Asset_Pooling_Reallocation_Dtl] ADD  DEFAULT (getdate()) FOR [Created_At]

            ALTER TABLE [dbo].[Asset_Pooling_Reallocation_Dtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                  `,
      `
                  


            CREATE TABLE [dbo].[Asset_Pooling_Reallocation_DtlSR](
              [UTD] [int] IDENTITY(1,1) NOT NULL,
              [Asset_Pooling_Id] [varchar](10) NOT NULL,
              [Asset_PoolingDtl_Id] [varchar](10) NOT NULL,
              [Asset_Product] [varchar](20) NOT NULL,
              [Asset_Issue_Qty] [varchar](20) NOT NULL,
              [Asset_Revoke_Qty] [varchar](20)  NULL,
              [Created_By] [varchar](255) NULL,
              [Created_At] [datetime] NOT NULL,
              [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
              [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
            PRIMARY KEY CLUSTERED 
            (
              [UTD] ASC
            )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
              PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
            ) ON [PRIMARY]
            WITH
            (
            SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Pooling_Reallocation_DtlSR_Hst])
            )
            ALTER TABLE [dbo].[Asset_Pooling_Reallocation_DtlSR] ADD  DEFAULT (getdate()) FOR [Created_At]

            ALTER TABLE [dbo].[Asset_Pooling_Reallocation_DtlSR] ADD  DEFAULT (getdate()) FOR [ValidFrom]
                  `,
    ],
  },
  {
    comments: "pot cust",
    ID: 1034,
    queries: [
      `
                        CREATE TABLE [dbo].[POT_CUST](
                          [UID] [int] IDENTITY(1,1) NOT NULL,
                          [TRAN_ID] [int] NULL,
                          [VEHREGNO] [nvarchar](20) NULL,
                          [CHASS_NO] [nvarchar](20) NULL,
                          [MOD_GRP] [nvarchar](20) NULL,
                          [MOD_NAME] [nvarchar](20) NULL,
                          [CUST_NAME] [nvarchar](100) NULL,
                          [MOBILE] [nvarchar](20) NULL,
                          [EMAIL] [nvarchar](100) NULL,
                          [PART_DESC] [nvarchar](250) NULL,
                          [QTY] [nvarchar](20) NULL,
                          [PRIORITY] [nvarchar](20) NULL,
                          [CUST_ADV_PYMT] [money] NULL,
                          [EXP_DELV_DATE] [datetime2](7) NULL,
                          [PART_NO] [nvarchar](100) NULL,
                          [DMS_PART_NO] [nvarchar](255) NULL,
                          [DMS_PART_DATE] [datetime2](7) NULL,
                          [Export_Type] [int] NULL,
                          [Server_ID] [int] NULL,
                          [Created_by] [nvarchar](255) NULL,
                          [Id] [nvarchar](20) NULL,
                          [LOC_CODE] [nvarchar](10) NULL,
                          [ORDER_STATUS] [nvarchar](100) NULL,
                          [LAST_STATUS_UP_ON] [datetime2](7) NULL,
                        PRIMARY KEY CLUSTERED 
                        (
                          [UID] ASC
                        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
                        ) ON [PRIMARY]
                  `,
      `CREATE TABLE [dbo].[POT_CUST_DTL](
                    [UID] [int] IDENTITY(1,1) NOT NULL,
                    [TRAN_ID] [int] NULL,
                    [SNo] [int] NULL,
                    [PART_NO] [nvarchar](100) NULL,
                    [ORDER_NO] [nvarchar](20) NULL,
                    [ORDER_DATE] [datetime2](7) NULL,
                    [DMS_ORDER_STATUS] [nvarchar](100) NULL,
                    [STATUS_DATE] [datetime2](7) NULL,
                    [LOC_CODE] [nvarchar](10) NULL,
                    [Created_by] [nvarchar](20) NULL,
                    [export_type] [nvarchar](10) NULL,
                  PRIMARY KEY CLUSTERED 
                  (
                    [UID] ASC
                  )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
                  ) ON [PRIMARY]`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1035,
    queries: [
      `CREATE TABLE [dbo].[Br_Exp](
                          [TRAN_ID] [int] NULL,
                          [Exp_Ledg_Code] [varchar](50) NULL,
                          [Br_Code] [varchar](50) NULL,
                          [Exp_Amt] [money] NULL,
                          [Export_Type] [varchar](50) NULL,
                          [User_Code] [varchar](50) NULL,
                          [Modify_Date] [datetime2](7) NULL,
                          [Month] [varchar](10) NULL,
                          [Year] [varchar](10) NULL
                        ) ON [PRIMARY]`,
      `CREATE TABLE [dbo].[PPC_PARAM](
                      [Tran_id] [int] NULL,
                      [Interest] [money] NULL,
                      [Payout_Insurance] [money] NULL,
                      [Commission_Ew] [money] NULL,
                      [Commission_CCP] [money] NULL,
                      [Commission_TCU] [money] NULL,
                      [Margin_Card] [money] NULL,
                      [Margin_Fastag] [money] NULL,
                      [Margin_Accessory] [money] NULL,
                      [Margin_VAS] [money] NULL,
                      [Margin_Outsider] [money] NULL,
                      [Loc_code] [int] NULL,
                      [Export_type] [int] NULL,
                      [Modify_date] [datetime2](7) NULL,
                      [Create_by] [nvarchar](50) NULL
                    ) ON [PRIMARY]`,
      `CREATE TABLE [dbo].[Exp_Allot](
                    [UID] [varchar](20) NOT NULL,
                    [Exp_Ledg_Code] [varchar](50) NOT NULL,
                    [Br_code] [varchar](50) NOT NULL,
                    [Exp_perc] [decimal](5, 2) NULL,
                    [Export_type] [varchar](50) NOT NULL,
                    [User_code] [varchar](50) NOT NULL,
                    [Modify_date] [datetime2](7) NULL
                  ) ON [PRIMARY]`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1036,
    queries: [
      ` alter table assets_group_subcategory add [AMC] [bit] NULL`,
      `	alter table assets_group_subcategory add [Depreciation_Method] [varchar](100) NULL`,
      `alter table asset_product add [Start_Date] [datetime2](7) NULL`,
      `alter table asset_product add [End_Date] [datetime2](7) NULL`,
      `alter table asset_product add [Amc_Value] [varchar](20) NULL`,
      `	alter table asset_product add [Amc_Vendor] [varchar](100) NULL`,
      `alter table asset_product add	[AssetCode] [varchar](50) NULL`,
      `alter table asset_product add	[Characteristics] [varchar](255) NULL`,
      `    alter table product_history add [TransferTo] [varchar](20) NULL`,
      `alter table product_history add [Tran_Date] [datetime2](7) NULL`,
      `alter table purchase_request add [Tran_Date] [datetime2](7) NULL`,
      `alter table asset_pooling_reallocation add [reallocation_date] [datetime2](7) NULL`,
      `alter table product_history  add [common] varchar(10) NULL`,
      `CREATE TABLE [dbo].[Asset_Characteristic](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[Type] [varchar](100) NULL,
	[Name] [varchar](100) NULL,
	[Category] [varchar](20) NULL,
	[SubCategory] [varchar](20) NULL,
	[AssetProduct] [varchar](20) NULL,
	[Created_At] [datetime2](7) NULL,
	[Created_by] [varchar](100) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Characteristic_Hst])
)
ALTER TABLE [dbo].[Asset_Characteristic] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `alter table product_issue alter column [Category] [varchar](20)  NULL
              alter table product_issue alter column [SubCategory] [varchar](20)  NULL`,
      `
              alter table Assets_Group_Subcategory add common [bit] NULL`,
      `CREATE TABLE [dbo].[Asset_Characteristic](
                [UTD] [int] IDENTITY(1,1) NOT NULL,
                [Type] [varchar](100) NULL,
                [Name] [varchar](100) NULL,
                [Category] [varchar](20) NULL,
                [SubCategory] [varchar](20) NULL,
                [AssetProduct] [varchar](20) NULL,
                [Created_At] [datetime2](7) NULL,
                [Created_by] [varchar](100) NULL,
                [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
                [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
                [TypeValue] [varchar](10) NULL,
              PRIMARY KEY CLUSTERED 
              (
                [UTD] ASC
              )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
                PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
              ) ON [PRIMARY]
              WITH
              (
              SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Characteristic_Hst])
              )
              ALTER TABLE [dbo].[Asset_Characteristic] ADD  DEFAULT (getdate()) FOR [Created_At]
              
              `,
      `alter table asset_product add Min_Qty varchar(10) null`,
      `
alter table product_service alter column description varchar(200)null`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1037,
    queries: [
      `ALTER TABLE employee_atnstatus
            ADD CONSTRAINT PK_employee_atnstatus_Utd PRIMARY KEY CLUSTERED (Utd);`,
      `ALTER TABLE Employee_AtnStatus
            ADD ValidFrom DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
                ValidTo DATETIME2 NOT NULL DEFAULT CONVERT(DATETIME2, '9999-12-31 23:59:59.9999999');`,
      `ALTER TABLE Employee_AtnStatus
            ADD PERIOD FOR SYSTEM_TIME (ValidFrom, ValidTo);`,
      `ALTER TABLE Employee_AtnStatus
            SET (SYSTEM_VERSIONING = ON (HISTORY_TABLE = dbo.Employee_AtnStatus_History));`,
    ],
  },
  {
    comments: "suggestive order",
    ID: 1038,
    queries: [
      `CREATE TABLE [dbo].[Part_Stock](
	[UID] [int] IDENTITY(1,1) NOT NULL,
	[Tran_id] [int] NULL,
	[Part_No] [nvarchar](50) NULL,
	[Descr] [nvarchar](250) NULL,
	[Stock_Qty] [decimal](18, 0) NULL,
	[Br_Code] [nvarchar](50) NULL,
	[Export_Type] [int] NULL,
	[srno] [int] NULL,
	[Date] [datetime] NULL,
	[Create_By] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[UID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[Part_Stock] ADD  DEFAULT (getdate()) FOR [Date]`,
      `CREATE TABLE [dbo].[Part_MinStock](
	[UID] [int] IDENTITY(1,1) NOT NULL,
	[Tran_id] [int] NULL,
	[Part_No] [nvarchar](50) NULL,
	[Min_Stock_Qty] [decimal](18, 0) NULL,
	[Br_Code] [nvarchar](50) NULL,
	[Export_Type] [int] NULL,
	[Date] [datetime] NULL,
	[srno] [int] NULL,
	[Descr] [nvarchar](250) NULL,
	[Create_By] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[UID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[Part_MinStock] ADD  DEFAULT (getdate()) FOR [Date]`,
      `CREATE TABLE [dbo].[Suggestive_Order](
      [UID] [int] IDENTITY(1,1) NOT NULL,
      [Tran_id] [int] NULL,
      [Order_No] [nvarchar](50) NULL,
      [Br_Code] [nvarchar](50) NULL,
      [Part_No] [nvarchar](50) NULL,
      [Descr] [nvarchar](250) NULL,
      [Stock_Qty] [decimal](18, 0) NULL,
      [Min_Stock_Qty] [decimal](18, 0) NULL,
      [Order_Qty] [int] NULL,
      [Export_Type] [int] NULL,
      [Date] [datetime] NULL,
      [srno] [int] NULL,
      [Remark] [nvarchar](250) NULL,
      [Create_By] [nvarchar](255) NULL,
    PRIMARY KEY CLUSTERED 
    (
      [UID] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    ) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[Suggestive_Order] ADD  DEFAULT (getdate()) FOR [Date]`,
    ],
  },
  {
    comments: "finance Payout",
    ID: 1039,
    queries: [
      `alter table newcar_financedetails add icm_tran_id varchar(20) null`,
    ],
  },
  {
    comments: "Misc Mst",
    ID: 1040,
    queries: [`alter table Misc_Mst add UTD int identity (1,1)`],
  },
  {
    comments: "Finance Master",
    ID: 1041,
    queries: [
      `CREATE TABLE [dbo].[Financer_Master](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[Financer] [varchar](20) NULL,
	[godw_code] [varchar](50) NULL,
	[amount] [decimal](10, 2) NULL,
	[validfrom] [date] NULL,
	[validTo] [date] NULL,
	[Created_At] [datetime2](7) NULL,
	[CREATED_BY] [varchar](200) NULL,
	[ValidFrom1] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo1] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom1], [ValidTo1])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Financer_Master_Hst])
)

ALTER TABLE [dbo].[Financer_Master] ADD  DEFAULT (getdate()) FOR [Created_At]

ALTER TABLE [dbo].[Financer_Master] ADD  DEFAULT (getdate()) FOR [ValidFrom1]`,
    ],
  },
  {
    comments: "Finance Payout",
    ID: 1042,
    queries: [
      `
  alter table icm_ext add [tPayout_Rate] [float] NULL
	alter table icm_ext add [ttotalfin] [float] NULL
	alter table icm_ext add [executive_payout] [float] NULL
	alter table icm_ext add [vechical_invoice] [varchar](100) NULL
	alter table icm_ext add [insurance_policy] [varchar](100) NULL
	alter table icm_ext add [Taxable_Amt] [float] NULL
  alter table newcar_financedetails add icm_tran_id varchar(20)null
`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1043,
    queries: [
      `alter table SHORTLISTED_CANDIDATE alter column SKILLS nvarchar(300)`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1044,
    queries: [
      `
              CREATE TABLE [dbo].[Daily_Task](
          [Tran_id] [int] IDENTITY(1,1) NOT NULL,
          [Emp_Name] [nvarchar](255) NOT NULL,
          [MorningTask] [nvarchar](max) NULL,
          [Status1] [nvarchar](50) NULL,
          [Remark1] [nvarchar](max) NULL,
          [AfternooTask] [nvarchar](max) NULL,
          [Status2] [nvarchar](50) NULL,
          [Remark2] [nvarchar](max) NULL,
          [Create_by] [nvarchar](255) NULL,
          [Create_at] [datetime] NULL,
          [Loc_Code] [varchar](50) NULL,
          [Emp_Date] [date] NULL,
          [Emp_Code] [varchar](255) NULL,
          [FINAL_STATUS] [int] NULL,
          [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
          [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
        PRIMARY KEY CLUSTERED 
        (
          [Tran_id] ASC
        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
          PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
        ) ON [PRIMARY]
        WITH
        (
        SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Daily_Task_Hst])
        )`,
      `ALTER TABLE [dbo].[Daily_Task] ADD  DEFAULT (getdate()) FOR [Create_at]`,
      `ALTER TABLE [dbo].[Daily_Task] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1045,
    queries: [
      `CREATE TABLE [dbo].[Mobile_Rights](
        [utd] [int] IDENTITY(1,1) NOT NULL,
        [Emp_Code] [nvarchar](20) NOT NULL,
        [Optn_Name] [nvarchar](255) NOT NULL,
        [Module_Code] [int] NOT NULL,
        [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
        [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
      PRIMARY KEY CLUSTERED 
      (
        [utd] ASC
      )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
        PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
      ) ON [PRIMARY]
      WITH
      (
      SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Mobile_Rights_Hst])
      )`,
      `ALTER TABLE NEW_JOINING ADD Emgy_No nvarchar (100) null;`,
      `ALTER TABLE NEW_JOINING ADD Emgy_Mob_No nvarchar (20) null;`,
    ],
  },
  {
    comments: "Asset_Request",
    ID: 1046,
    queries: [
      `CREATE TABLE [dbo].[Asset_Request](
      [tran_id] [int] IDENTITY(1,1) NOT NULL,
      [Req_Date] [datetime2](7) NULL,
      [Asset_Category] [varchar](20) NOT NULL,
      [EmpCode] [varchar](20) NULL,
      [OnBehalfEmpCode] [varchar](20) NULL,
      [Reason] [varchar](200) NULL,
      [AssetIssue] [varchar](20) NULL,
      [Quotation] [varchar](255) NULL,
      [Location] [varchar](10) NULL,
      [Created_By] [varchar](255) NULL,
      [Created_At] [datetime] NOT NULL,
      [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
      [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
      [IsApproval] [varchar](10) NULL,
    PRIMARY KEY CLUSTERED 
    (
      [tran_id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
      PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
    ) ON [PRIMARY]
    WITH
    (
    SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Request_Hst])
    )
    
    ALTER TABLE [dbo].[Asset_Request] ADD  DEFAULT (getdate()) FOR [Created_At]
    ALTER TABLE [dbo].[Asset_Request] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "Asset_Request_Dtl",
    ID: 1047,
    queries: [
      `CREATE TABLE [dbo].[Asset_Request_Dtl](
      [tran_id] [int] IDENTITY(1,1) NOT NULL,
      [Product_Code] [varchar](20) NULL,
      [Subcategory] [varchar](20) NULL,
      [Item_Description] [varchar](100) NULL,
      [Quantity] [varchar](20) NOT NULL,
      [Unit_Price] [varchar](20) NULL,
      [Discount] [varchar](20) NULL,
      [Total_Price] [money] NULL,
      [Request_Id] [varchar](20) NULL,
      [ITEM_TYPE] [varchar](20) NULL,
      [HSN] [varchar](20) NULL,
      [UOM1] [varchar](10) NULL,
      [Location] [varchar](10) NULL,
      [Appr_1_Code] [varchar](100) NULL,
      [Appr_1_Stat] [tinyint] NULL,
      [Appr_1_Rem] [varchar](300) NULL,
      [Appr_2_Code] [varchar](100) NULL,
      [Appr_2_Stat] [tinyint] NULL,
      [Appr_2_Rem] [varchar](300) NULL,
      [Appr_3_Code] [varchar](100) NULL,
      [Appr_3_Stat] [tinyint] NULL,
      [Appr_3_Rem] [varchar](300) NULL,
      [Fin_Appr] [tinyint] NULL,
      [srm] [varchar](20) NULL,
      [Created_By] [varchar](255) NULL,
      [Created_At] [datetime] NOT NULL,
      [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
      [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
      [IsApproval] [varchar](10) NULL,
    PRIMARY KEY CLUSTERED 
    (
      [tran_id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
      PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
    ) ON [PRIMARY]
    WITH
    (
    SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Request_Dtl_Hst])
    )
    
    ALTER TABLE [dbo].[Asset_Request_Dtl] ADD  DEFAULT (getdate()) FOR [Created_At]
    
    ALTER TABLE [dbo].[Asset_Request_Dtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "MGA_Approval",
    ID: 1048,
    queries: [
      `CREATE TABLE [dbo].[MGA_Approval](
      [UTD] [int] IDENTITY(1,1) NOT NULL,
      [Req_Date] [datetime2](7) NULL,
      [EmpCode] [varchar](10) NULL,
      [Cust_Id] [varchar](50) NULL,
      [VIN] [varchar](50) NULL,
      [Invoice_No] [varchar](50) NULL,
      [Cust_Name] [varchar](100) NULL,
      [Cust_Mobile] [varchar](15) NULL,
      [MGAIssuedDMS] [varchar](10) NULL,
      [Appr_1_Code] [varchar](100) NULL,
      [Appr_1_Stat] [tinyint] NULL,
      [Appr_1_Date] [datetime2](7) NULL,
      [Appr_1_Rem] [varchar](300) NULL,
      [Appr_2_Code] [varchar](100) NULL,
      [Appr_2_Stat] [tinyint] NULL,
      [Appr_2_Date] [datetime2](7) NULL,
      [Appr_2_Rem] [varchar](300) NULL,
      [Appr_3_Code] [varchar](100) NULL,
      [Appr_3_Stat] [tinyint] NULL,
      [Appr_3_Date] [datetime2](7) NULL,
      [Appr_3_Rem] [varchar](300) NULL,
      [Fin_Appr] [tinyint] NULL,
      [srm] [varchar](20) NULL,
      [Created_By] [varchar](255) NULL,
      [Created_At] [datetime] NOT NULL,
      [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
      [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
      [Location] [varchar](10) NULL,
      [Cust_Status] [varchar](10) NULL,
    PRIMARY KEY CLUSTERED 
    (
      [UTD] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
      PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
    ) ON [PRIMARY]
    WITH
    (
    SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[MGA_Approval_Hst])
    )
    
    ALTER TABLE [dbo].[MGA_Approval] ADD  DEFAULT (getdate()) FOR [Created_At]
    
    ALTER TABLE [dbo].[MGA_Approval] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "MGA_Approval_dtl",
    ID: 1049,
    queries: [
      `CREATE TABLE [dbo].[MGA_Approval_dtl](
      [UTD] [int] IDENTITY(1,1) NOT NULL,
      [MGA_Approval_UTD] [varchar](10) NULL,
      [MGA_Description] [varchar](200) NULL,
      [Quantity] [varchar](10) NULL,
      [Amount] [varchar](10) NULL,
      [Created_By] [varchar](255) NULL,
      [Created_At] [datetime] NOT NULL,
      [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
      [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
    PRIMARY KEY CLUSTERED 
    (
      [UTD] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
      PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
    ) ON [PRIMARY]
    WITH
    (
    SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[MGA_Approval_dtl_Hst])
    )
    
    ALTER TABLE [dbo].[MGA_Approval_dtl] ADD  DEFAULT (getdate()) FOR [Created_At]
    ALTER TABLE [dbo].[MGA_Approval_dtl] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1050,
    queries: [
      `CREATE TABLE [dbo].[announcement_users](
          [id] [int] IDENTITY(1,1) NOT NULL,
          [announcement_id] [int] NOT NULL,
          [employee_code] [nvarchar](255) NOT NULL,
          [status] [nvarchar](10) NULL,
          [ReadDate] [datetime] NULL,
          [created] [datetime] NULL,
        PRIMARY KEY CLUSTERED 
        (
          [id] ASC
        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
        CONSTRAINT [unique_announcement_employee] UNIQUE NONCLUSTERED 
        (
          [announcement_id] ASC,
          [employee_code] ASC
        )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
        ) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[announcement_users] ADD  DEFAULT (getdate()) FOR [created]`,
      `CREATE TABLE [dbo].[announcements](
        [announcement_id] [int] IDENTITY(1,1) NOT NULL,
        [title] [nvarchar](300) NULL,
        [message] [nvarchar](300) NULL,
        [created_by] [nvarchar](15) NULL,
        [send_by] [nvarchar](15) NULL,
        [send_to] [bigint] NOT NULL,
        [status] [varchar](50) NULL,
        [priority] [varchar](50) NULL,
        [attachment_path] [varchar](255) NULL,
        [is_deleted] [bit] NULL,
        [created_at] [datetime] NULL,
      PRIMARY KEY CLUSTERED 
      (
        [announcement_id] ASC
      )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
      ) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[announcements] ADD  DEFAULT ((0)) FOR [is_deleted]`,
      `ALTER TABLE [dbo].[announcements] ADD  DEFAULT (getdate()) FOR [created_at]`,
    ],
  },
  {
    comments: "Demo_Car_Gatepass",
    ID: 1051,
    queries: [
      "alter table demo_car_gatepass add Interbranch_Loc varchar(20) null",
      "alter table demo_car_gatepass add ISFLAG varchar(10) null",
    ],
  },
  {
    comments: "Asset_Request_Dtl",
    ID: 1052,
    queries: [
      "alter table Asset_Request_Dtl add Quotation1 varchar(255) null",
      "alter table Asset_Request_Dtl add Quotation2 varchar(255) null",
      "alter table Asset_Request_Dtl add Quotation3 varchar(255) null",
    ],
  },
  //   {
  //     comments: "Pick_Drop_Collection",
  //     ID: 1053,
  //     queries: [
  //       `CREATE TABLE [dbo].[Pick_Drop_Collection](
  //       [tran_id] [int] IDENTITY(1,1) NOT NULL,
  //       [Req_Date] [datetime2](7) NULL,
  //       [Time] [time](7) NULL,
  //       [Veh_Req] [varchar](50) NULL,
  //       [Customer_Name] [varchar](100) NULL,
  //       [Customer_Mob] [varchar](10) NULL,
  //       [Performa_Inv] [varchar](50) NULL,
  //       [Bill_No] [varchar](50) NULL,
  //       [Inv_Amt] [varchar](50) NULL,
  //       [Driver_Name] [varchar](50) NULL,
  //       [Driver_Mob] [varchar](10) NULL,
  //       [Mode_Payment] [varchar](50) NULL,
  //       [Amount_Paid] [varchar](50) NULL,
  //       [Short_Access] [varchar](50) NULL,
  //       [Location] [varchar](10) NULL,
  //       [Created_By] [varchar](255) NULL,
  //       [Created_At] [datetime] NOT NULL,
  //       [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
  //       [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
  //       [IsUpdate] [varchar](10) NULL,
  //     PRIMARY KEY CLUSTERED 
  //     (
  //       [tran_id] ASC
  //     )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
  //       PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
  //     ) ON [PRIMARY]
  //     WITH
  //     (
  //     SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Pick_Drop_Collection_Hst])
  //     )

  //     ALTER TABLE [dbo].[Pick_Drop_Collection] ADD  DEFAULT (getdate()) FOR [Created_At]

  //     ALTER TABLE [dbo].[Pick_Drop_Collection] ADD  DEFAULT (getdate()) FOR [ValidFrom]
  // Alter table Pick_Drop_Collection add UPIPayment varchar (10) null`,
  //       `ALTER TABLE pick_drop_collection ALTER COLUMN UPIPayment VARCHAR(100)`,
  //       `Alter table pick_drop_collection add Remark varchar(200) null`,
  //       `EXEC sp_rename 'pick_drop_collection.req_date', 'Bill_Date', 'COLUMN'`,
  //       `Alter table [Pick_Drop_Collection] ADD Req_Date  [datetime2](7) NULL`,
  //       `ALTER TABLE PICK_DROP_COLLECTION ADD Receipt_Amt VARCHAR(50) NULL`,
  //     ],
  //   },
  {
    comments: "RTO IMport",
    ID: 1055,
    queries: [
      `CREATE TABLE [dbo].[RTO_IMPORT](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[Inv_No] [varchar](50) NULL,
	[MI_Date] [datetime2](7) NULL,
	[Month][float] NULL,
	[Reg_No] [varchar](50) NULL,
	[VAH_REGNO] [varchar](50) NULL,
	[VAH_CLASS] [varchar](50) NULL,
	[VAH_MODEL] [varchar](50) NULL,
	[VAH_VEHICLECOLOUR] [varchar](50) NULL,
	[VAH_TYPE] [varchar](50) NULL,
	[VAH_OWNER] [varchar](50) NULL,
	[VAH_PRES_ADD] [varchar](400) NULL,
	[VAH_PRES_ADD_DISTRICT] [varchar](100) NULL,
	[VAH_PRES_ADD_STATE] [varchar](100) NULL,
	[VAH_PRES_ADD_CITY] [varchar](100) NULL,
	[VAH_PRES_ADD_PIN] [varchar](100) NULL,
	[VAH_REGAUTHORITY] [varchar](100) NULL,
	[VAH_REGDATE] [datetime2](7) NULL,
	VAH_VEHICLEINSCOMPNAME[varchar](400) NULL,
	VAH_RCFINANCER[varchar](200) NULL,
	VAH_ISCOMMERCIAL[varchar](200) NULL,
	[Created_By] [varchar](255) NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[RTO_IMPORT_HST])
)

ALTER TABLE [dbo].[RTO_IMPORT] ADD  DEFAULT (getdate()) FOR [Created_At]


ALTER TABLE [dbo].[RTO_IMPORT] ADD  DEFAULT (getdate()) FOR [ValidFrom]
`,
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1057,
    queries: [`alter table Mobile_Rights add USER_CODE int`],
  },
  {
    comments: "Finance Payout New",
    ID: 1058,
    queries: [
      `
  alter table icm_ext add [mssf] [varchar](10) NULL
	alter table icm_ext add [mssf_reason] [varchar](200) NULL
	alter table icm_ext add [Rto_Copy] [varchar](400) NULL
	alter table icm_ext add [Emailto] [varchar](200) NULL
	alter table icm_ext add [Emaildate] [datetime2](7) NULL
	alter table icm_ext add [findse] [varchar](20) NULL
	alter table icm_ext add [otherpayout] [float] NULL
	alter table icm_ext add [Taxable] [float] NULL
	alter table icm_ext add [gst] [float] NULL
	alter table icm_ext add [apayout] [float] NULL
	alter table icm_ext add [preinvoice_by] [varchar](50) NULL
	alter table icm_ext add [preinvoice_date] [datetime2](7) NULL
	alter table icm_ext add [remark] [varchar](200) NULL
	alter table icm_ext add [Payout_Received_Amount] [float] NULL
	alter table icm_ext add [Payout_TDS] [float] NULL
	alter table icm_ext add [Receipt_No] [varchar](20) NULL
	alter table icm_ext add [Receipt_Date] [datetime2](7) NULL
	alter table icm_ext add [preinvoice_num] [varchar](50) NULL
	alter table icm_ext add [loc_code] [varchar](10) NULL
	alter table icm_ext add [fin_branch] [varchar](50) NULL
`,
    ],
  },
  {
    comments: "Leave procedure",
    ID: 1060,
    queries: [`create PROCEDURE UpdateOrInsertLeaveBalance
          @Emp_Code VARCHAR(50),
          @Leave_Type INT,
          @Leave_Mnth INT
      AS
      BEGIN
          SET NOCOUNT ON;

          DECLARE @Op_Bal DECIMAL(10, 2);
          DECLARE @Gen_Lev DECIMAL(10, 2) = 0.00; -- Default value
          DECLARE @Avail_Lev DECIMAL(10, 2) = 0.00; -- Default value
          DECLARE @Cl_Bal DECIMAL(10, 2);
          DECLARE @Leave_Yr INT = Year(getdate());
        
          -- Check if the row exists for the current month
          IF EXISTS (SELECT 1 FROM Leave_bal
                    WHERE Emp_Code = @Emp_Code 
                      AND Leave_Type = @Leave_Type 
                      AND Leave_Mnth = @Leave_Mnth 
                      AND Leave_Yr = @Leave_Yr)
          BEGIN

              -- Get current values if row exists
              SELECT @Op_Bal = Op_Bal, 
                    @Gen_Lev = Gen_Lev, 
                    @Avail_Lev = Avail_Lev, 
                    @Cl_Bal = Cl_Bal
              FROM Leave_bal
              WHERE Emp_Code = @Emp_Code 
                AND Leave_Type = @Leave_Type 
                AND Leave_Mnth = @Leave_Mnth 
                AND Leave_Yr = @Leave_Yr;

              -- Check if Cl_Bal calculation is correct
              IF @Cl_Bal <> @Op_Bal + @Gen_Lev - @Avail_Lev
              BEGIN
                  -- Update Cl_Bal for current month
                  SET @Cl_Bal = @Op_Bal + @Gen_Lev - @Avail_Lev;

                  UPDATE Leave_bal
                  SET Cl_Bal = @Cl_Bal
                  WHERE Emp_Code = @Emp_Code 
                    AND Leave_Type = @Leave_Type 
                    AND Leave_Mnth = @Leave_Mnth 
                    AND Leave_Yr = @Leave_Yr;
              END
          END
          ELSE
          BEGIN
          IF EXISTS (SELECT 1 FROM Leave_bal
                    WHERE Emp_Code = @Emp_Code 
                      AND Leave_Type = @Leave_Type 
                      AND Leave_Yr = @Leave_Yr
                      AND Leave_Mnth > @Leave_Mnth)
          BEGIN
              -- Skip insertion if a future month record exists
              PRINT 'Cannot insert previous month row as a subsequent month record already exists.';
              RETURN;
          END
              -- Insert new row for the current month if it does not exist
              -- Get previous month's Cl_Bal as the Op_Bal
              SELECT @Op_Bal = Cl_Bal
              FROM Leave_bal
              WHERE Emp_Code = @Emp_Code 
                AND Leave_Type = @Leave_Type 
                AND Leave_Mnth = @Leave_Mnth - 1 
                AND Leave_Yr = @Leave_Yr;

              IF @Op_Bal IS NULL
                  SET @Op_Bal = 0.00; -- Default to 0 if no previous month exists

              -- Calculate Cl_Bal for the new month
              SET @Cl_Bal = @Op_Bal + @Gen_Lev - @Avail_Lev;

              -- Insert the new row
              INSERT INTO Leave_bal (Emp_Code, Leave_Type, Leave_Mnth, Op_Bal, Gen_Lev, Avail_Lev, Cl_Bal, Leave_Yr)
              VALUES (@Emp_Code, @Leave_Type, @Leave_Mnth, @Op_Bal, @Gen_Lev, @Avail_Lev, @Cl_Bal, @Leave_Yr);
          END

          -- Propagate Cl_Bal changes to all subsequent months
          DECLARE @NextMonth INT = @Leave_Mnth + 1;
          DECLARE @NewOp_Bal DECIMAL(10, 2) = @Cl_Bal;

          WHILE EXISTS (SELECT 1 FROM Leave_bal
                        WHERE Emp_Code = @Emp_Code 
                          AND Leave_Type = @Leave_Type 
                          AND Leave_Mnth = @NextMonth 
                          AND Leave_Yr = @Leave_Yr)
          BEGIN
              -- Update each subsequent month based on the previous month’s Cl_Bal
              UPDATE Leave_bal
              SET Op_Bal = @NewOp_Bal,
                  Cl_Bal = @NewOp_Bal + Gen_Lev - Avail_Lev
              WHERE Emp_Code = @Emp_Code 
                AND Leave_Type = @Leave_Type 
                AND Leave_Mnth = @NextMonth 
                AND Leave_Yr = @Leave_Yr;

              -- Get the updated Cl_Bal for the next iteration
              SELECT @NewOp_Bal = Cl_Bal
              FROM Leave_bal
              WHERE Emp_Code = @Emp_Code 
                AND Leave_Type = @Leave_Type 
                AND Leave_Mnth = @NextMonth 
                AND Leave_Yr = @Leave_Yr;

              -- Move to the next month
              SET @NextMonth = @NextMonth + 1;
          END
      END;
    `],
  },
  {
    comments: "Payout",
    ID: 1061,
    queries: [`alter table dise_aprvl add mssfoffer float null`],
  },
  // {
  //   comments: "In_Service",
  //   ID: 1062,
  //   queries: [
  //     `CREATE TABLE [dbo].[In_Service](
  //       [UTD] [int] IDENTITY(1,1) NOT NULL,
  //       [Veh_Req] [varchar](50) NULL,
  //       [Customer_Name] [varchar](100) NULL,
  //       [Visit_Purpose] [varchar](10) NULL,
  //       [InTime] [datetime] NULL,
  //       [OutTime] [time](7) NULL,
  //       [Location] [varchar](10) NULL,
  //       [Created_By] [varchar](255) NULL,
  //       [Created_At] [datetime] NOT NULL,
  //       [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
  //       [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
  //       [Req_Date] [datetime2](7) NULL,
  //     PRIMARY KEY CLUSTERED 
  //     (
  //       [UTD] ASC
  //     )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
  //       PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
  //     ) ON [PRIMARY]
  //     WITH
  //     (
  //     SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[In_Service_Hst])
  //     )

  //     ALTER TABLE [dbo].[In_Service] ADD  CONSTRAINT [DF_In_Service_InTime]  DEFAULT (getdate()) FOR [InTime]

  //     ALTER TABLE [dbo].[In_Service] ADD  DEFAULT (getdate()) FOR [Created_At]

  //     ALTER TABLE [dbo].[In_Service] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
  //   ],
  // },
  {
    comments: "Employeemaster new fields",
    ID: 1064,
    queries: [`alter table employeemaster add
      CATEGORY int,
      CLUSTER int ,
      CHANNEL int ,
      COSTCENTRE int `],
  },
  {
    comments: "Employeemaster",
    ID: 1066,
    queries: [`IF NOT EXISTS (SELECT 1 FROM Asset_Issue)
      BEGIN 
            DROP TABLE Asset_Issue;
      END`,
      `CREATE TABLE [dbo].[Asset_Issue](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[SRNO] [int] NULL,
	[Emp_Code] [nvarchar](50) NULL,
	[Aset_Code] [nvarchar](250) NULL,
	[Emp_Loc] [nvarchar](100) NULL,
	[Issue_Date] [date] NULL,
	[Issue_Rem] [nvarchar](150) NULL,
	[Revoke_Date] [date] NULL,
	[Revoke_User] [int] NULL,
	[Revoke_Cond] [nvarchar](150) NULL,
	[Revoke_Rem] [nvarchar](150) NULL,
	[Export_type] [int] NULL,
	[Loc_Code] [int] NULL,
	[Inv_No] [int] NULL,
	[Emp_Dept] [nvarchar](100) NULL,
	[Asset_Serial_no] [nvarchar](100) NULL,
	[Asset_Type] [nvarchar](100) NULL,
	[Lost_Date] [date] NULL,
	[sr_no] [int] NULL,
	[Created_At] [datetime] NOT NULL,
	[Created_by] [varchar](100) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[Aset_Name] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_Issue_Hst])
)`,
      `ALTER TABLE [dbo].[Asset_Issue] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[Asset_Issue] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `CREATE TABLE [dbo].[Emp_Edu](
	[Utd] [int] IDENTITY(1,1) NOT NULL,
	[SRNO] [int] NULL,
	[Emp_Degree] [nvarchar](30) NULL,
	[Emp_Board] [nvarchar](30) NULL,
	[Emp_College] [nvarchar](30) NULL,
	[Emp_Passing_year] [nvarchar](4) NULL,
	[Emp_Percentage] [money] NULL,
	[Created_by] [nvarchar](30) NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[SNo] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[Utd] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Emp_Edu_Hst])
)`,
      `ALTER TABLE [dbo].[Emp_Edu] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[Emp_Edu] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `CREATE TABLE [dbo].[Emp_Experience](
	[Utd] [int] IDENTITY(1,1) NOT NULL,
	[SRNO] [int] NULL,
	[Emp_Company] [nvarchar](30) NULL,
	[Emp_Designation] [nvarchar](30) NULL,
	[Emp_Responsibility] [nvarchar](30) NULL,
	[Emp_From_Date] [datetime2](7) NULL,
	[Emp_To_Date] [datetime2](7) NULL,
	[Emp_Settlement_Done] [nvarchar](30) NULL,
	[Emp_Drawn_Salary] [money] NULL,
	[Emp_Leaving_Reason] [nvarchar](50) NULL,
	[Created_by] [nvarchar](30) NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[SNo] [varchar](10) NULL,
PRIMARY KEY CLUSTERED 
(
	[Utd] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Emp_Experience_Hst])
)`,
      `ALTER TABLE [dbo].[Emp_Experience] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[Emp_Experience] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `CREATE TABLE [dbo].[Emp_Family](
	[Utd] [int] IDENTITY(1,1) NOT NULL,
	[SRNO] [int] NULL,
	[Emp_Family_name] [nvarchar](30) NULL,
	[Emp_Family_DOB] [date] NULL,
	[Emp_Family_Relation] [nvarchar](30) NULL,
	[Emp_Family_Address] [nvarchar](30) NULL,
	[Emp_Family_Bloodgroup] [nvarchar](30) NULL,
	[Emp_Family_Gender] [nvarchar](30) NULL,
	[Emp_Family_Mobileno] [nvarchar](30) NULL,
	[Emp_Family_emailid] [nvarchar](30) NULL,
	[Emp_Family_Profession] [nvarchar](30) NULL,
	[Created_by] [nvarchar](30) NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[SNo] [varchar](10) NULL,
PRIMARY KEY CLUSTERED 
(
	[Utd] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Emp_Family_Hst])
)`,
      `ALTER TABLE [dbo].[Emp_Family] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[Emp_Family] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `CREATE TABLE [dbo].[Emp_ITSkill](
	[Utd] [int] IDENTITY(1,1) NOT NULL,
	[SRNO] [int] NULL,
	[Emp_Tool] [nvarchar](30) NULL,
	[Emp_Version] [nvarchar](30) NULL,
	[Emp_Proficiency] [nvarchar](30) NULL,
	[Emp_Last_Used] [nvarchar](4) NULL,
	[Emp_Experience] [nvarchar](4) NULL,
	[Created_by] [nvarchar](30) NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Utd] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Emp_ITSkill_Hst])
)`,
      `ALTER TABLE [dbo].[Emp_ITSkill] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[Emp_ITSkill] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `CREATE TABLE [dbo].[Emp_Lang](
	[Utd] [int] IDENTITY(1,1) NOT NULL,
	[SRNO] [int] NULL,
	[Emp_Language] [nvarchar](30) NULL,
	[Emp_Language_Understand] [nvarchar](30) NULL,
	[Emp_Language_Speak] [nvarchar](30) NULL,
	[Emp_Language_Read] [nvarchar](30) NULL,
	[Emp_Language_Write] [nvarchar](30) NULL,
	[Created_by] [nvarchar](30) NOT NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[SNo] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[Utd] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Emp_Lang_Hst])
)`,
      `ALTER TABLE [dbo].[Emp_Lang] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[Emp_Lang] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `CREATE TABLE [dbo].[NewCar_AuditLogs](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[qr_id] [int] NULL,
	[User_Code] [varchar](50) NULL,
	[EMPCODE] [varchar](50) NULL,
	[Loc_Code] [int] NULL,
	[AuditTime] [datetime] NULL,
	[Latitude] [nvarchar](20) NULL,
	[Longitude] [nvarchar](20) NULL,
	[VIN] [nvarchar](40) NULL,
	[Remark] [nvarchar](255) NULL
) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[NewCar_AuditLogs] ADD  DEFAULT (getdate()) FOR [AuditTime]`,
      `CREATE TABLE [dbo].[NewCar_StockAudit](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[vin] [nvarchar](50) NULL,
	[chassis] [nvarchar](50) NULL,
	[engine] [nvarchar](50) NULL,
	[model_color] [nvarchar](100) NULL,
	[model_name] [nvarchar](150) NULL,
	[model_code] [nvarchar](50) NULL,
	[Loc_Code] [varchar](100) NULL,
	[created_at] [datetime] NULL
) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[NewCar_StockAudit] ADD  DEFAULT (getdate()) FOR [created_at]`],
  },
  {
    comments: "Payout 1",
    ID: 1067,
    queries: [`alter table icm_ext  add export_type varchar(10) null`,
      `alter table  icm_ext add payout_type varchar(20) null`],
  },
  {
    comments: "Discount Offer",
    ID: 1068,
    queries: [`CREATE TABLE [dbo].[Discount_Offers](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[Model_Group] [varchar](20)  NULL,
	[Model_Group_Name] [varchar](200)NULL,
	[Model_Code] [varchar](20)  NULL,
	[Model_Name] [varchar](200)  NULL,
	[MI_Date]date null,
	[Consumer]float null,
	[Exch]float null,
	[Mssf]float null,
	[Corporate1]float null,
	[Corporate2]float null,
	[Valid_From]date null,
	[Valid_Upto]date null,
	[State][varchar](20)  NULL,
	[Region][varchar](20)  NULL,
	[Created_By] [varchar](255) NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Discount_Offers_Hst])
)
GO

ALTER TABLE [dbo].[Discount_Offers] ADD  DEFAULT (getdate()) FOR [Created_At]
GO

ALTER TABLE [dbo].[Discount_Offers] ADD  DEFAULT (getdate()) FOR [ValidFrom]
GO`,
    ],
  },
  {
    comments: "Discount Offer 2",
    ID: 1069,
    queries: [`
      alter table Discount_OFfers add MarutiEmp float null
alter table Discount_OFfers add MI_Date_Upto date null
alter table Discount_OFfers add MeriMaruti float null
alter table Discount_OFfers add scrappage float null
      `,
    ],
  },
  // {
  //   comments: "Pick_Drop_Collection",
  //   ID: 1070,
  //   queries: [
  //     "ALTER TABLE [Pick_Drop_Collection] ADD CONSTRAINT DF_Pick_Drop_Collection_Time DEFAULT GETDATE() FOR [Time]",
  //     "ALTER TABLE [Pick_Drop_Collection] ADD CONSTRAINT DF_Pick_Drop_Collection_Req_Date DEFAULT GETDATE() FOR [Req_Date]",
  //   ],
  // },
  // {
  //   comments: "In_Service",
  //   ID: 1071,
  //   queries: [
  //     "ALTER TABLE [In_Service] ADD CONSTRAINT DF_In_Service_Req_Date DEFAULT GETDATE() FOR [Req_Date]",
  //   ],
  // },
  {
    comments: "Discount Offer 2",
    ID: 1073,
    queries: [`
      alter table Discount_OFfers add MarutiEmp float null
alter table Discount_OFfers add MI_Date_Upto date null
alter table Discount_OFfers add MeriMaruti float null
alter table Discount_OFfers add scrappage float nul
      `,
    ],
  },
  {
    comments: "User Table",
    ID: 1074,
    queries: [`
      alter table user_tbl alter column emp_dms_code varchar(100)null

      `,
    ],
  },
  {
    comments: "Demo_Car_Gatepass",
    ID: 1075,
    queries: [
      "alter table demo_car_gatepass add Enquiry_No varchar(30) null",
    ],
  },
  {
    comments: "User Table",
    ID: 1075,
    queries: [`
      CREATE TABLE [dbo].[Dispatch_Dump](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	DELR varchar(10)NULL,
    CITY varchar(10)NULL,
    INVOICETYPE CHAR(1)NULL,
    Fin_No varchar(20)NULL,
    Invoice_GP_No varchar(20)NULL,
    GR_No varchar(20)NULL,
    ACCOUNTCODE CHAR(1)NULL,
    MODELCODE varchar(20)NULL,
    COLOR varchar(10)NULL,
    CHASSISPREFIX varchar(20)NULL,
    CHASSISNO varchar(20)NULL,
    ENGINENO varchar(20)NULL,
    INVOICEDATE DATE NULL,
    INV_DATE_FOR_ROAD_PERMIT DATE NULL,
    Basic_Value float NULL,
    Discount float NULL,
    DRF float NULL,
    Assessable_Value float NULL,
    IGST float NULL,
    Cess float NULL,
    TCS float NULL,
    InvoiceAmt float NULL,
    ORDERCATEGORY varchar(10) NULL,
    PLANT varchar(10) NULL,
    TIN varchar(20)NULL,
    SENTBY varchar(50) NULL,
    TRIPNO varchar(20) NULL,
    TRANSPORTREGNUMBER varchar(20) NULL,
    INDENT varchar(20) NULL,
    TRANSNAME varchar(100) NULL,
    EMAILID varchar(100) NULL,
    FINANCIER varchar(50) NULL,
	[Created_By] [varchar](255) NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Dispatch_Dump_Hst])
)
ALTER TABLE [dbo].[Dispatch_Dump] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[Dispatch_Dump] ADD  DEFAULT (getdate()) FOR [ValidFrom]
      `,
      `CREATE TABLE [dbo].[CHAS_TRANSIT](
	[Tran_Id] [int] NOT NULL,
	[CHAS_ID] [int] NULL,
	[TRAN_TYPE] [int] NULL,
	[Tran_Date] [date] NULL,
	[Tran_Amt] [money] NULL,
	[Asset_Ledg] [int] NULL,
	[Income_Ledg] [int] NULL,
	[Loc_Code] [int] NULL,
	[Export_Type] [int] NULL,
	[Item_Type] [int] NULL,
	[Item_Seq] [int] NULL
) ON [PRIMARY]`
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1076,
    queries: [
      `CREATE TABLE [dbo].[In_Service](
        [UTD] [int] IDENTITY(1,1) NOT NULL,
        [Veh_Req] [varchar](50) NULL,
        [Customer_Name] [varchar](100) NULL,
        [Visit_Purpose] [varchar](10) NULL,
        [InTime] [datetime] NULL,
        [OutTime] [time](7) NULL,
        [Location] [varchar](10) NULL,
        [Created_By] [varchar](255) NULL,
        [Created_At] [datetime] NOT NULL,
        [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
        [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
        [Req_Date] [datetime2](7) NULL,
      PRIMARY KEY CLUSTERED 
      (
        [UTD] ASC
      )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
        PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
      ) ON [PRIMARY]
      WITH
      (
      SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[In_Service_Hst])
      )`,
      `ALTER TABLE [dbo].[In_Service] ADD  CONSTRAINT [DF_In_Service_InTime]  DEFAULT (getdate()) FOR [InTime]`,
      `ALTER TABLE [dbo].[In_Service] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[In_Service] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `ALTER TABLE [dbo].[In_Service] ADD  CONSTRAINT [DF_In_Service_Req_Date]  DEFAULT (getdate()) FOR [Req_Date]`,
      `CREATE TABLE [dbo].[Pick_Drop_Collection](
	[tran_id] [int] IDENTITY(1,1) NOT NULL,
	[Bill_Date] [datetime2](7) NULL,
	[Time] [time](7) NULL,
	[Veh_Req] [varchar](50) NULL,
	[Customer_Name] [varchar](100) NULL,
	[Customer_Mob] [varchar](10) NULL,
	[Performa_Inv] [varchar](50) NULL,
	[Bill_No] [varchar](50) NULL,
	[Inv_Amt] [varchar](50) NULL,
	[Driver_Name] [varchar](50) NULL,
	[Driver_Mob] [varchar](10) NULL,
	[Mode_Payment] [varchar](50) NULL,
	[Amount_Paid] [varchar](50) NULL,
	[Short_Access] [varchar](50) NULL,
	[Location] [varchar](10) NULL,
	[Created_By] [varchar](255) NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[IsUpdate] [varchar](10) NULL,
	[UPIPayment] [varchar](100) NULL,
	[Remark] [varchar](200) NULL,
	[Req_Date] [datetime2](7) NULL,
	[Receipt_Amt] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[tran_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Pick_Drop_Collection_Hst])
)`,
      `ALTER TABLE [dbo].[Pick_Drop_Collection] ADD  CONSTRAINT [DF_Pick_Drop_Collection_Time]  DEFAULT (getdate()) FOR [Time]`,
      `ALTER TABLE [dbo].[Pick_Drop_Collection] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[Pick_Drop_Collection] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `ALTER TABLE [dbo].[Pick_Drop_Collection] ADD  CONSTRAINT [DF_Pick_Drop_Collection_Req_Date]  DEFAULT (getdate()) FOR [Req_Date]`
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1077,
    queries: [`alter table in_service add Cust_Mob varchar(20) null`],
  },
  {
    comments: "New_dev_Code",
    ID: 1078,
    queries: [`ALTER TABLE pot_cust_dtl
    ADD Req_Time TIME NULL,  
    Mrp DECIMAL(18, 2) NULL;`],
  },
  {
    comments: "Asset new",
    ID: 1079,
    queries: [`alter table Asset_Product add Unit_Rate float`],
  },
  {
    comments: "Assets_Group_Subcategory",
    ID: 1080,
    queries: [
      "alter table Assets_Group_Subcategory add UOM varchar(10) null",
      "alter table Assets_Group_Subcategory add itemType varchar(10) null",
      "alter table Assets_Group_Subcategory add HSN varchar(10) null",
    ],
  },
  {
    comments: "In_Service",
    ID: 1081,
    queries: [
      "ALTER TABLE In_Service ALTER COLUMN OutTime DATETIME NULL",
    ],
  },
  {
    comments: "VAS_TRAN_TYPE",
    ID: 1082,
    queries: [
      "ALTER TABLE VAS_TEMP ADD TRAN_TYPE int",
    ],
  },
  {
    comments: "New_dev_Code",
    ID: 1083,
    queries: [
      'alter table rtl_mst alter column [TD_Date] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Book_Date] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Book_Cncl] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Part_Pymt1] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Part_Pymt2] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Lost_Date] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Cncl_Date] [datetime2](7) NULL',
      'alter table rtl_mst alter column [ENTR_DATE] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Reg_Date] [datetime2](7) NULL',
      'alter table rtl_mst alter column [DO_Date] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Exp_Del_Date] [datetime2](7) NULL',
      'alter table rtl_mst alter column [DOB] [datetime2](7) NULL',
      'alter table rtl_mst alter column [DOM] [datetime2](7) NULL',
      'alter table rtl_mst alter column [NDOB] [datetime2](7) NULL',
      'alter table rtl_mst alter column [DSE_Gen] [varchar](50) NULL',
      'alter table rtl_mst alter column [Full_Pymt] [money] NULL',
      'alter table rtl_mst alter column [Soft_Date_1] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Soft_Date_2] [datetime2](7) NULL',
      'alter table rtl_mst alter column [Soft_Date_3] [datetime2](7) NULL',
      'alter table rtl_mst alter column [File_Date_1] [datetime2](7) NULL',
      'alter table rtl_mst alter column [File_Date_2] [datetime2](7) NULL',
      'alter table rtl_mst alter column [File_Date_3] [datetime2](7) NULL',

      `alter table rtl_mst add
        [Exp_Del_Date] [datetime2](7) NULL,
        [Veh_Amt] [money] NULL,
        [Insu_Amt] [money] NULL,
        [RTO_Amt] [money] NULL,
        [war_Amt] [money] NULL,
        [Acc_Amt] [money] NULL,
        [Loy_Card_Amt] [money] NULL,
        [Other_Charge] [money] NULL,
        [Disc_Amt] [money] NULL,
        [Total_Amt] [money] NULL,
        [Book_No] [varchar](50) NULL,
        [Book_Mode] [int] NULL,
        [Lost_Reason] [varchar](200) NULL,
        [enquiry_date] [datetime2](7) NULL,
        [Modl_Var] [int] NULL,
        [ImgSourseArray1] [varchar](5000) NULL,
        [docs] [varchar](5000) NULL,
        [book_attachment] [nvarchar](300) NULL,
        [Alot_chas] [nvarchar](50) NULL
    `, `CREATE TABLE [dbo].[QUOTATION](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[tran_id] [int] NULL,
	[quotation_date] [date] NULL,
	[enquiry_no] [varchar](50) NULL,
	[date] [datetime2](7) NULL,
	[party_name] [varchar](255) NULL,
	[address] [varchar](255) NULL,
	[whatsApp_no] [varchar](20) NULL,
	[email] [varchar](255) NULL,
	[dse] [varchar](255) NULL,
	[tl] [varchar](255) NULL,
	[remark] [varchar](max) NULL,
	[model] [varchar](255) NULL,
	[variant] [varchar](255) NULL,
	[color] [varchar](255) NULL,
	[quantity] [varchar](50) NULL,
	[rate] [decimal](18, 2) NULL,
	[consumer_offer] [money] NULL,
	[corporate_offer] [money] NULL,
	[exchange_offer] [money] NULL,
	[additional_offer] [money] NULL,
	[insurance_amount] [money] NULL,
	[rto_amount] [money] NULL,
	[mga] [money] NULL,
	[ew] [money] NULL,
	[ccp] [money] NULL,
	[fastag] [money] NULL,
	[Auto_card] [money] NULL,
	[other_charges] [money] NULL,
	[total_price] [money] NULL,
	[loc_code] [varchar](15) NULL,
	[create_by] [varchar](100) NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[pdf] [varchar](255) NULL,
	[ServerId] [nvarchar](10) NULL,
	[export_type] [nvarchar](10) NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[QUOTATION_Hst])
)`, `ALTER TABLE [dbo].[QUOTATION] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `ALTER TABLE [dbo].[QUOTATION] ADD  DEFAULT (getdate()) FOR [ValidFrom]`,
      `alter table enq_dtl add [Dse_Reg] [varchar](50) NULL,
	[Dse_Reg_Label] [varchar](100) NULL`],
  },
  {
    comments: "Asset_Request_Dtl",
    ID: 1084,
    queries: [
      "alter table Asset_Request_Dtl add SpecialApr_Code Varchar(20) null",
      "alter table Asset_Request_Dtl add SpecialApr_Stat Varchar(20) null",
      "alter table Asset_Request_Dtl add SpecialApr_Remark Varchar(200) null",
      "alter table Asset_Request_dtl add IsSpecialApr varchar(10) null"
    ],
  },
  {
    comments: "Purchase_Order_Product_Details",
    ID: 1085,
    queries: [
      "alter table Purchase_Order_Product_Details add PurchaseRequest_UTD varchar(20) null"
    ],
  },
  {
    comments: "Asset_Product",
    ID: 1085,
    queries: [
      "alter table Asset_Product add MRP varchar(20) null",
      "alter table Asset_Product add Price varchar(10) null",
    ],
  },
  {
    comments: "Payment Tracker",
    ID: 1086,
    queries: [`CREATE TABLE [dbo].[Payment_Tracker](
	[tran_id] [int] IDENTITY(1,1) NOT NULL,
	[Req_Date] [datetime2](7) NULL,
	[Customer_Name] [varchar](100) NULL,
	[Mobile_No] [varchar](20) NULL,
	[Model_Variant] [varchar](20) NULL,
	[Bill_No] [varchar](20) NULL,
	[Mode_OF_Payement] [varchar](20) NULL,
	[Amount] [money] NULL,
	[Location] [varchar](10) NULL,
	[Appr_1_Code] [varchar](100) NULL,
	[Appr_1_Stat] [tinyint] NULL,
	[Appr_1_Date] [datetime2](7) NULL,
	[Appr_1_Rem] [varchar](300) NULL,
	[Appr_2_Code] [varchar](100) NULL,
	[Appr_2_Stat] [tinyint] NULL,
	[Appr_2_Date] [datetime2](7) NULL,
	[Appr_2_Rem] [varchar](300) NULL,
	[Appr_3_Code] [varchar](100) NULL,
	[Appr_3_Stat] [tinyint] NULL,
	[Appr_3_Date] [datetime2](7) NULL,
	[Appr_3_Rem] [varchar](300) NULL,
	[Fin_Appr] [tinyint] NULL,
	[srm] [varchar](20) NULL,
	[Created_By] [varchar](255) NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[Dise_Amt] [float] NULL,
	[Approved_amt] [float] NULL,
PRIMARY KEY CLUSTERED 
(
	[tran_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Payment_Tracker_Hst])
)
ALTER TABLE [dbo].[Payment_Tracker] ADD  DEFAULT (getdate()) FOR [Req_Date]
ALTER TABLE [dbo].[Payment_Tracker] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[Payment_Tracker] ADD  DEFAULT (getdate()) FOR [ValidFrom]
`],
  },
  {
    comments: "Asset_MonthWise_PurchaseValue",
    ID: 1087,
    queries: [`CREATE TABLE [dbo].[Asset_MonthWise_PurchaseValue](
      [Id] [int] IDENTITY(1,1) NOT NULL,
      [SubcategoryId] [varchar](10) NOT NULL,
      [Month] [varchar](10) NULL,
      [Purchase_Value] [varchar](50) NULL,
      [Created_At] [datetime2](7) NULL,
      [Created_by] [varchar](100) NULL,
      [ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
      [ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
    PRIMARY KEY CLUSTERED 
    (
      [Id] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
      PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
    ) ON [PRIMARY]
    WITH
    (
    SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Asset_MonthWise_PurchaseValue_Hst])
    )
    
    ALTER TABLE [dbo].[Asset_MonthWise_PurchaseValue] ADD  DEFAULT (getdate()) FOR [Created_At]
`],
  },
  {
    comments: "purchase_request",
    ID: 1088,
    queries: [
      "ALTER TABLE purchase_request ALTER COLUMN Contact_Number VARCHAR(20) NULL",
    ],
  },
  {
    comments: "purchase_request",
    ID: 1089,
    queries: [
      "ALTER TABLE PRODUCT_SERVICE ADD [Service_Status] [varchar](50) NULL",
    ],
  },
  {
    comments: "purchase_request",
    ID: 1090,
    queries: [
      "ALTER TABLE TV_ICM_MST ADD DMS_SALE_INV nvarchar(50)",
    ],
  },
  {
    comments: "purchase_request",
    ID: 1091,
    queries: [
      "ALTER TABLE TV_ICM_MST ADD SALE_STOCK_TYPE nvarchar(20)",
    ],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1093,
    queries: [`alter table Pot_cust_dtl add Spm_Order_Qty [nvarchar](100) NULL;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1094,
    queries: [`ALTER TABLE TV_ICM_MST ADD VEH_STAT nvarchar(20);`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1095,
    queries: [`ALTER TABLE TV_ICM_MST ADD RC_VAL_UPTO SMALLDATETIME;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1096,
    queries: [`ALTER TABLE TV_ICM_MST ADD INSU_VAL_UPTO SMALLDATETIME;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1097,
    queries: [`ALTER TABLE TV_ICM_MST ADD LOAN_AMT money;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1098,
    queries: [`ALTER TABLE TV_ICM_MST ADD CHALLAN_AMT money;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1099,
    queries: [`ALTER TABLE TV_ICM_MST ADD DOC_TRF_CHRGS money;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1100,
    queries: [`ALTER TABLE TV_ICM_MST ADD CHALLAN_DATE SMALLDATETIME;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1101,
    queries: [`ALTER TABLE TV_ICM_MST ADD REG_DATE SMALLDATETIME;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1102,
    queries: [`ALTER TABLE DemoCarMaster ADD VEH_TYPE nvarchar(200);`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1103,
    queries: [`ALTER TABLE DemoCarMaster ADD RESP_PERSON nvarchar(200);`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1104,
    queries: [`ALTER TABLE DemoCarMaster ADD INSU_POL_NO nvarchar(200);`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1105,
    queries: [`ALTER TABLE DemoCarMaster ADD INSU_POL_DATE SMALLDATETIME;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1106,
    queries: [`ALTER TABLE DemoCarMaster ADD PUC_ISSUE_DATE SMALLDATETIME;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1107,
    queries: [`ALTER TABLE DemoCarMaster ADD REGISTRATION_NAME nvarchar(200);`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1108,
    queries: [`ALTER TABLE DemoCarMaster ADD HYP_STAT nvarchar(200);`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1109,
    queries: [`ALTER TABLE DemoCarMaster ADD AUDIT_DATE SMALLDATETIME;`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1110,
    queries: [`ALTER TABLE DemoCarMaster ADD AUDIT_REM nvarchar(400);`],
  },
  {
    comments: "Pot cust Given by Umesh",
    ID: 1111,
    queries: [`ALTER TABLE DemoCarMaster ADD REMARK nvarchar(400);`],
  },
  {
    comments: "Dashboard parameters",
    ID: 1112,
    queries: [`CREATE TABLE [dbo].[Dashboard_Master](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](50) NULL,
	[Branch] [varchar](50) NULL,
	[amount] [decimal](10, 2) NULL,
	[validfrom] [date] NULL,
	[validTo] [date] NULL,
	[Created_At] [datetime2](7) NULL,
	[CREATED_BY] [varchar](200) NULL,
	[ValidFrom1] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo1] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom1], [ValidTo1])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Dashboard_Master_Hst])
)
ALTER TABLE [dbo].[Dashboard_Master] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[Dashboard_Master] ADD  DEFAULT (getdate()) FOR [ValidFrom1]

`],
  },
  {
    comments: "New_dev_Code",
    ID: 1113,
    queries: [`alter table employeemaster add [PAN_CARD_VER] [bit] NULL,
      [AADHAR_CARD_VER] [bit] NULL,
      [DRIVING_VER] [bit] NULL,
      [PASSPORT_VER] [bit] NULL,
      [RESIGNATION_SUBMISSION_DATE] [date] NULL,
      [REASON_FOR_RESIGNATION] [nvarchar](500) NULL,
      [TEN_LEAVE_DATE] [date] NULL,
      [SEPERATIONREMARKS] [nvarchar](500) NULL,
      [SEPARATION_MODE] [nvarchar](10) NULL,
      [DATE_OF_SETTLEMENT] [date] NULL,
      [INTERVIEWREMAKS] [nvarchar](500) NULL,
      [DATE_OF_EXIT_INTERVIEW] [date] NULL,
      [EXP_IN_YEAR] [nvarchar](10) NULL`],
  },
  {
    comments: "New_dev_Code",
    ID: 1114,
    queries: [
      `drop procedure GetEmployeeLocation`,
      `CREATE PROCEDURE GetEmployeeLocation 
				        @EmployeeCode NVARCHAR(50),    
                @Latitude VARCHAR(20),    
                @Longitude VARCHAR(20)    
            AS    
            BEGIN  
				DECLARE @GeoLocationStrings NVARCHAR(MAX);    
				DECLARE @Geofence GEOMETRY;    
				DECLARE @Geofence_concat VARCHAR(300);    
				DECLARE @Usergeofence VARCHAR(5);  
				DECLARE @LocationFound BIT = 0;

				-- Check if the user has the right to apply from anywhere
    
				DECLARE @Permission NVARCHAR(5);  
				-- Check user permissions
				SELECT @Permission = COALESCE((
					SELECT TOP 1 
						CASE 
							WHEN Optn_Name = '1.1.1.2' THEN 'ALL'
							WHEN Optn_Name = '1.1.1.1' THEN 'USER'
						END
					FROM Mobile_Rights
					WHERE Emp_Code = @EmployeeCode AND Optn_Name IN ('1.1.1.1', '1.1.1.2')
				), 'ALLOW');

				-- Fetch geofences based on permissions
				IF @Permission = 'ALLOW'
				BEGIN
					-- Return 1 if no permissions are found, implying 'ALLOW'
					SELECT 1 AS Result;
					RETURN;
				END
				ELSE IF @Permission = 'ALL'
				BEGIN
					-- Fetch geofences for all locations
					SELECT @GeoLocationStrings = STRING_AGG(Spl_Rem, '|')
					FROM Misc_Mst
					WHERE Misc_Type = 85 AND Export_Type < 3;
				END
				ELSE IF @Permission = 'USER'
				BEGIN
					-- Fetch geofences only for user's assigned locations
					SELECT @GeoLocationStrings = STRING_AGG(Spl_Rem, '@')
					FROM Misc_Mst
					WHERE Misc_Code IN (
						SELECT Location 
						FROM EMPLOYEEMASTER 
						WHERE EMPCODE = @EmployeeCode AND Export_Type < 3
					)
					AND Misc_Type = 85 AND Export_Type < 3;
				END

				IF @GeoLocationStrings IS NULL    
				BEGIN    
					SELECT 'Geo location is not set for the specified locations' AS Result;    
					RETURN;    
				END    
				-- Loop through each geofence
				DECLARE @GeoString NVARCHAR(300);
				DECLARE GeoCursor CURSOR FOR 
				SELECT value 
				FROM STRING_SPLIT(@GeoLocationStrings, '|');

				OPEN GeoCursor;
				FETCH NEXT FROM GeoCursor INTO @GeoString;

				WHILE @@FETCH_STATUS = 0
				BEGIN
					-- Convert the geofence string into a POLYGON
					SET @Geofence_concat = 'POLYGON((' +     
						(SELECT STRING_AGG(    
							CONVERT(NVARCHAR, CAST(SUBSTRING(value, 1, CHARINDEX(',', value) - 1) AS DECIMAL(30, 6))) + ' ' +    
							CONVERT(NVARCHAR, CAST(SUBSTRING(value, CHARINDEX(',', value) + 1, LEN(value)) AS DECIMAL(30, 6))),     
							','    
						)     
						FROM STRING_SPLIT(@GeoString, '@')) +     
						'))';    

					SET @Geofence = GEOMETRY::STGeomFromText(@Geofence_concat, 4326);

					-- Check if the point is within the geofence
					IF @Geofence.STContains(GEOMETRY::STPointFromText('POINT(' + @Latitude + ' ' + @Longitude + ')', 4326)) = 1
					BEGIN
						SET @LocationFound = 1;
						BREAK;
					END;

					FETCH NEXT FROM GeoCursor INTO @GeoString;
				END;

				CLOSE GeoCursor;
				DEALLOCATE GeoCursor;

				-- Return the result
				IF @LocationFound = 1
					SELECT '1' AS Result;
				ELSE
					SELECT '0' AS Result;
	  END;`],
  },
  {
    comments: "New_dev_Code",
    ID: 1115,
    queries: [`ALTER TABLE TV_ICM_MST ADD TvDo int;`],
  },
  {
    comments: "New_dev_Code",
    ID: 1116,
    queries: [`CREATE TABLE [dbo].[TV_DO](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[VEH_STAT] [nvarchar](20) NULL,
	[MODEL_VARIANT] [nvarchar](100) NULL,
	[MODEL_VAR] [nvarchar](100) NULL,
	[VEHREGNO] [nvarchar](20) NULL,
	[CHAS_NO] [nvarchar](20) NULL,
	[ENGINE_NO] [nvarchar](20) NULL,
	[REG_YEAR] [nvarchar](10) NULL,
	[RC_VAL_UPTO] [smalldatetime] NULL,
	[INSU_VAL_UPTO] [smalldatetime] NULL,
	[LOAN_AMT] [money] NULL,
	[CHALLAN_AMT] [money] NULL,
	[DOC_TRF_CHRGS] [money] NULL,
	[PURCHASE_COST] [money] NULL,
	[CHALLAN_DATE] [smalldatetime] NULL,
	[REG_DATE] [smalldatetime] NULL,
	[KM_DRIVEN] [int] NULL,
	[APPR_21_CODE] [int] NULL,
	[APPR_21_STAT] [int] NULL,
	[APPR_21_REM] [nvarchar](400) NULL,
	[APPR_22_CODE] [int] NULL,
	[APPR_22_STAT] [int] NULL,
	[APPR_22_REM] [nvarchar](400) NULL,
	[APPR_23_CODE] [int] NULL,
	[APPR_23_STAT] [int] NULL,
	[APPR_23_REM] [nvarchar](400) NULL,
	[FIN_APPR_2] [int] NULL,
	[VERF_DATE_2] [smalldatetime] NULL,
	[Created_At] [datetime] NOT NULL,
	[Created_by] [varchar](100) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[Export_Type] [int] NULL,
	[LOC_CODE] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[TV_DO_Hst])
)
ALTER TABLE [dbo].[TV_DO] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[TV_DO] ADD  DEFAULT (getdate()) FOR [ValidFrom]`],
  },

  {
    comments: "New_dev_Code",
    ID: 1117,
    queries: [`CREATE TABLE [dbo].[Complaints](
          [ComplaintID] [int] IDENTITY(1,1) NOT NULL,
          [Title] [nvarchar](255) NOT NULL,
          [Description] [nvarchar](max) NOT NULL,
          [CreatedBy] [nvarchar](25) NULL,
          [DOC_PATH] [nvarchar](255) NULL,
          [DateCreated] [datetime] NULL,
          [Status] [nvarchar](50) NULL
        ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]`,
      `ALTER TABLE [dbo].[Complaints] ADD  DEFAULT (getdate()) FOR [DateCreated]`,
      `ALTER TABLE [dbo].[Complaints] ADD  DEFAULT ('Open') FOR [Status]`,
      `CREATE TABLE [dbo].[ComplaintResponse](
      [ResponseID] [int] IDENTITY(1,1) NOT NULL,
      [ComplaintID] [int] NOT NULL,
      [EmployeeID] [varchar](50) NOT NULL,
      [ResponseText] [text] NULL,
      [DateResponded] [datetime] NULL,
      [Status] [varchar](50) NULL,
    PRIMARY KEY CLUSTERED 
    (
      [ResponseID] ASC
    )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]`,
      `ALTER TABLE [dbo].[ComplaintResponse] ADD  DEFAULT ('Pending') FOR [Status]`]
  },
  {
    comments: "New_dev_Code",
    ID: 1118,
    queries: [`alter table Interview_sideTables alter column Percentage nvarchar(100)`],
  },
  {
    comments: "New_dev_Code",
    ID: 1119,
    queries: [`ALTER TABLE TV_DO ADD FIN_AMT money`],
  },
  {
    comments: "New_dev_Code",
    ID: 1120,
    queries: [`ALTER TABLE TV_DO ADD FUEL_TYPE NVARCHAR(20);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1121,
    queries: [`ALTER TABLE TV_DO ADD FINANCIER_DO int;`],
  },
  {
    comments: "New_dev_Code",
    ID: 1122,
    queries: [`ALTER TABLE TV_DO ADD BUY_TYPE NVARCHAR(20);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1123,
    queries: [`ALTER TABLE TV_DO ADD OWNER_COUNT int;`],
  },
  {
    comments: "New_dev_Code",
    ID: 1124,
    queries: [`ALTER TABLE TV_DO ADD RE_PAINT_STAT NVARCHAR(20);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1125,
    queries: [`ALTER TABLE TV_DO ADD RE_PAINT_RMRK NVARCHAR(250);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1126,
    queries: [`ALTER TABLE TV_DO ADD PARTS_STAT NVARCHAR(20);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1127,
    queries: [`ALTER TABLE TV_DO ADD PARTS_RMRK NVARCHAR(250);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1128,
    queries: [`ALTER TABLE TV_DO ADD REPAIR_STAT NVARCHAR(20);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1129,
    queries: [`ALTER TABLE TV_DO ADD REPAIR_RMRK NVARCHAR(250);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1130,
    queries: [`ALTER TABLE TV_DO ADD STEREO_STAT NVARCHAR(20);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1131,
    queries: [`ALTER TABLE TV_DO ADD HANDOVER_STAT NVARCHAR(20);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1132,
    queries: [`ALTER TABLE TV_DO ADD HANDOVER_PERSON NVARCHAR(100);`],
  },
  {
    comments: "New_dev_Code",
    ID: 1133,
    queries: [`CREATE TABLE [dbo].[Daily_Cash_Sum](
        [UID] [int] NULL,
        [Loc_code] [int] NULL,
        [user_code] [nvarchar](255) NULL,
        [Tran_Date] [date] NULL,
        [Opening_Bal] [money] NULL,
        [Today_Coll] [money] NULL,
        [Cash_to_bank] [money] NULL,
        [Cash_to_petty_cash] [money] NULL,
        [Payment_voucher] [money] NULL,
        [Closing_Bal] [money] NULL,
        [Books_Closing_Bal] [money] NULL,
        [Diffe_Bal] [money] NULL,
        [export_type] [nvarchar](255) NULL,
        [Create_at] [datetime] NULL
      ) ON [PRIMARY]`,
      `ALTER TABLE [dbo].[Daily_Cash_Sum] ADD  DEFAULT (getdate()) FOR [Create_at]`],
  },
  {
    comments: "In_Service",
    ID: 1134,
    queries: [`alter table In_Service add Service_Type varchar(10) null`],
  },
  {
    comments: "New_dev_Code",
    ID: 1135,
    queries: [`CREATE TABLE [dbo].[BodyShopClaim](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[VEHREGNO] [varchar](50) NULL,
	[CHASS_NO] [varchar](50) NULL,
	[ENG_NO] [varchar](75) NULL,
	[MOD_GRP] [varchar](12) NULL,
	[MOD_NAME] [varchar](12) NULL,
	[CUST_NAME] [varchar](500) NULL,
	[MOBILE] [varchar](15) NULL,
	[EMAIL] [varchar](250) NULL,
	[EXP_DELV_DATE] [smalldatetime] NULL,
	[SERV_ADV] [varchar](200) NULL,
	[MECHANIC] [varchar](200) NULL,
	[CLAIM_NO] [varchar](50) NULL,
	[CLAIM_SAN_AMT] [decimal](19, 4) NULL,
	[SURV_NAME] [varchar](200) NULL,
	[SURV_MOB_NO] [varchar](15) NULL,
	[FILE_SUB_DATE] [smalldatetime] NULL,
	[RES_DELAY] [varchar](2000) NULL,
	[RPT_RECD_DATE] [smalldatetime] NULL,
	[UTR_DATE] [datetime] NULL,
	[RPT_DELAY_RES] [varchar](2000) NULL,
	[BI_INV] [varchar](50) NULL,
	[BR_INV] [varchar](50) NULL,
	[LOC_CODE] [int] NULL,
	[INS_COMP] [int] NULL,
	[INS_REC_AMT] [decimal](19, 4) NULL,
	[CUST_REC_AMT] [decimal](19, 4) NULL,
	[INS_DO_NO] [varchar](50) NULL,
	[UTR_NO] [int] NULL,
	[VER_DATE] [smalldatetime] NULL,
	[isVerified] [int] NULL,
	[VER_REM] [varchar](400) NULL,
	[PART_EST] [money] NULL,
	[LAB_EST] [money] NULL,
	[TOT_EST] [money] NULL,
	[ACT_AMT_INC] [money] NULL,
	[GST_AMT_INC] [money] NULL,
	[TDS_AMT_INC] [money] NULL,
	[DISC_AMT_INC] [money] NULL,
	[PENDING_INSU] [money] NULL,
	[ACT_AMT_CUST] [money] NULL,
	[PENDING_CUST] [money] NULL,
	[Created_At] [datetime] NOT NULL,
	[Created_by] [varchar](100) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[MAN_APPR_STAT] [int] NULL,
	[MAN_APPR_REM] [varchar](250) NULL,
	[MAN_APPR_DATE] [smalldatetime] NULL,
	[ACC_APPR_CODE] [int] NULL,
	[BSM_APPR_CODE] [int] NULL,
	[JOB_STATUS] [int] NULL,
	[CLAIM_TYPE] [nvarchar](10) NULL,
	[JOB_CARD_NO] [nvarchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[BodyShopClaim_Hst])
)`,
      `ALTER TABLE [dbo].[BodyShopClaim] ADD  DEFAULT (getdate()) FOR [Created_At]`,`ALTER TABLE [dbo].[BodyShopClaim] ADD  DEFAULT (getdate()) FOR [ValidFrom]`],
  },
  {
    comments: "New_dev_Code",
    ID: 1136,
    queries: [`CREATE TABLE [dbo].[DmsImportBodyShop](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[SrlNo] [nvarchar](255) NULL,
	[DealerName] [nvarchar](255) NULL,
	[DealerCity] [nvarchar](255) NULL,
	[Location] [nvarchar](255) NULL,
	[JobCardNo] [nvarchar](50) NULL,
	[JCDateTime] [datetime] NULL,
	[ServiceType] [nvarchar](50) NULL,
	[RepeatRevisit] [nvarchar](50) NULL,
	[CustomerName] [nvarchar](255) NULL,
	[Phone] [nvarchar](50) NULL,
	[MobileNo] [nvarchar](50) NULL,
	[CustomerCatg] [nvarchar](50) NULL,
	[Psf_status] [nvarchar](255) NULL,
	[RegistrationNo] [nvarchar](50) NULL,
	[CHASSIS] [nvarchar](50) NULL,
	[ENGINENUM] [nvarchar](50) NULL,
	[Color] [nvarchar](50) NULL,
	[Variant] [nvarchar](100) NULL,
	[Model] [nvarchar](100) NULL,
	[Mi_yn] [nvarchar](1) NULL,
	[SaleDate] [datetime] NULL,
	[Group] [nvarchar](50) NULL,
	[SA] [nvarchar](255) NULL,
	[Technician] [nvarchar](255) NULL,
	[CircularNo] [nvarchar](50) NULL,
	[Mileage] [nvarchar](255) NULL,
	[EstLabAmt] [nvarchar](255) NULL,
	[EstPartAmt] [nvarchar](255) NULL,
	[PromisedDt] [datetime] NULL,
	[RevPromisedDt] [datetime] NULL,
	[ReadyDateTime] [datetime] NULL,
	[RevEstPartAmt] [nvarchar](255) NULL,
	[RevEstLabAmt] [nvarchar](255) NULL,
	[JCSource] [nvarchar](50) NULL,
	[App_sent_date] [datetime] NULL,
	[App_REJ_date] [datetime] NULL,
	[ApprovalStatus] [nvarchar](255) NULL,
	[CustRemarks] [nvarchar](max) NULL,
	[DlrRemarks] [nvarchar](max) NULL,
	[Status] [nvarchar](100) NULL,
	[BillNo] [nvarchar](50) NULL,
	[BillDate] [datetime] NULL,
	[LabourAmt] [nvarchar](255) NULL,
	[PartAmt] [nvarchar](255) NULL,
	[PickupRequired] [nvarchar](10) NULL,
	[PickupDate] [datetime] NULL,
	[PickupLocation] [nvarchar](255) NULL,
	[BillAmount] [nvarchar](255) NULL,
	[Address1] [nvarchar](255) NULL,
	[Address2] [nvarchar](255) NULL,
	[Address3] [nvarchar](255) NULL,
	[City] [nvarchar](100) NULL,
	[Pin] [nvarchar](255) NULL,
	[Dob] [datetime] NULL,
	[DOA] [datetime] NULL,
	[Email] [nvarchar](255) NULL,
	[CHKIN_DT] [datetime] NULL,
	[CHKOUT_DT] [datetime] NULL,
	[Created_At] [datetime] NOT NULL,
	[Created_by] [varchar](100) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[Loc_Code] [int] NULL,
	[ImportDate] [smalldatetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[DmsImportBodyShop_Hst])
)`,
      `ALTER TABLE [dbo].[DmsImportBodyShop] ADD  DEFAULT (getdate()) FOR [Created_At]`,`ALTER TABLE [dbo].[DmsImportBodyShop] ADD  DEFAULT (getdate()) FOR [ValidFrom]`],
  },
  {
    comments: "New_dev_Code",
    ID: 1137,
    queries: [`CREATE TABLE [dbo].[WA_HST_WEB](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[User_Code] [int] NULL,
	[Temp_Name] [nvarchar](500) NULL,
	[Mobile_No] [nvarchar](14) NULL,
	[Created_At] [datetime] NOT NULL,
	[Created_by] [varchar](200) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[TRAN_ID] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[WA_HST_WEB_Hst])
)`,
      `ALTER TABLE [dbo].[WA_HST_WEB] ADD  DEFAULT (getdate()) FOR [Created_At]`,`ALTER TABLE [dbo].[WA_HST_WEB] ADD  DEFAULT (getdate()) FOR [ValidFrom]`],
  },
  {
    comments: "New_dev_Code",
    ID: 1138,
    queries: [`ALTER TABLE InventoryItems ADD PurchasePostLedg [nvarchar](10);`],
  },
{
    comments: "New_dev_Code",
    ID: 1139,
    queries: [`ALTER TABLE InventoryItems ADD SalePostLedg [nvarchar](10);`],
  },
{
    comments: "New_dev_Code",
    ID: 1140,
    queries: [`CREATE TABLE [dbo].[DocketMst](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[BOOKING_ID] [varchar](20) NOT NULL,
	[BOOKING_DATE] [smalldatetime] NULL,
	[MODEL_VAR] [varchar](255) NULL,
	[MODEL_COL] [varchar](255) NULL,
	[CUST_NAME] [varchar](255) NULL,
	[MOD_NAME] [varchar](255) NULL,
	[CUST_MOB] [varchar](15) NULL,
	[ALOT_CHAS] [varchar](20) NULL,
	[ENG_NO] [varchar](20) NULL,
	[ALOT_MOD_VAR] [varchar](255) NULL,
	[ALOT_COLOR] [varchar](255) NULL,
	[SALE_INV] [varchar](20) NULL,
	[SALE_INV_AMT] [money] NULL,
	[MSR_NO] [varchar](20) NULL,
	[MSR_AMT] [money] NULL,
	[EW_NO] [varchar](20) NULL,
	[EW_AMT] [money] NULL,
	[CCP_NO] [varchar](20) NULL,
	[CCP_AMT] [money] NULL,
	[FASTAG_NO] [varchar](20) NULL,
	[FASTAG_AMT] [money] NULL,
	[INS_COMP] [int] NULL,
	[INC_POLICY_NO] [varchar](20) NULL,
	[INC_POLICY_AMT] [money] NULL,
	[INC_POLICY_DATE] [smalldatetime] NULL,
	[MGA_YN] [varchar](3) NULL,
	[MGA_PROM_AMT] [money] NULL,
	[MGA_TOTAL_AMT] [money] NULL,
	[FIN_NAME] [varchar](20) NULL,
	[FIN_TYPE] [varchar](50) NULL,
	[FIN_AMT] [money] NULL,
	[GP_SEQ] [varchar](20) NULL,
	[OLD_CAR_CUST] [varchar](255) NULL,
	[OLD_CAR_REG_NO] [varchar](20) NULL,
	[OLD_CAR_PUR_COST] [money] NULL,
	[EXCH_BONUS] [money] NULL,
	[LOC_CODE] [int] NULL,
	[DSE_FLAG] [int] NULL,
	[EDP_FLAG] [int] NULL,
	[TV_FLAG] [int] NULL,
	[INSU_FLAG] [int] NULL,
	[MGA_FLAG] [int] NULL,
	[FIN_FLAG] [int] NULL,
	[ACNT_FLAG] [int] NULL,
	[QM_FLAG] [int] NULL,
	[Created_by] [varchar](100) NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[DocketVerified] [int] NULL,
	[VER_CODE] [int] NULL,
	[VER_REM] [nvarchar](500) NULL,
	[VER_DATE] [smalldatetime] NULL,
	[DSE_CODE] [int] NULL,
	[EDP_CODE] [int] NULL,
	[TV_CODE] [int] NULL,
	[INSU_CODE] [int] NULL,
	[MGA_CODE] [int] NULL,
	[FIN_CODE] [int] NULL,
	[ACNT_CODE] [int] NULL,
	[QM_CODE] [int] NULL,
	[EXCH_YN] [nvarchar](10) NULL,
	[EXP_DOWN_PYMT] [money] NULL,
	[DSE_REM] [nvarchar](1000) NULL,
	[EXP_FIN_NAME] [int] NULL,
	[EXP_DEL_DATE] [smalldatetime] NULL,
	[RtoNocCheck] [int] NULL,
	[BankNocCheck] [int] NULL,
	[CustIdCheck] [int] NULL,
	[OldCarInsuCheck] [int] NULL,
	[OldCarRcCheck] [int] NULL,
	[EXP_FIN_AMT] [money] NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[DocketMst_Hst])
)`,
      `ALTER TABLE [dbo].[DocketMst] ADD  DEFAULT (getdate()) FOR [Created_At]`,`ALTER TABLE [dbo].[DocketMst] ADD  DEFAULT (getdate()) FOR [ValidFrom]`],
  },
 {
    comments: "Insurance",
    ID: 1141,
    queries: [`CREATE TABLE [dbo].[Insu_Entry](
	[SRNo] [int] IDENTITY(1,1) NOT NULL,
	[Policy_No] [nvarchar](50) NULL,
	[CRE_NAME] [nvarchar](50) NULL,
	[Customer_Name] [nvarchar](100) NULL,
	[Policy_Due] [datetime2](7) NULL,
	[Registration_No] [nvarchar](30) NULL,
	[Engine_No] [nvarchar](20) NULL,
	[Chassis_No] [nvarchar](20) NULL,
	[Year_Manufacture] [nvarchar](10) NULL,
	[Sub_Model] [varchar](200) NULL,
	[Address1] [nvarchar](200) NULL,
	[Address2] [nvarchar](200) NULL,
	[Address3] [nvarchar](200) NULL,
	[Cust_City] [nvarchar](50) NULL,
	[PinCode] [nvarchar](10) NULL,
	[Phone_No] [varchar](50) NULL,
	[MobileNo] [varchar](200) NULL,
	[Policy_Ren_Type] [nvarchar](50) NULL,
	[Policy_Sub_Type] [varchar](200) NULL,
	[Dealer_Code] [nvarchar](10) NULL,
	[TeleCaller] [nvarchar](25) NULL,
	[Field_Executive] [nvarchar](100) NULL,
	[FollowUpDate] [date] NULL,
	[FollowUpTime] [varchar](20) NULL,
	[Status] [nvarchar](20) NULL,
	[Lost_Remark] [nvarchar](100) NULL,
	[Premium] [nvarchar](50) NULL,
	[Discount] [nvarchar](50) NULL,
	[With_Policy] [nvarchar](2) NULL,
	[Claim_Coupon] [nvarchar](2) NULL,
	[Washing_Coupon] [nvarchar](2) NULL,
	[Policy_Issued_Date] [date] NULL,
	[Policy_Dispatch_Date] [date] NULL,
	[Direct_policy_issued] [nvarchar](2) NULL,
	[Format_No] [nvarchar](50) NULL,
	[Cheque_No] [nvarchar](50) NULL,
	[Cheque_Date] [date] NULL,
	[Bank_Name] [nvarchar](50) NULL,
	[Mode_Of_Payment] [nvarchar](50) NULL,
	[Favour_Of] [nvarchar](30) NULL,
	[Coupon_No] [nvarchar](30) NULL,
	[Last_Expiry_date] [date] NULL,
	[Proposal_No] [nvarchar](30) NULL,
	[Delivery_Executive] [nvarchar](30) NULL,
	[Delivery_Date] [date] NULL,
	[Delivered] [nvarchar](2) NULL,
	[Conveyance_Applicable] [nvarchar](10) NULL,
	[Created_By] [nvarchar](30) NOT NULL,
	[Created_At] [datetime] NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[Due_Date] [date] NULL,
	[Cre_Code] [varchar](50) NULL,
	[Act_Delivery_Date] [datetime] NULL,
	[Delv_Remark] [varchar](200) NULL,
	[Payment_Status] [varchar](5) NULL,
	[loc_code] [varchar](30) NULL,
	[Delivery_Copy] [varchar](100) NULL,
	[uploaded_document] [varchar](100) NULL,
	[Insu_Comp] [varchar](100) NULL,
	[Payment_Reconciliation] [varchar](10) NULL,
	[Reconciliation_Instrument_No] [varchar](20) NULL,
	[Reconciliation_Instrument_Drawn_On] [varchar](50) NULL,
	[Reconciliation_Instrument_Date] [varchar](50) NULL,
	[Reconciliation_Instrument_Amount] [varchar](50) NULL,
	[Web_Policy] [varchar](10) NULL,
	[LeadDate] [datetime2](7) NULL,
	[Lead] [int] NULL,
	[NewPolicy_No] [varchar](50) NULL,
	[CancleRemark] [varchar](200) NULL,
	[Remark] [varchar](200) NULL,
	[Location] [varchar](10) NULL,
	[LastUpdatedBy] [varchar](100) NULL,
	[LastUpdatedDate] [datetime2](7) NULL,
	[Closed_By] [varchar](50) NULL,
	[ClosedDate] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[SRNo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Insu_Entry_hst])
)
ALTER TABLE [dbo].[Insu_Entry] ADD  DEFAULT (getdate()) FOR [Created_At]`,
      `
CREATE TABLE [dbo].[CRE_TARGETS](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[CRE_CODE] [varchar](100) NULL,
	[MONTH] [nvarchar](10) NULL,
	[YEAR] [nvarchar](10) NULL,
	[TARGET] [int] NULL,
	[Created_At] [datetime] NULL,
	[Created_by] [varchar](100) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[CRE_TARGETS_Hst])
)
ALTER TABLE [dbo].[CRE_TARGETS] ADD  DEFAULT (getdate()) FOR [Created_At]`],
  },
  {
    comments: "Discount Offers 3",
    ID: 1141,
    queries: [`
   alter table Discount_OFfers add [Channel] [varchar](20) NULL
	alter table Discount_OFfers add [Year] [varchar](100) NULL
	alter table Discount_OFfers add [Branch] [varchar](200) NULL
	alter table Discount_OFfers add [Rips] [float] NULL`],
  },
  {
    comments: "Deal sheet",
    ID: 1141,
    queries: [`
   CREATE TABLE [dbo].[Deal_Sheet](
	[tran_id] [int] IDENTITY(1,1) NOT NULL,
	[Req_Date] [datetime2](7) NULL,
	[Customer_Name] [varchar](100) NULL,
	[Mobile_No] [varchar](20) NULL,
	[Email] [varchar](100) NULL,
	[Model] [varchar](50) NULL,
	[Variant] [varchar](50) NULL,
	[Color] [varchar](50) NULL,
	[vehicle_type] [varchar](50) NULL,
	[Customer_Type_Broker] [varchar](50) NULL,
	[MFG_Year] [float] NULL,
	[Booking_Date] [date] NULL,
	[Aadhar_No] [varchar](20) NULL,
	[PAN_No] [varchar](20) NULL,
	[GST_No] [varchar](20) NULL,
	[Address] [varchar](100) NULL,
	[price] [float] NULL,
	[Finance_Type] [varchar](50) NULL,
	[Loan_Amount] [float] NULL,
	[Old_Vehicle] [varchar](20) NULL,
	[Old_Vehicle_Amount] [float] NULL,
	[RTO] [varchar](20) NULL,
	[RTO_Amount] [varchar](20) NULL,
	[RTO_Fency_Number] [float] NULL,
	[Insurance] [varchar](20) NULL,
	[Insurance_Type] [varchar](20) NULL,
	[Preferred_Insurance_Partner] [varchar](100) NULL,
	[Insurance_Amount] [float] NULL,
	[Municipal_Tax] [varchar](20) NULL,
	[Municipal_Tax_Amount] [float] NULL,
	[MGA] [varchar](20) NULL,
	[MGA_Amount] [float] NULL,
	[EW] [varchar](50) NULL,
	[EW_Amount] [float] NULL,
	[Ccp] [varchar](20) NULL,
	[Ccp_Amount] [float] NULL,
	[MCP] [varchar](20) NULL,
	[MCP_Amount] [float] NULL,
	[Loyalty] [varchar](20) NULL,
	[Loyalty_Amount] [float] NULL,
	[FASTAG] [varchar](20) NULL,
	[FASTAG_Amount] [float] NULL,
	[VAS] [varchar](20) NULL,
	[VAS_Amount] [float] NULL,
	[MSSF] [varchar](20) NULL,
	[Tcs] [float] NULL,
	[Consumer] [float] NULL,
	[Corporate] [float] NULL,
	[Exchange] [float] NULL,
	[Loan_Amount_Discount] [float] NULL,
	[Insurance_Amount_Discount] [float] NULL,
	[MGA_Amount_Discount] [float] NULL,
	[EW_Amount_Discount] [float] NULL,
	[Ccp_Amount_Discount] [float] NULL,
	[MCP_Amount_Discount] [float] NULL,
	[VAS_Amount_Discount] [float] NULL,
	[Broker_Discount] [float] NULL,
	[OnRoad_Price] [float] NULL,
	[Max_discount] [float] NULL,
	[Dise_Amt] [float] NULL,
	[Approved_amt] [float] NULL,
	[Location] [varchar](10) NULL,
	[srm] [varchar](20) NULL,
	[Appr_1_Code] [varchar](100) NULL,
	[Appr_1_Stat] [tinyint] NULL,
	[Appr_1_Date] [datetime2](7) NULL,
	[Appr_1_Rem] [varchar](300) NULL,
	[Appr_2_Code] [varchar](100) NULL,
	[Appr_2_Stat] [tinyint] NULL,
	[Appr_2_Date] [datetime2](7) NULL,
	[Appr_2_Rem] [varchar](300) NULL,
	[Appr_3_Code] [varchar](100) NULL,
	[Appr_3_Stat] [tinyint] NULL,
	[Appr_3_Date] [datetime2](7) NULL,
	[Appr_3_Rem] [varchar](300) NULL,
	[Fin_Appr] [tinyint] NULL,
	[Created_By] [varchar](255) NULL,
	[Created_At] [datetime] NOT NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[tran_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Deal_Sheet_Hst])
)
GO

ALTER TABLE [dbo].[Deal_Sheet] ADD  DEFAULT (getdate()) FOR [Req_Date]
ALTER TABLE [dbo].[Deal_Sheet] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[Deal_Sheet] ADD  DEFAULT (getdate()) FOR [ValidFrom]
`,
      `CREATE TABLE [dbo].[Deal_Sheet_Price](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[ModelCode] [varchar](50) NULL,
	[ModelName] [varchar](255) NULL,
	[Clr] [varchar](10) NULL,
	[Price] [decimal](15, 4) NULL,
	[Insurance_1_Year] [decimal](15, 2) NULL,
	[Insurance_1_3_Year] [decimal](15, 2) NULL,
	[Permanent] [decimal](15, 2) NULL,
	[Temporary] [decimal](15, 2) NULL,
	[Fastag] [decimal](15, 2) NULL,
	[Basic] [decimal](15, 2) NULL,
	[Tcs] [decimal](15, 2) NULL,
	[MCP_Amount] [decimal](15, 2) NULL,
	[Loyalty_Amount] [decimal](15, 2) NULL,
	[Dealer_EW_Royal_Platinum] [decimal](15, 2) NULL,
	[Solitaire_6th] [decimal](15, 2) NULL,
	[Royal_Platinum_5th] [decimal](15, 2) NULL,
	[Platinum_4th] [decimal](15, 2) NULL,
	[Gold_3th] [decimal](15, 2) NULL,
	[Ccp_Amount] [decimal](15, 2) NULL,
	[Consumer] [decimal](15, 2) NULL,
	[Corporate] [decimal](15, 2) NULL,
	[Exchange] [decimal](15, 2) NULL,
	[MSSF_Amount] [decimal](15, 2) NULL,
	[Broker_Discount] [decimal](15, 2) NULL,
	[Valid_From] [date] NULL,
	[Valid_Upto] [date] NULL,
	[Municipal_Tax_1] [decimal](15, 2) NULL,
	[Municipal_Tax_2] [decimal](15, 2) NULL,
	[Municipal_Tax_3] [decimal](15, 2) NULL,
	[Municipal_Tax_4] [decimal](15, 2) NULL,
	[Municipal_Tax_5] [decimal](15, 2) NULL,
	[Loc_Code] [varchar](100) NULL,
	[Created_By] [varchar](255) NULL,
	[Created_At] [datetime] NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Deal_Sheet_Price_Hst])
)
ALTER TABLE [dbo].[Deal_Sheet_Price] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[Deal_Sheet_Price] ADD  DEFAULT (getdate()) FOR [ValidFrom]
`,
      `CREATE TABLE [dbo].[DealSheet_Master](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](50) NULL,
	[Branch] [varchar](50) NULL,
	[amount] [decimal](10, 2) NULL,
	[validfrom] [date] NULL,
	[validTo] [date] NULL,
	[Created_At] [datetime2](7) NULL,
	[CREATED_BY] [varchar](200) NULL,
	[ValidFrom1] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo1] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom1], [ValidTo1])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[DealSheet_Master_Hst])
)
ALTER TABLE [dbo].[DealSheet_Master] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[DealSheet_Master] ADD  DEFAULT (getdate()) FOR [ValidFrom1]
`,
      `CREATE TABLE [dbo].[Insu_Comp](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[Insurance_Company] [varchar](100) NULL,
	[Perferred] [varchar](20) NULL,
	[Valid_From] [date] NULL,
	[Valid_Upto] [date] NULL,
	[Loc_Code] [varchar](100) NULL,
	[Created_By] [varchar](255) NULL,
	[Created_At] [datetime] NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Insu_Comp_Hst])
)
ALTER TABLE [dbo].[Insu_Comp] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[Insu_Comp] ADD  DEFAULT (getdate()) FOR [ValidFrom]
`],
  },
  {
    comments: "Manual getpass",
    ID: 1141,
    queries: [`CREATE TABLE [dbo].[Car_GetPass](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[getPassNO] [int] NULL,
	[CustDate] [date] NULL,
	[RegNo] [varchar](100) NULL,
	[CustId] [varchar](50) NULL,
	[CustName] [varchar](100) NULL,
	[FatherName] [varchar](100) NULL,
	[Address] [varchar](255) NULL,
	[EW] [bit] NULL,
	[CCP] [bit] NULL,
	[MSR] [bit] NULL,
	[MSSF] [bit] NULL,
	[RTO] [bit] NULL,
	[DRTO] [bit] NULL,
	[EXCHANGE] [bit] NULL,
	[FastagNO] [varchar](100) NULL,
	[Veh_Model] [varchar](100) NULL,
	[EngineNO] [varchar](50) NULL,
	[ChasNo] [varchar](50) NULL,
	[Color] [varchar](50) NULL,
	[Remark] [varchar](255) NULL,
	[ToolKit] [varchar](100) NULL,
	[Stepney] [varchar](100) NULL,
	[JackRod] [varchar](100) NULL,
	[FirstKit] [varchar](100) NULL,
	[Reflector] [varchar](100) NULL,
	[FireExtin] [varchar](100) NULL,
	[Speakers] [varchar](100) NULL,
	[ParcelTray] [varchar](100) NULL,
	[StereoRemote] [varchar](100) NULL,
	[CNGKIT] [varchar](100) NULL,
	[Fastag] [varchar](100) NULL,
	[loc_code] [int] NULL,
	[CREATED_BY] [varchar](200) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[Modl_Var] [varchar](20) NULL,
	[Pin] [varchar](20) NULL,
	[Pan_No] [varchar](20) NULL,
	[FIN_NAME] [varchar](20) NULL,
	[tl] [varchar](20) NULL,
	[Executive] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Car_GetPass_Hst])
)
ALTER TABLE [dbo].[Car_GetPass] ADD  DEFAULT (getdate()) FOR [ValidFrom]
`],
  },
  {
    comments: "discount",
    ID: 1141,
    queries: [`alter table dise_aprvl add [Loan_Amount] [float] NULL
	alter table dise_aprvl add [Bank_Name] [varchar](100) NULL
	alter table dise_aprvl add [Preferred_Insurance] [varchar](100) NULL
	alter table dise_aprvl add [Insurance_Company] [varchar](100) NULL`],
  },
  {
    comments: "New car stock Managemant",
    ID: 1141,
    queries: [`alter table NewCar_AuditLogs add [Remark] [nvarchar](255) NULL
	alter table NewCar_AuditLogs add [Type] [varchar](10) NULL
	alter table NewCar_AuditLogs add [status] [varchar](10) NULL
	alter table NewCar_AuditLogs add [Location] [varchar](10) NULL`,
      `alter table [NewCar_StockAudit] add [Type] [varchar](10) NULL
	alter table [NewCar_StockAudit] add [status] [varchar](10) NULL`,
      `CREATE TABLE [dbo].[CHAS_TRANSIT](
	[Tran_Id] [int] NOT NULL,
	[CHAS_ID] [int] NULL,
	[TRAN_TYPE] [int] NULL,
	[Tran_Date] [date] NULL,
	[Tran_Amt] [money] NULL,
	[Asset_Ledg] [int] NULL,
	[Income_Ledg] [int] NULL,
	[Loc_Code] [int] NULL,
	[Export_Type] [int] NULL,
	[Item_Type] [int] NULL,
	[Item_Seq] [int] NULL
) ON [PRIMARY]
GO`,
      `alter table CHAS_MST add [Int_Location] [varchar](20) NULL`],
  },
  {
    comments: "Chas Alot",
    ID: 1141,
    queries: [`CREATE TABLE [dbo].[Chas_Alot](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[GD_FDI_ID] [int] NULL,
	[Booking_ID] [nvarchar](50) NULL,
	[CHAS_ID] [int] NULL,
	[Alottment_Rem] [nvarchar](500) NULL,
	[EMP_CODE] [nvarchar](20) NULL,
	[DMS_CODE] [nvarchar](20) NULL,
	[DE_ALOT_DMS_CODE] [nvarchar](20) NULL,
	[DeAlot_Res] [nvarchar](500) NULL,
	[DeAlot_Date] [smalldatetime] NULL,
	[Appr_1_Code] [nvarchar](20) NULL,
	[Appr_2_Code] [nvarchar](20) NULL,
	[Appr_3_Code] [nvarchar](20) NULL,
	[Appr_1_Stat] [int] NULL,
	[Appr_2_Stat] [int] NULL,
	[Appr_3_Stat] [int] NULL,
	[Appr_1_Rem] [nvarchar](250) NULL,
	[Appr_2_Rem] [nvarchar](250) NULL,
	[Appr_3_Rem] [nvarchar](250) NULL,
	[Appr_1_Date] [smalldatetime] NULL,
	[Appr_2_Date] [smalldatetime] NULL,
	[Appr_3_Date] [smalldatetime] NULL,
	[Fin_Appr_Stat] [int] NULL,
	[LOC_CODE] [int] NULL,
	[Export_Type] [int] NULL,
	[Created_At] [datetime] NOT NULL,
	[Created_by] [varchar](100) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[Customer_Name] [varchar](100) NULL,
	[Booking_Date] [date] NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Chas_Alot_Hst])
)
ALTER TABLE [dbo].[Chas_Alot] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[Chas_Alot] ADD  DEFAULT (getdate()) FOR [ValidFrom]
`,
      `CREATE TABLE [dbo].[Chas_Alot_UnAppr](
	[UTD] [int] IDENTITY(1,1) NOT NULL,
	[GD_FDI_ID] [int] NULL,
	[Booking_ID] [nvarchar](50) NULL,
	[CHAS_ID] [int] NULL,
	[Alottment_Rem] [nvarchar](500) NULL,
	[DMS_CODE] [nvarchar](20) NULL,
	[Appr_1_Code] [nvarchar](20) NULL,
	[Appr_2_Code] [nvarchar](20) NULL,
	[Appr_3_Code] [nvarchar](20) NULL,
	[Appr_1_Stat] [int] NULL,
	[Appr_2_Stat] [int] NULL,
	[Appr_3_Stat] [int] NULL,
	[Appr_1_Rem] [nvarchar](250) NULL,
	[Appr_2_Rem] [nvarchar](250) NULL,
	[Appr_3_Rem] [nvarchar](250) NULL,
	[Appr_1_Date] [smalldatetime] NULL,
	[Appr_2_Date] [smalldatetime] NULL,
	[Appr_3_Date] [smalldatetime] NULL,
	[Fin_Appr_Stat] [int] NULL,
	[LOC_CODE] [int] NULL,
	[Export_Type] [int] NULL,
	[Created_At] [datetime] NOT NULL,
	[Created_by] [varchar](100) NULL,
	[ValidFrom] [datetime2](7) GENERATED ALWAYS AS ROW START NOT NULL,
	[ValidTo] [datetime2](7) GENERATED ALWAYS AS ROW END NOT NULL,
	[EMP_CODE] [nvarchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[UTD] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
	PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo])
) ON [PRIMARY]
WITH
(
SYSTEM_VERSIONING = ON (HISTORY_TABLE = [dbo].[Chas_Alot_UnAppr_Hst])
)
ALTER TABLE [dbo].[Chas_Alot_UnAppr] ADD  DEFAULT (getdate()) FOR [Created_At]
ALTER TABLE [dbo].[Chas_Alot_UnAppr] ADD  DEFAULT (getdate()) FOR [ValidFrom]
`],
  },
  {
    comments: "New_dev_Code",
    ID: 1141,
    queries: [`update comp_keydata set New_dev_code = '1141';`],
  },
];

module.exports = DBQUERIES;