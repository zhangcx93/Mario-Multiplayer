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
  refresh: function () {
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

    }
  },
  showPeople: function () {
    var peoples = this.peoples;
    var tempPlayer;
    for (var i = 0, l = peoples.length; i < l; i++) {
      tempPlayer = peoples[i];

      drawPeople(tempPlayer.skin, tempPlayer.position[0], tempPlayer.position[1], tempPlayer.size[0], tempPlayer.size[1], tempPlayer.name)
    }
  }
};
