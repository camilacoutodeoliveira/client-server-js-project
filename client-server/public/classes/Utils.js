class Utils {
    static dateFormat(date) {
        return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getYear() + ' ' + date.getHours() + ':' + date.getMinutes();
    }
}