from dataclasses import dataclass
from typing import List

TOKEN_TYPES = (
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

RESERVED_KEYWORDS = {
    'let': 'LET',
    'if': 'IF',
    'else': 'ELSE',
    'while': 'WHILE',
    'print': 'PRINT',
}


@dataclass(frozen=True)
class Token:
    token_type: str
    value: object
    line: int
    position: int


SINGLE_CHAR_TOKEN_TYPES = {
    '+': 'PLUS',
    '-': 'MINUS',
    '*': 'TIMES',
    '/': 'DIVIDE',
    '%': 'MODULO',
    '(': 'LPAREN',
    ')': 'RPAREN',
    '{': 'LBRACE',
    '}': 'RBRACE',
    ';': 'SEMICOLON',
    '=': 'ASSIGN',
    '<': 'LT',
    '>': 'GT',
}

DOUBLE_CHAR_TOKEN_TYPES = {
    '==': 'EQ',
    '!=': 'NE',
    '<=': 'LE',
    '>=': 'GE',
}


def tokenize_objects(code: str) -> List[Token]:
    current_index = 0
    current_line = 1
    code_length = len(code)
    token_list: List[Token] = []

    while current_index < code_length:
        current_char = code[current_index]

        if current_char in ' \t\r':
            current_index += 1
            continue

        if current_char == '\n':
            current_line += 1
            current_index += 1
            continue

        if current_char == '/' and current_index + 1 < code_length and code[current_index + 1] == '/':
            current_index += 2
            while current_index < code_length and code[current_index] != '\n':
                current_index += 1
            continue

        if current_index + 1 < code_length:
            two_char_token_text = code[current_index:current_index + 2]
            token_type = DOUBLE_CHAR_TOKEN_TYPES.get(two_char_token_text)
            if token_type:
                token_list.append(Token(token_type=token_type, value=two_char_token_text, line=current_line, position=current_index))
                current_index += 2
                continue

        if current_char.isdigit():
            number_start_index = current_index
            while current_index < code_length and code[current_index].isdigit():
                current_index += 1
            number_text = code[number_start_index:current_index]
            token_list.append(Token(token_type='NUMBER', value=int(number_text), line=current_line, position=number_start_index))
            continue

        if current_char.isalpha() or current_char == '_':
            identifier_start_index = current_index
            while current_index < code_length and (code[current_index].isalnum() or code[current_index] == '_'):
                current_index += 1
            identifier_text = code[identifier_start_index:current_index]
            token_type = RESERVED_KEYWORDS.get(identifier_text, 'ID')
            token_list.append(Token(token_type=token_type, value=identifier_text, line=current_line, position=identifier_start_index))
            continue

        single_char_token_type = SINGLE_CHAR_TOKEN_TYPES.get(current_char)
        if single_char_token_type:
            token_list.append(Token(token_type=single_char_token_type, value=current_char, line=current_line, position=current_index))
            current_index += 1
            continue

        raise SyntaxError(f"Illegal character '{current_char}' at line {current_line}")

    return token_list


def tokenize(code: str):
    return [
        {
            'type': token.token_type,
            'value': str(token.value),
            'line': token.line,
            'position': token.position,
        }
        for token in tokenize_objects(code)
    ]


tokens = TOKEN_TYPES
reserved = RESERVED_KEYWORDS
