import { KeyLabelStringIterable } from '../core';

export enum EnumAppModelType {
  sequential = 'SEQUENTIAL',
  layers = 'LAYERS',
  symbolic = 'SYMBOLIC'
}

export const EnumAppModelTypeToString = (type: EnumAppModelType): string => {
  switch (type) {
    case EnumAppModelType.sequential:
      return 'Sequental';
    case EnumAppModelType.layers:
      return 'Layers';
    case EnumAppModelType.symbolic:
      return 'Symbolic';
    default:
      return 'UNKNOWN';
  }
};

export const EnumAppModelTypesList: KeyLabelStringIterable<EnumAppModelType>[] = [
  {
    key: EnumAppModelType.sequential,
    label: EnumAppModelTypeToString(EnumAppModelType.sequential)
  },
  {
    key: EnumAppModelType.layers,
    label: EnumAppModelTypeToString(EnumAppModelType.layers)
  },
  {
    key: EnumAppModelType.symbolic,
    label: EnumAppModelTypeToString(EnumAppModelType.symbolic)
  },
];

export enum EnumAppModelSubtype {
  simple = 'SIMPLE',
  lstm = 'LSTM',
}

export const EnumAppModelSubtypeToString = (type: EnumAppModelSubtype): string => {
  switch (type) {
    case EnumAppModelSubtype.simple:
      return 'Simple';
    case EnumAppModelSubtype.lstm:
      return 'Long Short Term Memory';
    default:
      return 'UNKNOWN';
  }
};

export const EnumAppModelSubtypesList: KeyLabelStringIterable<EnumAppModelSubtype>[] = [
  {
    key: EnumAppModelSubtype.simple,
    label: EnumAppModelSubtypeToString(EnumAppModelSubtype.simple)
  },
  {
    key: EnumAppModelSubtype.lstm,
    label: EnumAppModelSubtypeToString(EnumAppModelSubtype.lstm)
  }
];
