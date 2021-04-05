import { TF } from '../connector';

export type LayerChainType = TF.SymbolicTensor | TF.layers.Layer;

export type LayerChainTypeApplicable = TF.SymbolicTensor | TF.SymbolicTensor[];