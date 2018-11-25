//#!py
/**
 * @export TinyEmitter
 */
 
class TinyEmitter
	constructor()
		this.events = {}
	
	/**
	 * @include eachArray
	 * @param {string} type
	 * @param {...} [args]
	 */
	emit(type, ...args)
		const events = this.events[type]
		if events && events.length > 0
			events.forEach((cb, i)=>{
				cb(...args)
			})
		
		if type !== '*'
			this.emit('*', type, ...args)
	
	/**
	 * @include isFunction
	 * @param {string} type
	 * @param {function} cb
	 */
	on(type, cb)
		const events = this.events[type] = this.events[type] || []
		if isFunction(cb)
			events.push(cb)

	/**
	 * @param {string} type
	 * @param {function} cb
	 */
	once(type, cb)
		if cb
			cb.once = true
			this.on(type, cb)

	/**
	 * @include emptyArray
	 * @param {string} type
	 * @param {function|string} cb
	 */
	off(type, cb)
		const events = this.events[type]
		if events && events.length > 0
			if selector === '*'
				emptyArray(events)
			else
				let index = events.indexOf(cb)
				if index > -1
					events.splice(index, 1)