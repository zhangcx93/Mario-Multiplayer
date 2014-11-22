
//class Material, define materials with bitmap, solid or not (or advanced feature)
var Material = function (e) {
  this.bitmap = e.bitmap;
  this.solid = e.solid;
};


var Blocks = function (e) {
  this.position = e.position;
  this.material = e.material;
};


var Map = function () {
  this.block = [];
  this.solidObj = {};
  this.init = false;
  this.peoples = [];
};

Map.prototype = {
  addBlock: function (block) {
    this.block.push(block);
  },
  paintBlock: function () {
    var block = this.block;
    var solid = this.solidObj;
    var positionStr = "";
    var x, y;
    for (var i = 0, l = block.length; i < l; i++) {
      for (var j = 0, positions = block[i].position.length; j < positions; j++) {
        x = block[i].position[j][0];
        y = block[i].position[j][1];
        positionStr = x + "_" + y;
        if (block[i].material.solid && !this.init) {
          solid[positionStr] = true;
        }
        drawBlock(block[i].material.bitmap, x, y);
      }
    }
    this.init = true;
  },
  addPeople: function (people) {
    this.peoples.push(people);
  },
  showPeople: function (timeStamp) {
    var peoples = this.peoples;
    var tempPlayer;
    for (var i = 0, l = peoples.length; i < l; i++) {
      tempPlayer = peoples[i];

      tempPlayer.move();

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

      drawPeople(tempPlayer.skin, tempPlayer.position[0], tempPlayer.position[1], tempPlayer.size[0], tempPlayer.size[1])
    }
  }
};

var Player = function (e) {
  this.a = [0, 0];
  this.innerF = [0, Env.gravity];
  this.outterF = [0, 0];
  this.name = e.name;
  this.size = [16 / 21, 1];
  this.position = [1, 2];
  this.v = [0, 0];
  this.map = e.map;
  this.skin = getBitmap('mario');
  this.speed = 7;
  this.jumpSpeed = 17;
  this.moving = 0;
};

Player.prototype = {
  changeMoveStatus: function (right) {
    this.moving = right;
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
  }
};