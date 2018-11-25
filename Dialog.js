//#!py
/**
 * @import ShortcutKeyEventer
 * @export Dialog
 */
const buttonKeys = ['submit', 'cancel']
const nodeParentMap = {
	mask: 'wrap',
	window: 'wrap',
	header: 'window',
	body: 'window',
	footer: 'window',
	title: 'header',
	buttons: 'footer',
	submit: 'buttons',
	cancel: 'buttons',
}

class Dialog

	static nodeParentMap
	static buttonKeys
	static stacks = []
	
	static pop()
		const {stacks} = this
		const dialog = stacks.pop()
		if dialog
			dialog.close()
		return dialog
		
	static push(dialog)
		const {stacks} = this
		if !stacks.includes(dialog)
			stacks.push(dialog)
			
		
	/**
	 * @include assigns eachObject isObject
	 * @param {object} op
	 * @param {boolean} [op.button] - 是否显示button bar
	 * @param {boolean} [op.mask] - 是否显示遮罩层
	 * @param {object|boolean} [op.shortcut] - 快捷键的对象
	 * @param {object|boolean} [op.quickClose] - 快捷关闭的对象
	 * @param {element|string} [op.body]
	 * @param {string|boolean} [op.submit] - submit button 的text 或者不显示
	 * @param {string|boolean} [op.cancel] - cancel button 的text 或者不显示
	 * @param {string|boolean} [op.title] - title bar 的text 或者不显示
	 * @param {function} [op.onclose] - 在关闭时被触发
	 */
	constructor(op = {}, parent)
		
		const shortcuter = new ShortcutKeyEventer()
			
		Object.assign(
			this,
			{
				dom: null,
				shortcuter,
				nodes: {},
				
				// 触发关闭的标识 - [null, submit, cancel, mask, esc, shortcut, parentClose]
				closeKey: null,
				closed: false,
				connected: false,
				display: false,
				
				quickClose: {
					mask: false,
					shortcut: true,
					esc: false,
				},
			},
			assigns({
				token: Date.now().toString(36),
				css: '',
				body: '',
				mask: false,
				animate: false,
				theme: 'default',
				
				title: null,
				submit: null,
				cancel: null,
				
				onclose: null,
			}, op, ['hasKey'])
		)
			
		if op.button !== undefined
			if !op.button
				this.submit = this.cancel = null
			else
				this.submit = '保存'
				this.cancel = '取消'
		
		
		if op.shortcut	
			eachObject(op.shortcut	, (value, key)=> {
				this.shortcut(key, value)
			})
			
		if op.quickClose !== undefined
			if isObject(op.quickClose)
				Object.assign(this.quickClose, op.quickClose)
			else
				eachObject(this.quickClose, (value, key, o)=> {
					o[key] = !!op.quickClose
				})
				
			if isObject(op.quickClose)
				Object.assign(this.quickClose, op.quickClose)
			else
				eachObject(this.quickClose, (value, key, o)=> {
					o[key] = !!op.quickClose
				})
		
		const dom = this.dom = this.appendNode('wrap')
		dom.setAttribute('dialog-token', this.token)
		
		const {nodes, theme} = this
		
		['mask', 'title', 'body', 'submit', 'cancel'].forEach((key)=> {
			let value = this[key]
			if value != null && value !== false
				this.appendNode(key)
				
				const node = nodes[key]
				if value && value.nodeType
					node.appendChild(value)
				else if isString(value)
					node.innerHTML = value
				else if node.tagName === 'BUTTON'
					node.innerHTML = key
		})
		
		if !theme
			nodes.window.removeAttribute('class')
		
		/**
		 * @desc 解析css
		 * @include parseCss addCssWrapper
		 */
		let {css} = this
		if css && nodes.body
			if !css.includes('{')
				css = parseCss(css)
			css = addCssWrapper(css, `[dialog-token=${this.token}]`)
			const node = createStyleNode(css)
			nodes.wrap.appendChild(node)
		
		/**
		 * @desc 获取插入节点的带有标记的节点
		 * @include assignIfNull getNodes
		 */
		assignIfNull(nodes, getNodes(this.dom))
		
		
		const {quickClose} = this
		if quickClose.mask
			if nodes.mask
				nodes.mask.onclick = ()=> this.close('mask')
				
		if quickClose.shortcut
			this.shortcut('shift+w', ()=> this.close('shortcut'))
			
		if quickClose.esc
			this.shortcut('esc', ()=> this.close('esc'))
			
		buttonKeys.forEach((key)=> {
			if nodes[key]
				nodes[key].onclick = ()=> this.close(key)
		})
		
		if !parent
			document.body.appendChild(this.dom)
		
		
	shortcut(...args)
		this.shortcuter.bind(...args)
		
	unshortcut(...args)
		this.shortcuter.unbind(...args)
	
	appendNode(key)
		const {nodes} = this
		let node
		
		if !nodes[key]
			node = createNode(key)
			nodes[key] = node
			node.className = `dialog-role-${key}`
			
			let pNode
			const parentKey = nodeParentMap[key]
			if parentKey
				if !nodes[parentKey]
					this.appendNode(parentKey)
				pNode = nodes[parentKey]
			else
				// pNode = document.body
			if pNode
				pNode.appendChild(node)
		return node
	
	open(dialog)
		if isPureObject(dialog)
			dialog = new this.constructor(dialog, this)
			
		if dialog.connected
			return dialog
			
		Object.assign(dialog, {
			closed: false,
			connected: true,
			parent: this,
		})
		
		dialog.shortcuter.open()
		
		document.body.appendChild(dialog.dom)
		
		this.constructor.push(dialog)
		
		dialog.animateTo(true)
		
		return dialog
	
	/**
	 * @include setNodeDisplay animateNodeStyle
	 */
	show()
		setNodeDisplay(this.dom, true)
		this.animateTo(true)
	/**
	 * @include setNodeDisplay 
	 */
	hide()
		this.animateTo(false, ()=> {
			setNodeDisplay(this.dom, false)
		})
		
	toggle()
		if this.display
			this.hide()
		else
			this.show()
	
	/**
	 * @include removeNode
	 */
	close(closeKey)
		if closeKey
			this.closeKey = closeKey
	
		if this.onclose
			if this.onclose(this) === false
				return
		
		this.animateTo(false, ()=> {
			removeNode(this.dom)
		})
		
		Object.assign(this, {
			closed: true,
			connected: false,
		})
		
		this.shortcuter.close()
		
		const {stacks} = this.constructor
	
		stacks.slice(0).forEach((dialog)=> {
			if dialog.parent === this
				dialog.close('parentClose')
		})
		
		removeArrayValue(stacks, this)
		
	animateTo(isShow, cb)
		this.display = isShow
		if !this.animate
			if cb
				cb()
			return
			
		const {window, mask} = this.nodes
		if window
			if isShow
				window.style.top = '100%'
			animateNodeStyle(window, {
				top: isShow ? 20 : 100,
			}, 80, cb)
		if mask
			animateNodeStyle(mask, {
				opacity: isShow ? 1 : 0,
			}, 80)
		
/**
 * @include addCssNode
 */
addCssNode(`
		
	.wrap
		
	.mask
		position: fixed
		top: 0
		left: 0
		width: 100%
		height: 100%
		background: rgba(0, 0, 0, 0.1)
		
	.window
		position: fixed
		left: 50%
		top: 20%
		transform: translateX(-50%)
		width: 400px;
		// margin: 10% auto 0;
		padding: 15px;
		border: 1px #999 solid;
		box-shadow: 0px 0px 6px rgba(102, 102, 102, 0.48)
		border-radius: 3px;
		background: #fff;
		
	.header
		margin: -5 0 10
			
	.title
		font-size: 16
			
	.body
		color: #666;
		overflow-x: hidden;
		overflow-y: auto;
		
	.buttons
		margin-top: 20px
		text-align: right;
		button
			margin-left: 20px
			
			border: 1px #aaa solid
			color: #333
			background: #fff
			line-height: 2em;
			padding: 0 1em;
			width: auto;
			border-radius: 3px;
			
		.submit
			background: #7d99ec
			border-color: #3a3ed6
			color: #fff
		
`.replace(/(\t|\n|, )\./g, '$1.dialog-role-'))



function createNode(key)
	const tagName = buttonKeys.includes(key) ? 'button' : 'div'
	const node = document.createElement(tagName)
	node.setAttribute('dialog-role', key)
	return node