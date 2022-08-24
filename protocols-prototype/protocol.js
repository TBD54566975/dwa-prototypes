// message method -> protocol `allow.to` action map
const ACTION_MAP = {
  'CollectionsWrite': 'create'
}

class Protocol {
  constructor(protocolDefinition) {
    // assumed that protocolDefinition is valid
    this.protocolDefinition = protocolDefinition;

    // str -> str map of label -> schema
    this.schemaMap = {};

    // build schemaMap
    for (let label in protocolDefinition.objects) {
      const { schema } = protocolDefinition.objects[label];

      this.schemaMap[schema] = label;
    }
  }

  /**
   * returns object label
   * @param {String} schema 
   */
  getLabel(schema) {
    return this.schemaMap[schema];
  }

  getRuleset(labelPath = []) {
    let { structure } = this.protocolDefinition;
    let ruleset;

    // just here for debugging for now
    let traversed = [];

    for (let label of labelPath) {
      traversed.push(label);
      ruleset = structure[label];

      if (!ruleset) {
        throw new Error(`ruleset for ${traversed.join('.')} not found in protocol`);
      }

      structure = ruleset.records;
    }

    return ruleset;
  }

  getActionForMethod(method) {
    return ACTION_MAP[method];
  }
}

module.exports = Protocol;