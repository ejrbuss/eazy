import math
import inspect

NaN      = math.nan
Infinity = math.inf

Nothing  = None

def is_Nothing(anything):
    return anything is Nothing

Boolean = dict()

def is_Boolean(anything):
    return anything is True or anything is False

Number = dict()

def is_Number(anything):
    return type(anything) is int or type(anything) is float

String = dict()

def is_String(anything):
    return type(anything) is str

List = dict()

def is_List(anything):
    return type(anything) is list

Map = dict()

def is_Map(anything):
    return type(anything) is map

Genertor = dict()

def is_Generator(anything):
    return inspect.isgenerator(anything)

Function = dict()

def is_Function(anything):
    return inspect.isfunction(anything)

def import_(module_path):
    pass