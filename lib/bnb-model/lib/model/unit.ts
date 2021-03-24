import { generateRandomId } from '../util/util';
import {
    chain,
    Either,
    fromNullable,
    left,
    map,
    mapLeft,
    of,
    right,
} from 'fp-ts/Either';
import { createError, ERR } from '../error';
import {
    Activation,
    applyActivationToLayer,
    validateActivation,
} from './activation';
import { pipe } from 'fp-ts/function';
import { Model } from '@lib/model/model';
import { head, filter } from 'lodash';
import { LayerChainType } from '@lib/util/types';
import { TF } from '../connector';

export type ModelUnit =
    | InputUnit
    | SequentialUnit
    | RecurrentUnit
    | TransformUnit
    | OutputUnit;

export type ModelUnitOptions =
    | UnitOptionsSequential
    | UnitOptionsRecurrent
    | UnitOptionsTransform
    | UnitOptionsInput
    | UnitOptionsOutput;

export type UnitType =
    | '_input'
    | '_sequential'
    | '_recurrent'
    | '_transform'
    | '_output';

export type ErrorTypeUnit =
    | 'UNIT_CREATE_ERROR'
    | 'UNIT_SERIALIZE_ERROR'
    | 'UNIT_PARSE_ERROR'
    | 'UNIT_CLONE_ERROR'
    | 'UNIT_APPLY_ERROR'
    | 'UNIT_VALIDATION_ERROR'
    | 'UNIT_COMPILE_ERROR';

interface BaseUnit {
    id: string;
    type: UnitType;
}

export interface InputUnit extends BaseUnit {
    type: '_input';
    options: UnitOptionsInput;
}

export interface SequentialUnit extends BaseUnit {
    type: '_sequential';
    options: UnitOptionsSequential;
}

export interface RecurrentUnit extends BaseUnit {
    type: '_recurrent';
    options: UnitOptionsRecurrent;
}

export interface TransformUnit extends BaseUnit {
    type: '_transform';
    options: UnitOptionsTransform;
}

export interface OutputUnit extends BaseUnit {
    type: '_output';
    options: UnitOptionsOutput;
}

export type UnitOptionsType =
    | '_input'
    | '_sequential'
    | '_recurrent'
    | '_transform'
    | '_output';

interface BaseUnitOptions {
    type: UnitOptionsType;
}

export interface UnitOptionsInput extends BaseUnitOptions {
    type: '_input';
    shape: (number | null)[];
}

export interface UnitOptionsSequential extends BaseUnitOptions {
    type: '_sequential';
    units: number;
    shape: (null | number)[];
    activation?: Activation;
}

export interface UnitOptionsRecurrent extends BaseUnitOptions {
    type: '_recurrent';
    shape: (null | number)[];
}

export interface UnitOptionsTransform extends BaseUnitOptions {
    type: '_transform';
    shape: (null | number)[];
}

export interface UnitOptionsOutput extends BaseUnitOptions {
    type: '_output';
    shape: (null | number)[];
    units: number;
}

export const createUnit = (payload: {
    type: UnitType;
    id?: string;
    options?: ModelUnitOptions;
}): Either<ERR, ModelUnit> => {
    const { type, id, options } = payload;
    const _id = id ?? generateRandomId();
    switch (type) {
        case '_input':
            if (options && options.type != '_input') {
                return left(
                    createError('UNIT_CREATE_ERROR', 'Bad options type')
                );
            }

            return right({
                type,
                id: _id,
                options: options ?? {
                    type: '_input',
                    shape: [null, 1],
                },
            });

        case '_sequential':
            if (options && options.type != '_sequential') {
                return left(
                    createError('UNIT_CREATE_ERROR', 'Bad options type')
                );
            }

            return right({
                type,
                id: _id,
                options: options ?? {
                    type: '_sequential',
                    units: 1,
                    activation: {
                        type: 'relu',
                    },
                    shape: [null, 1],
                },
            });

        case '_recurrent':
            if (options && options.type != '_recurrent') {
                return left(
                    createError('UNIT_CREATE_ERROR', 'Bad options type')
                );
            }

            return right({
                type,
                id: _id,
                options: options ?? {
                    type: '_recurrent',
                    activation: null,
                    shape: [null, 1],
                },
            });

        case '_transform':
            if (options && options.type != '_transform') {
                return left(
                    createError('UNIT_CREATE_ERROR', 'Bad options type')
                );
            }

            return right({
                type,
                id: _id,
                options: options ?? {
                    type: '_transform',
                    shape: [null, 1],
                },
            });
        case '_output':
            if (options && options.type != '_output') {
                return left(
                    createError('UNIT_CREATE_ERROR', 'Bad options type')
                );
            }

            return right({
                type,
                id: _id,
                options: options ?? {
                    type: '_output',
                    shape: [null, 1],
                    units: 1,
                },
            });

        default:
            return left(createError('UNIT_CREATE_ERROR', 'Unknown unit type'));
    }
};

export const applyUnitToModel = (
    model: Model
): ((unit: ModelUnit) => Either<ERR, ModelUnit>) => (unit: ModelUnit) =>
    pipe(
        unit,
        fromNullable(createError('UNIT_APPLY_ERROR', 'Unit is null')),
        chain((unit) =>
            pipe(
                model,
                fromNullable(createError('UNIT_APPLY_ERROR', 'Model is null')),
                chain((model) => {
                    if (!model.units) {
                        model.units = [];
                    }

                    if (head(filter(model.units, { id: unit.id }))) {
                        return left(
                            createError(
                                'UNIT_APPLY_ERROR',
                                'Unit with this id already added to the model'
                            )
                        );
                    }

                    model.units.push(unit);
                    return right(unit);
                })
            )
        )
    );

export const serializePrepareUnit = (unit: ModelUnit): ModelUnit => ({
    ...unit,
});

export const parsePrepareUnit = (unit: ModelUnit): ModelUnit => ({
    ...unit,
});

export const validateUnit = (unit: ModelUnit): Either<ERR, ModelUnit> =>
    pipe(
        unit,
        fromNullable(createError('UNIT_VALIDATION_ERROR', 'Unit is null')),
        chain((unit) => {
            const _l = (m: unknown, inner?: ERR) =>
                left(createError('UNIT_VALIDATION_ERROR', m, inner));

            const _validateShape = <T>(
                shape: (number | null)[]
            ): ((val: T) => Either<ERR, T>) => (val: T) =>
                pipe(
                    shape,
                    fromNullable(
                        createError(
                            'UNIT_VALIDATION_ERROR',
                            'Shape is required'
                        )
                    ),
                    chain((x) =>
                        x.length == 0 || x.some((z) => z != null && z < 1)
                            ? _l(`Wrong shape provided: ${JSON.stringify(x)}`)
                            : right(x)
                    ),
                    map((_) => val)
                );

            switch (unit.type) {
                case '_input':
                    return pipe(
                        unit.options,
                        fromNullable(
                            createError(
                                'UNIT_VALIDATION_ERROR',
                                'Input unit options is required'
                            )
                        ),
                        chain(({ shape }) => _validateShape(shape)(null)),
                        map((_) => unit)
                    );
                case '_sequential':
                    return pipe(
                        unit.options,
                        fromNullable(
                            createError(
                                'UNIT_VALIDATION_ERROR',
                                'Sequential unit require options'
                            )
                        ),
                        chain((options) =>
                            _validateShape<UnitOptionsSequential>(
                                options.shape
                            )(options)
                        ),
                        chain(({ activation }) =>
                            activation
                                ? validateActivation(activation)
                                : of(null)
                        ),
                        mapLeft((err) =>
                            createError(
                                'UNIT_VALIDATION_ERROR',
                                'Inner error',
                                err
                            )
                        ),
                        map((_) => unit)
                    );
                case '_recurrent':
                    return left(
                        createError('UNIT_VALIDATION_ERROR', 'Not implemented!')
                    );
                case '_transform':
                    return left(
                        createError('UNIT_VALIDATION_ERROR', 'Not implemented!')
                    );
                case '_output':
                    return pipe(
                        unit.options,
                        fromNullable(
                            createError(
                                'UNIT_VALIDATION_ERROR',
                                'Output unit options is required'
                            )
                        ),
                        chain((options) =>
                            _validateShape(options.shape)(options)
                        ),
                        map((_) => unit)
                    );
                default:
                    return left(
                        createError(
                            'UNIT_VALIDATION_ERROR',
                            'Unknown unit type'
                        )
                    );
            }
        })
    );

export const compileUnit = (
    unit: ModelUnit
): Either<ERR, LayerChainType | TF.layers.Layer> =>
    pipe(
        unit,
        fromNullable(createError('UNIT_COMPILE_ERROR', 'Unit is null')),
        chain(validateUnit),
        chain((unit) => {
            switch (unit.type) {
                case '_input':
                    return right(
                        TF.layers.inputLayer({
                            inputShape: unit.options.shape,
                        })
                    );
                case '_sequential':
                    return pipe(
                        of<ERR, TF.layers.Layer>(
                            TF.layers.dense({
                                units: unit.options.units,
                            })
                        ),
                        chain((layer) =>
                            unit.options.activation
                                ? applyActivationToLayer(
                                      layer,
                                      unit.options.activation
                                  )
                                : right(layer)
                        )
                    );
                case '_output':
                    return right(
                        TF.layers.dense({
                            units: unit.options.units,
                        })
                    );
                case '_transform':
                case '_recurrent':
                    return left(
                        createError(
                            'UNIT_COMPILE_ERROR',
                            'Recurrent and transform units are not implemented'
                        )
                    );
            }
        })
    );