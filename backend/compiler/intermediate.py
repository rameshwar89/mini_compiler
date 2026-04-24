class IntermediateCodeGenerator:
    def __init__(self):
        self.code = []
        self.temp_count = 0
        self.label_count = 0
    
    def new_temp(self):
        temp = f"t{self.temp_count}"
        self.temp_count += 1
        return temp
    
    def new_label(self):
        label = f"L{self.label_count}"
        self.label_count += 1
        return label
    
    def emit(self, instruction):
        self.code.append(instruction)
    
    def generate(self, parse_tree):
        self.code = []
        self.temp_count = 0
        self.label_count = 0
        
        if parse_tree['type'] == 'Program':
            for statement in parse_tree['statements']:
                self._generate_statement(statement)
        
        return self.code
    
    def _generate_statement(self, statement):
        if statement['type'] == 'Declaration':
            expression_result = self._generate_expression(statement['value'])
            self.emit(f"{statement['name']} = {expression_result}")
        
        elif statement['type'] == 'Assignment':
            expression_result = self._generate_expression(statement['value'])
            self.emit(f"{statement['name']} = {expression_result}")
        elif statement['type'] == 'PrintStatement':
            expression_result = self._generate_expression(statement['value'])
            self.emit(f"print {expression_result}")
        
        elif statement['type'] == 'IfStatement':
            condition_temp = self._generate_expression(statement['condition'])
            else_label = self.new_label()
            end_label = self.new_label()
            
            self.emit(f"if_false {condition_temp} goto {else_label}")
            
            for then_statement in statement['then_branch']:
                self._generate_statement(then_statement)
            
            if statement.get('else_branch'):
                self.emit(f"goto {end_label}")
                self.emit(f"{else_label}:")
                for else_statement in statement['else_branch']:
                    self._generate_statement(else_statement)
                self.emit(f"{end_label}:")
            else:
                self.emit(f"{else_label}:")
        
        elif statement['type'] == 'WhileStatement':
            start_label = self.new_label()
            end_label = self.new_label()
            
            self.emit(f"{start_label}:")
            condition_temp = self._generate_expression(statement['condition'])
            self.emit(f"if_false {condition_temp} goto {end_label}")
            
            for body_statement in statement['body']:
                self._generate_statement(body_statement)
            
            self.emit(f"goto {start_label}")
            self.emit(f"{end_label}:")
    
    def _generate_expression(self, expression):
        if expression['type'] == 'Number':
            return str(expression['value'])
        
        elif expression['type'] == 'Identifier':
            return expression['name']
        
        elif expression['type'] == 'BinaryOp':
            left_value = self._generate_expression(expression['left'])
            right_value = self._generate_expression(expression['right'])
            temp_name = self.new_temp()
            self.emit(f"{temp_name} = {left_value} {expression['operator']} {right_value}")
            return temp_name
        
        return None

def generate_intermediate_code(parse_tree):
    generator = IntermediateCodeGenerator()
    return generator.generate(parse_tree)
