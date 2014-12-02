var connect = function (map, name, room) {
  socket = io.connect("/");

  socket.on("connect", function () {
    socket.emit('addPlayer', {
      roomId: room,
      name: name,
      team: -1 //not defined now
    });
  });

  socket.on("getPlayer", function (data) {
    if (data.me.team == 0) {
      data.me.material = MaterialList.RedPeople;
    }
    else {
      data.me.material = MaterialList.GreenPeople;
    }
    PlayerList[0] = new Player(data.me);
    map.addBlock(PlayerList[0]);
    PlayerList[0].checkUpdate();
    var tempPlayer;
    for (var i = 0; i < data.other.length; i++) {
      if (data.other[i].team == 0) {
        data.other[i].material = MaterialList.RedPeople;
      }
      else {
        data.other[i].material = MaterialList.GreenPeople;
      }
      tempPlayer = new Player(data.other[i]);
      PlayerList.push(tempPlayer);
      map.addBlock(tempPlayer);
    }

    ui.draw();

    bindKey();

    var lastHeartBeat;

    var heartBeat = setInterval(function () {
      socket.emit("heartBeat", {
        id: PlayerList[0].id,
        roomId: PlayerList[0].roomId
      });
      lastHeartBeat = (new Date()).getTime();

    }, 1000);
  });

  socket.on("newPlayer", function (data) {
    if (data.team == 0) {
      data.material = MaterialList.RedPeople;
    }
    else {
      data.material = MaterialList.GreenPeople;
    }
    var tempPlayer = new Player(data);
    PlayerList.push(tempPlayer);
    map.addBlock(tempPlayer);
    ui.draw();
  });

  socket.on('removePlayer', function (id) {
    for (var i = 0, l = PlayerList.length; i < l; i++) {
      if (PlayerList[i].id == id) {
        PlayerList[i].destroy();
        PlayerList.splice(i, 1);
        ui.draw();
        return;
      }
    }
  });

  socket.on("playerMove", function (data) {
    var player = getPlayerById(data.id);
    player.position = data.position;
    player.redraw();
  });

  socket.on("addForce", function (data) {
    var player = getPlayerById(data.pusher);
    new Force({
      pusher: player,
      value: data.value
    }, true)
  });

  socket.on("addPushedForce", function (data) {
    var player = getPlayerById(data.pusher);
    var pushed = map.getBlockById(data.pushed);
    player.innerF[0].addPushed(pushed);
  });

  socket.on("removePushedForce", function (data) {
    var player = getPlayerById(data.pusher);
    var pushed = map.getBlockById(data.pushed);
    player.innerF[0].deletePushed(pushed);
  });

  socket.on("destroyForce", function (data) {
    var player = getPlayerById(data.pusher);
    player.innerF[0].destroy();
  });


  socket.on("resHeartBeat", function () {
    console.log('heart Beat Recieved');
  });

  socket.on('hit', function(data) {
    if(PlayerList[0].id == data.hit) {
      //i'm hit!
      PlayerList[0].blood--;
      if(PlayerList[0].blood <= 0) {
        PlayerList[0].die();
      }
    }
    else {
      var hitted = getPlayerById(data.hit);
      hitted.blood--;
    }
    ui.draw();
  })
};
