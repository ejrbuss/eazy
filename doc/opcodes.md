# Opcodes

Writing a tenative spec is too difficult at this point, this is a rougher space
to iterate on opcode design for the IR/Bytecode

## Control
```
.module
    (version: String, full_path: String, debug_table: Map)

    A required first instruction. Used to check that bytecode and vm versions
    match, record the canonical full path, and initiate the debug_table for
    the module (like in a function)

.halt
    ()
    *Builtin accessible
    
    Stop the program.

.label
    (id: Number)

    A label specified with a number unique to this module/function

.goto
    (id: Number)

    Unconditionally jump to the label id

.goif
    (condition: Var, id: Number)

    Jump to the label id if the boolean in condition is true

.import
    (path: String, result: Var)
    *Builtin accessible

    Import a module from path into destination. Question: should caching be
    handled here or in prelude?

.export
    (value: Var)
    *Builtin accessible

    Export the value in register. Question: should this "return" from the 
    module?
```

## Arithmetic
```
.neg
    (value: Var, result: Var)
    *Builtin accessible

    Place the negation of value into result

.add
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the sum of left and right in result. Question: should this be 
    overloaded for strings, lists, and maps?

.sub
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the difference between left and right in result.

.mul
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the product of left and right in result. Question: should 
    this be overloaded for strings, lists, and maps?

.div
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the divisor of left and right in result.

.mod
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the remainder of integer division of left and right in result.

.pow
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place left to the power of right in result.

.floor
    (value: Var, result: Var)
    *Builtin accessible

    Place the floor of value in result.

.ceil
    (value: Var, result: Var)
    *Builtin accessible

    Place the ceiling of value in result.
```

## Bitwise
```
.band
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the bitwise and of left and right in result.

.bor
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the bitwise or of left and right in result.

.bnot
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the bitwise xor of left and right in result.

.shl
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place left shifted right by right in result.

.ashr
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place left arithmetically shifted left by right in result.

.lshr
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place left logically shifted left by right in result.

```

## Booleans and Conditionals
```
.and
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the boolean and of left and right in result.

.or 
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place the boolean or of left and right in result.

.not
    (value: Var, result: Var)
    *Builtin accessible

    Place the boolean not of value in result.

.eq
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place whether left and right are data wise equals in result.

.is
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place whether left and right share identity in result.

.in
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place whether left is in right in result.

.lt
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place whether left is less than right in result. Should work on all 
    primitives.

.lte
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place whether left is less than or equal to right in result.

.gt
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place whether left is greater than right in result.

.gte
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place whether left is greater than or equal to right in result.
```

## Variable
```
.claim
    (number: Number)

    Expand the variable stack by number.

.move
    (source: Var, destination: Var)

    Move source to destination.

.const
    (value: Any, destination: Var)

    Load a constant into Var.

.collect
    (...values: List of Var, destination: Var)

    Collect all of values into destination as a list
```

## Reflection
```
.type
    (value: Var, result: Var)
    *Builtin accessible

    Place the type symbol of value into result.
```

## Errors
```
.throw
    (value: Var)

    Throws value.

.try
    (id: Number)

    Start a try block. Jump to id if an error occured.

.catch
    (error: Var)

    Start a try handler placing the thrown value into error.

.succeed
    ()

    Indicate that a try block has completed.

.caught
    ()

    Indicate that a try handler has completed.
```

## Collections
```
.range
    (start: Var, end: Var, result: Var)
    *Builtin accessible
    
    Place a list numbered start (inclusive) through end (exclusive) in result.

.copy
    (value: Var, result: Var)
    *Builtin accessible

    Place a shallow copy of value in result.

.merge
    (left: Var, right: Var, result: Var)
    *Builtin accessible

    Place a collection resulting from merging left and right in result.

.push
    (element: Var, list: Var)
    *Builtin accessible

    Push element onto the end of list.

.get
    (key: Var, collection: Var, result: Var)
    *Builtin accessible

    Place collection at key into result.

.set
    (key: Var, value: Var, collection: Var)
    *Builtin accessible

    Place value into collection at key.

.count
    (collection: Var, result: Var)
    *Builtin accessible

    Place the length of collection into result.

.slice
    (left: Var, right: Var, collection: Var, result: Var)
    *Builtin accessible

    Place a slice of collection starting from left (inclusive) to 
    right (exclusive) in result.

.index
    (value: Var, collection: Var, result: Var)
    *Builtin accessible

    Place the index of value in collection in result. Otherwise place Nothing.

.keys
    (collection: Var, result: Var)
    *Builtin accessible

    Place the keys of collection in result.

.values
    (collection: Var, result: Var)
    *Builtin accessible

    Place the values of collection in result.

.freeze
    (collection: Var)
    *Builtin accessible

    Freeze collection.
```

## String
```
.codepoint
    (string: Var, result: Var)
    *Builtin accessible

    Place the numeric codepoint of the first codepoint of string in result.

.match
    (string: Var, pattern: Var, result: Var)
    *Builtin accessible

    Place the matched groups of pattern in string in result.

.split
    (string: Var, pattern: Var, result: Var)
    *Builtin accessible

    Place string split on pattern in string in result.

.join
    (collection: Var, substring: Var, result: Var)
    *Builtin accessible

    Place collection joined by substring in result.
```

## Function
```
.function
    (id: Number, debug_table: Map)

    Indicates the start of a function block identified by id.

.closure
    (id: Number, caps: Var, result: Var)

    Place a closure for function id with captures caps in result.

.call
    (closure: Var, args: Var, result: Var)

    Place the return value of calling closure in result.

.return
    (value: Var)

    Return the value in value.
```

## Extension
```
.extension
    (id: Var, result: Var)
    *Builtin accessible

    Load extension indicated by id into result.
```

## Debug
```
.break
    ()
    *Builtin accessible

    Trigger a breakpoint

.trace
    (result: Var)
    *Builtin accessible

    Place a stack trace into result.
```