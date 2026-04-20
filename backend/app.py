from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

from compiler.lexer import tokenize
from compiler.parser import parse
from compiler.intermediate import generate_intermediate_code
from compiler.executor import execute_code
from compiler.lr1 import build_mini_language_lr1_table

app = Flask(__name__)
CORS(app)

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'success': True,
        'message': 'Mini Compiler API is running',
        'compile_endpoint': '/api/compile',
        'health_endpoint': '/api/health',
        'lr1_endpoint': '/api/lr1-table'
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'success': True,
        'status': 'ok'
    })


@app.route('/api/lr1-table', methods=['GET'])
def lr1_table():
    try:
        table = build_mini_language_lr1_table()
        return jsonify({
            'success': True,
            'lr1': table
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Failed to build LR(1) table: {str(e)}'
        }), 500

@app.route('/api/compile', methods=['POST'])
def compile_code():
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
        
        try:
            result['tokens'] = tokenize(source_code)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Lexical error: {str(e)}',
                'stage': 'tokenization'
            }), 400
        
        try:
            result['ast'] = parse(source_code)
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Syntax error: {str(e)}',
                'stage': 'parsing',
                'tokens': result['tokens']
            }), 400
        
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

if __name__ == '__main__':
    print("=" * 60)
    print("Mini Compiler API Server")
    print("Server running on: http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
