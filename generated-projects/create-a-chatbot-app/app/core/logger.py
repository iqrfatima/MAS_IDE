from loguru import logger
import sys

# Configure Loguru logger
logger.remove()
logger.add(
    sys.stdout,
    level="INFO",
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    enqueue=True, # Use enqueue to make logging asynchronous
)
logger.add(
    "file_{time}.log",
    level="DEBUG",
    rotation="10 MB", # Rotate file if size exceeds 10 MB
    compression="zip", # Compress old log files
    enqueue=True,
    format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
)
