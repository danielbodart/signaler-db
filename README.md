# SignalerDB
A simple replacement for Bandiera using CouchDB and Typescript

Features:
  * Application feature toggles are issolated (single CouchDB per application)
  * Auto Versioned API with zero down time (a design document per version)
  * Much faster performance (lower latency, high throughput)
  * Much simplier
  * Minimal dependencies (A CouchDB instance somewhere)
  * Audit history of who made what change and when
  * Support other values for toggles (Not just boolean, but any valid JSON value)
  * Support multivariant toggles (A/B/C)

Coming soon:
  * Basic User login (using CouchDB features)
 
## Developing SignalerDB

`git clone git@github.com:springernature/signaler-db.git`

### Envrionment variables

You need the following environment variable:

 * `SIGNALER_DB_ADMIN_URL=http://<DOMAIN>:5984/signaler-db`

To test deployments against a test couchdb instance, edit this value and run `./release.sh`.

### Deploying

To deploy a new version:

```
./release.sh
```

### Running in IDE

Restarting IntelliJ should be enough for you to pick up the typescript compiler options checked into this repo.

If not then set IntelliJ to use the versions of Node and TypeScript that are in the `bin` directory of this repo.

Once this is setup, autocomplete and test running will work within IntelliJ.

### Running on CLI

To compile the TypeScript locally:

 * Run an `bin/npm install` to install development dependencies (for running the tests, etc).
 * Compile the TypeScript locally using the internal TSC dependency `bin/tsc couchapp/app.js`

Run tests:

 * `npm run test`
