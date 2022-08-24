const Protocol = require('./protocol');
const protocolDefinition = require('./protocol-definition');

// in-memory db of protocols
const protocolDefs = {
  'tbdex': protocolDefinition
}

const ask = {
  contextId: 1,
  objectId: 1,
  protocol: 'tbdex',
  schema: 'https://tbdex.org/protocol/ask',
  target: 'bob'
};

const conditionalOffer = {
  contextId: 1,
  objectId: 1,
  parentId: 1,
  protocol: 'tbdex',
  schema: 'https://tbdex.org/protocol/conditional-offer',
  target: 'alice'
};

/**
 * 
 * @param {Object} message
 * @param {Number} message.contextId
 * @param {Number} message.objectId
 * @param {Number} message.parentId
 * @param {String} message.protocol
 * @param {String} message.schema
 * @param {String} message.target
 */
function processMessage(message) {
  if (message.protocol) {
    // TODO: figure out where protocol definitions are stored. how are they "installed"?
    // hardcoding for now.

    // TODO: need to add `id`, `name` or some identifying property for protocol

    const protocolDef = protocolDefs[message.protocol];

    if (!protocolDef) {
      throw new Error(`protocol ${message.protocol} not found.`);
    }

    const protocol = new Protocol(protocolDef);
    const schemaLabel = protocol.getLabel(message.schema);

    if (!schemaLabel) {
      throw new Error(`${message.schema} schema not allowed in ${message.protocol} protocol`);
    }



  }
}