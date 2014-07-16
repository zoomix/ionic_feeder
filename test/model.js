
var fake_localstorage = { db: {}, 
                          getItem:function (item) {return this.db[item]},
                          setItem:function (item, value) { this.db[item] = value}}



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



  describe("storage sync", function () {

    var item = {"id":"7fml19rtvtgc","startTime":1405360344488,"supplier":"L","duration":8645,"volume":0,"ongoing":false,"updatedAt":null};

    before(function(done) {
      storage.initialize(function() {
        storage.store(item, false, function() {
          console.log("storing must be done");
          storage.allData(function(rows) {console.log(rows)});
          done();
        });
      });
    })

    it('calls', function(done) {
      storage.allData(function(rows) {console.log(rows)});
      item.startTime = item.startTime - 100;
      storage.sync([item], function(needReloading, ongoingFeeding) {
        try {
          expect(needReloading).to.be.ok();
        } catch (error) {
          done(error)
        }
        done();
      });
    })
  })
});