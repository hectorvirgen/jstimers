onmessage = function(event) {
  var duration = event.data;
  var start = performance.now();

  while (true) {
    postMessage(1);
    var now = performance.now();
    if (now - start >= duration) {
      break;
    }
  };

  postMessage(0);
}
