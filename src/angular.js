'use strict';

angular
  .module('Mario', [])
  .controller('mainCtrl', function ($scope) {
    $scope.PlayerName = "John";
    $scope.onMenu = true;
    $scope.gameStart = false;
    $scope.roomName = "";
  })
  .controller('menuCtrl', function ($scope) {
    $scope.confirmName = function () {
      $scope.$parent.onMenu = false;
      $scope.$parent.onRoomSelect = true;
    }
  })
  .controller("roomCtrl", function ($scope, $http) {
    $scope.RoomList = [];
    $scope.getRoom = function () {
      $http.get('/getRooms').success(function (data) {
        $scope.RoomList = data;
      })
    };
    $scope.getRoom();
    $scope.newRoom = function () {
      $scope.addNewRoom = true;
      $scope.$parent.roomName = $scope.$parent.PlayerName + "的房间";
    };
    $scope.confirmRoom = function () {
      $http.post('/createRoom', {
        name: $scope.$parent.roomName
      }).success(function (data) {
        if (data.success) {
          //$scope.getRoom();
          $scope.chooseRoom(data.room);
        }
      })
    };
    $scope.chooseRoom = function (room) {
      $http.post('/start', {
        room: room,
        player: {
          name: $scope.$parent.PlayerName,
          team: -1
        }
      }).success(function (data) {
        $scope.$parent.onRoomSelect = false;
        $scope.$parent.gameStart = true;
        connect(map, $scope.$parent.PlayerName, data.room);
      })
    }
  })
  .controller("gameCtrl", function($scope) {
    //$scope.frames = 0;
    //var timer, refreshFrames;
    //
    //var updateFrame = function(timestamp) {
    //  clearTimeout(timer);
    //  if(!Game.leave) {
    //    $scope.frames = frames = parseInt(1000 / (timestamp - lastTimeStamp));
    //  }
    //  lastTimeStamp = timestamp;
    //  Game.leave = false;
    //  timer = setTimeout(function() {
    //    Game.leave = true;
    //  }, parseInt(1000 / frames * 5));
    //  refreshFrames = requestAnimationFrame(updateFrame);
    //};
    //refreshFrames = requestAnimationFrame(updateFrame);
  })
;