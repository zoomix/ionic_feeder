app = {
  postedFeedings: [],
  postFeeding: function(feeding) {
    this.postedFeedings.push(feeding);
  }
}

storage.dumpDB = function(succesCB) {
  this.db.transaction(function(tx) {
    tx.executeSql("delete from " + storage.tableName, [], succesCB, this.errorCB);
  }, this.errorCB);
}

storage.setupFeedings = function(feeding1, feeding2, feeding3, done) {
  storage.initialize(function() {
    storage.dumpDB(function() {
      storage.store(feeding1, false, function() {
        storage.store(feeding2, false, function() {
          storage.store(feeding3, false, done);
        });
      });
    });
  });
}

describe("charts test", function () {

  var feeding_L, feeding_R, feeding_B, feedings;
  before(function(done) {
    feeding_L = {"id":"feeding_L","startTime":new Date().getTime() - 10000000, "supplier":"L","duration":8645,"volume":0,"ongoing":false,"updatedAt":null};
    feeding_R = {"id":"feeding_R","startTime":new Date().getTime() -  1000000, "supplier":"R","duration":0,"volume":0,"ongoing":false,"updatedAt":null};
    feeding_B = {"id":"feeding_B","startTime":new Date().getTime() -   100000, "supplier":"B","duration":0,"volume":1230,"ongoing":false,"updatedAt":null};
    feedings = [feeding_L, feeding_R, feeding_B];
    storage.setupFeedings(feeding_L, feeding_R, feeding_B, done);
  });


  describe("scatter", function() {
    it('updatedata reads all items', function(done) {
      scatter.update(function() {
        try { expect(scatter.getItems().length).to.be.eql(feedings.length); } catch (err) { done(err) }
        done();
      })
    });
  });

  describe("histogram", function() {
    it('drawing reads all items', function(done) {
      histogram.draw(function() {
        try { 
          var arraySum = histogram.chartData.datasets[0].data.sum();
          expect(arraySum).to.be.eql(feedings.length);
        } catch (err) { done(err) }
        done();
      });
    });

    it('drawing reads all items, combining very close ones', function(done) {
      feeding_L.startTime = new Date().getTime() - 1000000;
      feeding_R.startTime = new Date().getTime() -  999000;
      storage.setupFeedings(feeding_L, feeding_R, feeding_B, function() {
        histogram.draw(function() {
          try { 
            var arraySum = histogram.chartData.datasets[0].data.sum();
            expect(arraySum).to.be.eql(2);
          } catch (err) { done(err) }
          done();
        });
      });
    });


    it('drawing reads all items, combining very close ones. Noting the duration of feedings as well.', function(done) {
      feeding_L.startTime = new Date().getTime() - 10000000;
      feeding_R.startTime = feeding_L.startTime + 6 * 60 * 1000;
      feeding_L.duration  = 60 * 1000 + 10;

      storage.setupFeedings(feeding_L, feeding_R, feeding_B, function() {
        histogram.draw(function() {
          try { 
            var arraySum = histogram.chartData.datasets[0].data.sum();
            expect(arraySum).to.be.eql(2);
          } catch (err) { done(err) }
          done();
        });
      });
    });


  });

  describe("percentage", function() {
    it('drawing reads all items', function(done) {
      percentage.draw(function() {
        try { 
          var leftDataset   = percentage.chartData.datasets[0];
          var rightDataset  = percentage.chartData.datasets[1];
          var bottleDataset = percentage.chartData.datasets[2];

          expect(leftDataset.data.sum()).to.be.eql(1);
          expect(rightDataset.data.sum()).to.be.eql(1);
          expect(bottleDataset.data.sum()).to.be.eql(1);
        } catch (err) { done(err) }
        done();
      });
    });
  });
});
