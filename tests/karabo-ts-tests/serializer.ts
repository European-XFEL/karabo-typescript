import {expect} from 'chai';
import fs from 'fs';

import { BinaryDecoder, BinaryEncoder, Hash} from 'karabo-ts';

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
        //process.stdout.write(JSON.stringify(hsh.value["floatPropertyReadOnly"]));
        expect(hsh.value_["deviceId"].value.value_).to.equal("Bob");
        expect(hsh.value_["classId"].value.value_).to.equal("PropertyTest");
        expect(hsh.value_["alarmCondition"].value.value_).to.equal("none");
        expect(hsh.value_["boolPropertyReadOnly"].value.value_).to.equal(false);
        expect(hsh.value_["uint16PropertyReadOnly"].value.value_).to.equal(32000);
        expect(hsh.value_["int16PropertyReadOnly"].value.value_).to.equal(3200);
        expect(hsh.value_["uint32PropertyReadOnly"].value.value_).to.equal(32000000);
        expect(hsh.value_["floatPropertyReadOnly"].value.value_).to.equal(3.1415960788726807);
        expect(hsh.value_["uint8PropertyReadOnly"].value.value_).to.equal(177);
        expect(hsh.getValue("deviceId")).to.equal("Bob");
        expect(hsh.getValue("classId")).to.equal("PropertyTest");
        expect(hsh.getValue("alarmCondition")).to.equal("none");
        expect(hsh.getValue("boolPropertyReadOnly")).to.equal(false);
        expect(hsh.getValue("uint16PropertyReadOnly")).to.equal(32000);
        expect(hsh.getValue("int16PropertyReadOnly")).to.equal(3200);
        expect(hsh.getValue("uint32PropertyReadOnly")).to.equal(32000000);
        expect(hsh.getValue("floatPropertyReadOnly")).to.equal(3.1415960788726807);
        expect(hsh.getValue("uint8PropertyReadOnly")).to.equal(177);
        expect(hsh.getAttributeValue("uint8PropertyReadOnly", "sec")).to.be.equal(1631725047n);
        expect(hsh.getAttributeValue("uint8PropertyReadOnly", "frac")).to.be.equal(661721908000000000n);
        expect(hsh.getAttributeValue("uint8PropertyReadOnly", "tid")).to.be.equal(0n);
        expect(hsh.getAttributeValue("uint8PropertyReadOnly", "alarmCondition")).to.be.equal("none");
        expect(hsh).to.be.instanceOf(Hash);
        for ( const [key, value, attrs] of hsh.iterall()) {
            if (key == "uint32PropertyReadOnly") {
                expect(value).not.to.be.instanceOf(Object);
                expect(value).to.equal(32000000);
                expect(attrs["alarmCondition"]).to.equal("none");
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
        const read_table = hsh.getValue("table");
        const new_table = new_hsh.getValue("table");
        expect(read_table.length).to.be.equal(new_table.length);
        for (const i in [0,1]) {
            const read = read_table[i];
            const new_ = new_table[i];
            const read_keys = Object.keys(read).map((key) => {return key;});
            const new_keys = Object.keys(new_).map((key) => {return key;});
            expect(read_keys).to.be.deep.equal(new_keys);
            expect(read.getValue("e1")).to.be.equal(new_.getValue("e1"));
            expect(read.getValue("e2")).to.be.equal(new_.getValue("e2"));
            expect(read.getValue("e3")).to.be.equal(new_.getValue("e3"));
            expect(read.getValue("e4")).to.be.equal(new_.getValue("e4"));
            expect(read.getValue("e5")).to.be.closeTo(new_.getValue("e5"), 0.00001);
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