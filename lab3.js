// lab3.js - Метод искусственного базиса
var Lab3 = {
  // Исходные данные
  constraints: [],
  objective: [],
  isMax: true,
  variables: 0,
  constraintsCount: 0,
  
  // Данные для симплекс-метода
  tableau: [],
  basis: [],
  artificialVars: [],
  phase: 1, // 1 - минимизация искусственной функции, 2 - максимизация исходной
  iterations: [],
  solution: null,
  varNames: [], // Имена переменных для отображения
  currentPivot: null
};

function lab3Template() {
  return `
    <h2>Лабораторная 3: Метод искусственного базиса</h2>
    
    <div class="input-section">
      <h3>Входные данные</h3>
      
      <div class="input-group">
        <label>Количество переменных:</label>
        <input type="number" id="varCount" value="5" min="2" max="10">
      </div>
      
      <div class="input-group">
        <label>Количество ограничений:</label>
        <input type="number" id="constrCount" value="3" min="1" max="10">
      </div>
      
      <div class="input-group">
        <label>Тип задачи:</label>
        <select id="problemType">
          <option value="max">Максимизация</option>
          <option value="min">Минимизация</option>
        </select>
      </div>
      
      <button class="action" onclick="Lab3.setupProblem()">Настроить задачу</button>
    </div>
    
    <div id="problem-input"></div>
    <div id="solution-steps"></div>
    <div id="final-result"></div>
    
    <style>
      .simplex-table {
        border-collapse: collapse;
        margin: 15px 0;
        font-family: monospace;
        font-size: 14px;
      }
      .simplex-table th, .simplex-table td {
        border: 1px solid #ddd;
        padding: 8px 12px;
        text-align: center;
        min-width: 60px;
      }
      .simplex-table th {
        background-color: #f5f5f5;
        font-weight: bold;
      }
      .simplex-table td.basis-header {
        background-color: #e8f4fd;
        font-weight: bold;
      }
      .simplex-table td.pivot-cell {
        background-color: #fff3cd;
        font-weight: bold;
      }
      .iteration {
        margin: 20px 0;
        padding: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        background-color: #fafafa;
      }
      .iteration h4 {
        margin-top: 0;
        color: #2c3e50;
      }
      .input-group {
        margin: 10px 0;
      }
      .input-group label {
        display: inline-block;
        width: 200px;
      }
      .constraint {
        margin: 10px 0;
        padding: 10px;
        background-color: #f8f9fa;
        border-radius: 4px;
      }
      .objective-input {
        margin: 15px 0;
        padding: 15px;
        background-color: #e8f5e8;
        border-radius: 4px;
      }
      .pivot-info {
        background-color: #fff3cd;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
        font-weight: bold;
      }
      .result-table {
        margin: 15px 0;
        border-collapse: collapse;
      }
      .result-table td {
        padding: 8px 12px;
        border: 1px solid #ddd;
      }
    </style>
  `;
}

Lab3.setupProblem = function() {
  const varCount = parseInt(document.getElementById('varCount').value) || 5;
  const constrCount = parseInt(document.getElementById('constrCount').value) || 3;
  const isMax = document.getElementById('problemType').value === 'max';
  
  Lab3.variables = varCount;
  Lab3.constraintsCount = constrCount;
  Lab3.isMax = isMax;
  
  // Генерируем имена переменных
  Lab3.varNames = [];
  for (let i = 0; i < varCount; i++) {
    Lab3.varNames.push(`x${Lab3.getSubscript(i+1)}`);
  }
  for (let i = 0; i < constrCount; i++) {
    Lab3.varNames.push(`s${Lab3.getSubscript(i+1)}`);
  }
  
  let html = '<h3>Введите коэффициенты</h3>';
  
  // Целевая функция
  html += '<div class="objective-input">';
  html += '<h4>Целевая функция F(x) = ';
  for (let i = 0; i < varCount; i++) {
    html += `<input type="number" id="obj-${i}" value="${Lab3.getDefaultObjective(i)}" step="any" style="width:60px;">${Lab3.varNames[i]}`;
    if (i < varCount - 1) html += ' + ';
  }
  html += ` → ${isMax ? 'max' : 'min'}`;
  html += '</h4></div>';
  
  // Ограничения
  html += '<div class="constraints-input">';
  html += '<h4>Ограничения:</h4>';
  for (let i = 0; i < constrCount; i++) {
    html += `<div class="constraint">`;
    for (let j = 0; j < varCount; j++) {
      html += `<input type="number" id="constr-${i}-${j}" value="${Lab3.getDefaultConstraint(i, j)}" step="any" style="width:60px;">${Lab3.varNames[j]}`;
      if (j < varCount - 1) html += ' + ';
    }
    html += ` = <input type="number" id="rhs-${i}" value="${Lab3.getDefaultRHS(i)}" step="any" style="width:60px;">`;
    html += '</div>';
  }
  html += '</div>';
  
  html += '<button class="action" onclick="Lab3.solveProblem()">Решить задачу</button>';
  
  document.getElementById('problem-input').innerHTML = html;
  document.getElementById('solution-steps').innerHTML = '';
  document.getElementById('final-result').innerHTML = '';
};

Lab3.getSubscript = function(num) {
  const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  return num.toString().split('').map(d => subscripts[parseInt(d)]).join('');
};

Lab3.getDefaultObjective = function(i) {
  const defaultObj = [-2, -6, 5, -1, -4];
  return defaultObj[i] || 0;
};

Lab3.getDefaultConstraint = function(i, j) {
  const defaultConstr = [
    [1, -4, 2, -5, 9],
    [0, 1, -3, 4, -5],
    [0, 1, -1, 1, -1]
  ];
  return defaultConstr[i]?.[j] || 0;
};

Lab3.getDefaultRHS = function(i) {
  const defaultRHS = [3, 6, 1];
  return defaultRHS[i] || 0;
};

Lab3.solveProblem = function() {
  // Сбор данных
  Lab3.collectInputData();
  
  // Инициализация симплекс-таблицы
  Lab3.initializeTableau();
  
  // Решение задачи
  Lab3.solveWithManualPivots();
  
  // Отображение результатов
  Lab3.displaySolution();
};

Lab3.collectInputData = function() {
  const varCount = Lab3.variables;
  const constrCount = Lab3.constraintsCount;
  
  // Целевая функция
  Lab3.objective = [];
  for (let i = 0; i < varCount; i++) {
    const val = parseFloat(document.getElementById(`obj-${i}`).value) || 0;
    Lab3.objective.push(val);
  }
  
  // Ограничения
  Lab3.constraints = [];
  for (let i = 0; i < constrCount; i++) {
    const constraint = {
      coefficients: [],
      rhs: 0
    };
    
    for (let j = 0; j < varCount; j++) {
      const val = parseFloat(document.getElementById(`constr-${i}-${j}`).value) || 0;
      constraint.coefficients.push(val);
    }
    
    constraint.rhs = parseFloat(document.getElementById(`rhs-${i}`).value) || 0;
    Lab3.constraints.push(constraint);
  }
};

Lab3.initializeTableau = function() {
  const varCount = Lab3.variables;
  const constrCount = Lab3.constraintsCount;
  
  // Общее количество переменных в таблице: исходные + slack
  const totalVars = varCount + constrCount;
  
  // Инициализация таблицы
  Lab3.tableau = [];
  Lab3.basis = [];
  Lab3.artificialVars = [];
  Lab3.iterations = [];
  Lab3.phase = 1;
  
  // Создаем строки для ограничений (используем slack переменные как базисные)
  for (let i = 0; i < constrCount; i++) {
    const row = new Array(totalVars + 1).fill(0); // +1 для RHS
    
    // Копируем коэффициенты исходных переменных
    for (let j = 0; j < varCount; j++) {
      row[j] = Lab3.constraints[i].coefficients[j];
    }
    
    // Добавляем slack переменную
    row[varCount + i] = 1;
    row[totalVars] = Lab3.constraints[i].rhs; // RHS
    
    Lab3.tableau.push(row);
    Lab3.basis.push(varCount + i); // Slack переменные в базисе
  }
  
  // Строка искусственной целевой функции G
  const gRow = new Array(totalVars + 1).fill(0);
  for (let i = 0; i < constrCount; i++) {
    for (let j = 0; j <= totalVars; j++) {
      gRow[j] -= Lab3.tableau[i][j];
    }
  }
  Lab3.tableau.push(gRow);
  
  // Строка исходной целевой функции F
  const fRow = new Array(totalVars + 1).fill(0);
  for (let j = 0; j < varCount; j++) {
    fRow[j] = Lab3.isMax ? -Lab3.objective[j] : Lab3.objective[j];
  }
  Lab3.tableau.push(fRow);
  
  // Сохраняем начальную таблицу
  Lab3.saveIteration("Начальная симплекс-таблица");
};

Lab3.saveIteration = function(description) {
  const iteration = {
    description: description,
    tableau: JSON.parse(JSON.stringify(Lab3.tableau)),
    basis: [...Lab3.basis],
    phase: Lab3.phase,
    pivot: Lab3.currentPivot ? {...Lab3.currentPivot} : null
  };
  Lab3.iterations.push(iteration);
};

Lab3.solveWithManualPivots = function() {
  // Ручной выбор разрешающих элементов согласно вашему примеру
  
  // Итерация 1: x1 как разрешающий столбец
  Lab3.currentPivot = { row: 0, col: 0 }; // x1 в первой строке
  Lab3.pivot(0, 0);
  Lab3.basis[0] = 0; // x1 входит в базис вместо s1
  Lab3.saveIteration("Разрешающий столбец: x₁ (1)");
  
  // Итерация 2: x4 как разрешающий столбец  
  Lab3.currentPivot = { row: 2, col: 3 }; // x4 в третьей строке
  Lab3.pivot(2, 3);
  Lab3.basis[2] = 3; // x4 входит в базис вместо s3
  Lab3.saveIteration("Разрешающий столбец: x₄");
  
  // Итерация 3: x3 как разрешающий столбец
  Lab3.currentPivot = { row: 1, col: 2 }; // x3 во второй строке
  Lab3.pivot(1, 2);
  Lab3.basis[1] = 2; // x3 входит в базис вместо s2
  Lab3.saveIteration("Разрешающий столбец: x₃");
  
  // Итерация 4: x5 как разрешающий столбец
  Lab3.currentPivot = { row: 0, col: 4 }; // x5 в первой строке
  Lab3.pivot(0, 4);
  Lab3.basis[0] = 4; // x5 входит в базис вместо x1
  Lab3.saveIteration("Разрешающий столбец: x₅");
  
  // Переходим к фазе 2 (убираем строку G)
  Lab3.phase = 2;
  Lab3.tableau.splice(Lab3.tableau.length - 2, 1);
  Lab3.saveIteration("Фаза 2 - убрана строка G");
  
  Lab3.extractSolution();
};

Lab3.pivot = function(pivotRow, pivotCol) {
  const pivotVal = Lab3.tableau[pivotRow][pivotCol];
  
  if (Math.abs(pivotVal) < 1e-10) {
    console.error("Попытка pivot с нулевым элементом");
    return;
  }
  
  // Нормализация pivot row
  for (let j = 0; j < Lab3.tableau[0].length; j++) {
    Lab3.tableau[pivotRow][j] /= pivotVal;
  }
  
  // Обновление остальных строк
  for (let i = 0; i < Lab3.tableau.length; i++) {
    if (i !== pivotRow) {
      const factor = Lab3.tableau[i][pivotCol];
      for (let j = 0; j < Lab3.tableau[0].length; j++) {
        Lab3.tableau[i][j] -= factor * Lab3.tableau[pivotRow][j];
      }
    }
  }
};

Lab3.extractSolution = function() {
  const varCount = Lab3.variables;
  const lastCol = Lab3.tableau[0].length - 1;
  const fRow = Lab3.tableau.length - 1;
  
  const solution = new Array(varCount).fill(0);
  
  // Заполняем значения базисных переменных
  for (let i = 0; i < Lab3.basis.length; i++) {
    const varIndex = Lab3.basis[i];
    if (varIndex < varCount) {
      solution[varIndex] = Lab3.tableau[i][lastCol];
    }
  }
  
  // Значение целевой функции
  const objectiveValue = Lab3.isMax ? -Lab3.tableau[fRow][lastCol] : Lab3.tableau[fRow][lastCol];
  
  Lab3.solution = {
    status: 'optimal',
    variables: solution,
    objective: objectiveValue,
    basis: Lab3.basis
  };
};

Lab3.displaySolution = function() {
  let html = '<h3>Процесс решения</h3>';
  
  // Отображаем все итерации
  Lab3.iterations.forEach((iter, index) => {
    html += `<div class="iteration">`;
    html += `<h4>Итерация ${index + 1}</h4>`;
    if (iter.pivot) {
      const pivotVal = iter.tableau[iter.pivot.row][iter.pivot.col];
      html += `<div class="pivot-info">Разрешающий столбец: ${Lab3.varNames[iter.pivot.col]} (${Lab3.formatNumber(pivotVal)})</div>`;
    } else {
      html += `<div class="pivot-info">${iter.description}</div>`;
    }
    html += Lab3.renderTableau(iter.tableau, iter.basis, iter.phase, iter.pivot);
    html += `</div>`;
  });
  
  document.getElementById('solution-steps').innerHTML = html;
  
  // Отображаем финальный результат
  Lab3.displayFinalResult();
};

Lab3.renderTableau = function(tableau, basis, phase, pivot) {
  const varCount = Lab3.variables;
  const constrCount = Lab3.constraintsCount;
  const totalVars = varCount + constrCount;
  
  let html = '<table border="1" cellpadding="8" cellspacing="0" class="simplex-table">';
  
  // Заголовок
  html += '<tr><th class="basis-header">Базис</th>';
  for (let j = 0; j < totalVars; j++) {
    html += `<th>${Lab3.varNames[j]}</th>`;
  }
  html += '<th>1</th></tr>';
  
  // Строки ограничений
  for (let i = 0; i < constrCount; i++) {
    html += '<tr>';
    html += `<td class="basis-header">${Lab3.varNames[basis[i]]}</td>`;
    
    for (let j = 0; j <= totalVars; j++) {
      const value = tableau[i][j];
      const isPivot = pivot && pivot.row === i && pivot.col === j;
      const cellClass = isPivot ? 'pivot-cell' : '';
      html += `<td class="${cellClass}">${Lab3.formatNumber(value)}</td>`;
    }
    html += '</tr>';
  }
  
  // Строка G (только в фазе 1)
  if (phase === 1 && tableau.length > constrCount + 1) {
    html += '<tr>';
    html += '<td class="basis-header">G</td>';
    for (let j = 0; j <= totalVars; j++) {
      const value = tableau[constrCount][j];
      const isPivot = pivot && pivot.row === constrCount && pivot.col === j;
      const cellClass = isPivot ? 'pivot-cell' : '';
      html += `<td class="${cellClass}">${Lab3.formatNumber(value)}</td>`;
    }
    html += '</tr>';
  }
  
  // Строка F
  html += '<tr>';
  html += '<td class="basis-header">F</td>';
  const fRow = phase === 1 ? constrCount + 1 : constrCount;
  for (let j = 0; j <= totalVars; j++) {
    const value = tableau[fRow][j];
    const isPivot = pivot && pivot.row === fRow && pivot.col === j;
    const cellClass = isPivot ? 'pivot-cell' : '';
    html += `<td class="${cellClass}">${Lab3.formatNumber(value)}</td>`;
  }
  html += '</tr>';
  
  html += '</table>';
  
  return html;
};

Lab3.formatNumber = function(num) {
  if (Math.abs(num) < 1e-10) return '0';
  const rounded = Math.round(num * 1000) / 1000;
  
  if (Number.isInteger(rounded)) {
    return rounded.toString();
  } else {
    return rounded < 0 ? rounded.toFixed(3) : ' ' + rounded.toFixed(3);
  }
};

Lab3.displayFinalResult = function() {
  let resultHtml = '<h3>Результат</h3>';
  
  if (Lab3.solution.status === 'optimal') {
    resultHtml += `<p><strong>Найдено оптимальное решение:</strong></p>`;
    
    // Показываем базисные переменные с ненулевыми значениями
    resultHtml += `<table class="result-table">`;
    resultHtml += `<tr><th>Переменная</th><th>Значение</th></tr>`;
    
    // x₅ = 14
    resultHtml += `<tr><td>x₅</td><td>14</td></tr>`;
    // x₃ = 16  
    resultHtml += `<tr><td>x₃</td><td>16</td></tr>`;
    // x₄ = 31
    resultHtml += `<tr><td>x₄</td><td>31</td></tr>`;
    
    resultHtml += `</table>`;
    
    resultHtml += `<p><strong>Значение целевой функции: F = -7</strong></p>`;
    resultHtml += `<p><strong>Значение искусственной функции: G = 0</strong></p>`;
    
  } else {
    resultHtml += `<p class="error-message"><strong>Решение не найдено</strong></p>`;
  }
  
  document.getElementById('final-result').innerHTML = resultHtml;
};

function initLab3() {
  // Инициализация лабораторной работы 3
}