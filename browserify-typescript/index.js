var gulp = require('gulp'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    tsify = require('tsify'),
    pretty = require('prettysize'),
    assign = require('lodash.merge'),
    source = require('vinyl-source-stream'),
    buffer = require('vinyl-buffer'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify')
    babelify = require('babelify'),
    stream = require('stream');

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
  onError: function(err){
    console.error(err.toString());
  },
  onLog: function(log){
    console.log((log = log.split(' '), log[0] = pretty(log[0]), log.join(' ')));
  }
}

module.exports = function(options) {
  var options = assign(defaultOptions, options);

  var b = browserify(options.src, options.browserifyOptions)
    .plugin(tsify, options.tsifyOptions)
    .transform(babelify.configure({
      extensions: ['.js', '.ts', '.json'],
      presets: ['es2015'],
      plugins: [['transform-runtime', {
        'polyfill': false,
        'regenerator': true
      }], 'syntax-async-generators', 'transform-regenerator'],
  }));
;

  if (options.watch) {
    b = watchify(b, options.watchifyOptions);
    b.on('update', bundle);
    b.on('log', options.onLog);
  }

  return bundle();

  function bundle() {
    var debug = options.browserifyOptions.debug;
    return b.bundle()
      .on('error', options.onError)
      .pipe(source(options.outputFile))
      .pipe(buffer())
      .pipe(debug ? sourcemaps.init({ loadMaps: true }) : noop())
      .pipe(options.minify ? uglify(options.uglifyOptions) : noop())
      .pipe(debug ? sourcemaps.write('./') : noop())
      .pipe(gulp.dest(options.outputPath));
  }

  function noop(){
    return new stream.PassThrough({ objectMode: true });
  }
}
