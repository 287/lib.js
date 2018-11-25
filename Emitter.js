//#!py
/**
 * @export Emitter
 * @desc type可以是字符串或者是选择器对象，如果为object时可以指定的字段{type, group, id, once}
 */
 
class Emitter

	constructor(contextKey)
		let context = this
		if contextKey
			context = this[contextKey] = {}
		
		Object.assign(context, {
			events: {},
			status: {},
		})
		
	getEmitterContext()
		return this
	
	/**
	 * @desc emit 时 filter会触发子集的filter
	 * @include eachArray
	 * @param {string|object} type
	 * @param {string} [selector] - group or id
	 * @param {...} [args]
	 */
	emit(type, ...args)
		let filter
		if isObject(type)
			filter = type
			type = type.type
			
		const events = this.getEmitterContext().events[type]
		let rs
		if events && events.length > 0
			eachArray(events, (item, i)=> {
				if !checkByFilter(item, filter, ['type'])
					return
					
				let result = item.task(...args)
				
				if item.once
					events.splice(i, 1)
					return true
				
				if result === false
					rs = result
					return false
			})
			
		if type !== '*' && !type.startsWith('emitter.')
			if this.__emit
				this.__emit(type, filter, ...args)
			// this.emit(`emitter.emit`, type, filter, ...args)
	
		return rs

	/**
	 * @include isObject isFunction
	 * @param {string|object} type
	 * @param {string} [type.type]
	 * @param {string} [type.group]
	 * @param {string} [type.id]
	 * @param {boolean} [type.once = false]
	 * @param {function} task
	 */
	on(type, ...args)
		let item = {}
		let isPrepend
		if isObject(type)
			Object.assign(item, type)
			if item.prepend
				delete item.prepend
				isPrepend = true
			delete item.type
			type = type.type
		else
			if type[0] === '^'
				type = type.slice(1)
				isPrepend = true
			
		let {events} = this.getEmitterContext()
		events = events[type] = events[type] || []
		const task = args[0]
		if isFunction(task)
			item.task = task
			
			let index
			if item.id != null
				index = events.findIndex(tItem=> item.id === tItem.id)
			
			if index != null && index > -1
				events[index] = item
			else
				if isPrepend
					events.unshift(item)
				else
					events.push(item)
		
		// this.emit(`emitter.on`, type, item, ...args)
		if this.__on
			this.__on(type, item, ...args)

	/**
	 * @include isObject
	 * @param {string|object} type
	 * @param {string} [type.type]
	 * @param {string} [type.group]
	 * @param {string} [type.id]
	 * @param {function} task
	 */
	once(type, ...args)
		if isObject(type)
			type.once = true
		else
			type = {
				type,
				once: true,
			}
		this.on(type, ...args)

	/**
	 * @include emptyArray isFunction
	 * @param {string} type
	 * @param {function|string|object} selector
	 */
	off(type, selector)
		const events = this.getEmitterContext().events[type]
		if events && events.length
			if selector === '*'
				emptyArray(events)
			else
				if !isObject(selector)
					if isFunction(selector)
						selector = {task: selector}
					else
						selector = null
				if selector
					eachArray(events, (item, i)=> {
						if checkByFilter(item, selector)
							events.splice(i, 1)
							return true
					})
				
		// this.emit(`emitter.off`, type, selector)
		if this.__off
			this.__off(type, selector)
			
	setStatus(key, value)
		const {status} = this.getEmitterContext()
		if status[key] !== value
			const lastValue = status[key]
			status[key] = value
			if this.__setStatus
				this.__setStatus(key, value, lastValue)
			// this.emit(`emitter.status`, value, lastValue)
			
	getStatus(key)
		const {status} = this.getEmitterContext()
		return status[key]
		
	is(key)
		const {status} = this.getEmitterContext()
		let value = status[key]
		if isFunction(value)
			value = value(key)
		return !!value

/**
 * @include eachObjectSome
 */
function checkByFilter(item, filter, exceptKeys = [])
	if filter && eachObjectSome(filter, (value, key)=> !exceptKeys.includes(key) && value != null && item[key] != null && item[key] !== value)
		return false
	return true