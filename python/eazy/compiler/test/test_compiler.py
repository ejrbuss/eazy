from ..compiler import CompilerContext, compile_node
from ...language import parse

def test_compile_nothing():
    ctx = CompilerContext()
    compile_node(parse("Nothing"), ctx)
    assert ctx.get_text() == "import * from ez\n\nNothing"
