var drawBlock = function (img, x, y) {
  mapCtx.drawImage(img, 0, 0, img.width, img.height, x * unit, y * unit, unit, unit)
};

var drawPeople = function (img, x, y, w, h, name) {
  if (Game.showName) {
    playerCtx.textAlign = "center";
    playerCtx.font = "20px Georgia";
    playerCtx.fillText(name, (x + w / 2) * unit, (y - 0.2) * unit);
  }
  playerCtx.drawImage(img, 0, 0, img.width, img.height, parseInt(x * unit), parseInt(y * unit), parseInt(unit * w), parseInt(unit * h))
};

var clearMap = function () {
  mapCtx.clearRect(0, 0, mapCanvas.width, mapCanvas.height);
};

var clearPlayer = function () {
  playerCtx.clearRect(0, 0, playerCanvas.width, playerCanvas.height);
};

var getObjectSize = function (obj) {
  var size = 0, key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};


var loadBitmap = function (callback) {
  var length = getObjectSize(bitmapsMap), loaded = 0;
  var onload = function () {
    if (loaded == length - 1) {
      return callback();
    }
    loaded++;
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