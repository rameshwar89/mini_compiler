/**
 * Intermediate Representation (IR) Generator
 * Generates three-address code from AST
 */

export class IRInstruction {
  constructor(op, arg1 = null, arg2 = null, result = null) {
    this.op = op;        // Operation: ADD, SUB, MUL, DIV, ASSIGN, etc.
    this.arg1 = arg1;    // First argument
    this.arg2 = arg2;    // Second argument
    this.result = result; // Result destination
  }

  toString() {
    if (this.op === 'LABEL') {
      return `${this.result}:`;
    }
    if (this.op === 'GOTO') {
      return `  GOTO ${this.result}`;
    }
    if (this.op === 'IF_FALSE') {
      return `  IF_FALSE ${this.arg1} GOTO ${this.result}`;
    }
    if (this.op === 'PRINT') {
      return `  PRINT ${this.arg1}`;
    }
    if (this.op === 'ASSIGN') {
      return `  ${this.result} = ${this.arg1}`;
    }
    if (this.arg2 === null) {
      return `  ${this.result} = ${this.op} ${this.arg1}`;
    }
    return `  ${this.result} = ${this.arg1} ${this.op} ${this.arg2}`;
  }
}

export class IRGenerator {
  constructor(ast) {
    this.ast = ast;
    this.instructions = [];
    this.tempCounter = 0;
    this.labelCounter = 0;
  }

  newTemp() {
    return `t${this.tempCounter++}`;
  }

  newLabel() {
    return `L${this.labelCounter++}`;
  }

  emit(op, arg1 = null, arg2 = null, result = null) {
    const instruction = new IRInstruction(op, arg1, arg2, result);
    this.instructions.push(instruction);
    return instruction;
  }

  generate() {
    this.instructions = [];
    this.tempCounter = 0;
    this.labelCounter = 0;

    this.visitProgram(this.ast);
    return this.instructions;
  }

  visitProgram(node) {
    for (const statement of node.statements) {
      this.visitStatement(statement);
    }
  }

  visitStatement(node) {
    switch (node.type) {
      case 'VariableDeclaration':
        return this.visitVariableDeclaration(node);
      case 'Assignment':
        return this.visitAssignment(node);
      case 'If':
        return this.visitIf(node);
      case 'While':
        return this.visitWhile(node);
      case 'Block':
        return this.visitBlock(node);
      case 'Print':
        return this.visitPrint(node);
      default:
        return this.visitExpression(node);
    }
  }

  visitVariableDeclaration(node) {
    const value = this.visitExpression(node.initializer);
    this.emit('ASSIGN', value, null, node.identifier);
  }

  visitAssignment(node) {
    const value = this.visitExpression(node.value);
    this.emit('ASSIGN', value, null, node.identifier);
  }

  visitBlock(node) {
    for (const statement of node.statements) {
      this.visitStatement(statement);
    }
  }

  visitPrint(node) {
    const value = this.visitExpression(node.expression);
    this.emit('PRINT', value);
  }

  visitIf(node) {
    const condition = this.visitExpression(node.condition);
    const elseLabel = this.newLabel();
    const endLabel = this.newLabel();

    // If condition is false, jump to else/end
    this.emit('IF_FALSE', condition, null, node.elseBranch ? elseLabel : endLabel);

    // Then branch
    this.visitStatement(node.thenBranch);

    if (node.elseBranch) {
      this.emit('GOTO', null, null, endLabel);
      this.emit('LABEL', null, null, elseLabel);
      this.visitStatement(node.elseBranch);
    }

    this.emit('LABEL', null, null, endLabel);
  }

  visitWhile(node) {
    const startLabel = this.newLabel();
    const endLabel = this.newLabel();

    this.emit('LABEL', null, null, startLabel);

    const condition = this.visitExpression(node.condition);
    this.emit('IF_FALSE', condition, null, endLabel);

    this.visitStatement(node.body);
    this.emit('GOTO', null, null, startLabel);

    this.emit('LABEL', null, null, endLabel);
  }

  visitExpression(node) {
    switch (node.type) {
      case 'Number':
        return node.value;
      case 'String':
        return `"${node.value}"`;
      case 'Identifier':
        return node.name;
      case 'BinaryOp':
        return this.visitBinaryOp(node);
      case 'UnaryOp':
        return this.visitUnaryOp(node);
      default:
        throw new Error(`Unknown expression type: ${node.type}`);
    }
  }

  visitBinaryOp(node) {
    const left = this.visitExpression(node.left);
    const right = this.visitExpression(node.right);
    const temp = this.newTemp();

    const opMap = {
      '+': 'ADD',
      '-': 'SUB',
      '*': 'MUL',
      '/': 'DIV',
      '%': 'MOD',
      '==': 'EQ',
      '!=': 'NE',
      '<': 'LT',
      '>': 'GT',
      '<=': 'LE',
      '>=': 'GE',
    };

    this.emit(opMap[node.operator] || node.operator, left, right, temp);
    return temp;
  }

  visitUnaryOp(node) {
    const operand = this.visitExpression(node.operand);
    const temp = this.newTemp();

    if (node.operator === '-') {
      this.emit('NEG', operand, null, temp);
    } else if (node.operator === '+') {
      return operand; // Unary plus does nothing
    }

    return temp;
  }

  toString() {
    return this.instructions.map(instr => instr.toString()).join('\n');
  }
}
