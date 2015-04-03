(function (provider) {
	var context = window || {};
	if(typeof define === 'function' && define.amd) {
		//AMD
		define(['OfflineTasks/Providers/storageProvider'], provider);
	} else if (typeof exports === 'object') {
		//CommonJS
		provider();
	} else {
		//Globals
		window.OfflineTasks.providers = window.OfflineTasks.providers || {};
		window.OfflineTasks.providers.storageProvider = provider();
	}

}(function () {
		// Check exists localStorage
		var storage = window.localStorage || null;
		// return null if localStorage doesn't exists
		if(!storage) return null;

		var defaultOptions = {
			prefix: 'lsp'
		};

		var storageProvider = {
			/**
			* Set options
			* @param {Object} options
			*				  {options.prefix}
			**/
			setOptions: function (options) {
				var opt = null;
				this.options = this.options || JSON.parse(JSON.stringify(defaultOptions));
				for(opt in options) {
					if (options.hasOwnProperty(opt)) {
						this.options[opt] = options[opt];
					}
				}
			},

			getItem: function (key) {
				var val = storage.getItem(this._getKey(key));
				return JSON.parse(val);
			},

			setItem: function (key, value) {
				if(!value) return this.removeItem(key);
				storage.setItem(this._getKey(key), JSON.stringify(value));
			},

			removeItem: function (key) {
				storage.removeItem(this._getKey(key));
				return true;
			},

			_getKey: function (key) {
				return this.options.prefix + key;
			}
		};

		storageProvider.setOptions(null);

		//if ctx is define then add Provider to ctx
		return storageProvider;
	})
);