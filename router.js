/*!
 * name: url router with hash watch
 * page: https://github.com/287/lib.js/blob/master/router.js
 * from: mrbrick@yinhe.org
 * last: 20160515
 */
(function(){
	
	/**
		usage:
			eg: xxx.com/china/article?token=123_123#/view/123?category=12&userType=3#reply
			
			router parse data:
				data: {
					path: [
						'china'
						, 'article'
					]
					, query: {
						token: '123_123'
					}
					, hash: {
						path: [
							'china'
							, 'article'
						]
						, query: {
							category: '12'
							, userType: '3'
						}
						, param: {
							path: '/view/123'
							, path: 'category=12&userType=3'
						}
					}
					, param: {
						path: '/china/article'
						, path: 'token=123_123'
						, url: '/china/article?token=123_123'
						, hash: '/view/123?category=12&userType=3'
						, anchor: 'reply'
					}
					, url: '/china/article?token=123_123#/view/123?category=12&userType=3#reply'
				}
				
			router get:
				var router = new Router();
				
				url variable: 
				router.get('0')			-> china
				router.get('1')			-> article
				router.get('token')		-> 123_123
				url param: 
				router.get(':anchor')	-> reply
				router.get(':path')		-> /china/article
				router.get(':query')	-> token=123_123
				
				hash variable:
				router.get('#0')		-> view
				router.get('#category')	-> 12
				hash param: 
				router.get('#:path')	-> /view/123
				router.get('#:query')	-> category=12&user-type=3
			
			router jump:
				router.go('/page')
				
				router.go('#page')		-> hash jump to page
				router.go('##')			-> go anchor
			
			router listener:
				router.add(function(data){
					if(this.get('#0')=='article'){
						
					}
				})
				router.add('#/article/' function(data){
					if(this.get('#0')=='article'){
						
					}
				})
				router.add('/article', function(data){
					
				})
				router.add(['/article'], function(data){
					
				})
	*/

	//@ Router
	var Router = function(op){
		op = op || {};

		//* set window
		this.window = op.window || window;

		//* listen callback list
		this.list = [];

		//* last change time
		this.lastTime = null;

		//* parse url data
		this.data = {
			path: []
			, query: {}
			, alias: {}
			, hash: {
				path: []
				, query: {}
				, alias: {}
				, param: {
					path: ''
					, query: ''
				}
			}
			, param: {
				path: ''
				, query: ''
				, url: ''
				, hash: ''
				, anchor: ''
			}
		};

		this.init();
	};

	
	Router.prototype = {

		//@ get url param
		get: function(cmd){
			var data = this.data
			, dataSet = data
			, rs
			;

			//* hash dataset
			if(cmd[0] == '#'){
				cmd = cmd.substr(1);
				dataSet = data.hash;
			}

			if(cmd[0] == ':'){
				
				//* get from param
				cmd = cmd.substr(1);
				if(['length', 'index'].indexOf(cmd) > -1){
					dataSet = dataSet.path;
				}else{
					dataSet = dataSet.param;
				}
			}else{
				
				//* get from path or query
				if(cmd == '#'){
					cmd = 'anchor';
				}else if(dataSet.alias[cmd] != null){
					rs = this.get(dataSet.alias[cmd]);
				}else if(/^\d+$/.test(cmd)){
					dataSet = dataSet.path;
				}else{
					dataSet = dataSet.query;
				}
			}

			return rs != null ? rs: dataSet[cmd] == null ? null: dataSet[cmd];
		}

		
		//@ alias path param
		, alias: function(alias, cmd){
			var dataSet = this.data
			, map = {}
			;

			//* parse alias map
			if(alias != null){
				if(cmd != null){
					map[alias] = cmd;
				}else if(typeof alias == 'object'){
					map = alias;
				}
			}

			//* add alias
			for(alias in map){
				cmd = map[alias];
				if(cmd != alias){
					if(alias[0] == '#'){
						alias = alias.substr(1);
						dataSet = dataSet.hash;
					}
					dataSet.alias[alias] = cmd;
				}
			}

			return this;
		}

		
		//@ add listen callback
		, add: function(rule, fn){
			var itemList = this.list
			, tList = typeOf(rule) == 'array' ? rule: [rule]
			, isHash = false
			, i
			;

			for(i = 0; i < tList.length; i++){
				rule = tList[i];
				if(rule[0] == '#'){
					isHash = true;
					tList[i] = rule.substr(1);
				}
			}

			itemList.push({
				rule: tList
				, isHash: isHash
				, fn: fn
				, last: null
			});

			this.triger();
			
			return this;
		}

		
		//@ TODO: remove listen callback
		, remove: function(){}

		
		//@ page jump
		, go: function(cmd){
			var url = '';
			
			if(cmd === '##' && this.data.param.anchor!==''){
				url = '#' + this.data.param.anchor;
			}else if(/^##/.test(cmd)){
				var param = this.data.hash.param;
				cmd = cmd.substr(2);
				url += '#' + (param.path !== '' ? param.path: '/');
				url += param.query !== '' ? '?' + param.query: '';
				url += (cmd !== '' ? '#': '') + cmd;
			}else if(/^#/.test(cmd)){
				url = cmd;
			}else if(cmd!=null){
				url = cmd;
			}

			//* jump
			if(url!==''){
				this.window.location.href = url;
			}
		}

		
		//@ parse path string
		, parsePath: function(url){
			var list = []
			, tList
			, i
			;

			url = url[0] == '/' ? url.substr(1): url;
			tList = url.split('/');

			for(i = 0; i < tList.length; i++){
				list[i] = tList[i];
			}

			return list;
		}
		

		//@ parse query string
		, parseQuery: function(url){
			var tList = url.split('&')
			, map = {}
			, tIndex
			, str
			, i
			;
			
			for(i = 0; i < tList.length; i++){
				str = tList[i];
				if(str !== ''){
					tIndex = str.indexOf('=');
					if(tIndex > -1){
						map[str.substr(0, tIndex)] = str.substr(tIndex + 1);
					}else{
						map[str] = '';
					}
				}
			}

			return map;
		}

		
		//@ parse hash string
		, parseUrl: function(url, dataSet){
			var path = ''
			, query = ''
			, i = url.indexOf('?')
			;

			if(i === 0){
				query = url;
			}else{
				if(i > -1){
					query = url.substr(i + 1);
					path = url.substr(0, i);
				}else{
					path = url;
				}
			}

			dataSet.param.query = query;
			dataSet.param.path = path;
			dataSet.path = this.parsePath(path);
			dataSet.query = this.parseQuery(query);

			return this;
		}
		

		//@ parse anchor string
		, parseAnchor: function(name){
			this.data.param.anchor = name;
			
			return this;
		}
		

		//@ triger listen callback
		, triger: function(){
			var data = this.data
			, itemList = this.list
			, urlParam = data.param
			, hashParam = data.hash.param
			, item
			, dataSet
			, i
			;

			for(i = 0; i < itemList.length; i++){
				item = itemList[i];
				dataSet = item.isHash ? hashParam: urlParam;

				if(this.lastTime > item.last){
					if(globTest(item.rule, dataSet.path)){
						item.last = this.lastTime;
						if(typeof item.fn === 'function' && item.fn.call(this, data) === false){
							break;
						}
					}
				}
			}

			return this;
		}
		

		//@ check url change
		, checkUrlChange: function(){
			var uri = this.window.location.href.split('://')[1]
			, url = uri.substr(uri.indexOf('/'))
			;

			url = url.split('#')[0];
			this.data.param.url = url;
			this.parseUrl(url, this.data);
			
			return this;
		}
		

		//@ check hash change
		, checkHashChange: function(){
			var hash = this.window.location.hash
			, isHashMode = /#$/.test(this.window.location.href)
			, anchor = ''
			;
			
			hash = hash.replace(/^#/, '');
			
			if(/^\//.test(hash)){
				hash = hash.split('#');
				anchor = hash[1] == null ? '': hash[1];
				hash = hash[0];

				//* hash router
				if(this.data.param.hash != hash){
					this.data.param.hash = hash;
					this.lastTime = new Date().getTime();
					this.parseUrl(hash, this.data.hash);
					this.triger();
				}

				//* anchor by url init
				if(anchor !== '' && anchor !== this.data.param.anchor){
					this.data.param.anchor = anchor;
					this.go('#' + anchor);
				}
			}else{
				//* anchor by click
				anchor = hash;
				this.data.param.anchor = anchor;
				
				if(!anchor){
					if(isHashMode){
						this.go('##' + anchor);
					}
				}else{
					this.go('##' + anchor);
				}
			}
			
			return this;
		}

		//@ router init
		, init: function(){
			var self = this;

			if(!this.inited){
				this.inited = true;

				//* listen hash change
				addEvent(this.window, 'hashchange', function(){
					self.checkHashChange();
				});

				//* init
				this.checkUrlChange().checkHashChange();
			}
			
			return this;
		}
	};

	
	
	
	//@ addEvent
	function addEvent(el, type, fn){
		return el && (el.addEventListener ? el.addEventListener(type, fn, false) : el.attachEvent && el.attachEvent('on' + type, fn));
	}


	//@ globTest
	function globTest(mList, path){
		/**
			usage:
				*          => word without /
				**         => word with /
				!          => not match
				?          => one char or not
				[abc]      => match character list: a or b or c
				{hi,hello} => match word list: hi or hello
				
			eg:
				/page/view/1       just match /page/view/1
				!/page/view/1       not match /page/view/1
				/page/view/*            match /page/view/1 or /page/view/2
				/page/view/**           match /page/view/1 or /page/view/1/2
				/page/view/1?           match /page/view/12 or /page/view/13
				/page/view/[12]    just match /page/view/1 or /page/view/2
				/page/view/{12,34} just match /page/view/12 or /page/view/34
		 */
		var mList = typeof mList === 'object' ? mList : [mList]
		, regxMap = {
			exclude: []
			, match: []
		}
		, rs = false
		, matcher
		, regx
		, type
		, i
		;
		
		//* parse match to regx
		for(i = 0; i < mList.length; i++){

			matcher = mList[i];
			type = 'match';
			if(matcher[0] === '!'){
				matcher = matcher.substr(1);
				type = 'exclude';
			}

			if(/\*|\?|\[|\{/.test(matcher)){
				matcher = matcher.replace(/(\*\*|\*|\?|\{[^\}]*\}|\[[^\]]*\])/g, replaceGlobKey).replace(/\{:(\d+)\}/g, revertGlobKey);
				matcher = '^' + matcher + '$';
				matcher = new RegExp(matcher);
			}

			regxMap[type].push(matcher);
		}

		//* check path with regx
		if((mList = regxMap.exclude).length){
			rs = true;
			for(i = 0; i < mList.length; i++){
				if(ruleTest(mList[i], path)){
					rs = false;
					break;
				}
			}
		}

		if((mList.length && rs) || (!mList.length)){
			if((mList = regxMap.match).length){
				rs = false;
				for(i = 0; i < mList.length; i++){
					if(ruleTest(mList[i], path)){
						rs = true;
						break;
					}
				}
			}
		}

		return rs;
		
		
		function ruleTest(regx, s){
			return typeof regx === 'string' ? regx === s : regx.test(s);
		}
		
		
		function replaceGlobKey(k){
			var m = 0;
			
			switch (k){
				case '?':
					m = '.';
				break; case '*':
					m = '{:1}';
				break; case '**':
					m = '{:2}';
				break; default:
					switch (k[0]){
						case '{':
							k = k.substr(1, k.length - 2);
							m = '(' + k.replace(/,/g, '|') + ')';
						break; case '[':
							m = k;
					}
			}
			
			return m;
		}
		
		
		function revertGlobKey(t, k){
			return ({
				1 : '[^\\/]*'
				, 2 : '.*'
			})[k];
		}
	}


	//@ typeOf
	function typeOf(o) {
		return Object.prototype.toString.call(o).slice(8, -1).replace(/^./, function(m){
			return m.toLowerCase();
		});
	}
	
	

	window.router = new Router();
})();
