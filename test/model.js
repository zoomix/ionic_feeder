var assert = require("assert")

var path = require('path'),
    opendatabase = require('opendatabase')

var database_dir = path.join(path.dirname(__filename), 'test_openDatabase.sqlite')
var open_db = new opendatabase({name: database_dir, version: "1.0", description: "Example database for indurate.js", size: 3*1024*1024})

var fake_localstorage = { db: {}, 
                          getItem:function (item) {return this.db[item]},
                          setItem:function (item, value) { this.db[item] = value}}

window = {openDatabase: function(name, version, desc, size) { return open_db}, localStorage: fake_localstorage};
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