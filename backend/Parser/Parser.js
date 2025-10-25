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
    
    this.miembrosClase(); 
    
    this.consume('LLAVE_DER');
    
    if (this.pos < this.tokens.length) {
        const t = this.tokens[this.pos];
        this.errors.push(new Error('Sintáctico', t.value, 'Tokens inesperados después de la llave de cierre de la clase', t.line, t.column));
    }
  }

  miembrosClase() {
    while (!this.check('LLAVE_DER') && this.pos < this.tokens.length) {
      const t = this.tokens[this.pos];
      if (!t) break;
      
      if (this.check('COMENTARIO_LINEA') || this.check('COMENTARIO_BLOQUE')) {
          this.pos++; 
          continue;
      }
      
      if (this.check('PUBLIC') && this.tokens[this.pos+1]?.type === 'STATIC' && this.tokens[this.pos+2]?.type === 'VOID' && this.tokens[this.pos+3]?.type === 'MAIN') {
        this.main();
      } 
      else if (this.check('PRIVATE') || this.check('PROTECTED') || this.check('STATIC') || this.check('PUBLIC')) { 
        if (this.tokens[this.pos+2]?.type.endsWith('_TYPE') || this.tokens[this.pos+2]?.type === 'VOID') {
             this.declaracionMetodo();
        } else {
             this.declaracionCampo();
        }
      }
      else {
        this.errors.push(new Error('Sintáctico', t.value, 'Miembro de clase no reconocido o mal formado', t.line, t.column));
        this.pos++;
      }
    }
  }

  declaracionCampo() {
    let tokensIgnorados = [];
    
    while (!this.check('SEMICOLON') && this.pos < this.tokens.length) {
      tokensIgnorados.push(this.tokens[this.pos].value);
      this.pos++;
    }
    this.consume('SEMICOLON');
    
    this.emit(`# [Omitir por posible error] ${tokensIgnorados.join(' ')}`);
  }

  declaracionMetodo() {
    while (this.check('PUBLIC') || this.check('PRIVATE') || this.check('STATIC') || this.check('FINAL') || this.check('PROTECTED')) {
        this.pos++;
    }
    
    this.pos++;
    
    const idMetodo = this.consume('IDENTIFICADOR');
    this.consume('PAR_IZQ');
    
    let params = '';
    while (!this.check('PAR_DER') && this.pos < this.tokens.length) {
      const t = this.tokens[this.pos];
      if (t.type.endsWith('_TYPE')) { 
          this.pos++;
          params += t.value + ' ';
      } else if (this.check('IDENTIFICADOR')) { 
          params += t.value;
          this.pos++;
          if (this.check('COMMA')) {
              this.consume('COMMA');
              params += ', ';
          }
      } else {
          this.pos++;
      }
    }
    this.consume('PAR_DER');
    
    const pyParams = params.match(/(\w+)$/g)?.join(', ') || params.split(', ').map(p => p.trim().split(' ').pop()).filter(p => p.length > 0).join(', ');
    
    this.emit(`\n${this.indent}def ${idMetodo.value}(${pyParams}):`);
    
    this.bloque(); 
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
          this.manejarID(); 
          break;
        case 'OPERADOR':
          if (t.value === '++' || t.value === '--') {
              this.incrementoPrefijo();
              break;
          }
        case 'RETURN': 
            this.returnStmt();
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

  returnStmt() {
    this.consume('RETURN');
    const expr = this.expresion();
    this.consume('SEMICOLON');
    this.emit(`return ${expr}`);
  }

  accesoMiembro() {
    let buf = this.consume('IDENTIFICADOR').value;

    while (this.check('DOT') || (this.check('PAR_IZQ') && !this.check('LLAVE_IZQ'))) {
        if (this.check('DOT')) {
            this.consume('DOT');
            const memberId = this.consume('IDENTIFICADOR').value;
            
            if (this.check('PAR_IZQ')) {
                if (memberId === 'toUpperCase') {
                    this.consume('PAR_IZQ');
                    this.consume('PAR_DER'); 
                    buf = `${buf}.upper()`;
                } else {
                    buf = this.llamadaMetodo(`${buf}.${memberId}`);
                }
            } else {
                buf += `.${memberId}`;
            }
        } else if (this.check('PAR_IZQ')) {
            buf = this.llamadaMetodo(buf);
        } else {
            break;
        }
    }
    return buf;
  }

  expresion(isArgument = false) {
    let buf = '';

    const stopTokens = ['PAR_DER', 'SEMICOLON', 'LLAVE_IZQ'];
    if (isArgument) stopTokens.push('COMMA'); 

    while (this.pos < this.tokens.length && !stopTokens.some(t => this.check(t))) {
      const t = this.tokens[this.pos];
      
      if (this.check('IDENTIFICADOR')) {
          const next = this.tokens[this.pos + 1]?.type;
          if (next === 'PAR_IZQ' || next === 'DOT') {
              buf += this.accesoMiembro();
              continue; 
          }
      }

      let val = t.value;
      switch (t.type) {
        case 'TRUE': val = 'True'; break;
        case 'FALSE': val = 'False'; break;
        case 'CADENA':
          val = `"${val}"`;
          break;
        case 'CARACTER':
          val = `"${val}"`;
          break;
        case 'OPERADOR_ARIT':
        case 'OPERADOR_REL':
        case 'EQUAL':
          val = ` ${t.value} `;
          break;
        case 'IDENTIFICADOR':
        case 'ENTERO':
        case 'DECIMAL':
        case 'PAR_IZQ':
        case 'PAR_DER':
          break; 
        default:
           this.errors.push(new Error('Sintáctico', t.value, `Token inesperado en expresión: ${t.type}`, t.line, t.column));
           this.pos++;
           continue;
      }
      
      buf += val;
      this.pos++;
    }
    
    return buf.trim();
  }

  llamadaMetodo(id) {
    this.consume('PAR_IZQ');
    
    let args = '';
    while (!this.check('PAR_DER') && this.pos < this.tokens.length) {
        if (args.length > 0) {
            this.consume('COMMA'); 
            args += ', ';
        }
        args += this.expresion(true); 
    }

    this.consume('PAR_DER');
    
    return `${id}(${args})`;
  }
  
  declaracion() {
    this.pos++;
    const id = this.consume('IDENTIFICADOR');
    
    if (this.check('EQUAL')) {
      this.consume('EQUAL'); 
      const pyVal = this.expresion();
      this.emit(`${id.value} = ${pyVal}`);
    } else {
      this.errors.push(new Error('Sintáctico', this.tokens[this.pos]?.value || 'EOF', `Se esperaba EQUAL para inicializar ${id.value}`, this.tokens[this.pos]?.line || id.line, this.tokens[this.pos]?.column || id.column));
    }
    
    this.consume('SEMICOLON'); 
  }

  manejarID() {
    const idToken = this.tokens[this.pos];
    const id = idToken.value;
    
    const nextToken = this.tokens[this.pos + 1];
    if (!nextToken) {
        this.errors.push(new Error('Sintáctico', 'EOF', `Se esperaba operador o llamada a método después de ${id}`, idToken.line, idToken.column));
        this.pos++;
        return;
    }
    
    const nextValue = nextToken.value;
    const nextType = nextToken.type;

    if (nextType === 'PAR_IZQ' || nextType === 'DOT') {
        const fullCall = this.accesoMiembro();
        this.consume('SEMICOLON');
        this.emit(fullCall);
        return;
    }

    this.consume('IDENTIFICADOR');
    
    if (nextValue === '++' || nextValue === '--') {
      this.consume('OPERADOR'); 
      this.consume('SEMICOLON'); 

      const pythonOp = nextValue === '++' ? '+' : '-';
      this.emit(`${id} = ${id} ${pythonOp} 1`);
      return;
    }

    if (nextType === 'EQUAL') {
      this.consume('EQUAL'); 
      
      const expr = this.expresion();
      this.consume('SEMICOLON');
      
      this.emit(`${id} = ${expr}`);
      return;
    }
    
    if (nextType === 'OPERADOR_ASIGNACION') {
      const op = nextToken.value;
      this.consume('OPERADOR_ASIGNACION');
      
      const expr = this.expresion();
      this.consume('SEMICOLON');
      
      this.emit(`${id} ${op} ${expr}`);
      return;
    }

    this.errors.push(new Error('Sintáctico', nextToken.value, `Se esperaba '=' o '++' o '--' o '(' después de ${id}`, nextToken.line, nextToken.column));
    this.pos++; 
  }

  incrementoPrefijo() {
    const opToken = this.tokens[this.pos];
    const op = opToken.value; 
    this.consume('OPERADOR'); 
    
    const id = this.consume('IDENTIFICADOR');
    this.consume('SEMICOLON');

    const pythonOp = op === '++' ? '+' : '-';
    this.emit(`${id.value} = ${id.value} ${pythonOp} 1`);
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
  
  comentarioLineaStmt() {
    const t = this.consume('COMENTARIO_LINEA');
    if (t.value) { 
      this.emit(`# ${t.value}`);
    }
  }

  comentarioBloqueStmt() {
    const t = this.consume('COMENTARIO_BLOQUE');
    const lineas = t.value.split('\n');
    if (lineas.length > 1) {
      this.emit(`'''`);
      lineas.forEach(l => this.emit(l.trim()));
      this.emit(`'''`);
    } else {
      this.emit(`'''${t.value}'''`);
    }
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
    const updateToken = this.consume('OPERADOR'); 
    const pyUpdate = updateToken.value === '++' ? `${idUpdate.value} += 1` : `${idUpdate.value} -= 1`;
    this.consume('PAR_DER');

    this.emit(`while ${cond}:`);
    
    const oldIndent = this.indent;
    this.indent += '    ';
    
    this.consume('LLAVE_IZQ');
    this.sentencias();
    this.emit(pyUpdate); 
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
