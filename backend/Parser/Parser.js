import { Error } from '../Error/Error.js';

export class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== 'NEWLINE');
    this.pos = 0;
    this.errors = [];
    this.python = '';
    this.indent = '';
  }

  analizar() {
    this.python = '';
    this.errors = [];
    this.indent = '';
    this.programa();
    return { errors: this.errors, python: this.python };
  }

  programa() {
    this.consume('PUBLIC');
    this.consume('CLASS');
    this.consume('IDENTIFICADOR');
    this.consume('LLAVE_IZQ');
    this.main();
    this.consume('LLAVE_DER');
    
    if (this.pos < this.tokens.length) {
        const t = this.tokens[this.pos];
        this.errors.push(new Error('Sintáctico', t.value, 'Tokens inesperados después de la llave de cierre de la clase', t.line, t.column));
    }
  }

  main() {
    this.consume('PUBLIC');
    this.consume('STATIC');
    this.consume('VOID');
    this.consume('MAIN');
    this.consume('PAR_IZQ');
    this.consume('STRING_TYPE');
    this.consume('COR_IZQ');
    this.consume('COR_DER');
    this.consume('ARGS');
    this.consume('PAR_DER');
    this.consume('LLAVE_IZQ');
    this.sentencias();
    this.consume('LLAVE_DER');
  }

  sentencias() {
    while (!this.check('LLAVE_DER') && this.pos < this.tokens.length) {
      const t = this.tokens[this.pos];
      if (!t) break;

      switch (t.type) {
        case 'INT_TYPE':
        case 'DOUBLE_TYPE':
        case 'CHAR_TYPE':
        case 'STRING_TYPE':
        case 'BOOLEAN_TYPE':
          this.declaracion();
          break;
        case 'IF':
          this.ifStmt();
          break;
        case 'FOR':
          this.forStmt();
          break;
        case 'WHILE':
          this.whileStmt();
          break;
        case 'SYSTEM':
          this.printStmt();
          break;
        case 'IDENTIFICADOR':
          this.asignacion();
          break;
        case 'COMENTARIO_LINEA':
          this.comentarioLineaStmt();
          break;
        case 'COMENTARIO_BLOQUE':
          this.comentarioBloqueStmt();
          break;
        default:
          this.errors.push(new Error('Sintáctico', t.value, 'Instrucción no válida o inesperada', t.line, t.column));
          this.pos++;
      }
    }
  }

  comentarioLineaStmt() {
    const t = this.consume('COMENTARIO_LINEA');
    if (t.value) { // Solo emitir si no está vacío
      this.emit(`# ${t.value}`);
    }
  }

  comentarioBloqueStmt() {
    const t = this.consume('COMENTARIO_BLOQUE');
    const lineas = t.value.split('\n');
    if (lineas.length > 1) {
      this.emit(`'''`);
      // Emitir cada línea con la indentación actual
      lineas.forEach(l => this.emit(l.trim()));
      this.emit(`'''`);
    } else {
      // Traducción una línea
      this.emit(`'''${t.value}'''`);
    }
  }

  declaracion() {
    const tipoToken = this.tokens[this.pos];
    const tipo = tipoToken.type;
    this.pos++;

    let valorDefecto = '';
    switch (tipo) {
      case 'INT_TYPE': valorDefecto = '0'; break;
      case 'DOUBLE_TYPE': valorDefecto = '0.0'; break;
      case 'CHAR_TYPE': valorDefecto = "''"; break;
      case 'STRING_TYPE': valorDefecto = '""'; break;
      case 'BOOLEAN_TYPE': valorDefecto = 'False'; break;
    }

    while (this.pos < this.tokens.length) {
      const id = this.consume('IDENTIFICADOR');
      if (!id.value) return;

      if (this.match('EQUAL')) {
        const pyVal = this.expresion(tipo);
        this.emit(`${id.value} = ${pyVal}`);
      } else {
        this.emit(`${id.value} = ${valorDefecto} # Declaracion: ${tipoToken.value}`);
      }

      if (this.check('COMMA')) {
        this.pos++;
      } else if (this.check('SEMICOLON')) {
        break;
      } else {
        this.consume('SEMICOLON');
        return;
      }
    }
    this.consume('SEMICOLON');
  }

  asignacion() {
    const id = this.consume('IDENTIFICADOR');
    this.consume('EQUAL');
    const pyVal = this.expresion(); 
    this.consume('SEMICOLON');
    this.emit(`${id.value} = ${pyVal}`);
  }

  ifStmt() {
    this.consume('IF');
    this.consume('PAR_IZQ');
    const cond = this.expresion();
    this.consume('PAR_DER');
    this.emit(`if ${cond}:`);
    this.bloque();
    if (this.match('ELSE')) {
      this.emit('else:');
      this.bloque();
    }
  }

  forStmt() {
    this.consume('FOR');
    this.consume('PAR_IZQ');

    this.pos++; // Saltar TIPO
    const id = this.consume('IDENTIFICADOR');
    this.consume('EQUAL');
    const initVal = this.expresion();
    this.emit(`${id.value} = ${initVal}`);
    this.consume('SEMICOLON');

    const cond = this.expresion();
    this.consume('SEMICOLON');

    const idUpdate = this.consume('IDENTIFICADOR');
    const updateOp = this.consume('INCREMENTO');
    const pyUpdate = updateOp.value === '++' ? `${idUpdate.value} += 1` : `${idUpdate.value} -= 1`;
    this.consume('PAR_DER');

    this.emit(`while ${cond}:`);
    
    const oldIndent = this.indent;
    this.indent += '    ';
    
    this.consume('LLAVE_IZQ');
    this.sentencias();
    this.emit(pyUpdate); // Actualización al final del bloque
    this.consume('LLAVE_DER');

    this.indent = oldIndent;
  }

  whileStmt() {
    this.consume('WHILE');
    this.consume('PAR_IZQ');
    const cond = this.expresion();
    this.consume('PAR_DER');
    this.emit(`while ${cond}:`);
    this.bloque();
  }

  printStmt() {
    this.consume('SYSTEM');
    this.consume('DOT');
    this.consume('OUT');
    this.consume('DOT');
    this.consume('PRINTLN');
    this.consume('PAR_IZQ');
    const args = this.expresion();
    this.consume('PAR_DER');
    this.consume('SEMICOLON');
    this.emit(`print(${args})`);
  }

  expresion(tipoContexto = null) {
    let buf = '';
    let esStringExpr = tipoContexto === 'STRING_TYPE';

    while (this.pos < this.tokens.length && !this.check('PAR_DER') && !this.check('SEMICOLON') && !this.check('LLAVE_IZQ')) {
      const t = this.tokens[this.pos];
      let val = t.value;

      switch (t.type) {
        case 'TRUE': val = 'True'; break;
        case 'FALSE': val = 'False'; break;
        case 'CADENA':
          val = `"${val}"`;
          esStringExpr = true;
          break;
        case 'CARACTER':
          val = `"${val}"`;
          break;
        case 'OPERADOR_ARIT':
          val = ` ${t.value} `;
          break;
        case 'OPERADOR_REL':
        case 'EQUAL':
          val = ` ${t.value} `;
          break;
        case 'IDENTIFICADOR':
        case 'ENTERO':
        case 'DECIMAL':
          if (esStringExpr && buf.includes('+')) {
            val = `str(${val})`;
          }
          break;
      }
      if (buf.startsWith('"') && val.trim() === '+') {
          esStringExpr = true;
      }
      
      buf += val;
      this.pos++;
    }
    
    return buf.replace(/ \+ /g, ' + ').trim();
  }


  bloque() {
    this.consume('LLAVE_IZQ');
    const oldIndent = this.indent;
    this.indent += '    ';
    this.sentencias();
    this.indent = oldIndent;
    this.consume('LLAVE_DER');
  }
  
  emit(linea) {
    this.python += this.indent + linea + '\n';
  }

  consume(tipo) {
    const t = this.tokens[this.pos];
    if (!t) {
       this.errors.push(new Error('Sintáctico', 'EOF', `Se esperaba ${tipo}`, 0, 0));
       return { value: '' };
    }
    if (t.type !== tipo) {
      this.errors.push(new Error('Sintáctico', t.value, `Se esperaba ${tipo} pero se obtuvo ${t.type}`, t.line, t.column));
      this.pos++;
      return { value: '' };
    }
    this.pos++;
    return t;
  }

  match(tipo) {
    if (this.pos < this.tokens.length && this.tokens[this.pos].type === tipo) {
      this.pos++;
      return true;
    }
    return false;
  }

  check(tipo) {
    return this.pos < this.tokens.length && this.tokens[this.pos].type === tipo;
  }
}
