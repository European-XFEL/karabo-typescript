import {expect} from 'chai';
import fs from 'fs';

import { BinaryDecoder, BinaryEncoder, Hash, HashValue} from 'karabo-ts';

// to be able to print BigInt https://stackoverflow.com/questions/65152373/typescript-serialize-bigint-in-json
(BigInt.prototype as any).toJSON = function() {
    return this.toString()
} 

describe("binary", function() {

    it('reading', function() {
        const data = fs.readFileSync('./karabo-ts-tests/conf_hash.bin');
        const parser = new BinaryDecoder(data);
        const hsh = parser.read();
        //process.stdout.write(JSON.stringify(hsh));
        expect(hsh.value_["deviceId"].value.value_).to.be.equal("Bob");
        expect(hsh.value_["classId"].value.value_).to.be.equal("PropertyTest");
        expect(hsh.value_["alarmCondition"].value.value_).to.be.equal("none");
        expect(hsh.value_["boolPropertyReadOnly"].value.value_).to.be.equal(false);
        expect(hsh.value_["uint16PropertyReadOnly"].value.value_).to.be.equal(32000);
        expect(hsh.value_["int16PropertyReadOnly"].value.value_).to.be.equal(3200);
        expect(hsh.value_["uint32PropertyReadOnly"].value.value_).to.be.equal(32000000);
        expect(hsh.value_["floatPropertyReadOnly"].value.value_).to.be.equal(3.1415960788726807);
        expect(hsh.value_["uint8PropertyReadOnly"].value.value_).to.be.equal(177);
        // test getValue
        expect(hsh.getValue("deviceId")).to.be.equal("Bob");
        expect(hsh.getValue("classId")).to.be.equal("PropertyTest");
        expect(hsh.getValue("alarmCondition")).to.be.equal("none");
        expect(hsh.getValue("boolPropertyReadOnly")).to.be.equal(false);
        expect(hsh.getValue("uint16PropertyReadOnly")).to.be.equal(32000);
        expect(hsh.getValue("int16PropertyReadOnly")).to.be.deep.equal(3200);
        expect(hsh.getValue("uint32PropertyReadOnly")).to.be.deep.equal(32000000);
        expect(hsh.getValue("floatPropertyReadOnly")).to.be.deep.equal(3.1415960788726807);
        expect(hsh.getValue("uint8PropertyReadOnly")).to.be.deep.equal(177);
        // test attributes
        expect(hsh.getAttributeValue("uint8PropertyReadOnly", "sec")).to.be.equal(1631725047n);
        expect(hsh.getAttributeValue("uint8PropertyReadOnly", "frac")).to.be.equal(661721908000000000n);
        expect(hsh.getAttributeValue("uint8PropertyReadOnly", "tid")).to.be.equal(0n);
        expect(hsh.getAttributeValue("uint8PropertyReadOnly", "alarmCondition")).to.be.equal("none");

        expect(hsh.getValue("vectors.boolProperty")).to.be.deep.equal([true,false,true,false,true,false]);
        expect(hsh.getValue("vectors.uint8Property")).to.be.deep.equal([41, 42, 43, 44, 45, 46]);
        expect(hsh.getValue("vectors.int16Property")).to.be.deep.equal([20041, 20042, 20043, 20044, 20045, 20046]);
        expect(hsh.getValue("vectors.uint16Property")).to.be.deep.equal([10041, 10042, 10043, 10044, 10045, 10046]);
        expect(hsh.getValue("vectors.uint32Property")).to.be.deep.equal([90000041, 90000042, 90000043, 90000044, 90000045, 90000046]);
        expect(hsh.getValue("vectors.int64Property")).to.be.deep.equal([20000000041n, 20000000042n, 20000000043n, 20000000044n, 20000000045n, 20000000046n]);
        expect(hsh.getValue("vectors.stringProperty")).to.be.deep.equal(['1111111', '2222222', '3333333', '4444444', '5555555', '6666666']);
        expect(hsh).to.be.instanceOf(Hash);
        // a spot testing of iterall
        for ( const [key, value, attrs] of hsh.iterall()) {
            if (key == "uint32PropertyReadOnly") {
                expect(value).not.to.be.instanceOf(Object);
                expect(value).to.equal(32000000);
                expect(attrs["alarmCondition"]).to.equal("none");
            }
            if (key == "output") {
                expect(value).to.be.instanceOf(HashValue);
                expect(value).to.have.keys([
                    "bytesRead",
                    "bytesWritten",
                    "connections",
                    "distributionMode",
                    "hostname",
                    "noInputShared",
                    "port",
                    "schema",
                    "updatePeriod"]);
            }
        }

    });

    it('writing', function() {
        const data = fs.readFileSync('./karabo-ts-tests/conf_hash.bin');
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
            expect(hsh.value_[key].value.value_).to.equal(new_hsh.value_[key].value.value_);
        }
        let read_table = hsh.getValue("table");
        let new_table = new_hsh.getValue("table");
        expect(read_table).to.be.instanceOf(Array<HashValue>);
        expect(new_table).to.be.instanceOf(Array<HashValue>);
        read_table = read_table! as unknown as HashValue[];
        new_table = new_table! as unknown as HashValue[];
        expect(read_table.length).to.be.equal(new_table.length);
        for (const i in [0,1]) {
            const read = new Hash(read_table[i]);
            const new_ = new Hash(new_table[i]);
            const read_keys = Object.keys(read.value_).map((key) => {return key;});
            const new_keys = Object.keys(new_.value_).map((key) => {return key;});
            expect(read_keys).to.be.deep.equal(new_keys);
            expect(read.getValue("e1")).to.be.equal(new_.getValue("e1"));
            expect(read.getValue("e2")).to.be.equal(new_.getValue("e2"));
            expect(read.getValue("e3")).to.be.equal(new_.getValue("e3"));
            expect(read.getValue("e4")).to.be.equal(new_.getValue("e4"));
            expect(read.getValue("e5")).to.be.closeTo(new_.getValue("e5") as unknown as number, 0.00001);
        }
    });

    it('schema', function() {
        const data = fs.readFileSync('./karabo-ts-tests/schema_hash.bin');
        const parser = new BinaryDecoder(data);
        const schema = parser.readSchema();
        expect(schema.value_.name).to.be.equal("PropertyTest");
        // this is to test the iterall 
        for ( const [key, value, attrs] of schema.value_.hash.iterall()) {
            if (key == "uint32PropertyReadOnly") {
                expect(value).to.equal(0);
                expect(attrs["nodeType"]).to.equal(0);
                expect(attrs["valueType"]).to.equal("UINT32");
                expect(attrs["displayedName"]).to.equal("UInt32 property read-only");
            }
            if (key == "output") {
                expect(value).to.be.instanceOf(Object);
                expect(value).to.have.keys([
                    "bytesRead",
                    "bytesWritten",
                    "connections",
                    "distributionMode",
                    "hostname",
                    "noInputShared",
                    "port",
                    "schema",
                    "updatePeriod"]);
            }
        }
    });

})