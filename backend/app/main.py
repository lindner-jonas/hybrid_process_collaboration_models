from fastapi import FastAPI
from app.api import main_api
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(main_api.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["localhost:8080","*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)