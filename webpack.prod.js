const nodeExternals = require("webpack-node-externals");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// module.exports = merge(common, {
//   mode: "production",
// });

// const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: { app: "./src/index.js" },
  externalsPresets: { node: true },
  context: __dirname,

  externals: [nodeExternals()],
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "index.js",
    clean: true,
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [{ from: "package.json" }, { from: "package-lock.json" }, { from: `.env` }],
    }),
    // new webpack.DefinePlugin({
    //   "process.env.APP_ENV": JSON.stringify(env.APP_ENV),
    // }),
  ],
  node: {
    __dirname: true,
  },
  resolve: {
    extensions: [".ts", ".js", ".json"],
  },

  // output: {
  //   // filename: "[name].bundling.js",
  //   filename: "[name].test.js",
  //   path: path.resolve(__dirname, "dist"),
  //   clean: true,
  // },
  target: "node",
  mode: "production",
};
