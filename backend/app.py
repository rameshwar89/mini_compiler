"""
Flask API Server for Mini Compiler
Provides REST endpoints for compilation stages
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

from compiler.lexer import tokenize
from compiler.parser import parse
from compiler.intermediate import generate_intermediate_code
from compiler.executor import execute_code

app = Flask(__name__)
CORS(app)  # Enable CORS for Next.js frontend

@app.route('/api/compile', methods=['POST'])
def compile_code():
    """
    Compile the source code and return all stages:
    - tokens: Lexical analysis results
    - ast: Abstract Syntax Tree (parse tree)
    - intermediate: Three-address code
    - output: Execution results
    """
    try:
        data = request.get_json()
        source_code = data.get('code', '')
        
        if not source_code.strip():
            return jsonify({
                'success': False,
                'error': 'No source code provided'
            }), 400
        
        result = {
            'success': True,
            'tokens': [],
            'ast': None,
            'intermediate': [],
            'output': {}
        }
        
        # Stage 1: Tokenization
        try:
            result['tokens'] = tokenize(source_code)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Lexical error: {str(e)}',
                'stage': 'tokenization'
            }), 400
        
        # Stage 2: Parsing (AST generation)
        try:
            result['ast'] = parse(source_code)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Syntax error: {str(e)}',
                'stage': 'parsing',
                'tokens': result['tokens']
            }), 400
        
        # Stage 3: Intermediate code generation
        try:
            result['intermediate'] = generate_intermediate_code(result['ast'])
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Code generation error: {str(e)}',
                'stage': 'intermediate',
                'tokens': result['tokens'],
                'ast': result['ast']
            }), 400
        
        # Stage 4: Execution
        try:
            result['output'] = execute_code(result['intermediate'])
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Execution error: {str(e)}',
                'stage': 'execution',
                'tokens': result['tokens'],
                'ast': result['ast'],
                'intermediate': result['intermediate']
            }), 400
        
        return jsonify(result)
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Server error: {str(e)}'
        }), 500

if __name__ == '__main__': # This ensures this function is directly called, if not then __name__ would be app, preventing autostart
    print("=" * 60)
    print("Mini Compiler API Server")
    print("Server running on: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
