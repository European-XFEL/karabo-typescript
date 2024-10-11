/* eslint max-classes-per-file: ["error", 50] */

export enum HashTypes {
  Bool = 0,
  VectorBool = 1,
  Char = 2,
  VectorChar = 3,
  Int8 = 4,
  VectorInt8 = 5,
  UInt8 = 6,
  VectorUInt8 = 7,
  Int16 = 8,
  VectorInt16 = 9,
  UInt16 = 10,
  VectorUInt16 = 11,
  Int32 = 12,
  VectorInt32 = 13,
  UInt32 = 14,
  VectorUInt32 = 15,
  Int64 = 16,
  VectorInt64 = 17,
  UInt64 = 18,
  VectorUInt64 = 19,
  Float32 = 20,
  VectorFloat32 = 21,
  Float64 = 22,
  VectorFloat64 = 23,
  ComplexFloat = 24,
  VectorComplexFloat = 25,
  ComplexDouble = 26,
  VectorComplexDouble = 27,
  String = 28,
  VectorString = 29,
  Hash = 30,
  VectorHash = 31,
  Schema = 32,
  None = 35,
  ByteArray = 37,
}

type ValueTypes = number|
                  number[]|
                  string|
                  string[]|
                  bigint|
                  bigint[]|
                  HashValue|
                  HashValue[]|
                  SchemaValue|
                  boolean|
                  boolean[]|
                  Uint8Array;

export interface KaraboType {
  type_: HashTypes;
  value_: ValueTypes;
}

export interface Attributes {
  [key: string]: KaraboType;
}

export interface HashNode {
  value: KaraboType;
  attrs: Attributes;
}

export class HashValue {
  [key: string]: HashNode;
}

export class Hash implements KaraboType{
  readonly type_ = HashTypes.Hash;

  constructor(public value_: HashValue) {}

  getNode(path: string) {
    const ret = path.split('.').reduce(
      (currentNode : HashNode | undefined, subPath : string) => {
        if (currentNode !== undefined &&
            currentNode.value.value_ instanceof HashValue &&
            subPath in currentNode.value.value_)
        {
          return currentNode.value.value_[subPath];
        }
        return undefined;
    }, {value: this, attrs:{}});
    return ret;
  }

  getValue(path: string) : ValueTypes|undefined {
    const node = this.getNode(path);
    return (node !== undefined)? node.value.value_ : undefined;
  }

  getAttributes(path: string) : Attributes|undefined {
    const node = this.getNode(path);
    return (node !== undefined)? node.attrs : undefined;
  }

  getAttributeValue(path: string, attributeKey: string) : ValueTypes|undefined {
    const attrs = this.getAttributes(path);
    return (attrs !== undefined)? attrs[attributeKey].value_ : undefined;
  }

  public *items() : IterableIterator<[string, ValueTypes]> {
    for (const [key, node] of Object.entries(this.value_)) {
      yield [key, node.value.value_];
    }
  }

  public *iterall() : IterableIterator<[string, ValueTypes, {[key: string]: ValueTypes}]> {
    for (const [key, node] of Object.entries(this.value_)) {
      const simple_attrs : { [key: string]: any } = {};
      for (const [key, value] of Object.entries(node.attrs)) {
          simple_attrs[key] = value.value_;
      }
      yield [key, node.value.value_, simple_attrs];
    }
  }
}

function getType_and_Value(value: any) {
  switch (typeof value) {
    case 'number':
      if (Number.isInteger(value)) {
        return [Int32, value];
      } else {
        return [Float64, value];
      }
    case 'string':
      return [String, value];
    case 'object':
      if (value.constructor === Array) {
        if (value.length == 0) {
          return [VectorString, []];
        }
        const [sub_type, sub_value] = getType_and_Value(value[0]);
        switch (sub_type) {
          case Int32:
            return [VectorInt32, value];
          case Float64:
            return [VectorFloat64, value];
          case Bool:
            return [VectorBool, value];
          case String:
            return [VectorString, value];
          case Hash:
            return [
              VectorHash,
              value.map((element: any) => {
                if (element.attrs !== undefined && element.value !== undefined) {
                  return element;
                }
                return makeHashValue(element);
              })
            ];
          default:
            throw new Error(`cannot find suitable karabo type for ${sub_type} ${JSON.stringify(value)}`);
        }
      }
      if (value.attrs !== undefined && value.value !== undefined) {
        return [Hash, value];
      }
      return [Hash, makeHashValue(value)];
    case 'boolean':
      return [Bool, value];
  }
  return [null, null];
}

function makeHashValue(obj: object): HashValue {
  const hsh = new HashValue();
  Object.entries(obj).forEach(([key, value]) => {
    const [klass, value_] = getType_and_Value(value);
    hsh[key] = {
      value: new klass(value_),
      attrs: {},
    };
  });
  return hsh;
}

export function makeHash(obj: object): Hash {
  return new Hash(makeHashValue(obj));
}

export class VectorHash {
  readonly type_ = HashTypes.VectorHash;

  constructor(public value_: HashValue[]) {}
}

export interface SchemaValue {
  name: string;
  hash: Hash;
}

export class Schema {
  readonly type_ = HashTypes.Schema;

  constructor(public value_: SchemaValue) {}
}

class Integer {
  readonly min: number = 0;

  readonly max: number = 0;

  protected value_: number;

  constructor(value: number) {
    this.value_ = Math.min(Math.max(value, this.min), this.max);
  }
}

function makeInteger(type_: HashTypes, min: number, max: number) {
  return class Int implements KaraboType {
    readonly type_ = HashTypes.UInt8;

    readonly _min = min;

    readonly _max = max;

    constructor(public value_: number) {
      this.value_ = Math.min(Math.max(value_, this._min), this._max);
    }
  };
}

export const AutoUInt8 = makeInteger(HashTypes.UInt8, 0, 2 ** 8 - 1);

export class UInt8 extends Integer implements KaraboType {
  readonly type_ = HashTypes.UInt8;

  readonly min = 0;

  readonly max = 2 ** 8 - 1;

  constructor(public value_: number) {
    super(value_);
  }
}

export class VectorUInt8 implements KaraboType {
  readonly type_ = HashTypes.VectorUInt8;

  constructor(public value_: number[]) {}
}

export class Int8 extends Integer implements KaraboType {
  readonly type_ = HashTypes.Int8;

  readonly min = -1 * 2 ** 7;

  readonly max = 2 ** 7 - 1;

  constructor(public value_: number) {
    super(value_);
  }
}

export class VectorInt8 implements KaraboType {
  readonly type_ = HashTypes.VectorInt8;

  constructor(public value_: number[]) {}
}

export class UInt16 extends Integer implements KaraboType {
  readonly type_ = HashTypes.UInt16;

  readonly min = 0;

  readonly max = 2 ** 16 - 1;

  constructor(public value_: number) {
    super(value_);
  }
}

export class VectorUInt16 implements KaraboType {
  readonly type_ = HashTypes.VectorUInt16;

  constructor(public value_: number[]) {}
}

export class Int16 extends Integer implements KaraboType {
  readonly type_ = HashTypes.Int16;

  readonly min = -1 * 2 ** 15;

  readonly max = 2 ** 15 - 1;

  constructor(public value_: number) {
    super(value_);
  }
}

export class VectorInt16 implements KaraboType {
  readonly type_ = HashTypes.VectorInt16;

  constructor(public value_: number[]) {}
}

export class UInt32 extends Integer implements KaraboType {
  readonly type_ = HashTypes.UInt32;

  readonly min = 0;

  readonly max = 2 ** 32 - 1;

  constructor(public value_: number) {
    super(value_);
  }
}

export class VectorUInt32 implements KaraboType {
  readonly type_ = HashTypes.VectorUInt32;

  constructor(public value_: number[]) {}
}

export class Int32 extends Integer implements KaraboType {
  readonly type_ = HashTypes.Int32;

  readonly min = -1 * 2 ** 31;

  readonly max = 2 ** 31 - 1;

  constructor(public value_: number) {
    super(value_);
  }
}

export class VectorInt32 implements KaraboType {
  readonly type_ = HashTypes.VectorInt32;

  constructor(public value_: number[]) {}
}

export class UInt64 implements KaraboType {
  readonly type_ = HashTypes.UInt64;

  readonly min = 0;

  readonly max = 2 ** 64 - 1;

  public value_: bigint;

  constructor(value: bigint) {
    this.value_ = BigInt.asUintN(64, value);
  }
}

export class VectorUInt64 implements KaraboType {
  readonly type_ = HashTypes.VectorInt64;

  constructor(public value_: bigint[]) {}
}

export class Int64 implements KaraboType {
  readonly type_ = HashTypes.Int64;

  readonly min = -1 * 2 ** 63;

  readonly max = 2 ** 63 - 1;

  public value_: bigint;

  constructor(value: bigint) {
    this.value_ = BigInt.asIntN(64, value);
  }
}

export class VectorInt64 implements KaraboType {
  readonly type_ = HashTypes.VectorInt64;

  constructor(public value_: bigint[]) {}
}

export class Float32 implements KaraboType {
  readonly type_ = HashTypes.Float32;

  constructor(public value_: number) {}
}

export class VectorFloat32 implements KaraboType {
  readonly type_ = HashTypes.VectorFloat32;

  constructor(public value_: number[]) {}
}

export class Float64 implements KaraboType {
  readonly type_ = HashTypes.Float64;

  constructor(public value_: number) {}
}

export class VectorFloat64 implements KaraboType {
  readonly type_ = HashTypes.VectorFloat64;

  constructor(public value_: number[]) {}
}

export class Bool implements KaraboType {
  readonly type_ = HashTypes.Bool;

  constructor(public value_: boolean) {}
}

export class VectorBool implements KaraboType {
  readonly type_ = HashTypes.VectorBool;

  constructor(public value_: boolean[]) {}
}

export class String implements KaraboType {
  readonly type_ = HashTypes.String;

  constructor(public value_: string) {}
}

export class VectorString implements KaraboType {
  readonly type_ = HashTypes.VectorString;

  constructor(public value_: string[]) {}
}

export class VectorChar implements KaraboType {
  readonly type_ = HashTypes.VectorChar;

  constructor(public value_: Uint8Array) {}
}

export class Char implements KaraboType {
  // this is a terrible type and barely used.
  // essentially a UInt8
  readonly type_ = HashTypes.Char;

  constructor(public value_: number) {}
}

export function toString(karabo_value: any): string {
  return JSON.stringify(karabo_value, (key, value_) => (typeof value_ === 'bigint' ? value_.toString() + 'n' : value_));
}
