/**
 * Core Indexed Map module
 * Allow to operate simple map type with custom type
 * Easy convertable to/from json/yaml/blob/any
 * 
 * @packageDocumentation IndexedMap
 * @module IndexedMap
 */

/**
 * Generic collection based on number index
 * Easy convertable
 * Operable by methods from Indexed Map package
 * 
 * @typeParam T - Value type of Indexed Map
 */
export interface IndexedMap<T> {
  [index: number]: T;
}

/**
 * Indexed Map key/value pair
 * 
 * @typedef IMKeyValue<T>
 * @typeParam T Type of values from Indexed Map 
 */

/**
 * Key to boolean
 * 
 * @typedef IMKeyFilterDelegate
 * @typeParam T - Indexed map member`s key
 * @param {number} - Key
 * @returns {boolean}
 */

/**
 * Value to boolean
 * 
 * @typedef IMValueFilterDelegate<T>
 * @typeParam T - Any type
 * @param {T} value - Indexed map member`s value
 * @returns {boolean}
 */

/**
 * Indexed map to entities array delegate
 * 
 * @typedef IMToEntitiesDelegate<T>
 * @typeParam T - Any
 * @param {IndexedMap<T>} - IndexedMap
 * @return {Array.IMKeyValue<T>}
 */

/**
 * Get entities as list of key / value objects
 * 
 * @function
 * @param {IndexedMap<T>} im - Indexed Map
 * @return {Array.IMKeyValue<T>} - Key value entities array
 */
export const getEntities =
  <TVal>(im: IndexedMap<TVal>): { key: number; value: TVal }[] => im
    ? Object.keys(im).map((key: string) => ({ key: Number(key), value: im[Number(key)] }))
    : [];

/**
 * Get keys of IndexedMap
 * 
 * @function
 * @typeParam T - Indexed Map value type
 * @param  {IndexedMap<T>} im - Indexed Map
 * @return {Array.nubmer} - Array of indexes
 */
export const getKeys = <TVal>(im: IndexedMap<TVal>): number[] => im
  ? Object.keys(im).map(Number)
  : [];

/**
 * Get values of IndexedMap
 * 
 * @function
 * @typeParam T - Indexed Map value type
 * @param {IndexedMap<T>} im - Indexed Map
 * @return {Array.T} - Values array
 */
export const getValues = <T>(im: IndexedMap<T>): T[] => getEntities(im).map(x => x.value);

/**
 * Get length of IndexedMap
 * 
 * @function
 * @typeParam T - Indexed Map value type
 * @param {IndexedMap<T>} im - Indexed Map
 * @return {number} - Length of indexed map
 */
export const length = <T>(im: IndexedMap<T>): number => im
  ? Object.keys(im).length
  : 0;

/**
 * Create IM delegate from fitler function
 * 
 * @function
 * @typeParam T - Indexed Map value type
 * @param {IMKeyFilterDelegate} f - Key filter function
 * @return {IMToEntitiesDelegate<T>}
 */
export const filterByKey = <T>(f: (key: number) => boolean): (map: IndexedMap<T>) => { key: number; value: T }[] => (map: IndexedMap<T>): { key: number; value: T }[] => getEntities(map).filter(x => f(x.key));

/**
 * Filter IndexedMap<T> and return { key: number; value: T } [] 
 * 
 * @function
 * @typeParam T - Indexed Map value type
 * @param {IMValueFilterDelegate} f - Value filter delegate
 * @return {IMToEntitiesDelegate<T>}
 */
export const filterByValue = <T>(f: (value: T) => boolean): (map: IndexedMap<T>) => { key: number; value: T }[] => (map: IndexedMap<T>): { key: number; value: T }[] => getEntities(map).filter(x => f(x.value));

/**
 * Creates IndexedMap from entities list
 * 
 * @function
 * @typeParam T - Indexed Map value type
 * @param {Array.IMKeyValue<T>} entities - Entities collection
 */
export const fromList = <T>(entities: { key: number; value: T }[]) => entities.reduce((map, current) => { map[current.key] = current.value; return map; }, {} as IndexedMap<T>);

/**
 * Clone IndexedMap
 * 
 * @function
 * @typeParam T - Indexed Map value type
 * @param sourceMap - Source indexed map
 * @return {IndexedMap<T>} 
 */
export const clone = <T>(sourceMap: IndexedMap<T>): IndexedMap<T> => fromList(getEntities(sourceMap));

/**
 * Partial cone of IndexedMap based on value delegate
 * 
 * @function
 * @typeParam T - Indexed Map value type
 * @param {IMValueFilterDelegate} f - Filter delegate
 */
export const cloneWhereValue = <T>(f: (value: T) => boolean): ((im: IndexedMap<T>) => IndexedMap<T>) => (sourceMap: IndexedMap<T>) => fromList(filterByValue(f)(sourceMap));

/**
 * Partial cone of IndexedMap based on key delegate
 * 
 * @function
 * @typeParam T - Indexed Map value type
 * @param f - where key delegate
 */
export const cloneWhereKey = <T>(f: (key: number) => boolean) => (sourceMap: IndexedMap<T>) => fromList(filterByKey(f)(sourceMap));

/**
 * Clone IndexedMap<T1> to IndexedMap<T2> based on delegate
 * 
 * @function
 * @param f - transform T1 -> T2 delegate
 */
export const transform = <TVal1, TVal2>(f: (payload: { key: number; value: TVal1 }) => { key: number; value: TVal2 }) => (payload: IndexedMap<TVal1>) => fromList(getEntities(payload).map(f));
