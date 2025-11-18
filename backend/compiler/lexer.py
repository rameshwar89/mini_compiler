import ply.lex as lex

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

reserved = {
    'let': 'LET',
    'if': 'IF',
    'else': 'ELSE',
    'while': 'WHILE',
    'print': 'PRINT',
}

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

def t_NUMBER(t):
    r'\d+'
    t.value = int(t.value)
    return t

def t_ID(t):
    r'[a-zA-Z_][a-zA-Z_0-9]*'
    t.type = reserved.get(t.value, 'ID')
    return t

def t_COMMENT(t):
    r'//.*'
    pass

def t_newline(t):
    r'\n+'
    t.lexer.lineno += len(t.value)

t_ignore = ' \t'

def t_error(t):
    print(f"Illegal character '{t.value[0]}' at line {t.lineno}")
    t.lexer.skip(1)

def build_lexer():
    return lex.lex()

def tokenize(code):
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
