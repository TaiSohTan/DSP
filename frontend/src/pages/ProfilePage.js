import React, { useState } from 'react';
import { Tab } from '@headlessui/react';
import ProfileComponent from '../components/user/ProfileComponent';
import SecuritySettings from '../components/user/SecuritySettings';
import VotingHistory from '../components/user/VotingHistory';

const ProfilePage = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  
  const tabs = [
    { name: 'Profile', component: <ProfileComponent /> },
    { name: 'Security', component: <SecuritySettings /> },
    { name: 'Voting History', component: <VotingHistory /> },
  ];
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Account</h1>
      
      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-8">
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              className={({ selected }) =>
                `w-full py-2.5 text-sm font-medium leading-5 rounded-lg
                 ${
                   selected
                     ? 'bg-white shadow text-primary-700'
                     : 'text-gray-700 hover:bg-white/[0.12] hover:text-gray-800'
                 }
                `
              }
            >
              {tab.name}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {tabs.map((tab, index) => (
            <Tab.Panel key={index}>
              {tab.component}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default ProfilePage;