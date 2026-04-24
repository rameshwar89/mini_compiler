from dataclasses import dataclass
from typing import Any, Dict, List

from .lexer import Token, tokenize_objects
from .lr1_table import ENDMARK, build_mini_language_lr1_table


# Parser 

@dataclass(frozen=True)
class _EndToken:
    token_type: str = ENDMARK
    value: str = ENDMARK
    line: int = -1
    position: int = -1


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
                result[key] = [
                    item.to_dict() if isinstance(item, ASTNode) else item
                    for item in value
                ]
            else:
                result[key] = value

        return result


_TABLE_CACHE: Dict[str, Any] | None = None


def _get_table() -> Dict[str, Any]:
    global _TABLE_CACHE
    if _TABLE_CACHE is None:
        _TABLE_CACHE = build_mini_language_lr1_table()
    return _TABLE_CACHE


def _binary(operator_symbol: str, left_value: Any, right_value: Any) -> ASTNode:
    return ASTNode('BinaryOp', operator=operator_symbol, left=left_value, right=right_value)


def _reduce_semantic(production_index: int, semantic_values: List[Any]) -> Any:
    if production_index == 1:
        return ASTNode('Program', statements=semantic_values[0])
    if production_index == 2:
        return semantic_values[0] + [semantic_values[1]]
    if production_index == 3:
        return [semantic_values[0]]
    if production_index in (4, 5, 6, 7, 8):
        return semantic_values[0]
    if production_index == 9:
        return ASTNode('Declaration', name=semantic_values[1], value=semantic_values[3])
    if production_index == 10:
        return ASTNode('Assignment', name=semantic_values[0], value=semantic_values[2])
    if production_index == 11:
        return ASTNode('IfStatement', condition=semantic_values[2], then_branch=semantic_values[5], else_branch=None)
    if production_index == 12:
        return ASTNode('IfStatement', condition=semantic_values[2], then_branch=semantic_values[5], else_branch=semantic_values[9])
    if production_index == 13:
        return ASTNode('WhileStatement', condition=semantic_values[2], body=semantic_values[5])
    if production_index == 14:
        return ASTNode('PrintStatement', value=semantic_values[2])
    if production_index in (15, 18, 23, 26, 30):
        return semantic_values[0]
    if production_index in (16, 17, 19, 20, 21, 22, 24, 25, 27, 28, 29):
        return _binary(semantic_values[1], semantic_values[0], semantic_values[2])
    if production_index == 31:
        return semantic_values[1]
    if production_index == 32:
        return ASTNode('Number', value=semantic_values[0])
    if production_index == 33:
        return ASTNode('Identifier', name=semantic_values[0])

    raise RuntimeError(f'Unhandled production index {production_index}')


def _shift_value(token: Token | _EndToken) -> Any:
    if token.token_type == 'NUMBER':
        return int(token.value)
    if token.token_type == 'ID':
        return str(token.value)
    return token.value


def _syntax_error(lookahead: Token | _EndToken) -> None:
    if lookahead.token_type == ENDMARK:
        raise SyntaxError('Unexpected end of file')
    raise SyntaxError(f"Syntax error at '{lookahead.value}' (line {lookahead.line})")


def parse(code: str, include_items: bool = False):
    table = _get_table()
    action_table = table['action_table']
    goto_table = table['goto_table']
    productions = table['productions']
    states_payload = {state['id']: state for state in table['states']}

    token_stream: List[Token | _EndToken] = list(tokenize_objects(code))
    token_stream.append(_EndToken())

    state_stack: List[int] = [0]
    value_stack: List[Any] = []
    token_index = 0
    parse_trace: List[Dict[str, Any]] = []

    while True:
        current_state = state_stack[-1]
        lookahead = token_stream[token_index]

        action = action_table.get(str(current_state), {}).get(lookahead.token_type)
        if action is None:
            _syntax_error(lookahead)

        parse_trace.append(
            {
                'state': current_state,
                'lookahead': {
                    'type': lookahead.token_type,
                    'value': str(lookahead.value),
                    'line': lookahead.line,
                    'position': lookahead.position,
                },
                'action': action.get('repr', action.get('type', '')),
                'items': states_payload[current_state]['items'],
            }
        )

        action_type = action['type']
        if action_type == 'shift':
            state_stack.append(action['to_state'])
            value_stack.append(_shift_value(lookahead))
            token_index += 1
            continue

        if action_type == 'reduce':
            production_index = action['production']
            production = productions[production_index]
            right_hand_side_length = len(production['rhs'])
            reduced_values = value_stack[-right_hand_side_length:] if right_hand_side_length else []

            if right_hand_side_length:
                del state_stack[-right_hand_side_length:]
                del value_stack[-right_hand_side_length:]

            reduced_node = _reduce_semantic(production_index, reduced_values)
            goto_state = goto_table[str(state_stack[-1])].get(production['lhs'])
            if goto_state is None:
                raise RuntimeError(
                    f"Parser goto missing for state={state_stack[-1]} lhs={production['lhs']}"
                )

            state_stack.append(goto_state)
            value_stack.append(reduced_node)
            continue

        if action_type == 'accept':
            if not value_stack:
                return None
            synthesized_tree = value_stack[-1]
            synthesized_tree_dict = (
                synthesized_tree.to_dict() if isinstance(synthesized_tree, ASTNode) else synthesized_tree
            )
            if include_items:
                return {
                    'parse_tree': synthesized_tree_dict,
                    'parse_items': parse_trace,
                }
            return synthesized_tree_dict

        raise RuntimeError(f"Unsupported parser action: {action_type}")
