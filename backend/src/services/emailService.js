const nodemailer = require('nodemailer');
const CommunicationLog = require('../models/CommunicationLog');

class EmailService {
  constructor() {
    // For development, we'll use ethereal email for testing
    // In production, you would use a real email service like Gmail, SendGrid, etc.
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Create a test account for development
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      console.log('Email service initialized with test account:', testAccount.user);
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      
      // Fallback to a mock transporter for demo purposes
      this.transporter = {
        sendMail: async (mailOptions) => {
          console.log('Mock email sent:', mailOptions);
          return {
            messageId: 'mock-' + Date.now(),
            response: '250 Message queued',
            envelope: {
              from: mailOptions.from,
              to: mailOptions.to
            }
          };
        }
      };
    }
  }

  async sendEmail(to, subject, message, customerId = null) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const mailOptions = {
        from: '"Mini CRM" <noreply@minicrm.com>',
        to: to,
        subject: subject,
        text: message,
        html: `<div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Message from Mini CRM</h2>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>This email was sent from Mini CRM system.</small></p>
        </div>`
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Log the communication
      if (customerId) {
        await this.logCommunication(customerId, 'email', to, subject, message, 'sent');
      }

      // For development - show preview URL if using ethereal
      if (nodemailer.getTestMessageUrl && nodemailer.getTestMessageUrl(info)) {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Still log as failed attempt
      if (customerId) {
        await this.logCommunication(customerId, 'email', to, subject, message, 'failed');
      }
      
      throw new Error('Failed to send email: ' + error.message);
    }
  }

  async sendSMS(phone, message, customerId = null) {
    try {
      // For demo purposes, we'll simulate SMS sending
      console.log(`SMS sent to ${phone}: ${message}`);
      
      // Log the communication
      if (customerId) {
        await this.logCommunication(customerId, 'sms', phone, null, message, 'sent');
      }

      return {
        success: true,
        messageId: 'sms-' + Date.now()
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      
      // Still log as failed attempt
      if (customerId) {
        await this.logCommunication(customerId, 'sms', phone, null, message, 'failed');
      }
      
      throw new Error('Failed to send SMS: ' + error.message);
    }
  }

  async logCommunication(customerId, type, contact, subject, message, status) {
    try {
      const logData = {
        customer: customerId,
        messageType: type,
        subject: subject,
        message: message,
        status: status,
        sentAt: new Date()
      };

      if (type === 'email') {
        logData.email = contact;
      } else if (type === 'sms') {
        logData.phone = contact;
      }

      const log = new CommunicationLog(logData);
      await log.save();
    } catch (error) {
      console.error('Error logging communication:', error);
    }
  }
}

module.exports = new EmailService();
