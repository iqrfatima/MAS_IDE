from fastapi import FastAPI
from .routers import auth, habits, tracks
from .database import Base, engine
from .exceptions import http_exception_handler, generic_exception_handler
from .logger import logger

app = FastAPI(title="Habit Tracker API")

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth.router)
app.include_router(habits.router)
app.include_router(tracks.router)

# Exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}

# Log startup
@app.on_event("startup")
def startup_event():
    logger.info("Habit Tracker API started")
