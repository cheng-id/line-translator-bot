const express = require('express');
const axios = require('axios');
const { middleware, Client } = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const app = express();
const client = new Client(config);

app.use(middleware(config));
app.use(express.json());

app.post('/webhook', async (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const text = event.message.text;
  const targetLang = /[\u4e00-\u9fff]/.test(text) ? 'id' : 'zh-TW';

  try {
    const response = await axios.post('https://translation.googleapis.com/language/translate/v2', null, {
      params: {
        q: text,
        target: targetLang,
        key: process.env.GOOGLE_API_KEY
      }
    });

    const translated = response.data.data.translations[0].translatedText;
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: translated
    });
  } catch (error) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: '翻譯失敗，請稍後再試。'
    });
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
