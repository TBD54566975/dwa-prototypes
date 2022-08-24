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
}

module.exports = Protocol;