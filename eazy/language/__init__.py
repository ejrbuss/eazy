from . import parser
from . import tokenizer

def parse(source):
    return parser.parse(tokenizer.tokenize(source))