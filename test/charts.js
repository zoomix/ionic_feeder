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

describe("charts test", function () {

  var feeding_L, feeding_R, feeding_B, feedings;
  before(function(done) {
    feeding_L = {"id":"feeding_L","startTime":new Date().getTime() - 1000000, "supplier":"L","duration":8645,"volume":0,"ongoing":false,"updatedAt":null};
    feeding_R = {"id":"feeding_R","startTime":new Date().getTime() -  999000, "supplier":"R","duration":0,"volume":0,"ongoing":false,"updatedAt":null};
    feeding_B = {"id":"feeding_B","startTime":new Date().getTime() -   10000, "supplier":"B","duration":0,"volume":1230,"ongoing":false,"updatedAt":null};
    feedings = [feeding_L, feeding_R, feeding_B];
    storage.initialize(function() {
      storage.dumpDB(function() {
        storage.store(feeding_L, false, function() {
          storage.store(feeding_R, false, function() {
            storage.store(feeding_B, false, done);
          });
        });
      });
    });
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
          expect(arraySum).to.be.eql(3);
        } catch (err) { done(err) }
        done();
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
