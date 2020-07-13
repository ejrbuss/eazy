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
Nothing, True, False, Boolean, Number, String, List, Map, Function, Generator, Class

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
      sources: {
         "file.ez": "source"
      },
      lines: [],
      functions: [],
      symbols: [], 
   },
}

```