from .environment import Environment
from .describer import describe
from ..language.node import NodeType

class Eval:

    def __init__(self, python_value, returned=False, thrown=False, yielded=False):
        self.python_value = python_value
        self.returned = returned
        self.thrown = thrown
        self.yielded = yielded
        self.inflight = returned or thrown or yielded

class EvalContext:

    def __init__(self, call_stack, environment, exports):
        self.call_stack = call_stack
        self.environment = environment
        self.exports = exports

    def new_scope(self):
        return EvalContext(
            self.call_stack, 
            Environment(self.environment),
            self.exports,
        )

def eval_node(node, ctx):
    return {
        NodeType.module: eval_module,
        NodeType.declare: eval_declare,
        # NodeType.returns: eval_return,
        # NodeType.yields: eval_yields,
        # NodeType.extends: eval_extends,
        # NodeType.throws: eval_throws,
        NodeType.assign: eval_assign,
        NodeType.listexp: eval_listexp,
        # NodeType.mapexp: eval_mapexp,
        # NodeType.pair: eval_pair,
        # NodeType.elsepat: eval_elsepat,
        NodeType.string: eval_literal,
        NodeType.number: eval_literal,
        NodeType.boolean: eval_literal,
        NodeType.nothing: eval_literal,
        NodeType.identifier: eval_identifier,
        NodeType.ifexp: eval_ifexp,
        NodeType.whileexp: eval_whileexp,
        NodeType.matchexp: eval_matchexp,
        NodeType.forexp: eval_forexp,
        # NodeType.classexp: eval_classexp,
        # NodeType.tryexp: eval_tryexp,
        NodeType.block: eval_block,
        NodeType.function: eval_function,
        # NodeType.generator: eval_generator,
        # NodeType.case: eval_case,
        # NodeType.patterns: eval_patterns,
        NodeType.orexp: eval_orexp,
        NodeType.andexp: eval_andexp,
        NodeType.neqexp: eval_neqexp,
        NodeType.eqexp: eval_eqexp,
        NodeType.isnotexp: eval_isnotexp,
        NodeType.isexp: eval_isexp,
        NodeType.ltexp: eval_ltexp,
        NodeType.lteexp: eval_lteexp,
        NodeType.gtexp: eval_gtexp,
        NodeType.gteexp: eval_gteexp,
        NodeType.notinexp: eval_notinexp,
        NodeType.inexp: eval_inexp,
        NodeType.addexp: eval_addexp,
        NodeType.subexp: eval_subexp,
        NodeType.mulexp: eval_mulexp,
        NodeType.divexp: eval_divexp,
        NodeType.powexp: eval_powexp,
        NodeType.rangeexp: eval_rangeexp,
        NodeType.notexp: eval_notexp,
        NodeType.posexp: eval_posexp,
        NodeType.negexp: eval_negexp,
        # NodeType.spreadexp: eval_spreadexp,
        NodeType.call: eval_call,
        NodeType.access: eval_access,
    }[node.node_type](node, ctx)

def error(node, ctx, message):
    ctx.call_stack.append(node)
    return dict(
        message=message,
        stack=ctx.call_stack,
    )

def test(value):
    return value is not False and value is not None

def match_pattern(pattern, expression, bindings=None):
    # TODO 
    # - range patterns
    # - spread patterns
    if bindings is None:
        bindings = dict()
    if pattern.node_type in [ 
        NodeType.nothing,
        NodeType.boolean,
        NodeType.number,
        NodeType.string,
    ]:
        if pattern.value != expression:
            return None
    elif pattern.node_type == NodeType.identifier:
        if pattern.value in bindings:
            if bindings[pattern.value] == expression:
                return None
        bindings[pattern.value] = expression
    elif pattern.node_type == NodeType.listexp:
        if type(expression) is not list:
            return None
        if len(pattern.args) > len(expression):
            return None
        for p, e in zip(pattern.args, expression):
            if not match_pattern(p, e, bindings):
                return None
    elif pattern.node_type == NodeType.mapexp:
        if type(expression) is not map:
            return None
        if len(pattern.args) > len(expression):
            return None
        for pair in pattern.args:
            # TODO
            pass
    elif pattern.node_type == NodeType.elsepat:
        pass
    else:
        raise Exception("Unknown pattern: " + repr(pattern))
    return bindings

def match_patterns(patterns, expressions):
    # TODO handle spread
    if len(patterns.args) != len(expressions):
        return None
    bindings = dict()
    for p, e in zip(patterns.args, expressions):
        if match_pattern(p, e, bindings) is None:
            return None
    return bindings

def eval_module(node, ctx):
    module_ctx = ctx.new_scope()
    for statement in node.args:
        eval_node(statement, module_ctx)
    return eval_node(module_ctx.exports)

def eval_declare(node, ctx):
    pattern, expression_node, doc = node.args
    expression = eval_node(expression_node, ctx)
    if expression.inflight: return expression
    binding = match_pattern(pattern, expression.python_value)
    if binding is None:
        return Eval(error(node, ctx, "cannot match declaration"), thrown=True)
    ctx.environment.merge(binding)
    return Eval(None)

def eval_assign(node, ctx):
    identifier, expression_node = node.args
    expression = eval_node(expression_node, ctx)
    if expression.inflight: return expression
    ctx.environment.assign(identifier.value, expression.python_value)
    return Eval(None)

def eval_listexp(node, ctx):
    # TODO handle spread
    element_nodes = node.args
    elements = []
    for element_node in element_nodes:
        element = eval_node(element_node, ctx)
        if element.inflight: return element
        elements.append(element.python_value)
    return elements

def eval_literal(node, ctx):
    return Eval(node.value)

def eval_ifexp(node, ctx):
    condition_node, then_node, else_node = node.args
    condition = eval_node(condition_node, ctx)
    if condition.inflight: return condition
    if test(condition.python_value):
        return eval_node(then_node, ctx)
    else:
        return eval_node(else_node, ctx)

def eval_whileexp(node, ctx):
    condition_node, while_node = node.args
    result = None
    condition = eval_node(condition_node, ctx)
    while test(condition.python_value):
        result = eval_node(while_node, ctx)
        if result.inflight: return result
    return result

def eval_matchexp(node, ctx):
    expression = eval_node(node.value, ctx)
    if expression.inflight: return expression
    cases = node.args[1:]
    for case in cases:
        patterns, guard_node, body_node = case.args
        assert len(patterns.args) == 1
        bindings = match_pattern(patterns.value, expression)
        if bindings is None:
            continue
        case_ctx = ctx.new_scope()
        case_ctx.environment.merge(bindings)
        if guard_node is not None:
            guard = eval_node(guard_node, case_ctx)
            if guard.inflight: return guard
            if not test(guard.python_value):
                continue
        return eval_node(body_node, case_ctx)
    return Eval(error(node, ctx, "Failed to match expression"), thrown=True)

def eval_forexp(node, ctx):
    pattern, expression_node, if_guard_node, while_guard_node, block_node = node.args
    expression = eval_node(expression, ctx)
    if expression.inflight: return expression
    result = []
    for e in expression.python_value:
        bindings = match_pattern(pattern, e)
        if bindings is None:
            return Eval(error(node, ctx, "failed to match pattern"), thrown=True)
        for_ctx = ctx.new_scope()
        for_ctx.environment.merge(bindings)
        if if_guard_node is not  None:
            if_guard = eval_node(if_guard_node, for_ctx)
            if if_guard.inflight: return if_guard
            if not test(if_guard.python_value):
                continue
        if while_guard_node is not None:
            while_guard = eval_node(while_guard_node, for_ctx)
            if while_guard.inflight: return while_guard
            if not test(while_guard.python_value):
                break
        block = eval_node(block_node, for_ctx)
        if block.inflight: return block
        result.append(block.python_value)
    return Eval(result)

def eval_block(node, ctx):
    block_ctx = ctx.new_scope()
    result = Eval(None)
    for statement in node.args:
        result = eval_node(statement, block_ctx)
        if result.inflight: return result
    return result

def eval_function(node, ctx):
    cases = node.args
    def function_wrapper(*args):
        for case in cases:
            patterns, guard_node, body_node = case.args
            bindings = match_patterns(patterns, args)
            if bindings is None:
                continue
            function_ctx = ctx.new_scope()
            function_ctx.environment.merge(bindings)
            if guard_node is not None:
                guard = eval_node(guard_node, function_ctx)
                if guard.inflight: return guard
                if not test(guard.python_value):
                    continue
            return eval_node(body_node, function_ctx)
        return Eval(error("Failed to match " + describe(args)), thrown=True)
    return Eval(function_wrapper)

def eval_identifier(node, ctx):
    return Eval(ctx.environment.get(node.value))

def eval_orexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight or test(left.python_value):
        return left
    return Eval(right_node, ctx)

def eval_andexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight or not test(left.python_value):
        return left
    return Eval(right_node, ctx)

def eval_neqexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value != right.python_value)

def eval_eqexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value == right.python_value)

def eval_isnotexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value is not right.python_value)

def eval_isexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value is right.python_value)

def eval_ltexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value < right.python_value)

def eval_lteexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value <= right.python_value)

def eval_gtexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value > right.python_value)

def eval_gteexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value >= right.python_value)

def eval_notinexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value not in right.python_value)

def eval_inexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value in right.python_value)

def eval_addexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value + right.python_value)

def eval_subexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value - right.python_value)

def eval_mulexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value * right.python_value)

def eval_divexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value / right.python_value)

def eval_powexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(left.python_value ** right.python_value)

def eval_rangeexp(node, ctx):
    left_node, right_node = node.args
    left = eval_node(left_node, ctx)
    if left.inflight: return left
    right = eval_node(right_node, ctx)
    if right.inflight: return right
    return Eval(list(range(left.python_value, right.python_value)))

def eval_notexp(node, ctx):
    value = eval_node(node.value, ctx)
    if value.inflight: return value
    return Eval(not value.python_value)

def eval_posexp(node, ctx):
    value = eval_node(node.value, ctx)
    if value.inflight: return value
    return Eval(+value.python_value)

def eval_negexp(node, ctx):
    value = eval_node(node.value, ctx)
    if value.inflight: return value
    return Eval(-value.python_value)

def eval_call(node, ctx):
    # TODO spread calls
    function = eval_node(node.value, ctx)
    if function.inflight: return function
    ctx.call_stack.append(node)
    args = []
    for arg_node in node.args[1:]:
        arg = eval_node(arg_node, ctx)
        if arg.inflight: return arg
        args.append(arg.python_value)
    result = function.python_value(*args)
    if result.thrown: return result
    ctx.call_stack.pop()
    return Eval(result.python_value)

def eval_access(node, ctx):
    # TODO range access
    value_node, key_node = node.args
    value = eval_node(value_node, ctx)
    if value.inflight: return value
    if type(value) is list and key_node.node_type == NodeType.rangeexp:
        start_node, end_node = key_node.args
        start = eval_node(start_node, ctx)
        if start.inflight: return start
        end = eval_node(end_node, ctx)
        if end.inflight: return end
        return Eval(value[start.python_value:end.python_value])
    key = eval_node(key_node, ctx)
    if key.inflight: return key
    return Eval(value[key.python_value])