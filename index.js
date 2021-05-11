const postcss = require('postcss');
const path = require('path');
const fs = require('fs');
const colors = require('colors');
const postcssScss = require('postcss-scss');
const { readFile, getFileType, replaceAll, dashToCamelcase } = require('./src/utils')
const fsPromise = require('fs').promises
const configFile = 'cst.config.json'
let exclude;
let camelCase;
let whileMaxCount;
(async function main() {
    const rootPath = process.cwd();
    //读配置文件
    let config = await getConfig(rootPath);
    const include = Array.isArray(config.include) ? config.include : [];
    exclude = Array.isArray(config.exclude) ? config.exclude : [];
    camelCase = config.camelCase || false;
    whileMaxCount = config.whileMaxCount || 50;
    exclude = exclude.map(item => path.resolve(rootPath, item))
    if (include.length > 0) {
        include.map(item => {
            let includePath = path.resolve(rootPath, item);
            //遍历配置文件夹
            readDir(includePath)
        })
    }
})()
async function getConfig(root) {
    const res = await readFile(path.resolve(root, configFile));
    let obj;
    if (res) {
        try {
            obj = JSON.parse(res)
        } catch (err) {
            console.log(`[error]${colors.red(configFile + '\'content must be a json')}`)
        }
    }
    return obj;
}
function readDir(dirName) {
    fsPromise.readdir(dirName)
        .then(res => {
            if (Array.isArray(res) && res.length > 0) {
                res.map(async item => {
                    let curPath = path.resolve(dirName, item);
                    if (exclude.includes(curPath)) {
                        return;
                    }
                    const fileType = await getFileType(curPath);
                    if (fileType.isDirectory) {
                        readDir(curPath)
                    } else if (fileType.isFile) {
                        let reg = /^.*\.(?:less|scss)$/i
                        if (reg.test(curPath)) {
                            //读文件样式内容
                            readStyleFile(curPath)
                        }
                    } else {
                        return;
                    }
                })
            }
        })
        .catch(err => {
            console.log(`[error]${colors.red(err)}`)
        })
}
async function readStyleFile(filePath) {
    const fileContent = await readFile(filePath);
    let type;
    if (/^.*\.(?:less)$/i.test(filePath))
        type = 'less'
    else if (/^.*\.(?:scss)$/i.test(filePath))
        type = 'scss'
    //提取样式文件中所有选择器
    const selectorArr = getSelector(fileContent, type);
    let writeContent = "";
    selectorArr.map(item => {
        let selectorName = item.indexOf('.') === 0 ? item.substring(1) : item;
        if (camelCase) {
            selectorName = dashToCamelcase(selectorName)
        }
        writeContent += `export const ${selectorName}:string;\n`
    })
    fs.writeFile(`${filePath}.d.ts`, writeContent, (err) => {
        if (!err) {
            let msg = `🌟 success:${filePath}样式类型声明文件创建成功`
            console.log(`[info]${colors.green(msg)}`)
        } else {
            throw Error(`Write Decoration File Error : ${itemFileName}.d.ts`)
        }
    })
}
function getSelector(content, fileType) {
    let cssAst;
    //生成css抽象语法树
    if (fileType === 'scss') {
        cssAst = postcssScss.parse(content)
    } else
        cssAst = postcss.parse(content);
    if (cssAst.type === 'root') {
        const nodes = cssAst.nodes;
        //递归样式文件ast
        let result = recursionAst(nodes)
        const set = new Set()
        result.map(item => {
            let arr = item.match(/\.([^\s\>\:\.]*)/g)
            if (arr) {
                arr.map(i => set.add(i))
            }
        })
        return [...set]
    }
}
function recursionAst(nodes) {
    let result = [];
    Array.isArray(nodes) && nodes.map(item => {
        //排除全局样式覆盖选择器
        if ((item.type === "rule" || item.type === "atrule") && item.selector !== ":global") {
            const variableArr = item.type !== 'atrule' && item.selector.match(/(\$[^\}]*)/g);
            if (Array.isArray(variableArr) && variableArr.length > 0) {
                switch (item.parent.name) {
                    case "for":
                        let forStatement = item.parent.params;
                        const token = forStatement.match(/([^\s]*)/g).filter(_ => _ !== "")
                        if (token.includes('to')) {
                            for (let i = +token[2]; i < +token[token.length]; i++) {
                                const clsName = item.selector.replace(`#{${token[0]}}`, i)
                                result.push(clsName)
                            }
                        } else if (token.includes('through')) {
                            for (let i = +token[2]; i <= +token[token.length - 1]; i++) {
                                const clsName = item.selector.replace(`#{${token[0]}}`, i)
                                result.push(clsName)
                            }
                        }
                        break;
                    case 'while':
                        try {
                            let whileCondition = item.parent.params;
                            const whileStatementRule = item.parent.nodes.filter(item => item.type === 'decl' && item.parent.params === whileCondition)
                            let temp = [];
                            let varKv = {};//临时对象，存储while语句用到的所有变量
                            let runWhileStr = "";
                            whileStatementRule.forEach(_ => {
                                temp.push(_.prop)
                                let arr = _.value.match(/(\$[^\)\+\*\/\-\s\(]*)/g)
                                temp = temp.concat(arr)
                                runWhileStr += `${_.prop}=${_.value};`
                            })
                            runWhileStr = replaceAll('$', 'varKv.$', runWhileStr)
                            temp = [...new Set(temp)]
                            temp.map(_item => {
                                varKv[_item] = getVal(item.parent.parent, _item)
                            })
                            let count = 0;//while循环计数器，防止死循环
                            while (eval(replaceAll('$', 'varKv.$', whileCondition))) {
                                count += 1;
                                if (count > whileMaxCount) {
                                    throw Error(`while condition run times over ${whileMaxCount}`)
                                }
                                temp.forEach(__item => {
                                    if (item.selector.indexOf(__item) > 0) {
                                        result.push(replaceAll(`#{${__item}}`, varKv[__item], item.selector))
                                    }
                                });
                                eval(runWhileStr)
                            }
                        } catch (err) {
                            console.log(`[error]${colors.red(err)}`)
                        }
                        break;
                    case 'each':
                        let eachStatement = item.parent.params;
                        let eachStatementArr = eachStatement.split('in');
                        if (eachStatementArr.length === 2) {
                            let eachVarArrStr = eachStatementArr[0].trim();
                            let eachValArrStr = eachStatementArr[1].trim();
                            const eachVarArr = eachVarArrStr.split(',');
                            const eachVarInd = eachVarArr.indexOf(variableArr[0]);
                            if (eachValArrStr.indexOf('(') > -1 && eachValArrStr.indexOf(')') > 1) {
                                eachValArrStr = eachValArrStr.replace(/[\s|\n]/g, "")
                                const eachValArr = eachValArrStr.match(/\(([^\)]*)\)/g)
                                let tempArr = eachValArr[eachVarInd].replace(/[\(|\)]/g, '').split(',');
                                tempArr.map(_ => {
                                    const clsName = item.selector.replace(`#{${variableArr[0]}}`, _.trim())
                                    result.push(clsName)
                                })
                            } else {
                                const eachValArr = eachValArrStr.split(',');
                                eachValArr.forEach(_ => {
                                    const clsName = item.selector.replace(`#{${variableArr[0]}}`, _.trim())
                                    result.push(clsName)
                                })
                            }
                        }
                        break;
                    default:
                        (function getVariableVal(arr, cur, key) {
                            let flag = arr.filter((it) => it.type === "decl" && it.prop === key);
                            if (Array.isArray(flag) && flag.length > 0) {
                                let selector = item.selector.replace(/\#\{([^\s\>]*)\}/g, flag[flag.length - 1].value)
                                selector && result.push(selector)
                            } else {
                                if (cur.parent) {
                                    getVariableVal(cur.parent.nodes, cur.parent, key)
                                } else {
                                    throw Error(`Reference Error : ${key} is not defined                            `)
                                }
                            }
                        })(nodes, item, variableArr[0])
                        break;
                }
            } else if (item.selector && item.selector.charAt(0) === "&" && item.parent.selector) {
                result.push(item.selector.replace("&", item.parent.selector))
            } else {
                item.selector && result.push(item.selector)
            }
            let arr = Array.isArray(item.nodes) && item.nodes.filter(it => ((it.type === 'rule' || it.type === 'atrule') && it.selector !== ':global'))
            result = [...result, ...recursionAst(arr)]
        }
    })
    return result;
}
function getVal(node, val) {
    let arr = Array.isArray(node.nodes) && node.nodes.filter(item => item.type === "decl" && item.prop === val)
    if (arr && arr.length > 0) {
        return arr[0].value
    } else {
        if (node.parent) {
            return getVal(node.parent)
        } else {
            return undefined;
        }
    }
}
