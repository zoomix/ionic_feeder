function errorHandler(error) {
  console.log("file errorHandler got " + error);
}

function exportCsv(csvContent) {
  var textToWrite = csvContent;
  var lastFileUrl=null;

  window.requestFileSystem(LocalFileSystem.TEMPORARY, 1024*1024, function(fs) {
    fs.root.getFile('baby_feeding_data.csv', {create: true}, function(fileEntry) {
      lastFileUrl = fileEntry.toURL();
      console.log("Last file was written to " + lastFileUrl);
      fileEntry.createWriter(function(fileWriter) {
        fileWriter.onwriteend = function(e) {
          console.log('Write completed.');
        };
        fileWriter.onerror = function(e) {
          console.log('Write failed: ' + e.toString());
        };
        console.log("Wrinting " + textToWrite);
        fileWriter.write(textToWrite);
        window.plugins.socialsharing.share(null, null, lastFileUrl, null);

      }, errorHandler);
    }, errorHandler);

  }, errorHandler);
}
