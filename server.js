var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');

app.use(bodyParser());

server.listen(8000);

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname + '/'));

var Room = function (e) {
  this.name = e.name;
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

    socket.join(that.id);

    player.id = parseInt(Math.random() * 10000);

    player.roomId = that.id;

    socket.emit('getPlayer', {
      other: that.playerList,
      me: player
    });

    socket.broadcast.to(that.id).emit('newPlayer', player);

    that.playerList.push(player);

    console.log('Player ' + player.id + " added");
  },
  removePlayer: function (id) {
    var that = this;
    var player = this.getPlayerById(id);
    var team = player.team;
    that.teamStatus[team]--;
    that.playerList.splice(that.playerList.indexOf(player), 1);
    io.sockets.in(that.id).emit('removePlayer', id);
    console.log("Player " + id + " in " + that.id + " is removed");
  },
  isFree: function () {
    return this.max > this.playerList.length
  },
  getPlayerById: function (id) {
    for (var i = 0, peoples = roomList[i].playerList.length; i < peoples; i++) {
      if (peoples > 0 && this.playerList[i].id == id) {
        return this.playerList[i];
      }
    }
    return false;
  },
  destroy: function() {
    console.log(this.name + ' destroyed');
    roomList.splice(roomList.indexOf(this), 1);
  }
};

var roomList = [];

var getRoomById = function (id) {
  for (var i = 0, l = roomList.length; i < l; i++) {
    if (roomList[i].id == id) {
      return roomList[i];
    }
  }
  return false;
};


io.on('connection', function (socket) {
  socket.on('addPlayer', function (data) {
    var room = getRoomById(data.roomId);
    if (room) {
      room.addPlayer({
        name: data.name,
        team: data.team
      }, socket)
    }
  });

  socket.on("playerMove", function (data) {
    var room = getRoomById(data.roomId);
    var player = room.getPlayerById(data.id);
    player.position = data.position;
    socket.broadcast.to(room.id).emit('playerMove', data);
  });

  var heartBeat;

  socket.on('heartBeat', function (player) {
    clearTimeout(heartBeat);
    heartBeat = setTimeout(function () {
      //remove people if logged out
      var room = getRoomById(player.roomId);

      if (room) {
        var nowPlayer = room.getPlayerById(player.id);

        if (nowPlayer) {
          room.removePlayer(player.id, socket);
        }

        if(room.playerList.length == 0) {
          room.destroy();
        }

      }
    }, 5000);
    //5s timeout to disconnect a player;
  })


});

app.get('/getRooms', function (req, res) {
  res.json(roomList);
});

app.post('/createRoom', function (req, res) {
  var name = req.body.name;
  var newRoom = new Room({
    name: name
  });
  res.json({
    success: true,
    room: newRoom
  })
});

app.post('/start', function (req, res) {
  var roomId = req.body.room.id;
  var room = getRoomById(roomId);
  if (room.isFree()) {
    res.json({
      success: true,
      room: roomId
    })
  }
  else {
    res.json({
      success: false,
      err: "room is full"
    })
  }
});