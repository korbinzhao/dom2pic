const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
  },
  entry: {
    demo: './demo/index.tsx',
    index: './src/index.ts'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
          }
          // // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
          // {loader: 'awesome-typescript-loader'},
        ],

      },
      {
        test: /\.html$/,
        use: [{
          loader: "html-loader",
          options: {
            minimize: true
          }
        }]
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.less$/,
        exclude: '/node_modules',
        use: [{
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: (loader) => [
                require('postcss-import')({
                  root: loader.resourcePath
                }),
                require('postcss-cssnext')(),
                require('autoprefixer')(),
                require('cssnano')()
              ]
            }
          },
          {
            loader: 'less-loader',
            options: {
              importLoaders: 1
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      template: "./demo/index.html",
      filename: "./index.html",
      chunks: ['demo']
    })
  ],
  devServer: {
    hot: true
  }
};