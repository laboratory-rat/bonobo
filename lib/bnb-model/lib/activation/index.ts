import { TF } from '../connector/index';

export type ActivationStringType = 'relu' | 'sigmoid';
export type ActivationType = ActivationRelu;

interface Activation {
    type: ActivationStringType;
}

interface ActivationRelu {
    type: ActivationType;
}
