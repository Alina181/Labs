var Lab3 = {
  currentMatrix: null,
  iteration: 0,
  maxIterations: 10,
  mode: "max",
  status: "init",
  inputMode: 1,
  stepHistory: []
};

function lab3Template() {
  return `
    <h2>Лабораторная 3: Метод искусственного базиса (М-метод)</h2>

    <div class="input-group">
      <label><input type="radio" name="lab3-mode" value="1" checked onchange="Lab3.switchMode(1)"> Режим 1: Ввод базиса (таблицы)</label>
      <label><input type="radio" name="lab3-mode" value="2" onchange="Lab3.switchMode(2)"> Режим 2: Ввод уравнений</label>
    </div>

    <div id="lab3-mode-content"></div>
    <div id="lab3-output-container"></div>

    <div class="controls">
      <button class="action" onclick="Lab3.step()">Следующий шаг</button>
      <button class="action" onclick="Lab3.solveAll()">Решить до конца</button>
      <button class="action" onclick="Lab3.reset()">Сбросить</button>
      <button class="action" onclick="Lab3.loadExample1()">Пример 1: Уравнения с равенствами</button>
      <button class="action" onclick="Lab3.loadExample2()">Пример 2: Ограничения типа ≤</button>
    </div>
  `;
}

Lab3.switchMode = function (mode) {
  Lab3.inputMode = mode;
  Lab3.reset();
  if (mode === 1) {
    Lab3.renderMode1();
  } else {
    Lab3.renderMode2();
  }
};

Lab3.renderMode1 = function () {
  document.getElementById("lab3-mode-content").innerHTML = `
    <h3>Режим 1: Ввод базисной таблицы</h3>
    <div class="input-group">
      <label>Направление:</label>
      <select id="lab3-mode1-optimization" style="width:80px;">
        <option value="max">max</option>
        <option value="min">min</option>
      </select>
      <label>Число строк:</label>
      <input type="number" id="lab3-rows1" value="3" min="1" max="8" style="width:60px;">
      <label>Число переменных:</label>
      <input type="number" id="lab3-vars1" value="2" min="1" max="6" style="width:60px;">
      <button class="action" onclick="Lab3.setupInputMatrix1()">Создать таблицу</button>
    </div>
    <div id="lab3-matrix-input1"></div>
  `;
  document.getElementById("lab3-output-container").innerHTML = "";
};

Lab3.renderMode2 = function () {
  document.getElementById("lab3-mode-content").innerHTML = `
    <h3>Режим 2: Ввод уравнений</h3>
    <div class="input-group">
      <label>Направление:</label>
      <select id="lab3-mode2-optimization" style="width:80px;">
        <option value="max">max</option>
        <option value="min">min</option>
      </select>
      <label>Число уравнений:</label>
      <input type="number" id="lab3-eqs" value="3" min="1" max="6" style="width:60px;">
      <label>Число переменных:</label>
      <input type="number" id="lab3-vars2" value="5" min="1" max="6" style="width:60px;">
      <button class="action" onclick="Lab3.setupInputEquations()">Создать уравнения</button>
    </div>
    <div id="lab3-equations-input"></div>
  `;
  document.getElementById("lab3-output-container").innerHTML = "";
};

Lab3.reset = function () {
  Lab3.currentMatrix = null;
  Lab3.iteration = 0;
  Lab3.status = "init";
  Lab3.stepHistory = [];
  document.getElementById("lab3-output-container").innerHTML = "";
};

Lab3.appendOutput = function (html) {
  var container = document.getElementById("lab3-output-container");
  container.innerHTML += html;
};

// =============== Режим 1 ===============
Lab3.setupInputMatrix1 = function () {
  const m = parseInt(document.getElementById("lab3-rows1").value) || 3;
  const n = parseInt(document.getElementById("lab3-vars1").value) || 2;
  const mode = document.getElementById("lab3-mode1-optimization").value || "max";

  let html = '<h4>Введите матрицу (направление: ' + mode + ')</h4><table border="1" cellpadding="6" cellspacing="0">';
  
  // Заголовки столбцов
  html += '<tr><th></th><th>b (св.члены)</th>';
  for (let j = 1; j <= n; j++) html += `<th>x<sub>${j}</sub></th>`;
  html += '</tr>';

  // Строки ограничений
  for (let i = 0; i < m; i++) {
    html += `<tr><td>Огр. ${i + 1}</td>`;
    for (let j = 0; j <= n; j++) {
      const def = (j === 0) ? (i * 10 + 10) : (i === j - 1 ? 1 : 0);
      html += `<td><input type="number" id="m1-${i}-${j}" value="${def}" step="any" style="width:70px;"></td>`;
    }
    html += '</tr>';
  }
  
  // Строка целевой функции F
  html += `<tr><td><strong>F (${mode})</strong></td>`;
  // Первый столбец (свободный член) для F
  html += `<td><input type="number" id="m1-f-0" value="0" step="any" style="width:70px;"></td>`;
  
  // Коэффициенты при переменных для F
  for (let j = 1; j <= n; j++) {
    const def = mode === "max" ? j : -j;
    html += `<td><input type="number" id="m1-f-${j}" value="${def}" step="any" style="width:70px;"></td>`;
  }
  html += '</tr></table>';
  
  html += '<button class="action" onclick="Lab3.loadMatrixMode1()">Построить М-таблицу</button>';

  document.getElementById("lab3-matrix-input1").innerHTML = html;
};

Lab3.loadMatrixMode1 = function () {
  const m = parseInt(document.getElementById("lab3-rows1").value) || 3;
  const n = parseInt(document.getElementById("lab3-vars1").value) || 2;
  Lab3.mode = document.getElementById("lab3-mode1-optimization").value || "max";

  const b = [], A = [], f = [];
  
  // Чтение ограничений
  for (let i = 0; i < m; i++) {
    b.push(parseFloat(document.getElementById(`m1-${i}-0`).value) || 0);
    const row = [];
    for (let j = 1; j <= n; j++) {
      row.push(parseFloat(document.getElementById(`m1-${i}-${j}`).value) || 0);
    }
    A.push(row);
  }
  
  // Чтение целевой функции
  const f0 = parseFloat(document.getElementById(`m1-f-0`).value) || 0;
  for (let j = 1; j <= n; j++) {
    f.push(parseFloat(document.getElementById(`m1-f-${j}`).value) || 0);
  }

  Lab3.buildMTableFromData(m, n, A, b, f, f0);
};

// =============== Режим 2 ===============
Lab3.setupInputEquations = function () {
  const eqs = parseInt(document.getElementById("lab3-eqs").value) || 3;
  const n = parseInt(document.getElementById("lab3-vars2").value) || 5;
  const mode = document.getElementById("lab3-mode2-optimization").value || "max";

  let html = '<h4>Введите уравнения (направление: ' + mode + ')</h4><table border="1" cellpadding="6" cellspacing="0">';
  for (let i = 0; i < eqs; i++) {
    html += `<tr><td>Ур. ${i + 1}:</td>`;
    for (let j = 0; j < n; j++) {
      const def = (i === j) ? 1 : 0;
      html += `<td><input type="number" id="eq-${i}-${j}" value="${def}" step="any" style="width:60px;">x<sub>${j + 1}</sub></td>`;
    }
    html += `<td>
        <select id="eq-sign-${i}" style="width:60px;">
          <option value="le">≤</option>
          <option value="ge">≥</option>
          <option value="eq">=</option>
        </select>
      </td>`;
    html += `<td><input type="number" id="eq-b-${i}" value="${3 + i * 3}" step="any" style="width:70px;"></td></tr>`;
  }
  html += `<tr><td><strong>F (${mode})</strong>:</td>`;
  html += '<td><input type="number" id="eq-f0" value="0" step="any" style="width:60px;"></td>';
  for (let j = 0; j < n; j++) {
    const def = (mode === "max") ? 1 : -1;
    html += `<td><input type="number" id="eq-f-${j}" value="${def}" step="any" style="width:60px;">x<sub>${j + 1}</sub></td>`;
  }
  html += '<td colspan="2"></td></tr></table>';
  html += '<button class="action" onclick="Lab3.loadEquationsMode2()">Привести к каноническому виду</button>';

  document.getElementById("lab3-equations-input").innerHTML = html;
};

Lab3.formatEquation = function (coeffs, sign, b, varCount) {
  let terms = [];
  for (let j = 0; j < varCount; j++) {
    let c = coeffs[j];
    if (Math.abs(c) < 1e-10) continue;
    let signStr = c >= 0 ? "+" : "-";
    let absC = Math.abs(c);
    let numStr = (absC === 1) ? "" : absC.toString();
    let term = signStr + numStr + "x" + (j + 1);
    if (terms.length === 0 && c > 0) term = numStr + "x" + (j + 1);
    terms.push(term);
  }
  let left = terms.join(" ").replace(/^\+/, "");
  let signMap = { le: "≤", ge: "≥", eq: "=" };
  return `${left} ${signMap[sign]} ${b}`;
};

Lab3.loadEquationsMode2 = function () {
  const eqs = parseInt(document.getElementById("lab3-eqs").value) || 3;
  const n = parseInt(document.getElementById("lab3-vars2").value) || 5;
  Lab3.mode = document.getElementById("lab3-mode2-optimization").value || "max";

  const A = [], b = [], signs = [], f = [];
  for (let i = 0; i < eqs; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      row.push(parseFloat(document.getElementById(`eq-${i}-${j}`).value) || 0);
    }
    A.push(row);
    b.push(parseFloat(document.getElementById(`eq-b-${i}`).value) || 0);
    signs.push(document.getElementById(`eq-sign-${i}`).value);
  }
  
  const f0 = parseFloat(document.getElementById(`eq-f0`).value) || 0;
  for (let j = 0; j < n; j++) {
    f.push(parseFloat(document.getElementById(`eq-f-${j}`).value) || 0);
  }

  let direction = (Lab3.mode === "max") ? "Максимизировать" : "Минимизировать";
  let originalEqHTML = '<h3>Исходная задача:</h3><p><strong>' + direction + '</strong><br>F = ';
  
  // Добавляем свободный член, если он не нулевой
  if (Math.abs(f0) > 1e-10) {
    originalEqHTML += f0.toFixed(2);
  }
  
  let fTerms = [];
  for (let j = 0; j < n; j++) {
    if (Math.abs(f[j]) > 1e-10) {
      let sign = f[j] >= 0 ? "+" : "-";
      let absF = Math.abs(f[j]);
      let numStr = (absF === 1) ? "" : absF.toString();
      let term = sign + numStr + "x" + (j + 1);
      if (fTerms.length === 0 && f[j] > 0) term = numStr + "x" + (j + 1);
      fTerms.push(term);
    }
  }
  
  let fStr = fTerms.join(" ").replace(/^\+/, "");
  if (Math.abs(f0) > 1e-10 && fStr.length > 0 && fStr[0] !== '-') {
    originalEqHTML += " + " + fStr;
  } else if (fStr.length > 0) {
    originalEqHTML += fStr;
  }
  
  originalEqHTML += '</p><p><strong>при ограничениях:</strong></p><ul>';
  for (let i = 0; i < eqs; i++) {
    originalEqHTML += '<li>' + Lab3.formatEquation(A[i], signs[i], b[i], n) + '</li>';
  }
  originalEqHTML += '</ul>';
  Lab3.appendOutput(originalEqHTML);

  let canonicalHTML = '<h3>Канонический вид:</h3><p><strong>' + direction + '</strong><br>F = ';
  
  // Добавляем свободный член
  if (Math.abs(f0) > 1e-10) {
    canonicalHTML += f0.toFixed(2);
  }
  
  fTerms = [];
  for (let j = 0; j < n; j++) {
    if (Math.abs(f[j]) > 1e-10) {
      let sign = f[j] >= 0 ? "+" : "-";
      let absF = Math.abs(f[j]);
      let numStr = (absF === 1) ? "" : absF.toString();
      let term = sign + numStr + "x" + (j + 1);
      if (fTerms.length === 0 && f[j] > 0) term = numStr + "x" + (j + 1);
      fTerms.push(term);
    }
  }
  
  fStr = fTerms.join(" ").replace(/^\+/, "");
  if (Math.abs(f0) > 1e-10 && fStr.length > 0 && fStr[0] !== '-') {
    canonicalHTML += " + " + fStr;
  } else if (fStr.length > 0) {
    canonicalHTML += fStr;
  }
  
  canonicalHTML += '</p><p><strong>при ограничениях:</strong></p><ul>';

  // Подсчет дополнительных и искусственных переменных
  let slackCount = 0;
  let artificialCount = 0;
  
  for (let i = 0; i < eqs; i++) {
    if (signs[i] === "le" || signs[i] === "ge") slackCount++;
    if (signs[i] === "ge" || signs[i] === "eq") artificialCount++;
  }

  let totalVarsInCanonical = n + slackCount + artificialCount;
  let currentVarIndex = n + 1;
  
  for (let i = 0; i < eqs; i++) {
    let terms = [];
    
    // Основные переменные
    for (let j = 0; j < n; j++) {
      if (Math.abs(A[i][j]) > 1e-10) {
        let c = A[i][j];
        let sign = c >= 0 ? "+" : "-";
        let absC = Math.abs(c);
        let numStr = (absC === 1) ? "" : absC.toString();
        let term = sign + numStr + "x" + (j + 1);
        if (terms.length === 0 && c > 0) term = numStr + "x" + (j + 1);
        terms.push(term);
      }
    }

    // Добавляем дополнительные/искусственные переменные
    if (signs[i] === "le") {
      terms.push("+x" + currentVarIndex);
      currentVarIndex++;
    } else if (signs[i] === "ge") {
      terms.push("-x" + currentVarIndex);
      currentVarIndex++;
      terms.push("+x" + currentVarIndex);
      currentVarIndex++;
    } else if (signs[i] === "eq") {
      terms.push("+x" + currentVarIndex);
      currentVarIndex++;
    }

    let eqStr = terms.join(" ").replace(/^\+/, "") + " = " + b[i];
    canonicalHTML += '<li>' + eqStr + '</li>';
  }
  canonicalHTML += '</ul>';
  canonicalHTML += '<p><strong>Условие неотрицательности:</strong><br>';
  canonicalHTML += 'x₁ ≥ 0, x₂ ≥ 0, ..., x<sub>' + totalVarsInCanonical + '</sub> ≥ 0</p>';
  
  if (artificialCount > 0) {
    canonicalHTML += '<p><em>Примечание: Переменные x<sub>' + (n + slackCount + 1) + '</sub>...x<sub>' + totalVarsInCanonical + '</sub> — искусственные переменные.</em></p>';
  }
  
  Lab3.appendOutput(canonicalHTML);

  // Строим расширенную матрицу для М-метода
  let artificialCountActual = 0;
  for (let i = 0; i < eqs; i++) {
    if (signs[i] === "ge" || signs[i] === "eq") artificialCountActual++;
  }

  const totalVars = n + slackCount + artificialCountActual;
  const fullA = [];
  const fullB = [];
  let artIndex = 0;
  let slackIndex = 0;

  for (let i = 0; i < eqs; i++) {
    const row = new Array(totalVars).fill(0);
    
    // Основные переменные
    for (let j = 0; j < n; j++) row[j] = A[i][j];

    if (signs[i] === "le") {
      row[n + slackIndex] = 1;
      slackIndex++;
    } else if (signs[i] === "ge") {
      row[n + slackIndex] = -1;
      slackIndex++;
      row[n + slackCount + artIndex] = 1;
      artIndex++;
    } else {
      row[n + slackCount + artIndex] = 1;
      artIndex++;
    }
    fullA.push(row);
    fullB.push(b[i]);
  }

  // Определяем, нужно ли создавать M-строку
  const totalRows = eqs + 1 + (artificialCountActual > 0 ? 1 : 0);
  const data = Array(totalRows).fill(null).map(() => Array(1 + n).fill(0)); // Только n столбцов для основных переменных

  for (let i = 0; i < eqs; i++) {
    data[i][0] = fullB[i];
    // Только коэффициенты при основных переменных
    for (let j = 0; j < n; j++) data[i][1 + j] = fullA[i][j];
  }

  // Строка целевой функции f
  const fRow = eqs;
  data[fRow][0] = f0;
  for (let j = 0; j < n; j++) {
    const coeff = (Lab3.mode === "max") ? -f[j] : f[j];
    data[fRow][1 + j] = coeff;
  }

  // Строка искусственной целевой функции g (M-строка)
  if (artificialCountActual > 0) {
    const gRow = eqs + 1;
    data[gRow][0] = 0;
    for (let i = 0; i < eqs; i++) {
      if (signs[i] === "ge" || signs[i] === "eq") {
        data[gRow][0] -= fullB[i];
        for (let j = 0; j < n; j++) data[gRow][1 + j] -= fullA[i][j];
      }
    }
  }

  // Формируем метки столбцов: только 1 и основные переменные
  const colLabels = ["1"];
  for (let j = 1; j <= n; j++) colLabels.push(`x${j}`);

  // Формируем метки строк (базисные переменные)
  const rowLabels = [];
  let varCounter = n + 1;
  for (let i = 0; i < eqs; i++) {
    if (signs[i] === "le") {
      rowLabels.push(`x${varCounter}`);
      varCounter++;
    } else if (signs[i] === "ge") {
      rowLabels.push(`x${varCounter + 1}`);
      varCounter += 2;
    } else {
      rowLabels.push(`x${varCounter}`);
      varCounter++;
    }
  }
  rowLabels.push("f");
  if (artificialCountActual > 0) {
    rowLabels.push("g");
  }

  // Очищаем нули
  Lab3.currentMatrix = {
    data: data.map(function(row) {
      return row.map(function(x) { 
        const val = parseFloat(x.toFixed(10));
        return Math.abs(val) < 1e-12 ? 0 : val;
      });
    }),
    rowLabels: rowLabels,
    colLabels: colLabels,
    hasArtificial: artificialCountActual > 0,
    fullA: fullA,
    fullB: fullB,
    n: n,
    eqs: eqs
  };

  Lab3.startSolving();
};

// =============== Общая логика построения М-таблицы ===============
Lab3.buildMTableFromData = function (m, n, A, b, f, f0 = 0) {
  const totalCols = 1 + n; // Только 1 + основные переменные
  const totalRows = m + 1 + 1; // ограничения + f + g
  
  const data = Array(totalRows).fill(null).map(() => Array(totalCols).fill(0));

  // Заполняем ограничения
  for (let i = 0; i < m; i++) {
    data[i][0] = b[i];
    for (let j = 0; j < n; j++) data[i][1 + j] = A[i][j];
  }

  // Строка целевой функции f
  const fRow = m;
  data[fRow][0] = f0;
  for (let j = 0; j < n; j++) {
    const coeff = (Lab3.mode === "max") ? -f[j] : f[j];
    data[fRow][1 + j] = coeff;
  }

  // Строка искусственной целевой функции g
  const gRow = m + 1;
  data[gRow][0] = 0;
  
  // В режиме 1 g строка не используется, оставляем нули
  for (let j = 1; j <= n; j++) {
    data[gRow][j] = 0;
  }

  const colLabels = ["1"];
  for (let j = 1; j <= n; j++) colLabels.push(`x${j}`);

  const rowLabels = [];
  for (let i = 1; i <= m; i++) rowLabels.push(`x${n + i}`);
  rowLabels.push("f");
  rowLabels.push("g");

  Lab3.currentMatrix = {
    data: data.map(function(row) {
      return row.map(function(x) { 
        const val = parseFloat(x.toFixed(10));
        return Math.abs(val) < 1e-12 ? 0 : val;
      });
    }),
    rowLabels: rowLabels,
    colLabels: colLabels,
    hasArtificial: false,
    m: m,
    n: n
  };

  Lab3.startSolving();
};

// =============== Вывод шагов ===============
Lab3.startSolving = function () {
  Lab3.iteration = 0;
  Lab3.status = "solving";
  Lab3.appendOutput('<h3>Начальная таблица (направление: ' + Lab3.mode + '):</h3>');
  Lab3.renderCurrentStep();
};

Lab3.renderTableHTML = function (M) {
  let html = '<table border="1" cellpadding="6" cellspacing="0" style="font-family: monospace; text-align: right; margin: 10px 0;">';
  html += '<tr><th></th>';
  for (let j = 0; j < M.colLabels.length; j++) {
    html += '<th>' + M.colLabels[j] + '</th>';
  }
  html += '</tr>';

  for (let i = 0; i < M.rowLabels.length; i++) {
    html += '<tr><td style="text-align: left; font-weight: bold;">' + M.rowLabels[i] + '</td>';
    for (let j = 0; j < M.data[i].length; j++) {
      let val = M.data[i][j];
      if (Math.abs(val) < 1e-12) val = 0;
      val = Math.round(val * 10000) / 10000;
      let isB = (j === 0);
      let bgColor = isB ? '#f9f9ff' : 'transparent';
      if (M.rowLabels[i] === 'f') bgColor = '#fff0f0';
      if (M.rowLabels[i] === 'g') bgColor = '#f0fff0';
      html += '<td style="background-color: ' + bgColor + ';">' + val + '</td>';
    }
    html += '</tr>';
  }
  html += '</table>';
  return html;
};

Lab3.formatSolution = function (M) {
  let totalVars = 0;
  let allLabels = M.colLabels.concat(M.rowLabels);
  for (let i = 0; i < allLabels.length; i++) {
    let label = allLabels[i];
    let match = label.match(/^x(\d+)$/);
    if (match) {
      let num = parseInt(match[1], 10);
      if (num > totalVars) totalVars = num;
    }
  }

  let result = new Array(totalVars).fill(0.0);
  for (let i = 0; i < M.rowLabels.length; i++) {
    let label = M.rowLabels[i];
    let match = label.match(/^x(\d+)$/);
    if (match) {
      let idx = parseInt(match[1], 10) - 1;
      if (idx >= 0 && idx < result.length) {
        result[idx] = M.data[i][0];
      }
    }
  }

  let fVal = M.data[M.rowLabels.indexOf("f")][0];
  let gRowIndex = M.rowLabels.indexOf("g");
  let gVal = gRowIndex >= 0 ? M.data[gRowIndex][0] : 0;
  let fStr = "";
  
  // Учитываем направление оптимизации при выводе значения F
  let finalFVal = (Lab3.mode === "max") ? fVal : -fVal;
  
  if (Math.abs(gVal) < 1e-10) {
    fStr = "F = " + finalFVal.toFixed(4);
  } else if (gVal < 0) {
    fStr = "F = " + finalFVal.toFixed(4) + " - " + Math.abs(gVal).toFixed(4) + "M";
  } else {
    fStr = "F = " + finalFVal.toFixed(4) + " + " + gVal.toFixed(4) + "M";
  }

  let nonZeroVars = [];
  for (let i = 0; i < result.length; i++) {
    if (Math.abs(result[i]) > 1e-10) {
      nonZeroVars.push("x" + (i + 1) + "=" + result[i].toFixed(4));
    }
  }

  return {
    fStr: fStr,
    vars: nonZeroVars.length ? nonZeroVars.join(" ") : "все нулевые"
  };
};

Lab3.renderCurrentStep = function () {
  if (!Lab3.currentMatrix) return;

  let tableHTML = Lab3.renderTableHTML(Lab3.currentMatrix);
  let sol = Lab3.formatSolution(Lab3.currentMatrix);

  let stepHTML = "";
  if (Lab3.iteration === 0) {
    stepHTML = '<div class="lab3-step">' + tableHTML;
  } else {
    stepHTML = '<div class="lab3-step"><h4>Итерация ' + Lab3.iteration + ':</h4>' + tableHTML;
  }
  stepHTML += '<p><strong>' + sol.fStr + '</strong></p>';
  stepHTML += '<p><strong>Переменные:</strong> ' + sol.vars + '</p></div>';
  Lab3.appendOutput(stepHTML);
};

// =============== Жорданово исключение ===============
Lab3.copyMatrix = function (M) {
  return {
    data: M.data.map(function(row) { return row.slice(); }),
    rowLabels: M.rowLabels.slice(),
    colLabels: M.colLabels.slice(),
    hasArtificial: M.hasArtificial || false,
    m: M.m || 0,
    n: M.n || 0
  };
};

Lab3.jordanStep = function (M, k, s) {
  const permissive = M.data[k][s];
  if (Math.abs(permissive) < 1e-10) {
    return { matrix: M, error: "Разрешающий элемент ≈ 0" };
  }

  const newM = Lab3.copyMatrix(M);
  const rows = newM.data.length;
  const cols = newM.data[0].length;

  var temp = newM.colLabels[s];
  newM.colLabels[s] = newM.rowLabels[k];
  newM.rowLabels[k] = temp;

  for (var j = 0; j < cols; j++) newM.data[k][j] = M.data[k][j] / permissive;
  for (var i = 0; i < rows; i++) {
    if (i !== k) newM.data[i][s] = -M.data[i][s] / permissive;
  }
  for (var i = 0; i < rows; i++) {
    for (var j = 0; j < cols; j++) {
      if (i !== k && j !== s) {
        newM.data[i][j] = M.data[i][j] - (M.data[i][s] * M.data[k][j]) / permissive;
      }
    }
  }
  newM.data[k][s] = 1.0 / permissive;
  return { matrix: newM, error: null };
};

Lab3.getKS = function (M) {
  const rows = M.data.length;
  const cols = M.data[0].length;
  if (rows < 1 || cols < 2) return { k: -1, s: -1 };

  // Определяем, по какой строке искать разрешающий столбец
  let targetRow = rows - 1;
  if (!M.hasArtificial && rows > 0) {
    targetRow = rows - 1;
  }

  const searchRow = M.data[targetRow].slice(1);
  let pivotColIdx = -1;

  if (Lab3.mode === "max") {
    let minVal = Math.min.apply(null, searchRow);
    if (targetRow === rows - 1 && M.hasArtificial) {
      if (minVal >= -1e-10) {
        const fRowIdx = rows - 2;
        const fRow = M.data[fRowIdx].slice(1);
        minVal = Math.min.apply(null, fRow);
        if (minVal >= -1e-10) return { k: -1, s: -1 };
        pivotColIdx = fRow.indexOf(minVal);
        targetRow = fRowIdx;
      } else {
        pivotColIdx = searchRow.indexOf(minVal);
      }
    } else {
      if (minVal >= -1e-10) return { k: -1, s: -1 };
      pivotColIdx = searchRow.indexOf(minVal);
    }
  } else {
    let maxVal = Math.max.apply(null, searchRow);
    if (targetRow === rows - 1 && M.hasArtificial) {
      if (maxVal <= 1e-10) {
        const fRowIdx = rows - 2;
        const fRow = M.data[fRowIdx].slice(1);
        maxVal = Math.max.apply(null, fRow);
        if (maxVal <= 1e-10) return { k: -1, s: -1 };
        pivotColIdx = fRow.indexOf(maxVal);
        targetRow = fRowIdx;
      } else {
        pivotColIdx = searchRow.indexOf(maxVal);
      }
    } else {
      if (maxVal <= 1e-10) return { k: -1, s: -1 };
      pivotColIdx = searchRow.indexOf(maxVal);
    }
  }

  const pivotCol = pivotColIdx + 1;
  let pivotRow = -1, minRatio = Infinity;
  for (let i = 0; i < rows - (M.hasArtificial ? 2 : 1); i++) {
    const a = M.data[i][pivotCol];
    if (a > 1e-10) {
      const ratio = M.data[i][0] / a;
      if (ratio >= -1e-10 && ratio < minRatio) {
        minRatio = ratio;
        pivotRow = i;
      }
    }
  }

  if (pivotRow === -1) return { k: -1, s: 0 };
  return { k: pivotRow, s: pivotCol };
};

Lab3.step = function () {
  if (!Lab3.currentMatrix || Lab3.status !== "solving") {
    alert("Сначала постройте таблицу!");
    return;
  }

  let ks = Lab3.getKS(Lab3.currentMatrix);
  if (ks.k === -1 && ks.s === -1) {
    let hasArtificialInBasis = false;
    if (Lab3.currentMatrix.hasArtificial) {
      for (let i = 0; i < Lab3.currentMatrix.rowLabels.length - 2; i++) {
        let label = Lab3.currentMatrix.rowLabels[i];
        if (label.startsWith('x')) {
          let num = parseInt(label.substring(1));
          let totalOriginalVars = Lab3.currentMatrix.colLabels.length - 1;
          let totalRows = Lab3.currentMatrix.rowLabels.length - (Lab3.currentMatrix.hasArtificial ? 2 : 1);
          if (num > totalOriginalVars - totalRows) {
            hasArtificialInBasis = true;
            break;
          }
        }
      }
    }
    
    if (hasArtificialInBasis) {
      Lab3.appendOutput('<div class="lab3-step"><p>⚠️ <strong>Искусственные переменные остались в базисе. Возможно, задача не имеет допустимого решения.</strong></p></div>');
    } else {
      Lab3.appendOutput('<div class="lab3-step"><p>✅ <strong>Оптимальный план найден! (направление: ' + Lab3.mode + ')</strong></p></div>');
    }
    Lab3.status = "optimal";
    return;
  } else if (ks.k === -1 && ks.s === 0) {
    Lab3.appendOutput('<div class="lab3-step"><p>❌ <strong>Система не ограничена!</strong></p></div>');
    Lab3.status = "unbounded";
    return;
  }

  Lab3.iteration++;
  let result = Lab3.jordanStep(Lab3.currentMatrix, ks.k, ks.s);
  if (result.error) {
    Lab3.appendOutput('<div class="lab3-step"><p>Ошибка: ' + result.error + '</p></div>');
    return;
  }

  Lab3.currentMatrix = result.matrix;
  Lab3.renderCurrentStep();

  if (Lab3.iteration >= Lab3.maxIterations) {
    Lab3.appendOutput('<div class="lab3-step"><p>⚠️ Достигнуто максимальное число итераций.</p></div>');
  }
};

Lab3.solveAll = function () {
  if (!Lab3.currentMatrix || Lab3.status !== "solving") {
    alert("Сначала постройте таблицу!");
    return;
  }

  while (Lab3.status === "solving" && Lab3.iteration < Lab3.maxIterations) {
    let ks = Lab3.getKS(Lab3.currentMatrix);
    if (ks.k === -1 && ks.s === -1) {
      let hasArtificialInBasis = false;
      if (Lab3.currentMatrix.hasArtificial) {
        for (let i = 0; i < Lab3.currentMatrix.rowLabels.length - 2; i++) {
          let label = Lab3.currentMatrix.rowLabels[i];
          if (label.startsWith('x')) {
            let num = parseInt(label.substring(1));
            let totalOriginalVars = Lab3.currentMatrix.colLabels.length - 1;
            let totalRows = Lab3.currentMatrix.rowLabels.length - (Lab3.currentMatrix.hasArtificial ? 2 : 1);
            if (num > totalOriginalVars - totalRows) {
              hasArtificialInBasis = true;
              break;
            }
          }
        }
      }
      
      if (hasArtificialInBasis) {
        Lab3.appendOutput('<div class="lab3-step"><p>⚠️ <strong>Искусственные переменные остались в базисе. Возможно, задача не имеет допустимого решения.</strong></p></div>');
      } else {
        Lab3.appendOutput('<div class="lab3-step"><p>✅ <strong>Оптимальный план найден! (направление: ' + Lab3.mode + ')</strong></p></div>');
      }
      Lab3.status = "optimal";
      break;
    } else if (ks.k === -1 && ks.s === 0) {
      Lab3.appendOutput('<div class="lab3-step"><p>❌ <strong>Система не ограничена!</strong></p></div>');
      Lab3.status = "unbounded";
      break;
    }

    Lab3.iteration++;
    let result = Lab3.jordanStep(Lab3.currentMatrix, ks.k, ks.s);
    if (result.error) {
      Lab3.appendOutput('<div class="lab3-step"><p>Ошибка: ' + result.error + '</p></div>');
      break;
    }
    Lab3.currentMatrix = result.matrix;
    Lab3.renderCurrentStep();
  }
};

// =============== Пример 1: Уравнения с =
Lab3.loadExample1 = function () {
  Lab3.mode = "max";

  const A = [
    [1, -4, 2, -5, 9],
    [0, 1, -3, 4, -5],
    [0, 1, -1, 1, -1]
  ];
  const b = [3, 6, 1];
  const f = [-2, -6, 5, -1, -4];
  const f0 = 0;

  const eqs = 3;
  const n = 5;
  
  const totalVars = n + eqs; // Основные + искусственные
  const fullA = [];
  const fullB = [];

  for (let i = 0; i < eqs; i++) {
    const row = new Array(totalVars).fill(0);
    for (let j = 0; j < n; j++) row[j] = A[i][j];
    row[n + i] = 1; // Искусственные переменные
    fullA.push(row);
    fullB.push(b[i]);
  }

  const totalRows = eqs + 2;
  const data = Array(totalRows).fill(null).map(() => Array(1 + n).fill(0)); // Только n столбцов

  for (let i = 0; i < eqs; i++) {
    data[i][0] = fullB[i];
    for (let j = 0; j < n; j++) data[i][1 + j] = fullA[i][j];
  }

  // Строка целевой функции f
  data[eqs][0] = f0;
  for (let j = 0; j < n; j++) {
    const coeff = (Lab3.mode === "max") ? -f[j] : f[j];
    data[eqs][1 + j] = coeff;
  }

  // Строка искусственной целевой функции g
  data[eqs + 1][0] = -b.reduce((a, x) => a + x, 0);
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let i = 0; i < eqs; i++) sum += fullA[i][j];
    data[eqs + 1][1 + j] = -sum;
  }

  const colLabels = ["1"];
  for (let j = 1; j <= n; j++) colLabels.push(`x${j}`);

  const rowLabels = [];
  for (let i = 1; i <= eqs; i++) rowLabels.push(`x${n + i}`);
  rowLabels.push("f");
  rowLabels.push("g");

  Lab3.currentMatrix = {
    data: data.map(function(row) {
      return row.map(function(x) { 
        const val = parseFloat(x.toFixed(10));
        return Math.abs(val) < 1e-12 ? 0 : val;
      });
    }),
    rowLabels: rowLabels,
    colLabels: colLabels,
    hasArtificial: true
  };

  Lab3.appendOutput(`
    <h3>Пример 1: Уравнения с равенствами (направление: ${Lab3.mode})</h3>
    <p><strong>Максимизировать</strong><br>F = ${f0} - 2x₁ - 6x₂ + 5x₃ - x₄ - 4x₅</p>
    <p><strong>при ограничениях:</strong></p>
    <ul>
      <li>x₁ - 4x₂ + 2x₃ - 5x₄ + 9x₅ = 3</li>
      <li>x₂ - 3x₃ + 4x₄ - 5x₅ = 6</li>
      <li>x₂ - x₃ + x₄ - x₅ = 1</li>
    </ul>
    <h4>Начальная М-таблица:</h4>
  `);

  Lab3.startSolving();
};

// =============== Пример 2: Ограничения типа ≤
Lab3.loadExample2 = function () {
  const m = 3;
  const n = 2;
  Lab3.mode = "max";

  const A = [
    [1, 7],
    [2, 5],
    [3, 4]
  ];
  const b = [32, 42, 62];
  const f = [3, 8];
  const f0 = 0;

  Lab3.buildMTableFromData(m, n, A, b, f, f0);

  Lab3.appendOutput(`
    <h3>Пример 2: Ограничения типа ≤ (направление: ${Lab3.mode})</h3>
    <p><strong>Максимизировать</strong><br>F = 3x₁ + 8x₂</p>
    <p><strong>при ограничениях:</strong></p>
    <ul>
      <li>x₁ + 7x₂ ≤ 32</li>
      <li>2x₁ + 5x₂ ≤ 42</li>
      <li>3x₁ + 4x₂ ≤ 62</li>
    </ul>
  `);
};

function initLab3() {
  Lab3.switchMode(1);
}