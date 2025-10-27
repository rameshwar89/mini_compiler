/**
 * Code Generator and Interpreter
 * Executes IR code or generates target code
 */

export class CodeGenerator {
  constructor(irInstructions) {
    this.instructions = irInstructions;
    this.output = [];
  }

  // Generate assembly-like code
  generateAssembly() {
    const assembly = [];
    assembly.push('; Generated Assembly Code');
    assembly.push('.data');
    assembly.push('.code');
    assembly.push('START:');

    for (const instr of this.instructions) {
      assembly.push(this.irToAssembly(instr));
    }

    assembly.push('  HALT');
    return assembly.join('\n');
  }

  irToAssembly(instr) {
    const { op, arg1, arg2, result } = instr;

    if (op === 'LABEL') {
      return `${result}:`;
    }
    if (op === 'GOTO') {
      return `  JMP ${result}`;
    }
    if (op === 'IF_FALSE') {
      return `  CMP ${arg1}, 0\n  JZ ${result}`;
    }
    if (op === 'PRINT') {
      return `  PRINT ${arg1}`;
    }
    if (op === 'ASSIGN') {
      return `  MOV ${result}, ${arg1}`;
    }

    const opMap = {
      'ADD': 'ADD',
      'SUB': 'SUB',
      'MUL': 'MUL',
      'DIV': 'DIV',
      'MOD': 'MOD',
      'NEG': 'NEG',
      'EQ': 'EQ',
      'NE': 'NE',
      'LT': 'LT',
      'GT': 'GT',
      'LE': 'LE',
      'GE': 'GE',
    };

    const asmOp = opMap[op] || op;
    if (arg2 !== null) {
      return `  ${asmOp} ${result}, ${arg1}, ${arg2}`;
    } else {
      return `  ${asmOp} ${result}, ${arg1}`;
    }
  }

  // Generate JavaScript code
  generateJavaScript() {
    const js = [];
    js.push('// Generated JavaScript Code');
    js.push('(function() {');
    js.push('  const output = [];');
    js.push('  let variables = {};');
    js.push('');

    const labelMap = new Map();
    this.instructions.forEach((instr, idx) => {
      if (instr.op === 'LABEL') {
        labelMap.set(instr.result, idx);
      }
    });

    for (let i = 0; i < this.instructions.length; i++) {
      const instr = this.instructions[i];
      const jsCode = this.irToJavaScript(instr, labelMap);
      if (jsCode) {
        js.push(`  ${jsCode}`);
      }
    }

    js.push('  return output.join("\\n");');
    js.push('})();');

    return js.join('\n');
  }

  irToJavaScript(instr, labelMap) {
    const { op, arg1, arg2, result } = instr;

    const getValue = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        if (val.startsWith('"') || val.startsWith("'")) return val;
        if (val.startsWith('t')) return val;
        return `variables.${val}`;
      }
      return val;
    };

    if (op === 'LABEL') {
      return `// ${result}:`;
    }
    if (op === 'ASSIGN') {
      if (result.startsWith('t')) {
        return `let ${result} = ${getValue(arg1)};`;
      }
      return `variables.${result} = ${getValue(arg1)};`;
    }
    if (op === 'PRINT') {
      return `output.push(String(${getValue(arg1)}));`;
    }

    const opMap = {
      'ADD': '+',
      'SUB': '-',
      'MUL': '*',
      'DIV': '/',
      'MOD': '%',
      'EQ': '===',
      'NE': '!==',
      'LT': '<',
      'GT': '>',
      'LE': '<=',
      'GE': '>=',
    };

    if (opMap[op]) {
      if (arg2 !== null) {
        return `let ${result} = ${getValue(arg1)} ${opMap[op]} ${getValue(arg2)};`;
      } else if (op === 'NEG') {
        return `let ${result} = -${getValue(arg1)};`;
      }
    }

    return null;
  }
}

// Interpreter to execute IR directly
export class Interpreter {
  constructor(irInstructions) {
    this.instructions = irInstructions;
    this.variables = new Map();
    this.output = [];
  }

  execute() {
    this.variables.clear();
    this.output = [];
    let pc = 0; // Program counter

    const labelMap = new Map();
    this.instructions.forEach((instr, idx) => {
      if (instr.op === 'LABEL') {
        labelMap.set(instr.result, idx);
      }
    });

    while (pc < this.instructions.length) {
      const instr = this.instructions[pc];
      pc = this.executeInstruction(instr, pc, labelMap);
    }

    return this.output.join('\n');
  }

  executeInstruction(instr, pc, labelMap) {
    const { op, arg1, arg2, result } = instr;

    const getValue = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        if (val.startsWith('"') && val.endsWith('"')) {
          return val.slice(1, -1);
        }
        return this.variables.get(val) ?? 0;
      }
      return val;
    };

    const setValue = (name, value) => {
      this.variables.set(name, value);
    };

    switch (op) {
      case 'LABEL':
        return pc + 1;

      case 'GOTO':
        return labelMap.get(result);

      case 'IF_FALSE':
        if (!getValue(arg1)) {
          return labelMap.get(result);
        }
        return pc + 1;

      case 'ASSIGN':
        setValue(result, getValue(arg1));
        return pc + 1;

      case 'PRINT':
        this.output.push(String(getValue(arg1)));
        return pc + 1;

      case 'ADD':
        setValue(result, getValue(arg1) + getValue(arg2));
        return pc + 1;

      case 'SUB':
        setValue(result, getValue(arg1) - getValue(arg2));
        return pc + 1;

      case 'MUL':
        setValue(result, getValue(arg1) * getValue(arg2));
        return pc + 1;

      case 'DIV':
        setValue(result, getValue(arg1) / getValue(arg2));
        return pc + 1;

      case 'MOD':
        setValue(result, getValue(arg1) % getValue(arg2));
        return pc + 1;

      case 'NEG':
        setValue(result, -getValue(arg1));
        return pc + 1;

      case 'EQ':
        setValue(result, getValue(arg1) === getValue(arg2) ? 1 : 0);
        return pc + 1;

      case 'NE':
        setValue(result, getValue(arg1) !== getValue(arg2) ? 1 : 0);
        return pc + 1;

      case 'LT':
        setValue(result, getValue(arg1) < getValue(arg2) ? 1 : 0);
        return pc + 1;

      case 'GT':
        setValue(result, getValue(arg1) > getValue(arg2) ? 1 : 0);
        return pc + 1;

      case 'LE':
        setValue(result, getValue(arg1) <= getValue(arg2) ? 1 : 0);
        return pc + 1;

      case 'GE':
        setValue(result, getValue(arg1) >= getValue(arg2) ? 1 : 0);
        return pc + 1;

      default:
        throw new Error(`Unknown operation: ${op}`);
    }
  }
}
