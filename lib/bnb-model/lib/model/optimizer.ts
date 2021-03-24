import {
    chain,
    Either,
    fromNullable,
    left,
    of,
    right,
    tryCatch,
} from 'fp-ts/Either';
import { createError, ERR } from '@lib/error';
import { pipe } from 'fp-ts/function';
import { TF } from '@lib/connector';

export type Optimizer =
    | OptimizerSGD
    | OptimizerMomentum
    | OptimizerAdagrad
    | OptimizerAdadelta
    | OptimizerAdam
    | OptimizerAdamax
    | OptimizerRmsprop;

export type OptimizerType =
    | '_sgd'
    | '_momentum'
    | '_adagrad'
    | '_adadelta'
    | '_adam'
    | '_adamax'
    | '_rmsprop';

export type ErrorTypeOptimizer =
    | 'OPTIMIZER_VALIDATE_ERROR'
    | 'OPTIMIZER_COMPILE_ERROR'
    | 'OPTIMIZER_UNDEFINED_ERROR';

interface BaseOptimizer {
    type: OptimizerType;
}

export interface OptimizerSGD extends BaseOptimizer {
    type: '_sgd';
    learningRate: number;
}

export interface OptimizerMomentum extends BaseOptimizer {
    type: '_momentum';
    learningRate: number;
    momentum: number;
    useNesterov: boolean;
}

export interface OptimizerAdagrad extends BaseOptimizer {
    type: '_adagrad';
    learningRate: number;
    initialAccumulatorValue?: number;
}

export interface OptimizerAdadelta extends BaseOptimizer {
    type: '_adadelta';
    learningRate?: number;
    rho?: number;
    epsilon?: number;
}

export interface OptimizerAdam extends BaseOptimizer {
    type: '_adam';
    learningRate?: number;
    beta1?: number;
    beta2?: number;
    epsilon?: number;
}

export interface OptimizerAdamax extends BaseOptimizer {
    type: '_adamax';
    learningRate?: number;
    beta1?: number;
    beta2?: number;
    epsilon?: number;
    decay?: number;
}

export interface OptimizerRmsprop extends BaseOptimizer {
    type: '_rmsprop';
    learningRate: number;
    decay?: number;
    momentum?: number;
    epsilon?: number;
    centered: boolean;
}

export const createOptimizer = (type: OptimizerType): Optimizer => {
    switch (type) {
        case '_sgd':
            return {
                type,
                learningRate: 0.01,
            };
        case '_momentum':
            return {
                type,
                learningRate: 0.01,
                momentum: 0.1,
                useNesterov: false,
            };
        case '_adagrad':
            return {
                type,
                learningRate: 0.01,
                initialAccumulatorValue: undefined,
            };
        case '_adadelta':
            return {
                type,
                learningRate: 0.01,
            };
        case '_adam':
            return {
                type,
                learningRate: 0.01,
            };
        case '_adamax':
            return {
                type,
                learningRate: 0.01,
            };
        case '_rmsprop':
            return {
                type,
                learningRate: 0.01,
                centered: false,
            };
    }
};

export const validateOptimizer = (
    optimizer: Optimizer
): Either<ERR, Optimizer> =>
    pipe(
        optimizer,
        fromNullable(
            createError('OPTIMIZER_VALIDATE_ERROR', 'Optimizer is null')
        ),
        chain((o) => {
            const _nop = (
                name: string,
                val?: number,
                undefinedPossible = true
            ): ((optimizer: Optimizer) => Either<ERR, Optimizer>) => (
                optimizer: Optimizer
            ) =>
                (!undefinedPossible && val == undefined) || (val && val <= 0)
                    ? left(
                          createError(
                              'OPTIMIZER_VALIDATE_ERROR',
                              `Field ${name} must be null or positive`
                          )
                      )
                    : right(optimizer);

            const _of: Either<ERR, Optimizer> = of<ERR, Optimizer>(optimizer);

            switch (o.type) {
                case '_sgd':
                    return pipe(
                        _of,
                        chain(_nop('Learning rate', o.learningRate, false))
                    );
                case '_momentum':
                    return pipe(
                        _of,
                        chain(_nop('Learning rate', o.learningRate, false)),
                        chain(_nop('Momentum', o.momentum, false))
                    );
                case '_adagrad':
                    return pipe(
                        _of,
                        chain(_nop('Learning rate', o.learningRate, false)),
                        chain(
                            _nop(
                                'Initial accumulator value',
                                o.initialAccumulatorValue
                            )
                        )
                    );
                case '_adadelta':
                    return pipe(
                        _of,
                        chain(_nop('Learning rate', o.learningRate)),
                        chain(_nop('Rho', o.rho)),
                        chain(_nop('Epsilon', o.epsilon))
                    );
                case '_adam':
                    return pipe(
                        _of,
                        chain(_nop('Learning rate', o.learningRate)),
                        chain(_nop('Beta 1', o.beta1)),
                        chain(_nop('Beta 2', o.beta2)),
                        chain(_nop('Epsilon', o.epsilon))
                    );
                case '_adamax':
                    return pipe(
                        _of,
                        chain(_nop('Learning rate', o.learningRate)),
                        chain(_nop('Beta 1', o.beta1)),
                        chain(_nop('Beta 2', o.beta2)),
                        chain(_nop('Epsilon', o.epsilon)),
                        chain(_nop('Decay', o.decay))
                    );
                case '_rmsprop':
                    return pipe(
                        _of,
                        chain(_nop('Learning rate', o.learningRate, false)),
                        chain(_nop('Decay', o.decay)),
                        chain(_nop('Momentum', o.momentum)),
                        chain(_nop('Epsilon', o.epsilon))
                    );
            }
        })
    );

export const compileOptimizer = (
    optimizer: Optimizer
): Either<ERR, TF.Optimizer> =>
    pipe(
        optimizer,
        fromNullable(
            createError('OPTIMIZER_COMPILE_ERROR', 'Optimizer is null')
        ),
        chain(validateOptimizer),
        chain((o) =>
            tryCatch(
                () => {
                    switch (o.type) {
                        case '_sgd':
                            return TF.train.sgd(o.learningRate);
                        case '_momentum':
                            return TF.train.momentum(
                                o.learningRate,
                                o.momentum,
                                o.useNesterov
                            );
                        case '_adagrad':
                            return TF.train.adagrad(
                                o.learningRate,
                                o.initialAccumulatorValue
                            );
                        case '_adadelta':
                            return TF.train.adadelta(
                                o.learningRate,
                                o.rho,
                                o.epsilon
                            );
                        case '_adam':
                            return TF.train.adam(
                                o.learningRate,
                                o.beta1,
                                o.beta2,
                                o.epsilon
                            );
                        case '_adamax':
                            return TF.train.adamax(
                                o.learningRate,
                                o.beta1,
                                o.beta2,
                                o.epsilon,
                                o.decay
                            );
                        case '_rmsprop':
                            return TF.train.rmsprop(
                                o.learningRate,
                                o.decay,
                                o.momentum,
                                o.epsilon,
                                o.centered
                            );
                    }
                },
                (reason) => createError('OPTIMIZER_COMPILE_ERROR', reason)
            )
        )
    );
