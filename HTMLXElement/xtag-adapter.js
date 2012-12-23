define(function(require, exports) {
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
