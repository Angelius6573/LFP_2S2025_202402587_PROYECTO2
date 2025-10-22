export function simularPython(code) {
  const output = [];
  const errors = [];
  const vars = { True: true, False: false };
  
  try {
    // Ejecutar línea por línea
    const lines = code.split('\n');
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Saltar líneas vacías y comentarios
      if (!line || line.startsWith('#') || line.startsWith("'''")) {
        i++;
        continue;
      }
      
      // Manejar print()
      if (line.includes('print(')) {
        try {
          const match = line.match(/print\((.*)\)/);
          if (match) {
            const expr = match[1];
            const result = evaluarExpresion(expr, vars);
            output.push(`>> ${result}`);
          }
        } catch (e) {
          errors.push(`Error en print (línea ${i+1}): ${e.message}`);
        }
      }
      // Manejar asignaciones
      else if (line.includes('=') && !line.includes('==') && !line.includes('<=') && !line.includes('>=') && !line.includes('!=')) {
        try {
          const [varName, expr] = line.split('=').map(s => s.trim());
          vars[varName] = evaluarExpresion(expr, vars);
        } catch (e) {
          errors.push(`Error en asignación (línea ${i+1}): ${e.message}`);
        }
      }
      // Manejar while
      else if (line.startsWith('while ')) {
        try {
          const condMatch = line.match(/while (.+):/);
          if (condMatch) {
            const condition = condMatch[1];
            const blockLines = [];
            i++;
            
            // Recolectar líneas del bloque while
            while (i < lines.length && (lines[i].startsWith('    ') || !lines[i].trim())) {
              if (lines[i].trim()) {
                blockLines.push(lines[i].replace(/^    /, ''));
              }
              i++;
            }
            i--; // Retroceder uno porque el while externo incrementará
            
            // Ejecutar el while
            let iteraciones = 0;
            const MAX_ITER = 1000; // Prevenir loops infinitos
            
            while (evaluarCondicion(condition, vars) && iteraciones < MAX_ITER) {
              for (const blockLine of blockLines) {
                ejecutarLinea(blockLine, vars, output, errors);
              }
              iteraciones++;
            }
            
            if (iteraciones >= MAX_ITER) {
              errors.push(`Warning: While loop detenido después de ${MAX_ITER} iteraciones`);
            }
          }
        } catch (e) {
          errors.push(`Error en while (línea ${i+1}): ${e.message}`);
        }
      }
      // Manejar if
      else if (line.startsWith('if ')) {
        try {
          const condMatch = line.match(/if (.+):/);
          if (condMatch) {
            const condition = condMatch[1];
            const ifBlock = [];
            const elseBlock = [];
            let currentBlock = ifBlock;
            i++;
            
            // Recolectar bloques if/else
            while (i < lines.length && (lines[i].startsWith('    ') || lines[i].trim() === 'else:' || !lines[i].trim())) {
              if (lines[i].trim() === 'else:') {
                currentBlock = elseBlock;
                i++;
                continue;
              }
              if (lines[i].trim()) {
                currentBlock.push(lines[i].replace(/^    /, ''));
              }
              i++;
            }
            i--;
            
            // Ejecutar el bloque apropiado
            const bloqueAEjecutar = evaluarCondicion(condition, vars) ? ifBlock : elseBlock;
            for (const blockLine of bloqueAEjecutar) {
              ejecutarLinea(blockLine, vars, output, errors);
            }
          }
        } catch (e) {
          errors.push(`Error en if (línea ${i+1}): ${e.message}`);
        }
      }
      
      i++;
    }
    
  } catch (e) {
    errors.push(`Error general: ${e.message}`);
  }
  
  return {
    output: output.length > 0 ? output.join('\n') : '(sin salida)',
    error: errors.length > 0 ? errors.join('\n') : null
  };
}

function ejecutarLinea(line, vars, output, errors) {
  const trimmed = line.trim();
  
  if (!trimmed || trimmed.startsWith('#')) return;
  
  if (trimmed.includes('print(')) {
    try {
      const match = trimmed.match(/print\((.*)\)/);
      if (match) {
        const result = evaluarExpresion(match[1], vars);
        output.push(`>> ${result}`);
      }
    } catch (e) {
      errors.push(`Error en print: ${e.message}`);
    }
  } else if (trimmed.includes('+=')) {
    const [varName, increment] = trimmed.split('+=').map(s => s.trim());
    vars[varName] = (vars[varName] || 0) + evaluarExpresion(increment, vars);
  } else if (trimmed.includes('=') && !trimmed.includes('==') && !trimmed.includes('<=') && !trimmed.includes('>=')) {
    const [varName, expr] = trimmed.split('=').map(s => s.trim());
    vars[varName] = evaluarExpresion(expr, vars);
  }
}

function evaluarCondicion(condition, vars) {
  try {
    // Reemplazar variables
    let expr = condition;
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      expr = expr.replace(regex, JSON.stringify(value));
    }
    
    // Evaluar
    return eval(expr);
  } catch (e) {
    throw new Error(`No se pudo evaluar condición: ${condition}`);
  }
}

function evaluarExpresion(expr, vars) {
  try {
    let resultado = expr.trim();
    
    // Manejar comentarios inline
    if (resultado.includes('#')) {
      resultado = resultado.split('#')[0].trim();
    }
    
    // Si es un string literal, devolverlo sin comillas
    if ((resultado.startsWith('"') && resultado.endsWith('"')) || 
        (resultado.startsWith("'") && resultado.endsWith("'"))) {
      return resultado.slice(1, -1);
    }
    
    // Si contiene concatenación de strings con +
    if (resultado.includes('"') && resultado.includes('+')) {
      // Dividir por + y procesar cada parte
      const partes = resultado.split('+').map(p => p.trim());
      let resultadoFinal = '';
      
      for (const parte of partes) {
        if (parte.startsWith('str(') && parte.endsWith(')')) {
          // Extraer expresión dentro de str()
          const inner = parte.slice(4, -1).trim();
          const valor = vars[inner] !== undefined ? vars[inner] : eval(inner);
          resultadoFinal += String(valor);
        } else if ((parte.startsWith('"') && parte.endsWith('"')) || 
                   (parte.startsWith("'") && parte.endsWith("'"))) {
          resultadoFinal += parte.slice(1, -1);
        } else {
          const valor = vars[parte] !== undefined ? vars[parte] : eval(parte);
          resultadoFinal += String(valor);
        }
      }
      return resultadoFinal;
    }
    
    // Reemplazar variables por sus valores
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      resultado = resultado.replace(regex, JSON.stringify(value));
    }
    
    // Evaluar expresión matemática o lógica
    return eval(resultado);
    
  } catch (e) {
    // Si falla, intentar devolver como string o variable
    return vars[expr] !== undefined ? vars[expr] : expr;
  }
}
