# offline-tasks
Library for saving the task when there is no connection to the Internet, and run when an Internet connection will be

## Using
### 1. Create
```js
    var provider = window.localStorage;
    var offTasks = new OfflineTasks({
        provider: provider,
        connectionTest: function (callback) {
            //some connection test Function
            callback(null, 'error'); //or other status
        },
        timeout: 10000, //check the connection timeout
        autorun: false  //to run the task immediately after saving
    });
```

### 2. Registration functions tasks
```js
    offTasks.saveManagerRegistry('somaTasksName', function (taskData, callback) {
        //something do here
        callback('error); //or other status
    });
```

### 3. Add tasks
```js
    var task1 = {data: 'example 1'};
    var task2 = {data: 'example 2'};
    offTasks.save('taskName', task1);
    offTasks.save('taskName', task2);
    // in the storage will be saved [{data: 'example 1'}, {data: 'example 2'}]
```
```js
    var task1 = {data: 'example 1'};
    var task2 = {data: 'example 2'};
    offTasks.save('taskName', task1);
    offTasks.save('taskName', task2, true); // rewrite tasks is true
    // in the storage will be saved [{data: 'example 2'}]
```

### 4. Load all tasks from provider
```js
    var tasks = offTasks.load();
```

### 5. Load tasks by keys from provider
```js
    var keys = ['key1', 'key2'];
    var tasks = offTasks.load(keys);
```

### 6. Run tasks
```js
    // all tasks
    offTasks.run();
    // tasks by keys
    offTasks.run(keys);
```

### 7. Remove task
```js
    offTasks.remove('key');
```

### 8. Check Connection
```js
	offTasks.checkConnection(function (e, status) {
		//do something
	);
```

### 9. Check Tasks Exists
```js
	var result = offTasks.hasTasks();
```

### 10. Subscribing on events
```js
	var onConnectionOpen = function () {
	    //do something 
	 };
	offTasks.on('on:connection:open', onConnectionOpen);
```

### 11. Describing from events
```js
	offTasks.off('on:connection:open', onConnectionOpen);
```

## Events

### 1. on:connection:open
	Triggered when connection opened

### 2. on:task:complete
	Triggered when task completed
	
### 3. on:tasks:allowed
	Triggered if there is available tasks