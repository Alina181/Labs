var Lab3 = {
  n: 5,          // количество переменных (без искусственных)
  m: 3,          // количество уравнений
  matrix: [],    // матрица коэффициентов (n + m столбцов + 1 свободный член)
  basis: [],     // базисные переменные (x6, x7, x8, потом x5, x3, x4)
  fCoeffs: [],   // коэффициенты целевой функции f (до искусственных)
  gCoeffs: [],   // строка g (искусственная функция)
  fRow: [],      // строка целевой функции F (без M)
  artificialVars: [], // имена искусственных переменных
  pivotRow: -1,
  pivotCol: -1,
  step: 0,
  solved: false,
  maxMin: 'max', // максимизировать/минимизировать
  variableNames: [] // имена всех переменных: x1, x2, ..., x8
};

function lab3Template() {
  return `
    <h2>Лабораторная 3: Метод искусственного базиса</h2>

    <div class="example-box">
      <h3>Пример из задания:</h3>
      <p><strong>f = 2x₁ - 6x₂ + 5x₃ - x₄ - 4x₅ → max</strong></p>
      <p>x₁ - 4x₂ + 2x₃ - 5x₄ + 9x₅ = 3</p>
      <p>x₂ - 3x₃ + 4x₄ - 5x₅ = 6</p>
      <p>x₂ - x₃ + x₄ - x₅ = 1</p>
      <p>xⱼ ≥ 0 (∀j=1,5)</p>
    </div>

    <div class="input-group" style="margin: 20px 0;">
      <label>Количество переменных (n):</label>
      <input type="number" id="lab3-n" value="5" min="1" max="10" style="width:60px;">

      <label>Количество уравнений (m):</label>
      <input type="number" id="lab3-m" value="3" min="1" max="10" style="width:60px;">

      <button class="action" onclick="Lab3.createTable()">Создать таблицу</button>
    </div>

    <div class="input-group" style="margin-bottom: 15px;">
      <label>Целевая функция:</label>
      <select id="lab3-maxmin" onchange="Lab3.updateMaxMin()">
        <option value="max">Максимизировать</option>
        <option value="min">Минимизировать</option>
      </select>
    </div>

    <div id="lab3-table-container" style="margin-top:15px;"></div>

    <div class="controls" style="margin-top: 20px;">
      <button class="action" onclick="Lab3.loadExample()" id="load-btn">Загрузить пример</button>
      <button class="action" onclick="Lab3.startSolving()" id="start-btn">Начать решение</button>
      <button class="action" onclick="Lab3.nextStep()" id="step-btn" disabled>Выполнить шаг</button>
      <button class="action" onclick="Lab3.reset()" id="reset-btn">Сбросить</button>
    </div>

    <div id="lab3-message" style="margin-top:15px; font-size:14px; color:#333; white-space: pre-line;">
      Укажите параметры задачи и нажмите 'Создать таблицу'.
    </div>
  `;
}

Lab3.updateMaxMin = function() {
  Lab3.maxMin = document.getElementById('lab3-maxmin').value;
};

Lab3.createTable = function() {
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

  // Инициализация
  Lab3.matrix = Array.from({ length: m }, () => Array(n + m + 1).fill(0));
  Lab3.fCoeffs = Array(n).fill(0);
  Lab3.artificialVars = [];
  Lab3.variableNames = [];
  for (let i = 0; i < n; i++) {
    Lab3.variableNames.push(`x${i + 1}`);
  }
  for (let i = 0; i < m; i++) {
    const name = `x${n + i + 1}`;
    Lab3.artificialVars.push(name);
    Lab3.variableNames.push(name);
  }
  Lab3.basis = [...Lab3.artificialVars];
  Lab3.solved = false;
  Lab3.step = 0;
  Lab3.pivotRow = -1;
  Lab3.pivotCol = -1;

  const container = document.getElementById('lab3-table-container');
  let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width:100%;">';

  // Заголовок целевой функции
  html += '<tr>';
  html += `<th colspan="${n+m+2}" style="background:#f0f0f0;">Целевая функция:</th>`;
  html += '</tr>';
  html += '<tr>';
  html += '<td style="text-align:right;">f =</td>';
  for (let j = 0; j < n; j++) {
    html += `<td><input type="number" step="any" id="f-coeff-${j}" value="${Lab3.fCoeffs[j]}" style="width:60px; text-align:center;"></td>`;
    html += `<td style="text-align:center;">x${j+1}</td>`;
    if (j < n - 1) html += '<td>+</td>';
  }
  html += `<td style="text-align:center;">→ ${Lab3.maxMin}</td>`;
  html += '</tr>';

  // Заголовок таблицы
  html += '<tr>';
  html += '<th>Базис</th>';
  for (let j = 0; j < n + m; j++) {
    html += `<th>${Lab3.variableNames[j]}</th>`;
  }
  html += '<th>Св. член</th>';
  html += '</tr>';

  // Строки уравнений
  for (let i = 0; i < m; i++) {
    html += '<tr>';
    html += `<td style="background:#f9f9f9; font-weight:bold;">${Lab3.basis[i]}</td>`;
    for (let j = 0; j < n + m + 1; j++) {
      if (j < n) {
        html += `<td><input type="number" step="any" id="cell-${i}-${j}" value="${Lab3.matrix[i][j]}" style="width:60px; text-align:center;"></td>`;
      } else if (j < n + m) {
        if (j - n === i) {
          html += `<td>1</td>`; // единичный столбец
        } else {
          html += `<td>0</td>`;
        }
      } else {
        html += `<td><input type="number" step="any" id="b-${i}" value="${Lab3.matrix[i][n+m]}" style="width:60px; text-align:center;"></td>`;
      }
    }
    html += '</tr>';
  }

  // Строка целевой функции f
  html += '<tr style="background:#fffacd; font-weight:bold;">';
  html += '<td>f</td>';
  for (let j = 0; j < n + m + 1; j++) {
    html += `<td>0</td>`;
  }
  html += '</tr>';

  // Строка искусственной функции g
  html += '<tr style="background:#e6e6fa; font-weight:bold;">';
  html += '<td>g</td>';
  for (let j = 0; j < n + m + 1; j++) {
    html += `<td>0</td>`;
  }
  html += '</tr>';

  html += '</table>';

  container.innerHTML = html;
  Lab3.showMessage("Введите коэффициенты и нажмите 'Начать решение'.");
  document.getElementById('start-btn').disabled = false;
  document.getElementById('step-btn').disabled = true;
};

Lab3.loadExample = function() {
  // Устанавливаем параметры
  document.getElementById('lab3-n').value = 5;
  document.getElementById('lab3-m').value = 3;
  document.getElementById('lab3-maxmin').value = 'max';
  Lab3.maxMin = 'max';

  // Задаём коэффициенты
  Lab3.fCoeffs = [2, -6, 5, -1, -4]; // f = 2x1 -6x2 +5x3 -x4 -4x5

  // Исходная матрица (без искусственных)
  const originalMatrix = [
    [1, -4, 2, -5, 9, 3],   // x1 -4x2 +2x3 -5x4 +9x5 = 3
    [0, 1, -3, 4, -5, 6],   // x2 -3x3 +4x4 -5x5 = 6
    [0, 1, -1, 1, -1, 1]    // x2 -x3 +x4 -x5 = 1
  ];

  // Заполняем матрицу с искусственными переменными
  Lab3.matrix = [];
  for (let i = 0; i < Lab3.m; i++) {
    const row = [];
    for (let j = 0; j < Lab3.n; j++) {
      row.push(originalMatrix[i][j]);
    }
    for (let j = 0; j < Lab3.m; j++) {
      if (j === i) {
        row.push(1); // единичный столбец
      } else {
        row.push(0);
      }
    }
    row.push(originalMatrix[i][Lab3.n]); // свободный член
    Lab3.matrix.push(row);
  }

  // Заполняем поля ввода
  for (let j = 0; j < Lab3.n; j++) {
    const fEl = document.getElementById(`f-coeff-${j}`);
    if (fEl) fEl.value = Lab3.fCoeffs[j];
  }

  for (let i = 0; i < Lab3.m; i++) {
    for (let j = 0; j < Lab3.n; j++) {
      const el = document.getElementById(`cell-${i}-${j}`);
      if (el) el.value = Lab3.matrix[i][j];
    }
    const bEl = document.getElementById(`b-${i}`);
    if (bEl) bEl.value = Lab3.matrix[i][Lab3.n + Lab3.m];
  }

  // Устанавливаем базис (для отображения)
  Lab3.basis = ['x6', 'x7', 'x8'];

  // Создаём таблицу (если ещё не создана)
  if (document.getElementById('lab3-table-container').innerHTML.trim() === '') {
    Lab3.createTable();
  } else {
    // Если таблица уже создана — просто обновим значения
    Lab3.renderTable();
  }

  // Вычисляем строку g
  Lab3.calculateGRow();

  // Сообщение
  Lab3.showMessage("Пример загружен. Нажмите 'Начать решение' для старта.");
};

Lab3.startSolving = function() {
  if (Lab3.solved) {
    Lab3.showMessage("Решение уже завершено. Нажмите 'Сбросить' для нового расчета.");
    return;
  }

  // Считываем данные
  Lab3.readInputs();

  // Проверка
  if (Lab3.matrix.length === 0) {
    Lab3.showMessage("Сначала создайте таблицу!");
    return;
  }

  // Вычисляем строку g (искусственная функция)
  Lab3.calculateGRow();

  // Рендерим таблицу с новыми данными
  Lab3.renderTable();

  Lab3.step = 0;
  Lab3.solved = false;
  Lab3.pivotRow = -1;
  Lab3.pivotCol = -1;

  document.getElementById('start-btn').disabled = true;
  document.getElementById('step-btn').disabled = false;
  Lab3.showMessage("Выберите разрешающий элемент (кликом по ячейке) и нажмите 'Выполнить шаг'.");
};

Lab3.readInputs = function() {
  // Читаем коэффициенты целевой функции
  for (let j = 0; j < Lab3.n; j++) {
    const el = document.getElementById(`f-coeff-${j}`);
    let val = parseFloat(el?.value);
    if (isNaN(val)) val = 0;
    Lab3.fCoeffs[j] = val;
  }

  // Читаем матрицу
  for (let i = 0; i < Lab3.m; i++) {
    for (let j = 0; j < Lab3.n; j++) {
      const el = document.getElementById(`cell-${i}-${j}`);
      let val = parseFloat(el?.value);
      if (isNaN(val)) val = 0;
      Lab3.matrix[i][j] = val;
    }
    const bEl = document.getElementById(`b-${i}`);
    let bVal = parseFloat(bEl?.value);
    if (isNaN(bVal)) bVal = 0;
    Lab3.matrix[i][Lab3.n + Lab3.m] = bVal;
  }
};

Lab3.calculateGRow = function() {
  // g = сумма искусственных переменных = x6 + x7 + x8
  // Выражаем их через свободные переменные:
  // x6 = 3 - x1 +4x2 -2x3 +5x4 -9x5
  // x7 = 6 - x2 +3x3 -4x4 +5x5
  // x8 = 1 - x2 +x3 -x4 +x5
  // g = x6 + x7 + x8 = (3+6+1) + (-x1) + (4-1-1)x2 + (-2+3+1)x3 + (5-4-1)x4 + (-9+5+1)x5
  // g = 10 -x1 +2x2 +2x3 +0x4 -3x5

  Lab3.gCoeffs = Array(Lab3.n + Lab3.m + 1).fill(0);

  // Коэффициенты при x_j в g = сумма коэффициентов при x_j во всех уравнениях (со знаком минус, потому что x_j = ... - a_ij * x_j)
  for (let j = 0; j < Lab3.n; j++) {
    let sumAij = 0;
    for (let i = 0; i < Lab3.m; i++) {
      sumAij += Lab3.matrix[i][j];
    }
    Lab3.gCoeffs[j] = -sumAij; // потому что x_{n+i} = b_i - sum(a_ij * x_j)
  }

  // Коэффициенты при искусственных переменных = 1
  for (let j = 0; j < Lab3.m; j++) {
    Lab3.gCoeffs[Lab3.n + j] = 1;
  }

  // Свободный член g = сумма свободных членов
  let sumBi = 0;
  for (let i = 0; i < Lab3.m; i++) {
    sumBi += Lab3.matrix[i][Lab3.n + Lab3.m];
  }
  Lab3.gCoeffs[Lab3.n + Lab3.m] = sumBi;
};

Lab3.renderTable = function() {
  const container = document.getElementById('lab3-table-container');
  let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width:100%;">';

  // Заголовок целевой функции
  html += '<tr>';
  html += `<th colspan="${Lab3.n+Lab3.m+2}" style="background:#f0f0f0;">Целевая функция:</th>`;
  html += '</tr>';
  html += '<tr>';
  html += '<td style="text-align:right;">f =</td>';
  for (let j = 0; j < Lab3.n; j++) {
    html += `<td><input type="number" step="any" id="f-coeff-${j}" value="${Lab3.fCoeffs[j]}" style="width:60px; text-align:center;" readonly></td>`;
    html += `<td style="text-align:center;">x${j+1}</td>`;
    if (j < Lab3.n - 1) html += '<td>+</td>';
  }
  html += `<td style="text-align:center;">→ ${Lab3.maxMin}</td>`;
  html += '</tr>';

  // Заголовок таблицы
  html += '<tr>';
  html += '<th>Базис</th>';
  for (let j = 0; j < Lab3.n + Lab3.m; j++) {
    html += `<th>${Lab3.variableNames[j]}</th>`;
  }
  html += '<th>Св. член</th>';
  html += '</tr>';

  // Строки уравнений
  for (let i = 0; i < Lab3.m; i++) {
    html += '<tr>';
    html += `<td style="background:#f9f9f9; font-weight:bold;">${Lab3.basis[i]}</td>`;
    for (let j = 0; j < Lab3.n + Lab3.m + 1; j++) {
      const isPivot = (Lab3.pivotRow === i && Lab3.pivotCol === j);
      const cellClass = isPivot ? 'pivot-cell' : '';
      html += `<td class="${cellClass}" data-row="${i}" data-col="${j}" onclick="Lab3.selectPivot(${i}, ${j})">${Lab3.formatNumber(Lab3.matrix[i][j])}</td>`;
    }
    html += '</tr>';
  }

  // Строка целевой функции f
  html += '<tr style="background:#fffacd; font-weight:bold;">';
  html += '<td>f</td>';
  for (let j = 0; j <= Lab3.n + Lab3.m; j++) {
    html += `<td>${Lab3.formatNumber(Lab3.fRow[j] || 0)}</td>`;
  }
  html += '</tr>';

  // Строка искусственной функции g
  html += '<tr style="background:#e6e6fa; font-weight:bold;">';
  html += '<td>g</td>';
  for (let j = 0; j <= Lab3.n + Lab3.m; j++) {
    html += `<td>${Lab3.formatNumber(Lab3.gCoeffs[j])}</td>`;
  }
  html += '</tr>';

  html += '</table>';

  container.innerHTML = html;

  // Добавляем стили для выделения разрешающего элемента
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

Lab3.formatNumber = function(num) {
  if (Math.abs(num) < 1e-10) return "0";
  const rounded = Math.round(num * 1000) / 1000;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(3);
};

Lab3.selectPivot = function(row, col) {
  if (Lab3.solved) return;

  const value = Lab3.matrix[row][col];
  if (Math.abs(value) < 1e-10) {
    Lab3.showMessage("Разрешающий элемент не может быть нулём!");
    return;
  }

  Lab3.pivotRow = row;
  Lab3.pivotCol = col;

  Lab3.renderTable();
  Lab3.showMessage(`Выбран разрешающий элемент a[${row+1},${col+1}] = ${Lab3.formatNumber(value)}`);
};

Lab3.nextStep = function() {
  if (Lab3.solved) {
    Lab3.showMessage("Решение уже найдено. Нажмите 'Сбросить' для нового расчета.");
    return;
  }

  if (Lab3.pivotRow === -1 || Lab3.pivotCol === -1) {
    Lab3.showMessage("Выберите разрешающий элемент, кликнув по ячейке!");
    return;
  }

  const r = Lab3.pivotRow;
  const s = Lab3.pivotCol;
  const pivot = Lab3.matrix[r][s];

  if (Math.abs(pivot) < 1e-10) {
    Lab3.showMessage("Разрешающий элемент не может быть нулём!");
    return;
  }

  Lab3.step++;
  Lab3.showMessage(`Шаг ${Lab3.step}: Разрешающий элемент a[${r+1},${s+1}] = ${Lab3.formatNumber(pivot)}`);

  // Жорданово исключение — правило прямоугольника

  // 1. Нормализуем строку r
  for (let j = 0; j <= Lab3.n + Lab3.m; j++) {
    Lab3.matrix[r][j] /= pivot;
  }

  // 2. Обнуляем столбец s в других строках
  for (let i = 0; i < Lab3.m; i++) {
    if (i !== r) {
      const factor = Lab3.matrix[i][s];
      for (let j = 0; j <= Lab3.n + Lab3.m; j++) {
        Lab3.matrix[i][j] -= factor * Lab3.matrix[r][j];
      }
    }
  }

  // 3. Обновляем базис
  const oldVar = Lab3.basis[r];
  const newVar = Lab3.variableNames[s];
  Lab3.basis[r] = newVar;

  // 4. Пересчитываем строку g (искусственная функция)
  Lab3.calculateGRow();

  // 5. Пересчитываем строку f
  Lab3.calculateFRow();

  // 6. Сбрасываем выбор разрешающего элемента
  Lab3.pivotRow = -1;
  Lab3.pivotCol = -1;

  // 7. Проверяем оптимальность
  const isOptimal = Lab3.checkOptimality();
  if (isOptimal) {
    Lab3.solved = true;
    Lab3.finalizeSolution();
    document.getElementById('step-btn').disabled = true;
    Lab3.showMessage("✅ Оптимальное решение найдено!");
  } else {
    Lab3.renderTable();
    Lab3.showMessage("Выберите следующий разрешающий элемент.");
  }
};

Lab3.calculateFRow = function() {
  // F = f, но выражена через базисные переменные
  // F = f = sum(fCoeffs[j] * x_j), где x_j выражены через базисные и свободные переменные
  // Это сложный процесс, но мы можем вычислить F как: f = sum( fCoeffs[j] * (b_i - sum(a_ij * x_j)) для базисных x_j)

  // Простой способ: F = f = sum(fCoeffs[j] * x_j), где x_j = ... выражены через базисные
  // Но мы будем использовать подстановку: F = f = fCoeffs * x
  // Подставим x_j из уравнений в f
  // f = sum(fCoeffs[j] * x_j), где x_j — базисные, выраженные через свободные

  // Мы будем использовать пересчёт строки F через базисные переменные
  // f = sum(fCoeffs[j] * x_j), где x_j — базисные переменные
  // x_j = b_i - sum(a_ij * x_j), где a_ij — коэффициенты из таблицы
  // f = sum(fCoeffs[j] * (b_i - sum(a_ij * x_j))) = sum(fCoeffs[j] * b_i) - sum(fCoeffs[j] * a_ij * x_j)

  // Просто вычисляем F как сумму: f = fCoeffs * x, где x — это столбцы из матрицы

  Lab3.fRow = Array(Lab3.n + Lab3.m + 1).fill(0);

  for (let i = 0; i < Lab3.m; i++) {
    const varName = Lab3.basis[i];
    const idx = Lab3.variableNames.indexOf(varName);
    if (idx >= 0 && idx < Lab3.n) {
      const coeff = Lab3.fCoeffs[idx];
      for (let j = 0; j <= Lab3.n + Lab3.m; j++) {
        Lab3.fRow[j] += coeff * Lab3.matrix[i][j];
      }
    }
  }
};

Lab3.checkOptimality = function() {
  // Для фазы 1: минимизируем g → нужно, чтобы g >= 0 и g = 0
  // Если g > 0 — продолжаем
  // Если g = 0 — переходим к фазе 2

  // Проверяем, равна ли g нулю
  if (Math.abs(Lab3.gCoeffs[Lab3.n + Lab3.m]) < 1e-10) {
    // g = 0 — переходим к оптимизации f
    // Но сначала проверим, можно ли улучшить f
    for (let j = 0; j < Lab3.n + Lab3.m; j++) {
      if (Lab3.fRow[j] < 0) {
        return false; // можно улучшить
      }
    }
    // Все коэффициенты в f >= 0 — оптимально
    return true;
  } else {
    // Проверяем, можно ли улучшить g
    for (let j = 0; j < Lab3.n + Lab3.m; j++) {
      if (Lab3.gCoeffs[j] < 0) {
        return false; // можно улучшить
      }
    }
    // Если все коэффициенты в g >= 0, но g > 0 — задача несовместна
    if (Lab3.gCoeffs[Lab3.n + Lab3.m] > 0) {
      Lab3.solved = true;
      Lab3.showMessage("❌ Задача несовместна: g > 0, но нельзя улучшить.");
      return true;
    }
    return true;
  }
};

Lab3.finalizeSolution = function() {
  // Находим значения переменных
  const solution = {};
  for (let j = 0; j < Lab3.n; j++) {
    solution[`x${j+1}`] = 0;
  }

  for (let i = 0; i < Lab3.m; i++) {
    const varName = Lab3.basis[i];
    if (varName.startsWith('x')) {
      const idx = parseInt(varName.substring(1)) - 1;
      if (idx >= 0 && idx < Lab3.n) {
        solution[varName] = Lab3.matrix[i][Lab3.n + Lab3.m];
      }
    }
  }

  // Проверяем, что искусственные переменные равны 0
  let artificialInBasis = false;
  for (let i = 0; i < Lab3.m; i++) {
    if (Lab3.basis[i].startsWith('x') && parseInt(Lab3.basis[i].substring(1)) > Lab3.n) {
      artificialInBasis = true;
      break;
    }
  }

  let msg = "Оптимальное решение:\n";
  for (let j = 0; j < Lab3.n; j++) {
    msg += `x${j+1} = ${Lab3.formatNumber(solution[`x${j+1}`])}\n`;
  }

  const fValue = Lab3.fRow[Lab3.n + Lab3.m]; // свободный член в строке F
  msg += `\nЗначение целевой функции: f = ${Lab3.formatNumber(fValue)}`;

  if (artificialInBasis) {
    msg += "\n\n⚠️ Предупреждение: искусственные переменные остались в базисе. Задача не имеет допустимого решения.";
  }

  // Выводим окончательную таблицу
  msg += "\n\n";
  msg += "Окончательный вариант симплекс-таблицы:\n";
  msg += "Базис\tB\t";
  for (let j = 0; j < Lab3.n + Lab3.m; j++) {
    msg += `${Lab3.variableNames[j]}\t`;
  }
  msg += "Св. член\n";

  for (let i = 0; i < Lab3.m; i++) {
    msg += `${Lab3.basis[i]}\t${Lab3.formatNumber(Lab3.matrix[i][Lab3.n + Lab3.m])}\t`;
    for (let j = 0; j < Lab3.n + Lab3.m; j++) {
      msg += `${Lab3.formatNumber(Lab3.matrix[i][j])}\t`;
    }
    msg += "\n";
  }

  msg += `F\t${Lab3.formatNumber(fValue)}\t`;
  for (let j = 0; j < Lab3.n + Lab3.m; j++) {
    msg += `${Lab3.formatNumber(Lab3.fRow[j])}\t`;
  }
  msg += "\n";

  Lab3.showMessage(msg);
};

Lab3.reset = function() {
  Lab3.n = 5;
  Lab3.m = 3;
  Lab3.matrix = [];
  Lab3.basis = [];
  Lab3.fCoeffs = [];
  Lab3.gCoeffs = [];
  Lab3.fRow = [];
  Lab3.artificialVars = [];
  Lab3.variableNames = [];
  Lab3.pivotRow = -1;
  Lab3.pivotCol = -1;
  Lab3.step = 0;
  Lab3.solved = false;

  document.getElementById('lab3-table-container').innerHTML = '';
  document.getElementById('lab3-message').textContent = "Укажите параметры задачи и нажмите 'Создать таблицу'.";
  document.getElementById('start-btn').disabled = false;
  document.getElementById('step-btn').disabled = true;
  Lab3.showMessage("Сброс выполнено.");
};

Lab3.showMessage = function(text) {
  const el = document.getElementById('lab3-message');
  if (el) {
    el.textContent = text;
  }
};

function initLab3() {
  // Автоматически загружаем пример при открытии лабы
  setTimeout(() => {
    Lab3.loadExample();
    Lab3.showMessage("Пример загружен. Нажмите 'Начать решение' для старта.");
  }, 100); // небольшая задержка, чтобы DOM успел отрисоваться
}