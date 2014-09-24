var CounterCtrl = function($scope, $timeout, $ionicPopup) {
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

}