
(function(){
  "use strict";
  function init() {
    var classHandler = {};
    var self = classHandler;
    classHandler.hasClass = function (obj, cls) {
      return obj.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    };
    classHandler.addClass = function (obj, cls) {
      if (!self.hasClass(obj, cls)) obj.className += " " + cls;
    };
    classHandler.removeClass = function (obj, cls) {
      if (self.hasClass(obj, cls)) {
          var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
          obj.className = obj.className.replace(reg, ' ');
      }
    };
    classHandler.toggleClass = function (obj,cls){
      if(self.hasClass(obj,cls)){
          self.removeClass(obj, cls);
      }else{
          self.addClass(obj, cls);
      }
    };

    return classHandler;
  }

  this.$ = init();

}.call(this))
