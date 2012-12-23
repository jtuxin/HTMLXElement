define (require) -> describe 'HTMLXElement', ->

  HTMLXElement = require '../HTMLXElement/HTMLXElement'
  adapter = require 'cs!./mocks/adapter'

  it 'fails to register a tag thats not an instanceof the HTMLXElement', ->
    expect(-> HTMLXElement.register {}, 'nonsense').to.throw()
    expect(-> HTMLXElement.register 'nonsense').to.throw()
    null

  it 'registers an instance of HTMLXElement, pulling the name from the instance', ->
    class Ext extends HTMLXElement
      @register()
    
    expect(adapter.tags).to.have.a.property('x-ext')
    null
