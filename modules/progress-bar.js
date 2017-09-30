/**
 *
 Created by lilikazine on 2017/9/30
 Sheng Li
 lilikazine@gmail.com
 Copyright © 2017 eking HNA. all rights reserved
 *
 **/

const slog = require('single-line-log').stdout;

function progressbar (description, bar_length) {
    this.description = description || 'Progress';
    this.length = bar_length || 25;

    this.render = (opts) => {
        let percent = (opts.completed / opts.total).toFixed(4);
        let cell_num = Math.floor(percent * this.length);

        let cell = '';
        for (let i = 0; i < cell_num; i++) {
            cell += '█';
        }

        let empty = '';
        for (let i = 0; i < this.length - cell_num; i++) {
            empty += '░';
        }

        let cmdText = this.description + ': ' + (100 * percent).toFixed(2) + '% ' + cell + empty + ' ' + opts.completed + '/' + opts.total;
        console.log(cmdText);
    };
}

module.exports = progressbar;

