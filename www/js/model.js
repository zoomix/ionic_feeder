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

String.prototype.string = function(l) {
  var s = '',
    i = 0;
  while (i++ < l) {
    s += this;
  }
  return s;
}
String.prototype.zf = function(l) {
  return '0'.string(l - this.length) + this;
}
Number.prototype.zf = function(l) {
  return this.toString().zf(l);
}
Date.prototype.format = function(f) {
  if (!this.valueOf()) return '&nbsp;';

  var d = this;

  return f.replace(/(yyyy|yy|y|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|t)/gi,
    function($1) {
      switch ($1) {
        case 'yyyy':
          return d.getFullYear();
        case 'yy':
          return (d.getFullYear() % 100).zf(2);
        case 'y':
          return (d.getFullYear() % 100);
        case 'MMMM':
          return gsMonthNames[d.getMonth()];
        case 'MMM':
          return gsMonthNames[d.getMonth()].substr(0, 3);
        case 'MM':
          return (d.getMonth() + 1).zf(2);
        case 'M':
          return (d.getMonth() + 1);
        case 'dddd':
          return gsDayNames[d.getDay()];
        case 'ddd':
          return gsDayNames[d.getDay()].substr(0, 3);
        case 'dd':
          return d.getDate().zf(2);
        case 'd':
          return d.getDate();
        case 'HH':
          return d.getHours().zf(2);
        case 'H':
          return d.getHours();
        case 'hh':
          return ((h = d.getHours() % 12) ? h : 12).zf(2);
        case 'h':
          return ((h = d.getHours() % 12) ? h : 12);
        case 'mm':
          return d.getMinutes().zf(2);
        case 'm':
          return d.getMinutes();
        case 'ss':
          return d.getSeconds().zf(2);
        case 's':
          return d.getSeconds();
        case 't':
          return d.getHours() < 12 ? 'A.M.' : 'P.M.';
      }
    }
  );
};
var DATE_FORMAT = "yyyy-MM-dd HH:mm";

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
    //         tx.executeSql('DROP TABLE IF EXISTS DEMO');
    tx.executeSql('CREATE TABLE IF NOT EXISTS DEMO (id unique, startTime, supplier, duration, volume)');
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
      resultCB([ {id: 1, startTime: new Date().getTime(), supplier: 'L', duration: 123000, volume: 0} ]);
      return;
    }
    this.db.transaction(function(tx) {
      tx.executeSql('SELECT * FROM DEMO', [], function(tx, results) {
        var rows = []
        var len = results.rows.length;
        for (var i = 0; i < len; i++) {
          var item = results.rows.item(i)
          var row = {id: item.id, startTime: item.startTime, supplier: item.supplier, duration: item.duration, volume: item.volume}
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
      tx.executeSql('INSERT or REPLACE INTO DEMO (id,             startTime,               supplier,               duration,               volume) VALUES ' + 
                                                '(' + row.id + ', "' + row.startTime + '", "' + row.supplier + '", "' + row.duration + '", "' + row.volume + '")');
    }, this.errorCB, this.successCB);
  }

}

document.addEventListener('deviceready', storage.initialize(), false);
