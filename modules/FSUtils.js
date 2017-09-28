/**
 *
 Created by lilikazine on 2017/9/28
 Sheng Li
 lilikazine@gmail.com
 Copyright © 2017 eking HNA. all rights reserved
 *
 **/

const fs = require('fs');
const path = require('path');

let fsExistsSync = (filePath) => {
    try {
        fs.accessSync(filePath, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
};

let fsExistsAsync = (filePath, callback) => {
    fs.access(filePath, (err) => {
        if (err) {
            callback(err);
        }
    });
};

let mkdirAsync = (filePath, callback) => {
    if (fsExistsSync(filePath)) {
        callback();
    } else {
        mkdirAsync(path.dirname(filePath, () => {
            fs.mkdir(filePath, callback);
        }));
    }
};

let mkdirSync = (filePath) => {
    if (fsExistsSync(filePath)) {
        return true;
    } else {
        if (mkdirSync(path.dirname(filePath))) {
            fs.mkdirSync(filePath);
            return true;
        }
    }
};

let FSUtils = {};
FSUtils.fsExistsSync = fsExistsSync;
FSUtils.fsExistsAsync = fsExistsAsync;
FSUtils.mkdirAsync = mkdirAsync;
FSUtils.mkdirSync = mkdirSync;
module.exports = FSUtils;


