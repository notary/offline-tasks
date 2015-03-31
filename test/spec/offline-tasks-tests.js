describe('lazy promo start tests', function () {
	var OfflineTasks = null;
	var storage = null;
	var offTasks = null;

	function assert (expression, msg) {
		if (!expression) throw new Error(msg);
	}

	function checkConnectionMethod () {
		return true;
	}

	before(function (done) {
		OfflineTasks = window.OfflineTasks;
		storage = window.OfflineTasks.providers.storageProvider;

		offTasks = new OfflineTasks({
			provider: storage,
			connectionTest: checkConnectionMethod
		});
		done();
	});

	it('check connection test', function (done) {
		var result = offTasks.checkConnection();
		assert(result === true);
		done();
	});

	it('check save/load rewrite = true', function (done) {
		var obj = {test: 1};
		var obj2 = {test: 2};
		var key = 'test';
		offTasks.save(key, obj, true);
		offTasks.save(key, obj2, true);
		var result = offTasks.load(key);
		assert(result.length === 1 && result[0].test === 2);
		done();
	});

	it('check save/load rewrite = false', function (done) {
		var obj = {test: 1};
		var obj2 = {test: 2};
		var key = 'test';
		offTasks.save(key, obj, true);
		offTasks.save(key, obj2);
		var result = offTasks.load(key);
		assert(result.length === 2
			&& result[0].test === 1
			&& result[1].test === 2
		);
		done();
	});

	it('check save/load many keys', function (done) {
		var obj = {test: 1};
		var obj2 = {test: 2};
		var key1 = 'test1';
		var key2 = 'test2';
		offTasks.save(key1, obj, true);
		offTasks.save(key2, obj2, true);
		var result = offTasks.load([key1, key2]);
		assert(
				result[key1]
			&& result[key2]
			&& result[key1][0].test === 1
			&& result[key2][0].test === 2
		);
		done();
	});

	it('remove task', function (done) {
		var obj = {test: 1};
		var key = 'test';
		offTasks.save(key, obj, true);
		offTasks.remove(key);
		var result = offTasks.load(key);
		assert(!result);
		done();
	});


	it('run tasks test', function (done) {
		this.timeout(5000);
		var observ = null;
		var propName = 'test5';
		var obj = {};
		obj[propName] = 1;
		var obj2 = {};
		obj2[propName] = 2;
		var key = 'test';
		offTasks.save(key, obj, true);
		offTasks.save(key, obj2);
		var waitingValue = 1;
		offTasks.saveManagerRegistry(key, function (data, callback) {
			observ = data;
			assert(observ[propName] === waitingValue);
			waitingValue++;
			setTimeout(function () {
				callback({}, 'success');
				done();
			}, 10);
		});
		offTasks.run(key);
	});
});
