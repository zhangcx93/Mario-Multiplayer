//class Material, define materials with bitmap, solid or not (or advanced feature)

var Material = function (e) {
  this.name = e.name;
  this.bitmap = e.bitmap;
  this.repeat = e.repeat || false;

  MaterialList[e.name] = this;

};

var Force = function (e, byOther) {
  var self = this;
  self.pusher = e.pusher;
  self.pushed = [];
  self.value = e.value;
  self.pusher.innerF.push(self);
  if (e.pushed) {
    self.pushed.push(e.pushed);
    e.pushed.outterF.push(self);
  }
  self.byOther = byOther;
  if(!byOther) {
    socket.emit('addForce', {
      room: PlayerList[0].roomId,
      pusher: self.pusher.id,
      value: e.value
    })
  }

};

Force.prototype.addPushed = function (pushed) {
  if (this.pushed.indexOf(pushed) == -1) {
    this.pushed.push(pushed);
    pushed.outterF.push(this);
  }
  var self = this;
  if(!self.byOther) {
    socket.emit('addPushedForce', {
      room: PlayerList[0].roomId,
      pusher: self.pusher.id,
      pushed: pushed.id
    })
  }
};

Force.prototype.deletePushed = function (pushed) {
  this.pushed.splice(this.pushed.indexOf(pushed), 1);
  pushed.outterF.splice(pushed.outterF.indexOf(this), 1);
  var self = this;
  if(!self.byOther) {
    socket.emit('removePushedForce', {
      room: PlayerList[0].roomId,
      pusher: self.pusher.id,
      pushed: pushed.id
    })
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
  var self = this;
  if(!self.byOther) {
    socket.emit('destroyForce', {
      room: PlayerList[0].roomId,
      id: PlayerList[0].id,
      pusher: self.pusher.id
    })
  }
};

var Block = function (e) {
  this.innerF = [];
  this.outterF = [];
  this.position = e.position || [0, 0];
  this.size = e.size || [1, 1];
  this.id = e.id || '' + this.position[0] + this.position[1] + this.size[0] + this.size[1];
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
            && this.position[0] <= obj.position[0] + obj.size[0] // now righter
            && ((this.position[1] >= obj.position[1] && this.position[1] < obj.position[1] + obj.size[1])
            || (this.position[1] + this.size[1] > obj.position[1] && this.position[1] + this.size[1] <= obj.position[1] + obj.size[1]))
          ) {
            willCollide.push(obj);
          }
        }
        else if (this.v[0] < 0) {
          //go left
          if (this.position[0] + this.v[0] / frames < obj.position[0] + obj.size[0] //next overflow
            && this.position[0] >= obj.position[0] // now lefter
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
  isPushingSolid: function (pusher) {
    //if i'm pushing someone pushing solid stuff, or pushing solid stuff;
    if(!this.innerF[0]) {
      return false;
    }
    var pushed = this.innerF[0].pushed;
    for(var i = 0, l = pushed.length; i < l ;i++) {
      if (pushed == pusher && (!pushed[i].moveable || pushed[i].isPushingSolid(this))) {
        return true;
      }
    }
    return false;
  },
  update: function (pusher, force) {
    var self = this;
    if (!this.moveable) {
      //dont update
      if (pusher) {
        pusher.position[0] = self.position[0] + (pusher.v[0] > 0 ? (-pusher.size[0] - 0.00001) : self.size[0] + 0.00001);
        socket.emit('playerMove', {
          roomId: PlayerList[0].roomId,
          id: pusher.id,
          position: pusher.position
        });
        pusher.redraw();
      }
      return false;
    }

    self.v[0] = self.getAllForce();

    var pushed = self.checkCollision();

    if(!pushed) {
      if (self.innerF[0] && self.innerF[0].pushed[0]) {
        self.innerF[0].deletePushed(self.innerF[0].pushed[0]);
      }
    }

    if(self.v[0] != 0 && self.isPushingSolid()) {
      self.v[0] = 0;
    }

    var dontSend = false;

    //on x axis:

    if (self.v[0] != 0) {

      if (pushed) {
        var pushForce;
        if (self.innerF[0]) {
          //has self force
          //remove this force, exchange with new force
          self.innerF[0].addPushed(pushed);
        }
        if (force) {
          //pushed by someone else
          force.addPushed(pushed);//make origin force push;
          pushForce = force;
        }

        if(pushed != pusher) {
          console.log(pushed.name);
          pushed.moving = true;
          pushed.update(self, pushForce);
          if(pushed.moveable) {
            dontSend = true;
          }
        }

        if(!pushed.name) {
          //update none player box;
          pushed.checkUpdate();
        }
      }
      else {
        self.pushed = pushed;
        self.position[0] += self.v[0] / frames;
        self.redraw();
        if (pusher) {
          pusher.position[0] = self.position[0] + (pusher.v[0] > 0 ? (-pusher.size[0] - 0.00001) : self.size[0] + 0.00001);
          socket.emit('playerMove', {
            roomId: PlayerList[0].roomId,
            id: pusher.id,
            position: pusher.position
          });
          pusher.redraw();
        }
      }
    }
    else {
      if (self.pushed) {
        self.position[0] = self.pushed.position[0] + (self.v[0] > 0 ? (-self.size[0] - 0.00001) : self.pushed.size[0] + 0.00001);
      }
      //do nothing;
    }

    //vertical

    if (self.v[1] >= 0) {
      self.v[1] += Env.gravity / frames;
      if (self.v[1] > Env.maxSpeed) {
        self.v[1] = Env.maxSpeed
      }
      var ground = self.isOnGround();
      if (ground) {
        self.v[1] = 0;

        self.position[1] = ground.position[1] - self.size[1];
      }
      else {
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

    if(!dontSend) {
      socket.emit('playerMove', {
        roomId: self.roomId,
        id: self.id,
        position: self.position
      });
      self.redraw();
    }



    if (self.v[0] == 0 && self.v[1] == 0) {
      self.moving = false;
    }

  },
  checkUpdate: function () {
    var self = this;

    var animate = function () {
      cancelAnimationFrame(self.animateFrame);
      self.animateFrame = requestAnimationFrame(function () {
        self.update();
        if (self.moving) {
          animate();
        }
        else {
          //console.log(self.name, 'stop');
        }
      })
    };
    animate();

  }
};


var Map = function () {
  this.blocks = [];
  this.init = false;
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
  },
  getBlockById: function(id) {
    var blocks = this.blocks;

    for (var i = 0, l = blocks.length; i < l; i++) {
      if(blocks[i].id == id) {
        return blocks[i]
      }
    }
    return false;
  }
};
