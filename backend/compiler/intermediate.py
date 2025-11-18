"""
Intermediate Code Generator
Generates three-address code (TAC) from AST
"""

class IntermediateCodeGenerator:
    def __init__(self):
        self.code = []
        self.temp_count = 0
        self.label_count = 0
    
    def new_temp(self):
        """Generate a new temporary variable"""
        temp = f"t{self.temp_count}"
        self.temp_count += 1
        return temp
    
    def new_label(self):
        """Generate a new label"""
        label = f"L{self.label_count}"
        self.label_count += 1
        return label
    
    def emit(self, instruction):
        """Add an instruction to the code"""
        self.code.append(instruction)
    
    def generate(self, ast):
        """Generate intermediate code from AST"""
        self.code = []
        self.temp_count = 0
        self.label_count = 0
        
        if ast['type'] == 'Program':
            for stmt in ast['statements']:
                self._generate_statement(stmt)
        
        return self.code
    
    def _generate_statement(self, stmt):
        """Generate code for a statement"""
        if stmt['type'] == 'Declaration':
            result = self._generate_expression(stmt['value'])
            self.emit(f"{stmt['name']} = {result}")
        
        elif stmt['type'] == 'Assignment':
            result = self._generate_expression(stmt['value'])
            self.emit(f"{stmt['name']} = {result}")
        
        elif stmt['type'] == 'PrintStatement':
            result = self._generate_expression(stmt['value'])
            self.emit(f"print {result}")
        
        elif stmt['type'] == 'IfStatement':
            condition_temp = self._generate_expression(stmt['condition'])
            label_else = self.new_label()
            label_end = self.new_label()
            
            self.emit(f"if_false {condition_temp} goto {label_else}")
            
            # Then branch
            for s in stmt['then_branch']:
                self._generate_statement(s)
            
            if stmt.get('else_branch'):
                self.emit(f"goto {label_end}")
                self.emit(f"{label_else}:")
                for s in stmt['else_branch']:
                    self._generate_statement(s)
                self.emit(f"{label_end}:")
            else:
                self.emit(f"{label_else}:")
        
        elif stmt['type'] == 'WhileStatement':
            label_start = self.new_label()
            label_end = self.new_label()
            
            self.emit(f"{label_start}:")
            condition_temp = self._generate_expression(stmt['condition'])
            self.emit(f"if_false {condition_temp} goto {label_end}")
            
            for s in stmt['body']:
                self._generate_statement(s)
            
            self.emit(f"goto {label_start}")
            self.emit(f"{label_end}:")
    
    def _generate_expression(self, expr):
        """Generate code for an expression and return the result temporary"""
        if expr['type'] == 'Number':
            return str(expr['value'])
        
        elif expr['type'] == 'Identifier':
            return expr['name']
        
        elif expr['type'] == 'BinaryOp':
            left = self._generate_expression(expr['left'])
            right = self._generate_expression(expr['right'])
            temp = self.new_temp()
            self.emit(f"{temp} = {left} {expr['operator']} {right}")
            return temp
        
        return None

def generate_intermediate_code(ast):
    """Generate intermediate code from AST"""
    generator = IntermediateCodeGenerator()
    return generator.generate(ast)
