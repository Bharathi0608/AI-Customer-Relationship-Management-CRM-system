from app.api.ai import router as ai_router
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine

# Import all models
from app.models.interaction import Interaction, ChatMessage

# Import routers
from app.api.interaction import router as interaction_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI CRM for Healthcare Professionals",
    version="1.0.0",
    description="AI Powered CRM using FastAPI + LangGraph + Groq"
)

# Enable CORS (for React frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interaction_router)
app.include_router(ai_router)

@app.get("/")
def home():
    return {
        "status": "running",
        "message": "AI CRM Backend Running Successfully"
    }