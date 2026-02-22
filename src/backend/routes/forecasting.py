from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import pandas as pd
from prophet import Prophet

router = APIRouter()

@router.get("/demand-forecast")
def get_demand_forecast(db: Session = Depends(get_db), start_date: str = Query(None), end_date: str = Query(None)):
    sql_params = {}
    sales_where = ""
    if start_date and end_date:
        sales_where = f"WHERE salesdate >= %(start_date)s AND salesdate <= %(end_date)s"
        sql_params = {"start_date": start_date, "end_date": end_date}
        
    top_brand_query = f"""
        SELECT 
            brand,
            MAX(description) as description,
            SUM(salesquantity) as total_volume_sold
        FROM sales
        {sales_where}
        GROUP BY brand
        ORDER BY total_volume_sold DESC
        LIMIT 1;
    """
    top_brand_df = pd.read_sql(top_brand_query, db.bind, params=sql_params)
    
    if top_brand_df.empty and start_date and end_date:
        # Fallback to all-time top brand if the selected period has no sales (e.g. Q2-Q4 2016)
        top_brand_query_fallback = """
            SELECT 
                brand,
                MAX(description) as description,
                SUM(salesquantity) as total_volume_sold
            FROM sales
            GROUP BY brand
            ORDER BY total_volume_sold DESC
            LIMIT 1;
        """
        top_brand_df = pd.read_sql(top_brand_query_fallback, db.bind)
        
    if top_brand_df.empty:
        return {"error": "No sales data found"}
        
    target_brand_id = top_brand_df['brand'].iloc[0]
    target_brand_name = top_brand_df['description'].iloc[0]
    
    # For forecasting, time-series models (like Prophet) need ALL historical data to determine seasonality and trends.
    # Therefore, we intentionally do NOT filter the historical training data by `start_date` and `end_date`.
    sales_query = f"""
        SELECT 
            salesdate::date as ds,
            SUM(salesquantity) as y
        FROM sales
        WHERE brand = '{target_brand_id}'
        GROUP BY salesdate::date
        ORDER BY salesdate::date ASC;
    """
    
    df = pd.read_sql(sales_query, db.bind)
    df['ds'] = pd.to_datetime(df['ds'])
    
    model = Prophet(yearly_seasonality=True, weekly_seasonality=True, daily_seasonality=False)
    model.fit(df)
    
    future = model.make_future_dataframe(periods=30, freq='D')
    forecast = model.predict(future)
    
    forecast['ds'] = forecast['ds'].dt.strftime('%Y-%m-%d')
    res = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(60).to_dict(orient="records")
    return {"brand_name": target_brand_name, "forecast": res}
