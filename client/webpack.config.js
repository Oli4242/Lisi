const path = require('path')
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WebpackShellPlugin = require('webpack-shell-plugin')

module.exports = (env, argv) => {
  const config = {
    context: path.resolve(__dirname),

    entry: {
      browser_action: './src/browser_action.js',
    },

    // bugs when development mode (I guess it comes from devtool defaulted to 'eval')
    // anyway, no need to optimize or anything, it's just a brwoser extension
    mode: 'none',

    optimization: {
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendor',
            chunks: 'all'
          }
        }
      }
    },

    plugins: [
      new CleanWebpackPlugin(['dist/*'], {
        // dry: true,
        verbose: true
      }),
      new CopyWebpackPlugin([
        { context: 'src', from: '**/!(*.js|template.html)' }
      ]),
      new HtmlWebpackPlugin({
        template: 'src/template.html',
        filename: 'browser_action.html',
        // chunks: ['browser_action'],
      }),
      argv.watch && new WebpackShellPlugin({
        onBuildEnd: ['web-ext run -s dist'],
        dev: true // run only once
      }),
    ]
  }

  // clean the eventual `false` plugins caused by conditions
  config.plugins = config.plugins.filter(plugin => !!plugin)

  return config
}
