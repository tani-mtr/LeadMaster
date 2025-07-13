const path = require('path');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            return webpackConfig;
        }
    },
    devServer: {
        allowedHosts: 'all',
        host: 'localhost',
        port: 3000,
        compress: true,
        hot: true,
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        },
    }
};
