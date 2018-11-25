//#!py
/**
 * @import Emitter MouseEventer DragEventer
 * @export eventer
 */
const types = []

class Eventer extends Emitter
	
	constructor()
		super()
		this.types = types
		
	
	__on(type, op, arg1, arg2)
		if !types.includes(type)
			let dom = getRootContextByType(type)
			if dom
				types.push(type)
				this.bind(dom, type)
		
		if arg1 && arg1.nodeType === 1
			this.on(type, (e, ...args)=> {
				if e && e.path
					if e.path.some(node=> node === arg1)
						e.target = arg1
						arg2(e, ...args)
			})
			
		else if type === 'drag' && isObject(arg1)
			new DragEventer(arg1, this)
			
	when(type, cb)
		if this.is(type)
			cb()
		else
			this.on(type, cb)
		
	/**
	 * bind events
	 * @include isString addEvent
	 * @param {element} [dom]
	 * @param {string} type
	 * @param {function} [cb]
	 */
	bind(dom, type, cb)
		if isString(dom)
			cb = type
			type = dom
			dom = null
		
		if !dom
			dom = getRootContextByType(type)
			
		if !cb
			cb = e => this.emit(type, e)
		
		addEvent(dom, type, cb)
		
const eventer = new Eventer
MouseEventer.bind((e)=> eventer.emit(e.type, e))

eventer.types.push(...MouseEventer.types)

function getRootContextByType(type)
	return [document, window].find(dom=> `on${type}` in dom)