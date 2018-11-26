//#!py
/**
 * @export CommonEvent
 */

class CommonEvent
	constructor(op, originEvent)
		Object.assign(this, {
			type: null,
			originEvent,
			status: {
				isPreventDefault: null,
				isStopPropagation: null,
			},
		}, op)
		
	stopPropagation()
		const {status} = this
		if status.isStopPropagation === null
			status.isStopPropagation = true
	
	preventDefault()
		const {status} = this
		if status.isPreventDefault === null
			status.isPreventDefault = true