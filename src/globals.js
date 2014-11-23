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
