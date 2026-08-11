"use strict";

/* =========================
   Configuration
   ========================= */

// Add a real API / serverless endpoint here later.
// Until then, RSVP submissions are only stored in this browser.
const RSVP_ENDPOINT = "";
const RSVP_STORAGE_KEY = "marlyn-tihomir-rsvp-submissions";

const WEDDING_DATE = new Date("2027-01-27T15:00:00+08:00");
const SCRATCH_REVEAL_THRESHOLD = 0.50;

/* =========================
   DOM references
   ========================= */

const opening = document.querySelector("#opening");
const envelope = document.querySelector("#envelope");
const seal = document.querySelector("#seal");
const scratchCard = document.querySelector("#scratchCard");
const scratchCanvas = document.querySelector("#scratchCanvas");
const scratchContext = scratchCanvas.getContext("2d");
const openingActions = document.querySelector("#openingActions");
const siteContent = document.querySelector("#siteContent");

const giftButton = document.querySelector("#giftBtn");
const giftDetails = document.querySelector("#giftDetails");

const rsvpForm = document.querySelector("#rsvpForm");
const rsvpStatus = document.querySelector("#rsvpStatus");
const swipeSubmit = document.querySelector("#swipeSubmit");
const swipeThumb = document.querySelector("#swipeThumb");

const countdown = document.querySelector("#countdown");
const localTimeNote = document.querySelector("#localTimeNote");

const countdownElements = {
  days: document.querySelector("#days"),
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
};

const confettiCanvas = document.querySelector("#confetti");

/* =========================
   Small audio effects
   ========================= */

let audioContext = null;
let scratchNoiseSource = null;
let scratchGain = null;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume();
  }

  return audioContext;
}

function startScratchSound() {
  const context = getAudioContext();
  if (!context || scratchNoiseSource) return;

  const bufferSize = context.sampleRate * 0.4;
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.34;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  source.buffer = buffer;
  source.loop = true;

  filter.type = "bandpass";
  filter.frequency.value = 1700;
  filter.Q.value = 0.8;

  gain.gain.value = 0.065;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);

  source.start();

  scratchNoiseSource = source;
  scratchGain = gain;
}

function stopScratchSound() {
  if (!scratchNoiseSource) return;

  try {
    scratchNoiseSource.stop();
  } catch (_) {
    // Source may already be stopped.
  }

  scratchNoiseSource.disconnect();
  scratchNoiseSource = null;
  scratchGain = null;
}

function playConfettiSound() {
  const context = getAudioContext();
  if (!context) return;

  const now = context.currentTime;

  [880, 1175, 1568].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.045);

    gain.gain.setValueAtTime(0.0001, now + index * 0.045);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.02 + index * 0.045);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28 + index * 0.045);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now + index * 0.045);
    oscillator.stop(now + 0.32 + index * 0.045);
  });
}

/* =========================
   Full-screen envelope
   ========================= */

seal.addEventListener("click", openEnvelope);

function openEnvelope() {
  if (envelope.classList.contains("open")) return;

  getAudioContext();
  envelope.classList.add("open");

  window.setTimeout(() => {
    opening.classList.add("scene-visible");
  }, 250);

  window.setTimeout(() => {
    envelope.classList.add("opening-gone");
  }, 950);

  // Requested sequence:
  // envelope opens -> Mayon appears -> 1 second -> scratch card appears.
  window.setTimeout(() => {
    scratchCard.classList.add("show");
    scratchCard.setAttribute("aria-hidden", "false");
    initializeScratchCard();
    scratchReady = true;
  }, 1950);
}

/* =========================
   Scratch card
   ========================= */

let isScratching = false;
let scratchComplete = false;
let scratchReady = false;

function initializeScratchCard() {
  const bounds = scratchCanvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;

  scratchCanvas.width = Math.max(1, Math.round(bounds.width * pixelRatio));
  scratchCanvas.height = Math.max(1, Math.round(bounds.height * pixelRatio));

  scratchContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  scratchContext.globalCompositeOperation = "source-over";

  const gradient = scratchContext.createLinearGradient(
    0,
    0,
    bounds.width,
    bounds.height,
  );

  gradient.addColorStop(0, "#8f713d");
  gradient.addColorStop(0.45, "#d8bd7a");
  gradient.addColorStop(1, "#9c7b42");

  scratchContext.fillStyle = gradient;
  scratchContext.fillRect(0, 0, bounds.width, bounds.height);

  scratchContext.fillStyle = "rgba(255,255,255,0.78)";
  scratchContext.font = "600 16px Montserrat";
  scratchContext.textAlign = "center";
  scratchContext.textBaseline = "middle";
  scratchContext.fillText(
    "SCRATCH TO REVEAL",
    bounds.width / 2,
    bounds.height / 2,
  );

  scratchContext.globalCompositeOperation = "destination-out";
}

function getPointerPosition(event) {
  const bounds = scratchCanvas.getBoundingClientRect();
  const pointer = event.touches ? event.touches[0] : event;

  return {
    x: pointer.clientX - bounds.left,
    y: pointer.clientY - bounds.top,
  };
}

function scratch(event) {
  if (!isScratching || !scratchReady || scratchComplete) return;

  const { x, y } = getPointerPosition(event);

  scratchContext.beginPath();
  scratchContext.arc(x, y, 30, 0, Math.PI * 2);
  scratchContext.fill();

  checkScratchProgress();
}

function checkScratchProgress() {
  const pixels = scratchContext.getImageData(
    0,
    0,
    scratchCanvas.width,
    scratchCanvas.height,
  ).data;

  let transparentSamples = 0;
  let sampleCount = 0;

  // Sample rather than scanning every pixel for smoother mobile performance.
  for (let alphaIndex = 3; alphaIndex < pixels.length; alphaIndex += 80) {
    sampleCount += 1;
    if (pixels[alphaIndex] === 0) transparentSamples += 1;
  }

  if (transparentSamples / sampleCount >= SCRATCH_REVEAL_THRESHOLD) {
    finishScratchReveal();
  }
}

function finishScratchReveal() {
  scratchComplete = true;
  stopScratchSound();

  scratchContext.clearRect(
    0,
    0,
    scratchCanvas.width,
    scratchCanvas.height,
  );

  scratchCanvas.style.pointerEvents = "none";
  openingActions.classList.add("show");

  siteContent.classList.add("unlocked");
  siteContent.setAttribute("aria-hidden", "false");
  document.body.classList.remove("date-locked");

  launchConfetti();
  playConfettiSound();
}

function startScratching(event) {
  event.preventDefault();
  isScratching = true;
  startScratchSound();
  scratch(event);
}

function continueScratching(event) {
  event.preventDefault();
  scratch(event);
}

function stopScratching() {
  isScratching = false;
  stopScratchSound();
}

["mousedown", "touchstart"].forEach((eventName) => {
  scratchCanvas.addEventListener(eventName, startScratching, { passive: false });
});

["mousemove", "touchmove"].forEach((eventName) => {
  scratchCanvas.addEventListener(eventName, continueScratching, { passive: false });
});

["mouseup", "mouseleave", "touchend", "touchcancel"].forEach((eventName) => {
  scratchCanvas.addEventListener(eventName, stopScratching);
});

openingActions.querySelector("a").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#story").scrollIntoView({ behavior: "smooth" });
});

/* =========================
   Story highlights
   ========================= */

const storyData = {
  first: {
    photo: "First selfie / first meeting photo",
    caption: "The day our story stepped out of the screen and into real life.",
  },
  distance: {
    photo: "Video calls / long-distance memories",
    caption: "Different time zones, many calls, and choosing each other from far away.",
  },
  adventures: {
    photo: "Travel adventures together",
    caption: "Every new place felt more like home because we were there together.",
  },
  bulgaria: {
    photo: "Life and memories in Bulgaria",
    caption: "A new country, a new chapter, and more ordinary days we learned to treasure.",
  },
  philippines: {
    photo: "Philippines / road-trip memories",
    caption: "Back where so much of our story began, now with a wedding waiting ahead.",
  },
};

document.querySelectorAll(".story-bubble").forEach((button, index) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".story-bubble").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    const story = storyData[button.dataset.story];
    document.querySelector("#storyViewerPhoto").textContent = story.photo;
    document.querySelector("#storyViewerCaption").textContent = story.caption;

    document.querySelectorAll("#storyDots span").forEach((dot, dotIndex) => {
      dot.classList.toggle("active", dotIndex === index % 3);
    });
  });
});

/* =========================
   Gift details & FAQ
   ========================= */

giftButton.addEventListener("click", () => {
  giftDetails.classList.toggle("open");
});

document.querySelectorAll(".faq-q").forEach((questionButton) => {
  questionButton.addEventListener("click", () => {
    const currentItem = questionButton.parentElement;

    document.querySelectorAll(".faq-item").forEach((item) => {
      if (item !== currentItem) {
        item.classList.remove("open");
        const icon = item.querySelector(".faq-q span");
        if (icon) icon.textContent = "＋";
      }
    });

    currentItem.classList.toggle("open");
    questionButton.querySelector("span").textContent =
      currentItem.classList.contains("open") ? "−" : "＋";
  });
});

/* =========================
   Swipe-to-submit RSVP
   ========================= */

let swipeDragging = false;
let swipeStartX = 0;
let swipeOffset = 0;
let swipeSubmitted = false;

function getSwipeLimit() {
  return Math.max(
    0,
    swipeSubmit.clientWidth - swipeThumb.offsetWidth - 10,
  );
}

function setSwipePosition(position, animate = false) {
  const limited = Math.min(Math.max(position, 0), getSwipeLimit());

  swipeThumb.style.transition = animate ? "transform 0.25s ease" : "none";
  swipeThumb.style.transform = `translateX(${limited}px)`;
  swipeOffset = limited;
}

function validateRsvp() {
  if (!rsvpForm.reportValidity()) {
    resetSwipe();
    return false;
  }

  return true;
}

function startSwipe(event) {
  if (swipeSubmitted) return;

  swipeDragging = true;
  swipeStartX = event.clientX - swipeOffset;
  swipeSubmit.setPointerCapture?.(event.pointerId);
}

function moveSwipe(event) {
  if (!swipeDragging || swipeSubmitted) return;
  setSwipePosition(event.clientX - swipeStartX);
}

function endSwipe() {
  if (!swipeDragging || swipeSubmitted) return;

  swipeDragging = false;

  const completionRatio = getSwipeLimit()
    ? swipeOffset / getSwipeLimit()
    : 0;

  if (completionRatio >= 0.82 && validateRsvp()) {
    setSwipePosition(getSwipeLimit(), true);
    submitRsvp();
  } else {
    resetSwipe();
  }
}

function resetSwipe() {
  setSwipePosition(0, true);
}

swipeSubmit.addEventListener("pointerdown", startSwipe);
swipeSubmit.addEventListener("pointermove", moveSwipe);
swipeSubmit.addEventListener("pointerup", endSwipe);
swipeSubmit.addEventListener("pointercancel", endSwipe);

swipeSubmit.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();

    if (validateRsvp()) {
      setSwipePosition(getSwipeLimit(), true);
      submitRsvp();
    }
  }
});

rsvpForm.addEventListener("submit", (event) => {
  // Prevent ordinary form submission; the slider owns submit behavior.
  event.preventDefault();
});

async function submitRsvp() {
  if (swipeSubmitted) return;

  swipeSubmitted = true;
  swipeSubmit.classList.add("complete");

  const formData = new FormData(rsvpForm);

  const payload = {
    name: String(formData.get("name") || "").trim(),
    attendance: String(formData.get("attendance") || ""),
    message: String(formData.get("message") || "").trim(),
    submittedAt: new Date().toISOString(),
  };

  saveRsvpLocally(payload);

  if (RSVP_ENDPOINT) {
    try {
      const response = await fetch(RSVP_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      rsvpStatus.textContent =
        payload.attendance === "yes"
          ? "RSVP sent — we cannot wait to celebrate with you. ❤️"
          : "RSVP sent — thank you for your love and warm wishes. ❤️";
    } catch (error) {
      console.error("RSVP submission failed:", error);
      rsvpStatus.textContent =
        "Saved on this device, but the online RSVP service could not be reached.";
      swipeSubmitted = false;
      swipeSubmit.classList.remove("complete");
      resetSwipe();
      return;
    }
  } else {
    rsvpStatus.textContent =
      "Saved on this device. Connect RSVP_ENDPOINT in script.js to receive guest replies centrally.";
  }

  launchConfetti();
  playConfettiSound();
}

function saveRsvpLocally(payload) {
  try {
    const existing = JSON.parse(
      localStorage.getItem(RSVP_STORAGE_KEY) || "[]",
    );

    existing.push(payload);

    localStorage.setItem(
      RSVP_STORAGE_KEY,
      JSON.stringify(existing),
    );
  } catch (error) {
    console.warn("Could not save RSVP locally:", error);
  }
}

/* =========================
   Countdown & local-time scene
   ========================= */

function updateCountdown() {
  const remainingMs = Math.max(0, WEDDING_DATE - new Date());

  countdownElements.days.textContent =
    Math.floor(remainingMs / 86_400_000);

  countdownElements.hours.textContent =
    Math.floor(remainingMs / 3_600_000) % 24;

  countdownElements.minutes.textContent =
    Math.floor(remainingMs / 60_000) % 60;

  countdownElements.seconds.textContent =
    Math.floor(remainingMs / 1_000) % 60;
}

function updateCountdownScene() {
  const hour = new Date().getHours();

  const scene =
    hour >= 5 && hour < 10
      ? "morning"
      : hour >= 10 && hour < 17
        ? "day"
        : hour >= 17 && hour < 21
          ? "evening"
          : "night";

  countdown.classList.remove(
    "time-morning",
    "time-day",
    "time-evening",
    "time-night",
  );

  countdown.classList.add(`time-${scene}`);

  localTimeNote.textContent =
    `Background matched to your local ${scene}.`;
}

updateCountdown();
updateCountdownScene();

window.setInterval(updateCountdown, 1_000);
window.setInterval(updateCountdownScene, 60_000);

/* =========================
   Scroll reveal
   ========================= */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.12 },
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

/* =========================
   Confetti
   ========================= */

function launchConfetti() {
  const context = confettiCanvas.getContext("2d");

  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const colors = [
    "#718da2",
    "#f5e8c7",
    "#b9975b",
    "#ffffff",
    "#9fb4c2",
    "#efcbd3",
  ];

  const particles = Array.from({ length: 130 }, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -30 - Math.random() * confettiCanvas.height * 0.5,
    velocityX: (Math.random() - 0.5) * 3,
    velocityY: 2 + Math.random() * 4,
    size: 4 + Math.random() * 6,
    rotation: Math.random() * Math.PI * 2,
    rotationVelocity: (Math.random() - 0.5) * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  let frame = 0;

  function drawFrame() {
    context.clearRect(
      0,
      0,
      confettiCanvas.width,
      confettiCanvas.height,
    );

    particles.forEach((particle) => {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += 0.035;
      particle.rotation += particle.rotationVelocity;

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.fillStyle = particle.color;
      context.fillRect(
        -particle.size / 2,
        -particle.size / 2,
        particle.size,
        particle.size * 0.65,
      );
      context.restore();
    });

    frame += 1;

    if (frame < 240) {
      window.requestAnimationFrame(drawFrame);
    } else {
      context.clearRect(
        0,
        0,
        confettiCanvas.width,
        confettiCanvas.height,
      );
    }
  }

  drawFrame();
}
