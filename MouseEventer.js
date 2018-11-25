//#!py
/**
 * @import CommonEvent
 * @export MouseEventer
 */
 
const tapTypes = ['tap', 'menu', 'hit']
const originTypes = ['mousedown', 'mouseup', 'mousemove']
const actionTypes = ['down', 'move', 'up', 'fasttap', 'tap', 'dbltap', 'menu', 'dblmenu', 'over', 'press', 'pick', 'pressup', 'dragstart', 'drag', 'dragover', 'drop', 'dragend']
const types = [].concat(originTypes, actionTypes)

const xyKeys = ['x', 'y']
const pageKeys = xyKeys.map(key=> `page${key.toUpperCase()}`)
const dragKeys = xyKeys.map(key=> `drag${key.toUpperCase()}`)


class MouseEventer

	static originTypes
	static actionTypes
	static types
	static events = []
	
	/**
	 * @include isFunction
	 */
	static bind(dom, onemit)
		if isFunction(dom)
			onemit = dom
			dom = null
		dom = dom || document
		return new this({
			dom,
			onemit,
		})
	
	/**
	 * @include 
	 */
	constructor(op)
		Object.assign(this, {
			// 判断鼠标是否移动
			offset: 3,
			// tap的延迟
			delay: 240,
			
			// 接收事件的方法
			onemit: null,
			
			// 需要绑定的dom
			dom: null,
			
			// 已绑定的dom
			binds: [],
			
			timers: {},
			lasts: {},
			
			eventParser: (e)=> this.parseEvent(e),
		}, op)
		
		if this.dom
			this.bind(this.dom)
			
		this.constructor.events.push(this)
		
	/**
	 * @desc 销毁方法
	 * @include removeArrayValue
	 */
	destroy()
		this.binds.slice(0).forEach(dom=> this.unbind(dom))
		removeArrayValue(this.constructor.events, this)
		
	/**
	 * @desc bind events
	 * @include addEvent
	 */
	bind(dom)
		this.binds.push(dom)
		originTypes.forEach((originType)=> {
			addEvent(dom, originType, this.eventParser)
		})
		
	/**
	 * @desc unbind events
	 * @include removeEvent removeArrayValue
	 */
	unbind(dom)
		removeArrayValue(this.binds, dom)
		originTypes.forEach((originType)=> {
			removeEvent(dom, originType, this.eventParser)
		})
		
	/**
	 * @include getLengthOfTwoPoint
	 */
	isMoved(e, e2)
		return getLengthOfTwoPoint([e.pageX, e.pageY], [e2.pageX, e2.pageY]) >= this.offset
	
	/** 
	 * 衍生事件: pick pressup drop dragend
	 * @include getObjectByKeys getNodePath
	 * @param {event} e
	 * @param {string} type
	 */
	emit(type, e)
		const {lasts} = this
		const op = getObjectByKeys(e, ['x', 'y', 'target', 'path', 'which', 'clientX', 'clientY', 'offsetX', 'offsetY', 'pageX', 'pageY', 'ctrlKey', 'shiftKey', 'altKey', 'timeStamp'], {
			type,
		})
		if !op.path && op.target
			const path = getNodePath(op.target)
			op.path = path
		e = new MouseEvent(op, e.originEvent || e)
		
		lasts[type] = e
		
		select type
			case 'down'
				lasts.isDown = true
			
			case 'dragstart'
				Object.assign(e, {
					dragable: false,
					swap: {},
				})
				
			case 'drag'
				getObjectByKeys(lasts.dragstart, ['swap', 'target', 'path'], e)
				pageKeys.forEach((key, i)=> {
					e[dragKeys[i]] = e[key] - lasts.dragstart[key]
				})
				Object.assign(e, {
					dragstart: lasts.dragstart,
				})
				
			case 'dragover'
			case 'drop'
				getObjectByKeys(lasts.drag, ['dragstart', 'swap', ...dragKeys], e)
				
			case 'dragend'
				getObjectByKeys(lasts.drag, ['dragstart', 'swap', 'target', 'path', ...dragKeys], e)
				
			case 'pressstart'
				e.swap = {}
				lasts.pressParam = {
					pressstart: e,
					pressTarget: null,
					swap: e.swap,
				}
			
			case 'press'
			case 'pick'
			case 'pressend'
				Object.assign(e, lasts.pressParam)
				type = {
					type,
					target: e.pressTarget,
				}
				
			case 'up'
				lasts.isDown = false
				lasts.isDrag = null
				
				lasts.pressstart = lasts.press = lasts.pressParam = null
				lasts.dragstart = lasts.drag = lasts.dragParam = null
				
		this.onemit(e)

	/**
	 * 原生事件: up down move
	 * 行为事件: tap dbltap press drag dragstart
	 * @param {event} e
	 * @param {string} type
	 */
	parseEvent(e){
		const {lasts, timers, delay} = this
		let type = e.type.replace(/^(mouse)/, '')
		
		select type
			case 'down'
				// console.log('down', Date.now(), Date.now() - (!lasts.down ? 0 : lasts.down.timeStamp))
				// trigger down
				this.emit('down', e)
				
				tapTypes.forEach(type=> clearTimeout(timers[type]))
				
				// trigger press
				// if this.isActionAble(e, 'press')
				timers.press = setTimeout(()=> {
					if !lasts.isDrag
						// trigger pressstart
						// console.log('trigger pressstart')
						this.emit('pressstart', e)
						if e.pressTarget
							this.emit('press', e)
				}, delay + 30)
		
			case 'move'
				// trigger move
				this.emit('move', e)
				
				if lasts.isDown && !lasts.press
					if lasts.isDrag == null
						if this.isMoved(lasts.down, e)
							let e = lasts.down
							clearTimeout(timers.press)
							
							// trigger dragstart
							this.emit('dragstart', e)
							
							if lasts.dragstart.dragable
								clearTimeout(timers.press)
								tapTypes.forEach(type=> clearTimeout(timers[type]))
								lasts.isDrag = true
							else
								lasts.isDrag = false
							
				if !lasts.isDown
					tapTypes.forEach(type=> {
						if timers[`emit-${type}`]
							clearTimeout(timers[type])
							timers[`emit-${type}`]()
					})
							
				if lasts.isDrag
					// trigger drag
					this.emit('drag', e)
					this.emit('dragover', e)
					
				if !lasts.isDown && !lasts.press && !lasts.isDrag
					this.emit('over', e)
			
			// up tap dbltap
			case 'up'
				if lasts.press
					// trigger pick
					if this.isMoved(e, lasts.press)
						this.emit('pick', e)
					
					// trigger pressend
					this.emit('pressend', e)
					
				else if lasts.drag
					// trigger drop
					if this.isMoved(e, lasts.dragstart)
						this.emit('drop', e)
					
					// trigger dragend
					this.emit('dragend', e)
					
				else
					if !lasts.down
						return
						
					let isTap = e.timeStamp - lasts.down.timeStamp < delay && !this.isMoved(e, lasts.down)
					let isDbltap = false
					
					if isTap
						// 是否短时间连续的两次up
						let isSecondUp = lasts.up ? e.timeStamp - lasts.up.timeStamp < delay : false
						
						// 是否上次up与上次dbltap是否不相同
						let isNotSame = lasts.dblclick ? lasts.up.timeStamp !== lasts.dblclick.timeStamp : true;
						
						isDbltap = isSecondUp && isNotSame
						
					clearTimeout(timers.press)
					
					select e.which
						case 1
							type = 'tap'
						case 3
							type = 'menu'
						default
							type = 'hit'
						
					if isTap
						// trigger fasttap fastmenu fasthit
						this.emit(`fast${type}`, e)
					
						if isDbltap
							// trigger dbltap
							this.emit(`dbl${type}`, e)
						else
							// trigger tap menu hit
							timers[`emit-${type}`] = ()=> {
								timers[`emit-${type}`] = null
								console.log('run', type)
								this.emit(type, e)
							}
							timers[type] = setTimeout(timers[`emit-${type}`], delay)
					
				// trigger up
				this.emit('up', e)
				// console.log('up', Date.now(), Date.now() - lasts.down.timeStamp)
				
			default
				this.emit(type, e)
				

class MouseEvent extends CommonEvent
	constructor(...args)
		super(...args)
				
				
addEvent(window, 'mouseup', (e)=> {
	MouseEventer.events.forEach(eventer=> {
		const {up} = eventer.lasts
		if up && up.timeStamp === e.timeStamp
			return
		eventer.parseEvent(e)
	})
})