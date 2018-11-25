//#!py
/**
 * @import SimpleDragEvent
 * @export RangePicker
 * @include xyKeys ltKeys
 */
class RangePicker

	/**
	 * @include createNode getNodes
	 * @param {object} [op]
	 * @param {string} [op.type = 'xy'] - [xy, x, y]
	 * @param {boolean} [op.wipeHandleSize] - xy: false; x, y: true
	 * @param {array<number>|array<array<number>>} [op.range = null]
	 * @param {number|array<number>} [op.step = null]
	 * @param {function} [op.onchange = null]
	 */
	constructor(op)
		Object.assign(this, {
			type: 'xy',
			onchange: null,
			wipeHandleSize: null,
			range: null,
			step: null,
			limitBySeq: true,
		}, op)
		
		let {type, wipeHandleSize} = this
		const nodes = getNodes(createNode(`<div range-picker="wrap" range-picker-type="${type}"><div range-picker="track"><div range-picker="handle"></div></div></div>`), 'range-picker')
		const handles = []
		handles.push(nodes.handle)
		
		if wipeHandleSize === null
			if type.length === 1
				wipeHandleSize = true
		Object.assign(this, {
			rect: null,
			// index: xyKeys.indexOf(type),
			xyIndex: xyKeys.indexOf(type),
			handleIndex: 0,
			wipeHandleSize,
			handles,
			nodes,
			dom: nodes.wrap,
			ratios: [this.xyKeys === -1 ? [0,0] : 0],
			drageventer: new SimpleDragEvent({
				ondragstart: (e, op)=> {
					const target = e.path.find(node=> node.getAttribute && node.getAttribute('range-picker'))
					const {nodes, handles, wipeHandleSize} = this
					let index = handles.indexOf(target)
					
					if index === -1
						if (target === nodes.wrap || target === nodes.track) && handles.length === 1
							index = 0
						else 
							return
					
					this.handleIndex = index
					this.rect = nodes.track.getBoundingClientRect()
					
					if handles.length === 1
						this.emitHandleMove(e, index)
						
					return true
				},
				ondrag: (e, op)=> {
					this.emitHandleMove(e, this.handleIndex)
				}
			})
		})
		
	/**
	 * @include isEqualValuesOfArray
	 */
	emitHandleMove(e, index)
		const {rect} = this
		/**
		 * @include getOffsetFromRectByPoint
		 */
		const p = xyKeys.map(key=> e[key])
		let ratio = getOffsetFromRectByPoint(rect, p, true)
		ratio.forEach((v, i)=> ratio[i] = Math.round(v * 100) / 100)
		
		const {xyIndex, limitBySeq} = this
		if xyIndex > -1
			ratio = ratio[xyIndex]
			if limitBySeq && xyIndex > -1
				
				const {ratios} = this
				const prevRatio = ratios[index - 1]
				const nextRatio = ratios[index + 1]
				
				if prevRatio && ratio < prevRatio
					ratio = prevRatio
				else if nextRatio && ratio > nextRatio
					ratio = nextRatio
				
		this.setRatio(ratio, index, true)
	
	setValue(value, index, emitChange)
		/**
		 * @include getPercent
		 */
		const {type, range} = this
		let ratio
		if range
			if type.length === 1
				ratio = getPercent(value, ...range)
			else
				ratio = xyKeys.map((key, i)=> getPercent(value[i], ...range[i]))
			
			this.setRatio(ratio, index, emitChange)
	
	/**
	 * @include isEqualValuesOfArray
	 */
	setRatio(ratio, index = 0, emitChange)
		const {xyIndex, ratios, step, range} = this
		
		const lastRatio = ratios[index]
		
		if xyIndex === -1
			if step && !range
				ratio.forEach((v, i)=> {
					ratio[i] = Math.round(v / step[i]) * step[i]
				})
			
			if lastRatio && isEqualValuesOfArray(lastRatio, ratio)
				return
			
		else
			if step && !range
				ratio = Math.round(ratio / step) * step
			
			if lastRatio === ratio
				return
			
		ratios[index] = ratio
			
		this.setHandleOffset(ratio, index)
		
		if emitChange
			this.emitChange(ratio, index)
		
	removeHandle(index)
		const {handles, ratios} = this
		/**
		 * @include removeNode
		 */
		removeNode(handles[index])
		handles.splice(index, 1)
		ratios.splice(index, 1)
		
	addHandle(ratio, emitChange)
		const {ratios, handles, nodes} = this
		const handle = nodes.handle.cloneNode()
		handles.push(handle)
		nodes.track.appendChild(handle)
		handle.style.left = ratio * 100 + '%'
		this.setRatio(ratio, ratios.length, emitChange)
		return handle
	
	
	setHandleOffset(ratio, index)
		const {handles, xyIndex} = this
		const handle = handles[index]
		if isArray(ratio)
			ltKeys.forEach((key, i)=> handle.style[key] = ratio[i] * 100 + '%')
		else
			handle.style[ltKeys[xyIndex]] = ratio * 100 + '%'
		
	emitChange(ratio, index)
		const {xyIndex, range, step, onchange} = this
		let rs = ratio
		
		if range
			/**
			 * @include getPercentValue
			 */
			if xyIndex === -1
				rs = xyKeys.map((key, i)=> getPercentValue(ratio[i], ...range[i], step && step[i]))
			else
				rs = getPercentValue(ratio, ...range, step)
			
		/**
		 * @include callFunction
		 */
		callFunction(onchange, rs, this, index)
			
		
/**
 * @include addStyleNode
 */
addStyleNode(`
[range-picker-type=xy]{
    width: 100%;
    height: 100%;
	overflow: hidden;
}
[range-picker-type=x]{
    width: 100%;
    height: 12px;
    border-radius: 6px;
}
[range-picker-type=x] [range-picker=handle]{
    top: 50%;
}
[range-picker-type=y]{
    width: 12px;
    height: 100%;
    border-radius: 6px;
}
[range-picker-type=y] [range-picker=handle]{
    left: 50%;
}
[range-picker=wrap]{
	position: relative;
	background-color: #ccc;
}
[range-picker=handle]{
	position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px #fff solid;
	transform: translate(-50%, -50%);
    cursor: pointer;
    box-shadow: 0 0 1px #333;
	transition: .05s;
}
[range-picker=track]{
	height: 100%;
	position: relative;
}
[range-picker-type=x] [range-picker=track]{
	margin: 0 6px;
}
[range-picker-type=y] [range-picker=track]{
	margin: 6px 0;
}
`)