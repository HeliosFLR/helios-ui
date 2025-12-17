# Helios DEX Development Memory

## Last Session: December 17, 2025

### What Was Fixed

#### Limit Orders - Main Issues Resolved:
1. **"Invalid limit price... 0.000000" error** - Was showing when price data wasn't loaded
2. **Price format mismatch** - Display showed tokenOut/tokenIn but pool uses tokenY/tokenX
3. **Wrong bin calculation** - Orders were being placed in wrong direction

#### Key Changes in `LimitOrderCard.tsx`:
- Added `displayPrice` - converts pool price to user-friendly format
- Fixed bin calculation with proper price inversion when `!isTokenInX`
- Changed default tokens to USDC/USDT (the working pair)
- Uses `SWAP_TOKENS` instead of `TOKENS` to only show pairs with working pools
- All price displays now use `displayPrice` for consistency

#### Limit Orders Management in `UserPositions.tsx`:
- Added "Active Limit Orders" section (single-bin positions)
- Shows Buy/Sell badge, trigger price, % from current, amounts
- Cancel button to remove orders
- Separated from LP positions (multi-bin)

### Working Features
- Swap (WC2FLR/USDT0, WC2FLR/FXRP, FXRP/USDT0 pairs)
- Add Liquidity with price range display
- View positions with dollar values
- Rebalance positions
- Limit orders (single-bin liquidity) with positions link
- XP system
- Token Faucet integration

### Known Limitations
- No TWAP implementation (not in contract ABI)
- Coston2 testnet tokens available from Flare faucet: https://faucet.flare.network/coston2

### Important Code Patterns

**Bin ID Calculation:**
```javascript
// Pool price = (1 + binStep/10000)^(binId - 8388608)
const binStepFactor = 1 + binStep / 10000
const binsToMove = Math.log(priceRatio) / Math.log(binStepFactor)
const targetBinId = pool.activeId + Math.round(binsToMove)
```

**Price from Bin:**
```javascript
calculatePriceFromBinId(binId, binStep, decimalsX, decimalsY)
// Returns tokenY per tokenX
```

**Price Inversion for Display:**
```javascript
const displayPrice = isTokenInX ? currentPrice : 1 / currentPrice
const poolLimitPrice = isTokenInX ? userPrice : 1 / userPrice
```

### Pools Configuration (Coston2 Testnet)
- WC2FLR/USDT0: `0x081D1B7FB116081E33fB8CE4bC1b67e1beC8fC5b` (binStep: 10) - WORKING
- WC2FLR/FXRP: `0x973b97F283dc6aC10b3b8ba3289dc55494f86540` (binStep: 10) - WORKING
- FXRP/USDT0: `0x63865F25f55aC6D2A35eB1Ad16E9Cbd14Ed335A9` (binStep: 10) - WORKING

### Deployed Contracts (Coston2)
- LB_FACTORY: `0xdbfD526E99E458EA640b524cbC671650Be29aFD1`
- LB_ROUTER: `0x39883bb80737ADeC305dE54e5BF16466862e6992`
- LB_QUOTER: `0xBB40204e7DEEdF6209D5DD8B4dFf7A9ba12c88aB`

### Token Addresses (Coston2)
- WC2FLR: `0xC67DCE33D7A8efA5FfEB961899C73fe01bCe9273`
- USDT0: `0xC1A5B41512496B80903D1f32d6dEa3a73212E71F`
- FXRP: `0x0b6A3645c240605887a5532109323A3E12273dc7`

### Deployment
- Live: https://app.heliosdex.io
- Deploy command: `npx vercel --prod`

### Next Steps / TODO
- Test limit orders with USDC/USDT to verify fix works
- Consider adding more token pairs when mainnet pools available
- User reported limit orders "still not going through" - needs testing after fix
