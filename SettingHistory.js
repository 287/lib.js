//#!py
/**
 * @export SettingHistory
 */

class SettingHistory
	constructor(op)
		Object.assign(this, {
			max: 50,
			index: 0,
			stacks: [],
			methods: {},
			ondo: null,
			onpush: null,
		}, op)
		
	/**
	 * @include callFunction
	 */
	undo()
		const {stacks, index, onundo, ondo, methods} = this
		if index > 0
			const item = stacks[index - 1]
			const param = item.param[1]
			const type = item.type
			callFunction(item.onundo || item.ondo || methods[type] || onundo || ondo, param, item, 'undo')
			this.index--
			return item.param
	
	/**
	 * @include callFunction
	 */
	redo()
		const {stacks, index, onredo, ondo, methods} = this
		if index < stacks.length
			const item = stacks[index]
			const param = item.param[0]
			const type = item.type
			callFunction(item.onredo || item.ondo || methods[type] || onredo || ondo, param, item, 'redo')
			this.index++
			return item.param
	
	/**
	 * @include callFunction
	 * @param {any} setting
	 * @param {any} backup
	 * @param {object|string} [op]
	 * @param {string} [op.id]
	 */
	push(setting, backup, op)
		const {stacks, index, max, onpush} = this
		
		// 清除undo后的
		const coverSize = stacks.length - 1 - index
		stacks.splice(index + 1, coverSize)
		
		const item = {
			param: [setting, backup],
		}
		
		if op
			Object.assign(item, op)
				
		stacks.push(item)
		
		// 清除超过栈长限制的早期的部分
		-
			let lastIndex = 0
			let ids = []
			while stacks.length > max
				const op = stacks[lastIndex]
				if op.id
					if !ids.includes(op.id)
						ids.push(op.id)
						lastIndex++
						continue
				stacks.splice(lastIndex, 1)
		
		this.index = stacks.length
		
		callFunction(onpush, setting)
		
	bind(type, method)
		const {methods} = this
		methods[type] = method
		