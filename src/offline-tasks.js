(function (manager) {
	'use strict';

	var context = window || {};
	if(typeof define === 'function' && define.amd) {
		//AMD
		define([], manager);
	} else if (typeof exports === 'object') {
		//CommonJS
		manager();
	} else {
		//Globals
		window.OfflineTasks = manager();
	}
}(function () {

	var Class = function () {};
	Class.inherit = Object.create || function (proto) {
		function F () {}
		F.prototype = proto;
		return new F();
	};
	Class.extend = function (props) {
		if(!props) return this;

		function Constructor () {
			this.init && this.init.apply(this, arguments);
		}
		Constructor.prototype = Class.inherit(this.prototype);
		Constructor.prototype.constructor = Constructor;
		Constructor.extend = Class.extend;

		for(var name in props) {
			Constructor.prototype[name] = props[name];
		}

		return Constructor;
	};

	var objectKeys = Object.keys || function (obj) {
		var result = [];
		for(var key in obj) {
			if(obj.hasOwnProperty(key)) {
				result.push(key);
			}
		}
		return result;
	};

	var EventListener = Class.extend({
		init: function () {
			this.events = {};
		},

		on: function (eventName, callback) {
			if(!this.events[eventName]) 
				this.events[eventName] = [];

			var events = this.events[eventName];
			if(events.indexOf(callback) < 0) {
				this.events[eventName].push(callback);
			}
		},

		off: function (eventName, callback) {
			var events = this.events[eventName];
			if(events) {
				var idx = events.indexOf(callback);
				events.splice(idx, 1);
			}
		},

		_fire: function (eventName) {
			var events = this.events[eventName];
			if(!events) return;
			var args = Array.prototype.slice.call(arguments, 1);
			for(var i = 0; i < events.length; i++) {
				events[i](args);
			}
		}
	});

	/**
	 * Prefix from key
	 * @type {string}
	 * @const
	 */
	var KEY = 'offline_tasks';

	/**
	 * Key from Keys array
	 * @type {string}
	 * @const
	 */
	var KEYS_NAME = 'keys';

	var OfflineTasks = EventListener.extend({
		/**
		 * @param {Object} params
		 *        {Object} params.provider
		 *        {Function} params.connectionTest
		 *        {Boolean} params.autorun
		 *        {integer} [params.timeout]
		 */
		init: function (params) {
			if(!params.provider)
				throw 'provider can not be undefined';
			if(!params.connectionTest)
				throw 'connectionTest can not be undefined';

			EventListener.prototype.init.apply(this, params);

			this.provider = params.provider;
			this.test = params.connectionTest;
			this.tick = params.timeout || 10000;
			this.autorun = params.autorun || false;
			this.connectionState = false;
			this.tasks = null;
			this.timeout = null;
			this.saveManagers = {};
			this._curKeys = {};
		},

		/**
		 * Check connection
		 * @param {Function} callback
		 * @returns {Boolean}
		 */
		checkConnection: function (callback) {
			var self = this;
			var fn = function (e, status) {
				self.connectionState = status !== 'error';
				callback && callback(e, status);
			};
			var result = this.test(fn);
			this.connectionState  = false;
			if(Object.prototype.toString.apply(result) === '[object Boolean]'){
				fn(null, result === true ? 'success' : 'error');
			}
			return result;
		},

		/**
		 * Get provide key from task key
		 * @returns {string}
		 * @private
		 */
		_getTaskKeys: function () {
			return this.provider.getItem(this._getKey(KEYS_NAME)) || [];
		},

		_getKey: function (key) {
			return KEY + '_' + key;
		},

		_loadKeys: function (keys) {
			var i = 0;
			if(Object.prototype.toString.call(keys) !== '[object Array]') keys = [keys];
			for(; i < keys.length; i++) {
				this._curKeys[keys[i]] = true;
			}

			return objectKeys(this._curKeys);
		},

		/**
		 * Load tasks from provider by keys
		 * @param {Array | string} keys
		 * @param {Function} callback
		 */
		load: function (keys) {
			var keysArray = this._getTaskKeys();
			var loadOne = false;
			if(!keysArray) return null;
			if(!keys) keys = keysArray;

			if(Object.prototype.toString.apply(keys) !== '[object Array]'){
				loadOne = true;
				keys = [keys];
			}
			this.tasks = {};
			for(var i = 0; i < keys.length; i++) {
				if (keysArray === keys || !!~keysArray.indexOf(keys[i])) {
					this.tasks[keys[i]] = this.provider.getItem(this._getKey(keys[i]));
				}
			}
			return !loadOne ? this.tasks : this.tasks [keys[0]];
		},

		/**
		 * Save task with provider
		 * @param {string} key
		 * @param {Object | Array} data
		 * @param {Boolean} [isRewrite]
		 */
		save: function (key, data, isRewrite) {
			var keys = this._getTaskKeys();
			var hasKey = true;
			var storageKey = this._getKey(key);
			if(!~keys.indexOf(key)) {
				hasKey = false;
				keys.push(key);
				this.provider.setItem(this._getKey(KEYS_NAME), keys);
			}
			if(Object.prototype.toString.apply(data) !== '[object Array]') data = [data];
			if(hasKey && !isRewrite) {
				var cur = this.provider.getItem(storageKey) || [];
				data = cur.concat(data);
			}
			if(this.tasks) this.tasks[key] = data;

			this.provider.setItem(storageKey, data);

			if(this.autorun) this.run(key);
		},

		/**
		 * Remove task by key
		 * @param {string} key
		 * @param {Number} [index]
		 */
		remove: function (key, index) {
			var keys = this._getTaskKeys();
			if(index && typeof index === 'number') {
				this.tasks[key][index] = '';
				this.provider.setItem(self._getKey(key), this.tasks[key]);
			} else {
				var idx = keys.indexOf(key);
				if(idx < 0) return null;
				keys.splice(idx, 1);
				delete this._curKeys[key];
				if(this.tasks) this.tasks[key] = null;
				this.provider.setItem(this._getKey(KEYS_NAME), keys);
				this.provider.removeItem(this._getKey(key));
			}
		},

		/**
		 * Run saved tasks
		 * @param {Array | string} keys
		 */
		run: function (keys) {
			var self = this;
			var fnOnConnection = null;

			clearTimeout(self.timeout);

			keys = keys || 	this._getTaskKeys();
			keys = this._loadKeys(keys);

			fnOnConnection = function () {
				if(self.connectionState) {
					self._fire('on:connection:open');
					self._runProcess(keys);
				} else {
					self.timeout = setTimeout(self.run.bind(self, keys), self.tick);
				}
			};

			this.checkConnection(fnOnConnection);
		},

		/**
		 * Save task process
		 * @param {Array} keys
		 * @private
		 */
		_runProcess: function (keys) {
			var self = this;
			var key = null;
			var saveManager = null;
			var fnSave = null;

			if(!this.tasks && !this.load(keys)) return;

			var fnDone = function (task, index) {
				var count = 0;
				var length = self.tasks[task].length;
				return function (status) {
					if(status !== 'error' || !status) {
						count++;
						index = count >= length ? null : index;
						self.remove(task, index);
						!index && self._fire('on:task:complete', task);
					}
				}
			};

			for(var i = 0; i < keys.length; i++) {
				key = keys[i];
				if(!this.tasks[key] || !(saveManager = this.saveManagers[key])) continue;
				fnSave = typeof saveManager === 'function' ? saveManager : saveManager.save.bind(saveManager);
				var tasks = this.tasks[key];
				for(var j = 0; j < tasks.length; j++) {
					if(tasks[j]) {
						fnSave(tasks[j], fnDone(key, j));
					}
				}
			}
		},

		/**
		 * Registration Task Manager
		 * @param {Array | Object} keys - Array of keys or Map(key: Object|Function(return Object))
		 * @param {Object | Function} [manager] - manager for key task. Function should receive 2 parameters: task, function done (e, status)
		 */
		saveManagerRegistry: function (keys, manager) {
			if(manager) {
				this.saveManagers[keys] = manager;
			} else {
				for(var k in keys) {
					if(!keys.hasOwnProperty(k)) continue;
					this.saveManagers[k] = keys[k];
				}
			}
			return this;
		}
	});

	return OfflineTasks;
}));