var Lab3 = {
  m: 0,
  n: 0,
  artificialVars: [],
  table: [],
  basis: [],
  pivotRow: -1,
  pivotCol: -1,
  originalObj: [],
  M: 1000000,
  hasArtificial: false,
  solutionVector: [], // сохраняем вектор для кнопки "Ответ"

  highlightPivotCell: function(row, col) {
    const cells = document.querySelectorAll('#lab3-table td');
    cells.forEach(cell => cell.classList.remove('pivot-cell'));
    const target = document.querySelector(`#lab3-table tr:nth-child(${row + 2}) td:nth-child(${col + 2})`);
    if (target) target.classList.add('pivot-cell');
  },

  formatNumber: function(x) {
    if (Math.abs(x) < 1e-9) return "0";
    return parseFloat(x.toFixed(4));
  },

  formatFraction: function(x) {
    if (Math.abs(x) < 1e-9) return "0";

    const maxDenominator = 1000;
    let bestNumerator = Math.round(x);
    let bestDenominator = 1;
    let minError = Math.abs(x - bestNumerator);

    for (let d = 1; d <= maxDenominator; d++) {
      let n = Math.round(x * d);
      let error = Math.abs(x - n / d);
      if (error < minError) {
        minError = error;
        bestNumerator = n;
        bestDenominator = d;
      }
    }

    if (minError > 1e-6) {
      return this.formatNumber(x);
    }

    const gcd = (a, b) => {
      a = Math.abs(a);
      b = Math.abs(b);
      while (b !== 0) {
        [a, b] = [b, a % b];
      }
      return a;
    };

    const g = gcd(bestNumerator, bestDenominator);
    bestNumerator /= g;
    bestDenominator /= g;

    if (bestDenominator === 1) {
      return String(bestNumerator);
    } else {
      return `${bestNumerator}/${bestDenominator}`;
    }
  },

  showAnswer: function() {
    const answerText = `(${this.solutionVector.join(', ')})`;
    document.getElementById('lab3-result').textContent = answerText;
  }
};

function lab3Template() {
  return `
    <h2>Лабораторная 3: Метод искусственного базиса (Метод больших M)</h2>
    <p><strong>Цель:</strong> Решить задачу линейного программирования с помощью метода больших M.</p>

    <div class="lab3-input">
      <label>Количество переменных (n):</label>
      <input type="number" id="lab3-n" value="5" min="1" max="10">

      <label>Количество ограничений (m):</label>
      <input type="number" id="lab3-m" value="3" min="1" max="10">

      <button onclick="Lab3.createInputForm()">Создать форму</button>
      <button onclick="Lab3.loadExample()" style="margin-left:10px;">Загрузить пример из фото</button>
    </div>

    <div id="lab3-form-container"></div>
    <div id="lab3-table-container"></div>
    <div id="lab3-result"></div>
    <div id="lab3-answer-button-container" style="text-align: center; margin-top: 10px;"></div>

    <div class="controls" style="margin-top: 20px;">
      <button onclick="Lab3.buildTable()" disabled id="btn-build-table">Построить таблицу</button>
      <button onclick="Lab3.performStep()" disabled id="btn-perform-step">Выполнить шаг</button>
      <button onclick="Lab3.reset()">Сбросить</button>
    </div>
  `;
}

Lab3.loadExample = function() {
  document.getElementById('lab3-n').value = 5;
  document.getElementById('lab3-m').value = 3;

  Lab3.createInputForm();

  document.getElementById('obj-0').value = -2;
  document.getElementById('obj-1').value = -6;
  document.getElementById('obj-2').value = 5;
  document.getElementById('obj-3').value = -1;
  document.getElementById('obj-4').value = -4;

  document.getElementById('coeff-0-0').value = 1;
  document.getElementById('coeff-0-1').value = -4;
  document.getElementById('coeff-0-2').value = 2;
  document.getElementById('coeff-0-3').value = -5;
  document.getElementById('coeff-0-4').value = 9;
  document.getElementById('type-0').value = "=";
  document.getElementById('rhs-0').value = 3;

  document.getElementById('coeff-1-0').value = 1;
  document.getElementById('coeff-1-1').value = -3;
  document.getElementById('coeff-1-2').value = 0;
  document.getElementById('coeff-1-3').value = 4;
  document.getElementById('coeff-1-4').value = -5;
  document.getElementById('type-1').value = "=";
  document.getElementById('rhs-1').value = 6;

  document.getElementById('coeff-2-0').value = 1;
  document.getElementById('coeff-2-1').value = -1;
  document.getElementById('coeff-2-2').value = 0;
  document.getElementById('coeff-2-3').value = 1;
  document.getElementById('coeff-2-4').value = -1;
  document.getElementById('type-2').value = "=";
  document.getElementById('rhs-2').value = 1;

  setTimeout(() => {
    Lab3.buildTable();
    document.getElementById('btn-build-table').disabled = true;
    document.getElementById('btn-perform-step').disabled = false;
    document.getElementById('lab3-result').textContent = "Пример из фото загружен. Нажмите 'Выполнить шаг'.";
    document.getElementById('lab3-answer-button-container').innerHTML = '';
  }, 100);
};

Lab3.createInputForm = function() {
  const n = parseInt(document.getElementById('lab3-n').value);
  const m = parseInt(document.getElementById('lab3-m').value);

  if (isNaN(n) || isNaN(m) || n <= 0 || m <= 0) {
    alert("Введите корректные значения n и m.");
    return;
  }

  Lab3.n = n;
  Lab3.m = m;

  let html = '<h3>Введите коэффициенты целевой функции</h3>';
  html += '<div style="display:flex; gap:10px; align-items:center; margin-bottom:15px;">';
  for (let j = 0; j < n; j++) {
    html += `<label>X${j+1}:</label><input type="number" id="obj-${j}" value="0" step="any" style="width:60px;">`;
  }
  html += '</div>';

  html += '<h3>Введите ограничения (в виде: a1X1 + ... + anXn ≤/≥/= b)</h3>';
  html += '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin-top:10px;">';
  html += '<tr><th>Ограничение</th>';
  for (let j = 0; j < n; j++) {
    html += `<th>X${j+1}</th>`;
  }
  html += '<th>Тип</th><th>Правая часть</th></tr>';

  for (let i = 0; i < m; i++) {
    html += `<tr><td>Ур.${i+1}</td>`;
    for (let j = 0; j < n; j++) {
      html += `<td><input type="number" id="coeff-${i}-${j}" value="0" step="any" style="width:50px;"></td>`;
    }
    html += `<td>
      <select id="type-${i}">
        <option value="<=">≤</option>
        <option value="=">=</option>
        <option value=">=">≥</option>
      </select>
    </td>`;
    html += `<td><input type="number" id="rhs-${i}" value="0" step="any" style="width:60px;"></td>`;
    html += '</tr>';
  }
  html += '</table>';

  html += '<div style="margin-top:15px;"><button onclick="Lab3.buildTable()">Построить таблицу</button></div>';

  document.getElementById('lab3-form-container').innerHTML = html;
  document.getElementById('lab3-table-container').innerHTML = '';
  document.getElementById('lab3-result').innerHTML = '';
  document.getElementById('lab3-answer-button-container').innerHTML = '';

  document.getElementById('btn-build-table').disabled = false;
  document.getElementById('btn-perform-step').disabled = true;
};

Lab3.buildTable = function() {
  const n = Lab3.n;
  const m = Lab3.m;

  Lab3.originalObj = [];
  for (let j = 0; j < n; j++) {
    const val = parseFloat(document.getElementById(`obj-${j}`).value) || 0;
    Lab3.originalObj.push(val);
  }

  const constraints = [];
  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const val = parseFloat(document.getElementById(`coeff-${i}-${j}`).value) || 0;
      row.push(val);
    }
    const type = document.getElementById(`type-${i}`).value;
    const rhs = parseFloat(document.getElementById(`rhs-${i}`).value) || 0;
    constraints.push({ coeffs: row, type, rhs });
  }

  Lab3.table = [];
  Lab3.artificialVars = [];
  Lab3.basis = [];

  let totalCols = n;

  for (let i = 0; i < m; i++) {
    const { coeffs, type, rhs } = constraints[i];
    const row = [...coeffs];

    if (type === "<=") {
      row.push(1);
      totalCols++;
      Lab3.basis.push(totalCols);
    } else if (type === ">=") {
      row.push(-1);
      totalCols++;
      row.push(1);
      totalCols++;
      Lab3.artificialVars.push(totalCols);
      Lab3.basis.push(totalCols);
    } else if (type === "=") {
      row.push(1);
      totalCols++;
      Lab3.artificialVars.push(totalCols);
      Lab3.basis.push(totalCols);
    }

    row.push(rhs);
    Lab3.table.push(row);
  }

  const objRow = Array(totalCols).fill(0);
  for (let j = 0; j < n; j++) {
    objRow[j] = -Lab3.originalObj[j];
  }
  Lab3.artificialVars.forEach(idx => {
    objRow[idx - 1] = -Lab3.M;
  });
  objRow.push(0);

  Lab3.table.push(objRow);
  Lab3.hasArtificial = Lab3.artificialVars.length > 0;

  Lab3.renderTable();
  document.getElementById('btn-build-table').disabled = true;
  document.getElementById('btn-perform-step').disabled = false;
  document.getElementById('lab3-result').textContent = "Таблица построена. Выберите разрешающий элемент.";
  document.getElementById('lab3-answer-button-container').innerHTML = '';
};

Lab3.selectPivot = function(row, col) {
  if (row >= Lab3.table.length - 1) return;

  const value = Lab3.table[row][col];
  if (Math.abs(value) < 1e-9) {
    alert("Разрешающий элемент не может быть нулём!");
    return;
  }

  Lab3.pivotRow = row;
  Lab3.pivotCol = col;

  Lab3.highlightPivotCell(row, col);
  document.getElementById('lab3-result').textContent = `Выбран разрешающий элемент a[${row+1},${col+1}] = ${Lab3.formatNumber(value)}`;
};

Lab3.performStep = function() {
  if (Lab3.pivotRow === -1 || Lab3.pivotCol === -1) {
    alert("Выберите разрешающий элемент, кликнув по ячейке!");
    return;
  }

  const r = Lab3.pivotRow;
  const s = Lab3.pivotCol;
  const rows = Lab3.table.length;
  const cols = Lab3.table[0].length;

  const pivot = Lab3.table[r][s];
  if (Math.abs(pivot) < 1e-9) {
    alert("Разрешающий элемент не может быть нулём!");
    return;
  }

  const newTable = [];
  for (let i = 0; i < rows; i++) {
    newTable.push([...Lab3.table[i]]);
  }

  for (let j = 0; j < cols; j++) {
    newTable[r][j] /= pivot;
  }

  for (let i = 0; i < rows; i++) {
    if (i !== r) {
      const factor = newTable[i][s];
      for (let j = 0; j < cols; j++) {
        newTable[i][j] -= factor * newTable[r][j];
      }
    }
  }

  Lab3.basis[r] = s + 1;
  Lab3.table = newTable;
  Lab3.pivotRow = -1;
  Lab3.pivotCol = -1;

  const lastRow = Lab3.table[Lab3.table.length - 1];
  const isOptimal = lastRow.slice(0, -1).every(x => x >= -1e-9);

  if (isOptimal) {
    const solution = {};
    for (let i = 0; i < Lab3.m; i++) {
      const varIndex = Lab3.basis[i] - 1;
      solution[`x${Lab3.basis[i]}`] = Lab3.table[i][cols - 1];
    }
    const objValue = -Lab3.table[Lab3.table.length - 1][cols - 1];

    // Сохраняем вектор решения
    Lab3.solutionVector = [];
    for (let i = 1; i <= Lab3.n; i++) {
      const val = solution[`x${i}`] || 0;
      Lab3.solutionVector.push(Lab3.formatFraction(val));
    }

    // Полный вывод
    let resultText = "✅ Оптимальное решение найдено:\n\n";
    resultText += `(${Lab3.solutionVector.join(', ')})\n\n`;
    resultText += `Значение целевой функции: ${Lab3.formatNumber(objValue)}`;

    document.getElementById('lab3-result').textContent = resultText;
    document.getElementById('btn-perform-step').disabled = true;

    // Показываем кнопку "Ответ"
    const btn = document.createElement('button');
    btn.textContent = 'Показать только ответ';
    btn.className = 'action';
    btn.style.marginTop = '10px';
    btn.onclick = Lab3.showAnswer;
    document.getElementById('lab3-answer-button-container').innerHTML = '';
    document.getElementById('lab3-answer-button-container').appendChild(btn);

    return;
  }

  Lab3.renderTable();
  document.getElementById('lab3-result').textContent += "\nШаг выполнен. Выберите новый разрешающий элемент.";
};

Lab3.renderTable = function() {
  const container = document.getElementById('lab3-table-container');
  let html = '<h3>Симплекс-таблица (Метод больших M)</h3>';
  html += '<table id="lab3-table" border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-size:14px;">';

  html += '<tr><th>Базис</th>';
  for (let j = 0; j < Lab3.table[0].length - 1; j++) {
    html += `<th>X${j+1}</th>`;
  }
  html += '<th>Св. член</th></tr>';

  for (let i = 0; i < Lab3.table.length; i++) {
    html += '<tr>';
    if (i < Lab3.m) {
      html += `<td>${Lab3.basis[i] ? 'X' + Lab3.basis[i] : '?'}</td>`;
    } else {
      html += '<td>ЦФ</td>';
    }

    for (let j = 0; j < Lab3.table[i].length; j++) {
      const val = Lab3.table[i][j];
      let cellClass = '';
      if (i === Lab3.pivotRow && j === Lab3.pivotCol) {
        cellClass = 'pivot-cell';
      } else if (i === Lab3.table.length - 1 && j < Lab3.table[i].length - 1 && val < 0) {
        cellClass = 'negative-cell';
      }
      html += `<td class="${cellClass}" onclick="Lab3.selectPivot(${i}, ${j})">${Lab3.formatNumber(val)}</td>`;
    }
    html += '</tr>';
  }

  html += '</table>';

  container.innerHTML = html;

  let style = document.getElementById('lab3-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'lab3-style';
    style.textContent = `
      .pivot-cell {
        background-color: #ffeb3b;
        font-weight: bold;
        border: 2px solid #f44336;
      }
      .negative-cell {
        color: #d32f2f;
        font-weight: bold;
      }
      #lab3-table td {
        text-align: center;
        cursor: pointer;
        padding: 5px;
      }
      #lab3-table td:hover {
        background-color: #f5f5f5;
      }
    `;
    document.head.appendChild(style);
  }
};

Lab3.reset = function() {
  document.getElementById('lab3-form-container').innerHTML = '';
  document.getElementById('lab3-table-container').innerHTML = '';
  document.getElementById('lab3-result').textContent = '';
  document.getElementById('lab3-answer-button-container').innerHTML = '';
  Lab3.m = 0;
  Lab3.n = 0;
  Lab3.artificialVars = [];
  Lab3.table = [];
  Lab3.basis = [];
  Lab3.pivotRow = -1;
  Lab3.pivotCol = -1;
  Lab3.hasArtificial = false;
  Lab3.solutionVector = [];

  document.getElementById('btn-build-table').disabled = true;
  document.getElementById('btn-perform-step').disabled = true;
};

function initLab3() {
}