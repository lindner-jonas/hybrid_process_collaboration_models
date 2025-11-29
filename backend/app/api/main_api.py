from fastapi import APIRouter

from app.model.main_model import GenerateDfaRequest
from app.service.main_service import generate_dfa


router = APIRouter()

@router.get("/lol")
def init():
    return {"message" : "FastAPI server up and running"}

@router.post("/generateDfa")
def generate_dfa_endpoint(request: GenerateDfaRequest):
    return generate_dfa(request.models, request.constrains)

@router.post("/stop")
def stop():
    return "Generation stopped", 200

