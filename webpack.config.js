const path = require('path');

module.exports = {
    mode: 'production',
    devtool: false,

    // starting point
    entry: './src/spec/index.ts',

    target: 'node',

    context: __dirname,

    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: 'ts-loader',
            },
            {
                test: /.node$/,
                loader: 'node-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: './index.js',
        path: path.resolve(__dirname, './dist'),
    },

    optimization: {
        usedExports: true,
    },
};
