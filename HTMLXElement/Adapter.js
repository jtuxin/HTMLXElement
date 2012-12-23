define(function(require, exports, module) {
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
