/**
 *
 Created by lilikazine on 2017/9/21
 Sheng Li
 lilikazine@gmail.com
 Copyright © 2017 eking HNA. all rights reserved
 *
 **/

const express = require('express');
const superagent = require('superagent');
const cheerio = require('cheerio');
const app = express();


app.get('/', function (req, res, next) {
    superagent.get('https://dribbble.com/shots/')
        .end(function (err, sres) {
            if (err) {
                return next(err);
            }

            let path = '.dribbble-link';

            let originUrls = fetchOriginUrl(path, sres.text);
            for (let idx in originUrls) {
                if (!originUrls.hasOwnProperty(idx)) {
                    continue;
                }
                superagent.get(originUrls[idx])
                    .end((err, sres) => {
                        if (err) {
                            return next(err);
                        }
                        let path = 'ul.thumbs li a';
                        let attachmentUrls = fetchAttachmentUrl(path, sres.text);
                        for (let idx in attachmentUrls) {
                            if (!attachmentUrls.hasOwnProperty(idx)) {
                                continue;
                            }
                            superagent.get(attachmentUrls[idx])
                                .end((err, sres) => {
                                    if (err) {
                                        return next(err);
                                    }
                                    let path = '#viewer-img img';

                                    let props = fetchAttachment(path, sres.text);
                                    console.log(props);
                                })
                        }
                    })
            }
        });
});

let fetchAttachment = function (path, html) {
    let files = [];

    let $ = cheerio.load(html);
    $(path).each((i, ele) => {
        $element = $(ele);
        let url = $element.attr('src');
        let name = $element.attr('alt');
        files.push({
            'url': url,
            'name': name
        });
    });
    return files;
};

let fetchAttachmentUrl = function (path, html) {
    let attachmentUrls = [];
    let $ = cheerio.load(html);

    $(path).each((i, ele) => {
        let $element = $(ele);
        let url = 'https://dribbble.com' + $element.attr('href');
        attachmentUrls.push(url);
    });
    return attachmentUrls;
};


let fetchOriginUrl = function (path, html) {
    let urls = [];
    let $ = cheerio.load(html);
    $(path).each((idx, ele) => {
        let $element = $(ele);
        let url = 'https://dribbble.com' + $element.attr('href');
        urls.push(url);
    });
    return urls;
};

app.use(function (err) {
    console.log(err.message);
});

app.listen(3000, function () {
    console.log('app is listening at port 3000');
});