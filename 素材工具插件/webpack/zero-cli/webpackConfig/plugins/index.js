const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const dlls = require('./dlls')
const { paths: { publicPath, distPath }, projectConfig } = require('../../utils')

const { projectVersion } = projectConfig

module.exports = [
  new webpack.ProgressPlugin(), // 进度条 命令行 --progress
  new CleanWebpackPlugin(), // 根据output.path去清空
  new CopyWebpackPlugin([{
    from: `${publicPath}/!(dll)/**/*.*`, // 项目根目录 public下 一级目录除dll目录(dll会通过AddAssetHtmlPlugin拷贝) 会被当做静态资源
    to: `${distPath}/${projectVersion}/static`,
    transformPath(targetPath, absolutePath) { // 修改写入路径 去掉 public
      return targetPath.replace(/^(.+)public\/(.+)$/, '$1$2')
    },
    ignore: ['.*'] // 忽略 如 .gitkeep
  }]),
  new HtmlWebpackPlugin({
    // inject: false, // 不注入依赖
    template: `${publicPath}/index.html`, // 以一个模板文件为基础 动态生成html会注入一些资源
    minify: {
      removeComments: true, // 去除注释
      collapseWhitespace: true, // 去除空格
      removeAttributeQuotes: true, // 去除标签属性值的双引号
    },
    templateParameters: projectConfig, // ejs模板参数
  }),
  ...dlls,
  // new webpack.ProvidePlugin({ // 相当于为每个模块都 import
  //   $: 'jquery',
  //   jQuery: 'jquery',
  // }),
  // new webpack.DefinePlugin({ // webpack内置的定义环境变量插件 注意'规则转义'
  //   bol: 'true', // true
  //   str: JSON.stringify('string') // 'string' 
  // }),
  // 针对一些库的语言包 如moment element-ui antd 可忽略
  // 只有在上下文 moment 库中 import|require 的/^\.\/locale$/ （看源码得知） 都将被忽略来达到 减小包体积的目的
  // 需要使用的语言包 直接在项目中 手动import (不在上下文中 不会被忽略)
  new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  // import moment from 'moment'
  // import 'moment/locale/zh-cn'
  // moment.locale('zh-cn')
]