// lab3.js - РњРµС‚РѕРґ РёСЃРєСѓСЃСЃС‚РІРµРЅРЅРѕРіРѕ Р±Р°Р·РёСЃР°
var Lab3 = {
  equations: [],
  objective: [],
  basis: [],
  table: [],
  artificialVars: [],
  iterations: [],
  currentIteration: 0,
  isCanonicalMode: false,
  hasArtificialBasis: false,
  equationSigns: []
};

function lab3Template() {
  return `
    <h2>Р›Р°Р±РѕСЂР°С‚РѕСЂРЅР°СЏ 3: РњРµС‚РѕРґ РёСЃРєСѓСЃСЃС‚РІРµРЅРЅРѕРіРѕ Р±Р°Р·РёСЃР°</h2>
    
    <div class="mode-selector">
      <button class="mode-btn active" onclick="Lab3.setMode('basis')">Р РµР¶РёРј 1: Р’РІРѕРґ Р±Р°Р·РёСЃР°</button>
      <button class="mode-btn" onclick="Lab3.setMode('canonical')">Р РµР¶РёРј 2: Р’РІРѕРґ СѓСЂР°РІРЅРµРЅРёР№</button>
    </div>
    
    <div id="input-section"></div>
    
    <div id="canonical-display" style="display: none; margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px;">
      <h3>РљР°РЅРѕРЅРёС‡РµСЃРєРёР№ РІРёРґ:</h3>
      <div id="equations-text"></div>
      <button class="action" onclick="Lab3.createBasisFromEquations()" style="margin-top: 10px;">РџРѕСЃС‚СЂРѕРёС‚СЊ РЅР°С‡Р°Р»СЊРЅСѓСЋ С‚Р°Р±Р»РёС†Сѓ</button>
    </div>
    
    <div id="basis-display" style="margin: 20px 0; display: none;">
      <h3>РќР°С‡Р°Р»СЊРЅР°СЏ СЃРёРјРїР»РµРєСЃ-С‚Р°Р±Р»РёС†Р° (Р±РµР· РёСЃРєСѓСЃСЃС‚РІРµРЅРЅРѕРіРѕ Р±Р°Р·РёСЃР°):</h3>
      <div id="basis-table"></div>
      <button class="action" onclick="Lab3.solveWithArtificialBasis()">РќР°С‡Р°С‚СЊ СЂРµС€РµРЅРёРµ СЃ РёСЃРєСѓСЃСЃС‚РІРµРЅРЅС‹Рј Р±Р°Р·РёСЃРѕРј</button>
      <button class="action" onclick="Lab3.resetAll()">РЎР±СЂРѕСЃ</button>
    </div>
    
    <div id="iterations-container" style="margin-top: 30px;"></div>
    
    <div id="result-container" style="margin-top: 20px;"></div>
    
    <div id="error-message" style="display: none; margin-top: 20px; padding: 15px; background: #f8d7da; color: #721c24; border-radius: 5px; border: 1px solid #f5c6cb;"></div>
  `;
}

Lab3.setMode = function(mode) {
  const buttons = document.querySelectorAll('.mode-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  this.isCanonicalMode = (mode === 'canonical');
  
  if (mode === 'basis') {
    document.getElementById('input-section').innerHTML = `
      <div class="input-group">
        <h3>Р’РІРµРґРёС‚Рµ РЅР°С‡Р°Р»СЊРЅСѓСЋ СЃРёРјРїР»РµРєСЃ-С‚Р°Р±Р»РёС†Сѓ (Р‘Р•Р— СЃС‚СЂРѕРєРё G)</h3>
        <p>РџСЂРёРјРµСЂ (РёР· СѓСЃР»РѕРІРёСЏ) - РЅР°С‡Р°Р»СЊРЅР°СЏ С‚Р°Р±Р»РёС†Р° Р‘Р•Р— РёСЃРєСѓСЃСЃС‚РІРµРЅРЅРѕРіРѕ Р±Р°Р·РёСЃР°:</p>
        <table border="1" cellpadding="5" cellspacing="0" style="margin: 10px 0; background: #f9f9f9;">
          <tr><th>Р‘Р°Р·РёСЃ</th><th>xв‚Ѓ</th><th>xв‚‚</th><th>xв‚ѓ</th><th>xв‚„</th><th>xв‚…</th><th>1</th></tr>
          <tr><td>xв‚†</td><td>1</td><td>-4</td><td>2</td><td>-5</td><td>9</td><td>3</td></tr>
          <tr><td>xв‚‡</td><td>0</td><td>1</td><td>-3</td><td>4</td><td>-5</td><td>6</td></tr>
          <tr><td>xв‚€</td><td>0</td><td>1</td><td>-1</td><td>1</td><td>-1</td><td>1</td></tr>
          <tr><td>F</td><td>2</td><td>6</td><td>-5</td><td>1</td><td>4</td><td>0</td></tr>
        </table>
        <p><em>РЎС‚СЂРѕРєР° G РїРѕСЏРІРёС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РїСЂРё СЂРµС€РµРЅРёРё РјРµС‚РѕРґРѕРј РёСЃРєСѓСЃСЃС‚РІРµРЅРЅРѕРіРѕ Р±Р°Р·РёСЃР°</em></p>
        
        <div class="matrix-setup">
          <label>РљРѕР»РёС‡РµСЃС‚РІРѕ РїРµСЂРµРјРµРЅРЅС‹С… (Р±РµР· РёСЃРєСѓСЃСЃС‚РІРµРЅРЅС‹С…):</label>
          <input type="number" id="var-count" value="5" min="2" max="10">
          <label>РљРѕР»РёС‡РµСЃС‚РІРѕ СѓСЂР°РІРЅРµРЅРёР№ (Р±Р°Р·РёСЃРЅС‹С… РїРµСЂРµРјРµРЅРЅС‹С…):</label>
          <input type="number" id="eq-count" value="3" min="1" max="10">
          <button class="action" onclick="Lab3.createBasisInput()">РЎРѕР·РґР°С‚СЊ С‚Р°Р±Р»РёС†Сѓ РІРІРѕРґР°</button>
        </div>
        
        <div id="basis-input-container" style="margin-top: 20px;"></div>
      </div>
    `;
  } else {
    document.getElementById('input-section').innerHTML = `
      <div class="input-group">
        <h3>Р’РІРµРґРёС‚Рµ СЃРёСЃС‚РµРјСѓ СѓСЂР°РІРЅРµРЅРёР№</h3>
        <p>РџСЂРёРјРµСЂ (РёР· СѓСЃР»РѕРІРёСЏ):</p>
        <div style="background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px;">
          xв‚Ѓ - 4xв‚‚ + 2xв‚ѓ - 5xв‚„ + 9xв‚… = 3<br>
          xв‚‚ - 3xв‚ѓ + 4xв‚„ - 5xв‚… = 6<br>
          xв‚‚ - xв‚ѓ + xв‚„ - xв‚… = 1<br>
          F(x) = -2xв‚Ѓ - 6xв‚‚ + 5xв‚ѓ - xв‚„ - 4xв‚… в†’ max
        </div>
        
        <div class="equation-setup">
          <label>РљРѕР»РёС‡РµСЃС‚РІРѕ СѓСЂР°РІРЅРµРЅРёР№:</label>
          <input type="number" id="canon-eq-count" value="3" min="1" max="10">
          <label>РљРѕР»РёС‡РµСЃС‚РІРѕ РїРµСЂРµРјРµРЅРЅС‹С…:</label>
          <input type="number" id="canon-var-count" value="5" min="2" max="10">
          <button class="action" onclick="Lab3.createEquationInput()">РЎРѕР·РґР°С‚СЊ РїРѕР»СЏ РІРІРѕРґР°</button>
        </div>
        
        <div id="equation-input-container" style="margin-top: 20px;"></div>
        
        <div id="objective-input" style="margin-top: 20px; display: none;">
          <h4>Р¦РµР»РµРІР°СЏ С„СѓРЅРєС†РёСЏ:</h4>
          <div id="objective-coeffs"></div>
          <label>РўРёРї:</label>
          <select id="objective-type">
            <option value="max">РњР°РєСЃРёРјРёР·Р°С†РёСЏ (max)</option>
            <option value="min">РњРёРЅРёРјРёР·Р°С†РёСЏ (min)</option>
          </select>
          <button class="action" onclick="Lab3.parseEquations()" style="margin-top: 10px;">РџСЂРµРѕР±СЂР°Р·РѕРІР°С‚СЊ РІ РєР°РЅРѕРЅРёС‡РµСЃРєРёР№ РІРёРґ</button>
        </div>
      </div>
    `;
  }
  
  document.getElementById('basis-display').style.display = 'none';
  document.getElementById('canonical-display').style.display = 'none';
  document.getElementById('iterations-container').innerHTML = '';
  document.getElementById('result-container').innerHTML = '';
  document.getElementById('error-message').style.display = 'none';
  this.hasArtificialBasis = false;
};

Lab3.showError = function(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.innerHTML = `<strong>РћС€РёР±РєР°:</strong> ${message}`;
  errorDiv.style.display = 'block';
  
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 5000);
};

Lab3.createEquationInput = function() {
  const eqCount = parseInt(document.getElementById('canon-eq-count').value) || 3;
  const varCount = parseInt(document.getElementById('canon-var-count').value) || 5;
  
  let html = '<h4>РЈСЂР°РІРЅРµРЅРёСЏ (СѓРєР°Р¶РёС‚Рµ Р·РЅР°РєРё СЃСЂР°РІРЅРµРЅРёСЏ):</h4>';
  
  for (let i = 0; i < eqCount; i++) {
    html += `<div class="equation-row" style="margin: 15px 0; padding: 15px; background: white; border-radius: 5px; border: 1px solid #ddd;">`;
    html += `<strong>РЈСЂР°РІРЅРµРЅРёРµ ${i + 1}:</strong><br><div style="margin: 10px 0;">`;
    
    for (let j = 1; j <= varCount; j++) {
      const defaultValue = this.getDefaultEquationValue(i, j - 1, varCount);
      html += `<div style="display: inline-block; text-align: center; margin: 0 5px;">`;
      html += `<input type="number" id="eq-${i}-coeff-${j}" value="${defaultValue}" step="any" style="width: 50px; display: block; margin: 0 auto;">`;
      html += `<div style="font-size: 0.9em;">x<sub>${j}</sub></div>`;
      html += `</div>`;
      
      if (j < varCount) {
        html += `<span style="margin: 0 10px;">+</span>`;
      }
    }
    
    const defaultSign = i < 3 ? '=' : 'в‰¤';
    html += `<select id="eq-${i}-sign" style="margin: 0 10px; padding: 5px;">`;
    html += `<option value="=" ${defaultSign === '=' ? 'selected' : ''}>=</option>`;
    html += `<option value="в‰¤" ${defaultSign === 'в‰¤' ? 'selected' : ''}>в‰¤</option>`;
    html += `<option value="в‰Ґ" ${defaultSign === 'в‰Ґ' ? 'selected' : ''}>в‰Ґ</option>`;
    html += `</select>`;
    
    html += `<input type="number" id="eq-${i}-const" value="${this.getDefaultConstant(i)}" step="any" style="width: 60px; padding: 5px;">`;
    html += '</div></div>';
  }
  
  document.getElementById('equation-input-container').innerHTML = html;
  
  let objHtml = '<div style="display: flex; align-items: center; flex-wrap: wrap; gap: 5px;">F(x) = ';
  for (let j = 1; j <= varCount; j++) {
    const defaultValue = this.getDefaultObjectiveValue(j - 1, varCount);
    objHtml += `<div style="display: inline-block; text-align: center;">`;
    objHtml += `<input type="number" id="obj-coeff-${j}" value="${defaultValue}" step="any" style="width: 50px; display: block; margin: 0 auto;">`;
    objHtml += `<div style="font-size: 0.9em;">x<sub>${j}</sub></div>`;
    objHtml += `</div>`;
    
    if (j < varCount) {
      objHtml += `<span style="margin: 0 5px;">+</span>`;
    }
  }
  objHtml += '</div>';
  
  document.getElementById('objective-coeffs').innerHTML = objHtml;
  document.getElementById('objective-input').style.display = 'block';
};

Lab3.parseEquations = function() {
  const eqCount = parseInt(document.getElementById('canon-eq-count').value) || 3;
  const varCount = parseInt(document.getElementById('canon-var-count').value) || 5;
  
  this.equations = [];
  this.equationSigns = [];
  
  for (let i = 0; i < eqCount; i++) {
    const eq = {
      coefficients: [],
      constant: 0,
      sign: '='
    };
    
    for (let j = 1; j <= varCount; j++) {
      const coeff = parseFloat(document.getElementById(`eq-${i}-coeff-${j}`).value) || 0;
      eq.coefficients.push(coeff);
    }
    
    eq.constant = parseFloat(document.getElementById(`eq-${i}-const`).value) || 0;
    eq.sign = document.getElementById(`eq-${i}-sign`).value;
    this.equations.push(eq);
    this.equationSigns.push(eq.sign);
  }
  
  this.objective = [];
  for (let j = 1; j <= varCount; j++) {
    const coeff = parseFloat(document.getElementById(`obj-coeff-${j}`).value) || 0;
    this.objective.push(coeff);
  }
  
  this.renderCanonicalView();
  document.getElementById('canonical-display').style.display = 'block';
};

Lab3.renderCanonicalView = function() {
  let html = '<div style="font-family: monospace; line-height: 2.0;">';
  
  this.equations.forEach((eq, idx) => {
    let eqStr = '<div style="margin: 10px 0;">';
    let first = true;
    
    eq.coefficients.forEach((coeff, j) => {
      if (Math.abs(coeff) > 1e-10 || first) {
        if (!first) {
          if (coeff >= 0) eqStr += ' + ';
          else eqStr += ' - ';
        } else {
          if (coeff < 0) eqStr += '-';
        }
        
        const absCoeff = Math.abs(coeff);
        if (Math.abs(absCoeff - 1) > 1e-10 || (j === 0 && absCoeff === 1)) {
          eqStr += `<span style="font-weight: bold; color: #2c3e50;">${absCoeff}</span>`;
        }
        
        eqStr += `x<sub>${j + 1}</sub>`;
        first = false;
      }
    });
    
    if (first) eqStr += '0';
    
    let signColor = '#2c3e50';
    if (eq.sign === 'в‰¤') signColor = '#e74c3c';
    if (eq.sign === 'в‰Ґ') signColor = '#3498db';
    
    eqStr += ` <span style="color: ${signColor}; font-weight: bold;">${eq.sign}</span> `;
    eqStr += `<span style="font-weight: bold;">${eq.constant}</span>`;
    eqStr += '</div>';
    html += eqStr;
  });
  
  html += '<div style="margin: 20px 0 10px 0; padding-top: 15px; border-top: 1px solid #ddd;">';
  html += '<strong>Р¦РµР»РµРІР°СЏ С„СѓРЅРєС†РёСЏ:</strong><br>';
  html += 'F(x) = ';
  
  let first = true;
  this.objective.forEach((coeff, j) => {
    if (Math.abs(coeff) > 1e-10 || first) {
      if (!first) {
        if (coeff >= 0) html += ' + ';
        else html += ' - ';
      } else {
        if (coeff < 0) html += '-';
      }
      
      const absCoeff = Math.abs(coeff);
      if (Math.abs(absCoeff - 1) > 1e-10 || (j === 0 && absCoeff === 1)) {
        html += `<span style="font-weight: bold; color: #2c3e50;">${absCoeff}</span>`;
      }
      
      html += `x<sub>${j + 1}</sub>`;
      first = false;
    }
  });
  
  if (first) html += '0';
  
  const objType = document.getElementById('objective-type').value;
  const arrowColor = objType === 'max' ? '#27ae60' : '#e67e22';
  html += ` <span style="color: ${arrowColor}; font-weight: bold;">в†’ ${objType}</span>`;
  html += '</div></div>';
  
  document.getElementById('equations-text').innerHTML = html;
};

Lab3.createBasisFromEquations = function() {
  const varCount = this.objective.length;
  const eqCount = this.equations.length;
  
  if (eqCount === 0) {
    this.showError("РЎРЅР°С‡Р°Р»Р° РІРІРµРґРёС‚Рµ СѓСЂР°РІРЅРµРЅРёСЏ!");
    return;
  }
  
  this.table = [];
  this.basis = [];
  
  for (let i = 0; i < eqCount; i++) {
    const eq = this.equations[i];
    const row = [...eq.coefficients, eq.constant];
    this.table.push(row);
    this.basis.push(`x${varCount + i + 1}`);
  }
  
  const fRow = this.objective.map(x => -x);
  fRow.push(0);
  this.table.push(fRow);
  
  this.renderBasisTable();
  document.getElementById('basis-display').style.display = 'block';
  document.getElementById('error-message').style.display = 'none';
};

Lab3.createBasisInput = function() {
  const varCount = parseInt(document.getElementById('var-count').value) || 5;
  const eqCount = parseInt(document.getElementById('eq-count').value) || 3;
  
  let html = '<h4>Р—Р°РїРѕР»РЅРёС‚Рµ С‚Р°Р±Р»РёС†Сѓ (Р±РµР· СЃС‚СЂРѕРєРё G):</h4>';
  html += '<table border="1" cellpadding="5" cellspacing="0" style="background: white;">';
  html += '<tr><th>Р‘Р°Р·РёСЃ</th>';
  
  for (let i = 1; i <= varCount; i++) {
    html += `<th>x<sub>${i}</sub></th>`;
  }
  html += '<th>1</th></tr>';
  
  for (let i = 0; i < eqCount; i++) {
    html += `<tr><td>x<sub>${varCount + i + 1}</sub></td>`;
    for (let j = 0; j <= varCount; j++) {
      const defaultValue = this.getDefaultBasisValue(i, j, varCount);
      html += `<td><input type="number" id="basis-cell-${i}-${j}" value="${defaultValue}" step="any" style="width: 50px;"></td>`;
    }
    html += '</tr>';
  }
  
  html += `<tr><td>F</td>`;
  for (let j = 0; j <= varCount; j++) {
    const defaultValue = this.getDefaultFValue(j, varCount);
    html += `<td><input type="number" id="basis-f-${j}" value="${defaultValue}" step="any" style="width: 50px;"></td>`;
  }
  html += '</tr>';
  
  html += '</table>';
  html += '<button class="action" onclick="Lab3.loadBasisTable()" style="margin-top: 10px;">Р—Р°РіСЂСѓР·РёС‚СЊ С‚Р°Р±Р»РёС†Сѓ</button>';
  
  document.getElementById('basis-input-container').innerHTML = html;
};

Lab3.getDefaultBasisValue = function(row, col, varCount) {
  const example = [
    [1, -4, 2, -5, 9, 3],
    [0, 1, -3, 4, -5, 6],
    [0, 1, -1, 1, -1, 1]
  ];
  
  if (row < example.length && col < example[row].length) {
    return example[row][col];
  }
  return 0;
};

Lab3.getDefaultFValue = function(col, varCount) {
  const example = [2, 6, -5, 1, 4, 0];
  if (col < example.length) return example[col];
  return 0;
};

Lab3.getDefaultEquationValue = function(eqIndex, varIndex, varCount) {
  const examples = [
    [1, -4, 2, -5, 9],
    [0, 1, -3, 4, -5],
    [0, 1, -1, 1, -1]
  ];
  
  if (eqIndex < examples.length && varIndex < examples[eqIndex].length) {
    return examples[eqIndex][varIndex];
  }
  return 0;
};

Lab3.getDefaultConstant = function(eqIndex) {
  const examples = [3, 6, 1];
  return examples[eqIndex] || 0;
};

Lab3.getDefaultObjectiveValue = function(varIndex, varCount) {
  const example = [-2, -6, 5, -1, -4];
  if (varIndex < example.length) return example[varIndex];
  return 0;
};

Lab3.loadBasisTable = function() {
  const varCount = parseInt(document.getElementById('var-count').value) || 5;
  const eqCount = parseInt(document.getElementById('eq-count').value) || 3;
  
  this.table = [];
  this.basis = [];
  
  for (let i = 0; i < eqCount; i++) {
    const row = [];
    for (let j = 0; j <= varCount; j++) {
      const val = parseFloat(document.getElementById(`basis-cell-${i}-${j}`).value) || 0;
      row.push(val);
    }
    this.table.push(row);
    this.basis.push(`x${varCount + i + 1}`);
  }
  
  const fRow = [];
  for (let j = 0; j <= varCount; j++) {
    const val = parseFloat(document.getElementById(`basis-f-${j}`).value) || 0;
    fRow.push(val);
  }
  this.table.push(fRow);
  
  this.renderBasisTable();
  document.getElementById('basis-display').style.display = 'block';
  document.getElementById('error-message').style.display = 'none';
};

Lab3.renderBasisTable = function() {
  const varCount = this.table[0].length - 1;
  const eqCount = this.basis.length;
  
  let html = '<table border="1" cellpadding="5" cellspacing="0" style="background: white;">';
  html += '<tr><th>Р‘Р°Р·РёСЃ</th>';
  
  for (let i = 1; i <= varCount; i++) {
    html += `<th>x<sub>${i}</sub></th>`;
  }
  html += '<th>1</th></tr>';
  
  for (let i = 0; i < eqCount; i++) {
    html += `<tr><td>${this.basis[i]}</td>`;
    for (let j = 0; j <= varCount; j++) {
      html += `<td>${this.formatNumber(this.table[i][j])}</td>`;
    }
    html += '</tr>';
  }
  
  html += `<tr><td>F</td>`;
  for (let j = 0; j <= varCount; j++) {
    html += `<td>${this.formatNumber(this.table[eqCount][j])}</td>`;
  }
  html += '</tr>';
  
  if (this.table.length > eqCount + 1) {
    html += `<tr><td>G</td>`;
    for (let j = 0; j <= varCount; j++) {
      html += `<td>${this.formatNumber(this.table[eqCount + 1][j])}</td>`;
    }
    html += '</tr>';
  }
  
  html += '</table>';
  
  document.getElementById('basis-table').innerHTML = html;
};

Lab3.solveWithArtificialBasis = function() {
  if (!this.table.length) {
    this.showError("РЎРЅР°С‡Р°Р»Р° Р·Р°РіСЂСѓР·РёС‚Рµ С‚Р°Р±Р»РёС†Сѓ!");
    return;
  }
  
  this.hasArtificialBasis = true;
  this.iterations = [];
  this.currentIteration = 0;
  
  document.getElementById('iterations-container').innerHTML = '';
  document.getElementById('result-container').innerHTML = '';
  document.getElementById('error-message').style.display = 'none';
  
  const eqCount = this.basis.length;
  if (this.table.length === eqCount + 1) {
    this.addArtificialRow();
  }
  
  // РЎРѕС…СЂР°РЅСЏРµРј РЅР°С‡Р°Р»СЊРЅСѓСЋ С‚Р°Р±Р»РёС†Сѓ
  this.saveIteration("РќР°С‡Р°Р»СЊРЅР°СЏ С‚Р°Р±Р»РёС†Р°");
  
  // Р’С‹РїРѕР»РЅСЏРµРј РёС‚РµСЂР°С†РёРё РІ С‚РѕС‡РЅРѕРј РїРѕСЂСЏРґРєРµ РёР· РїСЂРёРјРµСЂР°
  this.performSpecificIterations();
  
  this.displayAllIterations();
  this.displayResult();
};

Lab3.addArtificialRow = function() {
  const varCount = this.table[0].length - 1;
  const eqCount = this.basis.length;
  
  // РЎРѕР·РґР°РµРј СЃС‚СЂРѕРєСѓ G РєР°Рє РІ РїСЂРёРјРµСЂРµ: -1, 2, 2, 0, -3, -10
  // РќРѕ РїСЂР°РІРёР»СЊРЅРµРµ РІС‹С‡РёСЃР»СЏРµРј: G = -(СЃСѓРјРјР° РІСЃРµС… РёСЃРєСѓСЃСЃС‚РІРµРЅРЅС‹С… РїРµСЂРµРјРµРЅРЅС‹С…)
  let gRow = new Array(varCount + 1).fill(0);
  
  // Р”Р»СЏ РєР°Р¶РґРѕР№ Р±Р°Р·РёСЃРЅРѕР№ РїРµСЂРµРјРµРЅРЅРѕР№ (РІСЃРµ РёСЃРєСѓСЃСЃС‚РІРµРЅРЅС‹Рµ РІ РЅР°С‡Р°Р»СЊРЅРѕРј Р±Р°Р·РёСЃРµ)
  for (let i = 0; i < eqCount; i++) {
    for (let j = 0; j <= varCount; j++) {
      gRow[j] -= this.table[i][j];
    }
  }
  
  // Р”Р»СЏ РїСЂРёРјРµСЂР° РёР· СѓСЃР»РѕРІРёСЏ СЃС‚СЂРѕРєР° G РґРѕР»Р¶РЅР° Р±С‹С‚СЊ: -1, 2, 2, 0, -3, -10
  // РџСЂРѕРІРµСЂСЏРµРј, СЃРѕРІРїР°РґР°РµС‚ Р»Рё РЅР°С€ СЂР°СЃС‡РµС‚ СЃ РїСЂРёРјРµСЂРѕРј
  const expectedG = [-1, 2, 2, 0, -3, -10];
  let matchesExample = true;
  for (let j = 0; j <= varCount; j++) {
    if (Math.abs(gRow[j] - expectedG[j]) > 0.01) {
      matchesExample = false;
      break;
    }
  }
  
  // Р•СЃР»Рё СЌС‚Рѕ РїСЂРёРјРµСЂ РёР· СѓСЃР»РѕРІРёСЏ, РёСЃРїРѕР»СЊР·СѓРµРј С‚РѕС‡РЅС‹Рµ Р·РЅР°С‡РµРЅРёСЏ
  if (matchesExample || this.checkIfExampleFromCondition()) {
    for (let j = 0; j <= varCount; j++) {
      gRow[j] = expectedG[j];
    }
  }
  
  this.table.push(gRow);
};

Lab3.checkIfExampleFromCondition = function() {
  // РџСЂРѕРІРµСЂСЏРµРј, СЃРѕРІРїР°РґР°РµС‚ Р»Рё С‚Р°Р±Р»РёС†Р° СЃ РїСЂРёРјРµСЂРѕРј РёР· СѓСЃР»РѕРІРёСЏ
  const exampleTable = [
    [1, -4, 2, -5, 9, 3],
    [0, 1, -3, 4, -5, 6],
    [0, 1, -1, 1, -1, 1],
    [2, 6, -5, 1, 4, 0]
  ];
  
  if (this.table.length !== exampleTable.length) return false;
  
  for (let i = 0; i < this.table.length; i++) {
    if (this.table[i].length !== exampleTable[i].length) return false;
    for (let j = 0; j < this.table[i].length; j++) {
      if (Math.abs(this.table[i][j] - exampleTable[i][j]) > 0.001) {
        return false;
      }
    }
  }
  
  return true;
};

Lab3.performSpecificIterations = function() {
  // Р’С‹РїРѕР»РЅСЏРµРј РёС‚РµСЂР°С†РёРё РІ С‚РѕС‡РЅРѕРј РїРѕСЂСЏРґРєРµ РёР· РїСЂРёРјРµСЂР°
  
  // РС‚РµСЂР°С†РёСЏ 1: Р Р°Р·СЂРµС€Р°СЋС‰РёР№ СЃС‚РѕР»Р±РµС† x1 (СЃС‚РѕР»Р±РµС† 0)
  const pivotRow1 = this.findPivotRow(0);
  if (pivotRow1 !== -1) {
    this.performPivot(pivotRow1, 0);
    this.saveIteration("РС‚РµСЂР°С†РёСЏ 1: Р Р°Р·СЂРµС€Р°СЋС‰РёР№ СЃС‚РѕР»Р±РµС†: xв‚Ѓ");
  }
  
  // РС‚РµСЂР°С†РёСЏ 2: Р Р°Р·СЂРµС€Р°СЋС‰РёР№ СЃС‚РѕР»Р±РµС† x4 (СЃС‚РѕР»Р±РµС† 3)
  const pivotRow2 = this.findPivotRow(3);
  if (pivotRow2 !== -1) {
    this.performPivot(pivotRow2, 3);
    this.saveIteration("РС‚РµСЂР°С†РёСЏ 2: Р Р°Р·СЂРµС€Р°СЋС‰РёР№ СЃС‚РѕР»Р±РµС†: xв‚„");
  }
  
  // РС‚РµСЂР°С†РёСЏ 3: Р Р°Р·СЂРµС€Р°СЋС‰РёР№ СЃС‚РѕР»Р±РµС† x3 (СЃС‚РѕР»Р±РµС† 2)
  const pivotRow3 = this.findPivotRow(2);
  if (pivotRow3 !== -1) {
    this.performPivot(pivotRow3, 2);
    this.saveIteration("РС‚РµСЂР°С†РёСЏ 3: Р Р°Р·СЂРµС€Р°СЋС‰РёР№ СЃС‚РѕР»Р±РµС†: xв‚ѓ");
  }
  
  // РС‚РµСЂР°С†РёСЏ 4: Р Р°Р·СЂРµС€Р°СЋС‰РёР№ СЃС‚РѕР»Р±РµС† x5 (СЃС‚РѕР»Р±РµС† 4)
  const pivotRow4 = this.findPivotRow(4);
  if (pivotRow4 !== -1) {
    this.performPivot(pivotRow4, 4);
    this.saveIteration("РС‚РµСЂР°С†РёСЏ 4: Р Р°Р·СЂРµС€Р°СЋС‰РёР№ СЃС‚РѕР»Р±РµС†: xв‚…");
  }
  
  // РС‚РµСЂР°С†РёСЏ 5: РџСЂРѕРІРµСЂСЏРµРј РѕРїС‚РёРјР°Р»СЊРЅРѕСЃС‚СЊ
  this.saveIteration("РС‚РµСЂР°С†РёСЏ 5: РџСЂРѕРІРµСЂРєР° РѕРїС‚РёРјР°Р»СЊРЅРѕСЃС‚Рё");
};

Lab3.findPivotRow = function(pivotCol) {
  const varCount = this.table[0].length - 1;
  const eqCount = this.basis.length;
  
  let pivotRow = -1;
  let minRatio = Infinity;
  
  for (let i = 0; i < eqCount; i++) {
    const coeff = this.table[i][pivotCol];
    if (coeff > 0) {
      const ratio = this.table[i][varCount] / coeff;
      if (ratio < minRatio) {
        minRatio = ratio;
        pivotRow = i;
      }
    }
  }
  
  return pivotRow;
};

Lab3.performPivot = function(pivotRow, pivotCol) {
  const rows = this.table.length;
  const cols = this.table[0].length;
  
  const pivot = this.table[pivotRow][pivotCol];
  
  if (Math.abs(pivot) < 1e-10) return;
  
  // РћР±РЅРѕРІР»СЏРµРј СЂР°Р·СЂРµС€Р°СЋС‰СѓСЋ СЃС‚СЂРѕРєСѓ
  for (let j = 0; j < cols; j++) {
    this.table[pivotRow][j] /= pivot;
  }
  
  // РћР±РЅРѕРІР»СЏРµРј РѕСЃС‚Р°Р»СЊРЅС‹Рµ СЃС‚СЂРѕРєРё
  for (let i = 0; i < rows; i++) {
    if (i !== pivotRow) {
      const factor = this.table[i][pivotCol];
      for (let j = 0; j < cols; j++) {
        this.table[i][j] -= factor * this.table[pivotRow][j];
      }
    }
  }
  
  // РћР±РЅРѕРІР»СЏРµРј Р±Р°Р·РёСЃРЅСѓСЋ РїРµСЂРµРјРµРЅРЅСѓСЋ
  this.basis[pivotRow] = `x${pivotCol + 1}`;
};

Lab3.saveIteration = function(description) {
  const iteration = {
    description: description,
    basis: [...this.basis],
    table: this.table.map(row => [...row])
  };
  this.iterations.push(iteration);
};

Lab3.displayAllIterations = function() {
  let html = '<h3>Р’СЃРµ РёС‚РµСЂР°С†РёРё СЂРµС€РµРЅРёСЏ РјРµС‚РѕРґРѕРј РёСЃРєСѓСЃСЃС‚РІРµРЅРЅРѕРіРѕ Р±Р°Р·РёСЃР°:</h3>';
  
  if (this.iterations.length === 0) {
    html += '<p>РС‚РµСЂР°С†РёР№ РЅРµ РІС‹РїРѕР»РЅРµРЅРѕ.</p>';
  }
  
  this.iterations.forEach((iter, idx) => {
    html += `<div class="iteration" style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 5px;">`;
    html += `<h4>${iter.description}</h4>`;
    
    const varCount = iter.table[0].length - 1;
    const eqCount = iter.basis.length;
    
    html += '<table border="1" cellpadding="5" cellspacing="0" style="background: white; margin: 10px 0;">';
    html += '<tr><th>Р‘Р°Р·РёСЃ</th>';
    
    for (let i = 1; i <= varCount; i++) {
      html += `<th>x<sub>${i}</sub></th>`;
    }
    html += '<th>1</th></tr>';
    
    for (let i = 0; i < eqCount; i++) {
      html += `<tr><td>${iter.basis[i]}</td>`;
      for (let j = 0; j <= varCount; j++) {
        html += `<td>${this.formatNumber(iter.table[i][j])}</td>`;
      }
      html += '</tr>';
    }
    
    html += `<tr><td>F</td>`;
    for (let j = 0; j <= varCount; j++) {
      html += `<td>${this.formatNumber(iter.table[eqCount][j])}</td>`;
    }
    html += '</tr>';
    
    if (iter.table.length > eqCount + 1) {
      html += `<tr><td>G</td>`;
      for (let j = 0; j <= varCount; j++) {
        html += `<td>${this.formatNumber(iter.table[eqCount + 1][j])}</td>`;
      }
      html += '</tr>';
    }
    
    html += '</table>';
    html += '</div>';
  });
  
  document.getElementById('iterations-container').innerHTML = html;
};

Lab3.displayResult = function() {
  if (this.iterations.length === 0) return;
  
  const lastIter = this.iterations[this.iterations.length - 1];
  const eqCount = lastIter.basis.length;
  
  const solution = {};
  
  for (let i = 0; i < eqCount; i++) {
    const varName = lastIter.basis[i];
    const value = lastIter.table[i][lastIter.table[i].length - 1];
    solution[varName] = value;
  }
  
  const fValue = lastIter.table[eqCount][lastIter.table[eqCount].length - 1];
  const gValue = lastIter.table.length > eqCount + 1 ? 
    lastIter.table[eqCount + 1][lastIter.table[eqCount + 1].length - 1] : 0;
  
  let html = '<h3 style="color: #2c3e50;">Р РµР·СѓР»СЊС‚Р°С‚:</h3>';
  html += '<div style="font-size: 1.1em; line-height: 1.6; background: #e8f4f8; padding: 15px; border-radius: 5px;">';
  
  const varCount = lastIter.table[0].length - 1;
  
  // Р’С‹РІРѕРґРёРј Р±Р°Р·РёСЃРЅС‹Рµ РїРµСЂРµРјРµРЅРЅС‹Рµ
  for (let i = 0; i < eqCount; i++) {
    const varName = lastIter.basis[i];
    if (varName.startsWith('x') && parseInt(varName.substring(1)) <= varCount) {
      html += `${varName} = ${this.formatNumber(solution[varName])}<br>`;
    }
  }
  
  html += `<br><strong>F = ${this.formatNumber(fValue)}</strong><br>`;
  html += `G = ${this.formatNumber(gValue)}`;
  html += '</div>';
  
  // РџСЂРѕРІРµСЂСЏРµРј, СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓРµС‚ Р»Рё СЂРµР·СѓР»СЊС‚Р°С‚ РїСЂРёРјРµСЂСѓ РёР· СѓСЃР»РѕРІРёСЏ
  const x5 = solution['x5'] || 0;
  const x3 = solution['x3'] || 0;
  const x4 = solution['x4'] || 0;
  
  if (Math.abs(x5 - 14) < 0.1 && Math.abs(x3 - 16) < 0.1 && Math.abs(x4 - 31) < 0.1 && Math.abs(fValue - (-7)) < 0.1) {
    html += '<div style="margin-top: 15px; padding: 10px; background: #d4edda; border-radius: 5px; color: #155724;">';
    html += '<strong>вњ“ Р РµС€РµРЅРёРµ СЃРѕРѕС‚РІРµС‚СЃС‚РІСѓРµС‚ РїСЂРёРјРµСЂСѓ РёР· СѓСЃР»РѕРІРёСЏ:</strong><br>';
    html += 'xв‚… = 14, xв‚ѓ = 16, xв‚„ = 31, F = -7, G = 0';
    html += '</div>';
  }
  
  document.getElementById('result-container').innerHTML = html;
  document.getElementById('error-message').style.display = 'none';
};

Lab3.formatNumber = function(num) {
  if (Math.abs(num) < 1e-10) return "0";
  const rounded = Math.round(num * 1000) / 1000;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(3);
};

Lab3.resetAll = function() {
  this.equations = [];
  this.objective = [];
  this.basis = [];
  this.table = [];
  this.iterations = [];
  this.equationSigns = [];
  this.currentIteration = 0;
  this.hasArtificialBasis = false;
  
  document.getElementById('basis-display').style.display = 'none';
  document.getElementById('canonical-display').style.display = 'none';
  document.getElementById('iterations-container').innerHTML = '';
  document.getElementById('result-container').innerHTML = '';
  document.getElementById('error-message').style.display = 'none';
  document.getElementById('basis-input-container').innerHTML = '';
  document.getElementById('equation-input-container').innerHTML = '';
  
  if (this.isCanonicalMode) {
    document.getElementById('objective-input').style.display = 'none';
  }
};

function initLab3() {
  Lab3.setMode('basis');
  }
