var gulp = require('gulp');

var files = ['index.js', 'test/*.js', 'gulpfile.js'];

gulp.task('lint', function () {
    var eslint = require('gulp-eslint');
    return gulp.src(files)
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

// Since tests use mock-fs, we can't lint and test in parallel
gulp.task('test', ['lint'], function () {
    var mocha = require('gulp-mocha');
    return gulp.src('test/*.js', { read: false })
        .pipe(mocha());
});

gulp.task('default', ['test']);

gulp.task('watch', function () {
    gulp.watch(files, ['test']);
});
