var ChartsController = function($scope) {
  $scope.daysOfHistory = 14;

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