debug = {
  type: 'Module',
  block: [
    {
      type: 'Declaration',
      doc: undefined,
      pattern: {
        type: 'Pattern',
        bindings: [
          {
            type: 'Identifier',
            position: 13,
            length: 1,
            value: 'x',
            scope: {
              locals: {
                x: {
                  declaring_token: [Circular],
                  name: 'x',
                  constant: false
                }
              },
              non_locals: {}
            }
          }
        ],
        scope: {
          locals: {
            x: {
              declaring_token: {
                type: 'Identifier',
                position: 13,
                length: 1,
                value: 'x',
                scope: [Circular]
              },
              name: 'x',
              constant: false
            }
          },
          non_locals: {}
        }
      },
      expression: {
        type: 'Number',
        length: 1,
        position: 17,
        value: 4,
        scope: {
          locals: {
            x: {
              declaring_token: {
                type: 'Identifier',
                position: 13,
                length: 1,
                value: 'x',
                scope: [Circular]
              },
              name: 'x',
              constant: false
            }
          },
          non_locals: {}
        }
      },
      scope: {
        locals: {
          x: {
            declaring_token: {
              type: 'Identifier',
              position: 13,
              length: 1,
              value: 'x',
              scope: [Circular]
            },
            name: 'x',
            constant: false
          }
        },
        non_locals: {}
      }
    },
    {
      type: 'Assignment',
      identifier: {
        type: 'Identifier',
        position: 27,
        length: 1,
        value: 'x',
        scope: {
          locals: {
            x: {
              declaring_token: {
                type: 'Identifier',
                position: 13,
                length: 1,
                value: 'x',
                scope: [Circular]
              },
              name: 'x',
              constant: false
            }
          },
          non_locals: {}
        }
      },
      accesses: [],
      expression: {
        type: 'Number',
        length: 1,
        position: 31,
        value: 5,
        scope: {
          locals: {
            x: {
              declaring_token: {
                type: 'Identifier',
                position: 13,
                length: 1,
                value: 'x',
                scope: [Circular]
              },
              name: 'x',
              constant: false
            }
          },
          non_locals: {}
        }
      },
      scope: {
        locals: {
          x: {
            declaring_token: {
              type: 'Identifier',
              position: 13,
              length: 1,
              value: 'x',
              scope: [Circular]
            },
            name: 'x',
            constant: false
          }
        },
        non_locals: {}
      }
    }
  ],
  scope: {
    locals: {
      x: {
        declaring_token: {
          type: 'Identifier',
          position: 13,
          length: 1,
          value: 'x',
          scope: [Circular]
        },
        name: 'x',
        constant: false
      }
    },
    non_locals: {}
  }
};