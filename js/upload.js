// manage upload zone.
var UploadZone = (function(UploadZonem, Mosaic) {

  var uploadModule = {};
  // variables
  uploadModule.uploadZone = document.getElementById('upload-zone');
  uploadModule.selectedImg = document.getElementById('selected-img');
  uploadModule.uploadInput = document.getElementById('file-input');
  uploadModule.instructions = document.getElementById('instructions');
  uploadModule.mosaicContainer = document.getElementById('mosaic-container');
  uploadModule.nyanCat = document.getElementById('nyan-cat');

  uploadModule.init = function() {
    uploadModule.uploadZone.addEventListener('dragleave', handleDragLeave, false);
    uploadModule.uploadZone.addEventListener('dragover', handleDragOver, false);
    uploadModule.uploadInput.addEventListener('change', handleFileOnChange, false);
  }

  function handleFileOnChange(e) {
    var reader = new FileReader();
    var svgHost = 'https://' + window.location.host + '/color/';
    reader.onload = function (event) {
      uploadModule.instructions.style.display = 'none';
      uploadModule.selectedImg.src = event.target.result;
      $.removeClass(uploadModule.uploadZone, 'active');
      // Clear existing one.
      uploadModule.mosaicContainer.innerHTML = '';
      // create a new Mosaic photo.
      var mosaic = new Mosaic(uploadModule.selectedImg, svgHost);
      var context = mosaic.renderCanvas();
      $.removeClass(uploadModule.nyanCat, 'reset');
      $.addClass(uploadModule.mosaicContainer, 'rainbow-background');
      mosaic.createMosaic(context ,uploadModule.mosaicContainer, function() {
        uploadModule.uploadInput.disabled = false;
        $.removeClass(uploadModule.mosaicContainer, 'rainbow-background');
        $.addClass(uploadModule.nyanCat, 'fly');
        setTimeout(function() {
          $.removeClass(uploadModule.nyanCat, 'fly');
          $.addClass(uploadModule.nyanCat, 'reset');
        }, 2000);
      });
      uploadModule.uploadInput.disabled = true;
    }
    if(e.target.files) {
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function handleDragLeave(e) {
    e.stopPropagation();
    e.preventDefault();
    $.removeClass(uploadModule.uploadZone, 'active');
  }

  function handleDragOver(e) {
    e.stopPropagation();
    e.preventDefault();
    $.addClass(uploadModule.uploadZone, 'active');
  }

  return uploadModule;
}(UploadZone, Mosaic))
