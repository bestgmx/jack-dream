export enum Language {
  EN = 'en',
  FA = 'fa',
  ZH = 'zh',
}

export interface User {
  username: string;
}

export interface Person {
  id: number;
  name:string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export interface JacksExpenseCategory {
  id: string;
  name: string;
}

export interface OrderCategory {
  id: string;
  name: string;
  expenses: Expense[];
  totalSpent: number;
}

export type TransactionType = 'PaymentIn' | 'PaymentOut' | 'Conversion' | 'InternalTransfer';

export interface Currency {
    code: 'USD' | 'CNY' | 'IRT';
    name: string;
}

export interface Transaction {
    id: string;
    date: string;
    type: TransactionType;
    amount: number;
    currency: Currency['code'];
    description: string;
    entityId?: number; // For PaymentIn/Out, Conversion
    fromEntityId?: number; // For InternalTransfer
    toEntityId?: number; // For InternalTransfer
    rate?: number; // For Conversion, or PaymentIn/Out in foreign currency
    toCurrency?: Currency['code']; // For Conversion
}

export interface Delivery {
    id: string;
    orderNumberCategoryId: string;
    deliveryDate: string;
    cartonCount: number;
    weight: number;
    receiptNumber: string;
    deliveryType: 'sea' | 'air';
    destination: 'dubai' | 'iraq';
    receiptPhoto?: File | null;
    cargoPhoto?: File | null;
    description?: string;
    isArrived: boolean;
}

export interface OrderNumberCategory {
    id: string;
    name: string;
}

// --- Inventory Management Types ---
export interface Product {
  id: string;
  item_code: string;
  brand_named?: string;
  specifications?: string;
  category_name?: string;
  source?: string;
  order_number?: string;
  quantity?: number;
  cny_purchase_price?: number;
  usd_selling_price?: number;
  description?: string;
  warehouse_name?: string;
}

export interface InvoiceItem {
  productId: string;
  productName: string; // denormalized for easy display
  quantity: number;
  unitPrice: number; // price at the time of invoice creation
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  personId: number;
  personName: string; // denormalized
  date: string;
  currency: 'USD' | 'IRT';
  items: InvoiceItem[];
  totalAmount: number;
  discount: number; // discount applied to the invoice
}

export type Inventory = Record<string, number>; // Maps Product ID to quantity


export type TranslationKey = 
  | 'loginTitle'
  | 'usernameLabel'
  | 'passwordLabel'
  | 'loginButton'
  | 'logoutButton'
  | 'welcomeMessage'
  | 'invalidCredentialsError'
  | 'languageSelector'
  // Person Management Keys
  | 'personsCardTitle'
  | 'personsCardDescription'
  | 'addPersonPlaceholder'
  | 'addPersonButton'
  | 'editButton'
  | 'deleteButton'
  | 'saveButton'
  | 'cancelButton'
  | 'personNameLabel'
  | 'itemCode'
  // Sidebar & Navigation
  | 'sidebarDashboard'
  | 'sidebarPersons'
  | 'sidebarProducts'
  | 'sidebarInventory'
  | 'sidebarInvoicing'
  | 'dashboardTitle'
  | 'sidebarJacksPayment'
  | 'sidebarTransactions'
  | 'sidebarDeliveries'
  // Jack's Payment Keys
  | 'jacksPaymentTitle'
  | 'jacksBalance'
  | 'addCategoryCardTitle'
  | 'categoryNameLabel'
  | 'categoryNamePlaceholder'
  | 'createCategoryButton'
  | 'existingCategoriesCardTitle'
  | 'totalSpent'
  | 'noCategories'
  | 'viewExpensesButton'
  | 'expensesFor'
  | 'addExpenseCardTitle'
  | 'expenseDateLabel'
  | 'expenseDescriptionLabel'
  | 'expenseDescriptionPlaceholder'
  | 'expenseAmountLabel'
  | 'addExpenseButton'
  | 'expenseHistoryTitle'
  | 'dateColumn'
  | 'descriptionColumn'
  | 'amountColumn'
  | 'actionsColumn'
  | 'noExpenses'
  | 'editCategoryModalTitle'
  | 'editExpenseModalTitle'
  | 'deleteConfirmation'
  // Transactions Keys
  | 'transactionsTitle'
  | 'transactionFormHeading'
  | 'transactionTypeLabel'
  | 'selectTransactionType'
  | 'typePaymentIn'
  | 'typePaymentOut'
  | 'typeConversion'
  | 'typeInternalTransfer'
  | 'amountLabel'
  | 'currencyLabel'
  | 'selectCurrency'
  | 'rateLabel'
  | 'rateConversionHint'
  | 'toCurrencyLabel'
  | 'convertedAmountLabel'
  | 'transactionDateLabel'
  | 'personAccountLabel'
  | 'selectPersonAccount'
  | 'fromEntityLabel'
  | 'selectFromEntity'
  | 'toEntityLabel'
  | 'selectToEntity'
  | 'descriptionLabel'
  | 'recordTransactionButton'
  | 'filterTransactions'
  | 'transactionType'
  | 'currency'
  | 'person'
  | 'dateFrom'
  | 'dateTo'
  | 'applyFilters'
  | 'clearFilters'
  | 'transactionHistoryHeading'
  | 'allTypes'
  | 'allCurrencies'
  | 'allPersons'
  | 'transactionDate'
  | 'actionsHeader'
  | 'noTransactions'
  | 'transactionAddedSuccess'
  | 'transactionDeletedSuccess'
  | 'editTransactionModalTitle'
  | 'previous'
  | 'next'
  // Balance Table Keys
  | 'balancesTitle'
  | 'personNameColumn'
  | 'usdBalanceColumn'
  | 'cnyBalanceColumn'
  | 'tomanBalanceColumn'
  | 'noPersonsForBalance'
  // Deliveries Keys
  | 'deliveriesManagementTitle'
  | 'addNewDelivery'
  | 'orderNumberCategory'
  | 'addCategoryButton'
  | 'manageCategoriesButton'
  | 'orderNumber'
  | 'deliveryDate'
  | 'cartonQuantity'
  | 'weight'
  | 'receiptNumber'
  | 'deliveryType'
  | 'deliveryTypeSea'
  | 'deliveryTypeAir'
  | 'deliveryDestination'
  | 'destinationDubai'
  | 'destinationIraq'
  | 'receiptPhoto'
  | 'cargoPhoto'
  | 'description'
  | 'addDeliveryButton'
  | 'lastDeliveries'
  | 'actions'
  | 'viewPhoto'
  | 'deleteDeliveryConfirmation'
  | 'noDeliveriesFound'
  | 'addOrderNumberCategoryModalTitle'
  | 'manageOrderNumberCategoriesModalTitle'
  | 'selectOrderNumberCategory'
  | 'categoryName'
  | 'noOrderNumberCategories'
  | 'deliveryAddedSuccess'
  | 'viewImageModalTitle'
  | 'cargoStatus'
  | 'cargoArrived'
  | 'cargoInTransit'
  // Product Management
  | 'productsTitle'
  | 'addNewProduct'
  | 'productSKU'
  | 'productName'
  | 'productUnit'
  | 'productPriceUSD'
  | 'productPriceIRT'
  | 'noProducts'
  | 'productAddedSuccess'
  | 'productUpdatedSuccess'
  | 'productDeletedSuccess'
  | 'editProduct'
  // Inventory Management
  | 'inventoryTitle'
  | 'currentStock'
  | 'product'
  | 'quantity'
  | 'updateStock'
  | 'updateFromExcel'
  | 'downloadTemplate'
  | 'uploadExcelFile'
  | 'excelUploadInstructions'
  | 'excelUploadSuccess'
  | 'excelUploadError'
  | 'manualStockUpdate'
  | 'newQuantity'
  | 'noInventory'
  // Invoicing
  | 'invoicingTitle'
  | 'invoiceHistory'
  | 'createNewInvoice'
  | 'invoiceNumber'
  | 'customer'
  | 'invoiceDate'
  | 'totalAmount'
  | 'downloadPDF'
  | 'noInvoices'
  | 'selectCustomer'
  | 'selectCurrencyForInvoice'
  | 'invoiceItems'
  | 'addItem'
  | 'selectProduct'
  | 'unitPrice'
  | 'total'
  | 'invoiceTotal'
  | 'saveInvoice'
  | 'invoiceSavedSuccess'
  | 'invoice'
  | 'billTo'
  | 'date'
  | 'item'
  | 'price'
  | 'subtotal'
  | 'brandName'
  | 'specifications'
  | 'categoryName'
  | 'source'
  | 'orderNumber'
  | 'cnyPurchasePrice'
  | 'usdSellingPrice'
  | 'warehouseName'
  | 'brandNamed'
  | 'langEnglish'
  | 'langFarsi'
  | 'langChinese'
  | 'showAllPopup'
  | 'showAllNewWindow'
  | 'usdBalance'
  | 'cnyBalance'
  | 'irtBalance'
  | 'dashboardHint'

export type Translations = {
  [key in Language]: {
    [key in TranslationKey]: string;
  };
};