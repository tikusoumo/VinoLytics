import pandas as pd
from sqlalchemy import create_engine

# Format: postgresql+psycopg://username:password@host:port/database_name
engine = create_engine('postgresql+psycopg://postgres:postgrespassword@localhost:5432/inventory_db')

import os

# 2. Dictionary mapping table names to their corresponding CSV file paths
BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')

files_to_load = {
    'purchaseprices': os.path.join(BASE_DIR, '2017PurchasePricesDec.csv'),
    'beginninginventory': os.path.join(BASE_DIR, 'BegInvFINAL12312016.csv'),
    'endinginventory': os.path.join(BASE_DIR, 'EndInvFINAL12312016.csv'),
    'invoicepurchases': os.path.join(BASE_DIR, 'InvoicePurchases12312016.csv'),
    'purchases': os.path.join(BASE_DIR, 'PurchasesFINAL12312016.csv'),
    'sales': os.path.join(BASE_DIR, 'SalesFINAL12312016.csv')
}

# 3. Loop through and load the data
for table_name, file_path in files_to_load.items():
    print(f"Loading {file_path} into {table_name}...")
    
    # Read the CSV (we parse dates dynamically to avoid SQL errors)
    try:
        df = pd.read_csv(file_path)
        df.columns = df.columns.str.lower()
        
        # Ensure date columns are parsed as datetimes, otherwise psycopg3 rejects them
        date_cols = ['startdate', 'enddate', 'invoicedate', 'podate', 'paydate', 'receivingdate', 'salesdate']
        for col in date_cols:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Ensure 'volume' is numeric
        if 'volume' in df.columns:
            df['volume'] = pd.to_numeric(df['volume'], errors='coerce')
                
        # Load into PostgreSQL. 
        # if_exists='append' will add to the tables you just created.
        df.to_sql(table_name, engine, if_exists='append', index=False)
        print(f"Successfully loaded {len(df)} rows into {table_name}!\n")
        
    except Exception as e:
        print(f"Error loading {file_path}: {e}\n")

print("All data ingestion complete!")