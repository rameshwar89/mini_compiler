"""
Code Executor
Executes the intermediate code and produces output
"""

class Executor:
    def __init__(self):
        # Store all variables (both user-defined and temporary ones)
        self.variables = {}
        
        # Collect print outputs here
        self.output = []
        
        # Program Counter - which instruction are we executing?
        self.pc = 0
        
        # The list of intermediate code instructions
        self.code = []
        
        # Keep track of user-declared variables (not temporary ones like t0, t1)
        self.user_variables = set()
    
    def execute(self, code):
        """Execute intermediate code line by line"""
        # Reset everything for fresh execution
        self.variables = {}
        self.output = []
        self.pc = 0
        self.code = code
        self.user_variables = set()
        
        try:
            # Execute each instruction one by one
            while self.pc < len(self.code):
                current_instruction = self.code[self.pc]
                self._execute_instruction(current_instruction)
                self.pc += 1  # Move to next instruction
            
            # Only show user variables, hide temporary ones (t0, t1, etc.)
            final_user_variables = {}
            for var_name, var_value in self.variables.items():
                if var_name in self.user_variables:
                    final_user_variables[var_name] = var_value
            
            # Success! Return results
            return {
                'output': self.output,
                'variables': final_user_variables,
                'success': True
            }
        except Exception as error:
            # Something went wrong during execution
            return {
                'output': self.output,
                'variables': {},
                'success': False,
                'error': str(error)
            }
    
    def _execute_instruction(self, instruction):
        """Execute a single instruction based on its type"""
        
        # CASE 1: Label (like "L0:")
        # Labels are just markers for jumps - we skip them
        if instruction.endswith(':'):
            return
        
        # CASE 2: Print statement (like "print x")
        if instruction.startswith('print '):
            # Extract what to print (the part after "print ")
            what_to_print = instruction[6:].strip()
            value = self._get_value(what_to_print)
            self.output.append(str(value))
            return
        
        # CASE 3: Unconditional jump (like "goto L1")
        if instruction.startswith('goto '):
            # Extract the label name
            label_name = instruction[5:].strip()
            # Find where that label is and jump there
            label_position = self._find_label(label_name)
            self.pc = label_position - 1  # -1 because pc will be incremented after
            return
        
        # CASE 4: Conditional jump (like "if_false t0 goto L1")
        if instruction.startswith('if_false '):
            # Split into parts: ["if_false", "t0", "goto", "L1"]
            parts = instruction.split()
            condition_var = parts[1]
            condition_value = self._get_value(condition_var)
            
            # If condition is false (0), jump to label
            if not condition_value:
                label_name = parts[3]
                label_position = self._find_label(label_name)
                self.pc = label_position - 1  # -1 because pc will be incremented
            return
        
        # CASE 5: Assignment (like "x = 5" or "t0 = x + y")
        if '=' in instruction:
            # Split at '=' to get variable and expression
            left_side, right_side = instruction.split('=', 1)
            var_name = left_side.strip()
            expression = right_side.strip()
            
            # Remember this variable if it's a user variable (not temporary like t0)
            is_temporary = var_name.startswith('t') and var_name[1:].isdigit()
            if not is_temporary:
                self.user_variables.add(var_name)
            
            # Calculate the value and store it
            value = self._evaluate_expression(expression)
            self.variables[var_name] = value
    
    def _evaluate_expression(self, expr):
        """Evaluate a simple expression (no complex precedence needed)"""
        expr = expr.strip()
        
        # parser handling precedence, intermediate code only has
        # simple expressions: either "value" or "left op right"
        
        # Map of operators to their functions
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
        
        # Check multi-char operators first (to avoid '=' matching '==')
        for op in ['==', '!=', '<=', '>=']:
            if op in expr:
                left, right = expr.split(op, 1)
                return ops[op](self._get_value(left.strip()), self._get_value(right.strip()))
        
        # Check single-char operators
        for op in ['<', '>', '+', '-', '*', '/', '%']:
            if op in expr:
                left, right = expr.split(op, 1)
                return ops[op](self._get_value(left.strip()), self._get_value(right.strip()))
        
        # No operator - just a value or variable
        return self._get_value(expr)
    
    def _get_value(self, name):
        """Get the numeric value of something (either a number or variable name)"""
        name = name.strip()
        
        # Is it a number literal? (like "5" or "42")
        try:
            return int(name)
        except ValueError:
            # Not a number, must be a variable name
            pass
        
        # Look up the variable
        if name in self.variables:
            return self.variables[name]
        
        # Variable doesn't exist - error!
        raise RuntimeError(f"Undefined variable: {name}")
    
    def _find_label(self, label):
        """Find where a label is located in the code"""
        # Labels look like "L0:", "L1:", etc.
        target_label = f"{label}:"
        
        # Search through all instructions
        for index, instruction in enumerate(self.code):
            if instruction == target_label:
                return index
        
        # Label not found - this shouldn't happen with correct code
        raise RuntimeError(f"Label not found: {label}")

def execute_code(intermediate_code):
    """Execute intermediate code and return results"""
    executor = Executor()
    return executor.execute(intermediate_code)
