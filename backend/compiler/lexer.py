"""
Lexer for the mini compiler using PLY (Python Lex-Yacc)
Tokenizes input source code into tokens
"""

import ply.lex as lex

# List of token names
tokens = (
    'NUMBER',
    'PLUS',
    'MINUS',
    'TIMES',
    'DIVIDE',
    'MODULO',
    'LPAREN',
    'RPAREN',
    'LBRACE',
    'RBRACE',
    'SEMICOLON',
    'ASSIGN',
    'EQ',
    'NE',
    'LT',
    'GT',
    'LE',
    'GE',
    'ID',
    'LET',
    'IF',
    'ELSE',
    'WHILE',
    'PRINT',
)

# Reserved words
reserved = {
    'let': 'LET',
    'if': 'IF',
    'else': 'ELSE',
    'while': 'WHILE',
    'print': 'PRINT',
}

# Regular expression rules for simple tokens
t_PLUS    = r'\+'
t_MINUS   = r'-'
t_TIMES   = r'\*'
t_DIVIDE  = r'/'
t_MODULO  = r'%'
t_LPAREN  = r'\('
t_RPAREN  = r'\)'
t_LBRACE  = r'\{'
t_RBRACE  = r'\}'
t_SEMICOLON = r';'
t_ASSIGN  = r'='
t_EQ      = r'=='
t_NE      = r'!='
t_LE      = r'<='
t_GE      = r'>='
t_LT      = r'<'
t_GT      = r'>'

# Rule for numbers
def t_NUMBER(t):
    r'\d+'
    t.value = int(t.value)
    return t

# Rule for identifiers and reserved words
def t_ID(t):
    r'[a-zA-Z_][a-zA-Z_0-9]*'
    t.type = reserved.get(t.value, 'ID')
    return t

# Rule for comments
def t_COMMENT(t):
    r'//.*'
    pass  # No return value. Token discarded

# Rule for newlines
def t_newline(t):
    r'\n+'
    t.lexer.lineno += len(t.value)

# Ignored characters (spaces and tabs)
t_ignore = ' \t'

# Error handling rule
def t_error(t):
    print(f"Illegal character '{t.value[0]}' at line {t.lineno}")
    t.lexer.skip(1)

# Build the lexer
def build_lexer():
    return lex.lex()

# Function to tokenize input
def tokenize(code):
    """
    Tokenize the input code and return a list of tokens
    """
    lexer = build_lexer()
    lexer.input(code)
    
    tokens_list = []
    while True:
        tok = lexer.token()
        if not tok:
            break
        tokens_list.append({
            'type': tok.type,
            'value': str(tok.value),
            'line': tok.lineno,
            'position': tok.lexpos
        })
    
    return tokens_list
