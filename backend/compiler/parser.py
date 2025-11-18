"""
Parser - Converts tokens into an Abstract Syntax Tree (AST)
Think of it like building a sentence diagram from words
"""

import ply.yacc as yacc
from .lexer import tokens

# Define operator precedence and associativity
# Lower in the list = higher precedence
# This ensures: comparison < addition/subtraction < multiplication/division/modulo
precedence = (
    ('left', 'EQ', 'NE', 'LT', 'GT', 'LE', 'GE'),  # Lowest precedence: comparison operators
    ('left', 'PLUS', 'MINUS'),                      # Medium precedence: addition/subtraction
    ('left', 'TIMES', 'DIVIDE', 'MODULO'),         # Highest precedence: multiplication/division/modulo
)

# AST Node - Represents each piece of our program
class ASTNode:
    """A single node in our program tree"""
    
    def __init__(self, node_type, **attributes):
        self.type = node_type
        # Store all node attributes (like name, value, condition, etc.)
        self.__dict__.update(attributes)
    
    def to_dict(self):
        """Convert this node to a dictionary for easy JSON conversion"""
        result = {'type': self.type}
        
        for key, value in self.__dict__.items():
            if key == 'type':
                continue
                
            # Recursively convert child nodes
            if isinstance(value, ASTNode):
                result[key] = value.to_dict()
            elif isinstance(value, list):
                result[key] = [item.to_dict() if isinstance(item, ASTNode) else item 
                              for item in value]
            else:
                result[key] = value
                
        return result


# === GRAMMAR RULES ===
# These define how our language is structured

def p_program(p):
    """program : statement_list"""
    # A program is just a list of statements
    p[0] = ASTNode('Program', statements=p[1])


def p_statement_list(p):
    """statement_list : statement_list statement
                      | statement"""
    # Build up a list of statements
    if len(p) == 3:
        p[0] = p[1] + [p[2]]  # Add new statement to existing list
    else:
        p[0] = [p[1]]  # First statement


def p_statement(p):
    """statement : declaration
                 | assignment
                 | if_statement
                 | while_statement
                 | print_statement"""
    # A statement can be any of these types
    p[0] = p[1]


def p_declaration(p):
    """declaration : LET ID ASSIGN expression SEMICOLON""" 
    # Creating a new variable: let x = 5;
    p[0] = ASTNode('Declaration', name=p[2], value=p[4])


def p_assignment(p):
    """assignment : ID ASSIGN expression SEMICOLON"""
    # Changing an existing variable: x = 10;
    p[0] = ASTNode('Assignment', name=p[1], value=p[3])


def p_if_statement(p):
    """if_statement : IF LPAREN expression RPAREN LBRACE statement_list RBRACE
                    | IF LPAREN expression RPAREN LBRACE statement_list RBRACE ELSE LBRACE statement_list RBRACE"""
    # if (condition) { ... } or if (condition) { ... } else { ... }
    has_else = len(p) == 12
    p[0] = ASTNode('IfStatement', 
                   condition=p[3], 
                   then_branch=p[6],
                   else_branch=p[10] if has_else else None)


def p_while_statement(p):
    """while_statement : WHILE LPAREN expression RPAREN LBRACE statement_list RBRACE"""
    # while (condition) { ... }
    p[0] = ASTNode('WhileStatement', condition=p[3], body=p[6])


def p_print_statement(p):
    """print_statement : PRINT LPAREN expression RPAREN SEMICOLON"""
    # print(value);
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
    # Binary operations: x + y, x == y, etc.
    p[0] = ASTNode('BinaryOp', operator=p[2], left=p[1], right=p[3])


def p_expression_group(p):
    """expression : LPAREN expression RPAREN"""
    # Parentheses for grouping: (x + y)
    p[0] = p[2]


def p_expression_number(p):
    """expression : NUMBER"""
    # A number literal: 42
    p[0] = ASTNode('Number', value=p[1])


def p_expression_id(p):
    """expression : ID"""
    # A variable name: x
    p[0] = ASTNode('Identifier', name=p[1])


def p_error(p):
    """Handle syntax errors"""
    if p:
        error_msg = f"Syntax error at '{p.value}' (line {p.lineno})"
    else:
        error_msg = "Unexpected end of file"
    
    raise SyntaxError(error_msg)


def build_parser():
    """Create and return a new parser"""
    return yacc.yacc()


def parse(code):
    """
    Parse source code and return its AST
    
    Args:
        code: String containing the source code
        
    Returns:
        Dictionary representation of the AST, or None if parsing fails
    """
    from .lexer import build_lexer
    
    lexer = build_lexer()
    parser = build_parser()
    
    ast = parser.parse(code, lexer=lexer)
    
    return ast.to_dict() if ast else None
