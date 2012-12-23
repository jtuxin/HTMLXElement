define (require) -> describe 'xtag-adapter', ->

  { Adapter } = require '../HTMLXElement/xtag-adapter'
  
  it 'should adapt events of the form "onevent:delegate()" into xtag events', ->
    adapter = new Adapter
      'onclick': (->)
      'onclick:delegate(.special)': (->)

    expect(adapter.events).to.have.property('click').that.is.a('function')
    expect(adapter.events).to.have.property('click:delegate(.special)')
    null

  it 'should adapt ES5 getters/setters to xtag getters/setters', ->
    adapter = new Adapter `{
      get internal() {
        if (!{}.hasOwnProperty.call(this, '_internal'))
          Object.defineProperty(this, '_internal', {
            writable: true,
            value: 'donttouch'
          });

        return this._internal;
      },

      set internal(internal) {
        this._internal = internal;
      }
    }`
    
    expect(adapter.getters).to.have.property('internal').that.is.a('function')
    expect(adapter.setters).to.have.property('internal').that.is.a('function')
    null
