# ClaimShield AI: Healthcare Fraud Detection & Audit Platform

ClaimShield AI is a state-of-the-art, full-stack healthcare fraud, waste, and abuse (FWA) detection platform. By integrating advanced **AI Risk Scoring**, **explainable anomaly flags**, and a **human-in-the-loop audit workspace**, ClaimShield empowers insurance payers and medical auditors to intercept, investigate, and block fraudulent health insurance claims in real-time.

---

## 🌟 Key Features

*   **🧠 Real-Time AI Fraud Engine**: Instantly analyzes incoming claim parameters, computes a weighted risk score (0-100), and flags anomalies (e.g. upcoding, outlier amounts).
*   **✍️ Explainable AI (XAI)**: Generates human-readable, plain-English justifications for flagged claims, giving auditors legally-defensible ammunition for denial.
*   **📊 Dynamic Executive Dashboard**: Provides bird's-eye visibility into daily/monthly fraud trends, fraud rates, pending claims, and average risk across the system. Includes time-based historical filters (Week vs. Month).
*   **⚖️ Human-in-the-Loop Workspace**: Allows auditors to click through individual claim details, review risk contributions, enter remarks, and permanently Approve, Reject, or Escalate claims with a secure audit trail.
*   **🔒 Secure JWT Authentication**: Implements rigid authorization using JSON Web Tokens (JWT) and `bcrypt` password hashing to secure auditor portals.

---

## 🏗️ System Architecture

ClaimShield is built using a clean, modern **4-Tier Architecture**:

```
Job-a-thon/
│
├── backend/                  # Flask REST API & AI Services
│   ├── database/             # Centralized DB setup & seeding utilities
│   ├── routes/               # API endpoint route blueprints (auth, claims, stats)
│   ├── services/             # Core AI Fraud Engine and scoring rules
│   ├── app.py                # Main entry point (Flask Server)
│   └── config.py             # Server & DB configurations
│
├── frontend/                 # React UI (Vite)
│   ├── src/
│   │   ├── api/              # Axios-configured API clients (JWT-enabled)
│   │   ├── pages/            # View pages (Login, Dashboard, Claims, Submit)
│   │   └── App.jsx           # Secure client-side routing
│   └── vite.config.js        # Vite bundler configuration
│
└── database_setup.sql        # Master Production MySQL Schema
```

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, Vite, Axios, Recharts (Dynamic Charts), Tailwind CSS, Vanilla CSS
*   **Backend**: Python, Flask, Flask-CORS, Flask-MySQLdb, Bcrypt, PyJWT
*   **Database**: MySQL (relational, transactions, foreign key constraints)

---

## 🚀 Quick Start & Installation

### Prerequisites
Make sure you have the following installed on your machine:
*   [Python 3.8+](https://www.python.org/downloads/)
*   [Node.js 16+](https://nodejs.org/)
*   [MySQL Server](https://dev.mysql.com/downloads/installer/)

---

### Step 1: Database Initialization
1.  Open your MySQL terminal or workbench and make sure the server is running.
2.  Review and configure your database host, user, and password inside `backend/config.py`.
3.  Open a terminal inside the `/backend` folder and run the master database setup installer. This script will automatically create the database `claimshield_ai`, set up all tables, and seed the default administrator account:
    ```bash
    cd backend
    python database/setup.py
    ```

---

### Step 2: Backend Setup (Flask)
1.  Ensure you are inside the `backend` folder.
2.  Install the required Python dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Launch the backend server:
    ```bash
    python app.py
    ```
    *The API will start running at `http://localhost:5000`.*

---

### Step 3: Frontend Setup (React/Vite)
1.  Open a new terminal window and navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install the required Node packages:
    ```bash
    npm install
    ```
3.  Start the local development server:
    ```bash
    npm run dev
    ```
    *The browser interface will spin up at `http://localhost:5173`.*

---

## 🔑 Default Credentials

To explore the operational dashboard and review the audit queues, log into the portal using the pre-seeded secure administrator credentials:

*   **Email**: `admin@claimshield.com`
*   **Password**: `Admin@123`

---

## ⚖️ License
This project is open-source and available under the MIT License.
