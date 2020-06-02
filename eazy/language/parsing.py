from .node import Node, NodeType, binary_operators

class Stream:

    def __init__(self, tokens):
        self.position = 0
        self.tokens = tokens

    def skip_newlines(self):
        while (
            self.position < len(self.tokens) and 
            self.tokens[self.position].value == "\n"
        ):
            self.position += 1

    def next(self, skip_newlines=True):
        if skip_newlines: self.skip_newlines()
        if self.position >= len(self.tokens):
            return None
        token = self.tokens[self.position]
        self.position += 1
        return token

    def done(self, skip_newlines=True):
        position = self.position
        token = self.next(skip_newlines)
        self.position = position
        return token == None or token.node_type == NodeType.eof

    def __repr__(self):
        return f"Map [ position: {self.position}, tokens: {self.tokens} ]"

class ParsingContext:

    def __init__(self, stream):
        self.starting_position = stream.position
        self.stream = stream

    def rollback(self):
        self.stream.position = self.starting_position

def Parser(parsing_function):
    def wrapped_parsing_function(ctx):
        ctx = ParsingContext(ctx.stream)
        result = parsing_function(ctx)
        if result == None:
            ctx.rollback()
        return result
    return wrapped_parsing_function

def must(parser):
    @Parser
    def inner_parser(ctx):
        result = parser(ctx)
        assert result is not None
        return result
    return inner_parser

def peek_value(value, skip_newlines=True):
    @Parser
    def inner_parser(ctx):
        token = ctx.stream.next(skip_newlines)
        ctx.rollback()
        if token and token.value == value:
            return token
    return inner_parser

def parse_value(value, skip_newlines=True):
    @Parser
    def inner_parser(ctx):
        token = ctx.stream.next(skip_newlines)
        if token and token.value == value: return token
    return inner_parser

def parse_node_type(node_type, skip_newlines=True):
    @Parser
    def inner_parser(ctx):
        token = ctx.stream.next(skip_newlines)
        if token and token.node_type == node_type: return token
    return inner_parser

def parse_many(parser):
    @Parser
    def inner_parser(ctx):
        collected = []
        parsed = parser(ctx)
        while parsed:
            collected.append(parsed)
            parsed = parser(ctx)
        return collected
    return inner_parser

def parse_many_seperated_by(parser, seperator):
    @Parser
    def inner_parser(ctx):
        collected = []
        parsed = parser(ctx)
        while parsed:
            collected.append(parsed)
            parsed = seperator(ctx) and parser(ctx)
        return collected
    return inner_parser

def parse_choice(*choices):
    @Parser
    def inner_parser(ctx):
        for choice in choices:
            result = choice(ctx)
            if result: return result
    return inner_parser

def parse_choice_of_values(*values):
    return parse_choice(*[parse_value(value) for value in values])

def parse_choice_of_node_types(*node_types):
    return parse_choice(*[parse_node_type(node_type) for node_type in node_types])

def parse_binary_operator(left_parser, operator_parser, right_parser):
    @Parser
    def inner_parser(ctx):
        left = left_parser(ctx)
        if left:
            operator = operator_parser(ctx)
            while operator:
                right = right_parser(ctx)
                if not right:
                    return None
                left = Node(binary_operators[operator.value], left, right)
                operator = operator_parser(ctx)
            return left
    return inner_parser