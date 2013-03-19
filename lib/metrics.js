// Thin wrapper around node.js statsd client:
// https://github.com/sivy/node-statsd.

// In cases where the statsd client isn't being used, provide a null
// statsd client that is safe to use instead.
var NullStatsDClient = function(){},
    NP = NullStatsDClient.prototype;

// Funnel most methods through a shell implementation that
// uses a null type vs. a string, since we ignore types altogether.
NP.timing = NP.increment = NP.decrement =
NP.gauge = NP.unique = NP.set = function( stat, value, sampleRate, callback ) {
  this.sendAll(stat, value, null, sampleRate, callback);
};
NP.sendAll = NP.send = function( stat, value, type, sampleRate, callback ) {
  // We don't actually send anything, so just trigger the callback, if any.
  if( callback ) {
    // callback( error, sentBytes )
    callback( null, 0 );
  }
};

module.exports.create = function( options ) {
  var StatsDFn,
      statsd,
      disabled = !options,
      knownMethods = "timing increment decrement gauge set unique".split( " " ),
      env = process.env.NODE_ENV || 'development',
      whitelist;

  options = options || {};

  // If no metrics setup is given, use a null StatsD client.
  if( disabled ) {
    StatsDFn = NullStatsDClient;
  } else {
    // If a prefix is given, use it. Otherwise use `<env>.butter.'
    options.prefix = options.prefix || env + ".butter.";
    StatsDFn = require( 'node-statsd' ).StatsD;
  }

  // Make sure that all of the following are true before we process
  // a stat:
  //   - whitelist is provided, and
  //   - stat name is in whitelist, and
  //   - method name is one of those known to statsd, and
  //   - method name is given in whitelist for this stat.
  whitelist = options.whitelist;
  function isWhitelisted( name, method ) {
    if ( !whitelist || !( name in whitelist ) ) {
      return false;
    }

    var approvedMethods = whitelist[ name ];
    if ( knownMethods.indexOf( method ) === -1 ||
         approvedMethods.indexOf( method ) === -1 ) {
      return false;
    }

    return true;
  }

  statsd = new StatsDFn( options.host, options.port, options.prefix,
                         options.suffix, options.globalize );
  statsd.isWhitelisted = isWhitelisted;
  statsd.disabled = disabled;
  return statsd;
};
