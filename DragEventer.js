//#!py
/**
 * @export DragEventer
 * @include xyKeys ltKeys rbKeys sizeKeys rectKeys dragOffsetKeys
 */

class DragEventer
	/**
	 * @include random
	 */
	constructor(op, context)
		Object.assign(this, {
			id: `dragToken-${random()}`,
			dragable: false,
			
			limitInRect: null,
			moveStep: null,
			
			// resize rect 相关参数
			dragRect: null,
			dragRectRotate: 0,
			// rect 的最小尺寸
			minRectSize: 0,
			// 是否等比例
			keepRectRatio: false,
			// 数组 move left top right bottom
			dragRectAction: null,
			
			dragstart: (e)=> true,
		}, op)
		
		/**
		 * @include toArrayIfNot getObjectByKeys
		 */
		context.on('dragstart', (e)=> {
			if this.dragstart(e, this)
				this.dragable = e.dragable = true
				e.swap[this.id] = true
				
				let {minRectSize, moveStep, dragRect, dragRectAction} = this
				if minRectSize != null
					this.minRectSize = toArrayIfNot(minRectSize, 2)
					
				if moveStep != null
					this.moveStep = toArrayIfNot(moveStep, 2)
					
				if dragRect
					this.dragRect = getObjectByKeys(dragRect, rectKeys)
					dragRectAction = dragRectAction || 'move'
					this.dragRectAction = toArrayIfNot(dragRectAction)
		})
		
		
		/**
		 * @include isFunction isPonitInRect limitPonitInRect
		 */
		['drag', 'drop', 'dragend'].forEach((type)=> {
			let task = this[type]
			if !isFunction(task)
				return
				
			context.on(type, (e)=> {
				if !e.swap[this.id]
					return
				if !this.dragable
					return
					
				if type === 'drag'
					let {limitInRect, dragRect, moveStep} = this
					
					if moveStep
						let p = xyKeys.map(v=> e[v])
						dragOffsetKeys.forEach((key, i)=> {
							e[key] = Math.round(e[key] / moveStep[i]) * moveStep[i]
						})
						
					if limitInRect
						let p = xyKeys.map(v=> e[v])
						if !isPonitInRect(p, limitInRect)
							p = limitPonitInRect(p, limitInRect)
							xyKeys.forEach((key, i)=> e[dragOffsetKeys[i]] = p[i] - e.dragstart[key])
					
					const {lastDragEvent} = this
					if lastDragEvent && dragOffsetKeys.every(key=> lastDragEvent[key] === e[key])
						return
					
					if dragRect
						this.parseDragEventByResize(e)
						
					if lastDragEvent && dragOffsetKeys.every(key=> lastDragEvent[key] === e[key])
						return
						
					this.lastDragEvent = e
					
				task(e, this)
			})
		})
		
	/**
	 * @param {event} e
	 */
	parseDragEventByResize(e)
		let {keepRectRatio, dragRect: rect, minRectSize: minSize, dragRectAction: actions, limitInRect, dragRectRotate, moveStep} = this
		if dragRectRotate
			const dragOffset = xyKeys.map((key)=> e[key] - e.dragstart[key])
			/**
			 * @include rotatePoint
			 */
			const offset = rotatePoint(dragOffset, -dragRectRotate)
	
			if moveStep
				offset.forEach((value, i)=> {
					offset[i] = Math.round(value / moveStep[i]) * moveStep[i]
				})
				
			dragOffsetKeys.forEach((key, i)=> e[key] = offset[i])
			
		let offset = dragOffsetKeys.map(key=> e[key])
			
		let setting = {}

		keepRectRatio = keepRectRatio || e.shiftKey
		
		if keepRectRatio
			let ratioIndex
			
			// 如果是单边操作
			if actions.length === 1
				let key = actions[0]
				[ltKeys, rbKeys].forEach((keys)=> {
					if keys.includes(key)
						ratioIndex = keys.indexOf(key)
						actions = [key, keys[!keys.indexOf(key) >> 0]]
				})
			if ratioIndex == null
				ratioIndex = offset[0] > offset[1] ? 0 : 1
				
			let index = ratioIndex
			let anotherIndex = !index >> 0
			offset[anotherIndex] = rect[sizeKeys[anotherIndex]] / rect[sizeKeys[index]] * offset[index]
			
		actions.forEach((key)=> {
			if key === 'move'
				setting.left = rect.left + offset[0]
				setting.top = rect.top + offset[1]
				
				if limitInRect
					ltKeys.forEach((key, i)=> {
						let dValue
						dValue = setting[key] - limitInRect[key]
						if dValue < 0
							e[dragOffsetKeys[i]] -= dValue
							setting[key] -= dValue
						else							
							dValue = setting[key] + rect[sizeKeys[i]] - (limitInRect[key] + limitInRect[sizeKeys[i]])
							if dValue > 0
								e[dragOffsetKeys[i]] -= dValue
								setting[key] -= dValue
						return
						if setting[key] < limitInRect[key]
							setting[key] = limitInRect[key]
						else if setting[key] + rect[sizeKeys[i]] > limitInRect[key] + limitInRect[sizeKeys[i]]
							setting[key] = limitInRect[key] + limitInRect[sizeKeys[i]] - rect[sizeKeys[i]]
					})
						
			else if ltKeys.includes(key)
				let i = ltKeys.indexOf(key)
				let sizeKey = sizeKeys[i]
				
				setting[key] = rect[key] + offset[i]
				setting[sizeKey] = rect[sizeKey] - offset[i]
				
				if minSize
					if setting[sizeKey] < minSize[i]
						setting[key] += setting[sizeKey] - minSize[i]
						setting[sizeKey] = minSize[i]
					
			else if rbKeys.includes(key)
				let i = rbKeys.indexOf(key)
				let sizeKey = sizeKeys[i]
				setting[sizeKey] = rect[sizeKey] + offset[i]
				
				if minSize
					if setting[sizeKey] < minSize[i]
						setting[sizeKey] = minSize[i]
		})
		
		this.settingStyle = setting