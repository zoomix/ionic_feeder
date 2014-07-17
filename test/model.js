
storage.dumpDB = function(succesCB) {
  this.db.transaction(function(tx) {
    tx.executeSql("delete from " + storage.tableName, [], succesCB, this.errorCB);
  }, this.errorCB);
}

describe("model test", function () {

  describe("Util methods", function() {
  	it('gives out random numbers', function() {
      expect(util.randomness().length).to.be.above(8);
    });

    it('verifies breastfeeding for provider L', function() {
      expect(util.isBreastFeeding('L')).to.be.ok();
    });
    it('verifies breastfeeding for provider R', function() {
      expect(util.isBreastFeeding('R')).to.be.ok();
    });
    it('verifies breastfeeding for provider B', function() {
      expect(util.isBreastFeeding('B')).to.not.be.ok();
    });
    it('verifies breastfeeding for provider null', function() {
      expect(util.isBreastFeeding(null)).to.not.be.ok();
    });
  });


  describe("storage - get feedings", function() {
    var feeding_finished, feeding_ongoing;

    beforeEach(function(done) {
      feeding_finished = {"id":"apa_finished","startTime":new Date().getTime() - 10000, "supplier":"L","duration":8645,"volume":0,"ongoing":false,"updatedAt":null};
      feeding_ongoing  = {"id":"apa__ongoing","startTime":new Date().getTime() -  1000, "supplier":"R","duration":0,"volume":0,"ongoing":true,"updatedAt":null};
      storage.initialize(function() {
        storage.dumpDB(function() {
          storage.store(feeding_finished, false, function() {
            storage.store(feeding_ongoing, false, done);  
          });
        });
      });
    });

    it('gets todays feedings - omiting ongoing', function(done) {
      storage.getDataForDay(0, function(rows) {
        try {expect(rows).to.have.length(1);} catch (err) {done(err);}
        done();
      });
    });

    it('gets ongoing feeding', function(done) {
      storage.getOngoingFeeding(function(feeding) {
        try {expect(feeding.id).to.be('apa__ongoing');} catch (err) {done(err);}
        done();
      });
    });

    it('gets ongoing feeding only within max feeding time', function(done) {
      feeding_ongoing.startTime = feeding_ongoing.startTime - (1 + MAX_TIME_MINUTES) * 60 * 1000;
      storage.store(feeding_ongoing, false, function() {
        storage.getOngoingFeeding(function(feeding) {
          try {expect(feeding).to.not.be.ok();} catch (err) {done(err);}
          done();
        });
      });
    });

    it('sets too old ongoing feeding times to finished', function(done) {
      feeding_ongoing.startTime = feeding_ongoing.startTime - (1 + MAX_TIME_MINUTES) * 60 * 1000;
      storage.store(feeding_ongoing, false, function() {
        storage.getOngoingFeeding(function(feeding) {
          try {expect(feeding).to.not.be.ok();} catch (err) {done(err);}
          storage.getDataForDay(0, function(rows) {
            try {
              expect(rows).to.have.length(2);
            } catch (err) {done(err);}
            done();
          });
        });
      });
    });

  });

  describe("storage - predictSupplier", function() {
    var feeding_L, feeding_R, feeding_B, feedings;

    before(function(done) {
      feeding_L = {"id":"feeding_L","startTime":new Date().getTime() - 10000, "supplier":"L","duration":8645,"volume":0,"ongoing":false,"updatedAt":null};
      feeding_R = {"id":"feeding_R","startTime":new Date().getTime() -  1000, "supplier":"R","duration":0,"volume":0,"ongoing":false,"updatedAt":null};
      feeding_B = {"id":"feeding_B","startTime":new Date().getTime() -   100, "supplier":"B","duration":0,"volume":1230,"ongoing":false,"updatedAt":null};
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

    it('predicts the supplier from database', function(done) {
      storage.predictSupplier(null, function(predicted) {
        try { expect(predicted).to.eql('L') } catch (err) { done(err) }
        done();
      })
    });

    it('predicts the supplier from database when parameters dont have relevant feedings', function(done) {
      storage.predictSupplier([feeding_B], function(predicted) {
        try { expect(predicted).to.eql('L') } catch (err) { done(err) }
        done();
      })
    });

    it('predicts the supplier with parameters', function(done) {
      feeding_R.startTime = feeding_L.startTime - 1000; //Make L be the most recent feeding
      storage.predictSupplier(feedings, function(predicted) {
        try { expect(predicted).to.eql('R') } catch (err) { done(err) }
        done();
      })
    });
  })

  describe("storage sync - merging items from server", function () {

    var feeding;

    beforeEach(function(done) {
      feeding = {"id":"7fml19rtvtgc","startTime":new Date().getTime() - 10000, "supplier":"L","duration":8645,"volume":0,"ongoing":false,"updatedAt":null};
      storage.initialize(function() {
        storage.dumpDB(function() {
          storage.store(feeding, false, done);
        });
      });
    })

    it('has downloaded the same feeding we already have. No reloading necessary', function(done) {
      storage.sync([feeding], function(needReloading, ongoingFeeding) {
        try {
          expect(needReloading).to.not.be.ok();
        } catch (error) {
          done(error)
        }
        done();
      });
    });

    it('has downloaded an feeding we already have but with an updatedAt timestamp. Reload', function(done) {
      feeding.updatedAt = feeding.startTime + 1000;
      storage.sync([feeding], function(needReloading, ongoingFeeding) {
        try { expect(needReloading).to.be.ok(); } catch (error) { done(error); }
        done();
      });
    });

    it('has downloaded a new feeding. Reload', function(done) {
      feeding.id = "apa";
      storage.sync([feeding], function(needReloading, ongoingFeeding) {
        try { expect(needReloading).to.be.ok(); } catch (error) { done(error); }
        done();
      });
    });

    it('has downloaded a new feeding, but it was deleted. No reload', function(done) {
      feeding.id = "apa";
      feeding.deleted="true";
      storage.sync([feeding], function(needReloading, ongoingFeeding) {
        try { expect(needReloading).not.to.be.ok(); } catch (error) { done(error); }
        done();
      });
    });

    it('has downloaded a new feeding which is ongoing. No reload and mark as ongoing', function(done) {
      feeding.id = "apa";
      feeding.ongoing="true";
      storage.sync([feeding], function(needReloading, ongoingFeeding) {
        try { 
          expect(needReloading).to.not.be.ok();
          expect(ongoingFeeding).to.be.ok(); 
        } catch (error) { done(error); }
        done();
      });
    });
  })
});