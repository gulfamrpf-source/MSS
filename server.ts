import { GoogleGenAI } from "@google/genai";
import express from "express";

import fs from 'fs';

// Helper to write to .env
function updateEnvFile(keyId: string, keySecret: string) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envFile = '';
  if (fs.existsSync(envPath)) {
    envFile = fs.readFileSync(envPath, 'utf8');
  }
  
  const updateOrAdd = (key: string, val: string) => {
    const regex = new RegExp(`^\s*\b${key}\b\s*=.*\n?`, 'm');
    if (regex.test(envFile)) {
      envFile = envFile.replace(regex, `${key}="${val}"\n`);
    } else {
      envFile += `\n${key}="${val}"\n`;
    }
    process.env[key] = val; // update in memory
  };

  updateOrAdd('RAZORPAY_KEY_ID', keyId);
  updateOrAdd('RAZORPAY_KEY_SECRET', keySecret);
  
  fs.writeFileSync(envPath, envFile);
}

import path from "path";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Razorpay instance
  let razorpay: any = null;
  const initRazorpay = () => {
    if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    }
    return razorpay;
  };

  
  app.post("/api/admin/config/razorpay", (req, res) => {
    try {
      const { keyId, keySecret } = req.body;
      if (!keyId || !keySecret) {
        return res.status(400).json({ error: "Missing keys" });
      }
      
      updateEnvFile(keyId, keySecret);
      
      // Re-initialize Razorpay instance in memory
      razorpay = null;
      initRazorpay();
      
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save configuration" });
    }
  });

  // API Routes
  app.post("/api/create-order", async (req, res) => {
    try {
      const rzp = initRazorpay();
      if (!rzp) {
        return res.status(500).json({ error: "Razorpay keys not configured" });
      }

      const { amount, currency = "INR", receipt } = req.body;
      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
      };

      const order = await rzp.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/verify-payment", (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const key_secret = process.env.RAZORPAY_KEY_SECRET;
      if (!key_secret) {
        return res.status(500).json({ error: "Razorpay keys not configured" });
      }

      const hmac = crypto.createHmac("sha256", key_secret);
      hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
      const generated_signature = hmac.digest("hex");

      if (generated_signature === razorpay_signature) {
        res.json({ success: true, message: "Payment verified successfully" });
      } else {
        res.status(400).json({ success: false, message: "Invalid signature" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });


  // Gemini Chatbot Route
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is missing" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const systemInstruction = `You are "Ask MSS", the official AI chatbot for Manav Samanta Sangthan (MSS), an NGO.
Motto: "पहले इंसान, फिर धर्म" (Humanity first, then religion).
Help visitors learn about the NGO, how to donate, join, or view activities. Be polite, concise, and respond in the language used by the user (Hindi or English).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  // Config route
  // Config route to securely provide the Key ID to frontend
  app.get("/api/payment-config", (req, res) => {
    res.json({ keyId: process.env.RAZORPAY_KEY_ID || "" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
