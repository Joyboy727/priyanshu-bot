const { Telegraf } = require('telegraf');
const OpenAI = require('openai');
const express = require('express');

// 1. Web Server (The "Keep-Alive" Mechanism)
// Render requires a web port to be open to mark the service as "Healthy"
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Priyanshu System is Online 🟢');
});

app.listen(PORT, () => {
  console.log(`Web Server running on port ${PORT}`);
});

// 2. Setup NVIDIA Kimi Connection
// We use process.env to pull the key from Render's secure dashboard later
const client = new OpenAI({
  apiKey: process.env.API_KEY, 
  baseURL: 'https://integrate.api.nvidia.com/v1'
});

// 3. Setup Telegram Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

console.log("🚀 System Starting...");

// Handle Text Messages
bot.on('text', async (ctx) => {
  const userMsg = ctx.message.text;
  console.log(`User: ${userMsg}`);

  try {
    ctx.sendChatAction('typing');
    
    // Call NVIDIA Kimi 2.5
    const completion = await client.chat.completions.create({
      model: "moonshotai/kimi-k2.5",
      messages: [{ role: "user", content: userMsg }],
      temperature: 0.5,
      max_tokens: 4096
    });

    // Send Answer
    if (completion.choices && completion.choices[0]) {
      await ctx.reply(completion.choices[0].message.content);
    }
  } catch (err) {
    console.error("AI Error:", err);
    await ctx.reply("⚠️ System Error: " + err.message);
  }
});

// Handle Images (Vision Capability)
bot.on('photo', async (ctx) => {
  console.log("Photo received processing...");
  ctx.sendChatAction('typing');
  
  try {
    // 1. Get the file link from Telegram
    const photo = ctx.message.photo.pop(); // Get highest quality
    const fileLink = await ctx.telegram.getFileLink(photo.file_id);
    
    // 2. Prepare question (Caption or Default)
    const question = ctx.message.caption || "Describe this image in detail.";

    // 3. Send to NVIDIA Kimi
    const completion = await client.chat.completions.create({
      model: "moonshotai/kimi-k2.5",
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

// 4. Launch the Bot
bot.launch().then(() => {
  console.log("✅ Telegram Bot Connected Successfully!");
}).catch((err) => {
  console.error("❌ Connection Failed:", err);
});

// Enable graceful stop (Safety features)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
