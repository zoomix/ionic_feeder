var ChartsController = function($scope) {
  $scope.daysOfHistory = 14;

  $scope.$on("loaded", function (event, args) {
    if(!histogram.drawn) { histogram.draw(); }
    if(!percentage.drawn) { percentage.draw(); }
  });

}