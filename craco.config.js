const webpack = require('webpack');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.experiments = {
                asyncWebAssembly: true,
            };

            const wasmExtensionRegExp = /\.wasm$/;
            webpackConfig.module.rules.forEach((rule) => {
                (rule.oneOf || []).forEach((oneOf) => {
                    if (oneOf.type === 'asset/resource') {
                        oneOf.exclude.push(wasmExtensionRegExp);
                    }
                });
            });

            webpackConfig.resolve.fallback = { 
                crypto: require.resolve('crypto-browserify'),
                path: require.resolve('path-browserify'),
                stream: require.resolve('stream-browserify'),
                util: require.resolve('util/'),
            };
            webpackConfig.plugins.push(
                new webpack.ProvidePlugin({
                    process: 'process/browser.js',
                }),
            );
            return webpackConfig;
        },
    },
};
