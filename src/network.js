var connect = function (map) {
  socket = io.connect("/");

  socket.on("connect", function () {
    var tempLayer = new Player({
      name: parseInt(Math.random()*20),
      map: map
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

  socket.on("playerMove", function(data) {
    console.log("Player Move received: ", data);
    for(var player in PlayerList) {
      if(PlayerList.hasOwnProperty(player) && PlayerList[player].id == data.id) {
        var tempPlayer = PlayerList[player];
        if(data.direction == "l") {
          tempPlayer.changeMoveStatus(-1);
        }
        else if(data.direction == "r") {
          tempPlayer.changeMoveStatus(1);
        }
        else if(data.direction == "s") {
          tempPlayer.stop();
          tempPlayer.changeMoveStatus(0);
        }
        else if(data.direction == "r") {
          tempPlayer.changeMoveStatus(1);
        }
        else if(data.direction == 'u') {
          tempPlayer.jump();
        }
      }
    }
  });
};
