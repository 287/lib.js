//#!py
/**
 * @import RangePicker 
 * @include xyKeys ltKeys sizeKeys
 */
const hslaKeys = 'hsla'.split('')
const hslaDefault = [0, 100, 50, 100]

class ColorPicker
	constructor(op)
		Object.assign(this, {
			pickers: {},
			dom: null,
			value: null,
			onchange: null,
			hsla: [0, 100, 50, 1],
			type: 'hex',
			nonuseShort: false,
			colors: ['transparent', '#fff', '#eee', '#aaa', '#666', '#333', '#000', '#fff', '#eee', '#aaa', '#666', '#333', '#000'],
			/**
			 * @include commonColors
			 */
			atlas: commonColors,
		}, op)
		
		this.createDom()
		// this.updateView()
		
		if this.value
			this.setValue(this.value)
		this.updateValueByKey('h', this.hsla[0])
		
	/**
	 * @include hslArray2rgbArray joinColorArray
	 */
	toString(type = this.type)
		const {hsla} = this
		let arr = hsla
		if type !== 'hsl'
			arr = hslArray2rgbArray(hsla)
		return joinColorArray(arr, type, this.nonuseShort).replace(/ /g, '')
	
	// emitChange(color)
		// const {value, nodes, onchange} = this
		// if value === color
			// return
		// nodes.value.value = color
		// this.
	
	// updateView()
		// const {hsla, pickers, nodes} = this
		// hslaKeys.forEach((key, i)=> {
			// pickers[key].value = hsla[i]
			// inputs[key].value = hsla[i]
		// })
		// nodes.type.innerHTML = this.type
		// this.updateValueByKey('h', hsla[0])
	
	
	updateValueByKey(key, value, emitChange)
		const {hsla, nodes, pickers, onchange} = this
		
		if key.length === 1
			const index = hslaKeys.indexOf(key)
			hsla[index] = value
			
			if key === 'h'
				pickers.sl.dom.style.background = `linear-gradient(to right, hsl(${hsla[0]}, 0%, 50%, 0), hsl(${hsla[0]}, 100%, 50%, 1))`
		else
			hsla[1] = value[0]
			hsla[2] = value[1]
				
		if emitChange
			value = this.toString()
			if this.value !== value
				this.value = value
				this.updateView(emitChange)
	
	setValueByKey(key, value)
		const {hsla, nodes, pickers, onchange} = this
		
		
		select key
			case 'h'
			case 'a'
				const index = hslaKeys.indexOf(key)
				hsla[index] = value
				pickers[key].setValue(value)
				
				if key === 'h'
					this.updateValueByKey('h', value)
					
			case 'sl'
				hsla[1] = value[0]
				hsla[2] = value[1]
				
				
				/**
				 * @include hslArray2hsvArray
				 */
				const sv = hslArray2hsvArray([0].concat(value)).slice(1)
				
				pickers.sl.setValue(sv)
	
	setValue(value, emitChange)
		if !value
			return
		
		if this.value === value
			return
			
		// if value
		const {hsla, nodes, pickers} = this
		
		/**
		 * @include getColorTypeFromString getColorArrayFromString
		 */
		this.type = getColorTypeFromString(value)
		const arr = getColorArrayFromString(value, 'hsl', true)
		/**
		 * @include isPureNumber
		 */
		if arr.some(v=> !isPureNumber(v)) && arr.length > 2
			return
			
		
		this.value = value
		
		this.setValueByKey(hslaKeys[0], arr[0])
		this.setValueByKey(hslaKeys[3], arr[3] == null ? 1 : arr[3])
		this.setValueByKey('sl', arr.slice(1, 3))
		
		nodes.type.innerHTML = this.type
		
		this.updateView(emitChange)
		
			
	updateView(emitChange)
		const {value, nodes} = this
		nodes.preview.childNodes[0].style.backgroundColor = value
		nodes.value.value = value
	
		if emitChange
		
			this.emitChange(value)
			
		
		
	/**
	 * @include callFunction
	 */
	emitChange(value)
		const {onchange} = this
		callFunction(onchange, value, this)
	
	/**
	 * @include createNode getNodes
	 */
	createDom()
		const {pickers} = this
		const nodes = getNodes(createNode(`<div color-picker="wrap">
			<div color-picker="head"></div>
			<div color-picker="main">
				<div color-picker="item">
					<div color-picker="preview"><i></i></div>
					<div color-picker="range"></div>
				</div>
				<div color-picker="item">
					<input color-picker="value">
					<button color-picker="type"></button>
				</div>
			</div>
		</div>`), 'color-picker')
		
		const dom = nodes.wrap
		
		nodes.value.oninput = ()=> this.setValue(nodes.value.value)
		nodes.value.onchange = ()=> {
			this.setValue(nodes.value.value, true)
		}
		nodes.value.ondblclick = ()=> {
			nodes.value.select()
		}
		nodes.type.onclick = ()=> {
			/**
			 * @include colorTypes
			 * @include getNextValueFromArrayByDirectionKey parseColorString
			 */
			const type = getNextValueFromArrayByDirectionKey(colorTypes, this.type)
			this.type = type
			nodes.type.innerHTML = type
			
			let color = nodes.value.value
			if color
				this.value = parseColorString(color, type)
				this.updateView(true)
		}
		nodes.type.innerHTML = this.type
		
		
		const picker = new RangePicker({
			type: 'xy',
			range: [
				[0, 100],
				[100, 0],
			],
			step: 1,
			onchange: (sv)=> {
				/**
				 * @include hsvArray2hslArray
				 */
				const sl = hsvArray2hslArray([0].concat(sv)).slice(1)
				this.updateValueByKey('sl', sl, true)
			},
		})
		pickers.sl = picker
		nodes.head.appendChild(picker.dom)
		
		['h', 'a'].forEach((key)=> {
			const picker = new RangePicker({
				type: 'x',
				range: key === 'h' ? [360, 0] : [0, 1],
				step: key === 'h' ? 1 : 0.01,
				onchange: (value)=> {
					this.updateValueByKey(key, value, true)
				},
			})
			pickers[key] = picker
			picker.dom.setAttribute('color-picker', key)
			nodes.range.appendChild(picker.dom)
			if key === 'a'
				picker.nodes.handle.style.left = '100%'
		})
		
		const {colors, atlas} = this
		if colors
			const listNode = createNode(`<div color-picker="list"></div>`)
			createNodeByColors(colors).forEach(node=> listNode.appendChild(node))
			dom.appendChild(listNode)
			
		if atlas
			const atlasNode = createNode(`<div color-picker="atlas"></div>`)
			const atlaSwitch = createNode(`<div color-picker="atlaSwitch"></div>`)
			atlaSwitch.title = '色卡'
			atlaSwitch.onclick = ()=> {
				if atlasNode.style.top === ''
					atlasNode.style.top = 0
				else
					atlasNode.style.top = ''
			}
			dom.appendChild(atlasNode)
			dom.appendChild(atlaSwitch)
			
			const titles = []
			const atlaNodes = []
			atlas.forEach(([title, list], i)=> {
				titles.push(title)
				
				const listNode = createNode(`<div color-picker="list"><span>${title}</span></div>`)
				atlaNodes.push(listNode)
				createNodeByColors(list).forEach(node=> listNode.appendChild(node))
				atlasNode.appendChild(listNode)
			})
			/**
			 * @include createSelectNodeByArray
			 */
			titles.unshift('全部')
			const titleSelect = createSelectNodeByArray(titles)
			titleSelect.onchange = ()=> {
				const index = titleSelect.value * 1
				atlaNodes.forEach((node, i)=> {
					node.style.display = !index || i === index - 1 ? 'block' : 'none'
					node.childNodes[0].style.display = !index ? 'block' : 'none'
				})
			}
			atlasNode.appendChild(titleSelect)
			atlaNodes.forEach(node=> atlasNode.appendChild(node))
			
		nodes.wrap.onclick = (e)=> {
			const {target} = e
			const color = target.getAttribute('color-picker-color')
			if color
				this.setValue(color, true)
		}
		/**
		 * @include generateColorLinearGradientBar
		 */
		pickers.h.dom.style.background = generateColorLinearGradientBar()
		
		Object.assign(this, {
			dom,
			nodes,
		})

/**
 * @include createNode
 */
function createNodeByColors(colors)
	return colors.map((color)=> createNode(`<i title="${color}" color-picker-color="${color}" style="background-color: ${color}"></i>`))
		
	
		
/**
 * @include addStyleNode
 */
addStyleNode(`
[color-picker=wrap]{
    position: relative;
	margin: 0 auto;
    width: 200px;
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
	box-shadow: 1px 1px 4px #666;
}
[color-picker=preview], [color-picker=a], [color-picker-color=transparent]{
	background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="#ccc"><rect x="0" y="0" width="50%" height="50%"/><rect x="50%" y="50%" width="50%" height="50%"/></svg>');
	background-size: 12px;
}
[color-picker=head]{
    height: 100px;
}
[color-picker=head] > div::before{
	content: '';
	display: block;
	width: 100%;
	height: 100%;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1));
    position: absolute;
}
[color-picker=main]{
    position: relative;
	margin: 15px 10px;
}
[color-picker=item]{
    margin-bottom: 15px;
}
[color-picker=range]{
    margin-left: 50px;
}
[color-picker=range] > div{
	margin-bottom: 8px;
}
[color-picker=range] [range-picker=handle]{
    background: #fff;
    width: 14px;
    height: 14px;
    box-shadow: 0 0 3px #333;
    border: 0;
}
[color-picker=range] [range-picker=wrap]:last-child{
    background-color: transparent;
}
[color-picker=range] [range-picker=wrap]:last-child:before{
	content: '';
	display: block;
	width: 100%;
	height: 100%;
    background: linear-gradient(to right, #0000, #000);
    border-radius: 6px;
    position: absolute;
}
[color-picker=preview]{
    position: absolute;
    left: 5px;
    width: 30px;
    height: 30px;
    border-radius: 50%;
	box-shadow: 0 0 2px #333;
    overflow: hidden;
}
[color-picker=preview] i{
	display: block;
	width: 100%;
	height: 100%;
}
[color-picker=value], [color-picker=type]{
    text-align: center;
    background: #353535;
    color: #fff;
    border-radius: 2px;
    border: 0;
    height: 20px;
    padding: 0;
    vertical-align: top;
	font-family: 'Segoe UI',Arial,'Microsoft Yahei',sans-serif;
}
[color-picker=value]{
    width: 140px;
    font-size: 12px;
}
[color-picker=type]{
    width: 30px;
    margin-left: 5px;
}
[color-picker=list]{
    padding: 10px;
    border-top: 1px #d2d2d2 solid;
}
i[color-picker-color]{
    width: 14px;
    height: 14px;
    display: inline-block;
    box-shadow: 1px 1px 1px #777;
    margin: 4px;
    cursor: pointer;
}
i[color-picker-color]:hover{
    box-shadow: 0 0 3px #000000;
}
[color-picker=atlas]{
    background: #fff;
    height: 100%;
    width: 100%;
    position: absolute;
	top: 100%;
    transition-duration: .3s;
    overflow: hidden auto;
}
[color-picker=atlas] span{
    font-size: 12px;
    color: #777;
    margin-left: 4px;
    margin-bottom: 8px;
    display: block;
}
[color-picker=atlas] i{
    width: 22px;
    height: 22px;
}
[color-picker=atlas] select{
    border: 0;
    width: 100%;
    padding: 10px;
    cursor: pointer;
	background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="86" height="75" fill="#ccc"><path d="M 86 0 L 43 75 L 0 0 L 86 0 Z"></path></svg>');
	
    background-position: right 10px center;
    background-size: 10px;
    background-repeat: no-repeat;
    -webkit-appearance: menulist-text;
}
[color-picker=atlaSwitch]{
    position: absolute;
    right: 0;
    bottom: 0;
    width: 30px;
    height: 30px;
	background: #d6d6d6;
    transform: translate(50%, 50%) rotate(45deg);
    transform-origin: center;
    cursor: pointer;
}
`)