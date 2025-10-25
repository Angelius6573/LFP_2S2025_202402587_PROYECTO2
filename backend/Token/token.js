export class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }
}
export const ReservedWords = {
  public: 'PUBLIC',
  class: 'CLASS',
  static: 'STATIC',
  void: 'VOID',
  main: 'MAIN',
  String: 'STRING_TYPE',
  args: 'ARGS',
  int: 'INT_TYPE',
  double: 'DOUBLE_TYPE',
  char: 'CHAR_TYPE',
  boolean: 'BOOLEAN_TYPE',
  true: 'TRUE',
  false: 'FALSE',
  if: 'IF',
  else: 'ELSE',
  for: 'FOR',
  while: 'WHILE',
  System: 'SYSTEM',
  out: 'OUT',
  println: 'PRINTLN',
  '\n': 'NEWLINE',
  private: 'PRIVATE',
  final: 'FINAL',
  return: 'RETURN',
  protected: 'PROTECTED',
};

export const Delimiters = {
  '{': 'LLAVE_IZQ', 
  '}': 'LLAVE_DER', 
  '(': 'PAR_IZQ', 
  ')': 'PAR_DER', 
  '[': 'COR_IZQ', 
  ']': 'COR_DER', 
  ';': 'SEMICOLON', 
  ',': 'COMMA'
};

export const Operators = {
  '=': 'EQUAL',
  '+=': 'OPERADOR_ASIGNACION', 
  '-=': 'OPERADOR_ASIGNACION',
  '*=': 'OPERADOR_ASIGNACION',
  '/=': 'OPERADOR_ASIGNACION',
  '%=': 'OPERADOR_ASIGNACION',
  '+': 'OPERADOR_ARIT', 
  '-': 'OPERADOR_ARIT', 
  '*': 'OPERADOR_ARIT', 
  '/': 'OPERADOR_ARIT', 
  '%': 'OPERADOR_ARIT',
  '==': 'OPERADOR_REL', 
  '!=': 'OPERADOR_REL', 
  '>=': 'OPERADOR_REL', 
  '<=': 'OPERADOR_REL', 
  '>': 'OPERADOR_REL', 
  '<': 'OPERADOR_REL',
  '++': 'OPERADOR', 
  '--': 'OPERADOR',
  '&&': 'OPERADOR_LOGICO', 
  '||': 'OPERADOR_LOGICO', 
  '!': 'OPERADOR_LOGICO',
};
