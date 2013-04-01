/*
 * Flush stats to Exosite's One Platform (http://exosite.com/products/onep).
 *
 * To enable this backend, include 'statsd-oneplatform-backend' in the
 * backends configuration array:
 *
 *   backends: ['statsd-oneplatform-backend']
 *
 * This backend supports the following config options:
 *
 *   onepHost: Hostname of One Platform server (probably 'm2.exosite.com').
 *   onepHTTPS: Whether to use HTTPS.
 */

var request = require('request');
var logger = require('logger');

var l;              // This will be set to the logger

var flushInterval;
var onepHost;
var onepHTTPS;
var onepCIK;
var onepMetrics;


var metric_rpc_call = function(ts, alias, value) {
    return(
    {"id": 0,
     "procedure": "record",
     "arguments": [
        {"alias": alias},
        [[ts, value]],
        {}
     ]
    });
}

var flush_metrics = function(ts, metrics) {
    l.debug("Called 'flush_metrics'");
    var req_body = {"auth":{"cik":onepCIK},"calls":[]};
    var key;

    // Counters
    for (key in metrics.counters) {
        var generated_metrics = {};
        generated_metrics[key + ".rate"] = metrics.counter_rates[key];
        generated_metrics[key + ".count"] = metrics.counters[key];

        for (gkey in generated_metrics) {
            if (onepMetrics.indexOf(gkey) == -1) {
                l.debug("Skipping counter '" + gkey + "' which was not found in onepMetrics");
                continue;
            }
            l.debug("Appending counter '" + gkey + "' to outgoing request");
            var value = generated_metrics[gkey];
            req_body["calls"].push(metric_rpc_call(ts, gkey, value));
        }
    }

    // Timers
    var numStats;
    for (key in metrics.timer_data) {
        var timer_data_key;
        for (timer_data_key in metrics.timer_data[key]) {
            var gkey = key + "." + timer_data_key;
            if (onepMetrics.indexOf(gkey) == -1) {
                l.debug("Skipping counter '" + gkey + "' which was not found in onepMetrics");
                continue;
            }
            if (typeof(metrics.timer_data[key][timer_data_key]) === 'number') {
                l.debug("Appending timer '" + gkey + "' to outgoing request");
                req_body["calls"].push(metric_rpc_call(ts, gkey, metrics.timer_data[key][timer_data_key]));
            } else {
                // Uh, there was some code here in the Graphite backend (which I copied)
                // but I couldn't figure out what it did. - danslimmon 2013-04-01
                l.error("Timer sub-key functionality not implemented. If you know what this is supposed to do, I encourage you to submit a pull request to https://github.com/danslimmon/statsd-oneplatform-backend");
            }
        }
    }

    // Gauges
    for (key in metrics.gauges) {
        if (onepMetrics.indexOf(key) == -1) {
            l.debug("Skipping gauge '" + key + "' which was not found in onepMetrics");
            continue;
        }
        var value = metrics.gauges[key];
        l.debug("Appending gauge '" + key + "' with value " + value + " to outgoing request")
        req_body["calls"].push(metric_rpc_call(ts, key, value));
    }

    if (req_body["calls"].length == 0) {
        l.debug("No metrics to send");
        return true;
    }

    scheme = onepHTTPS ? "https" : "http";
    host = onepHost;
    url = scheme + "://" + host + "/api:v1/rpc/process";

    l.debug("Sending POST to '" + url + "' with body " + JSON.stringify(req_body))
    request.post({url: url, body: JSON.stringify(req_body), headers: { "Content-Type": "application/json", "User-Agent": "https://github.com/danslimmon/statsd-oneplatform-backend"}}, function(error, response, body) {
        error && l.error(error);
        l.debug("Response body: " + body);
    }
    );
    return true;
}


exports.init = function(startup_time, config, events) {
    l = new logger.createLogger(config.log || "");
    config.debug && l.setLevel('debug');

    onepHost = config.onepHost;
    onepHTTPS = config.onepHTTPS;
    onepCIK = config.onepCIK;
    onepMetrics = config.onepMetrics;

    events.on('flush', flush_metrics);
    return true;
}
