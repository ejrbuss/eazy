# EZIR Pseudo Grammar

This is a very rough spec for the grammar. It is meant to assist implementation
and document changes, but not capture every detail. Specifically this parser
does not capture how whitespace is parsed nor the structure of the AST.

## Whitespace

Whitespace is roughly handled as follows
 - Parse ";" as an explicit terminator
 - Parse "\n" as an implicit terminator
 - Skip implicit terminators if their nearest parent punctuation is "()" or "[]"
 - Skip implicit terminators in non-ambiguous context

What non-ambiguous contexts are is currently not formally specified.

```
module
    = statments

statements
    = { statement }

statement
    = declaration
    | return_statement
    | throw_statement
    | assignment
    | expression

declaration
    = [ <doc> ] "let" pattern "=" expression

pattern
    = bindings

bindings
    = binding { "as" binding }

binding
    = range_binding
    | spread_binding
    | list_binding
    | map_binding
    | box_binding
    | simple_literal

range_binding
    = <number> ".." <number>

spread_binding
    = "..." [ <identifier> ]

list_binding
    = "List" "[" patterns "]"

patterns
    = [ pattern ] { "," pattern } [ "," ]

map_binding
    = "Map" "[" pattern_pairs "]"

pattern_pairs
    = [ pattern_pair ] { "," pattern_pair } [ ","] 

pattern_pair
    = pattern "=" pattern
    | <identifier>

box_binding
    = "Box" "[" pattern "]"

simple_literal
    = <identifier>
    | <symbol>
    | <string>
    | <number>
    | <boolean>
    | <nothing>

return_statement
    = "return" expression

throw_statement
    = "throw" expression

assignment
    = <identifier> { access } "=" expression

expression
    = control_expression
    | primary_expression

control_expression
    = if_expression
    | do_expression
    | while_expression
    | match_expression
    | for_expression
    | try_expression

if_expression
    = "if" primary_expression "then" block [ "else" if_continuation ]

if_continuation
    = block
    | if_expression

do_expression
    = "do" block

while_expression
    = "while" primary_expression do_expression

match_expression
    = "match" [ primary_expression "with" ] cases

cases
    = "{" [ case ] { "," case } [ "," ] [ else_case "," ] "}"

case
    = patterns [ "if" expression ] "=>" statement

else_case
    = "else" "=>" statement

for_expression
    = "for" pattern "in" primary_expression [ "if" primary_expression ] [ "while" primary_expression ] do_expression

try_expression
    | "try" block [ try_else ] [ catch ] [ finally ]

try_else
    | "else" block

catch
    = "catch" cases
    | "catch" case_block

finally
    = "finally" block

case_block
    = "{" patterns [ "if" primary_expression ]  "->" statements "}"
    | block

block
    = "{" statements "}"

primary_expression
    = or_expression

or_expression
    = and_expression { "or" and_expression }

and_expression
    = relational_expression { "and" relational_expression }

relational_expression
    = additive_expression { relational_operator additive_expression }

relational_operator
    = "/=" 
    | "=="
    | "is not"
    | "is"
    | "<=" 
    | "<" 
    | ">=" 
    | ">" 
    | "not in"
    | "in"

additive_expression
    = multiplicative_expression { additive_operator multiplicative_expression }

additive_operator
    = "+"
    | "-"

multiplicative_expression
    = exponential_expression { multiplicative_operator exponential_expression }

multiplicative_operator
    = "*"
    | "/"

exponential_expression
    = unary_expression [ exponential_operator exponential_expression ]

exponential_operator
    = "^"
    | ".."

unary_expression
    = [ unary_operator ] operator_free_expresion

unary_operator
    = "not"
    | "+"
    | "-"

operator_free_expresion
    = simple_expression { call_or_access }

call_or_access
    = call
    | access

call
    = "(" expressions ")"

expressions
    = [ expression ] { "," expression } [ "," ]

access
    = <symbol>
    | "[" expression "]"

function
    = "Function" cases
    | "Function" case_block

list_literal
    = "List" "[" list_items "]"

list_items
    = [ list_item ] { "," list_item } [ "," ]

spread_item
    = "..." operator_free_expression

list_item
    = spread_item
    | expression

map_literal
    = ""Map "[" map_items "]"

map_items 
    = [ map_item ] { "," map_item } [ "," ]

map_item
    = spread_item
    | pair

pair
    = expression "=" expression
    | <identifier>

box_literal
    = "Box" "[" expression "]"

simple_expression
    = "(" expression ")"
    | function
    | list_literal
    | map_literal
    | box_literal
    | simple_literal

```