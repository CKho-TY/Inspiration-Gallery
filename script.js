/* ---------- Panels ---------- */
const panels = document.querySelectorAll(".panel");
const FADE_MS = 300; // keep in sync with the panel transition in styles.css
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let busy = false;

function showPanel(id) {
  const current = [...panels].find((panel) => !panel.hidden);
  const next = document.getElementById(id);
  if (!next || next === current || busy) return;

  function swap() {
    if (current) {
      current.hidden = true;
      current.classList.remove("is-leaving");
    }

    // Show the new panel invisible, then let it fade in
    next.classList.add("is-entering");
    next.hidden = false;
    window.scrollTo(0, 0);
    void next.offsetHeight; // force a reflow so the transition runs
    next.classList.remove("is-entering");

    if (id !== "submit") resetLetter(); // leaving the note closes the envelope again

    const heading = next.querySelector("h1");
    if (heading) heading.focus({ preventScroll: true });
    busy = false;
  }

  if (!current || reduceMotion.matches) {
    swap();
    return;
  }

  busy = true;
  current.classList.add("is-leaving");
  setTimeout(swap, FADE_MS);
}

document.querySelectorAll("[data-target]").forEach((button) => {
  button.addEventListener("click", () => showPanel(button.dataset.target));
});

/* ---------- Emotion bar ---------- */
// To use your own pictures, change the "image" paths below.
const EMOTIONS = {
  sad:     { label: "Sad",     image: "images/emotions/Sad.png",     color: "#9bb4dc" },
  neutral: { label: "Neutral", image: "images/emotions/Neutral.png", color: "#ffde78" },
  happy:   { label: "Happy",   image: "images/emotions/Happy.png",   color: "#ffc43c" },
};

const moodBar = document.getElementById("mood");
const moodImage = document.getElementById("mood-image");
const moodLabel = document.getElementById("label");
const moodValue = document.getElementById("value");
let currentEmotion = null;

// 0-49 = sad, 50 = neutral, 51-100 = happy
function emotionFor(v) {
  if (v < 50) return "sad";
  if (v === 50) return "neutral";
  return "happy";
}

function renderMood(v) {
  moodBar.style.setProperty("--fill", v + "%");
  moodValue.textContent = `${v} / 100`;

  const key = emotionFor(v);
  if (key === currentEmotion) return;
  currentEmotion = key;

  const emotion = EMOTIONS[key];
  moodImage.src = emotion.image;
  moodImage.alt = emotion.label + " face";
  moodLabel.textContent = emotion.label;
  moodBar.style.setProperty("--bar-color", emotion.color);

  moodImage.classList.remove("is-pop");
  void moodImage.offsetWidth; // restart the pop animation
  moodImage.classList.add("is-pop");
}

// Load all three pictures up front so switching is instant
Object.values(EMOTIONS).forEach((e) => { new Image().src = e.image; });

moodBar.addEventListener("input", (e) => renderMood(Number(e.target.value)));
renderMood(Number(moodBar.value));

/* ---------- Letter (envelope, then a popup letter) ---------- */
const envelope = document.getElementById("envelope");
const letterPopup = document.getElementById("letter-popup");
const closeLetterButton = document.getElementById("close-letter");
let letterTimers = [];

// Sequence: flap opens -> paper rises out of the envelope -> letter pops up
function openLetter() {
  if (envelope.classList.contains("is-open")) return;
  const d = reduceMotion.matches ? 0 : 1; // skip the waiting if motion is reduced
  envelope.classList.add("is-open");
  envelope.setAttribute("aria-expanded", "true");
  letterTimers.push(setTimeout(() => envelope.classList.add("is-rising"), 600 * d));
  letterTimers.push(setTimeout(() => {
    letterPopup.hidden = false;
    closeLetterButton.focus();
  }, 1300 * d));
}

function resetLetter() {
  letterTimers.forEach(clearTimeout);
  letterTimers = [];
  letterPopup.hidden = true;
  envelope.classList.remove("is-open", "is-rising");
  envelope.setAttribute("aria-expanded", "false");
}

function closeLetter() {
  resetLetter();
  envelope.focus();
}

envelope.addEventListener("click", openLetter);
closeLetterButton.addEventListener("click", closeLetter);
letterPopup.addEventListener("click", (e) => {
  if (e.target === letterPopup) closeLetter(); // click outside the paper
});

/* ---------- Keyboard ---------- */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (!letterPopup.hidden) closeLetter(); // Esc closes the letter first
  else showPanel("start");
});
