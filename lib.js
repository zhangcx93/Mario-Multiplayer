/*! Mario-Multiplayer - v0.0.1 - 2014-11-28
* http://geetest.com/
* Copyright (c) 2014 zhangcx93; Licensed  */
var mapCanvas = document.getElementById('map'),
  mapCtx = mapCanvas.getContext('2d');

var menuDom = document.getElementById("menu");
var roomSelectDom = document.getElementById("roomSelect");

var wrapperDom = document.getElementById('wrapper');
var gameWrapperDom = document.getElementById('gameWrapper');


//take the map as a 16*9 boxes, make up a whole map, each box size w*w

var mapSize = [16, 9];
var worldPadding = 20;

var unit = Math.round(Math.min(
  (window.innerHeight - worldPadding) / mapSize[1],
  (window.innerWidth - worldPadding) / mapSize[0]
));

var mapPixel = [unit * mapSize[0], unit * mapSize[1]];

mapCanvas.width = mapPixel[0];
mapCanvas.height = mapPixel[1];

wrapperDom.style.width = gameWrapperDom.style.width  = mapPixel[0] + 'px';
wrapperDom.style.height = gameWrapperDom.style.width = mapPixel[1] + 'px';

mapCtx.fillStyle = "white";
mapCtx.imageSmoothingEnabled = false;

mapCtx.fillRect(0, 0, mapPixel[0], mapPixel[1]);
var Env = {
  gravity: 30,
  maxSpeed: 17,
  drag: 0.5
};

var Game = {
  showName: true,
  pause: false,
  leave: false
};

var PlayerList = [];


var lastTimeStamp = 0, frames = 60;


var bitmapsMap = {
  'brick': 'brick.png',
  'mario': 'mario.png',
  'mario-green': 'mario-green.png'
};


var bitmap = {};

var socket;

var map;
var drawBlock = function (ctx, img, x, y, w, h, name) {
  if (Game.showName && name) {
    ctx.textAlign = "center";
    ctx.font = "20px Georgia";
    ctx.fillText(name, (x + w / 2) * unit, (y - 0.2) * unit);
  }
  ctx.drawImage(img, 0, 0, img.width, img.height, parseInt(x * unit), parseInt(y * unit), parseInt(unit * w), parseInt(unit * h))
};

var clearMap = function () {
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
};

var getObjectSize = function (obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

var bitMapLoaded = 0;

var loadBitmap = function (callback) {
  var length = getObjectSize(bitmapsMap);
  var onload = function () {
    if (bitMapLoaded == length - 1) {
      callback();
    }
    bitMapLoaded++;
  };
  for (var i in bitmapsMap) {
    if (bitmapsMap.hasOwnProperty(i)) {
      bitmap[i] = new Image();
      bitmap[i].onload = onload;
      bitmap[i].src = './bitmap/' + bitmapsMap[i];
    }
  }

};

var getBitmap = function (name) {
  if (bitmap[name]) {
    return bitmap[name];
  }
  else {
    throw new Error("Can't find bitmap named: " + name);
  }
};
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
  this.jumpSpeed = e.jumpSpeed || 12;
  this.ctx.imageSmoothingEnabled = false;
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
  if (this.isOnGround()) {
    this.v[1] = -this.jumpSpeed;
    if (!this.moving) {
      this.moving = true;
      this.checkUpdate();
    }
  }
};
var bindKey = function () {

  var keyStatus = {
    "right": false,
    'left': false,
    'space': false
  };

  var isLastUp = function () {
    return !keyStatus.right && !keyStatus.left
  };

  window.addEventListener('keydown', function (e) {
    if (e.keyCode == 39) {
      //resetInnerF right
      //socket.emit('playerMove', {
      //  direction: "r",
      //  position: PlayerList[0].position,
      //  id: PlayerList[0].id,
      //  roomId: PlayerList[0].roomId
      //});
      PlayerList[0].move(1);
      keyStatus.right = true;
    }
    if (e.keyCode == 37) {
      //socket.emit('playerMove', {
      //  direction: "l",
      //  position: PlayerList[0].position,
      //  id: PlayerList[0].id,
      //  roomId: PlayerList[0].roomId
      //});
      PlayerList[0].move(-1);
      keyStatus.left = true;

    }
    if (e.keyCode == 32) {
      //socket.emit('playerMove', {
      //  position: PlayerList[0].position,
      //  direction: "u",
      //  id: PlayerList[0].id,
      //  roomId: PlayerList[0].roomId
      //});
      keyStatus.space = true;
      PlayerList[0].jump();
    }
  });
  window.addEventListener('keyup', function (e) {
    if (e.keyCode == 39) {
      keyStatus.right = false;
    }
    if (e.keyCode == 37) {
      keyStatus.left = false;
    }
    if (isLastUp() && (e.keyCode == 39 || e.keyCode == 37)) {
      //console.log('Last Up', PlayerList);
      //socket.emit('playerMove', {
      //  position: PlayerList[0].position,
      //  direction: "s",
      //  id: PlayerList[0].id,
      //  roomId: PlayerList[0].roomId
      //});
      PlayerList[0].move(0);
    }
  });
};
//var connect = function (map, name, room) {
//  socket = io.connect("/");
//
//  var lastHeartBeat;
//
//  var heartBeat = setInterval(function () {
//    socket.emit("heartBeat", {
//      id: PlayerList[0].id,
//      roomId: PlayerList[0].roomId
//    });
//    lastHeartBeat = (new Date()).getTime();
//
//  }, 1000);
//
//  socket.on("connect", function () {
//    var tempLayer = new Player({
//      name: name,
//      map: map,
//      roomId: room
//    });
//
//    tempLayer.request();
//  });
//
//  socket.on("getPlayer", function (data) {
//    console.log("Player Get: ", data);
//    data.me.map = map;
//    PlayerList[0] = new Player(data.me);
//    map.addPeople(PlayerList[0]);
//    PlayerList[0].initDom().render();
//    var tempPlayer;
//    for (var i = 0; i < data.other.length; i++) {
//      tempPlayer = new Player(data.other[i]);
//      tempPlayer.map = map;
//      PlayerList.push(tempPlayer);
//      map.addPeople(tempPlayer);
//      tempPlayer.initDom().render();
//    }
//    bindKey();
//  });
//
//  socket.on("newPlayer", function (data) {
//    console.log("other new player added: ", data);
//    data.map = map;
//    var tempPlayer = new Player(data);
//    PlayerList.push(tempPlayer);
//    map.addPeople(tempPlayer);
//    tempPlayer.initDom().render();
//  });
//
//  socket.on('removePlayer', function (id) {
//    console.log(id + ' Player removed');
//    for (var i = 0, l = PlayerList.length; i < l; i++) {
//      if (PlayerList[i].id == id) {
//        PlayerList[i].destroy();
//        PlayerList.splice(i, 1);
//        return;
//      }
//    }
//  });
//
//  socket.on("playerMove", function (data) {
//    console.log("Player Move received: ", data);
//    for (var player in PlayerList) {
//      if (PlayerList.hasOwnProperty(player) && PlayerList[player].id == data.id) {
//        var tempPlayer = PlayerList[player];
//        tempPlayer.position = data.position;
//        tempPlayer.update();
//        //if (data.direction == "l") {
//        //  tempPlayer.changeMoveStatus(-1);
//        //}
//        //else if (data.direction == "r") {
//        //  tempPlayer.changeMoveStatus(1);
//        //}
//        //else if (data.direction == "s") {
//        //  tempPlayer.stop();
//        //  tempPlayer.changeMoveStatus(0);
//        //}
//        //else if (data.direction == "r") {
//        //  tempPlayer.changeMoveStatus(1);
//        //}
//        //else if (data.direction == 'u') {
//        //  tempPlayer.jump();
//        //}
//      }
//    }
//  });
//
//
//
//
//  socket.on("resHeartBeat", function () {
//    console.log('heart Beat Recieved');
//  });
//};

//main start:

var init = function () {
  var brickImg = getBitmap("brick");
  var tempCanvas = document.createElement('canvas'),
    tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = tempCanvas.height = unit;
  tempCtx.imageSmoothingEnabled = false;
  tempCtx.drawImage(brickImg, 0, 0, brickImg.width, brickImg.height, 0, 0, unit, unit);

  var brick = new Material({
    bitmap: tempCanvas,
    repeat: true,
    solid: true,
    moveable: false
  });

  var hidden = new Material({
    bitmap: new Image(),
    solid: true,
    moveable: false
  });

  var edges = function () {
    var edgeBricks = [];
    edgeBricks.push(new Block({
      position: [-1, -1],
      material: hidden,
      size: [1, mapSize[1] +1]
    }));
    edgeBricks.push(new Block({
      position: [mapSize[0], -1],
      material: hidden,
      size: [1, mapSize[1] +1]
    }));
    edgeBricks.push(new Block({
      position: [0, -1],
      material: hidden,
      size: [mapSize[0] - 1, 1]
    }));
    edgeBricks.push(new Block({
      position: [0, mapSize[1]],
      material: hidden,
      size: [mapSize[0] - 1, 1]
    }));
    return edgeBricks;
  };

  var floors = new Block({
    position: [0, mapSize[1] - 2],
    material: brick,
    size: [mapSize[0], 2]
  });

  var ladder = new Block({
    position: [5, 5],
    material: brick,
    size: [5, 1]
  });

  var something = new Block({
    position: [7, 1],
    material: brick,
    size: [1, 1]
  });


  map = new Map();
  map.addBlock(floors);
  map.addBlock(ladder);
  map.addBlock(something);

  map.addBlocks(edges());

  map.paintBlocks();


  var PeopleMaterial = new Material({
    bitmap: getBitmap('mario'),
    solid: true,
    moveable: true
  });

  window.John = new Player({
    name: "John",
    id: 2333,
    team: 0,
    position: [1, 1],
    material: PeopleMaterial
  });
  //
  //
  //window.Jack = new Player({
  //  name: "Jack",
  //  id: 233,
  //  team: 0,
  //  position: [6, 1],
  //  material: PeopleMaterial
  //});

  map.addBlock(John);
  //map.addBlock(Jack);

  PlayerList.push(John);

  bindKey();

  var timer, refreshFrames;

  var updateFrame = function(timestamp) {
    clearTimeout(timer);
    if(!Game.leave) {
      frames = parseInt(1000 / (timestamp - lastTimeStamp));
    }
    lastTimeStamp = timestamp;
    Game.leave = false;
    timer = setTimeout(function() {
      Game.leave = true;
    }, parseInt(1000 / frames * 5));
    refreshFrames = requestAnimationFrame(updateFrame);
  };
  refreshFrames = requestAnimationFrame(updateFrame);

};

loadBitmap(init);

'use strict';

angular
  .module('Mario', [])
  .controller('mainCtrl', function ($scope) {
    $scope.PlayerName = "John";
    $scope.onMenu = false;
    $scope.gameStart = true;
    $scope.roomName = "";
  })
  .controller('menuCtrl', function ($scope) {
    $scope.confirmName = function () {
      $scope.$parent.onMenu = false;
      $scope.$parent.onRoomSelect = true;
    }
  })
  .controller("roomCtrl", function ($scope, $http) {
    $scope.RoomList = [];
    $scope.getRoom = function () {
      $http.get('/getRooms').success(function (data) {
        $scope.RoomList = data;
      })
    };
    $scope.getRoom();
    $scope.newRoom = function () {
      $scope.addNewRoom = true;
      $scope.$parent.roomName = $scope.$parent.PlayerName + "的房间";
    };
    $scope.confirmRoom = function () {
      $http.post('/createRoom', {
        name: $scope.$parent.roomName
      }).success(function (data) {
        if (data.success) {
          //$scope.getRoom();
          $scope.chooseRoom(data.room);
        }
      })
    };
    $scope.chooseRoom = function (room) {
      $http.post('/start', {
        room: room,
        player: {
          name: $scope.$parent.PlayerName,
          team: -1
        }
      }).success(function (data) {
        $scope.$parent.onRoomSelect = false;
        $scope.$parent.gameStart = true;
        connect(map, $scope.$parent.PlayerName, data.room);
      })
    }
  })
  .controller("gameCtrl", function($scope) {
  //  $scope.frames = 0;
  //  var timer, refreshFrames;
  //
  //  var updateFrame = function(timestamp) {
  //    clearTimeout(timer);
  //    if(!Game.leave) {
  //      $scope.frames = frames = parseInt(1000 / (timestamp - lastTimeStamp));
  //    }
  //    lastTimeStamp = timestamp;
  //    Game.leave = false;
  //    timer = setTimeout(function() {
  //      Game.leave = true;
  //    }, parseInt(1000 / frames * 5));
  //    refreshFrames = requestAnimationFrame(updateFrame);
  //  };
  //  refreshFrames = requestAnimationFrame(updateFrame);
  })
;