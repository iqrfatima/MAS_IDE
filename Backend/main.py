# from dotenv import load_dotenv

# load_dotenv()

# from fastapi import FastAPI


# from fastapi.middleware.cors import (
#     CORSMiddleware
# )

# from api.routes.agents import (
#     router as agents_router
# )

# from api.routes.knowledge_graph import (
#     router as knowledge_graph_router,
# )

# from api.routes.projects import (
    
#     router as projects_router,
# )

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,

#     allow_origins=["*"],

#     allow_credentials=True,

#     allow_methods=["*"],

#     allow_headers=["*"],
# )

# app.include_router(projects_router)

# app.include_router(knowledge_graph_router)

# app.include_router(agents_router)


# @app.get("/health")
# def health():

#     return {
#         "status": "healthy"
#     }

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.projects import (
    router as projects_router
)

from api.routes.agents import (
    router as agents_router
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(agents_router)

@app.get("/health")
def health():
    return {"status": "healthy"}