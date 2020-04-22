const { series, src, dest } = require('gulp');

function copyLess(cb) {
  src('src/*.less')
    .pipe(dest('lib'))

  cb();
}

exports.default = series(copyLess);
