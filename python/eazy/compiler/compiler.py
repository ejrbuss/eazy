from ..language.node import NodeType

class CompilerEnvironment:

    def __init__(self, definitions, outer_environment):
        self.definitions = definitions
        self.outer_environment = outer_environment

    def declare(self, variable_name):
        self.definitions.add(variable_name)

    def is_local(self, variable_name):
        return variable_name in self.definitions

    def is_non_local(self, variable_name):
        return variable_name in self.outer_environment

    def is_global(self, variable_name):
        return False

    def __contains__(self, variable_name):
        return variable_name in self.definitions or variable_name in self.outer_environment

class GlobalCompilerEnvironment:

    def __init__(self):
        self.definitions = {
            "NaN"        : "ez.NaN",
            "Infinity"   : "ez.Infinity",
            "Nothing"    : "ez.Nothing",
            "Nothing?"   : "ez.is_Nothing",
            "Boolean"    : "ez.Boolean",
            "Boolean?"   : "ez.is_Boolean",
            "Number"     : "ez.Number",
            "Number?"    : "ez.is_Number",
            "String"     : "ez.String",
            "String?"    : "ez.is_String",
            "List"       : "ez.List",
            "List?"      : "ez.is_List",
            "Map"        : "ez.Map",
            "Map?"       : "ez.is_Map",
            "Generator"  : "ez.Genertaor",
            "Generator?" : "ez.is_Generator",
            "Function"   : "ez.Function",
            "Function?"  : "ez.is_Function",
            "import"     : "ez.import_",
            "export"     : "ez.export",
            "print"      : "ez.print_",
            "input"      : "ez.input_",
            "help"       : "ez.help_",
            "type"       : "ez.type_",
            "merge"      : "ez.merge",
            "count"      : "ez.count",
            "copy"       : "ez.copy",
            "describe"   : "ez.describe",
        }

    def declare(self, variable_name):
        self.definitions.add(variable_name)

    def is_local(self, variable_name):
        return False

    def is_non_local(self, variable_name):
        return False

    def is_global(self, variable_name):
        return variable_name in self.definitions

    def __contains__(self, variable_name):
        return variable_name in self.definitions

class CompilerContext:

    def __init__(self):
        self.source = []
        self.environment = GlobalCompilerEnvironment()
        self.indentation = 0

    def push_scope(self, definitions=None):
        self.environment = CompilerEnvironment(definitions or set(), self.environment)
        self.indent += 1
    
    def pop_scope(self):
        self.environment = self.environment.outer_environment
        self.indentation -= 1

    def get_declaration(self, variable_name):
        if self.environment.is_local(variable_name):
            return ""
        if self.environment.is_non_local(variable_name):
            return f"nonlocal {variable_name}"
        if self.environment.is_global(variable_name):
            return f"global {variable_name}"
        raise Exception(f"{variable_name} has not been declared!")

    def write_text(self, text):
        if text:
            self.source.append(self.indentation * "    " + text)

    def get_text(self):
        return "\n".join(self.source)

def compile_node(node, ctx):
    {
        NodeType.module: compile_module,
        # NodeType.declare: compile_declare,
        # NodeType.returns: compile_return,
        # NodeType.yields: compile_yields,
        # NodeType.extends: compile_extends,
        # NodeType.throws: compile_throws,
        # NodeType.assign: compile_assign,
        # NodeType.listexp: compile_listexp,
        # NodeType.mapexp: compile_mapexp,
        # NodeType.pair: compile_pair,
        # NodeType.elsepat: compile_elsepat,
        # NodeType.string: compile_literal,
        # NodeType.number: compile_literal,
        # NodeType.boolean: compile_literal,
        # NodeType.nothing: compile_nothing,
        # NodeType.identifier: compile_identifier,
        # NodeType.ifexp: compile_ifexp,
        # NodeType.whileexp: compile_whileexp,
        # NodeType.matchexp: compile_matchexp,
        # NodeType.forexp: compile_forexp,
        # NodeType.classexp: compile_classexp,
        # NodeType.tryexp: compile_tryexp,
        # NodeType.block: compile_block,
        # NodeType.function: compile_function,
        # NodeType.generator: compile_generator,
        # NodeType.case: compile_case,
        # NodeType.patterns: compile_patterns,
        # NodeType.orexp: compile_orexp,
        # NodeType.andexp: compile_andexp,
        # NodeType.neqexp: compile_neqexp,
        # NodeType.eqexp: compile_eqexp,
        # NodeType.isnotexp: compile_isnotexp,
        # NodeType.isexp: compile_isexp,
        # NodeType.ltexp: compile_ltexp,
        # NodeType.lteexp: compile_lteexp,
        # NodeType.gtexp: compile_gtexp,
        # NodeType.gteexp: compile_gteexp,
        # NodeType.notinexp: compile_notinexp,
        # NodeType.inexp: compile_inexp,
        # NodeType.addexp: compile_addexp,
        # NodeType.subexp: compile_subexp,
        # NodeType.mulexp: compile_mulexp,
        # NodeType.divexp: compile_divexp,
        # NodeType.powexp: compile_powexp,
        # NodeType.rangeexp: compile_rangeexp,
        # NodeType.notexp: compile_notexp,
        # NodeType.posexp: compile_posexp,
        # NodeType.negexp: compile_negexp,
        # NodeType.spreadexp: compile_spreadexp,
        # NodeType.call: compile_call,
        # NodeType.access: compile_access,
    }[node.node_type](node, ctx)

def compile_module(node, ctx):
    ctx.write_text("import ez\n\n")
    compile_node(node.value, ctx)
