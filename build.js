/*globals path, fs*/
(function() {
  'use strict';
  
  // This build script leverages rjs invoked through node to compile files to

  // Directory used by requirejs to build the project
  var BUILD_DIR = process.cwd() + '/build';

  // Output directory for the compiles files
  var OUT_DIR = process.cwd() + '/out';
  
  if ((/\/build\.js$/).test(process.argv[1]))
    return runRjs();

  process.on('exit', deleteDir.bind(null, BUILD_DIR));
  process.on('uncaughtException', deleteDir.bind(null, BUILD_DIR));

  return {
    baseUrl: "./",
    dir: "build",

    modules: [
      xtag(config('x-tag')),
      
      wrapped(xtag(config('x-tag.wrapped')))
    ],

    paths: {},

    optimize: "none",
    optimizeCss: "none",
    useStrict: true,
    removeCombined: true,
    skipDirOptimize: true
  };
  
  function runRjs() {
    var args = ['./components/rjs/dist/r.js', '-o', 'build.js'];
    var opts = {
      cwd: process.cwd(),
      env: process.env,
      stdio: 'inherit'
    };

    return require('child_process').spawn('node', args, opts);
  }

  function xtag(config) {
    return mixin(config, {
      exclude: ['x-tag'],

      override: {
        paths: {
          "x-tag": "components/x-tag/x-tag",
          "HTMLXElement/adapter": "HTMLXElement/xtag-adapter"
        }
      }
    });
  }
  
  function wrapped(config) {
    return mixin(config, {
      override: {
        paths: {
          "x-tag": "components/x-tag/x-tag",
          "HTMLXElement/adapter": "HTMLXElement/xtag-adapter"
        },
        wrap: {
          start: (function() {
            return ';(function() {\n' +
                    fs.readFileSync('components/almond/almond.js', 'utf8');
          })(),
          end: '\n)();'
        }
      }
    });
  }

  function config(configName) {
    return {
      name: "HTMLXElement",

      override: {},

      get _buildPath() {},
      set _buildPath(buildPath) {
        retargetPath(this, buildPath, configName);
      }
    };
  }

  function retargetPath(context, buildPath, configName) {
    var dir  = path.dirname(buildPath.replace(/\/(build)\//, '/out/'));
    var base = path.basename(buildPath).replace(/\.js$/, '');

    buildPath = path.join(dir, base + '.' + configName + '.js');

    context.__defineGetter__('_buildPath', function() {
      return buildPath;
    });
  }
  
  function deleteDir(dir) {
    fs.readdirSync(dir).forEach(function(filePath) {
      filePath = path.join(dir, filePath);

      var stat = fs.lstatSync(filePath);

      if (stat.isDirectory())
        deleteDir(filePath);
      else
        fs.unlinkSync(filePath);
    });

    fs.rmdirSync(dir);
  }

  function mixin(to, from) {
    for (var key in from)
      if (typeof to[key] === 'object' && to[key])
        mixin(to[key], from[key]);
      else
        to[key] = from[key];

    return to;
  }

  function has(key, value) {
    return function(obj) { return obj[key] === value };
  }
})()
