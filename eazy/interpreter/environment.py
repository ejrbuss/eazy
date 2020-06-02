class Environment:

    def __init__(self, outer_environment=None, definitions=None):
        self.definitions = definitions or dict()
        self.outer_environment = outer_environment

    def get(self, name):
        if name in self.definitions:
            return self.definitions[name]
        elif self.outer_environment:
            return self.outer_environment.get(name)
        else:
            raise Exception(name + " not in environment!")

    def assign(self, name, value):
        if name in self.definitions:
            self.definitions[name] = value
        elif self.outer_environment:
            self.outer_environment.assign(name, value)
        else:
            raise Exception(name + " not in environment!")

    def merge(self, definitions):
        self.definitions.update(definitions)

    def __repr__(self):
        return repr(self.outer_environment) + " + " + repr(self.definitions)