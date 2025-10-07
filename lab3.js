// lab3.js — Лабораторная работа №3: Симплекс-метод

function lab3Template() {
  return `
    <h2>Лабораторная 3: Симплекс-метод</h2>
    <p>Решение задачи линейного программирования: максимизация целевой функции при ограничениях-равенствах.</p>

    <div class="lab3-input">
      <label>
        Коэффициенты целевой функции F = c₁x₁ + c₂x₂ + ... → max<br>
        (через запятую, например: 2, 3)
        <input type="text" id="lab3-c" placeholder="2, 3">
      </label>

      <label>
        Матрица ограничений A (строки через ;, элементы через ,)<br>
        (например: 1,1; 2,1)
        <input type="text" id="lab3-A" placeholder="1,1; 2,1">
      </label>

      <label>
        Вектор правых частей b (через запятую)<br>
        (например: 4, 5)
        <input type="text" id="lab3-b" placeholder="4, 5">
      </label>

      <button onclick="runSimplex()">Решить</button>
    </div>

    <div id="lab3-result" style="margin-top: 20px; white-space: pre-wrap; font-family: monospace;"></div>
  `;
}

function initLab3() {
  // Ничего не нужно инициализировать заранее
}

function parseMatrix(str) {
  return str.split(';').map(row => row.split(',').map(x => parseFloat(x.trim())));
}

function parseVector(str) {
  return str.split(',').map(x => parseFloat(x.trim()));
}

function runSimplex() {
  try {
    const cStr = document.getElementById('lab3-c').value;
    const AStr = document.getElementById('lab3-A').value;
    const bStr = document.getElementById('lab3-b').value;

    if (!cStr || !AStr || !bStr) {
      throw new Error("Заполните все поля");
    }

    const c = parseVector(cStr);
    const A = parseMatrix(AStr);
    const b = parseVector(bStr);

    if (A.length !== b.length) {
      throw new Error("Количество строк в A должно совпадать с длиной b");
    }
    if (A.some(row => row.length !== c.length)) {
      throw new Error("Количество столбцов в A должно совпадать с длиной c");
    }

    const resultDiv = document.getElementById('lab3-result');
    resultDiv.innerHTML = "Решение...\n";

    // Простая реализация симплекс-метода (без искусственных переменных)
    // Предполагаем, что система уже в канонической форме с базисом (единичная матрица добавлена)

    // Добавляем слабые переменные (предполагаем неравенства ≤)
    const m = A.length;
    const n = c.length;

    // Расширяем A до [A | I]
    const extendedA = A.map((row, i) => {
      const slack = Array(m).fill(0);
      slack[i] = 1;
      return [...row, ...slack];
    });

    const extendedC = [...c, ...Array(m).fill(0)];

    // Запускаем симплекс
    const solution = simplexMax(extendedC, extendedA, b);

    let output = "✅ Оптимальное решение найдено:\n\n";
    for (let i = 0; i < n; i++) {
      output += `x${i + 1} = ${solution.x[i].toFixed(4)}\n`;
    }
    output += `\nF_max = ${solution.F.toFixed(4)}`;

    resultDiv.innerHTML = output;

  } catch (err) {
    document.getElementById('lab3-result').innerHTML = `❌ Ошибка: ${err.message}`;
  }
}

// Простая реализация симплекс-метода (для задач с начальным базисом)
function simplexMax(c, A, b) {
  const m = A.length; // число ограничений
  const n = c.length; // число переменных (включая слабые)

  // Базисные переменные: последние m (слабые)
  let basis = Array.from({ length: m }, (_, i) => n - m + i);

  // Строим начальную симплекс-таблицу
  let tableau = A.map((row, i) => [...row, b[i]]);
  let objRow = c.map(coef => -coef); // для максимизации
  objRow.push(0); // свободный член
  tableau.push(objRow);

  let iterations = 0;
  const MAX_ITER = 100;

  while (iterations < MAX_ITER) {
    iterations++;

    // Находим ведущий столбец (наиболее отрицательный в строке F)
    let pivotCol = -1;
    let minVal = 0;
    for (let j = 0; j < n; j++) {
      if (tableau[m][j] < minVal) {
        minVal = tableau[m][j];
        pivotCol = j;
      }
    }

    if (pivotCol === -1) break; // оптимум достигнут

    // Находим ведущую строку (минимальное отношение b_i / a_ij > 0)
    let pivotRow = -1;
    let minRatio = Infinity;
    for (let i = 0; i < m; i++) {
      if (tableau[i][pivotCol] > 1e-10) {
        const ratio = tableau[i][n] / tableau[i][pivotCol];
        if (ratio < minRatio) {
          minRatio = ratio;
          pivotRow = i;
        }
      }
    }

    if (pivotRow === -1) {
      throw new Error("Целевая функция неограниченна");
    }

    // Поворот (Gauss-Jordan)
    const pivotElement = tableau[pivotRow][pivotCol];
    for (let j = 0; j <= n; j++) {
      tableau[pivotRow][j] /= pivotElement;
    }

    for (let i = 0; i <= m; i++) {
      if (i !== pivotRow) {
        const factor = tableau[i][pivotCol];
        for (let j = 0; j <= n; j++) {
          tableau[i][j] -= factor * tableau[pivotRow][j];
        }
      }
    }

    // Обновляем базис
    basis[pivotRow] = pivotCol;
  }

  // Извлекаем решение
  let x = Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    if (basis[i] < n) {
      x[basis[i]] = tableau[i][n];
    }
  }

  const F = tableau[m][n];
  return { x: x.slice(0, c.length - m), F };
}