// const Opcodes = require("./opcodes");
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
    CLAIM       : 0x40,
    MOVE        : 0x41,
    CONST       : 0x42,
    COLLECT     : 0x43,
    EXPAND      : 0x44,
    // Type
    TYPE        : 0x50,
    // Exceptions
    THROW       : 0x60,
    TRY         : 0x61,
    SUCCEED     : 0x62,
    CAUGHT      : 0x63,
    // Collections
    RANGE       : 0x70,
    COPY        : 0x71,
    MERGE       : 0x72,
    PUSH        : 0x73,
    GET         : 0x74,
    SET         : 0x75,
    COUNT       : 0x76,
    SLICE       : 0x77,
    INDEX       : 0x78,
    KEYS        : 0x79,
    VALUES      : 0x7A,
    FREEZE      : 0x7B,
    // Strings
    CODEPOINT   : 0x80,
    MATCH       : 0x81,
    SPLIT       : 0x82,
    JOIN        : 0x83,
    // Functions
    FUNCTION    : 0x90,
    CLOSURE     : 0x91,
    CALL        : 0x92,
    RETURN      : 0x93,
    // Extensions
    EXTENSION   : 0xA0,
    // Debug
    BREAK       : 0xF0,
    TRACE       : 0xF1,
};

/*

let copy = Function { x -> 
    intrinsic copy(x)
}

 */

const V = [ ...Array(2 ** 8).keys() ];
const E = V.slice(2);
const ARGS = V[0];
const CAPS = V[1];

function assemble(ir) {
    // TODO
}

function disassemble(bytecode) {
    // TODO
}

module.exports = {
    ...Opcodes,
    V,
    E,
    ARGS,
    CAPS,
};