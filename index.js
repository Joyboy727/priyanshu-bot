const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

// 1. Web Server (Keep-Alive for Render)
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Priyanshu System (Native Gemini) Online 🟢'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// 2. Setup Google Gemini (Native)
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
// 3. Setup Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("🚀 System Starting (Native Engine)...");

// Handle Text
bot.on('text', async (ctx) => {
  const userMsg = ctx.message.text;
  console.log(`User: ${userMsg}`);

  try {
    ctx.sendChatAction('typing');
    
    // Generate Content using Native Google API
    const result = await model.generateContent(userMsg);
    const response = await result.response;
    const text = response.text();

    await ctx.reply(text);
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
    
    // Fetch the image data
    const response = await fetch(fileLink.href);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare image for Gemini
    const imagePart = {
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: "image/jpeg",
      },
    };

    const prompt = ctx.message.caption || "Describe this image in detail.";
    const result = await model.generateContent([prompt, imagePart]);
    const aiResponse = await result.response;
    
    await ctx.reply(aiResponse.text());
  } catch (err) {
    console.error("Vision Error:", err);
    await ctx.reply("⚠️ Vision Error: " + err.message);
  }
});

// 4. Launch with Anti-Conflict Mode
bot.launch({ dropPendingUpdates: true }).then(() => {
  console.log("✅ Priyanshu System Connected!");
}).catch((err) => {
  console.error("❌ Connection Failed:", err);
});

// Safety Stops
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
