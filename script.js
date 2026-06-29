/**
 * script.js — CodeAlpha FAQ Chatbot Frontend Logic
 * ==================================================
 * Responsibilities:
 *   • Load FAQ question suggestions from the Flask backend
 *   • Send user questions to /ask and render the response
 *   • Render user and bot chat bubbles
 *   • Show / hide typing animation while waiting for a response
 *   • Auto-scroll the message feed
 *   • Handle sidebar open/close on mobile
 *   • Toggle dark / light theme and persist preference
 *   • Auto-grow the textarea as the user types
 */

"use strict";

// ─── DOM References ────────────────────────────────────────
const messagesEl   = document.getElementById("messages");
const userInputEl  = document.getElementById("userInput");
const sendBtnEl    = document.getElementById("sendBtn");
const suggestionsEl= document.getElementById("suggestions");
const themeToggle  = document.getElementById("themeToggle");
const sidebar      = document.getElementById("sidebar");
const sidebarClose = document.getElementById("sidebarClose");
const hamburger    = document.getElementById("hamburger");
const overlay      = document.getElementById("overlay");
const htmlEl       = document.documentElement;

// ─── State ─────────────────────────────────────────────────
let isWaiting = false;   // true while the bot is "thinking"

// ─── Theme ─────────────────────────────────────────────────

/**
 * Apply a theme to the <html> element and persist the choice in localStorage.
 * @param {"dark"|"light"} theme
 */
function setTheme(theme) {
  htmlEl.setAttribute("data-theme", theme);
  localStorage.setItem("ca-theme", theme);
}

/** Initialise the theme from localStorage or system preference. */
function initTheme() {
  const saved  = localStorage.getItem("ca-theme");
  const system = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  setTheme(saved || system);
}

themeToggle.addEventListener("click", () => {
  const current = htmlEl.getAttribute("data-theme");
  setTheme(current === "dark" ? "light" : "dark");
});

initTheme();

// ─── Sidebar (mobile) ──────────────────────────────────────

/** Open the sidebar drawer on mobile. */
function openSidebar() {
  sidebar.classList.add("open");
  overlay.classList.add("active");
  document.body.style.overflow = "hidden";
}

/** Close the sidebar drawer on mobile. */
function closeSidebar() {
  sidebar.classList.remove("open");
  overlay.classList.remove("active");
  document.body.style.overflow = "";
}

hamburger.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
overlay.addEventListener("click", closeSidebar);

// ─── Auto-grow textarea ────────────────────────────────────

/** Expand the textarea vertically as content grows, up to a max height. */
function autoGrowTextarea() {
  userInputEl.style.height = "auto";
  userInputEl.style.height = Math.min(userInputEl.scrollHeight, 140) + "px";
}

userInputEl.addEventListener("input", () => {
  autoGrowTextarea();
  // Enable / disable the send button based on content
  sendBtnEl.disabled = userInputEl.value.trim() === "" || isWaiting;
});

// ─── Scroll utilities ──────────────────────────────────────

/** Smoothly scroll the message feed to the very bottom. */
function scrollToBottom() {
  messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: "smooth" });
}

// ─── Message rendering ─────────────────────────────────────

/**
 * Append a user bubble to the message feed.
 * @param {string} text  Raw text typed by the user.
 */
function appendUserMessage(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "message user-message";

  // User avatar (initials: "You")
  const avatar = document.createElement("div");
  avatar.className = "avatar user-avatar";
  avatar.setAttribute("aria-label", "User avatar");
  avatar.textContent = "You";

  // Bubble
  const bubble = document.createElement("div");
  bubble.className = "bubble user-bubble";
  bubble.textContent = text;    // textContent is XSS-safe

  wrapper.appendChild(bubble);
  wrapper.appendChild(avatar);
  messagesEl.appendChild(wrapper);
  scrollToBottom();
}

/**
 * Append a bot response bubble to the message feed.
 * @param {string} answer      The answer text from the chatbot.
 * @param {number} confidence  Similarity score 0–1.
 * @param {boolean} success    Whether the threshold was met.
 */
function appendBotMessage(answer, confidence, success) {
  const wrapper = document.createElement("div");
  wrapper.className = "message bot-message";

  // Bot avatar (SVG icon)
  const avatar = document.createElement("div");
  avatar.className = "avatar bot-avatar";
  avatar.setAttribute("aria-label", "Bot avatar");
  avatar.innerHTML = `
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="12" fill="url(#bG${Date.now()})"/>
      <path d="M10 18h5l2.5 7 4-14 4 14 2.5-7H33" stroke="#fff"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <defs>
        <linearGradient id="bG${Date.now()}" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stop-color="#6c63ff"/>
          <stop offset="100%" stop-color="#48c6ef"/>
        </linearGradient>
      </defs>
    </svg>`;

  // Bubble
  const bubble = document.createElement("div");
  bubble.className = "bubble bot-bubble";
  bubble.textContent = answer;

  // Confidence badge (only for successful matches)
  if (success && confidence > 0) {
    const badge = document.createElement("div");
    badge.className = "confidence-badge";
    badge.textContent = `${Math.round(confidence * 100)}% match`;
    bubble.appendChild(document.createElement("br"));
    bubble.appendChild(badge);
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);
  scrollToBottom();
}

// ─── Typing indicator ──────────────────────────────────────

/** Show the animated typing indicator while the bot is processing. */
function showTypingIndicator() {
  const wrapper = document.createElement("div");
  wrapper.className = "message bot-message";
  wrapper.id = "typingIndicator";

  const avatar = document.createElement("div");
  avatar.className = "avatar bot-avatar";
  avatar.innerHTML = `
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="12" fill="url(#tG)"/>
      <path d="M10 18h5l2.5 7 4-14 4 14 2.5-7H33" stroke="#fff"
            stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <defs>
        <linearGradient id="tG" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stop-color="#6c63ff"/>
          <stop offset="100%" stop-color="#48c6ef"/>
        </linearGradient>
      </defs>
    </svg>`;

  const bubble = document.createElement("div");
  bubble.className = "bubble bot-bubble";

  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.innerHTML = "<span></span><span></span><span></span>";

  bubble.appendChild(indicator);
  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  messagesEl.appendChild(wrapper);
  scrollToBottom();
}

/** Remove the typing indicator element from the DOM. */
function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// ─── API communication ─────────────────────────────────────

/**
 * Send the user's question to the Flask /ask endpoint and display the result.
 * @param {string} question  The question text to submit.
 */
async function sendQuestion(question) {
  if (!question || isWaiting) return;

  isWaiting = true;
  sendBtnEl.disabled = true;
  userInputEl.disabled = true;

  // Render the user bubble immediately
  appendUserMessage(question);

  // Reset the input
  userInputEl.value = "";
  userInputEl.style.height = "auto";

  // Show typing animation while we wait
  showTypingIndicator();

  try {
    const response = await fetch("/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error — status: ${response.status}`);
    }

    const data = await response.json();

    // Small delay so the typing animation feels natural (min 600 ms)
    await sleep(600);

    removeTypingIndicator();
    appendBotMessage(data.answer, data.confidence, data.success);

  } catch (err) {
    removeTypingIndicator();
    appendBotMessage(
      "⚠️ Oops! I couldn't connect to the server. Please try again.",
      0,
      false
    );
    console.error("[CodeAlpha Chatbot] Request failed:", err);
  } finally {
    isWaiting = false;
    userInputEl.disabled = false;
    userInputEl.focus();
    // Button state re-evaluated on next input event
    sendBtnEl.disabled = userInputEl.value.trim() === "";
  }
}

/** Promise-based sleep utility. */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Event listeners for sending ──────────────────────────

/** Click the Send button. */
sendBtnEl.addEventListener("click", () => {
  const q = userInputEl.value.trim();
  if (q) sendQuestion(q);
});

/**
 * Keyboard handler:
 *   Enter           → submit (if not waiting)
 *   Shift + Enter   → insert newline (default textarea behaviour)
 */
userInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const q = userInputEl.value.trim();
    if (q && !isWaiting) sendQuestion(q);
  }
});

// ─── Suggestion chips ──────────────────────────────────────

/**
 * Fetch all FAQ questions from the backend and render them as
 * clickable suggestion chips in the sidebar.
 */
async function loadSuggestions() {
  try {
    const res   = await fetch("/questions");
    const data  = await res.json();
    const questions = data.questions || [];

    // Clear skeletons
    suggestionsEl.innerHTML = "";

    if (questions.length === 0) {
      suggestionsEl.innerHTML = '<p style="font-size:0.78rem;color:var(--text-muted);padding:6px;">No questions found.</p>';
      return;
    }

    questions.forEach(q => {
      const chip = document.createElement("button");
      chip.className = "suggestion-chip";
      chip.textContent = q;
      chip.addEventListener("click", () => {
        // On mobile, close the sidebar before sending
        closeSidebar();
        userInputEl.value = q;
        autoGrowTextarea();
        sendBtnEl.disabled = false;
        sendQuestion(q);
      });
      suggestionsEl.appendChild(chip);
    });

  } catch (err) {
    suggestionsEl.innerHTML = '<p style="font-size:0.78rem;color:var(--text-muted);padding:6px;">Could not load suggestions.</p>';
    console.error("[CodeAlpha Chatbot] Failed to load suggestions:", err);
  }
}

// ─── Init ──────────────────────────────────────────────────

/** Bootstrap the application. */
function init() {
  loadSuggestions();
  userInputEl.focus();
}

document.addEventListener("DOMContentLoaded", init);
