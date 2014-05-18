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

  setTimeout(function(){
      storage.allData(function (rows) {
        $scope.feedings = rows;
        $scope.$apply();
      });
  }, 1);

  $scope.currentFeeding = false;
  var mytimeout = null;

  $scope.onTimeout = function(){
    $scope.currentFeeding.duration += 1000;
    mytimeout = $timeout($scope.onTimeout,1000);
  };

  $scope.toggleFeeding = function(supplier) {
    console.log("toggleFeeding with supplier " + supplier);
    if($scope.currentFeeding) {
      $timeout.cancel(mytimeout);
      storage.store($scope.currentFeeding);
      $scope.feedings.unshift($scope.currentFeeding);
      $scope.currentFeeding = false;
    } else {
      $scope.currentFeeding = { supplier: supplier, startTime: new Date(), duration: 0, volume: 0 };
      mytimeout = $timeout($scope.onTimeout,1000);
    }
  };

})
