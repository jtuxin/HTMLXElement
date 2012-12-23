define(function(require) {
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
