const express = require('express');

exports.processChat = async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const systemPrompt = "You are Chess Arena support assistant. Help users with: how to join contests, wallet, rules, prizes, how chess moves work. App has contests from ₹7 to ₹100, winner gets prize. Be helpful and concise.";

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: message }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(500).json({ error: "Failed to connect to chat interface." });
    }

    const data = await response.json();
    const reply = data.content[0].text;
    res.json({ reply });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ error: "Server error during chat processing." });
  }
};
