import {expect} from 'chai';

import { Hash, HashTypes, makeHash, HashValue } from 'karabo-ts';

// to be able to print BigInt https://stackoverflow.com/questions/65152373/typescript-serialize-bigint-in-json
(BigInt.prototype as any).toJSON = function() {
    return this.toString()
} 

describe("helper", function() {
    it('helper simple keys', function() 
        {
            const hsh = makeHash({
                key1: 1,
                key2: "testString"
            });
            expect(hsh.type_).to.be.equal(HashTypes.Hash);
            expect(hsh.value_.key1.value.type_).to.be.equal(HashTypes.Int32);
            expect(hsh.value_.key1.value.value_).to.be.equal(1);
            expect(hsh.value_.key1.attrs).to.be.an('object').that.is.empty;
            expect(hsh.getValue("key1")).to.be.equal(1);
            expect(hsh.value_.key2.value.type_).to.be.equal(HashTypes.String);
            expect(hsh.value_.key2.value.value_).to.be.equal("testString");
            expect(hsh.value_.key2.attrs).to.be.an('object').that.is.empty;
            expect(hsh.getValue("key2")).to.be.equal("testString");
        });
    it('helper vector strings', function()    {
            const hsh = makeHash({
                key1: ["testString"],
            });
            expect(hsh.type_).to.be.equal(HashTypes.Hash);
            expect(hsh.value_.key1.value.type_).to.be.equal(HashTypes.VectorString);
            expect(hsh.value_.key1.value.value_).to.be.deep.equal(["testString"]);
            expect(hsh.value_.key1.attrs).to.be.an('object').that.is.empty;
            expect(hsh.getValue("key1")).to.be.deep.equal(["testString"]);
        });
    it('helper vector strings', function(){
            const hsh = makeHash({
                key1: [1],
            });
            expect(hsh.type_).to.be.equal(HashTypes.Hash);
            expect(hsh.value_.key1.value.type_).to.be.equal(HashTypes.VectorInt32);
            expect(hsh.value_.key1.value.value_).to.be.deep.equal([1]);
            expect(hsh.value_.key1.attrs).to.be.an('object').that.is.empty;
            expect(hsh.getValue("key1")).to.be.deep.equal([1]);
        });
    it('helper vector floats', function(){
            const hsh = makeHash({
                key1: [3.14],
            });
            expect(hsh.type_).to.be.equal(HashTypes.Hash);
            expect(hsh.value_.key1.value.type_).to.be.equal(HashTypes.VectorFloat64);
            expect(hsh.value_.key1.value.value_).to.be.deep.equal([3.14]);
            expect(hsh.value_.key1.attrs).to.be.an('object').that.is.empty;
            expect(hsh.getValue("key1")).to.be.deep.equal([3.14]);
        });
    it('helper vector floats', function()
        {
            const hsh = makeHash({
                key1: 3.14,
            });
            expect(hsh.type_).to.be.equal(HashTypes.Hash);
            expect(hsh.value_.key1.value.type_).to.be.equal(HashTypes.Float64);
            expect(hsh.value_.key1.value.value_).to.be.deep.equal(3.14);
            expect(hsh.value_.key1.attrs).to.be.an('object').that.is.empty;
            expect(hsh.getValue("key1")).to.be.deep.equal(3.14);
        });
    it('helper vector empty arrays', function()
        {
            const hsh = makeHash({
                key1: [],
            });
            expect(hsh.type_).to.be.equal(HashTypes.Hash);
            expect(hsh.value_.key1.value.type_).to.be.equal(HashTypes.VectorString);
            expect(hsh.value_.key1.value.value_).to.be.deep.equal([]);
            expect(hsh.value_.key1.attrs).to.be.an('object').that.is.empty;
            expect(hsh.getValue("key1")).to.be.deep.equal([]);
        });
    it('helper vector sub hashes', function()
        {
            const hsh = makeHash({
                key1: {sub_key: 1},
            });
            expect(hsh.type_).to.be.equal(HashTypes.Hash);
            expect(hsh.value_.key1.value.type_).to.be.equal(HashTypes.Hash);
            expect(hsh.value_.key1.attrs).to.be.an('object').that.is.empty;
            const node = hsh.getNode("key1.sub_key");
            expect(node).not.to.be.undefined;
            if (node === undefined) {
                return;
            }
            expect(node.value.value_).to.be.equal(1);
            expect(node.value.type_).to.be.equal(HashTypes.Int32);
            expect(node.attrs).to.be.an('object').that.is.empty;
            expect(hsh.getValue("key1.sub_key")).to.be.equal(1);
            // hsh.getValue("key1") returns an HashValue and not a Hash
            const subHash = new Hash(hsh.getValue("key1") as unknown as HashValue)
            expect(subHash.getValue("sub_key")).to.be.equal(1);
        });
        it('helper vector hash', function()
        {
            const hsh = makeHash({
                key1: [{sub_key: 1}, {sub_key: 2}],
            });

            expect(hsh.type_).to.be.equal(HashTypes.Hash);
            expect(hsh.value_.key1.value.type_).to.be.equal(HashTypes.VectorHash);
            expect(hsh.value_.key1.value.value_).to.be.instanceOf(Array<HashValue>);
            expect(hsh.value_.key1.attrs).to.be.an('object').that.is.empty;
            const value = (hsh.getValue("key1")! as HashValue[]);
            expect(value[0]).to.be.instanceOf(HashValue);
            expect(new Hash(value[0]).getValue("sub_key")).to.be.equal(1);
            expect(new Hash(value[1]).getValue("sub_key")).to.be.equal(2);
        });

})