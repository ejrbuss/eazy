import math

from ..tokenizer2 import tokenize
from ..node import Node, NodeType

def test_tokenize_metadata():
    source = "var x"
    tokens = tokenize(source)
    assert tokens[0].meta == dict(position=0, source=source, match="var")
    assert tokens[1].meta == dict(position=4, source=source, match="x")
    assert tokens[2].meta == dict()

def test_tokenize_doc_comments():
    assert tokenize("--- a doc comment ---\nvar") == [
        Node(NodeType.doc, " a doc comment "),
        Node(NodeType.terminator, "\n"),
        Node(NodeType.identifier, "var"),
        Node(NodeType.eof),
    ]

def test_tokenize_comments():
    assert tokenize("-- a comment\n---\na multilne comment\n---") == [
        Node(NodeType.terminator, "\n"),
        Node(NodeType.eof),
    ]

def test_tokenize_whitespace():
    assert tokenize("\t  \n\n") == [
        Node(NodeType.terminator, "\n"),
        Node(NodeType.terminator, "\n"),
        Node(NodeType.eof),
    ]

def test_tokenize_punctuation():
    assert tokenize(",:()[]{}") == [
        Node(NodeType.punctuation, ","),
        Node(NodeType.punctuation, ":"),
        Node(NodeType.punctuation, "("),
        Node(NodeType.punctuation, ")"),
        Node(NodeType.punctuation, "["),
        Node(NodeType.punctuation, "]"),
        Node(NodeType.punctuation, "{"),
        Node(NodeType.punctuation, "}"),
        Node(NodeType.eof),
    ]

def test_tokenize_symbolic_operators():
    assert tokenize("== /= => -> = <= < >= > + - * / ^ ... .. .") == [
        Node(NodeType.operator, "=="),
        Node(NodeType.operator, "/="),
        Node(NodeType.operator, "=>"),
        Node(NodeType.operator, "->"),
        Node(NodeType.operator, "="),
        Node(NodeType.operator, "<="),
        Node(NodeType.operator, "<"),
        Node(NodeType.operator, ">="),
        Node(NodeType.operator, ">"),
        Node(NodeType.operator, "+"),
        Node(NodeType.operator, "-"),
        Node(NodeType.operator, "*"),
        Node(NodeType.operator, "/"),
        Node(NodeType.operator, "^"),
        Node(NodeType.operator, "..."),
        Node(NodeType.operator, ".."),
        Node(NodeType.operator, "."),
        Node(NodeType.eof),
    ]

def test_tokenize_word_operators():
    assert tokenize("not in is not not is in") == [
        Node(NodeType.operator, "not in"),
        Node(NodeType.operator, "is not"),
        Node(NodeType.operator, "not"),
        Node(NodeType.operator, "is"),
        Node(NodeType.operator, "in"),
        Node(NodeType.eof),
    ]

def test_tokenize_binary_numbers():
    assert tokenize("0b101011 0B11_01") == [
        Node(NodeType.number, 0b101011),
        Node(NodeType.number, 0B1101),
        Node(NodeType.eof),
    ]

def test_tokenize_octal_numbers():
    assert tokenize("0o77623 0O5_51") == [
        Node(NodeType.number, 0o77623),
        Node(NodeType.number, 0O551),
        Node(NodeType.eof),
    ]

def test_tokenize_hexidecimal_numbers():
    assert tokenize("0xff45A 0XA90_FF2") == [
        Node(NodeType.number, 0xff45a),
        Node(NodeType.number, 0xa90ff2),
        Node(NodeType.eof),
    ]

def test_tokenize_decimal_numbers():
    assert tokenize("4310 123_543_999") == [
        Node(NodeType.number, 4310),
        Node(NodeType.number, 123543999),
        Node(NodeType.eof),
    ]

def test_tokenize_floats():
    assert tokenize("3.14 1.1e-4 12E4_5 0.1_e+1_ Infinity NaN") == [
        Node(NodeType.number, 3.14),
        Node(NodeType.number, 1.1e-4),
        Node(NodeType.number, 12E45),
        Node(NodeType.number, 0.1e+1),
        Node(NodeType.number, math.inf),
        Node(NodeType.number, math.nan),
        Node(NodeType.eof),
    ]

def test_tokenize_mstring():
    assert tokenize('"""\nmulti\\tline\\tstring\n"""') == [
        Node(NodeType.string, "\nmulti\tline\tstring\n"),
        Node(NodeType.eof),
    ]

def test_tokenize_string():
    assert tokenize('"string\\n"') == [
        Node(NodeType.string, "string\n"),
        Node(NodeType.eof),
    ]

def test_tokenize_raw_mstring():
    assert tokenize("'''\nraw string\\t'''") == [
        Node(NodeType.string, "\nraw string\\t"),
        Node(NodeType.eof),
    ]

def test_tokenize_raw_string():
    assert tokenize("'raw string\\t'") == [
        Node(NodeType.string, "raw string\\t"),
        Node(NodeType.eof),
    ]

def test_tokenize_nothing():
    assert tokenize("Nothing") == [
        Node(NodeType.nothing, None),
        Node(NodeType.eof),
    ]

def test_tokenize_booleans():
    assert tokenize("True False") == [
        Node(NodeType.boolean, True),
        Node(NodeType.boolean, False),
        Node(NodeType.eof),
    ]

def test_tokenize_keywords():
    assert tokenize("if then else do while for match with return yield throw extend try catch finally") == [
        Node(NodeType.keyword, "if"),
        Node(NodeType.keyword, "then"),
        Node(NodeType.keyword, "else"),
        Node(NodeType.keyword, "do"),
        Node(NodeType.keyword, "while"),
        Node(NodeType.keyword, "for"),
        Node(NodeType.keyword, "match"),
        Node(NodeType.keyword, "with"),
        Node(NodeType.keyword, "return"),
        Node(NodeType.keyword, "yield"),
        Node(NodeType.keyword, "throw"),
        Node(NodeType.keyword, "extend"),
        Node(NodeType.keyword, "try"),
        Node(NodeType.keyword, "catch"),
        Node(NodeType.keyword, "finally"),
        Node(NodeType.eof),
    ]

def test_tokenize_ident():
    assert tokenize("i variable_snake_case camelCase _ 𝜋2 λ βeta_version even?") == [
        Node(NodeType.identifier, "i"),
        Node(NodeType.identifier, "variable_snake_case"),
        Node(NodeType.identifier, "camelCase"),
        Node(NodeType.identifier, "_"),
        Node(NodeType.identifier, "𝜋2"),
        Node(NodeType.identifier, "λ"),
        Node(NodeType.identifier, "βeta_version"),
        Node(NodeType.identifier, "even?"),
        Node(NodeType.eof),
    ]