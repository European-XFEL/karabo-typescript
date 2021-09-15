import chai from 'chai';
import fs from 'fs';
const expect = chai.expect;

import { BinaryDecoder, BinaryEncoder } from '../src/index'

describe("binary", function() {
    it('reading', function() {
        const data = fs.readFileSync('./tests/conf_hash.bin');
        const parser = new BinaryDecoder(data);
        const hsh = parser.read();
        //process.stdout.write(JSON.stringify(hsh));
    });
    it('writing', function() {
        const data = fs.readFileSync('./tests/conf_hash.bin');
        const parser = new BinaryDecoder(data);
        const hsh = parser.read();
        const encoder = new BinaryEncoder(hsh);
        encoder.encode();
    });
});