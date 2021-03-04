import React from 'react';
import axios from 'axios';

import urls from '../_requests/urls';

import { CSV_TYPE, TIME_PERIOD } from '../../../shared/fetchConstants';
import { time } from 'faker';

const FREQUENCY_TYPE = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
};

const MONTHS = [
  TIME_PERIOD.JANUARY,
  TIME_PERIOD.FEBRUARY,
  TIME_PERIOD.MARCH,
  TIME_PERIOD.APRIL,
  TIME_PERIOD.MAY,
  TIME_PERIOD.JUNE,
  TIME_PERIOD.JULY,
  TIME_PERIOD.AUGUST,
  TIME_PERIOD.SEPTEMBER,
  TIME_PERIOD.OCTOBER,
  TIME_PERIOD.NOVEMBER,
  TIME_PERIOD.DECEMBER,
];

const QUARTERS = [
  TIME_PERIOD.JAN_TO_MARCH,
  TIME_PERIOD.APRIL_TO_JUNE,
  TIME_PERIOD.JULY_TO_SEPTEMBER,
  TIME_PERIOD.OCTOBER_TO_DECEMBER,
];

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      validYears: [],
      frequencyType: FREQUENCY_TYPE.MONTHLY,
      timePeriod: TIME_PERIOD.JANUARY,
      chosenYear: null,
    };
  }

  componentDidMount = async () => {
    const url = `${urls.bcUrls}/orders/oldestYear`;
    const {
      data: { oldestYear },
    } = await axios.get(url);
    const currentYear = new Date().getFullYear();
    const validYears = [];
    for (let i = currentYear; i >= oldestYear; i--) {
      validYears.push(i);
    }
    this.setState({ validYears, chosenYear: currentYear });
  };

  onClickButtons = (csvType) => {
    const { chosenYear, timePeriod } = this.state;
    const url = `${urls.bcUrls}/csv/${csvType}/time-period/${timePeriod}/year/${chosenYear}`;
  };

  render() {
    const { frequencyType, validYears } = this.state;
    return (
      <div>
        <h1>Download Headers Or Details CSV</h1>
        <div style={{ display: 'flex' }}>
          <h4>Year:</h4>
          <select onChange={(e) => this.setState({ chosenYear: e.target.value })}>
            {validYears.map((year) => (
              <option value={year} key={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <>
          <span>Frequency: </span>
          <select
            onChange={(e) => {
              const chosenFrequencyType = e.target.value;
              let timePeriod;
              if (chosenFrequencyType === FREQUENCY_TYPE.ANNUALLY) {
                timePeriod = TIME_PERIOD.ANNUAL;
              } else if (chosenFrequencyType === FREQUENCY_TYPE.MONTHLY) {
                timePeriod = MONTHS[0];
              } else {
                timePeriod = QUARTERS[0];
              }

              this.setState({
                frequencyType: chosenFrequencyType,
                timePeriod,
              });
            }}>
            {Object.values(FREQUENCY_TYPE).map((freqType) => (
              <option key={freqType} value={freqType}>
                {freqType}
              </option>
            ))}
          </select>
        </>
        {frequencyType === FREQUENCY_TYPE.MONTHLY && (
          <>
            <span>Month: </span>
            <select onChange={(e) => this.setState({ timePeriod: e.target.value })}>
              {MONTHS.map((month) => (
                <option value={month} key={month}>
                  {month}
                </option>
              ))}
            </select>
          </>
        )}
        {frequencyType === FREQUENCY_TYPE.QUARTERLY && (
          <>
            <span>Month: </span>
            <select onChange={(e) => this.setState({ timePeriod: e.target.value })}>
              {QUARTERS.map((quarter) => (
                <option value={quarter} key={quarter}>
                  {quarter}
                </option>
              ))}
            </select>
          </>
        )}
        <div>
          <button>Headers CSV</button>
          <button>Details CSV</button>
        </div>
      </div>
    );
  }
}

export default Main;
