
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

  var gsMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
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
Array.prototype.sum = function() {
  return this.reduce(function(previousValue, currentValue) { return previousValue + currentValue; });
}
