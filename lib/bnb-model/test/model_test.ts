import { compileModel, createEmptyModel, modelParseYAML, modelPredict, modelSerializeYAML, splitToLayers, trainModel, validateModel } from '../lib/model/model';
import * as assert from 'assert';
import { chain, fold, map } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { applyUnitToModel, applyUnitToNode, createNode, createOptimizer, createUnit } from '../lib/model/index';
import { testGetNotIdealXorDataset, testGetNotIdealXorInput } from '@test/data/dataset_test_data';
import { denormalizeResponse, normalizeDataset } from '@lib/dataset';
import * as TE from 'fp-ts/TaskEither';
import * as T from 'fp-ts/Task';
import { visualize3DArray } from '@test/utils';

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
                                shape: [2],
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
                                                // activation: {
                                                //     type: 'linear',
                                                // },
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
                                                                shape: [1],
                                                                // activation: {
                                                                //     type: 'linear',
                                                                // },
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

describe('Model', () => {
    const simpleModel = _createSimpleModel();

    it('Serialize / Deserialize', () => {
        pipe(
            simpleModel,
            chain(modelSerializeYAML),
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

    it('Train XOR and get response', (done) => {
        const simpleModel = _createSimpleModel();
        const xorDataset = testGetNotIdealXorDataset();
        const xorTestSet = testGetNotIdealXorInput();
        pipe(
            simpleModel,
            chain((model) =>
                pipe(
                    normalizeDataset({ dataset: xorDataset, inputIndexes: [0, 1], strategy: 'INDIVIDUAL' }),
                    map((normalizationResult) => ({
                        model,
                        normalizationResult,
                    }))
                )
            ),
            chain(({ model, normalizationResult }) =>
                pipe(
                    compileModel(model, {
                        type: '_adam',
                        learningRate: 0.01,
                    }),
                    map((layersModel) => ({
                        layersModel,
                        normalizationResult,
                    }))
                )
            ),
            TE.fromEither,
            TE.chain(({ layersModel, normalizationResult }) =>
                pipe(
                    trainModel({
                        input: normalizationResult.input,
                        label: normalizationResult.label!,
                        model: layersModel,
                        options: {
                            batchSize: 1,
                            epochsCount: 100,
                            shuffleDataset: true,
                        },
                    }),
                    TE.map(({ model, history }) => ({ model, history, normalizationResult }))
                )
            ),
            TE.chain(({ model, history, normalizationResult }) =>
                pipe(
                    modelPredict({ model, input: xorTestSet, labelShape: normalizationResult.normalizationData.labelShape! }),
                    chain((result) =>
                        denormalizeResponse({
                            response: result,
                            strategy: 'INDIVIDUAL',
                            normalizationData: normalizationResult.normalizationData,
                        })
                    ),
                    TE.fromEither
                )
            ),
            TE.fold(
                (err) => {
                    let message = `Type: ${err.type}. Message: ${err.message}`;
                    if (err.innerError) {
                        message = `${message} SType: ${err.innerError.type}. SMessage: ${err.innerError.message}`;
                    }

                    assert.strictEqual(true, false, message);
                    return T.never;
                },
                (result) => {
                    visualize3DArray(result.arraySync());
                    done();
                    return T.never;
                }
            )
        )();
    });
});
