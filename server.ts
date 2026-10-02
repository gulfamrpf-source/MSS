import { GoogleGenAI } from "@google/genai";
import express from "express";

import fs from 'fs';

// Helper to write to .env
function updateEnvVars(vars: Record<string, string>) {
  const envPath = path.resolve(process.cwd(), '.env');
  let envFile = '';
  if (fs.existsSync(envPath)) {
    envFile = fs.readFileSync(envPath, 'utf8');
  }
  
  const updateOrAdd = (key: string, val: string) => {
    const regex = new RegExp(`^\\s*\\b${key}\\b\\s*=.*\\n?`, 'm');
    if (regex.test(envFile)) {
      envFile = envFile.replace(regex, `${key}="${val}"\n`);
    } else {
      envFile += `\n${key}="${val}"\n`;
    }
    process.env[key] = val; // update in memory
  };

  for (const [key, val] of Object.entries(vars)) {
    updateOrAdd(key, val);
  }
  
  fs.writeFileSync(envPath, envFile);
}

function updateEnvFile(keyId: string, keySecret: string) {
  updateEnvVars({
    RAZORPAY_KEY_ID: keyId,
    RAZORPAY_KEY_SECRET: keySecret
  });
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

  // SMS Gateway Configuration Status & Settings
  app.get("/api/admin/config/sms", (req, res) => {
    const provider = process.env.SMS_PROVIDER || "FAST2SMS";
    const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY || "";
    const senderId = process.env.SMS_SENDER_ID || "MSSNGO";
    const webhookUrl = process.env.SMS_WEBHOOK_URL || "";
    const twilioSid = process.env.TWILIO_ACCOUNT_SID || "";
    const twilioFrom = process.env.TWILIO_FROM_NUMBER || "";

    const isConfigured = Boolean(
      (provider === "FAST2SMS" && apiKey) ||
      (provider === "TWILIO" && twilioSid && process.env.TWILIO_AUTH_TOKEN && twilioFrom) ||
      (provider === "CUSTOM_WEBHOOK" && webhookUrl)
    );

    const maskKey = (key: string) => {
      if (!key || key.length < 8) return key ? "••••••••" : "";
      return key.substring(0, 4) + "••••••••" + key.substring(key.length - 4);
    };

    res.json({
      configured: isConfigured,
      provider,
      senderId,
      maskedApiKey: maskKey(apiKey),
      webhookUrl: webhookUrl ? webhookUrl.replace(/\/\/[^@]+@/, '//***@') : "",
      twilioSid: maskKey(twilioSid),
      twilioFrom
    });
  });

  app.post("/api/admin/config/sms", (req, res) => {
    try {
      const { provider = "FAST2SMS", apiKey, senderId, webhookUrl, twilioSid, twilioToken, twilioFrom } = req.body;
      
      const varsToUpdate: Record<string, string> = {
        SMS_PROVIDER: provider
      };

      if (senderId !== undefined) varsToUpdate.SMS_SENDER_ID = senderId;
      if (apiKey) {
        varsToUpdate.FAST2SMS_API_KEY = apiKey;
        varsToUpdate.SMS_API_KEY = apiKey;
      }
      if (webhookUrl !== undefined) varsToUpdate.SMS_WEBHOOK_URL = webhookUrl;
      if (twilioSid) varsToUpdate.TWILIO_ACCOUNT_SID = twilioSid;
      if (twilioToken) varsToUpdate.TWILIO_AUTH_TOKEN = twilioToken;
      if (twilioFrom) varsToUpdate.TWILIO_FROM_NUMBER = twilioFrom;

      updateEnvVars(varsToUpdate);
      res.json({ success: true, message: "SMS Gateway configuration saved successfully." });
    } catch (error: any) {
      console.error("Error saving SMS config:", error);
      res.status(500).json({ error: "Failed to save SMS configuration" });
    }
  });

  // Live SMS Sender Route
  app.post("/api/send-sms", async (req, res) => {
    try {
      const { to, message, officerName, designation, officerId } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          success: false,
          error: "Recipient mobile number and message content are required.",
          status: "FAILED"
        });
      }

      // Format recipient phone number
      const digitsOnly = to.toString().replace(/[^0-9]/g, '');
      const phone10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;

      if (phone10.length !== 10) {
        return res.status(400).json({
          success: false,
          error: `Invalid Indian mobile number format: '${to}'. Must contain 10 valid digits.`,
          status: "FAILED"
        });
      }

      const provider = process.env.SMS_PROVIDER || "FAST2SMS";
      const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY || "";
      const senderId = process.env.SMS_SENDER_ID || "MSSNGO";

      // Check if credentials exist
      if (provider === "FAST2SMS" && !apiKey) {
        return res.status(200).json({
          success: false,
          status: "CONFIG_REQUIRED",
          provider: "FAST2SMS",
          error: "SMS Gateway API Key not configured. Please enter your Fast2SMS API Key in Admin Settings > SMS Gateway to enable live SMS delivery."
        });
      }

      if (provider === "TWILIO") {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const token = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_FROM_NUMBER;
        if (!sid || !token || !from) {
          return res.status(200).json({
            success: false,
            status: "CONFIG_REQUIRED",
            provider: "TWILIO",
            error: "Twilio credentials incomplete. Please configure Account SID, Auth Token and From Number in Admin Settings."
          });
        }

        // Call Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
        const twilioBody = new URLSearchParams();
        twilioBody.append("To", `+91${phone10}`);
        twilioBody.append("From", from);
        twilioBody.append("Body", message);

        const twilioRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            "Authorization": "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: twilioBody.toString()
        });

        const twilioData = await twilioRes.json() as any;
        if (twilioRes.ok && twilioData.sid) {
          return res.json({
            success: true,
            status: "DELIVERED",
            provider: "TWILIO",
            messageId: twilioData.sid
          });
        } else {
          return res.status(200).json({
            success: false,
            status: "FAILED",
            provider: "TWILIO",
            error: twilioData.message || `Twilio error code ${twilioData.code || twilioRes.status}`
          });
        }
      }

      if (provider === "CUSTOM_WEBHOOK") {
        const webhookUrl = process.env.SMS_WEBHOOK_URL;
        if (!webhookUrl) {
          return res.status(200).json({
            success: false,
            status: "CONFIG_REQUIRED",
            provider: "CUSTOM_WEBHOOK",
            error: "Custom SMS Webhook URL is not configured."
          });
        }

        const hookRes = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(apiKey ? { "Authorization": `Bearer ${apiKey}` } : {})
          },
          body: JSON.stringify({
            to: `+91${phone10}`,
            phone: phone10,
            message,
            senderId,
            officerName,
            designation,
            officerId
          })
        });

        const hookData = await hookRes.json().catch(() => ({}));
        if (hookRes.ok) {
          return res.json({
            success: true,
            status: "DELIVERED",
            provider: "CUSTOM_WEBHOOK",
            messageId: (hookData as any).id || (hookData as any).messageId || `WH_${Date.now()}`
          });
        } else {
          return res.status(200).json({
            success: false,
            status: "FAILED",
            provider: "CUSTOM_WEBHOOK",
            error: (hookData as any).error || (hookData as any).message || `Webhook returned HTTP status ${hookRes.status}`
          });
        }
      }

      // Default: Fast2SMS API Call
      const fast2smsUrl = "https://www.fast2sms.com/dev/bulkV2";
      const fast2smsPayload = {
        route: "q",
        message: message,
        language: "english",
        flash: 0,
        numbers: phone10
      };

      const fRes = await fetch(fast2smsUrl, {
        method: "POST",
        headers: {
          "authorization": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(fast2smsPayload)
      });

      const fData = await fRes.json().catch(() => null) as any;

      if (fRes.ok && fData && fData.return === true) {
        return res.json({
          success: true,
          status: "DELIVERED",
          provider: "FAST2SMS",
          messageId: fData.request_id || (Array.isArray(fData.message) ? fData.message[0] : "SENT")
        });
      } else {
        const errMsg = fData?.message 
          ? (Array.isArray(fData.message) ? fData.message.join(", ") : fData.message)
          : `Fast2SMS server returned status ${fRes.status}`;

        return res.status(200).json({
          success: false,
          status: "FAILED",
          provider: "FAST2SMS",
          error: errMsg
        });
      }

    } catch (error: any) {
      console.error("Error in /api/send-sms:", error);
      return res.status(500).json({
        success: false,
        status: "FAILED",
        error: error.message || "An unexpected error occurred while connecting to the SMS Gateway."
      });
    }
  });

  // Test SMS Route
  app.post("/api/test-sms", async (req, res) => {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ error: "Recipient phone number is required" });
    }

    const testMessage = `MSS Test: This is a test notification from Manav Samanta Sangthan (मानव समानता संगठन) to verify SMS Gateway connectivity. Timestamp: ${new Date().toLocaleTimeString('en-IN')}`;

    // Call internal send logic by calling /api/send-sms handler directly
    const digitsOnly = to.toString().replace(/[^0-9]/g, '');
    const phone10 = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;

    const apiKey = process.env.FAST2SMS_API_KEY || process.env.SMS_API_KEY || "";
    if (!apiKey) {
      return res.json({
        success: false,
        status: "CONFIG_REQUIRED",
        error: "SMS Gateway API key is not configured. Please save your API key in Admin Settings > SMS Gateway."
      });
    }

    try {
      const fRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          route: "q",
          message: testMessage,
          language: "english",
          flash: 0,
          numbers: phone10
        })
      });

      const fData = await fRes.json().catch(() => null) as any;
      if (fRes.ok && fData?.return === true) {
        return res.json({
          success: true,
          status: "DELIVERED",
          message: "Test SMS delivered successfully!",
          requestId: fData.request_id
        });
      } else {
        return res.json({
          success: false,
          status: "FAILED",
          error: fData?.message ? (Array.isArray(fData.message) ? fData.message.join(", ") : fData.message) : `Gateway returned status ${fRes.status}`
        });
      }
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
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
