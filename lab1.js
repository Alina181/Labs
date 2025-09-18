// Шаблон интерфейса для Лабы 1
function lab1Template() {
  return `
    <h2>Лабораторная 1: Метод модифицированных жордановых исключений</h2>
    <p><strong>Пример:</strong> Система:

      Y₁ = 3X₁ - 3X₂ + 3X₃

      Y₂ = X₁ + 2X₂ - 2X₃
    </p>

    <div class="input-group">
      <label>Количество строк (m):</label>
      <input type="number" id="rows" value="2" min="1" max="10">
      <label>Количество столбцов (n):</label>
      <input type="number" id="cols" value="3" min="1" max="10">
      <button class="action" onclick="setupMatrix()">Создать матрицу</button>
    </div>

    <div id="matrix-input"></div>
    <div id="jordan-table"></div>
    <div id="steps"></div>

    <div class="controls" style="margin-top: 20px;">
      <label>Разрешающий элемент: строка </label>
      <input type="number" id="pivot-row" min="1" value="2"> 
      <label>, столбец </label>
      <input type="number" id="pivot-col" min="1" value="3">
      <button class="action" onclick="performStep()">Выполнить шаг</button>
      <button class="action" onclick="reset()">Сбросить</button>
    </div>
  `;
}

let currentMatrix = [];
let variables = []; // Например: ["X₁", "X₂", "X₃"]
let outputs = [];   // Например: ["Y₁", "Y₂"]

function setupMatrix() {
  const m = parseInt(document.getElementById("rows").value);
  const n = parseInt(document.getElementById("cols").value);

  let html = '<h3>Заполните матрицу коэффициентов</h3><table border="1" cellpadding="5" cellspacing="0">';
  html += '<tr><th></th>';
  for (let j = 0; j < n; j++) {
    html += `<th>X<sub>${j + 1}</sub></th>`;
  }
  html += '</tr>';

  for (let i = 0; i < m; i++) {
    html += `<tr><td>Y<sub>${i + 1}</sub></td>`;
    for (let j = 0; j < n; j++) {
      const val = getDefault(i, j);
      html += `<td><input type="number" id="cell-${i}-${j}" value="${val}" step="any" style="width:60px;"></td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  html += '<button class="action" onclick="loadMatrix()">Загрузить</button>';

  document.getElementById("matrix-input").innerHTML = html;
  document.getElementById("jordan-table").innerHTML = '';
  document.getElementById("steps").innerHTML = '';
}

function getDefault(i, j) {
  // Матрица коэффициентов при X (с противоположным знаком)
  const example = [
    [-3, 5, -3],  // Y1 = 3X1 - 3X2 + 3X3 -> -3X1 + 5X2 - 3X3
    [-1, -2, 2]   // Y2 = X1 + 2X2 - 2X3 -> -1X1 - 2X2 + 2X3
  ];
  return example[i]?.[j] ?? 0;
}

function loadMatrix() {
  const m = parseInt(document.getElementById("rows").value);
  const n = parseInt(document.getElementById("cols").value);

  currentMatrix = [];
  variables = Array.from({ length: n }, (_, i) => `X${i + 1}`);
  outputs = Array.from({ length: m }, (_, i) => `Y${i + 1}`);

  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      let val = parseFloat(document.getElementById(`cell-${i}-${j}`).value);
      if (Number.isNaN(val)) val = 0;
      row.push(val);
    }
    currentMatrix.push(row);
  }

  renderTable();
  logStep("Исходная таблица создана.");
  logStep("Формат: Yᵢ = Σ(aᵢⱼ * Xⱼ)");
}

function renderTable() {
  const tableEl = document.getElementById("jordan-table");
  let html = '<h3>Жорданова таблица</h3><table border="1" cellpadding="5" cellspacing="0">';
  
  // Верхняя строка: переменные (X)
  html += '<tr><th></th>';
  variables.forEach(v => {
    html += `<th>${v}</th>`;
  });
  html += '</tr>';

  // Строки: Y_i
  for (let i = 0; i < currentMatrix.length; i++) {
    html += `<tr><td>${outputs[i]}</td>`;
    for (let j = 0; j < currentMatrix[i].length; j++) {
      html += `<td>${formatNumber(currentMatrix[i][j])}</td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  tableEl.innerHTML = html;
}

function formatNumber(num) {
  if (Math.abs(num) < 1e-12) return "0";
  const rounded = Math.round(num * 1000) / 1000;
  if (Number.isInteger(rounded)) return rounded.toString();
  
  // Представление дробей
  const fraction =


toFraction(Math.abs(num));
  if (fraction) {
    return (num < 0 ? '-' : '') + fraction;
  }
  return rounded.toString();
}

function toFraction(num) {
  const tolerance = 1.0E-6;
  let h1 = 1, h2 = 0;
  let k1 = 0, k2 = 1;
  let b = num;
  
  do {
    const a = Math.floor(b);
    let aux = h1;
    h1 = a * h1 + h2;
    h2 = aux;
    aux = k1;
    k1 = a * k1 + k2;
    k2 = aux;
    b = 1 / (b - a);
  } while (Math.abs(num - h1 / k1) > num * tolerance);
  
  if (k1 === 1) return h1.toString();
  return h1 + '/' + k1;
}

function logStep(text) {
  const stepsEl = document.getElementById("steps");
  const div = document.createElement("div");
  div.className = "step-info";
  div.textContent = text;
  stepsEl.appendChild(div);
  stepsEl.scrollTop = stepsEl.scrollHeight;
}

function performStep() {
  if (!currentMatrix.length) {
    alert("Сначала загрузите матрицу!");
    return;
  }

  const r = parseInt(document.getElementById("pivot-row").value) - 1; // индекс строки
  const s = parseInt(document.getElementById("pivot-col").value) - 1; // индекс столбца

  const rows = currentMatrix.length;
  const cols = currentMatrix[0].length;

  if (r < 0 || r >= rows || s < 0 || s >= cols) {
    alert("Неверные индексы разрешающего элемента!");
    return;
  }

  const pivot = currentMatrix[r][s];
  if (Math.abs(pivot) < 1e-10) {
    alert("Разрешающий элемент не может быть нулём!");
    return;
  }

  logStep(`Шаг: разрешающий элемент a[${r + 1},${s + 1}] = ${formatNumber(pivot)}`);

  const newMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  // 1. Разрешающая строка: делим на pivot
  for (let j = 0; j < cols; j++) {
    newMatrix[r][j] = currentMatrix[r][j] / pivot;
  }

  // 2. Разрешающий столбец: делим на -pivot
  for (let i = 0; i < rows; i++) {
    if (i !== r) {
      newMatrix[i][s] = -currentMatrix[i][s] / pivot;
    }
  }

  // 3. Остальные элементы: a[i][j] - (a[i][s] * a[r][j]) / pivot
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (i !== r && j !== s) {
        newMatrix[i][j] = currentMatrix[i][j] - (currentMatrix[i][s] * currentMatrix[r][j]) / pivot;
      }
    }
  }

  // 4. Разрешающий элемент: 1/pivot
  newMatrix[r][s] = 1 / pivot;

  // Меняем местами переменные
  const oldVar = variables[s];
  const oldOut = outputs[r];
  variables[s] = oldOut;
  outputs[r] = oldVar;

  currentMatrix = newMatrix;
  renderTable();

  logStep(`Переменная ${oldVar} заменена на ${oldOut}`);
  logStep(`Выражение ${oldOut} заменено на ${oldVar}`);
}

function reset() {
  document.getElementById("matrix-input").innerHTML = '';
  document.getElementById("jordan-table").innerHTML = '';
  document.getElementById("steps").innerHTML = '';
  currentMatrix = [];
  variables = [];
  outputs = [];
}