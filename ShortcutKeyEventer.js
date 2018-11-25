//#!py
/**
 * @export ShortcutKeyEventer
 */
const metaKeys = ['ctrl', 'shift', 'alt']
const keyMap = {
	escape: 'esc',
	control: 'ctrl',
}

class ShortcutKeyEventer

	static binds = []
	
	constructor()
		Object.assign(this, {
			binds: {},
		})
		
		this.open()
		
	/**
	 * @include removeArrayValue
	 */
	close()
		removeArrayValue(ShortcutKeyEventer.binds, this)
		
	/**
	 * @include addArrayValue
	 */
	open()
		const {binds} = ShortcutKeyEventer
		if !binds.includes(this)
			binds.unshift(this)
	
	unbind(shortcut)
		shortcut = parseShortcutKey(shortcut)
		
		if !shortcut
			return
		
		delete this.binds[joinShortcutKey(shortcut)]
		
	/**
	 * @include isFunction
	 */
	bind(shortcut, op, task)
		if isFunction(op)
			task = op
			op = null
		
		let fastMode = false
		if isString(shortcut) && shortcut.includes('.fast')
			shortcut = shortcut.replace('.fast', '')
			fastMode = true
		
		shortcut = parseShortcutKey(shortcut)
		
		if !shortcut
			return
		
		this.binds[joinShortcutKey(shortcut)] = Object.assign({
			shortcut,
			fast: fastMode,
			inputable: false,
			prevent: true,
			task,
		}, op)
		
		
class KeyPressed
	/**
	 * @include addEvent
	 */
	constructor(op)
		Object.assign(this, {
			pressed: {},
			onkeydown: null,
			onkeypress: null,
			onkeyup: null,
		}, op)
		
		const {lastUp, pressed} = this
		const dom = document
		
		addEvent(dom, 'keyup', (e)=> {
			delete pressed[e.key]
			if this.onkeyup
				this.onkeyup(e)
		})
		
		addEvent(dom, 'keydown', (e)=> {
			if this.onkeydown
				this.onkeydown(e)
				
			if !pressed[e.key] || e.timeStamp - pressed[e.key].timeStamp > 200
				if this.onkeypress
					this.onkeypress(e)
					
			pressed[e.key] = e
		})
		
new KeyPressed({
	onkeydown: (e)=> emitShortcut(e, true),
	onkeypress: (e)=> emitShortcut(e, false),
})

/**
 * @include isInputable eachObjectFind eachObjectSome eachArray
 */
function emitShortcut(e, isFast)
	const key = parseKey(e.key)
		
	if metaKeys.includes(key)
		return
		
	const op = parseShortcutKey(e, 'Key')
	op.key = key
	
	eachArray(ShortcutKeyEventer.binds, (obj)=> {
		let conf = eachObjectFind(obj.binds, (conf)=> {
			if isFast !== conf.fast
				return
			return !eachObjectSome(conf.shortcut, (value, key)=> op[key] !== value)
		})
		// let conf = obj.binds[shortcutKey]
		if !conf
			return
			
		if !conf.inputable
			if isInputable()
				return
			
		conf.task(e, key)
		
		if conf.prevent
			e.preventDefault()
			
		return false
	})
	


function parseKey(key)
	const ArrowKey = 'arrow'
	key = key.toLowerCase()
	key = keyMap[key] || key
	if key.startsWith(ArrowKey)
		key = key.slice(ArrowKey.length)
	return key
	
	
/**
 * @include 
 */
function joinShortcutKey(op)
	const keys = metaKeys.filter(key=> op[key])
	keys.push(op.key)
	return JSON.stringify(keys)
	
/**
 * @include isString isNonemptyString
 */
function parseShortcutKey(op, keySubfix = '')
	let rs = {}
	
	if isString(op)
		op.toLowerCase().split('+').forEach((key)=> {
			if metaKeys.includes(key)
				rs[key] = true
			else
				rs.key = key
		})
	else
		metaKeys.forEach((key)=> {
			let referKey = key + keySubfix
			if op[referKey]
				rs[key] = op[referKey]
		})
		rs.key = op.key.toLowerCase()
		
	if !isNonemptyString(rs.key)
		rs = null
		
	return rs