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
var STOP_SIGN="<i class='ion-stop'></i>";
var VIBRATE_INTERVAL = 5 * 60 * 1000;

var TABLE_NAME_DEMO = "FEEDINGS_DEMO";
var TABLE_NAME = "FEEDINGS";

Array.prototype.has = function(item) {
  return this.indexOf(item) >= 0;
}

var util = {
  randomness: function() {
    return (Math.round(Math.random()*Math.pow(2,60))).toString(36)
  },

  isBreastFeeding: function(supplier) {
    return supplier === 'L' || supplier === 'R';
  }
}

var storage = {
  db: null,
  tableName: "",

  initialize: function(initializedCB) {
    try {
      this.db = window.openDatabase("Database", "1.0", "PhoneGap Demo", 200000);
      this.db.transaction(this.populateDB, this.errorCB);
      this.tableName = this.isDemoMode() ? TABLE_NAME_DEMO : TABLE_NAME;
      initializedCB && initializedCB();
    } catch (e) {
      console.log("No database. Running in browser? " + e);
    }
  },

  populateDB: function(tx) {
    tx.executeSql('CREATE TABLE IF NOT EXISTS ' + TABLE_NAME      + ' (id unique, startTime, supplier, duration, volume, ongoing, deleted, updatedAt)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS ' + TABLE_NAME_DEMO + ' (id unique, startTime, supplier, duration, volume, ongoing, deleted, updatedAt)');
  },

  // Transaction error callback
  //
  errorCB: function(err) {
    console.log(err);
    console.log(err.message);
  },

  rowFromDbItem: function(item) {
    return {
            id: item.id, 
            startTime: parseInt(item.startTime), 
            supplier: item.supplier, 
            duration: parseInt(item.duration), 
            volume: item.volume, 
            ongoing: item.ongoing === 'true',
            updatedAt: (item.updatedAt) ? parseInt(item.updatedAt) : null,
          }
  },

  getDataForDay: function(day, resultCB) {
    var fromTime = app.getToday(day);
    var toTime = app.getToday(day + 1);
    if (day === -7) {
      fromTime = 0;
    }
    console.log("getDataForDay from " + fromTime + " to " + toTime);
    this.db.transaction(function(tx) {
      tx.executeSql('SELECT * FROM ' + storage.tableName + ' where deleted <> "true" and startTime > ? and startTime < ? order by startTime desc', [fromTime, toTime], function(tx, results) {
        var rows = []
        var len = results.rows.length;
        for (var i = 0; i < len; i++) {
          var item = results.rows.item(i)
          var row = storage.rowFromDbItem(item);
          rows.push(row);
        }
        resultCB(rows);
      }, this.errorCB);
    }, this.errorCB);
  },

  allData: function(resultCB) {
    this.db.transaction(function(tx) {
      tx.executeSql('SELECT * FROM ' + storage.tableName, [], function(tx, results) {
        var rows = []
        var len = results.rows.length;
        for (var i = 0; i < len; i++) {
          var item = results.rows.item(i);
          var row = storage.rowFromDbItem(item);
          rows.unshift(row);
        }
        resultCB(rows);
      }, this.errorCB);
    }, this.errorCB);
  },

  getIdsOlderThan: function(startTime, resultCB) {
    this.db.transaction(function(tx) {
      tx.executeSql('SELECT id FROM ' + storage.tableName + ' where deleted <> "true" and startTime >= ?', ["" + startTime], function(tx, results) {
        var ids = [];
        var len = results.rows.length;
        for (var i = 0; i < len; i++) {
          var row = results.rows.item(i);
          ids.push(row.id);
        }
        resultCB(ids);
      }, this.errorCB);
    }, this.errorCB);
  },

  getMostRecentFinishedFeeding: function(resultCB) {
    this.db.transaction(function(tx) {
      tx.executeSql('SELECT * FROM ' + storage.tableName + ' where deleted <> "true" and ongoing <> "true" order by startTime desc limit 1', [], function(tx, results) {
        if (results.rows && results.rows.length > 0) {
          var item = results.rows.item(0);
          var row = storage.rowFromDbItem(item);
          resultCB(row);
        } else {
          resultCB();
        }
      }, this.errorCB);
    }, this.errorCB);
  },

  storeAndSync: function(row) {
    console.log("storeAndSync: " + (row && row.id));
    storage.store(row, true);
  },

  store: function(row, alsoSync) {
    console.log("store: " + (row && row.id));
    if(!this.db) {
      console.log("Could not store. Db not initialized");
      return;
    }
    this.db.transaction(function(tx) {
      if(!row.id && row.id != 0) {
        row.id = Math.round(Math.random()*1000000);
      }
      var preparedUpdatedAt = (row.updatedAt) ? ('"' + row.updatedAt + '"') : null;
      tx.executeSql('INSERT or REPLACE INTO ' + storage.tableName + ' (id,             startTime,               supplier,               duration,               volume,               ongoing,               deleted,                          updatedAt) VALUES ' + 
                                                '(' + row.id + ', "' + row.startTime + '", "' + row.supplier + '", "' + row.duration + '", "' + row.volume + '", "' + row.ongoing + '", "' + (row.deleted == true) + '", ' + preparedUpdatedAt + ')');
      if(alsoSync) {
        app.postFeeding(row);
      }      
    }, this.errorCB);
  },

  userId: null, 
  getUserId: function() {
    if(storage.userId) {
      return storage.userId;
    }
    var userId = window.localStorage.getItem("userId");
    console.log("stored used id: " + userId);
    if (userId) {
      storage.userId = userId;
      return userId;
    }
    if (typeof USER !== 'undefined' && USER) {
      storage.storeUserId(USER);
    } else {
      storage.storeUserId(util.randomness() + util.randomness());
    }
    console.log("new store used id: " + window.localStorage.getItem("userId"));
    return window.localStorage.getItem("userId");
  },

  storeUserId: function(userId) {
    console.log("setting: userId " + userId);
    window.localStorage.setItem("userId", userId);
    storage.userId = userId;
  },

  predictSupplier: function(feedings, supplierCallback, index) {
    console.log("Predicting supplier. Feedings: " + (feedings && feedings.length) + ", index: " + index);
    var currentIndex = index || 0; 
    if(feedings && feedings.length > currentIndex) {
      var feeding = feedings[currentIndex];
      if(!feeding.ongoing && util.isBreastFeeding(feeding.supplier)) {
        supplierCallback( feeding.supplier === 'L' ? 'R' : 'L' );
        return;
      } else {
        this.predictSupplier(feedings, supplierCallback, currentIndex+ 1);
      }
    } else {
      var oldestTime = new Date().getTime() - 24 * 3600 * 1000;
      this.db.transaction(function(tx) {
        tx.executeSql('SELECT supplier, startTime FROM ' + storage.tableName +  
                        'where deleted <> "true" ' + 
                          'and ongoing <> "true" ' + 
                          'and (supplier == "L" OR supplier == "R")' + 
                          'and startTime > ?' + 
                        'order by startTime desc limit 1', ["" + oldestTime], function(tx, results) {
          if (results.rows && results.rows.length > 0) {
            console.log("Predicting supplier. Found " + results.rows.item(0).supplier + " @" + results.rows.item(0).startTime);
            supplierCallback( results.rows.item(0).supplier === 'L' ? 'R' : 'L' );
          }
        });
      });
    }
  },

  isDemoMode: function() {
    var demoModeString = window.localStorage.getItem("demoMode");
    return demoModeString === 'demo';
  },

  toggleDemoMode: function() {
    window.localStorage.setItem("demoMode", this.isDemoMode() ? 'notdemo' : 'demo');
  }
}

var app = {
  getTimeAgo: function(timeInMs) {
    var hours = Math.floor(timeInMs / 1000 / 60 / 60);
    var minutes = Math.floor((timeInMs / 1000 / 60) % 60);
    return hours + "h " + minutes + "m";
  },


  getNewFeedings: function(latestFeedingStartTime, newItemsCB) {
    if(latestFeedingStartTime) {
      var fromTime = latestFeedingStartTime - 4 * 3600 * 1000; //Allways refetch a bit
      app.downloadNewFeedings(fromTime, newItemsCB);
    } else {
      storage.getMostRecentFinishedFeeding(function(row) {
        var startTime = (row)? row.startTime : 0;
        app.downloadNewFeedings(startTime, newItemsCB);
      });
    }
  },

  downloadNewFeedings: function(fromTime, newItemsCB) {
    var request = new XMLHttpRequest();
    request.open("GET", BASE_URL + storage.getUserId() + "/" + fromTime, true);
    request.onreadystatechange = function() {
      if (request.readyState == 4) {
        console.log("Synced. Got: '" + request.responseText + "'");
        if (request.responseText && request.responseText.length > 0) {
          var items = JSON.parse(request.responseText);
          newItemsCB(items);
        }
      }
    }
    request.send();
  },

  postFeeding: function(feeding, successCB) {
    if(storage.isDemoMode()) {
      console.log("postFeeding. skipping. Demo mode");
      successCB && successCB();
      return;
    }
    console.log("postFeeding: " + (feeding && feeding.id));
    var data = JSON.stringify(feeding)
    var request = new XMLHttpRequest();
    request.open("POST", BASE_URL + storage.getUserId(), true);
    request.onreadystatechange = function() {
      if(request.readyState == 4) {
        console.log("postFeeding: " + request.responseText);
        if(successCB) {
          successCB();
        }
      }
    }
    request.setRequestHeader( "Content-Type", "text/plain");
    console.log("Posting: " + data);
    request.send(data);
  },

  postAllFeedings: function(allRows, atIndex) {
    if(storage.isDemoMode()) {
      console.log("postAllFeedings. skipping. Demo mode");
      return;
    }
    console.log("postAllFeedings");
    if(!allRows) {
      storage.allData(function(rows) {
        app.postAllFeedings(rows, rows.length - 1);
      });
    } else {

      if(atIndex < 0) {
        console.log("Posted all feedings");
      } else {
        app.postFeeding(allRows[atIndex], function() {
          console.log("postAllFeedings " + atIndex + ".")
          app.postAllFeedings(allRows, atIndex - 1);
        });
      }
    }
  },

  showToast: function(message) {
    if(window.plugins && window.plugins.toast) {
      window.plugins.toast.showShortBottom(message);
    } else {
      console.log("Toasting: " + message);
    }
  },

  getToday: function(offset) {
    var now = new Date();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    now.setMilliseconds(0);

    console.log("Date for " + offset + " was " + new Date((now.getTime() + offset * 1000 * 60 * 60 * 24)));
    return "" + (now.getTime() + offset * 1000 * 60 * 60 * 24);
  }

}

var vibrations = {
  interval: 0,
  ticked: 0,

  doVibrate: function(elapsed) {
    if(!vibrations.interval) { return; }

    var tick = Math.floor(elapsed / vibrations.interval);
    if (tick > vibrations.ticked) {
      vibrations.ticked = tick;
      vibrations.vibrate(tick, true);
    }
  },

  vibrate: function(tick, first) {
    console.log("bzzzt: " + tick);
    if (first) {
      try {navigator.notification.vibrate(500); } catch (e) {}
      setTimeout(function() {vibrations.vibrate(tick, false)}, 600);
    } else {
      try {navigator.notification.vibrate(200); } catch (e) {}
      if(tick > 1) {
        setTimeout(function() {vibrations.vibrate(tick - 1, false)}, 300);
      }
    }
  },

  setVibrateInterval: function(interval) {
    console.log("setting vibrate interval: " + interval);
    vibrations.interval = interval;
    window.localStorage.setItem("vibrate", interval);
  },

  getVibrateInteral: function() {
    var storedInterval = window.localStorage.getItem("vibrate");
    console.log("getting stored vibrate interval: " + storedInterval);
    vibrations.interval = storedInterval && parseInt(storedInterval) || 0;
    return vibrations.interval; 
  },

  reset: function() {
    vibrations.ticked = 0;
  }, 

  catchup: function(elapsed) {
    var tick = Math.floor(elapsed / vibrations.interval);
    console.log("Catching up vibrations with elapsed " + elapsed + ", that makes " + tick + " ticks");
    vibrations.ticked = tick;
  }
}

function handleOpenURL(url) {
  setTimeout(function() {
    alert("received url: " + url);
  }, 0);
}

document.addEventListener('deviceready', storage.initialize(), false);
