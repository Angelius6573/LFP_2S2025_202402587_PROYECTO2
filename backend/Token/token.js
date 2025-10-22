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
};
