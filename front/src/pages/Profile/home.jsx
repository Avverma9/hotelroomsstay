import React from 'react';
import Banner from '../../pages/home-section/Banner';
import Locations from '../../pages/home-section/Locations';
import Offered from '../../pages/home-section/Offered';
import SearchForm from '../Search';

export default function HomePage() {
  return (
    <>
      <Banner />
      <SearchForm />
      <Locations />
      <Offered />
    </>
  );
}