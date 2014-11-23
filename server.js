var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(80);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/'));

var playerList = [];

var teamStatus = [0, 0];

var nextTeam = function () {
  return teamStatus.indexOf(Math.min(teamStatus[0], teamStatus[1]));
};


io.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });
  socket.join('originRoom');

  socket.on("playerMove", function (data) {
    io.sockets.in('originRoom').emit('playerMove', data);
  });

  socket.on('addPlayer', function (data) {

    if (data.team == -1) {
      data.team = nextTeam();
      if (nextTeam() == 1) {
        data.position = [9, 2];
      }
      teamStatus[nextTeam()]++
    }

    data.id = parseInt(Math.random() * 10000);

    socket.emit('getPlayer', {
      other: playerList,
      me: data
    });

    socket.broadcast.to('originRoom').emit('newPlayer', data);

    //socket.broadcast.emit('newPlayer', data);

    playerList.push(data);

  });
}).on('disconnect', function () {
  console.log('hehe');
});