import React from 'react';
import TourLocations from '../components/TourLocations';
import Search from '../components/Search';
import BannerSlider from '../components/BannerSlider';
import Offered from './Offered';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <TourLocations />
      <Search />
      <BannerSlider />
      <Offered />
    </div>
  );
};

export default HomePage;
