import { createError, ERR } from '../error';
import {
    chain,
    Either,
    fromNullable,
    left,
    map,
    of,
    right,
    tryCatch,
} from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';
import { TF } from '../connector';

export type ActivationType =
    | 'elu'
    | 'selu'
    | 'relu'
    | 'relu6'
    | 'linear'
    | 'sigmoid'
    | 'hardSigmoid'
    | 'softplus'
    | 'softsign'
    | 'tanh'
    | 'softmax';

export type Activation =
    | ActivationElu
    | ActivationSelu
    | ActivationRelu
    | ActivationRelu6
    | ActivationLinear
    | ActivationSigmoid
    | ActivationHardSigmoid
    | ActivationSoftplus
    | ActivationSoftsign
    | ActivationTanh
    | ActivationSoftmax;

export type ErrorTypeActivation =
    | 'ACTIVATION_VALIDATION_ERROR'
    | 'ACTIVATION_COMPILE_ERROR'
    | 'ACTIVATION_APPLY_ERROR';

const _createError = (
    type: ErrorTypeActivation,
    message: unknown,
    innerError?: ERR
) => createError(type, message, innerError);

interface BaseActivation {
    type: ActivationType;
}

///@link {https://arxiv.org/abs/1511.07289v1}
export interface ActivationElu extends BaseActivation {
    type: 'elu';
    alpha?: number;
    inputShape?: (number | null)[];
    batchInputShape?: (number | null)[];
}

export interface ActivationSelu extends BaseActivation {
    type: 'selu';
}

export interface ActivationRelu extends BaseActivation {
    type: 'relu';
    maxValue?: number;
}

export interface ActivationRelu6 extends BaseActivation {
    type: 'relu6';
}

export interface ActivationLinear extends BaseActivation {
    type: 'linear';
}

export interface ActivationSigmoid extends BaseActivation {
    type: 'sigmoid';
}

export interface ActivationHardSigmoid extends BaseActivation {
    type: 'hardSigmoid';
}

export interface ActivationSoftplus extends BaseActivation {
    type: 'softplus';
}

export interface ActivationSoftsign extends BaseActivation {
    type: 'softsign';
}

export interface ActivationTanh extends BaseActivation {
    type: 'tanh';
}

export interface ActivationSoftmax extends BaseActivation {
    type: 'softmax';
    axis?: number;
}

export const validateActivation = (
    activation: Activation
): Either<ERR, Activation> =>
    pipe(
        activation,
        fromNullable(
            _createError('ACTIVATION_VALIDATION_ERROR', 'Validation is null')
        ),
        chain((activation) => {
            const _l = (m: unknown) =>
                left(_createError('ACTIVATION_VALIDATION_ERROR', m));
            switch (activation.type) {
                case 'elu':
                    if (activation.alpha && activation.alpha < 0)
                        return _l('Alpha is < 0');
                    break;
                case 'relu':
                    if (activation.maxValue && activation.maxValue <= 0)
                        return _l('Max value <= 0');
                    break;
                case 'softmax':
                    if (
                        activation.axis &&
                        (activation.axis < -1 || activation.axis > 1)
                    )
                        return _l('Axis must be in rang -1 - 1');
                    break;
                default:
                    break;
            }
            return right(activation);
        })
    );

export const compileActivation = (
    activation: Activation,
    parent: any
): Either<ERR, any> =>
    pipe(
        activation,
        of,
        chain(validateActivation),
        chain((activation) =>
            tryCatch(
                () => {
                    switch (activation.type) {
                        case 'elu':
                            return TF.layers.elu({
                                ...activation,
                            });

                        case 'selu':
                            return TF.layers.activation({
                                activation: 'selu',
                            });
                        case 'relu':
                            return TF.layers.reLU({
                                maxValue: activation.maxValue,
                            });
                        case 'relu6':
                            return TF.layers.activation({
                                activation: 'relu6',
                            });
                        case 'linear':
                            return TF.layers.activation({
                                activation: 'linear',
                            });
                        case 'sigmoid':
                            return TF.layers.activation({
                                activation: 'sigmoid',
                            });
                        case 'softplus':
                            return TF.layers.activation({
                                activation: 'softplus',
                            });
                        case 'softsign':
                            return TF.layers.activation({
                                activation: 'softsign',
                            });
                        case 'tanh':
                            return TF.layers.activation({
                                activation: 'tanh',
                            });
                        case 'softmax':
                            return TF.layers.softmax({
                                ...activation,
                            });
                    }

                    throw 'Unknown activation type';
                },
                (r) => _createError('ACTIVATION_COMPILE_ERROR', r)
            )
        ),
        map((activation) => activation.apply(parent))
    );
