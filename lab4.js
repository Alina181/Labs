function lab4Template() {
  return `
    <h2>Лабораторная 4: Транспортная задача</h2>
    <p>Решение транспортной задачи методом потенциалов</p>

    <div class="input-group">
      <label>Поставщики (m):</label>
      <input type="number" id="suppliers" value="4" min="1" max="10">
      <label>Потребители (n):</label>
      <input type="number" id="consumers" value="5" min="1" max="10">
      <button class="action" onclick="TransportLab.setup()">Создать таблицу</button>
      <button class="action" onclick="TransportLab.loadExample()">Пример</button>
    </div>

    <div id="data-table-container"></div>
    <div id="plan-table-container"></div>
    <div id="solution-table-container"></div>
    <div id="transport-steps"></div>
    <div id="result-container"></div>

    <div class="controls">
      <button class="action" onclick="TransportLab.solveStep()">Следующий шаг</button>
      <button class="action" onclick="TransportLab.solveAll()">Решить полностью</button>
      <button class="action" onclick="TransportLab.reset()">Сбросить</button>
    </div>
  `;
}

const TransportLab = {
  costs: [],
  supply: [],
  demand: [],
  plan: [],
  potentials: { u: [], v: [] },
  state: 'input',
  stepLog: [],
  iteration: 0,
  m: 4,
  n: 5,
  initialF: 0,
  currentF: 0,
  currentPivot: null,
  currentCycle: null,
  cycleMarks: [],
  evaluations: [],
  isOptimal: false
};

TransportLab.loadExample = function() {
  document.getElementById('suppliers').value = 4;
  document.getElementById('consumers').value = 5;
  
  this.setup();
  
  setTimeout(() => {
    const exampleCosts = [
      [17, 20, 29, 26, 25],
      [3, 4, 5, 15, 24],
      [19, 2, 22, 4, 13],
      [20, 27, 1, 17, 19]
    ];
    const exampleSupply = [15, 15, 15, 15];
    const exampleDemand = [11, 11, 11, 11, 16];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        const input = document.querySelector(`.cost-cell[data-i="${i}"][data-j="${j}"]`);
        if (input) input.value = exampleCosts[i][j];
      }
    }

    for (let i = 0; i < 4; i++) {
      const input = document.querySelector(`.supply-cell[data-i="${i}"]`);
      if (input) input.value = exampleSupply[i];
    }

    for (let j = 0; j < 5; j++) {
      const input = document.querySelector(`.demand-cell[data-j="${j}"]`);
      if (input) input.value = exampleDemand[j];
    }
    
    this.logStep('Загружен пример из задания.');
  }, 100);
};

TransportLab.setup = function () {
  const m = parseInt(document.getElementById('suppliers').value) || 4;
  const n = parseInt(document.getElementById('consumers').value) || 5;

  this.m = m;
  this.n = n;
  this.resetState();

  let dataHtml = '<h3>1. Исходные данные</h3>';
  dataHtml += '<h4>Матрица стоимостей C[i][j]</h4>';
  dataHtml += '<table border="1" cellpadding="8" cellspacing="0" id="cost-table" class="input-table">';
  dataHtml += '<tr><th></th>';
  for (let j = 0; j < n; j++) {
    dataHtml += `<th>B<sub>${j + 1}</sub></th>`;
  }
  dataHtml += '<th>Запас A<sub>i</sub></th></tr>';

  for (let i = 0; i < m; i++) {
    dataHtml += `<tr><td>A<sub>${i + 1}</sub></td>`;
    for (let j = 0; j < n; j++) {
      const val = Math.floor(Math.random() * 9) + 1;
      dataHtml += `<td><input type="number" class="cost-cell" data-i="${i}" data-j="${j}" value="${val}" step="1" style="width:60px;text-align:center;"></td>`;
    }
    const supplyVal = Math.floor(Math.random() * 30) + 20;
    dataHtml += `<td><input type="number" class="supply-cell" data-i="${i}" value="${supplyVal}" step="1" style="width:60px;text-align:center;"></td></tr>`;
  }

  dataHtml += '<tr><td>Потребность B<sub>j</sub></td>';
  for (let j = 0; j < n; j++) {
    const demandVal = Math.floor(Math.random() * 25) + 10;
    dataHtml += `<td><input type="number" class="demand-cell" data-j="${j}" value="${demandVal}" step="1" style="width:60px;text-align:center;"></td>`;
  }
  dataHtml += '<td></td></tr>';
  dataHtml += '</table>';

  dataHtml += '<br><button class="action" onclick="TransportLab.load()">Загрузить данные</button>';
  
  document.getElementById('data-table-container').innerHTML = dataHtml;
  document.getElementById('plan-table-container').innerHTML = '';
  document.getElementById('solution-table-container').innerHTML = '';
  document.getElementById('transport-steps').innerHTML = '';
  document.getElementById('result-container').innerHTML = '';
};

TransportLab.load = function () {
  const m = this.m;
  const n = this.n;

  this.costs = [];
  this.supply = [];
  this.demand = [];

  for (let i = 0; i < m; i++) {
    const row = [];
    for (let j = 0; j < n; j++) {
      const val = parseFloat(document.querySelector(`.cost-cell[data-i="${i}"][data-j="${j}"]`).value) || 0;
      row.push(val);
    }
    this.costs.push(row);
  }

  let totalSupply = 0;
  for (let i = 0; i < m; i++) {
    const val = parseFloat(document.querySelector(`.supply-cell[data-i="${i}"]`).value) || 0;
    this.supply.push(val);
    totalSupply += val;
  }

  let totalDemand = 0;
  for (let j = 0; j < n; j++) {
    const val = parseFloat(document.querySelector(`.demand-cell[data-j="${j}"]`).value) || 0;
    this.demand.push(val);
    totalDemand += val;
  }

  const diff = Math.abs(totalSupply - totalDemand);
  if (diff > 1e-6) {
    alert(`Задача должна быть закрытой!\nСумма запасов: ${totalSupply}\nСумма потребностей: ${totalDemand}\nРазница: ${diff}`);
    return;
  }

  this.showPlanInput();
};

TransportLab.showPlanInput = function () {
  const m = this.m;
  const n = this.n;

  let planHtml = '<h3>2. Начальный план перевозок</h3>';
  planHtml += '<p>Введите начальный план или выберите метод его генерации:</p>';
  planHtml += '<table border="1" cellpadding="8" cellspacing="0" id="plan-table" class="input-table">';
  planHtml += '<tr><th></th>';
  for (let j = 0; j < n; j++) {
    planHtml += `<th>B<sub>${j + 1}</sub></th>`;
  }
  planHtml += '<th>Запас A<sub>i</sub></th></tr>';

  for (let i = 0; i < m; i++) {
    planHtml += `<tr><td>A<sub>${i + 1}</sub></td>`;
    for (let j = 0; j < n; j++) {
      planHtml += `<td><input type="number" class="plan-cell" data-i="${i}" data-j="${j}" value="0" min="0" step="1" style="width:60px;text-align:center;"></td>`;
    }
    planHtml += `<td>${this.supply[i]}</td></tr>`;
  }

  planHtml += '<tr><td>Потребность</td>';
  for (let j = 0; j < n; j++) {
    planHtml += `<td>${this.demand[j]}</td>`;
  }
  planHtml += '<td></td></tr>';
  planHtml += '</table>';

  planHtml += `
    <br>
    <button class="action" onclick="TransportLab.useMinElement()">Метод минимального элемента</button>
    <button class="action" onclick="TransportLab.useNorthwest()">Метод северо-западного угла</button>
    <button class="action" onclick="TransportLab.useCustomPlan()">Использовать свой план</button>
  `;

  document.getElementById('plan-table-container').innerHTML = planHtml;
  this.state = 'initial_plan';
};

TransportLab.useMinElement = function() {
  const m = this.m;
  const n = this.n;
  
  let supplyCopy = [...this.supply];
  let demandCopy = [...this.demand];
  
  this.plan = Array(m).fill().map(() => Array(n).fill(0));
  
  while (supplyCopy.some(s => s > 0) && demandCopy.some(d => d > 0)) {
    let minCost = Infinity;
    let minI = -1;
    let minJ = -1;
    
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (supplyCopy[i] > 0 && demandCopy[j] > 0 && this.costs[i][j] < minCost) {
          minCost = this.costs[i][j];
          minI = i;
          minJ = j;
        }
      }
    }
    
    if (minI === -1) break;
    
    const amount = Math.min(supplyCopy[minI], demandCopy[minJ]);
    this.plan[minI][minJ] = amount;
    supplyCopy[minI] -= amount;
    demandCopy[minJ] -= amount;
  }
  
  this.logStep('Начальный план создан методом минимального элемента.');
  this.validateAndProceed();
};

TransportLab.useNorthwest = function () {
  const m = this.m;
  const n = this.n;
  this.plan = Array(m).fill().map(() => Array(n).fill(0));

  let i = 0, j = 0;
  let supplyCopy = [...this.supply];
  let demandCopy = [...this.demand];

  while (i < m && j < n) {
    const amount = Math.min(supplyCopy[i], demandCopy[j]);
    this.plan[i][j] = amount;
    supplyCopy[i] -= amount;
    demandCopy[j] -= amount;
    if (supplyCopy[i] === 0) i++;
    if (demandCopy[j] === 0) j++;
  }

  this.logStep('Начальный план создан методом северо-западного угла.');
  this.validateAndProceed();
};

TransportLab.useCustomPlan = function () {
  const m = this.m;
  const n = this.n;
  this.plan = Array(m).fill().map(() => Array(n).fill(0));

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      const val = parseFloat(document.querySelector(`.plan-cell[data-i="${i}"][data-j="${j}"]`).value) || 0;
      if (val < 0) {
        alert(`Перевозка X[${i + 1}][${j + 1}] не может быть отрицательной!`);
        return;
      }
      this.plan[i][j] = val;
    }
  }

  for (let i = 0; i < m; i++) {
    const rowSum = this.plan[i].reduce((a, b) => a + b, 0);
    if (Math.abs(rowSum - this.supply[i]) > 1e-6) {
      alert(`Ошибка: сумма перевозок от поставщика A${i + 1} (${rowSum}) ≠ запасу (${this.supply[i]}).`);
      return;
    }
  }

  for (let j = 0; j < n; j++) {
    let colSum = 0;
    for (let i = 0; i < m; i++) {
      colSum += this.plan[i][j];
    }
    if (Math.abs(colSum - this.demand[j]) > 1e-6) {
      alert(`Ошибка: сумма перевозок к потребителю B${j + 1} (${colSum}) ≠ потребности (${this.demand[j]}).`);
      return;
    }
  }

  let basisCount = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (this.plan[i][j] > 0) basisCount++;
    }
  }

  if (basisCount > m + n - 1) {
    alert(`План не может содержать больше ${m + n - 1} базисных клеток! Текущее: ${basisCount}.`);
    return;
  }

  if (basisCount === 0) {
    alert('План не может быть пустым!');
    return;
  }

  this.logStep('Используется пользовательский начальный план.');
  this.validateAndProceed();
};

TransportLab.validateAndProceed = function() {
  this.calculateCurrentF();
  this.initialF = this.currentF;
  this.state = 'optimizing';
  this.iteration = 0;
  this.isOptimal = false;
  this.renderSolutionTable();
  this.logStep(`Начальный план загружен. Целевая функция F = ${this.currentF}`);
};

TransportLab.renderSolutionTable = function () {
  const m = this.m;
  const n = this.n;
  
  let solutionHtml = '<h3>3. Решение задачи (итерация ' + this.iteration + ')</h3>';
  solutionHtml += '<p>Текущее значение целевой функции: <strong>F = ' + this.currentF + '</strong></p>';
  
  if (this.isOptimal) {
    solutionHtml += '<div style="background:#d4edda; padding:10px; border-radius:4px; margin:10px 0;">';
    solutionHtml += '<strong>✓ План оптимален!</strong>';
    solutionHtml += '</div>';
  }
  
  solutionHtml += '<table border="1" cellpadding="8" cellspacing="0" class="solution-table">';
  
  solutionHtml += '<tr><th></th>';
  for (let j = 0; j < n; j++) {
    const v = this.potentials.v[j] !== undefined ? this.potentials.v[j].toFixed(2) : '';
    solutionHtml += `<th style="position:relative; min-width:80px;">B<sub>${j + 1}</sub><div style="position:absolute;top:2px;right:4px;color:#555;font-size:11px;">v=${v}</div></th>`;
  }
  solutionHtml += `<th style="min-width:80px;">Запасы</th></tr>`;

  for (let i = 0; i < m; i++) {
    const u = this.potentials.u[i] !== undefined ? this.potentials.u[i].toFixed(2) : '';
    solutionHtml += `<tr><td style="position:relative;">A<sub>${i + 1}</sub><div style="position:absolute;top:2px;right:4px;color:#555;font-size:11px;">u=${u}</div></td>`;
    for (let j = 0; j < n; j++) {
      const cost = this.costs[i][j];
      const x = this.plan[i][j];
      let cellContent = '';
      let cellClass = '';
      
      if (x > 0) {
        cellClass = 'basis-cell';
      }
      
      const cycleMark = this.cycleMarks.find(mark => mark.i === i && mark.j === j);
      if (cycleMark) {
        const symbol = cycleMark.sign === 1 ? '+' : '-';
        const color = cycleMark.sign === 1 ? '#2ecc71' : '#e74c3c';
        cellContent += `<div style="position:absolute;top:3px;left:3px;font-weight:bold;color:${color};font-size:16px;">${symbol}</div>`;
      }
      
      if (this.currentPivot && this.currentPivot.i === i && this.currentPivot.j === j) {
        cellContent += `<div style="position:absolute;bottom:3px;right:3px;font-weight:bold;color:#e74c3c;font-size:11px;">ввод</div>`;
      }
      
      if (x > 0) {
        cellContent += `<div style="font-weight:bold;">${x}</div>`;
      } else if (x === 0) {
        cellContent += `<div style="color:#bbb;">0</div>`;
      }
      
      cellContent += `<div style="position:absolute;top:2px;right:4px;font-size:10px;color:#888;">${cost}</div>`;
      
      if (this.evaluations[i] && this.evaluations[i][j] !== undefined && this.plan[i][j] === 0) {
        const evalVal = this.evaluations[i][j];
        const evalColor = evalVal < -1e-6 ? '#e74c3c' : '#27ae60';
        cellContent += `<div style="position:absolute;bottom:2px;left:4px;font-size:10px;color:${evalColor};">${evalVal.toFixed(2)}</div>`;
      }
      
      solutionHtml += `<td style="position:relative;width:80px;height:50px;text-align:center;vertical-align:middle;${x > 0 ? 'background:#e8f4fd;' : ''}">${cellContent}</td>`;
    }
    solutionHtml += `<td style="font-weight:bold;">${this.supply[i]}</td></tr>`;
  }

  solutionHtml += '<tr><td style="font-weight:bold;">Потребности</td>';
  for (let j = 0; j < n; j++) {
    solutionHtml += `<td style="font-weight:bold;">${this.demand[j]}</td>`;
  }
  solutionHtml += '<td></td></tr>';

  solutionHtml += '</table>';
  
  document.getElementById('solution-table-container').innerHTML = solutionHtml;
};

TransportLab.logStep = function (text) {
  this.stepLog.push(`Итерация ${this.iteration}: ${text}`);
  const logEl = document.getElementById('transport-steps');
  logEl.innerHTML = '<h4>Ход решения:</h4>' + this.stepLog.map(s => `<div style="margin:5px 0;padding:5px;border-bottom:1px solid #eee;">${s}</div>`).join('');
  logEl.scrollTop = logEl.scrollHeight;
};

TransportLab.calculateCurrentF = function() {
  this.currentF = 0;
  for (let i = 0; i < this.m; i++) {
    for (let j = 0; j < this.n; j++) {
      this.currentF += this.plan[i][j] * this.costs[i][j];
    }
  }
  return this.currentF;
};

TransportLab.calculatePotentials = function () {
  const m = this.m;
  const n = this.n;
  this.potentials.u = Array(m).fill(null);
  this.potentials.v = Array(n).fill(null);

  this.potentials.u[0] = 0;
  let changed = true;
  const maxIter = m * n * 2;

  for (let iter = 0; iter < maxIter && changed; iter++) {
    changed = false;
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        if (this.plan[i][j] > 0) {
          if (this.potentials.u[i] !== null && this.potentials.v[j] === null) {
            this.potentials.v[j] = this.costs[i][j] - this.potentials.u[i];
            changed = true;
          } else if (this.potentials.u[i] === null && this.potentials.v[j] !== null) {
            this.potentials.u[i] = this.costs[i][j] - this.potentials.v[j];
            changed = true;
          }
        }
      }
    }
  }

  return this.potentials.u.every(u => u !== null) || this.potentials.v.every(v => v !== null);
};

TransportLab.calculateEvaluations = function() {
  const m = this.m;
  const n = this.n;
  this.evaluations = Array(m).fill().map(() => Array(n).fill(0));
  
  let minEval = Infinity;
  let pivotCell = null;
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (this.plan[i][j] === 0) {
        const evalVal = this.costs[i][j] - (this.potentials.u[i] || 0) - (this.potentials.v[j] || 0);
        this.evaluations[i][j] = Math.round(evalVal * 1000) / 1000;
        
        if (this.evaluations[i][j] < minEval) {
          minEval = this.evaluations[i][j];
          pivotCell = {i, j, eval: this.evaluations[i][j]};
        }
      }
    }
  }
  
  return {minEval, pivotCell};
};

TransportLab.findCycle = function(startI, startJ) {
  const m = this.m;
  const n = this.n;
  
  const visited = Array(m).fill().map(() => Array(n).fill(false));
  const path = [];
  
  const dfs = (i, j, fromRow) => {
    if (i === startI && j === startJ && path.length > 0) {
      if (path.length % 2 === 0) return true;
      return false;
    }
    
    if (visited[i][j]) return false;
    visited[i][j] = true;
    path.push([i, j]);
    
    if (fromRow) {
      for (let nj = 0; nj < n; nj++) {
        if (nj !== j && (this.plan[i][nj] > 0 || (i === startI && nj === startJ))) {
          if (dfs(i, nj, false)) return true;
        }
      }
    } else {
      for (let ni = 0; ni < m; ni++) {
        if (ni !== i && (this.plan[ni][j] > 0 || (ni === startI && j === startJ))) {
          if (dfs(ni, j, true)) return true;
        }
      }
    }
    
    path.pop();
    visited[i][j] = false;
    return false;
  };
  
  if (dfs(startI, startJ, true)) {
    return path;
  }
  
  return null;
};

TransportLab.solveStep = function () {
  if (this.state !== 'optimizing') {
    alert('Сначала создайте начальный план!');
    return;
  }

  if (this.isOptimal) {
    alert('План уже оптимален!');
    return;
  }

  this.iteration++;
  this.cycleMarks = [];
  this.currentPivot = null;
  
  if (!this.calculatePotentials()) {
    this.logStep('Не удалось найти потенциалы (вырожденный план).');
    return;
  }

  const evalResult = this.calculateEvaluations();
  this.renderSolutionTable();
  
  this.logStep(`Потенциалы вычислены. Минимальная оценка: ${evalResult.minEval.toFixed(3)}`);
  
  if (evalResult.minEval >= -1e-6) {
    this.isOptimal = true;
    this.showResult();
    return;
  }
  
  this.currentPivot = evalResult.pivotCell;
  this.logStep(`Вводим клетку (${this.currentPivot.i+1}, ${this.currentPivot.j+1}) с оценкой ${this.currentPivot.eval.toFixed(3)}`);
  
  const cycle = this.findCycle(this.currentPivot.i, this.currentPivot.j);
  if (!cycle || cycle.length < 4) {
    this.logStep('Ошибка: не удалось найти цикл пересчёта.');
    return;
  }
  
  for (let k = 0; k < cycle.length; k++) {
    const [i, j] = cycle[k];
    this.cycleMarks.push({i, j, sign: k % 2 === 0 ? 1 : -1});
  }
  
  this.renderSolutionTable();
  
  let theta = Infinity;
  for (let k = 1; k < cycle.length; k += 2) {
    const [i, j] = cycle[k];
    theta = Math.min(theta, this.plan[i][j]);
  }
  
  this.logStep(`θ = ${theta} (находится в клетке со знаком "-")`);
  
  for (let k = 0; k < cycle.length; k++) {
    const [i, j] = cycle[k];
    if (k % 2 === 0) {
      this.plan[i][j] += theta;
    } else {
      this.plan[i][j] -= theta;
    }
  }
  
  this.cleanZeroBasis();
  this.calculateCurrentF();
  
  this.logStep(`План скорректирован. Новое значение F = ${this.currentF}`);
  
  this.renderSolutionTable();
};

TransportLab.solveAll = function() {
  if (this.state !== 'optimizing') {
    alert('Сначала создайте начальный план!');
    return;
  }
  
  let maxIterations = 50;
  let iter = 0;
  
  while (!this.isOptimal && iter < maxIterations) {
    this.solveStep();
    iter++;
    
    if (this.isOptimal) break;
  }
  
  if (!this.isOptimal) {
    this.logStep(`Достигнуто максимальное количество итераций (${maxIterations})`);
  }
};

TransportLab.cleanZeroBasis = function () {
  const m = this.m;
  const n = this.n;
  const maxBasis = m + n - 1;
  
  let basisCount = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (this.plan[i][j] > 0) basisCount++;
    }
  }
  
  if (basisCount <= maxBasis) return;
  
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (this.plan[i][j] === 0 && basisCount > maxBasis) {
        this.plan[i][j] = -1;
        basisCount--;
      }
    }
  }
};

TransportLab.showResult = function() {
  const savings = this.initialF > 0 ? ((this.initialF - this.currentF) / this.initialF * 100).toFixed(2) : '0';
  
  let resultHtml = `
    <div class="result-box">
      <h3>✅ Решение найдено!</h3>
      <p><strong>Оптимальные затраты (F<sub>опт</sub>)</strong>: ${this.currentF.toFixed(2)}</p>
      <p><strong>Начальные затраты</strong>: ${this.initialF.toFixed(2)}</p>
      <p><strong>Экономия</strong>: ${savings}%</p>
      <p><strong>Количество итераций</strong>: ${this.iteration}</p>
      <hr>
      <h4>Оптимальный план перевозок:</h4>
      <table border="1" cellpadding="5" cellspacing="0" style="width:100%;">
        <tr><th></th>`;
  
  for (let j = 0; j < this.n; j++) {
    resultHtml += `<th>B${j+1}</th>`;
  }
  resultHtml += `</tr>`;
  
  for (let i = 0; i < this.m; i++) {
    resultHtml += `<tr><td>A${i+1}</td>`;
    for (let j = 0; j < this.n; j++) {
      if (this.plan[i][j] > 0) {
        resultHtml += `<td style="background:#e8f4fd;">${this.plan[i][j]} (${this.costs[i][j]})</td>`;
      } else {
        resultHtml += `<td style="color:#bbb;">0</td>`;
      }
    }
    resultHtml += `</tr>`;
  }
  
  resultHtml += `</table></div>`;
  
  document.getElementById('result-container').innerHTML = resultHtml;
};

TransportLab.resetState = function() {
  this.costs = [];
  this.supply = [];
  this.demand = [];
  this.plan = [];
  this.potentials = { u: [], v: [] };
  this.state = 'input';
  this.stepLog = [];
  this.iteration = 0;
  this.initialF = 0;
  this.currentF = 0;
  this.currentPivot = null;
  this.currentCycle = null;
  this.cycleMarks = [];
  this.evaluations = [];
  this.isOptimal = false;
};

TransportLab.reset = function () {
  this.resetState();
  document.getElementById('data-table-container').innerHTML = '';
  document.getElementById('plan-table-container').innerHTML = '';
  document.getElementById('solution-table-container').innerHTML = '';
  document.getElementById('transport-steps').innerHTML = '';
  document.getElementById('result-container').innerHTML = '';
};

function initLab4() {
  const style = document.createElement('style');
  style.textContent = `
    .input-table {
      margin: 20px 0;
      border-collapse: collapse;
      width: 100%;
      max-width: 1200px;
    }
    .input-table th, .input-table td {
      padding: 8px;
      text-align: center;
      border: 1px solid #ddd;
    }
    .input-table th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    .input-table input {
      width: 60px;
      padding: 4px;
      text-align: center;
      border: 1px solid #ccc;
      border-radius: 3px;
    }
    .solution-table {
      margin: 20px 0;
      border-collapse: collapse;
      width: 100%;
      max-width: 1200px;
    }
    .solution-table th, .solution-table td {
      padding: 8px;
      text-align: center;
      min-width: 80px;
      border: 1px solid #ddd;
    }
    .solution-table th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    .solution-table td {
      position: relative;
      height: 50px;
    }
    .basis-cell {
      background-color: #e8f4fd !important;
    }
    #transport-steps {
      margin: 20px 0;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 4px;
      min-height: 100px;
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #ddd;
      line-height: 1.5;
    }
    .controls {
      margin: 20px 0;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .action {
      padding: 8px 16px;
      background-color: #3498db;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin: 5px 0;
      transition: background 0.2s;
    }
    .action:hover {
      background-color: #2980b9;
    }
    .action:active {
      transform: translateY(1px);
    }
    .result-box {
      margin: 20px 0;
      padding: 20px;
      background: #e8f5e8;
      border-radius: 8px;
      border: 1px solid #4caf50;
    }
    .result-box h3 {
      color: #2e7d32;
      margin-top: 0;
    }
    .result-box table {
      margin: 10px 0;
      border-collapse: collapse;
      width: 100%;
    }
    .result-box table th, .result-box table td {
      border: 1px solid #bdc3c7;
      padding: 6px;
      text-align: center;
    }
    h2, h3, h4 {
      color: #2c3e50;
    }
    .input-group {
      margin: 15px 0;
      padding: 10px;
      background: #f0f7ff;
      border-radius: 4px;
    }
    .input-group label {
      margin-right: 5px;
      font-weight: bold;
    }
    .input-group input {
      margin-right: 15px;
    }
  `;
  document.head.appendChild(style);
}