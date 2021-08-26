const https = require('https');
const fetch = require('node-fetch');

(async () => {
  const tokens = [];
  const step = 100;
  for (let i = 1;; i += step) {
    const res = await fetch(`https://tokens.webaverse.com/${i}-${i + step}`);
    const j = await res.json();
    if (j.length > 0) {
      tokens.push.apply(tokens, j);
      // console.log('fetching tokens [' + tokens.length + ']');
    } else {
      break;
    }
  }
  for (const token of tokens) {
    const {hash} = token;
    console.log(hash);
  }
})();