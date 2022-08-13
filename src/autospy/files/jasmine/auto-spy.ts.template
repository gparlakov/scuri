/** Create an object with methods that are autoSpy-ed to use as mock dependency */
export function autoSpy<T>(obj: new (...args: any[]) => T): SpyOf<T> {
  const res: SpyOf<T> = {} as any;

  // turns out that in target:es2015 the methods attached to the prototype are not enumerable so Object.keys returns []. So to workaround that and keep some backwards compatibility - merge with ownPropertyNames - that disregards the enumerable property.
  // the Set remove duplicate entries
  const keys = new Set([
    ...(Object.keys(obj.prototype) as Array<keyof T>),
    ...(Object.getOwnPropertyNames(obj.prototype) as Array<keyof T>),
  ]);

  keys.forEach((key) => {
    if (typeof key === 'string') {
      (res[key] as any) = jasmine.createSpy(key);
    }
  });

  return res;
}

/** Keeps the types of properties of a type but assigns type of Spy to the methods */
export type SpyOf<T> = T &
  Partial<{
    [k in keyof T]: T[k] extends (...args: any[]) => any ? jasmine.Spy : T[k];
  }>;
