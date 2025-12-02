// lab3.js
var Lab3 = {
  currentTable: [],
  basis: [],
  columnHeaders: [],
  F: [],
  G: [],
  iterations: [],
  phase: 1, // 1 for Phase I, 2 for Phase II
  iterationCount: 0,
  solution: null
};

function lab3Template() {
  return `
    <h2>Лабораторная 3: Метод искусственного базиса</h2>
    <p><strong>Пример:</strong> Система:<br>
      x₁ - 4x₂ + 2x₃ - 5x₄ + 9x₅ = 3<br>
      x₂ - 3x₃ + 4x₄ - 5x₅ = 6<br>
      x₂ - x₃ + x₄ - x₅ = 1<br>
      Целевая функция: F(x) = -2x₁ - 6x₂ + 5x₃ - x₄ - 4x₅ → max
    </p>

    <div class="input-group">
      <label>Режим 1: Ввод базиса</label><br>
      <label>Переменных:</label>
      <input type="number" id="vars" value="5" min="1" max="20">
      <label>Уравнений:</label>
      <input type="number" id="eqs" value="3" min="1" max="20">
      <button class="action" onclick="Lab3.setupBasis()">Создать</button>
    </div>

    <div class="input-group">
      <label>Режим 2: Ввод уравнений</label><br>
      <label>Уравнений:</label>
      <input type="number" id="eqs2" value="3" min="1" max="20">
      <label>Переменных:</label>
      <input type="number" id="vars2" value="5" min="1" max="20">
      <button class="action" onclick="Lab3.setupEquations()">Создать</button>
    </div>

    <div id="basis-input" style="display: none;"></div>
    <div id="equations-input" style="display: none;"></div>
    
    <div class="controls">
      <button class="action" onclick="Lab3.loadExample()">Загрузить пример</button>
      <button class="action" onclick="Lab3.startSolving()">Начать решение</button>
      <button class="action" onclick="Lab3.reset()">Сбросить</button>
    </div>

    <div id="solution-output" style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 5px; display: none;"></div>
    <div id="iterations-container"></div>
  `;
}

Lab3.setupBasis = function() {
  const vars = parseInt(document.getElementById("vars").value) || 5;
  const eqs = parseInt(document.getElementById("eqs").value) || 3;
  
  // Hide equations input
  document.getElementById("equations-input").style.display = "none";
  
  // Show basis input
  let html = '<h3>Заполните исходную симплекс-таблицу</h3>';
  html += '<p>Базисные переменные: ' + Array.from({length: eqs}, (_, i) => `x<sub>${vars + i + 1}</sub>`).join(', ') + '</p>';
  html += '<p>Небазисные переменные: ' + Array.from({length: vars}, (_, i) => `x<sub>${i + 1}</sub>`).join(', ') + '</p>';
  
  html += '<table border="1" cellpadding="5" cellspacing="0" style="margin-top: 10px;">';
  html += '<tr><th>Базис</th>';
  for (let j = 0; j < vars; j++) {
    html += `<th>x<sub>${j + 1}</sub></th>`;
  }
  html += '<th>Свободный член</th></tr>';
  
  for (let i = 0; i < eqs; i++) {
    html += `<tr><td>x<sub>${vars + i + 1}</sub></td>`;
    for (let j = 0; j < vars; j++) {
      const val = Lab3.getDefault(i, j);
      html += `<td><input type="number" id="cell-${i}-${j}" value="${val}" step="any" style="width:60px;"></td>`;
    }
    const freeVal = Lab3.getDefaultFree(i);
    html += `<td><input type="number" id="free-${i}" value="${freeVal}" step="any" style="width:60px;"></td>`;
    html += '</tr>';
  }
  
  // F row
  html += '<tr><td>F</td>';
  for (let j = 0; j < vars; j++) {
    const val = Lab3.getDefaultF(j);
    html += `<td><input type="number" id="f-${j}" value="${val}" step="any" style="width:60px;"></td>`;
  }
  html += '<td><input type="number" id="f-free" value="0" step="any" style="width:60px;"></td></tr>';
  
  // G row (for Phase I)
  html += '<tr><td>G</td>';
  for (let j = 0; j < vars; j++) {
    const val = Lab3.getDefaultG(j);
    html += `<td><input type="number" id="g-${j}" value="${val}" step="any" style="width:60px;"></td>`;
  }
  const gFree = Lab3.getDefaultGFree();
  html += `<td><input type="number" id="g-free" value="${gFree}" step="any" style="width:60px;"></td></tr>`;
  
  html += '</table>';
  html += '<button class="action" onclick="Lab3.loadBasisTable()">Загрузить таблицу</button>';
  
  document.getElementById("basis-input").innerHTML = html;
  document.getElementById("basis-input").style.display = "block";
};

Lab3.setupEquations = function() {
  const eqs = parseInt(document.getElementById("eqs2").value) || 3;
  const vars = parseInt(document.getElementById("vars2").value) || 5;
  
  // Hide basis input
  document.getElementById("basis-input").style.display = "none";
  
  // Show equations input
  let html = '<h3>Введите систему уравнений</h3>';
  for (let i = 0; i < eqs; i++) {
    html += `<div class="equation-row">`;
    for (let j = 0; j < vars; j++) {
      const val = Lab3.getDefault(i, j);
      html += `<input type="number" id="eq-${i}-${j}" value="${val}" step="any" style="width:50px;"> x<sub>${j+1}</sub> `;
      if (j < vars - 1) html += ' + ';
    }
    html += ' = ';
    const freeVal = Lab3.getDefaultFree(i);
    html += `<input type="number" id="eq-free-${i}" value="${freeVal}" step="any" style="width:50px;">`;
    html += '</div>';
  }
  
  // Objective function
  html += '<h3>Целевая функция (для максимизации):</h3>';
  html += '<div class="equation-row">';
  for (let j = 0; j < vars; j++) {
    const val = -Lab3.getDefaultF(j); // Note: F coefficients are negative of objective
    html += `<input type="number" id="obj-${j}" value="${val}" step="any" style="width:50px;"> x<sub>${j+1}</sub> `;
    if (j < vars - 1) html += ' + ';
  }
  html += '</div>';
  html += '<button class="action" onclick="Lab3.loadEquations()">Создать таблицу</button>';
  
  document.getElementById("equations-input").innerHTML = html;
  document.getElementById("equations-input").style.display = "block";
};

// Default values for the example
Lab3.getDefault = function(i, j) {
  const example = [
    [1, -4, 2, -5, 9],
    [0, 1, -3, 4, -5],
    [0, 1, -1, 1, -1]
  ];
  return example[i]?.[j] ?? 0;
};

Lab3.getDefaultFree = function(i) {
  const example = [3, 6, 1];
  return example[i] ?? 0;
};

Lab3.getDefaultF = function(j) {
  const example = [2, 6, -5, 1, 4]; // Note: these are coefficients in F row, not objective
  return example[j] ?? 0;
};

Lab3.getDefaultG = function(j) {
  const example = [-1, 2, 2, 0, -3];
  return example[j] ?? 0;
};

Lab3.getDefaultGFree = function() {
  return -10;
};

Lab3.loadExample = function() {
  // Set inputs to example values
  document.getElementById("vars").value = 5;
  document.getElementById("eqs").value = 3;
  document.getElementById("vars2").value = 5;
  document.getElementById("eqs2").value = 3;
  
  // Show basis input with example
  Lab3.setupBasis();
  
  // Fill in the values
  const eqs = 3;
  const vars = 5;
  for (let i = 0; i < eqs; i++) {
    for (let j = 0; j < vars; j++) {
      document.getElementById(`cell-${i}-${j}`).value = Lab3.getDefault(i, j);
    }
    document.getElementById(`free-${i}`).value = Lab3.getDefaultFree(i);
  }
  
  for (let j = 0; j < vars; j++) {
    document.getElementById(`f-${j}`).value = Lab3.getDefaultF(j);
    document.getElementById(`g-${j}`).value = Lab3.getDefaultG(j);
  }
  document.getElementById("f-free").value = 0;
  document.getElementById("g-free").value = Lab3.getDefaultGFree();
};

Lab3.loadBasisTable = function() {
  const vars = parseInt(document.getElementById("vars").value) || 5;
  const eqs = parseInt(document.getElementById("eqs").value) || 3;
  
  // Initialize table
  Lab3.currentTable = [];
  Lab3.basis = Array.from({length: eqs}, (_, i) => `x${vars + i + 1}`);
  Lab3.columnHeaders = Array.from({length: vars}, (_, i) => `x${i + 1}`);
  Lab3.F = [];
  Lab3.G = [];
  
  // Load constraint rows
  for (let i = 0; i < eqs; i++) {
    const row = [];
    for (let j = 0; j < vars; j++) {
      let val = parseFloat(document.getElementById(`cell-${i}-${j}`).value);
      if (isNaN(val)) val = 0;
      row.push(val);
    }
    let freeVal = parseFloat(document.getElementById(`free-${i}`).value);
    if (isNaN(freeVal)) freeVal = 0;
    row.push(freeVal);
    Lab3.currentTable.push(row);
  }
  
  // Load F row
  for (let j = 0; j < vars; j++) {
    let val = parseFloat(document.getElementById(`f-${j}`).value);
    if (isNaN(val)) val = 0;
    Lab3.F.push(val);
  }
  let fFree = parseFloat(document.getElementById("f-free").value);
  if (isNaN(fFree)) fFree = 0;
  Lab3.F.push(fFree);
  
  // Load G row
  for (let j = 0; j < vars; j++) {
    let val = parseFloat(document.getElementById(`g-${j}`).value);
    if (isNaN(val)) val = 0;
    Lab3.G.push(val);
  }
  let gFree = parseFloat(document.getElementById("g-free").value);
    if (isNaN(gFree)) gFree = 0;
  Lab3.G.push(gFree);
  
  // Store initial state
  Lab3.iterations = [{
    table: JSON.parse(JSON.stringify(Lab3.currentTable)),
    basis: [...Lab3.basis],
    headers: [...Lab3.columnHeaders],
    F: [...Lab3.F],
    G: [...Lab3.G],
    phase: 1,
    message: "Начальная симплекс-таблица"
  }];
  
  Lab3.iterationCount = 0;
  Lab3.phase = 1;
  Lab3.solution = null;
  Lab3.renderIterations();
};

Lab3.loadEquations = function() {
  const eqs = parseInt(document.getElementById("eqs2").value) || 3;
  const vars = parseInt(document.getElementById("vars2").value) || 5;
  
  // Initialize table
  Lab3.currentTable = [];
  Lab3.basis = Array.from({length: eqs}, (_, i) => `x${vars + i + 1}`);
  Lab3.columnHeaders = Array.from({length: vars}, (_, i) => `x${i + 1}`);
  Lab3.F = [];
  Lab3.G = [];
  
  // Load constraint rows
  for (let i = 0; i < eqs; i++) {
    const row = [];
    for (let j = 0; j < vars; j++) {
      let val = parseFloat(document.getElementById(`eq-${i}-${j}`).value);
      if (isNaN(val)) val = 0;
      row.push(val);
    }
    let freeVal = parseFloat(document.getElementById(`eq-free-${i}`).value);
    if (isNaN(freeVal)) freeVal = 0;
    row.push(freeVal);
    Lab3.currentTable.push(row);
  }
  
  // Build F row from objective function
  // Note: In simplex, F row has coefficients opposite to objective
  for (let j = 0; j < vars; j++) {
    let objVal = parseFloat(document.getElementById(`obj-${j}`).value);
    if (isNaN(objVal)) objVal = 0;
    Lab3.F.push(-objVal); // Negative because we're maximizing
  }
  Lab3.F.push(0); // Free term for F
  
  // Build G row for Phase I
  // G = -sum of artificial variables
  // Since artificial variables correspond to constraints, 
  // G row = -sum of constraint rows
  for (let j = 0; j < vars; j++) {
    let gVal = 0;
    for (let i = 0; i < eqs; i++) {
      gVal -= Lab3.currentTable[i][j];
    }
    Lab3.G.push(gVal);
  }
  let gFree = 0;
  for (let i = 0; i < eqs; i++) {
    gFree -= Lab3.currentTable[i][vars]; // vars is the index of free term
  }
  Lab3.G.push(gFree);
  
  // Store initial state
  Lab3.iterations = [{
    table: JSON.parse(JSON.stringify(Lab3.currentTable)),
    basis: [...Lab3.basis],
    headers: [...Lab3.columnHeaders],
    F: [...Lab3.F],
    G: [...Lab3.G],
    phase: 1,
    message: "Начальная симплекс-таблица"
  }];
  
  Lab3.iterationCount = 0;
  Lab3.phase = 1;
  Lab3.solution = null;
  Lab3.renderIterations();
};

Lab3.formatVar = function(varName) {
  if (varName.startsWith('x')) {
    const index = varName.substring(1);
    return `x<sub>${index}</sub>`;
  }
  return varName;
};

Lab3.formatNumber = function(num) {
  if (Math.abs(num) < 1e-10) return "0";
  const rounded = Math.round(num * 1000) / 1000;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(3);
};

Lab3.renderTable = function(iteration) {
  const { table, basis, headers, F, G, phase, message } = iteration;
  const vars = headers.length;
  const eqs = basis.length;
  
  let html = `<h3>${message}</h3>`;
  html += `<p>Фаза: ${phase === 1 ? 'I' : 'II'}</p>`;
  
  html += '<table border="1" cellpadding="5" cellspacing="0" style="margin: 10px 0;">';
  html += '<tr><th>Базис</th>';
  
  // Column headers
  headers.forEach(header => {
    html += `<th>${Lab3.formatVar(header)}</th>`;
  });
  html += '<th>Свободный член</th></tr>';
  
  // Constraint rows
  for (let i = 0; i < eqs; i++) {
    html += `<tr><td>${Lab3.formatVar(basis[i])}</td>`;
    for (let j = 0; j < vars; j++) {
      html += `<td>${Lab3.formatNumber(table[i][j])}</td>`;
    }
    html += `<td>${Lab3.formatNumber(table[i][vars])}</td></tr>`;
  }
  
  // F row
  html += `<tr><td>F</td>`;
  for (let j = 0; j < vars; j++) {
    html += `<td>${Lab3.formatNumber(F[j])}</td>`;
  }
  html += `<td>${Lab3.formatNumber(F[vars])}</td></tr>`;
  
  // G row (only in Phase I)
  if (phase === 1) {
    html += `<tr><td>G</td>`;
    for (let j = 0; j < vars; j++) {
      html += `<td>${Lab3.formatNumber(G[j])}</td>`;
    }
    html += `<td>${Lab3.formatNumber(G[vars])}</td></tr>`;
  }
  
  html += '</table>';
  return html;
};

Lab3.renderIterations = function() {
  const container = document.getElementById("iterations-container");
  container.innerHTML = '';
  
  Lab3.iterations.forEach((iteration, index) => {
    const div = document.createElement("div");
    div.className = "iteration";
    div.innerHTML = `<h3>Итерация ${index}</h3>` + Lab3.renderTable(iteration);
    container.appendChild(div);
  });
  
  // Show solution if available
  if (Lab3.solution) {
    const solutionDiv = document.getElementById("solution-output");
    solutionDiv.style.display = "block";
    let solutionHtml = `<h3>Решение:</h3>`;
    
    // Show basis values
    solutionHtml += "<p>Базисные переменные:</p><ul>";
    for (const [varName, value] of Object.entries(Lab3.solution.basisValues)) {
      solutionHtml += `<li>${Lab3.formatVar(varName)} = ${Lab3.formatNumber(value)}</li>`;
    }
    solutionHtml += "</ul>";
    
    // Show non-basis values (all zero)
    solutionHtml += "<p>Небазисные переменные (равны 0):</p><ul>";
    for (const varName of Lab3.solution.nonBasis) {
      solutionHtml += `<li>${Lab3.formatVar(varName)} = 0</li>`;
    }
    solutionHtml += "</ul>";
    
    solutionHtml += `<p>Значение целевой функции F: ${Lab3.formatNumber(Lab3.solution.F)}</p>`;
    if (Lab3.solution.G !== undefined) {
      solutionHtml += `<p>Значение вспомогательной функции G: ${Lab3.formatNumber(Lab3.solution.G)}</p>`;
    }
    
    solutionDiv.innerHTML = solutionHtml;
  } else {
    document.getElementById("solution-output").style.display = "none";
  }
};

Lab3.startSolving = function() {
  if (Lab3.iterations.length === 0) {
    alert("Сначала загрузите таблицу!");
    return;
  }
  
  // Reset to initial state
  const initial = Lab3.iterations[0];
  Lab3.currentTable = JSON.parse(JSON.stringify(initial.table));
  Lab3.basis = [...initial.basis];
  Lab3.columnHeaders = [...initial.headers];
  Lab3.F = [...initial.F];
  Lab3.G = [...initial.G];
  Lab3.phase = initial.phase;
  Lab3.iterationCount = 0;
  Lab3.iterations = [initial];
  Lab3.solution = null;
  
  // Solve step by step
  let solved = false;
  while (!solved) {
    if (Lab3.phase === 1) {
      solved = Lab3.solvePhaseI();
    } else {
      solved = Lab3.solvePhaseII();
    }
    
    // If we made a step, render it
    if (!solved && Lab3.iterations.length > Lab3.iterationCount) {
      Lab3.iterationCount = Lab3.iterations.length - 1;
      Lab3.renderIterations();
    }
  }
  
  // Final render
  Lab3.renderIterations();
};

Lab3.solvePhaseI = function() {
  const vars = Lab3.columnHeaders.length;
  const eqs = Lab3.basis.length;
  
  // Check if Phase I is complete (G = 0 and all artificial vars out of basis)
  let gFree = Lab3.G[vars];
  if (Math.abs(gFree) < 1e-10) {
    // Check if any artificial variables are in basis
    const artificialVars = Lab3.basis.filter(varName => {
      const index = parseInt(varName.substring(1));
      return index > vars; // Artificial variables have indices > original variables
    });
    
    if (artificialVars.length === 0) {
      // Phase I complete, move to Phase II
      Lab3.phase = 2;
      Lab3.iterations.push({
        table: JSON.parse(JSON.stringify(Lab3.currentTable)),
        basis: [...Lab3.basis],
        headers: [...Lab3.columnHeaders],
        F: [...Lab3.F],
        G: [...Lab3.G],
        phase: 2,
        message: "Фаза I завершена: Все искусственные переменные вышли из базиса, и значение вспомогательной функции G равно 0. Переходим к Фазе II."
      });
      return false; // Continue to Phase II
    }
  }
  
  // Find entering variable (most negative in G row for minimization)
  // But since we're using G = -sum(artificial), we want to maximize G
  // So we look for positive coefficients in G row (for non-artificial columns)
  let enteringCol = -1;
  let maxG = -Infinity;
  for (let j = 0; j < vars; j++) {
    // Skip if this column corresponds to an artificial variable
    if (parseInt(Lab3.columnHeaders[j].substring(1)) > vars) {
      continue;
    }
    
    if (Lab3.G[j] > maxG) {
      maxG = Lab3.G[j];
      enteringCol = j;
    }
  }
  
  // If no positive coefficients, optimal for Phase I
  if (maxG <= 1e-10) {
    // Check if G = 0
    if (Math.abs(gFree) < 1e-10) {
      Lab3.phase = 2;
      Lab3.iterations.push({
        table: JSON.parse(JSON.stringify(Lab3.currentTable)),
        basis: [...Lab3.basis],
        headers: [...Lab3.columnHeaders],
        F: [...Lab3.F],
        G: [...Lab3.G],
        phase: 2,
        message: "Фаза I завершена: значение вспомогательной функции G равно 0. Переходим к Фазе II."
      });
      return false;
    } else {
      // Infeasible problem
      Lab3.solution = { error: "Задача не имеет допустимого решения (G ≠ 0 в оптимуме Фазы I)" };
      return true;
    }
  }
  
  // Find leaving variable (minimum ratio test)
  let leavingRow = -1;
  let minRatio = Infinity;
  for (let i = 0; i < eqs; i++) {
    if (Lab3.currentTable[i][enteringCol] > 1e-10) {
      const ratio = Lab3.currentTable[i][vars] / Lab3.currentTable[i][enteringCol];
      if (ratio < minRatio) {
        minRatio = ratio;
        leavingRow = i;
      }
    }
  }
  
  if (leavingRow === -1) {
    // Unbounded problem
    Lab3.solution = { error: "Задача не ограничена (в Фазе I)" };
    return true;
  }
  
  // Perform pivot
  Lab3.pivot(leavingRow, enteringCol, true);
  
  // Create message
  const enteringVar = Lab3.columnHeaders[enteringCol];
  const leavingVar = Lab3.basis[leavingRow];
  const pivotElement = Lab3.currentTable[leavingRow][enteringCol];
  
  Lab3.iterations.push({
    table: JSON.parse(JSON.stringify(Lab3.currentTable)),
    basis: [...Lab3.basis],
    headers: [...Lab3.columnHeaders],
    F: [...Lab3.F],
    G: [...Lab3.G],
    phase: 1,
    message: `Итерация ${Lab3.iterationCount + 1}<br>
      Входящая переменная: ${Lab3.formatVar(enteringVar)} (разрешающий столбец)<br>
      Выходящая переменная: ${Lab3.formatVar(leavingVar)} (разрешающая строка)<br>
      Опорный элемент: ${Lab3.formatNumber(pivotElement)}`
  });
  
  Lab3.iterationCount++;
  return false; // Continue
};

Lab3.solvePhaseII = function() {
  const vars = Lab3.columnHeaders.length;
  const eqs = Lab3.basis.length;
  
  // Find entering variable (most positive in F row for maximization)
  let enteringCol = -1;
  let maxF = -Infinity;
  for (let j = 0; j < vars; j++) {
    // Skip if this column corresponds to an artificial variable
    if (parseInt(Lab3.columnHeaders[j].substring(1)) > vars) {
      continue;
    }
    
    if (Lab3.F[j] > maxF) {
      maxF = Lab3.F[j];
      enteringCol = j;
    }
  }
  
  // If no positive coefficients, optimal solution found
  if (maxF <= 1e-10) {
    // Build solution
    const basisValues = {};
    const nonBasis = [];
    
    // Basis variables
    for (let i = 0; i < eqs; i++) {
      const varName = Lab3.basis[i];
      // Only include original variables (not artificial)
      if (parseInt(varName.substring(1)) <= vars) {
        basisValues[varName] = Lab3.currentTable[i][vars];
      }
    }
    
    // Non-basis variables
    for (const header of Lab3.columnHeaders) {
      if (parseInt(header.substring(1)) <= vars) {
        nonBasis.push(header);
      }
    }
    
    Lab3.solution = {
      basisValues: basisValues,
      nonBasis: nonBasis,
      F: Lab3.F[vars],
      G: Lab3.G[vars]
    };
    
    Lab3.iterations.push({
      table: JSON.parse(JSON.stringify(Lab3.currentTable)),
      basis: [...Lab3.basis],
      headers: [...Lab3.columnHeaders],
      F: [...Lab3.F],
      G: [...Lab3.G],
      phase: 2,
      message: "Оптимальное решение найдено."
    });
    
    return true; // Done
  }
  
  // Find leaving variable (minimum ratio test)
  let leavingRow = -1;
  let minRatio = Infinity;
  for (let i = 0; i < eqs; i++) {
    if (Lab3.currentTable[i][enteringCol] > 1e-10) {
      const ratio = Lab3.currentTable[i][vars] / Lab3.currentTable[i][enteringCol];
      if (ratio < minRatio) {
        minRatio = ratio;
        leavingRow = i;
      }
    }
  }
  
  if (leavingRow === -1) {
    // Unbounded problem
    Lab3.solution = { error: "Задача не ограничена (в Фазе II)" };
    return true;
  }
  
  // Perform pivot
  Lab3.pivot(leavingRow, enteringCol, false);
  
  // Create message
  const enteringVar = Lab3.columnHeaders[enteringCol];
  const leavingVar = Lab3.basis[leavingRow];
  const pivotElement = Lab3.currentTable[leavingRow][enteringCol];
  
  Lab3.iterations.push({
    table: JSON.parse(JSON.stringify(Lab3.currentTable)),
    basis: [...Lab3.basis],
    headers: [...Lab3.columnHeaders],
    F: [...Lab3.F],
    G: [...Lab3.G],
    phase: 2,
    message: `Итерация ${Lab3.iterationCount + 1}<br>
      Входящая переменная: ${Lab3.formatVar(enteringVar)} (разрешающий столбец)<br>
      Выходящая переменная: ${Lab3.formatVar(leavingVar)} (разрешающая строка)<br>
      Опорный элемент: ${Lab3.formatNumber(pivotElement)}`
  });
  
  Lab3.iterationCount++;
  return false; // Continue
};

Lab3.pivot = function(leavingRow, enteringCol, isPhaseI) {
  const vars = Lab3.columnHeaders.length;
  const eqs = Lab3.basis.length;
  const pivotElement = Lab3.currentTable[leavingRow][enteringCol];
  
  // Normalize pivot row
  for (let j = 0; j <= vars; j++) {
    Lab3.currentTable[leavingRow][j] /= pivotElement;
  }
  
  // Update other rows
  for (let i = 0; i < eqs; i++) {
    if (i !== leavingRow) {
      const factor = Lab3.currentTable[i][enteringCol];
      for (let j = 0; j <= vars; j++) {
        Lab3.currentTable[i][j] -= factor * Lab3.currentTable[leavingRow][j];
      }
    }
  }
  
  // Update F row
  const fFactor = Lab3.F[enteringCol];
  for (let j = 0; j <= vars; j++) {
    Lab3.F[j] -= fFactor * Lab3.currentTable[leavingRow][j];
  }
  
  // Update G row (only in Phase I)
  if (isPhaseI) {
    const gFactor = Lab3.G[enteringCol];
    for (let j = 0; j <= vars; j++) {
      Lab3.G[j] -= gFactor * Lab3.currentTable[leavingRow][j];
    }
  }
  
  // Update basis and column headers
  const enteringVar = Lab3.columnHeaders[enteringCol];
  const leavingVar = Lab3.basis[leavingRow];
  
  Lab3.basis[leavingRow] = enteringVar;
  Lab3.columnHeaders[enteringCol] = leavingVar;
};

Lab3.reset = function() {
  document.getElementById("basis-input").style.display = "none";
  document.getElementById("equations-input").style.display = "none";
  document.getElementById("iterations-container").innerHTML = "";
  document.getElementById("solution-output").style.display = "none";
  Lab3.iterations = [];
  Lab3.solution = null;
};

function initLab3() {
  // Initialize with example
  Lab3.loadExample();
    }
