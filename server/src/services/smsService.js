let client = null;

const getClient = () => {
  if (!client) {
    const twilio = require('twilio');
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    if (!sid || !sid.startsWith('AC') || !token || token === 'your_twilio_auth_token') {
      return null; // Twilio not configured
    }
    client = twilio(sid, token);
  }
  return client;
};

const sendSMS = async (to, message) => {
  const twilioClient = getClient();
  if (!twilioClient) {
    console.warn('Twilio not configured — SMS skipped to:', to);
    return { success: false, error: 'Twilio not configured' };
  }
  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error('SMS send error:', err.message);
    return { success: false, error: err.message };
  }
};

const buildSOSMessage = (userName, lat, lng, timestamp) => {
  const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
  return `🚨 EMERGENCY ALERT 🚨\n${userName} needs help!\n\nLocation: ${mapsLink}\nTime: ${new Date(timestamp).toLocaleString()}\n\nPlease respond immediately or call emergency services.`;
};

module.exports = { sendSMS, buildSOSMessage };
