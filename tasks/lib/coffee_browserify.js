// Generated by CoffeeScript 1.7.1
var CoffeeBrowserify, EventEmitter, coffee, compilers, defaultCompiler, fibrous, fs, path, through, uglify,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

fibrous = require('fibrous');

coffee = require('coffee-script');

through = require('through');

uglify = require('uglify-js');

fs = require('fs');

path = require('path');

EventEmitter = require('events').EventEmitter;

defaultCompiler = fibrous(function(src, filepath, debug) {
  return src;
});

compilers = {
  '.js': defaultCompiler,
  '.json': defaultCompiler,
  '.node': defaultCompiler,
  '.coffee': fibrous(function(src, filepath, debug) {
    var code, js, map, v3SourceMap, _ref;
    if (debug) {
      _ref = coffee.compile(src, {
        bare: true,
        sourceMap: true,
        filename: filepath
      }), js = _ref.js, v3SourceMap = _ref.v3SourceMap;
      code = js;
      if (v3SourceMap) {
        map = JSON.parse(v3SourceMap);
        map.sources = [filepath];
        map.sourcesContent = [src];
        code += '\n//@ sourceMappingURL=data:application/json;base64,';
        code += new Buffer(JSON.stringify(map)).toString('base64');
      }
    } else {
      code = coffee.compile(src, {
        bare: true,
        filename: filepath
      });
    }
    return code;
  })
};

module.exports = CoffeeBrowserify = (function(_super) {
  __extends(CoffeeBrowserify, _super);

  function CoffeeBrowserify() {
    return CoffeeBrowserify.__super__.constructor.apply(this, arguments);
  }

  CoffeeBrowserify.prototype.run = fibrous(function(config) {
    var bundle, cwd, expose, item, target, wait, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _ref2;
    bundle = browserify({
      extensions: ['.coffee']
    });
    bundle.transform((function(_this) {
      return function(filename) {
        var end, src, write;
        _this.emit('filename', filename);
        src = '';
        write = function(buf) {
          return src += buf;
        };
        end = function() {
          var code, compiler, ext;
          ext = path.extname(filename);
          compiler = compilers[ext];
          if (compiler == null) {
            throw new Error("No compiler for " + filename);
          }
          code = compiler.sync(src, filename, config.debug);
          this.queue(code);
          return this.queue(null);
        };
        return through(write, end);
      };
    })(this));
    cwd = process.cwd();
    _ref = config.add || [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      item = _ref[_i];
      bundle.add(path.resolve(cwd, item));
    }
    _ref1 = config.external || [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      item = _ref1[_j];
      bundle.external(item);
    }
    _ref2 = config.require || [];
    for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
      item = _ref2[_k];
      if (typeof item === 'object') {
        for (target in item) {
          expose = item[target];
          bundle.require(target, {
            expose: expose
          });
        }
      } else {
        bundle.require(item);
      }
    }
    wait = function(callback) {
      var code, s;
      code = '';
      s = bundle.bundle({
        transformAll: true,
        debug: config.debug
      }).pipe(through(function(data) {
        return code += data;
      }));
      return s.once('end', function() {
        return fs.writeFile(path.resolve(cwd, config.dest), code, 'utf8', callback);
      });
    };
    return wait.sync();
  });

  return CoffeeBrowserify;

})(EventEmitter);
