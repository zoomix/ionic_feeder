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
  $scope.timeSinceLast = "";
  $scope.timeSinceLastSuffix = "";

  $scope.setTimeSinceLast = function() {
    if($scope.feedings.length == 0) {
      $scope.timeSinceLast = ".. well.. never";
      $scope.timeSinceLastSuffix = ".";
    } else {
      var latestRow = $scope.feedings[0]; //Remember. The rows are in reverse order.
      var feedingTooRecent = ((new Date().getTime()) - latestRow.startTime - latestRow.duration) < 60 * 1000; 
      if (feedingTooRecent) {
        $scope.timeSinceLast = "just now";
        $scope.timeSinceLastSuffix = ".";
      } else {
        var sinceLastStart = app.getTimeAgo((new Date().getTime()) - latestRow.startTime);
        var sinceLastEnd = app.getTimeAgo((new Date().getTime()) - latestRow.startTime - latestRow.duration);
        $scope.timeSinceLast = sinceLastStart + " (" + sinceLastEnd + ") ";
        $scope.timeSinceLastSuffix = "ago.";
      }
    }
  }

  setTimeout(function(){
      storage.allData(function (rows) {
        var latestRow = false;
        if(rows.length > 0) {
          latestRow = rows[0]; //Remember. The rows are in reverse order.
          if(latestRow.ongoing) {
            rows.shift();
            $scope.continue(latestRow);
          }
        }
        $scope.feedings = rows;
        app.getNewFeedings(latestRow, $scope.mergeNewItems); $scope.setTimeSinceLast();
        $scope.$apply();
        mytimeout = $timeout($scope.onTimeout,1000);
      });
  }, 1);

  var mytimeout = null;

  $scope.onTimeout = function(){
    if($scope.currentFeeding && $scope.currentFeeding.ongoing) {
      $scope.currentFeeding.duration = new Date().getTime() - $scope.currentFeeding.startTime;
      if($scope.currentFeeding.duration > MAX_TIME_MINUTES * 60 * 1000) {
        $scope.toggleFeeding($scope.currentFeeding.supplier);
      }
    }
    $scope.setTimeSinceLast();  
    mytimeout = $timeout($scope.onTimeout,1000);
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
    if(feeding.supplier === 'L') {
      $scope.leftSign = "...";
    } else if(feeding.supplier === 'R') {
      $scope.rightSign = "...";
    }
    storage.store($scope.currentFeeding);
  }

  $scope.finnish = function(supplier) {
    $scope.feedings.unshift($scope.currentFeeding);
    $scope.currentFeeding.ongoing = false;
    storage.store($scope.currentFeeding);
    $scope.currentFeeding = false;
    $scope.leftSign = 'L';
    $scope.rightSign= 'R';
  }

  $scope.mergeNewItems = function(newItems) {
    if (newItems && newItems.length > 0) {
      for (var i = 0; i < newItems.length; i++) {
        var feeding = newItems[i];
        if( feeding.ongoing === 'true' || feeding.ongoing === true ) {
          console.log("ongoing feeding: " + feeding.id);
          $scope.continue(feeding);
        } else if($scope.hasId(feeding.id)) {
          $scope.feedings.unshift(feeding);
          storage.store(feeding);
        }
      }
      $scope.setTimeSinceLast();
    }
  }

  $scope.postFeeding = function() {
    app.postAllFeedings();
  }

  $scope.hasId = function(id) {
    for (var i = 0; i < $scope.feedings.length; i++) {
      if($scope.feedings[i] === id) {
        return true;
      }
    };
    return false;
  }

})
