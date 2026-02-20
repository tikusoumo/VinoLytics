-- 1. Purchase Prices (Catalog)
CREATE TABLE PurchasePrices (
    Brand INT PRIMARY KEY,
    Description VARCHAR(255),
    Price DECIMAL(10, 2),
    Size VARCHAR(50),
    Volume INT,
    Classification INT,
    PurchasePrice DECIMAL(10, 2),
    VendorNumber INT,
    VendorName VARCHAR(255)
);

-- 2. Beginning Inventory
CREATE TABLE BeginningInventory (
    InventoryId VARCHAR(100) PRIMARY KEY,
    Store INT,
    City VARCHAR(100),
    Brand INT,
    Description VARCHAR(255),
    Size VARCHAR(50),
    onHand INT,
    Price DECIMAL(10, 2),
    startDate DATE
);

-- 3. Ending Inventory
CREATE TABLE EndingInventory (
    InventoryId VARCHAR(100) PRIMARY KEY,
    Store INT,
    City VARCHAR(100),
    Brand INT,
    Description VARCHAR(255),
    Size VARCHAR(50),
    onHand INT,
    Price DECIMAL(10, 2),
    endDate DATE
);

-- 4. Invoice Purchases
CREATE TABLE InvoicePurchases (
    VendorNumber INT,
    VendorName VARCHAR(255),
    InvoiceDate DATE,
    PONumber INT,
    PODate DATE,
    PayDate DATE,
    Quantity INT,
    Dollars DECIMAL(12, 2),
    Freight DECIMAL(10, 2),
    Approval VARCHAR(50)
);

-- 5. Purchases
CREATE TABLE Purchases (
    InventoryId VARCHAR(100),
    Store INT,
    Brand INT,
    Description VARCHAR(255),
    Size VARCHAR(50),
    VendorNumber INT,
    VendorName VARCHAR(255),
    PONumber INT,
    PODate DATE,
    ReceivingDate DATE,
    InvoiceDate DATE,
    PayDate DATE,
    PurchasePrice DECIMAL(10, 2),
    Quantity INT,
    Dollars DECIMAL(12, 2),
    Classification INT
);

-- 6. Sales
CREATE TABLE Sales (
    InventoryId VARCHAR(100),
    Store INT,
    Brand INT,
    Description VARCHAR(255),
    Size VARCHAR(50),
    SalesQuantity INT,
    SalesDollars DECIMAL(12, 2),
    SalesPrice DECIMAL(10, 2),
    SalesDate DATE,
    Volume INT,
    Classification INT,
    ExciseTax DECIMAL(10, 2),
    VendorNo INT,
    VendorName VARCHAR(255)
);
