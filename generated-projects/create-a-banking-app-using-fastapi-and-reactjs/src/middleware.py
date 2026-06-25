import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        client_host = request.client.host
        method = request.method
        url = request.url.path
        status_code = response.status_code
        logging.info(f"{client_host} - {method} {url} - {status_code} - {process_time:.2f}ms")
        return response
