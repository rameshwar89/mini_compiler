class Executor:
    def __init__(self):
        self.variables = {}
        self.output = []
        self.pc = 0
        self.code = []
        self.user_variables = set()
    
    def execute(self, code):
        self.variables = {}
        self.output = []
        self.pc = 0
        self.code = code
        self.user_variables = set()
        
        try:
            while self.pc < len(self.code):
                current_instruction = self.code[self.pc]
                self._execute_instruction(current_instruction)
                self.pc += 1
            
            final_user_variables = {}
            for var_name, var_value in self.variables.items():
                if var_name in self.user_variables:
                    final_user_variables[var_name] = var_value
            
            return {
                'output': self.output,
                'variables': final_user_variables,
                'success': True
            }
        except Exception as error:
            return {
                'output': self.output,
                'variables': {},
                'success': False,
                'error': str(error)
            }
    
    def _execute_instruction(self, instruction):
        if instruction.endswith(':'):
            return
        
        if instruction.startswith('print '):
            what_to_print = instruction[6:].strip()
            value = self._get_value(what_to_print)
            self.output.append(str(value))
            return
        
        if instruction.startswith('goto '):
            label_name = instruction[5:].strip()
            label_position = self._find_label(label_name)
            self.pc = label_position - 1
            return
        
        if instruction.startswith('if_false '):
            parts = instruction.split()
            condition_var = parts[1]
            condition_value = self._get_value(condition_var)
            
            if not condition_value:
                label_name = parts[3]
                label_position = self._find_label(label_name)
                self.pc = label_position - 1
            return
        
        if '=' in instruction:
            left_side, right_side = instruction.split('=', 1)
            var_name = left_side.strip()
            expression = right_side.strip()
            
            is_temporary = var_name.startswith('t') and var_name[1:].isdigit()
            if not is_temporary:
                self.user_variables.add(var_name)
            
            value = self._evaluate_expression(expression)
            self.variables[var_name] = value
    
    def _evaluate_expression(self, expr):
        expr = expr.strip()
        
        ops = {
            '==': lambda l, r: 1 if l == r else 0,
            '!=': lambda l, r: 1 if l != r else 0,
            '<=': lambda l, r: 1 if l <= r else 0,
            '>=': lambda l, r: 1 if l >= r else 0,
            '<': lambda l, r: 1 if l < r else 0,
            '>': lambda l, r: 1 if l > r else 0,
            '+': lambda l, r: l + r,
            '-': lambda l, r: l - r,
            '*': lambda l, r: l * r,
            '/': lambda l, r: l // r if r != 0 else 0,
            '%': lambda l, r: l % r if r != 0 else 0,
        }
        
        for op in ['==', '!=', '<=', '>=']:
            if op in expr:
                left, right = expr.split(op, 1)
                return ops[op](self._get_value(left.strip()), self._get_value(right.strip()))
        
        for op in ['<', '>', '+', '-', '*', '/', '%']:
            if op in expr:
                left, right = expr.split(op, 1)
                return ops[op](self._get_value(left.strip()), self._get_value(right.strip()))
        
        return self._get_value(expr)
    
    def _get_value(self, name):
        name = name.strip()
        
        try:
            return int(name)
        except ValueError:
            pass
        
        if name in self.variables:
            return self.variables[name]
        
        raise RuntimeError(f"Undefined variable: {name}")
    
    def _find_label(self, label):
        target_label = f"{label}:"
        
        for index, instruction in enumerate(self.code):
            if instruction == target_label:
                return index
        
        raise RuntimeError(f"Label not found: {label}")

def execute_code(intermediate_code):
    executor = Executor()
    return executor.execute(intermediate_code)
