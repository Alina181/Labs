var Lab2 = {
  matrix: [],
  basis: [],
  activeCols: [],
  m: 0,
  n: 0,
  editing: true
};

function lab2Template() {
  return `
    <h2>Лабораторная 2: Метод Жордана (решение СЛАУ)</h2>
    
    <div class="input-group" style="margin-bottom:15px;">
      <label>m (строки):</label>
      <input type="number" id="lab2-rows" value="3" min="1" max="10" style="width:60px;">
      
      <label>n (столбцы):</label>
      <input type="number" id="lab2-cols" value="3" min="1" max="10" style="width:60px;">
      
      <button class="action" onclick="Lab2.createTableInputs()">Создать таблицу</button>
    </div>

    <div class="input-group" style="margin-bottom:15px;">
      <label>Выберите пример:</label>
      <select id="lab2-example-select">
        <option value="0">— Не выбран —</option>
        <option value="1">Пример 1</option>
        <option value="2">Пример 2</option>
        <option value="3">Пример 3</option>
        <option value="4">Пример 4</option>
        <option value="5">Пример 5</option>
      </select>
      <button class="action" onclick="Lab2.loadExample()">Загрузить пример</button>
    </div>

    <button class="action" onclick="Lab2.startSteps()" style="margin:10px 0;">Начать решение</button>

    <div id="lab2-table-container" style="margin-top:15px;"></div>
    <div id="lab2-message" style="margin-top:10px; font-size:14px; color:#333; white-space: pre-line;">
      Задайте систему вручную или выберите пример.
    </div>
  `;
}

Lab2.isZero = function(x, eps = 1e-9) {
  return Math.abs(x) < eps;
};

Lab2.roundVal = function(x, d = 3) {
  if (Lab2.isZero(x)) return 0;
  return parseFloat(x.toFixed(d));
};

Lab2.createTableInputs = function() {
  const rowsInput = document.getElementById('lab2-rows');
  const colsInput = document.getElementById('lab2-cols');

  let m, n;
  try {
    m = parseInt(rowsInput.value);
    n = parseInt(colsInput.value);
    if (isNaN(m) || isNaN(n) || m <= 0 || n <= 0) throw new Error();
  } catch (e) {
    Lab2.showMessage("Ошибка: m и n должны быть положительными числами.");
    return;
  }

  Lab2.m = m;
  Lab2.n = n;

  const container = document.getElementById('lab2-table-container');
  let html = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">';
  
  // Заголовки
  html += '<tr><th></th>';
  for (let j = 0; j < n; j++) {
    html += `<th>x${j + 1}</th>`;
  }
  html += '<th>Св.член</th></tr>';

  // Строки ввода
  for (let i = 0; i < m; i++) {
    html += '<tr>';
    html += `<td style="background:#f0f0f0;">Ур.${i + 1}</td>`;
    for (let j = 0; j < n + 1; j++) {
      const val = 0;
      html += `<td><input type="number" step="any" id="lab2-cell-${i}-${j}" value="${val}" style="width:60px; text-align:center;"></td>`;
    }
    html += '</tr>';
  }

  html += '</table>';
  container.innerHTML = html;
  Lab2.showMessage("Введите коэффициенты и нажмите 'Начать решение'.");
};

Lab2.startSteps = function() {
  if (Lab2.editing && Lab2.matrix.length === 0) {
    Lab2.showMessage("Сначала создайте таблицу или загрузите пример!");
    return;
  }

  if (Lab2.editing) {
    Lab2.matrix = [];
    for (let i = 0; i < Lab2.m; i++) {
      const row = [];
      for (let j = 0; j < Lab2.n + 1; j++) {
        const el = document.getElementById(`lab2-cell-${i}-${j}`);
        let val = parseFloat(el?.value);
        if (isNaN(val)) val = 0;
        row.push(val);
      }
      Lab2.matrix.push(row);
    }
  }

  Lab2.basis = Array(Lab2.m).fill("0");
  Lab2.activeCols = Array.from({ length: Lab2.n }, (_, i) => i);
  Lab2.editing = false;

  Lab2.renderMatrix();
  Lab2.showMessage("Выбирайте ведущий элемент.");
};

Lab2.getExample = function(id) {
  switch (id) {
    case 1:
      // 3 уравнения, 3 переменные, единственное решение
      return {
        m: 3,
        n: 4,
        matrix: [
          [ 1, 2, 1, 0, 4],
          [ 1, 1, 0, 1, 6],
          [ 1, -1, -1, 3, 10]
        ]
      };
    case 2:
      // 2 уравнения, 3 переменные, бесконечно много решений
      return {
        m: 3,
        n: 3,
        matrix: [
        [1, 3, 0, 14],
        [2, 0, -3, 7],
        [0, 2, 1, 7]
        ]
      };
    case 3:
      // 2 уравнения, 2 переменные, несовместна
      return {
        m: 3,
        n: 3,
        matrix: [
        [1, 3, -4, 5],
        [-1, 1, 1, 0],
        [2, 1, 1, 9]
        ]
      };
    case 4:
      // Другая система 3×3 с единственным решением
      return {
        m: 3,
        n: 5,
        matrix: [
        [-2, 1, 1, 0, 0, 2],
        [-1, 2, 0, -1, 0, 8],
        [1, 1, 0, 0, 1, 5]
        ]
      };
    case 5:
      // 2 уравнения, 4 переменные, 2 свободные
      return {
        m: 2,
        n: 4,
        matrix: [
          [1, 1, 1, 4, 1],
          [-1, 0, 1, 2, 1]
        ]
      };
    default:
      return null;
  }
};

Lab2.loadExample = function() {
  const select = document.getElementById('lab2-example-select');
  const id = parseInt(select.value);
  if (id === 0) {
    Lab2.showMessage("Выберите пример из списка.");
    return;
  }

  const ex = Lab2.getExample(id);
  if (!ex) {
    Lab2.showMessage("Пример не найден.");
    return;
  }

  Lab2.m = ex.m;
  Lab2.n = ex.n;
  Lab2.matrix = ex.matrix.map(row => [...row]);

  // Обновляем поля ввода
  document.getElementById('lab2-rows').value = Lab2.m;
  document.getElementById('lab2-cols').value = Lab2.n;
  Lab2.createTableInputs();

  // Заполняем значения
  for (let i = 0; i < Lab2.m; i++) {
    for (let j = 0; j < Lab2.n + 1; j++) {
      const el = document.getElementById(`lab2-cell-${i}-${j}`);
      if (el) el.value = Lab2.matrix[i][j];
    }
  }

  Lab2.showMessage("Пример загружен. Нажмите 'Начать решение' для старта.");
};

Lab2.renderMatrix = function() {
  const container = document.getElementById('lab2-table-container');
  let html = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">';

  html += '<tr><th>Базис</th><th>Св.член</th>';
  Lab2.activeCols.forEach(j => {
    html += `<th>-x${j + 1}</th>`;
  });
  html += '</tr>';

  for (let i = 0; i < Lab2.m; i++) {
    html += '<tr>';
    html += `<td style="background:#f9f9f9; font-weight:bold;">${Lab2.basis[i]}</td>`;
    html += `<td>${Lab2.roundVal(Lab2.matrix[i][Lab2.n])}</td>`;
    Lab2.activeCols.forEach(j => {
      const val = Lab2.matrix[i][j];
      if (Lab2.isZero(val)) {
        html += `<td style="background:#e0e0e0; color:#888;">0</td>`;
      } else {
        html += `<td style="background:#d0f0ff; cursor:pointer;" onclick="Lab2.choosePivot(${i}, ${j})">${Lab2.roundVal(val)}</td>`;
      }
    });
    html += '</tr>';
  }

  html += '</table>';
  container.innerHTML = html;
};

Lab2.choosePivot = function(r, c) {
  if (Lab2.editing || !Lab2.activeCols.includes(c) || Lab2.isZero(Lab2.matrix[r][c])) {
    return;
  }

  const pivot = Lab2.matrix[r][c];

  // Нормализация строки
  for (let j = 0; j < Lab2.n + 1; j++) {
    Lab2.matrix[r][j] /= pivot;
  }

  // Обнуление других строк
  for (let i = 0; i < Lab2.m; i++) {
    if (i === r) continue;
    const factor = Lab2.matrix[i][c];
    if (Lab2.isZero(factor)) continue;
    for (let j = 0; j < Lab2.n + 1; j++) {
      Lab2.matrix[i][j] -= factor * Lab2.matrix[r][j];
    }
  }

  Lab2.basis[r] = `x${c + 1}`;
  Lab2.activeCols = Lab2.activeCols.filter(col => col !== c);

  Lab2.renderMatrix();
  Lab2.checkStatus();
};

Lab2.checkStatus = function() {
  // Проверка на несовместность
  let inconsistent = false;
  for (let i = 0; i < Lab2.m; i++) {
    let allZero = true;
    for (let j = 0; j < Lab2.n; j++) {
      if (!Lab2.isZero(Lab2.matrix[i][j])) {
        allZero = false;
        break;
      }
    }
    if (allZero && !Lab2.isZero(Lab2.matrix[i][Lab2.n])) {
      inconsistent = true;
      break;
    }
  }

  if (inconsistent) {
    Lab2.showMessage("Система несовместна.");
    Lab2.editing = true;
    return;
  }

  const usedBasis = new Set(Lab2.basis);
  const freeCols = [];
  for (let j = 0; j < Lab2.n; j++) {
    if (!usedBasis.has(`x${j + 1}`)) {
      freeCols.push(j);
    }
  }

  if (freeCols.length > 0) {
    const FREE_VARS = ["α", "β", "γ", "δ", "ε", "ζ", "η", "θ"];
    const freeVars = freeCols.map((col, idx) => {
      const symbol = idx < FREE_VARS.length ? FREE_VARS[idx] : `t${idx}`;
      return { col, symbol };
    });

    const equations = [];
    const usedLeads = new Set();

    for (let i = 0; i < Lab2.m; i++) {
      let lead = -1;
      for (let j = 0; j < Lab2.n; j++) {
        if (Math.abs(Lab2.matrix[i][j] - 1) < 1e-9 && !freeCols.includes(j)) {
          lead = j;
          break;
        }
      }
      if (lead >= 0 && !usedLeads.has(lead)) {
        usedLeads.add(lead);
        let expr = `${Lab2.roundVal(Lab2.matrix[i][Lab2.n])}`;
        freeVars.forEach(({ col, symbol }) => {
          const coef = -Lab2.matrix[i][col];
          if (!Lab2.isZero(coef)) {
            const sign = coef > 0 ? '+' : '';
            expr += ` ${sign}${Lab2.roundVal(coef)}*${symbol}`;
          }
        });
        equations.push(`x${lead + 1} = ${expr}`);
      }
    }

    const params = freeVars.map(({ col, symbol }) => `x${col + 1} = ${symbol}`);
    const msg = "Система имеет бесконечно много решений:\n" + [...params, ...equations].join('\n');
    Lab2.showMessage(msg);
    return;
  }

  // Единственное решение
  const sol = Array(Lab2.n).fill(0);
  for (let i = 0; i < Lab2.m; i++) {
    for (let j = 0; j < Lab2.n; j++) {
      if (Math.abs(Lab2.matrix[i][j] - 1) < 1e-9) {
        sol[j] = Lab2.matrix[i][Lab2.n];
      }
    }
  }
  const msg = "Единственное решение: " + sol.map((v, j) => `x${j + 1}=${Lab2.roundVal(v)}`).join(", ");
  Lab2.showMessage(msg);
};

Lab2.showMessage = function(text) {
  const el = document.getElementById('lab2-message');
  if (el) {
    el.textContent = text;
  }
};

function initLab2() {
  // Nothing special needed
}