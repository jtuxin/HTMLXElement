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
