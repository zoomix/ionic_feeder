// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

.controller('CounterCtrl', function($scope, $timeout) {
  $scope.feedings = [];
  $scope.currentFeeding = false;
  $scope.leftSign = "L";
  $scope.rightSign= "R";

  setTimeout(function(){
      storage.allData(function (rows) {
        if(rows.length > 0) {
          var lastRow = rows[rows.length - 1];
          if(lastRow.ongoing) {
            rows.pop();
            $scope.continue(lastRow);
          }
        }
        $scope.feedings = rows;
        $scope.$apply();
      });
  }, 1);

  var mytimeout = null;

  $scope.onTimeout = function(){
    $scope.currentFeeding.duration = new Date().getTime() - $scope.currentFeeding.startTime;
    mytimeout = $timeout($scope.onTimeout,1000);
    storage.store($scope.currentFeeding);
    if($scope.currentFeeding.duration > MAX_TIME_MINUTES * 60 * 1000) {
      $scope.toggleFeeding($scope.currentFeeding.supplier);
    }
  };

  $scope.toggleFeeding = function(supplier) {
    if($scope.currentFeeding) {
      $scope.finnish(supplier);
    } else {
      $scope.begin(supplier);
    }
  };

  $scope.begin = function(supplier) {
    $scope.continue({ supplier: supplier, startTime: new Date().getTime(), duration: 0, volume: 0, ongoing: true });
  }

  $scope.continue = function(feeding) {
    $scope.currentFeeding = feeding;    
    mytimeout = $timeout($scope.onTimeout,1000);
    if(feeding.supplier === 'L') {
      $scope.leftSign = "...";
    } else if(feeding.supplier === 'R') {
      $scope.rightSign = "...";
    }
  }

  $scope.finnish = function(supplier) {
    $timeout.cancel(mytimeout);
    $scope.feedings.unshift($scope.currentFeeding);
    $scope.currentFeeding.ongoing = false;
    storage.store($scope.currentFeeding);
    $scope.currentFeeding = false;
    $scope.leftSign = 'L';
    $scope.rightSign= 'R';
  }


})
