export function generarReporteHtml(tokens, lexErrs, synErrs) {
  let html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte de Análisis - JavaBridge</title>
  <style>
    :root {
      --color-black: #1e1e1e;
      --color-dark-grey: #252526;
      --color-mid-grey: #333;
      --color-light-grey: #858585;
      --color-white: #d4d4d4;
      --color-purple: #6a1b9a;
      --color-purple-light: #9c4dcc;
      --color-error: #f44336;
      --color-success: #4caf50;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: var(--color-black);
      color: var(--color-white);
      padding: 40px;
      line-height: 1.6;
    }
    
    .header {
      text-align: center;
      margin-bottom: 50px;
      padding-bottom: 30px;
      border-bottom: 2px solid var(--color-purple);
    }
    
    .header h1 {
      font-size: 2.5em;
      color: var(--color-purple-light);
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .header .subtitle {
      color: var(--color-light-grey);
      font-size: 1.1em;
    }
    
    .section {
      margin-bottom: 50px;
      background-color: var(--color-dark-grey);
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    
    .section h2 {
      color: var(--color-purple-light);
      font-size: 1.8em;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--color-mid-grey);
    }
    
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    
    .stat-card {
      flex: 1;
      min-width: 200px;
      background-color: var(--color-mid-grey);
      padding: 20px;
      border-radius: 6px;
      border-left: 4px solid var(--color-purple);
    }
    
    .stat-card.error {
      border-left-color: var(--color-error);
    }
    
    .stat-card.success {
      border-left-color: var(--color-success);
    }
    
    .stat-card h3 {
      color: var(--color-light-grey);
      font-size: 0.9em;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .stat-card .number {
      font-size: 2.5em;
      font-weight: bold;
      color: var(--color-white);
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      background-color: var(--color-mid-grey);
      border-radius: 6px;
      overflow: hidden;
    }
    
    thead {
      background-color: var(--color-purple);
    }
    
    th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      color: var(--color-white);
      text-transform: uppercase;
      font-size: 0.85em;
      letter-spacing: 0.5px;
    }
    
    td {
      padding: 12px 15px;
      border-bottom: 1px solid var(--color-dark-grey);
      color: var(--color-white);
    }
    
    tbody tr {
      transition: background-color 0.2s;
    }
    
    tbody tr:hover {
      background-color: rgba(156, 77, 204, 0.1);
    }
    
    tbody tr:last-child td {
      border-bottom: none;
    }
    
    .token-type {
      display: inline-block;
      padding: 4px 10px;
      background-color: var(--color-purple-light);
      color: white;
      border-radius: 4px;
      font-size: 0.85em;
      font-weight: 500;
    }
    
    .error-message {
      color: var(--color-error);
      font-weight: 500;
    }
    
    .lexeme {
      font-family: 'Courier New', monospace;
      background-color: var(--color-black);
      padding: 2px 6px;
      border-radius: 3px;
      color: var(--color-purple-light);
    }
    
    .no-errors {
      text-align: center;
      padding: 30px;
      color: var(--color-success);
      font-size: 1.2em;
    }
    
    .no-errors::before {
      content: "✓ ";
      font-size: 1.5em;
    }
    
    @media print {
      body {
        background-color: white;
        color: black;
      }
      .section {
        box-shadow: none;
        border: 1px solid #ccc;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Reporte de Análisis</h1>
    <p class="subtitle">JavaBridge - Traductor Java a Python</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <h3>Tokens Reconocidos</h3>
      <div class="number">${tokens.length}</div>
    </div>
    <div class="stat-card ${lexErrs.length > 0 ? 'error' : 'success'}">
      <h3>Errores Léxicos</h3>
      <div class="number">${lexErrs.length}</div>
    </div>
    <div class="stat-card ${synErrs.length > 0 ? 'error' : 'success'}">
      <h3>Errores Sintácticos</h3>
      <div class="number">${synErrs.length}</div>
    </div>
  </div>

  <div class="section">
    <h2>Tokens Reconocidos</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 60px;">#</th>
          <th style="width: 25%;">Lexema</th>
          <th style="width: 30%;">Tipo</th>
          <th style="width: 15%;">Fila</th>
          <th style="width: 15%;">Columna</th>
        </tr>
      </thead>
      <tbody>`;
  
  tokens.forEach((t, i) => {
    html += `
        <tr>
          <td>${i + 1}</td>
          <td><span class="lexeme">${escapeHtml(t.value)}</span></td>
          <td><span class="token-type">${t.type}</span></td>
          <td>${t.line}</td>
          <td>${t.column}</td>
        </tr>`;
  });
  
  html += `
      </tbody>
    </table>
  </div>`;

  // Errores léxicos
  if (lexErrs.length > 0) {
    html += `
  <div class="section">
    <h2>Errores Léxicos</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 60px;">#</th>
          <th style="width: 20%;">Lexema</th>
          <th style="width: 40%;">Descripción</th>
          <th style="width: 15%;">Fila</th>
          <th style="width: 15%;">Columna</th>
        </tr>
      </thead>
      <tbody>`;
    
    lexErrs.forEach((e, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td><span class="lexeme">${escapeHtml(e.value)}</span></td>
          <td><span class="error-message">${escapeHtml(e.message)}</span></td>
          <td>${e.line}</td>
          <td>${e.column}</td>
        </tr>`;
    });
    
    html += `
      </tbody>
    </table>
  </div>`;
  } else {
    html += `
  <div class="section">
    <h2>Errores Léxicos</h2>
    <p>No se encontraron errores léxicos</p>
  </div>`;
  }

  // Errores sintácticos
  if (synErrs.length > 0) {
    html += `
  <div class="section">
    <h2>Errores Sintácticos</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 60px;">#</th>
          <th style="width: 20%;">Token</th>
          <th style="width: 40%;">Descripción</th>
          <th style="width: 15%;">Fila</th>
          <th style="width: 15%;">Columna</th>
        </tr>
      </thead>
      <tbody>`;
    
    synErrs.forEach((e, i) => {
      html += `
        <tr>
          <td>${i + 1}</td>
          <td><span class="lexeme">${escapeHtml(e.value)}</span></td>
          <td><span class="error-message">${escapeHtml(e.message)}</span></td>
          <td>${e.line}</td>
          <td>${e.column}</td>
        </tr>`;
    });
    
    html += `
      </tbody>
    </table>
  </div>`;
  } else {
    html += `
  <div class="section">
    <h2>Errores Sintácticos</h2>
    <p>No se encontraron errores sintácticos</p>
  </div>`;
  }

  html += `
</body>
</html>`;
  
  return html;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
