from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import pandas as pd
import numpy as np
from prophet import Prophet

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

@router.get("/margin-bleeders")
def get_margin_bleeders(db: Session = Depends(get_db)):
    query_margin = """
    WITH brand_sales AS (
        SELECT 
            Brand, 
            MAX(Description) as Description,
            AVG(SalesPrice) as avg_sales_price,
            AVG(ExciseTax) as avg_excise_tax
        FROM Sales
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
    
    df_margin = pd.read_sql(query_margin, db.bind)
    
    df_margin['gross_margin'] = df_margin['avg_sales_price'] - df_margin['avg_purchase_price']
    df_margin['true_margin'] = df_margin['gross_margin'] - df_margin['avg_excise_tax'] - df_margin['avg_freight_per_unit']
    
    df_margin = df_margin[df_margin['avg_sales_price'] > 1.0].copy()
    bleeders = df_margin.sort_values('true_margin').head(10)
    
    bleeders = bleeders.fillna(0)
    return bleeders[['brand', 'description', 'avg_sales_price', 'gross_margin', 'true_margin']].to_dict(orient="records")

@router.get("/capital-traps")
def get_capital_traps(db: Session = Depends(get_db)):
    query_ccc = """
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
        s.Brand as brand,
        (s.avg_sales_epoch - p.avg_rec_epoch) / 86400.0 AS avg_days_to_sell,
        p.avg_capital_outlay as capital_tied_up
    FROM sales_dates s
    JOIN purchase_dates p ON s.Brand = p.Brand
    """
    
    df_ccc = pd.read_sql(query_ccc, db.bind)
    
    df_ccc = df_ccc[(df_ccc['avg_days_to_sell'] > 0) & (df_ccc['avg_days_to_sell'] < 365)].copy()
    
    query_desc = "SELECT Brand as brand, MAX(Description) as description FROM Sales GROUP BY Brand"
    df_desc = pd.read_sql(query_desc, db.bind)
    
    df_ccc = df_ccc.merge(df_desc, on='brand', how='left')
    
    median_days = df_ccc['avg_days_to_sell'].median()
    median_capital = df_ccc['capital_tied_up'].median()
    
    traps = df_ccc[(df_ccc['avg_days_to_sell'] > median_days) & (df_ccc['capital_tied_up'] > median_capital)]
    traps = traps.sort_values(by=['capital_tied_up', 'avg_days_to_sell'], ascending=[False, False]).head(30)
    
    traps = traps.fillna(0)
    return traps[['brand', 'description', 'avg_days_to_sell', 'capital_tied_up']].to_dict(orient="records")

@router.get("/inventory-optimization")
def get_inventory_optimization(db: Session = Depends(get_db)):
    extraction_query = """
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
    
    opt_df = pd.read_sql(extraction_query, db.bind)
    
    # Business Variables
    S = 45.0  # Cost per order
    h = 0.20  # Holding cost rate (20%)
    safety_stock_days = 14
    
    # Calculate Annual Holding Cost (H) and EOQ
    opt_df['holding_cost_unit'] = opt_df['purchase_price'] * h
    opt_df['eoq'] = np.sqrt((2 * opt_df['annual_demand'] * S) / opt_df['holding_cost_unit'])
    opt_df['eoq'] = np.ceil(opt_df['eoq']).astype(int)
    
    # Calculate ROP
    opt_df['safety_stock_units'] = opt_df['avg_daily_sales'] * safety_stock_days
    opt_df['lead_time_demand'] = opt_df['avg_daily_sales'] * opt_df['avg_lead_time_days']
    opt_df['rop'] = opt_df['lead_time_demand'] + opt_df['safety_stock_units']
    opt_df['rop'] = np.ceil(opt_df['rop']).astype(int)
    
    opt_df['action_required'] = np.where(opt_df['current_on_hand'] < opt_df['rop'], 'Reorder Now', 'Stock Adequate')
    at_risk_df = opt_df[opt_df['action_required'] == 'Reorder Now'].sort_values(by='annual_demand', ascending=False).head(10)
    
    at_risk_df = at_risk_df.fillna(0)
    return at_risk_df[['brand', 'description', 'current_on_hand', 'rop', 'eoq', 'action_required']].to_dict(orient="records")

@router.get("/demand-forecast")
def get_demand_forecast(db: Session = Depends(get_db)):
    top_brand_query = """
        SELECT 
            brand,
            MAX(description) as description,
            SUM(salesquantity) as total_volume_sold
        FROM sales
        GROUP BY brand
        ORDER BY total_volume_sold DESC
        LIMIT 1;
    """
    top_brand_df = pd.read_sql(top_brand_query, db.bind)
    if top_brand_df.empty:
        return {"error": "No sales data found"}
        
    target_brand_id = top_brand_df['brand'].iloc[0]
    target_brand_name = top_brand_df['description'].iloc[0]
    
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
    
    # We return the historical and forecasted data
    forecast['ds'] = forecast['ds'].dt.strftime('%Y-%m-%d')
    res = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(60).to_dict(orient="records")
    return {"brand_name": target_brand_name, "forecast": res}

@router.get("/safety-stock-simulation")
def get_safety_stock_simulation(db: Session = Depends(get_db)):
    import scipy.stats as stats
    
    extraction_query = """
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
    
    opt_df = pd.read_sql(extraction_query, db.bind)
    
    # Core Math: Safety Stock under Dual Uncertainty
    service_level = 0.95
    z_score = stats.norm.ppf(service_level)
    
    opt_df['variance_demand_term'] = opt_df['avg_lead_time'] * (opt_df['std_dev_demand'] ** 2)
    opt_df['variance_lead_time_term'] = (opt_df['avg_daily_demand'] ** 2) * (opt_df['std_dev_lead_time'] ** 2)
    
    opt_df['safety_stock'] = z_score * np.sqrt(opt_df['variance_demand_term'] + opt_df['variance_lead_time_term'])
    opt_df['safety_stock'] = np.ceil(opt_df['safety_stock'].fillna(0)).astype(int)
    
    opt_df['lead_time_demand'] = opt_df['avg_daily_demand'] * opt_df['avg_lead_time']
    opt_df['dynamic_rop'] = np.ceil(opt_df['lead_time_demand'] + opt_df['safety_stock']).astype(int)

    # What-If Simulator: 50% shock
    lead_time_variance_multiplier = 1.5
    holding_cost_per_unit = 2.50
    
    shocked_std_dev_lead_time = opt_df['std_dev_lead_time'] * lead_time_variance_multiplier
    variance_lead_time_term_shock = (opt_df['avg_daily_demand'] ** 2) * (shocked_std_dev_lead_time ** 2)
    
    opt_df['shock_safety_stock'] = z_score * np.sqrt(opt_df['variance_demand_term'] + variance_lead_time_term_shock)
    opt_df['shock_safety_stock'] = np.ceil(opt_df['shock_safety_stock'].fillna(0)).astype(int)
    
    opt_df['additional_units_needed'] = opt_df['shock_safety_stock'] - opt_df['safety_stock']
    opt_df['additional_units_needed'] = opt_df['additional_units_needed'].clip(lower=0)
    opt_df['additional_capital_tied_up'] = opt_df['additional_units_needed'] * holding_cost_per_unit

    # Sort to show the worst impact items
    results_df = opt_df.sort_values(by='additional_capital_tied_up', ascending=False).head(10)
    
    # Fill NaN for JSON
    results_df = results_df.fillna(0)
    
    return results_df[['brand', 'description', 'total_volume', 'safety_stock', 'shock_safety_stock', 'additional_capital_tied_up']].to_dict(orient="records")
