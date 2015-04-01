var argv = require('minimist')(process.argv.slice(2));
var concat = require('gulp-concat');
var gulp = require('gulp');
var gulpif = require('gulp-if');
var scsslint = require('gulp-scss-lint');

// Is the current build running on travis?
var onTravis = !!process.env.TRAVIS;

// The paths
var paths = {
  src: {
    scss: 'src/css/cs/**/*.scss',
    js: './src/js/cs/main.js'
  },
  dist: {
    main: 'dist',
    images: 'dist/uc_images'
  }
}

// The file names
var names = {
  dist: {
    css: 'sis_cs.css',
    js: 'sis_cs.js'
  }
}

/**
 * CSS Task
 *  - autoprefix
 *  - contact
 *  - sassify
 */
gulp.task('css', function() {
  // Automatically add browser prefixes (e.g. -webkit) when necessary
  var autoprefixer = require('gulp-autoprefixer');
  // Convert the .scss files into .css
  var sass = require('gulp-sass');

  return gulp.src(paths.src.scss)
    .pipe(sass())
    .pipe(autoprefixer({
      cascade: false
    }))
    // Combine the files
    .pipe(concat(names.dist.css))
    // Output to the correct directory
    .pipe(gulp.dest(paths.dist.main));
});

/**
 * Run the CSS Linter on the CSS files
 */
gulp.task('css-lint', function() {
  return gulp.src(paths.src.scss)
    .pipe(scsslint())
    // Only fail the build when running on Travis
    .pipe(gulpif(onTravis, scsslint.failReporter()));
});

// Setup the JavaScript task
var gutil = require('gulp-util');
var browserify = require('browserify');
var watchify = require('watchify');
var bundler = browserify({
  entries: paths.src.js,
  transform: 'brfs'
});

// Only watch when needed
if (argv.watch) {
  var watcher  = watchify(bundler);
  watcher.on('update', bundleJs);
  watcher.on('log', gutil.log);
}

/**
 * Bundle the JavaScript
 */
function bundleJs() {
  var source = require('vinyl-source-stream');

  return bundler.bundle()
    // Log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    // Name the output file
    .pipe(source(names.dist.js))
    // Output to the correct directory
    .pipe(gulp.dest(paths.dist.main));
};

gulp.task('js', bundleJs);

/**
 * Build Clean task
 * Remove all the files generated by the build
 */
gulp.task('build-clean', function(callback) {
  var del = require('del');
  del(
    [
      paths.dist.main
    ], callback);
});

gulp.task('lint', ['css-lint']);

gulp.task('build', ['css', 'js']);

if (argv.watch) {
  gulp.watch(paths.src.scss, ['css']);
}

gulp.task('default', ['build-clean', 'build', 'lint']);
