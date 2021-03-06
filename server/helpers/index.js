const { TIME_PERIOD } = require('../../shared/fetchConstants');

const getLastDayOfMonth = (y, m) => new Date(y, m + 1, 0).getDate();

const convertToRFC2822 = (date) => {
  const dateString = new Date(date).toString();
  const [dateWithNoParenthesis] = dateString.split(' (');
  const dateArray = dateWithNoParenthesis.split(' ');
  [dateArray[1], dateArray[2]] = [dateArray[2], dateArray[1]];
  dateArray[0] += ',';
  dateArray.pop();
  return dateArray.join(' ');
};

const calculateMinMaxDate = (timePeriod, year, date = null) => {
  const quarterlyMapping = {
    [TIME_PERIOD.JAN_TO_MARCH]: { start: 0, end: 2 },
    [TIME_PERIOD.APRIL_TO_JUNE]: { start: 3, end: 5 },
    [TIME_PERIOD.JULY_TO_SEPTEMBER]: { start: 6, end: 8 },
    [TIME_PERIOD.OCTOBER_TO_DECEMBER]: { start: 9, end: 11 },
  };

  const monthMapping = {
    [TIME_PERIOD.JANUARY]: 0,
    [TIME_PERIOD.FEBRUARY]: 1,
    [TIME_PERIOD.MARCH]: 2,
    [TIME_PERIOD.APRIL]: 3,
    [TIME_PERIOD.MAY]: 4,
    [TIME_PERIOD.JUNE]: 5,
    [TIME_PERIOD.JULY]: 6,
    [TIME_PERIOD.AUGUST]: 7,
    [TIME_PERIOD.SEPTEMBER]: 8,
    [TIME_PERIOD.OCTOBER]: 9,
    [TIME_PERIOD.NOVEMBER]: 10,
    [TIME_PERIOD.DECEMBER]: 11,
  };

  let minDate;
  let maxDate;

  // Daily
  if (date) {
    minDate = new Date(date).toISOString();
    maxDate = new Date(new Date(date).setHours(23, 59, 59)).toISOString();

    // Quarterly
  } else if (Object.keys(quarterlyMapping).includes(timePeriod)) {
    const { start, end } = quarterlyMapping[timePeriod];
    minDate = new Date(year, start).toISOString();
    maxDate = new Date(year, end, getLastDayOfMonth(year, end), 23, 59, 59).toISOString();

    // Annually
  } else if (timePeriod === TIME_PERIOD.ANNUAL) {
    minDate = new Date(year, 0).toISOString();
    maxDate = new Date(year, 11, getLastDayOfMonth(year, 11), 23, 59, 59).toISOString();

    // Monthly
  } else {
    const month = monthMapping[timePeriod];
    minDate = new Date(year, month).toISOString();
    maxDate = new Date(year, month, getLastDayOfMonth(year, month), 23, 59, 59).toISOString();
  }

  return { minDate, maxDate };
};

module.exports = { getLastDayOfMonth, convertToRFC2822, calculateMinMaxDate };
