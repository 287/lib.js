/*!usage:
	html:
		<a href="javascript:;" event-watch="show-tip">show tip</a>
		<a href="javascript:;" event-watch="show-dialog">show dialog</a>
	javascript:
		eventWatch('show-tip').click(function(e){
			var target = e.target // the element of event captured
			, active = e.srcElement // top element of event trigger
			;
			dialog.show();
		});
		eventWatch('show-tip, show-dialog').on('click, dblclick', function(e){
			dialog.show();
		});
*/
(function(){
	
	//@ version
	var version = '1.0.1';
	
	//@ basic
	var isIE = !!document.all;
	
	var each = function(o, fn, type){
		if(typeof o!='object' || typeof fn!='function') return false;
		type = type ? (type=='array' ? type : 'object') : (typeof o.length=='number' && o.length>-1 ? 'array' : 'object');
		if(type=='array'){
			for(var i=0, l=o.length; i<l; i++){
				if(fn.call(o, o[i], i)===false) break;
			}
		}else{
			for(var i in o){
				if(!o.hasOwnProperty(i)) continue;
				if(fn.call(o, o[i], i)===false) break;
			}
		}
	};
	
	var getList = function(s){
		var list = [];
		each(s==null?'':s.toString().split(','), function(t){
			t = t.replace(/^\s+|\s+$/g, '');
			t!=='' && list.push(t);
		});
		return list;
	};
	
	var getParentNodeList = function(el){
		var list = [];
		while(el && el.nodeType==1 && el.nodeType!=9){
			list.push(el);
			el = el.parentNode;
		}
		return list;
	};
	
	var trim = function(s){
		return s==null ? '' : s.toString().replace(/^\s+|\s+$/g, '');
	};
	
	
	//@ Event
	var Event = function(e){
		var self = this;
		for(var k in e) if(typeof e[k]!='function') this[k] = e[k];
		self.origin = e;
		return self
	};
	
	
	//@ EventWatch
	var EventWatch = function(name){
		this.nameList = getList(name);
	};
	
	EventWatch.map = {};
	
	//@ on
	EventWatch.prototype.on = function(type, fn){
		var nameList = this.nameList;
		var eventMap = EventWatch.map;
		
		each(getList(type), function(type){
			var map = eventMap[type];
			map && each(nameList, function(name){
				map.push({
					name: name
					, fn: fn
				});
			});
		});
		
		return this;
	};
	
	//@ parse event
	EventWatch.parseEvent = function(type, event){
		var eventMap = EventWatch.map;
		
		if(!eventMap[type] || !eventMap[type].length){
			return false;
		}
		var srcEvent = type=='pressup' && event.fromEvent ? event.fromEvent : event
		var srcElement = srcEvent.srcElement || srcEvent.target;
		var nodeList = getParentNodeList(srcElement)
		var targetList = []
		
		each(nodeList, function(el){
			var nameList = getList(el.getAttribute('event-watch'))
			var cmdList = getList(el.getAttribute('event-cmd'))
			
			if(nameList.length){
				targetList.push({
					nameList: nameList
					, cmdList: cmdList
					, node: el
				});
			}
		});
		
		var e = new Event(event)
		e.type = type;
		e.srcElement = srcElement;
		EventWatch.triger(type, '*', e);
		
		each(targetList, function(item){
			var e = new Event(event)
			e.type = type;
			e.srcElement = srcElement;
			e.target = item.node;
			each(item.nameList, function(name){
				EventWatch.triger(type, name, e);
			});
		});
	};
	
	//@ trigger
	EventWatch.triger = function(type, name, e){
		each(EventWatch.map, function(map, eventType){
			if(type && eventType != type) return ;
			var rs = each(map, function(item){
				if(name && item.name != name) return ;
				if(typeof item.fn=='function' && item.fn.call(e.target, e)===false){
					return false;
				}
			})
			if(rs===false) return false;
		});
	};
	
	
	//@ init
	EventWatch.init = function(){
		//@ export event method
		each(['click', 'dblclick', 'menu', 'dblmenu', 'press', 'pressup', 'menupress', 'menupressup', 'down', 'up', 'move'], function(type){
			EventWatch.map[type] = [];
			EventWatch.prototype[type] = function(fn){
				return this.on(type, fn);
			};
		});
		
		//@ bind eventHub
		new EventHub(function(e, type){
			EventWatch.parseEvent(type, e);
		});
	};
	
	
	
	//@ eventWatch
	var eventWatch = function(k){
		return new EventWatch(k);
	};
	eventWatch.map = EventWatch.map;
	
	
	EventWatch.init();
	
	window.eventWatch = eventWatch;
})();
