//#!py
/**
 * @import RangePicker ColorPicker
 * @include xyKeys ltKeys sizeKeys
 */
const types = ['color', 'linear', 'radial']
const typeTitles = ['纯色', '线性渐变', '径向渐变']

class ColorGradientPicker
	constructor(op)
		Object.assign(this, {
			pickers: {},
			dom: null,
			value: null,
			onchange: null,
			// offsets: [0, 100, 50, 1],
			type: 'linear',
			list: [],
			atlas: [
				'["linear",null,[["#f00",0],["#8f0000",1]]]',
				'["radial",[0.59,0.38],[["#0000d1",0],["#00007a",1]]]',
				'["radial",[0.59,0.38],[["#0000d1",0],["#00007a",1]]]',
				'["radial",[0.59,0.38],[["#0000d1",0],["#00007a",1]]]',
				'["radial",[0.59,0.38],[["#0000d1",0],["#00007a",1]]]',
				'["radial",[0.59,0.38],[["#0000d1",0],["#00007a",1]]]',
			],
		}, op)
		
		const colorPicker =  new ColorPicker
		
		colorPicker.onchange = (color)=>
			const {colorIndex, type} = this
			if type === 'color'
				this.value = color
				this.emitChange()
			else
				if colorIndex != null
					this.setColor(color, colorIndex, true)
				
		// this.updateView()
		this.colorPicker = colorPicker
		this.hideColorPicker()
		
		this.createDom()
		this.dom.append(colorPicker.dom)
		
		this.setType(this.type)
		
		if this.value
			this.setValue(this.value)
		// this.updateValueByKey('h', this.hsla[0])
		
	/**
	 * @include hslArray2rgbArray joinColorArray
	 */
	toString(type = this.type)
		const {hsla} = this
		let arr = hsla
		if type !== 'hsl'
			arr = hslArray2rgbArray(hsla)
		return joinColorArray(arr, type, this.nonuseShort).replace(/ /g, '')
	
	showColorPicker()
		this.colorPicker.dom.style.display = ''
	hideColorPicker()
		this.colorPicker.dom.style.display = 'none'
		
	setOrigin(origin, emitChange)
		if this.origin === origin
			return
			
		this.origin = origin
		this.list[1] = origin
		
		const {pickers} = this
		pickers.rotate.setRatio(origin)
		
		this.updateView(emitChange)
	
	setAngle(angle, emitChange)
		if this.angle === angle
			return
			
		this.angle = angle
		this.list[1] = angle
		
		this.updateView(emitChange)
		
		const {nodes} = this
		/**
		 * @include getPointOnRectByAngle getLengthOfTwoPoint
		 */
		const len = getLengthOfTwoPoint(getPointOnRectByAngle([100,100], angle), [50,50]) * 2
		nodes.rotateLine.style.width = len + '%'
		nodes.rotateLine.style.transform = `translate(-50%,-50%) rotate(${angle}deg)`
	
		
	setType(type, emitChange)
		this.type = type
		
		if this.list[0] === type
			return
			
		this.list[0] = type
		
		if type === 'linear'
			this.list[1] = this.angle
		else if type === 'radial'
			this.list[1] = this.origin
			
		this.updateView(emitChange)
		
		const {typeNodes, nodes} = this
		typeNodes.forEach((node, i)=> {
			if types[i] === type
				node.setAttribute('selected', '')
			else
				node.removeAttribute('selected')
		})
		nodes.rotateLine.style.display = type === 'linear' ? 'block' : 'none'
		
		if type === 'color'
			this.showColorPicker()
		else
			this.hideColorPicker()
		
		nodes.wrap.setAttribute('gradient-picker-type', type)
	
	setColor(color, index = 0, emitChange)
		const {colors, colorBlocks, colorHandles} = this
		colors[index] = color
		if !colorBlocks[index]
			this.addColorBlock(1)
		colorBlocks[index].style.background = color
		
		this.updateColorOffsets()
		this.updateView(emitChange)
		
	setOffset(ratio, index = 0, emitChange)
		const {colorHandles} = this
		if !emitChange
			colorHandles[index].style.left = ratio * 100 + '%'
		this.updateColorOffsets()
		this.updateView(emitChange)
		
		
	updateColorOffsets()
		const {offsets, colors} = this
		this.colorOffsets = this.getSortedColorIndexs().map(i=> [colors[i], offsets[i]])
		this.list[2] = this.colorOffsets
	
	getValue()
		
	updateView(emitChange)
		const {colorOffsets, list} = this
		/**
		 * @include toCssGradient
		 */
		 
		const {pickers, nodes, type} = this
		pickers.color.dom.style.background = toCssGradient('linear', 0, colorOffsets)
		pickers.rotate.dom.style.background = toCssGradient(...list)
		
		if emitChange
			this.emitChange()
	
	emitChange()
		const {type} = this
		let rs
		if type === 'color'
			const {value} = this
			rs = value
		else
			const {list} = this
			rs = JSON.stringify(list)
			
		callFunction(this.onchange, rs, this)
	
	
	setValue(value)
		if value === this.value
			return
			
		if value == null
			value = ''
			
		if value.startsWith('[')
			value = JSON.parse(value.replace(/'/g, '"'))
			
		if isArray(value)
			this.setType(value[0])
			if value[0] === 'linear'
				this.setAngle(value[1])
			else
				this.setOrigin(value[1])
			
			value[2].forEach((colorOffset, i)=> {
				if isArray(colorOffset)
					this.setColor(colorOffset[0], i)
					this.setOffset(colorOffset[1], i)
				else
					this.setColor(colorOffset, i)
			})
			const {colorBlocks} = this
			for let i = value[2].length, l = colorBlocks.length; i < l; i++
				this.removeColorBlock(i - 1)
		else
			this.setType('color')
			this.colorPicker.setValue(value)
		
	/**
	 * @include createNode getNodes
	 */
	createDom()
		const {pickers} = this
		const nodes = getNodes(createNode(`<div gradient-picker="wrap">
			<div gradient-picker="types"></div>
			<div gradient-picker="main">
				<div gradient-picker="head">
					<div gradient-picker="preview"></div>
				</div>
				<div gradient-picker="list"></div>
			</div>
		</div>`), 'gradient-picker')
		
		const typeNodes = []
		types.forEach((key, i)=> {
			const node = document.createElement('span')
			node.setAttribute('gradient-type', key)
			node.innerHTML = typeTitles[i]
			nodes.types.appendChild(node)
			typeNodes.push(node)
			node.onclick = ()=> 
				this.setType(key, true)
		})
		
		const dom = nodes.wrap
		
		pickers.rotate = new RangePicker({
			type: 'xy',
			step: [0.1, 0.1],
			onchange: (offset)=> {
				const {type} = this
				
				select type
					case 'linear'
						/**
						 * @include getAngleOfPoint
						 */
						let angle = getAngleOfPoint(offset, [.5, .5])
						const step = 5
						angle = Math.round(angle / step) * step
						
						this.setAngle(angle, true)
						
					case 'radial'
						this.setOrigin(offset, true)
						
				
				this.hideColorPicker()
			},
		})
		nodes.head.appendChild(pickers.rotate.dom)
		
		this.atlas.forEach((value)=> {
			const node = document.createElement('i')
			node.setAttribute('gradient-picker-value', value.replace(/"/g, '"'))
			node.style.background = toCssGradient(...JSON.parse(value))
			nodes.list.appendChild(node)
		})
		nodes.list.onclick = (e)=> 
			if e.target.tagName === 'I'
				this.setValue(e.target.getAttribute('gradient-picker-value'))
		
		const line = document.createElement('i')
		line.setAttribute('gradient-picker', 'rotate-line')
		nodes.head.appendChild(line)
		nodes.rotateLine = line
		
		const colors = ['#f00', '#8f0000']
		const colorBlocks = []
		// Array.from(nodes.colorBlock.getElementsByTagName('i'))
		
		pickers.color = new RangePicker({
			type: 'x',
			limitBySeq: false,
			onchange: (value, op, index)=> {
				// const index = op.handleIndex
				// if colorBlocks[index] === undefined
					// this.addColorBlock(value, colorhandles[index])
				// else
				// console.log(index, value)
				// colorBlocks[index].style.left = op.handles[index].style.left
				// offsets[index] = value
				this.setOffset(value, index, true)
				this.hideColorPicker()
			},
		})
		nodes.head.appendChild(pickers.color.dom)
		const colorHandles = pickers.color.handles
		const offsets = pickers.color.ratios
		
		colorHandles.forEach(node=> node.title = '双击反转颜色序列')
		
			// pickers.color.addHandle(offset)
			
		pickers.color.nodes.track.title = '双击添加颜色'
		pickers.color.dom.ondblclick = (e)=> 
			if e.target.tagName === 'I'
				if colorBlocks.length > 2
					const index = colorBlocks.indexOf(e.target)
					this.removeColorBlock(index)
			else if colorHandles.includes(e.target)
				this.reverseColors()
			else
				if colors.length > 5
					return alert('最多添加5个颜色')
				/**
				 * @include getOffsetFromNodeByPoint
				 */
				const offset = getOffsetFromNodeByPoint(pickers.color.dom, xyKeys.map(key=> e[key]), true)[0].toFixed(2) * 1
				// pickers.color.addHandle(offset)
				this.addColorBlock(offset)
		
		pickers.color.dom.onclick = (e)=> 
			if e.target.tagName === 'I'
				const index = colorBlocks.indexOf(e.target)
				this.colorIndex = index
				const color = colors[index]
				this.colorPicker.setValue(color)
				this.showColorPicker()
		
			
		
		/**
		 * @include generateColorLinearGradientBar
		 */
		// pickers.h.dom.style.background = generateColorLinearGradientBar()
		
		Object.assign(this, {
			dom,
			nodes,
			colors,
			offsets,
			colorHandles,
			colorBlocks,
			typeNodes,
			colorIndex: 0,
		})
		
		pickers.color.removeHandle(0)
		this.addColorBlock(0)
		this.addColorBlock(1)
		
			
	reverseColors()
		const {colorBlocks, colors} = this
		const sortedIndexs = this.getSortedColorIndexs()
		const sortedColors = sortedIndexs.map(index=> colors[index])
		sortedColors.reverse()
		sortedIndexs.forEach((index, i)=> colorBlocks[index].style.background = colors[index] = sortedColors[i])
		this.updateColorOffsets()
		this.updateView()
	
	removeColorBlock(index, emitChange)
		const {colorBlocks, colors, pickers} = this
		/**
		 * @include removeNode
		 */
		// removeNode(colorBlocks[index])
		colorBlocks.splice(index, 1)
		colors.splice(index, 1)
		pickers.color.removeHandle(index)
		
		this.updateColorOffsets()
		this.updateView()
			
			
	addColorBlock(offset, emitChange)
		const node = document.createElement('i')
		node.title = '点击修改颜色\n双击删除'
		
		const {pickers, colorHandles, colorBlocks, colors} = this
		pickers.color.addHandle(offset)
		const index = colorHandles.length - 1
		
		this.colorIndex = index
		colorHandles[index].appendChild(node)
		colorBlocks[index] = node
		
		colorHandles[index].title = colorHandles[0].title
			
		const sortedIndexs = this.getSortedColorIndexs()
		const sortedIndex = sortedIndexs.indexOf(index)
		const color = colors[index] || colors[sortedIndexs[sortedIndex - 1]] || colors[sortedIndexs[sortedIndex + 1]]
		this.setColor(color || '#000', colorBlocks.length - 1)
		this.showColorPicker()
		
	getSortedColorIndexs(withOffset)
		const {offsets} = this
		const indexs = offsets.map((v,i)=> [i,v]).sort((p, n)=> p[1] > n[1])
		if !withOffset
			indexs.forEach((v, i)=> indexs[i] = v[0])
			
		return indexs

/**
 * @include createNode
 */
function createNodeByColors(colors)
	return colors.map((color)=> createNode(`<i title="${color}" gradient-picker-color="${color}" style="background-color: ${color}"></i>`))
		
	
		
/**
 * @include addStyleNode
 */
addStyleNode(`
[gradient-picker=wrap]{
    position: relative;
	margin: 0 auto;
    width: 200px;
	
    top: 10%;
}
[gradient-picker=preview], [gradient-picker=a], [gradient-picker-color=transparent]{
	background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="#ccc"><rect x="0" y="0" width="50%" height="50%"/><rect x="50%" y="50%" width="50%" height="50%"/></svg>');
	background-size: 12px;
}

[gradient-picker=main]{
    position: relative;
    background: #fff;
    border-radius: 4px;
	box-shadow: 1px 1px 4px #666;
    overflow: hidden;
}
[gradient-picker=head]{
    position: relative;
    height: 200px;
}
[gradient-picker=head] [range-picker-type="xy"] [range-picker=handle]{
    left: 50%;
    top: 50%;
}
[gradient-picker=head] [range-picker-type=x]{
    box-shadow: 0 0 3px #555;
    border: 1px #ccc solid;
    height: 12px;
    border-radius: 8px;
    position: absolute;
    bottom: 20px;
    left: 10px;
    right: 10px;
    width: unset;
    transition: .3s;
}
[gradient-picker=head] [range-picker-type=x] [range-picker=handle]{
    width: 16px;
    height: 16px;
	background: #fff;
}
[gradient-picker=head] [range-picker-type=x] [range-picker=track]{
    margin: 0 8px;
}
[range-picker=handle] i{
    position: absolute;
    width: 12px;
    height: 12px;
    border-radius: 2px;
    transform: translateX(-50%);
    border: 2px #999 solid;
    cursor: pointer;
    left: 50%;
    top: -24px;
}
[range-picker=handle] i:after {
    content: '';
    display: block;
    margin-top: 100%;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid #999;
}

[gradient-picker=rotate-line]{
    position: absolute;
	background: #333;
	height: 1px;
    width: 100%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: none;
}
[gradient-picker=rotate-line]:before, [gradient-picker=rotate-line]:after{
    content: '';
    position: absolute;
	width: 8px;
	height: 1px;
	background: #333;
	right: 0;
    transform-origin: right;
    transform: rotate(-40deg);
}
[gradient-picker=rotate-line]:before{
    transform: rotate(40deg);
}

[gradient-picker=types]{
    border-radius: 10px;
    overflow: hidden;
    font-size: 0;
    text-align: center;
    margin-bottom: 10px;
}
[gradient-picker=types] span{
    display: inline-block;
    width: 33.33%;
    background: #d2d2d2;
    color: #676767;
    cursor: pointer;
    font-size: 12px;
    line-height: 22px;
	
}
[gradient-picker=types] span[selected]{
    background: #676767;
    color: #fff;
}

[gradient-picker=preview]{
    position: absolute;
	width: 100%;
	height: 100%;
}
[gradient-picker=list]{
    padding: 4px;
    background: #fff;
}
[gradient-picker=list] i{
    width: 22px;
    height: 22px;
    display: inline-block;
    margin: 5px;
    cursor: pointer;
    border-radius: 2px;
}

[gradient-picker=colorBlock]{
    position: relative;
    height: 22px;
    margin: 0 6px;
}
[gradient-picker=wrap] [color-picker=wrap] {
    position: absolute;
    left: 102%;
    top: 0;
}
[gradient-picker-type=color] [color-picker=wrap] {
    position: relative;
	left: 0;
}
[gradient-picker-type=color] [gradient-picker=main] {
    display: none;
}
[gradient-picker-type=linear] [gradient-picker=rotate-line]{ {
    display: block;
}
`)