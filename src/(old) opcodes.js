const Opcodes = {
    // Control
    MODULE      : 0x00,
    HALT        : 0x01,
    LABEL       : 0x02,
    GOTO        : 0x03,
    GOIF        : 0x04,
    IMPORT      : 0x05,
    EXPORT      : 0x06,
    // Arithmetic    
    NEG         : 0x10,
    ADD         : 0x11,
    SUB         : 0x12,
    MUL         : 0x13,
    DIV         : 0x14,
    MOD         : 0x15,
    POW         : 0x16,
    FLOOR       : 0x17,
    CEIL        : 0x18,
    // Bit
    BAND        : 0x20,
    BOR         : 0x21,
    BXOR        : 0x22,
    BNOT        : 0x23,
    SHL         : 0x24,
    ASHR        : 0x25,
    LSHR        : 0x26,
    // Boolean & Conditions
    AND         : 0x30,
    OR          : 0x31,
    NOT         : 0x32,
    EQ          : 0x33,
    IS          : 0x34,
    IN          : 0x35,
    LT          : 0x36,
    LTE         : 0x37,
    GT          : 0x38,
    GTE         : 0x39,
    // Variable
    MOVE        : 0x40,
    CONST       : 0x41,
    // Type
    TYPE        : 0x50,
    // Exceptions
    THROW       : 0x60,
    TRY         : 0x61,
    SUCCEED     : 0x62,
    CAUGHT      : 0x63,
    // Collections
    COPY        : 0x70,
    MERGE       : 0x71,
    UPDATE      : 0x72,
    GET         : 0x73,
    SET         : 0x74,
    COUNT       : 0x75,
    SLICE       : 0x76,
    INDEX       : 0x77,
    KEYS        : 0x78,
    VALUES      : 0x77,
    FREEZE      : 0x78,
    // Strings
    CODEPOINT   : 0x80,
    MATCH       : 0x81,
    SPLIT       : 0x82,
    JOIN        : 0x83,
    // Functions
    FUNCTION    : 0x90,
    CLOSURE     : 0x91,
    CALL        : 0x92,
    TAILCALL    : 0x93,
    RETURN      : 0x94,
    // Extensions
    EXTENSION   : 0xA0,
    // Debug
    BREAK       : 0xF0,
    TRACE       : 0xF1,
};

/*
export(Map [ #abs = abs ])

Math[#square] 
*/

const OperandTypes = {
    Id: "Id",
    Variable: "Variable",
    Number: "Number",
    String: "String",
    Constant: "Constant",
    Operations: "Operations",
};

const OpcodeSignatures = {
    [Opcodes.MODULE]: {
        mnemonic: "MODULE",
        opcode: Opcodes.MODULE,
        operands: [
            { type: OperandTypes.Number, name: "locals" },
            { type: OperandTypes.String, name: "version"},
            { type: OperandTypes.String, name: "path"   },
        ],
    },
    [Opcodes.HALT]: {
        mnemonic: "HALT",
        opcode: Opcodes.HALT,
        operands: [],
    },
    [Opcodes.LABEL]: {
        mnemonic: "LABEL",
        opcode: Opcodes.LABEL,
        operands: [
            { type: OperandTypes.Id, name: "label" },
        ],
    },
    [Opcodes.GOTO]: {
        mnemonic: "GOTO",
        opcode: Opcodes.GOTO,
        operands: [
            { type: OperandTypes.Id, name: "label" },
        ],
    },
    [Opcodes.GOIF]: {
        mnemonic: "GOIF",
        opcode: Opcodes.GOIF,
        operands: [
            { type: OperandTypes.Variable, name: "condition" },
            { type: OperandTypes.Id,       name: "label"     },
        ],
    },
    [Opcodes.IMPORT]: {
        mnemonic: "IMPORT",
        opcode: Opcodes.IMPORT,
        operands: [
            { type: OperandTypes.Variable, name: "path"   },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.EXPORT]: {
        mnemonic: "EXPORT",
        opcode: Opcodes.EXPORT,
        operands: [
            { type: OperandTypes.Variable, name: "value" },
        ],
    },
    [Opcodes.NEG]: {
        mnemonic: "NEG",
        opcode: Opcodes.NEG,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.ADD]: {
        mnemonic: "ADD",
        opcode: Opcodes.ADD,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.SUB]: {
        mnemonic: "SUB",
        opcode: Opcodes.SUB,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.MUL]: {
        mnemonic: "MUL",
        opcode: Opcodes.MUL,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.DIV]: {
        mnemonic: "DIV",
        opcode: Opcodes.DIV,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.MOD]: {
        mnemonic: "MOD",
        opcode: Opcodes.MOD,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.POW]: {
        mnemonic: "POW",
        opcode: Opcodes.POW,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "power"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.FLOOR]: {
        mnemonic: "FLOOR",
        opcode: Opcodes.FLOOR,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "floor"  },
        ],
    },
    [Opcodes.CEIL]: {
        mnemonic: "CEIL",
        opcode: Opcodes.CEIL,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "ceil"   },
        ],
    },
    [Opcodes.BAND]: {
        mnemonic: "BAND",
        opcode: Opcodes.BAND,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.BOR]: {
        mnemonic: "BOR",
        opcode: Opcodes.BOR,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.BXOR]: {
        mnemonic: "BXOR",
        opcode: Opcodes.BXOR,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.BNOT]: {
        mnemonic: "BNOT",
        opcode: Opcodes.BNOT,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.SHL]: {
        mnemonic: "SHL",
        opcode: Opcodes.SHL,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "shift"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.ASHR]: {
        mnemonic: "ASHR",
        opcode: Opcodes.ASHR,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "shift"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.LSHR]: {
        mnemonic: "LSHR",
        opcode: Opcodes.LSHR,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "shift"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.AND]: {
        mnemonic: "AND",
        opcode: Opcodes.AND,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.OR]: {
        mnemonic: "OR",
        opcode: Opcodes.OR,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.NOT]: {
        mnemonic: "NOT",
        opcode: Opcodes.NOT,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "notted" },
        ],
    },
    [Opcodes.EQ]: {
        mnemonic: "EQ",
        opcode: Opcodes.EQ,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.IS]: {
        mnemonic: "IS",
        opcode: Opcodes.IS,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.IN]: {
        mnemonic: "IN",
        opcode: Opcodes.IN,
        operands: [
            { type: OperandTypes.Variable, name: "element"    },
            { type: OperandTypes.Variable, name: "collection" },
            { type: OperandTypes.Variable, name: "result"     },
        ],
    },
    [Opcodes.LT]: {
        mnemonic: "LT",
        opcode: Opcodes.LT,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.LTE]: {
        mnemonic: "LTE",
        opcode: Opcodes.LTE,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.GT]: {
        mnemonic: "GT",
        opcode: Opcodes.GT,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.GTE]: {
        mnemonic: "GTE",
        opcode: Opcodes.GTE,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "result" },
        ],
    },
    [Opcodes.MOVE]: {
        mnemonic: "MOVE",
        opcode: Opcodes.MOVE,
        operands: [
            { type: OperandTypes.Variable, name: "source"      },
            { type: OperandTypes.Variable, name: "destination" },
        ],
    },
    [Opcodes.CONST]: {
        mnemonic: "CONST",
        opcode: Opcodes.CONST,
        operands: [
            { type: OperandTypes.Constant, name: "constant"    },
            { type: OperandTypes.Variable, name: "destination" },
        ],
    },
    [Opcodes.TYPE]: {
        mnemonic: "TYPE",
        opcode: Opcodes.TYPE,
        operands: [
            { type: OperandTypes.Variable, name: "value" },
            { type: OperandTypes.Variable, name: "type"  },
        ],
    },
    [Opcodes.THROW]: {
        mnemonic: "THROW",
        opcode: Opcodes.THROW,
        operands: [
            { type: OperandTypes.Variable, name: "value" },
        ],
    },
    [Opcodes.TRY]: {
        mnemonic: "TRY",
        opcode: Opcodes.TRY,
        operands: [
            { type: OperandTypes.Id,       name: "handler" },
            { type: OperandTypes.Variable, name: "error"   },
        ],
    },
    [Opcodes.SUCCEED]: {
        mnemonic: "SUCCEED",
        opcode: Opcodes.SUCCEED,
        operands: [],
    },
    [Opcodes.CAUGHT]: {
        mnemonic: "CAUGHT",
        opcode: Opcodes.CAUGHT,
        operands: [],
    },
    [Opcodes.COPY]: {
        mnemonic: "COPY",
        opcode: Opcodes.COPY,
        operands: [
            { type: OperandTypes.Variable, name: "value"  },
            { type: OperandTypes.Variable, name: "copy"   },
        ],
    },
    [Opcodes.MERGE]: {
        mnemonic: "MERGE",
        opcode: Opcodes.MERGE,
        operands: [
            { type: OperandTypes.Variable, name: "left"   },
            { type: OperandTypes.Variable, name: "right"  },
            { type: OperandTypes.Variable, name: "merged" },
        ],
    },
    [Opcodes.UPDATE]: {
        mnemonic: "UPDATE",
        opcode: Opcodes.UPDATE,
        operands: [
            { type: OperandTypes.Variable, name: "left"    },
            { type: OperandTypes.Variable, name: "right"   },
            { type: OperandTypes.Variable, name: "updated" },
        ],
    },
    [Opcodes.GET]: {
        mnemonic: "GET",
        opcode: Opcodes.GET,
        operands: [
            { type: OperandTypes.Variable, name: "key"        },
            { type: OperandTypes.Variable, name: "collection" },
            { type: OperandTypes.Variable, name: "value"      },
        ],
    },
    [Opcodes.SET]: {
        mnemonic: "SET",
        opcode: Opcodes.SET,
        operands: [
            { type: OperandTypes.Variable, name: "key"        },
            { type: OperandTypes.Variable, name: "value"      },
            { type: OperandTypes.Variable, name: "collection" },
        ],
    },
    [Opcodes.COUNT]: {
        mnemonic: "COUNT",
        opcode: Opcodes.COUNT,
        operands: [
            { type: OperandTypes.Variable, name: "collection" },
            { type: OperandTypes.Variable, name: "count"      },
        ],
    },
    [Opcodes.SLICE]: {
        mnemonic: "SLICE",
        opcode: Opcodes.SLICE,
        operands: [
            { type: OperandTypes.Variable, name: "start"      },
            { type: OperandTypes.Variable, name: "stop"       },
            { type: OperandTypes.Variable, name: "collection" },
            { type: OperandTypes.Variable, name: "slice"      },
        ],
    },
    [Opcodes.INDEX]: {
        mnemonic: "INDEX",
        opcode: Opcodes.INDEX,
        operands: [
            { type: OperandTypes.Variable, name: "value"      },
            { type: OperandTypes.Variable, name: "collection" },
            { type: OperandTypes.Variable, name: "index"      },
        ],
    },
    [Opcodes.KEYS]: {
        mnemonic: "KEYS",
        opcode: Opcodes.KEYS,
        operands: [
            { type: OperandTypes.Variable, name: "collection" },
            { type: OperandTypes.Variable, name: "keys"       },
        ],
    },
    [Opcodes.VALUES]: {
        mnemonic: "VALUES",
        opcode: Opcodes.VALUES,
        operands: [
            { type: OperandTypes.Variable, name: "collection" },
            { type: OperandTypes.Variable, name: "values"     },
        ],
    },
    [Opcodes.FREEZE]: {
        mnemonic: "FREEZE",
        opcode: Opcodes.FREEZE,
        operands: [
            { type: OperandTypes.Variable, name: "collection" },
        ],
    },
    [Opcodes.CODEPOINT]: {
        mnemonic: "CODEPOINT",
        opcode: Opcodes.CODEPOINT,
        operands: [
            { type: OperandTypes.Variable, name: "string"    },
            { type: OperandTypes.Variable, name: "offset"    },
            { type: OperandTypes.Variable, name: "codepoint" },
        ],
    },
    [Opcodes.MATCH]: {
        mnemonic: "MATCH",
        opcode: Opcodes.MATCH,
        operands: [
            { type: OperandTypes.Variable, name: "pattern" },
            { type: OperandTypes.Variable, name: "string"  },
            { type: OperandTypes.Variable, name: "matches" },
        ],
    },
    [Opcodes.SPLIT]: {
        mnemonic: "SPLIT",
        opcode: Opcodes.SPLIT,
        operands: [
            { type: OperandTypes.Variable, name: "pattern" },
            { type: OperandTypes.Variable, name: "string"  },
            { type: OperandTypes.Variable, name: "groups"  },
        ],
    },
    [Opcodes.JOIN]: {
        mnemonic: "JOIN",
        opcode: Opcodes.JOIN,
        operands: [
            { type: OperandTypes.Variable, name: "pattern"    },
            { type: OperandTypes.Variable, name: "collection" },
            { type: OperandTypes.Variable, name: "string"     },
        ],
    },
    [Opcodes.FUNCTION]: {
        mnemonic: "FUNCTION",
        opcode: Opcodes.FUNCTION,
        operands: [
            { type: OperandTypes.String, name: "name"   },
            { type: OperandTypes.Number, name: "locals" },
            { type: OperandTypes.Id,     name: "label"  },
        ],
    },
    [Opcodes.CLOSURE]: {
        mnemonic: "CLOSURE",
        opcode: Opcodes.CLOSURE,
        operands: [
            { type: OperandTypes.Id,       name: "label"    },
            { type: OperandTypes.Variable, name: "captures" }, 
            { type: OperandTypes.Variable, name: "result"   },
        ],
    },
    [Opcodes.CALL]: {
        mnemonic: "CALL",
        opcode: Opcodes.CALL,
        operands: [
            { type: OperandTypes.Variable, name: "function"  },
            { type: OperandTypes.Variable, name: "arguments" },
            { type: OperandTypes.Variable, name: "return"    },
        ],
    },
    [Opcodes.TAILCALL]: {
        mnemonic: "TAILCALL",
        opcode: Opcodes.TAILCALL,
        operands: [
            { type: OperandTypes.Variable, name: "function"  },
            { type: OperandTypes.Variable, name: "arguments" },
        ],
    },
    [Opcodes.RETURN]: {
        mnemonic: "RETURN",
        opcode: Opcodes.RETURN,
        operands: [
            { type: OperandTypes.Variable, name: "value" },
        ],
    },
    [Opcodes.EXTENSION]: {
        mnemonic: "EXTENSION",
        opcode: Opcodes.EXTENSION,
        operands: [
            { type: OperandTypes.Variable, name: "name"         }, 
            { type: OperandTypes.Variable, name: "destinattion" },
        ],
    },
    [Opcodes.BREAK]: {
        mnemonic: "BREAK",
        opcode: Opcodes.BREAK,
        operands: [],
    },
    [Opcodes.TRACE]: {
        mnemonic: "TRACE",
        opcode: Opcodes.TRACE,
        operands: [
            { type: OperandTypes.Variable, name: "trace" },
        ],
    },
};

const OpcodeCount = Object.entries(Opcodes).length;

function validate(operation) {

}

function pretty_print_operand(type, operand, tab) {
    switch (type) {
        case OperandTypes.Variable: 
            return "V[" + operand + "]";
        case OperandTypes.Operations:
            return "[\n" + tab + operand
                .map(pretty_print)
                .join(",\n")
                .replace(/\n/g, "\n" + tab) + ",\n]";
        default: 
            return JSON.stringify(operand);
    }
}

function pretty_print(operation, tab="    ") {
    const [ opcode, ...operands ] = operation;
    const signature = OpcodeSignatures[opcode];
    let result = "[" + signature.mnemonic;
    for (let i = 0; i < operands.length; i++) {
        const type = signature.operands[i].type;
        const operand = operands[i];
        result += ", " + pretty_print_operand(type, operand, tab);
    }
    return result + "]";
}

module.exports = {
    ...Opcodes,
    OperandTypes,
    OpcodeSignatures,
    OpcodeCount,
    validate,
    pretty_print,
};