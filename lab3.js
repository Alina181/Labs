// lab3.js

var Lab3 = {
  currentMatrix: null,
  variables: 0,
  equations: 0,
  mode: 'inputEquations', // 'inputVariables' or 'inputEquations'
  history: [],
  iteration: 0,
  maxIterations: 10,
  isSolved: false,
  objectiveFunction: [],
  constraints: []
};

function lab3Template() {
  return `
    <h2>Лабораторная 3: Метод искусственного базиса</h2>
    
    <div class="mode-toggle">
      <h3>Выберите режим ввода:</h3>
      <button id="mode1" class="action mode-btn">Режим 1: Ввод базиса</button>
      <button id="mode2" class="action mode-btn active">Режим 2: Ввод уравнений</button>
    </div>
    
    <div id="input-section">
      <!-- Mode 1: Input Variables -->
      <div id="mode1-section" style="display: none;">
        <div class="input-group">
          <label>Переменных:</label>
          <input type="number" id="variables1" value="5" min="1" max="10">
          <label>Уравнений:</label>
          <input type="number" id="equations1" value="3" min="1" max="10">
          <button class="action" onclick="Lab3.setupInputMode1()">Создать</button>
        </div>
        <div id="input-fields1"></div>
      </div>
      
      <!-- Mode 2: Input Equations -->
      <div id="mode2-section">
        <div class="input-group">
          <label>Уравнений:</label>
          <input type="number" id="equations2" value="3" min="1" max="10">
          <label>Переменных:</label>
          <input type="number" id="variables2" value="5" min="1" max="10">
          <button class="action" onclick="Lab3.setupInputMode2()">Создать</button>
        </div>
        <div id="input-fields2"></div>
      </div>
    </div>
    
    <div id="matrix-section" style="display: none;">
      <h3>Исходная матрица:</h3>
      <div id="matrix-display"></div>
    </div>
    
    <div id="solution-section" style="display: none;">
      <h3>Решение:</h3>
      <div id="solution-steps"></div>
      <div class="controls">
        <button class="action" onclick="Lab3.solveStep()">Следующий шаг</button>
        <button class="action" onclick="Lab3.solveAll()">Решить полностью</button>
        <button class="action" onclick="Lab3.reset()">Сбросить</button>
      </div>
    </div>
    
    <div id="example-section">
      <h3>Пример:</h3>
      <p>
        x₁ - 4x₂ + 2x₃ - 5x₄ + 9x₅ = 3<br>
        x₂ - 3x₃ + 4x₄ - 5x₅ = 6<br>
        x₂ - x₃ + x₄ - x₅ = 1<br>
        Целевая функция: F(x) = -2x₁ - 6x₂ + 5x₃ - x₄ - 4x₅ → max
      </p>
    </div>
  `;
}

Lab3.setupInputMode1 = function() {
  Lab3.mode = 'inputVariables';
  Lab3.variables = parseInt(document.getElementById('variables1').value) || 5;
  Lab3.equations = parseInt(document.getElementById('equations1').value) || 3;
  
  const inputFields = document.getElementById('input-fields1');
  let html = '<h4>Введите коэффициенты базисных переменных:</h4>';
  html += '<table border="1" cellpadding="5" cellspacing="0">';
  html += '<tr><th>Базисная переменная</th>';
  
  for (let j = 0; j < Lab3.variables; j++) {
    html += `<th>x<sub>${j+1}</sub></th>`;
  }
  html += '<th>Свободный член</th></tr>';
  
  for (let i = 0; i < Lab3.equations; i++) {
    html += `<tr><td>B<sub>${i+1}</sub></td>`;
    for (let j = 0; j < Lab3.variables; j++) {
      const val = Lab3.getDefault(i, j, 'variables');
      html += `<td><input type="number" id="var-cell-${i}-${j}" value="${val}" step="any" style="width:60px;"></td>`;
    }
    const bVal = Lab3.getDefault(i, Lab3.variables, 'variables');
    html += `<td><input type="number" id="var-cell-${i}-${Lab3.variables}" value="${bVal}" step="any" style="width:60px;"></td>`;
    html += '</tr>';
  }
  html += '</table>';
  html += '<button class="action" onclick="Lab3.loadVariables()">Загрузить</button>';
  inputFields.innerHTML = html;
};

Lab3.setupInputMode2 = function() {
  Lab3.mode = 'inputEquations';
  Lab3.equations = parseInt(document.getElementById('equations2').value) || 3;
  Lab3.variables = parseInt(document.getElementById('variables2').value) || 5;
  
  const inputFields = document.getElementById('input-fields2');
  let html = '<h4>Введите систему уравнений:</h4>';
  html += '<table border="1" cellpadding="5" cellspacing="0">';
  html += '<tr><th>Уравнение</th>';
  
  for (let j = 0; j < Lab3.variables; j++) {
    html += `<th>x<sub>${j+1}</sub></th>`;
  }
  html += '<th>Свободный член</th></tr>';
  
  for (let i = 0; i < Lab3.equations; i++) {
    html += `<tr><td>(<sub>${i+1}</sub>)</td>`;
    for (let j = 0; j < Lab3.variables; j++) {
      const val = Lab3.getDefault(i, j, 'equations');
      html += `<td><input type="number" id="eq-cell-${i}-${j}" value="${val}" step="any" style="width:60px;"></td>`;
    }
    const bVal = Lab3.getDefault(i, Lab3.variables, 'equations');
    html += `<td><input type="number" id="eq-cell-${i}-${Lab3.variables}" value="${bVal}" step="any" style="width:60px;"></td>`;
    html += '</tr>';
  }
  html += '</table>';
  
  // Objective function input
  html += '<h4>Целевая функция (коэффициенты):</h4>';
  html += '<div class="input-group">';
  for (let j = 0; j < Lab3.variables; j++) {
    const fVal = Lab3.getDefaultObjective(j);
    html += `<label>x<sub>${j+1}</sub>: <input type="number" id="obj-${j}" value="${fVal}" step="any" style="width:60px;"></label> `;
  }
  html += '</div>';
  html += '<div class="input-group">';
  html += '<label>Направление: </label>';
  html += '<select id="direction">';
  html += '<option value="max">max</option>';
  html += '<option value="min">min</option>';
  html += '</select>';
  html += '</div>';
  html += '<button class="action" onclick="Lab3.loadEquations()">Загрузить</button>';
  inputFields.innerHTML = html;
};

Lab3.getDefault = function(i, j, mode) {
  // Example for mode 2 (equations)
  const equationsExample = [
    [1, -4, 2, -5, 9, 3],
    [0, 1, -3, 4, -5, 6],
    [0, 1, -1, 1, -1, 1]
  ];
  
  if (mode === 'equations') {
    return equationsExample[i]?.[j] ?? 0;
  } else {
    // For mode 1, we'll use an identity matrix for basis
    return (j < Lab3.variables && i === j) ? 1 : (j === Lab3.variables ? 1 : 0);
  }
};

Lab3.getDefaultObjective = function(j) {
  // Example objective function coefficients
  const objExample = [-2, -6, 5, -1, -4];
  return objExample[j] ?? 0;
};

Lab3.loadVariables = function() {
  // For simplicity, we'll convert to equations mode internally
  Lab3.equations = parseInt(document.getElementById('equations1').value) || 3;
  Lab3.variables = parseInt(document.getElementById('variables1').value) || 5;
  
  const constraints = [];
  for (let i = 0; i < Lab3.equations; i++) {
    const row = [];
    for (let j = 0; j <= Lab3.variables; j++) {
      const val = parseFloat(document.getElementById(`var-cell-${i}-${j}`).value) || 0;
      row.push(val);
    }
    constraints.push(row);
  }
  
  // Create objective function from basis
  const objective = Array(Lab3.variables).fill(0);
  
  Lab3.processInput(constraints, objective, 'max');
};

Lab3.loadEquations = function() {
  Lab3.equations = parseInt(document.getElementById('equations2').value) || 3;
  Lab3.variables = parseInt(document.getElementById('variables2').value) || 5;
  
  const constraints = [];
  for (let i = 0; i < Lab3.equations; i++) {
    const row = [];
    for (let j = 0; j <= Lab3.variables; j++) {
      const val = parseFloat(document.getElementById(`eq-cell-${i}-${j}`).value) || 0;
      row.push(val);
    }
    constraints.push(row);
  }
  
  const objective = [];
  for (let j = 0; j < Lab3.variables; j++) {
    const val = parseFloat(document.getElementById(`obj-${j}`).value) || 0;
    objective.push(val);
  }
  
  const direction = document.getElementById('direction').value;
  Lab3.processInput(constraints, objective, direction);
};

Lab3.processInput = function(constraints, objective, direction) {
  // Store original data
  Lab3.constraints = constraints;
  Lab3.objectiveFunction = objective;
  Lab3.direction = direction;
  
  // Build the initial matrix for artificial basis method
  const rows = Lab3.equations + 2; // constraints + f + g
  const cols = Lab3.variables + Lab3.equations + 1; // variables + artificial vars + free term
  
  const matrix = Array(rows).fill().map(() => Array(cols).fill(0));
  
  // Fill constraint rows
  for (let i = 0; i < Lab3.equations; i++) {
    // Free term
    matrix[i][0] = constraints[i][Lab3.variables];
    
    // Original variables
    for (let j = 0; j < Lab3.variables; j++) {
      matrix[i][j + 1] = constraints[i][j];
    }
    
    // Artificial variables (identity matrix)
    for (let j = 0; j < Lab3.equations; j++) {
      matrix[i][Lab3.variables + 1 + j] = (i === j) ? 1 : 0;
    }
  }
  
  // Fill objective function row (f)
  matrix[Lab3.equations][0] = 0;
  for (let j = 0; j < Lab3.variables; j++) {
    matrix[Lab3.equations][j + 1] = -objective[j]; // Note: negative for maximization
  }
  // Artificial variables in f row are 0
  
  // Fill g row (sum of artificial variables with negative sign)
  matrix[Lab3.equations + 1][0] = 0;
  for (let i = 0; i < Lab3.equations; i++) {
    matrix[Lab3.equations + 1][0] -= constraints[i][Lab3.variables];
  }
  
  for (let j = 0; j < Lab3.variables; j++) {
    let sum = 0;
    for (let i = 0; i < Lab3.equations; i++) {
      sum += constraints[i][j];
    }
    matrix[Lab3.equations + 1][j + 1] = -sum;
  }
  
  for (let j = 0; j < Lab3.equations; j++) {
    matrix[Lab3.equations + 1][Lab3.variables + 1 + j] = -1;
  }
  
  // Create labeled matrix
  Lab3.currentMatrix = {
    data: matrix,
    rowLabels: [],
    colLabels: []
  };
  
  // Create column labels
  Lab3.currentMatrix.colLabels = ['b'];
  for (let j = 0; j < Lab3.variables; j++) {
    Lab3.currentMatrix.colLabels.push(`x${j+1}`);
  }
  for (let j = 0; j < Lab3.equations; j++) {
    Lab3.currentMatrix.colLabels.push(`x${Lab3.variables + j + 1}`);
  }
  
  // Create row labels
  for (let i = 0; i < Lab3.equations; i++) {
    Lab3.currentMatrix.rowLabels.push(`x${Lab3.variables + i + 1}`);
  }
  Lab3.currentMatrix.rowLabels.push('f');
  Lab3.currentMatrix.rowLabels.push('g');
  
  // Display matrix
  Lab3.displayMatrix();
  
  // Hide input, show matrix and solution sections
  document.getElementById('input-section').style.display = 'none';
  document.getElementById('matrix-section').style.display = 'block';
  document.getElementById('solution-section').style.display = 'block';
};

Lab3.displayMatrix = function() {
  const matrixEl = document.getElementById('matrix-display');
  const matrix = Lab3.currentMatrix;
  
  let html = '<table border="1" cellpadding="5" cellspacing="0">';
  
  // Header row
  html += '<tr><th></th>';
  matrix.colLabels.forEach(label => {
    html += `<th>${label}</th>`;
  });
  html += '</tr>';
  
  // Data rows
  for (let i = 0; i < matrix.data.length; i++) {
    html += `<tr><td>${matrix.rowLabels[i]}</td>`;
    for (let j = 0; j < matrix.data[i].length; j++) {
      html += `<td>${Lab3.formatNumber(matrix.data[i][j])}</td>`;
    }
    html += '</tr>';
  }
  
  html += '</table>';
  matrixEl.innerHTML = html;
};

Lab3.formatNumber = function(num) {
  if (Math.abs(num) < 1e-10) return "0.00";
  return num.toFixed(2);
};

Lab3.jordanElimination = function(matrix, k, s) {
  const permissive = matrix.data[k][s];
  if (Math.abs(permissive) < 1e-10) {
    return { error: `Разрешающий элемент [${k},${s}] близок к нулю` };
  }
  
  const newMatrix = {
    data: matrix.data.map(row => [...row]),
    rowLabels: [...matrix.rowLabels],
    colLabels: [...matrix.colLabels]
  };
  
  // Swap labels
  const temp = newMatrix.colLabels[s];
  newMatrix.colLabels[s] = newMatrix.rowLabels[k];
  newMatrix.rowLabels[k] = temp;
  
  // Transform pivot row
  for (let j = 0; j < newMatrix.data[k].length; j++) {
    newMatrix.data[k][j] = matrix.data[k][j] / permissive;
  }
  
  // Transform pivot column
  for (let i = 0; i < newMatrix.data.length; i++) {
    if (i !== k) {
      newMatrix.data[i][s] = -matrix.data[i][s] / permissive;
    }
  }
  
  // Transform other elements
  for (let i = 0; i < newMatrix.data.length; i++) {
    for (let j = 0; j < newMatrix.data[i].length; j++) {
      if (i !== k && j !== s) {
        newMatrix.data[i][j] = matrix.data[i][j] - (matrix.data[i][s] * matrix.data[k][j]) / permissive;
      }
    }
  }
  
  // Set pivot element
  newMatrix.data[k][s] = 1.0 / permissive;
  
  return { matrix: newMatrix, error: null };
};

Lab3.getSolution = function(matrix) {
  const totalVars = matrix.colLabels.length - 1; // Exclude 'b' column
  const result = Array(totalVars).fill(0);
  
  // Find basic variables
  for (let i = 0; i < matrix.rowLabels.length - 2; i++) { // Exclude f and g rows
    if (matrix.rowLabels[i].startsWith('x')) {
      const varIndex = parseInt(matrix.rowLabels[i].substring(1)) - 1;
      if (varIndex >= 0 && varIndex < totalVars) {
        result[varIndex] = matrix.data[i][0];
      }
    }
  }
  
  // Get f and g values
  const fVal = matrix.data[matrix.data.length - 2][0];
  const gVal = matrix.data[matrix.data.length - 1][0];
  
  return { result, fVal, gVal };
};

Lab3.printSolution = function(matrix, iteration) {
  const solution = Lab3.getSolution(matrix);
  let html = '';
  
  if (iteration >= 0) {
    html += `<h4>Итерация ${iteration}</h4>`;
  }
  
  // Print F value
  if (Math.abs(solution.gVal) < 1e-10) {
    html += `<p>F = ${solution.fVal.toFixed(4)}</p>`;
  } else {
    if (solution.gVal < 0) {
      html += `<p>F = ${solution.fVal.toFixed(4)} - ${Math.abs(solution.gVal).toFixed(4)}M</p>`;
    } else {
      html += `<p>F = ${solution.fVal.toFixed(4)} + ${solution.gVal.toFixed(4)}M</p>`;
    }
  }
  
  // Print variables
  const nonZeroVars = [];
  for (let i = 0; i < solution.result.length; i++) {
    if (Math.abs(solution.result[i]) > 1e-10) {
      nonZeroVars.push(`x${i+1}=${solution.result[i].toFixed(4)}`);
    }
  }
  html += `<p>Переменные: ${nonZeroVars.join(' ')}</p>`;
  
  return html;
};

Lab3.getResolverPosition = function(matrix) {
  const numRows = matrix.data.length;
  const numCols = matrix.data[0].length;
  
  if (numRows < 1 || numCols < 2) {
    return { k: -1, s: -1 };
  }
  
  // Work with g row coefficients (excluding free term column)
  const gRow = matrix.data[numRows - 1].slice(1);
  let pivotCol = -1;
  
  if (Lab3.direction === 'max') {
    const minVal = Math.min(...gRow);
    if (minVal >= -1e-10) {
      return { k: -1, s: -1 }; // Optimal
    }
    pivotCol = gRow.indexOf(minVal) + 1; // +1 because we excluded first column
  } else { // min
    const maxVal = Math.max(...gRow);
    if (maxVal <= 1e-10) {
      return { k: -1, s: -1 }; // Optimal
    }
    pivotCol = gRow.indexOf(maxVal) + 1;
  }
  
  // Find pivot row
  let pivotRow = -1;
  let minRatio = Infinity;
  
  for (let i = 0; i < numRows - 2; i++) { // Exclude f and g rows
    if (matrix.data[i][pivotCol] > 1e-10) {
      const ratio = matrix.data[i][0] / matrix.data[i][pivotCol];
      if (ratio >= -1e-10 && ratio < minRatio) {
        minRatio = ratio;
        pivotRow = i;
      }
    }
  }
  
  if (pivotRow === -1) {
    return { k: -1, s: 0 }; // Unbounded
  }
  
  return { k: pivotRow, s: pivotCol };
};

Lab3.solveStep = function() {
  if (Lab3.isSolved) {
    return;
  }
  
  const stepsEl = document.getElementById('solution-steps');
  Lab3.iteration++;
  
  const { k, s } = Lab3.getResolverPosition(Lab3.currentMatrix);
  
  if (k === -1 && s === -1) {
    stepsEl.innerHTML += `<div class="step-result">${Lab3.printSolution(Lab3.currentMatrix, Lab3.iteration)}</div>`;
    stepsEl.innerHTML += '<div class="step-result"><strong>✅ Оптимальный план найден!</strong></div>';
    Lab3.isSolved = true;
    return;
  } else if (k === -1 && s === 0) {
    stepsEl.innerHTML += `<div class="step-result">${Lab3.printSolution(Lab3.currentMatrix, Lab3.iteration)}</div>`;
    stepsEl.innerHTML += '<div class="step-result"><strong>❌ Система не ограничена</strong></div>';
    Lab3.isSolved = true;
    return;
  } else if (k === -1) {
    stepsEl.innerHTML += '<div class="step-result"><strong>❌ Не удалось найти разрешающий элемент</strong></div>';
    Lab3.isSolved = true;
    return;
  }
  
  // Perform Jordan elimination
  const pivotVal = Lab3.currentMatrix.data[k][s];
  const pivotRowLabel = Lab3.currentMatrix.rowLabels[k];
  const pivotColLabel = Lab3.currentMatrix.colLabels[s];
  
  stepsEl.innerHTML += `<div class="step-info">
    <h4>Итерация ${Lab3.iteration}</h4>
    <p>Разрешающий элемент: M[${k},${s}] = ${Lab3.formatNumber(pivotVal)}</p>
    <p>Разрешающая строка: ${pivotRowLabel}</p>
    <p>Разрешающий столбец: ${pivotColLabel}</p>
  </div>`;
  
  const result = Lab3.jordanElimination(Lab3.currentMatrix, k, s);
  if (result.error) {
    stepsEl.innerHTML += `<div class="step-error">Ошибка: ${result.error}</div>`;
    Lab3.isSolved = true;
    return;
  }
  
  Lab3.currentMatrix = result.matrix;
  stepsEl.innerHTML += `<div class="step-result">${Lab3.printSolution(Lab3.currentMatrix, -1)}</div>`;
  
  // Display updated matrix
  Lab3.displayMatrix();
  
  if (Lab3.iteration >= Lab3.maxIterations) {
    stepsEl.innerHTML += '<div class="step-warning">⚠️ Достигнуто максимальное количество итераций</div>';
    Lab3.isSolved = true;
  }
};

Lab3.solveAll = function() {
  while (!Lab3.isSolved && Lab3.iteration < Lab3.maxIterations) {
    Lab3.solveStep();
  }
};

Lab3.reset = function() {
  document.getElementById('input-section').style.display = 'block';
  document.getElementById('matrix-section').style.display = 'none';
  document.getElementById('solution-section').style.display = 'none';
  document.getElementById('solution-steps').innerHTML = '';
  
  Lab3.currentMatrix = null;
  Lab3.isSolved = false;
  Lab3.iteration = 0;
  Lab3.history = [];
  
  // Reset mode buttons
  document.getElementById('mode1').classList.remove('active');
  document.getElementById('mode2').classList.add('active');
  document.getElementById('mode1-section').style.display = 'none';
  document.getElementById('mode2-section').style.display = 'block';
  
  Lab3.setupInputMode2();
};

function initLab3() {
  // Set up mode toggle buttons
  document.getElementById('mode1').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('mode2').classList.remove('active');
    document.getElementById('mode1-section').style.display = 'block';
    document.getElementById('mode2-section').style.display = 'none';
    Lab3.reset();
  });
  
  document.getElementById('mode2').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('mode1').classList.remove('active');
    document.getElementById('mode1-section').style.display = 'none';
    document.getElementById('mode2-section').style.display = 'block';
    Lab3.reset();
  });
  
  // Initialize with mode 2
  Lab3.reset();
}
