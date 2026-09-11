# Updated ID Proof Upload API Documentation

## 🎯 **API Overview**

**Endpoint:** `POST /api/camp-list-items/upload-id-proof`

**Description:** Uploads an ID proof image for a specific camp list item using the camp list item ID directly.

---

## 🔄 **Changes Made**

### **Before (Previous Implementation)**
```typescript
// Required parameters
- driver_id: string
- camp_id: string
- image: File
```

### **After (Updated Implementation)**
```typescript
// Required parameters
- camp_list_item_id: string
- image: File
```

---

## 📋 **Request Format**

### **Method & URL**
```
POST /api/camp-list-items/upload-id-proof
Content-Type: multipart/form-data
```

### **Request Parameters**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `camp_list_item_id` | string | Yes | ID of the camp list item | `"123"` |
| `image` | File | Yes | ID proof image file | `id-proof.jpg` |

### **Request Example**
```bash
curl -X POST "http://localhost:3000/api/camp-list-items/upload-id-proof" \
  -F "camp_list_item_id=123" \
  -F "image=@/path/to/id-proof.jpg"
```

### **Postman Setup**
```
Method: POST
URL: {{base_url}}/api/camp-list-items/upload-id-proof
Body: form-data
  - camp_list_item_id: 123
  - image: [Select image file]
```

---

## 📤 **Response Format**

### **Success Response**
```json
{
  "success": true,
  "message": "ID proof image uploaded and updated successfully",
  "data": {
    "camp_list_item_id": 123,
    "driver_id": 456,
    "camp_id": 789,
    "image_url": "https://your-bucket.s3.amazonaws.com/user456/idproof/uuid-filename.jpg",
    "updated_items": 1
  }
}
```

### **Error Responses**

#### **400 Bad Request - Missing Camp List Item ID**
```json
{
  "statusCode": 400,
  "message": "Camp list item ID is required",
  "error": "Bad Request"
}
```

#### **400 Bad Request - Invalid Camp List Item ID**
```json
{
  "statusCode": 400,
  "message": "Valid camp list item ID is required",
  "error": "Bad Request"
}
```

#### **400 Bad Request - Missing Image**
```json
{
  "statusCode": 400,
  "message": "Image file is required",
  "error": "Bad Request"
}
```

#### **400 Bad Request - Invalid File Type**
```json
{
  "statusCode": 400,
  "message": "Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed.",
  "error": "Bad Request"
}
```

#### **404 Not Found - Camp List Item Not Found**
```json
{
  "statusCode": 404,
  "message": "Camp list item with ID 123 not found",
  "error": "Not Found"
}
```

---

## 🔧 **Implementation Details**

### **Step-by-Step Process**

1. **Parameter Validation**
   - Validates `camp_list_item_id` is provided and is a valid positive number
   - Validates `image` file is provided

2. **File Type Validation**
   - Ensures only image files (JPEG, PNG, GIF, WebP) are allowed

3. **Camp List Item Lookup**
   ```typescript
   const campItem = await this.campListItemModel.findByPk(campListItemId, {
     include: [
       {
         model: DRIVERMASTER,
         as: 'driver',
         attributes: ['id', 'name'],
       },
     ],
   });
   ```

4. **S3 Upload**
   - Creates folder path: `user{driver_id}/idproof/`
   - Generates unique filename with UUID
   - Uploads to S3 bucket

5. **Database Update**
   - Updates the camp list item with the S3 URL
   - Updates the `id_proof_image` field

### **Database Impact**

#### **Tables Affected**
- **`camp_list_items`**: Updates `id_proof_image` field with S3 URL

#### **SQL Equivalent**
```sql
UPDATE camp_list_items 
SET id_proof_image = 'https://bucket.s3.amazonaws.com/user456/idproof/uuid.jpg'
WHERE id = 123;
```

---

## 🎯 **Benefits of the Updated API**

### **1. Simplified Parameters**
- **Before**: Required both `driver_id` and `camp_id`
- **After**: Only requires `camp_list_item_id`

### **2. Direct Identification**
- **Before**: Had to find camp list item using driver_id + camp_id combination
- **After**: Directly identifies the specific camp list item

### **3. Reduced Complexity**
- **Before**: Two-step lookup process
- **After**: Single database query

### **4. Better Performance**
- **Before**: Multiple database queries
- **After**: Single query with include

### **5. More Intuitive**
- **Before**: Required knowledge of both driver and camp IDs
- **After**: Only needs the camp list item ID (which is typically known from the UI)

---

## 🧪 **Testing Scenarios**

### **Success Cases**

#### **Test Case 1: Valid Upload**
```
Request:
- camp_list_item_id: 123
- image: valid-image.jpg

Expected Response:
- Status: 200 OK
- Success: true
- Image URL returned
```

#### **Test Case 2: Multiple Uploads**
```
Request:
- camp_list_item_id: 124
- image: another-image.png

Expected Response:
- Status: 200 OK
- Success: true
- Different image URL returned
```

### **Error Cases**

#### **Test Case 3: Missing Camp List Item ID**
```
Request:
- image: valid-image.jpg

Expected Response:
- Status: 400 Bad Request
- Message: "Camp list item ID is required"
```

#### **Test Case 4: Invalid Camp List Item ID**
```
Request:
- camp_list_item_id: "invalid"
- image: valid-image.jpg

Expected Response:
- Status: 400 Bad Request
- Message: "Valid camp list item ID is required"
```

#### **Test Case 5: Non-existent Camp List Item**
```
Request:
- camp_list_item_id: 99999
- image: valid-image.jpg

Expected Response:
- Status: 404 Not Found
- Message: "Camp list item with ID 99999 not found"
```

#### **Test Case 6: Invalid File Type**
```
Request:
- camp_list_item_id: 123
- image: document.pdf

Expected Response:
- Status: 400 Bad Request
- Message: "Invalid file type. Only image files..."
```

---

## 🔒 **Security & Validation**

### **File Security**
- ✅ **File Type Validation**: Only allows image files
- ✅ **Unique Filenames**: UUID-based naming prevents conflicts
- ✅ **Organized Storage**: Structured folder hierarchy

### **Data Validation**
- ✅ **Camp List Item Existence**: Verifies item exists before upload
- ✅ **Input Sanitization**: Validates all input parameters
- ✅ **Type Safety**: Ensures numeric IDs are valid

### **Error Handling**
- ✅ **Comprehensive Error Messages**: Clear error descriptions
- ✅ **Transaction Safety**: Database updates only after successful S3 upload
- ✅ **Logging**: Detailed console logs for debugging

---

## 📊 **S3 Storage Structure**

```
S3 Bucket (BUCKET_NAME_PATIENT_ID_PROOF)
└── user{driver_id}/
    └── idproof/
        └── {uuid}.{extension}
```

### **Example**
```
S3 Bucket
└── user456/
    └── idproof/
        └── a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg
```

---

## 🚀 **Migration Guide**

### **For Frontend Applications**

#### **Before**
```javascript
const formData = new FormData();
formData.append('driver_id', driverId);
formData.append('camp_id', campId);
formData.append('image', imageFile);
```

#### **After**
```javascript
const formData = new FormData();
formData.append('camp_list_item_id', campListItemId);
formData.append('image', imageFile);
```

### **For API Consumers**

1. **Update Request Parameters**: Replace `driver_id` and `camp_id` with `camp_list_item_id`
2. **Update Response Handling**: Response now includes `camp_list_item_id` in the data
3. **Update Error Handling**: Error messages now reference camp list item ID

---

## ✅ **Summary**

The updated API provides a more streamlined and efficient way to upload ID proof images:

- **Simplified Parameters**: Only requires camp list item ID
- **Better Performance**: Single database query instead of multiple
- **Direct Identification**: No need to combine driver and camp IDs
- **Maintained Functionality**: All existing features preserved
- **Backward Compatible Response**: Includes all necessary information in response

This change makes the API more intuitive and efficient for frontend applications that typically work with camp list item IDs directly.
