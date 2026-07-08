import json
# pyrefly: ignore [missing-import]
from langchain_core.tools import tool
from typing import Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
from datetime import datetime

from app.database.database import SessionLocal
from app.schemas.interaction import InteractionCreate
from app.services.crud import create_interaction
from app.models.interaction import Interaction



class EditInteractionInput(BaseModel):
    field_to_update: str = Field(description="The name of the field to update (e.g., 'sentiment', 'hcp_name', 'materials_shared')")
    new_value: str = Field(description="The new value for the field")

@tool("edit_interaction_tool", args_schema=EditInteractionInput)
def edit_interaction_tool(field_to_update: str, new_value: str) -> str:
    """Modifies logged data by updating a specific field in the current interaction record."""
    return json.dumps({
        "status": "success",
        "updated_field": field_to_update,
        "new_value": new_value,
        "message": f"Successfully updated {field_to_update} to {new_value}"
    })

class SearchHistoryInput(BaseModel):
    hcp_name: str = Field(description="Name of the HCP to search for")

@tool("search_history_tool", args_schema=SearchHistoryInput)
def search_history_tool(hcp_name: str) -> str:
    """Searches the PostgreSQL database for past interactions with a specific HCP."""
    db = SessionLocal()
    try:
        interactions = (
            db.query(Interaction)
            .filter(Interaction.hcp_name.ilike(f"%{hcp_name}%"))
            .order_by(Interaction.interaction_date.desc())
            .limit(5)
            .all()
        )
        
        if not interactions:
            return f"No past interactions found for {hcp_name}."
            
        history = []
        for i in interactions:
            history.append({
                "date": str(i.interaction_date),
                "topics": i.topics_discussed,
                "sentiment": i.sentiment,
                "outcomes": i.outcomes
            })
            
        return json.dumps({
            "hcp_name": hcp_name,
            "past_interactions": history
        })
    finally:
        db.close()

class FollowUpInput(BaseModel):
    sentiment: str = Field(description="The sentiment of the interaction")
    outcomes: Optional[str] = Field(description="The outcomes of the interaction")

@tool("followup_recommender_tool", args_schema=FollowUpInput)
def followup_recommender_tool(sentiment: str, outcomes: Optional[str] = None) -> str:
    """Analyzes interaction sentiment and outcomes to recommend the next best follow-up action."""
    if sentiment.lower() == "positive":
        return "Recommendation: Schedule a follow-up meeting in 2 weeks to drop off more samples."
    elif sentiment.lower() == "negative":
        return "Recommendation: Send an educational email addressing concerns and wait for 1 month."
    else:
        return "Recommendation: Check in via phone call next month."

class ScheduleInput(BaseModel):
    hcp_name: str = Field(description="Name of the HCP")
    date: str = Field(description="Date for the meeting (YYYY-MM-DD)")
    purpose: str = Field(description="Purpose of the meeting")

@tool("schedule_meeting_tool", args_schema=ScheduleInput)
def schedule_meeting_tool(hcp_name: str, date: str, purpose: str) -> str:
    """Schedules a calendar meeting or CRM task for a follow-up visit."""
    return json.dumps({
        "status": "scheduled",
        "hcp_name": hcp_name,
        "date": date,
        "purpose": purpose,
        "message": f"Successfully scheduled a meeting with {hcp_name} on {date} for {purpose}."
    })