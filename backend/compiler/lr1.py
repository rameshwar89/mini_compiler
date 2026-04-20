from collections import defaultdict, deque
from dataclasses import dataclass
from typing import Dict, FrozenSet, Iterable, List, Set, Tuple

from .lexer import tokens as lexer_tokens

EPSILON = "e"
ENDMARK = "$"


@dataclass(frozen=True)
class Production:
    lhs: str
    rhs: Tuple[str, ...]


@dataclass(frozen=True)
class LR1Item:
    prod_index: int
    dot: int
    lookahead: str


class LR1TableGenerator:
    def __init__(self, productions: List[Tuple[str, List[str]]], start_symbol: str, terminals: Set[str]):
        self.start_symbol = start_symbol
        self.augmented_start = self._build_augmented_start(productions, start_symbol)

        base_productions = [Production(lhs, tuple(rhs)) for lhs, rhs in productions]
        self.productions: List[Production] = [
            Production(self.augmented_start, (self.start_symbol,)),
            *base_productions,
        ]

        self.nonterminals = {prod.lhs for prod in self.productions}

        self.terminals = set(terminals)
        self.terminals.discard(self.augmented_start)
        self.terminals -= self.nonterminals
        self.terminals.add(ENDMARK)

        self.productions_by_lhs: Dict[str, List[int]] = defaultdict(list)
        for idx, production in enumerate(self.productions):
            self.productions_by_lhs[production.lhs].append(idx)

        self.first_sets = self._build_first_sets()

    def _build_augmented_start(self, productions: List[Tuple[str, List[str]]], start_symbol: str) -> str:
        symbols = {lhs for lhs, _ in productions}
        candidate = f"{start_symbol}'"
        while candidate in symbols:
            candidate += "'"
        return candidate

    def _build_first_sets(self) -> Dict[str, Set[str]]:
        first: Dict[str, Set[str]] = {}

        for terminal in self.terminals:
            first[terminal] = {terminal}
        for nonterminal in self.nonterminals:
            first.setdefault(nonterminal, set())

        changed = True
        while changed:
            changed = False
            for production in self.productions:
                lhs = production.lhs
                rhs = production.rhs

                if not rhs:
                    if EPSILON not in first[lhs]:
                        first[lhs].add(EPSILON)
                        changed = True
                    continue

                rhs_allows_epsilon = True
                for symbol in rhs:
                    symbol_first = first.get(symbol, {symbol})
                    before = len(first[lhs])
                    first[lhs].update(symbol_first - {EPSILON})
                    if len(first[lhs]) != before:
                        changed = True

                    if EPSILON not in symbol_first:
                        rhs_allows_epsilon = False
                        break

                if rhs_allows_epsilon and EPSILON not in first[lhs]:
                    first[lhs].add(EPSILON)
                    changed = True

        return first

    def _first_of_sequence(self, symbols: Iterable[str]) -> Set[str]:
        result: Set[str] = set()
        symbol_list = list(symbols)

        if not symbol_list:
            return {EPSILON}

        for symbol in symbol_list:
            symbol_first = self.first_sets.get(symbol, {symbol})
            result.update(symbol_first - {EPSILON})
            if EPSILON not in symbol_first:
                return result

        result.add(EPSILON)
        return result

    def closure(self, items: Set[LR1Item]) -> FrozenSet[LR1Item]:
        closure_set = set(items)
        queue = deque(items)

        while queue:
            item = queue.popleft()
            production = self.productions[item.prod_index]

            if item.dot >= len(production.rhs):
                continue

            symbol_after_dot = production.rhs[item.dot]
            if symbol_after_dot not in self.nonterminals:
                continue

            beta = production.rhs[item.dot + 1 :]
            lookahead_symbols = tuple(beta) + (item.lookahead,)
            lookaheads = self._first_of_sequence(lookahead_symbols) - {EPSILON}

            for prod_index in self.productions_by_lhs[symbol_after_dot]:
                for lookahead in lookaheads:
                    new_item = LR1Item(prod_index, 0, lookahead)
                    if new_item not in closure_set:
                        closure_set.add(new_item)
                        queue.append(new_item)

        return frozenset(closure_set)

    def goto(self, state: FrozenSet[LR1Item], symbol: str) -> FrozenSet[LR1Item]:
        moved_items: Set[LR1Item] = set()

        for item in state:
            production = self.productions[item.prod_index]
            if item.dot < len(production.rhs) and production.rhs[item.dot] == symbol:
                moved_items.add(LR1Item(item.prod_index, item.dot + 1, item.lookahead))

        if not moved_items:
            return frozenset()

        return self.closure(moved_items)

    def canonical_collection(self) -> Tuple[List[FrozenSet[LR1Item]], Dict[Tuple[int, str], int]]:
        start_item = LR1Item(0, 0, ENDMARK)
        initial_state = self.closure({start_item})

        states: List[FrozenSet[LR1Item]] = [initial_state]
        state_ids: Dict[FrozenSet[LR1Item], int] = {initial_state: 0}
        transitions: Dict[Tuple[int, str], int] = {}

        queue = deque([initial_state])

        while queue:
            state = queue.popleft()
            state_id = state_ids[state]

            next_symbols = sorted(
                {
                    self.productions[item.prod_index].rhs[item.dot]
                    for item in state
                    if item.dot < len(self.productions[item.prod_index].rhs)
                }
            )

            for symbol in next_symbols:
                target = self.goto(state, symbol)
                if not target:
                    continue

                if target not in state_ids:
                    state_ids[target] = len(states)
                    states.append(target)
                    queue.append(target)

                transitions[(state_id, symbol)] = state_ids[target]

        return states, transitions

    def _add_action(
        self,
        action_table: List[Dict[str, Dict[str, object]]],
        state_id: int,
        symbol: str,
        candidate: Dict[str, object],
        conflicts: List[Dict[str, object]],
    ) -> None:
        existing = action_table[state_id].get(symbol)
        if existing is None:
            action_table[state_id][symbol] = candidate
            return

        if existing == candidate:
            return

        conflicts.append(
            {
                "state": state_id,
                "symbol": symbol,
                "existing": existing,
                "candidate": candidate,
            }
        )

        # Keep deterministic behavior: prefer shift, otherwise keep first reduce.
        if existing["type"] == "shift":
            return
        if candidate["type"] == "shift":
            action_table[state_id][symbol] = candidate
            return

    def build(self) -> Dict[str, object]:
        states, transitions = self.canonical_collection()

        action_table: List[Dict[str, Dict[str, object]]] = [dict() for _ in states]
        goto_table: List[Dict[str, int]] = [dict() for _ in states]
        conflicts: List[Dict[str, object]] = []

        for state_id, state in enumerate(states):
            for item in state:
                production = self.productions[item.prod_index]

                if item.dot < len(production.rhs):
                    symbol = production.rhs[item.dot]
                    target = transitions.get((state_id, symbol))
                    if target is None:
                        continue

                    if symbol in self.terminals:
                        self._add_action(
                            action_table,
                            state_id,
                            symbol,
                            {
                                "type": "shift",
                                "to_state": target,
                                "repr": f"s{target}",
                            },
                            conflicts,
                        )
                    else:
                        goto_table[state_id][symbol] = target
                else:
                    if production.lhs == self.augmented_start and item.lookahead == ENDMARK:
                        self._add_action(
                            action_table,
                            state_id,
                            ENDMARK,
                            {
                                "type": "accept",
                                "repr": "acc",
                            },
                            conflicts,
                        )
                    else:
                        self._add_action(
                            action_table,
                            state_id,
                            item.lookahead,
                            {
                                "type": "reduce",
                                "production": item.prod_index,
                                "repr": f"r{item.prod_index}",
                            },
                            conflicts,
                        )

        terminals_for_table = sorted(t for t in self.terminals)
        nonterminals_for_table = sorted(nt for nt in self.nonterminals if nt != self.augmented_start)

        table_rows = []
        for state_id in range(len(states)):
            action_row = {
                terminal: action_table[state_id].get(terminal, {}).get("repr", "")
                for terminal in terminals_for_table
            }
            goto_row = {
                nonterminal: goto_table[state_id].get(nonterminal, "")
                for nonterminal in nonterminals_for_table
            }
            table_rows.append(
                {
                    "state": state_id,
                    "action": action_row,
                    "goto": goto_row,
                }
            )

        serialized_states = []
        for state_id, state in enumerate(states):
            items_payload = []
            for item in sorted(state, key=lambda it: (it.prod_index, it.dot, it.lookahead)):
                production = self.productions[item.prod_index]
                rhs = list(production.rhs)
                dotted_rhs = rhs[:]
                dotted_rhs.insert(item.dot, ".")
                items_payload.append(
                    {
                        "production": item.prod_index,
                        "item": f"{production.lhs} -> {' '.join(dotted_rhs)} , {item.lookahead}",
                        "lookahead": item.lookahead,
                    }
                )

            transition_payload = {
                symbol: target
                for (src_state, symbol), target in transitions.items()
                if src_state == state_id
            }

            serialized_states.append(
                {
                    "id": state_id,
                    "items": items_payload,
                    "transitions": dict(sorted(transition_payload.items())),
                }
            )

        productions_payload = []
        for index, production in enumerate(self.productions):
            productions_payload.append(
                {
                    "id": index,
                    "lhs": production.lhs,
                    "rhs": list(production.rhs),
                    "display": f"{production.lhs} -> {' '.join(production.rhs)}",
                }
            )

        return {
            "grammar": {
                "start_symbol": self.start_symbol,
                "augmented_start": self.augmented_start,
                "terminals": terminals_for_table,
                "nonterminals": nonterminals_for_table,
            },
            "productions": productions_payload,
            "states": serialized_states,
            "action_table": {str(i): action_table[i] for i in range(len(states))},
            "goto_table": {str(i): goto_table[i] for i in range(len(states))},
            "table_rows": table_rows,
            "conflicts": conflicts,
            "summary": {
                "states": len(states),
                "productions": len(self.productions),
                "conflict_count": len(conflicts),
                "is_lr1": len(conflicts) == 0,
            },
        }


def build_mini_language_lr1_table() -> Dict[str, object]:
    productions = [
        ("program", ["statement_list"]),
        ("statement_list", ["statement_list", "statement"]),
        ("statement_list", ["statement"]),
        ("statement", ["declaration"]),
        ("statement", ["assignment"]),
        ("statement", ["if_statement"]),
        ("statement", ["while_statement"]),
        ("statement", ["print_statement"]),
        ("declaration", ["LET", "ID", "ASSIGN", "expression", "SEMICOLON"]),
        ("assignment", ["ID", "ASSIGN", "expression", "SEMICOLON"]),
        (
            "if_statement",
            ["IF", "LPAREN", "expression", "RPAREN", "LBRACE", "statement_list", "RBRACE"],
        ),
        (
            "if_statement",
            [
                "IF",
                "LPAREN",
                "expression",
                "RPAREN",
                "LBRACE",
                "statement_list",
                "RBRACE",
                "ELSE",
                "LBRACE",
                "statement_list",
                "RBRACE",
            ],
        ),
        (
            "while_statement",
            ["WHILE", "LPAREN", "expression", "RPAREN", "LBRACE", "statement_list", "RBRACE"],
        ),
        ("print_statement", ["PRINT", "LPAREN", "expression", "RPAREN", "SEMICOLON"]),
        ("expression", ["expression", "PLUS", "expression"]),
        ("expression", ["expression", "MINUS", "expression"]),
        ("expression", ["expression", "TIMES", "expression"]),
        ("expression", ["expression", "DIVIDE", "expression"]),
        ("expression", ["expression", "MODULO", "expression"]),
        ("expression", ["expression", "EQ", "expression"]),
        ("expression", ["expression", "NE", "expression"]),
        ("expression", ["expression", "LT", "expression"]),
        ("expression", ["expression", "GT", "expression"]),
        ("expression", ["expression", "LE", "expression"]),
        ("expression", ["expression", "GE", "expression"]),
        ("expression", ["LPAREN", "expression", "RPAREN"]),
        ("expression", ["NUMBER"]),
        ("expression", ["ID"]),
    ]

    generator = LR1TableGenerator(
        productions=productions,
        start_symbol="program",
        terminals=set(lexer_tokens),
    )
    return generator.build()
