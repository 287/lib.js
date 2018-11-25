//#!py
/**
 * @import FontFamilySize
 * @export SvgNodes
 * @include svgNodeKeys xyKeys ltKeys sizeKeys rectKeys transformKeys linePointKeys
 */
const imageOptions = {
	layout: {
		fit: 'meet',
		cut: 'slice',
		fill: 'none',
	},
	align: {
		center: 'xMidYMid',
		left: 'xMinYMid',
		right: 'xMaxYMid',
		top: 'xMidYMin',
		bottom: 'xMidYMax',
	},
}

const defaultAttrValues = {
	common: {
		transition: 0,
		display: true,
		left: 0,
		top: 0,
	},
	image: {
		layout: 'fill',
		align: 'center',
	},
	text: {
		fontSize: 12,
		fontFamily: '',
		color: '#333',
		fill: 'transparent',
		// pointerEvents: 'visible',
	},
	line: {
		strokeWidth: 2,
	},
	ring: {
		fillRule: 'evenodd',
	},
	layer: {
		overflow: true,
	},
}
const defaultSetValue = {
	common: [],
	image: ['layout'],
	text: ['fontSize', 'color', 'fill'],
	line: ['strokeWidth'],
	ring: ['fillRule'],
	layer: ['overflow'],
}
const nodeSubtypes = {
	shape: ['circle', 'ring', 'sector', 'polygon', 'isogon'],
	rect: ['rect', 'image', 'text', 'foreign', 'layer', 'root'],
}
	

class SvgNode
	static updateViewNodes = new Set
	/**
	 * @include concatTimeout
	 */
	static updateView = concatTimeout(function(){
		const {updateViewNodes} = this
		updateViewNodes.forEach((node)=> {
			// console.log(node, JSON.stringify(node.conf.deals), JSON.stringify(node.conf.attrs))
			node.updateDOM()
				
			updateViewNodes.delete(node)
		})
	})
	
	static updateNodeView(node)
		this.updateViewNodes.add(node)
		this.updateView()
	
	constructor(op)
		/**
		 * @include eachObjectFindKey
		 */
		const type = this.constructor.name.toLowerCase()
		const subtype = eachObjectFindKey(nodeSubtypes, types=> types.includes(type)) || type
		const generateMode = ['text', 'line'].includes(type) || subtype === 'shape'
		const dom = this.createDOM(type)
		
		Object.assign(this, {
			dom,
			conf: {
				type,
				subtype,
				generateMode,
				// changes: {},
				// updateView: concatTimeout(()=> this.updateDOM(), 200),
				changes: {},
				attrs: {},
				deals: {
					// transform: false,
					// generate: false,
					// offset: false,
					// resize: false,
					// update: false,
				},
				translateOffset: !['rect', 'image', 'foreign'].includes(type),
				translateOrigin: 'width' in this,
				hasTransform: false,
				allowTransition: true,
				transforms: {
					// offset
					// orgin
				},
				onupdateview: null,
			},
		})
		
		['common', type].forEach((type)=> {
			if defaultSetValue[type]
				defaultSetValue[type].forEach((key)=> this.updateAttr(key, this[key]))
		})
		
		if type === 'line'
			const {attrs} = this.conf
			attrs.points = []
			linePointKeys.forEach((key, i)=> {
				attrs.points[i] = attrs[key] = [0, 0]
			})
			
		
		this.assign(op)
		
		this.createDOM()
		
		
	/**
	 * @desc 更新修改至dom
	 */
	updateDOM()
		const {conf: op, dom} = this
		const {type, subtype, translateOffset, translateOrigin, hasTransform, deals, attrs, changes, onupdateview} = this.conf
		const transforms = []
			
		
		// let originOffset
		/**
		 * @include isEmptyObject
		 */
		// const hasTansform = !isEmptyObject(transforms)
		
		let applyTransform
		// = hasTransform || deals.transform
		
		if deals.offset
			if translateOffset
				applyTransform = true
			else
				deals.update = true
				
				if hasTransform || deals.transform
					applyTransform = true
				
		if deals.resize
			deals.update = true
			
			if translateOrigin
				if hasTransform || deals.transform
				// if translateOrigin
					applyTransform = true
			// else
		if deals.transform
			applyTransform = true

		if applyTransform
			if translateOffset
				const offsetKeys = subtype === 'shape' ? xyKeys : ltKeys
				const offset = offsetKeys.map(key=> attrs[key])
				if !(offset[0] === offset[1] && offset[0] === 0)
					transforms.push(['translate', offset])
				
			// if translateOrigin
				// originOffset = sizeKeys.map(key=> attrs[key] / 2)
				// if !translateOffset
					// /**
					 // * @include eachArraySet
					 // */
					// eachArraySet(originOffset, (value, i)=> value + attrs[ltKeys[i]])
					
				// transforms.push(['translate', originOffset])
				
		if applyTransform
			['translate', 'rotate', 'scale'].forEach(key=> {
				let value = attrs[key]
				
				if value != null
					op.hasTransform = true
					
					let originOffset
					
					select key
						case 'translate'
							if value[0] === value[1] && value[0] === 0
								return
								
						case 'rotate'
							if value === 0
								return
							if translateOrigin
								value = [value, ...getOriginOffset()]
						
						case 'scale'
							if value[0] === value[1]
								return
							if translateOrigin
								originOffset = getOriginOffset()
								transforms.push(['translate', originOffset])
								
					transforms.push([key, value])
					
					if originOffset
						transforms.push(['translate', originOffset.map(v=> -v)])
						
			})
		
		function getOriginOffset()
			const offset = attrs.origin || sizeKeys.map(key=> attrs[key] / 2)
			if !translateOffset
				/**
				 * @include eachArraySet ltKeys
				 */
				eachArraySet(offset, (value, i)=> value + attrs[ltKeys[i]])
			return offset
			
			
		if applyTransform
			// for let i = 0; i < transforms.length; i++
				// const [key, value] = transforms[i]
				
			// transforms && transforms.length
			changes.transform = transforms.length === 0 ? '' : transforms.map(([key, value])=> `${key}(${value})`).join(' ')
			deals.update = true
		
			// op.hasTransform = applyTransform
			
		if deals.generate
			if subtype === 'shape'
				/**
				 * @include generateShapePath
				 */
				changes.path = generateShapePath(type, attrs, true)
				deals.update = true
			
			else if type === 'line'
				/**
				 * @include generateLinePath
				 */
				changes.path = generateLinePath(attrs.startsPoint, attrs.endsPoint, attrs)
				deals.update = true
				
			else if type === 'text'
				this.updateTextView()
				
			if changes.path
				attrs.path = changes.path
				
		// if 
		
		// eachObject(translates, (translate)=> {
			// transforms.push(['translate', ...translate])
		// })
		
		// if deals.transform || hadTransform
			// if translateOrigin
				// translates.origin = sizeKeys.map(key=> attrs[key] / 2)
			
		
		// if deals.transform
			// ['translate', 'rotate', 'scale'].forEach(key=> {
				// const value = attrs[key]
				
				// if value != null
					// op.hadTransform = true
					// transforms.push([key, value])
			// })
			// deals.update = true
			
		// if translates.origin
			// transforms.push(['translate', ...translates.origin.map(v=> -v)])
			
		// if transforms.length > 0
			// deals.update = true
			
		/**
		 * @include setSvgNodeStyle eachObjectFilter
		 */
		if deals.update
			if onupdateview
				onupdateview(changes)
				
			if type === 'layer'
				if 'overflow' in changes
					if changes.overflow
						/**
						 * @include insertNodeAfter
						 */
						insertNodeAfter(dom.clipPath, dom.rect)
						dom.setAttribute('clip-path', `url(#${dom.clipPath.id})`)
					else
						dom.removeAttribute('clip-path')
						/**
						 * @include removeNode
						 */
						removeNode(dom.clipPath)
					
					delete changes.overflow
						
				const subchanges = eachObjectFilter(changes, (value, key)=> {
					if ['fill', 'stroke', 'size'].some(nodeKey=> svgNodeKeys[nodeKey].includes(key))
						delete changes[key]
						return true
				})
				setSvgNodeStyle(dom.rect, subchanges)
				
			else if type === 'image'
				if changes.layout || changes.align
					delete changes.layout
					delete changes.align
					changes.preserveAspectRatio = this.layout === 'fill' ? imageOptions.layout[this.layout] : `${imageOptions.align[this.align]} ${imageOptions.layout[this.layout]}`
					
			else if type === 'text'
				/**
				 * @include eachObjectFilter
				 */
				const subchanges = eachObjectFilter(changes, (value, key)=> {
					if ['size', 'fill', 'stroke'].some(nodeKey=> svgNodeKeys[nodeKey].includes(key))
						delete changes[key]
						return true
				})
				if 'fill' in subchanges && !subchanges.fill
					subchanges.fill = 'transparent'
				setSvgNodeStyle(dom.rect, subchanges)
				
				
		
			/**
			 * @include toSvgPath
			 */
			if changes.path
				changes.path = toSvgPath(changes.path)
				if changes.path === ''
					delete changes.path
				else
					deals.update = true
					
			// if transforms.length > 0
				// const matrix = concatStyleTransform(transforms)
				// changes.transform = `matrix(${matrix})`
				
			setSvgNodeStyle(dom, changes)
			
			/**
			 * @include emptyObject
			 */
			emptyObject(changes)
			emptyObject(deals)
		
	updateView()
		this.constructor.updateNodeView(this)
	
	getAttr(key)
		const {attrs, type} = this.conf
		let value = attrs[key]
		if value === undefined
			if defaultAttrValues[type] !== undefined
				value = defaultAttrValues[type][key]
			if value === undefined
				value = defaultAttrValues.common[key]
				
		return value
		
	/**
	 * @include 
	 */
	updateAttr(key, value)
		const {type, subtype, translateOffset, generateMode, changes, attrs, deals} = this.conf
		let ignoreChange = false
		
		if transformKeys.includes(key)
			ignoreChange = true
			deals.transform = true
			if ['translate', 'scale'].includes(key)
				if !isArray(value)
					value = [value, value]
				attrs[key] = value
				
		else if transformKeys.includes(key.slice(0, -1))
			ignoreChange = true
			deals.transform = true
			
			const transformKey = key.slice(0, -1)
			const index = key.slice(-1) === 'X' ? 0 : 1
			if !attrs[transformKey]
				const defaultValue = transformKey === 'scale' ? 1 : 0
				attrs[transformKey] = [defaultValue, defaultValue]
			attrs[transformKey][index] = value
			delete attrs[key]
			
		else if ltKeys.includes(key) || xyKeys.includes(key)
			deals.offset = true
			if translateOffset
				ignoreChange = true
				
		else if sizeKeys.includes(key)
			deals.resize = true
			
			if type === 'text'
				deals.generate = true
		
		else if generateMode && svgNodeKeys[type].includes(key)
			deals.generate = true
			ignoreChange = true
			
			if key === 'fontSize'
				ignoreChange = false
				deals.update = true
			
			else if type === 'line'
				let index
				index = linePointKeys.indexOf(key)
				if index > -1
					attrs.points[index] = attrs[key] = value
				else 
					index = linePointKeys.indexOf(key.slice(0, -1))
					if index > -1
						const xyIndex = key.slice(-1) === 'X' ? 0 : 1
						attrs[linePointKeys[index]][xyIndex] = value
			
		else
			deals.update = true
		
			if type === 'image' && imageOptions[key]
				if !imageOptions[key][value]
					delete attrs[key]
		
		if !ignoreChange
			changes[key] = value
		
		this.updateView()
			
			
	setAttr(key, value)
		const {attrs, allowTransition} = this.conf
		
		if attrs[key] === value
			return
			
		const lastValue = attrs[key]
		attrs[key] = value
		
		/**
		 * @include isNumber
		 */
		if allowTransition && this.transition && isNumber(value) && (isNumber(lastValue) || !lastValue) && !['Mode', 'Type'].some(str=> key.includes(str))
			/**
			 * @include animateRunByValue
			 */
			animateRunByValue(lastValue || 0, value, this.transition, (value, percent)=> {
				attrs[key] = value
				this.updateAttr(key, value)
			})
		else
			this.updateAttr(key, value)
		
		return value
		
	canInsert()
		const {type} = this.conf
		return ['root', 'layer', 'group'].includes(type)
		
	before(node)
		const target = node.dom || node
		const {dom} = this
		/**
		 * @include insertNodeBefore
		 */
		insertNodeBefore(target, dom)
	
	after(node)
		const target = node.dom || node
		const {dom} = this
		/**
		 * @include insertNodeAfter
		 */
		insertNodeAfter(target, dom)
	
	append(node)
		const target = node.dom || node
		if this.canInsert()
			const {dom} = this
			dom.appendChild(target)
		
	prepend(node)
		const target = node.dom || node
		if this.canInsert()
			const {dom} = this
			const {childNodes} = dom
			let len = 0
			while childNodes[len] && childNodes[len].private
				len++
			
			/**
			 * @include insertNodeAfter insertNodePrepend
			 */
			if len === 0
				insertNodePrepend(target, dom)
			else
				insertNodeAfter(target, childNodes[len - 1])
	
	/**
	 * @include createSvgNode
	 */
	createDOM(type)
		let dom
		select type
			case 'rect'
				dom = createSvgNode('rect')
			case 'text'
				dom = createSvgNode('g')
				const rect = createSvgNode('rect')
				dom.appendChild(rect)
				rect.private = true
				
				Object.assign(dom, {
					rect,
					texts: [],
				})
			case 'image'
				dom = createSvgNode('image')
			case 'group'
				dom = createSvgNode('g')
			case 'layer'
				dom = createSvgNode('g')
				const rect = createSvgNode('rect')
				const clipPath = createSvgNode('clipPath')
				rect.private = clipPath.private = true
				
				/**
				 * @include random
				 */
				const id = random().toString(36)
				const rectId = `layer-rect-${id}`
				const clipPathId = `layer-clip-${id}`
				
				const use = createSvgNode('use')
				use.setAttribute('href', `#${rectId}`)
				rect.setAttribute('id', rectId)
				clipPath.setAttribute('id', clipPathId)
				
				clipPath.appendChild(use)
				dom.appendChild(rect)
				
				Object.assign(dom, {
					rect,
					clipPath,
				})
				
			case 'root'
				dom = createSvgNode('svg')
				dom.setAttribute('fill', 'transparent')
				dom.setAttribute('stroke', 'transparent')
			case 'foreign'
				dom = createSvgNode('foreignObject')
				const body = document.createElementNS("http://www.w3.org/1999/xhtml", 'div')
				body.setAttribute('xmlns', "http://www.w3.org/1999/xhtml")
				// dom.setAttribute('requiredExtensions', "http://www.w3.org/1999/xhtml")
				
				Object.assign(body.style, {
					width: '100%',
					height: '100%',
				})
				dom.body = body
				dom.appendChild(body)
			case 'placeholder'
				dom = document.createTextNode('')
			default
				dom = createSvgNode('path')
			
		if type !== dom.tagName && !['root', 'placeholder'].includes(type)
			dom.setAttribute('type', type)
		
		dom.node = this
		
		return dom


	/**
	 * @include getObjectByKeys
	 */
	getDomRect()
		const op = this.dom.getBoundingClientRect()
		return getObjectByKeys(op, rectKeys)
		
	getRect()
	
		
	assign(op)
		if !op
			return
			
		eachObject(op, (value, key)=> {
			if key in this
				this.setAttr(key, value)
		})

	updateTextView()
		let {dom, text, lineHeight, fontSize} = this
		
		/**
		 * @include removeNode
		 */
		dom.texts.forEach(dom=> removeNode(dom))
		
		if text == null
			return
			
		text = text.toString()
			
		const fonter = new FontFamilySize(this)
		/**
		 * @include generateTextLayoutData
		 */
		const {texts, widths, offsets, offsetTop} = generateTextLayoutData(text, this, {
			getTextWidth: (text)=> fonter.getTextWidth(text) * fontSize,
			splitTextByWidth: (text, width)=> fonter.splitTextByWidth(text, width / fontSize),
		})
		// console.log({texts, widths, offsets, offsetTop})
		
		/**
		 * @include setSvgNodeStyle
		 */
		lineHeight = lineHeight || fontSize
		for let i = 0; i < texts.length; i++
			const tspan = createSvgNode('text')
			setSvgNodeStyle(tspan, {
				x: offsets[i],
				y: offsetTop + fontSize * .85 + lineHeight * i,
				text: texts[i],
				whiteSpace: 'pre',
				pointerEvents: 'none',
			})
			dom.texts.push(tspan)
			dom.appendChild(tspan)

<<<//#!py
/**
 * @include svgNodeAllKeys eachObject toCapitalize
 */
const nodes = []

let content = ''

eachObject(svgNodeAllKeys, (attrs, type)=> {
	const className = toCapitalize(type)
	nodes.push(`${type}: ${className}`)
	
	content += `
class ${className} extends SvgNode
	constructor(...args)
		super(...args)
	`
})

content += `
const SvgNodes = {
	${nodes},
}
`
return content
>>>

/**
 * @include svgNodeAllKeys
 */
eachObject(SvgNodes, (Node, type)=> {
	svgNodeAllKeys[type].forEach((key)=> {
		Object.defineProperty(Node.prototype, key, {
			get: function(){
				return this.getAttr(key)
			},
			set: function(value){
				return this.setAttr(key, value)
			},
		})
	})
})

// for( let i = 0; i < 1000; i++)
	

// time = Date.now()
// for( let i = 0; i < 1000; i++) $0.getBoundingClientRect()
// console.log(Date.now() - time)

// this.r = '100%'