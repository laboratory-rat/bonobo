import { TF } from '../connector';

export type LayerChainType =
    | TF.Tensor
    | TF.Tensor[]
    | TF.SymbolicTensor
    | TF.SymbolicTensor[];
