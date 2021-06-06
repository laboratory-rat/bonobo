import { compileModel, createEmptyModel, modelParseYAML, modelSerializeYAML, splitToLayers, validateModel } from '../lib/model/model';
import * as assert from 'assert';
import { chain, fold, map } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { applyUnitToModel, applyUnitToNode, createNode, createOptimizer, createUnit } from '../lib/model/index';

const _createSimpleModel = () =>
    pipe(
        createEmptyModel(),
        chain((model) =>
            pipe(
                createNode({ type: '_struct', parent: model.root }),
                chain((inputNode) =>
                    pipe(
                        createUnit({
                            type: '_input',
                            options: {
                                type: '_input',
                                shape: [10],
                            },
                        }),
                        chain(applyUnitToNode(inputNode)),
                        chain(applyUnitToModel(model)),
                        chain((_) =>
                            pipe(
                                createNode({
                                    type: '_struct',
                                    parent: inputNode,
                                }),
                                chain((hiddenNode) =>
                                    pipe(
                                        createUnit({
                                            type: '_sequential',
                                            options: {
                                                type: '_sequential',
                                                activation: {
                                                    type: 'linear',
                                                },
                                                units: 5,
                                                useBias: true,
                                            },
                                        }),
                                        chain(applyUnitToNode(hiddenNode)),
                                        chain(applyUnitToModel(model)),
                                        chain((_) =>
                                            pipe(
                                                createNode({
                                                    type: '_struct',
                                                    parent: hiddenNode,
                                                }),
                                                chain((outputNode) =>
                                                    pipe(
                                                        createUnit({
                                                            type: '_output',
                                                            options: {
                                                                type: '_output',
                                                                units: 1,
                                                                useBias: true,
                                                                shape: [null, 1],
                                                                activation: {
                                                                    type: 'linear',
                                                                },
                                                            },
                                                        }),
                                                        chain(applyUnitToNode(outputNode)),
                                                        chain(applyUnitToModel(model))
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            )
                        )
                    )
                ),
                map((_) => model)
            )
        )
    );

describe('Array', () => {
    describe('#indexOf()', () => {
        it('should return -1 when the value is not present', function () {
            assert.strictEqual([1, 2, 3].indexOf(4), -1);
        });
    });
});

describe('Model', () => {
    it('#create', () => {
        pipe(
            _createSimpleModel(),
            chain(modelSerializeYAML),
            (yaml) => {
                return yaml;
            },
            chain(modelParseYAML),
            chain(validateModel),
            chain((model) =>
                pipe(
                    model,
                    splitToLayers,
                    map((_) => model)
                )
            ),
            chain((model) => compileModel(model, createOptimizer('_sgd'))),
            fold(
                (err) => {
                    assert.strictEqual(true, false, `type: ${err.type}. message: ${err.message}`);
                },
                (model) => {
                    const m = model;
                    console.log('Success');
                }
            )
        );
    });
});
