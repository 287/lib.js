//#!py
/**
 * @desc 模块加载器
 * @export ModuleLoader
 */
 
class ModuleLoader
	/**
	 * @include isString isArray isBoolean
	 */
	constructor(op)
			
		Object.assign(this, {
			shim: {},
			aliases: {},
			paths: {},
			defines: {},
			caches: {},
			prefix: '',
			suffix: '.js',
			exports: true,
			conf: {
				loadings: {},
				dependents: {},
				pendings: {},
			},
		}, op)
		
		eachObject(this.shim, (value, key, o)=>{
			if isString(value)
				value = {
					exports: value
				}
			else if isArray(value)
				value = {
					requires: value
				}
			else if isBoolean(value)
				if value
					value = {
						json: value,
						suffix: '.json',
					}
				else
					value = null
				
			o[key] = value
		})
		
		if this.exports
			this.export()
		
			
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
			defines[name] = {
				requires,
				task,
			}
		
	/**
	 * @include isArray parseArgs loads findAliasName
	 * @param {array<string>|string} [names]
	 * @param {function} task
	 * @return {array<any>|any|undefined}
	 */
	require(...args)
		let [names, task] = parseArgs(args, ['~asn', 'f'])
		let limitOne = !isArray(args[0])
		let rs
		
		names.forEach((name, i)=> {
			if name.charAt(0) === '!'
				name = names[i] = name.slice(1)
				delete this.caches[name]
		})
		
		loads(
			names,
			{
				contents: this.caches,
				loadings: this.conf.loadings,
				dependents: this.conf.dependents,
				pendings: this.conf.pendings,
				// verbose: false,
				getPath: (name, param)=> {
					// 查找别名
					name = findAliasName(name, this.aliases)
					
					let shim = param.shim = this.shim[name] || {}
					param.exportName = shim.exports
					
					let path
					
					// 获取path
					if this.paths[name]
						path = this.paths[name]
					else if isFunction(this.getPath)
						path = this.getPath(name)
					else
						let suffix = shim.suffix || this.suffix
						if name.endsWith('.json')
							suffix = ''
						path = `${this.prefix}${name}${suffix}`
					
					return path
				},
				/**
				 * @include getByAjax loadScript
				 */
				loadContent: (path, param, cb)=> {
					let {name, shim} = param
					if shim.json || path.endsWith('.json')
						getByAjax(path, {type: 'json'}, (err, rs)=>{
							cb(err || false, rs)
						})
					else
						cb()
				},
				/**
				 * @include resolveRelativePath getDirname isDirLike
				 */
				getDependents: (content, param, cb)=> {
					let {name, path, shim} = param
					
					if shim.requires && shim.requires.length
						// 全局变量且有依赖
						return shim.requires
					else
						let item = this.defines[name]
						if item
							runcb(null, item.requires)
						else
							loadScript(path, ()=>{
								let item = this.defines[name]
								if item
									// 模块
									runcb(null, item.requires)
								else
									// 全局变量无依赖
									let object = getObjectFromGlobal(param.exportName || name)
									cb(false, object)
							})
					function runcb(err, requires)
						let moduleDir = isDirLike(name) ? name : getDirname(name)
						requires = requires.map((name, i)=> name.includes('./') ? resolveRelativePath(name, moduleDir): name)
						cb(err, requires)
				},
				parseContent: (content, param, cb)=> {
					const {caches, defines} = this
					let {name, shim, path} = param
					
					let requires = param.requires.map(name=> caches[name])
					let item = this.defines[name]
					let object
					
					if item
						if item.task
							object = item.task(...requires)
							cb(null, object)
					else
						let keys = []
						param.requires.forEach((key, i)=>{
							let shim = this.shim[key]
							key = shim.exports || key
							if window[key] === undefined
								window[key] = requires[i]
						})
						loadScript(path, ()=>{
							if object = getObjectFromGlobal(param.exportName || name)
							item = this.caches[name] = object
							cb(null, item.object)
						})
						keys.forEach((key)=> delete window[key])
						
					cb(null, object)
				},
			},
			(err, requires)=>{
				if isFunction(task)
					task(...requires)
				else
					rs = limitOne ? requires[0] : requires
			}
		)
		return rs
		
	export(exportObject)
		let exports = exportObject ? {} : window
		
		['define', 'require'].forEach((key)=>{
			exports[key] = (...args)=> this[key](...args)
		})
		return exports
		

function getObjectFromGlobal(name)
	let object =  window[name]
	if object
		delete window[name]
	return object