//#!py
/**
 * @desc 获取字体相关的单位宽度
 * @desc 单位宽度 * 字号 = 显示宽度
 * @export FontFamilySize
 * @param {string|object} fontFamily
 */
class FontFamilySize
	/**
	 * @include isString isObject
	 * @param {string|object} fontFamily
	 */
	constructor(fontFamily)
		this.sizeMap = {}
		this.height = 1
		this.querier = ''
		
		if isString(fontFamily)
			this.setFontFamily(fontFamily)
		else if isObject(fontFamily)
			this.setStyle(fontFamily)
		
	/**
	 * @desc 设置样式
	 * @param {object} style
	 * @return {undefined}
	 */
	setStyle(style)
		this.setFontFamily(style.fontFamily)
		this.querier = (style.bold ? 'b' : '') + (style.italic ? 'i' : '')
		return this
		
		
	/**
	 * @desc 获取字符的单位宽度
	 * @param {string} chr
	 * @return {number}
	 */
	getCharWidth(chr)
		const map = this.sizeMap[this.querier]
		return map[chr] != null ? map[chr] : chr.charCodeAt(0) > 10000 ? map['\u4e2d'] : 0
		
	/**
	 * @desc 获取字符串的单位宽度
	 * @param {string} text
	 * @param {object} op
	 * @param {string} op.fontFamily
	 * @param {number} op.fontSize
	 * @param {boolean} [op.bold = false]
	 * @param {boolean} [op.italic = false]
	 * @return {object}
	 */
	getTextWidth(text)
		let width = 0
		for let i = 0, l = text.length; i < l; i++
			width += this.getCharWidth(text[i])
		return width
		
	/**
	 * @desc 按照单位宽度将字符串拆分成多行数组
	 * @param {string} text
	 * @param {number} lineWidth - 单行最大单位宽度
	 * @param {boolean} [withWidths] - 是否带有每行单位宽度的数组
	 * @return {array<number|array>}
	 */
	splitTextByWidth(text, lineWidth, withWidths, limit)
		let texts = []
		let widths = []
		let width = 0
		let start = 0
		
		for let i = 0, l = text.length; i < l; i++
			let chr = text[i]
			let skip = 0
			let breakLine = false
			let chrWidth
			
			if chr === '\r'
				skip = 1
				if text[i + 1] === '\n'
					skip = 2
				chrWidth = 0
				breakLine = true
			else if chr === '\n'
				skip = 1
				chrWidth = 0
				breakLine = true
			else
				chrWidth = this.getCharWidth(chr)
				width += chrWidth
				if width > lineWidth
					breakLine = true
			if breakLine
				texts.push(text.slice(start, i))
				widths.push(width)
				
				width = chrWidth
				if skip
					i += skip - 1
					start = i + 1
				else
					start = i
				
				if limit && widths.length >= limit
					break
		
		texts.push(text.slice(start))
		widths.push(width)
		
		return withWidths ? [texts, widths] : texts
		
	/**
	 * @desc 缓存字符尺寸
	 * @param {string} fontFamily
	 * @return {undefined}
	 */
	setFontFamily(fontFamily)
		const caches = FontFamilySize.caches
		let sizeMap = caches[fontFamily]
		if !sizeMap
			sizeMap = caches[fontFamily] = {}
		
			// create chr list
			const chrs = ['\u4e2d'];
			for let i = 1; i <= 127; i++
				chrs.push(String.fromCharCode(i))
			
			// create query node
			const fontSize = 100
			const node = document.createElement('textspan')
			document.body.appendChild(node)
			Object.assign(node.style, {
				display: 'inline',
				fontSize: fontSize + 'px',
				fontFamily: fontFamily,
				whiteSpace: 'pre',
				tabSize: 4,
			});
			
			// calc size
			[false, true].forEach((bold, i, arr)=>{
				arr.forEach((italic)=>{
					let type = ''
					if bold
						node.style.fontWeight = 'bold'
						type += 'b'
					if italic
						node.style.fontStyle = 'italic'
						type += 'i'
		
					const map = sizeMap[type] = {}
					
					chrs.forEach((chr, i)=>{
						node.innerHTML = chr
						const op = node.getBoundingClientRect()
						map[chr] = op.width / fontSize
						if i === 0
							sizeMap.height = op.height / fontSize
					})
				})
			})
			node.parentNode.removeChild(node)
			
			setTimeout(()=>{
				delete caches[fontFamily]
			}, 3 * 60 * 1000)
			
		this.sizeMap = sizeMap
		this.height = sizeMap.height
		return this
		
FontFamilySize.caches = {}