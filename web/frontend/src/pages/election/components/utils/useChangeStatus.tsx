import { useTranslation } from 'react-i18next';
import { Status } from 'types/election';

// Custom hook that can display the status of an election and enable changes
// of status (closing, cancelling,...)
const useChangeStatus = (status: Status) => {
  const { t } = useTranslation();

  const getStatus = () => {
    switch (status) {
      case Status.Initial:
        return (
          <div className="flex">
            <div className="block h-4 w-4 bg-green-500 rounded-full mr-2"></div>
            <div>{t('statusInitial')}</div>
          </div>
        );
      case Status.Initialized:
        return (
          <div className="flex">
            <div className="block h-4 w-4 bg-green-500 rounded-full mr-2"></div>
            <div>{t('statusInitializedNodes')}</div>
          </div>
        );
      case Status.Setup:
        return (
          <div className="flex">
            <div className="block h-4 w-4 bg-green-500 rounded-full mr-2"></div>
            <div>{t('statusSetup')}</div>
          </div>
        );
      case Status.Open:
        return (
          <div className="flex">
            <div className="block h-4 w-4 bg-green-500 rounded-full mr-2"></div>
            <div>{t('statusOpen')}</div>
          </div>
        );
      case Status.Closed:
        return (
          <div className="flex">
            <div className="block h-4 w-4 bg-gray-400 rounded-full mr-2"></div>
            <div>{t('statusClose')}</div>
          </div>
        );
      case Status.ShuffledBallots:
        return (
          <div className="flex">
            <div className="block h-4 w-4 bg-gray-400 rounded-full mr-2"></div>
            <div>{t('statusShuffle')}</div>
          </div>
        );
      case Status.PubSharesSubmitted:
        return (
          <div className="flex">
            <div className="block h-4 w-4 bg-gray-400 rounded-full mr-2"></div>
            <div>{t('statusDecrypted')}</div>
          </div>
        );
      case Status.ResultAvailable:
        return (
          <div className="flex">
            <div className="block h-4 w-4 bg-gray-400 rounded-full mr-2"></div>
            <div>{t('statusResultAvailable')}</div>
          </div>
        );
      case Status.Canceled:
        return (
          <div className="flex">
            <div className="block h-4 w-4 bg-red-500 rounded-full mr-2"></div>
            <div>{t('statusCancel')}</div>
          </div>
        );
      default:
        return null;
    }
  };
  return { getStatus };
};

export default useChangeStatus;
