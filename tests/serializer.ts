import chai from 'chai';
import fs from 'fs';
const expect = chai.expect;

import { BinaryDecoder, BinaryEncoder } from '../src/index'

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
    });

    it('writing', function() {
        const data = fs.readFileSync('./tests/conf_hash.bin');
        const parser = new BinaryDecoder(data);
        const hsh = parser.read();
        const encoder = new BinaryEncoder(hsh);
        encoder.encode();
    });

    it('schema', function() {
        const data = fs.readFileSync('./tests/schema_hash.bin');
        const parser = new BinaryDecoder(data);
        const schema = parser.readSchema();
        expect(schema.value_.name).to.equal("PropertyTest");
        expect(schema.value_.hash).to.have.property("classId");
        expect(schema.value_.hash).to.have.property("deviceId");
        expect(schema.value_.hash).to.have.property("doublePropertyReadOnly");
        // FIXME: expect(schema).to.be.a("Schema");
    })});