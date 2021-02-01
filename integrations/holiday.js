require('dotenv').config()
const axios = require('axios')

const getHolidaysThisYear = async () => {
    const apiKey = process.env.HOLIDAY_API_KEY
    return axios.get(`https://holidayapi.com/v1/holidays?pretty&key=${apiKey}&public=true&country=DK&year=2021`)
}

getHolidaysThisYear().then(res => console.log(res))