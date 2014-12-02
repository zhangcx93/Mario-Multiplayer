//main start:

var init = function () {
  var brickImg = getBitmap("brick");
  var tempCanvas = document.createElement('canvas'),
    tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = tempCanvas.height = unit;
  tempCtx.mozImageSmoothingEnabled = false;
  tempCtx.webkitImageSmoothingEnabled = false;
  tempCtx.msImageSmoothingEnabled = false;
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
    position: [2, mapSize[1] - 5],
    material: brick,
    size: [5, 1]
  });

  var ladder1 = new Block({
    position: [mapSize[0] - 2 - 5, mapSize[1] - 5],
    material: brick,
    size: [5, 1]
  });

  var ceil = new Block({
    position: [8, mapSize[1] - 5- 4],
    material: brick,
    size: [6, 1]
  });


  map = new Map();
  map.addBlock(floors);
  map.addBlock(ladder);
  map.addBlock(ladder1);
  map.addBlock(ceil);

  map.addBlocks(edges());

  map.paintBlocks();


  var RedPeopleMaterial = new Material({
    name: "RedPeople",
    bitmap: getBitmap('mario'),
    solid: true,
    moveable: true
  });

  var GreenPeopleMaterial = new Material({
    name: "GreenPeople",
    bitmap: getBitmap('mario-green'),
    solid: true,
    moveable: true
  });

  var timer, refreshFrames;

  var updateFrame = function(timestamp) {
    clearTimeout(timer);
    if(!Game.leave) {
      frames = parseInt(1000 / (timestamp - lastTimeStamp));
      if (frames > 60) {
        frames = 60;
      }
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
