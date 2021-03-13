/**
 * Generic KeyLabel bundle for options display
 */
export interface KeyLabelIterable<TKey, TValue> {
  key: TKey;
  label: TValue;
}

/**
 * Instance of KeyLabel with string label
 */
export type KeyLabelStringIterable<TKey> = KeyLabelIterable<TKey, string>