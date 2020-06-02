import json

def describe(value):
    # TODO
    # - think about how to print circular references
    # - think about how to print large lists and maps
    # - think about how to print functions, generators, and classes
    if value is None:
        return "Nothing"
    if type(value) in [bool, int, float]:
        return repr(value)
    if type(value) is str:
        return json.dumps(value)
    if type(value) is list:
        if len(value) == 0:
            return "List []"
        return "List [ " + ", ".join(describe(v) for v in value) + " ]"
    if type(value) is map:
        if len(value) == 0:
            return "Map []"
        return "Map [ " + ", ".join(describe(k) + ": " + describe(v) for k, v in value.items()) + " ]"
    return repr(value)
