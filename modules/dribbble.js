/**
 *
 Created by lilikazine on 2017/9/22
 Sheng Li
 lilikazine@gmail.com
 Copyright © 2017 eking HNA. all rights reserved
 *
 **/

const express = require('express');
const superagent = require('superagent');
const cheerio = require('cheerio');
const app = express();
const asyncEvent = require('async');
const download = require('download');
const fsutils = require('./FSUtils');
const path = require('path');
const fs = require('fs');
const progressbar = require('./progress-bar');

let fetchItemUrls = (url) => {
    return new Promise((resolve, reject) => {
        superagent.get(url)
            .end((err, sres) => {
                if (err) {
                    reject(err.message);
                }
                if (!sres) {
                    reject('sres == undefined');
                }

                let html = sres.text;
                resolve((() => {
                    let urls = [];
                    let $ = cheerio.load(html);
                    let tag = '.dribbble-link';
                    $(tag).each((idx, ele) => {
                        let $element = $(ele);
                        let url = 'https://dribbble.com' + $element.attr('href');
                        urls.push(url);
                    });
                    return urls;
                })());

            })
    })
};

let fetchOriginUrls = (urls) => {
    urls = urls.filter((n) => {
        return n !== null;
    });
    return new Promise((resolve, reject) => {
        let action = (url, callback) => {
            superagent.get(url)
                .end((err, sres) => {
                    if (err) {
                        reject(err.message);
                    }
                    if (!sres) {
                        reject('sres == undefined');
                    }
                    let resUrl = null;
                    let html = sres.text;
                    let $ = cheerio.load(html);
                    if ($('.thumbs').hasClass('larger')) {
                        let tag = 'ul.thumbs li a';

                        $(tag).each((idx, ele) => {
                            let $element = $(ele);
                            resUrl = 'https://dribbble.com' + $element.attr('href');
                        });
                        callback(null, {'origin': resUrl});
                    } else {
                        let tag = '.single-img picture source';
                        let nameTag = '.single-img picture img';
                        let $element = $($(tag)[0]);
                        resUrl = $element.attr('srcset');
                        $element = $(nameTag);
                        let name = $element.attr('alt');

                        if (resUrl == undefined) {
                            let tag = '.single-img img';
                            resUrl = $(tag).attr('src');
                            name = $(tag).attr('alt');
                            callback(null, {'display': [name, resUrl]});
                        } else {
                            callback(null, {'display': [name, resUrl]});
                        }
                    }
                });

        };

        asyncEvent.mapLimit(urls, urls.length, (url, callback) => {
            action(url, callback);
        }, (err, res) => {
            if (err) {
                reject(err.message);
            }
            resolve(res);
        });

    })
};


let fetchAttachment = (attachmentUrls) => {
    let origin = [];
    let display = [];
    for (let item in attachmentUrls) {
        if (!attachmentUrls.hasOwnProperty(item)) {
            continue;
        }
        if (attachmentUrls[item].hasOwnProperty('origin')) {
            origin.push(attachmentUrls[item].origin);
        } else {
            let temp = {
                'url': attachmentUrls[item].display[1],
                'name': attachmentUrls[item].display[0]
            };
            display.push(temp);
        }
    }
    return new Promise((resolve, reject) => {
        let action = (url, callback) => {
            if (url) {
                superagent.get(url)
                    .end((err, sres) => {
                        if (err) {
                            reject(err.message);
                        }
                        let file = null;
                        let html = sres.text;
                        let $ = cheerio.load(html);
                        let tag = '#viewer-img img';
                        $(tag).each((idx, ele) => {
                            let $element = $(ele);
                            let url = $element.attr('src');
                            let name = $element.attr('alt');
                            file = {
                                'url': url,
                                'name': name
                            };
                        });
                        callback(null, file);

                    });
            } else {
                callback(null, null);
            }
        };

        asyncEvent.mapLimit(origin, origin.length, (url, callback) => {
            action(url, callback);
        }, (err, res) => {
            if (err) {
                reject(err.message);
            }
            resolve([res, display]);
        });
    })
};


async function beginFetchOnlyAttachment(url) {
    try {
        let urls = await fetchItemUrls(url);
        // console.log(urls);
        let attachmentUrls = await fetchOriginUrls(urls);
        // console.log(attachmentUrls);
        let files = await fetchAttachment(attachmentUrls);
        // console.log(files);

        let origin = files[0];
        let display = files[1];

        let originUrls = () => {
            let urls = [];
            origin.forEach((ele) => {
                urls.push(ele.url);
            });
            return urls;
        };

        let displayUrls = () => {
            let urls = [];
            display.forEach((ele) => {
                urls.push(ele.url);
            });
            return urls;
        };

        // Promise.all(originUrls().map(x => download(x, 'public/img/attachments'))).then(() => {
        //     console.log('files downloaded!');
        // });

        Promise.all(originUrls().map(item => {
            let i = item.lastIndexOf('/');
            let name = item.slice(i + 1);
            try {
                let filePath = path.resolve(__dirname, '..') + '/public/img/attachments/';
                if (fsutils.mkdirSync(filePath)) {
                    let stream = fs.createWriteStream(filePath+name);
                    stream.on('open', (fd) => {
                        let req = superagent.get(item);
                        req.pipe(stream);
                    });
                    stream.on('pipe', (write) => {
                        let size = 0;
                        let lastResponseTime = Date.now();
                        let fileSize = write.headers['content-length'];
                        let pb = new progressbar(name, 50);


                        let timerId = setInterval(() => {
                            if (size<=fileSize) {
                                pb.render({completed: size, total: fileSize});
                            }
                            if ((Date.now() - lastResponseTime) > 10 * 1000) {
                                throw Error(`download ${name} timeout!`);
                            }
                        }, 500);

                        write.on('data', (data) => {
                            size += data.length;
                            lastResponseTime = Date.now();
                        });

                        write.on('end', () => {
                            console.log(`${name} downloaded.`);
                            // 下载完成后清除interval
                            clearInterval(timerId);
                        });

                    });

                }

            } catch (e) {
                console.log(e.message);
            }
        })).then(() => {
            console.log('attachmentUrls downloaded!');
        })


    }
    catch (err) {
        console.error(err.message);
    }
}

async function beginFetchAll(url) {
    try {
        let urls = await fetchItemUrls(url);
        // console.log(urls);
        let attachmentUrls = await fetchOriginUrls(urls);
        // console.log(attachmentUrls);
        let files = await fetchAttachment(attachmentUrls);
        console.log(files);

        let origin = files[0];
        let display = files[1];

        let originUrls = () => {
            let urls = [];
            origin.forEach((ele) => {
                urls.push(ele.url);
            });
            return urls;
        };

        let displayUrls = () => {
            let urls = [];
            display.forEach((ele) => {
                urls.push(ele.url);
            });
            return urls;
        };

        Promise.all(displayUrls().map(x => download(x, 'public/img/capture'))).then(() => {
            console.log('capture downloaded!');
        });
        Promise.all(originUrls().map(x => download(x, 'public/img/attachmentUrls'))).then(() => {
            console.log('attachmentUrls downloaded!');
        });

    }
    catch (err) {
        console.error(err.message);
    }
}

let fetchAll = (url) => {

    beginFetchAll(url);
};

let fetchOnlyAttachment = (url) => {
    beginFetchOnlyAttachment(url);
};

fetchOnlyAttachment('https://dribbble.com/shots');


module.exports = {fetchOnlyAttachment, fetchAll};



