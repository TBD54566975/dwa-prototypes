const Protocol = require('./protocol');
const protocolDefinition = require('./protocol-definition');

// in-memory db of protocols
const protocolDefs = {
  'tbdex': protocolDefinition
}

// in-memory message store. key/value: objectId -> message
const messageStore = {};

/**
 * 
 * @param {Object} message
 * @param {Number} message.contextId
 * @param {String} message.method
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

    let { parentId } = message;
    const labelPath = [schemaLabel];

    // TODO: build JSONPath adherent graph as parents are traversed so that `allow` rules can be
    // evaluated
    while (parentId) {
      //! IO
      const parent = messageStore[message.objectId];
      if (!parent) {
        throw new Error('parent not found');
      }

      if (message.protocol !== parent.protocol) {
        throw new Error('parent protocol must match');
      }

      const parentLabel = protocol.getLabel(parent.schema);
      labelPath.push(parentLabel);
    }

    // TODO: need to capture properties set at the root of the structure
    // e.g. `contextedRequired` and `protectedRuleset` are only defined at
    // the root
    const messageRuleset = protocol.getRuleset(labelPath);

    // naively default contextRequired to true if undefined in ruleset
    const { contextRequired = true } = messageRuleset;

    if (contextRequired && !message.contextId) {
      throw new Error('message must contain contextId');
    }

    // evaluate `allow`
    // TODO: figure out whether `allow` MUST always be present. assuming it is for now
    const { allow } = messageRuleset;
    let isAllowed = false;
    let allowConditions;

    if (allow.anyone) {
      isAllowed = true;
      allowConditions = allow.anyone;
    }

    if (!isAllowed) {
      throw new Error("not allowed.")
    }

    // TODO: add eval for `allow.participants`
    // TODO: add eval for `allow.recipients`

    const action = protocol.getActionForMethod(message.method);

    if (!allowConditions.to.includes(action)) {
      throw new Error(`${message.method} not allowed`);
    }

    // TODO: add eval for `allowConditions.of`

    messageStore[message.objectId] = message;
  }
}

const ask = {
  contextId: 1,
  method: 'CollectionsWrite',
  objectId: 1,
  protocol: 'tbdex',
  schema: 'https://tbdex.org/protocol/ask',
  target: 'bob'
};

processMessage(ask);
console.log(JSON.stringify(messageStore, null, 2));

const conditionalOffer = {
  contextId: 1,
  objectId: 1,
  parentId: 1,
  protocol: 'tbdex',
  schema: 'https://tbdex.org/protocol/conditional-offer',
  target: 'alice'
};