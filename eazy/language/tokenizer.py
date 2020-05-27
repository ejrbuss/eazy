import re

def value_id(match):
    return match

def value_integer_for_base(base):
    def value_integer(match):
        if base != 10:
            match = match[2:]
        return int(match, base=base)
    return value_integer

def value_float(match):
    return float(match)

def value_string(match):
    return match[1:-1].encode("utf-8").decode("unicode_escape")

def value_string_raw(match):
    return match[1:-1].replace("\\'", "'").replace("\\\\", "\\")

token_definitions = [
    {
        "type": "comment_singleline",
        "pattern": re.compile(r'^(--.*)'),
        "skip": True,
    },
    {
        "type": "comment_multiline",
        "pattern": re.compile(r'---(.|\s)*?---'),
        "skip": True,
    },
    {
        "type": "whitespace",
        "pattern": re.compile(r'\s+'),
        "skip": True,
    },
    {
        "type": "punctuation",
        "pattern": re.compile(r',|;|\(|\)|\[|\]|\{|\}'),
        "value": value_id,
    },
    {
        "type": "operator",
        "pattern": re.compile(r'==|/=|=|<=|<|>=|>|->|\+|\-|\*|\/|\^|\.\.\.|\.\.|\.'),
        "value": value_id,
    },
    {
        "type": "reserved_keyword",
        "pattern": re.compile(r'if|then|else|do|while|for|in|match|count|merge|copy|new|class|not|or|and|import|export|return|try|catch|throw|print|input|val|var|type'),
        "value": value_id,
    },
    {
        "type": "reserved_type",
        "pattern": re.compile(r'True|False|Nothing|Boolean|Number|String|List|Map|Function'),
        "value": value_id,
    },
    # TODO _ in numeric literals
    {
        "type": "literal_integer_bin",
        "pattern": re.compile('0[bB][01]+'),
        "value": value_integer_for_base(0b10),
    },
    {
        "type": "literal_integer_oct",
        "pattern": re.compile(r'0[oO][0-7]+'),
        "value": value_integer_for_base(0o10),
    },
    {
        "type": "literal_integer_dec",
        "pattern": re.compile(r'\d+'),
        "value": value_integer_for_base(10),
    },
    {
        "type": "literal_integer_hex",
        "pattern": re.compile(r'0[xX][\da-fA-F]+'),
        "value": value_integer_for_base(0x10),
    },
    {
        "type": "literal_float",
        "pattern": re.compile(r'\d*\.?\d+([eE][-+]?\d+)?'),
        "value": value_float,
    },
    {
        "type": "literal_string",
        "pattern": re.compile(r'"(\\.|[^\\"])*"'),
        "value": value_string,
    },
    {
        "type": "literal_string_raw",
        "pattern": re.compile(r'\'(\\.|[^\'\\])*\''),
        "value": value_string_raw,
    },
    {
        "type": "identifier",
        "pattern": re.compile(r'[a-zA-Z_][\w?]*'),
        "value": value_id,
    },
]

def tokenize(source):
    tokens = []
    while source:
        for token_definition in token_definitions:
            match = re.match(token_definition['pattern'], source)
            if match:
                match = match.group(0)
                source = source[len(match):]
                if "skip" not in token_definition:
                    tokens.append({
                        "type": token_definition["type"],
                        "value": token_definition["value"](match)
                    })
                break
        else:
            # TODO better syntax errors
            raise SyntaxError("> " + source)
    return tokens