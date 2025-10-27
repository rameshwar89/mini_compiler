/**
 * Parser
 * Converts tokens into an Abstract Syntax Tree (AST)
 * Uses recursive descent parsing
 */

import { TokenType } from './lexer.js';

// AST Node Types
export class ASTNode {
  constructor(type) {
    this.type = type;
  }
}

export class ProgramNode extends ASTNode {
  constructor(statements) {
    super('Program');
    this.statements = statements;
  }
}

export class VariableDeclarationNode extends ASTNode {
  constructor(identifier, initializer) {
    super('VariableDeclaration');
    this.identifier = identifier;
    this.initializer = initializer;
  }
}

export class AssignmentNode extends ASTNode {
  constructor(identifier, value) {
    super('Assignment');
    this.identifier = identifier;
    this.value = value;
  }
}

export class BinaryOpNode extends ASTNode {
  constructor(operator, left, right) {
    super('BinaryOp');
    this.operator = operator;
    this.left = left;
    this.right = right;
  }
}

export class UnaryOpNode extends ASTNode {
  constructor(operator, operand) {
    super('UnaryOp');
    this.operator = operator;
    this.operand = operand;
  }
}

export class NumberNode extends ASTNode {
  constructor(value) {
    super('Number');
    this.value = value;
  }
}

export class StringNode extends ASTNode {
  constructor(value) {
    super('String');
    this.value = value;
  }
}

export class IdentifierNode extends ASTNode {
  constructor(name) {
    super('Identifier');
    this.name = name;
  }
}

export class IfNode extends ASTNode {
  constructor(condition, thenBranch, elseBranch = null) {
    super('If');
    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;
  }
}

export class WhileNode extends ASTNode {
  constructor(condition, body) {
    super('While');
    this.condition = condition;
    this.body = body;
  }
}

export class BlockNode extends ASTNode {
  constructor(statements) {
    super('Block');
    this.statements = statements;
  }
}

export class PrintNode extends ASTNode {
  constructor(expression) {
    super('Print');
    this.expression = expression;
  }
}

export class Parser {
  constructor(tokens) {
    this.tokens = tokens.filter(t => t.type !== TokenType.NEWLINE); // Filter out newlines
    this.position = 0;
  }

  currentToken() {
    return this.tokens[this.position];
  }

  peek(offset = 1) {
    const pos = this.position + offset;
    return pos < this.tokens.length ? this.tokens[pos] : this.tokens[this.tokens.length - 1];
  }

  advance() {
    if (this.position < this.tokens.length - 1) {
      this.position++;
    }
    return this.currentToken();
  }

  expect(type) {
    const token = this.currentToken();
    if (token.type !== type) {
      throw new Error(
        `Expected token type ${type} but got ${token.type} at ${token.line}:${token.column}`
      );
    }
    this.advance();
    return token;
  }

  parse() {
    const statements = [];
    
    while (this.currentToken().type !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }

    return new ProgramNode(statements);
  }

  parseStatement() {
    const token = this.currentToken();

    switch (token.type) {
      case TokenType.LET:
        return this.parseVariableDeclaration();
      case TokenType.IF:
        return this.parseIfStatement();
      case TokenType.WHILE:
        return this.parseWhileStatement();
      case TokenType.PRINT:
        return this.parsePrintStatement();
      case TokenType.LBRACE:
        return this.parseBlock();
      case TokenType.IDENTIFIER:
        return this.parseAssignmentOrExpression();
      default:
        throw new Error(`Unexpected token ${token.type} at ${token.line}:${token.column}`);
    }
  }

  parseVariableDeclaration() {
    this.expect(TokenType.LET);
    const identifier = this.expect(TokenType.IDENTIFIER).value;
    this.expect(TokenType.ASSIGN);
    const initializer = this.parseExpression();
    this.expect(TokenType.SEMICOLON);
    return new VariableDeclarationNode(identifier, initializer);
  }

  parseAssignmentOrExpression() {
    const identifier = this.currentToken().value;
    const token = this.currentToken();
    this.advance();

    if (this.currentToken().type === TokenType.ASSIGN) {
      this.advance();
      const value = this.parseExpression();
      this.expect(TokenType.SEMICOLON);
      return new AssignmentNode(identifier, value);
    } else {
      // Standalone identifier followed by semicolon is not a valid statement
      throw new Error(
        `Invalid statement: standalone identifier '${identifier}' at ${token.line}:${token.column}. ` +
        `Did you mean to assign a value or use it in an expression?`
      );
    }
  }

  parseIfStatement() {
    this.expect(TokenType.IF);
    this.expect(TokenType.LPAREN);
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN);
    const thenBranch = this.parseStatement();
    
    let elseBranch = null;
    if (this.currentToken().type === TokenType.ELSE) {
      this.advance();
      elseBranch = this.parseStatement();
    }

    return new IfNode(condition, thenBranch, elseBranch);
  }

  parseWhileStatement() {
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    const condition = this.parseExpression();
    this.expect(TokenType.RPAREN);
    const body = this.parseStatement();
    return new WhileNode(condition, body);
  }

  parsePrintStatement() {
    this.expect(TokenType.PRINT);
    this.expect(TokenType.LPAREN);
    const expression = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.expect(TokenType.SEMICOLON);
    return new PrintNode(expression);
  }

  parseBlock() {
    this.expect(TokenType.LBRACE);
    const statements = [];

    while (this.currentToken().type !== TokenType.RBRACE && 
           this.currentToken().type !== TokenType.EOF) {
      statements.push(this.parseStatement());
    }

    this.expect(TokenType.RBRACE);
    return new BlockNode(statements);
  }

  parseExpression() {
    return this.parseComparison();
  }

  parseComparison() {
    let left = this.parseTerm();

    while ([TokenType.EQUAL, TokenType.NOT_EQUAL, TokenType.LESS_THAN, 
            TokenType.GREATER_THAN, TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL]
           .includes(this.currentToken().type)) {
      const operator = this.currentToken().value;
      this.advance();
      const right = this.parseTerm();
      left = new BinaryOpNode(operator, left, right);
    }

    return left;
  }

  parseTerm() {
    let left = this.parseFactor();

    while ([TokenType.PLUS, TokenType.MINUS].includes(this.currentToken().type)) {
      const operator = this.currentToken().value;
      this.advance();
      const right = this.parseFactor();
      left = new BinaryOpNode(operator, left, right);
    }

    return left;
  }

  parseFactor() {
    let left = this.parseUnary();

    while ([TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO]
           .includes(this.currentToken().type)) {
      const operator = this.currentToken().value;
      this.advance();
      const right = this.parseUnary();
      left = new BinaryOpNode(operator, left, right);
    }

    return left;
  }

  parseUnary() {
    if ([TokenType.PLUS, TokenType.MINUS].includes(this.currentToken().type)) {
      const operator = this.currentToken().value;
      this.advance();
      const operand = this.parseUnary();
      return new UnaryOpNode(operator, operand);
    }

    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.currentToken();

    if (token.type === TokenType.NUMBER) {
      this.advance();
      return new NumberNode(token.value);
    }

    if (token.type === TokenType.STRING) {
      this.advance();
      return new StringNode(token.value);
    }

    if (token.type === TokenType.IDENTIFIER) {
      this.advance();
      return new IdentifierNode(token.value);
    }

    if (token.type === TokenType.LPAREN) {
      this.advance();
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN);
      return expr;
    }

    throw new Error(`Unexpected token ${token.type} at ${token.line}:${token.column}`);
  }
}
