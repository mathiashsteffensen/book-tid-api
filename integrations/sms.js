const axios = require('axios')

/** EXAMPLE JSON Body - TODO: Implement TypeScript on the API server as well so you dont have to type it out like this
{
    "businessName": "BOOKTID.NET",
    "sendAs": "BOOKTID NET"
    "appointmentAt": "1613678400",
    "sendAt": "1613592000",
    "service": "Konsultation",
    "receiver": {
        "name": "Mathias",
        "number": "56457454"
    },
    "sender": {
        "email": "mathiash@example.com",
        "stripeId": "wdaiwoh217ue12",
        "userId": "21e210uwhoa9idh"
    }
}
 */

const sendTextReminder = async ({
    businessName,
    sendAs,
    appointmentAt,
    sendAt,
    service,
    receiver,
    sender
}) => (
    await axios.post(process.env.SMS_API_URL, {
        businessName,
        sendAs,
        appointmentAt,
        sendAt,
        service,
        receiver,
        sender
    })
        .then((res) => res.data)
)

module.exports = {
    sendTextReminder
}