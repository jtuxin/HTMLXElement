;(function() {
/**
 * almond 0.2.3 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define('HTMLXElement/Adapter',['require','exports','module'],function(require, exports, module) {
  'use strict';

  module.exports = Adapter;
  
  var objDescriptor = Object.getOwnPropertyDescriptor || function(obj, field) {
    return { value: obj[field] };
  };
  
  var isFunction = function(test) { return typeof test === 'function' };

  /**
   * Adapter leveraged by the xtag-adapter to help register the element with the
   * DOM.
   *
   * @class Adapter
   */
  function Adapter(defaults, overrides) {
    var field, override, descriptor, matches;

    for (field in defaults)
      this[field] = defaults[field];

    for (override in overrides) {
      descriptor = objDescriptor(overrides, override) || {};
      matches    = this.adapt(override, descriptor);
      
      for (var i = 0, l = matches.length; i < l; i++)
        this['adapt-'+matches[i]](override, descriptor, overrides);
    }
  }

  Adapter.prototype = Object.create(Object.prototype, {
    /**
     * @property {Object} tests by adapt
     */
    tests: {
      writable: true, value: {}
    },

    /**
     * For a given field and its property descriptor, returns the keys of tests
     * for which the invoked test field passes.
     *
     * @method adapt
     */
    adapt: {
      value: function(field, descriptor) {
        var that  = this;
        var tests = this.tests;

        return Object.keys(tests).filter(function(type) {
          var testArr = Array.isArray(tests[type])? tests[type] : [tests[type]];

          return testArr.filter(isFunction).some(function(test) {
            return test.call(that, field, descriptor);
          });
        });
      }
    }
  });
});

define('HTMLXElement/adapter',['require','exports','module','x-tag','./Adapter'],function(require, exports) {
  'use strict';

  var xtag    = require('x-tag');
  var Adapter = require('./Adapter');

  /**
   * @module xtag-adapter
   */
  exports;
   
  /**
   * @class XTagAdapter
   * @extends Adapter
   * @constructor
   */
  exports.Adapter = XTagAdapter;

  /**
   * @method register
   */
  exports.register = function(tag, obj) {
    return xtag.register(tag, new exports.Adapter(obj));
  };

  function XTagAdapter(overrides) {
    [].unshift.call(arguments, {
      content : '',
      events  : {},
      methods : {},
      getters : {},
      setters : {}
    });

    Adapter.apply(this, arguments);
  }
  
  XTagAdapter.prototype = Object.create(Adapter.prototype, {
    tests: {
      value: {
        on: regExpTest(/^(?:on)(.+)/),
        content: regExpTest(/^content$/),
        get: [ regExpTest(/^get$/), isProperty('get') ],
        set: [ regExpTest(/^set$/), isProperty('set') ],
        created: regExpTest(/^created$/),
        inserted: regExpTest(/^inserted$/)
      }
    },

    'adapt-on': { value: function(field, descriptor) {
      this.events[field.substr(2)] = descriptor.value;
    }},

    'adapt-content': { value: function(field, descriptor) {
      this.content = descriptor.value;
    }},

    'adapt-get': { value: function(field, descriptor) {
      if (descriptor.get)
        this.getters[field] = descriptor.get;

      else for (field in descriptor.value)
        this.getters[field] = descriptor.value[field];
    }},

    'adapt-set': { value: function(field, descriptor) {
      if (descriptor.set)
        this.setters[field] = descriptor.set;

      else for (field in descriptor.value)
        this.setters[field] = descriptor.value[field];
    }},

    'adapt-created': { value: function(field, descriptor) {
      this.onCreate = descriptor.value;
    }},

    'adapt-inserted': { value: function(field, descriptor) {
      this.onInsert = descriptor.value;
    }}
  });

  function regExpTest(regExp) {
    return regExp.test.bind(regExp);
  }
  
  function isProperty(prop) {
    return function(field, descriptor) {
      return descriptor[prop] != null;
    };
  }
});

define('HTMLXElement/util',[],function() {
  'use strict';

  var functionNameExp = /^(?:function[\s]+)([^\(]*)/;
  var toLowerCaseExp  = /[a-z][A-Z]|[A-Z][A-Z][a-z]/g;

  return {
    string: {
      camelToDashed: function(str) {
        str = (str || '').replace(toLowerCaseExp, function(match) {
          return '' + match[0] + '-' + match[1] + (match[2] || '');
        });

        return str.toLowerCase();
      }
    },

    func: {
      name: function(func) {
        return func.name || func.toString.match(functionNameExp)[1];
      }
    }
  };
});

define('HTMLXElement/HTMLXElement',['require','exports','module','./adapter','./util'],function(require, exports, module) {
  'use strict';

  var adapter = require('./adapter');
  var util    = require('./util');

  var camelToDashed = util.string.camelToDashed;
  var name = util.func.name;

  module.exports = HTMLXElement;

  function HTMLXElement() {
    return document.createElement('x-'+this.constructor.tagName);
  }

  HTMLXElement.register = function(to, tag) {
    tag = typeof to === 'string' ? to : tag;
    to  = typeof to === 'object' && to || this;
    
    if (!to || !(to.prototype instanceof HTMLXElement))
      throw new Error('register needs a subject');

    to.tagName = typeof tag === 'string' ? tag : 'x-'+camelToDashed(name(to));
    
    return adapter.register(to.tagName, to.prototype);
  };

  HTMLXElement.prototype = Object.create(HTMLElement.prototype, {
    constructor: { value: HTMLXElement }
  });
});

define('HTMLXElement',['require','./HTMLXElement/HTMLXElement'],function(require) {
  'use strict';

  // TODO: Figure out how to do multiple builds with just rjs, I needs a wrapped
  // version with acorn to publish.
  
  // TODO: Angular adapter?

  var HTMLXElement = require('./HTMLXElement/HTMLXElement');

  var has = Object.prototype.hasOwnProperty;

  return {
    HTMLXElement: HTMLXElement,

    // TODO: Fix this
    inherit: function(Parent, Child) {
      if (typeof Parent !== 'function' || !Parent.prototype)
        Parent = HTMLXElement;
      
      // Copy members from the Parent constructor into the Child
      for (var key in Parent) {
        if (has.call(Parent, key))
          Child[key] = Parent[key];
      }

      function Ctor() {
        /*jshint validthis:true */
        this.constructor = Child;
      }
      
      Ctor.prototype = Parent.prototype;
      
      Child.prototype = new Ctor();
      
      Child.__super__ = Parent.prototype;
      
      return Child;
    }
  };
});

)();