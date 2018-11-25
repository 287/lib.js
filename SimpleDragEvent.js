//#!py
/**
 * @export SimpleDragEvent
 */
class SimpleDragEvent
	static binds = []
	
	constructor(op)
		Object.assign(this, {
			dragable: false,
			target: null,
			ondragstart: null,
			ondrag: null,
			ondragend: null,
		}, op)
		
		this.constructor.binds.push(this)
		
	destroy()
		const {binds} = this.constructor
		binds.splice(binds.indexOf(this), 1)
	

	/**
	 * @include callFunction
	 */
	emitEvent(type, e)
		select type
			case 'down'
				const {target} = this
				if target
					if !e.path.includes(target)
						return
				
				if callFunction(this.ondragstart, e, this)
					this.dragstart = e
					this.dragable = true
				
			case 'move'
				if this.dragable
					/**
					 * @include xyKeys dragOffsetKeys
					 */
					xyKeys.forEach((key, i)=> e[dragOffsetKeys[i]] = e[key] - this.dragstart[key])
					if dragOffsetKeys.every(key=> e[key] === 0)
						return
					callFunction(this.ondrag, e, this)
			
			case 'up'
				this.dragable = false
				callFunction(this.ondragend, e, this)
				
		
/**
 * @include addEvent
 */
['down', 'move', 'up'].forEach(key=> addEvent(document, 'mouse' + key, (e)=> {
	SimpleDragEvent.binds.forEach((eventer)=> {
		eventer.emitEvent(key, e)
	})
}))