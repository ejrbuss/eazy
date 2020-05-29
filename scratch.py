import eazy.language.node as node
import eazy.language.parser as parser
import eazy.language.tokenizer as tokenizer

def print_tokens(tokens):
    return '\n'.join(node.print_node(token) for token in tokens)

def example(source):
    print(' -- Source -- ')
    print(source)
    tokens = tokenizer.tokenize(source)
    print(' -- Tokens -- ')
    print(print_tokens(tokens))
    ast = parser.parse(tokens)
    print(' -- AST -- ')
    print(node.print_node(ast))

example('3')
example('3 + 4')
example('print("hello, world")')
example('if True then { True } else { False }')
example('''
var x = 4
x = x + 1
''')
example('''
if x > 0 then {
    var y = x + 2 * 4
    return foo(y)(x)
} else {
    while (True) do {
        throw Error("some error")
    }
}
''')
example('5 ^ 3 - 2')
example('3..5 - -6')

example('''
-- one line comment
---
multi line comment
---
---
doc comment
---
var x = 4
''')

example('''
---
A doc string
---
var min = Function {
    n1, n2         => if n1 < n2 then { n1 } else { n2 },
    ...ns          => min(ns),
    List [ ...ns ] => List.reduce(min, ns),
}
''')

print(node.simplify_node(parser.parse(tokenizer.tokenize('var x = 4 + 4'))))