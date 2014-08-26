var ChartsController = function($scope) {
  $scope.daysOfHistory = 14;
  $scope.times = [{key: 3,  name: "3 days"},
                  {key: 7,  name: "1 week"},
                  {key: 14, name: "2 weeks"},
                  {key: 28, name: "4 weeks"} ]
  $scope.histogramTime = $scope.times[2];

  $scope.updateTime = function(newHistogramTime) {
    $scope.histogramTime = newHistogramTime;
    console.log("updated histogram time. is now " + $scope.histogramTime.key);
    histogram.nofDaysHistory = $scope.histogramTime.key;
    histogram.update();
  }

  $scope.$on("loaded", function (event, args) {
    if(!histogram.drawn) { histogram.draw(); }
    if(!percentage.drawn) { percentage.draw(); }
  });

  $scope.histogramPeakTimes = function() {
    var max = 0;
    var maxIndex = 0;
    for (var i = 0; i < histogram.hours.length; i++) {
      var val = histogram.hours[i];
      if (val > max) {
        max = val;
        maxIndex = i;
      }
    };
    return max;
  }

  $scope.histogramPeakHour = function() {
    var max = 0;
    var maxIndex = 0;
    for (var i = 0; i < histogram.hours.length; i++) {
      var val = histogram.hours[i];
      if (val > max) {
        max = val;
        maxIndex = i;
      }
    };
    return maxIndex;
  }

}