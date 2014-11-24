var Player = function (e) {
  this.a = [0, 0];
  this.innerF = [0, Env.gravity];
  this.outterF = [0, 0];
  this.name = e.name;
  this.team = e.team == 0 ? 0 : (e.team || -1);//-1 means undefined, 0 means left team, 1 means right team
  this.size = e.size || [16 / 21, 1];
  this.position = e.position || [1, 2];
  this.v = [0, 0];
  this.map = e.map;
  this.skin = e.skin || getBitmap('mario');
  this.speed = e.speed || 7;
  this.jumpSpeed = e.jumpSpeed || 17;
  this.moving = 0;
  this.id = e.id;
  this.roomId = e.roomId;

  return this;
};

Player.prototype = {
  request: function () {
    //add canvas to content;
    socket.emit('addPlayer', {
      name: this.name,
      team: this.team,
      roomId: this.roomId
    });
  },
  initDom: function () {
    this.playerCanvas = document.createElement('canvas');
    this.playerCtx = this.playerCanvas.getContext('2d');
    this.playerCanvas.width = mapPixel[0];
    this.playerCanvas.height = mapPixel[1];
    this.playerCtx.imageSmoothingEnabled = false;
    wrapperDom.appendChild(this.playerCanvas);
    return this;
  },
  render: function () {
    var reflowAnimate;

    var that = this, leaveTimeout, CPUReflow;

    var CPURender = function() {
      that.refresh();
      if (that.v[0] == 0 && that.v[1] == 0 && that.onEdge()[1]) {
        console.log(that, 'CPU render not moving');
        that.notMoving = true;
        return;
      }
      CPUReflow = setTimeout(CPURender, parseInt(1000 / 60));
    };


    var reflowByCPU = function() {
      console.log('start Render BY CPU');
      CPUReflow = setTimeout(CPURender, parseInt(1000 / 60));
    };

    if(Game.leave && !that.notMoving) {
      reflowByCPU();
    }

    this.notMoving = false;

    var reflow = function () {
      //console.log('reflow', that.name);
      clearTimeout(CPUReflow);
      clearTimeout(leaveTimeout);
      that.refresh();
      that.clearPlayer();
      drawPeople(that.playerCtx, that.skin, that.position[0], that.position[1], that.size[0], that.size[1], that.name);
      if (that.v[0] == 0 && that.v[1] == 0 && that.onEdge()[1]) {
        console.log(that, 'not moving');
        that.notMoving = true;
        return;
      }
      leaveTimeout = setTimeout(function () {
        reflowByCPU();
      }, parseInt(1000 / frames * 5));


      reflowAnimate = requestAnimationFrame(reflow);
    };
    reflowAnimate = requestAnimationFrame(reflow);
  },
  update: function() {
    var that = this;
    that.clearPlayer();
    drawPeople(that.playerCtx, that.skin, that.position[0], that.position[1], that.size[0], that.size[1], that.name);
  },
  refresh: function () {
    var tempPlayer = this;

    tempPlayer.move();

    //console.log(frames);
    if (tempPlayer.onEdge()[1]) {
      //on edge Y:
      tempPlayer.position[1] = parseInt(tempPlayer.position[1]) + (tempPlayer.v[1] > 0 ? tempPlayer.size[1] : 0);
      tempPlayer.v[1] = 0;
    }
    else {
      tempPlayer.a[1] = tempPlayer.innerF[1] + tempPlayer.outterF[1];
      tempPlayer.v[1] += tempPlayer.a[1] / frames;
      if (tempPlayer.v[1] >= Env.maxSpeed) {
        tempPlayer.v[1] = Env.maxSpeed;
      }
      tempPlayer.position[1] += tempPlayer.v[1] / frames;
    }

    if (tempPlayer.onEdge()[0]) {
      //on edge X:
      tempPlayer.position[0] = parseInt(tempPlayer.position[0]) + (tempPlayer.v[0] > 0 ? 1 - tempPlayer.size[0] : 0);
      tempPlayer.v[0] = 0;
    }
    else {
      tempPlayer.position[0] += tempPlayer.v[0] / frames;
    }

    socket.emit("playerMove", {
        position: tempPlayer.position,
        id: tempPlayer.id,
        roomId: tempPlayer.roomId
    });

    //console.log(tempPlayer.v);
  },
  clearPlayer: function () {
    this.playerCtx.clearRect(0, 0, this.playerCanvas.width, this.playerCanvas.height);
  },
  changeMoveStatus: function (right) {
    this.moving = right;
    if (this.notMoving || Game.leave) {
      this.render();
    }
  },
  move: function () {
    if (this.moving != 0) {
      this.v[0] = this.speed * this.moving;
      this.innerF = [this.speed * this.moving, this.innerF[1]];
    }
  },
  jump: function () {
    if (this.onEdge()[1]) {
      this.v[1] = -this.jumpSpeed;
      if (this.notMoving || Game.leave) {
        this.render();
      }
    }
  },
  stop: function () {
    this.v[0] = 0;
  },
  onEdge: function () {
    //
    var v = this.v, position = this.position;
    var checkX = [], checkY = [];
    var result = [];
    var nextPosition = [], nextA = [], nextV = [];

    if (v[0] != 0) {
      //edge left
      checkX.push(Math.floor(position[0] + v[0] / frames + (v[0] > 0 ? this.size[0] : 0)) + '_' + Math.floor(position[1]));
      if (position[1] + this.size[1] > Math.floor(position[1] + this.size[1])) {
        checkX.push(Math.floor(position[0] + v[0] / frames + (v[0] > 0 ? this.size[0] : 0)) + "_"
        + Math.floor(position[1] + this.size[1]));
      }
      else {
        checkX.push(false);
      }
      result.push(this.map.solidObj[checkX[0]] || this.map.solidObj[checkX[1]]);
    }
    else {
      result.push(false)
    }

    nextA[1] = this.innerF[1] + this.outterF[1];
    nextV[1] = this.v[1] + nextA[1] / frames;
    if (nextV[1] >= Env.maxSpeed) {
      nextV[1] = Env.maxSpeed;
    }
    nextPosition[1] = this.position[1] + nextV[1] / frames;

    checkY.push(Math.floor(position[0]) + '_' + Math.floor(nextPosition[1] + (nextV[1] > 0 ? this.size[1] : 0)));
    if (position[0] + this.size[0] > Math.floor(position[0] + this.size[0])) {
      checkY.push(Math.floor(position[0] + this.size[0]) + '_' + Math.floor(nextPosition[1] + (nextV[1] > 0 ? this.size[1] : 0)));
    }
    else {
      checkY.push(false);
    }

    result.push(this.map.solidObj[checkY[0]] || this.map.solidObj[checkY[1]]);

    return result;
  },
  destroy: function () {
    var playerCanvas = this.playerCanvas;
    playerCanvas.parentNode.removeChild(playerCanvas);
  }
};