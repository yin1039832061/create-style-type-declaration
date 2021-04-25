# create-style-type-declaration

## 背景

在我们的项目中，执行严格的 tslint 代码格式检查，包括 scss 样式的类型声明。业务繁忙时，编写 scss 样式的类型声明文件是一件枯燥地、费时地、无技术含量的事情。所以，是否我们能够自动生成类型文件？

## 是否是必要的？

在我们的项目中，可能会出现跨团队的项目合作。而我们的项目大部分都会编写类型声明文件，为了保持代码风格一致，所以我们是需要的。

## 支持的预编译语言

- scss:基本都支持
- less:普通语法、不支持高级语法和函数

## 使用

- 安装

```bash
   npm install create-style-type -D
   or
   yarn add create-style-type -D
```

- 配置文件

在项目根目录下新建 cst.config.json 文件，文件内容如下：

```json
{
  "include": ["src/components", "src/pages"],//必填项，需要遍历的文件夹
  "exclude":["src/components/Header"],//可选项，需要排除的文件夹
  "camelCase":true,//可选项，默认为false，开启之后scss中选择器中的“-”在类型文件中将会转为驼峰
  "whileMaxCount":50//可选项，默认为50，防止scss中while死循环的最大执行次数
}
```
- 运行

package.json 文件的scripts中增加一行配置，如下：
```json
"cst":"node ./node_modules/create-style-type/index.js " 
```
可以通过执行
```bash
    yarn cst
    or
    npm run cst
```
生成类型声明文件