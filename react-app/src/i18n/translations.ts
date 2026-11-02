export const translations = {
  en: {
    // Header
    appTitle: 'Bank Statement Analyzer – POC',
    appSubtitle: 'Multi-Account Statement Extraction & AI-Powered Financial Categorization',
    openRouterConnected: 'OpenRouter Connected',
    ruleFallbackActive: 'Rule/Keyword Fallback Active',
    languageToggle: 'العربية',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    themeSystem: 'System Theme',

    // Upload
    uploadTitle: 'Upload Bank Statement',
    pdfCsvSupported: 'PDF / CSV Supported',
    dragDrop: 'Drag & drop statement here',
    orBrowse: 'or click to browse',
    uploadLimit: 'Multi-page PDF or bank export CSV (up to 25MB)',
    noFileSelected: 'No custom file selected yet.',
    analyzeFile: 'Analyze File',
    analyzing: 'Analyzing Statement...',
    reset: 'Reset',

    // Summary Cards
    totalIncome: 'Total Income',
    incomeSubtext: 'Salary & Freelance transfers',
    totalExpenses: 'Total Actual Expenses',
    expensesSubtext: 'Current & Credit Card purchases',
    netCashFlow: 'Net Cash Flow',
    netCashFlowSubtext: 'Income minus actual expenses',
    transactionsExtracted: 'Transactions Extracted',
    transactionsSubtext: 'Across statement period',

    // Secondary Metrics
    internalTransfers: 'Internal Transfers',
    creditCardAutopay: 'Credit Card Autopay',
    interestEarned: 'Interest Earned',
    interestCharged: 'Interest Charged',
    creditCardLiability: 'Credit Card Liability',

    // Accounts
    accountBreakdown: 'Account Breakdown & Balance Reconciliation',
    summaryReconciliation: 'Summary Reconciliation',
    reconciled100: 'Reconciled 100%',
    unreconciled: 'Unreconciled',
    beginningBalance: 'Beginning Balance:',
    endingBalance: 'Ending Statement Balance:',
    endingLiability: 'Ending Debt Liability:',
    totalDeposits: 'Total Deposits:',
    totalWithdrawals: 'Total Withdrawals:',
    cardCredits: 'Credits (Purchases/Fees):',
    cardDebits: 'Debits (Autopay Paid):',
    transactionsParsed: 'transactions parsed',

    // Charts
    spendingByCategory: 'Spending by Category',
    monthlySpendingTrend: 'Monthly Spending Trend',
    monthlyCashFlow: 'Monthly Cash Flow: Income vs Expenses',
    chartSpending: 'Spending',
    chartMonthlyExpenses: 'Monthly Expenses',
    chartIncome: 'Income',
    chartExpenses: 'Expenses',
    chartNetFlow: 'Net Flow',

    // Insights
    insightsTitle: 'Financial Insights & Observations',
    insightsBadge: 'AI & Heuristic Analytics',

    // Transactions Table
    transactionsHeader: 'Transactions',
    showingPage: 'Showing page {current} of {total}',
    showingRows: 'Showing {from} to {to} of {total}',
    searchPlaceholder: 'Search description or category...',
    allAccounts: 'All Accounts',
    currentAccount: 'Current Account',
    savingsAccount: 'Savings Account',
    creditCard: 'Credit Card',
    allFlowTypes: 'All Flow Types',
    allCategories: 'All Categories',

    dateRangeFilter: 'Filter by Date Range',
    fromDate: 'From',
    toDate: 'To',
    allDates: 'All Period',
    clearDateFilter: 'Clear Range',
    tableTotalFiltered: 'Total (Filtered)',
    netTotal: 'Net Cash Flow',

    // Table Columns
    colDate: 'Date',
    colDescription: 'Description',
    colAccount: 'Account',
    colAmount: 'Amount',
    colFlowType: 'Flow Type',
    colCategory: 'Category',
    colConfidence: 'Confidence',
    colBalance: 'Balance',
    noMatchingTransactions: 'No transactions match the selected filters.',
    previous: 'Previous',
    next: 'Next',

    // Flow Types
    flowIncome: 'INCOME',
    flowExpense: 'EXPENSE',
    flowTransfer: 'TRANSFER',
    flowDebtPayment: 'DEBT PAYMENT',
    flowInterestIncome: 'INTEREST INCOME',
    flowInterestExpense: 'INTEREST EXPENSE',
    flowUnknown: 'UNKNOWN',

    // Categories
    catFoodDining: 'Food & Dining',
    catGroceries: 'Groceries',
    catShopping: 'Shopping',
    catTransportation: 'Transportation',
    catHousingRent: 'Housing & Rent',
    catUtilitiesBills: 'Utilities & Bills',
    catHealthcare: 'Healthcare',
    catEntertainment: 'Entertainment & Subscriptions',
    catTravel: 'Travel',
    catEducation: 'Education',
    catFuelAutomotive: 'Fuel & Automotive',
    catSalaryIncome: 'Salary & Income',
    catFreelanceIncome: 'Freelance Income',
    catBankInterest: 'Bank Interest',
    catTransfers: 'Transfers',
    catDebtPayments: 'Debt Payments',
    catOther: 'Other'
  },
  ar: {
    // Header
    appTitle: 'محلل كشوف الحسابات البنكية – POC',
    appSubtitle: 'استخراج الحسابات المتعددة والتصنيف المالي الذكي لكشوف الحسابات',
    openRouterConnected: 'OpenRouter متصل',
    ruleFallbackActive: 'التصنيف المالي البديل نشط',
    languageToggle: 'English',
    themeLight: 'الوضع الفاتح',
    themeDark: 'الوضع الداكن',
    themeSystem: 'سمة النظام',

    // Upload
    uploadTitle: 'تحميل كشف الحساب البنكي',
    pdfCsvSupported: 'يدعم ملفات PDF و CSV',
    dragDrop: 'اسحب وأفلت كشف الحساب هنا',
    orBrowse: 'أو اضغط لاختيار ملف من جهازك',
    uploadLimit: 'ملفات PDF متعددة الصفحات أو تصدير CSV (حتى 25 ميجابايت)',
    noFileSelected: 'لم يتم اختيار ملف بعد.',
    analyzeFile: 'تحليل الملف',
    analyzing: 'جارٍ تحليل كشف الحساب...',
    reset: 'إعادة تعيين',

    // Summary Cards
    totalIncome: 'إجمالي الدخل',
    incomeSubtext: 'الرواتب والتحويلات الخارجية',
    totalExpenses: 'إجمالي النفقات الفعلية',
    expensesSubtext: 'مشتريات الحساب الجاري والبطاقة الائتمانية',
    netCashFlow: 'صافي التدفق النقدي',
    netCashFlowSubtext: 'إجمالي الدخل ناقص إجمالي النفقات',
    transactionsExtracted: 'المعاملات المستخرجة',
    transactionsSubtext: 'على مدار فترة الكشف',

    // Secondary Metrics
    internalTransfers: 'تحويلات داخلية',
    creditCardAutopay: 'سداد البطاقة الائتمانية',
    interestEarned: 'الفائدة المكتسبة',
    interestCharged: 'الفائدة المحتسبة',
    creditCardLiability: 'التزامات البطاقة الائتمانية',

    // Accounts
    accountBreakdown: 'تفاصيل الحسابات ومطابقة الأرصدة',
    summaryReconciliation: 'مطابقة ملخص الكشف',
    reconciled100: 'مطابق 100%',
    unreconciled: 'غير مطابق',
    beginningBalance: 'الرصيد الافتتاحي:',
    endingBalance: 'رصيد نهاية الكشف:',
    endingLiability: 'التزامات البطاقة الختامية:',
    totalDeposits: 'إجمالي الإيداعات:',
    totalWithdrawals: 'إجمالي السحوبات:',
    cardCredits: 'الائتمان (مشتريات/رسوم):',
    cardDebits: 'المدين (سداد تلقائي):',
    transactionsParsed: 'معاملة مستخرجة',

    // Charts
    spendingByCategory: 'النفقات حسب الفئة',
    monthlySpendingTrend: 'اتجاه النفقات الشهرية',
    monthlyCashFlow: 'التدفق النقدي الشهري: الدخل مقابل النفقات',
    chartSpending: 'الإنفاق',
    chartMonthlyExpenses: 'النفقات الشهرية',
    chartIncome: 'الدخل',
    chartExpenses: 'النفقات',
    chartNetFlow: 'صافي التدفق',

    // Insights
    insightsTitle: 'الرؤى والملاحظات المالية',
    insightsBadge: 'التحليلات الذكية وقواعد الأعمال',

    // Transactions Table
    transactionsHeader: 'المعاملات',
    showingPage: 'عرض صفحة {current} من {total}',
    showingRows: 'عرض {from} إلى {to} من أصل {total}',
    searchPlaceholder: 'بحث في الوصف أو الفئة...',
    allAccounts: 'جميع الحسابات',
    currentAccount: 'الحساب الجاري',
    savingsAccount: 'حساب التوفير',
    creditCard: 'بطاقة الائتمان',
    allFlowTypes: 'جميع أنواع التدفق',
    allCategories: 'جميع الفئات',

    dateRangeFilter: 'تصفية حسب النطاق الزمني',
    fromDate: 'من تاريخ',
    toDate: 'إلى تاريخ',
    allDates: 'كامل الفترة',
    clearDateFilter: 'إلغاء التحديد',
    tableTotalFiltered: 'الإجمالي (المحدد)',
    netTotal: 'صافي التدفق',

    // Table Columns
    colDate: 'التاريخ',
    colDescription: 'الوصف والتفاصيل',
    colAccount: 'الحساب',
    colAmount: 'المبلغ',
    colFlowType: 'نوع التدفق',
    colCategory: 'الفئة',
    colConfidence: 'مستوى الثقة',
    colBalance: 'الرصيد',
    noMatchingTransactions: 'لا توجد معاملات تطابق عوامل التصفية المحددة.',
    previous: 'السابق',
    next: 'التالي',

    // Flow Types
    flowIncome: 'دخل',
    flowExpense: 'نفقة',
    flowTransfer: 'تحويل',
    flowDebtPayment: 'سداد دين',
    flowInterestIncome: 'عائد فائدة',
    flowInterestExpense: 'فائدة مدينة',
    flowUnknown: 'غير محدد',

    // Categories
    catFoodDining: 'مأكولات ومطاعم',
    catGroceries: 'بقالة وسوبرماركت',
    catShopping: 'تسوق وتجزئة',
    catTransportation: 'مواصلات ونقل',
    catHousingRent: 'السكن والإيجار',
    catUtilitiesBills: 'فواتير وخدمات',
    catHealthcare: 'رعاية صحية وصيدليات',
    catEntertainment: 'ترفيه واشتراكات',
    catTravel: 'سفر وطيران',
    catEducation: 'تعليم ودراسة',
    catFuelAutomotive: 'وقود وصيانة سيارات',
    catSalaryIncome: 'رواتب ودخل رئيسي',
    catFreelanceIncome: 'دخل العمل الحر',
    catBankInterest: 'فوائد بنكية',
    catTransfers: 'تحويلات داخلية',
    catDebtPayments: 'سداد ديون وبطاقات',
    catOther: 'أخرى'
  }
};
