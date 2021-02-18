export default class SMS_Gateway {
    constructor(token) {
        this.BASE_URL = `https://gatewayapi.com/rest`
        this.BASE_QUERY = `token=${token}`
    }
}