const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const templates = {
    confirmation: 'd-8be81d6654b849d08d836440b10b8a1d',
    newBooking: 'd-1f5d708eb0ef4564b0bf765e67c8f74f',
    clientCancel: 'd-fb382a99851f48199f58c8c185ff4f76'
}

const sendFrom = 'service@booktid.net'

const sendConfirmationEmail = async (customerEmail, templateData) =>
{
    if (process.env.NODE_ENV === 'test') return;
    const msg = {
        to: customerEmail,
        from: sendFrom,
        templateId: templates.confirmation,
        dynamicTemplateData: templateData
    }

    return sgMail.send(msg)
    .then(() => console.log('Confirmation E-Mail sent'))
    .catch(err => console.log(err))
}

const sendNewBookingEmail = async (adminEmail, templateData) =>
{
    if (process.env.NODE_ENV === 'test') return;
    const msg = {
        to: adminEmail,
        from: sendFrom,
        templateId: templates.newBooking,
        dynamicTemplateData: templateData
    }

    return sgMail.send(msg)
    .then(() => console.log('New booking E-Mail sent'))
    .catch(err => console.log(err))
}

const sendClientCancelEmail = async (adminEmail, templateData) =>
{
    if (process.env.NODE_ENV === 'test') return;
    const msg = {
        to: adminEmail,
        from: sendFrom,
        templateId: templates.clientCancel,
        dynamicTemplateData: templateData
    }

    return sgMail.send(msg)
    .then(() => console.log('Client cancel E-Mail sent'))
    .catch(err => console.log(err))
}

module.exports = {
    sendConfirmationEmail,
    sendNewBookingEmail,
    sendClientCancelEmail
}