var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(80);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/'));

var Room = function (e) {
  this.name = e.name;
  this.socketRoom = e.socketRoom;
  this.id = parseInt((new Date()).getTime());
  this.max = 4;
  this.playerList = [];
  this.teamStatus = [0, 0];
  roomList.push(this);
};

Room.prototype = {
  nextTeam: function () {
    var teamStatus = this.teamStatus;
    return teamStatus.indexOf(Math.min(teamStatus[0], teamStatus[1]));
  },
  addPlayer: function (player, socket) {
    var that = this;
    if (player.team == -1) {
      player.team = that.nextTeam();
      if (that.nextTeam() == 1) {
        player.position = [9, 2];
      }
      that.teamStatus[that.nextTeam()]++
    }

    socket.join(that.socketRoom);

    player.id = parseInt(Math.random() * 10000);

    player.roomId = that.id;

    socket.emit('getPlayer', {
      other: that.playerList,
      me: player
    });

    socket.broadcast.to(that.socketRoom).emit('newPlayer', player);

    that.playerList.push(player);

    console.log('Player ' + player.id + " added");
  },
  removePlayer: function (id, socket) {
    var that = this;
    for (var j = 0, peoples = that.playerList.length; j < peoples; j++) {
      if (that.playerList[j].id == id) {
        var team = that.playerList[j].team;

        that.teamStatus[team]--;

        that.playerList.splice(j, 1);

        io.sockets.in(that.socketRoom).emit('removePlayer', id);
        console.log("Player " + id + " in " + that.socketRoom + " is removed");

        return;
      }
    }
  }
};

var roomList = [];

io.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });
  socket.on("playerMove", function (data) {
    for(var i = 0; i < roomList.length; i++) {
      if(roomList[i].id == data.roomId) {
        io.sockets.in(roomList[i].socketRoom).emit('playerMove', data);
      }
    }
  });

  socket.on('addPlayer', function (data) {
    //check all room, find a free one

    var roomListLength = roomList.length, nowRoom;

    if (!roomListLength) {
      //not even one room;
      nowRoom = new Room({
        name: data.name + "'s Room",
        socketRoom: data.name + "'s Room"
      });
      nowRoom.addPlayer(data, socket);
    }
    else {
      for (var i = 0; i < roomListLength; i++) {
        if (roomList[i].playerList.length < roomList[i].max) {
          //this room is free
          nowRoom = roomList[i];
          nowRoom.addPlayer(data, socket);
          return;
        }
      }
    }
  });

  var heartBeat;

  socket.on('heartBeat', function (player) {
    clearTimeout(heartBeat);
    heartBeat = setTimeout(function () {
      for (var i = 0, l = roomList.length; i < l; i++) {
        if (roomList[i].id == player.roomId) {
          for (var j = 0, peoples = roomList[i].playerList.length; j < peoples; j++) {
            if (peoples > 0 && roomList[i].playerList[j].id == player.id) {
              roomList[i].removePlayer(player.id, socket);
              return;
            }
          }
        }
      }
    }, 5000);
    //5s timeout to disconnect a player;
  })


});