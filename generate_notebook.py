import nbformat as nbf

nb = nbf.v4.new_notebook()

nb.cells = [
    nbf.v4.new_markdown_cell("""# VinoLytics Phase 7: Financial Risk & Working Capital Analysis
    
In this phase, we act as a Financial Risk Assessor to identify "Margin Bleeders" and "Working Capital Traps."
Many analytics projects stop at basic sales or inventory counts, but the CFO cares about cash flow, true margins (after hidden costs like freight and taxes), and capital efficiency.
"""),
    
    nbf.v4.new_code_cell("""import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sqlalchemy import create_engine
import warnings

warnings.filterwarnings('ignore')
plt.style.use('ggplot')
sns.set_palette("muted")

# Setup PostgreSQL Connection
# TODO: Move credentials to secure env variables before deploying to production
engine = create_engine('postgresql+psycopg2://postgres:postgrespassword@localhost:5432/inventory_db')
"""),

    nbf.v4.new_markdown_cell("""## 1. True Margin & Leakage Analysis

Gross Margin is commonly calculated as `SalesPrice - PurchasePrice`. However, this metric is a lie.

It ignores hidden leakages such as:
1. **Excise Taxes:** A direct hit to profitability per unit sold.
2. **Freight Costs:** Often billed at the Purchase Order (PO) level rather than per unit.

We will write an advanced query to join `Sales`, `Purchases`, and `InvoicePurchases`. 
**Realistic Hack:** Since freight is at the PO level, we'll approximate `Freight_Per_Unit` by dividing Total Freight by Total Quantity for that PO, then averaging that per Brand.
"""),

    nbf.v4.new_code_cell("""# SQL Query to calculate margins and fetch hidden costs
query_margin = \"\"\"
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
    s.Brand,
    s.Description,
    s.avg_sales_price,
    s.avg_excise_tax,
    p.avg_purchase_price,
    COALESCE(p.avg_freight_per_unit, 0) as avg_freight_per_unit
FROM brand_sales s
JOIN brand_purchases p ON s.Brand = p.Brand
\"\"\"

df_margin = pd.read_sql(query_margin, engine)

# Calculate Margins
df_margin['gross_margin'] = df_margin['avg_sales_price'] - df_margin['avg_purchase_price']
df_margin['true_margin'] = df_margin['gross_margin'] - df_margin['avg_excise_tax'] - df_margin['avg_freight_per_unit']

# Filter out dirty data or promotional freebies
# FIXME: Some units might be sold at $0 for promos; filtering them out for now to avoid skewed margins
df_margin = df_margin[df_margin['avg_sales_price'] > 1.0]

# Find the biggest 'Margin Bleeders' (Top 10 lowest True Margins)
bleeders = df_margin.sort_values('true_margin').head(10)
display(bleeders[['brand', 'description', 'avg_sales_price', 'gross_margin', 'true_margin']])
"""),

    nbf.v4.new_code_cell("""plt.figure(figsize=(12, 6))
sns.barplot(data=bleeders, x='true_margin', y='description', palette='Reds_r')
plt.title('Top 10 Margin Bleeders (Lowest True Margin per Unit)')
plt.xlabel('True Margin ($)')
plt.ylabel('Brand')
plt.axvline(0, color='black', linestyle='--')
plt.tight_layout()
plt.show()
"""),

    nbf.v4.new_markdown_cell("""## 2. Cash Conversion Cycle (Working Capital Trap)

Why do profitable companies go bankrupt? **Poor cash flow.**

If a brand requires a huge upfront capital outlay (high PurchasePrice * Quantity) but sits in the warehouse for 60 days before it sells, that is a **Working Capital Trap**. The cash is tied up in glass bottles instead of earning interest or funding operations.

We will measure:
- **Capital Tied Up:** `PurchasePrice * Quantity`
- **Days to Sell:** `SalesDate` - `ReceivingDate` (approximated via epoch averages to handle decoupled grain)
"""),

    nbf.v4.new_code_cell("""# Query to calculate Cash Conversion Cycle proxies
# Note: Since Sales and Purchases aren't 1:1 linked by an invoice ID, we use statistical averages for the brand
query_ccc = \"\"\"
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
    s.Brand,
    (s.avg_sales_epoch - p.avg_rec_epoch) / 86400.0 AS avg_days_to_sell,
    p.avg_capital_outlay as capital_tied_up
FROM sales_dates s
JOIN purchase_dates p ON s.Brand = p.Brand
\"\"\"

df_ccc = pd.read_sql(query_ccc, engine)

# Clean up outliers (e.g., negative days to sell due to data ingest errors or selling before receiving)
# TODO: We need a data engineering pipeline to fix these negative date discrepancies at the source
df_ccc = df_ccc[(df_ccc['avg_days_to_sell'] > 0) & (df_ccc['avg_days_to_sell'] < 365)]

# Merge with names for readability
df_ccc = df_ccc.merge(df_margin[['brand', 'description']], on='brand', how='left')

display(df_ccc.sort_values('avg_days_to_sell', ascending=False).head())
"""),

    nbf.v4.new_code_cell("""# Scatter plot to identify Working Capital Traps (Top-Right Quadrant)
plt.figure(figsize=(10, 6))
sns.scatterplot(data=df_ccc, x='avg_days_to_sell', y='capital_tied_up', alpha=0.6, color='purple')

# Add quadrant lines (Medians)
median_days = df_ccc['avg_days_to_sell'].median()
median_capital = df_ccc['capital_tied_up'].median()

plt.axvline(median_days, color='gray', linestyle='--')
plt.axhline(median_capital, color='gray', linestyle='--')

plt.title('Working Capital Traps: Days to Sell vs. Capital Tied Up')
plt.xlabel('Average Days to Sell')
plt.ylabel('Average Capital Tied Up per PO ($)')

# Annotate the extreme traps
traps = df_ccc[(df_ccc['avg_days_to_sell'] > median_days * 1.5) & (df_ccc['capital_tied_up'] > median_capital * 2)]
for idx, row in traps.head(5).iterrows():
    plt.text(row['avg_days_to_sell'] + 2, row['capital_tied_up'], str(row['description'])[:15] + '...', fontsize=8)

plt.tight_layout()
plt.show()
""")
]

with open('notebooks/05_financial_risk_analysis.ipynb', 'w', encoding='utf-8') as f:
    nbf.write(nb, f)
