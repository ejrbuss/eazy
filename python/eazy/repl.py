import readline
import traceback

from .language import parse
from .interpreter import eval_ast
from .interpreter.describer import describe
from .interpreter.environment import Environment

example = """
match 4 with { 1 => 1, 2 => 2, 3 => 3, n => n + 1 }
"""

def repl():
    env = Environment()
    env.merge(dict(
        count = lambda xs : len(xs),
        mod = lambda a, b : a % b,
    ))
    while True:
        readline.insert_text("eazy> ")
        readline.redisplay()
        source = input("eazy> ")
        if not source: continue
        try:
            ast = parse(source)
            print(describe(eval_ast(ast.value, env)))
        except Exception as err:
            traceback.print_exc()
