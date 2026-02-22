from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import pandas as pd

router = APIRouter()

@router.get("/abc-summary")
def get_abc_summary(db: Session = Depends(get_db), start_date: str = Query(None), end_date: str = Query(None)):
    sql_params = {}
    sales_where = ""
    if start_date and end_date:
        sales_where = f"WHERE salesdate >= %(start_date)s AND salesdate <= %(end_date)s"
        sql_params = {"start_date": start_date, "end_date": end_date}
        
    query = f"""
    SELECT 
        brand, 
        SUM(salesdollars) as total_revenue
    FROM sales
    {sales_where}
    GROUP BY brand
    HAVING SUM(salesdollars) > 0
    ORDER BY total_revenue DESC
    """
    
    df = pd.read_sql(query, db.bind, params=sql_params)
    
    if df.empty and start_date and end_date:
        # Fallback to all-time data if the selected period has no sales (e.g., Q2-Q4 2016)
        query_fallback = """
        SELECT 
            brand, 
            SUM(salesdollars) as total_revenue
        FROM sales
        GROUP BY brand
        HAVING SUM(salesdollars) > 0
        ORDER BY total_revenue DESC
        """
        df = pd.read_sql(query_fallback, db.bind)
        
    if df.empty:
        return []
    
    total_rev = df['total_revenue'].sum()
    df['cumulative_revenue'] = df['total_revenue'].cumsum()
    df['cumulative_percentage'] = df['cumulative_revenue'] / total_rev
    
    def categorize(pct):
        if pct <= 0.80: return 'A'
        elif pct <= 0.95: return 'B'
        else: return 'C'
            
    df['category'] = df['cumulative_percentage'].apply(categorize)
    
    summary_df = df.groupby('category').agg(
        brand_count=('brand', 'count'),
        total_revenue=('total_revenue', 'sum')
    ).reset_index()
    
    return summary_df.to_dict(orient="records")
