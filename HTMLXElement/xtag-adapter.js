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
      this.getters[field] = descriptor.get || descriptor.value;
    }},

    'adapt-set': { value: function(field, descriptor) {
      this.setters[field] = descriptor.set || descriptor.value;
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
