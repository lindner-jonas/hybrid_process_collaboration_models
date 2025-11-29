const CopyWebpackPlugin = require('copy-webpack-plugin');
const { DefinePlugin } = require('webpack');


module.exports = (env, argv) => {

  const mode = argv.mode || 'development';

  const devtool = mode === 'development' ? 'eval-source-map' : 'source-map';

  return {
    mode,
    entry: {
      viewer: './example/src/viewer.js',
      modeler: './example/src/modeler.js'
    },
    output: {
      filename: 'dist/[name].js',
      path: __dirname + '/example'
    },
    module: {
      rules: [
        {
          test: /\.bpmn$/,
          type: 'asset/source'
        }
      ]
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: './assets', to: 'dist/vendor/bpmn-js-token-simulation/assets' },
          { from: 'bpmn-js/dist/assets', context: 'node_modules', to: 'dist/vendor/bpmn-js/assets' },
          { from: '@bpmn-io/properties-panel/dist/assets', context: 'node_modules', to: 'dist/vendor/bpmn-js-properties-panel/assets' }
        ]
      }),
      new DefinePlugin({
        'process.env.TOKEN_SIMULATION_VERSION': JSON.stringify(require('./package.json').version),
        'process.env.BACKEND_URL': JSON.stringify(process.env.BACKEND_URL || 'http://localhost:8000')
      })
    ],
    devtool,
    resolve: {
      fallback: {
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        net: require.resolve('net-browserify'),
        'tls': false,
        "net": false,
        "url": false,
        "assert": require.resolve("assert"),
        util: require.resolve("util/"),
        "child_process": false,
        "fs": false,
        "os": false,
        "path": false,
        "crypto": false,
        "zlib": false,
        "stream": false,
      }
    }
  };

};