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