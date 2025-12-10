var Lab3 = {
    fullMatrix: [],
    rowLabelsFull: [],
    colLabelsFull: [],
    nOrig: 0,
    mConstraints: 0,
    iteration: 0,
    maxIterations: 10
};

function lab3Template() {
    return `
    <h2>Лабораторная 3: Метод искусственного базиса</h2>

    <div class="input-group">
      <label>Ограничений (m):</label>
      <input type="number" id="lab3-constraints" value="3" min="1" max="8">
      <label>Переменных (n):</label>
      <input type="number" id="lab3-vars" value="3" min="1" max="8">
      <button class="action" onclick="Lab3.setupInput()">Создать форму</button>
    </div>

    <div id="lab3-input-area"></div>
    <div id="lab3-tables-container"></div>
    <div id="lab3-steps"></div>

    <div class="controls" style="margin-top: 20px;">
      <button class="action" onclick="Lab3.buildTable()">Построить исходную таблицу</button>
      <button class="action" onclick="Lab3.solveStep()">Выполнить шаг</button>
      <button class="action" onclick="Lab3.reset()">Сбросить</button>
    </div>
  `;
}

Lab3.setupInput = function () {
    const m = parseInt(document.getElementById("lab3-constraints").value) || 3;
    const n = parseInt(document.getElementById("lab3-vars").value) || 3;

    let html = '<h3>Ограничения (в виде равенств)</h3><table border="1" cellpadding="5" cellspacing="0">';
    html += '<tr><th></th><th>Свободный член</th>';
    for (let j = 1; j <= n; j++) {
        html += `<th>x<sub>${j}</sub></th>`;
    }
    html += '</tr>';

    const exampleConstraints = [
        [32, 1, 7],
        [42, 2, 5],
        [62, 3, 4]
    ];

    for (let i = 0; i < m; i++) {
        html += `<tr><td>(<sub>${i + 1}</sub>)</td>`;
        for (let j = 0; j <= n; j++) {
            const val = j === 0
                ? (exampleConstraints[i]?.[j] ?? 30 + i * 10)
                : (exampleConstraints[i]?.[j] ?? (i === j - 1 ? 1 : 0));
            html += `<td><input type="number" id="constr-${i}-${j}" value="${val}" step="any" style="width:60px;"></td>`;
        }
        html += '</tr>';
    }
    html += '</table>';

    html += '<h3>Целевая функция F → max</h3><table border="1" cellpadding="5" cellspacing="0">';
    html += '<tr><th>F</th><td>0</td>';
    const exampleF = [-2, -1];
    for (let j = 1; j <= n; j++) {
        const val = exampleF[j - 1] ?? (j === 1 ? -2 : j === 2 ? -1 : 0);
        html += `<td><input type="number" id="f-coeff-${j}" value="${val}" step="any" style="width:60px;"></td>`;
    }
    html += '</tr></table>';

    document.getElementById("lab3-input-area").innerHTML = html;
    Lab3.resetDisplay();
};

Lab3.buildTable = function () {
    const m = parseInt(document.getElementById("lab3-constraints").value) || 3;
    const n = parseInt(document.getElementById("lab3-vars").value) || 3;

    Lab3.mConstraints = m;
    Lab3.nOrig = n;

    const constraints = [];
    for (let i = 0; i < m; i++) {
        const row = [];
        for (let j = 0; j <= n; j++) {
            let val = parseFloat(document.getElementById(`constr-${i}-${j}`).value);
            if (isNaN(val)) val = 0;
            row.push(val);
        }
        constraints.push(row);
    }

    const fRow = [0];
    for (let j = 1; j <= n; j++) {
        let val = parseFloat(document.getElementById(`f-coeff-${j}`).value);
        if (isNaN(val)) val = 0;
        fRow.push(val);
    }

    const totalCols = 1 + n + m;
    const totalRows = m + 2;
    const matrix = Array.from({ length: totalRows }, () => Array(totalCols).fill(0));

    const colLabels = ["1"];
    for (let j = 1; j <= n; j++) colLabels.push(`x${j}`);
    for (let j = 1; j <= m; j++) colLabels.push(`y${j}`);

    const rowLabels = [];
    for (let i = 1; i <= m; i++) rowLabels.push(`y${i}`);
    rowLabels.push("f");
    rowLabels.push("g");

    for (let i = 0; i < m; i++) {
        matrix[i][0] = constraints[i][0];
        for (let j = 1; j <= n; j++) {
            matrix[i][j] = constraints[i][j];
        }
        matrix[i][1 + n + i] = 1;
    }

    // F
    for (let j = 0; j <= n; j++) {
        matrix[m][j] = fRow[j];
    }

    // G 
    for (let j = 0; j < totalCols; j++) {
        let sum = 0;
        for (let i = 0; i < m; i++) {
            sum += matrix[i][j];
        }
        matrix[m + 1][j] = -sum;
    }

    Lab3.fullMatrix = matrix;
    Lab3.rowLabelsFull = rowLabels;
    Lab3.colLabelsFull = colLabels;
    Lab3.iteration = 0;

    Lab3.renderAndAppendTable("Исходная таблица:");
    Lab3.printSolution();
    Lab3.logStep("Исходная таблица построена.");
};

Lab3.getDisplayRowLabel = function (fullLabel) {
    if (fullLabel.startsWith("y")) {
        const idx = parseInt(fullLabel.slice(1), 10);
        return `x${Lab3.nOrig + idx}`;
    }
    return fullLabel;
};

Lab3.getDisplayMatrix = function () {
    return Lab3.fullMatrix.map(row => row.slice(0, 1 + Lab3.nOrig));
};

Lab3.renderAndAppendTable = function (title = "") {
    if (!Lab3.fullMatrix.length) return;

    const displayMatrix = Lab3.getDisplayMatrix();
    const container = document.getElementById("lab3-tables-container");

    const div = document.createElement("div");
    div.style.marginTop = "20px";

    let html = `<h4>${title}</h4><table border="1" cellpadding="6" cellspacing="0" style="display:inline-block;">`;
    html += '<tr><th></th><th>1</th>';
    for (let j = 1; j <= Lab3.nOrig; j++) {
        html += `<th>x${j}</th>`;
    }
    html += '</tr>';

    for (let i = 0; i < displayMatrix.length; i++) {
        html += `<tr><td>${Lab3.getDisplayRowLabel(Lab3.rowLabelsFull[i])}</td>`;
        for (let j = 0; j < displayMatrix[i].length; j++) {
            html += `<td>${Lab3.formatNumber(displayMatrix[i][j])}</td>`;
        }
        html += '</tr>';
    }
    html += '</table>';

    div.innerHTML = html;
    container.appendChild(div);
};

Lab3.formatNumber = function (num) {
    if (Math.abs(num) < 1e-10) return "0";
    const rounded = Math.round(num * 10000) / 10000;
    return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(4);
};

Lab3.printSolution = function () {
    const result = new Array(Lab3.nOrig).fill(0.0);
    const m = Lab3.fullMatrix.length;

    for (let i = 0; i < Lab3.rowLabelsFull.length; i++) {
        const label = Lab3.rowLabelsFull[i];
        if (label.startsWith("x")) {
            const idx = parseInt(label.slice(1), 10) - 1;
            if (idx >= 0 && idx < Lab3.nOrig) {
                result[idx] = Lab3.fullMatrix[i][0];
            }
        }
    }

    const fVal = Lab3.fullMatrix[m - 2][0];
    const gVal = Lab3.fullMatrix[m - 1][0];
    const EPS = 1e-10;

    let out = "";
    if (Math.abs(gVal) < EPS) {
        out += `F = ${fVal.toFixed(4)}`;
    } else if (gVal < 0) {
        out += `F = ${fVal.toFixed(4)} - ${Math.abs(gVal).toFixed(4)}M`;
    } else {
        out += `F = ${fVal.toFixed(4)} + ${gVal.toFixed(4)}M`;
    }

    const nonZeroVars = result
        .map((x, i) => ({ idx: i + 1, val: x }))
        .filter(({ val }) => Math.abs(val) > EPS)
        .map(({ idx, val }) => `x${idx}=${val.toFixed(4)}`)
        .join(" ");

    const div = document.createElement("div");
    div.innerHTML = `<strong>Решение:</strong><br>${out}<br>Переменные: ${nonZeroVars || "(все нули)"}`;
    div.style.marginTop = "10px";
    document.getElementById("lab3-steps").appendChild(div);
};

Lab3.logStep = function (text) {
    const div = document.createElement("div");
    div.textContent = text;
    div.style.marginTop = "5px";
    document.getElementById("lab3-steps").appendChild(div);
};

Lab3.getSolverKs = function () {
    const gRow = Lab3.fullMatrix[Lab3.fullMatrix.length - 1].slice(1);
    const minVal = Math.min(...gRow);
    if (minVal >= -1e-10) return [-1, -1];

    const pivotCol = gRow.indexOf(minVal) + 1;
    let pivotRow = -1;
    let minRatio = Infinity;

    for (let i = 0; i < Lab3.mConstraints; i++) {
        const coeff = Lab3.fullMatrix[i][pivotCol];
        if (coeff > 1e-10) {
            const ratio = Lab3.fullMatrix[i][0] / coeff;
            if (ratio >= -1e-10 && ratio < minRatio) {
                minRatio = ratio;
                pivotRow = i;
            }
        }
    }

    if (pivotRow === -1) return [-1, 0];
    return [pivotRow, pivotCol];
};

Lab3.jordanSubFakeBasis = function (k, s) {
    const permissive = Lab3.fullMatrix[k][s];
    const EPS = 1e-10;
    if (Math.abs(permissive) < EPS) {
        throw new Error(`Разрешающий элемент ≈ 0`);
    }

    const rows = Lab3.fullMatrix.length;
    const cols = Lab3.fullMatrix[0].length;
    const newMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    [Lab3.colLabelsFull[s], Lab3.rowLabelsFull[k]] = [Lab3.rowLabelsFull[k], Lab3.colLabelsFull[s]];

    for (let j = 0; j < cols; j++) {
        newMatrix[k][j] = Lab3.fullMatrix[k][j] / permissive;
    }

    for (let i = 0; i < rows; i++) {
        newMatrix[i][s] = -Lab3.fullMatrix[i][s] / permissive;
    }

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            if (i !== k && j !== s) {
                newMatrix[i][j] = Lab3.fullMatrix[i][j] - (Lab3.fullMatrix[i][s] * Lab3.fullMatrix[k][j]) / permissive;
            }
        }
    }

    newMatrix[k][s] = 1.0 / permissive;
    Lab3.fullMatrix = newMatrix;
};

Lab3.solveStep = function () {
    if (!Lab3.fullMatrix.length) {
        alert("Сначала постройте исходную таблицу!");
        return;
    }

    if (Lab3.iteration >= Lab3.maxIterations) {
        Lab3.logStep("⚠️ Достигнуто максимальное число итераций");
        return;
    }

    const [k, s] = Lab3.getSolverKs();

    if (k === -1 && s === -1) {
        Lab3.logStep("✅ Оптимальный план найден!");
        Lab3.printSolution();
        return;
    } else if (k === -1 && s === 0) {
        Lab3.logStep("❌ Задача не ограничена");
        Lab3.printSolution();
        return;
    }

    Lab3.iteration++;
    Lab3.logStep(`--- Итерация ${Lab3.iteration} ---`);
    Lab3.logStep(`Разрешающий элемент: строка ${Lab3.getDisplayRowLabel(Lab3.rowLabelsFull[k])}, столбец ${Lab3.colLabelsFull[s]}`);

    try {
        Lab3.jordanSubFakeBasis(k, s);
        Lab3.renderAndAppendTable(`Итерация ${Lab3.iteration}:`);
        Lab3.printSolution();
    } catch (e) {
        Lab3.logStep("Ошибка: " + e.message);
    }
};

Lab3.resetDisplay = function () {
    document.getElementById("lab3-tables-container").innerHTML = '';
    document.getElementById("lab3-steps").innerHTML = '';
    Lab3.fullMatrix = [];
    Lab3.rowLabelsFull = [];
    Lab3.colLabelsFull = [];
    Lab3.iteration = 0;
    Lab3.nOrig = 0;
    Lab3.mConstraints = 0;
};

Lab3.reset = function () {
    document.getElementById("lab3-input-area").innerHTML = '';
    Lab3.resetDisplay();
};

function initLab3() {
}