var bindKey = function() {

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
      //move right
      socket.emit('playerMove', {
        direction: "r",
        id: PlayerList[0].id
      });
      //PlayerList[0].changeMoveStatus(1);
      keyStatus.right = true;
    }
    if (e.keyCode == 37) {
      socket.emit('playerMove', {
        direction: "l",
        id: PlayerList[0].id
      });
      //PlayerList[0].changeMoveStatus(-1);
      keyStatus.left = true;

    }
    if (e.keyCode == 32) {
      socket.emit('playerMove', {
        direction: "u",
        id: PlayerList[0].id
      });
      keyStatus.space = true;
      //PlayerList[0].jump();
    }
  });
  window.addEventListener('keyup', function (e) {
    if (e.keyCode == 39) {
      keyStatus.right = false;
    }
    if (e.keyCode == 37) {
      keyStatus.left = false;
    }
    if (isLastUp()) {
      //console.log('Last Up', PlayerList);
      socket.emit('playerMove', {
        direction: "s",
        id: PlayerList[0].id
      });
      //PlayerList[0].stop();
      //PlayerList[0].changeMoveStatus(0);
    }
  });
};