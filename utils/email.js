const nodemailer = require('nodemailer');
const pug = require('pug');
const { htmlToText } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.name = user.name;
    this.url = url;
    this.from = `Nick Damianides <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // 1) Render HTML based on a pug template
    //console.log(`${__dirname}/../views/email/${template}.pug`);

    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      name: this.name,
      url: this.url,
      subject,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html, { wordwrap: 255 }),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Cinema2022 Family!');
  }

  async sendSessionChanged(invitation, newSessionData) {
    const subject = `We are sorry but there was a change considering the screening of movie ${invitation.movie.title}`;
    // 1) Render HTML based on a pug template
    //console.log(`${__dirname}/../views/email/${template}.pug`);
    const html = pug.renderFile(
      `${__dirname}/../views/email/sessionChanged.pug`,
      {
        name: this.name,
        url: this.url,
        email: invitation.email,
        subject,
        sessionDate: newSessionData.sessionDate.toLocaleDateString(),
        sessionTime: newSessionData.sessionTime,
        cinema: newSessionData.cinema,
        movie: newSessionData.movie,
        reservedByName: invitation.user.name,
        reservedBySurname: invitation.user.surname,
      }
    );

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html, { wordwrap: 255 }),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 minutes)'
    );
  }

  async sendInvitation(invitation) {
    const subject = `${invitation.user.name} ${invitation.user.surname} invited you to watch the movie ${invitation.movie.title}`;
    // 1) Render HTML based on a pug template
    //console.log(`${__dirname}/../views/email/${template}.pug`);
    const html = pug.renderFile(`${__dirname}/../views/email/invitation.pug`, {
      name: this.name,
      url: this.url,
      email: invitation.email,
      subject,
      sessionDate: invitation.sessionDate.toLocaleDateString(),
      sessionTime: invitation.sessionTime,
      cinema: invitation.cinema.name,
      movie: invitation.movie.title,
      reservedByName: invitation.user.name,
      reservedBySurname: invitation.user.surname,
      row: invitation.row + 1,
      seat: invitation.seat + 1,
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText(html, { wordwrap: 255 }),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }
};
