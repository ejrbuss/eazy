from ..parser2 import parse
from ..tokenizer2 import tokenize
from ..node import Node, NodeType

def test_parse_module():
    assert parse(tokenize("")) == Node(NodeType.module)

def test_parse_statments():
    assert parse(tokenize("a")) == Node(NodeType.module,
        Node(NodeType.identifier, "a")
    )
    assert parse(tokenize("a ; b")) == Node(NodeType.module,
        Node(NodeType.identifier, "a"),
        Node(NodeType.identifier, "b"),
    )
    assert parse(tokenize("a \n b")) == Node(NodeType.module,
        Node(NodeType.identifier, "a"),
        Node(NodeType.identifier, "b"),
    )

def test_parse_declaration():
    assert parse(tokenize("var a = b")) == Node(NodeType.module,
        Node(NodeType.declare, 
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
            None,
        ),
    )
    assert parse(tokenize("var List [ a ] = b + c")) == Node(NodeType.module,
        Node(NodeType.declare, 
            Node(NodeType.listexp,
                Node(NodeType.identifier, "a"),
            ),
            Node(NodeType.addexp,
                Node(NodeType.identifier, "b"),
                Node(NodeType.identifier, "c"),
            ),
            None,
        ),
    )
    assert parse(tokenize("--comment\nvar a = b")) == Node(NodeType.module,
        Node(NodeType.declare, 
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
            Node(NodeType.doc, "comment"),
        ),
    )
    assert parse(tokenize("---\ncomment\n---\nvar a = b")) == Node(NodeType.module,
        Node(NodeType.declare, 
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
            Node(NodeType.doc, "\ncomment\n"),
        ),
    )

def test_parse_range_pattern():
    assert parse(tokenize("var 1..2 = a")) == Node(NodeType.module,
        Node(NodeType.declare,
            Node(NodeType.rangeexp,
                Node(NodeType.number, 1),
                Node(NodeType.number, 2),
            ),
            Node(NodeType.identifier, "a"),
            None,
        ),
    )
    assert parse(tokenize("var 1.. = a")) == Node(NodeType.module,
        Node(NodeType.declare,
            Node(NodeType.rangeexp,
                Node(NodeType.number, 1),
                None,
            ),
            Node(NodeType.identifier, "a"),
            None,
        ),
    )
    assert parse(tokenize("var ..2 = a")) == Node(NodeType.module,
        Node(NodeType.declare,
            Node(NodeType.rangeexp,
                None,
                Node(NodeType.number, 2),
            ),
            Node(NodeType.identifier, "a"),
            None,
        ),
    )

def test_parse_spread_pattern():
    assert parse(tokenize("var ...a = b")) == Node(NodeType.module,
        Node(NodeType.declare,
            Node(NodeType.spreadexp,
                Node(NodeType.identifier, "a"),
            ),
            Node(NodeType.identifier, "b"),
            None,
        ),
    )

def test_parse_else_pattern():
    assert parse(tokenize("var else = a")) == Node(NodeType.module,
        Node(NodeType.declare,
            Node(NodeType.elsepat),
            Node(NodeType.identifier, "a"),
            None,
        )
    )

def test_parse_list_literal():
    assert parse(tokenize("List []")) == Node(NodeType.module,
        Node(NodeType.listexp),
    )
    assert parse(tokenize("List [ 1, 2, 3 ]")) == Node(NodeType.module,
        Node(NodeType.listexp,
            Node(NodeType.number, 1),
            Node(NodeType.number, 2),
            Node(NodeType.number, 3),
        ),
    )
    assert parse(tokenize("List [ 1, 2, 3, ...a ]")) == Node(NodeType.module,
        Node(NodeType.listexp,
            Node(NodeType.number, 1),
            Node(NodeType.number, 2),
            Node(NodeType.number, 3),
            Node(NodeType.spreadexp, 
                Node(NodeType.identifier, "a"),
            ),
        ),
    )

def test_parse_map_literal():
    assert parse(tokenize("Map []")) == Node(NodeType.module,
        Node(NodeType.mapexp),
    )
    assert parse(tokenize("Map [ a: b, c ]")) == Node(NodeType.module,
        Node(NodeType.mapexp,
            Node(NodeType.pair, 
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.pair,
                Node(NodeType.identifier, "c"),
                None,
            ),
        ),
    )
    assert parse(tokenize("Map [ a: b, c, ...d ]")) == Node(NodeType.module,
        Node(NodeType.mapexp,
            Node(NodeType.pair, 
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.pair,
                Node(NodeType.identifier, "c"),
                None,
            ),
            Node(NodeType.spreadexp,
                Node(NodeType.identifier, "d"),
            ),
        ),
    )

def test_parse_literal():
    assert parse(tokenize("List [ Nothing, True, 42, \"string\" ]")) == Node(NodeType.module,
        Node(NodeType.listexp,
            Node(NodeType.nothing, None),
            Node(NodeType.boolean, True),
            Node(NodeType.number, 42),
            Node(NodeType.string, "string"),
        )
    )

def test_parse_return_statement():
    assert parse(tokenize("return a")) == Node(NodeType.module,
        Node(NodeType.returns,
            Node(NodeType.identifier, "a"),
        ),
    )

def test_parse_yield_statement():
    assert parse(tokenize("yield a")) == Node(NodeType.module,
        Node(NodeType.yields,
            Node(NodeType.identifier, "a"),
        ),
    )

def test_parse_extend_statement():
    assert parse(tokenize("extend a")) == Node(NodeType.module,
        Node(NodeType.extends,
            Node(NodeType.identifier, "a"),
        ),
    )

def test_parse_throw_statement():
    assert parse(tokenize("throw a")) == Node(NodeType.module,
        Node(NodeType.throws,
            Node(NodeType.identifier, "a"),
        ),
    )

def test_parse_assignment():
    assert parse(tokenize("a = b")) == Node(NodeType.module,
        Node(NodeType.assign,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b")
        ),
    )

def test_parse_if_expression():
    assert parse(tokenize("if a then { b }")) == Node(NodeType.module,
        Node(NodeType.ifexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.block,
                Node(NodeType.identifier, "b"),
            ),
            None,
        ),
    )
    assert parse(tokenize("if a then { b } else { c }")) == Node(NodeType.module,
        Node(NodeType.ifexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.block,
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.block,
                Node(NodeType.identifier, "c"),
            ),
        ),
    )
    assert parse(tokenize("if a then { b } else if c then { d }")) == Node(NodeType.module,
        Node(NodeType.ifexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.block,
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.ifexp,
                Node(NodeType.identifier, "c"),
                Node(NodeType.block,
                    Node(NodeType.identifier, "d"),
                ),
                None,
            ),
        ),
    )

def test_parse_do_expression():
    assert parse(tokenize("do { a }")) == Node(NodeType.module,
        Node(NodeType.block,
            Node(NodeType.identifier, "a")
        ),
    )

def test_parse_while_expression():
    assert parse(tokenize("while a do { b }")) == Node(NodeType.module,
        Node(NodeType.whileexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.block,
                Node(NodeType.identifier, "b"),
            ),
        ),
    )

def test_parse_match_expression():
    assert parse(tokenize("match a with {}")) == Node(NodeType.module,
        Node(NodeType.matchexp,
            Node(NodeType.identifier, "a"),
        ),
    )
    assert parse(tokenize("match a with { b => c }")) == Node(NodeType.module,
        Node(NodeType.matchexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "b"),
                ),
                None,
                Node(NodeType.block, 
                    Node(NodeType.identifier, "c"),
                ),
            ),
        ),
    )
    assert parse(tokenize("match a with { b => c, d, e if f => g }")) == Node(NodeType.module,
        Node(NodeType.matchexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "b"),
                ),
                None,
                Node(NodeType.block, 
                    Node(NodeType.identifier, "c"),
                ),
            ),
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "d"),
                    Node(NodeType.identifier, "e"),
                ),
                Node(NodeType.identifier, "f"),
                Node(NodeType.block, 
                    Node(NodeType.identifier, "g"),
                ),
            ),
        ),
    )

def test_parse_for_expression():
    assert parse(tokenize("for a in b do {}")) == Node(NodeType.module,
        Node(NodeType.forexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
            None,
            None,
            Node(NodeType.block),
        ),
    )
    assert parse(tokenize("for a in b if c do { d }")) == Node(NodeType.module,
        Node(NodeType.forexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
            Node(NodeType.identifier, "c"),
            None,
            Node(NodeType.block,
                Node(NodeType.identifier, "d"),
            ),
        ),
    )
    assert parse(tokenize("for a in b if c while d do { e }")) == Node(NodeType.module,
        Node(NodeType.forexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
            Node(NodeType.identifier, "c"),
            Node(NodeType.identifier, "d"),
            Node(NodeType.block,
                Node(NodeType.identifier, "e"),
            ),
        ),
    )

def test_parse_class_expression():
    assert parse(tokenize("Class {}")) == Node(NodeType.module,
        Node(NodeType.classexp,
            Node(NodeType.case,
                None,
                None,
                Node(NodeType.block),
            ),
        ),
    )
    assert parse(tokenize("Class { a -> b }")) == Node(NodeType.module,
        Node(NodeType.classexp,
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "a"),
                ),
                None,
                Node(NodeType.block,
                    Node(NodeType.identifier, "b"),
                ),
            ),
        ),
    )
    assert parse(tokenize("Class { a, b -> c }")) == Node(NodeType.module,
        Node(NodeType.classexp,
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "a"),
                    Node(NodeType.identifier, "b"),
                ),
                None,
                Node(NodeType.block,
                    Node(NodeType.identifier, "c"),
                ),
            ),
        ),
    )

def test_parse_try_expression():
    assert parse(tokenize("try { a } catch { b }")) == Node(NodeType.module,
        Node(NodeType.tryexp,
            Node(NodeType.block,
                Node(NodeType.identifier, "a"),
            ),
            Node(NodeType.case,
                None,
                None,
                Node(NodeType.block,
                    Node(NodeType.identifier, "b"),
                ),
            ),
            None,
        ),
    )
    assert parse(tokenize("try { a } catch { b } finally { c }")) == Node(NodeType.module,
        Node(NodeType.tryexp,
            Node(NodeType.block,
                Node(NodeType.identifier, "a"),
            ),
            Node(NodeType.case,
                None,
                None,
                Node(NodeType.block,
                    Node(NodeType.identifier, "b"),
                ),
            ),
            Node(NodeType.block,
                Node(NodeType.identifier, "c"),
            ),
        ),
    )

def test_parse_function():
    assert parse(tokenize("Function {}")) == Node(NodeType.module,
        Node(NodeType.function,
            Node(NodeType.case,
                None,
                None,
                Node(NodeType.block),
            ),
        ),
    )
    assert parse(tokenize("Function { a -> }")) == Node(NodeType.module,
        Node(NodeType.function,
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "a")
                ),
                None,
                Node(NodeType.block),
            ),
        ),
    )
    assert parse(tokenize("Function { a, b -> c }")) == Node(NodeType.module,
        Node(NodeType.function,
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "a"),
                    Node(NodeType.identifier, "b"),
                ),
                None,
                Node(NodeType.block,
                    Node(NodeType.identifier, "c"),
                ),
            ),
        ),
    )
    assert parse(tokenize("Function { a, b => c, d if e => f, }")) == Node(NodeType.module,
        Node(NodeType.function,
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "a"),
                    Node(NodeType.identifier, "b"),
                ),
                None,
                Node(NodeType.block,
                    Node(NodeType.identifier, "c"),
                ),
            ),
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "d"),
                ),
                Node(NodeType.identifier, "e"),
                Node(NodeType.block,
                    Node(NodeType.identifier, "f"),
                ),
            ),
        ),
    )

def test_parse_generator():
    assert parse(tokenize("Generator {}")) == Node(NodeType.module,
        Node(NodeType.generator,
            Node(NodeType.case,
                None,
                None,
                Node(NodeType.block),
            ),
        ),
    )
    assert parse(tokenize("Generator { a, b -> c\nd }")) == Node(NodeType.module,
        Node(NodeType.generator,
            Node(NodeType.case,
                Node(NodeType.patterns,
                    Node(NodeType.identifier, "a"),
                    Node(NodeType.identifier, "b"),
                ),
                None,
                Node(NodeType.block,
                    Node(NodeType.identifier, "c"),
                    Node(NodeType.identifier, "d"),
                ),
            ),
        ),
    )

def test_parse_or_expression():
    assert parse(tokenize("a or b")) == Node(NodeType.module,
        Node(NodeType.orexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
        ),
    )
    assert parse(tokenize("a or b or c")) == Node(NodeType.module,
        Node(NodeType.orexp,
            Node(NodeType.orexp,
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.identifier, "c"),
        ),
    )

def test_parse_and_expression():
    assert parse(tokenize("a and b")) == Node(NodeType.module,
        Node(NodeType.andexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
        ),
    )
    assert parse(tokenize("a and b and c")) == Node(NodeType.module,
        Node(NodeType.andexp,
            Node(NodeType.andexp,
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.identifier, "c"),
        ),
    )
    assert parse(tokenize("a and b or c and d")) == Node(NodeType.module,
        Node(NodeType.orexp,
            Node(NodeType.andexp,
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.andexp,
                Node(NodeType.identifier, "c"),
                Node(NodeType.identifier, "d"),
            ),
        ),
    )

def test_parse_relational_expression():
    assert parse(tokenize("a /= b")) == Node(NodeType.module,
        Node(NodeType.neqexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
        ),
    )
    assert parse(tokenize("a /= b == c is not d is e < f <= g > h >= i not in j in k")) == Node(NodeType.module,
        Node(NodeType.inexp,
            Node(NodeType.notinexp,
                Node(NodeType.gteexp,
                    Node(NodeType.gtexp,
                        Node(NodeType.lteexp,
                            Node(NodeType.ltexp,
                                Node(NodeType.isexp,
                                    Node(NodeType.isnotexp,
                                        Node(NodeType.eqexp,
                                            Node(NodeType.neqexp,
                                                Node(NodeType.identifier, "a"),
                                                Node(NodeType.identifier, "b"),
                                            ),
                                            Node(NodeType.identifier, "c"),
                                        ),
                                        Node(NodeType.identifier, "d"),
                                    ),
                                    Node(NodeType.identifier, "e"),
                                ),
                                Node(NodeType.identifier, "f"),
                            ),
                            Node(NodeType.identifier, "g"),
                        ),
                        Node(NodeType.identifier, "h"),
                    ),
                    Node(NodeType.identifier, "i"),
                ),
                Node(NodeType.identifier, "j"),
            ),
            Node(NodeType.identifier, "k"),
        ),
    )
    assert parse(tokenize("a in b and c is not d")) == Node(NodeType.module,
        Node(NodeType.andexp,
            Node(NodeType.inexp,
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.isnotexp,
                Node(NodeType.identifier, "c"),
                Node(NodeType.identifier, "d"),
            ),
        ),
    )

def test_parse_additive_expression():
    assert parse(tokenize("a + b")) == Node(NodeType.module,
        Node(NodeType.addexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
        ),
    )
    assert parse(tokenize("a + b - c")) == Node(NodeType.module,
        Node(NodeType.subexp,
            Node(NodeType.addexp,
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.identifier, "c"),
        ),
    )
    assert parse(tokenize("a + b <= c - d")) == Node(NodeType.module,
        Node(NodeType.lteexp,
            Node(NodeType.addexp,
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.subexp,
                Node(NodeType.identifier, "c"),
                Node(NodeType.identifier, "d"),
            ),
        ),
    )

def test_parse_multiplicative_expression():
    assert parse(tokenize("a * b")) == Node(NodeType.module,
        Node(NodeType.mulexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
        ),
    )
    assert parse(tokenize("a * b / c")) == Node(NodeType.module,
        Node(NodeType.divexp,
            Node(NodeType.mulexp,
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.identifier, "c"),
        ),
    )
    assert parse(tokenize("a * b + c / d")) == Node(NodeType.module,
        Node(NodeType.addexp,
            Node(NodeType.mulexp,
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.divexp,
                Node(NodeType.identifier, "c"),
                Node(NodeType.identifier, "d"),
            ),
        ),
    )

def test_parse_exponential_expression():
    assert parse(tokenize("a^b")) == Node(NodeType.module,
        Node(NodeType.powexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
        ),
    )
    assert parse(tokenize("a^b..c")) == Node(NodeType.module,
        Node(NodeType.powexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.rangeexp,
                Node(NodeType.identifier, "b"),
                Node(NodeType.identifier, "c"),
            ),
        ),
    )
    assert parse(tokenize("a ^ b * c .. d")) == Node(NodeType.module,
        Node(NodeType.mulexp,
            Node(NodeType.powexp,
                Node(NodeType.identifier, "a"),
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.rangeexp,
                Node(NodeType.identifier, "c"),
                Node(NodeType.identifier, "d"),
            ),
        ),
    )

def test_parse_unary_expression():
    assert parse(tokenize("-a")) == Node(NodeType.module,
        Node(NodeType.negexp,
            Node(NodeType.identifier, "a"),
        ),
    )
    assert parse(tokenize("do { -a ; +b ; not c ; ... d }")) == Node(NodeType.module,
        Node(NodeType.block,
            Node(NodeType.negexp,
                Node(NodeType.identifier, "a"),
            ),
            Node(NodeType.posexp,
                Node(NodeType.identifier, "b"),
            ),
            Node(NodeType.notexp,
                Node(NodeType.identifier, "c"),
            ),
            Node(NodeType.spreadexp,
                Node(NodeType.identifier, "d"),
            ),
        ),
    )
    assert parse(tokenize("not a ^ +b")) == Node(NodeType.module,
        Node(NodeType.powexp,
            Node(NodeType.notexp,
                Node(NodeType.identifier, "a"),
            ),
            Node(NodeType.posexp,
                Node(NodeType.identifier, "b"),
            ),
        ),
    )

def test_parse_calls():
    pass

def test_parse_accesses():
    pass

def test_parse_simple_expressions():
    pass

def test_parse_program():
    pass