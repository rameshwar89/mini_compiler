import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

from compiler.lexer import tokenize
from compiler.parser import parse
from compiler.intermediate import generate_intermediate_code
from compiler.executor import execute_code
from compiler.lr1_table import build_mini_language_lr1_table

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
    except Exception as error:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Failed to build LR(1) table: {str(error)}'
        }), 500

@app.route('/api/compile', methods=['POST'])
def compile_code():
    try:
        request_payload = request.get_json()
        source_code = request_payload.get('code', '')
        
        if not source_code.strip():
            return jsonify({
                'success': False,
                'error': 'No source code provided'
            }), 400
        
        result = {
            'success': True,
            'tokens': [],
            'parse_tree': None,
            'parse_items': [],
            'intermediate': [],
            'output': {}
        }
        
        try:
            result['tokens'] = tokenize(source_code)
        except Exception as error:
            return jsonify({
                'success': False,
                'error': f'Lexical error: {str(error)}',
                'stage': 'tokenization'
            }), 400
        
        try:
            parsed = parse(source_code, include_items=True)
            result['parse_tree'] = parsed.get('parse_tree')
            result['parse_items'] = parsed['parse_items']
        except Exception as error:
            return jsonify({
                'success': False,
                'error': f'Syntax error: {str(error)}',
                'stage': 'parsing',
                'tokens': result['tokens']
            }), 400
        
        try:
            result['intermediate'] = generate_intermediate_code(result['parse_tree'])
        except Exception as error:
            return jsonify({
                'success': False,
                'error': f'Code generation error: {str(error)}',
                'stage': 'intermediate',
                'tokens': result['tokens'],
                'parse_tree': result['parse_tree']
            }), 400
        
        try:
            result['output'] = execute_code(result['intermediate'])
        except Exception as error:
            return jsonify({
                'success': False,
                'error': f'Execution error: {str(error)}',
                'stage': 'execution',
                'tokens': result['tokens'],
                'parse_tree': result['parse_tree'],
                'intermediate': result['intermediate']
            }), 400
        
        return jsonify(result)
    
    except Exception as error:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Server error: {str(error)}'
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("Mini Compiler API Server")
    print("Server running on: http://localhost:5000")
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
