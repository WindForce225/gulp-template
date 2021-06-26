let project_folder = 'dist'
let source_folder = './src'

let fs = require('fs')

let path = {
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    js: project_folder + '/js/',
    img: project_folder + '/img/',
    fonts: project_folder + '/fonts/',
    video: project_folder + '/video/',
    template: project_folder + '/template/',
  },
  src: {
    html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
    css: source_folder + '/scss/style.scss',
    js: source_folder + '/js/script.js',
    js2: source_folder + '/js/lib/*.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    fonts: source_folder + '/fonts/*.ttf',
    video: source_folder + '/video/*.mp4',
    template: [
      source_folder + '/template/*.html',
      '!' + source_folder + '/template/_*.html',
    ],
  },
  watch: {
    html: source_folder + '/**/*.html',
    css: source_folder + '/scss/**/*.scss',
    js: source_folder + '/js/**/*.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    fonts: source_folder + '/fonts/*.ttf',
    video: source_folder + '/video/*.mp4',
    template: source_folder + '/template/*.html',
  },
  clean: './' + project_folder + '/',
}

// подключение плагинов gulp после установки
let { src, dest } = require('gulp'),
  gulp = require('gulp'),
  browsersync = require('browser-sync').create()
fileinclude = require('gulp-file-include')
del = require('del')
scss = require('gulp-sass')
autoprefixer = require('gulp-autoprefixer')
group_media = require('gulp-group-css-media-queries')
clean_css = require('gulp-clean-css')
rename = require('gulp-rename')
;(uglify = require('gulp-uglify-es').default),
  (imagemin = require('gulp-imagemin')),
  // webp = require("gulp-webp"),
  // webphtml = require("gulp-webp-html"),
  // webpcss = require("gulp-webpcss"),
  (svgSprite = require('gulp-svg-sprite')),
  (ttf2woff = require('gulp-ttf2woff')),
  (ttf2woff2 = require('gulp-ttf2woff2')),
  (fonter = require('gulp-fonter'))

// функция для работы со шрифтами
function fonts(params) {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts))
  return src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts))
}

// функция
function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: './' + project_folder + '/',
    },
    port: 3000,
    notify: false,
  })
}

// функция сборки img файла
function images() {
  return (
    src(path.src.img)
      // .pipe(webp({
      // 		quality: 70,
      // 	})
      // )
      .pipe(dest(path.build.img))
      .pipe(src(path.src.img))
      .pipe(
        imagemin({
          progressive: true,
          svgoPlugins: [
            {
              removeViewBox: false,
            },
          ],
          interlaced: true,
          optimizationLevel: 3, // 0 to 7
        })
      )
      .pipe(dest(path.build.img))
      .pipe(browsersync.stream())
  )
}

// функция сборки video файла
function video() {
  return src(path.src.video)
    .pipe(dest(path.build.video))
    .pipe(browsersync.stream())
}

// функция сборки html файла
function html() {
  return (
    src(path.src.html)
      .pipe(fileinclude())
      // .pipe(webphtml())
      .pipe(dest(path.build.html))
      .pipe(browsersync.stream())
  )
}

// функция сборки html-страницы файла
function template() {
  return (
    src(path.src.template)
      .pipe(fileinclude())
      // .pipe(webphtml())
      .pipe(dest(path.build.template))
      .pipe(browsersync.stream())
  )
}

// функция сбрки js файлов
function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: '.min.js',
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
  return src(path.src.js2).pipe(dest(path.build.js)).pipe(browsersync.stream())
}

// функция сборки js бибилотек
function js2() {
  return src(path.src.js2).pipe(dest(path.build.js)).pipe(browsersync.stream())
}

// скрипт преобразования otf в ttf
gulp.task('otf2ttf', function () {
  return gulp
    .src([source_folder + '/fonts/*.otf'])
    .pipe(
      fonter({
        formats: ['ttf'],
      })
    )
    .pipe(dest(source_folder + '/fonts/'))
})

// функция создания svg спрайтов
gulp.task('svgSprite', function () {
  return gulp
    .src([source_folder + '/iconsprite/*.svg'])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../icons/icons.svg', //sprite file name
            // example:true
          },
        },
      })
    )
    .pipe(dest(path.build.img))
})

// функция сборки стилей
function css() {
  return (
    src(path.src.css)
      .pipe(
        scss({
          outputStyle: 'expanded',
        })
      )
      .pipe(group_media())
      .pipe(
        autoprefixer({
          overrideBrowserslist: ['last 36 versions'],
          cascade: false,
        })
      )
      // .pipe(webpcss())
      .pipe(dest(path.build.css))
      .pipe(clean_css())
      .pipe(
        rename({
          extname: '.min.css',
        })
      )
      .pipe(dest(path.build.css))
      .pipe(browsersync.stream())
  )
}

// функция подключения файлов шрифтов к файлу стилей
function fontsStyle(params) {
  let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss')
  if (file_content == '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb)
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split('.')
          fontname = fontname[0]
          if (c_fontname != fontname) {
            fs.appendFile(
              source_folder + '/scss/fonts.scss',
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            )
          }
          c_fontname = fontname
        }
      }
    })
  }
}

function cb() {}

// функция слежки за измненениями файлов
function watchFiles(params) {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.template], template)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], images)
}

// функция удаления папки dist
function clean(params) {
  return del(path.clean)
}

let build = gulp.series(
  clean,
  gulp.parallel(js, js2, video, css, fonts, html, template, images)
)
let watch = gulp.parallel(build, watchFiles, browserSync)

exports.template = template
exports.video = video
exports.fontsStyle = fontsStyle
exports.fonts = fonts
exports.images = images
exports.js = js
exports.js2 = js2
exports.css = css
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch
