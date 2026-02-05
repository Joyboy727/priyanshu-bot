const { Telegraf } = require('telegraf');
const OpenAI = require('openai');
const express = require('express');

// 1. Web Server (Keep-Alive for Render)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Priyanshu System (Gemini Engine) Online 🟢'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 2. Setup Google Gemini (Using OpenAI Protocol)
// This connects to Google's servers instead of NVIDIA's
const client = new OpenAI({
  apiKey: process.env.API_KEY, 
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

// 3. Setup Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("🚀 System Starting (Engine: Gemini Flash)...");

// Handle Text
bot.on('text', async (ctx) => {
  const userMsg = ctx.message.text;
  console.log(`User: ${userMsg}`);

  try {
    ctx.sendChatAction('typing');
    
    // Switch to Gemini 2.0 Flash (The Fastest Model)
    const completion = await client.chat.completions.create({
      model: "gemini-2.0-flash", 
      messages: [{ role: "user", content: userMsg }],
      max_tokens: 4096
    });

    if (completion.choices && completion.choices[0]) {
      await ctx.reply(completion.choices[0].message.content);
    }
  } catch (err) {
    console.error("AI Error:", err);
    await ctx.reply("⚠️ System Error: " + err.message);
  }
});

// Handle Photos (Vision)
bot.on('photo', async (ctx) => {
  console.log("Processing photo...");
  ctx.sendChatAction('typing');
  
  try {
    const photo = ctx.message.photo.pop();
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    const question = ctx.message.caption || "Describe this image.";

    const completion = await client.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: question },
            { type: "image_url", image_url: { url: fileLink.href } }
          ]
        }
      ],
      max_tokens: 4096
    });

    await ctx.reply(completion.choices[0].message.content);
  } catch (err) {
    console.error("Vision Error:", err);
    await ctx.reply("⚠️ Vision Error: " + err.message);
  }
});

// 4. Launch
bot.launch().then(() => {
  console.log("✅ Priyanshu System Connected!");
}).catch((err) => {
  console.error("❌ Connection Failed:", err);
});

// Safety Stops
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
