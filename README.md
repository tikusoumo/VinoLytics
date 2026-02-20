# 🍷 VinoLytics: Intelligent Inventory & Sales Intelligence Platform

VinoLytics is a data-driven analytics and optimization engine built for high-volume retail wine and spirits operations. It processes millions of transactional records to extract actionable business insights, optimize supply chain logistics, and forecast future demand.

Designed initially as a robust Data Analytics pipeline, the project is structured to evolve into a full-stack, AI-powered internal tool.

## 🎯 Business Objectives

Traditional spreadsheet-based analysis fails at the scale of millions of rows. VinoLytics leverages SQL databases and Python-based data science libraries to solve core retail challenges:

- **Inventory Optimization**: Determine ideal stock levels using mathematical models (EOQ) to minimize holding costs and prevent stockouts.
- **Capital Allocation**: Implement ABC Analysis to identify and prioritize high-revenue-generating product categories.
- **Supply Chain Efficiency**: Evaluate vendor performance through historical Lead Time Analysis.
- **Demand Forecasting**: Utilize time-series modeling to predict future product demand based on seasonal sales data.

## 🛠️ Tech Stack

- **Database & Storage**: PostgreSQL (Optimized for large-scale relational joins and aggregations).
- **Data Processing & Analytics**: Python, Pandas, SQLAlchemy, NumPy.
- **Data Visualization**: Matplotlib, Seaborn.
- **Future Implementation (AI & Web)**: FastAPI (Backend), React (Frontend), Prophet/Scikit-Learn (Predictive Modeling), Docker.

## 📂 Project Architecture

```text
vinolytics/
├── data/                       # Raw CSVs and processed datasets
├── database/                   # PostgreSQL schema and Python data seeding scripts
├── notebooks/                  # Jupyter notebooks for EDA, ABC Analysis, and Modeling
├── src/                        
│   ├── ml_engine/              # Predictive modeling and forecasting scripts
│   ├── backend/                # (Upcoming) FastAPI REST backend
│   └── frontend/               # (Upcoming) React UI dashboard
└── README.md
```

## 📊 Analytics Methodology

### Phase 1: Data Architecture & ETL
- Designed a normalized relational database schema in PostgreSQL.
- Engineered a Python-based data ingestion pipeline (`sqlalchemy`, `pandas`) to clean and load 6 distinct datasets (Purchases, Sales, Inventory, Invoices) containing millions of rows.

### Phase 2: Core Business Analytics
- **ABC Inventory Analysis**: Segmented inventory into A (Top 80% Revenue), B (Next 15%), and C (Bottom 5%) classes using SQL aggregations and Pandas cumulative distribution functions.
- **Lead Time Analysis**: Computed historical delivery times by calculating the delta between Purchase Order dates and Receiving dates to score vendor reliability.

### Phase 3: Mathematical Optimization (In Progress)
- **Economic Order Quantity (EOQ)**: Calculating optimal order sizes to balance ordering costs against holding costs.
- **Reorder Point Analysis**: Establishing dynamic safety stock levels based on average daily sales and vendor lead times.

### Phase 4: AI & Predictive Modeling (Planned)
- Training time-series models on historical transactional data to forecast 30/60/90-day demand for 'Class A' inventory items.

## 🚀 Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/VinoLytics.git
   cd VinoLytics
   ```

2. **Set up the Database:**
   - Ensure PostgreSQL is installed and running locally.
   - Execute the `database/schema.sql` file to generate the tables.

3. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Ingest the Data:**
   - Place the 6 raw CSV files into the `data/raw/` directory.
   - Run the seeding script:
     ```bash
     python database/seed_data.py
     ```

5. **Run the Analytics:**
   - Launch Jupyter and navigate to the `notebooks/` directory to run the analytical models.
     ```bash
     jupyter notebook
     ```

---
*Developed by Soumojit Datta*
