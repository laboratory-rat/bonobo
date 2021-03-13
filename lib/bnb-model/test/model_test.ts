import { createEmptyModel, Model } from '../lib/model/model';
import * as assert from 'assert';

describe('Array', () => {
    describe('#indexOf()', () => {
        it('should return -1 when the value is not present', function () {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });
    });
});

describe('Model', () => {
    it('#create', () => {
        const model: Model = createEmptyModel();
        assert.strictEqual(model.node.type, '_root');
    });
});
