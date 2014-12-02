var UI = function () {
  this.canvas = document.createElement('canvas');
  this.canvas.width = mapPixel[0];
  this.canvas.height = mapPixel[1];
  gameWrapperDom.appendChild(this.canvas);
  this.ctx = this.canvas.getContext('2d');
  this.ctx.font = "20px Georgia";
};

UI.prototype = {
  draw: function () {
    console.log('draw');
    this.ctx.clearRect(0, 0, mapPixel[0], mapPixel[1]);
    var p = [1, 1];
    var x = [0, mapPixel[0] - 100];
    for (var i = 0; i < PlayerList.length; i++) {
      var team = PlayerList[i].team;
      this.ctx.fillText(PlayerList[i].name + ': ' + PlayerList[i].blood, x[team], p[team] * unit);
      p[team] += 0.5;
    }
  },
  destroy: function() {
    var canvas = this.canvas;
    canvas.parentNode.removeChild(canvas);
  }
};

ui = new UI();