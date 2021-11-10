import { denormalizeResponse, normalizeDataset } from '../lib/dataset';
import * as F from 'fp-ts/function';
import * as E from 'fp-ts/Either';
import { ERR } from '../lib/error';
import { visualize3DArray } from '@test/utils';
import { testGetNotIdealXorDataset } from '@test/data/dataset_test_data';
import * as assert from 'assert';

describe('Dataset', () => {
    const dataset = testGetNotIdealXorDataset();

    it('Normalize individual', () => {
        F.pipe(
            dataset,
            E.fromNullable({ message: 'Dataset is null' } as ERR),
            E.chain((dataset) =>
                normalizeDataset({
                    dataset,
                    inputIndexes: [0, 1],
                    strategy: 'INDIVIDUAL',
                })
            ),
            E.chain((data) => {
                const { input, label } = data;
                console.log('normalized inputs');
                visualize3DArray(input.arraySync());

                console.log('normalized labels');
                visualize3DArray(label?.arraySync() ?? []);
                return E.right(data);
            }),
            E.chain(({ input, label, normalizationData }) =>
                denormalizeResponse({
                    response: label!,
                    normalizationData: normalizationData,
                    strategy: 'INDIVIDUAL',
                })
            ),
            E.map((result) => {
                console.log('Denormalized result');
                visualize3DArray(result.arraySync());
                return result;
            }),
            E.mapLeft((err) => {
                let message = `Type: ${err.type}. Message: ${err.message}`;
                if (err.innerError) {
                    message = `${message} SType: ${err.innerError.type}. SMessage: ${err.innerError.message}`;
                }

                assert.strictEqual(true, false, message);
            })
        );
    });

    it('Normalize matrix', () => {
        F.pipe(
            dataset,
            E.fromNullable({ message: 'Dataset is null' } as ERR),
            E.chain((dataset) =>
                normalizeDataset({
                    dataset,
                    inputIndexes: [0, 1],
                    strategy: 'MATRIX',
                })
            ),
            E.map((data) => {
                const { input, label, normalizationData } = data;
                console.log('Matrix normalized data');
                visualize3DArray(input.arraySync());
                visualize3DArray(label?.arraySync() ?? []);
                return data;
            }),
            E.chain((data) =>
                denormalizeResponse({
                    response: data.label!,
                    normalizationData: data.normalizationData,
                    strategy: 'MATRIX',
                })
            ),
            E.map((x) => {
                console.log('Matrix denormalized result');
                visualize3DArray(x.arraySync());
                return x;
            }),
            E.mapLeft((err) => {
                let message = `Type: ${err.type}. Message: ${err.message}`;
                if (err.innerError) {
                    message = `${message} SType: ${err.innerError.type}. SMessage: ${err.innerError.message}`;
                }

                assert.strictEqual(true, false, message);
            })
        );
    });
});
