/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var DATE_FORMAT = "yyyy-MM-dd HH:mm";
var MAX_TIME_MINUTES = 30;

var storage = {
  db: null,

  initialize: function(initializedCB) {
    try {
      this.db = window.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);
      this.db.transaction(this.populateDB, this.errorCB, this.successCB);
    } catch (e) {
      console.log("No database. Running in browser? " + e);
    }
  },

  // Populate the database 
  //
  populateDB: function(tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS DEMO (id unique, startTime, supplier, duration, volume, ongoing)');
  },

  // Transaction error callback
  //
  errorCB: function(err) {
    alert("Error processing SQL: " + err);
  },

  // Transaction success callback
  //
  successCB: function() {

  },

  allData: function(resultCB) {
    if(!this.db) {
      // Give some test data back
      resultCB([ {id: 4214, startTime: new Date().getTime() - 123000, supplier: 'L', duration: 123000, volume: 0, ongoing: true},
                 {id: 1421, startTime: new Date().getTime() - 4000000, supplier: 'L', duration: 245000, volume: 0, ongoing: false},
                 ]);
      return;
    }
    this.db.transaction(function(tx) {
      tx.executeSql('SELECT * FROM DEMO', [], function(tx, results) {
        var rows = []
        var len = results.rows.length;
        for (var i = 0; i < len; i++) {
          var item = results.rows.item(i)
          var row = {id: item.id, startTime: item.startTime, supplier: item.supplier, duration: item.duration, volume: item.volume, ongoing: item.ongoing === 'true'}
          rows.unshift(row);
        }
        resultCB(rows);
      }, this.errorCB);
    }, this.errorCB);
  },

  store: function(row) {
    if(!this.db) {
      console.log("Could not store. Db not initialized");
      return;
    }
    this.db.transaction(function(tx) {
      if(!row.id) {
        row.id = Math.round(Math.random()*1000000);
      }
      tx.executeSql('INSERT or REPLACE INTO DEMO (id,             startTime,               supplier,               duration,               volume,               ongoing) VALUES ' + 
                                                '(' + row.id + ', "' + row.startTime + '", "' + row.supplier + '", "' + row.duration + '", "' + row.volume + '", "' + row.ongoing + '")');
    }, this.errorCB, this.successCB);
  }
}

var app = {
  getTimeAgo: function(timeInMs) {
    var hours = Math.floor(timeInMs / 1000 / 60 / 60);
    var minutes = Math.floor((timeInMs / 1000 / 60) % 60);
    return hours + "h " + minutes + "m";
  },


  getSyncedItems: function(newItemsCB) {
    var request = new XMLHttpRequest();
    request.open("GET", "http://echo.jsontest.com/id/15/startTime/1400919546556/supplier/L/duration/42000/volume/0/ongoing/false", true);
    request.onreadystatechange = function() { //Call a function when the state changes.
      if (request.readyState == 4) {
        console.log("Synced");
        var items = [JSON.parse(request.responseText)];
        // newItemsCB(items);
        newItemsCB([]);
      }
    }
    request.send();
  }
}


document.addEventListener('deviceready', storage.initialize(), false);
