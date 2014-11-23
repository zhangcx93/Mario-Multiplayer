
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
