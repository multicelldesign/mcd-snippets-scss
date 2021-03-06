// Include Gulp
var gulp = require('gulp');

// Include gulp- plugins from package.json
var plugins = require('gulp-load-plugins')();

// plugin vars
var del         = require('del'),
    q           = require('q'),
    path        = require('path'),
    fs          = require('fs'),
    browserSync = require('browser-sync'),
    reload      = browserSync.reload;
    sassdoc     = require('sassdoc');

// folder vars
var dest        = './dist';
var src         = './src';
var bootstrapPath   = './bower_components/bootstrap-sass/assets';


// Include Bootstrap files
// 1. Amend _bootstrap.scss to use the copied version of _variables.scss
// 2. Amend _bootstrap.scss to use on what's needed
// =============================================================================
gulp.task('bootstrap', ['bootstrapJS'], function () {
    return gulp.src([
        bootstrapPath + '/stylesheets/bootstrap/_variables.scss',
        bootstrapPath + '/stylesheets/_bootstrap.scss'
    ])
    .pipe(gulp.dest(src + '/scss/third-party'))
    .pipe(plugins.notify({
        message: 'Bootstrap done', onLast: true
    }));
});


// Compile & Minify CSS from Sass files
// =============================================================================
gulp.task('css', function () {

    var onError = function (err) {
        plugins.notify.onError({
            title: "Gulp",
            subtitle: "Failure!",
            message: "Error: <%= error.message %>",
            sound: "Beep"
        })(err);

        this.emit('end');
    };

    return gulp.src(src + '/scss/**/*.scss')
    .pipe(plugins.plumber({
        errorHandler: onError
    }))
    .pipe(plugins.sourcemaps.init())
    .pipe(plugins.sass({
        includePaths: [bootstrapPath + '/stylesheets']
    }))
    .pipe(plugins.autoprefixer({
        // Add versions according to project's browser support matrix
        // See: https://github.com/ai/browserslist#queries
        browsers: [
            'ie 8',
            'ie 9',
            'Firefox >= 33',
            'Chrome >= 18',     // Because not so awesome Awesomium
            'Android >= 2.1'
        ]
    }))
    .pipe(gulp.dest(dest + '/css'))
    .pipe(plugins.cssnano())
    .pipe(plugins.rename({
        suffix: '.min'
    }))
    .pipe(plugins.sourcemaps.write('maps'))
    .pipe(gulp.dest(dest + '/css'))
    .pipe(plugins.notify({
        message: 'CSS task complete', onLast: true
    }));
});


// Concatenate & Minify JS
// =============================================================================
gulp.task('js', function () {
    return gulp.src(src + '/js/*.js')
    .pipe(plugins.concat('app.js'))
    .pipe(plugins.rename({
        suffix: '.min'
    }))
    .pipe(plugins.uglify())
    .pipe(gulp.dest(dest + '/js'))
    .pipe(plugins.notify({
        message: 'JS task complete', onLast: true
    }));
});


// Concatenate & Minify Bootstrap JS
// bootstrap-popover.js has to be after bootstrap-tooltip.js
// Only use what's needed
// =============================================================================
gulp.task('bootstrapJS', function () {
    return gulp.src([
        // bootstrapPath + '/javascripts/bootstrap.js'
        bootstrapPath + '/javascripts/bootstrap/transition.js',
        bootstrapPath + '/javascripts/bootstrap/alert.js',
        bootstrapPath + '/javascripts/bootstrap/button.js',
        bootstrapPath + '/javascripts/bootstrap/carousel.js',
        bootstrapPath + '/javascripts/bootstrap/collapse.js',
        bootstrapPath + '/javascripts/bootstrap/dropdown.js',
        bootstrapPath + '/javascripts/bootstrap/modal.js',
        bootstrapPath + '/javascripts/bootstrap/tooltip.js',
        bootstrapPath + '/javascripts/bootstrap/popover.js',
        bootstrapPath + '/javascripts/bootstrap/scrollspy.js',
        bootstrapPath + '/javascripts/bootstrap/tab.js',
        bootstrapPath + '/javascripts/bootstrap/affix.js'
    ])
    .pipe(plugins.concat('bootstrap.js'))
    .pipe(gulp.dest(dest + '/js'))
    .pipe(plugins.rename({
        suffix: '.min'
    }))
    .pipe(plugins.uglify())
    .pipe(gulp.dest(dest + '/js'))
    .pipe(plugins.notify({
        message: 'Bootstrap JS task complete', onLast: true
    }));
});


// Copy JS libraries to dist folder
// =============================================================================
gulp.task('jsLibs', function () {
    return gulp.src(src + '/js/libs/**/*.js', {
        base: 'src'
    })
    .pipe(gulp.dest(dest))
    .pipe(plugins.notify({
        message: 'JS libraries copied to dist', onLast: true
    }));
});


// SVG tasks
// =============================================================================
gulp.task('svg', function() {
    return gulp.src(src + '/svg/*.svg')
    .pipe(plugins.svgmin())
    .pipe(gulp.dest(dest + '/svg'))
    .pipe(plugins.notify({
        message: 'svg task complete', onLast: true
    }));
});


gulp.task('svg2png', ['svg'], function() {
    return gulp.src(src + '/svg/*.svg')
    .pipe(plugins.svg2png())
    .pipe(gulp.dest(dest + '/img'))
    .pipe(plugins.notify({
        message: 'svg2png task complete', onLast: true
    }));
});


// Optimise images (once)
// =============================================================================
gulp.task('images', function() {
    return gulp.src(src + '/img/**/*.*')
    .pipe(plugins.cache(plugins.imagemin({
        optimizationLevel: 5,
        progressive: true,
        interlaced: true
    })))
    .pipe(gulp.dest(dest + '/img'))
    .pipe(plugins.notify({
        message: 'Images task complete', onLast: true
    }));
});


// Update the browser automagically
// =============================================================================
gulp.task('serve', ['watch'], function () {
    browserSync.init({
        server: {
            baseDir: "./"
        }
    });

    gulp.watch('*.html').on('change', reload);
    gulp.watch(dest + '/css/**/*.css').on('change', reload);
});

// Watch for changes in files
gulp.task('watch', function () {
    gulp.watch(src + '/scss/**/*.scss', ['css']);
    gulp.watch(src + '/js/*.js', ['js']);
    gulp.watch(src + '/js/libs/*.js', ['jsLibs']);
    gulp.watch(src + '/svg/*.svg', ['svg2png']);
    gulp.watch(src + '/img/*.*', ['images']);
});


// Copy local fonts to dist folder
// =============================================================================
gulp.task('fonts', function () {
    return gulp.src(src + '/fonts/*.*', {
        base: 'src'
    })
    .pipe(gulp.dest(dest))
    .pipe(plugins.notify({
        message: 'fonts copied to dist', onLast: true
    }));
});


// Clean
// =============================================================================
gulp.task('clean', function(cb) {
    del(['dist'], cb);
});


// Sassdoc see: http://sassdoc.com
// Documents SCSS variables, functions & mixins
// =============================================================================
gulp.task('docs', function () {
    return gulp.src(src + '/scss/**/*.scss')
    .pipe(sassdoc())
    .pipe(plugins.notify({
        message: 'Documentation updated', onLast: true
    }));
});


// Default Task
// =============================================================================
gulp.task('default', function() {
    gulp.start('bootstrap', 'css', 'js', 'jsLibs', 'images', 'svg2png', 'fonts', 'docs', 'serve');
});
