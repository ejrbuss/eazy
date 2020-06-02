import re
import math

from .node import Node, NodeType

keywords = [
    "if",
    "then",
    "else",
    "do",
    "while",
    "for",
    "in",
    "match",
    "with",
    "return",
    "yield",
    "throw",
    "extend",
    "try",
    "catch",
    "finally",
]

class Token:

    def __init__(self, pattern, action):
        self.pattern = pattern
        self.action = action

def skip(meta, match):
    return None

def make(node_type):
    def action(meta, match):
        return Node(node_type, match, meta=meta)
    return action

def make_doc(start, end=""):
    start = len(start)
    end = len(end)
    def action(meta, match):
        return Node(NodeType.doc, match[start:-end or None], meta=meta)
    return action

def make_int(base):
    if base == 10:
        def action(meta, match):
            return Node(NodeType.number, int(match.replace("_", ""), base=base), meta=meta)
        return action
    else:
        def action(meta, match):
            return Node(NodeType.number, int(match[2:].replace("_", ""), base=base), meta=meta)
        return action

def make_float(meta, match):
    return Node(NodeType.number, float(match.replace("_", "")), meta=meta)

def make_infinity(meta, match):
    return Node(NodeType.number, math.inf, meta=meta)

def make_nan(meta, match):
    return Node(NodeType.number, math.nan, meta=meta)

def make_string(quote):
    quote_len = len(quote)
    def action(meta, match):
        escaped = match[quote_len:-quote_len].encode("utf-8").decode("unicode_escape")
        return Node(NodeType.string, escaped, meta=meta)
    return action

def make_raw_string(quote):
    quote_len = len(quote)
    def action(meta, match):
        escaped = (match[quote_len:-quote_len]
            .replace("\\\'", "'")
            .replace("\\\"", "\"")
            .replace("\\\\", "\\")
        )
        return Node(NodeType.string, escaped, meta=meta)
    return action

def make_nothing(meta, match):
    return Node(NodeType.nothing, None, meta=meta)

def make_boolean(meta, match):
    return Node(NodeType.boolean, match == "True", meta=meta)

token_definitions = [
    Token(re.compile(r'---(.|\s)*?---(?=\s*var(\s|$))'),                        make_doc("---", "---")),
    Token(re.compile(r'--.*(?=\s*var(\s|$))'),                                  make_doc("--")),
    Token(re.compile(r'(---(.|\s)*?---)|(--.*)|(#.*)'),                               skip),
    Token(re.compile(r'(\n)|;'),                                                make(NodeType.terminator)),
    Token(re.compile(r'\s'),                                                    skip),
    Token(re.compile(r':|,|\(|\)|\[|\]|\{|\}'),                                 make(NodeType.punctuation)),
    Token(re.compile(r'==|/=|=>|->|=|<=|<|>=|>|\+|\-|\*|\/|\^|\.\.\.|\.\.|\.'), make(NodeType.operator)),
    Token(re.compile(r'(is not|not in|is|not|in)(?!\w)'),                       make(NodeType.operator)),
    Token(re.compile(r'0[bB][01][01_]*'),                                       make_int(base=0b10)),
    Token(re.compile(r'0[oO][0-7][0-7_]*'),                                     make_int(base=0o10)),
    Token(re.compile(r'0[xX][\da-fA-F][\da-fA-F_]*'),                           make_int(base=0x10)),
    Token(re.compile(r'(\d[\d_]*)?\.\d[\d_]*([eE][-+]?\d[\d_]*)?'),             make_float),
    Token(re.compile(r'\d[\d_][eE][-+]?\d[\d_]*'),                              make_float),
    Token(re.compile(r'Infinity(?!\w)'),                                        make_infinity),
    Token(re.compile(r'NaN(?!\w)'),                                             make_nan),
    Token(re.compile(r'\d[\d_]*'),                                              make_int(base=10)),
    Token(re.compile(r'"""(.|\s)*?"""'),                                        make_string(quote='"""')),
    Token(re.compile(r'"(\\.|[^\\"])*?"'),                                      make_string(quote='"')),
    Token(re.compile(r"'''(.|\s)*?'''"),                                        make_raw_string(quote="'''")),
    Token(re.compile(r"'(\\.|[^\\'])*?'"),                                      make_raw_string(quote="'")),
    Token(re.compile(r'Nothing(?!\w)'),                                         make_nothing),
    Token(re.compile(r'(True|False)(?!\w)'),                                    make_boolean),
    Token(re.compile(r'(' + '|'.join(keywords) + r')(?!\w)'),                   make(NodeType.keyword)),
    Token(re.compile(r'(?![0-9])\w+\??'),                                       make(NodeType.identifier)),
]

def tokenize(source, meta=None):
    tokens = []
    position = 0
    while position < len(source):
        for token_definition in token_definitions:
            match_groups = re.match(token_definition.pattern, source[position:])
            if not match_groups: continue
            match = match_groups.group(0)
            token = token_definition.action(dict(**(meta or {}), 
                source=source, 
                position=position, 
                match=match,
            ), match)
            if token:
                tokens.append(token)
            position += len(match)
            break
        else:
            raise SyntaxError(dict(
                source=source,
                position=position,
                tokens=tokens,
            ))
    tokens.append(Node(NodeType.eof))
    return tokens