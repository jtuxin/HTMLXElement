
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
