import ply.yacc as yacc
from .lexer import tokens

precedence = (
    ('left', 'EQ', 'NE', 'LT', 'GT', 'LE', 'GE'),
    ('left', 'PLUS', 'MINUS'),
    ('left', 'TIMES', 'DIVIDE', 'MODULO'),
)

class ASTNode:
    def __init__(self, node_type, **attributes):
        self.type = node_type
        self.__dict__.update(attributes)
    
    def to_dict(self):
        result = {'type': self.type}
        
        for key, value in self.__dict__.items():
            if key == 'type':
                continue
                
            if isinstance(value, ASTNode):
                result[key] = value.to_dict()
            elif isinstance(value, list):
                result[key] = [item.to_dict() if isinstance(item, ASTNode) else item 
                              for item in value]
            else:
                result[key] = value
                
        return result


def p_program(p):
    """program : statement_list"""
    p[0] = ASTNode('Program', statements=p[1])


def p_statement_list(p):
    """statement_list : statement_list statement
                      | statement"""
    if len(p) == 3:
        p[0] = p[1] + [p[2]]
    else:
        p[0] = [p[1]]


def p_statement(p):
    """statement : declaration
                 | assignment
                 | if_statement
                 | while_statement
                 | print_statement"""
    p[0] = p[1]


def p_declaration(p):
    """declaration : LET ID ASSIGN expression SEMICOLON""" 
    p[0] = ASTNode('Declaration', name=p[2], value=p[4])


def p_assignment(p):
    """assignment : ID ASSIGN expression SEMICOLON"""
    p[0] = ASTNode('Assignment', name=p[1], value=p[3])


def p_if_statement(p):
    """if_statement : IF LPAREN expression RPAREN LBRACE statement_list RBRACE
                    | IF LPAREN expression RPAREN LBRACE statement_list RBRACE ELSE LBRACE statement_list RBRACE"""
    has_else = len(p) == 12
    p[0] = ASTNode('IfStatement', 
                   condition=p[3], 
                   then_branch=p[6],
                   else_branch=p[10] if has_else else None)


def p_while_statement(p):
    """while_statement : WHILE LPAREN expression RPAREN LBRACE statement_list RBRACE"""
    p[0] = ASTNode('WhileStatement', condition=p[3], body=p[6])


def p_print_statement(p):
    """print_statement : PRINT LPAREN expression RPAREN SEMICOLON"""
    p[0] = ASTNode('PrintStatement', value=p[3])


def p_expression_binop(p):
    """expression : expression PLUS expression
                  | expression MINUS expression
                  | expression TIMES expression
                  | expression DIVIDE expression
                  | expression MODULO expression
                  | expression EQ expression
                  | expression NE expression
                  | expression LT expression
                  | expression GT expression
                  | expression LE expression
                  | expression GE expression"""
    p[0] = ASTNode('BinaryOp', operator=p[2], left=p[1], right=p[3])


def p_expression_group(p):
    """expression : LPAREN expression RPAREN"""
    p[0] = p[2]


def p_expression_number(p):
    """expression : NUMBER"""
    p[0] = ASTNode('Number', value=p[1])


def p_expression_id(p):
    """expression : ID"""
    p[0] = ASTNode('Identifier', name=p[1])


def p_error(p):
    if p:
        error_msg = f"Syntax error at '{p.value}' (line {p.lineno})"
    else:
        error_msg = "Unexpected end of file"
    
    raise SyntaxError(error_msg)


def build_parser():
    # write_tables=False and debug=False prevent PLY from trying to write
    # parsetab.py / parser.out to the filesystem (required for serverless envs)
    return yacc.yacc(write_tables=False, debug=False)


def parse(code):
    from .lexer import build_lexer
    
    lexer = build_lexer()
    parser = build_parser()
    
    ast = parser.parse(code, lexer=lexer)
    
    return ast.to_dict() if ast else None
