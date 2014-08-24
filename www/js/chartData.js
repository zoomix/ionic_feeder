var histogram = {
  hours: new Array(24),
  drawn: false,
  nofDaysHistory: 14,

  draw: function() {
    histogram._fillHours(histogram._makeGraph);
    this.drawn = true;
  },

  _fillHours: function(doneCB) {
    storage.getRowsOlderThan(util.getToday(-this.nofDaysHistory), function(rows) {
      var date, hour;
      console.log("_fillHours plows through " + rows.length + " start times");
      histogram.hours = new Array(24);
      for(var i=0; i<rows.length; i++) {
        date = new Date(parseInt(rows[i].startTime));
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
        barDatasetSpacing : 3,
        data: histogram.hours
        }
      ]};
    for(var i=0; i<24; i++) {
      data.labels.push(i);
    }
    var options = { responsive: true, 
                    scaleGridLineWidth : 1,
                    barValueSpacing: 2,
                    scaleFontSize: 8,
                    showTooltips: false }
    var myLineChart = new Chart(ctx).Bar(data, options);
  }
};


var percentage = {
  nofDaysHistory: 14,
  suppliers: {'L': new Array(this.nofDaysHistory),
              'R': new Array(this.nofDaysHistory),
              'B': new Array(this.nofDaysHistory)},
  drawn: false,

  draw: function() {
    this._fillData(this._makeGraph);
    this.drawn = true;
  },

  _fillData: function(doneCB) {
    storage.getRowsOlderThan(util.getToday(-this.nofDaysHistory), function(rows) {
      var supplier, hour;
      console.log("_fillData plows through " + rows.length + " start times");
      percentage.suppliers = {'L': new Array(percentage.nofDaysHistory),
                        'R': new Array(percentage.nofDaysHistory),
                        'B': new Array(percentage.nofDaysHistory)};
      var day = 0;
      for(var i=0; i<rows.length; i++) {
        day = percentage.nofDaysHistory - util.getDaysFromToday(parseInt(rows[i].startTime));
        supplier = rows[i].supplier;
        percentage.suppliers[supplier][day] = (percentage.suppliers[supplier][day] || 0) + 1;
      }
      doneCB();
    });
  },

  _makeGraph: function() {
    var ctx = document.getElementById("myPercentage").getContext("2d");
    var data = {
      labels: [],
      datasets: [
        {
        label: "Left",
        fillColor: "rgba(220,130,130,0.2)",
        strokeColor: "rgba(220,130,130,1)",
        data: percentage.suppliers['L']
        },
        {
        label: "Right",
        fillColor: "rgba(130,220,130,0.2)",
        strokeColor: "rgba(130,220,130,1)",
        data: percentage.suppliers['R']
        },
        {
        label: "Bottle",
        fillColor: "rgba(130,130,220,0.2)",
        strokeColor: "rgba(130,130,220,1)",
        data: percentage.suppliers['B']
        }
      ]};
    for(var i=0; i<percentage.nofDaysHistory; i++) {
      data.labels.push(-percentage.nofDaysHistory + i);
    }
    var options = { responsive: true, 
                    scaleGridLineWidth : 1,
                    barValueSpacing: 2,
                    scaleFontSize: 8,
                    showTooltips: false,
                    pointDot : false }
    var myLineChart = new Chart(ctx).Line(data, options);
  }

}