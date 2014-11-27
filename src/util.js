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