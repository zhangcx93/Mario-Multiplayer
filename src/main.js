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

  map = new Map();
  map.addBlock(floors);
  map.addBlock(ladder);
  map.addBlock(edge);


  var initMap = function() {
    map.paintBlock();
  };

  initMap();

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
