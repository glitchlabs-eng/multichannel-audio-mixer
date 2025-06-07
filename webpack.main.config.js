const path = require('path');

module.exports = {
  mode: 'development',
  entry: './electron/main.ts',
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@electron': path.resolve(__dirname, 'electron'),
    },
  },
  output: {
    path: path.resolve(__dirname, 'dist/electron'),
    filename: 'main.js',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};
