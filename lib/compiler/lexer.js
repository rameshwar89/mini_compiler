/**
 * Lexer (Tokenizer)
 * Converts source code into a stream of tokens
 */

export const TokenType = {
  // Keywords
  LET: 'LET',
  IF: 'IF',
  ELSE: 'ELSE',
  WHILE: 'WHILE',
  PRINT: 'PRINT',

  // Identifiers and literals
  IDENTIFIER: 'IDENTIFIER',
  NUMBER: 'NUMBER',
  STRING: 'STRING',

  // Operators
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  MULTIPLY: 'MULTIPLY',
  DIVIDE: 'DIVIDE',
  MODULO: 'MODULO',
  ASSIGN: 'ASSIGN',

  // Comparison operators
  EQUAL: 'EQUAL',
  NOT_EQUAL: 'NOT_EQUAL',
  LESS_THAN: 'LESS_THAN',
  GREATER_THAN: 'GREATER_THAN',
  LESS_EQUAL: 'LESS_EQUAL',
  GREATER_EQUAL: 'GREATER_EQUAL',

  // Delimiters
  SEMICOLON: 'SEMICOLON',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  LBRACE: 'LBRACE',
  RBRACE: 'RBRACE',

  // Special
  EOF: 'EOF',
  NEWLINE: 'NEWLINE',
};

const KEYWORDS = {
  'let': TokenType.LET,
  'if': TokenType.IF,
  'else': TokenType.ELSE,
  'while': TokenType.WHILE,
  'print': TokenType.PRINT,
};

export class Token {
  constructor(type, value, line, column) {
    this.type = type;
    this.value = value;
    this.line = line;
    this.column = column;
  }

  toString() {
    return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.column})`;
  }
}

export class Lexer {
  constructor(source) {
    this.source = source;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  currentChar() {
    return this.position < this.source.length ? this.source[this.position] : null;
  }

  peek(offset = 1) {
    const pos = this.position + offset;
    return pos < this.source.length ? this.source[pos] : null;
  }

  advance() {
    if (this.currentChar() === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    this.position++;
  }

  skipWhitespace() {
    while (this.currentChar() && /\s/.test(this.currentChar()) && this.currentChar() !== '\n') {
      this.advance();
    }
  }

  skipComment() {
    if (this.currentChar() === '/' && this.peek() === '/') {
      while (this.currentChar() && this.currentChar() !== '\n') {
        this.advance();
      }
    }
  }

  readNumber() {
    const startLine = this.line;
    const startColumn = this.column;
    let numStr = '';
    let hasDecimal = false;

    while (this.currentChar() && (/\d/.test(this.currentChar()) || this.currentChar() === '.')) {
      if (this.currentChar() === '.') {
        if (hasDecimal) break;
        hasDecimal = true;
      }
      numStr += this.currentChar();
      this.advance();
    }

    return new Token(TokenType.NUMBER, parseFloat(numStr), startLine, startColumn);
  }

  readString() {
    const startLine = this.line;
    const startColumn = this.column;
    const quote = this.currentChar();
    this.advance(); // skip opening quote

    let str = '';
    while (this.currentChar() && this.currentChar() !== quote) {
      if (this.currentChar() === '\\') {
        this.advance();
        const escapeChar = this.currentChar();
        switch (escapeChar) {
          case 'n': str += '\n'; break;
          case 't': str += '\t'; break;
          case '\\': str += '\\'; break;
          case quote: str += quote; break;
          default: str += escapeChar;
        }
        this.advance();
      } else {
        str += this.currentChar();
        this.advance();
      }
    }

    if (this.currentChar() === quote) {
      this.advance(); // skip closing quote
    } else {
      throw new Error(`Unterminated string at ${startLine}:${startColumn}`);
    }

    return new Token(TokenType.STRING, str, startLine, startColumn);
  }

  readIdentifier() {
    const startLine = this.line;
    const startColumn = this.column;
    let identifier = '';

    while (this.currentChar() && /[a-zA-Z0-9_]/.test(this.currentChar())) {
      identifier += this.currentChar();
      this.advance();
    }

    const type = KEYWORDS[identifier] || TokenType.IDENTIFIER;
    return new Token(type, identifier, startLine, startColumn);
  }

  tokenize() {
    this.tokens = [];

    while (this.currentChar()) {
      const startLine = this.line;
      const startColumn = this.column;

      // Skip whitespace
      if (/\s/.test(this.currentChar()) && this.currentChar() !== '\n') {
        this.skipWhitespace();
        continue;
      }

      // Skip comments
      if (this.currentChar() === '/' && this.peek() === '/') {
        this.skipComment();
        continue;
      }

      // Newline
      if (this.currentChar() === '\n') {
        this.tokens.push(new Token(TokenType.NEWLINE, '\n', startLine, startColumn));
        this.advance();
        continue;
      }

      // Numbers
      if (/\d/.test(this.currentChar())) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // Strings
      if (this.currentChar() === '"' || this.currentChar() === "'") {
        this.tokens.push(this.readString());
        continue;
      }

      // Identifiers and keywords
      if (/[a-zA-Z_]/.test(this.currentChar())) {
        this.tokens.push(this.readIdentifier());
        continue;
      }

      // Two-character operators
      if (this.currentChar() === '=' && this.peek() === '=') {
        this.tokens.push(new Token(TokenType.EQUAL, '==', startLine, startColumn));
        this.advance();
        this.advance();
        continue;
      }

      if (this.currentChar() === '!' && this.peek() === '=') {
        this.tokens.push(new Token(TokenType.NOT_EQUAL, '!=', startLine, startColumn));
        this.advance();
        this.advance();
        continue;
      }

      if (this.currentChar() === '<' && this.peek() === '=') {
        this.tokens.push(new Token(TokenType.LESS_EQUAL, '<=', startLine, startColumn));
        this.advance();
        this.advance();
        continue;
      }

      if (this.currentChar() === '>' && this.peek() === '=') {
        this.tokens.push(new Token(TokenType.GREATER_EQUAL, '>=', startLine, startColumn));
        this.advance();
        this.advance();
        continue;
      }

      // Single-character tokens
      const char = this.currentChar();
      let token = null;

      switch (char) {
        case '+': token = new Token(TokenType.PLUS, '+', startLine, startColumn); break;
        case '-': token = new Token(TokenType.MINUS, '-', startLine, startColumn); break;
        case '*': token = new Token(TokenType.MULTIPLY, '*', startLine, startColumn); break;
        case '/': token = new Token(TokenType.DIVIDE, '/', startLine, startColumn); break;
        case '%': token = new Token(TokenType.MODULO, '%', startLine, startColumn); break;
        case '=': token = new Token(TokenType.ASSIGN, '=', startLine, startColumn); break;
        case '<': token = new Token(TokenType.LESS_THAN, '<', startLine, startColumn); break;
        case '>': token = new Token(TokenType.GREATER_THAN, '>', startLine, startColumn); break;
        case ';': token = new Token(TokenType.SEMICOLON, ';', startLine, startColumn); break;
        case '(': token = new Token(TokenType.LPAREN, '(', startLine, startColumn); break;
        case ')': token = new Token(TokenType.RPAREN, ')', startLine, startColumn); break;
        case '{': token = new Token(TokenType.LBRACE, '{', startLine, startColumn); break;
        case '}': token = new Token(TokenType.RBRACE, '}', startLine, startColumn); break;
        default:
          throw new Error(`Unexpected character '${char}' at ${startLine}:${startColumn}`);
      }

      if (token) {
        this.tokens.push(token);
        this.advance();
      }
    }

    this.tokens.push(new Token(TokenType.EOF, null, this.line, this.column));
    return this.tokens;
  }
}
