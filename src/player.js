var Player = function (e) {
  this.name = e.name;
  this.team = e.team;
  this.id = e.id;
  this.roomId = e.roomId;
  this.speed = e.speed || 7;
  this.position = e.position;
  if (typeof e.material == 'string') {
    this.material = MaterialList[e.material];
  }
  else {
    this.material = e.material;
  }
  this.playerCanvas = document.createElement('canvas');
  this.playerCanvas.id = "player_" + this.id + "_layer";
  this.ctx = this.playerCanvas.getContext('2d');
  this.playerCanvas.width = mapPixel[0];
  this.playerCanvas.height = mapPixel[1];
  this.jumpSpeed = e.jumpSpeed || 17;
  this.ctx.mozImageSmoothingEnabled = false;
  this.ctx.webkitImageSmoothingEnabled = false;
  this.ctx.msImageSmoothingEnabled = false;
  this.ctx.imageSmoothingEnabled = false;
  this.ctx.imageSmoothingEnabled = false;
  this.v = [0, 0];
  this.innerF = [];
  this.outterF = [];
  gameWrapperDom.appendChild(this.playerCanvas);

  this.moving = true;
  this.blood = 3;

  this.draw();
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
};

Player.prototype.jump = function (force) {
  var self = this;
  if (force || self.isOnGround()) {
    requestAnimationFrame(function () {
      self.v[1] = -self.jumpSpeed;
    });

  }
};

Player.prototype.destroy = function () {
  var self = this;
  self.playerCanvas.parentNode.removeChild(self.playerCanvas);

  PlayerList.splice(PlayerList.indexOf(this), 1);
};

Player.prototype.isOnEnemy = function(enemy) {
  this.jump(true);
  var self = this;
  socket.emit('hit', {
    room: self.roomId,
    hit: enemy.id,
    by: self.id
  })
};

Player.prototype.die = function() {
  alert(this.name + ' is died');
};