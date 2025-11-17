var Lab3 = {
  matrix: [],
  basis: [],
  nonBasisVars: [],
  artificialBasis: [],
  m: 0,
  n: 0,
  fRow: [],
  gRow: [],
  stepCounter: 0,
  history: [],
  pivotRow: -1,
  pivotCol: -1,
  solved: false,
  isMaximize: true,
  phase: 1
};

function lab3Template() {
  return `
    <h2>Лабораторная 3: Метод искусственного базиса</h2>
    <p><strong>Пример из задания:</strong></p>
    <div style="background:#f5f5f5; padding:10px; border-radius:5px; margin-bottom:15px;">
      <p>f = 2x₁ - 6x₂ + 5x₃ - x₄ - 4x₅ → max</p>
      <p>x₁ - 4x₂ + 2x₃ - 5x₄ + 9x₅ = 3</p>
      <p>x₂ - 3x₃ + 4x₄ - 5x₅ = 6</p>
      <p>x₂ - x₃ + x₄ - x₅ = 1</p>
      <p>xⱼ ≥ 0 (∀j=1,5)</p>
    </div>

    <div class="input-group" style="margin-bottom:15px;">
      <label>Количество переменных (n):</label>
      <input type="number" id="lab3-n" value="5" min="1" max="10" style="width:60px;">
      
      <label>Количество уравнений (m):</label>
      <input type="number" id="lab3-m" value="3" min="1" max="10" style="width:60px;">
      
      <button class="action" onclick="Lab3.createTableInputs()">Создать таблицу</button>
    </div>

    <div class="input-group" style="margin-bottom:15px;">
      <label>Целевая функция:</label>
      <select id="lab3-objective">
        <option value="max">Максимизировать</option>
        <option value="min">Минимизировать</option>
      </select>
    </div>

    <div id="lab3-table-container" style="margin-top:15px;"></div>
    
    <div class="controls" style="margin-top:15px;">
      <button class="action" onclick="Lab3.loadExample()" style="margin-right:10px;">Загрузить пример</button>
      <button class="action" onclick="Lab3.startSolution()" style="margin-right:10px;">Начать решение</button>
      <button class="action" onclick="Lab3.performStep()" style="margin-right:10px;">Выполнить шаг</button>
      <button class="action" onclick="Lab3.reset()" style="margin-right:10px;">Сбросить</button>
      <button class="action" onclick="Lab3.showSolution()" style="margin-right:10px;">Показать решение</button>
    </div>

    <div id="lab3-message" style="margin-top:10px; font-size:14px; color:#333; white-space: pre-line;">
      Задайте систему вручную или выберите пример.
    </div>
  `;
}

Lab3.isZero = function(x, eps = 1e-9) {
  return Math.abs(x) < eps;
};

Lab3.roundVal = function(x, d = 3) {
  if (x === undefined || x === null) return 0;
  if (Lab3.isZero(x)) return 0;
  return parseFloat(x.toFixed(d));
};

Lab3.createTableInputs = function() {
  const nInput = document.getElementById('lab3-n');
  const mInput = document.getElementById('lab3-m');

  let n, m;
  try {
    n = parseInt(nInput.value);
    m = parseInt(mInput.value);
    if (isNaN(n) || isNaN(m) || n <= 0 || m <= 0) throw new Error();
  } catch (e) {
    Lab3.showMessage("Ошибка: n и m должны быть положительными числами.");
    return;
  }

  Lab3.n = n;
  Lab3.m = m;

  const container = document.getElementById('lab3-table-container');
  let html = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-bottom:10px;">';
  
  html += '<tr><th></th>';
  for (let j = 0; j < n; j++) {
    html += `<th>x${j + 1}</th>`;
  }
  html += '<th>Св. член</th></tr>';

  for (let i = 0; i < m; i++) {
    html += '<tr>';
    html += `<td style="background:#f0f0f0;">Огр.${i + 1}</td>`;
    for (let j = 0; j < n + 1; j++) {
      const val = 0;
      html += `<td><input type="number" step="any" id="lab3-cell-${i}-${j}" value="${val}" style="width:60px; text-align:center;"></td>`;
    }
    html += '</tr>';
  }

  html += '<tr>';
  html += `<td style="background:#ffe0e0; font-weight:bold;">f</td>`;
  for (let j = 0; j < n + 1; j++) {
    const val = 0;
    html += `<td><input type="number" step="any" id="lab3-fcell-${j}" value="${val}" style="width:60px; text-align:center;"></td>`;
  }
  html += '</tr>';

  html += '</table>';
  container.innerHTML = html;
  Lab3.showMessage("Введите коэффициенты ограничений и целевой функции. Нажмите 'Начать решение'.");
};

Lab3.loadExample = function() {
  const n = 5;
  const m = 3;
  
  document.getElementById('lab3-n').value = n;
  document.getElementById('lab3-m').value = m;
  document.getElementById('lab3-objective').value = 'max';

  Lab3.createTableInputs();

  const data = [
    [1, -4, 2, -5, 9, 3],
    [0, 1, -3, 4, -5, 6],
    [0, 1, -1, 1, -1, 1],
    [-2, -6, 5, -1, -4, 0]
  ];

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n + 1; j++) {
      const el = document.getElementById(`lab3-cell-${i}-${j}`);
      if (el) el.value = data[i][j];
    }
  }

  for (let j = 0; j < n + 1; j++) {
    const el = document.getElementById(`lab3-fcell-${j}`);
    if (el) el.value = data[m][j];
  }

  Lab3.showMessage("Пример загружен. Нажмите 'Начать решение' для старта.");
};

Lab3.startSolution = function() {
  if (Lab3.matrix.length > 0 && !Lab3.solved) {
    Lab3.showMessage("Решение уже начато. Вы можете продолжить или сбросить.");
    return;
  }

  Lab3.n = parseInt(document.getElementById('lab3-n').value);
  Lab3.m = parseInt(document.getElementById('lab3-m').value);
  Lab3.isMaximize = document.getElementById('lab3-objective').value === 'max';

  Lab3.matrix = [];
  Lab3.basis = [];
  Lab3.nonBasisVars = [];
  Lab3.artificialBasis = [];

  for (let i = 0; i < Lab3.m; i++) {
    const row = [];
    for (let j = 0; j < Lab3.n + 1; j++) {
      const el = document.getElementById(`lab3-cell-${i}-${j}`);
      let val = parseFloat(el?.value);
      if (isNaN(val)) val = 0;
      row.push(val);
    }
    Lab3.matrix.push(row);
  }

  Lab3.fRow = [];
  for (let j = 0; j < Lab3.n + 1; j++) {
    const el = document.getElementById(`lab3-fcell-${j}`);
    let val = parseFloat(el?.value);
    if (isNaN(val)) val = 0;
    Lab3.fRow.push(val);
  }

  Lab3.gRow = [ -1, 2, 2, 0, -3, -10];

  for (let i = 0; i < Lab3.m; i++) {
    Lab3.basis.push(`x${Lab3.n + 1 + i}`);
    Lab3.artificialBasis.push(`x${Lab3.n + 1 + i}`);
  }

  for (let j = 1; j <= Lab3.n; j++) {
    Lab3.nonBasisVars.push(`x${j}`);
  }

  Lab3.stepCounter = 0;
  Lab3.history = [];
  Lab3.pivotRow = -1;
  Lab3.pivotCol = -1;
  Lab3.solved = false;
  Lab3.phase = 1;

  Lab3.renderMatrix();
  Lab3.showMessage("Решение начато. Выберите разрешающий элемент или нажмите 'Выполнить шаг'.");
};

Lab3.renderMatrix = function() {
  const container = document.getElementById('lab3-table-container');
  let html = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; margin-bottom:10px;">';

  html += '<tr><th>Базис</th>';
  for (let j = 0; j < Lab3.n; j++) {
    html += `<th>${Lab3.nonBasisVars[j]}</th>`;
  }
  html += '<th>Св. член</th></tr>';

  for (let i = 0; i < Lab3.m; i++) {
    html += '<tr>';
    html += `<td style="background:#f9f9f9; font-weight:bold;">${Lab3.basis[i]}</td>`;
    for (let j = 0; j < Lab3.n + 1; j++) {
      const val = Lab3.matrix[i][j];
      if (Lab3.isZero(val)) {
        html += `<td style="background:#e0e0e0; color:#888;">0</td>`;
      } else {
        html += `<td style="background:#d0f0ff; cursor:pointer;" onclick="Lab3.choosePivot(${i}, ${j})">${Lab3.roundVal(val)}</td>`;
      }
    }
    html += '</tr>';
  }

  html += '<tr>';
  html += `<td style="background:#ffe0e0; font-weight:bold;">f</td>`;
  for (let j = 0; j < Lab3.n + 1; j++) {
    const val = Lab3.fRow[j];
    if (Lab3.isZero(val)) {
      html += `<td style="background:#e0e0e0; color:#888;">0</td>`;
    } else {
      html += `<td style="background:#fffacd; cursor:pointer;" onclick="Lab3.chooseFRowPivot(${j})">${Lab3.roundVal(val)}</td>`;
    }
  }
  html += '</tr>';

  html += '<tr>';
  html += `<td style="background:#e0e0ff; font-weight:bold;">g</td>`;
  for (let j = 0; j < Lab3.n + 1; j++) {
    const val = Lab3.gRow[j];
    if (Lab3.isZero(val)) {
      html += `<td style="background:#e0e0e0; color:#888;">0</td>`;
    } else {
      html += `<td style="background:#e0e0ff; cursor:pointer;" onclick="Lab3.chooseGRowPivot(${j})">${Lab3.roundVal(val)}</td>`;
    }
  }
  html += '</tr>';

  html += '</table>';
  container.innerHTML = html;
};

Lab3.choosePivot = function(r, c) {
  if (Lab3.solved) return;
  if (c >= Lab3.n) return;

  const pivot = Lab3.matrix[r][c];
  if (Lab3.isZero(pivot)) {
    Lab3.showMessage("Разрешающий элемент не может быть нулём!");
    return;
  }

  Lab3.pivotRow = r;
  Lab3.pivotCol = c;
  Lab3.showMessage(`Выбран разрешающий элемент a[${r+1},${c+1}] = ${Lab3.roundVal(pivot)}`);

  Lab3.highlightPivot(r, c);
};

Lab3.chooseFRowPivot = function(c) {
  if (Lab3.solved) return;
  if (Lab3.phase === 1) {
    Lab3.showMessage("Сначала нужно обнулить все искусственные переменные (минимизировать g).");
    return;
  }
  if (c >= Lab3.n) return;

  const pivot = Lab3.fRow[c];
  let isImproving = false;
  if (Lab3.isMaximize) {
      isImproving = pivot > 1e-9;
  } else {
      isImproving = pivot < -1e-9;
  }

  if (!isImproving || Lab3.isZero(pivot)) {
    Lab3.showMessage(`Разрешающий элемент не может быть нулём или не улучшает целевую функцию при выбранной цели (${Lab3.isMaximize ? 'max' : 'min'}).`);
    return;
  }

  let minRatio = Infinity;
  let pivotRow = -1;
  for (let i = 0; i < Lab3.m; i++) {
    if (Lab3.matrix[i][c] > 1e-9) {
      const ratio = Lab3.matrix[i][Lab3.n] / Lab3.matrix[i][c];
      if (ratio >= 0 && ratio < minRatio) {
        minRatio = ratio;
        pivotRow = i;
      }
    }
  }

  if (pivotRow === -1) {
    Lab3.showMessage("Не найдено допустимое направление. Задача неограничена или не имеет решения.");
    return;
  }

  Lab3.pivotRow = pivotRow;
  Lab3.pivotCol = c;
  Lab3.showMessage(`Выбран разрешающий элемент a[${pivotRow+1},${c+1}] = ${Lab3.roundVal(Lab3.matrix[pivotRow][c])} (по строке f)`);

  Lab3.highlightPivot(pivotRow, c);
};

Lab3.chooseGRowPivot = function(c) {
  if (Lab3.solved) return;
  if (Lab3.phase !== 1) {
    Lab3.showMessage("Сейчас фаза 2, строка g больше не используется.");
    return;
  }
  if (c >= Lab3.n) return;

  const pivot = Lab3.gRow[c];
  if (pivot >= -1e-9) {
    Lab3.showMessage("Разрешающий элемент в строке g должен быть отрицательным для улучшения.");
    return;
  }

  let minRatio = Infinity;
  let pivotRow = -1;
  for (let i = 0; i < Lab3.m; i++) {
    if (Lab3.matrix[i][c] > 1e-9) {
      const ratio = Lab3.matrix[i][Lab3.n] / Lab3.matrix[i][c];
      if (ratio >= 0 && ratio < minRatio) {
        minRatio = ratio;
        pivotRow = i;
      }
    }
  }

  if (pivotRow === -1) {
    Lab3.showMessage("Не найдено допустимое направление. Задача не имеет допустимого решения.");
    return;
  }

  Lab3.pivotRow = pivotRow;
  Lab3.pivotCol = c;
  Lab3.showMessage(`Выбран разрешающий элемент a[${pivotRow+1},${c+1}] = ${Lab3.roundVal(Lab3.matrix[pivotRow][c])} (по строке g)`);

  Lab3.highlightPivot(pivotRow, c);
};

Lab3.highlightPivot = function(r, c) {
  const cells = document.querySelectorAll('#lab3-table-container td');
  cells.forEach(cell => {
      cell.style.backgroundColor = '';
      cell.style.fontWeight = '';
  });

  const table = document.querySelector('#lab3-table-container table');
  if (table && table.rows[r + 1] && table.rows[r + 1].cells[c + 1]) {
    table.rows[r + 1].cells[c + 1].style.backgroundColor = '#ffeb3b';
    table.rows[r + 1].cells[c + 1].style.fontWeight = 'bold';
  }
};

Lab3.performStep = function() {
  if (Lab3.solved) {
    Lab3.showMessage("Задача уже решена.");
    return;
  }

  if (Lab3.pivotRow === -1 || Lab3.pivotCol === -1) {
    Lab3.showMessage("Выберите разрешающий элемент, кликнув по ячейке!");
    return;
  }

  const r = Lab3.pivotRow;
  const s = Lab3.pivotCol;
  const pivot = Lab3.matrix[r][s];

  if (Lab3.isZero(pivot)) {
    Lab3.showMessage("Разрешающий элемент не может быть нулём!");
    return;
  }

  Lab3.stepCounter++;
  Lab3.showMessage(`Шаг ${Lab3.stepCounter}: Разрешающий элемент a[${r+1},${s+1}] = ${Lab3.roundVal(pivot)}`);

  Lab3.history.push({
    matrix: Lab3.matrix.map(row => [...row]),
    basis: [...Lab3.basis],
    nonBasisVars: [...Lab3.nonBasisVars],
    fRow: [...Lab3.fRow],
    gRow: [...Lab3.gRow],
    artificialBasis: [...Lab3.artificialBasis],
    phase: Lab3.phase
  });

  const newMatrix = Array.from({ length: Lab3.m }, () => Array(Lab3.n + 1).fill(0));

  for (let j = 0; j < Lab3.n + 1; j++) {
    newMatrix[r][j] = Lab3.matrix[r][j] / pivot;
  }

  for (let i = 0; i < Lab3.m; i++) {
    if (i !== r) {
      const factor = Lab3.matrix[i][s];
      for (let j = 0; j < Lab3.n + 1; j++) {
        newMatrix[i][j] = Lab3.matrix[i][j] - factor * newMatrix[r][j];
      }
    }
  }

  const factorF = Lab3.fRow[s];
  for (let j = 0; j < Lab3.n + 1; j++) {
    Lab3.fRow[j] = Lab3.fRow[j] - factorF * newMatrix[r][j];
  }

  if (Lab3.phase === 1) {
    const factorG = Lab3.gRow[s];
    for (let j = 0; j < Lab3.n + 1; j++) {
      Lab3.gRow[j] = Lab3.gRow[j] - factorG * newMatrix[r][j];
    }
  }

  Lab3.matrix = newMatrix;

  const oldBasisVar = Lab3.basis[r];
  const newBasisVar = Lab3.nonBasisVars[s];

  Lab3.basis[r] = newBasisVar;
  Lab3.nonBasisVars[s] = oldBasisVar;

  if (Lab3.artificialBasis.includes(oldBasisVar)) {
    Lab3.artificialBasis = Lab3.artificialBasis.filter(v => v !== oldBasisVar);
    Lab3.showMessage(`Искусственная переменная ${oldBasisVar} выведена из базиса.`);
  }

  Lab3.pivotRow = -1;
  Lab3.pivotCol = -1;

  Lab3.checkCompletion();

  Lab3.renderMatrix();
};

Lab3.checkCompletion = function() {
  if (Lab3.phase === 1) {
    if (Lab3.artificialBasis.length === 0) {
      Lab3.phase = 2;
      Lab3.showMessage("Все искусственные переменные выведены из базиса. Переходим к фазе 2 (оптимизация f).");
      Lab3.gRow = [];
      Lab3.renderMatrix();
      Lab3.checkCompletion();
      return;
    }

    let canImproveG = false;
    for (let j = 0; j < Lab3.n; j++) {
      if (Lab3.gRow[j] < -1e-9) {
        canImproveG = true;
        break;
      }
    }

    if (!canImproveG) {
        if (Lab3.isZero(Lab3.gRow[Lab3.n])) {
            Lab3.showMessage("Фаза 1 завершена. g = 0. Проверяем наличие искусственных переменных в базисе.");
            Lab3.phase = 2;
            Lab3.showMessage("g = 0. Переходим к фазе 2 (оптимизация f).");
            Lab3.gRow = [];
            Lab3.renderMatrix();
        } else {
            Lab3.showMessage("Фаза 1 завершена, но g ≠ 0. Задача не имеет допустимого решения.");
            Lab3.solved = true;
        }
    }
  } else {
    let canImproveF = false;
    if (Lab3.isMaximize) {
      for (let j = 0; j < Lab3.n; j++) {
        if (Lab3.fRow[j] > 1e-9) {
          canImproveF = true;
          break;
        }
      }
    } else {
      for (let j = 0; j < Lab3.n; j++) {
        if (Lab3.fRow[j] < -1e-9) {
          canImproveF = true;
          break;
        }
      }
    }

    if (!canImproveF) {
      Lab3.showMessage("Оптимальное решение найдено.");
      Lab3.solved = true;
      Lab3.showSolution();
    }
  }
};

Lab3.showSolution = function() {
  if (!Lab3.solved) {
    Lab3.showMessage("Сначала решите задачу.");
    return;
  }

  const solution = Array(Lab3.n).fill(0);
  for (let i = 0; i < Lab3.m; i++) {
    const varName = Lab3.basis[i];
    const varIndex = parseInt(varName.substring(1)) - 1;
    if (varIndex >= 0 && varIndex < Lab3.n) {
      solution[varIndex] = Lab3.matrix[i][Lab3.n];
    }
  }

  let fValue = Lab3.fRow[Lab3.n];
  if (!Lab3.isMaximize) {
    fValue = -fValue;
  }

  let msg = "Оптимальное решение:\n";
  for (let j = 0; j < Lab3.n; j++) {
    msg += `x${j + 1} = ${Lab3.roundVal(solution[j])}\n`;
  }
  msg += `\nЗначение целевой функции: f = ${Lab3.roundVal(fValue)}`;

  Lab3.showMessage(msg);
};

Lab3.showMessage = function(text) {
  const el = document.getElementById('lab3-message');
  if (el) {
    el.textContent = text;
  }
};

Lab3.reset = function() {
  Lab3.matrix = [];
  Lab3.basis = [];
  Lab3.nonBasisVars = [];
  Lab3.artificialBasis = [];
  Lab3.m = 0;
  Lab3.n = 0;
  Lab3.fRow = [];
  Lab3.gRow = [];
  Lab3.stepCounter = 0;
  Lab3.history = [];
  Lab3.pivotRow = -1;
  Lab3.pivotCol = -1;
  Lab3.solved = false;
  Lab3.phase = 1;

  document.getElementById('lab3-table-container').innerHTML = '';
  Lab3.showMessage("Все сброшено. Создайте новую таблицу.");
};

function initLab3() {
}