var ChartsController = function($scope) {

  $scope.scatter = scatter;
  $scope.scatterTimes = [{key: 7,  name: "1 week" , vbars: ['Hidden']},
                        {key: 14, name: "2 weeks", vbars: ['Bold','Hidden']},
                        {key: 28, name: "4 weeks", vbars: ['','Bold','','Hidden']},
                        {key: 56, name: "8 weeks", vbars: ['','','','Bold','','','','Hidden']}]
  $scope.scatterTime = $scope.scatterTimes[1];
  $scope.updateSpreadTime = function(newscatterTime) {
    $scope.scatterTime = newscatterTime;
    scatter.nofDaysHistory = $scope.scatterTime.key;
    scatter.update(function() {$scope.$apply();});
  }
  $scope.scatterVerticalBarWidth = function() {
    return 100/$scope.scatterTime.vbars.length + "%";
  }


  $scope.histogramTimes = [{key: 3,  name: "3 days"},
                           {key: 7,  name: "1 week"},
                           {key: 14, name: "2 weeks"},
                           {key: 28, name: "4 weeks"} ]
  $scope.histogramTime = $scope.histogramTimes[2];
  $scope.updateHistogramTime = function(newHistogramTime) {
    $scope.histogramTime = newHistogramTime;
    histogram.nofDaysHistory = $scope.histogramTime.key;
    histogram.update();
  }

  $scope.percentageTimes = [{key: 7,  name: "1 week"},
                            {key: 14, name: "2 weeks"},
                            {key: 28, name: "4 weeks"},
                            {key: 56, name: "8 weeks"} ]
  $scope.percentageTime = $scope.percentageTimes[1];
  $scope.updatePercentageTime = function(newpercentageTime) {
    $scope.percentageTime = newpercentageTime;
    percentage.nofDaysHistory = $scope.percentageTime.key;
    percentage.update();
  }

  $scope.$on("loaded", function (event, args) {
    if(!scatter.drawn)     { scatter.update(function() {}); }
    if(!histogram.drawn)  { histogram.draw(); }
    if(!percentage.drawn) { percentage.draw(); }
  });

  $scope.histogramPeakTimes = function() {
    return histogram.peakTimes;
  }

  $scope.histogramPeakHour = function() {
    return histogram.peakHour;
  }

  $scope.percentageBeginDistro = function(supplier) {
    return percentage.suppliers[supplier][0];
  }
  $scope.percentageHasDataAtBegin = function(supplier) {
    return $scope.percentageBeginDistro('L') > 0 ||
           $scope.percentageBeginDistro('R') > 0 ||
           $scope.percentageBeginDistro('B') > 0;
  }
  $scope.percentageEndDistro = function(supplier) {
    return percentage.suppliers[supplier][percentage.suppliers[supplier].length - 1];
  }


}