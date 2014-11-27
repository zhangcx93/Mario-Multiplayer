//class Material, define materials with bitmap, solid or not (or advanced feature)

var Material = function (e) {
  this.bitmap = e.bitmap;
  this.repeat = e.repeat || false;

};

var Force = function (e) {
  this.pusher = e.pusher;
  this.pushed = [];
  this.value = e.value;
  this.pusher.innerF.push(this);
  if (e.pushed) {
    this.pushed.push(e.pushed);
    e.pushed.outterF.push(this);
  }

};

Force.prototype.addPushed = function (pushed) {
  if (this.pushed.indexOf(pushed) == -1) {
    this.pushed.push(pushed);
  }
};

Force.prototype.destroy = function () {
  this.pusher.innerF.splice(this.pusher.innerF.indexOf(this), 1);
  this.pusher.pushed = false;
  var pushedLength = this.pushed.length;
  if (pushedLength) {
    for (var i = 0; i < pushedLength; i++) {
      this.pushed[i].outterF.splice(this.pushed[i].outterF.indexOf(this), 1);
    }
  }
};

var Block = function (e) {
  this.innerF = [];
  this.outterF = [];
  this.position = e.position;
  this.size = e.size;
  this.material = e.material;
  this.ctx = e.ctx || mapCtx;
  this.v = [0, 0];
  this.solid = e.solid || true;
  this.moveable = e.moveable || false;
};

Block.prototype = {
  draw: function () {
    var x = this.position[0];
    var y = this.position[1];
    var w = this.size[0];
    var h = this.size[1];
    var img = this.material.bitmap;
    var name = this.name;
    var ctx = this.ctx;
    if (Game.showName && name) {
      ctx.textAlign = "center";
      ctx.font = "20px Georgia";
      ctx.fillText(name, (x + w / 2) * unit, (y - 0.2) * unit);
    }

    if (this.material.repeat) {
      ctx.fillStyle = ctx.createPattern(img, 'repeat');
      ctx.fillRect(parseInt(x * unit), parseInt(y * unit), parseInt(unit * w), parseInt(unit * h))
    }
    else {
      ctx.drawImage(img, 0, 0, img.width, img.height, parseInt(x * unit), parseInt(y * unit), parseInt(unit * w), parseInt(unit * h))
    }
  },
  redraw: function () {
    this.ctx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
    this.draw();
  },
  getAllForce: function () {
    if (this.isPushingSolid()) {
      return 0;
    }

    var max = 0, min = 0;
    for (var i = 0, l = this.outterF.length; i < l; i++) {
      if (this.outterF[i].value > max) {
        max = this.outterF[i].value;
      }
      else if (this.outterF[i].value < min) {
        min = this.outterF[i].value;
      }
    }
    if (this.innerF.length && this.innerF[0].value > max) {
      max = this.innerF[0].value;
    }
    else if (this.innerF.length && this.innerF[0].value < min) {
      min = this.innerF[0].value;
    }
    return max + min;
  },
  checkCollision: function () {
    var blocks = this.map.blocks;
    var obj;
    var willCollide = [];
    for (var i = 0, l = blocks.length; i < l; i++) {
      if (blocks[i] != this && blocks[i].solid) {
        //check collision with all other blocks
        obj = blocks[i];
        if (this.v[0] > 0) {
          //go right
          if (this.position[0] + this.v[0] / frames + this.size[0] > obj.position[0] //next overflow
            && this.position[0] + this.size[0] <= obj.position[0] // now not overflow
            && ((this.position[1] >= obj.position[1] && this.position[1] < obj.position[1] + obj.size[1])
            || (this.position[1] + this.size[1] > obj.position[1] && this.position[1] + this.size[1] <= obj.position[1] + obj.size[1]))
          ) {
            willCollide.push(obj);
          }
        }
        else if (this.v[0] < 0) {
          //go left
          if (this.position[0] + this.v[0] / frames < obj.position[0] + obj.size[0] //next overflow
            && this.position[0] >= obj.position[0] + obj.size[0] // now not overflow
            && ((this.position[1] >= obj.position[1] && this.position[1] < obj.position[1] + obj.size[1])
            || (this.position[1] + this.size[1] > obj.position[1] && this.position[1] + this.size[1] <= obj.position[1] + obj.size[1]))
          ) {
            willCollide.push(obj);
          }
        }
      }
    }

    var willCollideLength = willCollide.length, bestCollideObj = willCollide[0], j;

    if (willCollide.length > 1) {
      //filter
      if (this.v[0] > 0) {
        //get the leftest
        for (j = 0; j < willCollideLength; j++) {
          if (willCollide[j].position[0] < bestCollideObj) {
            bestCollideObj = willCollide[j];
          }
        }
      }
      else {
        //get the rightest
        for (j = 0; j < willCollideLength; j++) {
          if (willCollide[j].position[0] > bestCollideObj) {
            bestCollideObj = willCollide[j];
          }
        }
      }
    }
    else {
      return bestCollideObj;//no one or the only one;
    }
  },
  isOnGround: function () {
    var blocks = this.map.blocks;
    var obj;
    for (var i = 0, l = blocks.length; i < l; i++) {
      if (blocks[i] != this && blocks[i].solid) {
        obj = blocks[i];
        if (this.position[1] + this.size[1] <= obj.position[1] + 0.00001 &&
          this.position[1] + this.v[1] / frames + this.size[1] >= obj.position[1] - 0.00001
          && ((this.position[0] >= obj.position[0] && this.position[0] < obj.position[0] + obj.size[0]) ||
          (this.position[0] + this.size[0] <= obj.position[0] + obj.size[0] && this.position[0] + this.size[0] > obj.position[0])
          )
        ) {
          return obj;
        }
      }
    }
    return false;
  },
  isOnCeil: function () {
    var blocks = this.map.blocks;
    var obj;
    for (var i = 0, l = blocks.length; i < l; i++) {
      if (blocks[i] != this && blocks[i].solid) {
        obj = blocks[i];
        if (this.position[1] >= obj.position[1] + obj.size[1] - 0.00001 &&
          this.position[1] + this.v[1] / frames <= obj.position[1] + obj.size[1] + 0.00001
          && ((this.position[0] >= obj.position[0] && this.position[0] < obj.position[0] + obj.size[0]) ||
          (this.position[0] + this.size[0] <= obj.position[0] + obj.size[0] && this.position[0] + this.size[0] > obj.position[0])
          )
        ) {
          return obj;
        }
      }
    }
    return false;
  },
  isPushingSolid: function () {
    //if i'm pushing someone pushing solid stuff, or pushing solid stuff;
    return this.pushed && (!this.pushed.moveable || this.pushed.isPushingSolid());
  },
  update: function (pusher, force) {
    var self = this;
    if (!this.moveable) {
      //dont update
      if (pusher) {
        pusher.position[0] = self.position[0] + (pusher.v[0] > 0 ? (-pusher.size[0] - 0.00001) : self.size[0] + 0.00001);
        pusher.redraw();
      }
      return "stop";
    }

    self.v[0] = self.getAllForce();
    //on x axis:

    if (self.v[0] != 0) {

      var pushed = this.pushed = self.checkCollision();
      if (pushed) {
        //compare t
        var pushForce;
        if (self.innerF[0]) {
          //has self force
          var oldValue = self.innerF[0].value;
          //remove this force, exchange with new force
          self.innerF[0].destroy();
          pushForce = new Force({
            pusher: self,
            pushed: pushed,
            value: oldValue
          });
        }
        if (force) {
          //pushed by someone else
          force.addPushed(pushed);//make origin force push;
          pushForce = force;
        }

        pushed.update(self, pushForce);
      }
      else {
        self.position[0] += self.v[0] / frames;
        self.redraw();
        if (pusher) {
          pusher.position[0] = self.position[0] + (pusher.v[0] > 0 ? (-pusher.size[0] - 0.00001) : self.size[0] + 0.00001);
          pusher.redraw();
        }
      }
    }
    else {
      if (self.pushed) {
        self.position[0] = self.pushed.position[0] + (self.v[0] > 0 ? (-self.size[0] - 0.00001) : self.pushed.size[0] + 0.00001);
        //self.redraw();
      }
      //do nothing;
    }

    if (self.v[1] >= 0) {
      var ground = self.isOnGround();
      if (ground) {
        self.v[1] = 0;
        self.position[1] = ground.position[1] - self.size[1];
      }
      else {
        self.v[1] += Env.gravity / frames;
        if (self.v[1] > Env.maxSpeed) {
          self.v[1] = Env.maxSpeed
        }
        self.position[1] += self.v[1] / frames;
      }
    }
    else {
      var ceil = self.isOnCeil();
      if (ceil) {
        self.v[1] = -self.v[1];
        self.position[1] = ceil.position[1] + ceil.size[1];
      }
      else {
        self.v[1] += Env.gravity / frames;
        if (self.v[1] > Env.maxSpeed) {
          self.v[1] = Env.maxSpeed
        }
        self.position[1] += self.v[1] / frames;
      }
    }

    self.redraw();

    if(self.v[0] == 0 && self.v[1] == 0) {
      self.moving = false;
    }

  },
  checkUpdate: function () {
    var self = this;
    var animate = function () {
      requestAnimationFrame(function () {
        self.update();
        if (self.moving) {
          animate();
          return;
        }
      })
    };
    animate();

  }
};


var Map = function () {
  this.blocks = [];
  this.init = false;
  //this.peoples = [];
};

Map.prototype = {
  addBlock: function (block) {
    block.map = this;
    this.blocks.push(block);
  },
  addBlocks: function (blocks) {
    for (var i = 0, l = blocks.length; i < l; i++) {
      blocks[i].map = this;
      this.blocks.push(blocks[i]);
    }
  },
  paintBlocks: function () {
    var blocks = this.blocks;
    for (var i = 0, l = blocks.length; i < l; i++) {
      blocks[i].draw();
    }
    this.init = true;
  }
};
