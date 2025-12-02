// === lab3.js ===

function lab3Template() {
    return `
        <h2>Лабораторная 3: Метод искусственного базиса</h2>
        <p><strong>Пример задачи:</strong><br>
           x₁ - 4x₂ + 2x₃ - 5x₄ + 9x₅ = 3<br>
           x₂ - 3x₃ + 4x₄ - 5x₅ = 6<br>
           x₂ - x₃ + x₄ - x₅ = 1<br>
           F(x) = -2x₁ - 6x₂ + 5x₃ - x₄ - 4x₅ → max
        </p>

        <div class="input-group">
            <label><strong>Режим 1: Ввод базиса</strong></label><br>
            Переменных: <input type="number" id="vars1" value="5" min="1" max="10">
            Уравнений: <input type="number" id="eqs1" value="3" min="1" max="10">
            <button class="action" onclick="Lab3.createTableMode1()">Создать</button>
        </div>

        <div class="input-group">
            <label><strong>Режим 2: Ввод уравнений</strong></label><br>
            Уравнений: <input type="number" id="eqs2" value="3" min="1" max="10">
            Переменных: <input type="number" id="vars2" value="5" min="1" max="10">
            <button class="action" onclick="Lab3.createTableMode2()">Создать</button>
        </div>

        <div id="matrix-input-section"></div>
        <div id="controls-section" style="display:none;">
            <button class="action" onclick="Lab3.loadTable()">Загрузить таблицу</button>
            <button class="action" onclick="Lab3.startSolving()">Начать решение</button>
            <button class="action" onclick="Lab3.reset()">Сброс</button>
        </div>

        <div id="output-section"></div>
    `;
}

const Lab3 = {
    originalData: null,
    matrix: null,
    steps: [],
    isSolving: false
};

Lab3.getDefaultSystem = function(vars, eqs) {
    // Пример системы из задания
    if (vars === 5 && eqs === 3) {
        return {
            A: [
                [1, -4, 2, -5, 9],
                [0, 1, -3, 4, -5],
                [0, 1, -1, 1, -1]
            ],
            b: [3, 6, 1],
            c: [-2, -6, 5, -1, -4] // F → max
        };
    }
    // Пустая система по умолчанию
    const A = Array(eqs).fill().map(() => Array(vars).fill(0));
    const b = Array(eqs).fill(0);
    const c = Array(vars).fill(0);
    return { A, b, c };
};

Lab3.renderInputTable = function(vars, eqs, system) {
    let html = `<h3>Введите систему уравнений и целевую функцию</h3>`;

    // Уравнения
    html += '<table border="1" cellpadding="5" cellspacing="0">';
    html += '<tr><th></th>';
    for (let j = 0; j < vars; j++) {
        html += `<th>x<sub>${j + 1}</sub></th>`;
    }
    html += '<th>=</th><th>b<sub>i</sub></th></tr>';

    for (let i = 0; i < eqs; i++) {
        html += `<tr><td>Ур.${i + 1}</td>`;
        for (let j = 0; j < vars; j++) {
            const val = system.A[i][j];
            html += `<td><input type="number" step="any" id="a-${i}-${j}" value="${val}" style="width:60px;"></td>`;
        }
        html += `<td>=</td><td><input type="number" step="any" id="b-${i}" value="${system.b[i]}" style="width:60px;"></td></tr>`;
    }
    html += '</table>';

    // Целевая функция
    html += `<h4>Целевая функция F = </h4>`;
    html += '<table border="1" cellpadding="5" cellspacing="0"><tr>';
    for (let j = 0; j < vars; j++) {
        const val = system.c[j];
        html += `<td><input type="number" step="any" id="c-${j}" value="${val}" style="width:60px;"></td>`;
        html += `<td>x<sub>${j + 1}</sub> ${j < vars - 1 ? '+' : ''}</td>`;
    }
    html += '</tr></table>';

    html += '<p><em>Задача: максимизация F</em></p>';
    document.getElementById('matrix-input-section').innerHTML = html;
    document.getElementById('controls-section').style.display = 'block';
};

Lab3.createTableMode1 = function() {
    const vars = parseInt(document.getElementById('vars1').value) || 5;
    const eqs = parseInt(document.getElementById('eqs1').value) || 3;
    const system = Lab3.getDefaultSystem(vars, eqs);
    Lab3.renderInputTable(vars, eqs, system);
};

Lab3.createTableMode2 = function() {
    const eqs = parseInt(document.getElementById('eqs2').value) || 3;
    const vars = parseInt(document.getElementById('vars2').value) || 5;
    const system = Lab3.getDefaultSystem(vars, eqs); // можно заменить на пустую систему
    Lab3.renderInputTable(vars, eqs, system);
};

Lab3.loadTable = function() {
    const vars = parseInt(document.getElementById('vars1').value) || parseInt(document.getElementById('vars2').value) || 5;
    const eqs = parseInt(document.getElementById('eqs1').value) || parseInt(document.getElementById('eqs2').value) || 3;

    const A = [];
    for (let i = 0; i < eqs; i++) {
        const row = [];
        for (let j = 0; j < vars; j++) {
            const val = parseFloat(document.getElementById(`a-${i}-${j}`).value) || 0;
            row.push(val);
        }
        A.push(row);
    }

    const b = [];
    for (let i = 0; i < eqs; i++) {
        b.push(parseFloat(document.getElementById(`b-${i}`).value) || 0);
    }

    const c = [];
    for (let j = 0; j < vars; j++) {
        c.push(parseFloat(document.getElementById(`c-${j}`).value) || 0);
    }

    // Формируем расширенную матрицу для искусственного базиса
    const artificialVars = eqs; // по одному на каждое уравнение
    const totalCols = 1 + vars + artificialVars; // [b | x1..xn | a1..am]
    const totalRows = eqs + 2; // уравнения + f + g

    const data = Array(totalRows).fill().map(() => Array(totalCols).fill(0));

    // Заполняем уравнения
    for (let i = 0; i < eqs; i++) {
        data[i][0] = b[i]; // свободный член
        for (let j = 0; j < vars; j++) {
            data[i][1 + j] = A[i][j];
        }
        data[i][1 + vars + i] = 1; // искусственная переменная
    }

    // Целевая функция f
    for (let j = 0; j < vars; j++) {
        data[eqs][1 + j] = -c[j]; // F → max ⇒ в симплексе: -c
    }

    // Функция g = -Σ a_i
    data[eqs + 1][0] = -b.reduce((sum, val) => sum + val, 0);
    for (let j = 0; j < vars; j++) {
        let sum = 0;
        for (let i = 0; i < eqs; i++) {
            sum += A[i][j];
        }
        data[eqs + 1][1 + j] = -sum;
    }
    for (let i = 0; i < artificialVars; i++) {
        data[eqs + 1][1 + vars + i] = -1;
    }

    Lab3.originalData = data;
    Lab3.steps = [];
    Lab3.output("Таблица загружена. Нажмите 'Начать решение'.");
};

Lab3.output = function(text) {
    const out = document.getElementById('output-section');
    const div = document.createElement('div');
    div.innerHTML = text;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
};

Lab3.reset = function() {
    document.getElementById('output-section').innerHTML = '';
    document.getElementById('matrix-input-section').innerHTML = '';
    document.getElementById('controls-section').style.display = 'none';
    Lab3.originalData = null;
    Lab3.matrix = null;
    Lab3.steps = [];
    Lab3.isSolving = false;
};

// === Методы симплекса ===

Lab3.newLabeledMatrix = function(data, withRows = false) {
    const rows = data.length;
    const cols = data[0].length;

    const colLabels = ["1"];
    for (let i = 1; i < cols; i++) {
        colLabels.push(`x${i}`);
    }

    const rowLabels = [];
    if (withRows) {
        for (let i = 0; i < rows; i++) {
            if (i === rows - 2) rowLabels.push("f");
            else if (i === rows - 1) rowLabels.push("g");
            else rowLabels.push(`x${cols + i}`);
        }
    } else {
        for (let i = 0; i < rows; i++) rowLabels.push("0");
    }

    return { data, rowLabels, colLabels };
};

Lab3.jordanSubFakeBasis = function(M, k, s) {
    const permissive = M.data[k][s];
    if (Math.abs(permissive) < 1e-10) {
        return [M, `разрешающий элемент [${k},${s}] ≈ 0`];
    }

    const newMatrix = {
         M.data.map(row => [...row]),
        rowLabels: [...M.rowLabels],
        colLabels: [...M.colLabels]
    };
    const rows = M.data.length;
    const cols = M.data[0].length;

    // Обмен меток
    [newMatrix.colLabels[s], newMatrix.rowLabels[k]] = [newMatrix.rowLabels[k], newMatrix.colLabels[s]];

    // Разрешающая строка
    for (let j = 0; j < cols; j++) {
        newMatrix.data[k][j] = M.data[k][j] / permissive;
    }

    // Разрешающий столбец
    for (let i = 0; i < rows; i++) {
        newMatrix.data[i][s] = -M.data[i][s] / permissive;
    }

    // Остальные элементы
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (i !== k && j !== s) {
                newMatrix.data[i][j] = M.data[i][j] - (M.data[i][s] * M.data[k][j]) / permissive;
            }
        }
    }

    newMatrix.data[k][s] = 1.0 / permissive;

    return [newMatrix, null];
};

Lab3.getSolverKS = function(M) {
    const rows = M.data.length;
    const cols = M.data[0].length;
    if (rows < 1 || cols < 2) return [-1, -1];

    const gRow = M.data[rows - 1].slice(1);
    const minVal = Math.min(...gRow);
    if (minVal >= -1e-10) return [-1, -1]; // оптимально

    const pivotCol = gRow.indexOf(minVal) + 1;

    let pivotRow = -1;
    let minRatio = Infinity;
    for (let i = 0; i < rows - 2; i++) {
        if (M.data[i][pivotCol] > 1e-10) {
            const ratio = M.data[i][0] / M.data[i][pivotCol];
            if (ratio >= -1e-10 && ratio < minRatio) {
                minRatio = ratio;
                pivotRow = i;
            }
        }
    }

    if (pivotRow === -1) return [-1, 0];
    return [pivotRow, pivotCol];
};

Lab3.renderMatrixHTML = function(M) {
    let html = '<table border="1" cellpadding="6" cellspacing="0" style="margin:10px 0;">';
    html += '<tr><th></th>';
    M.colLabels.forEach(lbl => html += `<th>${Lab3.sanitizeLabel(lbl)}</th>`);
    html += '</tr>';
    M.data.forEach((row, i) => {
        html += `<tr><td>${Lab3.sanitizeLabel(M.rowLabels[i])}</td>`;
        row.forEach(val => {
            html += `<td>${parseFloat(val).toFixed(4)}</td>`;
        });
        html += '</tr>';
    });
    html += '</table>';
    return html;
};

Lab3.sanitizeLabel = function(lbl) {
    if (lbl.startsWith('x')) {
        const num = lbl.slice(1);
        return `x<sub>${num}</sub>`;
    }
    return lbl;
};

Lab3.printFakeBasisStep = function(M) {
    let totalVars = 0;
    const all = [...M.colLabels, ...M.rowLabels];
    all.forEach(lbl => {
        if (lbl.startsWith('x')) {
            const idx = parseInt(lbl.slice(1));
            if (idx > totalVars) totalVars = idx;
        }
    });

    const result = Array(totalVars).fill(0);
    for (let i = 0; i < M.rowLabels.length; i++) {
        const lbl = M.rowLabels[i];
        if (lbl.startsWith('x')) {
            const idx = parseInt(lbl.slice(1)) - 1;
            if (idx < totalVars) result[idx] = M.data[i][0];
        }
    }

    const f = M.data[M.data.length - 2][0];
    const g = M.data[M.data.length - 1][0];

    let fStr;
    if (Math.abs(g) < 1e-10) {
        fStr = `F = ${f.toFixed(4)}`;
    } else {
        if (g < 0) fStr = `F = ${f.toFixed(4)} - ${Math.abs(g).toFixed(4)}M`;
        else fStr = `F = ${f.toFixed(4)} + ${g.toFixed(4)}M`;
    }

    const varsStr = result
        .map((v, i) => ({ i: i + 1, v }))
        .filter(({ v }) => Math.abs(v) > 1e-10)
        .map(({ i, v }) => `x<sub>${i}</sub>=${v.toFixed(4)}`)
        .join(' ');

    return `<p><strong>Текущее решение:</strong><br>${fStr}<br>Переменные: ${varsStr || "(все нули)"}</p>`;
};

Lab3.startSolving = function() {
    if (!Lab3.originalData) {
        alert("Сначала загрузите таблицу!");
        return;
    }

    if (Lab3.isSolving) return;
    Lab3.isSolving = true;
    Lab3.output("<h3>Начало решения методом искусственного базиса</h3>");

    let M = Lab3.newLabeledMatrix(Lab3.originalData.map(r => r.map(x => parseFloat(x))), true);
    Lab3.output(Lab3.renderMatrixHTML(M));
    Lab3.output(Lab3.printFakeBasisStep(M));

    let iter = 0;
    const maxIter = 20;

    while (iter < maxIter) {
        iter++;
        const [k, s] = Lab3.getSolverKS(M);

        if (k === -1 && s === -1) {
            Lab3.output(`<h4>✅ Оптимальный план найден на итерации ${iter}!</h4>`);
            Lab3.output(Lab3.printFakeBasisStep(M));
            Lab3.isSolving = false;
            return;
        } else if (k === -1 && s === 0) {
            Lab3.output(`<h4>❌ Система не ограничена!</h4>`);
            Lab3.output(Lab3.printFakeBasisStep(M));
            Lab3.isSolving = false;
            return;
        } else if (k === -1) {
            Lab3.output(`<h4>❌ Не удалось найти разрешающий элемент</h4>`);
            Lab3.isSolving = false;
            return;
        }

        Lab3.output(`<h4>--- Итерация ${iter} ---</h4>`);
        Lab3.output(`Разрешающий элемент: M[${k},${s}] = ${M.data[k][s].toFixed(4)}<br>Строка: ${M.rowLabels[k]}, Столбец: ${M.colLabels[s]}`);

        const [newM, err] = Lab3.jordanSubFakeBasis(M, k, s);
        if (err) {
            Lab3.output(`<p>Ошибка: ${err}</p>`);
            Lab3.isSolving = false;
            return;
        }
        M = newM;

        Lab3.output(Lab3.renderMatrixHTML(M));
        Lab3.output(Lab3.printFakeBasisStep(M));
    }

    Lab3.output(`<p>⚠️ Достигнуто макс. кол-во итераций (${maxIter})</p>`);
    Lab3.isSolving = false;
};

function initLab3() {
    // nothing needed
}
