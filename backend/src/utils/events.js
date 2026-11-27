// Node.js EventEmitter used for domain events:
//   grievance:created, grievance:statusChanged, grievance:remarked, grievance:assigned
const { EventEmitter } = require('events');
module.exports = new EventEmitter();
