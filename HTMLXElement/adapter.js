define(function(require, exports) {
  'use strict';
  
  /**
   * adapter is a generic interface used to register elements with the DOM.
   * @static
   * @class adapter
   */
  exports;

  /**
   * Register's called by {{#l XTMLXElement}}{{/l}} to register the passed tag
   * to be associated with the obj in the DOM.
   * @method register
   */
  exports.register = function(tag, obj) {};
});
