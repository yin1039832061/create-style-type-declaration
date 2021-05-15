# create-style-type-declaration
## Supported style precompiled language

- scss: Almost all of them support
- less: Only normal syntax is supported, not advanced syntax and functions

## Use it
- Installation
`Node` >=8 is required for installation.

`Yarn`
```bash
yarn add create-style-type-declaration -D
```
`Npm`
```bash
  npm install create-style-type-declaration -D
```

- Configuration file

Create a new configuration file `cst.config.json` in the root directory of your project,like so:

```json
{
  "include": ["src/components", "src/pages"],//require，directory to traverse
  "exclude":["src/components/Header"],//optional，directory that need to be excluded
  "camelCase":true,//optional，default is false, when enabled, the "-" in the selector in scss will be humped in the type file
  "whileMaxCount":50//optional，default is 50，prevent the maximum number of executions of a while loop in SCSS
}
```

Add a line of configuration to the scripts of the package.json file, like so:

```json
"cst":"node ./node_modules/create-style-type-declaration" 
```
- Run
```bash
    yarn cst
    or
    npm run cst
```
## Why use it ？
In our project, we perform strict TSLint code format checks, including SCSS-style type declarations. And there may be cross-team project collaboration. So, in order to keep the code style consistent, we need to use it.
## issue
https://github.com/yin1039832061/create-style-type-declaration/issues