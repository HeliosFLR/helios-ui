export const LB_ROUTER_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'amountIn', type: 'uint256' },
      { internalType: 'uint256', name: 'amountOutMin', type: 'uint256' },
      {
        components: [
          { internalType: 'uint256[]', name: 'pairBinSteps', type: 'uint256[]' },
          { internalType: 'enum ILBRouter.Version[]', name: 'versions', type: 'uint8[]' },
          { internalType: 'contract IERC20[]', name: 'tokenPath', type: 'address[]' },
        ],
        internalType: 'struct ILBRouter.Path',
        name: 'path',
        type: 'tuple',
      },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ internalType: 'uint256', name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountOut', type: 'uint256' },
      { internalType: 'uint256', name: 'amountInMax', type: 'uint256' },
      {
        components: [
          { internalType: 'uint256[]', name: 'pairBinSteps', type: 'uint256[]' },
          { internalType: 'enum ILBRouter.Version[]', name: 'versions', type: 'uint8[]' },
          { internalType: 'contract IERC20[]', name: 'tokenPath', type: 'address[]' },
        ],
        internalType: 'struct ILBRouter.Path',
        name: 'path',
        type: 'tuple',
      },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'swapTokensForExactTokens',
    outputs: [{ internalType: 'uint256[]', name: 'amountsIn', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'contract IERC20', name: 'tokenX', type: 'address' },
          { internalType: 'contract IERC20', name: 'tokenY', type: 'address' },
          { internalType: 'uint256', name: 'binStep', type: 'uint256' },
          { internalType: 'uint256', name: 'amountX', type: 'uint256' },
          { internalType: 'uint256', name: 'amountY', type: 'uint256' },
          { internalType: 'uint256', name: 'amountXMin', type: 'uint256' },
          { internalType: 'uint256', name: 'amountYMin', type: 'uint256' },
          { internalType: 'uint256', name: 'activeIdDesired', type: 'uint256' },
          { internalType: 'uint256', name: 'idSlippage', type: 'uint256' },
          { internalType: 'int256[]', name: 'deltaIds', type: 'int256[]' },
          { internalType: 'uint256[]', name: 'distributionX', type: 'uint256[]' },
          { internalType: 'uint256[]', name: 'distributionY', type: 'uint256[]' },
          { internalType: 'address', name: 'to', type: 'address' },
          { internalType: 'address', name: 'refundTo', type: 'address' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        ],
        internalType: 'struct ILBRouter.LiquidityParameters',
        name: 'liquidityParameters',
        type: 'tuple',
      },
    ],
    name: 'addLiquidity',
    outputs: [
      { internalType: 'uint256', name: 'amountXAdded', type: 'uint256' },
      { internalType: 'uint256', name: 'amountYAdded', type: 'uint256' },
      { internalType: 'uint256', name: 'amountXLeft', type: 'uint256' },
      { internalType: 'uint256', name: 'amountYLeft', type: 'uint256' },
      { internalType: 'uint256[]', name: 'depositIds', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'liquidityMinted', type: 'uint256[]' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'contract IERC20', name: 'tokenX', type: 'address' },
      { internalType: 'contract IERC20', name: 'tokenY', type: 'address' },
      { internalType: 'uint16', name: 'binStep', type: 'uint16' },
      { internalType: 'uint256', name: 'amountXMin', type: 'uint256' },
      { internalType: 'uint256', name: 'amountYMin', type: 'uint256' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'amounts', type: 'uint256[]' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
    ],
    name: 'removeLiquidity',
    outputs: [
      { internalType: 'uint256', name: 'amountX', type: 'uint256' },
      { internalType: 'uint256', name: 'amountY', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export const LB_QUOTER_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: 'uint256[]', name: 'pairBinSteps', type: 'uint256[]' },
          { internalType: 'enum ILBRouter.Version[]', name: 'versions', type: 'uint8[]' },
          { internalType: 'contract IERC20[]', name: 'tokenPath', type: 'address[]' },
        ],
        internalType: 'struct ILBRouter.Path',
        name: 'route',
        type: 'tuple',
      },
      { internalType: 'uint128', name: 'amountIn', type: 'uint128' },
    ],
    name: 'findBestPathFromAmountIn',
    outputs: [
      {
        components: [
          { internalType: 'uint256[]', name: 'pairBinSteps', type: 'uint256[]' },
          { internalType: 'enum ILBRouter.Version[]', name: 'versions', type: 'uint8[]' },
          { internalType: 'contract IERC20[]', name: 'tokenPath', type: 'address[]' },
          { internalType: 'uint128[]', name: 'amounts', type: 'uint128[]' },
          { internalType: 'uint128[]', name: 'virtualAmountsWithoutSlippage', type: 'uint128[]' },
          { internalType: 'uint128[]', name: 'fees', type: 'uint128[]' },
        ],
        internalType: 'struct ILBQuoter.Quote',
        name: 'quote',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const LB_PAIR_ABI = [
  {
    inputs: [],
    name: 'getActiveId',
    outputs: [{ internalType: 'uint24', name: 'activeId', type: 'uint24' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTokenX',
    outputs: [{ internalType: 'contract IERC20', name: 'tokenX', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTokenY',
    outputs: [{ internalType: 'contract IERC20', name: 'tokenY', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getReserves',
    outputs: [
      { internalType: 'uint128', name: 'reserveX', type: 'uint128' },
      { internalType: 'uint128', name: 'reserveY', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint24', name: 'id', type: 'uint24' }],
    name: 'getBin',
    outputs: [
      { internalType: 'uint128', name: 'binReserveX', type: 'uint128' },
      { internalType: 'uint128', name: 'binReserveY', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getStaticFeeParameters',
    outputs: [
      { internalType: 'uint16', name: 'baseFactor', type: 'uint16' },
      { internalType: 'uint16', name: 'filterPeriod', type: 'uint16' },
      { internalType: 'uint16', name: 'decayPeriod', type: 'uint16' },
      { internalType: 'uint16', name: 'reductionFactor', type: 'uint16' },
      { internalType: 'uint24', name: 'variableFeeControl', type: 'uint24' },
      { internalType: 'uint16', name: 'protocolShare', type: 'uint16' },
      { internalType: 'uint24', name: 'maxVolatilityAccumulator', type: 'uint24' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // ERC1155 functions for liquidity tokens
  {
    inputs: [
      { internalType: 'address', name: 'account', type: 'address' },
      { internalType: 'uint256', name: 'id', type: 'uint256' },
    ],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address[]', name: 'accounts', type: 'address[]' },
      { internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
    ],
    name: 'balanceOfBatch',
    outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'approveForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export const LB_FACTORY_ABI = [
  {
    inputs: [
      { internalType: 'contract IERC20', name: 'tokenX', type: 'address' },
      { internalType: 'contract IERC20', name: 'tokenY', type: 'address' },
      { internalType: 'uint256', name: 'binStep', type: 'uint256' },
    ],
    name: 'getLBPairInformation',
    outputs: [
      {
        components: [
          { internalType: 'uint16', name: 'binStep', type: 'uint16' },
          { internalType: 'contract ILBPair', name: 'LBPair', type: 'address' },
          { internalType: 'bool', name: 'createdByOwner', type: 'bool' },
          { internalType: 'bool', name: 'ignoredForRouting', type: 'bool' },
        ],
        internalType: 'struct ILBFactory.LBPairInformation',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getNumberOfLBPairs',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'getLBPairAtIndex',
    outputs: [{ internalType: 'contract ILBPair', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const


// Flare WNat (Wrapped Native) contract ABI - supports delegation
export const WNAT_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_to', type: 'address' },
      { internalType: 'uint256', name: '_bips', type: 'uint256' },
    ],
    name: 'delegate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address[]', name: '_delegatees', type: 'address[]' },
      { internalType: 'uint256[]', name: '_bips', type: 'uint256[]' },
    ],
    name: 'batchDelegate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'undelegateAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
    name: 'delegatesOf',
    outputs: [
      { internalType: 'address[]', name: '_delegateAddresses', type: 'address[]' },
      { internalType: 'uint256[]', name: '_bips', type: 'uint256[]' },
      { internalType: 'uint256', name: '_count', type: 'uint256' },
      { internalType: 'uint256', name: '_delegationMode', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
    name: 'votePowerOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_from', type: 'address' },
      { internalType: 'address', name: '_to', type: 'address' },
    ],
    name: 'votePowerFromTo',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// Flare Contract Registry - same address on all Flare networks
export const FLARE_CONTRACT_REGISTRY_ABI = [
  {
    inputs: [{ internalType: 'string', name: '_name', type: 'string' }],
    name: 'getContractAddressByName',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getAllContracts',
    outputs: [
      { internalType: 'string[]', name: '', type: 'string[]' },
      { internalType: 'address[]', name: '', type: 'address[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

// FTSO Reward Manager ABI for claiming rewards
export const FTSO_REWARD_MANAGER_ABI = [
  {
    inputs: [{ internalType: 'address', name: '_rewardOwner', type: 'address' }],
    name: 'getStateOfRewards',
    outputs: [
      { internalType: 'address[]', name: '_dataProviders', type: 'address[]' },
      { internalType: 'uint256[]', name: '_rewardAmounts', type: 'uint256[]' },
      { internalType: 'bool[]', name: '_claimed', type: 'bool[]' },
      { internalType: 'bool', name: '_claimable', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_rewardOwner', type: 'address' },
      { internalType: 'address payable', name: '_recipient', type: 'address' },
      { internalType: 'uint256[]', name: '_rewardEpochs', type: 'uint256[]' },
    ],
    name: 'claimReward',
    outputs: [{ internalType: 'uint256', name: '_rewardAmount', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_rewardOwner', type: 'address' }],
    name: 'getEpochsWithUnclaimedRewards',
    outputs: [{ internalType: 'uint256[]', name: '_epochIds', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentRewardEpoch',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const
