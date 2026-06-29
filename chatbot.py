"""
chatbot.py — Core NLP Engine for the CodeAlpha FAQ Chatbot
===========================================================
Responsibilities:
  • Load and parse the FAQ dataset from faq.json
  • Preprocess text using NLTK (tokenization, stopword removal, stemming)
  • Build a TF-IDF matrix over all FAQ questions
  • Match user input to the closest FAQ using cosine similarity
  • Return the best answer or a fallback message if confidence is low
"""

import json
import os
import re
import string

import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# ---------------------------------------------------------------------------
# Ensure required NLTK data packages are present on first run
# ---------------------------------------------------------------------------
for pkg in ("stopwords", "punkt", "punkt_tab"):
    try:
        nltk.data.find(f"tokenizers/{pkg}" if "punkt" in pkg else f"corpora/{pkg}")
    except LookupError:
        nltk.download(pkg, quiet=True)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
FAQ_PATH = os.path.join(os.path.dirname(__file__), "faq.json")
SIMILARITY_THRESHOLD = 0.40          # Answers below 40 % confidence are rejected
FALLBACK_RESPONSE = (
    "Sorry, I don't know the answer to that. "
    "Please try rephrasing your question or contact CodeAlpha support."
)


# ---------------------------------------------------------------------------
# Text preprocessing utilities
# ---------------------------------------------------------------------------

def _build_stemmer_and_stopwords():
    """Create a Porter stemmer and English stop-word set (cached at module level)."""
    stemmer = PorterStemmer()
    stop_words = set(stopwords.words("english"))
    return stemmer, stop_words


_STEMMER, _STOP_WORDS = _build_stemmer_and_stopwords()


def preprocess_text(text: str) -> str:
    """
    Clean and normalise a raw text string for TF-IDF vectorisation.

    Pipeline:
      1. Lower-case
      2. Remove URLs and special characters, keep letters & spaces
      3. Tokenise on whitespace
      4. Strip punctuation tokens
      5. Remove English stop-words
      6. Apply Porter stemming

    Returns a single whitespace-joined string of normalised tokens.
    """
    # 1. Lower-case
    text = text.lower()

    # 2. Remove URLs
    text = re.sub(r"http\S+|www\S+", "", text)

    # 3. Keep only alphabetical characters and spaces
    text = re.sub(r"[^a-z\s]", " ", text)

    # 4. Tokenise
    tokens = text.split()

    # 5. Remove stop-words and pure-punctuation tokens
    punct_set = set(string.punctuation)
    tokens = [
        t for t in tokens
        if t not in _STOP_WORDS and t not in punct_set and len(t) > 1
    ]

    # 6. Stem each surviving token
    tokens = [_STEMMER.stem(t) for t in tokens]

    return " ".join(tokens)


# ---------------------------------------------------------------------------
# FAQ loader
# ---------------------------------------------------------------------------

def load_faqs(path: str = FAQ_PATH) -> tuple[list[str], list[str]]:
    """
    Read the FAQ JSON file and return two parallel lists:
      • questions – raw question strings
      • answers   – corresponding answer strings

    Raises FileNotFoundError if the JSON file is missing.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"FAQ file not found: {path}")

    with open(path, "r", encoding="utf-8") as fh:
        data = json.load(fh)

    questions = [item["question"] for item in data]
    answers   = [item["answer"]   for item in data]
    return questions, answers


# ---------------------------------------------------------------------------
# Chatbot class
# ---------------------------------------------------------------------------

class FAQChatbot:
    """
    NLP-powered FAQ chatbot using TF-IDF + cosine similarity.

    Usage::

        bot = FAQChatbot()
        reply = bot.get_answer("How do I apply for the internship?")
    """

    def __init__(self):
        # Load raw FAQs
        self.questions, self.answers = load_faqs()

        # Pre-process every FAQ question for vectorisation
        self._processed_questions = [preprocess_text(q) for q in self.questions]

        # Build and fit the TF-IDF vectoriser on the FAQ corpus
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),   # unigrams + bigrams for richer context
            max_features=5000,
        )
        self._tfidf_matrix = self.vectorizer.fit_transform(self._processed_questions)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_answer(self, user_input: str) -> dict:
        """
        Find the best-matching FAQ for *user_input*.

        Returns a dict with keys:
          • ``answer``     – the matched answer string (or the fallback)
          • ``confidence`` – float similarity score 0–1
          • ``matched_q``  – the matched FAQ question (empty on fallback)
          • ``success``    – True if confidence ≥ threshold
        """
        if not user_input or not user_input.strip():
            return {
                "answer": "Please type a question so I can help you!",
                "confidence": 0.0,
                "matched_q": "",
                "success": False,
            }

        # Preprocess the user query the same way as the corpus
        processed_input = preprocess_text(user_input)

        # Transform to TF-IDF vector
        query_vec = self.vectorizer.transform([processed_input])

        # Compute cosine similarities against every FAQ question
        similarities = cosine_similarity(query_vec, self._tfidf_matrix).flatten()

        # Pick the highest-scoring index
        best_idx = int(similarities.argmax())
        best_score = float(similarities[best_idx])

        if best_score < SIMILARITY_THRESHOLD:
            return {
                "answer": FALLBACK_RESPONSE,
                "confidence": round(best_score, 4),
                "matched_q": "",
                "success": False,
            }

        return {
            "answer": self.answers[best_idx],
            "confidence": round(best_score, 4),
            "matched_q": self.questions[best_idx],
            "success": True,
        }

    def get_all_questions(self) -> list[str]:
        """Return the list of all FAQ questions (used by the UI suggestion panel)."""
        return self.questions
