define(function(require, exports, module) {
  'use strict';

  var adapter = require('./adapter');
  var util    = require('./util');

  var camelToDashed = util.string.camelToDashed;
  var name = util.func.name;

  module.exports = HTMLXElement;

  function HTMLXElement() {
    return document.createElement('x-'+this.constructor.tagName);
  }

  /**
   * @method register
   * @param {String} [to=this] Constructor to register
   * @param {String} [tag='x'+to.name] name to use for the registered element
   */
  HTMLXElement.register = function(to, tag) {
    tag = typeof to === 'string' ? to : tag;
    to  = typeof to === 'object' && to || this;
    
    if (!to || !(to.prototype instanceof HTMLXElement))
      throw new Error('register needs a subject');

    to.tagName = typeof tag === 'string' ? tag : 'x-'+camelToDashed(name(to));
    
    adapter.register(to.tagName, to.prototype);

    return to;
  };

  HTMLXElement.prototype = Object.create(HTMLElement.prototype, {
    constructor: { value: HTMLXElement }
  });
});
