"use strict";

// ===== Константы =====
const STORAGE_KEY = "rolls-delivery-log";
const BASE_FEE = 150;     // базовая подача курьера, руб.
const KM_FEE = 45;       // стоимость километра, руб.
const PORTION_FEE = 90;  // стоимость одной порции, руб.

// ===== Элементы страницы =====
const form = document.getElementById("calc-form");
const distanceInput = document.getElementById("distance");
const portionsInput = document.getElementById("portions");
const rollTypeSelect = document.getElementById("roll-type");
const resultBox = document.getElementById("result");
const resultText = document.getElementById("result-text");
const logList = document.getElementById("log-list");
const logEmpty = document.getElementById("log-empty");
const clearLogBtn = document.getElementById("clear-log");

// ===== Проверка одного значения (Требование №2) =====
function validateValue(raw) {
  const value = raw.trim();

  if (value === "") {
    return { type: "empty", message: "Не забудьте указать значение — без него не посчитать стоимость роллов!" };
  }

  const normalized = value.replace(",", ".");
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(normalized) || isNaN(Number(normalized))) {
    return { type: "nan", message: "Тут нужны только цифры — иначе курьер не поймёт, сколько везти роллов 😄" };
  }

  const num = Number(normalized);

  if (num === 0) {
    return { type: "zero", message: "Ноль порций? Тогда и доставка не нужна — лучше возьмите хотя бы один сет!" };
  }

  if (num < 0) {
    return { type: "negative", message: "Отрицательное количество роллов? Такого не бывает — проверьте ввод!" };
  }

  return { type: "ok", num: num };
}

function showError(input, errorSpan, message) {
  input.classList.add("invalid");
  errorSpan.textContent = message;
}

function clearError(input, errorSpan) {
  input.classList.remove("invalid");
  errorSpan.textContent = "";
}

// ===== Расчёт стоимости =====
function calculate(distance, portions, rollCoefficient) {
  return BASE_FEE + distance * KM_FEE + portions * PORTION_FEE * rollCoefficient;
}

// ===== Журнал запросов (Требование №3) =====
function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveLog(log) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

function renderLog(log) {
  logList.innerHTML = "";

  log.forEach(function (entry) {
    const li = document.createElement("li");
    li.className = "log-item";

    const time = document.createElement("span");
    time.className = "log-time";
    time.textContent = entry.time;

    const details = document.createElement("div");
    details.textContent = entry.data;

    const total = document.createElement("div");
    total.textContent = "Итог: " + entry.result;
    total.style.fontWeight = "600";

    li.appendChild(time);
    li.appendChild(details);
    li.appendChild(total);
    logList.appendChild(li);
  });

  logEmpty.hidden = log.length > 0;
}

// ===== Обработчик формы =====
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const errorDistance = document.getElementById("error-distance");
  const errorPortions = document.getElementById("error-portions");

  const distanceCheck = validateValue(distanceInput.value);
  const portionsCheck = validateValue(portionsInput.value);

  if (distanceCheck.type !== "ok") {
