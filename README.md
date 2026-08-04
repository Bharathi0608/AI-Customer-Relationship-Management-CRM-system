# 🤖 AI CRM for Healthcare Professionals (HCP)

An intelligent Customer Relationship Management (CRM) system designed for pharmaceutical sales representatives to log, manage, and analyse their interactions with Healthcare Professionals using a **LangGraph AI Agent**, **Groq LLM**, **FastAPI**, **React**, and **PostgreSQL**.
<img width="1294" height="607" alt="image" src="https://github.com/user-attachments/assets/55e8c3cf-a393-4f7a-8166-45a17aa3767d" />
<img width="1330" height="580" alt="image" src="https://github.com/user-attachments/assets/da78cdb6-36ef-44eb-a058-574fe1ebe989" />
<img width="1346" height="614" alt="image" src="https://github.com/user-attachments/assets/da40ae1e-44e0-46f1-ab84-a11c1ca74374" />

---

## 📸 Overview

The application features a **split-screen interface**:
- **Left Panel** — A structured form to log HCP interaction details (name, date, time, sentiment, materials, samples, follow-up actions).
- **Right Panel** — An AI Assistant chatbot. Describe your interaction in plain English and the AI automatically fills in the form fields for you in real-time using **streaming responses**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS |
| **Backend** | FastAPI (Python) |
| **AI Agent** | LangGraph + LangChain |
| **LLM** | Groq API (`llama-3.1-8b-instant`) |
| **Database** | PostgreSQL + SQLAlchemy ORM |
| **Dev Tools** | pgAdmin 4, Uvicorn |

---

## 🧠 LangGraph AI Agent

The backend includes a fully structured **LangGraph Agent** with **5 specific tools** for sales-related activities:

| # | Tool | Description |
|---|---|---|
| 1 | `log_interaction_tool` | Extracts structured HCP interaction data from natural language using the LLM |
| 2 | `edit_interaction_tool` | Modifies a specific field in an already-logged interaction |
| 3 | `search_history_tool` | Searches past interactions with a specific HCP from the PostgreSQL database |
| 4 | `followup_recommender_tool` | Recommends the next best action based on sentiment and outcomes |
| 5 | `schedule_meeting_tool` | Schedules a follow-up meeting or CRM task for a future date |

---

## 📁 Project Structure

```
AI-CRM-HCP/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── graph.py        # LangGraph StateGraph (agent + tools routing)
│   │   │   ├── llm.py          # Groq LLM setup (llama-3.1-8b-instant)
│   │   │   ├── prompts.py      # System prompt for structured JSON extraction
│   │   │   ├── state.py        # LangGraph MessagesState
│   │   │   └── tools.py        # 5 LangChain @tool definitions
│   │   ├── api/
│   │   │   ├── ai.py           # POST /ai/chat streaming AI endpoint
│   │   │   └── interaction.py  # CRUD REST endpoints for interactions
│   │   ├── database/
│   │   │   └── database.py     # SQLAlchemy engine + session setup
│   │   ├── models/
│   │   │   └── interaction.py  # SQLAlchemy ORM model (interactions table)
│   │   ├── schemas/
│   │   │   └── interaction.py  # Pydantic schemas for request validation
│   │   ├── services/
│   │   │   └── crud.py         # Database CRUD operations
│   │   ├── config.py           # Loads .env variables
│   │   └── main.py             # FastAPI app entry point with CORS
│   ├── .env                    # Environment variables (not committed)
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   └── Dashboard.jsx   # Main page: form + AI chatbot
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── Sidebar.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    └── package.json
```

---

## ⚙️ Setup and Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ (with pgAdmin recommended)
- A free Groq API Key from https://console.groq.com/

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/AI-CRM-HCP.git
cd AI-CRM-HCP
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hcp_crm
GROQ_API_KEY=your_groq_api_key_here
```

Open pgAdmin and create a new database named `hcp_crm`.
The `interactions` table will be created automatically when you start the server.

Start the backend server:

```bash
uvicorn app.main:app --reload
```

Backend runs at: http://localhost:8000
API docs at: http://localhost:8000/docs

---

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

---

## 🚀 How to Use

1. Open http://localhost:5173 in your browser.
2. In the AI Assistant panel on the right, type a natural language description:
   "Met Dr. Don tomorrow. Discussed Product X efficacy, shared brochures, provided 5 samples, doctor showed Negative interest. Scheduled a follow-up for next Tuesday."
3. Press Enter or click Log.
4. Watch the AI stream its response and automatically fill the form fields on the left!

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | / | Health check |
| POST | /ai/chat | Streaming AI chat for interaction extraction |
| POST | /interactions | Save an interaction to the database |
| GET | /interactions | Retrieve all interactions |
| GET | /interactions/{id} | Get a specific interaction |
| PUT | /interactions/{id} | Update an interaction |
| DELETE | /interactions/{id} | Delete an interaction |

---

## 🌐 Environment Variables

| Variable | Description |
|---|---|
| DATABASE_URL | PostgreSQL connection string |
| GROQ_API_KEY | Your Groq API key from console.groq.com |

---

## 📝 License

This project is for educational/assessment purposes.

# AI-Customer-Relationship-Management-CRM-system
