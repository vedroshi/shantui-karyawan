const moment = require('moment')

const getDateObj = (dateString) => {
    const [year, month, date] = dateString.split('-')
    const dateObj = new Date(year, month - 1, date)
    return dateObj
}

const formatDate = (date) =>{
    const formattedDate = moment(date).format('YYYY-MM-DD')
    return formattedDate
}

const revertDate = (date) =>{
    const formattedDate = moment(date).format('DD/MM/YYYY')
    return formattedDate
}

const displayDate = (date) =>{
    const formatDate = moment(date).format('DD MMMM YYYY')
    return formatDate
}


module.exports = {
    getDateObj,
    formatDate,
    displayDate,
    revertDate,
}