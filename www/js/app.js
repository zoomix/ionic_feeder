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

  $scope.version = "0.2.0";

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


  $ionicModal.fromTemplateUrl('charts.html', {
    scope: $scope,
    animation: 'slide-in-up'
  }).then(function(chartsModal) {
    $scope.chartsModal = chartsModal;
  });
  $scope.closeChartsModal = function() {
    $scope.chartsModal.hide();
  };
  $scope.$on('$destroy', function() {
    $scope.chartsModal.remove();
  });
  $scope.enterCharts = function() {
    $ionicSideMenuDelegate.toggleLeft();
    $scope.chartsModal.show();
    var chartsScope = angular.element(document.getElementById('ChartsController')).scope();
    chartsScope.$broadcast("loaded", null);
  }
})

.controller('CounterCtrl', function($scope, $timeout, $ionicPopup, $filter, $ionicScrollDelegate, $ionicSideMenuDelegate, $ionicSlideBoxDelegate ) {
  $scope.currentFeeding = false;
  $scope.leftSign = "L";
  $scope.rightSign= "R";
  $scope.lClass="";
  $scope.rClass="";
  $scope.updateTimeInMs = 1000;

  var counterTimeout = null;

  $scope.onTimeout = function(){
    console.log("timeout: CounterCtrl " + new Date());
    if($scope.currentFeeding && $scope.currentFeeding.ongoing) {
      $scope.currentFeeding.duration = new Date().getTime() - $scope.currentFeeding.startTime;
      if($scope.currentFeeding.duration > MAX_TIME_MINUTES * 60 * 1000) {
        $scope.currentFeeding.duration = MAX_TIME_MINUTES * 60 * 1000;
        $scope.toggleFeeding($scope.currentFeeding.supplier);
      }
      vibrations.doVibrate($scope.currentFeeding.duration);
      counterTimeout = $timeout($scope.onTimeout, $scope.updateTimeInMs);
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
    $scope.onTimeout();
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
    $scope.fetchAndSetTimeSinceLast();
    vibrations.reset();
    $scope.setPredictedSupplier([clonedFeeding]);
    $scope.leftSign = 'L';
    $scope.rightSign= 'R';
  }

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



  $scope.setupDocumentEvents = function(timeSinceLastUpdate) {
    document.addEventListener('resume', function () {
      $scope.updateTimeInMs = 1000;
      $scope.onTimeout(); //Better not wait for the sleeping timeout (>10s) to trigger. Trigger it not to keep ticking.
      $scope.loading += 1; //Start syncing on resume
      app.getNewFeedings(timeSinceLastUpdate, $scope.postSync);
    }, false);
    document.addEventListener('pause', function () {
      $scope.updateTimeInMs = 15000;
    }, false);
  }

  $scope.setupDocumentEvents(new Date().getTime());
  storage.getOngoingFeeding(function(ongoingFeeding) {
    $scope.currentFeeding = ongoingFeeding;
    ongoingFeeding && $scope.continue(ongoingFeeding);
  });

})

.controller('ListCtrl', function($scope, $ionicPopup, $timeout, $filter, $ionicScrollDelegate, $ionicSideMenuDelegate, $ionicSlideBoxDelegate ) {
  $scope.feedingDays = new Array(1);
  $scope.timeSinceLast = "";
  $scope.activeSlide = HISTORY_DAYS;
  $scope.loading=0;
  $scope.mostRecentFinishedFeeding=false;
  $scope.showInfoOverlay = true;
  $scope.updateTimeInMs = 30000;

  var mytimeout = null;

  $scope.todaysFeedings = function() {
    return $scope.feedingDays[$scope.feedingDays.length - 1];
  }

  $scope.getFeedingDay = function(slideNr) {
    return $scope.feedingDays[slideNr];
  }

  $scope.onTimeout = function() {
    console.log("timeout: ListCtrl " + new Date());
    $scope.setTimeSinceLast();  
    mytimeout = $timeout($scope.onTimeout, $scope.updateTimeInMs);
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

  $scope.$on("resync", function (event, args) {
    $scope.reloadTodaysFeedings();
  });

  $scope.reloadTodaysFeedings = function() {
    $scope.loading += 1; //Start loading
    $scope.fetchAndSetTimeSinceLast();
    storage.getDataForDay(0, function (rows) {
      var latestRow = rows.length > 0 && rows[0];
      $scope.setFeedingDay(HISTORY_DAYS, rows);
      util.populateTimeBetween($scope.getFeedingDay(HISTORY_DAYS), []);
      $scope.$$childHead.setPredictedSupplier(rows);
      $scope.loadData(HISTORY_DAYS - 1); //load yesterdays data too
      $scope.$apply();
      mytimeout = $timeout($scope.onTimeout,$scope.updateTimeInMs);
      $scope.loading += 1; //Start syncing
      app.getNewFeedings(latestRow.startTime, $scope.postSync);
      $scope.loading -= 1; //Stop loading
      $scope.resizeList();
    });
  }

  $scope.postSync = function(needReloading, ongoingFeeding) {
    ongoingFeeding && $scope.continue(ongoingFeeding);
    $scope.setTimeSinceLast();
    $scope.$$childHead.setPredictedSupplier();
    if (needReloading) {
      $scope.reloadActivePage();
      $scope.fetchAndSetTimeSinceLast();
    }
    $scope.loading -= 1;
    $scope.$apply();
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
        $scope.$$childHead.setPredictedSupplier();
        $scope.fetchAndSetTimeSinceLast();
        $scope.editFeedingPopup.close();
      } else {
        console.log('Not deleting');
      }
    });
  }

  $scope.editFeeding = function(feeding) {
    $scope.editedFeedingOrig = feeding;
    $scope.editedFeedingModel = { startTime: feeding.startTime, 
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
            var reloadDays = $scope.editedFeedingModel.timeChanged && [$scope.editedFeedingOrig.startTime, $scope.editedFeedingModel.startTime]
            $scope.editedFeedingOrig.supplier = $scope.editedFeedingModel.supplier;
            $scope.editedFeedingOrig.duration = parseInt($scope.editedFeedingModel.duration) * 60 * 1000;
            $scope.editedFeedingOrig.volume   = $scope.editedFeedingModel.volume * 10;
            $scope.editedFeedingOrig.startTime= $scope.editedFeedingModel.startTime;
            $scope.editedFeedingOrig.updatedAt= new Date().getTime();
            storage.storeAndSync($scope.editedFeedingOrig);
            if(reloadDays) {
              reloadDays = [util.getDaysFromToday(reloadDays[0]), util.getDaysFromToday(reloadDays[1])];
              $scope.loadData(HISTORY_DAYS - reloadDays[0]);
              if(reloadDays[0] !== reloadDays[1]) {
                $scope.loadData(HISTORY_DAYS - reloadDays[1]);
              }
            }
            $scope.fetchAndSetTimeSinceLast();
          }
        }
      ]
    });
  };

  $scope.editDate = function() {
    var options = {date: new Date($scope.editedFeedingModel.startTime), mode:'date', maxDate:new Date()};
    datePicker.show(options, function(time){
      if(time && !isNaN(time.getTime())) {
        var oldTime = new Date($scope.editedFeedingModel.startTime);
        time.setHours(oldTime.getHours());
        time.setMinutes(oldTime.getMinutes());
        time.setSeconds(oldTime.getSeconds());
        $scope.editedFeedingModel.timeChanged = true;
        $scope.editedFeedingModel.startTime = time.getTime();
      }
    });
  }
  $scope.editTime = function() {
    var options = {date: new Date($scope.editedFeedingModel.startTime), mode:'time', maxDate:new Date()};
    datePicker.show(options, function(time){
      if(time && !isNaN(time.getTime())) {
        $scope.editedFeedingModel.timeChanged = true;
        $scope.editedFeedingModel.startTime = time.getTime();
      }
    });
  }



  $scope.getToday = function(day) {
    return util.getToday(day);
  }

  $scope.hideInfoOverlay = function() {
    $scope.showInfoOverlay = false;
    $ionicSideMenuDelegate.canDragContent(true);
    storage.setInfoOverlayShown(true);
  }

  $scope.init = function() {
    vibrations.getVibrateInteral();
    $scope.reloadTodaysFeedings();
    $scope.showInfoOverlay = !storage.isInfoOverlayShown();
    if($scope.showInfoOverlay) {
      $ionicSideMenuDelegate.canDragContent(false);
    }
  }

  setTimeout($scope.init(), 1);

})


.controller('ChartsController', ChartsController);
