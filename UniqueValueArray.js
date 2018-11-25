//#!py
/**
 * @export UniqueValueArray
 */
class UniqueValueArray extends Array
	constructor(...arr)
		super()
		if arr.length > 1
			this.push(...arr)
		
	push(...args)
		args.forEach((value)=> {
			if !this.includes(value)
				this.splice(this.length, 0, value)
		})
		return this.length
		
	unshift(...args)
		let index = 0
		args.forEach((value)=> {
			if !this.includes(value)
				this.splice(index++, 0, value)
		})
		return this.length
		
	delete(value)
		let index = this.indexOf(value)
		if index > -1
			this.splice(index, 1)
		return index > -1
	
	clear()
		this.splice(0)