const TIME_PERIOD = {
  // Monthly
  JANUARY: 'january',
  FEBRUARY: 'februrary',
  MARCH: 'march',
  APRIL: 'april',
  MAY: 'may',
  JUNE: 'june',
  JULY: 'july',
  AUGUST: 'august',
  SEPTEMBER: 'september',
  OCTOBER: 'october',
  NOVEMBER: 'november',
  DECEMBER: 'december',
  // Quarterly
  JAN_TO_MARCH: 'jan-march',
  APRIL_TO_JUNE: 'april-june',
  JULY_TO_SEPTEMBER: 'july-september',
  OCTOBER_TO_DECEMBER: 'october-december',
  // Annually
  ANNUAL: 'annual',
};

const CSV_TYPE = {
  HEADERS: 'headers',
  DETAILS: 'details',
};

module.exports = { TIME_PERIOD, CSV_TYPE };
