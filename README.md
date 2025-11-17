# 🎬 Cinema Trivia — PWA

A lightweight, offline-capable movie trivia game built with vanilla JavaScript, HTML, and CSS.
Users can play random quizzes, choose by category, and select how many questions they want.

## 🚀 Features

* **Random trivia mode**
* **Category-based trivia** (auto-generated from `questions.json`)
* **Selectable number of questions** (5, 10, 15, 20, or all)
* **Score tracking + progress bar**
* **Sound feedback** with on/off toggle
* **Smooth animations and transitions**
* **Offline support (PWA)** via `service worker`
* **Fully responsive UI**

---

## 📂 Project Structure

```
.
├── index.html          # Main UI
├── styles.css          # Styling & animations
├── trivia.js           # Game logic
├── questions.json      # Question database
├── manifest.json       # PWA configuration
├── sw.js               # Service worker (caching)
└── icons/              # App icons for PWA
```

---

## 📦 Installation

No build tools required.
You can run it locally or host it on any static server.

### Option 1 — Open directly

Just open `index.html` in a modern browser.

### Option 2 — Local server (recommended for PWA)

Use any static server, for example:

**Node.js (http-server):**

```bash
npm install -g http-server
http-server .
```

**Python:**

```bash
python3 -m http.server 8080
```

Then visit:

```
http://localhost:8080
```

---

## 🔧 How It Works

### Questions

All trivia questions come from `questions.json`.
Each entry includes:

```json
{
  "pregunta": "¿Quién dirigió 'Inception'?",
  "opciones": ["Spielberg", "Nolan", "Cameron", "Scorsese"],
  "respuesta": "Christopher Nolan",
  "categoria": "Directores y Creadores"
}
```

### Game Logic (`trivia.js`)

* Loads and validates all questions
* Shuffles questions and answer options
* Tracks score and progress
* Manages menus, categories, and transitions
* Plays success/error sounds
* Saves settings in localStorage (sound + question count)

### Offline Mode (`sw.js`)

* Uses cache-first for UI
* Uses network-first for `questions.json` (falls back to cache if offline)

---

## 📱 PWA Support

This project is installable on mobile and desktop devices.

The PWA includes:

* `manifest.json` with icons and theme colors
* Automatic service worker registration
* Offline access once cached

Install it by selecting **“Add to Home Screen”** in your browser.

---

## 🧪 Customizing the Game

### Add or edit questions

Modify `questions.json`.
The game automatically loads new categories and questions.

### Change the number of questions

Handled from the dropdown in the main menu.
Saved in `localStorage`.

### Disable or modify sound effects

All audio logic is inside:

```js
playSuccess()
playError()
```

---

## 🛠️ Requirements

* Modern browser with JavaScript enabled
* (Optional) Local server to enable full PWA behavior

---

## 📝 License

This project is for personal and educational use.

