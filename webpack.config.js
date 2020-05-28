const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                use: {
                    loader: 'babel-loader'
                }
            }
        ]
    },
    entry: './frontend/src/index.js',
    output: {
        path: path.resolve(__dirname, 'frontend/dist')
    }
};