"""Main application entry point for the Blog API.

This module sets up the FastAPI application, includes routers, exception handlers,
and configures startup/shutdown events. It also initializes the database schema
on startup.
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder

import logging

from .database import SessionLocal, engine, Base
from .routers import posts as posts_router
from .exceptions import PostNotFoundError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("blog_api")

app = FastAPI(title="Blog API", version="1.0.0")

# Include routers
app.include_router(posts_router.router, prefix="/api", tags=["posts"])

# Exception handlers
@app.exception_handler(PostNotFoundError)
async def post_not_found_handler(request, exc: PostNotFoundError):
    logger.warning("Post not found: %s", exc.post_id)
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={"detail": f"Post with id {exc.post_id} not found."},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    logger.error("Validation error: %s", exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

# Dependency to get DB session
@app.middleware("http")
async def db_session_middleware(request, call_next):
    response = None
    try:
        request.state.db = SessionLocal()
        response = await call_next(request)
    finally:
        request.state.db.close()
    return response

# Startup and shutdown events
@app.on_event("startup")
async def on_startup():
    logger.info("Creating database tables if not exist.")
    Base.metadata.create_all(bind=engine)
    logger.info("Startup complete.")

@app.on_event("shutdown")
async def on_shutdown():
    logger.info("Shutting down application.")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
