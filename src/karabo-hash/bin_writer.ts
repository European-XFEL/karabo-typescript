import * as Types from './types';
import { TextEncoder } from 'util';

function encodeInt8(parser: BinaryEncoder, data: number): ArrayBuffer {
  const bin = new ArrayBuffer(1);
  const dv = new DataView(bin);
  dv.setInt8(0, data);
  return bin;
}

function encodeChar(parser: BinaryEncoder, data: number): ArrayBuffer {
  const bin = new ArrayBuffer(1);
  const dv = new DataView(bin);
  dv.setUint8(0, data);
  return bin;
}

function encodeUInt8(parser: BinaryEncoder, data: number): ArrayBuffer {
  const bin = new ArrayBuffer(1);
  const dv = new DataView(bin);
  dv.setUint8(0, data);
  return bin;
}

function encodeInt16(parser: BinaryEncoder, data: number): ArrayBuffer {
  const bin = new ArrayBuffer(2);
  const dv = new DataView(bin);
  dv.setInt16(0, data, true);
  return bin;
}

function encodeUInt16(parser: BinaryEncoder, data: number): ArrayBuffer {
  const bin = new ArrayBuffer(2);
  const dv = new DataView(bin);
  dv.setUint16(0, data, true);
  return bin;
}

function encodeInt32(parser: BinaryEncoder, data: number): ArrayBuffer {
  const bin = new ArrayBuffer(4);
  const dv = new DataView(bin);
  dv.setInt32(0, data, true);
  return bin;
}

function encodeUInt32(parser: BinaryEncoder, data: number): ArrayBuffer {
  const bin = new ArrayBuffer(4);
  const dv = new DataView(bin);
  dv.setUint32(0, data, true);
  return bin;
}

function encodeInt64(parser: BinaryEncoder, data: bigint): ArrayBuffer {
  const bin = new ArrayBuffer(8);
  const dv = new DataView(bin);
  dv.setBigInt64(0, data, true);
  return bin;
}

function encodeUInt64(parser: BinaryEncoder, data: bigint): ArrayBuffer {
  const bin = new ArrayBuffer(8);
  const dv = new DataView(bin);
  dv.setBigUint64(0, data, true);
  return bin;
}

function encodeFloat32(parser: BinaryEncoder, data: number): ArrayBuffer {
  const bin = new ArrayBuffer(4);
  const dv = new DataView(bin);
  dv.setFloat32(0, data, true);
  return bin;
}

function encodeFloat64(parser: BinaryEncoder, data: number): ArrayBuffer {
  const bin = new ArrayBuffer(8);
  const dv = new DataView(bin);
  dv.setFloat64(0, data, true);
  return bin;
}

function encodeBoolean(parser: BinaryEncoder, data: boolean): ArrayBuffer {
  const bin = new ArrayBuffer(1);
  const dv = new DataView(bin);
  dv.setUint8(0, data ? 1 : 0);
  return bin;
}

function encodeString(parser: BinaryEncoder, data: string): ArrayBuffer {
  const buff = parser.encoder.encode(data);
  const ret = new Uint8Array(buff.length + 4);
  const dv = new DataView(ret.buffer);
  dv.setUint32(0, buff.length, true);
  ret.set(new Uint8Array(buff), 4);
  return ret;
}

function encodeVectorString(parser: BinaryEncoder, data: string[]): ArrayBuffer {
  // Writes each string in the vector to its own ArrayBuffer
  const strBuffers: Uint8Array[] = [];
  let stringsLength = 0;
  for (let i = 0; i < data.length; i++) {
    const strBuffer = encodeString(parser, data[i]);
    stringsLength += strBuffer.byteLength;
    strBuffers.push(new Uint8Array(strBuffer.slice(0)));
  }
  // Allocates a buffer for the vector of strings and an initial UInt32 for
  // the length of the vector of strings.
  const ret = new Uint8Array(4 + stringsLength);
  const dv = new DataView(ret.buffer);
  // Writes the length of the vector of strings.
  dv.setUint32(0, data.length, true);
  let offset = 4;
  // Writes the previously serialized strings to the buffer
  for (const strBuffer of strBuffers) {
    ret.set(strBuffer, offset);
    offset += strBuffer.length;
  }
  return ret;
}

function encodeVectorHash(parser: BinaryEncoder, data: Types.HashValue[]): ArrayBuffer {
  // Writes each string in the vector to its own ArrayBuffer
  const strBuffers: Uint8Array[] = [];
  let stringsLength = 0;
  for (let i = 0; i < data.value.length; i++) {
    const strBuffer = parser.encodeHashValue(data.value[i]);
    stringsLength += strBuffer.byteLength;
    strBuffers.push(new Uint8Array(strBuffer.slice(0)));
  }
  // Allocates a buffer for the vector of strings and an initial UInt32 for
  // the length of the vector of strings.
  const ret = new Uint8Array(4 + stringsLength);
  const dv = new DataView(ret.buffer);
  // Writes the length of the vector of strings.
  dv.setUint32(0, data.value.length, true);
  let offset = 4;
  // Writes the previously serialized strings to the buffer
  for (const strBuffer of strBuffers) {
    ret.set(strBuffer, offset);
    offset += strBuffer.length;
  }
  return ret;
}


function makeVectorEncoder(elementEncoder: any) {
  return (parser: BinaryEncoder, data: number[]) => {
    const sizeBuffer = new ArrayBuffer(4);
    new DataView(sizeBuffer).setUint32(0, data.length, true);
    const slice_ = [sizeBuffer];
    let totalSize = 4;
    data.forEach((element) => {
      const buffer = elementEncoder(parser, element);
      slice_.push(buffer);
      totalSize += buffer.byteLength;
    });
    const ret = new Uint8Array(totalSize);
    let pos = 0;
    slice_.forEach((element) => {
      ret.set(new Uint8Array(element), pos);
      pos += element.byteLength;
    });
    return ret;
  };
}

function encodeSchema(parser: BinaryEncoder, schema: Types.SchemaValue): ArrayBuffer {
  const buffers: ArrayBuffer[] = [new ArrayBuffer(4)];
  let totalSize = 0;
  const nameBuff = parser.encodeKey(schema.name);
  totalSize += nameBuff.byteLength;
  buffers.push(nameBuff);
  const hashBuff = parser.encodeHashValue(schema.hash);
  totalSize += hashBuff.byteLength;
  buffers.push(hashBuff);
  new DataView(buffers[0]).setUint32(0, totalSize, true);
  const ret = new Uint8Array(totalSize + 4);
  let pos = 0;
  buffers.forEach((element) => {
    ret.set(new Uint8Array(element), pos);
    pos += element.byteLength;
  });
  return ret;
}

class BinaryEncoder {
  encoder = new TextEncoder();

  constructor() {}

  encodeValue(value: Types.KaraboType): ArrayBuffer {
    switch (value.type_) {
      case Types.HashTypes.Bool:
        return encodeBoolean(this, value.value_);
      case Types.HashTypes.VectorBool:
        return makeVectorEncoder(encodeBoolean)(this, value.value_);
      case Types.HashTypes.Char:
        return encodeChar(this, value.value_);
      case Types.HashTypes.VectorChar:
        return makeVectorEncoder(encodeChar)(this, value.value_);
      case Types.HashTypes.Int8:
        return encodeInt8(this, value.value_);
      case Types.HashTypes.VectorInt8:
        return makeVectorEncoder(encodeInt8)(this, value.value_);
      case Types.HashTypes.UInt8:
        return encodeUInt8(this, value.value_);
      case Types.HashTypes.VectorUInt8:
        return makeVectorEncoder(encodeUInt8)(this, value.value_);
      case Types.HashTypes.Int16:
        return encodeInt16(this, value.value_);
      case Types.HashTypes.VectorInt16:
        return makeVectorEncoder(encodeInt16)(this, value.value_);
      case Types.HashTypes.UInt16:
        return encodeUInt16(this, value.value_);
      case Types.HashTypes.VectorUInt16:
        return makeVectorEncoder(encodeUInt16)(this, value.value_);
      case Types.HashTypes.Int32:
        return encodeInt32(this, value.value_);
      case Types.HashTypes.VectorInt32:
        return makeVectorEncoder(encodeInt32)(this, value.value_);
      case Types.HashTypes.UInt32:
        return encodeUInt32(this, value.value_);
      case Types.HashTypes.VectorUInt32:
        return makeVectorEncoder(encodeUInt32)(this, value.value_);
      case Types.HashTypes.Int64:
        return encodeInt64(this, BigInt(value.value_));
      case Types.HashTypes.VectorInt64:
        return makeVectorEncoder(encodeInt64)(this, value.value_);
      case Types.HashTypes.UInt64:
        return encodeUInt64(this, BigInt(value.value_));
      case Types.HashTypes.VectorUInt64:
        return makeVectorEncoder(encodeUInt64)(this, value.value_);
      case Types.HashTypes.Float32:
        return encodeFloat32(this, value.value_);
      case Types.HashTypes.VectorFloat32:
        return makeVectorEncoder(encodeFloat32)(this, value.value_);
      case Types.HashTypes.Float64:
        return encodeFloat64(this, value.value_);
      case Types.HashTypes.VectorFloat64:
        return makeVectorEncoder(encodeFloat64)(this, value.value_);
      case Types.HashTypes.String:
        return encodeString(this, value.value_);
      case Types.HashTypes.VectorString:
        return encodeVectorString(this, value.value_);
      case Types.HashTypes.Hash:
        return this.encodeHashValue(value.value_);
      case Types.HashTypes.VectorHash:
        return encodeVectorHash(this, value.value_);
      case Types.HashTypes.Schema:
        return encodeSchema(this, value.value_);
      default:
        return new ArrayBuffer(0);
    }
  }


  encodeKey(key: string): ArrayBuffer {
    const buff = this.encoder.encode(key);
    const ret = new Uint8Array(buff.length + 1);
    const dv = new DataView(ret.buffer);
    ret.set(new Uint8Array(buff), 1);
    dv.setUint8(0, buff.length);
    return ret;
  }

  encodeHash(data: Types.Hash): ArrayBuffer {
    const hashValue = data.value;
    return this.encodeHashValue(hashValue);
  }

  encodeHashValue(hashValue: Types.HashValue): ArrayBuffer {
    const buffers: ArrayBuffer[] = [new ArrayBuffer(4)];
    let totalSize = 4;
    let keyCount = 0;
    Object.keys(hashValue).forEach((key) => {
      keyCount += 1;
      const { value, attrs } = hashValue[key];
      const keyBuff = this.encodeKey(key);
      totalSize += keyBuff.byteLength;
      buffers.push(keyBuff);
      buffers.push(encodeUInt32(this, value.type_));
      totalSize += 4;
      const attrCounfBuff =  encodeUInt32(this, 0);
      buffers.push(attrCounfBuff);
      totalSize += 4;
      let attrsCount = 0;
      Object.keys(attrs).forEach((attrsKey) => {
        attrsCount += 1;
        const attrValue = attrs[attrsKey];
        const ak = this.encodeKey(attrsKey);
        const av = this.encodeValue(attrValue);
        buffers.push(ak);
        totalSize += ak.byteLength;
        buffers.push(encodeUInt32(this, attrValue.type_));
        totalSize += 4;
        buffers.push(av);
        totalSize += av.byteLength;
        });
      new DataView(attrCounfBuff).setUint32(0, attrsCount, true);
      const valueBuff = this.encodeValue(value);
      buffers.push(valueBuff);
      totalSize += valueBuff.byteLength;
    });
    // set the key number
    new DataView(buffers[0]).setUint32(0, keyCount, true);
    const ret = new Uint8Array(totalSize);
    let pos = 0;
    buffers.forEach((element) => {
      ret.set(new Uint8Array(element), pos);
      pos += element.byteLength;
    });
    return ret;
  }
}

export { BinaryEncoder };
