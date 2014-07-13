var assert = require("assert")
document = {addEventListener: function() {console.log("Adding evenent listener")}}

var model = require("../www/js/model.js");
var util = model.util;

describe("model test", function () {

  describe("Util methods", function() {
  	it('gives out random numbers', function() {
      assert(util.randomness().length > 10);
    });

    it('verifies breastfeeding for provider L', function() {
      assert(util.isBreastFeeding('L'));
    });
    it('verifies breastfeeding for provider R', function() {
      assert(util.isBreastFeeding('R'));
    });
    it('verifies breastfeeding for provider B', function() {
      assert(!util.isBreastFeeding('B'));
    });
    it('verifies breastfeeding for provider null', function() {
      assert(!util.isBreastFeeding(null));
    });
  });
});