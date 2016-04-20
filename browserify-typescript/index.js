var gulp = require('gulp'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    tsify = require('tsify'),
    pretty = require('prettysize'),
    assign = require('lodash.merge'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    sourcemaps = require('gulp-sourcemaps'),
    gulpif = require('gulp-if'),
    lazypipe = require('lazypipe'),
    uglify = require('gulp-uglify');

var defaultOptions = {
  watch: false,
  src: ['./app/app.ts', './typings/main.d.ts'],
  outputPath: 'www/build/js/',
  outputFile: 'app.bundle.js',
  minify: false,
  browserifyOptions: {
    cache: {},
    packageCache: {},
    debug: true
  },
  watchifyOptions: {},
  tsifyOptions: {},
  uglifyOptions: {},
  onError: function(err){ console.error(err.toString()); },
  onLog: function(log){
    console.log((log = log.split(' '), log[0] = pretty(log[0]), log.join(' ')));
  }
}

module.exports = function(options) {
  var options = assign(defaultOptions, options);

  var noSourcemapPipe = lazypipe()
    .pipe(function(){ return gulpif(options.minify, uglify(options.uglifyOptions)) });

  var sourcemapPipe = lazypipe()
    .pipe(sourcemaps.init, { loadMaps: true })
      .pipe(function(){ return gulpif(options.minify, uglify(options.uglifyOptions)) })
    .pipe(sourcemaps.write, './');

  var b = browserify(options.src, options.browserifyOptions)
    .plugin(tsify, options.tsifyOptions);

  if (options.watch) {
    b = watchify(b, options.watchifyOptions);
    b.on('update', bundle);
    b.on('log', options.onLog);
  }

  return bundle();

  function bundle() {
    return b.bundle()
      .on('error', options.onError)
      .pipe(source(options.outputFile))
      .pipe(buffer())
      .pipe(gulpif(options.browserifyOptions.debug, sourcemapPipe()))
      .pipe(gulpif(!options.browserifyOptions.debug, noSourcemapPipe()))
      .pipe(gulp.dest(options.outputPath));
  }
}

