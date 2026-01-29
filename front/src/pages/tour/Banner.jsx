import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { Carousel } from 'react-bootstrap';
import { bannerImage } from '../../utils/extrasList';
import './TravelBanner.css'; // Import custom CSS

const TravelBanner = () => {
    return (
        <Carousel>
            {bannerImage.map((image, index) => (
                <Carousel.Item key={index}>
                    <img
                        style={{ width: 'auto', height: '300px' }}
                        className="d-block w-100 travel-banner-image"
                        src={image}
                        alt={`Travel Image ${index + 1}`}
                    />
                </Carousel.Item>
            ))}
        </Carousel>
    );
};

export default TravelBanner;
