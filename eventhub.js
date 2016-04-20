/*!usage:
	new EventHub(function(e, type){
		console.log(e, type);
	}, 'mouse, touch');
*/
(function(){
	
	var EventHub = function(fn, type){
		type = type || 'mouse';
			
		//@ callback list
		this.list = [];
		
		//@ lastStatus
		this.lastStatus = {
			down: {}
			, up: {}
			, clickTimer: ''
			, trigerTime: 0
			, type: ''
			, e: null
		};
		
		//@ config
		this.config = {
			pointOffsetLimit: 3
			, clickTimeLimit: 300
			, pressTimeAdd: 10
			, mouse: /mouse/.test(type)
			, touch: /touch/.test(type)
		};
		
		
		//@ init
		if(!this.inited){
			this.inited = true;
			this.bind();
		}
		
		return this.add(fn);
	};
	
	
	//@ add callback
	EventHub.prototype.add = function(fn){
		this.list.push(fn);
	};
	
	//@ exports
	EventHub.prototype.exports = function(type, e){
		var list = this.list;
		for(var i=0; i<list.length; i++){
			var fn = list[i];
			typeof fn=='function' && fn.call(e, e, type);
		}
	};
	
	//@ triger
	EventHub.prototype.triger = function(type, e){
		var self = this
		, lastStatus = this.lastStatus
		, time = new Date().getTime()
		;
		if(['click', 'dblclick', 'press', 'pressup'].indexOf(type)>-1){
			if(e.which==3){
				type = /press/.test(type) ? 'menu'+ type : type.replace('click', 'menu');
			}
			lastStatus.trigerTime = time;
			lastStatus.type = type;
			lastStatus.e = e;
		};
		setTimeout(function(){
			self.exports(type, e);
		}, 1);
	};
	
	//@ down
	EventHub.prototype.down = function(e){
		var self = this
		, config = this.config
		, lastStatus = this.lastStatus
		, time = new Date().getTime()
		;
		
		lastStatus.down = {
			x: e.x
			, y: e.y
			, time: time
		};
		
		self.triger('down', e);
		
		lastStatus.pressTimer = setTimeout(function(){
			if(!lastStatus.up.time || lastStatus.up.time < time){
				self.triger('press', e);
			}
		}, (config.clickTimeLimit + config.pressTimeAdd));
		
		clearTimeout(lastStatus.clickTimer);
	};
	
	//@ up
	EventHub.prototype.up = function(e){
		var self = this
		, config = this.config
		, lastStatus = this.lastStatus
		, time = new Date().getTime()
		;
		
		self.triger('up', e);
		
		if(lastStatus.up.time
			&& time - lastStatus.up.time < config.clickTimeLimit - config.pressTimeAdd
			&& lastStatus.down.time - lastStatus.trigerTime > config.clickTimeLimit / 2
			&& Math.abs(lastStatus.up.x-e.x) <= config.pointOffsetLimit
			&& Math.abs(lastStatus.up.y-e.y) <= config.pointOffsetLimit
		){
			clearTimeout(lastStatus.pressTimer);
			clearTimeout(lastStatus.clickTimer);
			self.triger('dblclick', e);
		}else{
			if(lastStatus.down.time
				&& time-lastStatus.down.time < config.clickTimeLimit
				&& Math.abs(lastStatus.down.x-e.x) <= config.pointOffsetLimit
				&& Math.abs(lastStatus.down.y-e.y) <= config.pointOffsetLimit
				){
				lastStatus.clickTimer = setTimeout(function(){
					self.triger('click', e);
				}, config.clickTimeLimit);
			}else{
				if(['press', 'menupress'].indexOf(lastStatus.type)>-1){
					e.fromEvent = lastStatus.e;
					self.triger('pressup', e);
				}
			}
		}
		
		lastStatus.up = {
			x: e.x
			, y: e.y
			, time: time
		};
	};
	
	//@ move
	EventHub.prototype.move = function(e){
		var self = this
		, lastStatus = this.lastStatus
		;
		if(['press', 'menupress'].indexOf(lastStatus.type)>-1){
			e.fromEvent = lastStatus.e;
			self.triger('move', e);
		}
	};

	//@ bind event
	EventHub.prototype.bind = function(isMobile){
		var self = this
		, config = this.config
		;
		['mouse', 'touch'].forEach(function(deviceType){
			['down', 'up', 'move'].forEach(function(type){
				var eventType = deviceType + type
				if(deviceType=='touch'){
					eventType = eventType.replace('down', 'start').replace('up', 'end');
				}
				config[deviceType] && addEvent(document, eventType, function(e){
					self[type].call(self, e);
					//return false;
				});
			});
		});
	};
	
	//@ basic method
	var addEvent = function(el, type, fn){
		el && (el.addEventListener ? el.addEventListener(type, fn, false) : el.attachEvent && el.attachEvent('on'+ type, fn));
	};
	
	window.EventHub = EventHub;
})();