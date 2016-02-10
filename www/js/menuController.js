var MenuCtrl = function($scope, $ionicModal, $ionicPopup, $ionicSideMenuDelegate, $filter) {

  $scope.vibrateOn = vibrations.getVibrateInteral();
  $scope.toggleVibrate = function() {
    var vibrateInterval = vibrations.getVibrateInteral();
    vibrateInterval = (vibrateInterval ? 0 : VIBRATE_INTERVAL);
    $scope.vibrateOn = vibrateInterval;
    vibrations.setVibrateInterval(vibrateInterval);
  }

  $scope.export = function() {
    console.log("Exporting");
    storage.allData(function(rows) {
      var csvContent = "Feeding time;Left/Bottle/Right;Feeding duration (minutes);Feeding volume (ml)\n";
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var csvRow = $filter('date')(row.startTime, 'yyyyMMdd HH:mm') + ";" + 
                     row.supplier + ";" + 
                     $filter('date')(row.duration, 'm') + ";" + 
                     row.volume + "\n";
        csvContent += csvRow;
      };
      exportCsv(csvContent);
    })
  }

  $scope.version = "1.1.3";

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
};