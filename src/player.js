var Player = function (e) {
  this.name = e.name;
  this.team = e.team;
  this.id = e.id;
  this.speed = e.speed || 7;
  this.position = e.position;
  this.material = e.material;
  this.playerCanvas = document.createElement('canvas');
  this.playerCanvas.id = "player_" + this.id + "_layer";
  this.ctx = this.playerCanvas.getContext('2d');
  this.playerCanvas.width = mapPixel[0];
  this.playerCanvas.height = mapPixel[1];
  this.jumpSpeed = e.jumpSpeed || 17;
  this.ctx.imageSmoothingEnabled = false;
  this.v = [0, 0];
  this.innerF = [];
  this.outterF = [];
  gameWrapperDom.appendChild(this.playerCanvas);

  this.moving = true;
  this.draw();

  this.checkUpdate();
};

Player.prototype = new Block({
  size: [16 / 21, 1],
  solid: true,
  moveable: true
});

Player.prototype.move = function (direction) {
  var self = this;
  if (direction != 0) {
    //don't have old force
    if (self.innerF[0] && self.innerF[0].value != self.speed * direction) {
      //have old value, and is different;
      self.innerF[0].destroy();
    }
    if (!self.innerF.length) {
      new Force({
        pusher: self,
        value: self.speed * direction
      });
    }
  }
  else {
    //make stop
    self.innerF[0].destroy();
  }
  if (!this.moving) {
    this.moving = true;
    this.checkUpdate();
  }
};

Player.prototype.jump = function () {
  var self = this;
  if (self.isOnGround()) {
    self.v[1] = -self.jumpSpeed;
    if (!self.moving) {
      self.moving = true;
      self.checkUpdate();
    }
  }
};