# Updated Camp API Response Example

## API Endpoint
`GET /api/camps/{campId}?center_id={centerId}`

## Updated Response Format

The API now includes driver information for each camp list item. Here's the complete response structure:

```json
{
  "id": 1,
  "center_id": 1,
  "scheduled_on": "2024-02-15",
  "location_text": "Health Center, Mumbai",
  "is_completed": false,
  "assigned_phlebotomist_ids": [1, 2, 3],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z",
  "items": [
    {
      "id": 1,
      "camp_id": 1,
      "driver_id": 1,
      "is_completed": false,
      "driver_health_checkup_id": null,
      "id_proof_image": null,
      "remarks": null,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "driver": {
        "id": 1,
        "name": "John Doe",
        "employeeId": "EMP001",
        "phone": "1234567890"
      }
    },
    {
      "id": 2,
      "camp_id": 1,
      "driver_id": 2,
      "is_completed": true,
      "driver_health_checkup_id": 5,
      "id_proof_image": "https://bucket.s3.amazonaws.com/user2/idproof/image.jpg",
      "remarks": "Completed successfully",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z",
      "driver": {
        "id": 2,
        "name": "Jane Smith",
        "employeeId": "EMP002",
        "phone": "0987654321"
      }
    },
    {
      "id": 3,
      "camp_id": 1,
      "driver_id": 3,
      "is_completed": false,
      "driver_health_checkup_id": null,
      "id_proof_image": "https://bucket.s3.amazonaws.com/user3/idproof/image.jpg",
      "remarks": "Pending verification",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "driver": {
        "id": 3,
        "name": "Mike Johnson",
        "employeeId": "EMP003",
        "phone": "1122334455"
      }
    }
  ],
  "assignedPhlebotomists": [
    {
      "id": 1,
      "user_type": "PHLEBO",
      "center_id": 1,
      "user": {
        "id": 1,
        "name": "Dr. Sarah Wilson"
      }
    },
    {
      "id": 2,
      "user_type": "PHLEBO",
      "center_id": 1,
      "user": {
        "id": 2,
        "name": "Dr. Robert Brown"
      }
    }
  ]
}
```

## Key Changes

### Before (Previous Response)
```json
{
  "items": [
    {
      "id": 1,
      "camp_id": 1,
      "driver_id": 1,
      "is_completed": false,
      "driver_health_checkup_id": null,
      "id_proof_image": null,
      "remarks": null
    }
  ]
}
```

### After (Updated Response)
```json
{
  "items": [
    {
      "id": 1,
      "camp_id": 1,
      "driver_id": 1,
      "is_completed": false,
      "driver_health_checkup_id": null,
      "id_proof_image": null,
      "remarks": null,
      "driver": {
        "id": 1,
        "name": "John Doe",
        "employeeId": "EMP001",
        "phone": "1234567890"
      }
    }
  ]
}
```

## Driver Information Included

For each camp list item, the following driver information is now included:

- **id**: Driver's unique identifier
- **name**: Driver's full name
- **employeeId**: Employee ID for the driver
- **phone**: Driver's phone number

## Benefits

1. **Reduced API Calls**: No need for separate API calls to fetch driver details
2. **Better Performance**: Single query with joins instead of multiple queries
3. **Complete Data**: All necessary driver information in one response
4. **Frontend Friendly**: Easier to display driver names in UI components

## Postman Testing

### Request
```bash
GET {{base_url}}/api/camps/1?center_id=123
```

### Expected Response
The response will now include the `driver` object for each item in the `items` array, containing the driver's name, employee ID, and phone number.

## Error Handling

The API maintains the same error handling as before:
- **404 Not Found**: If camp doesn't exist or doesn't belong to the center
- **400 Bad Request**: If center_id is invalid
- **500 Internal Server Error**: For database or server errors

## Backward Compatibility

This change is **backward compatible** as it only adds new fields to the response without removing or modifying existing fields.
