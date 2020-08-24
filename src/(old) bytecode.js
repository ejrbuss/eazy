const TypeTags = {
    // Trivials
    Nothing         : 0x00, // Tag (1B)
    True            : 0x01, // Tag (1B)
    False           : 0x02, // Tag (1B)
    // Common
    Zero            : 0x10, // Tag (1B)
    One             : 0x11, // Tag (1B)
    // Atomic
    Integer         : 0x21, // Tag (1B) integer (4B)
    Float           : 0x22, // Tag (1B) float (8B)
    // Collections
    Reference       : 0x30, // Tag (1B) type (...)
    EmptyReference  : 0x31, // Tag (1B)
    String          : 0x32, // Tag (1B) count (4B) ...characters
    EmptyString     : 0x33, // Tag (1B)
    List            : 0x34, // Tag (1B) count (4B) (...)
    EmptyList       : 0x35, // Tag (1B)
    HomogenousList  : 0x36, // Tag (1B) count (4B) type (1B) (...)
    Map             : 0x37, // Tag (1B) count (4B) (...)
    EmptyMap        : 0x38, // Tag (1B)
    HomogenousMap   : 0x39, // Tag (1B) count (4B) keyType (1B) valType (1B) (...)
    // Types
    TypeType        : 0x40, // Tag (1B)
    NothingType     : 0x41, // Tag (1B)
    BooleanType     : 0x42, // Tag (1B)
    NumberType      : 0x43, // Tag (1B)
    StringType      : 0x44, // Tag (1B)
    ListType        : 0x45, // Tag (1B)
    MapType         : 0x46, // Tag (1B)
    FunctionType    : 0x47, // Tag (1B)
};