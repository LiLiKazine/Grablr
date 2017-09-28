/**
 *
 Created by lilikazine on 2017/9/21
 Sheng Li
 lilikazine@gmail.com
 Copyright © 2017 eking HNA. all rights reserved
 *
 **/

const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');

const dribbblr = require('./modules/dribbble');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function (req, res, next) {
    dribbblr.
    res.render('dribbble', {name:'hahaha'});
});

app.post('/', function (req, res, next) {
    console.log(req.body.url);
    res.render('dribbble', {name:'post'});
});


app.post('/process', function (req, res, next) {
    res.render('dribbble', {name: 'Wait for Result'});
});

app.use(function (err) {
    console.log(err.message);
});

app.listen(3000, function () {
    console.log('app is listening at port 3000');
});