from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
import pandas as pd
import numpy as np
import scipy.stats as stats

router = APIRouter()

@router.get("/reorder-alerts")
def get_reorder_alerts(db: Session = Depends(get_db), start_date: str = Query(None), end_date: str = Query(None)):
    sql_params = {}
    sales_where = ""
    if start_date and end_date:
        sales_where = f"WHERE salesdate >= %(start_date)s AND salesdate <= %(end_date)s"
        sql_params = {"start_date": start_date, "end_date": end_date}
        
    query = f"""
    WITH sales_agg AS (
        SELECT 
            brand, 
            MAX(description) AS description, 
            SUM(salesquantity) / 365.0 AS avg_daily_sales
        FROM sales
        {sales_where}
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
    
    df = pd.read_sql(query, db.bind, params=sql_params)
    
    safety_stock_days = 14
    df['safety_stock_units'] = df['avg_daily_sales'] * safety_stock_days
    df['lead_time_demand'] = df['avg_daily_sales'] * df['avg_lead_time_days']
    
    df['rop'] = df['lead_time_demand'] + df['safety_stock_units']
    df['rop'] = df['rop'].apply(lambda x: int(x + 0.9999))
    
    alerts_df = df[df['current_on_hand'] < df['rop']].copy()
    alerts_df = alerts_df.sort_values(by='avg_daily_sales', ascending=False).head(50)
    alerts_df = alerts_df.fillna(0)
    
    return alerts_df.to_dict(orient="records")

@router.get("/inventory-optimization")
def get_inventory_optimization(db: Session = Depends(get_db), start_date: str = Query(None), end_date: str = Query(None)):
    sql_params = {}
    po_where = ""
    if start_date and end_date:
        po_where = f" AND podate >= %(start_date)s AND podate <= %(end_date)s"
        sql_params = {"start_date": start_date, "end_date": end_date}
        
    extraction_query = f"""
    WITH sales_agg AS (
        SELECT 
            brand, 
            MAX(description) AS description, 
            SUM(salesquantity) AS annual_demand,
            SUM(salesquantity) / 365.0 AS avg_daily_sales
        FROM sales
        GROUP BY brand
    ),
    prices AS (
        SELECT 
            brand,
            MAX(purchaseprice) AS purchase_price
        FROM purchaseprices
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
          {po_where}
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
        s.annual_demand,
        s.avg_daily_sales,
        p.purchase_price,
        COALESCE(l.avg_lead_time_days, 14) AS avg_lead_time_days,
        COALESCE(i.current_on_hand, 0) AS current_on_hand
    FROM sales_agg s
    LEFT JOIN prices p ON s.brand = p.brand
    LEFT JOIN lead_times l ON s.brand = l.brand
    LEFT JOIN inventory i ON s.brand = i.brand
    WHERE s.annual_demand > 0 AND p.purchase_price > 0
    """
    
    opt_df = pd.read_sql(extraction_query, db.bind, params=sql_params)
    
    S = 45.0
    h = 0.20
    safety_stock_days = 14
    
    opt_df['holding_cost_unit'] = opt_df['purchase_price'] * h
    opt_df['eoq'] = np.sqrt((2 * opt_df['annual_demand'] * S) / opt_df['holding_cost_unit'])
    opt_df['eoq'] = np.ceil(opt_df['eoq']).astype(int)
    
    opt_df['safety_stock_units'] = opt_df['avg_daily_sales'] * safety_stock_days
    opt_df['lead_time_demand'] = opt_df['avg_daily_sales'] * opt_df['avg_lead_time_days']
    opt_df['rop'] = opt_df['lead_time_demand'] + opt_df['safety_stock_units']
    opt_df['rop'] = np.ceil(opt_df['rop']).astype(int)
    
    opt_df['action_required'] = np.where(opt_df['current_on_hand'] < opt_df['rop'], 'Reorder Now', 'Stock Adequate')
    at_risk_df = opt_df[opt_df['action_required'] == 'Reorder Now'].sort_values(by='annual_demand', ascending=False).head(10)
    
    at_risk_df = at_risk_df.fillna(0)
    return at_risk_df[['brand', 'description', 'current_on_hand', 'rop', 'eoq', 'action_required']].to_dict(orient="records")

@router.get("/safety-stock-simulation")
def get_safety_stock_simulation(db: Session = Depends(get_db), start_date: str = Query(None), end_date: str = Query(None)):
    sql_params = {}
    po_where = ""
    if start_date and end_date:
        po_where = f" AND podate >= %(start_date)s AND podate <= %(end_date)s"
        sql_params = {"start_date": start_date, "end_date": end_date}
        
    extraction_query = f"""
    WITH sales_agg AS (
        SELECT 
            brand, 
            MAX(description) AS description, 
            SUM(salesquantity) AS daily_sales,
            salesdate::date AS sales_date
        FROM sales
        GROUP BY brand, sales_date
    ),
    demand_metrics AS (
        SELECT
            brand,
            MAX(description) as description,
            AVG(daily_sales) as avg_daily_demand,
            STDDEV(daily_sales) as std_dev_demand,
            SUM(daily_sales) as total_volume
        FROM sales_agg
        GROUP BY brand
    ),
    lead_times AS (
        SELECT 
            brand,
            EXTRACT(DAY FROM (receivingdate::timestamp - podate::timestamp)) AS lead_time_days
        FROM purchases
        WHERE podate IS NOT NULL 
          AND receivingdate IS NOT NULL 
          AND receivingdate >= podate
          {po_where}
    ),
    lt_metrics AS (
        SELECT
            brand,
            AVG(lead_time_days) as avg_lead_time,
            STDDEV(lead_time_days) as std_dev_lead_time
        FROM lead_times
        GROUP BY brand
    )
    SELECT
        d.brand,
        d.description,
        d.avg_daily_demand,
        COALESCE(d.std_dev_demand, 0.0) as std_dev_demand,
        d.total_volume,
        COALESCE(l.avg_lead_time, 14.0) as avg_lead_time,
        COALESCE(l.std_dev_lead_time, 2.0) as std_dev_lead_time
    FROM demand_metrics d
    LEFT JOIN lt_metrics l ON d.brand = l.brand
    WHERE d.avg_daily_demand > 0
    """
    
    opt_df = pd.read_sql(extraction_query, db.bind, params=sql_params)
    
    service_level = 0.95
    z_score = stats.norm.ppf(service_level)
    
    opt_df['variance_demand_term'] = opt_df['avg_lead_time'] * (opt_df['std_dev_demand'] ** 2)
    opt_df['variance_lead_time_term'] = (opt_df['avg_daily_demand'] ** 2) * (opt_df['std_dev_lead_time'] ** 2)
    
    opt_df['safety_stock'] = z_score * np.sqrt(opt_df['variance_demand_term'] + opt_df['variance_lead_time_term'])
    opt_df['safety_stock'] = np.ceil(opt_df['safety_stock'].fillna(0)).astype(int)
    
    opt_df['lead_time_demand'] = opt_df['avg_daily_demand'] * opt_df['avg_lead_time']
    opt_df['dynamic_rop'] = np.ceil(opt_df['lead_time_demand'] + opt_df['safety_stock']).astype(int)

    lead_time_variance_multiplier = 1.5
    holding_cost_per_unit = 2.50
    
    shocked_std_dev_lead_time = opt_df['std_dev_lead_time'] * lead_time_variance_multiplier
    variance_lead_time_term_shock = (opt_df['avg_daily_demand'] ** 2) * (shocked_std_dev_lead_time ** 2)
    
    opt_df['shock_safety_stock'] = z_score * np.sqrt(opt_df['variance_demand_term'] + variance_lead_time_term_shock)
    opt_df['shock_safety_stock'] = np.ceil(opt_df['shock_safety_stock'].fillna(0)).astype(int)
    
    opt_df['additional_units_needed'] = opt_df['shock_safety_stock'] - opt_df['safety_stock']
    opt_df['additional_units_needed'] = opt_df['additional_units_needed'].clip(lower=0)
    opt_df['additional_capital_tied_up'] = opt_df['additional_units_needed'] * holding_cost_per_unit

    results_df = opt_df.sort_values(by='additional_capital_tied_up', ascending=False).head(10)
    results_df = results_df.fillna(0)
    
    return results_df[['brand', 'description', 'total_volume', 'safety_stock', 'shock_safety_stock', 'additional_capital_tied_up']].to_dict(orient="records")
