# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from fastapi.responses import StreamingResponse
from typing import Optional

# pyrefly: ignore [missing-import]
from langchain_core.messages import HumanMessage
from app.ai.graph import agent_graph
from app.database.database import SessionLocal
from app.services.crud import create_chat_message

router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


async def stream_langgraph(request_msg: str, context_section: str):
    db = SessionLocal()
    full_ai_response = ""
    try:
        # Save user message
        create_chat_message(db, role="user", content=request_msg)

        # Prepend context to the user message
        final_prompt = f"{context_section}\nUser:\n{request_msg}" if context_section else request_msg
        
        initial_state = {"messages": [HumanMessage(content=final_prompt)]}

        # Stream LangGraph output
        async for msg, metadata in agent_graph.astream(initial_state, stream_mode="messages"):
            if metadata.get("langgraph_node") == "chatbot" and getattr(msg, "content", None):
                chunk_text = msg.content
                if isinstance(chunk_text, str):
                    full_ai_response += chunk_text
                    yield chunk_text
        
        # Save AI response and Interaction
        if full_ai_response:
            create_chat_message(db, role="ai", content=full_ai_response)
            
            # If the LLM outputted a log intent, save the interaction to DB!
            try:
                import json
                from datetime import datetime
                from app.schemas.interaction import InteractionCreate
                from app.services.crud import create_interaction
                
                cleaned = full_ai_response.replace("```json", "").replace("```", "").strip()
                data = json.loads(cleaned)
                if data.get("intent") == "log":
                    # provide defaults if missing
                    if not data.get("interaction_date"):
                        data["interaction_date"] = datetime.now().strftime("%Y-%m-%d")
                    if not data.get("interaction_time"):
                        data["interaction_time"] = datetime.now().strftime("%H:%M")
                        
                    # Filter out non-schema fields like 'intent'
                    valid_keys = InteractionCreate.model_fields.keys()
                    filtered_data = {k: v for k, v in data.items() if k in valid_keys}
                    
                    interaction_data = InteractionCreate(**filtered_data)
                    create_interaction(db, interaction_data)
            except Exception as e:
                print(f"Error saving interaction: {e}")
    finally:
        db.close()


@router.post("/chat")
async def chat(request: ChatRequest):
    # Build context section if form data is available
    context_section = ""
    if request.context:
        filled = {k: v for k, v in request.context.items() if v and v != 'Meeting'}
        if filled:
            context_lines = "\n".join(f"  {k}: {v}" for k, v in filled.items())
            context_section = f"Current session interaction data:\n{context_lines}\n"

    return StreamingResponse(stream_langgraph(request.message, context_section), media_type="text/plain")