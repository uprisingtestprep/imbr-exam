const CONFIG = {
  accessCode: "IMBR9000",
  questionCount: 240,
  durationSeconds: 8 * 60 * 60,
};

const state = {
  pool: [],
  exam: [],
  answers: new Map(),
  flags: new Set(),
  index: 0,
  remaining: CONFIG.durationSeconds,
  timerId: null,
  finished: false,
};

const $ = (selector) => document.querySelector(selector);
const gate = $("#gate");
const exam = $("#exam");
const results = $("#results");
const domainNames = {
  allergy_and_immunology: "Allergy and Immunology",
  cardiovascular_disease: "Cardiovascular Disease",
  dermatology: "Dermatology",
  endocrinology_diabetes_and_metabolism: "Endocrinology, Diabetes and Metabolism",
  gastroenterology: "Gastroenterology",
  hematology: "Hematology",
  infectious_disease: "Infectious Disease",
  miscellaneous: "Miscellaneous",
  nephrology_and_urology: "Nephrology and Urology",
  neurology: "Neurology",
  obstetrics_and_gynecology: "Obstetrics and Gynecology",
  medical_oncology: "Medical Oncology",
  ophthalmology: "Ophthalmology",
  otolaryngology_and_dental_medicine: "Otolaryngology and Dental Medicine",
  psychiatry: "Psychiatry",
  pulmonary_disease: "Pulmonary Disease",
  rheumatology_and_orthopedics: "Rheumatology and Orthopedics",
  geriatric_syndromes: "Geriatric Syndromes",
};

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function timeText(seconds) {
  const safe = Math.max(0, seconds);
  const hours = String(Math.floor(safe / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const remainder = String(safe % 60).padStart(2, "0");
  return `${hours}:${minutes}:${remainder}`;
}

function renderQuestion() {
  const question = state.exam[state.index];
  $("#counter").textContent = `${state.index + 1} of ${state.exam.length}`;
  $("#domain").textContent = domainNames[question.domain] || question.domain;
  $("#stem").textContent = question.question;
  $("#flag").textContent = state.flags.has(question.id) ? "Unflag" : "Flag";
  const container = $("#options");
  container.replaceChildren();
  for (const letter of "ABCDE") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option";
    if (state.answers.get(question.id) === letter) button.classList.add("selected");
    const letterLabel = document.createElement("span");
    letterLabel.className = "option-letter";
    letterLabel.textContent = letter;
    const optionText = document.createElement("span");
    optionText.textContent = question.options[letter];
    button.append(letterLabel, optionText);
    button.addEventListener("click", () => {
      state.answers.set(question.id, letter);
      renderQuestion();
    });
    container.append(button);
  }
}

function startTimer() {
  clearInterval(state.timerId);
  state.timerId = setInterval(() => {
    state.remaining -= 1;
    $("#timer").textContent = timeText(state.remaining);
    if (state.remaining <= 0) finishExam(true);
  }, 1000);
  $("#timer").textContent = timeText(state.remaining);
}

function move(delta) {
  state.index = (state.index + delta + state.exam.length) % state.exam.length;
  renderQuestion();
}

async function startExam() {
  const code = $("#accessCode").value.trim().toUpperCase();
  if (code !== CONFIG.accessCode) {
    $("#gateError").textContent = "That access code is not correct.";
    return;
  }
  const response = await fetch("questions.json");
  if (!response.ok) {
    $("#gateError").textContent = `Question data failed to load: ${response.status}`;
    return;
  }
  state.pool = await response.json();
  if (state.pool.length !== 2000) {
    $("#gateError").textContent = `Expected 2,000 simulator questions, found ${state.pool.length}.`;
    return;
  }
  state.exam = shuffle(state.pool).slice(0, CONFIG.questionCount);
  state.answers.clear();
  state.flags.clear();
  state.index = 0;
  state.remaining = CONFIG.durationSeconds;
  gate.hidden = true;
  exam.hidden = false;
  renderQuestion();
  startTimer();
}

function finishExam(timedOut = false) {
  if (state.finished) return;
  const unanswered = state.exam.filter((question) => !state.answers.has(question.id)).length;
  if (!timedOut && unanswered > 0) {
    const shouldSubmit = window.confirm(
      `${unanswered} question${unanswered === 1 ? " has" : "s have"} no answer. Submit anyway?`
    );
    if (!shouldSubmit) return;
  }
  state.finished = true;
  clearInterval(state.timerId);
  exam.hidden = true;
  let correct = 0;
  const review = [];
  for (const question of state.exam) {
    const selected = state.answers.get(question.id) || "";
    const isCorrect = selected === question.correct;
    if (isCorrect) correct += 1;
    review.push({ question, selected, isCorrect });
  }
  const percent = Math.round((100 * correct) / state.exam.length);
  results.innerHTML = `
    <p class="eyebrow">Practice result</p>
    <p class="score">${correct} of ${state.exam.length} correct (${percent}%)</p>
    <p>${unanswered} unanswered${timedOut ? ". Time expired." : "."}</p>
    <p>This is a practice score. It is not an ABIM pass or fail decision.</p>
    <h2>Answer review</h2>
  `;
  for (const item of review) {
    const block = document.createElement("article");
    block.className = "review-item";
    const number = document.createElement("p");
    const numberStrong = document.createElement("strong");
    numberStrong.textContent = `Question ${item.question.id}`;
    number.append(numberStrong);
    const stem = document.createElement("p");
    stem.textContent = item.question.question;
    const selected = document.createElement("p");
    selected.append("Your answer: ");
    const selectedValue = document.createElement("span");
    selectedValue.className = item.isCorrect ? "correct" : "incorrect";
    selectedValue.textContent = item.selected || "No answer";
    selected.append(selectedValue);
    const correct = document.createElement("p");
    correct.append("Correct answer: ");
    const correctValue = document.createElement("span");
    correctValue.className = "correct";
    correctValue.textContent = item.question.correct;
    correct.append(correctValue);
    const explanation = document.createElement("p");
    explanation.textContent = item.question.explanation;
    block.append(number, stem, selected, correct, explanation);
    results.append(block);
  }
  results.hidden = false;
}

$("#start").addEventListener("click", startExam);
$("#accessCode").addEventListener("keydown", (event) => {
  if (event.key === "Enter") startExam();
});
$("#prev").addEventListener("click", () => move(-1));
$("#next").addEventListener("click", () => move(1));
$("#flag").addEventListener("click", () => {
  const id = state.exam[state.index].id;
  if (state.flags.has(id)) state.flags.delete(id);
  else state.flags.add(id);
  renderQuestion();
});
$("#submit").addEventListener("click", () => finishExam(false));

document.addEventListener("keydown", (event) => {
  if (exam.hidden) return;
  if (["A", "B", "C", "D", "E"].includes(event.key.toUpperCase())) {
    state.answers.set(state.exam[state.index].id, event.key.toUpperCase());
    renderQuestion();
  } else if (event.key === "ArrowLeft") {
    move(-1);
  } else if (event.key === "ArrowRight") {
    move(1);
  }
});
