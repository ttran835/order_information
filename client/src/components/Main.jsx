import React from 'react';
import axios from 'axios';

import urls from './urls';

import { CSV_TYPE, TIME_PERIOD } from '../../../shared/fetchConstants';

const FREQUENCY_TYPE = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
};

class Main extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      validYears: [],
      frequencyType: FREQUENCY_TYPE.MONTHLY,
      timePeriod: TIME_PERIOD.JANUARY,
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
    this.setState({ validYears });
  };

  render() {
    const { frequencyType } = this.state;
    return (
      <div>
        <h1>Download Headers Or Details CSV</h1>
        <select onChange={(e) => this.setState({ frequencyType: e.target.value })}>
          {Object.values(FREQUENCY_TYPE).map((freqType) => (
            <option key={freqType} value={freqType}>
              {freqType}
            </option>
          ))}
        </select>
        {frequencyType === FREQUENCY_TYPE.MONTHLY && (
          <select onChange={(e) => this.setState({ timePeriod: e.target.value })}>
            {Object.values(TIME_PERIOD).map((month) => (
              <option value={month} key={month}>
                {month}
              </option>
            ))}
          </select>
        )}
      </div>
    );
  }
}

export default Main;
