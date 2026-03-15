# Car and Driver Creation Process

This document outlines the required details for adding a new car and its associated driver to the system. The car and driver creation process has been unified to streamline data entry and prevent duplicate driver records.

## Unified Creation

When a new car is added, the system will also create or link a driver profile. The system checks for an existing driver based on their email and mobile number.

- If a driver with the same email or mobile number already exists, the new car will be associated with that existing driver.
- If no matching driver is found, a new driver profile will be created with the details provided.

## Required Driver Details

The following driver details are **required** when adding a new car:

### Personal Information
- **Full Name:** The driver's full name as it appears on their official documents.
- **Email Address:** A valid email address for the driver. Used for communication and identification.
- **Mobile Number:** A valid mobile number for the driver. Used for communication and identification.

### Identification Documents
- **Aadhar Card:** The driver's Aadhar card number and a scanned copy of the card.
- **PAN Card:** The driver's PAN card number and a scanned copy of the card.
- **Driving Licence:** The driver's driving licence number, expiry date, and a scanned copy of the licence.

## API Request Example

When making an API request to add a new car, you must include the car details as well as the owner/driver details in the same request.

```json
{
  "make": "Maruti Suzuki",
  "model": "Swift Dzire",
  "year": 2022,
  "vehicleType": "Car",
  "sharingType": "Private",
  "price": 1800,
  "color": "White",
  "fuelType": "Petrol",
  "transmission": "Manual",
  "ownerName": "Rajesh Kumar",
  "ownerEmail": "rajesh.kumar@example.com",
  "ownerMobile": "9876543210",
  "ownerAadhar": "1234 5678 9012",
  "ownerPAN": "ABCDE1234F",
  "ownerDrivingLicence": "DL-1420220000123"
}
```
