const express = require('express');
const app = express();
const port = 3000;

// Ana sayfaya girildiğinde çalışacak kod
app.get('/', (req, res) => {
  res.send('Merhaba Dünya! İlk Node.js web uygulamamız çalışıyor.');
});

// Sunucuyu 3000 portunda dinlemeye başla
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde ayağa kalktı.`);
});