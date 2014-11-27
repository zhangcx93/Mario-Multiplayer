var bindKey = function () {

  var keyStatus = {
    "right": false,
    'left': false,
    'space': false
  };

  var isLastUp = function () {
    return !keyStatus.right && !keyStatus.left
  };

  window.addEventListener('keydown', function (e) {
    if (e.keyCode == 39) {
      //resetInnerF right
      //socket.emit('playerMove', {
      //  direction: "r",
      //  position: PlayerList[0].position,
      //  id: PlayerList[0].id,
      //  roomId: PlayerList[0].roomId
      //});
      PlayerList[0].move(1);
      keyStatus.right = true;
    }
    if (e.keyCode == 37) {
      //socket.emit('playerMove', {
      //  direction: "l",
      //  position: PlayerList[0].position,
      //  id: PlayerList[0].id,
      //  roomId: PlayerList[0].roomId
      //});
      PlayerList[0].move(-1);
      keyStatus.left = true;

    }
    if (e.keyCode == 32) {
      //socket.emit('playerMove', {
      //  position: PlayerList[0].position,
      //  direction: "u",
      //  id: PlayerList[0].id,
      //  roomId: PlayerList[0].roomId
      //});
      keyStatus.space = true;
      PlayerList[0].jump();
    }
  });
  window.addEventListener('keyup', function (e) {
    if (e.keyCode == 39) {
      keyStatus.right = false;
    }
    if (e.keyCode == 37) {
      keyStatus.left = false;
    }
    if (isLastUp() && (e.keyCode == 39 || e.keyCode == 37)) {
      //console.log('Last Up', PlayerList);
      //socket.emit('playerMove', {
      //  position: PlayerList[0].position,
      //  direction: "s",
      //  id: PlayerList[0].id,
      //  roomId: PlayerList[0].roomId
      //});
      PlayerList[0].move(0);
    }
  });
};