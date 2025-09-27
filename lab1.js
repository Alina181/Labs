var Lab1 = {
  currentMatrix: [],
  variables: [],     
  outputs: [],       
  history: [],
  pivotRow: undefined,
  pivotCol: undefined
};

function lab1Template() {
  return `
    <h2>Лабораторная 1: Метод модифицированных жордановых исключений</h2>
    <p><strong>Пример:</strong> Система:
      Y₁ = 3X₁ - 3X₂ + 3X₃<br>
      Y₂ = X₁ + 2X₂ - 2X₃
    </p>

    <div class="input-group">
      <label>Количество строк (m):</label>
      <input type="number" id="rows" value="2" min="1" max="10">
      <label>Количество столбцов (n):</label>
      <input type="number" id="cols" value="3" min="1" max="10">
      <button class="action" onclick="Lab1.setupMatrix()">Создать матрицу</button>
    </div>

    <div id="matrix-input"></div>
    <div id="jordan-table"></div>
    <div id="steps"></div>

    <div class="controls" style="margin-top: 20px;">
      <button class="action" onclick="Lab1.performStep()">Выполнить шаг</button>
      <button class="action" onclick="Lab1.reset()">Сбросить</button>
    </div>
  `;
}

Lab1.setupMatrix = function() {
  const m = parseInt(document.getElementById("rows").value) || 2;
  const n = parseInt(document.getElementById("cols").value) || 3;

  let html = '<h3>Заполните матрицу коэффициентов</h3><table border="1" cellpadding="5" cellspacing="0">';
  html += '<tr><th></th>';
  for (let j = 0; j < n; j++) {
    html += `<th>-X<sub>${j + 1}</sub></th>`;
  }
  html += '</tr>';

  for (let i = 0; i < m; i++) {
    html += `<tr><td>Y<sub>${i + 1}</sub></td>`;
    for (let j = 0; j < n; j++) {
      const val = Lab1.getDefault(i, j);
      html += `<td><input type="number" id="cell-${i}-${j}" value="${val}" step="any" style="width:60px;"></td>`;
    }
    html += '</tr>';
  }
  html += '</table>';
  html += '<button class="action" onclick="Lab1.loadMatrix()">Загрузить</button>';

  document.getElementById("matrix-input").innerHTML = html;
  document.getElementById("jordan-table").innerHTML = '';
  document.getElementById("steps").innerHTML = '';
};

Lab1.getDefault = function(i, j) {
  const example = [
    [-3, 5, -3],
    [-1, -2, 2]
  ];
  return example[i]?.[j] ?? 0;
};

Lab1.loadMatrix = function() {
  const m = parseInt(document.getElementById("rows").value) || 2;
  const n = parseInt(document.getElementById("cols").value) || 3;

  Lab1.currentMatrix = [];
  Lab1.variables = Array.from({ length: n }, (_, i) => `-X${i + 1}`);  
  Lab1.outputs = Array.from({ length: m }, (_, i) => `-Y${i + 1}`);     

  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      let val = parseFloat(document.getElementById(`cell-${i}-${j}`).value);
      if (isNaN(val)) val = 0;
      row.push(val);
    }
    Lab1.currentMatrix.push(row);
  }

  Lab1.renderTable();
  Lab1.logStep("Исходная таблица создана.");
};

Lab1.formatNumber = function(num) {
  if (Math.abs(num) < 1e-12) return "0";
  const rounded = Math.round(num * 1000) / 1000;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(3);
};

Lab1.formatVariable = function(varName) {
  return '-' + varName.substring(1); 
};

Lab1.getOutputLabel = function(index) {
  return '' + Lab1.outputs[index].substring(1);
};

Lab1.renderTable = function() {
  const tableEl = document.getElementById("jordan-table");
  let html = '<h3>Жорданова таблица</h3><table border="1" cellpadding="5" cellspacing="0">';
  html += '<tr><th></th>';
  // Столбцы
  Lab1.variables.forEach(v => {
    html += `<th>${Lab1.formatVariable(v)}</th>`;
  });
  html += '</tr>';

  // Строки
  Lab1.currentMatrix.forEach((row, i) => {
    html += `<tr><td>${Lab1.getOutputLabel(i)}</td>`; 
    row.forEach((cell, j) => {
      const isPivot = (Lab1.pivotRow === i && Lab1.pivotCol === j);
      const cellClass = isPivot ? 'pivot-cell' : '';
      html += `<td class="${cellClass}" data-row="${i}" data-col="${j}" onclick="Lab1.selectPivot(${i}, ${j})">${Lab1.formatNumber(cell)}</td>`;
    });
    html += '</tr>';
  });
  html += '</table>';
  tableEl.innerHTML = html;

  let style = document.getElementById('pivot-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'pivot-style';
    style.textContent = `
      .pivot-cell { 
        background-color: #ffeb3b; 
        font-weight: bold; 
        cursor: pointer; 
      }
      td {
        text-align: center;
        width: 70px;
        cursor: pointer;
      }
      td:hover {
        background-color: #f0f0f0;
      }
    `;
    document.head.appendChild(style);
  }
};

Lab1.selectPivot = function(row, col) {
  const value = Lab1.currentMatrix[row][col];
  if (Math.abs(value) < 1e-10) {
    alert("Разрешающий элемент не может быть нулём!");
    return;
  }

  Lab1.pivotRow = row;
  Lab1.pivotCol = col;

  Lab1.renderTable();
  Lab1.logStep(`Выбран разрешающий элемент a[${row+1},${col+1}] = ${Lab1.formatNumber(value)}`);
};

Lab1.performStep = function() {
  if (!Lab1.currentMatrix.length) {
    alert("Сначала загрузите матрицу!");
    return;
  }

  if (Lab1.pivotRow === undefined || Lab1.pivotCol === undefined) {
    alert("Выберите разрешающий элемент, кликнув по ячейке!");
    return;
  }

  const r = Lab1.pivotRow;
  const s = Lab1.pivotCol;
  const rows = Lab1.currentMatrix.length;
  const cols = Lab1.currentMatrix[0].length;

  const pivot = Lab1.currentMatrix[r][s];
  if (Math.abs(pivot) < 1e-10) {
    alert("Разрешающий элемент не может быть нулём!");
    return;
  }

  Lab1.logStep(`Шаг: a[${r+1},${s+1}] = ${Lab1.formatNumber(pivot)}`);

  const newMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let j = 0; j < cols; j++) {
    newMatrix[r][j] = Lab1.currentMatrix[r][j] / pivot;
  }

  for (let i = 0; i < rows; i++) {
    if (i !== r) {
      newMatrix[i][s] = -Lab1.currentMatrix[i][s] / pivot;
    }
  }

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (i !== r && j !== s) {
        newMatrix[i][j] = Lab1.currentMatrix[i][j] - (Lab1.currentMatrix[i][s] * Lab1.currentMatrix[r][j]) / pivot;
      }
    }
  }

  newMatrix[r][s] = 1 / pivot;

  const oldVar = Lab1.variables[s];  
  const oldOut = Lab1.outputs[r];    

  Lab1.variables[s] = oldOut;         
  Lab1.outputs[r] = oldVar;           

  Lab1.currentMatrix = newMatrix;
  Lab1.pivotRow = undefined;
  Lab1.pivotCol = undefined;
  Lab1.renderTable();
  Lab1.logStep(`Переменная ${oldVar} заменена на ${Lab1.outputs[r]}`);
};

Lab1.logStep = function(text) {
  const stepsEl = document.getElementById("steps");
  const div = document.createElement("div");
  div.className = "step-info";
  div.textContent = text;
  stepsEl.appendChild(div);
  stepsEl.scrollTop = stepsEl.scrollHeight;
};

Lab1.reset = function() {
  document.getElementById("matrix-input").innerHTML = '';
  document.getElementById("jordan-table").innerHTML = '';
  document.getElementById("steps").innerHTML = '';
  Lab1.currentMatrix = [];
  Lab1.variables = [];
  Lab1.outputs = [];
  Lab1.pivotRow = undefined;
  Lab1.pivotCol = undefined;
};

function initLab1() {
}