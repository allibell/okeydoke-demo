const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            webpackConfig.experiments = {
                asyncWebAssembly: true,
            };

            const wasmExtensionRegExp = /\.wasm$/;
            webpackConfig.module.rules.forEach((rule) => {
                (rule.oneOf || []).forEach((oneOf) => {
                    if (oneOf.type === "asset/resource") {
                        oneOf.exclude.push(wasmExtensionRegExp);
                    }
                });
            });

            webpackConfig.resolve.fallback = { 
                buffer: require.resolve('buffer/'),
                crypto: require.resolve("crypto-browserify"),
                path: require.resolve("path-browserify"),
                stream: require.resolve("stream-browserify"),
                util: require.resolve("util/"),
            };
            webpackConfig.plugins = [
                new webpack.ProvidePlugin({
                    Buffer: ['buffer', 'Buffer'],
                    process: 'process/browser.js',
                }),
                new MiniCssExtractPlugin(),
                new HtmlWebpackPlugin({ template: './public/index.html' }),
            ];
            return webpackConfig;
        },
    },
};
