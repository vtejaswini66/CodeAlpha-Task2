"""
app.py — Flask Web Application for the CodeAlpha FAQ Chatbot
=============================================================
Routes:
  GET  /           → Serve the main chat UI (index.html)
  POST /ask         → Accept JSON { "question": "..." }
                      Return JSON { "answer": "...", "confidence": 0.xx,
                                    "matched_q": "...", "success": true }
  GET  /questions   → Return all FAQ questions (for the suggestion panel)
  GET  /health      → Simple health-check endpoint
"""

from flask import Flask, jsonify, render_template, request

from chatbot import FAQChatbot

# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

app = Flask(__name__)
app.config["JSON_SORT_KEYS"] = False   # preserve key order in responses

# Instantiate the chatbot once at start-up (builds TF-IDF matrix)
print("[CodeAlpha] Initialising FAQ Chatbot engine …")
bot = FAQChatbot()
print(f"[CodeAlpha] Chatbot ready — {len(bot.get_all_questions())} FAQs loaded.")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    """Render the main chat interface."""
    return render_template("index.html")


@app.route("/ask", methods=["POST"])
def ask():
    """
    Accept a user question via JSON POST and return the chatbot's response.

    Request body  : { "question": "<user text>" }
    Response body : {
        "answer"    : "<answer text>",
        "confidence": 0.82,
        "matched_q" : "<matched FAQ question>",
        "success"   : true
    }
    """
    payload = request.get_json(silent=True) or {}
    user_question = payload.get("question", "").strip()

    if not user_question:
        return jsonify({"error": "No question provided."}), 400

    result = bot.get_answer(user_question)
    return jsonify(result)


@app.route("/questions", methods=["GET"])
def questions():
    """
    Return the full list of FAQ questions.
    The frontend uses this to populate the suggestion chips.
    """
    return jsonify({"questions": bot.get_all_questions()})


@app.route("/health", methods=["GET"])
def health():
    """Simple liveness probe for deployment environments."""
    return jsonify({"status": "ok", "faqs_loaded": len(bot.get_all_questions())})


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # debug=True enables auto-reloading during development.
    # Set debug=False (and use a production WSGI server) for deployment.
    app.run(debug=True, host="0.0.0.0", port=5000)
