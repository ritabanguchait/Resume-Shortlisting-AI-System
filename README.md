# Resume Shortlisting & Job Matching System

## Project Overview
A professional web application for HR and Interviewers to:
- Upload multiple resumes (PDF).
- Enter a job description.
- Automatically shortlist candidates based on skill matching and relevance.
- View detailed analysis including match percentage, skills, pros, and cons.

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript.
- **Backend**: Node.js, Express.js.
- **ML/NLP**: Python, Scikit-learn, Pandas, PDFPlumber.

## Setup & Run Instructions

### Prerequisites
- Node.js installed.
- Python 3.x installed.

### Installation
1.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    ```
2.  **ML Setup**:
    ```bash
    pip install scikit-learn pdfplumber numpy pandas nltk flask
    ```
    *(Note: Flask/API is not strictly used if using child_process, but dependencies are required)*

### Running the Application
1.  Start the backend server:
    ```bash
    cd backend
    node server.js
    ```
2.  Open `http://localhost:3000` (or configured port) in your browser.
    *(Frontend is served via the backend or can be opened directly if configured that way)*

## ML Logic
The system uses **TF-IDF (Term Frequency-Inverse Document Frequency)** and **Cosine Similarity** to compare the job description text with the extracted text from resumes.
- **Skill Extraction**: Parses text for known technical skills.
- **Match Percentage**: Cosine similarity score normalized to a percentage.
