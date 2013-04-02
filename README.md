StatsD One Platform Backend
===========================

Backend for [StatsD][statsd] that pushes metrics to Exosite's
[One Platform][oneplatform].


Installation
------------

StatsD plugins are distributed as [NodeJS modules][nodemods], so you use
[NPM][npm] to install them. So, as the admin user on the system that will
be running StatsD, install statsd-oneplatform-backend with

    npm install statsd-oneplatform-backend

Then add `"statsd-oneplatform-backend"` to your StatsD configuration's
`backends` array. You'll also need to add some required settings to your
StatsD config. They should be pretty self-explanatory, except for
`onepMetrics`, which we'll learn about in the **configuration** section
below.

      onepHTTPS: true       
    , onepHost: "m2.exosite.com"
    , onepCIK: "aaaaaaaabbbbbbbbcccccccccddddddddeeeeeee"
    , onepMetrics: []

When you restart StatsD, it should find and enable the backend.


Configuration
-------------

You added some configuration variables to your StatsD config to get the
backend running. They are:

* `onepHTTPS`
  Encrypt communication with the OnePlatform server.
* `onepHost`
  The hostname of the OnePlatform server.
* `onepCIK`
  The CIK of your device. This can be found by clicking your device's
  name on the Exosite Portals.
* `onepMetrics`
  A list of metrics that should be sent to the server.

What goes in `onepMetrics` depends on the [type of metric][metric types]
you want to store. The name formats match those used in the graphite
backend. You'll have to provision the corresponding data sources on One
Platform.

If you have any trouble, put your StatsD server in debug mode; the
backend produces a lot of debug output.

For a counter, for example, you could have:

    onepMetrics: [ "ilovecounting.count", "ilovecounting.rate" ]

For a timer, you could have:

    onepMetrics: [ "hammertime.count_ps", "hammertime.median", "hammertime.upper_90" ]

And for a gauge, just put the name of the gauge.

[statsd]: https://github.com/etsy/statsd
[oneplatform]: http://exosite.com/products/onep
[nodemods]: http://nodejs.org/api/modules.html
[npm]: https://npmjs.org/
[metric types]: https://github.com/etsy/statsd/blob/master/docs/metric_types.md
