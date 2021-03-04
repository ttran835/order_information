const { TIME_PERIOD } = require('../../shared/fetchConstants');

const getLastDayOfMonth = (y, m) => new Date(y, m + 1, 0).getDate();

const getDateWithZeroUTCOffest = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString();

const calculateMinMaxDate = (timePeriod, year) => {
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
  // Quarterly
  if (Object.keys(quarterlyMapping).includes(timePeriod)) {
    const { start, end } = quarterlyMapping[timePeriod];
    minDate = getDateWithZeroUTCOffest(new Date(year, start));
    maxDate = getDateWithZeroUTCOffest(
      new Date(year, end, getLastDayOfMonth(year, end), 23, 59, 59),
    );

    // Annually
  } else if (timePeriod === TIME_PERIOD.ANNUAL) {
    minDate = getDateWithZeroUTCOffest(new Date(year, 0));
    maxDate = getDateWithZeroUTCOffest(new Date(year, 11, getLastDayOfMonth(year, 11), 23, 59, 59));

    // Monthly
  } else {
    const month = monthMapping[timePeriod];
    minDate = getDateWithZeroUTCOffest(new Date(year, month));
    maxDate = getDateWithZeroUTCOffest(
      new Date(year, month, getLastDayOfMonth(year, month), 23, 59, 59),
    );
  }

  return { minDate, maxDate };
};

module.exports = { getLastDayOfMonth, getDateWithZeroUTCOffest, calculateMinMaxDate };
