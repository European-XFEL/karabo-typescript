import chai from 'chai';
import fs from 'fs';
const expect = chai.expect;

import { BinaryDecoder, BinaryEncoder, Hash, HashValue, Schema , Attributes, UInt32} from '../src/index'

// to be able to print BigInt https://stackoverflow.com/questions/65152373/typescript-serialize-bigint-in-json
(BigInt.prototype as any).toJSON = function() {
    return this.toString()
} 

describe("binary", function() {

    it('reading', function() {
        const data = fs.readFileSync('./tests/conf_hash.bin');
        const parser = new BinaryDecoder(data);
        const hsh = parser.read();
        //process.stdout.write(JSON.stringify(hsh));
        //process.stdout.write(JSON.stringify(hsh.value["floatPropertyReadOnly"]));
        expect(hsh.value["deviceId"].value.value_).to.equal("Bob");
        expect(hsh.value["classId"].value.value_).to.equal("PropertyTest");
        expect(hsh.value["alarmCondition"].value.value_).to.equal("none");
        expect(hsh.value["boolPropertyReadOnly"].value.value_).to.equal(false);
        expect(hsh.value["uint16PropertyReadOnly"].value.value_).to.equal(32000);
        expect(hsh.value["int16PropertyReadOnly"].value.value_).to.equal(3200);
        expect(hsh.value["uint32PropertyReadOnly"].value.value_).to.equal(32000000);
        expect(hsh.value["floatPropertyReadOnly"].value.value_).to.equal(3.1415960788726807);
        expect(hsh.value["uint8PropertyReadOnly"].value.value_).to.equal(177);
        expect(hsh).to.be.instanceOf(Hash);
    });

    it('writing', function() {
        const data = fs.readFileSync('./tests/conf_hash.bin');
        const parser = new BinaryDecoder(data);
        const hsh = parser.read();
        const encoder = new BinaryEncoder();
        const new_data = encoder.encodeHash(hsh);
        const new_parser = new BinaryDecoder(new Uint8Array(new_data));
        const new_hsh = new_parser.read();
        const keys = [
            "_serverId_", "deviceId", "classId", "alarmCondition",
            "boolPropertyReadOnly", "uint16PropertyReadOnly", "int16PropertyReadOnly",
            "uint32PropertyReadOnly", "floatPropertyReadOnly", "uint8PropertyReadOnly"];
        for (const key of keys) {
            expect(hsh.value[key].value.value_).to.equal(new_hsh.value[key].value.value_);
        }        
    });

    it('schema', function() {
        const data = fs.readFileSync('./tests/schema_hash.bin');
        const parser = new BinaryDecoder(data);
        const schema = parser.readSchema();
    });

})