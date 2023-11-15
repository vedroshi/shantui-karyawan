const getDateObj = (dateString) => {
    const [year, month, date] = dateString.split('-')
    const dateObj = new Date(year, month - 1, date)
    return dateObj
}

module.exports = {
    getDateObj
}