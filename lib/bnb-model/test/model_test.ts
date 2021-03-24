import {
    createEmptyModel,
    modelParseJSON,
    modelParseYAML,
    modelSerializeJSON,
    modelSerializeYAML,
    splitToLayers,
    validateModel,
} from '../lib/model/model';
import * as assert from 'assert';
import { chain, fold, map } from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import {
    applyNodeToNode,
    applyUnitToModel,
    applyUnitToNode,
    createNode,
    createUnit,
} from '../lib/model/index';

const _createModel = () =>
    pipe(
        createEmptyModel(),
        chain((model) =>
            pipe(
                createNode({ type: '_struct', parent: model.root }),
                chain((inputN) =>
                    pipe(
                        createUnit({
                            type: '_input',
                            options: { type: '_input', shape: [null, 8] },
                        }),
                        chain(applyUnitToModel(model)),
                        chain(applyUnitToNode(inputN)),
                        chain((_) =>
                            pipe(
                                createNode({
                                    type: '_struct',
                                    parent: inputN,
                                }),
                                chain((logicN1) =>
                                    pipe(
                                        createUnit({
                                            type: '_sequential',
                                            options: {
                                                type: '_sequential',
                                                activation: null,
                                                shape: [null, 100],
                                            },
                                        }),
                                        chain(applyUnitToModel(model)),
                                        chain(applyUnitToNode(logicN1)),
                                        chain((_) =>
                                            pipe(
                                                createNode({
                                                    type: '_struct',
                                                    parent: logicN1,
                                                }),
                                                chain((logicN2_1) =>
                                                    pipe(
                                                        createUnit({
                                                            type: '_sequential',
                                                            options: {
                                                                type:
                                                                    '_sequential',
                                                                shape: [
                                                                    null,
                                                                    12,
                                                                ],
                                                                activation: {
                                                                    type:
                                                                        'relu',
                                                                    maxValue: 1,
                                                                },
                                                            },
                                                        }),
                                                        chain(
                                                            applyUnitToModel(
                                                                model
                                                            )
                                                        ),
                                                        chain(
                                                            applyUnitToNode(
                                                                logicN2_1
                                                            )
                                                        ),
                                                        chain((_) =>
                                                            pipe(
                                                                createNode({
                                                                    type:
                                                                        '_struct',
                                                                    parent: logicN1,
                                                                }),
                                                                chain(
                                                                    (
                                                                        logicN2_2
                                                                    ) =>
                                                                        pipe(
                                                                            createUnit(
                                                                                {
                                                                                    type:
                                                                                        '_sequential',
                                                                                    options: {
                                                                                        type:
                                                                                            '_sequential',
                                                                                        shape: [
                                                                                            null,
                                                                                            12,
                                                                                        ],
                                                                                        activation: {
                                                                                            type:
                                                                                                'relu',
                                                                                            maxValue: 1,
                                                                                        },
                                                                                    },
                                                                                }
                                                                            ),
                                                                            chain(
                                                                                applyUnitToModel(
                                                                                    model
                                                                                )
                                                                            ),
                                                                            chain(
                                                                                applyUnitToNode(
                                                                                    logicN2_2
                                                                                )
                                                                            ),
                                                                            chain(
                                                                                (
                                                                                    _
                                                                                ) =>
                                                                                    pipe(
                                                                                        createNode(
                                                                                            {
                                                                                                type:
                                                                                                    '_struct',
                                                                                                parent: logicN2_1,
                                                                                            }
                                                                                        ),
                                                                                        chain(
                                                                                            (
                                                                                                outN1
                                                                                            ) =>
                                                                                                pipe(
                                                                                                    createUnit(
                                                                                                        {
                                                                                                            type:
                                                                                                                '_output',
                                                                                                            options: {
                                                                                                                type:
                                                                                                                    '_output',
                                                                                                                shape: [
                                                                                                                    null,
                                                                                                                    1,
                                                                                                                ],
                                                                                                            },
                                                                                                        }
                                                                                                    ),
                                                                                                    chain(
                                                                                                        applyUnitToModel(
                                                                                                            model
                                                                                                        )
                                                                                                    ),
                                                                                                    chain(
                                                                                                        applyUnitToNode(
                                                                                                            outN1
                                                                                                        )
                                                                                                    ),
                                                                                                    chain(
                                                                                                        (
                                                                                                            _
                                                                                                        ) =>
                                                                                                            pipe(
                                                                                                                createNode(
                                                                                                                    {
                                                                                                                        type:
                                                                                                                            '_reference',
                                                                                                                        parent: logicN2_2,
                                                                                                                    }
                                                                                                                ),
                                                                                                                chain(
                                                                                                                    applyNodeToNode(
                                                                                                                        outN1
                                                                                                                    )
                                                                                                                )
                                                                                                            )
                                                                                                    )
                                                                                                )
                                                                                        )
                                                                                    )
                                                                            )
                                                                        )
                                                                )
                                                            )
                                                        )
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
            _createModel(),
            chain(modelSerializeYAML),
            (yaml) => {
                return yaml;
            },
            chain(modelParseYAML),
            (x) => {
                const s = x;
                return x;
            },
            chain(validateModel),
            chain(splitToLayers),
            fold(
                (err) => {
                    assert.strictEqual(
                        true,
                        false,
                        `type: ${err.type}. message: ${err.message}`
                    );
                },
                (model) => {
                    const m = model;
                    console.log('Success');
                }
            )
        );
    });
});
