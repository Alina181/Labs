var Lab2 = {
  matrix: [],
  variables: [],   // будет ['X<sub>1</sub>', 'X<sub>2</sub>', ...]
  outputs: [],     // будет ['0=', '0=', ...], но после шага: ['X<sub>1</sub>=', ...]
  selectedRow: null,
  selectedCol: null
};

function lab2Template() {
  return `
    <h2>Лабораторная 2: Метод Жордановых исключений</h2>
    <p><strong>Пример:</strong> Система:
      <br>7x₁ + 2x₂ + x₃ = 4<br>
      x₁ + x₂ + x₄ = 6<br>
      x₁ - x₂ - 2x₃ + 3x₄ = 10
    </p>

    <div class="input-group">
      <label>Количество строк (m):</label>
      <input type="number" id="rows2" value="3" min="1" max="10">
      <label>Количество столбцов (n):</label>
      <input type="number" id="cols2" value="5" min="2" max="11">
      <button class="action" onclick="Lab2.setupMatrix()">Создать матрицу</button>
    </div>

    <div id="matrix-input2"></div>
    <div id="jordan-table2"></div>
    <div id="steps2"></div>

    <div class="controls" style="margin-top: 20px;">
      <label>Выберите разрешающий элемент (ненулевой):</label>
      <button class="action" onclick="Lab2.clearSelection()">Очистить</button>
      <button class="action" onclick="Lab2.performStep()">Выполнить шаг</button>
      <button class="action" onclick="Lab2.reset()">Начать заново</button>
    </div>

    <div class="example-panel">
      <h3>Примеры</h3>
      <button onclick="Lab2.loadExample(1)">Пример 1</button>
      <button onclick="Lab2.loadExample(2)">Пример 2</button>
      <button onclick="Lab2.loadExample(3)">Пример 3</button>
    </div>
  `;
}

Lab2.setupMatrix = function() {
  const m = parseInt(document.getElementById("rows2").value) || 3;
  let n = parseInt(document.getElementById("cols2").value) || 5;

  if (n < 2) n = 2;

  let html = '<h3>Заполните матрицу коэффициентов</h3><table border="1" cellpadding="5" cellspacing="0">';
  html += '<tr><th></th><th>1</th>';
  for (let j = 1; j < n; j++) {
    html += `<th>-X<sub>${j}</sub></th>`;
  }
  html += '</tr>';

  for (let i = 0; i < m; i++) {
    html += `<tr><td>0=</td>`;
    for (let j = 0; j < n; j++) {
      const val = Lab2.getDefault(i, j);
      html += `<td><input type="number" id="cell2-${i}-${j}" value="${val}" step="any" style="width:60px;"></td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  html += '<button class="action" onclick="Lab2.loadMatrix()">Загрузить</button>';

  document.getElementById("matrix-input2").innerHTML = html;
  document.getElementById("jordan-table2").innerHTML = '';
  document.getElementById("steps2").innerHTML = '';
};

Lab2.getDefault = function(i, j) {
  const example = [
    [4, 1, 2, 1, 0],
    [6, 1, 1, 0, 1],
    [10, 1, -1, -1, 3]
  ];
  return example[i]?.[j] ?? 0;
};

Lab2.loadMatrix = function() {
  const m = parseInt(document.getElementById("rows2").value) || 3;
  const n = parseInt(document.getElementById("cols2").value) || 5;

  if (n < 2) n = 2;

  Lab2.matrix = [];
  // Генерируем переменные как строки с <sub>: X₁, X₂, ..., X_{n-1}
  Lab2.variables = Array.from({ length: n - 1 }, (_, i) => `X<sub>${i + 1}</sub>`);
  Lab2.outputs = Array.from({ length: m }, () => '0=');

  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      let val = parseFloat(document.getElementById(`cell2-${i}-${j}`).value);
      if (isNaN(val)) val = 0;
      row.push(val);
    }
    Lab2.matrix.push(row);
  }

  // Удаление нулевых столбцов (кроме первого)
  const colsToKeep = [0]; // всегда оставляем свободный член

  for (let j = 1; j < n; j++) {
    const isNonZero = Lab2.matrix.some(row => Math.abs(row[j]) > 1e-10);
    if (isNonZero) {
      colsToKeep.push(j);
    }
  }

  const newMatrix = Lab2.matrix.map(row =>
    colsToKeep.map(idx => row[idx])
  );

  // Обновляем переменные: только те, что остались
  const newVariables = colsToKeep.slice(1).map(j => `X<sub>${j}</sub>`);

  Lab2.matrix = newMatrix;
  Lab2.variables = newVariables;
  Lab2.selectedRow = null;
  Lab2.selectedCol = null;

  Lab2.renderTable();
  Lab2.logStep("Исходная таблица создана.");
};

Lab2.renderTable = function() {
  const tableEl = document.getElementById("jordan-table2");
  if (!Lab2.matrix.length || !Lab2.matrix[0]) {
    tableEl.innerHTML = '';
    return;
  }

  let html = '<h3>Таблица Жордана</h3><table border="1" cellpadding="5" cellspacing="0">';
  html += '<tr><th></th><th>1</th>';
  Lab2.variables.forEach(v => {
    html += `<th>-${v}</th>`;
  });
  html += '</tr>';

  Lab2.matrix.forEach((row, i) => {
    html += `<tr><td>${Lab2.outputs[i]}</td><td>${Lab2.formatNumber(row[0])}</td>`;
    for (let j = 1; j < row.length; j++) {
      const isPivot = Lab2.selectedRow === i && Lab2.selectedCol === j;
      const cellClass = isPivot ? 'selected' : '';
      html += `<td class="${cellClass}" onclick="Lab2.selectCell(${i}, ${j})">${Lab2.formatNumber(row[j])}</td>`;
    }
    html += '</tr>';
  });
  html += '</table>';
  tableEl.innerHTML = html;
};

Lab2.formatNumber = function(num) {
  if (Math.abs(num) < 1e-12) return "0";
  const rounded = Math.round(num * 1000) / 1000;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(3);
};

Lab2.logStep = function(text) {
  const stepsEl = document.getElementById("steps2");
  const div = document.createElement("div");
  div.className = "step-info";
  div.innerHTML = text; // Используем innerHTML, чтобы поддерживать <sub>
  stepsEl.appendChild(div);
  stepsEl.scrollTop = stepsEl.scrollHeight;
};

Lab2.selectCell = function(row, col) {
  if (col === 0) {
    alert("Нельзя выбирать первый столбец (свободный член)");
    return;
  }

  if (Math.abs(Lab2.matrix[row][col]) < 1e-10) {
    alert("Разрешающий элемент не может быть нулём!");
    return;
  }

  Lab2.selectedRow = row;
  Lab2.selectedCol = col;
  Lab2.renderTable();
  Lab2.logStep(`Выбран разрешающий элемент a[${row+1},${col}] = ${Lab2.formatNumber(Lab2.matrix[row][col])}`);
};

Lab2.clearSelection = function() {
  Lab2.selectedRow = null;
  Lab2.selectedCol = null;
  Lab2.renderTable();
  Lab2.logStep("Выбор разрешающего элемента сброшен.");
};

Lab2.performStep = function() {
  if (!Lab2.matrix.length) {
    alert("Сначала загрузите матрицу!");
    return;
  }

  if (Lab2.selectedRow === null || Lab2.selectedCol === null) {
    alert("Выберите разрешающий элемент!");
    return;
  }

  const r = Lab2.selectedRow;
  const s = Lab2.selectedCol;
  const pivot = Lab2.matrix[r][s];

  if (Math.abs(pivot) < 1e-10) {
    alert("Разрешающий элемент не может быть нулём!");
    return;
  }

  const rows = Lab2.matrix.length;
  const cols = Lab2.matrix[0].length;

  const newMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let j = 0; j < cols; j++) {
    newMatrix[r][j] = Lab2.matrix[r][j] / pivot;
  }

  for (let i = 0; i < rows; i++) {
    if (i !== r) {
      for (let j = 0; j < cols; j++) {
        if (j === s) {
          newMatrix[i][j] = -Lab2.matrix[i][j] / pivot;
        } else {
          newMatrix[i][j] = Lab2.matrix[i][j] - (Lab2.matrix[i][s] * Lab2.matrix[r][j]) / pivot;
        }
      }
    }
  }

  for (let i = 0; i < rows; i++) {
    newMatrix[i].splice(s, 1);
  }

  const removedVar = Lab2.variables.splice(s - 1, 1)[0]; // например, X<sub>1</sub>
  Lab2.outputs[r] = `${removedVar}=`; // теперь: X₁=

  Lab2.matrix = newMatrix;
  Lab2.selectedRow = null;
  Lab2.selectedCol = null;
  Lab2.renderTable();
  Lab2.logStep(`Столбец ${removedVar} удалён. Переменная ${removedVar} теперь базисная.`);
};

Lab2.reset = function() {
  document.getElementById("matrix-input2").innerHTML = '';
  document.getElementById("jordan-table2").innerHTML = '';
  document.getElementById("steps2").innerHTML = '';
  Lab2.matrix = [];
  Lab2.variables = [];
  Lab2.outputs = [];
  Lab2.selectedRow = null;
  Lab2.selectedCol = null;
};

Lab2.loadExample = function(exampleNum) {
  switch (exampleNum) {
    case 1:
      Lab2.matrix = [
        [4, 1, 2, 1, 0],
        [6, 1, 1, 0, 1],
        [10, 1, -1, -1, 3]
      ];
      Lab2.variables = ['X<sub>1</sub>', 'X<sub>2</sub>', 'X<sub>3</sub>', 'X<sub>4</sub>'];
      Lab2.outputs = ['0=', '0=', '0='];
      break;
    case 2:
      Lab2.matrix = [
        [1, 1, 1, 1, 0],
        [1, 2, 1, 0, 1],
        [2, 1, 3, 1, 2]
      ];
      Lab2.variables = ['X<sub>1</sub>', 'X<sub>2</sub>', 'X<sub>3</sub>', 'X<sub>4</sub>'];
      Lab2.outputs = ['0=', '0=', '0='];
      break;
    default:
      return;
  }

  Lab2.loadMatrix();
};

function initLab2() {
  Lab2.setupMatrix();
}