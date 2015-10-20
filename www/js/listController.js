var ListCtrl = function($scope, $ionicPopup, $timeout, $filter, $ionicSideMenuDelegate, $ionicSlideBoxDelegate ) {
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
      $scope.$apply();
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
    ongoingFeeding && $scope.$$childHead.continue(ongoingFeeding);
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
                                  editTime: feeding.startTime,
                                  editDate: feeding.startTime,
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
        $scope.editedFeedingModel.timeChanged = true;
        $scope.editedFeedingModel.editDate = time;
        $scope.editedFeedingModel.startTime = util.getCombinedTimeInMs($scope.editedFeedingModel.editDate, $scope.editedFeedingModel.editTime);
        $scope.$digest();
      }
    });
  }
  $scope.editTime = function() {
    var options = {date: new Date($scope.editedFeedingModel.startTime), mode:'time', maxDate:new Date()};
    datePicker.show(options, function(time){
      if(time && !isNaN(time.getTime())) {
        $scope.editedFeedingModel.timeChanged = true;
        $scope.editedFeedingModel.editTime = time;
        $scope.editedFeedingModel.startTime = util.getCombinedTimeInMs($scope.editedFeedingModel.editDate, $scope.editedFeedingModel.editTime);
        $scope.$digest();
      }
    });
  }

  $scope.getToday = function(day) {
    return util.getToday(day);
  }

  $scope.getDayForSlide = function(slideIndex) {
    return util.getToday(slideIndex - HISTORY_DAYS);
  }

  $scope.getDailyTotal = function(feedings, supplier) {
    var duration = 0;
    var volume = 0;
    if (feedings) {
      for (var i = 0; i < feedings.length; i++) {
        if(feedings[i].supplier === supplier) {
          duration += parseInt(feedings[i].duration);
          volume += parseInt(feedings[i].volume);
        }
      };
    }
    return volume > 0 ? volume : Math.round(duration/1000/60);
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

}