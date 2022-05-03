import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import ElectionTable from './components/ElectionTable';
import useFetchCall from 'components/utils/useFetchCall';
import * as endpoints from 'components/utils/Endpoints';
import './Index.css';
import Loading from 'pages/Loading';

const ElectionIndex: FC = () => {
  const { t } = useTranslation();
  const request = {
    method: 'GET',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  };

  const [data, loading, error] = useFetchCall(endpoints.elections, request);

  /*Show all the elections retrieved if any */
  const showElection = () => {
    return (
      <div>
        {data.Elections.length > 0 ? (
          <div className="election-box">
            <div className="click-info">{t('clickElection')}</div>
            <div className="election-table-wrapper">
              <ElectionTable elections={data.Elections} />
            </div>
          </div>
        ) : (
          <div className="no-election">{t('noElection')}</div>
        )}
      </div>
    );
  };

  return (
    <div className="pt-4 mx-2">
      {t('listElection')}
      {!loading ? (
        showElection()
      ) : error === null ? (
        <Loading />
      ) : (
        <div className="error-retrieving">
          {t('errorRetrievingElection')} - {error.toString()}
        </div>
      )}
    </div>
  );
};

export default ElectionIndex;
