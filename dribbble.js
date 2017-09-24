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
const fs = require('fs');


let fetchItemUrls = (url) => {
    return new Promise((resolve, reject) => {
        superagent.get(url)
            .end((err, sres) => {
                if (err) {
                    reject(err.message);
                }
                let html = sres.text;
                resolve((() => {
                    let urls = [];
                    let $ = cheerio.load(html);
                    let path = '.dribbble-link';
                    $(path).each((idx, ele) => {
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
                    let resUrl = null;
                    let html = sres.text;
                    let $ = cheerio.load(html);
                    if ($('.thumbs').hasClass('larger')) {
                        let path = 'ul.thumbs li a';

                        $(path).each((idx, ele) => {
                            let $element = $(ele);
                            resUrl = 'https://dribbble.com' + $element.attr('href');
                        });
                        callback(null, {'origin': resUrl});
                    } else {
                        let path = '.single-img picture source';
                        let namePath = '.single-img picture img';
                        let $element = $($(path)[0]);
                        resUrl = $element.attr('srcset');
                        $element = $(namePath);
                        let name = $element.attr('alt');

                        if (resUrl == undefined) {
                            let path = '.single-img img';
                            resUrl = $(path).attr('src');
                            name = $(path).attr('alt');
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
        }else {
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
                        let path = '#viewer-img img';
                        $(path).each((idx, ele) => {
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
            }else {
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

(async () => {
    try {
        let urls = await fetchItemUrls('https://dribbble.com/ueno');
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

        Promise.all(displayUrls().map(x => download(x, 'dist'))).then(() => {
            console.log('files downloaded!');
        });

    }
    catch (err) {
        console.error(err.message);
    }
})();


