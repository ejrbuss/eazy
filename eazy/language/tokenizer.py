import re
from . import node

def skip(meta, match):
    return None

def create_doc(meta, match):
    return [ meta, node.ntype_doc, match.replace('---', '') ]

def assign_ntype(ntype):
    return lambda meta, match : [ meta, ntype, match ]

def create_int(base):
    def create_int(meta, match):
        if base != 10:
            match = match[2:]
        return [ meta, node.ntype_number, int(match.replace('_', ''), base=base) ]
    return create_int

def create_float(meta, match):
    return [ meta, node.ntype_number, float(match.replace('_', '')) ]

def escape(quotes):
    n = len(quotes)
    return lambda meta, match : [ meta, node.ntype_string, match[n:-n]
        .encode("utf-8")
        .decode("unicode_escape")
    ]

def raw(quotes):
    n = len(quotes)
    return lambda meta, match : [ meta, node.ntype_string, match[n:-n]
        .replace('\\\'', '\'')
        .replace('\\"', '"')
        .replace('\\\\', '\\')
    ]

# Token           # Pattern                                                                 # Action
token_doc         = [ re.compile(r'---(.|\s)*?---'),                                        create_doc ]
token_comment     = [ re.compile(r'--.*'),                                                  skip ]
token_terminator  = [ re.compile(r'(\n)|;'),                                                assign_ntype(node.ntype_terminator) ]
token_whitespace  = [ re.compile(r'\s'),                                                    skip ]
token_punctuation = [ re.compile(r':|,|\(|\)|\[|\]|\{|\}'),                                 assign_ntype(node.ntype_token) ]
token_operator    = [ re.compile(r'==|/=|=>|->|=|<=|<|>=|>|\+|\-|\*|\/|\^|\.\.\.|\.\.|\.'), assign_ntype(node.ntype_token) ]
token_binary      = [ re.compile(r'0[bB][01][01_]*'),                                       create_int(base=0b10) ]
token_octal       = [ re.compile(r'0[oO][0-7][0-7_]*'),                                     create_int(base=0o10) ]
token_hexidecimal = [ re.compile(r'0[xX][\da-fA-F][\da-fA-F_]*'),                           create_int(base=0x10) ]
token_float       = [ re.compile(r'(\d[\d_]*)?\.\d[\d_]*([eE][-+]?\d[\d_]*)?'),             create_float ]
token_exp         = [ re.compile(r'\d[\d_][eE][-+]?\d[\d_]*'),                              create_float ]
token_decimal     = [ re.compile(r'\d[\d_]*'),                                              create_int(base=10) ]
token_mstring     = [ re.compile(r'"""(.|\s)*?"""'),                                        escape('"""') ]
token_string      = [ re.compile(r'"(\\.|[^\\"])*?"'),                                      escape('"') ]
token_raw_mstring = [ re.compile(r'\'\'\'(.|\s)*?\'\'\''),                                  raw("'''") ]
token_raw_string  = [ re.compile(r'\'(\\.|[^\\\'])*?\''),                                   raw("'") ]
token_ident       = [ re.compile(r'(?![0-9])\w+'),                                          assign_ntype(node.ntype_ident) ]

token_definitions = [
    token_doc,
    token_comment,
    token_terminator,
    token_whitespace,
    token_punctuation,
    token_operator,
    token_binary,
    token_octal,
    token_hexidecimal,
    token_float,
    token_exp,
    token_decimal,
    token_mstring,
    token_string,
    token_raw_mstring,
    token_raw_string,
    token_ident,
]

def tokenize(source):
    tokens = []
    position = 0
    while position < len(source):
        for (pattern, action) in token_definitions:
            match = re.match(pattern, source[position:])
            if match:
                match = match.group(0)
                meta = {
                    "source": source,
                    "position": position,
                    "match": match,
                }
                token = action(meta, match)
                if token:
                    tokens.append(token)
                position += len(match)
                break
        else:
            # TODO better syntax errors
            # raise errors.token_error(source, position)
            print(tokens)
            raise SyntaxError("tokenizing error > " + repr(source[position:]))

    # Append terminator
    tokens.append(assign_ntype(node.ntype_terminator)(None, "\n"))
    return tokens