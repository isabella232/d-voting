import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import { newElection } from 'components/utils/Endpoints';

import { CloudUploadIcon, TrashIcon } from '@heroicons/react/solid';

import SubjectComponent from './SubjectComponent';
import AddButton from './AddButton';
import UploadFile from './UploadFile';

import configurationSchema from '../../../schema/configurationValidation';
import { Configuration, ID, Subject } from '../../../types/configuration';
import { emptyConfiguration, newSubject } from '../../../types/getObjectType';
import { marshalConfig } from '../../../types/JSONparser';
import DownloadButton from 'components/buttons/DownloadButton';
import SpinnerIcon from 'components/utils/SpinnerIcon';
import RedirectToModal from 'components/modal/RedirectToModal';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon, DotsVerticalIcon } from '@heroicons/react/outline';

// notifyParent must be used by the child to tell the parent if the subject's
// schema changed.

// removeSubject is used by the subject child to notify the
// parent when the "removeSubject" button has been clicked.

type ElectionFormProps = {};

const ElectionForm: FC<ElectionFormProps> = () => {
  // conf is the configuration object containing MainTitle and Scaffold which
  // contains an array of subject.
  const { t } = useTranslation();
  const emptyConf: Configuration = emptyConfiguration();
  const [conf, setConf] = useState<Configuration>(emptyConf);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [textModal, setTextModal] = useState('');
  const [navigateDestination, setNavigateDestination] = useState(null);
  const { MainTitle, Scaffold } = conf;

  async function createHandler() {
    const data = {
      Configuration: marshalConfig(conf),
    };
    const req = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    };

    try {
      await configurationSchema.validate(data.Configuration);
    } catch (err) {
      setTextModal(t('errorIncorrectConfSchema') + err.errors.join(','));
      setShowModal(true);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(newElection, req);
      if (res.status !== 200) {
        const response = await res.text();
        setTextModal(`Error HTTP ${res.status} (${res.statusText}) : ${response}`);
        setShowModal(true);
      } else {
        const response = await res.json();
        setNavigateDestination('/elections/' + response.ElectionID);
        setTextModal(`${t('successCreateElection')} ${response.ElectionID}`);
        setShowModal(true);
        setConf(emptyConf);
      }
      setLoading(false);
    } catch (error) {
      setTextModal(error.message);
      setShowModal(true);
      setLoading(false);
    }
  }

  // exports the data to a JSON file, marshall the configuration state object
  // before exporting it
  const exportData = async () => {
    const data = marshalConfig(conf);
    try {
      await configurationSchema.validate(data);
    } catch (err) {
      setTextModal(t('errorIncorrectConfSchema') + err.errors.join(','));
      setShowModal(true);
      return;
    }
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = 'election_configuration.json';
    link.click();
  };

  // Called by any of our subject child when they update their schema.
  const notifyParent = (subject: Subject) => {
    const newSubjects = [...Scaffold];
    newSubjects[newSubjects.findIndex((s) => s.ID === subject.ID)] = subject;
    setConf({ ...conf, Scaffold: newSubjects });
  };

  const addSubject = () => {
    const newSubjects = [...Scaffold];
    newSubjects.push(newSubject());
    setConf({ ...conf, Scaffold: newSubjects });
  };

  const removeSubject = (subjectID: ID) => () => {
    setConf({
      ...conf,
      Scaffold: Scaffold.filter((subject) => subject.ID !== subjectID),
    });
  };

  const displayElectionForm = () => {
    return (
      <div className="w-screen px-4 md:px-0 md:w-auto">
        <div className="flex flex-col shadow-lg rounded-md">
          <UploadFile setConf={setConf} setShowModal={setShowModal} setTextModal={setTextModal} />
          <div className="hidden sm:block">
            <div className="py-3 px-4">
              <div className="border-t border-gray-200" />
            </div>
          </div>
          <input
            value={MainTitle}
            onChange={(e) => setConf({ ...conf, MainTitle: e.target.value })}
            name="MainTitle"
            type="text"
            placeholder="Enter the Main title"
            className="ml-3 mt-4 w-60 mb-2 text-lg border rounded-md"
          />
          {Scaffold.map((subject) => (
            <SubjectComponent
              notifyParent={notifyParent}
              subjectObject={subject}
              removeSubject={removeSubject(subject.ID)}
              nestedLevel={0}
              key={subject.ID}
            />
          ))}
          <div className="flex justify-end pr-2">
            <AddButton onClick={addSubject}>Subject</AddButton>
          </div>
        </div>
        <div className="my-2">
          <button
            type="button"
            className="inline-flex my-2 ml-2 items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600"
            onClick={createHandler}>
            {loading ? (
              <SpinnerIcon />
            ) : (
              <CloudUploadIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            )}
            {t('createElec')}
          </button>
          <button
            type="button"
            className="inline-flex my-2 ml-2 items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            onClick={() => setConf(emptyConf)}>
            <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            {t('clearElec')}
          </button>
          <DownloadButton exportData={exportData}>{t('exportElecJSON')}</DownloadButton>
        </div>
      </div>
    );
  };

  const SubjectAccordion = () => {
    return (
      <Disclosure>
        {({ open }) => (
          <>
            <div className="flex flex-row border justify-between w-full h-24 bg-gray-100  ">
              <div className="flex flex-col pl-2">
                <div>Subject Title</div>
                <div>Subject</div>
                <div>
                  <Disclosure.Button className="text-left text-sm font-medium rounded-full text-gray-900">
                    <ChevronUpIcon
                      className={`${!open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-600`}
                    />
                  </Disclosure.Button>
                </div>
              </div>
              <div>
                <div></div>
                <button>
                  <DotsVerticalIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <Disclosure.Panel className="px-4  py-2 text-sm text-gray-500 bg-gray-100">
              <div>Elements of subject</div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    );
  };

  const displayPreviewElection = () => {
    return (
      <div className="border rounded-md">
        <div className="flex flex-col">
          <SubjectAccordion />
          <SubjectAccordion />
          <SubjectAccordion />
          <button className="flex w-full h-12 justify-between bg-gray-50 px-4 py-2 text-left text-sm font-medium hover:bg-gray-100">
            Add element
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <RedirectToModal
        showModal={showModal}
        setShowModal={setShowModal}
        title={t('notification')}
        buttonRightText={t('close')}
        navigateDestination={navigateDestination}>
        {textModal}
      </RedirectToModal>
      <div className="hidden md:grid grid-cols-2 gap-1">
        {displayElectionForm()}
        {displayPreviewElection()}
      </div>
    </>
  );
};

ElectionForm.propTypes = {
  setShowModal: PropTypes.func.isRequired,
  setTextModal: PropTypes.func.isRequired,
};

export default ElectionForm;
