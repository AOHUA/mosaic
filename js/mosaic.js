// Constants shared between client and server.
var TILE_WIDTH = 16;
var TILE_HEIGHT = 16;

var exports = exports || null;
if (exports) {
  exports.TILE_WIDTH = TILE_WIDTH;
  exports.TILE_HEIGHT = TILE_HEIGHT;
}

(function() {
  'use strice';

  // Mosaic settings
  var CONTAINER_WIDTH = 448;
  var CONTAINER_HEIGHT = 448;

  function Mosaic(image, svgHost) {

    // calculate a suitable canvas size for seperating tiles.
    this.numberOfTileX = Math.floor(CONTAINER_WIDTH / TILE_WIDTH);
    this.numberOfTileY = Math.floor(CONTAINER_HEIGHT / TILE_HEIGHT);
    this.canvasWidth = this.numberOfTileX * TILE_WIDTH;
    this.canvasHeight = this.numberOfTileY * TILE_HEIGHT;

    /*
    * create a canvas to calculate.
    * Render a canvas so that later can use this canvas to calculate
    * the average color for each tile.
    */
    this.renderCanvas = function() {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
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
      if(image.offsetWidth > this.canvasWidth) {
        imgWidth = this.canvasWidth;
        canvasWidth = this.canvasWidth;
        imgX = (image.offsetWidth - this.canvasWidth) / 2;
      } else {
        canvasX = (this.canvasWidth - image.offsetWidth) / 2;
      }
      if(image.offsetHeight > this.canvasHeight) {
        imgHeight = this.canvasHeight;
        canvasHeight = this.canvasHeight;
        imgY = (image.offsetHeight - this.canvasHeight) / 2;
      } else {
        canvasY = (this.canvasHeight - image.offsetHeight) / 2;
      }
      context.drawImage(image, imgX, imgY, imgWidth, imgHeight, canvasX, canvasY, canvasWidth, canvasHeight);
      return context;
    }
    // current row that is being processing.
    this.row = 0;
    this.createMosaic = function(context, mosaicContainer, callBack) {
      var self = this;
      this.tileCanvas(context, self.row).then(function(svgGroup) {
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
    // tile canvas row by row.
    this.tileCanvas = function(context, row) {
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
          var blob = new Blob([document.getElementById('tile-color-worker').textContent]);
          var worker = new Worker(window.URL.createObjectURL(blob));
          // start tile color worker
          worker.postMessage({tileWidth: TILE_WIDTH, tileHeight: TILE_HEIGHT,
            x, y, width: self.canvasWidth, originalImageData, svgHost});
          worker.addEventListener('message', function(rowNumber, e) {
            var svg = e.data.data;
            var columnNumber = e.data.columnNumber;
            tiles[columnNumber] = svg;
            count += 1;
            if (count === self.numberOfTileX) {
              var svgGroup = "";
              tiles.forEach(function(tile) {
                svgGroup += tile;
              });
              resolve(svgGroup);
            }
          }.bind(self, x));
        }
      });
      return tileCanvasPromise;
    }
  }

  this.Mosaic = Mosaic;

}.call(this));
