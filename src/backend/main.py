from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import analytics

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

# Hook up the analytics router
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
