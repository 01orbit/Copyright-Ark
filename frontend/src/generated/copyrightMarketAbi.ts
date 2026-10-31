export const copyrightMarketAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "gasSubsidy_",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "reviewReward_",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AlreadySettled",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CaseNotPending",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DuplicateActiveWork",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "DuplicateCaseRef",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EmptyField",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FieldTooLong",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InsufficientRewardPool",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAcceptUntil",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidCaseRef",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidCategory",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidDuration",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidOutcome",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidPage",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidReferenceUrl",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LicenseNotActive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "LicenseNotSettleable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotPayableAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotRegistrant",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OfferNotOpen",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OfferNotRefundable",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PendingCaseExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyGuardReentrantCall",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "RewardAlreadyCredited",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SelfPurchase",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TermsMismatch",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WorkInvalidatedError",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroBalance",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroHash",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZeroRecipient",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum CopyrightMarket.CreditSource",
        "name": "source",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sourceId",
        "type": "uint256"
      }
    ],
    "name": "BalanceCredited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "caseId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "externalRef",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "evidenceHash",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "openedBy",
        "type": "address"
      }
    ],
    "name": "CaseOpened",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "caseId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum CopyrightMarket.CaseOutcome",
        "name": "outcome",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "decisionHash",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "resolvedBy",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "rewardAmount",
        "type": "uint256"
      }
    ],
    "name": "CaseResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "caseId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "executor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "CaseRewardCredited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "licenseId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "revokedAt",
        "type": "uint64"
      }
    ],
    "name": "LicenseRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "licenseId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "enum CopyrightMarket.SettlementReason",
        "name": "reason",
        "type": "uint8"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "buyerCredit",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sellerCredit",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "effectiveEndAt",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "settledAt",
        "type": "uint64"
      }
    ],
    "name": "LicenseSettled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "offerId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "licenseId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "startsAt",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "endsAt",
        "type": "uint64"
      }
    ],
    "name": "OfferAccepted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "offerId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "enum CopyrightMarket.OfferCloseReason",
        "name": "closeReason",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "returnedDeposit",
        "type": "uint256"
      }
    ],
    "name": "OfferClosed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "offerId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "compensation",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "acceptUntil",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "termsHash",
        "type": "bytes32"
      }
    ],
    "name": "OfferCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferStarted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "funder",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newBalance",
        "type": "uint256"
      }
    ],
    "name": "RewardPoolFunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "Withdrawal",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "caseId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "executor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "invalidatedAt",
        "type": "uint64"
      }
    ],
    "name": "WorkInvalidated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "fileHash",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "registrant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "previousWorkId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint64",
        "name": "registeredAt",
        "type": "uint64"
      }
    ],
    "name": "WorkRegistered",
    "type": "event"
  },
  {
    "stateMutability": "payable",
    "type": "fallback"
  },
  {
    "inputs": [],
    "name": "MAX_ACCEPT_WINDOW",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_DURATION",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MAX_PRICE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_ACCEPT_WINDOW",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_DURATION",
    "outputs": [
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "MIN_PRICE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TERMS_VERSION",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offerId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "expectedTermsHash",
        "type": "bytes32"
      }
    ],
    "name": "acceptOffer",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "acceptOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "activeWorkByHash",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offerId",
        "type": "uint256"
      }
    ],
    "name": "cancelOffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "claimable",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "internalType": "uint256",
        "name": "compensation",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "acceptUntil",
        "type": "uint64"
      },
      {
        "internalType": "string",
        "name": "scope",
        "type": "string"
      }
    ],
    "name": "createOffer",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "caseId",
        "type": "uint256"
      }
    ],
    "name": "creditCaseReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fundRewardPool",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "gasSubsidy",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAccounting",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "contractBalance",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "locked",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalUserCredits",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rewardPool",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pendingRewards",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "surplus",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getCase",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "workId",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "externalRef",
            "type": "string"
          },
          {
            "internalType": "bytes32",
            "name": "evidenceHash",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "openedBy",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "openedAt",
            "type": "uint64"
          },
          {
            "internalType": "enum CopyrightMarket.CaseStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "enum CopyrightMarket.CaseOutcome",
            "name": "outcome",
            "type": "uint8"
          },
          {
            "internalType": "bytes32",
            "name": "decisionHash",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "decisionSummary",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "resolvedBy",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "resolvedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "rewardAmount",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "rewardCredited",
            "type": "bool"
          }
        ],
        "internalType": "struct CopyrightMarket.CaseRecord",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "o",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l",
        "type": "uint256"
      }
    ],
    "name": "getCaseIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "w",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "o",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l",
        "type": "uint256"
      }
    ],
    "name": "getCaseIdsByWork",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getLicense",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "offerId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "workId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "seller",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "licensee",
            "type": "address"
          },
          {
            "internalType": "uint64",
            "name": "startsAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "endsAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "authorRevokedAt",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "settled",
            "type": "bool"
          },
          {
            "internalType": "enum CopyrightMarket.SettlementReason",
            "name": "settlementReason",
            "type": "uint8"
          },
          {
            "internalType": "uint64",
            "name": "settledAt",
            "type": "uint64"
          }
        ],
        "internalType": "struct CopyrightMarket.License",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "o",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l",
        "type": "uint256"
      }
    ],
    "name": "getLicenseIdsByLicensee",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "w",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "o",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l",
        "type": "uint256"
      }
    ],
    "name": "getLicenseIdsByUserAndWork",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "w",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "o",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l",
        "type": "uint256"
      }
    ],
    "name": "getLicenseIdsByWork",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getLicenseStatus",
    "outputs": [
      {
        "internalType": "enum CopyrightMarket.LicenseStatus",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getOffer",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "workId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "seller",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "compensation",
            "type": "uint256"
          },
          {
            "internalType": "uint64",
            "name": "duration",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "acceptUntil",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "createdAt",
            "type": "uint64"
          },
          {
            "internalType": "string",
            "name": "scope",
            "type": "string"
          },
          {
            "internalType": "bytes32",
            "name": "termsHash",
            "type": "bytes32"
          },
          {
            "internalType": "enum CopyrightMarket.OfferStoredState",
            "name": "state",
            "type": "uint8"
          },
          {
            "internalType": "enum CopyrightMarket.OfferCloseReason",
            "name": "closeReason",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "licenseId",
            "type": "uint256"
          }
        ],
        "internalType": "struct CopyrightMarket.Offer",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "o",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l",
        "type": "uint256"
      }
    ],
    "name": "getOfferIdsBySeller",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "w",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "o",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l",
        "type": "uint256"
      }
    ],
    "name": "getOfferIdsByWork",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getOfferStatus",
    "outputs": [
      {
        "internalType": "enum CopyrightMarket.OfferStatus",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getWork",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "fileHash",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "registrant",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "title",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "description",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "category",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "referenceUrl",
            "type": "string"
          },
          {
            "internalType": "uint64",
            "name": "registeredAt",
            "type": "uint64"
          },
          {
            "internalType": "uint64",
            "name": "invalidatedAt",
            "type": "uint64"
          },
          {
            "internalType": "uint256",
            "name": "invalidatedByCaseId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "previousWorkId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "acceptedCount",
            "type": "uint256"
          }
        ],
        "internalType": "struct CopyrightMarket.Work",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getWorkIds",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "h",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "o",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l",
        "type": "uint256"
      }
    ],
    "name": "getWorkIdsByHash",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "a",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "o",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "l",
        "type": "uint256"
      }
    ],
    "name": "getWorkIdsByRegistrant",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "getWorkStatus",
    "outputs": [
      {
        "internalType": "enum CopyrightMarket.WorkStatus",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "at",
        "type": "uint64"
      }
    ],
    "name": "isLicenseValidAt",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "latestWorkByHash",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextCaseId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextLicenseId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextOfferId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextWorkId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "externalRef",
        "type": "string"
      },
      {
        "internalType": "bytes32",
        "name": "evidenceHash",
        "type": "bytes32"
      }
    ],
    "name": "openCase",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "openCaseByWork",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingCaseRewards",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "previewAuthorRevoke",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "buyer",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "seller",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "name": "previewSettlement",
    "outputs": [
      {
        "internalType": "bool",
        "name": "canSettle",
        "type": "bool"
      },
      {
        "internalType": "enum CopyrightMarket.SettlementReason",
        "name": "reason",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "buyer",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "seller",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offerId",
        "type": "uint256"
      }
    ],
    "name": "refundUnavailableOffer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "fileHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "description",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "category",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "referenceUrl",
        "type": "string"
      }
    ],
    "name": "registerWork",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "caseId",
        "type": "uint256"
      },
      {
        "internalType": "enum CopyrightMarket.CaseOutcome",
        "name": "outcome",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "decisionHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "decisionSummary",
        "type": "string"
      }
    ],
    "name": "resolveCase",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "reviewReward",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "licenseId",
        "type": "uint256"
      }
    ],
    "name": "revokeLicense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardPoolBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "licenseId",
        "type": "uint256"
      }
    ],
    "name": "settleLicense",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offerId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "workId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "fileHash",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "duration",
        "type": "uint64"
      },
      {
        "internalType": "uint256",
        "name": "compensation",
        "type": "uint256"
      },
      {
        "internalType": "uint64",
        "name": "acceptUntil",
        "type": "uint64"
      },
      {
        "internalType": "string",
        "name": "scope",
        "type": "string"
      }
    ],
    "name": "termsHash",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalClaimable",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalLockedDeposits",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
] as const;
