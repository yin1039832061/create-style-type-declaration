
const fs = require('fs')
const readFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (!err) {
                resolve(data.toString())
            } else {
                reject(`Read File Error: ${filePath}`)
            }
        })
    }).catch(err => {
        console.log(`[error]${colors.red(err)}`)
    })
}
const getFileType = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.stat(filePath, (err, stats) => {
            if (err) {
                reject(`get file type error :${filePath}`)
            } else {
                if (stats.isDirectory()) {
                    resolve({ isDirectory: true })
                } else if (stats.isFile()) {
                    resolve({ isFile: true })
                } else {
                    resolve(null)
                }
            }
        })
    }).catch(err => {
        console.log(`[error]${colors.red(err)}`)
    })
}
const readdir = dirName => {
    return new Promise((resolve, reject) => {
        fs.readdir(dirName, (err, data) => {
            if (err) reject(err)
            else
                resolve(data)
        })
    }).catch(err => {
        console.log(`[error]${colors.red(err)}`)
    })
}
const replaceAll = function (find, replace, str) {
    var find = find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return str.replace(new RegExp(find, 'g'), replace);
}
const dashToCamelcase = (str) => {
    let len = str.length;
    let result = "";
    for (let i = 0; i < len; i++) {
        if (str.charAt(i) === "-") {
            result += (str.charAt(i + 1)).toUpperCase()
            i++;
        } else {
            result += str.charAt(i)
        }
    }
    return result;
}
module.exports = {
    readFile,
    getFileType,
    replaceAll,
    dashToCamelcase,
    readdir,
}