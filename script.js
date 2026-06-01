const WORKOUT_ROTATION = [
    "Push",
    "Pull",
    "Wolne",
    "Legs",
    "Push",
    "Wolne",
    "Pull",
    "Legs",
    "Wolne",
];

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
    "Regeneracja aktywna, spacer i lekka mobilność w dni OFF mogą poprawić samopoczucie bez przeciążania organizmu.",
];

const calendarGrid = document.getElementById("calendarGrid");
const calendarRange = document.getElementById("calendarRange");
const recalcBtn = document.getElementById("recalcPlan");
const cancelPlanBtn = document.getElementById("cancelPlan");
const downloadBtn = document.getElementById("downloadIcs");
const planHelpToggle = document.getElementById("planHelpToggle");
const planHelpPanel = document.getElementById("planHelpPanel");
const planHelpClose = document.getElementById("planHelpClose");
const planHelpWeeks = document.getElementById("planHelpWeeks");
const themeToggle = document.getElementById("themeToggle");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const modalBadge = document.getElementById("modalBadge");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");
const modalFact = document.getElementById("modalFact");
const modalTimeBox = document.getElementById("modalTimeBox");
const modalRestBox = document.getElementById("modalRestBox");
const singleDayExportBox = document.getElementById("singleDayExportBox");
const downloadDayIcsBtn = document.getElementById("downloadDayIcs");
const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");

const planDays = [];
let selectedDayIndex = 0;
let draggedDayIndex = null;

function togglePlanHelp(forceOpen) {
    const shouldOpen =
        typeof forceOpen === "boolean"
            ? forceOpen
            : planHelpPanel.hasAttribute("hidden");

    planHelpPanel.hidden = !shouldOpen;
    planHelpToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function renderPlanHelp() {
    const totalWeeks = Math.min(4, Math.ceil(planDays.length / 7));
    planHelpWeeks.innerHTML = "";

    for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex += 1) {
        const weekDays = planDays.slice(weekIndex * 7, weekIndex * 7 + 7);
        const weekItem = document.createElement("li");
        weekItem.className = "plan-help-week";

        const title = document.createElement("span");
        title.className = "plan-help-week-title";
        title.textContent = `Tydzień ${weekIndex + 1}`;

        const description = document.createElement("span");
        description.className = "plan-help-week-description";
        description.textContent = weekDays
            .map((day) => displayWorkoutLabel(day.type))
            .join(" • ");

        weekItem.append(title, description);
        planHelpWeeks.appendChild(weekItem);
    }
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("gplan-theme", theme);
    themeToggle.setAttribute("aria-pressed", String(theme === "light"));
    themeToggle.querySelector(".theme-toggle-label").textContent =
        theme === "light" ? "Tryb ciemny" : "Tryb jasny";
}

function initThemeToggle() {
    const currentTheme =
        document.documentElement.getAttribute("data-theme") || "dark";
    applyTheme(currentTheme);

    themeToggle.addEventListener("click", () => {
        const nextTheme =
            document.documentElement.getAttribute("data-theme") === "light"
                ? "dark"
                : "light";
        applyTheme(nextTheme);
    });
}

function formatLongDate(dateObj) {
    return new Intl.DateTimeFormat("pl-PL", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
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
    return raw
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\n/g, "\\n");
}

function uidFromDay(dayPlan, index) {
    const stamp = `${dayPlan.isoDate}-${index}-${dayPlan.type}`.replace(
        /[^0-9A-Za-z-]/g,
        "",
    );
    return `${stamp}@g-plan.local`;
}

function randomFact() {
    return triviaBank[Math.floor(Math.random() * triviaBank.length)];
}

function displayWorkoutLabel(type) {
    if (type === "Wolne") {
        return "Rest Day";
    }

    return type === "Legs" ? "Legs & Core" : type;
}

function getCurrentMonthPlanInfo() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    return {
        monthStart,
        totalDays: new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate(),
    };
}

function getMondayFirstWeekday(dateObj) {
    return (dateObj.getDay() + 6) % 7;
}

function getTrainingEntries() {
    return planDays.filter((day) => day.type !== "Wolne");
}

function updateCancelPlanButton() {
    const canCancel = getTrainingEntries().length > 0;
    cancelPlanBtn.disabled = !canCancel;
    cancelPlanBtn.title = canCancel
        ? "Pobierz plik anulujący wszystkie aktualne treningi"
        : "W aktualnym planie nie ma treningów do anulowania";
}

function swapDayAssignments(sourceIndex, targetIndex) {
    if (
        sourceIndex === targetIndex ||
        !planDays[sourceIndex] ||
        !planDays[targetIndex]
    ) {
        return false;
    }

    const sourceDay = planDays[sourceIndex];
    const targetDay = planDays[targetIndex];
    const nextSource = {
        type: targetDay.type,
        startTime: targetDay.startTime,
        endTime: targetDay.endTime,
    };

    targetDay.type = sourceDay.type;
    targetDay.startTime = sourceDay.startTime;
    targetDay.endTime = sourceDay.endTime;

    sourceDay.type = nextSource.type;
    sourceDay.startTime = nextSource.startTime;
    sourceDay.endTime = nextSource.endTime;

    return true;
}

function generatePlan() {
    planDays.length = 0;

    const { monthStart, totalDays } = getCurrentMonthPlanInfo();

    for (let i = 0; i < totalDays; i += 1) {
        const dateObj = new Date(monthStart);
        dateObj.setDate(monthStart.getDate() + i);

        planDays.push({
            index: i,
            dateObj,
            isoDate: formatDateForIcs(dateObj),
            type: WORKOUT_ROTATION[i % WORKOUT_ROTATION.length],
            startTime: "17:00",
            endTime: "18:30",
        });
    }

    const monthFormat = new Intl.DateTimeFormat("pl-PL", {
        month: "long",
        year: "numeric",
    });
    calendarRange.textContent = `${monthFormat.format(monthStart)} • ${totalDays} dni`;
}

function resetPlan() {
    selectedDayIndex = 0;
    generatePlan();
    renderPlanHelp();
    renderCalendar();
    updateCancelPlanButton();

    if (modalBackdrop.classList.contains("open")) {
        openDayModal(selectedDayIndex);
    }
}

function renderCalendar() {
    calendarGrid.innerHTML = "";

    const leadingEmptyDays = planDays.length
        ? getMondayFirstWeekday(planDays[0].dateObj)
        : 0;

    for (let index = 0; index < leadingEmptyDays; index += 1) {
        const spacer = document.createElement("div");
        spacer.className = "day-spacer";
        spacer.setAttribute("aria-hidden", "true");
        calendarGrid.appendChild(spacer);
    }

    planDays.forEach((day, index) => {
        const btn = document.createElement("button");
        const isOff = day.type === "Wolne";
        const typeClass = isOff ? "off" : day.type.toLowerCase();
        btn.type = "button";
        btn.className = `day-btn ${typeClass} ${isOff ? "" : "training"} ${index === selectedDayIndex ? "selected" : ""}`;
        btn.dataset.index = String(index);
        btn.draggable = !isOff;
        if (!isOff) {
            btn.classList.add("draggable");
            btn.title = "Przeciągnij trening na inny dzień";
        }
        btn.setAttribute(
            "aria-label",
            `${formatLongDate(day.dateObj)} — ${displayWorkoutLabel(day.type)}`,
        );
        btn.innerHTML = `<span>${day.dateObj.getDate()}</span>`;
        calendarGrid.appendChild(btn);
    });
}

function openDayModal(index) {
    selectedDayIndex = index;
    renderCalendar();

    const day = planDays[index];
    const isOff = day.type === "Wolne";

    modalBadge.textContent = displayWorkoutLabel(day.type);
    modalBadge.classList.toggle("off", isOff);
    modalTitle.textContent = formatLongDate(day.dateObj);
    modalMeta.textContent = `Dzień ${index + 1} z ${planDays.length} • Tydzień ${Math.floor(index / 7) + 1}`;
    modalFact.textContent = randomFact();

    if (isOff) {
        modalTimeBox.hidden = true;
        modalRestBox.hidden = false;
        singleDayExportBox.hidden = true;
    } else {
        modalTimeBox.hidden = false;
        modalRestBox.hidden = true;
        singleDayExportBox.hidden = false;
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
        "METHOD:PUBLISH",
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
        lines.push(
            `SUMMARY:${escapeIcsText(`Siłownia - ${displayWorkoutLabel(day.type)}`)}`,
        );
        lines.push(
            `DESCRIPTION:${escapeIcsText(`💡 Ciekawostka treningowa:\n${randomFact()}`)}`,
        );
        lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");
    return `${lines.join("\r\n")}\r\n`;
}

function buildSingleDayIcsContent(index) {
    const day = planDays[index];
    if (!day || day.type === "Wolne") {
        return null;
    }

    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;
    const start = normalizeTime(day.startTime, "17:00");
    const end = normalizeTime(day.endTime, "18:30");
    const startIcs = `${day.isoDate}T${start.replace(":", "")}00`;
    const endIcs = `${day.isoDate}T${end.replace(":", "")}00`;

    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//G-Plan//Training Calendar//PL",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${uidFromDay(day, index)}`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${startIcs}`,
        `DTEND:${endIcs}`,
        `SUMMARY:${escapeIcsText(`Siłownia - ${displayWorkoutLabel(day.type)}`)}`,
        `DESCRIPTION:${escapeIcsText(`Eksport pojedynczego treningu z G-Plan.\n${formatLongDate(day.dateObj)}`)}`,
        "END:VEVENT",
        "END:VCALENDAR",
    ];

    return `${lines.join("\r\n")}\r\n`;
}

function buildCancelPlanIcsContent() {
    const trainingEntries = getTrainingEntries();
    if (trainingEntries.length === 0) {
        return null;
    }

    const now = new Date();
    const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}Z`;

    const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//G-Plan//Training Calendar//PL",
        "CALSCALE:GREGORIAN",
        "METHOD:CANCEL",
        "END:VCALENDAR",
    ];

    const calendarEndIndex = lines.length - 1;

    trainingEntries.forEach((day) => {
        const start = normalizeTime(day.startTime, "17:00");
        const end = normalizeTime(day.endTime, "18:30");
        const startIcs = `${day.isoDate}T${start.replace(":", "")}00`;
        const endIcs = `${day.isoDate}T${end.replace(":", "")}00`;
        const dayIndex = planDays.indexOf(day);

        lines.splice(
            calendarEndIndex,
            0,
            "BEGIN:VEVENT",
            `UID:${uidFromDay(day, dayIndex)}`,
            `DTSTAMP:${stamp}`,
            `DTSTART:${startIcs}`,
            `DTEND:${endIcs}`,
            "SEQUENCE:1",
            "STATUS:CANCELLED",
            `SUMMARY:${escapeIcsText(`Siłownia - ${displayWorkoutLabel(day.type)}`)}`,
            `DESCRIPTION:${escapeIcsText("Próba anulowania całego planu wygenerowana przez G-Plan.")}`,
            "END:VEVENT",
        );
    });

    return `${lines.join("\r\n")}\r\n`;
}

function isIosSafari() {
    const userAgent = navigator.userAgent;
    const isAppleMobileDevice =
        /iP(hone|ad|od)/.test(userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isWebKitBrowser = /WebKit/i.test(userAgent);
    const isAltIosBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);

    return isAppleMobileDevice && isWebKitBrowser && !isAltIosBrowser;
}

function downloadIcsText(content, fileName) {
    const blob = new Blob([content], {
        type: "text/calendar;charset=utf-8",
    });

    if (navigator.msSaveOrOpenBlob) {
        navigator.msSaveOrOpenBlob(blob, fileName);
        return;
    }

    if (isIosSafari()) {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === "string") {
                window.location.href = reader.result;
            }
        };
        reader.readAsDataURL(blob);
        return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
        link.remove();
    }, 120);
}

function downloadIcsFile() {
    downloadIcsText(buildIcsContent(), "g-plan-aktualny-miesiac.ics");
}

function downloadCancelPlanFile() {
    const content = buildCancelPlanIcsContent();
    if (!content) {
        updateCancelPlanButton();
        return;
    }

    downloadIcsText(content, "g-plan-anuluj-caly-plan.ics");
}

function downloadSingleDayIcsFile() {
    const content = buildSingleDayIcsContent(selectedDayIndex);
    if (!content) {
        return;
    }

    const day = planDays[selectedDayIndex];
    const workoutSlug = displayWorkoutLabel(day.type)
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    downloadIcsText(
        content,
        `g-plan-${day.isoDate}-${workoutSlug || "trening"}.ics`,
    );
}

calendarGrid.addEventListener("click", (event) => {
    const target = event.target;
    const button =
        target instanceof HTMLElement ? target.closest(".day-btn") : null;
    if (!button) {
        return;
    }

    const index = Number(button.dataset.index);
    if (Number.isNaN(index) || !planDays[index]) {
        return;
    }

    openDayModal(index);
});

planHelpToggle.addEventListener("click", () => {
    togglePlanHelp();
});

planHelpClose.addEventListener("click", () => {
    togglePlanHelp(false);
});

calendarGrid.addEventListener("dragstart", (event) => {
    const target = event.target;
    const button =
        target instanceof HTMLElement ? target.closest(".day-btn") : null;
    if (!button) {
        return;
    }

    const index = Number(button.dataset.index);
    if (
        Number.isNaN(index) ||
        !planDays[index] ||
        planDays[index].type === "Wolne"
    ) {
        event.preventDefault();
        return;
    }

    draggedDayIndex = index;
    button.classList.add("dragging");

    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
    }
});

calendarGrid.addEventListener("dragover", (event) => {
    const target = event.target;
    const button =
        target instanceof HTMLElement ? target.closest(".day-btn") : null;
    if (!button || draggedDayIndex === null) {
        return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
    }
});

calendarGrid.addEventListener("dragenter", (event) => {
    const target = event.target;
    const button =
        target instanceof HTMLElement ? target.closest(".day-btn") : null;
    if (!button || draggedDayIndex === null) {
        return;
    }

    const index = Number(button.dataset.index);
    if (!Number.isNaN(index) && index !== draggedDayIndex) {
        button.classList.add("drop-target");
    }
});

calendarGrid.addEventListener("dragleave", (event) => {
    const target = event.target;
    const button =
        target instanceof HTMLElement ? target.closest(".day-btn") : null;
    if (!button) {
        return;
    }

    button.classList.remove("drop-target");
});

calendarGrid.addEventListener("drop", (event) => {
    const target = event.target;
    const button =
        target instanceof HTMLElement ? target.closest(".day-btn") : null;
    if (!button || draggedDayIndex === null) {
        return;
    }

    event.preventDefault();

    const targetIndex = Number(button.dataset.index);
    button.classList.remove("drop-target");
    if (Number.isNaN(targetIndex)) {
        draggedDayIndex = null;
        renderCalendar();
        return;
    }

    const swapped = swapDayAssignments(draggedDayIndex, targetIndex);
    const nextSelectedIndex = swapped ? targetIndex : selectedDayIndex;
    draggedDayIndex = null;
    selectedDayIndex = nextSelectedIndex;
    renderCalendar();
    updateCancelPlanButton();

    if (modalBackdrop.classList.contains("open")) {
        openDayModal(nextSelectedIndex);
    }
});

calendarGrid.addEventListener("dragend", () => {
    draggedDayIndex = null;
    calendarGrid.querySelectorAll(".day-btn").forEach((button) => {
        button.classList.remove("dragging", "drop-target");
    });
});

modalClose.addEventListener("click", closeDayModal);
modalBackdrop.addEventListener("click", (event) => {
    if (event.target === modalBackdrop) {
        closeDayModal();
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        if (!planHelpPanel.hidden) {
            togglePlanHelp(false);
        }
        closeDayModal();
    }
});

document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node) || planHelpPanel.hidden) {
        return;
    }

    const clickedInsideHelp = planHelpPanel.contains(target);
    const clickedToggle = planHelpToggle.contains(target);

    if (!clickedInsideHelp && !clickedToggle) {
        togglePlanHelp(false);
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

recalcBtn.addEventListener("click", resetPlan);
cancelPlanBtn.addEventListener("click", downloadCancelPlanFile);
downloadDayIcsBtn.addEventListener("click", downloadSingleDayIcsFile);

downloadBtn.addEventListener("click", downloadIcsFile);

initThemeToggle();
generatePlan();
renderPlanHelp();
renderCalendar();
updateCancelPlanButton();
