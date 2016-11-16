(function(global) {
  function WorkerPool(size) {
    var self = this;
    self.poolSize = size;
    self.taskQueue = [];
    self.workerQueue = [];

    self.init = function() {
      for (var i = 0; i < self.poolSize; i++) {
        self.workerQueue.push(new WorkerThread(self));
      }
    }

    self.addTask = function(workerTask) {

      if (self.workerQueue.length > 0) {
            // get the worker from the front of the queue
            var workerThread = self.workerQueue.shift();
            workerThread.run(workerTask);
        } else {
            // no free workers,
            self.taskQueue.push(workerTask);
        }
    }

    self.releaseWorkerThread = function(workerThread) {
      if(self.taskQueue.length > 0) {
        // if has remaining tasks, directly excute the task.
        var workerTask = self.taskQueue.shift();
        workerThread.run(workerTask);
      } else {
        // if no more tasks to do push the thread back to the pool.
        self.workerQueue.push(workerThread);
      }
    }
  }

  function WorkerThread(pool) {
    var self = this;
    self.pool = pool;
    self.workerTask = {};
    self.run = function(workerTask) {
        self.workerTask = workerTask;
        // create a new web worker
        if (self.workerTask.url!= null) {
            var worker = new Worker(workerTask.url);
            worker.addEventListener('message', callback);
            worker.postMessage(workerTask.message);
        }
    }

    function callback(e) {
      self.workerTask.callback(e);
      self.pool.releaseWorkerThread(self);
    }
  }

  function WorkerTask(url, message, callback) {
    this.url = url;
    this.callback = callback;
    this.message = message;
  }

  global.WorkerPool = WorkerPool;
  global.WorkerThread = WorkerThread;
  global.WorkerTask = WorkerTask;
}(this))
