# Mini Compiler - Quick Start Guide

## What You've Built

A complete **mini compiler** with all major compilation stages:

### ✅ Complete Features
1. **Lexer** - Tokenizes source code into tokens
2. **Parser** - Builds Abstract Syntax Tree (AST)  
3. **IR Generator** - Creates intermediate representation (three-address code)
4. **Code Generator** - Executes code or generates assembly/JavaScript
5. **Interactive UI** - Monaco Editor integration with stage-by-stage visualization

### Supported Language Features
- Variables: `let x = 10;`
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparisons: `==`, `!=`, `<`, `>`, `<=`, `>=`
- If/Else statements
- While loops
- Print output
- Comments

## Project Structure

```
mini_compiler/
├── lib/compiler/
│   ├── lexer.js           # Tokenization
│   ├── parser.js          # AST generation
│   ├── ir-generator.js    # Intermediate code
│   ├── code-generator.js  # Execution & code gen
│   └── index.js           # Main compiler orchestrator
├── app/
│   ├── components/
│   │   └── MonacoEditor.js  # Interactive UI
│   └── page.js              # Main page
├── examples/                # Sample programs
└── COMPILER_README.md       # Full documentation
```

## Running the Compiler

### Option 1: Via Browser (Recommended)

If you have PowerShell execution policy issues, use cmd:

```cmd
cd c:\Users\rames\Desktop\Productivity\My_Projects\mini_compiler
npm run dev
```

Then open: **http://localhost:3000** (or the port shown)

### Option 2: Enable PowerShell (One-time fix)

Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy RemoteSigned
```

Then run:
```cmd
npm run dev
```

## Using the Compiler

1. **Write code** in the left editor panel
2. **Select compilation stage**:
   - **Tokens** - See lexical analysis output
   - **AST** - View syntax tree
   - **IR** - See intermediate code
   - **Execute** - Run the program
   - **Assembly** - Generate assembly code
   - **JavaScript** - Transpile to JS
3. **Check "Show All Stages"** to see the complete pipeline
4. **Click "Compile"** to process

## Example Program

```javascript
// Calculate factorial
let n = 5;
let factorial = 1;
let i = 1;

while (i <= n) {
  factorial = factorial * i;
  i = i + 1;
}

print(factorial);  // Output: 120
```

## Compilation Pipeline Example

**Input Code:**
```javascript
let x = 10;
print(x);
```

**Stage 1 - Tokens:**
```
LET         | let          | Line 1:1
IDENTIFIER  | x            | Line 1:5
ASSIGN      | =            | Line 1:7
NUMBER      | 10           | Line 1:9
SEMICOLON   | ;            | Line 1:11
```

**Stage 2 - AST:**
```json
{
  "type": "Program",
  "statements": [
    {
      "type": "VariableDeclaration",
      "identifier": "x",
      "initializer": {"type": "Number", "value": 10}
    },
    {
      "type": "Print",
      "expression": {"type": "Identifier", "name": "x"}
    }
  ]
}
```

**Stage 3 - IR (Intermediate Code):**
```
  x = 10
  PRINT x
```

**Stage 4 - Output:**
```
10
```

## Sample Programs

Check the `examples/` folder:
- `01-basic.txt` - Variables and arithmetic
- `02-conditionals.txt` - If/else statements
- `03-loops.txt` - While loops
- `04-fibonacci.txt` - Fibonacci sequence
- `05-nested.txt` - Nested structures

## Key Files Explained

### `lib/compiler/lexer.js`
- Converts source code into tokens
- Recognizes keywords, operators, identifiers, numbers, strings
- Tracks line/column for error reporting

### `lib/compiler/parser.js`
- Builds Abstract Syntax Tree
- Uses recursive descent parsing
- Handles operator precedence
- Creates AST nodes for each language construct

### `lib/compiler/ir-generator.js`
- Generates three-address code (TAC)
- Creates temporary variables
- Handles control flow (labels, jumps)
- Linearizes nested structures

### `lib/compiler/code-generator.js`
- **Interpreter**: Executes IR directly
- **Assembly Generator**: Produces assembly-like output
- **JavaScript Generator**: Transpiles to JavaScript

### `lib/compiler/index.js`
- Main compiler orchestrator
- Coordinates all stages
- Handles errors
- Provides unified API

### `app/components/MonacoEditor.js`
- Interactive UI component
- Monaco Editor integration
- Stage selection and visualization
- Real-time compilation

## Next Steps

### Test the Compiler
1. Start the dev server (see "Running the Compiler" above)
2. Try the example programs
3. Experiment with different compilation stages

### Extend the Compiler
Add new features by modifying:
1. **Lexer** - Add new token types
2. **Parser** - Add new AST nodes and parsing rules
3. **IR Generator** - Add IR generation for new features
4. **Code Generator** - Add execution logic

### Ideas for Enhancement
- Functions and parameters
- Arrays and objects
- For loops
- Break/continue statements
- String operations
- Type checking
- Optimization passes

## Troubleshooting

### PowerShell Execution Policy Error
Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy RemoteSigned
```

### Port Already in Use
Kill the existing process:
```cmd
taskkill /F /PID [process_id]
```

### Build Errors
Clear Next.js cache:
```cmd
rmdir /s /q .next
npm run dev
```

### Import Errors
Make sure `jsconfig.json` has the path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## Documentation

See `COMPILER_README.md` for comprehensive documentation including:
- Language grammar specification
- Detailed architecture explanation
- Development guidelines
- Contributing information

## Status

✅ **All compiler stages implemented and working!**
✅ **Interactive UI ready**
✅ **Example programs included**
✅ **Documentation complete**

Your mini compiler is ready to use! 🎉
