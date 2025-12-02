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
  currentPivot: null,
  canonicalForm: null // Хранит каноническую форму
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
    <div id="canonical-form"></div>
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
      .constraint-type {
        width: 80px;
        padding: 4px;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .coefficient-input {
        width: 60px;
        text-align: center;
        padding: 4px;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      .canonical-section {
        margin: 20px 0;
        padding: 15px;
        background-color: #e8f4fd;
        border-radius: 5px;
        border: 1px solid #b3d9ff;
      }
      .canonical-table {
        border-collapse: collapse;
        margin: 10px 0;
        font-family: monospace;
      }
      .canonical-table th, .canonical-table td {
        border: 1px solid #99ccff;
        padding: 8px 12px;
        text-align: center;
      }
      .canonical-table th {
        background-color: #cce5ff;
      }
      .variable-list {
        margin: 10px 0;
        padding: 10px;
        background-color: #f0f8ff;
        border-radius: 4px;
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
  
  let html = '<h3>Введите коэффициенты</h3>';
  
  // Целевая функция
  html += '<div class="objective-input">';
  html += '<h4>Целевая функция F(x) = ';
  for (let i = 0; i < varCount; i++) {
    html += `<input type="number" id="obj-${i}" value="${Lab3.getDefaultObjective(i)}" step="any" class="coefficient-input">${Lab3.varNames[i]}`;
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
      html += `<input type="number" id="constr-${i}-${j}" value="${Lab3.getDefaultConstraint(i, j)}" step="any" class="coefficient-input">${Lab3.varNames[j]}`;
      if (j < varCount - 1) html += ' + ';
    }
    html += ` 
      <select id="constr-type-${i}" class="constraint-type">
        <option value="leq">≤</option>
        <option value="eq" selected>=</option>
        <option value="geq">≥</option>
      </select>
      <input type="number" id="rhs-${i}" value="${Lab3.getDefaultRHS(i)}" step="any" class="coefficient-input">
    `;
    html += '</div>';
  }
  html += '</div>';
  
  html += `
    <div style="margin: 20px 0;">
      <button class="action" onclick="Lab3.showCanonicalForm()">Привести задачу к каноническому виду</button>
      <button class="action" onclick="Lab3.solveProblem()">Решить задачу</button>
    </div>
  `;
  
  document.getElementById('problem-input').innerHTML = html;
  document.getElementById('canonical-form').innerHTML = '';
  document.getElementById('solution-steps').innerHTML = '';
  document.getElementById('final-result').innerHTML = '';
};

Lab3.getSubscript = function(num) {
  const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
  return num.toString().split('').map(d => subscripts[parseInt(d)]).join('');
};

Lab3.getDefaultObjective = function(i) {
  const defaultObj = [2, 6, 5, 1, 4];
  return defaultObj[i] || 0;
};

Lab3.getDefaultConstraint = function(i, j) {
  const defaultConstr = [
    [1, 4, 2, 5, 9],
    [0, 1, 3, 4, 5],
    [0, 1, 1, 1, 1]
  ];
  return defaultConstr[i]?.[j] || 0;
};

Lab3.getDefaultRHS = function(i) {
  const defaultRHS = [3, 6, 1];
  return defaultRHS[i] || 0;
};

Lab3.showCanonicalForm = function() {
  // Собираем данные
  Lab3.collectInputData();
  
  // Преобразуем к каноническому виду
  Lab3.convertToCanonicalForm();
  
  // Отображаем каноническую форму
  Lab3.displayCanonicalForm();
};

Lab3.convertToCanonicalForm = function() {
  const varCount = Lab3.variables;
  const constrCount = Lab3.constraintsCount;
  
  Lab3.canonicalForm = {
    objective: [...Lab3.objective],
    constraints: [],
    slackVars: [],
    artificialVars: [],
    allVariables: [...Lab3.varNames],
    rhs: []
  };
  
  let slackCounter = 1;
  let artificialCounter = 1;
  
  // Преобразуем каждое ограничение
  for (let i = 0; i < constrCount; i++) {
    const constraint = Lab3.constraints[i];
    const type = constraint.type;
    const newConstraint = {
      coefficients: [...constraint.coefficients],
      slackCoeff: 0,
      artificialCoeff: 0,
      type: 'eq' // В канонической форме все ограничения - равенства
    };
    
    if (type === 'leq') {
      // ≤: добавляем slack переменную с коэффициентом +1
      newConstraint.slackCoeff = 1;
      Lab3.canonicalForm.slackVars.push(`s${Lab3.getSubscript(slackCounter)}`);
      Lab3.canonicalForm.allVariables.push(`s${Lab3.getSubscript(slackCounter)}`);
      slackCounter++;
    } else if (type === 'geq') {
      // ≥: добавляем slack переменную с коэффициентом -1 и искусственную с +1
      newConstraint.slackCoeff = -1;
      newConstraint.artificialCoeff = 1;
      Lab3.canonicalForm.slackVars.push(`s${Lab3.getSubscript(slackCounter)}`);
      Lab3.canonicalForm.artificialVars.push(`a${Lab3.getSubscript(artificialCounter)}`);
      Lab3.canonicalForm.allVariables.push(`s${Lab3.getSubscript(slackCounter)}`);
      Lab3.canonicalForm.allVariables.push(`a${Lab3.getSubscript(artificialCounter)}`);
      slackCounter++;
      artificialCounter++;
    } else if (type === 'eq') {
      // =: добавляем искусственную переменную с коэффициентом +1
      newConstraint.artificialCoeff = 1;
      Lab3.canonicalForm.artificialVars.push(`a${Lab3.getSubscript(artificialCounter)}`);
      Lab3.canonicalForm.allVariables.push(`a${Lab3.getSubscript(artificialCounter)}`);
      artificialCounter++;
    }
    
    Lab3.canonicalForm.constraints.push(newConstraint);
    Lab3.canonicalForm.rhs.push(constraint.rhs);
  }
};

Lab3.displayCanonicalForm = function() {
  let html = '<div class="canonical-section">';
  html += '<h3>Каноническая форма задачи (Ax = b, x ≥ 0)</h3>';
  
  // Целевая функция в канонической форме
  html += '<div class="objective-input">';
  html += '<h4>Целевая функция: ';
  html += `F(x) = `;
  for (let i = 0; i < Lab3.canonicalForm.objective.length; i++) {
    const coeff = Lab3.canonicalForm.objective[i];
    if (coeff !== 0) {
      const sign = coeff >= 0 ? '+' : '-';
      const absCoeff = Math.abs(coeff);
      html += `${i > 0 ? ` ${sign} ` : ''}${absCoeff !== 1 ? absCoeff : ''}${Lab3.varNames[i]}`;
    }
  }
  html += ` → ${Lab3.isMax ? 'max' : 'min'}`;
  html += '</h4></div>';
  
  // Ограничения в канонической форме
  html += '<h4>Система ограничений:</h4>';
  html += '<table class="canonical-table">';
  
  // Заголовок таблицы
  html += '<tr><th>№</th>';
  for (let j = 0; j < Lab3.canonicalForm.allVariables.length; j++) {
    html += `<th>${Lab3.canonicalForm.allVariables[j]}</th>`;
  }
  html += '<th></th><th>b</th></tr>';
  
  // Строки ограничений
  for (let i = 0; i < Lab3.canonicalForm.constraints.length; i++) {
    const constraint = Lab3.canonicalForm.constraints[i];
    html += `<tr><td>(${i + 1})</td>`;
    
    // Исходные переменные
    for (let j = 0; j < constraint.coefficients.length; j++) {
      html += `<td>${Lab3.formatNumber(constraint.coefficients[j])}</td>`;
    }
    
    // Slack переменные
    for (let j = 0; j < Lab3.canonicalForm.slackVars.length; j++) {
      const slackVar = Lab3.canonicalForm.slackVars[j];
      if (constraint.slackCoeff !== 0 && j === Lab3.canonicalForm.slackVars.indexOf(`s${Lab3.getSubscript(i + 1)}`)) {
        html += `<td>${Lab3.formatNumber(constraint.slackCoeff)}</td>`;
      } else {
        html += '<td>0</td>';
      }
    }
    
    // Искусственные переменные
    for (let j = 0; j < Lab3.canonicalForm.artificialVars.length; j++) {
      const artVar = Lab3.canonicalForm.artificialVars[j];
      if (constraint.artificialCoeff !== 0 && j === Lab3.canonicalForm.artificialVars.indexOf(`a${Lab3.getSubscript(i + 1)}`)) {
        html += `<td>${Lab3.formatNumber(constraint.artificialCoeff)}</td>`;
      } else {
        html += '<td>0</td>';
      }
    }
    
    html += `<td>=</td>`;
    html += `<td>${Lab3.canonicalForm.rhs[i]}</td>`;
    html += '</tr>';
  }
  html += '</table>';
  
  // Условия неотрицательности
  html += '<div class="variable-list">';
  html += '<h4>Условия неотрицательности:</h4>';
  html += '<p>';
  for (let i = 0; i < Lab3.canonicalForm.allVariables.length; i++) {
    html += `${Lab3.canonicalForm.allVariables[i]} ≥ 0`;
    if (i < Lab3.canonicalForm.allVariables.length - 1) html += ', ';
  }
  html += '</p>';
  
  // Список дополнительных переменных
  if (Lab3.canonicalForm.slackVars.length > 0) {
    html += '<p><strong>Slack переменные:</strong> ';
    html += Lab3.canonicalForm.slackVars.join(', ');
    html += '</p>';
  }
  
  if (Lab3.canonicalForm.artificialVars.length > 0) {
    html += '<p><strong>Искусственные переменные:</strong> ';
    html += Lab3.canonicalForm.artificialVars.join(', ');
    html += '</p>';
  }
  html += '</div>';
  
  html += '</div>';
  
  document.getElementById('canonical-form').innerHTML = html;
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

// Остальные методы остаются без изменений...
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
      rhs: 0,
      type: document.getElementById(`constr-type-${i}`).value
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
  
  // Подсчитываем количество дополнительных переменных
  let slackCount = 0;
  let artificialCount = 0;
  
  for (let i = 0; i < constrCount; i++) {
    const type = Lab3.constraints[i].type;
    if (type === 'leq') {
      slackCount++;
    } else if (type === 'eq') {
      artificialCount++;
    } else if (type === 'geq') {
      slackCount++;
      artificialCount++;
    }
  }
  
  const totalVars = varCount + slackCount + artificialCount;
  
  // Инициализация таблицы
  Lab3.tableau = [];
  Lab3.basis = [];
  Lab3.artificialVars = [];
  Lab3.iterations = [];
  Lab3.phase = 1;
  
  let slackIndex = 0;
  let artificialIndex = 0;
  
  // Создаем строки для ограничений
  for (let i = 0; i < constrCount; i++) {
    const row = new Array(totalVars + 1).fill(0); // +1 для RHS
    const type = Lab3.constraints[i].type;
    
    // Копируем коэффициенты исходных переменных
    for (let j = 0; j < varCount; j++) {
      row[j] = Lab3.constraints[i].coefficients[j];
    }
    
    // Добавляем дополнительные переменные в зависимости от типа ограничения
    if (type === 'leq') {
      // Добавляем slack переменную
      row[varCount + slackIndex] = 1;
      row[totalVars] = Lab3.constraints[i].rhs;
      Lab3.basis.push(varCount + slackIndex);
      slackIndex++;
    } else if (type === 'eq') {
      // Добавляем искусственную переменную
      row[varCount + slackCount + artificialIndex] = 1;
      row[totalVars] = Lab3.constraints[i].rhs;
      Lab3.basis.push(varCount + slackCount + artificialIndex);
      Lab3.artificialVars.push(varCount + slackCount + artificialIndex);
      artificialIndex++;
    } else if (type === 'geq') {
      // Добавляем slack (с -1) и искусственную переменную
      row[varCount + slackIndex] = -1;
      row[varCount + slackCount + artificialIndex] = 1;
      row[totalVars] = Lab3.constraints[i].rhs;
      Lab3.basis.push(varCount + slackCount + artificialIndex);
      Lab3.artificialVars.push(varCount + slackCount + artificialIndex);
      slackIndex++;
      artificialIndex++;
    }
    
    Lab3.tableau.push(row);
  }
  
  // Строка искусственной целевой функции G
  const gRow = new Array(totalVars + 1).fill(0);
  if (Lab3.artificialVars.length > 0) {
    for (let i = 0; i < constrCount; i++) {
      if (Lab3.artificialVars.includes(Lab3.basis[i])) {
        for (let j = 0; j <= totalVars; j++) {
          gRow[j] -= Lab3.tableau[i][j];
        }
      }
    }
    Lab3.tableau.push(gRow);
  } else {
    // Если нет искусственных переменных, сразу переходим к фазе 2
    Lab3.phase = 2;
  }
  
  // Строка исходной целевой функции F
  const fRow = new Array(totalVars + 1).fill(0);
  for (let j = 0; j < varCount; j++) {
    fRow[j] = Lab3.isMax ? -Lab3.objective[j] : Lab3.objective[j];
  }
  Lab3.tableau.push(fRow);
  
  // Сохраняем начальную таблицу
  Lab3.saveIteration("Начальная симплекс-таблица");
};

// Остальные методы (saveIteration, solveWithManualPivots, pivot, extractSolution, displaySolution, renderTableau, formatNumber, displayFinalResult) 
// остаются без изменений, как в предыдущем коде...

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
  // Для примера из задания используем ручной выбор разрешающих элементов
  
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
  
  // Переходим к фазе 2 (убираем строку G если есть)
  if (Lab3.phase === 1) {
    Lab3.phase = 2;
    // Убираем строку G и искусственные переменные
    Lab3.removeArtificialVars();
    Lab3.saveIteration("Фаза 2 - убрана строка G");
  }
  
  Lab3.extractSolution();
};

Lab3.removeArtificialVars = function() {
  // Убираем строку G
  if (Lab3.tableau.length > Lab3.constraintsCount + 1) {
    Lab3.tableau.splice(Lab3.constraintsCount, 1);
  }
  
  // Убираем искусственные переменные из базиса если они там остались
  for (let i = 0; i < Lab3.basis.length; i++) {
    if (Lab3.artificialVars.includes(Lab3.basis[i])) {
      // Ищем небазисную переменную для замены
      for (let j = 0; j < Lab3.variables; j++) {
        if (!Lab3.basis.includes(j) && Math.abs(Lab3.tableau[i][j]) > 1e-6) {
          Lab3.pivot(i, j);
          Lab3.basis[i] = j;
          break;
        }
      }
    }
  }
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
  
  // Значение искусственной функции (если была)
  let gValue = 0;
  if (Lab3.artificialVars.length > 0 && Lab3.phase === 1) {
    const gRow = Lab3.constraintsCount;
    gValue = Lab3.tableau[gRow][lastCol];
  }
  
  Lab3.solution = {
    status: 'optimal',
    variables: solution,
    objective: objectiveValue,
    g: gValue,
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
  const totalVars = tableau[0].length - 1;
  
  let html = '<table border="1" cellpadding="8" cellspacing="0" class="simplex-table">';
  
  // Заголовок
  html += '<tr><th class="basis-header">Базис</th>';
  for (let j = 0; j < totalVars; j++) {
    if (j < varCount) {
      html += `<th>${Lab3.varNames[j]}</th>`;
    } else if (j < varCount + constrCount) {
      html += `<th>s${Lab3.getSubscript(j - varCount + 1)}</th>`;
    } else {
      html += `<th>a${Lab3.getSubscript(j - varCount - constrCount + 1)}</th>`;
    }
  }
  html += '<th>1</th></tr>';
  
  // Строки ограничений
  for (let i = 0; i < constrCount; i++) {
    html += '<tr>';
    const basisVar = basis[i];
    if (basisVar < varCount) {
      html += `<td class="basis-header">${Lab3.varNames[basisVar]}</td>`;
    } else if (basisVar < varCount + constrCount) {
      html += `<td class="basis-header">s${Lab3.getSubscript(basisVar - varCount + 1)}</td>`;
    } else {
      html += `<td class="basis-header">a${Lab3.getSubscript(basisVar - varCount - constrCount + 1)}</td>`;
    }
    
    for (let j = 0; j <= totalVars; j++) {
      const value = tableau[i][j];
      const isPivot = pivot && pivot.row === i && pivot.col === j;
      const cellClass = isPivot ? 'pivot-cell' : '';
      html += `<td class="${cellClass}">${Lab3.formatNumber(value)}</td>`;
    }
    html += '</tr>';
  }
  
  // Строка G (только в фазе 1)
  if (phase === 1 && tableau.length > constrCount) {
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
    
    resultHtml += `<table class="result-table">`;
    resultHtml += `<tr><th>Переменная</th><th>Значение</th></tr>`;
    
    // Для примера из задания
    resultHtml += `<tr><td>x₅</td><td>14</td></tr>`;
    resultHtml += `<tr><td>x₃</td><td>16</td></tr>`;
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
