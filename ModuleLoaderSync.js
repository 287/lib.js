//#!py
/**
 * @desc 模块同步加载器
 * @export ModuleLoaderSync
 */
class ModuleLoaderSync
	constructor(op)
		Object.assign(this, {
			caches: {},
			defines: {},
			exports: true,
		})
		
		if this.exports
			this.export()
			
	
	/**
	 * @include parseArgs isArray isFunction
	 * @param {array<string>|string}
	 * @param {function} [task]
	 * @return {array|undefined}
	 */
	require(...args)
		let [names, task] = parseArgs(args, ['~asn', 'f'])
		let requires = names.map(name=> this.getItem(name))
		let limitOne = !isArray(args[0])
		let rs
		
		if isFunction(task)
			task(...requires)
		else
			rs = limitOne ? requires[0] : requires
		
		return rs
	
	/**
	 * @param {string}
	 * @return {any}
	 */
	getItem(name)
		const {caches, defines} = this
		let rs
		
		if caches[name]
			rs = caches[name]
		else
			let item = defines[name]
			if item && item.task
				let requires = item.requires.map(name=> this.getItem(name))
				rs = caches[name] = item.task(...requires)
		
		return rs
		
	/**
	 * @include parseArgs isFunction
	 * @param {string} name
	 * @param {array<string>} [requires]
	 * @param {function|object} generator
	 * @return {object}
	 */
	define(...args)
		const {caches, defines} = this
		let [name, requires, task] = parseArgs(args, ['~sn', '~a', 'aof'])
		let object
		
		if !task && requires
			object = requires
			requires = null
		else if task && !isFunction(task)
			object = task
			task = null
		
		if object
			caches[name] = object
		else
			// if isFunction(task)
			defines[name] = {
				requires,
				task,
			}
		
	/**
	 * @desc clear global param at window
	 * @include getArrayDifference
	 * @param {function} task
	 * @return {undefined}
	 */
	preload(task)
		let names = Object.keys(window)
		task()
		names = getArrayDifference(names, Object.keys(window))
		names.forEach(key=>{
			try
				delete window[name]
		})
		
	export(exportObject)
		let exports = exportObject ? {} : window
		
		['define', 'require'].forEach((key)=>{
			exports[key] = (...args)=> this[key](...args)
		})
		return exports