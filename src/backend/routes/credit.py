from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import pandas as pd

router = APIRouter()

@router.get("/credit-risk")
def get_credit_risk(db: Session = Depends(get_db), start_date: str = Query(None), end_date: str = Query(None)):
    sql_params = {}
    sales_where_alias = "WHERE s.SalesDate IS NOT NULL"
    purchase_where = "WHERE ReceivingDate IS NOT NULL"
    if start_date and end_date:
        sales_where_alias += f" AND s.SalesDate >= %(start_date)s AND s.SalesDate <= %(end_date)s"
        purchase_where += f" AND ReceivingDate >= %(start_date)s AND ReceivingDate <= %(end_date)s"
        sql_params = {"start_date": start_date, "end_date": end_date}
        
    query = f"""
    WITH brand_sales AS (
        SELECT 
            s.Brand, 
            MAX(s.Description) AS Description,
            SUM(s.SalesDollars) AS total_revenue,
            SUM(s.SalesDollars - (s.SalesQuantity * p.PurchasePrice)) AS gross_profit,
            AVG(EXTRACT(EPOCH FROM s.SalesDate::timestamp)) AS avg_sales_epoch
        FROM Sales s
        LEFT JOIN PurchasePrices p ON s.Brand = p.Brand
        {sales_where_alias}
        GROUP BY s.Brand
    ),
    brand_purchases AS (
        SELECT 
            Brand,
            MAX(Description) AS Description,
            SUM(PurchasePrice * Quantity) AS total_capital_outlay,
            AVG(EXTRACT(EPOCH FROM ReceivingDate::timestamp)) AS avg_rec_epoch
        FROM Purchases
        {purchase_where}
        GROUP BY Brand
    )
    SELECT
        COALESCE(s.Brand, p.Brand) as brand,
        COALESCE(s.Description, p.Description) as description,
        COALESCE(s.total_revenue, 0) as total_revenue,
        COALESCE(s.gross_profit, 0) as gross_profit,
        COALESCE(p.total_capital_outlay, 0) as total_capital_outlay,
        (s.avg_sales_epoch - p.avg_rec_epoch) / 86400.0 AS avg_days_to_sell
    FROM brand_sales s
    FULL OUTER JOIN brand_purchases p ON s.Brand = p.Brand
    """
    
    df = pd.read_sql(query, db.bind, params=sql_params)
    
    if df.empty:
        return []
        
    df['avg_days_to_sell'] = df['avg_days_to_sell'].fillna(180) 
    df['avg_days_to_sell'] = df['avg_days_to_sell'].apply(lambda x: 180 if x <= 0 else x)
    
    df['profit_margin'] = df['gross_profit'] / df['total_revenue'].replace(0, 1) 
    
    score_margin = (df['profit_margin'] / 0.30).clip(upper=1) * 200
    score_days = ((90 - df['avg_days_to_sell']) / 80).clip(lower=0, upper=1) * 150
    score_revenue = (df['total_revenue'] / 10000).clip(upper=1) * 200
    
    df['credit_score'] = (300 + score_margin + score_days + score_revenue).fillna(300).astype(int)
    
    df['credit_score'] = df.apply(lambda row: min(850, max(300, row['credit_score'] + (int(str(row['brand'])) % 100) - 50)), axis=1)
    
    def get_risk(score):
        if score >= 700: return "Low Risk"
        if score >= 600: return "Moderate Risk"
        return "High Risk"
    df['risk_level'] = df['credit_score'].apply(get_risk)
    
    df['suggested_loan_amount'] = (df['total_capital_outlay'] * 0.20).clip(lower=500, upper=500000)
    
    df['proposed_apr'] = 24.0 - ((df['credit_score'] - 300) / 550.0) * 19.0
    df['proposed_apr'] = df['proposed_apr'].round(1)
    
    result = df[df['total_capital_outlay'] > 0].sort_values(by='total_revenue', ascending=False).head(50)
    
    result = result.fillna(0)
    return result[['brand', 'description', 'total_revenue', 'total_capital_outlay', 'avg_days_to_sell', 'credit_score', 'risk_level', 'suggested_loan_amount', 'proposed_apr']].to_dict(orient="records")
