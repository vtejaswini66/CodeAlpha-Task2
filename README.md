# CodeAlpha FAQ Chatbot

> **NLP-powered FAQ chatbot** built with Python · Flask · TF-IDF · Cosine Similarity · NLTK  
> Developed as part of the **CodeAlpha AI Internship** program.

---

##  Preview

_Place your screenshots in the `screenshots/` folder and reference them here._

| Dark Mode | Light Mode |
|-----------|-----------|
| ![dark](screenshots/dark.png) | ![light](screenshots/light.png) |

---

##  Features

-  Reads FAQs from a structured `faq.json` file — easy to extend
-  Preprocesses text with NLTK (lower-case → stop-word removal → Porter stemming)
-  Vectorises questions using **TF-IDF** (unigrams + bigrams)
-  Matches user queries via **Cosine Similarity**
-  Returns the best answer or a polite fallback when confidence < 40 %
-  ChatGPT-style chat UI with animated typing indicator
-  Dark / light mode toggle (persisted in `localStorage`)
-  Fully responsive — works on mobile, tablet, and desktop
-  Sidebar with clickable FAQ suggestion chips
-  XSS-safe message rendering (`textContent` throughout)

---

##  Project Structure

```
CodeAlpha_FAQ_Chatbot/
│
├── app.py              # Flask application — routes and server entry point
├── chatbot.py          # NLP engine — TF-IDF vectoriser + cosine similarity
├── faq.json            # FAQ dataset (25 questions / answers)
├── requirements.txt    # Python dependencies
├── README.md           # This file
├── .gitignore
│
├── templates/
│   └── index.html      # Jinja2 chat UI template
│
├── static/
│   ├── style.css       # Dark/light theme, chat bubbles, responsive layout
│   └── script.js       # API calls, message rendering, typing animation
│
└── screenshots/        # Place your UI screenshots here
```

---

##  Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/CodeAlpha_FAQ_Chatbot.git
cd CodeAlpha_FAQ_Chatbot
```

### 2. Create and activate a virtual environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the app

```bash
python app.py
```

Open your browser at **http://127.0.0.1:5000**

---

##  How It Works

```
User types question
        │
        ▼
  preprocess_text()
  (lowercase → remove stop-words → Porter stemming)
        │
        ▼
  TfidfVectorizer.transform()
        │
        ▼
  cosine_similarity(query_vec, faq_matrix)
        │
        ▼
  best_score ≥ 0.40 ?
     YES → return matching answer + confidence
     NO  → return fallback message
```

### Text Preprocessing Pipeline

| Step | Example |
|------|---------|
| Raw input | "How do I apply for the CodeAlpha internship?" |
| Lower-case | "how do i apply for the codealpha internship?" |
| Remove special chars | "how do i apply for the codealpha internship" |
| Tokenise | `["how", "do", "i", "apply", "for", "the", "codealpha", "internship"]` |
| Remove stop-words | `["apply", "codealpha", "internship"]` |
| Porter stemming | `["appli", "codealpha", "internship"]` |
| TF-IDF transform | `[0.0, 0.71, 0.53, …]` |

---

##  Extending the FAQ

Add new entries to `faq.json`:

```json
{
  "question": "Your new question here?",
  "answer": "The answer to the question."
}
```

The chatbot rebuilds its TF-IDF matrix automatically on startup — no code changes needed.

---

##  API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/`  | Serve the chat UI |
| `POST` | `/ask` | `{ "question": "..." }` → `{ "answer", "confidence", "matched_q", "success" }` |
| `GET`  | `/questions` | Returns all FAQ questions for the suggestion panel |
| `GET`  | `/health` | Liveness probe — returns `{ "status": "ok" }` |

---

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.10+, Flask 3 |
| NLP | NLTK, Scikit-learn |
| Vectorisation | TF-IDF (unigram + bigram) |
| Similarity | Cosine Similarity |
| Frontend | HTML5, CSS3, Vanilla JS |
| Fonts | Inter (Google Fonts) |

---


---


