
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

  var john = new Player({
    name: "John",
    map: map
  });

  var jack = new Player({
    name: "Jack",
    map: map,
    skin: getBitmap('mario-green')
  });

  map.addPeople(john);
  map.addPeople(jack);


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
      john.changeMoveStatus(1);
      keyStatus.right = true;
    }
    if (e.keyCode == 37) {
      john.changeMoveStatus(-1);
      keyStatus.left = true;

    }
    if (e.keyCode == 32) {
      keyStatus.space = true;
      john.jump();
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
      john.stop();
      john.changeMoveStatus(0);
    }
  });

  var initMap = function() {
    map.paintBlock();
  };

  initMap();

  var timer;

  var reflowAnimate, backgroundAnimate;

  var reflow = function (timestamp) {
    //clearMap();

    if(Game.pause) {
      return;
    }
    clearTimeout(timer);
    clearInterval(backgroundAnimate);

    timer = setTimeout(function() {
      Game.pause = true;
      cancelAnimationFrame(reflowAnimate);
      backgroundAnimate = setInterval(function() {
        map.refresh();
      }, parseInt(1000/frames));
      requestAnimationFrame(function (tempStamp) {
        Game.pause = false;
        lastTimeStamp = tempStamp;
        reflowAnimate = requestAnimationFrame(reflow);
      });
    }, 100);

    map.refresh();
    frames = parseInt(1000 / (timestamp - lastTimeStamp));
    lastTimeStamp = timestamp;

    clearPlayer();
    map.showPeople();
    reflowAnimate = requestAnimationFrame(reflow);
  };
  reflowAnimate = requestAnimationFrame(reflow);

};

loadBitmap(init);
