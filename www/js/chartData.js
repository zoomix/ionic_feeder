var histogram = {
  hours: new Array(24),

  draw: function() {
    histogram._fillHours(histogram._makeGraph);
  },

  _fillHours: function(doneCB) {
    storage.getTimesOlderThan(util.getToday(-14), function(rows) {
      var date, hour;
      console.log("_fillHours plows through " + rows.length + " start times");
      for(var i=0; i<rows.length; i++) {
        date = new Date(parseInt(rows[i]));
        hour = date.getHours();
        histogram.hours[hour] = (histogram.hours[hour] || 0) + 1
      }
      doneCB();
    });
  },

  _makeGraph: function() {
    var ctx = document.getElementById("myHistogram").getContext("2d");
    var data = {
      labels: [],
      datasets: [
        {
        label: "My First dataset",
        fillColor: "rgba(220,220,220,0.2)",
        strokeColor: "rgba(220,220,220,1)",
        pointColor: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: histogram.hours
        }
      ]};
    for(var i=0; i<24; i++) {
      data.labels.push(i);
    }
    var options = {}
    var myLineChart = new Chart(ctx).Bar(data, options);
  }
};