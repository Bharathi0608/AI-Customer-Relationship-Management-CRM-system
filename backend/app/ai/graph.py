# pyrefly: ignore [missing-import]
from langchain_core.messages import SystemMessage
# pyrefly: ignore [missing-import]
from langgraph.graph import StateGraph, START
# pyrefly: ignore [missing-import]
from langgraph.prebuilt import ToolNode, tools_condition

from app.ai.llm import llm
from app.ai.prompts import SYSTEM_PROMPT
from app.ai.state import AgentState
from app.ai.tools import (
    edit_interaction_tool,
    search_history_tool,
    followup_recommender_tool,
    schedule_meeting_tool
)

# Define the tools
tools = [
    edit_interaction_tool,
    search_history_tool,
    followup_recommender_tool,
    schedule_meeting_tool
]

# Bind tools to the LLM
llm_with_tools = llm.bind_tools(tools)

# Define the chatbot node function
async def chatbot(state: AgentState):
    messages = state["messages"]
    
    # Prepend the system prompt if not present
    if not messages or not isinstance(messages[0], SystemMessage):
        messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
        
    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}

# Build the StateGraph
graph_builder = StateGraph(AgentState)

# Add nodes
graph_builder.add_node("chatbot", chatbot)
tool_node = ToolNode(tools)
graph_builder.add_node("tools", tool_node)

# Add edges
graph_builder.add_edge(START, "chatbot")
# tools_condition checks if the last message has tool_calls. If so, routes to "tools", else END.
graph_builder.add_conditional_edges("chatbot", tools_condition)
graph_builder.add_edge("tools", "chatbot")

# Compile the graph
agent_graph = graph_builder.compile()