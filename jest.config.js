// https://github.com/thymikee/jest-preset-angular#brief-explanation-of-config
module.exports = {
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.test.json'
        }
    },
    transform: {
        '^.+\\.(ts)$': 'ts-jest'
    },
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'html', 'js', 'json'],
    moduleNameMapper: {
        '^src/(.*)$': '<rootDir>/src/$1'
    },
    transformIgnorePatterns: ['node_modules/(?!@ngrx)', 'node_modules/(?!(jest-test))'],
    roots: ['tests', 'src'],
    testPathIgnorePatterns: ['<rootDir>/tests/spec/test-data']
};
