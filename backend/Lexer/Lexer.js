import { Token, ReservedWords } from '../Token/token.js';
import { Error } from '../Error/Error.js';

export class Lexer {
  constructor(texto) {
    this.texto = texto;
    this.pos = 0;
    this.linea = 1;
    this.columna = 1;
    this.tokens = [];
    this.errors = [];
  }

  avanzar() {
    this.pos++;
    this.columna++;
  }

  analizar() {
    while (this.pos < this.texto.length) {
      let char = this.texto[this.pos];

      if (char === ' ' || char === '\t' || char === '\r') {
        this.avanzar();
        continue;
      }
      if (char === '\n') {
        this.linea++;
        this.columna = 1;
        this.avanzar();
        continue;
      }

      // --- MANEJO DE COMENTARIOS (MODIFICADO) ---
      if (char === '/') {
        const next = this.texto[this.pos + 1] || '';
        if (next === '/') {
          this.comentarioLinea(); // Ahora genera un token
          continue;
        } else if (next === '*') {
          this.comentarioBloque(); // Ahora genera un token
          continue;
        }
      }
      // --- FIN MANEJO DE COMENTARIOS ---

      if (this.esLetra(char)) { this.identificador(); continue; }
      if (this.esDigito(char)) { this.numero(); continue; }
      if (char === '"') { this.cadena(); continue; }
      if (char === "'") { this.caracter(); continue; }
      if (this.esPunto(char)) { this.recorrerPunto(); continue; }

      if (this.esSimboloOperador(char)) {
        this.recorrerSimbolo();
        continue;
      }

      this.errors.push(new Error('Léxico', char, 'Carácter no reconocido', this.linea, this.columna));
      this.avanzar();
    }
    return this.tokens;
  }

  comentarioLinea() {
    const iniCol = this.columna;
    this.avanzar(); // Salta /
    this.avanzar(); // Salta /
    let buf = '';
    while (this.pos < this.texto.length && this.texto[this.pos] !== '\n') {
      buf += this.texto[this.pos];
      this.avanzar();
    }
    this.tokens.push(new Token('COMENTARIO_LINEA', buf.trim(), this.linea, iniCol));
  }

  comentarioBloque() {
    const iniLinea = this.linea;
    const iniCol = this.columna;
    this.avanzar(); // Salta /
    this.avanzar(); // Salta *
    let buf = '';

    while (this.pos < this.texto.length) {
      const char = this.texto[this.pos];
      if (char === '*' && this.texto[this.pos + 1] === '/') {
        this.avanzar(); // Salta *
        this.avanzar(); // Salta /
        this.tokens.push(new Token('COMENTARIO_BLOQUE', buf, iniLinea, iniCol));
        return;
      } else if (char === '\n') {
        buf += '\n'; // Preservar saltos de línea internos
        this.linea++;
        this.columna = 1;
        this.avanzar();
      } else {
        buf += char;
        this.avanzar();
      }
    }
    this.errors.push(new Error('Léxico', '/*', 'Comentario de bloque sin cerrar', iniLinea, iniCol));
  }

  recorrerSimbolo() {
    const inicioCol = this.columna;
    const char = this.texto[this.pos];
    const next = this.texto[this.pos + 1] || '';

    const dos = ['==', '!=', '>=', '<=', '++', '--'];
    if (dos.includes(char + next)) {
      const type = (char + next === '++' || char + next === '--') ? 'INCREMENTO' : 'OPERADOR_REL';
      this.tokens.push(new Token(type, char + next, this.linea, inicioCol));
      this.avanzar(); this.avanzar();
      return;
    }
    const ops = ['=', '+', '-', '*', '/', '>', '<'];
    if (ops.includes(char)) {
      const type = char === '=' ? 'EQUAL' : 'OPERADOR_ARIT';
      this.tokens.push(new Token(type, char, this.linea, inicioCol));
      this.avanzar();
      return;
    }
    const delims = {
      '{': 'LLAVE_IZQ', '}': 'LLAVE_DER',
      '(': 'PAR_IZQ', ')': 'PAR_DER',
      '[': 'COR_IZQ', ']': 'COR_DER',
      ';': 'SEMICOLON', ',': 'COMMA'
    };
    if (delims[char]) {
      this.tokens.push(new Token(delims[char], char, this.linea, inicioCol));
      this.avanzar();
      return;
    }
    
    this.errors.push(new Error('Léxico', char, 'Símbolo no reconocido', this.linea, inicioCol));
    this.avanzar();
  }

  recorrerPunto() {
    const ini = this.columna;
    this.tokens.push(new Token('DOT', '.', this.linea, ini));
    this.avanzar();
  }

  identificador() {
    const ini = this.columna;
    let buf = '';
    while (this.pos < this.texto.length && (this.esLetra(this.texto[this.pos]) || this.esDigito(this.texto[this.pos]))) {
      buf += this.texto[this.pos];
      this.avanzar();
    }
    const tipo = ReservedWords[buf] ? ReservedWords[buf] : 'IDENTIFICADOR';
    this.tokens.push(new Token(tipo, buf, this.linea, ini));
  }

  numero() {
    const ini = this.columna;
    let buf = '';
    let dec = false;
    while (this.pos < this.texto.length && (this.esDigito(this.texto[this.pos]) || this.texto[this.pos] === '.')) {
      if (this.texto[this.pos] === '.') {
        if (dec) {
           this.errors.push(new Error('Léxico', buf + '.', 'Número decimal inválido', this.linea, ini));
           this.avanzar();
           break;
        }
        dec = true;
      }
      buf += this.texto[this.pos];
      this.avanzar();
    }
    this.tokens.push(new Token(dec ? 'DECIMAL' : 'ENTERO', buf, this.linea, ini));
  }

  cadena() {
    const ini = this.columna;
    const iniLinea = this.linea;
    let buf = '';
    this.avanzar();
    while (this.pos < this.texto.length && this.texto[this.pos] !== '"') {
      if (this.texto[this.pos] === '\n') {
         this.errors.push(new Error('Léxico', `"${buf}`, 'Cadena sin cerrar', iniLinea, ini));
         this.linea++;
         this.columna = 1;
         this.avanzar();
         return;
      }
      buf += this.texto[this.pos];
      this.avanzar();
    }
    if (this.pos >= this.texto.length) {
      this.errors.push(new Error('Léxico', `"${buf}`, 'Cadena sin cerrar', iniLinea, ini));
      return;
    }
    this.avanzar();
    this.tokens.push(new Token('CADENA', buf, this.linea, ini));
  }

  caracter() {
    const ini = this.columna;
    let buf = '';
    this.avanzar();
    if (this.pos < this.texto.length) {
      buf = this.texto[this.pos];
      this.avanzar();
    }
    if (this.pos >= this.texto.length || this.texto[this.pos] !== "'") {
      this.errors.push(new Error('Léxico', `'${buf}`, 'Carácter mal formado', this.linea, ini));
      return;
    }
    this.avanzar();
    this.tokens.push(new Token('CARACTER', buf, this.linea, ini));
  }

  esPunto(c) { return c === '.'; }
  esLetra(c) { return /[A-Za-z_]/.test(c); }
  esDigito(c) { return /[0-9]/.test(c); }
  esSimboloOperador(c) { return '{}()[].,;=+-*/><!'.includes(c); }
}
