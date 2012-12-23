define (require) -> describe 'util', ->
  
  util = require '../HTMLXElement/util'

  describe 'string', ->

    string = util.string

    it 'converts camel and uppercase strings to dashed strings', ->
      string.camelToDashed('MYFunkyStringJS').should.equal('my-funky-string-js')
      null

    null

  describe 'func', ->

    func = util.func

    it 'grabs a functions name', ->
      func.name(class Test).should.equal('Test')

  null
