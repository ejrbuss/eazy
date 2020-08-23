from enum import Enum

class Instructions(Enum):
    STOP  = 0x00

class MachineStates(Enum):
    STOPPED = 0x00
    RUNNING = 0x01
    ERROR   = 0x02

class VirtualMachine:

    def __init__(self):
        self.opcode_table = []
        self.constant_table = []
        self.global_table = []
        self.local_table = []
        self.expr_stack = []
        self.call_stack = []
        self.esp = 0
        self.isp = 0
        self.csp = 0

def run(vm):
    pass

def step(vm):
    pass


class Opcodes:
    # BASIC
    STOP  = 0x00
    PRINT = 0x01
    INPUT = 0x02
    HELP  = 0x03
    TYPE  = 0x04
    CHECK = 0x05
    THROW = 0x06
    CATCH = 0x07
    BREAK = 0x08

    # STACK
    SEL = 0x10
    POP = 0x11
    SWP = 0x12

    # COLLECTIONS
    GET = 0x20
    SET = 0x21
    CNT = 0x22
    MRG = 0x23
    CPY = 0x24

    # ARITHMETIC
    ADD = 0x30
    SUB = 0x31
    MUL = 0x32
    DIV = 0x33
    EXP = 0x34
    MOD = 0x35

    # RELATIONS
    EQ    = 0x40
    NEQ   = 0x41
    IS    = 0x42
    ISNOT = 0x43
    LT    = 0x44
    LTE   = 0x45
    GT    = 0x46
    GTE   = 0x47
    IN    = 0x48
    NOTIN = 0x49

    # LOAD
    LD_NONE     = 0X50
    LD_TRUE     = 0X51
    LD_FALSE    = 0X52
    LD_INT      = 0X53
    LD_CONST    = 0x54
    LD_GLOBAL   = 0x55
    LD_LOCAL    = 0x56
    LD_CAPTURED = 0x57

    # STORE
    ST_GLOBAL   = 0x60
    ST_LOCAL    = 0x61
    ST_CAPTURED = 0x62

    # FUNCTION
    CALL    = 0x70
    RET     = 0x71
    CLOSURE = 0x72

    # MODULE
    MODULE = 0x80
    IMPORT = 0x81
    EXPORT = 0x82

LANGUAGE = "eazy"
VERSION = "0.0.1"

def eval_program(program):
    metadata = program["metadata"]
    assert metadata["language"] == LANGUAGE
    assert metadata["version"] == VERSION

    opcode_table = program["opcode_table"]
    constant_table = program["constant_table"]
    globals_table = [None]
    
    expr_stack = []
    call_stack = []
    captured = []

    ESP = 0
    ISP = 0
    CSP = 0

    while running:
        op = opcode_table[ISP]
        opcode = (op >> 0x18) & 0xFF
        {
            Opcodes.STOP
        }[opcode](op)