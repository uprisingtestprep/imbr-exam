const state = {
  cards: [],
  order: [],
  position: 0,
  flipped: false,
};

const elements = {
  card: document.querySelector("#card"),
  counter: document.querySelector("#counter"),
  domain: document.querySelector("#domain"),
  front: document.querySelector("#front"),
  back: document.querySelector("#back"),
  prev: document.querySelector("#prev"),
  next: document.querySelector("#next"),
  flip: document.querySelector("#flip"),
  shuffle: document.querySelector("#shuffle"),
};

const labels = {
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

function shuffled(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

function render() {
  if (!state.cards.length) return;
  const card = state.cards[state.order[state.position]];
  elements.domain.textContent = labels[card.domain] || card.domain;
  elements.front.textContent = card.front;
  elements.back.textContent = card.back;
  elements.counter.textContent = `${state.position + 1} of ${state.order.length}`;
  elements.card.classList.toggle("flipped", state.flipped);
  elements.flip.textContent = state.flipped ? "Show question" : "Show answer";
}

function flip() {
  state.flipped = !state.flipped;
  render();
}

function move(delta) {
  if (!state.cards.length) return;
  state.position = (state.position + delta + state.order.length) % state.order.length;
  state.flipped = false;
  render();
}

function shuffle() {
  if (!state.cards.length) return;
  state.order = shuffled(state.order);
  state.position = 0;
  state.flipped = false;
  render();
}

async function loadCards() {
  const response = await fetch("cards.json");
  if (!response.ok) throw new Error(`Could not load cards: ${response.status}`);
  state.cards = await response.json();
  state.order = state.cards.map((_card, index) => index);
  render();
}

elements.card.addEventListener("click", flip);
elements.flip.addEventListener("click", flip);
elements.prev.addEventListener("click", () => move(-1));
elements.next.addEventListener("click", () => move(1));
elements.shuffle.addEventListener("click", shuffle);

document.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    flip();
  } else if (event.key === "ArrowLeft") {
    move(-1);
  } else if (event.key === "ArrowRight") {
    move(1);
  } else if (event.key.toLowerCase() === "s") {
    shuffle();
  }
});

loadCards().catch((error) => {
  elements.front.textContent = "The flashcard data could not be loaded.";
  elements.counter.textContent = error.message;
});
