from .. import tokenizer
from .. import node

def simplify_tokens(tokens):
    return [ node.simplify_node(token) for token in tokens ]

def test_tokenize_metadata():
    source = "var x"
    tokens = tokenizer.tokenize(source)
    assert tokens == [
        [ { "position": 0, "source": source, "match": "var" }, node.ntype_ident, "var" ],
        [ { "position": 4, "source": source, "match": "x" }, node.ntype_ident, "x" ],
        [ None, node.ntype_terminator, "\n" ],
    ]

def test_tokenize_doc_comments():
    tokens = tokenizer.tokenize("--- a doc comment ---")
    assert simplify_tokens(tokens) == [ 
        [ node.ntype_doc, " a doc comment "],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_comments():
    tokens = tokenizer.tokenize("-- a comment")
    assert simplify_tokens(tokens) == [
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_whitespace():
    tokens = tokenizer.tokenize("\t  \n\n")
    assert simplify_tokens(tokens) == [
        [ node.ntype_terminator, "\n" ],
        [ node.ntype_terminator, "\n" ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_punctuation():
    tokens = tokenizer.tokenize(",:()[]{}")
    assert simplify_tokens(tokens) == [
        [ node.ntype_token, "," ],
        [ node.ntype_token, ":" ],
        [ node.ntype_token, "(" ],
        [ node.ntype_token, ")" ],
        [ node.ntype_token, "[" ],
        [ node.ntype_token, "]" ],
        [ node.ntype_token, "{" ],
        [ node.ntype_token, "}" ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_operators():
    tokens = tokenizer.tokenize("== /= => -> = <= < >= > + - * / ^ ... .. .")
    assert simplify_tokens(tokens) == [
        [ node.ntype_token, "==" ],
        [ node.ntype_token, "/=" ],
        [ node.ntype_token, "=>" ],
        [ node.ntype_token, "->" ],
        [ node.ntype_token, "=" ],
        [ node.ntype_token, "<=" ],
        [ node.ntype_token, "<" ],
        [ node.ntype_token, ">=" ],
        [ node.ntype_token, ">" ],
        [ node.ntype_token, "+" ],
        [ node.ntype_token, "-" ],
        [ node.ntype_token, "*" ],
        [ node.ntype_token, "/" ],
        [ node.ntype_token, "^" ],
        [ node.ntype_token, "..." ],
        [ node.ntype_token, ".." ],
        [ node.ntype_token, "." ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_binary_numbers():
    tokens = tokenizer.tokenize("0b101011 0B11_01")
    assert simplify_tokens(tokens) == [
        [ node.ntype_number, 0b101011 ],
        [ node.ntype_number, 0B1101 ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_octal_numbers():
    tokens = tokenizer.tokenize("0o77623 0O5_51")
    assert simplify_tokens(tokens) == [
        [ node.ntype_number, 0o77623 ],
        [ node.ntype_number, 0O551 ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_hexidecimal_numbers():
    tokens = tokenizer.tokenize("0xff45A 0XA90_FF2")
    assert simplify_tokens(tokens) == [
        [ node.ntype_number, 0xff45a ],
        [ node.ntype_number, 0xa90ff2 ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_decimal_numbers():
    tokens = tokenizer.tokenize("4310 123_543_999")
    assert simplify_tokens(tokens) == [
        [ node.ntype_number, 4310 ],
        [ node.ntype_number, 123543999 ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_floats():
    tokens = tokenizer.tokenize("3.14 1.1e-4 12E4_5 0.1_e+1_")
    assert simplify_tokens(tokens) == [
        [ node.ntype_number, 3.14 ],
        [ node.ntype_number, 1.1e-4 ],
        [ node.ntype_number, 12E45 ],
        [ node.ntype_number, 0.1e+1 ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_mstring():
    tokens = tokenizer.tokenize('"""\nmulti\\tline\\tstring\n"""')
    assert simplify_tokens(tokens) == [
        [ node.ntype_string, "\nmulti\tline\tstring\n" ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_string():
    tokens = tokenizer.tokenize('"string\\n"')
    assert simplify_tokens(tokens) == [
        [ node.ntype_string, "string\n" ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_raw_mstring():
    tokens = tokenizer.tokenize("'''\nraw string\\t'''")
    assert simplify_tokens(tokens) == [
        [ node.ntype_string, "\nraw string\\t" ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_raw_string():
    tokens = tokenizer.tokenize("'raw string\\t'")
    assert simplify_tokens(tokens) == [
        [ node.ntype_string, "raw string\\t" ],
        [ node.ntype_terminator, "\n" ],
    ]

def test_tokenize_ident():
    tokens = tokenizer.tokenize("i variable_snake_case camelCase _ 𝜋2 λ βeta_version")
    assert simplify_tokens(tokens) == [
        [ node.ntype_ident, "i" ],
        [ node.ntype_ident, "variable_snake_case" ],
        [ node.ntype_ident, "camelCase" ],
        [ node.ntype_ident, "_" ],
        [ node.ntype_ident, "𝜋2" ],
        [ node.ntype_ident, "λ" ],
        [ node.ntype_ident, "βeta_version" ],
        [ node.ntype_terminator, "\n" ],
    ]