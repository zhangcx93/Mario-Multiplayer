var connect = function (map, name, room) {
  socket = io.connect("/");

  var lastHeartBeat;

  var heartBeat = setInterval(function () {
    socket.emit("heartBeat", {
      id: PlayerList[0].id,
      roomId: PlayerList[0].roomId
    });
    lastHeartBeat = (new Date()).getTime();

  }, 1000);

  socket.on("connect", function () {
    var tempLayer = new Player({
      name: name,
      map: map,
      roomId: room
    });

    tempLayer.request();
  });

  socket.on("getPlayer", function (data) {
    console.log("Player Get: ", data);
    data.me.map = map;
    PlayerList[0] = new Player(data.me);
    map.addPeople(PlayerList[0]);
    PlayerList[0].initDom().render();
    var tempPlayer;
    for (var i = 0; i < data.other.length; i++) {
      tempPlayer = new Player(data.other[i]);
      tempPlayer.map = map;
      PlayerList.push(tempPlayer);
      map.addPeople(tempPlayer);
      tempPlayer.initDom().render();
    }
    bindKey();
  });

  socket.on("newPlayer", function (data) {
    console.log("other new player added: ", data);
    data.map = map;
    var tempPlayer = new Player(data);
    PlayerList.push(tempPlayer);
    map.addPeople(tempPlayer);
    tempPlayer.initDom().render();
  });

  socket.on('removePlayer', function (id) {
    console.log(id + ' Player removed');
    for (var i = 0, l = PlayerList.length; i < l; i++) {
      if (PlayerList[i].id == id) {
        PlayerList[i].destroy();
        PlayerList.splice(i, 1);
        return;
      }
    }
  });

  socket.on("playerMove", function (data) {
    console.log("Player Move received: ", data);
    for (var player in PlayerList) {
      if (PlayerList.hasOwnProperty(player) && PlayerList[player].id == data.id) {
        var tempPlayer = PlayerList[player];
        tempPlayer.position = data.position;
        tempPlayer.update();
        //if (data.direction == "l") {
        //  tempPlayer.changeMoveStatus(-1);
        //}
        //else if (data.direction == "r") {
        //  tempPlayer.changeMoveStatus(1);
        //}
        //else if (data.direction == "s") {
        //  tempPlayer.stop();
        //  tempPlayer.changeMoveStatus(0);
        //}
        //else if (data.direction == "r") {
        //  tempPlayer.changeMoveStatus(1);
        //}
        //else if (data.direction == 'u') {
        //  tempPlayer.jump();
        //}
      }
    }
  });




  socket.on("resHeartBeat", function () {
    console.log('heart Beat Recieved');
  });
};
