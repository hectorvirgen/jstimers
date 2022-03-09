(function() {
  'use strict';

  $(document).foundation();

  var duration = 5000;
  $(':input[name="duration"]').on('input', function(event) {
    duration = parseInt($(this).val());
  });

  $('.timer a.run').click(function(event) {
    event.preventDefault();
    var $button = $(this);
    var $timer = $button.closest('.timer');
    run($timer);
  });

  $('.trigger-alert').click(function(event) {
    event.preventDefault();
    alert('Alert! Button was clicked!');
  });

  $('.trigger-prompt').click(function(event) {
    event.preventDefault();
    prompt('Why did you trigger this prompt?');
  });

  var run = function($timer) {
    var $button = $timer.find('a.run');
    var id = $timer.prop('id');
    var end = performance.now() + duration;
    var sparkDataPoints = 30;
    var inc = duration / sparkDataPoints;

    $button.attr('disabled', 'disabled');
    $timer.addClass('running');

    var count = 0;
    var times = [];
    var start = performance.now();

    runners[id](end, function() {
      count++;
      times.push(performance.now() - start);
    }, function() {
      const result = `${Number(count).toLocaleString()} (${Number(Math.round(count / duration * 1000)).toLocaleString()}/s)`;
      $timer.find('.result').text(result);
      $button.removeAttr('disabled');
      $timer.removeClass('running');

      var data = (new Array(sparkDataPoints)).fill(0, 0, sparkDataPoints);
      times.forEach((time) => {
        var i = Math.floor(time / inc);
        if (data.hasOwnProperty(i)) data[i]++;
      });

      $timer.find(".sparkline").sparkline(data, {
        type: 'line',
        width: '8em',
        height: '2em',
        chartRangeMin: 0
      });
    });
  };

  $('a.run-selected').click(function(event) {
    $('.timer :checked').each(function() {
      var $timer = $(this).closest('.timer');
      run($timer);
    });
  });

  var runners = {
    'set-timeout': function(end, increment, done) {
      var next = function() {
        var now = performance.now();
        if (now >= end) return done();
        window.setTimeout(function() {
          increment();
          next();
        }, parseInt($('[name="set-timeout-delay"]').val()));
      };
      next();
    },

    'set-interval': function(end, increment, done) {
      var interval = window.setInterval(function() {
        increment();
        var now = performance.now();
        if (now >= end) {
          window.clearInterval(interval);
          return done();
        }
      }, parseInt($('[name="set-interval-delay"]').val()));
    },

    'request-animation-frame': function(end, increment, done) {
      var next = function() {
        var now = performance.now();
        if (now >= end) return done();
        window.requestAnimationFrame(function() {
          increment();
          next();
        });
      };
      next();
    },

    'post-message': function(end, increment, done) {
      var receiveMessage = function(event) {
        increment();
        next();
      }

      var next = function() {
        var now = performance.now();
        if (now >= end) {
          window.removeEventListener("message", receiveMessage, false);
          return done();
        }
        window.postMessage('anything', '*');
      };

      window.addEventListener("message", receiveMessage, false);

      next();
    },

    'web-worker': function(end, increment, done) {
      var worker = new Worker('/js/web-worker.js');

      worker.onmessage = function(e) {
        var now = performance.now();
        if (now >= end) {
          worker.terminate();
          return done();
        }

        if (1 === e.data) {
          increment();
        } else {
          worker.terminate();
          return done();
        }
      }

      worker.postMessage(duration);
    },

    'while-loop': function(end, increment, done) {
      while (true) {
        increment();
        var now = performance.now();
        if (now >= end) {
          done();
          break;
        }
      };
    },

    'promise': function(end, increment, done) {
      var next = function() {
        Promise.resolve(true)
        .then(function() {
          increment();
          var now = performance.now();
          if (now >= end) return done();
          next();
        });
      };

      next();
    },

    'async': function(end, increment, done) {
      var iterate = function() {
        increment();
        return Promise.resolve(true);
      };

      var next = async function() {
        await iterate();
        var now = performance.now();
        if (now >= end) return done();
        next();
      };

      next();
    }
  };

  // create web audio api context
  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // create Oscillator node
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(220, audioCtx.currentTime); // value in hertz
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();
  gainNode.gain.setValueAtTime(0, audioCtx.currentTime);

  $('#enable-audio').change(function(event) {
    const amplitude = $(this).is(':checked') ? 0.1 : 0;
    if (amplitude) {
      audioCtx.resume().then(() => {
        gainNode.gain.setValueAtTime(amplitude, audioCtx.currentTime);
      });
    } else {
      gainNode.gain.setValueAtTime(amplitude, audioCtx.currentTime);
    }
  });

  var clockEnabled = true;
  var $clock = $('.clock');
  var $hours = $clock.find('.hours');
  var $minutes = $clock.find('.minutes');
  var $seconds = $clock.find('.seconds');
  var $milliseconds = $clock.find('.milliseconds');
  var $ampm = $clock.find('.ampm');
  var tickClock = function() {
    window.requestAnimationFrame(function() {
      var now = new Date();

      $hours.text(lpad((now.getHours() % 12).toString(), '0', 2));
      $minutes.text(`:${lpad(now.getMinutes().toString(), '0', 2)}`);
      $seconds.text(`:${lpad(now.getSeconds().toString(), '0', 2)}`);
      $milliseconds.text(`.${rpad(now.getMilliseconds().toString(), '0', 3)}`);
      $ampm.text(now.getHours() < 12 ? 'am' : 'pm');

      colorize($hours, '#ccc', now.getHours() % 12, 0, 12);
      colorize($minutes, '#ccc', now.getMinutes(), 0, 60);
      colorize($seconds, '#ccc', now.getSeconds(), 0, 60);
      colorize($milliseconds, '#ccc', now.getMilliseconds(), 0, 1000);
      colorize($ampm, '#ccc', now.getHours() < 12 ? 0 : 1, 0, 1);

      if (clockEnabled) tickClock();
    });
  };

  tickClock();

  $(':input[name="clock-enabled"]').change(function(event) {
    clockEnabled = $(this).is(':checked');
    if (clockEnabled) tickClock();
  });

  function lpad(string, char, minLength) {
    if (string.length < minLength) {
      return new Array(minLength - string.length + 1).join(char[0]) + string;
    }

    return string;
  }

  function rpad(string, char, minLength) {
    if (string.length < minLength) {
      return string + new Array(minLength - string.length + 1).join(char[0]);
    }

    return string;
  }

  function colorize($elem, color, value, min, max) {
    let px = (value - min) / (max - min) * 30;
    $elem.css({
      boxShadow: `inset 0 -${px}px 0 ${color}`
    });
  }
})();
