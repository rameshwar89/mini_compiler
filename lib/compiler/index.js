/**
 * Main Compiler
 * Orchestrates all compilation stages
 */

import { Lexer } from './lexer.js';
import { Parser } from './parser.js';
import { IRGenerator } from './ir-generator.js';
import { CodeGenerator, Interpreter } from './code-generator.js';

export class Compiler {
  constructor() {
    this.sourceCode = '';
    this.tokens = [];
    this.ast = null;
    this.ir = [];
    this.output = '';
    this.errors = [];
  }

  compile(sourceCode, options = {}) {
    this.sourceCode = sourceCode;
    this.tokens = [];
    this.ast = null;
    this.ir = [];
    this.output = '';
    this.errors = [];

    const stages = {
      tokens: false,
      ast: false,
      ir: false,
      execute: true,
      generateAssembly: false,
      generateJavaScript: false,
      ...options
    };

    try {
      // Stage 1: Lexical Analysis (Tokenization)
      const lexer = new Lexer(sourceCode);
      this.tokens = lexer.tokenize();

      if (stages.tokens) {
        return {
          success: true,
          stage: 'tokens',
          tokens: this.tokens,
          output: this.formatTokens()
        };
      }

      // Stage 2: Syntax Analysis (Parsing)
      const parser = new Parser(this.tokens);
      this.ast = parser.parse();

      if (stages.ast) {
        return {
          success: true,
          stage: 'ast',
          ast: this.ast,
          output: JSON.stringify(this.ast, null, 2)
        };
      }

      // Stage 3: Intermediate Code Generation
      const irGenerator = new IRGenerator(this.ast);
      this.ir = irGenerator.generate();

      if (stages.ir) {
        return {
          success: true,
          stage: 'ir',
          ir: this.ir,
          output: this.formatIR()
        };
      }

      // Stage 4: Code Generation / Execution
      if (stages.execute) {
        const interpreter = new Interpreter(this.ir);
        this.output = interpreter.execute();
        return {
          success: true,
          stage: 'execute',
          output: this.output,
          variables: Object.fromEntries(interpreter.variables)
        };
      }

      if (stages.generateAssembly) {
        const codeGen = new CodeGenerator(this.ir);
        this.output = codeGen.generateAssembly();
        return {
          success: true,
          stage: 'assembly',
          output: this.output
        };
      }

      if (stages.generateJavaScript) {
        const codeGen = new CodeGenerator(this.ir);
        this.output = codeGen.generateJavaScript();
        return {
          success: true,
          stage: 'javascript',
          output: this.output
        };
      }

      return {
        success: true,
        stage: 'complete',
        output: 'Compilation successful'
      };

    } catch (error) {
      this.errors.push(error.message);
      return {
        success: false,
        error: error.message,
        output: `Error: ${error.message}`
      };
    }
  }

  formatTokens() {
    return this.tokens
      .map(token => `${token.type.padEnd(15)} | ${String(token.value).padEnd(15)} | Line ${token.line}:${token.column}`)
      .join('\n');
  }

  formatIR() {
    return this.ir.map(instr => instr.toString()).join('\n');
  }

  // Compile all stages and return results
  compileAllStages(sourceCode) {
    const results = {
      tokens: null,
      ast: null,
      ir: null,
      execution: null
    };

    try {
      // Tokenization
      const lexer = new Lexer(sourceCode);
      results.tokens = lexer.tokenize();

      // Parsing
      const parser = new Parser(results.tokens);
      results.ast = parser.parse();

      // IR Generation
      const irGenerator = new IRGenerator(results.ast);
      results.ir = irGenerator.generate();

      // Execution
      const interpreter = new Interpreter(results.ir);
      results.execution = {
        output: interpreter.execute(),
        variables: Object.fromEntries(interpreter.variables)
      };

      return {
        success: true,
        results,
        formatted: {
          tokens: this.formatTokensArray(results.tokens),
          ast: JSON.stringify(results.ast, null, 2),
          ir: results.ir.map(instr => instr.toString()).join('\n'),
          output: results.execution.output
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        results
      };
    }
  }

  formatTokensArray(tokens) {
    return tokens
      .map(token => `${token.type.padEnd(15)} | ${String(token.value).padEnd(15)} | Line ${token.line}:${token.column}`)
      .join('\n');
  }
}

export default Compiler;
