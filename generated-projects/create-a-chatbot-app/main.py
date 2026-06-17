import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError
from jose import JWTError

from app.core.config import get_settings
from app.core.logger import logger
from app.database.connection import create_db_and_tables
from app.api.v1.api import api_router

settings = get_settings()

def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        debug=settings.DEBUG,
        docs_url="/docs" if settings.DEBUG else None,
        redoc_url="/redoc" if settings.DEBUG else None,
    )

    # Add CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Adjust in production to specific origins
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API router
    application.include_router(api_router, prefix=settings.API_V1_STR)

    # Global Exception Handlers
    @application.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.error(f"Database error: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "A database error occurred."}
        )

    @application.exception_handler(JWTError)
    async def jwt_exception_handler(request: Request, exc: JWTError) -> JSONResponse:
        logger.warning(f"JWT authentication error: {exc}")
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Could not validate credentials."}
        )

    @application.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(f"Unhandled exception: {exc}") # Log with traceback
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An unexpected error occurred."}
        )

    @application.on_event("startup")
    async def startup_event() -> None:
        logger.info("Application startup: Initializing database...")
        create_db_and_tables()
        logger.info("Application startup complete.")

    @application.on_event("shutdown")
    async def shutdown_event() -> None:
        logger.info("Application shutdown: Cleaning up resources...")
        # Add any necessary cleanup here, e.g., closing connection pools
        logger.info("Application shutdown complete.")

    return application


app = create_application()


if __name__ == "__main__":
    # For local development, load .env file manually if not handled by pydantic-settings in some environments
    # Although pydantic-settings should handle it based on SettingsConfigDict(env_file=".env")
    import dotenv
    dotenv.load_dotenv()
    logger.info(f"Starting Uvicorn server for {settings.PROJECT_NAME} v{settings.PROJECT_VERSION}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG, # Enable reload only in debug mode
        log_level="debug" if settings.DEBUG else "info"
    )
