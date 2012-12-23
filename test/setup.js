/*globals chai, __testacular__ */
(function() {
  'use strict';

  var coffeeFile = /\.coffee$/;

  var isCoffeeFile = RegExp.prototype.test.bind(coffeeFile);
  var isSpecFile   = RegExp.prototype.test.bind(/\.spec\./);
  
  var config = {
    baseUrl: '/base/',

    paths: {
      'cs': 'components/require-cs/cs',
      'coffee-script': 'components/require-cs/coffee-script',
      'x-tag': 'components/x-tag/x-tag'
    },

    map: {
      'HTMLXElement/HTMLXElement': {
        'HTMLXElement/adapter': 'cs!test/mocks/adapter'
      }
    }
  };

  require(config, testFiles(), function() {

    // setup chai assertion library
    chai.should();
    window.expect = chai.expect;

    // start tests
    __testacular__.start();
  });

  function testFiles() {
    var files = [];

    for (var file in __testacular__.files)
      if (isSpecFile(file))
        files.push(transformCS(file.replace(config.baseUrl, '')));

    return files;
  }

  function transformCS(file) {
    return !isCoffeeFile(file) ? file : 'cs!'+file.replace(coffeeFile, '');
  }
})();
