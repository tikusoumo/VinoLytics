import pandas as pd
from sqlalchemy import create_engine
import os

# FIXME: Hardcoded creds for now. Moved this to .env later when setting up FastAPI
engine = create_engine('postgresql+psycopg://postgres:postgrespassword@localhost:5432/inventory_db')

BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'raw')

# Map tables to raw dumps
files_to_load = {
    'purchaseprices': os.path.join(BASE_DIR, '2017PurchasePricesDec.csv'),
    'beginninginventory': os.path.join(BASE_DIR, 'BegInvFINAL12312016.csv'),
    'endinginventory': os.path.join(BASE_DIR, 'EndInvFINAL12312016.csv'),
    'invoicepurchases': os.path.join(BASE_DIR, 'InvoicePurchases12312016.csv'),
    'purchases': os.path.join(BASE_DIR, 'PurchasesFINAL12312016.csv'),
    'sales': os.path.join(BASE_DIR, 'SalesFINAL12312016.csv')
}

for table_name, file_path in files_to_load.items():
    print(f"Loading {file_path} into {table_name}...")
    
    try:
        df = pd.read_csv(file_path)
        df.columns = df.columns.str.lower()
        
        # Hacky fix: pg driver screams if these aren't proper dt objects
        # TODO: Pull this out into a cleaner mapping dict eventually
        date_cols = ['startdate', 'enddate', 'invoicedate', 'podate', 'paydate', 'receivingdate', 'salesdate']
        for col in date_cols:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')
        
        # Some bad data sneaking in 'volume'
        if 'volume' in df.columns:
            df['volume'] = pd.to_numeric(df['volume'], errors='coerce')
                
        df.to_sql(table_name, engine, if_exists='append', index=False)
        print(f"Success! Yeeted {len(df)} rows into {table_name}.")
        
    except Exception as e:
        print(f"Whoops, couldn't load {file_path}. Check if the CSV isn't mangled. Error: {e}")

print("All done pumping data to local pg!")