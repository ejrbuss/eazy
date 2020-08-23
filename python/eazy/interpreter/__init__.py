from ..language import parse
from .interpreter import EvalContext, eval_node

def eval_ast(ast, env):
    ctx = EvalContext([], env, [])
    result = eval_node(ast, ctx)
    return result.python_value

def eval_string(source, stack, env):
    return eval(parse(source), stack, env)