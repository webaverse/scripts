const https = require('https');
const fetch = require('node-fetch');

const nftStorageApiKey = ``; // fill this in

(async () => {
  const tokens = [];
  const step = 100;
  for (let i = 1;; i += step) {
    const res = await fetch(`https://tokens.webaverse.com/${i}-${i + step}`);
    const j = await res.json();
    if (j.length > 0) {
      tokens.push.apply(tokens, j);
      console.log('fetching tokens [' + tokens.length + ']');
    } else {
      break;
    }
  }
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const {id, hash} = token;
    process.stdout.write('uploading token ' + i + ' (' + hash + ')...');
    await new Promise((accept, reject) => {
      const req = https.get(`https://ipfs.exokit.org/ipfs/${hash}`, res => {
        process.stdout.write('uploading ' + res.headers['content-length'] + 'b...');
        // const contentLength = parseInt(res.headers['content-length'], 10);
        const proxyReq = https.request({
          method: 'POST',
          host: `api.nft.storage`,
          path: `/upload`,
          headers: {
            'Authorization': `Bearer ${nftStorageApiKey}`,
          },
        }, proxyRes => {
          process.stdout.write('got response...');
          const bs = [];
          proxyRes.on('data', d => {
            bs.push(d);
          });
          proxyRes.on('end', () => {
            const b = Buffer.concat(bs);
            bs.length = 0;
            const s = b.toString('utf8');
            const j = JSON.parse(s);
            if (j.ok) {
              console.log('ok', j);
            } else {
              console.warn('retry', j);
              i--;
            }
            accept();
          });
          proxyRes.resume();
        });
        proxyReq.on('error', err => {
          reject(new Error('failed to upload token (' + proxyReq.status + ')' + JSON.stringify(token, null, 2)));
        });
        res.pipe(proxyReq);
        /* res.on('data', d => {
          console.log('got d', d.byteLength);
          proxyReq.write(d);
        });
        res.on('end', () => {
          console.log('got end');
          proxyReq.end();
        }); */
      });
      req.on('error', err => {
        reject(new Error('failed to fetch token (' + proxyReq.status + ')' + JSON.stringify(token, null, 2)));
      });
      req.end();
    });
  }
})();
