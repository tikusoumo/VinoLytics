# 🍷 VinoLytics: Intelligent Inventory & Supply Chain Platform

VinoLytics is a full-stack, AI-powered analytics and optimization engine built for high-volume retail wine and spirits operations. It processes millions of transactional records to extract actionable business insights, optimize supply chain logistics, and forecast future demand.

Starting as an exploratory data analysis pipeline, VinoLytics has evolved into a comprehensive internal dashboard providing predictive and prescriptive analytics.

## 🎯 Business Objectives

Traditional spreadsheet-based analysis fails at the scale of millions of rows. VinoLytics leverages SQL databases, Python-based data science libraries, and modern web frameworks to solve core retail challenges:

- **Inventory Optimization**: Determine ideal stock levels using Economic Order Quantity (EOQ) and Reorder Point (ROP) models to minimize holding costs and prevent stockouts.
- **Capital Allocation & Risk**: Implement ABC Analysis to identify high-revenue products, flag "Margin Bleeders", and expose "Capital Traps".
- **Supply Chain Efficiency**: Evaluate vendor performance through historical Lead Time Analysis.
- **Demand Forecasting**: Utilize time-series modeling (Prophet) to predict future product demand based on seasonal sales data.

## 🛠️ Tech Stack

- **Database & Storage**: PostgreSQL (Dockerized, optimized for large-scale relational joins and aggregations)
- **Data Engineering & Analytics**: Python, Pandas, SQLAlchemy, NumPy, Seaborn
- **Predictive Modeling**: Prophet (Time-series Forecasting)
- **Backend API**: FastAPI, Uvicorn (REST endpoints for frontend consumption)
- **Frontend Dashboard**: React, Next.js, TailwindCSS, Recharts, Lucide Icons

## 📊 Dataset

The original dataset used for this project can be found on Kaggle: [Slooze Challenge Data](https://www.kaggle.com/datasets/sloozecareers/slooze-challenge/data)

## 📂 Project Architecture

```text
vinolytics/
├── data/                       # Raw CSVs and processed datasets
├── database/                   # PostgreSQL schema and Python data seeding scripts
├── notebooks/                  # Jupyter notebooks for EDA, ABC Analysis, EOQ, and Forecasting
├── src/                        
│   ├── ml_engine/              # Predictive modeling scripts
│   ├── backend/                # FastAPI REST backend serving analytics
│   └── frontend/               # Next.js React UI dashboard
└── README.md
```

## 🚀 Analytics Methodology & Features

### 1. Data Architecture & ETL
- Designed a normalized relational database schema in PostgreSQL.
- Engineered a Python-based data ingestion pipeline (`seed_data.py`) to clean and load 6 distinct datasets (Purchases, Sales, Inventory, Invoices) containing millions of rows.

### 2. Core Business Analytics
- **ABC Inventory Analysis**: Segmented inventory into A (Top 80% Revenue), B (Next 15%), and C (Bottom 5%) classes.
- **Lead Time Analysis**: Computed historical delivery times by calculating the delta between Purchase Order dates and Receiving dates to score vendor reliability.

### 3. Financial Risk Analysis
- **Margin Bleeders**: Identified high-volume products selling below viable profit margins.
- **Capital Traps**: Flagged slow-moving inventory tying up excessive working capital based on "Days to Sell" metrics.

### 4. Mathematical Optimization
- **Economic Order Quantity (EOQ)**: Calculated optimal order sizes to balance ordering costs against holding costs for top items.
- **Reorder Point Analysis (ROP)**: Established dynamic safety stock levels based on average daily sales and supplier lead times, automating "Reorder Now" alerts.

### 5. AI & Predictive Modeling
- **Demand Forecasting**: Trained Prophet time-series models on historical transactional data to forecast 30-day demand for top-selling inventory items, complete with upper and lower confidence intervals.

### 6. Full-Stack Dashboard
- Built a modern, responsive React (Next.js) web application that visualizes all backend data points concurrently.
- Interactive charts (Recharts) and data tables provide an at-a-glance view of the entire supply chain's health.

---

## 💻 Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/VinoLytics.git
   cd VinoLytics
   ```

2. **Set up the Database (Docker):**
   - Ensure Docker is installed and running.
   - Start the PostgreSQL container:
     ```bash
     docker-compose up -d db
     ```
   - Place the 6 raw CSV files into `data/raw/` and seed the database:
     ```bash
     source venv/bin/activate  # On Windows: venv\Scripts\activate
     python database/seed_data.py
     ```

3. **Backend API Setup:**
   - Install backend dependencies: `pip install -r requirements.txt` (or ensure `pandas`, `fastapi`, `prophet`, etc. are in your environment).
   - Start the FastAPI server:
     ```bash
     cd src/backend
     uvicorn main:app --reload
     ```

4. **Frontend UI Setup:**
   - Open a new terminal and install Node.js dependencies:
     ```bash
     cd src/frontend
     npm install
     ```
   - Start the Next.js development server:
     ```bash
     npm run dev
     ```

5. **View the Dashboard:**
   - Open your browser and navigate to `http://localhost:3000` to interact with the VinoLytics platform.

---
*Developed by Soumojit Datta*
