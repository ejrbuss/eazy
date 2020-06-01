from ..parsing import (
    Stream,
    ParsingContext,
    Parser,
    must,
    peek_value,
    parse_value,
    parse_node_type,
    parse_many,
    parse_many_seperated_by,
    parse_choice,
    parse_choice_of_values,
    parse_choice_of_node_types,
    parse_binary_operator,
)
from ..node import Node, NodeType
from ..tokenizer2 import tokenize

def test_stream():
    stream = Stream(tokenize("a b\nc"))
    assert not stream.done()
    assert stream.next() == Node(NodeType.identifier, "a")
    checkpoint = stream.position
    assert stream.next() == Node(NodeType.identifier, "b")
    assert stream.next() == Node(NodeType.identifier, "c")
    assert stream.done()
    stream.position = checkpoint
    assert not stream.done()
    assert stream.next() == Node(NodeType.identifier, "b")
    assert stream.next(skip_newlines=False) == Node(NodeType.terminator, "\n")
    assert stream.next() == Node(NodeType.identifier, "c")
    assert stream.done()

def test_Parser():

    @Parser
    def true_parser(ctx):
        return ctx.stream.next()

    @Parser
    def false_parser(ctx):
        ctx.stream.next()
        return None

    stream = Stream(tokenize("a b c"))
    false_parser(ParsingContext(stream))
    assert 0 == stream.position
    true_parser(ParsingContext(stream))
    assert 1 == stream.position

def test_must():
    stream = Stream(tokenize("a b c"))
    assert must(parse_value("a"))(ParsingContext(stream)) == Node(NodeType.identifier, "a")
    error_occured = False
    try:
        must(parse_value("a"))(ParsingContext(stream))
    except:
        error_occured = True
    assert error_occured

def test_peek_value():
    stream = Stream(tokenize("a b c"))
    assert peek_value("a")(ParsingContext(stream)) == Node(NodeType.identifier, "a")
    assert peek_value("b")(ParsingContext(stream)) == None

def test_parse_value():
    stream = Stream(tokenize("a b c"))
    assert parse_value("a")(ParsingContext(stream)) == Node(NodeType.identifier, "a")
    assert 1 == stream.position
    assert parse_value("a")(ParsingContext(stream)) == None
    assert 1 == stream.position

def test_parse_node_type():
    stream = Stream(tokenize("a b c"))
    assert parse_node_type(NodeType.identifier)(ParsingContext(stream)) == Node(NodeType.identifier, "a")
    assert 1 == stream.position
    assert parse_node_type(NodeType.keyword)(ParsingContext(stream)) == None
    assert 1 == stream.position

def test_parse_many():
    stream = Stream(tokenize("a b c 1"))
    assert parse_many(parse_node_type(NodeType.identifier))(ParsingContext(stream)) == [
        Node(NodeType.identifier, "a"),
        Node(NodeType.identifier, "b"),
        Node(NodeType.identifier, "c"),
    ]
    assert 3 == stream.position

def test_parse_many_seperated_by():
    stream = Stream(tokenize("a, b, c, 1 d"))
    assert parse_many_seperated_by(
        parse_node_type(NodeType.identifier),
        parse_value(",")
    )(ParsingContext(stream)) == [
        Node(NodeType.identifier, "a"),
        Node(NodeType.identifier, "b"),
        Node(NodeType.identifier, "c"),
    ]
    assert 6 == stream.position

def test_parse_choice():
    stream = Stream(tokenize("a b c"))
    assert parse_choice(
        parse_node_type(NodeType.number),
        parse_node_type(NodeType.boolean),
        parse_node_type(NodeType.identifier)
    )(ParsingContext(stream)) == Node(NodeType.identifier, "a")
    assert parse_choice(
        parse_node_type(NodeType.nothing),
        parse_node_type(NodeType.boolean),
    )(ParsingContext(stream)) == None
    assert 1 == stream.position

def test_parse_choice_of_values():
    stream = Stream(tokenize("a b c"))
    assert parse_choice_of_values("c", "b", "a")(ParsingContext(stream)) == Node(NodeType.identifier, "a")
    assert parse_choice_of_values("a", "c")(ParsingContext(stream)) == None
    assert 1 == stream.position

def test_parse_choice_of_node_types():
    stream = Stream(tokenize("a b c"))
    assert parse_choice_of_node_types(
        NodeType.boolean, 
        NodeType.number, 
        NodeType.identifier,
    )(ParsingContext(stream)) == Node(NodeType.identifier, "a")
    assert parse_choice_of_values(
        NodeType.boolean,
        NodeType.number,
    )(ParsingContext(stream)) == None
    assert 1 == stream.position

def test_parse_binary_operator():
    stream = Stream(tokenize("a + b + c"))
    assert parse_binary_operator(
        parse_node_type(NodeType.identifier),
        parse_value("+"),
        parse_node_type(NodeType.identifier),
    )(ParsingContext(stream)) == Node(NodeType.addexp,
        Node(NodeType.addexp,
            Node(NodeType.identifier, "a"),
            Node(NodeType.identifier, "b"),
        ),
        Node(NodeType.identifier, "c"),
    )
