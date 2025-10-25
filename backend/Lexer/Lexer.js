import { Token, ReservedWords, Delimiters, Operators } from '../Token/token.js';
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
 
  recorrerSimbolo() {
    const inicioCol = this.columna;
    const char = this.texto[this.pos];
    const next = this.texto[this.pos + 1] || '';
    
    const dos = char + next;
    
    // 1. Comentarios de Bloque
    if (dos === '/*') { this.comentarioBloque(); return; }
    
    // 2. Comentarios de Línea
    if (dos === '//') { this.comentarioLinea(); return; }
    
    // 3. Operadores de dos caracteres (Incluye asignación compuesta: +=, -=, etc.)
    if (Operators[dos]) {
      this.tokens.push(new Token(Operators[dos], dos, this.linea, inicioCol));
      this.avanzar(); this.avanzar();
      return;
    }
    
    // 4. Delimitadores
    if (Delimiters[char]) {
      this.tokens.push(new Token(Delimiters[char], char, this.linea, inicioCol));
      this.avanzar();
      return;
    }

    // 5. Operadores de un carácter (Incluye asignación simple: =)
    if (Operators[char]) {
      this.tokens.push(new Token(Operators[char], char, this.linea, inicioCol));
      this.avanzar();
      return;
    }

    // Error: Símbolo no reconocido
    this.errors.push(new Error('Léxico', char, 'Símbolo, operador o delimitador no reconocido', this.linea, inicioCol));
    this.avanzar();
  }

  comentarioLinea() {
    const inicioCol = this.columna;
    this.avanzar(); this.avanzar(); // Saltar //
    let buf = '';
    while (this.pos < this.texto.length && this.texto[this.pos] !== '\n') {
      buf += this.texto[this.pos];
      this.avanzar();
    }
    this.tokens.push(new Token('COMENTARIO_LINEA', buf.trim(), this.linea, inicioCol));
  }

  comentarioBloque() {
    const inicioCol = this.columna;
    this.avanzar(); this.avanzar(); // Saltar /*
    let buf = '';
    while (this.pos < this.texto.length) {
      if (this.texto[this.pos] === '*' && this.texto[this.pos + 1] === '/') {
        this.avanzar(); this.avanzar(); // Saltar */
        this.tokens.push(new Token('COMENTARIO_BLOQUE', buf.trim(), this.linea, inicioCol));
        return;
      }
      if (this.texto[this.pos] === '\n') {
        this.linea++;
        this.columna = 1;
        this.avanzar();
        continue;
      }
      buf += this.texto[this.pos];
      this.avanzar();
    }
    // Error: Bloque sin cerrar
    this.errors.push(new Error('Léxico', buf, 'Comentario de bloque sin cerrar', this.linea, inicioCol));
  }
 
  recorrerPunto() {
    const ini = this.columna;
    this.tokens.push(new Token('DOT', '.', this.linea, ini));
    this.avanzar();
  }

  analizar() {
    while (this.pos < this.texto.length) {
      let char = this.texto[this.pos]; 

      if (char === ' ' || char === '\t' || char === '\r') { this.avanzar(); continue; }

      if (char === '\n') {
        this.tokens.push(new Token('NEWLINE', '\n', this.linea, this.columna));
        this.linea++;
        this.columna = 1;
        this.avanzar();
        continue;
      }

      if (this.esLetra(char)) { this.identificador(); continue; }
      if (this.esDigito(char)) { this.numero(); continue; }
      if (char === '"') { this.cadena(); continue; }
      if (char === "'") { this.caracter(); continue; }
      if (this.esPunto(char)) { this.recorrerPunto(); continue; }

      if (this.esSimbolo(char)) { this.recorrerSimbolo(); continue; }

      // error léxico
      this.errors.push(new Error('Léxico', char, 'Carácter no reconocido', this.linea, this.columna));
      this.avanzar();
    }
    return this.tokens;
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
        if (dec) break;
        dec = true;
      }
      buf += this.texto[this.pos];
      this.avanzar();
    }
    this.tokens.push(new Token(dec ? 'DECIMAL' : 'ENTERO', buf, this.linea, ini)); 
  }
  cadena() {
    const ini = this.columna;
    let buf = '';
    this.avanzar();
    while (this.pos < this.texto.length && this.texto[this.pos] !== '"') {
      buf += this.texto[this.pos];
      this.avanzar();
    }
    if (this.pos >= this.texto.length) {
      this.errors.push(new Error('Léxico', buf, 'Cadena sin cerrar', this.linea, ini));
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
    if (this.texto[this.pos] !== "'") {
      this.errors.push(new Error('Léxico', buf, 'Carácter mal formado', this.linea, ini));
      return;
    }
    this.avanzar();
    this.tokens.push(new Token('CARACTER', buf, this.linea, ini)); 
  }
  esPunto(c) { return c === '.';}
  esLetra(c) { return /[A-Za-z_]/.test(c); }
  esDigito(c) { return /[0-9]/.test(c); }
  esSimbolo(c) { 
    return '{}[]();,.,+-*/%^&|!<>='.includes(c); 
  }
}
