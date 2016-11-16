(function(global) {
  'use strice';

  // Mosaic settings
  var CONTAINER_WIDTH = 448;
  var CONTAINER_HEIGHT = 448;
  var COLOR_WORKER_SIZE = 16;
  var SVG_WORKER_SIZE = 10;

  function Mosaic(image, svgHost) {
    var self = this;
    // calculate a suitable canvas size for seperating tiles.
    self.numberOfTileX = Math.floor(CONTAINER_WIDTH / TILE_WIDTH);
    self.numberOfTileY = Math.floor(CONTAINER_HEIGHT / TILE_HEIGHT);
    self.canvasWidth = self.numberOfTileX * TILE_WIDTH;
    self.canvasHeight = self.numberOfTileY * TILE_HEIGHT;

    // worker pool to calculate the average color of each tile.
    self.averageColorWorkerPool = new WorkerPool(COLOR_WORKER_SIZE);
    self.averageColorWorkerPool.init();
    // worker pool to retrieve the svg of each tile. Max 6 connections.
    self.svgWorkerPool = new WorkerPool(SVG_WORKER_SIZE);
    self.svgWorkerPool.init();

    /*
    * create a canvas to calculate.
    * Render a canvas so that later can use this canvas to calculate
    * the average color for each tile.
    */
    self.renderCanvas = function() {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = self.canvasWidth;
      canvas.height = self.canvasHeight;
      /*
      *  calculate the image and canvas draw position
      *  and size to centralize the result without resize the original image.
      */
      var imgX = 0;
      var imgY = 0;
      var imgWidth = image.offsetWidth;
      var imgHeight = image.offsetHeight;
      var canvasX = 0;
      var canvasY = 0;
      var canvasWidth = image.offsetWidth;
      var canvasHeight = image.offsetHeight;
      if(image.offsetWidth > self.canvasWidth) {
        imgWidth = self.canvasWidth;
        canvasWidth = self.canvasWidth;
        imgX = (image.offsetWidth - self.canvasWidth) / 2;
      } else {
        canvasX = (self.canvasWidth - image.offsetWidth) / 2;
      }
      if(image.offsetHeight > self.canvasHeight) {
        imgHeight = self.canvasHeight;
        canvasHeight = self.canvasHeight;
        imgY = (image.offsetHeight - self.canvasHeight) / 2;
      } else {
        canvasY = (self.canvasHeight - image.offsetHeight) / 2;
      }
      context.drawImage(image, imgX, imgY, imgWidth, imgHeight, canvasX, canvasY, canvasWidth, canvasHeight);
      return context;
    }
    // current row that is being processing.
    self.row = 0;
    self.createMosaic = function(context, mosaicContainer, callBack) {
      self.tileCanvas(context, self.row).then(function(svgGroup) {
        mosaicContainer.innerHTML = mosaicContainer.innerHTML + svgGroup;
        self.row++;
        if (self.row < self.numberOfTileX) {
          self.createMosaic(context, mosaicContainer, callBack);
        }
        if(self.row === self.numberOfTileX) {
          callBack();
        }
      });
    }

    // An object to save existing svg for different color.
    self.existingSvg = {};
    // tile canvas row by row.
    self.tileCanvas = function(context, row) {
      var self = this;
      var tileCanvasPromise = new Promise(function(resolve, reject) {
        var count = 0;
        var tiles = [];
        // get pixel data of original canvas
        var originalImageData = context.getImageData(0, 0, self.canvasWidth, self.canvasHeight);
        // generate row by row
        for(var j = 0; j < self.numberOfTileY; j++) {
          // calculate the location of each tile.
          var x = row * TILE_WIDTH;
          var y = j * TILE_HEIGHT;
          var count = 0;
          (function(columnNumber){
            var averageColorWorkerBlob = new Blob([document.getElementById('average-color-worker').textContent]);
            var averageColorWorkerURL = global.URL.createObjectURL(averageColorWorkerBlob);
            var averageColorWorkerMessage = {
              tileWidth: TILE_WIDTH,
              tileHeight: TILE_HEIGHT,
              width: self.canvasWidth,
              x,
              y,
              originalImageData,
            }
            var averageColorWorkerCallback = function(averageColorEvent) {
              var color = averageColorEvent.data;
              var svgWorkerCallback = function(svgEvent) {
                if (!self.existingSvg[color+'']) {
                  self.existingSvg[color+''] = svgEvent.data;
                }
                tiles[columnNumber] = svgEvent.data;
                if(count === self.numberOfTileX - 1) {
                  self.current++;
                  var svgGroup = "";
                  tiles.forEach(function(tile) {
                    svgGroup += tile;
                  });
                  resolve(svgGroup);
                }
                count++;
              };
              if(!self.existingSvg[color+'']) {
                var svgWorkerBlob = new Blob([document.getElementById('svg-worker').textContent]);
                var svgWorkerURL = global.URL.createObjectURL(svgWorkerBlob);
                var svgWorkerMessage = { color: color, svgHost };
                var svgWorkerTask = new WorkerTask(svgWorkerURL, svgWorkerMessage, svgWorkerCallback);
                self.svgWorkerPool.addTask(svgWorkerTask);
              } else {
                svgWorkerCallback({ data: self.existingSvg[color+''] });
              }
            }
            var averageColorWorkerTask = new WorkerTask(averageColorWorkerURL, averageColorWorkerMessage, averageColorWorkerCallback);
            self.averageColorWorkerPool.addTask(averageColorWorkerTask);
          }(j));
        }
      });
      return tileCanvasPromise;
    }
  }

  global.Mosaic = Mosaic;

}(this));
