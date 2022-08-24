const protocolDefinition = {
  "objects": {
    "conditional-offer": {
      "schema": "https://tbdex.org/protocol/conditional-offer"
    },
    "close": {
      "schema": "https://tbdex.org/protocol/close"
    },
    "ask": {
      "schema": "https://tbdex.org/protocol/ask"
    }
  },
  "structure": {
    "ask": {
      "contextRequired": true, // initiates use of a contextId to segregate activities
      "protectedContext": true, // triggers permission enforcement for anyone besides the sender/recipient of the initial message
      "allow": {
        "anyone": {
          "to": [
            "create"
          ]
        }
      },
      "records": {
        "conditional-offer": {
          "allow": {
            "recipient": {
              "of": "$.ask", // only available in contexts, eval'd from the top of the contextaul graph root
              "to": [
                "create"
              ]
            }
          }
        },
        "close": {
          "allow": {
            "participants": {
              "to": [
                "create"
              ]
            }
          }
        }
      }
    }
  }
};

module.exports = protocolDefinition;