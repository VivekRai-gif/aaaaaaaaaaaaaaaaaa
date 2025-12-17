/**
 * Email Service
 * Handles email sending functionality using Nodemailer
 */

const { createTransporter } = require('../config/email');

/**
 * Send job application email to recruiter
 * @param {Object} emailData - Email data object
 * @param {String} emailData.to - Recruiter email address
 * @param {String} emailData.subject - Email subject
 * @param {String} emailData.body - Email body text
 * @param {String} emailData.from - Sender email
 * @param {String} emailData.fromName - Sender name
 * @returns {Promise<Object>} Email send result
 */
const sendJobApplicationEmail = async (emailData) => {
  try {
    const { to, subject, body, from, fromName } = emailData;

    // Validate required fields
    if (!to || !subject || !body) {
      throw new Error('Missing required email fields (to, subject, body)');
    }

    // Create transporter
    const transporter = createTransporter();

    // Email options
    const mailOptions = {
      from: `"${fromName}" <${from}>`,
      to: to,
      subject: subject,
      text: body,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          ${body.split('\n').map(para => `<p>${para}</p>`).join('')}
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      to: to,
    };

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Verify email configuration
 * Tests the email transporter connection
 * @returns {Promise<Boolean>} True if connection successful
 */
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Email configuration verified');
    return true;
  } catch (error) {
    console.error('❌ Email configuration error:', error.message);
    return false;
  }
};

module.exports = {
  sendJobApplicationEmail,
  verifyEmailConfig,
};
