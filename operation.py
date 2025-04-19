from enum import Enum, auto
from dataclasses import dataclass
from typing import Union
import random

class Operator(Enum):
    ADD = '+'
    SUBTRACT = '-'
    MULTIPLY = '*'
    DIVIDE = '/'

OperandType = Union[int, float, 'Operation']

@dataclass
class Operation:
    operator: Operator
    left_operand: OperandType
    right_operand: OperandType

    # 3. Recursive calculate method
    def calculate(self) -> Union[int, float]:
        if isinstance(self.left_operand, Operation):
            left_val = self.left_operand.calculate()
        else:
            left_val = self.left_operand

        # Evaluate right operand recursively if it's an Operation
        if isinstance(self.right_operand, Operation):
            right_val = self.right_operand.calculate()
        else:
            right_val = self.right_operand

        # Perform the operation
        op_symbol = self.operator.value
        if op_symbol == '+':
            return left_val + right_val
        elif op_symbol == '-':
            return left_val - right_val
        elif op_symbol == '*':
            return left_val * right_val
        elif op_symbol == '/':
            if right_val == 0:
                raise ZeroDivisionError("Division by zero in expression")
            return left_val / right_val
        else:
            raise ValueError(f"Unsupported operator: {self.operator}")

    def __str__(self):
        # Optional: Nice string representation
        return f"({self.left_operand} {self.operator.value} {self.right_operand})"
    

def gen_operation(depth=0, max_depth=5):
    op = random.choice(list(Operator))

    # Pick which operands will be recursive
    left_dive = False
    right_dive = False

    if random.random() > 0.5:
        left_dive = True
    if random.random() > 0.5:
        right_dive = True
    if not left_dive and not right_dive:
        if random.random() > 0.5:
            left_dive = True
        else:
            right_dive = True
    
    if depth == max_depth:
        left_dive = False
        right_dive = False

    left_operand = None
    right_operand = None
    if left_dive:
        left_operand = gen_operation(depth=depth+1, max_depth=max_depth)
    else:
        left_operand = round(random.random() * 10 + 1, 2)

    if right_dive:
        right_operand = gen_operation(depth=depth+1, max_depth=max_depth)
    else:
        right_operand = round(random.random() * 10 + 1, 2)

    return Operation(operator=op, left_operand=left_operand, right_operand=right_operand)
            
    
def gen_dataset(num_samples=30, options=None):
    choices = [2, 3, 4]
    if options is not None:
        choices = options
    dataset = []
    for i in range(num_samples):
        dataset.append(gen_operation(max_depth=random.choice(choices)))
    return dataset
