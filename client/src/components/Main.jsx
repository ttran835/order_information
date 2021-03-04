import React from 'react';
import axios from 'axios';
import fileDownload from 'js-file-download';

import urls from '../_requests/urls';

import { CSV_TYPE, TIME_PERIOD } from '../../../shared/fetchConstants';

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
      loading: true,
      downloading: false,
      errorMessage: '',
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
    this.setState({ validYears, chosenYear: currentYear, loading: false });
  };

  onClickButtons = async (csvType) => {
    const { chosenYear, timePeriod, errorMessage } = this.state;
    if (errorMessage) {
      this.setState({ errorMessage: '' });
    }
    const url = `${urls.bcUrls}/orders/csv/${csvType}/time-period/${timePeriod}/year/${chosenYear}`;
    this.setState({ downloading: true });
    const { data } = await axios.get(url);
    if (!data) {
      this.setState({ errorMessage: 'No orders found for the selected time period' });
    } else {
      fileDownload(data, `${csvType}1.csv`);
    }
    this.setState({ downloading: false });
  };

  render() {
    const {
      frequencyType,
      validYears,
      loading,
      downloading,
      errorMessage,
      chosenYear,
      timePeriod,
    } = this.state;
    const loadingOrDownloading = <h2>{`${loading ? 'Loading...' : 'Downloading...'}`}</h2>;
    return (
      <div>
        <h1>Download Headers Or Details CSV</h1>
        {!!errorMessage && <h3 style={{ color: 'red' }}>{errorMessage}</h3>}
        {loading || downloading ? (
          loadingOrDownloading
        ) : (
          <>
            <div style={{ display: 'flex' }}>
              <h4>Year:</h4>
              <select
                value={chosenYear}
                onChange={(e) => this.setState({ chosenYear: e.target.value })}>
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
                value={frequencyType}
                onChange={(e) => {
                  const chosenFrequencyType = e.target.value;
                  let resettedTimePeriod;
                  if (chosenFrequencyType === FREQUENCY_TYPE.ANNUALLY) {
                    resettedTimePeriod = TIME_PERIOD.ANNUAL;
                  } else if (chosenFrequencyType === FREQUENCY_TYPE.MONTHLY) {
                    resettedTimePeriod = MONTHS[0];
                  } else {
                    resettedTimePeriod = QUARTERS[0];
                  }

                  this.setState({
                    frequencyType: chosenFrequencyType,
                    timePeriod: resettedTimePeriod,
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
                <select
                  value={timePeriod}
                  onChange={(e) => this.setState({ timePeriod: e.target.value })}>
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
                <select
                  value={timePeriod}
                  onChange={(e) => this.setState({ timePeriod: e.target.value })}>
                  {QUARTERS.map((quarter) => (
                    <option value={quarter} key={quarter}>
                      {quarter}
                    </option>
                  ))}
                </select>
              </>
            )}
            <div>
              <button onClick={() => this.onClickButtons(CSV_TYPE.HEADERS)}>Headers CSV</button>
              <button onClick={() => this.onClickButtons(CSV_TYPE.DETAILS)}>Details CSV</button>
            </div>
          </>
        )}
      </div>
    );
  }
}

export default Main;
