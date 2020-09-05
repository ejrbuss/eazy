# eazy

## Testing
```
$ pytest --cov-report term-missing --cov
```

## TODO
 - end keyword for ranges: 1..end
 - Better tokenizing errors
 - Better parsing errors
 - Syntactic analysis
 - Reflection

Keywords
if, then, else, do, while, for, in, match, with, return, throw, extend, try, catch, finally

Data
Nothing, True, False, Boolean, Number, String, List, Map, Function,  // Generator, Class

# Builtins
import, export, merge, count, copy, print, input, help, type, describe, meta, NaN, Infinity, main, assert, test

```
import
Returns whatever is exported from path.
 - strict traversal rules
 - only loads once unless reloaded
Function { 
    path => ..., 
    path, Map [ :reload, ... ] => ..., 
}

export
Exports a value
 - can only be called once per module (file)
Function { value -> ... }

merge
Combines two values into a new value, 2nd value overwrites if appropriate
 - merge(List [1, 2, 3], List [4])          --> List [1, 2, 3, 4]
 - merge(Map [ x: 1, y: 1 ], Map [ y: 2 ]   --> Map [ x: 1, y: 2 ])
 - merge("hello", "world")                  --> "hello world"
 - merge(1, 5)                              --> 6
 Type errors for Nothing, True, False, Function, Generator

count
Returns the count of a value
 - count(List [1, 2, 3])        --> 3
 - count(Map [ x:1, y: 1 ])     --> 2
 - count("hello")               --> 5
 - count(4)                     --> 4
 - count(True)                  --> 1
 - count(False)                 --> 0
 - count(Nothing)               --> 0
 - count(Function { x -> x })   --> 1 (function arity)
 - count(generator)             --> expends generator and counts calls

copy
Makes a deep copy of whatever you give it

print
Prints a nice to read version of the thing
 - print("hello")        --> hello
 - print(4)              --> 4
 - print(Nothing)        --> 
 - print(List [1, 2, 3]) --> 1, 2, 3

input
gets users input
Function { prompt -> ... }

help
Returns a general help message and returns the docstring of any value you give 
it

type
returns the type of whatever you give it

describe
prints a nice for debugging version of whatever you give it

meta
used to access meta details of the runtime, evaluate arbitrary code, other dangerous stuff
called with no arguments returns the current environment
 - meta() --> Map [ host: "python", version: "0.0.1" ]
 - meta('''
    # This is python code
    print('hello, world')
 ''')



for x in y while x < y do {
    
}

```

# TODO
 - create error message templtaes that pattern match on
    - finnally
    - yield
    - the parser stack
    - the expected production
    - the preeceeding and proceeding token
    - once a few are matching, just create error messages as you go


-- Some meta programming
var eazy = import("eazy")
var Map [ eval_string, eval, node: t ] = eazy

var x = eval_string("4 + 4")
print(x) --> 8

var y = eval(List [ t.module,
   List [ t.add, 
      List [ t.number, 4 ],
      List [ t.number, 4 ],
   ],
])
print(y) --> 8

print(describe(eazy.language.parse("4 + 4")))
--> List [ "module",
--      List [ "add", 
--          List [ "number", 4 ],
--          List [ "number, 4 ],
--      ],
--  ]


var Shape = Class {}

var Rectangle = Class { width, height ->
   extend Shape()
   if use_object:
      extend Object()
   var width = width
   var height = height
}

r = Rectangle(3, 4)

class.of(r)
Class.instance_of?(r, Rectangle) --> True
Class.instance_of?(r, Shape) --> True


# Potential Additional features
-- default arguments
Function { x, y ...z, sep:"," -> }

-- named arguments
f(1, 2, 3, sep:" ")

-- remove classes
-- This is not an object oriented langauge

-- promote assert to keyword, it should behave more like a macro (capturing source code)
-- promote should be a statement too, has no meaningful value

assert x == 4

test "1 + 1 == 2" {
   assert 1 + 1 == 2
}

vs.

var test = import("test")

test("1 + 1 == 2", Function {
   assert 1 + 1 == 2
})

-- String interpolation
"string with ${variables} in it"

-- Allow for assignment like
x.y = 4
x[variable] = 9

var Stack = Function { ...args -> args }
var pop = List.pop

exprt(Map [ new: Stack, pop ])

var Stack = import("./stack")
var s = Stack.new(1, 2, 3)
Stack.pop(s)

vs. 

```
Var Stack = Type [ 
   Function { List [...items] -> items },
   Map [ 
      pop: List.pop, 
      push: List.push
   ]
]

var s = Stack [ 1, 2, 3 ]
Stack.pop(s)
Stack.push(s)
match s {
   Stack [ x, y, z, ... ] => "this matches a stack of 3 or more items",
   List [ ... ] as xs => "this matches any list, but also any stack!"
}

-- Define a class
var Box = Class(Map [
   new: Function { value -> Map [ value ] },
   map: Function { self, fn -> update(self, "value", fn(self.value)) }
])

-- instantiate a class
var my_box = Box.new(4)
-- call a method directly
Box.map(my_box, Number.increment)
-- create a multimethod
var map = Method("map")
map(my_box, Number.increment)

-- Implementing your own types and generic methods

Type RGBA { Map [ red, green, blue, alpha ] }

var toRGBA = Method { RGBA [ red, green, blue, alpha ] as rgba -> 
   rgba 
}

abs = Method.abs

Type HSLA { Map [ hue, luminosity, saturation, alpha ] }

Method toRGBA { HLSA [ hue: H, luminosity: L, saturation: S alpha: A ] ->
   ...
}

-- While cool it jsut seems overly complicated and unecessary

-- example usage
var my_box = Box [ 12 ]
print(Box.get(my_box))
var my_ref = Ref [ 13 ]
print(Ref.get(my_box))
var get = method("get")
print(get(my_box))
print(get(my_ref))

var empty = Nothing

var iterator = Generator { cdr ->
   while not Nothing?(cdr) do {
      var List [ car, next_cdr ] = cdr
      yield car
      cdr = next_cdr
   }
}

var size = Function {
   Nothing           => 0,
   List [ car, cdr ] => 1 + size(cdr)
}

var remove = Function {
   Nothing, n => Nothing,
   List [ car, cdr ], 0                   => cdr,
   List [ car, List [ car2, cdr2 ] ], 1   => List [ car, cdr2 ],
   List [ car, cdr ], n if n > 0          => List [ car, remove(cdr, n - 1) ],
}

var get = Function {
   Nothing, n => Nothing,
   List [ car, cdr ], 0          => car,
   List [ car, cdr ], n if n > 0 => get(cdr, n - 1)
}

var insert = Function {
   Nothing, n, item if n > 0           => Nothing
   list, 0, item                       => List [ item, list ]
   List [ car, cdr ], n, item if n > 0 => List [ car, insert(cdr, n - 1, item) ] 
}

var add = Function {
   list, item -> List [ item, list ]
}

var add_end = Function {
   List [ car, Nothing ], item   => List [ car, item ]
   List [ car, cdr ], item       => List [ car, add_end(cdr, item) ]
}

var to_string = Function {
   var result = ""
   for item in iterator() do {
      result = merge(result, String(item), " ")
   }
   result
}

-- Alright now for the non java-y one
-- LList.ez

var Nil = Nothing

var Cons = Function { first, rest -> 
   List [ first, rest ]
}

var count = Function {
   Nothing              => 0,
   List [ first, rest ] => 1 + count(rest)
}

var iterate = Generator { list ->
   while not Nothing?(list) do {
      var List [ first, rest ] = list
      yield first
      list = rest
   }
}

var map = Function {
   f, Nothing => Nothing,
   f, List [ first, rest ] => Cons(f(first), map(f, rest)) 
}

var filter = Function {
   p, Nothing => Nothing,
   p, List [ first, rest ] => if p(first) then { 
      Cons(first, filter(p, rest))
   } else {
      filter(p, rest)
   }
}

var reduce = Function {
   -- No initial value
   f, Nothing => Nothing
   f, List [ first, rest ] => reduce(f, first, rest)
   -- With inital value
   f, init, Nothing => init,
   f, init, List [ first, rest ] => reduce(f, f(init, first), rest)
}

var nth = Function {
   n, Nothing => Nothing,
   0, List [ car, cdr ] => car,
   n, List [ car, cdr ] if n > 0 => nth(n - 1, cdr)
}

var show = Function { list ->
   reduce(Function { result, item -> merge(", ", item) }, list) or ""
}

export Map [ Nil, Cons, count, iterate, map, filter, reduce, show ]

var Map [ Nil, Cons, ... ] as LList  = import("./LList.ez")

var my_list = Cons(1, Cons(2, Cons(3, Nil)))

print(LList.show(my_list))




-- Implementing an Object System

-- The Base Object
var Object = Map []

var Class = Function {
   -- Provide a default super class if not provided
   Map [ ... ] as class => 
      Class(Object, class),

   -- Constructable class
   super, Map [ ... ] as class => do {
      class = merge(super, class)
      var old_new = class.new
      class.new = Function { ...args ->
         var instance = Map [ class ]
         if old_new then {
            old_new(instance, ...args)
         }
         return instance
      }
      return class
   }
}

var method = Function { selector ->
   Function { object, ...args ->
      object.class[selector](object, ...args)
   }
}

var methods = Function { ...selectors ->
   Map.from_pairs(List.map(selectors, Function { selector ->
      List [ method, method(selector) ]
   }))
}

var Dog = Class(Map [
   species: "mammal",

   new: Function { self, name, age
      self.name = name
      self.age = age
   },

   description: Function { self ->
      "${self.name} is ${self.age} years old"
   }

   speak: Function { self, sound ->
      "${self.name} says ${sound}"
   }
])

var RussellTerrier = Class(Dog, Map [
   run: Function { self, speed ->
      "${self.name} runs ${speed}"
   }
])

var BullDog = Class(Dog, Map [
   run: Function { self, speed ->
      "${self.name} runs ${speed}"
   }
])

var Map [ description, speak, run ] = methods("description", "speak", "run")

jim = Bulldog.new("Jim", 12)
bob = RusselTerries("bob", 3)

description(jim) 
description(bob)
run(jim, "slowly")
run(bob, "quick")

```



## Bytecode Thinking

```
Registers


File Format
 - Header
   - Signature
   - Version
   - Program Length
   - Code start
   - Constant start
   - Checksum
 - Code
 - Constants
   - Number of constants
   - Types of constants
   - Constants themselves


Type (4 bits)
 - 0  None
 - 1  True
 - 2  False
 - 3  Integer
 - 4  Float
 - 5  String
 - 6  List
 - 7  Map
 - 8  Function
 - 9  Type
 - 10 Meta

Storage
 - None 4 bits
 - True 4 bits
 - False 4 bits
 - Integer 4 bits + 64 bits
 - Float 4 bits + 64bits
 - String 4 bits + 28 bits to encode length + bytes worth of length
 - List 4 bits + 28 bits to encode length + type table, values
 - Map 4 bits + 28 bits to encode length + type table, values
 - Type 4 bits + 4 bits to encode type of type
 - Meta 4 bits + 64bits to encode pointer

Opcodes
 - DUP 
 - PSH <C>
 - POP [ <D> ]
 - MOV <A> <B>
 - SWP [ <A> <B> ]
 - SEL <A>
 - NEG [ <A> <B> ]
 - NOT [ <A> <B> ]
 - CNT [ <A> <B> ]
 - ADD [ <A> <B> ]
 - SUB [ <A> <B> ]
 - MUL [ <A> <B> ]
 - DIV [ <A> <B> ]
 - POW [ <A> <B> ]
 - MOD [ <A> <B> ]
 - RNG [ <A> <B> ]

[ 6 bit op ] [ args | locals | stack | konstants ] [ 8 bit a ] [ 8 bit b ] [ 8 bit c ]
[ 6 bit op ] [ args | locals | stack | konstants ] [ 8 bit x ] [ 16 bit y            ]
[ 6 bit op ] [ args | locals | stack | konstants ] [ 24 bit k                        ]

stop
select
get
set
load_none
load_true
load_false
load_int
load_local
load_const [const index]
load_capture [capture index]
pop
count
return
throw
call
breakpoint
type
check_type
add
sub
mul
div
exp
mod
range
eq
neq
is
isnot
lt
lte
gt
gte
in
notin



add = Function { a, b ->
   a + b
}

add 3 4

.add
   add

ldk 3
ldk 4
ldk add
call

PC/IP -> Program Counter, Instruction Pointer
Header -> signarure, version, checksum, program length, where code section
Constants/Data -> Number of constants/size/type, easily set up unto a table



print("Hello, World!")

#code
   PUSH 0
   PRINT
   EXIT
#data
   STR "Hello, World!"


var eazy = import("eazy")
var Map [ eval_string, eval, node: t ] = eazy

var x = eval_string("4 + 4")
print(x) --> 8

var y = eval(List [ t.module,
   List [ t.add, 
      List [ t.number, 4 ],
      List [ t.number, 4 ],
   ],
])

reduce(for square(n) in range(10) if n < 10, Number.sum)

reduce(
   filter(
      map(
         range(
            10
         ), 
         square
      ), 
      Function { n -> n < 10 }
   ), 
   Number.sum
)

--- No
-- chain 10 with {
--    x => range(x),
--    x => map(x, square),
--    x => filter(x, Function { n -> n < 10 })
--    x => reduce(x, Number.sum)
-- }
-- 
-- chain 10 with {
--    => range(_),
--    => map(_, square),
--    => filter(_, Function { n -> n < 10 }),
--    => reduce(_, Number.sum),
-- }

thread_first(10,
   List [ range ],
   List [ map, square ],
   List [ filter, Function { n -> n < 10 } ],
   List [ reduce, Number.sum ],
)

-- Kinda like the best
Function.chain(
   range,
   Function { xs -> map(xs, square) },
   Function { xs -> filter(xs, Function { n -> n < 10 }) },
   Function { xs -> reduce(xs, Number.sum) },
)(10)

Function.compose(
   Function { xs -> reduce(xs, Number.sum) },
   Function { xs -> filter(xs, Function { n -> n < 10 }) },
   Function { xs -> map(xs, square) },
   range,
)(10)


{
   code: [ ... ],
   data: [ ... ],
   debug: {
      sources: [],
      lines: [],
      functions: [],
      symbols: [], 
   },
}

```


```js
// In memory representation JSON-able - this may be enough
[
   // [ OPCODE, ...operands ],

   // Control
   [ MODULE, version, canonical_path, locals ],
   [ HALT ],
   [ LABEL, label_identifier ],
   [ GOTO, label_identifier ],
   [ GOIF, condition, label_identifier ],
   [ IMPORT, path, dst ],
   [ EXPORT, src ],

   // Arithmetic
   [ ADD, left, right, dst  ],
   [ SUB, left, right, dst  ],
   [ MUL, left, right, dst  ],
   [ DIV, left, right, dst  ],
   [ MOD, left, right, dst  ],
   [ POW, left, right, dst  ],
   [ FLOOR, src, dst ],
   [ CEIL, src, dst ],

   // Bit-orients
   [ BIT_AND, left, right, dst ],
   [ BIT_OR, left, right, dst ],
   [ BIT_XOR, left, right, dst ], 
   [ BIT_NOT, src, dst ],
   [ BIT_SHL, src, shift, dst, ]
   [ BIT_ASHR, src, shift, dst ],
   [ BIT_LSHR, src, shift, dst ],

   // Booleans and tests
   [ AND, left, right, dst ],
   [ OR, left, right, dst ],
   [ NOT, src, dst ],
   [ EQ, left, right, dst ],
   [ IS, left, right, dst ],
   [ LT, left, right, dst ],
   [ LTE, left, right, dst ],
   [ GT, left, right, dst ],
   [ GTE, left, right, dst ],

   // Variables
   [ MOVE, src, dst ],
   [ COPY, src, dst ],
   [ CONST, value, dst ],

   // Types
   [ TYPE, src, dst ],

   // Exceptions
   [ TRHOW, src ],
   [ TRY, dst, handler ],
   [ CAUGHT ],

   // Collections (Array, Map, Ref, String)
   [ MERGE, left, right, dst ],
   [ UPDATE, left, right, dst ],
   [ GET, key, col, dst ],
   [ SET, key, col, dst ],
   [ PUSH, col, val, dst ],
   [ COUNT, col ],
   [ SLICE, col, start, end, dst ],
   [ REPEAT, col, times, dst ],
   [ INDEX, col, key, dst ],
   [ REVERSE, col, dst ],
   [ ENTRIES, col, dst ],
   [ KEYS, col, dst ],
   [ VALUES, col, dst ],
   [ FREEZE, col ],

   // Strings
   [ UNICODE, src, key dst ],
   [ MATCH, src, pat, dst ],
   [ SPLIT, src, pat, dst ],
   [ JOIN, src, pat, dst ],

   // Functions
   [ FUNCTION, name, locals ],
   [ CLOSURE, name, caps, dst ],
   [ CALL, closure, args, dst ],
   [ TAIL_CALL, closure, args ],
   [ RETURN, src ],

   // Extensions
   [ EXTENSION, name, dst ] ],

   // Debug
   [ BREAK ],
   [ TRACE, dst ],
   [ META, dst ],
]

/* eg.ez
var add = Function { a, b -> a + b }
export Map [ add ]
*/
[
   [ MODULE, "0.0.1", "eg.ez", 1 ],

   [ CLOSURE, "add", V[0], V[0] ],
   [ EXPORT, V[0] ],

   [ FUNCTION, "add", 2, 2 ],
   [ GET, 0, ARGS, V[1] ],
   [ GET, 1, ARGS, V[0] ],
   [ ADD, V[0], V[1], V[0] ],
   [ RETURN, V[0] ],
]


/*
var my_count = Function {
   List [] => 0,
   List [ x ] => 1,
   List [ x, ...xs ] => 1 + my_count(xs),
}

export count(List [ 1, 2, 3 4 ])

-- desugars into =>

var my_count = Function { ...args ->
   if type(arg[0]) is List & count(arg[0]) is 0 then {
      return 0
   }
   if type(arg[0]) is List & count(arg[0]) is 1 then {
      return 1
   }
   if type(arg[0]) is List & count(arg[0]) > 1 then {
      var x = arg[0][0]
      var xs = arg[0][1..]
      return 1 + my_count(xs)
   }
   throw Error("MatchError", "my_count", arg)
}

-- which is optimized to
var my_count = Function { ...args ->
   if count(args) is not 1 then {
      throw Error("MatchError", "my_count", arg)
   }
   var arg = args[0]
   if type(arg) is not List then {
      throw Error("MatchError", "my_count", arg)
   }
   var result = Map [ 0: 0, 1: 1 ][count(arg)]
   if result is not Nothing then {
      return result
   }
   var xs = args[1..]
   return 1 + my_count(xs)
}
*/


[
   [ MODULE, "0.0.1", "eg.ez", 2 ],

   [ CLOSURE, "count", V[0], V[0], ],
   [ CONST, [ 1, 2, 3, 4 ], V[1] ],
   [ CALL, V[0], V[1], V[0] ],
   [ EXPORT, V[0] ],

   [ FUNCTION, "count", 1, 3 ],
   [ TYPE, ARGS, V[1] ],
   [ CONST, LIST_TYPE, V[2] ],
   [ IS, V[1], V[2], V[2] ],
   [ GOIF, V[2], "cases" ],
   [ CONST, V[]]

   [ COUNT, ARGS, V[1] ],
   [ CONST, 0, V[2] ],
   [ IS, V[1], V[2], V[2] ],
   [ GOIF, V[2], "case1" ],
   [ CONST, 1, V[2] ],
   [ IS, V[1], V[2], V[2] ],
   [ GOIF, V[2], "case2" ],

]
```

I am struggling with a design decision re: my new programming language. Its not just one thing, but a group of issues that all interconnect. You'll need some contxt.

In order to maintain my goal of creating a programming language for beginners I have several tenants
 - Minimize concepts. Memory management, type systems, object oriented programming, functional programming, etc. should all be unecessary to understand code
 - Avoid implicit code. Many languages have constructs that reduce the size of code by implicitly doing things. Object Oriented programming is the classic example where `List.reverse(my_list)` becomes `my_list.reverse()`.
 - Try to have one way to do things. Most languages have many ways to do the same thing. I want to try and minimize this.
 - Emphasize procedures and data. Programs in this langauge should be written by writing procedures (functions) which take data and produce data. Data, in the form of lists, maps, strings, numbers, etc. should be easy to express and procedures should flow top to bottom.

One design decision I have come to is that there are only two "compound" types in the language, lists and maps. There are NO sets, modules, namespaces, buffers, structs, records, etc. All fo those things, if needed, are intead created out of combinations of lists and maps. So, for example to create a math library with several math related functions, rather than putting those functions in the same namespace/module/package they would instead be placed in a map. Here is a madeup example

```
-- This is a comment. 
- This is in imaginary file math.ez

var square = Function { x -> 
    x * x 
}

var cube = Function { x -> 
    x * x * x 
}

export(Map [
    "square": square,
    "cube": cube,
])

-- In another file
var Math = import("math.ez")

var x = Math["square"](42)
```

Because this will be such a common way to structure code there are several pieces of syntactic sugar which can be taken from languages like JavaScript, here are some

```
-- Allow string lookups to be done using dot notation
Math["square](42) == Math.square(42)

-- Allow map creation to skip quotes around strings
Map [ "square": square ] == Map [ square: square ]

-- Allow map creation to skip providing a key and a value if the key and value have the same name
Map [ square: square ] == Map [ square ]
```

These are all rather convenient, but come at a cost. They introduce conceptual overhead, produce multiple ways to do things, and in the case of the final example perform implicit actions.

Completely throwing away all of this sugar though is not enitrely justifiable. I insist that library calls look like one of the following

```
Math.square(42)
-- or
Math:square(42)
-- or
Math::square(42)
```

Providing any of these notations makes map creation like the following seem like it would logically follow

```
Map [ square: square ]
```

Since we didn't need to quote the string when accessing the map, why would we need to quote it when creating it? Well let's say we accept this, and forget about the other two forms of syntactic sugar. There is still a wrinkle. Is the key of a map a pattern or an expression? Maybe the distinction doesn't make sense, but here is an example that should help clarify

```
var key = "not_a_key"
Map [ key: 42 ]
-- is this
Map [ "key": 42 ]
-- or
Map [ "not_a_key": 42 ]
```

JavaScript solves this dilemma by adding yet another bit of syntax for when you want the keys of an object to be an expression `[]`. This would change the above to

```
Map [ key: 42 ] == Map [ "key": 42 ]
Map [ [key]: 42 ] == Map [ "not_a_key": 42 ]
```

On another note one of the other details of this language is that there is a short list of fundamental types. They are
 - `Nothing` (think NULL)
 - `Boolean` (True or False)
 - `Number` (Floating Point double precision)
 - `String`
 - `List`
 - `Map`
 - `Function`

When considering theses types there are a few unsolved problems. One example is wwhat to do wwhen I want something /like/ an enum. There are several possibilities

```
-- Declare constants
var RED = 0
var GREEN = 1
var BLUE = 2

-- Capture values in a map
var Color = Map [
    RED: 0,
    GREEN: 1,
    BLUE: 2,
]

-- Use strings rather than numbers 
-- for simpler debugging
var Color = Map [
    RED: "RED",
    GREEN: "GREEN",
    BLUE: "BLUE",
]

-- Coulr wrap up one of the above in a function call too
var Color = Enum(
    "RED", 
    "GREEN", 
    "BLUE"
)
```

Another solution is to introduce a new type to represent enum values. A common feature of dynamic languages is an atom type (aka as a keyword or symbol). Atoms compare like numbers, but look kind of like strings. All they are really good for is asking is this atom the same as another atom. Here are some examples of common syntax for these in other languages

```
-- Clojure, Elixir, and Ruby
:atom
-- JavaScript
Symbol("atom")
-- Erlang
'atom'
-- Tulip
.atom
-- Lisp
'atom
-- Prolog
atom
```

Introducing atoms would be a gread solution for the enum problem, but introduces two new problems: 
 - Atoms are another concept a language user has to learn. 
 - It is not clear how atoms should interact with maps

Expanding on the second point, in languages with atoms, they typically act as the default key type for maps so the following would change

```


import "IO" as IO as Map [
    read_file,
    write_file,
]

import "IO" as IO as Map [
    :read_file = read_file,
    :write_file = write_file,
]

var Color = Set [ :red, :green, :blue ]
```

Atom vs keyword (almost ashuredly go with keyword)

Extra types
 - Reference, Handle, BlackBox type
 - Buffer/Array/Bytes type
 - Set (would make a lot of sense, I don't think it would be overload)

```
import("IO") as Map [
    read_file,
    write_file,
]

let square = Function { x -> x * x }
var square = Function { x -> x * x }

not(choice("i", "&", "2", "@""))

let List [ x, y ] = List [ 1, 2 ]

List [ 1, 2 ] as List [ x, y ]

Function square { x ->
   x * x
}

while i < count(array) do {
   i = i + 1
}

import("Eazy/IO") as Map [

]
let IO      = import("IO")
let Parsing = import("Parsing")
let Lexer   = import("Lexer")

let main = Function { 
   IO.print("Hi!")
}

-- with spreads this becomes crazy powerful
Map [ :collection:size = length ] == Map [ :collection = Map [ :size = length ] ]

Color = Enum(
   :red = "red",
   :blue = "blue",
   :green = "green",
)

match result {
   List [ .ok, result ] => 
   List [ .uh_oh, error ] => 
}
```

# TODO
 - error reporting
   - Point to place in source
   - Pattern match to the correct message
 - analysis
   - ScopeAnalysis (create scope object, mark constants, assignments, unused)
 - desguar
   - eliminate do expression
   - eliminate for expression
   - eliminate match expression
   - eliminate cased functions
   - eliminate one armed if 
 - Code gen
   // later
   - analysis
      - ConstantAnalysis (find and mark constant expressions)
      - DeadCodeAnalysis (find and mark dead code)
      - ReturnAnalysis (find and mark variables that are returned)
      - EscapeAnalysis (find and mark variables that escape their function)
   - desugar
      - eliminate unused variables
      - eliminate dead code 
   - optimization loop
      - Peephole optimizations
      - constant folding
      - compound type elimination
      - inline

 - code gen
   - generate ezir
 - interpreting
   - start with directly executing ezir
   - worry about bytecode later
 - prelude
   - implement prelude
   - hook prelude into compiler
 - self hosting

```
match ezir[isp] with {
    List [ .move, vx, vy ] => do {
       vars[vy] = vars[vx]
    },
    List [ .mul, vx, vy, vz ] => do {
       vars[vz] = vars[vx] * vars[vy];
    },
    ...
}
```

Hot reloading as a library

```
let HotReload = import("core/HotReload")
 -- HotReload.watch_file(path, on_change)
```

```
try { x.y.z } catch { else => False }
try { x.y.z } else { False }
default(try { x.y.z }, False)

let default = Function { 
   Nothing, default_value => 
      default_value,
   value, _, =>
      value
}

if Nothing?(x) then { default_value } else { x }

default_if(Nothing?, x, default_value)

sh.mkdir("~/site", List [ .p ])
sh.cd("~/site")
for domain in List [
   "site.com",
   "site.co.uk",
   "site.fr,
   "site.ca",
   "site.de",
] do {
   sh.git.clone(String.template("{git_url}/{domain}.git", Map [
      git_url,
      domain,
   ])
}
```

# Analysis phase 1
 - Assign variables to all identifiers 
   - allows for the eliminatino of do expressions

# Desugaring
 - Standardize if expressions
 - Simplifiy assignments
 - Convert multi case funcions into single case + match
 - Convert multi case catch into single case + match
 - Split pattern conditions
 - Convert destructuring into assignments
 - Convert pattern matching into if expressions
 - Convert for loops into while loops
 - Hoist declarations
 - Flatten blocks

# IR
 - Convert to Basic Block CFG IR
 - .future Convert to SSA Form

# Optimization
 - .future Dead code analysis
 - .future Escape analysis
 - .future Type checking
 - .future Subexpression elimination
 - .future Peekhole etc.

# Bytecode
 - Convert from IR to bytecode

```
-- Rough Pipeline
Source
   -> lexer
   -> parser
   -> analysis
      -> scope analysis
   -> desugar
      -> desugar if branch
      -> desugar List expressions
      -> desugar Map expressions
      -> desugar declarations
      -> desguar do expressions
      -> desugar multi case functions
      -> desugar multi case catch
      -> desugar patterns
         -> desguar split patterns
         -> desugar pattern matching
         -> desugar destructuring
         -> desugar match
      -> for loops into while loops
      -> inline all "builtin" function calls
      -> replace all assignment to captured variables with references
   -> ir generation
   -> optimization
   -> byte code generation
```

# Concurreny Model

Nothing
Boolean (True and False)
Number
String
Symbol
List
Map
Function
--
Reference (blackbox)

## Names
Future
Incomplete
Eventual

## Nixed
 x Deferred
 x Delayed
 x Unfinished
 x Promise
 x Task
 x Job
 x Later
 x Asynchronous

```

let x = input() --> FutureValue
await x --> PresentValue

-- Get a concurrent value
let my_func = Function {
    let user_input = await input()
    return user_input
}

await my_func() --> they would get back a concurrent value

-- Catch a concurrent error
try {
    let user_input = await input()
} catch { err ->
   ...
}

-- Create a concurrent value?

Function make_input_uppercase {
    x = FutureValue {
        return String.to_uppercase(await input() --- "hello" ---) --- "HELLO" ---
    } --- FutureValue ---
    -- proceed without waiting for x
    -- await x --- "HELLO" ---
    return x
}

Function make_input_uppercase {
    return String.to_uppercase(await input())
}

let input_function = make_input_uppercase
let user_input = await input_function

```

```
input().then(function(user_input) {
    ...does stuff with user input
})
// this code here doesn't have user_input
```

# Intrinsics

Reserve `__`

```
__intrinsic ADD (x, y)
try {
   __intrinsic EXT ("Buffer")
} else {
   extension_available = False
   array_implementation
}

```


## Parser rewrite

Get rid of all this speculative parsing and replace it with a lookahead parser.