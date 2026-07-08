# pyrefly: ignore [missing-import]
from langgraph.graph import MessagesState
from typing import Annotated, TypedDict

class AgentState(MessagesState):
    """
    State for the LangGraph agent. 
    Inherits 'messages' (list of AnyMessage) from MessagesState.
    """
    pass