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

.controller('MenuCtrl', function($scope, $ionicModal, $ionicPopup, $ionicSideMenuDelegate) {

  $scope.vibrateOn = vibrations.getVibrateInteral();
  $scope.toggleVibrate = function() {
    var vibrateInterval = vibrations.getVibrateInteral();
    vibrateInterval = (vibrateInterval ? 0 : VIBRATE_INTERVAL);
    $scope.vibrateOn = vibrateInterval;
    vibrations.setVibrateInterval(vibrateInterval);
  }

  $scope.version = "0.0.2";

  $scope.share = function() {
    var userId = storage.getUserId();
    if (window.plugins && window.plugins.socialsharing) {
      window.plugins.socialsharing.share("Copy-paste this code into the 'Connect Devices' -> 'Enter code' menu in Ionic Baby Feeder: \n" + userId, "Ionic Baby Feeder share code");
    }
  }

  $scope.feedback = function() {
    if (window.plugins && window.plugins.socialsharing) {
      window.plugins.socialsharing.shareViaEmail('' /*no message*/, 'Just a note', ['ionic_baby_feeder@kvrgic.se']);
    }
  }

  $scope.enteredCode = "";
  $scope.connectDevices = function() {
    $ionicSideMenuDelegate.toggleLeft();
    $scope.modal.show();
  }

  $scope.enterCodePopup = function() {
    $scope.data = {}
    // An elaborate, custom popup
    var myPopup = $ionicPopup.show({
      template: '<input type="text" ng-model="data.enteredCode" placeholder="{{userId()}}" class="{{data.extraClass}}">',
      title: 'Enter new code',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        { text: 'Save',
          onTap: function(e) {
            if(!$scope.data.enteredCode || $scope.data.enteredCode.length < 10) {
              //don't allow the user to close unless the code is right
              $scope.data.extraClass = 'error';
              e.preventDefault();
            } else {
              storage.storeUserId($scope.data.enteredCode);
              $scope.closeModal();
              $scope.resync();
            }
          }
        },
      ]
    });
  }

  $scope.resyncToday = function() {
    app.getNewFeedings(util.getToday(0), function() {
      $ionicSideMenuDelegate.toggleLeft();
      $scope.resync();
    })
  }

  $scope.postAllFeedings = function() {
    app.postAllFeedings();
  }

  $scope.userId = function() {
    return storage.getUserId();
  }

  $scope.demoModeOn = storage.isDemoMode()
  $scope.toggleDemoMode = function() {
    storage.toggleDemoMode();
    $ionicSideMenuDelegate.toggleLeft();
    $scope.resync();
  }

  $scope.resync = function () {
    var counterScope = angular.element(document.getElementById('CounterApp')).scope();
    counterScope.$broadcast("resync", null);
  }

  $scope.exitApp = function () {
    console.log("exiting app");
    navigator.app.exitApp();
  }

  $ionicModal.fromTemplateUrl('connectDevices.html', {
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

.controller('CounterCtrl', function($scope, $timeout, $ionicPopup, $filter, $ionicScrollDelegate, $ionicSlideBoxDelegate ) {
  $scope.feedingDays = new Array(1);
  $scope.currentFeeding = false;
  $scope.leftSign = "L";
  $scope.rightSign= "R";
  $scope.lClass="";
  $scope.rClass="";
  $scope.timeSinceLast = "";
  $scope.activeSlide = HISTORY_DAYS;
  $scope.loading=0;
  $scope.mostRecentFinishedFeeding=false;
  $scope.updateTimeInMs = 1000;
  $scope.showInfoOverlay = true;

  $scope.hideInfoOverlay = function() {
    $scope.showInfoOverlay = false;
    storage.setInfoOverlayShown(true);
  }

  $scope.todaysFeedings = function() {
    return $scope.feedingDays[$scope.feedingDays.length - 1];
  }

  $scope.getFeedingDay = function(slideNr) {
    return $scope.feedingDays[slideNr];
  }

  $scope.setFeedingDay = function(slideNr, feedings) {
    console.log("Setting @" + slideNr + " value " + feedings);
    var index = HISTORY_DAYS - slideNr;
    if (index > $scope.feedingDays.length) {
      $scope.feedingDays.unshift(null);
      $scope.setFeedingDay(slideNr, feedings);
    } else {
      $scope.feedingDays[slideNr] = feedings;
    }
  }

  $scope.fetchAndSetTimeSinceLast = function() {
    storage.getMostRecentFinishedFeeding(function(row) {
      $scope.mostRecentFinishedFeeding = row;
      $scope.setTimeSinceLast();
    });
  }
  $scope.setTimeSinceLast = function() {
    if($scope.mostRecentFinishedFeeding) {
      var sinceLastStart = util.getTimeAgo((new Date().getTime()) - $scope.mostRecentFinishedFeeding.startTime);
      var sinceLastEnd = util.getTimeAgo((new Date().getTime()) - $scope.mostRecentFinishedFeeding.startTime - $scope.mostRecentFinishedFeeding.duration);
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
      storage.getOngoingFeeding(function(ongoingFeeding) {
        ongoingFeeding && $scope.continue(ongoingFeeding);
      });
      storage.getDataForDay(0, function (rows) {
        var latestRow = rows.length > 0 && rows[0];
        $scope.setFeedingDay(HISTORY_DAYS, rows);
        util.populateTimeBetween($scope.getFeedingDay(HISTORY_DAYS), []);
        $scope.setPredictedSupplier(rows);
        $scope.loadData(HISTORY_DAYS - 1); //load yesterdays data too
        $scope.$apply();
        mytimeout = $timeout($scope.onTimeout,$scope.updateTimeInMs);
        $scope.setupDocumentEvents(latestRow);
        $scope.loading += 1; //Start syncing
        app.getNewFeedings(latestRow.startTime, $scope.postSync);
        $scope.loading -= 1; //Stop loading
        $scope.resizeList();
      });
  }

  $scope.setupDocumentEvents = function(latestRow) {
    document.addEventListener('resume', function () {
      $scope.updateTimeInMs = 1000;
      $scope.onTimeout(); //Better not wait for the sleeping timeout (>10s) to trigger. Trigger it not to keep ticking.
      $scope.loading += 1; //Start syncing on resume
      app.getNewFeedings(latestRow.startTime, $scope.postSync);
    }, false);
    document.addEventListener('pause', function () {
      $scope.updateTimeInMs = 15000;
    }, false);
  }

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
    mytimeout = $timeout($scope.onTimeout, $scope.updateTimeInMs);
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
    $scope.lClass = "";
    $scope.rClass = "";
  }

  $scope.finnish = function(supplier) {
    var clonedFeeding = storage.rowFromDbItem($scope.currentFeeding);
    $scope.currentFeeding = false;
    clonedFeeding.ongoing = false;
    $scope.todaysFeedings().unshift(clonedFeeding);
    util.populateTimeBetween($scope.getFeedingDay(HISTORY_DAYS), []);
    $scope.mostRecentFinishedFeeding = clonedFeeding;
    storage.storeAndSync(clonedFeeding);
    vibrations.reset();
    $scope.setPredictedSupplier([clonedFeeding]);
    $scope.leftSign = 'L';
    $scope.rightSign= 'R';
  }

  $scope.postSync = function(needReloading, ongoingFeeding) {
    ongoingFeeding && $scope.continue(ongoingFeeding);
    $scope.setTimeSinceLast();
    $scope.setPredictedSupplier();
    if (needReloading) {
      $scope.reloadActivePage();
      $scope.fetchAndSetTimeSinceLast();
    }
    $scope.loading -= 1;
  }

  $scope.setPredictedSupplier = function(feedings) {
    storage.predictSupplier(feedings, function(supplier) {
      $scope.lClass = "";
      $scope.rClass = "";
      if( $scope.ongoingFeeding ) {
        return;
      }
      if(supplier === 'L') {
        $scope.lClass = "selected";
      } else if(supplier === 'R') {
        $scope.rClass = "selected";
      }
    })
  }

  $scope.slideHasChanged = function(index) {
    console.log("Slide changed to " + index);
    if (!$scope.getFeedingDay(index)) { $scope.loadData(index); }
    if (index > 0 && !$scope.getFeedingDay(index-1)) { $scope.loadData(index-1); }
    $timeout( $scope.resizeList, 50);
  }

  $scope.loadData = function(index) {
    $scope.loading += 1; //Start loading
    var dayOffset = index - HISTORY_DAYS;
    console.log("Fetching data for " + dayOffset);
    storage.getDataForDay(dayOffset, function (rows) {
      console.log("Setting fetched data");
      $scope.setFeedingDay(index, rows);
      util.populateTimeBetween($scope.getFeedingDay(index), index < HISTORY_DAYS && $scope.getFeedingDay(index+1));
      $scope.loading -= 1; //Stop loading
      $scope.$apply();
    });
  }

  $scope.resizeList = function() {
    console.log("resizeList");
    if (!$scope.resizeListStyle) {
      $scope.resizeListStyle = document.createElement('style');
      document.body.appendChild($scope.resizeListStyle);
    }
    var minHeight = window.innerHeight - document.getElementsByClassName('slider')[0].offsetTop;
    $scope.resizeListStyle.innerHTML = ".list { min-height: " + minHeight + "px }";
    $ionicSlideBoxDelegate.update();
  }

  $scope.reloadActivePage = function() {
    $scope.setFeedingDay($scope.activeSlide, null);
    if ($scope.activeSlide > 0) { $scope.setFeedingDay($scope.activeSlide - 1, null) };
    $scope.slideHasChanged($scope.activeSlide);
  }

  $scope.endTime = function(feeding) {
    return parseInt(feeding.startTime) + parseInt(feeding.duration);
  }


  $scope.deleteEditedFeeding = function() {
    console.log("Deleting feeding");
    var confirmPopup = $ionicPopup.confirm({
      title: 'Delete feeding',
      template: 'Are you sure you want to delete this feeding?'
    });
    confirmPopup.then(function(res) {
      if(res) {
        $scope.editedFeedingOrig.deleted = true;
        $scope.editedFeedingOrig.updatedAt= new Date().getTime();
        storage.storeAndSync($scope.editedFeedingOrig);
        $scope.reloadActivePage();
        $scope.setPredictedSupplier();
        $scope.fetchAndSetTimeSinceLast();
        $scope.editFeedingPopup.close();
      } else {
        console.log('Not deleting');
      }
    });
  }

  $scope.editFeeding = function(feeding) {
    $scope.editedFeedingOrig = feeding;
    $scope.editedFeedingModel = { startTime: $filter('date')(feeding.startTime, 'HH:mm'), 
                                  duration: $filter('date')(feeding.duration, 'm'),
                                  supplier: feeding.supplier,
                                  volume: (feeding.volume) ? feeding.volume/10 : 0};


    $scope.editFeedingPopup = $ionicPopup.show({
      title: 'Edit feeding',
      templateUrl: 'editFeeding.html',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        { text: 'Save', 
          onTap: function (e) {
            $scope.editedFeedingOrig.supplier = $scope.editedFeedingModel.supplier;
            $scope.editedFeedingOrig.duration = parseInt($scope.editedFeedingModel.duration) * 60 * 1000;
            $scope.editedFeedingOrig.volume   = $scope.editedFeedingModel.volume * 10;
            $scope.editedFeedingOrig.updatedAt= new Date().getTime();
            storage.storeAndSync($scope.editedFeedingOrig);
            $scope.fetchAndSetTimeSinceLast();
          }
        }
      ]
    });
  };

  $scope.bottleFeeding = function() {
    $scope.bottleFeedingModel = { volume: 15 }
    var editFeedingPopup = $ionicPopup.show({
      title: 'New bottle feeding',
      templateUrl: 'newBottleFeeding.html',
      scope: $scope,
      buttons: [
        { text: 'Cancel' },
        { text: 'Add', 
          onTap: function (e) {
            var feeding = { supplier: "B", startTime: new Date().getTime(), duration: 0, volume: 10*$scope.bottleFeedingModel.volume, ongoing: false }
            storage.storeAndSync(feeding);
            $scope.todaysFeedings().unshift(feeding);
            $scope.fetchAndSetTimeSinceLast();
            util.populateTimeBetween($scope.todaysFeedings(), []);
          }
        }
      ]
    });
  }

  $scope.getToday = function(day) {
    return util.getToday(day);
  }


  $scope.init = function() {
    vibrations.getVibrateInteral();
    $scope.reloadTodaysFeedings();
    $scope.showInfoOverlay = !storage.isInfoOverlayShown();
  }

  setTimeout($scope.init(), 1);


})
