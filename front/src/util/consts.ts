export const DIMENSIONS = 1000;

export const MAX_ZOOM = 5
export const MIN_ZOOM = 1
export const SCROLL_SENSITIVITY = .0005;
export const CIRCLE = Math.PI * 2;
export const GAS_FOR_ASSIGNMENT = 700;
export const GAS_PRICE = 1e-8;
export const TX_PRICE = GAS_FOR_ASSIGNMENT * GAS_PRICE;
export const CHAIN_ID = '10';
export const NETWORK_ID = 'mainnet01';
export const WALLET_ERR = `
  <strong class="strong-text"><span class="emoji">⚠️</span> No wallet detected!</strong><br>
  Please make sure your wallet is opened and active
`;
export const NOT_SIGNED = `
  <strong class="strong-text"><span class="emoji">ℹ️</span> Transaction not signed</strong><br>
`;
export const GAS_ERROR = `Insufficient funds. Please make sure you have enough KDA to cover the gas fee on chain ${CHAIN_ID}`;
export const TTL = 600;
export const ENDPOINT = `https://api.chainweb.com/chainweb/0.0/${NETWORK_ID}/chain/${CHAIN_ID}/pact`;

export const KEY_PAIR = {
  publicKey: '1abe9a593910b30345363643aaed47fa8908aedcb6a99096b10bbfca6614480b',
  secretKey: 'e0c7e25b7922a847b9c95d6e199fbcbc979be2dc9e13cfead9d81c4a65b13f81'
};

export const MODULE_NAME = 'free.kart';
export const SECTION_SIZE = 100;
export const AMOUNT_OF_FETCHES = DIMENSIONS * DIMENSIONS / SECTION_SIZE;