// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform, $ionicSlideBoxDelegate) {
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
  $scope.lClass="";
  $scope.rClass="";
  $scope.timeSinceLast = "";
  $scope.timeSinceLastSuffix = "";
  $scope.activeSlide = 7;

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
      storage.getDataForDay(0, function (rows) {
        var latestRow = false;
        if(rows.length > 0) {
          latestRow = rows[0]; //Remember. The rows are in reverse order.
          if(latestRow.ongoing) {
            rows.shift();
            $scope.continue(latestRow);
          }
          $scope.setPredictedSupplier(latestRow);
        }
        $scope.feedings = rows;
        // app.getNewFeedings(latestRow, $scope.mergeNewItems);
        $scope.setTimeSinceLast();
        $scope.$apply();
        mytimeout = $timeout($scope.onTimeout,1000);
        document.addEventListener('resume', function () { app.getNewFeedings(latestRow, $scope.mergeNewItems); }, false);
      });
  }, 1);

  var mytimeout = null;

  $scope.onTimeout = function(){
    if($scope.currentFeeding && $scope.currentFeeding.ongoing) {
      $scope.currentFeeding.duration = new Date().getTime() - $scope.currentFeeding.startTime;
      if($scope.currentFeeding.duration > MAX_TIME_MINUTES * 60 * 1000) {
        $scope.currentFeeding.duration = MAX_TIME_MINUTES * 60 * 1000;
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
    storage.storeAndSync($scope.currentFeeding);
  }

  $scope.continue = function(feeding) {
    $scope.currentFeeding = feeding;    
    if(feeding.supplier === 'L') {
      $scope.leftSign = STOP_SIGN;
    } else if(feeding.supplier === 'R') {
      $scope.rightSign = STOP_SIGN;
    }
    $scope.setPredictedSupplier(feeding);
  }

  $scope.finnish = function(supplier) {
    $scope.feedings.unshift($scope.currentFeeding);
    $scope.currentFeeding.ongoing = false;
    storage.storeAndSync($scope.currentFeeding);
    $scope.setPredictedSupplier($scope.currentFeeding);
    $scope.currentFeeding = false;
    $scope.leftSign = 'L';
    $scope.rightSign= 'R';
  }

  $scope.mergeNewItems = function(newItems) {
    if (newItems && newItems.length > 0) {
      var feeding = false;
      for (var i = 0; i < newItems.length; i++) {
        feeding = newItems[i];
        if( feeding.ongoing === 'true' || feeding.ongoing === true ) {
          console.log("ongoing feeding: " + feeding.id);
          $scope.continue(feeding);
        } else if(!$scope.hasId(feeding.id)) {
          $scope.feedings.unshift(feeding);
          storage.store(feeding);
        }
      }
      $scope.setTimeSinceLast();
      if(feeding && !$scope.currentFeeding) {
        $scope.setPredictedSupplier(feeding);
      }
    }
  }

  $scope.postFeeding = function() {
    app.postAllFeedings();
  }

  $scope.hasId = function(id) {
    for (var i = 0; i < $scope.feedings.length; i++) {
      if($scope.feedings[i].id === id) {
        console.log("Turns out " + $scope.feedings[i].id + " === " + id );
        return true;
      }
    };
    return false;
  }

  $scope.timeToPrevFeeding = function(index) {
    if(index < 1) {
      return "";
    }
    var next = $scope.feedings[index - 1];
    var curr = $scope.feedings[index ];
    if(next && curr) {
      return app.getTimeAgo(next.startTime - curr.startTime - curr.duration);
    }
  }

  $scope.setPredictedSupplier = function(feeding) {
    $scope.lClass = "";
    $scope.rClass = "";
    var previousSupplier = feeding.supplier;
    if(!feeding.ongoing) {
      if(previousSupplier === 'L') {
        $scope.rClass = "selected";
      } else if(previousSupplier === 'R') {
        $scope.lClass = "selected";
      }
    }
  }

  $scope.slideHasChanged = function(index) {
    console.log("Slide changed to " + index);
  }

})
