from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import inventory, sales, financials, forecasting, credit

app = FastAPI(title="VinoLytics API", description="Backend for the VinoLytics dashboard")

# Set up CORS so our future React frontend doesn't complain
# TODO: Tighten this up before we deploy anywhere public
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    # Just a simple ping to see if the lights are on
    return {"status": "ok", "message": "VinoLytics API is running"}

# Hook up the analytics routers
app.include_router(inventory.router, prefix="/api", tags=["Inventory"])
app.include_router(sales.router, prefix="/api", tags=["Sales"])
app.include_router(financials.router, prefix="/api", tags=["Financials"])
app.include_router(forecasting.router, prefix="/api", tags=["Forecasting"])
app.include_router(credit.router, prefix="/api", tags=["Credit Risk"])
