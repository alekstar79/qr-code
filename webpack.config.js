const path = require('path')

module.exports = {
  context: path.resolve(__dirname, 'src'),
  entry: {
    'qr-code': './qr-code.js',
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  devServer: {
    hot: true,
    allowedHosts: ['all'],
    static: {
      directory: './dist',
      watch: true
    }
  }
}
