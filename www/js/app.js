// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform, $ionicSlideBoxDelegate, $ionicSideMenuDelegate, $ionicNavBarDelegate) {
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

.controller('MenuCtrl', function($scope, $ionicModal) {

  $scope.vibrateOn = vibrations.getVibrateInteral();
  $scope.toggleVibrate = function() {
    var vibrateInterval = vibrations.getVibrateInteral();
    vibrateInterval = (vibrateInterval ? 0 : VIBRATE_INTERVAL);
    $scope.vibrateOn = vibrateInterval;
    vibrations.setVibrateInterval(vibrateInterval);
  }

  $scope.version = "0.0.1";
  $scope.about = function() {
    alert("Ionic Feeder, version " + $scope.version);
  }

  $scope.share = function() {
    var userId = storage.getUserId();
    if (window.plugins && window.plugins.socialsharing) {
      window.plugins.socialsharing.share("Copy-paste this code into the 'Enter code' menu in the application: " + userId, "Ionic feeder share code");
    }
  }

  $scope.enteredCode = "";
  $scope.enterCode = function() {
    $scope.modal.show();
  }
  $scope.storeEnteredCode = function(enteredCode) {
    if(!enteredCode || enteredCode.length < 10) {
      alert("Code '" + enteredCode + "' seems invalid. Please try again.");
    } else {
      storage.storeUserId(enteredCode);
      $scope.closeModal();
    }
  }

  $scope.resyncToday = function() {
    app.getNewFeedings(app.getToday(0), function() {
      var counterScope = angular.element(document.getElementById('CounterApp')).scope();
      counterScope.$broadcast("resync", null);
    })
  }

  $scope.postAllFeedings = function() {
    app.postAllFeedings();
  }

  $scope.userId = function() {
    return storage.getUserId();
  }

  $ionicModal.fromTemplateUrl('enterCodeModal.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(modal) {
    $scope.modal = modal;
  });
  $scope.closeModal = function() {
    $scope.modal.hide();
  };
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });
})

.controller('CounterCtrl', function($scope, $timeout, $ionicPopup, $filter) {
  $scope.feedings = new Array(8);
  $scope.currentFeeding = false;
  $scope.leftSign = "L";
  $scope.rightSign= "R";
  $scope.lClass="";
  $scope.rClass="";
  $scope.timeSinceLast = "";
  $scope.activeSlide = 7;
  $scope.loading=0;
  $scope.mostRecentFinishedFeeding=false;
  $scope.unconfirmedBottleFeeding=false;

  $scope.todaysFeedings = function() {
    return $scope.feedings[7];
  }

  $scope.fetchAndSetTimeSinceLast = function() {
    storage.getMostRecentFinishedFeeding(function(row) {
      $scope.mostRecentFinishedFeeding = row;
      $scope.setTimeSinceLast();
    });
  }
  $scope.setTimeSinceLast = function() {
    if($scope.mostRecentFinishedFeeding) {
      var sinceLastStart = app.getTimeAgo((new Date().getTime()) - $scope.mostRecentFinishedFeeding.startTime);
      var sinceLastEnd = app.getTimeAgo((new Date().getTime()) - $scope.mostRecentFinishedFeeding.startTime - $scope.mostRecentFinishedFeeding.duration);
      $scope.timeSinceLast = sinceLastEnd;
    }
  }

  var mytimeout = null;

  $scope.$on("resync", function (event, args) {
    $scope.reloadTodaysFeedings();
  });

  $scope.reloadTodaysFeedings = function() {
      $scope.loading += 1; //Start loading
      $scope.fetchAndSetTimeSinceLast();
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
        $scope.feedings[7] = rows;
        $scope.$apply();
        mytimeout = $timeout($scope.onTimeout,1000);
        document.addEventListener('resume', function () {
          $scope.loading += 1; //Start syncing on resume
          app.getNewFeedings(latestRow.startTime, $scope.mergeNewItems);
        }, false);
        $scope.loading += 1; //Start syncing
        app.getNewFeedings(latestRow.startTime, $scope.mergeNewItems);
        $scope.loading -= 1; //Stop loading
      });
  }
  setTimeout($scope.reloadTodaysFeedings, 1);
  setTimeout(function() {vibrations.getVibrateInteral()}, 1);

  $scope.onTimeout = function(){
    if($scope.currentFeeding && $scope.currentFeeding.ongoing) {
      $scope.currentFeeding.duration = new Date().getTime() - $scope.currentFeeding.startTime;
      if($scope.currentFeeding.duration > MAX_TIME_MINUTES * 60 * 1000) {
        $scope.currentFeeding.duration = MAX_TIME_MINUTES * 60 * 1000;
        $scope.toggleFeeding($scope.currentFeeding.supplier);
      }
      vibrations.doVibrate($scope.currentFeeding.duration);
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
    vibrations.catchup(new Date().getTime() - parseInt(feeding.startTime));
    $scope.currentFeeding = feeding;    
    if(feeding.supplier === 'L') {
      $scope.leftSign = STOP_SIGN;
    } else if(feeding.supplier === 'R') {
      $scope.rightSign = STOP_SIGN;
    }
    $scope.setPredictedSupplier(feeding);
  }

  $scope.finnish = function(supplier) {
    var clonedFeeding = storage.rowFromDbItem($scope.currentFeeding);
    $scope.currentFeeding = false;
    clonedFeeding.ongoing = false;
    $scope.todaysFeedings().unshift(clonedFeeding);
    $scope.mostRecentFinishedFeeding = clonedFeeding;
    storage.storeAndSync(clonedFeeding);
    vibrations.reset();
    $scope.setPredictedSupplier(clonedFeeding);
    $scope.leftSign = 'L';
    $scope.rightSign= 'R';
  }

  $scope.mergeNewItems = function(newItems) {
    if (newItems && newItems.length > 0) {
      var needReloading = false;
      var feeding = false;
      storage.getIdsOlderThan(newItems[0].startTime, function(feedingIds) {
        console.log("We've got " + feedingIds + " older than " + newItems[0].startTime);
        for (var i = 0; i < newItems.length; i++) {
          feeding = newItems[i];
          var feedingUpdated = feeding.updatedAt && parseInt(feeding.updatedAt) > 0
          if( feeding.ongoing === 'true' || feeding.ongoing === true ) {
            console.log("ongoing feeding: " + feeding.id);
            $scope.continue(feeding);
          } else if( !feedingIds.has(feeding.id) || feedingUpdated) {
            var feedingDeleted = feeding.deleted === 'true' || feeding.deleted === true
            needReloading = needReloading || !feedingDeleted;
            storage.store(feeding);
          }
        }
        $scope.setTimeSinceLast();
        if(feeding && !$scope.currentFeeding) {
          $scope.setPredictedSupplier(feeding);
        }
        if (needReloading) {
          $scope.reloadActivePage();
          $scope.fetchAndSetTimeSinceLast();
        }
      })
    }
    $scope.loading -= 1;//Stop syncing
  }

  $scope.timeToPrevFeeding = function(activeSlide, index) {
    if(index < 1) {
      return "";
    }
    var next = $scope.feedings[activeSlide][index - 1];
    var curr = $scope.feedings[activeSlide][index ];
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
    if (! $scope.feedings[index]) {
      $scope.loading += 1; //Start loading
      var dayOffset = index - 7;
      console.log("Fetching data for " + dayOffset);
      storage.getDataForDay(dayOffset, function (rows) {
        console.log("Setting fetched data");
        $scope.feedings[index] = rows;
        $scope.loading -= 1; //Stop loading
        $scope.$apply();
      });
    }
  }
  $scope.reloadActivePage = function() {
    $scope.feedings[$scope.activeSlide] = null;
    $scope.slideHasChanged($scope.activeSlide);
  }

  $scope.endTime = function(feeding) {
    return parseInt(feeding.startTime) + parseInt(feeding.duration);
  }


  $scope.editFeeding = function(feeding) {
    $scope.editedFeedingOrig = feeding;
    $scope.editedFeedingModel = { startTime: $filter('date')(feeding.startTime, 'HH:mm'), 
                                  duration: $filter('date')(feeding.duration, 'm'),
                                  supplier: feeding.supplier,
                                  volume: (feeding.volume) ? feeding.volume/10 : 0};
    var editFeedingPopup = $ionicPopup.show({
      title: 'Edit feeding!',
      templateUrl: 'editFeeding.html',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        { text: 'Save', 
          type: 'button-positive', 
          onTap: function (e) {
            $scope.editedFeedingOrig.supplier = $scope.editedFeedingModel.supplier;
            $scope.editedFeedingOrig.duration = parseInt($scope.editedFeedingModel.duration) * 60 * 1000;
            $scope.editedFeedingOrig.volume = $scope.editedFeedingModel.volume * 10;
            $scope.editedFeedingOrig.updatedAt= new Date().getTime();
            storage.storeAndSync($scope.editedFeedingOrig);
          }
        },
        { text: 'Delete', 
          type: 'button-assertive',
          onTap: function(e) {
            $scope.editedFeedingOrig.deleted = true;
            $scope.editedFeedingOrig.updatedAt= new Date().getTime();
            storage.storeAndSync($scope.editedFeedingOrig);
            $scope.reloadActivePage();
          }
        }
      ]
    });
  };

  $scope.bottleFeeding = function() {
    $scope.unconfirmedBottleFeeding = 0;
  }

  $scope.confirmBottleFeeding = function() {
    var feeding = { supplier: "B", startTime: new Date().getTime(), duration: 0, volume: 10*$scope.unconfirmedBottleFeeding, ongoing: false }
    storage.storeAndSync(feeding);
    $scope.todaysFeedings().unshift(feeding);
    $scope.fetchAndSetTimeSinceLast();
    $scope.unconfirmedBottleFeeding = false;
  }

  $scope.cancelBottleFeeding = function() {
    $scope.unconfirmedBottleFeeding = false;
  }

})
