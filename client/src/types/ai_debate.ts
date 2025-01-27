/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/ai_debate.json`.
 */
export type AiDebate = {
  "address": "Fze3wnbnZSTPbGSHXTt4J7gvzTJNjH4J2Uq6HRiHbTBo",
  "metadata": {
    "name": "aiDebate",
    "version": "0.1.0",
    "spec": "0.1.0"
  },
  "instructions": [
    {
      "name": "finalizeDebate",
      "discriminator": [
        20,
        42,
        61,
        106,
        1,
        230,
        70,
        148
      ],
      "accounts": [
        {
          "name": "debate",
          "writable": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "winningAgent",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initializeDebate",
      "discriminator": [
        16,
        124,
        103,
        25,
        199,
        125,
        61,
        34
      ],
      "accounts": [
        {
          "name": "debate",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "agentA",
          "type": "pubkey"
        },
        {
          "name": "agentB",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "placeBet",
      "discriminator": [
        222,
        62,
        67,
        220,
        63,
        166,
        126,
        33
      ],
      "accounts": [
        {
          "name": "debate",
          "writable": true
        },
        {
          "name": "userBet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "debate"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "onAgentA",
          "type": "bool"
        }
      ]
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "debate",
          "writable": true
        },
        {
          "name": "userBet",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  117,
                  115,
                  101,
                  114,
                  95,
                  98,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "debate"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "onAgentA",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "debate",
      "discriminator": [
        79,
        63,
        142,
        164,
        37,
        59,
        137,
        30
      ]
    },
    {
      "name": "userBet",
      "discriminator": [
        180,
        131,
        8,
        241,
        60,
        243,
        46,
        63
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "debateAlreadyFinalized",
      "msg": "Debate has already been finalized"
    },
    {
      "code": 6001,
      "name": "invalidWinningAgent",
      "msg": "The winning agent is invalid"
    },
    {
      "code": 6002,
      "name": "insufficientBalance",
      "msg": "Insufficient balance for withdrawal"
    },
    {
      "code": 6003,
      "name": "noWinningsToWithdraw",
      "msg": "No winnings to withdraw"
    }
  ],
  "types": [
    {
      "name": "debate",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "agentA",
            "type": "pubkey"
          },
          {
            "name": "agentB",
            "type": "pubkey"
          },
          {
            "name": "totalAgentA",
            "type": "u64"
          },
          {
            "name": "totalAgentB",
            "type": "u64"
          },
          {
            "name": "finalized",
            "type": "bool"
          },
          {
            "name": "winningAgent",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "authority",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "userBet",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amountOnA",
            "type": "u64"
          },
          {
            "name": "amountOnB",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
