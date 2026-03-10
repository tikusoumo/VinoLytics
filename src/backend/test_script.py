import pandas as pd
from sqlalchemy import create_engine
engine = create_engine('postgresql://postgres:postgrespassword@localhost:5432/inventory_db')

query = """
    WITH sales_dates AS (
        SELECT 
            Brand, 
            AVG(EXTRACT(EPOCH FROM SalesDate::timestamp)) as avg_sales_epoch
        FROM Sales
        WHERE SalesDate IS NOT NULL
        GROUP BY Brand
    ),
    purchase_dates AS (
        SELECT 
            Brand, 
            AVG(EXTRACT(EPOCH FROM ReceivingDate::timestamp)) as avg_rec_epoch,
            AVG(PurchasePrice * Quantity) as avg_capital_outlay
        FROM Purchases
        WHERE ReceivingDate IS NOT NULL
        GROUP BY Brand
    )
    SELECT 
        COALESCE(p.Brand, s.Brand) as brand,
        (s.avg_sales_epoch - p.avg_rec_epoch) / 86400.0 AS avg_days_to_sell,
        p.avg_capital_outlay as capital_tied_up
    FROM purchase_dates p
    LEFT JOIN sales_dates s ON s.Brand = p.Brand
"""
df = pd.read_sql(query, engine)
print(df['avg_days_to_sell'].describe())
print(df.head())
