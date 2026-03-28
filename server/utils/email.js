const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');
const config = require('./config');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Abhishek Kushwaha <${config.emailFrom}>`;
  }

  // Email template HTML
  getEmailTemplate(template, subject) {
    const baseStyles = `
      body { margin: 0; padding: 0; font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; }
      .email-container { max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
      .logo { text-align: center; margin-bottom: 30px; }
      .logo img { height: 50px; }
      .content { background-color: white; padding: 30px; border-radius: 5px; line-height: 1.6; color: #333; }
      .footer { text-align: center; margin-top: 20px; color: #999; font-size: 12px; padding-top: 20px; border-top: 1px solid #eee; }
      a { color: #55c57a; text-decoration: none; }
      .btn { background-color: #55c57a; color: white; padding: 12px 30px; border: none; border-radius: 3px; font-size: 16px; cursor: pointer; text-decoration: none; display: inline-block; font-weight: bold; }
      h1 { color: #55c57a; margin-top: 0; }
    `;

    let content = '';

    if (template === 'welcome') {
      content = `
        <h1>Welcome to ashoka!</h1>
        <p>Hi ${this.firstName},</p>
        <p>Welcome to ashoka, the ultimate travel platform for adventure seekers!</p>
        <p>We're thrilled to have you onboard. You now have access to our extensive collection of amazing tours from around the world.</p>
        <p>Click the button below to confirm your email and get started:</p>
        <p><a href="${this.url}" class="btn">Confirm Now</a></p>
        <p>or copy and paste this URL:</p>
        <p><a href="${this.url}">${this.url}</a></p>
        <p>Happy travels!</p>
        <p>The ashoka Team</p>
      `;
    } else if (template === 'passwordReset') {
      content = `
        <h1>Password Reset</h1>
        <p>Hi ${this.firstName},</p>
        <p>Forgot your password? No worries! Click the button below to reset it.</p>
        <p>This link will expire in 10 minutes.</p>
        <p><a href="${this.url}" class="btn">Reset Password</a></p>
        <p>or copy and paste this URL:</p>
        <p><a href="${this.url}">${this.url}</a></p>
        <p>If you didn't forget your password, please ignore this email.</p>
        <p>The ashoka Team</p>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>${baseStyles}</style>
        </head>
        <body>
          <div class="email-container">
            <div class="logo">
              <img src="https://www.ashoka.dev/img/logo.jpg" alt="ashoka">
            </div>
            <div class="content">
              ${content}
            </div>
            <div class="footer">
              <p>&copy; 2024 ashoka. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Generate HTML based on template
    const html = this.getEmailTemplate(template, subject);

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.fromString(html),
    };

    // 3) Create a transport and send email
    await nodemailer
      .createTransport({
        host: config.emailHost,
        port: config.emailPort,
        auth: {
          user: config.sendgridUsername,
          pass: config.sendgridPassword,
        },
      })
      .sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the ashoka Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }
};
