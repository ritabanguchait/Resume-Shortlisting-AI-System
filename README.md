# Resume Shortlisting & Job Matching System

A professional, role-based web application for Resume Shortlisting.
- **Students**: Upload resume, get instant AI feedback (Score, Tips, Missing Skills).
- **HR**: Create jobs, bulk upload resumes, and get a ranked shortlist of candidates.

## 🚀 How to Run

### 1. Prerequisites
- **Node.js** (v16+)
- **Python** (v3.8+)
- **Git**

### 2. Backend Setup
1. Open a terminal in the root directory.
2. Navigate to the backend folder:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server (runs on port 3000):
   ```bash
   npm start
   ```
   *You should see "Server running on port 3000"*

### 3. Machine Learning Setup
1. Open a new terminal.
2. Install Python dependencies:
   ```bash
   pip install sentence-transformers numpy pandas scikit-learn pdfplumber
   ```
   *(Note: The system will automatically download the 'all-MiniLM-L6-v2' model on first run)*

### 4. Running the Frontend
Since this is a simple HTML/JS frontend, you need to serve it to avoid CORS issues.
**Option A: Live Server (Recommended)**
- If using VS Code, install "Live Server" extension.
- Right-click `.frontend/index.html` -> "Open with Live Server".

**Option B: Simple Python Server**
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Run:
   ```bash
   python -m http.server 8000
   ```
3. Open `http://localhost:8000` in your browser.

## 🔑 Login Credentials
**Student Portal**
- **Email:** student@example.com
- **Password:** student123 (or Sign Up as new)

**HR Portal**
- **Email:** hr@example.com
- **Password:** hr123 (or Sign Up as new)
