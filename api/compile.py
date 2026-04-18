from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import traceback

# Make the compiler package importable from this file's directory
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from compiler.lexer import tokenize
from compiler.parser import parse
from compiler.intermediate import generate_intermediate_code
from compiler.executor import execute_code


class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            source_code = data.get('code', '')

            if not source_code.strip():
                self._send_json({'success': False, 'error': 'No source code provided'}, 400)
                return

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
                self._send_json({
                    'success': False,
                    'error': f'Lexical error: {str(e)}',
                    'stage': 'tokenization'
                }, 400)
                return

            try:
                result['ast'] = parse(source_code)
            except Exception as e:
                self._send_json({
                    'success': False,
                    'error': f'Syntax error: {str(e)}',
                    'stage': 'parsing',
                    'tokens': result['tokens']
                }, 400)
                return

            try:
                result['intermediate'] = generate_intermediate_code(result['ast'])
            except Exception as e:
                self._send_json({
                    'success': False,
                    'error': f'Code generation error: {str(e)}',
                    'stage': 'intermediate',
                    'tokens': result['tokens'],
                    'ast': result['ast']
                }, 400)
                return

            try:
                result['output'] = execute_code(result['intermediate'])
            except Exception as e:
                self._send_json({
                    'success': False,
                    'error': f'Execution error: {str(e)}',
                    'stage': 'execution',
                    'tokens': result['tokens'],
                    'ast': result['ast'],
                    'intermediate': result['intermediate']
                }, 400)
                return

            self._send_json(result, 200)

        except Exception as e:
            traceback.print_exc()
            self._send_json({'success': False, 'error': f'Server error: {str(e)}'}, 500)

    def _send_json(self, data, status=200):
        response = json.dumps(data).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(response)))
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(response)

    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, format, *args):
        pass
