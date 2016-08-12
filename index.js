'use strict';

var through2 = require('through2'),
  path = require('path'),
  gutil = require('gulp-util'),
  utils = require('utils')._;


const CODE_BEGIN = '(function(){\n "use strict";\n';

const CODE_END = '})();';
/**
 * 将html文件编译成为js文件
 * @param  {object} options 
 * ```
 * {
 *     base:'',          //基础目录,默认'file.base'
 *     cacheFunction:'', //使用的缓存函数,默认'$.tpl'
 *     output:'',        //输出文件,默认'tpl.js',
 *     relativePath:true,//使用相对路径,
 *     concat: true      //是否合并，如果不合并，output参数失效
 * }
 * ```
 * @return {[type]}         [description]
 */
module.exports = function(options) {
  var ops = {
    cacheFunction: '$.tpl',
    output: 'tpl.js',
    relativePath: true,
    concat: true
  };

  utils.extend(ops, options);

  var outfile = {
    contents: ''
  };
  var prefix = '';
  if (!ops.relativePath) {
    prefix = '/';
  }

  var transformFn = function(file, env, cb) {
    if (file.isNull()) {
      this.push(file);
      return cb();
    }

    if (file.isStream()) {
      this.emit('error', new gutil.PluginError(PLUGIN_NAME, 'Streaming not supported'));
      return cb();
    }
    if (outfile.base == undefined) {
      outfile.base = ops.base || file.base;
      outfile.cwd = file.cwd;
    }
    var r_filename = prefix + path.relative(outfile.base, file.path);
    var fileStr = file.contents.toString();

    fileStr = fileStr.replace(/(')|([\n\r]+)|(^|$)/g, function(m0, m1, m2, m3) {
      if (m1) {
        return "\\'";
      }
      if (m2) {
        return "'+\n'";
      }
      return "'";
    });

    fileStr = ops.cacheFunction + "('" + r_filename + "', " + fileStr + ');\n\n';
    if (ops.concat) {
      outfile.contents += fileStr;
    } else {
      file.contents = new Buffer(CODE_BEGIN + fileStr + CODE_END);
      file.path = file.path + '.js';
      // console.log(file);
      this.push(file);
    }

    cb();
  };
  var flushFn = function(cb) {
    this.push(new gutil.File({
      base: outfile.base,
      cwd: outfile.cwd,
      path: path.join(outfile.base, ops.output),
      contents: new Buffer(CODE_BEGIN + outfile.contents + CODE_END)
    }));
    cb();
  };


  if(ops.concat){
    return through2.obj(transformFn, flushFn);
  }
  else{
    return through2.obj(transformFn);
  }
};