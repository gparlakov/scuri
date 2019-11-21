/** Create an object with methods that are autoSpy-ed to use as mock dependency */
export function autoSpy<T>(obj: any, type: string = ''): SpyOf<T> {
    const res: SpyOf<T> = {} as any;

    switch (type) {
        /**
         * Definne here how to create specific type for your project.
         * @example :
         * case 'I18n' :
         * return (data) => data.value;
         */
        default:
            return defaultSpy<t>(obj);
    }
}

function defaultSpy<t>(obj: new (...args: any[]) => T) {
    const res: SpyOf<T> = {} as any;

    Object.keys(obj.prototype).forEach(key => {
        res[key] = jasmine.createSpy(key);
    });

    return res;
}

/** Keeps the types of properties of a type but assigns type of Spy to the methods */
type SpyOf<T> = T &
    Partial<{ [k in keyof T]: T[k] extends (...args: any[]) => any ? jasmine.Spy : T[k] }>;
