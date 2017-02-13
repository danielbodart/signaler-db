# SignalerDB
A simple replacement for Bandiera using CouchDB and Typescript

Features:
  * Application feature toggles are issolated (single CouchDB per application)
  * Auto Versioned API with zero down time (a design document per version)
  * Much faster performance (lower latency, high throughput)
  * Much simplier
  * Minimal dependencies (A CouchDB instance somewhere)
  
Coming soon:
 * Basic User login (using CouchDB features)
 * Audit history of who made what change and when
 * Support other values for toggles (Not just boolean, but any valid JSON value)
 * Support multivariant toggles (A/B/C)
