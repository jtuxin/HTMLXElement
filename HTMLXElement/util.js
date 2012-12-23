define(function() {
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
