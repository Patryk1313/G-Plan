const WORKOUT_ROTATION = ["Push", "Pull", "Wolne", "Legs", "Push", "Wolne", "Pull", "Legs", "Wolne"];
const DAYS_TOTAL = 28;

const triviaBank = [
  "Objętość treningowa (Volume) to całkowita liczba uniesionych kilogramów: serie x powtórzenia x ciężar. To jeden z głównych motorów hipertrofii.",
  "Hipertrofia to wzrost komórek mięśniowych, który wymaga bodźca mechanicznego i odpowiedniej podaży białka.",
  "RIR (Reps in Reserve) określa liczbę powtórzeń zapasu do załamania mięśniowego. RIR 1-2 często daje dobry balans między bodźcem a regeneracją.",
  "Układ nerwowy regeneruje się wolniej niż mięśnie, dlatego dni OFF są kluczowe dla progresu i jakości kolejnych sesji.",
  "Najsilniejszy sygnał hipertroficzny często pojawia się przy kontrolowanym rozciągnięciu mięśnia pod obciążeniem.",
  "Synteza białek mięśniowych rośnie po treningu siłowym, ale bez odpowiedniej ilości aminokwasów efekt jest ograniczony.",
  "Nawodnienie wpływa na siłę i wydolność. Spadek masy ciała o 1-2% przez odwodnienie potrafi obniżyć osiągi.",
  "Pompa mięśniowa nie jest jedynym wskaźnikiem jakości treningu, ale może sygnalizować dobrą pracę i ukrwienie mięśni.",
  "Progresja obciążenia może oznaczać nie tylko większy ciężar, ale też więcej powtórzeń, serii lub lepszą technikę.",
  "Zakres 6-15 powtórzeń bywa bardzo skuteczny w budowaniu masy mięśniowej, jeśli serie są prowadzone blisko upadku.",
  "Białko warto rozłożyć równomiernie w ciągu dnia, aby częściej aktywować syntezę białek mięśniowych.",
  "Sen krótszy niż 7 godzin przez dłuższy czas może obniżać regenerację i pogarszać adaptacje treningowe.",
  "Deload to zaplanowane obniżenie objętości lub intensywności, które pozwala odświeżyć układ nerwowy i stawy.",
  "Technika ruchu ma pierwszeństwo przed ciężarem. Stabilna kontrola toru sztangi zmniejsza ryzyko kontuzji.",
  "Tempo ekscentryczne zwiększa czas pod napięciem i może poprawić kontrolę ruchu oraz czucie mięśniowe.",
  "Dodatni bilans energetyczny ułatwia budowanie masy, ale jego skala powinna być umiarkowana, by ograniczyć przyrost tkanki tłuszczowej.",
  "Węglowodany pomagają uzupełniać glikogen mięśniowy, co wspiera jakość kolejnych sesji siłowych.",
  "Dłuższe przerwy między seriami złożonych ćwiczeń często poprawiają jakość kolejnych serii i łączną objętość.",
  "Regularne monitorowanie serii roboczych i RIR ułatwia obiektywne planowanie progresji tydzień po tygodniu.",
  "Regeneracja aktywna, spacer i lekka mobilność w dni OFF mogą poprawić samopoczucie bez przeciążania organizmu."
];

const calendarGrid = document.getElementById("calendarGrid");
const calendarRange = document.getElementById("calendarRange");
const downloadBtn = document.getElementById("downloadIcs");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalBadge = document.getElementById("modalBadge");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalFact = document.getElementById("modalFact");
const modalTimeBox = document.getElementById("modalTimeBox");
const modalRestBox = document.getElementById("modalRestBox");
const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");

const planDays = [];
let selectedDayIndex = 0;

function formatLongDate(dateObj) {
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(dateObj);
}

function formatDateForIcs(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function normalizeTime(value, fallback) {
  return !value || !/^\d{2}:\d{2}$/.test(value) ? fallback : value;
}

function escapeIcsText(raw) {
  return raw.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function uidFromDay(dayPlan, index) {
  const stamp = `${dayPlan.isoDate}-${index}-${dayPlan.type}`.replace(/[^0-9A-Za-z-]/g, "");
  return `${stamp}@g-plan.local`;
}

function randomFact() {
  return triviaBank[Math.floor(Math.random() * triviaBank.length)];
}

function displayWorkoutLabel(type) {
  return type === "Legs" ? "LEGS + CORE" : type;
}

function generatePlan() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < DAYS_TOTAL; i += 1) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() + i);

    planDays.push({
      index: i,
      dateObj,
      isoDate: formatDateForIcs(dateObj),
          type: WORKOUT_ROTATION[i % WORKOUT_ROTATION.length],
      startTime: "17:00",
      endTime: "18:30"
    });
  }

  const monthFormat = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "short" });
  calendarRange.textContent = `${monthFormat.format(planDays[0].dateObj)} - ${monthFormat.format(planDays[planDays.length - 1].dateObj)}`;
}

function renderCalendar() {
  calendarGrid.innerHTML = "";

  planDays.forEach((day, index) => {
    const btn = document.createElement("button");
    const isOff = day.type === "Wolne";
        const typeClass = isOff ? "off" : day.type.toLowerCase();
    btn.type = "button";
        btn.className = `day-btn ${typeClass} ${isOff ? "" : "training"} ${index === selectedDayIndex ? "selected" : ""}`;
    btn.dataset.index = String(index);
    btn.setAttribute("aria-label", `${formatLongDate(day.dateObj)} — ${displayWorkoutLabel(day.type)}`);
    btn.innerHTML = `<span>${day.dateObj.getDate()}</span>`;
    calendarGrid.appendChild(btn);
  });
}

function openDayModal(index) {
  selectedDayIndex = index;
  renderCalendar();

  const day = planDays[index];
  const isOff = day.type === "Wolne";

  modalBadge.textContent = isOff ? "Regeneracja" : displayWorkoutLabel(day.type);
  modalBadge.classList.toggle("off", isOff);
  modalTitle.textContent = formatLongDate(day.dateObj);
  modalMeta.textContent = `Dzień ${index + 1} z 28 • Tydzień ${Math.floor(index / 7) + 1}`;
  modalFact.textContent = randomFact();

  if (isOff) {
    modalTimeBox.hidden = true;
    modalRestBox.hidden = false;
  } else {
    modalTimeBox.hidden = false;
    modalRestBox.hidden = true;
    startTimeInput.value = day.startTime;
    endTimeInput.value = day.endTime;
  }

  modalBackdrop.classList.add("open");
  modalBackdrop.setAttribute("aria-hidden", "false");
}

function closeDayModal() {
  modalBackdrop.classList.remove("open");
  modalBackdrop.setAttribute("aria-hidden", "true");
}

function buildIcsContent() {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//G-Plan//Training Calendar//PL",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH"
  ];

  planDays.forEach((day, index) => {
    if (day.type === "Wolne") {
      return;
    }

    const start = normalizeTime(day.startTime, "17:00");
    const end = normalizeTime(day.endTime, "18:30");
    const startIcs = `${day.isoDate}T${start.replace(":", "")}00`;
    const endIcs = `${day.isoDate}T${end.replace(":", "")}00`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uidFromDay(day, index)}`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${startIcs}`);
    lines.push(`DTEND:${endIcs}`);
    lines.push(`SUMMARY:${escapeIcsText(`Siłownia - ${displayWorkoutLabel(day.type)}`)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(`💡 Ciekawostka treningowa:\n${randomFact()}`)}`);
    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

function downloadIcsFile() {
  const blob = new Blob([buildIcsContent()], { type: "text/calendar;charset=utf-8" });

  if (navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, "g-plan-4-tygodnie.ics");
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "g-plan-4-tygodnie.ics";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 120);
}

calendarGrid.addEventListener("click", (event) => {
  const target = event.target;
  const button = target instanceof HTMLElement ? target.closest(".day-btn") : null;
  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);
  if (Number.isNaN(index) || !planDays[index]) {
    return;
  }

  openDayModal(index);
});

modalClose.addEventListener("click", closeDayModal);
modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop) {
    closeDayModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDayModal();
  }
});

startTimeInput.addEventListener("input", () => {
  const day = planDays[selectedDayIndex];
  if (day && day.type !== "Wolne") {
    day.startTime = normalizeTime(startTimeInput.value, "17:00");
  }
});

endTimeInput.addEventListener("input", () => {
  const day = planDays[selectedDayIndex];
  if (day && day.type !== "Wolne") {
    day.endTime = normalizeTime(endTimeInput.value, "18:30");
  }
});

downloadBtn.addEventListener("click", downloadIcsFile);

generatePlan();
renderCalendar();
openDayModal(0);
