define (require) -> describe 'Adapter', ->

  Adapter = require '../HTMLXElement/Adapter'
  
  beforeEach ->
    @adapter = new Adapter

  it 'initializes default fields in the Adapter contructor', ->
    @adapter = new Adapter(hi: 'hello')
    @adapter.should.have.ownProperty('hi', 'hello')
    null
  
  it 'gets an adapter type from tests array', ->
    @adapter.tests = mockmapping: [ (-> no ), RegExp::test.bind(/^mock$/) ]
    @adapter.adapt('mock').should.have.a.property('0', 'mockmapping')
    null
    
  it 'gets multiple adapter types from tests', ->
    @adapter.tests = mockmapping: (-> yes), another: (-> yes)

    adapted = @adapter.adapt('something')
    adapted.should.be.an('array')
    adapted.should.have.a.property('0', 'mockmapping')
    adapted.should.have.a.property('1', 'another')
    null

  it 'gets an adapter type from function', ->
    @adapter.tests = mockmapping: (f) -> f is 'happy'
    @adapter.adapt('happy').should.have.a.property('0', 'mockmapping')
    null

  it 'throws an error when initialized with a test adapter without a mapping',->
    @adapter.tests = mockmapping: (f) -> f is 'foo'
    expect(->
      Adapter.call(@adapter, null, foo: null)
    ).to.throw()
    null

  null
