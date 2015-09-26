var scatter = {

  nofDaysHistory: 14,
  drawn: false,
  items: new Array(),
  getItems: function() {
    return scatter.items;
  },

  _heightOfDay: function(date) {
    var timezoneCompensated = (date.getTime() - parseInt(util.getToday(0))) % util.msInDay;
    if(timezoneCompensated < 0) {
      timezoneCompensated += util.msInDay;
    }
    return 100 - (100 * timezoneCompensated / util.msInDay) + "%";
  },

  _dayPos: function(date, nofDays) {
    var daysFromToday = util.getDaysFromToday(date);
    return  Math.round(100 * (nofDays - daysFromToday) / nofDays )  + "%";
  },

  _size: function(row) {
    var size = 5;
    if (row.supplier === 'B') {
      size += Math.ceil(15 * row.volume / 300);
    } else {
      size += Math.ceil(15 * row.duration / (MAX_TIME_MINUTES * 60 * 1000));
    }
    return Math.min(20, size) + "px";
  },

  update: function(doneCB) {
    console.log("updating scatter. Looking back " + scatter.nofDaysHistory + " days.");
    storage.getRowsOlderThan(util.getToday(-scatter.nofDaysHistory), function(rows) {
      var date;
      scatter.items.length = 0;
      console.log("update scatter plows through " + rows.length + " start times");
      for(var i=0; i<rows.length; i++) {
        date = new Date(parseInt(rows[i].startTime));
        var item = {};
        item['size'] = scatter._size(rows[i]);
        item['height'] = scatter._heightOfDay(date);
        item['day'] = scatter._dayPos(date, scatter.nofDaysHistory);
        scatter.items.push(item);
      }
      doneCB();
    });
  },
}


var histogram = {
  hours: new Array(24),
  drawn: false,
  nofDaysHistory: 14,
  peakHour: 0,
  peakTimes: 0,
  chart: null,
  combinedTimeThreshold: 5*60*1000,
  chartOptions: { responsive: true, 
                  animation: false,
                  scaleSteps: 4,
                  scaleGridLineWidth : 1,
                  barValueSpacing: 2,
                  scaleFontSize: 10,
                  scaleLabel : "<%if(value%1==0) {%><%=Math.round(value)%><%} else {%><%=''%><%}%>",
                  showTooltips: false },
  chartData: {
              labels: [],
              datasets: [
                {
                  fillColor: "rgba(220,220,220,1)",
                  scaleBeginAtZero: true,
                  strokeColor: "rgba(220,220,220,1)",
                  barDatasetSpacing : 3,
                  data: []
                }
              ]
            },

  draw: function(callback) {
    histogram._fillHours(function() {
      histogram._makeGraph();
      histogram.drawn = true;
      callback && callback();
    });
  },

  update: function(doneCB) {
    histogram._fillHours(function () {
      histogram.chartData.datasets[0].data = histogram.hours;
      histogram.chart.Bar(histogram.chartData, histogram.chartOptions);
      doneCB();
    })
  },

  _fillHours: function(doneCB) {
    storage.getRowsOlderThan(util.getToday(-this.nofDaysHistory), function(rows) {
      var date, hour, prevDate, prevDuration;
      console.log("_fillHours plows through " + rows.length + " start times");
      histogram.hours = Array.apply(null, new Array(24)).map(Number.prototype.valueOf,0);
      for(var i=0; i<rows.length; i++) {
        date = new Date(parseInt(rows[i].startTime));
        if (!prevDate || date.getTime() - prevDate.getTime() - prevDuration > histogram.combinedTimeThreshold) {
          hour = date.getHours();
          histogram.hours[hour] = (histogram.hours[hour] || 0) + 1
        } 
        prevDate = date;
        prevDuration = parseInt(rows[i].duration);
      }
      histogram._setPeaks();
      doneCB();
    });
  },

  _setPeaks: function() {
    var max = 0;
    var maxIndex = 0;
    for (var i = 0; i < histogram.hours.length; i++) {
      var val = histogram.hours[i];
      if (val > max) {
        max = val;
        maxIndex = i;
      }
    };
    histogram.peakTimes = max;
    histogram.peakHour = maxIndex;
  },

  _makeGraph: function() {
    var ctx = document.getElementById("myHistogram").getContext("2d");
    histogram.chartData.datasets[0].data = histogram.hours;
    for(var i=0; i<24; i++) {
      if(i%2==0) {
        histogram.chartData.labels.push(i);
      } else {
        histogram.chartData.labels.push('');
      }
    }
    histogram.chart = new Chart(ctx);
    histogram.chart.Bar(histogram.chartData, histogram.chartOptions);
  }
};


var percentage = {
  nofDaysHistory: 14,
  suppliers: {'L': new Array(this.nofDaysHistory),
              'R': new Array(this.nofDaysHistory),
              'B': new Array(this.nofDaysHistory)},
  drawn: false,
  chart: null,
  chartData: {
      labels: [],
      datasets: [
        {
        label: "Left",
        fillColor: "rgba(252,193,8,0.2)",
        strokeColor: "rgba(252,193,8,1)",
        data: []//percentage.suppliers['L']
        },
        {
        label: "Right",
        fillColor: "rgba(6,224,198,0.2)",
        strokeColor: "rgba(6,224,198,1)",
        data: []//percentage.suppliers['R']
        },
        {
        label: "Bottle",
        fillColor: "rgba(255,255,255,0.2)",
        strokeColor: "rgba(255,255,255,1)",
        data: []//percentage.suppliers['B']
        }
      ]},
  chartOptions: { responsive: true,
                  scaleSteps: 4, 
                  scaleGridLineWidth : 1,
                  barValueSpacing: 2,
                  scaleFontSize: 8,
                  showTooltips: false,
                  animation: false,
                  scaleLabel : "<%if(value%2==0) {%><%=Math.round(value)%><%} else {%><%=''%><%}%>",
                  pointDot : false },

  draw: function(callback) {
    this._fillData( function() {
      percentage._makeGraph();
      percentage.drawn = true;
      callback && callback();
    });
  },

  update: function(doneCB) {
    percentage._fillData(function () {
      percentage.chartData.datasets[0].data = percentage.suppliers['L'];
      percentage.chartData.datasets[1].data = percentage.suppliers['R'];
      percentage.chartData.datasets[2].data = percentage.suppliers['B'];
      percentage.chart.Line(percentage.chartData, percentage.chartOptions);
      doneCB();
    })
  },

  _fillData: function(doneCB) {
    storage.getRowsOlderThan(util.getToday(-this.nofDaysHistory), function(rows) {
      var supplier;
      console.log("_fillData plows through " + rows.length + " start times");
      percentage.suppliers = {'L': Array.apply(null, new Array(percentage.nofDaysHistory+1)).map(Number.prototype.valueOf,0),
                              'R': Array.apply(null, new Array(percentage.nofDaysHistory+1)).map(Number.prototype.valueOf,0),
                              'B': Array.apply(null, new Array(percentage.nofDaysHistory+1)).map(Number.prototype.valueOf,0)};
      percentage.chartData.labels = new Array();
      var partitionMod = percentage.nofDaysHistory / 4;
      for(var i=0; i<percentage.nofDaysHistory; i++) {
        if(i%partitionMod == 0) {
          var date = new Date(parseInt(util.getToday(-percentage.nofDaysHistory + i)));
          percentage.chartData.labels.push(date.format("dd MMM"));
        } else {
          percentage.chartData.labels.push('');
        }
      }
      percentage.chartData.labels.push('Today');
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
    percentage.chart = new Chart(ctx);
    percentage.chartData.datasets[0].data = percentage.suppliers['L'];
    percentage.chartData.datasets[1].data = percentage.suppliers['R'];
    percentage.chartData.datasets[2].data = percentage.suppliers['B'];
    percentage.chart.Line(percentage.chartData, percentage.chartOptions);
  }

}


var quantity = {
  nofDaysHistory: 14,
  suppliers: {'L': new Array(this.nofDaysHistory),
              'R': new Array(this.nofDaysHistory),
              'B': new Array(this.nofDaysHistory)},
  drawn: false,
  chart: null,
  chartData: {
      labels: [],
      datasets: [
        {
        label: "Left",
        fillColor: "rgba(252,193,8,0.2)",
        strokeColor: "rgba(252,193,8,1)",
        data: []
        },
        {
        label: "Right",
        fillColor: "rgba(6,224,198,0.2)",
        strokeColor: "rgba(6,224,198,1)",
        data: []
        },
        {
        label: "Bottle",
        fillColor: "rgba(255,255,255,0.2)",
        strokeColor: "rgba(255,255,255,1)",
        data: []
        }
      ]},
  chartOptions: { responsive: true,
                  scaleSteps: 4, 
                  scaleGridLineWidth : 1,
                  barValueSpacing: 2,
                  scaleFontSize: 8,
                  showTooltips: false,
                  animation: false,
                  scaleLabel : "<%if(value%2==0) {%><%=Math.round(value)%><%} else {%><%=''%><%}%>",
                  pointDot : false },

  draw: function(callback) {
    this._fillData( function() {
      quantity._makeGraph();
      quantity.drawn = true;
      callback && callback();
    });
  },

  update: function(doneCB) {
    quantity._fillData(function () {
      quantity.chartData.datasets[0].data = quantity.suppliers['L'];
      quantity.chartData.datasets[1].data = quantity.suppliers['R'];
      quantity.chartData.datasets[2].data = quantity.suppliers['B'];
      quantity.chart.Line(quantity.chartData, quantity.chartOptions);
      doneCB();
    })
  },

  _fillData: function(doneCB) {
    storage.getRowsOlderThan(util.getToday(-this.nofDaysHistory), function(rows) {
      var supplier;
      console.log("_fillData plows through " + rows.length + " start times");
      quantity.suppliers = {'L': Array.apply(null, new Array(quantity.nofDaysHistory+1)).map(Number.prototype.valueOf,0),
                            'R': Array.apply(null, new Array(quantity.nofDaysHistory+1)).map(Number.prototype.valueOf,0),
                            'B': Array.apply(null, new Array(quantity.nofDaysHistory+1)).map(Number.prototype.valueOf,0)};
      quantity.chartData.labels = new Array();
      var partitionMod = quantity.nofDaysHistory / 4;
      for(var i=0; i<quantity.nofDaysHistory; i++) {
        if(i%partitionMod == 0) {
          var date = new Date(parseInt(util.getToday(-quantity.nofDaysHistory + i)));
          quantity.chartData.labels.push(date.format("dd MMM"));
        } else {
          quantity.chartData.labels.push('');
        }
      }
      quantity.chartData.labels.push('Today');
      var day = 0;
      for(var i=0; i<rows.length; i++) {
        day = quantity.nofDaysHistory - util.getDaysFromToday(parseInt(rows[i].startTime));
        supplier = rows[i].supplier;
        quantity.suppliers[supplier][day] = (quantity.suppliers[supplier][day] || 0) + parseInt(rows[i].duration) / 60 / 1000 + parseInt(rows[i].volume);
      }
      doneCB();
    });
  },

  _makeGraph: function() {
    var ctx = document.getElementById("myQuantity").getContext("2d");
    quantity.chart = new Chart(ctx);
    quantity.chartData.datasets[0].data = quantity.suppliers['L'];
    quantity.chartData.datasets[1].data = quantity.suppliers['R'];
    quantity.chartData.datasets[2].data = quantity.suppliers['B'];
    quantity.chart.Line(quantity.chartData, quantity.chartOptions);
  }

}