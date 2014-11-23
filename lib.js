/*! Mario-Multiplayer - v0.0.1 - 2014-11-24
* http://geetest.com/
* Copyright (c) 2014 zhangcx93; Licensed  */
var mapCanvas = document.getElementById('map');
mapCtx = mapCanvas.getContext('2d');
//
//var playerCanvas = document.getElementById('player');
//playerCtx = playerCanvas.getContext('2d');

var wrapperDom = document.getElementById('wrapper');

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

wrapperDom.style.width = mapPixel[0] + 'px';
wrapperDom.style.height = mapPixel[1] + 'px';

mapCtx.fillStyle = "white";
mapCtx.imageSmoothingEnabled = false;

mapCtx.fillRect(0, 0, mapPixel[0], mapPixel[1]);
var Env = {
  gravity: 50,
  maxSpeed: 17,
  drag: 0.5
};

var Game = {
  showName: true,
  pause: false
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

var drawBlock = function (img, x, y) {
  mapCtx.drawImage(img, 0, 0, img.width, img.height, x * unit, y * unit, unit, unit)
};

var drawPeople = function (ctx, img, x, y, w, h, name) {
  if (Game.showName) {
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

loadBitmap = function (callback) {
  var length = getObjectSize(bitmapsMap);
  var onload = function () {
    if (bitMapLoaded == length - 1) {
      return callback();
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

var Player = function (e) {
  this.a = [0, 0];
  this.innerF = [0, Env.gravity];
  this.outterF = [0, 0];
  this.name = e.name;
  this.team = e.team == 0 ? 0: (e.team || -1);//-1 means undefined, 0 means left team, 1 means right team
  this.size = e.size || [16 / 21, 1];
  this.position = e.position || [1, 2];
  this.v = [0, 0];
  this.map = e.map;
  this.skin = e.skin || getBitmap('mario');
  this.speed = e.speed || 7;
  this.jumpSpeed = e.jumpSpeed || 17;
  this.moving = 0;
  this.id = e.id;
  //this.request();

  return this;
};

Player.prototype = {
  request: function () {
    //add canvas to content;
    socket.emit('addPlayer', {
      name: this.name,
      team: this.team
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
    this.notMoving = false;
    var reflowAnimate;

    var that = this;

    var reflow = function (timestamp) {
      that.refresh();
      that.clearPlayer();
      drawPeople(that.playerCtx, that.skin, that.position[0], that.position[1], that.size[0], that.size[1], that.name);
      if (that.v[0] == 0 && that.v[1] == 0 && !that.onEdge()[1]) {
        console.log(that, 'not moving');
        that.notMoving = true;
        return;
      }
      reflowAnimate = requestAnimationFrame(reflow);
    };
    reflowAnimate = requestAnimationFrame(reflow);
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
    //console.log(tempPlayer.v);
  },
  clearPlayer: function () {
    this.playerCtx.clearRect(0, 0, this.playerCanvas.width, this.playerCanvas.height);
  },
  changeMoveStatus: function (right) {
    this.moving = right;
    if(this.notMoving) {
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
var bindKey = function() {

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
      //move right
      socket.emit('playerMove', {
        direction: "r",
        id: PlayerList[0].id
      });
      //PlayerList[0].changeMoveStatus(1);
      keyStatus.right = true;
    }
    if (e.keyCode == 37) {
      socket.emit('playerMove', {
        direction: "l",
        id: PlayerList[0].id
      });
      //PlayerList[0].changeMoveStatus(-1);
      keyStatus.left = true;

    }
    if (e.keyCode == 32) {
      socket.emit('playerMove', {
        direction: "u",
        id: PlayerList[0].id
      });
      keyStatus.space = true;
      //PlayerList[0].jump();
    }
  });
  window.addEventListener('keyup', function (e) {
    if (e.keyCode == 39) {
      keyStatus.right = false;
    }
    if (e.keyCode == 37) {
      keyStatus.left = false;
    }
    if (isLastUp()) {
      //console.log('Last Up', PlayerList);
      socket.emit('playerMove', {
        direction: "s",
        id: PlayerList[0].id
      });
      //PlayerList[0].stop();
      //PlayerList[0].changeMoveStatus(0);
    }
  });
};
var connect = function (map) {
  socket = io.connect("/");

  socket.on("connect", function () {
    var tempLayer = new Player({
      name: parseInt(Math.random()*20),
      map: map
    });

    tempLayer.request();
  });

  socket.on("getPlayer", function (data) {
    console.log("Player Get: ", data);
    data.me.map = map;
    PlayerList[0] = new Player(data.me);
    map.addPeople(PlayerList[0]);
    PlayerList[0].initDom().render();
    var tempPlayer;
    for (var i = 0; i < data.other.length; i++) {
      tempPlayer = new Player(data.other[i]);
      tempPlayer.map = map;
      PlayerList.push(tempPlayer);
      map.addPeople(tempPlayer);
      tempPlayer.initDom().render();
    }
    bindKey();
  });

  socket.on("newPlayer", function (data) {
    console.log("other new player added: ", data);
    data.map = map;
    var tempPlayer = new Player(data);
    PlayerList.push(tempPlayer);
    map.addPeople(tempPlayer);
    tempPlayer.initDom().render();
  });

  socket.on("playerMove", function(data) {
    console.log("Player Move received: ", data);
    for(var player in PlayerList) {
      if(PlayerList.hasOwnProperty(player) && PlayerList[player].id == data.id) {
        var tempPlayer = PlayerList[player];
        if(data.direction == "l") {
          tempPlayer.changeMoveStatus(-1);
        }
        else if(data.direction == "r") {
          tempPlayer.changeMoveStatus(1);
        }
        else if(data.direction == "s") {
          tempPlayer.stop();
          tempPlayer.changeMoveStatus(0);
        }
        else if(data.direction == "r") {
          tempPlayer.changeMoveStatus(1);
        }
        else if(data.direction == 'u') {
          tempPlayer.jump();
        }
      }
    }
  });
};


//main start:

var init = function () {
  var brick = new Material({
    bitmap: getBitmap("brick"),
    solid: true
  });

  var hidden = new Material({
    bitmap: new Image(),
    solid: true
  });

  var floorPosition = function () {
    var temp = [];
    for (var i = 0; i < mapSize[0]; i++) {
      for (var j = 7; j < mapSize[1]; j++) {
        temp.push([i, j]);
      }
    }
    return temp;
  };

  var ladderPosition = function () {
    var temp = [];
    for (var i = 2; i < 5; i++) {
      temp.push([i, 6]);
    }
    for (i = 6; i < 9; i++) {
      temp.push([i, 4]);
    }
    return temp
  };

  var edgePosition = function () {
    var temp = [];
    for (var i = -1; i < mapSize[0] + 1; i++) {
      temp.push([i, -1]);
      temp.push([i, mapSize[1]])
    }
    for (var j = 0; j < mapSize[1]; j++) {
      temp.push([-1, j]);
      temp.push([mapSize[0], j]);
    }
    return temp;
  };

  var floors = new Blocks({
    position: floorPosition(),
    material: brick
  });

  var edge = new Blocks({
    position: edgePosition(),
    material: hidden
  });

  var ladder = new Blocks({
    position: ladderPosition(),
    material: brick
  });

  var map = new Map();
  map.addBlock(floors);
  map.addBlock(ladder);
  map.addBlock(edge);


  var initMap = function() {
    map.paintBlock();
  };

  initMap();

  connect(map);
  //
  //var timer;
  //
  //var reflowAnimate, backgroundAnimate;
  //
  //var reflow = function (timestamp) {
  //  //clearMap();
  //
  //  if(Game.pause) {
  //    return;
  //  }
  //  clearTimeout(timer);
  //  clearInterval(backgroundAnimate);
  //
  //  timer = setTimeout(function() {
  //    Game.pause = true;
  //    cancelAnimationFrame(reflowAnimate);
  //    backgroundAnimate = setInterval(function() {
  //      map.refresh();
  //    }, parseInt(1000/frames));
  //    requestAnimationFrame(function (tempStamp) {
  //      Game.pause = false;
  //      lastTimeStamp = tempStamp;
  //      reflowAnimate = requestAnimationFrame(reflow);
  //    });
  //  }, 100);
  //
  //  map.refresh();
  //  frames = parseInt(1000 / (timestamp - lastTimeStamp));
  //  lastTimeStamp = timestamp;
  //
  //  clearPlayer();
  //  map.showPeople();
  //  reflowAnimate = requestAnimationFrame(reflow);
  //};
  //reflowAnimate = requestAnimationFrame(reflow);

  var updateFrame = function(timestamp) {
    frames = parseInt(1000 / (timestamp - lastTimeStamp));
    lastTimeStamp = timestamp;
    requestAnimationFrame(updateFrame);
  };
  requestAnimationFrame(updateFrame);

};

loadBitmap(init);
