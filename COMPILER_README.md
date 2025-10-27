# Mini Compiler

A fully functional mini compiler built with Next.js and Monaco Editor, featuring all compilation stages from tokenization to code execution.

## Features

### Complete Compilation Pipeline
1. **Lexical Analysis (Tokenization)** - Converts source code into tokens
2. **Syntax Analysis (Parsing)** - Builds Abstract Syntax Tree (AST)
3. **Intermediate Code Generation** - Generates three-address code (IR)
4. **Code Generation/Execution** - Executes code or generates target output

### Supported Language Features
- **Variables**: `let x = 10;`
- **Arithmetic**: `+`, `-`, `*`, `/`, `%`
- **Comparisons**: `==`, `!=`, `<`, `>`, `<=`, `>=`
- **Conditionals**: `if (condition) { } else { }`
- **Loops**: `while (condition) { }`
- **Output**: `print(expression);`
- **Comments**: `// single line comments`

## Getting Started

### Installation

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Interactive Compiler

The web interface provides:
- **Monaco Editor** for writing code
- **Compilation Stage Selector** to view different stages:
  - Tokens (Lexical Analysis)
  - AST (Syntax Tree)
  - IR (Intermediate Representation)
  - Execute (Run the program)
  - Assembly (Assembly-like code)
  - JavaScript (Generated JS code)
- **Show All Stages** option to see the complete compilation pipeline

### Example Programs

Check the `examples/` folder for sample programs:
- `01-basic.txt` - Variables and arithmetic
- `02-conditionals.txt` - If-else statements
- `03-loops.txt` - While loops and factorial
- `04-fibonacci.txt` - Fibonacci sequence
- `05-nested.txt` - Nested loops and conditions

### Sample Program

```javascript
// Calculate sum and squares
let x = 10;
let y = 20;
let sum = x + y;
print(sum);

let i = 1;
while (i <= 5) {
  print(i * i);
  i = i + 1;
}

if (sum > 25) {
  print("Sum is greater than 25");
}
```

## Architecture

### Compiler Components

#### 1. Lexer (`lib/compiler/lexer.js`)
- Tokenizes source code
- Recognizes keywords, identifiers, operators, literals
- Tracks line and column numbers for error reporting

#### 2. Parser (`lib/compiler/parser.js`)
- Builds Abstract Syntax Tree (AST)
- Uses recursive descent parsing
- Handles operator precedence
- AST nodes: Program, VariableDeclaration, Assignment, BinaryOp, If, While, etc.

#### 3. IR Generator (`lib/compiler/ir-generator.js`)
- Generates three-address code from AST
- Produces linear intermediate representation
- Operations: ADD, SUB, MUL, DIV, ASSIGN, IF_FALSE, GOTO, LABEL, etc.
- Manages temporary variables and labels

#### 4. Code Generator (`lib/compiler/code-generator.js`)
- **Interpreter**: Executes IR directly
- **Assembly Generator**: Produces assembly-like code
- **JavaScript Generator**: Transpiles to JavaScript

#### 5. Main Compiler (`lib/compiler/index.js`)
- Orchestrates all compilation stages
- Handles errors and stage selection
- Provides unified compilation interface

## Compilation Stages Explained

### Stage 1: Tokenization
```
Input:  let x = 10;
Output: LET | let | Line 1:1
        IDENTIFIER | x | Line 1:5
        ASSIGN | = | Line 1:7
        NUMBER | 10 | Line 1:9
        SEMICOLON | ; | Line 1:11
```

### Stage 2: AST
```json
{
  "type": "Program",
  "statements": [
    {
      "type": "VariableDeclaration",
      "identifier": "x",
      "initializer": {
        "type": "Number",
        "value": 10
      }
    }
  ]
}
```

### Stage 3: Intermediate Code
```
  x = 10
```

### Stage 4: Execution
```
(Program runs and produces output)
```

## Language Grammar

```
Program        → Statement*
Statement      → VarDecl | Assignment | IfStmt | WhileStmt | PrintStmt | Block
VarDecl        → 'let' IDENTIFIER '=' Expression ';'
Assignment     → IDENTIFIER '=' Expression ';'
IfStmt         → 'if' '(' Expression ')' Statement ('else' Statement)?
WhileStmt      → 'while' '(' Expression ')' Statement
PrintStmt      → 'print' '(' Expression ')' ';'
Block          → '{' Statement* '}'
Expression     → Comparison
Comparison     → Term (('==' | '!=' | '<' | '>' | '<=' | '>=') Term)*
Term           → Factor (('+' | '-') Factor)*
Factor         → Unary (('*' | '/' | '%') Unary)*
Unary          → ('+' | '-') Unary | Primary
Primary        → NUMBER | STRING | IDENTIFIER | '(' Expression ')'
```

## Technologies

- **Next.js 15** - React framework
- **Monaco Editor** - VS Code editor in browser
- **Tailwind CSS** - Styling
- **JavaScript** - Implementation language

## Development

### Project Structure

```
mini_compiler/
├── app/
│   ├── components/
│   │   └── MonacoEditor.js    # UI component
│   ├── page.js                 # Main page
│   └── globals.css             # Styles
├── lib/
│   └── compiler/
│       ├── lexer.js            # Tokenizer
│       ├── parser.js           # AST builder
│       ├── ir-generator.js     # IR generator
│       ├── code-generator.js   # Code gen & interpreter
│       └── index.js            # Main compiler
├── examples/                   # Sample programs
└── README.md
```

### Adding New Features

1. **New Operator/Keyword**:
   - Add to `lexer.js` token types and keywords
   - Add to `parser.js` parsing rules
   - Add to `ir-generator.js` IR generation
   - Add to `code-generator.js` execution logic

2. **New Statement Type**:
   - Create AST node in `parser.js`
   - Add parsing method
   - Add IR generation visitor
   - Add execution logic

## Error Handling

The compiler provides detailed error messages with line and column information:
```
Error: Expected token type SEMICOLON but got IDENTIFIER at 3:5
```

## Limitations

- No function declarations (yet)
- No arrays or objects
- Integer and float arithmetic only
- No string operations beyond printing
- No boolean type (uses 1/0 for true/false)

## Future Enhancements

- [ ] Functions and parameters
- [ ] Arrays and data structures
- [ ] String operations
- [ ] Boolean type
- [ ] For loops
- [ ] Break/continue statements
- [ ] Type checking
- [ ] Optimization passes
- [ ] Better error recovery
- [ ] Syntax highlighting for custom language

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this for learning and educational purposes.

---

Built with ❤️ using Next.js and Monaco Editor
