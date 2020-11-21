interface Callback {
    (err?: Error): void;
}

interface ResultCallback<T> {
    (err?: Error, result?: T): void;
}

interface SpecificationFile {

    id: string;
    filename: string;
    queued?: boolean;
    processed?: boolean;
    referenced?: boolean;

    symbol?: string;
    content?: fhir.DomainResource;
    type?: Type;
}

interface SpecificationFileMap {

    [id: string]: SpecificationFile;
}

interface Type {

    kind: TypeKind;
    category: TypeCategory;
    name?: string;
    description?: string;
}

interface PrimitiveType extends Type {

    intrinsicType: string;
}

interface ObjectType extends Type {

    properties: Property[];
}

interface InterfaceType extends ObjectType {

    baseType?: string;
}

interface EnumType extends Type {

    members: EnumMember[];
}

interface TypeReference extends Type {

    binding?: string;
}

interface ArrayType extends Type {

    elementType: Type;
}

interface UnionType extends Type {

    types: Type[];
}

interface AliasType extends Type {

    type: Type;
}

declare const enum TypeKind {

    TypeReference = 1,
    ObjectType = 2,
    InterfaceType = 4,
    EnumType = 8,
    ArrayType = 16,
    UnionType = 32,
    Primitive = 64,
    AliasType = 128,
    ObjectTypes = InterfaceType | ObjectType,
    RootTypes = Primitive | ObjectTypes | EnumType | AliasType
}

declare const enum TypeCategory {

    None = 0,
    Primitive,
    DataType,
    Resource,
    SubType,
    ValueSet,
    CodeSystem
}

interface Property {

    name: string;
    description: string;
    type: Type;
    optional: boolean;
}

interface EnumMember {

    name: string;
    description?: string;
    value: string;

    display?: string;
    system?: string;
    caseSensitive?: boolean;
    parent?: EnumMember;
}

interface CreateFileMapResults {

    files: SpecificationFileMap;
    errors: string[];
}

interface ProcessFilesResults {

    types: Type[];
    errors: string[];
}

interface EmitResults {

    errors: string[];
}


interface Reference<T> {
    reference: string;
    display: string;
}
