from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import pandas as pd

router = APIRouter()

@router.get("/margin-bleeders")
def get_margin_bleeders(db: Session = Depends(get_db), start_date: str = Query(None), end_date: str = Query(None)):
    sql_params = {}
    sales_where = ""
    if start_date and end_date:
        sales_where = f"WHERE salesdate >= %(start_date)s AND salesdate <= %(end_date)s"
        sql_params = {"start_date": start_date, "end_date": end_date}
        
    query_margin = f"""
    WITH brand_sales AS (
        SELECT 
            Brand, 
            MAX(Description) as Description,
            AVG(SalesPrice) as avg_sales_price,
            AVG(ExciseTax) as avg_excise_tax
        FROM Sales
        {sales_where}
        GROUP BY Brand
    ),
    po_freight AS (
        SELECT 
            PONumber, 
            SUM(Freight) / NULLIF(SUM(Quantity), 0) as freight_per_unit_po
        FROM InvoicePurchases
        GROUP BY PONumber
    ),
    brand_purchases AS (
        SELECT 
            p.Brand,
            AVG(p.PurchasePrice) as avg_purchase_price,
            AVG(pf.freight_per_unit_po) as avg_freight_per_unit
        FROM Purchases p
        LEFT JOIN po_freight pf ON p.PONumber = pf.PONumber
        GROUP BY p.Brand
    )
    SELECT 
        s.Brand as brand,
        s.Description as description,
        s.avg_sales_price,
        s.avg_excise_tax,
        p.avg_purchase_price,
        COALESCE(p.avg_freight_per_unit, 0) as avg_freight_per_unit
    FROM brand_sales s
    JOIN brand_purchases p ON s.Brand = p.Brand
    """
    
    df_margin = pd.read_sql(query_margin, db.bind, params=sql_params)
    
    df_margin['gross_margin'] = df_margin['avg_sales_price'] - df_margin['avg_purchase_price']
    df_margin['true_margin'] = df_margin['gross_margin'] - df_margin['avg_excise_tax'] - df_margin['avg_freight_per_unit']
    
    df_margin = df_margin[df_margin['avg_sales_price'] > 1.0].copy()
    bleeders = df_margin.sort_values('true_margin').head(10)
    
    bleeders = bleeders.fillna(0)
    return bleeders[['brand', 'description', 'avg_sales_price', 'gross_margin', 'true_margin']].to_dict(orient="records")

@router.get("/capital-traps")
def get_capital_traps(db: Session = Depends(get_db), start_date: str = Query(None), end_date: str = Query(None)):
    sql_params = {}
    sales_where = "WHERE SalesDate IS NOT NULL"
    purchase_where = "WHERE ReceivingDate IS NOT NULL"
    if start_date and end_date:
        sales_where += f" AND SalesDate >= %(start_date)s AND SalesDate <= %(end_date)s"
        purchase_where += f" AND ReceivingDate >= %(start_date)s AND ReceivingDate <= %(end_date)s"
        sql_params = {"start_date": start_date, "end_date": end_date}
        
    query_ccc = f"""
    WITH sales_dates AS (
        SELECT 
            Brand, 
            AVG(EXTRACT(EPOCH FROM SalesDate::timestamp)) as avg_sales_epoch
        FROM Sales
        {sales_where}
        GROUP BY Brand
    ),
    purchase_dates AS (
        SELECT 
            Brand, 
            AVG(EXTRACT(EPOCH FROM ReceivingDate::timestamp)) as avg_rec_epoch,
            AVG(PurchasePrice * Quantity) as avg_capital_outlay
        FROM Purchases
        {purchase_where}
        GROUP BY Brand
    )
    SELECT 
        COALESCE(p.Brand, s.Brand) as brand,
        (s.avg_sales_epoch - p.avg_rec_epoch) / 86400.0 AS avg_days_to_sell,
        p.avg_capital_outlay as capital_tied_up
    FROM purchase_dates p
    LEFT JOIN sales_dates s ON s.Brand = p.Brand
    """
    
    df_ccc = pd.read_sql(query_ccc, db.bind, params=sql_params)
    
    if df_ccc.empty:
        return []
        
    df_ccc['avg_days_to_sell'] = df_ccc['avg_days_to_sell'].fillna(365)
    df_ccc['avg_days_to_sell'] = df_ccc['avg_days_to_sell'].apply(lambda x: 365 if x <= 0 else x)
    
    query_desc = "SELECT Brand as brand, MAX(Description) as description FROM Purchases GROUP BY Brand"
    df_desc = pd.read_sql(query_desc, db.bind)
    
    df_ccc = df_ccc.merge(df_desc, on='brand', how='left')
    
    median_days = df_ccc['avg_days_to_sell'].median() if not df_ccc['avg_days_to_sell'].isna().all() else 0
    median_capital = df_ccc['capital_tied_up'].median() if not df_ccc['capital_tied_up'].isna().all() else 0
    
    traps = df_ccc[(df_ccc['avg_days_to_sell'] >= median_days) & (df_ccc['capital_tied_up'] >= median_capital)]
    traps = traps.sort_values(by=['capital_tied_up', 'avg_days_to_sell'], ascending=[False, False]).head(30)
    
    traps = traps.fillna(0)
    return traps[['brand', 'description', 'avg_days_to_sell', 'capital_tied_up']].to_dict(orient="records")
