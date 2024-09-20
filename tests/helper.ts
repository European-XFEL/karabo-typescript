import chai from 'chai';
import fs from 'fs';
const expect = chai.expect;

import { BinaryDecoder, BinaryEncoder, Hash, HashValue, Schema , Attributes, UInt32, makeHash } from '../src/index'

// to be able to print BigInt https://stackoverflow.com/questions/65152373/typescript-serialize-bigint-in-json
(BigInt.prototype as any).toJSON = function() {
    return this.toString()
} 

describe("helper", function() {
    it('writing', function() {
        const hsh = makeHash({
            key1: 1,
            key2: "testString"
        });
        process.stdout.write("\n");
        process.stdout.write(JSON.stringify(hsh));
    });

})