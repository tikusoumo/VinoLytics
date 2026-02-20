from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import pandas as pd

router = APIRouter()

@router.get("/reorder-alerts")
def get_reorder_alerts(db: Session = Depends(get_db)):
    # TODO: Add pagination parameters (skip, limit) so we don't dump everything at once if the DB gets huge.
    
    # We are using pandas here to process the raw SQL easily. 
    # It might be slightly slower than pure SQLAlchemy ORM but it's much faster to write for analytics.
    
    query = """
    WITH sales_agg AS (
        SELECT 
            brand, 
            MAX(description) AS description, 
            SUM(salesquantity) / 365.0 AS avg_daily_sales
        FROM sales
        GROUP BY brand
    ),
    lead_times AS (
        SELECT 
            brand,
            AVG(EXTRACT(DAY FROM (receivingdate::timestamp - podate::timestamp))) AS avg_lead_time_days
        FROM purchases
        WHERE podate IS NOT NULL 
          AND receivingdate IS NOT NULL 
          AND receivingdate >= podate
        GROUP BY brand
    ),
    inventory AS (
        SELECT 
            brand,
            SUM(onhand) AS current_on_hand
        FROM endinginventory
        GROUP BY brand
    )
    SELECT 
        s.brand,
        s.description,
        s.avg_daily_sales,
        COALESCE(l.avg_lead_time_days, 14) AS avg_lead_time_days,
        COALESCE(i.current_on_hand, 0) AS current_on_hand
    FROM sales_agg s
    LEFT JOIN lead_times l ON s.brand = l.brand
    LEFT JOIN inventory i ON s.brand = i.brand
    """
    
    # Pull data into a pandas dataframe
    df = pd.read_sql(query, db.bind)
    
    # Business logic assumption: 14 days safety stock 
    # FIXME: this should be a configurable setting per brand, not a global hardcoded variable.
    safety_stock_days = 14
    
    df['safety_stock_units'] = df['avg_daily_sales'] * safety_stock_days
    df['lead_time_demand'] = df['avg_daily_sales'] * df['avg_lead_time_days']
    
    # Calculate ROP (Reorder Point)
    df['rop'] = df['lead_time_demand'] + df['safety_stock_units']
    df['rop'] = df['rop'].apply(lambda x: int(x + 0.9999)) # ceiling
    
    # Find items that need to be reordered
    alerts_df = df[df['current_on_hand'] < df['rop']].copy()
    
    # Sort by the most critical (lowest on hand relative to ROP) and get top 50
    # For now, let's just sort by highest avg_daily_sales to restock popular items first
    alerts_df = alerts_df.sort_values(by='avg_daily_sales', ascending=False).head(50)
    
    # Clean up NaN/Infinity for JSON serialization
    alerts_df = alerts_df.fillna(0)
    
    return alerts_df.to_dict(orient="records")


@router.get("/abc-summary")
def get_abc_summary(db: Session = Depends(get_db)):
    # FIXME: This query is a bit heavy because it sums up the entire sales table. 
    # Should probably be a materialized view in the database or cached via Redis later.
    
    query = """
    SELECT 
        brand, 
        SUM(salesdollars) as total_revenue
    FROM sales
    GROUP BY brand
    HAVING SUM(salesdollars) > 0
    ORDER BY total_revenue DESC
    """
    
    df = pd.read_sql(query, db.bind)
    
    if df.empty:
        return []
    
    # Calculate cumulative percentage of revenue
    total_rev = df['total_revenue'].sum()
    df['cumulative_revenue'] = df['total_revenue'].cumsum()
    df['cumulative_percentage'] = df['cumulative_revenue'] / total_rev
    
    # Categorize into A, B, C
    # A = Top 80%, B = Next 15%, C = Bottom 5%
    def categorize(pct):
        if pct <= 0.80:
            return 'A'
        elif pct <= 0.95:
            return 'B'
        else:
            return 'C'
            
    df['category'] = df['cumulative_percentage'].apply(categorize)
    
    # Aggregate summary
    summary_df = df.groupby('category').agg(
        brand_count=('brand', 'count'),
        total_revenue=('total_revenue', 'sum')
    ).reset_index()
    
    return summary_df.to_dict(orient="records")
