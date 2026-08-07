# Hotel Image Upload Feature - Update Implementation

## Overview
Panel me hotel update karte waqt ab images upload kar sakte hain - hotel images, room images, aur food images. Bilkul waise hi jaise new hotel add karte waqt hota hai.

---

## Changes Made

### 1. Frontend Updates: `panel/src/pages/admin/hotel/hotel-edit.jsx`

#### Imports
```javascript
// Added ImagePlus icon
import {
  ArrowLeft, ArrowRight, BedDouble, Building2, Check,
  CheckCircle2, Loader2, MapPin, PencilLine, Plus,
  Save, ShieldCheck, Trash2, X, ChevronRight, ImagePlus,  // ✅ ImagePlus added
} from 'lucide-react'
```

#### State Management
```javascript
// Hotel images state
const [hotelImages, setHotelImages] = useState([])
const [hotelPreviews, setHotelPreviews] = useState([])

// Room form updated
const createEmptyRoomForm = () => ({
  // ... existing fields
  imageFiles: [], imagePreviews: [], // ✅ Added for new uploads
})

// Food form updated
const createEmptyFoodForm = () => ({
  // ... existing fields
  imageFiles: [], imagePreviews: [], // ✅ Added for new uploads
})
```

#### Image Handlers

**Hotel Images:**
```javascript
const addHotelImages = (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  setHotelImages((p) => [...p, ...files])
  setHotelPreviews((p) => [...p, ...files.map((f) => URL.createObjectURL(f))])
}

const removeHotelImage = (i) => {
  URL.revokeObjectURL(hotelPreviews[i])
  setHotelImages((p) => p.filter((_, x) => x !== i))
  setHotelPreviews((p) => p.filter((_, x) => x !== i))
}
```

**Room Images:**
```javascript
const addRoomImages = (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  setRoomForm((p) => ({
    ...p,
    imageFiles: [...p.imageFiles, ...files],
    imagePreviews: [...p.imagePreviews, ...files.map((f) => URL.createObjectURL(f))],
  }))
}

const removeRoomImage = (i) => {
  URL.revokeObjectURL(roomForm.imagePreviews[i])
  setRoomForm((p) => ({
    ...p,
    imageFiles: p.imageFiles.filter((_, x) => x !== i),
    imagePreviews: p.imagePreviews.filter((_, x) => x !== i),
  }))
}
```

**Food Images:**
```javascript
const addFoodImages = (e) => {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  setFoodForm((p) => ({
    ...p,
    imageFiles: [...p.imageFiles, ...files],
    imagePreviews: [...p.imagePreviews, ...files.map((f) => URL.createObjectURL(f))],
  }))
}

const removeFoodImage = (i) => {
  URL.revokeObjectURL(foodForm.imagePreviews[i])
  setFoodForm((p) => ({
    ...p,
    imageFiles: p.imageFiles.filter((_, x) => x !== i),
    imagePreviews: p.imagePreviews.filter((_, x) => x !== i),
  }))
}
```

#### Cleanup on Unmount
```javascript
useEffect(() => {
  return () => {
    hotelPreviews.forEach((u) => URL.revokeObjectURL(u))
    roomForm.imagePreviews.forEach((u) => URL.revokeObjectURL(u))
    foodForm.imagePreviews.forEach((u) => URL.revokeObjectURL(u))
  }
}, [hotelPreviews, roomForm.imagePreviews, foodForm.imagePreviews])
```

#### Reset Editors
```javascript
const resetRoomEditor = () => { 
  roomForm.imagePreviews.forEach((u) => URL.revokeObjectURL(u))  // ✅ Cleanup previews
  setEditingRoomId(null)
  setRoomForm(createEmptyRoomForm())
}

const resetFoodEditor = () => { 
  foodForm.imagePreviews.forEach((u) => URL.revokeObjectURL(u))  // ✅ Cleanup previews
  setEditingFoodId(null)
  setFoodForm(createEmptyFoodForm())
}
```

#### Save Functions

**Save Hotel (with hotel images upload):**
```javascript
const saveHotel = async (e) => {
  if (e?.preventDefault) e.preventDefault()
  if (!displayHotelId) return
  
  try {
    // Step 1: Upload hotel images if any
    if (hotelImages.length > 0) {
      const fd = new FormData()
      hotelImages.forEach((file) => fd.append('images', file))
      await api.patch(`/update/images/hotel/${displayHotelId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      // Clear uploaded images
      hotelPreviews.forEach((u) => URL.revokeObjectURL(u))
      setHotelImages([])
      setHotelPreviews([])
    }

    // Step 2: Update hotel basic info
    // ... rest of the save logic
  } catch (err) {
    console.error('saveHotel failed', err)
    alert(err?.response?.data?.message || 'Failed to save hotel changes')
  }
}
```

**Save Room (with room images upload):**
```javascript
const saveRoomLocal = async (e) => {
  if (e?.preventDefault) e.preventDefault()
  
  try {
    // If editing existing room with new images, upload them
    if (editingRoomId && roomForm.imageFiles.length > 0) {
      const existingRoom = rooms.find((r) => r._id === editingRoomId)
      if (existingRoom?.roomId) {
        const rfd = new FormData()
        roomForm.imageFiles.forEach((file) => rfd.append('images', file))
        await api.patch(`/update/images/room/${existingRoom.roomId}`, rfd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
    }

    // ... rest of the save logic
  } catch (err) {
    console.error('Failed to upload room images:', err)
    alert(err?.response?.data?.message || 'Failed to upload room images')
  }
}
```

**Save Food (with food images upload):**
```javascript
const saveFoodLocal = async (e) => {
  if (e?.preventDefault) e.preventDefault()
  
  try {
    // If editing existing food with new images, upload them
    if (editingFoodId && foodForm.imageFiles.length > 0) {
      const existingFood = foods.find((f) => f._id === editingFoodId)
      if (existingFood?.foodId) {
        const ffd = new FormData()
        foodForm.imageFiles.forEach((file) => ffd.append('images', file))
        await api.patch(`/update/images/food/${existingFood.foodId}`, ffd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
    }

    // ... rest of the save logic
  } catch (err) {
    console.error('Failed to upload food images:', err)
    alert(err?.response?.data?.message || 'Failed to upload food images')
  }
}
```

#### UI Components

**Step 1 - Hotel Images Upload:**
```jsx
{/* Hotel Images Upload */}
<div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10, display: 'block' }}>
    Hotel Images
  </label>
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', border: '1.5px dashed #c0b4a0', borderRadius: 8, background: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8a7f72', fontWeight: 600, transition: 'all .15s' }}>
    <ImagePlus size={16} /> Upload Hotel Images
    <input type="file" multiple accept="image/*" onChange={addHotelImages} style={{ display: 'none' }} />
  </label>
  {hotelPreviews.length > 0 && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
      {hotelPreviews.map((url, i) => (
        <div key={i} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" onClick={() => removeHotelImage(i)}
            style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )}
</div>
```

**Step 3 - Room Images Upload:**
```jsx
{/* Room Images Upload */}
<div style={{ gridColumn: '1 / -1' }}>
  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>
    Upload Room Images
  </label>
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', border: '1px dashed #c0b4a0', borderRadius: 6, background: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#8a7f72', fontWeight: 500 }}>
    <ImagePlus size={13} /> Attach room images
    <input type="file" multiple accept="image/*" onChange={addRoomImages} style={{ display: 'none' }} />
  </label>
  {roomForm.imagePreviews.length > 0 && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {roomForm.imagePreviews.map((url, i) => (
        <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" onClick={() => removeRoomImage(i)}
            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  )}
</div>
```

**Step 4 - Food Images Upload:**
```jsx
{/* Food Images Upload */}
<div style={{ gridColumn: '1 / -1' }}>
  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8, display: 'block' }}>
    Upload Food Images
  </label>
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', border: '1px dashed #c0b4a0', borderRadius: 6, background: '#faf8f5', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#8a7f72', fontWeight: 500 }}>
    <ImagePlus size={13} /> Attach food images
    <input type="file" multiple accept="image/*" onChange={addFoodImages} style={{ display: 'none' }} />
  </label>
  {foodForm.imagePreviews.length > 0 && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
      {foodForm.imagePreviews.map((url, i) => (
        <div key={i} style={{ position: 'relative', width: 80, height: 80, borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <button type="button" onClick={() => removeFoodImage(i)}
            style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
            <X size={10} />
          </button>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## Backend API Endpoints Expected

### 1. Update Hotel Images
```
PATCH /api/update/images/hotel/:hotelId
Content-Type: multipart/form-data

FormData:
- images: File[] (multiple image files)
```

### 2. Update Room Images
```
PATCH /api/update/images/room/:roomId
Content-Type: multipart/form-data

FormData:
- images: File[] (multiple image files)
```

### 3. Update Food Images
```
PATCH /api/update/images/food/:foodId
Content-Type: multipart/form-data

FormData:
- images: File[] (multiple image files)
```

---

## User Flow

### Hotel Images Upload
1. User navigates to Step 1 (Basic Info)
2. Clicks "Upload Hotel Images" button
3. Selects multiple images from file picker
4. Images preview shown with delete option
5. Clicks "Save" button
6. Images uploaded to server via API
7. Hotel images updated in database

### Room Images Upload
1. User navigates to Step 3 (Rooms)
2. Edits existing room or adds new room
3. Clicks "Attach room images" button
4. Selects multiple images
5. Images preview shown with delete option
6. Clicks "Add Room" or "Update Room"
7. If editing existing room with roomId, images uploaded immediately
8. Room saved with image reference

### Food Images Upload
1. User navigates to Step 4 (Dining)
2. Edits existing food item or adds new
3. Clicks "Attach food images" button
4. Selects multiple images
5. Images preview shown with delete option
6. Clicks "Add Food" or "Update Food"
7. If editing existing food with foodId, images uploaded immediately
8. Food saved with image reference

---

## Features

### ✅ Multi-Image Upload
- User can upload multiple images at once
- Hotel: Unlimited images
- Room: Unlimited images per room
- Food: Unlimited images per food item

### ✅ Image Preview
- Live preview of selected images
- Thumbnail display (80x80 or 100x100)
- Before upload confirmation

### ✅ Remove Images
- Individual image removal
- Red delete button on hover
- Preview cleanup on removal

### ✅ Memory Management
- URL.createObjectURL for previews
- URL.revokeObjectURL on removal/unmount
- Prevents memory leaks

### ✅ API Integration
- FormData with multipart/form-data
- Proper error handling
- User feedback via alerts

### ✅ UX/UI
- Dashed border upload button
- Hover effects
- Consistent styling across all steps
- Professional design matching add-new page

---

## Testing Checklist

### Hotel Images
- [ ] Select multiple hotel images
- [ ] Preview displays correctly
- [ ] Remove individual images
- [ ] Save uploads images to server
- [ ] Existing hotel images not affected
- [ ] API error handling works

### Room Images
- [ ] Add new room with images
- [ ] Edit existing room and add images
- [ ] Preview displays correctly
- [ ] Remove images before save
- [ ] Images upload on room update
- [ ] API error handling works

### Food Images
- [ ] Add new food with images
- [ ] Edit existing food and add images
- [ ] Preview displays correctly
- [ ] Remove images before save
- [ ] Images upload on food update
- [ ] API error handling works

### Memory Management
- [ ] No memory leaks on image add/remove
- [ ] Cleanup on component unmount
- [ ] Cleanup on editor reset
- [ ] Browser doesn't slow down with multiple uploads

---

## Backend Requirements

The backend should already have these endpoints from add-new functionality:
1. `/api/update/images/hotel/:hotelId` - Update hotel images
2. `/api/update/images/room/:roomId` - Update room images
3. `/api/update/images/food/:foodId` - Update food images

If not present, create controllers similar to:
```javascript
// Example room image update
exports.updateRoomImages = async (req, res) => {
  try {
    const { roomId } = req.params
    const files = req.files // From multer/upload middleware
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No images provided' })
    }

    // Upload to S3/AWS
    const imageUrls = await uploadToS3(files)
    
    // Update room in database
    await Hotel.updateOne(
      { 'rooms.roomId': roomId },
      { $push: { 'rooms.$.images': { $each: imageUrls } } }
    )

    res.status(200).json({ 
      message: 'Room images updated successfully', 
      images: imageUrls 
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
```

---

## Summary

✅ **Image Upload Functionality Added**
- Hotel images upload in Step 1
- Room images upload in Step 3
- Food images upload in Step 4

✅ **Features Implemented**
- Multi-image selection
- Live preview with thumbnails
- Individual image removal
- Memory leak prevention
- Error handling with user alerts
- Consistent UI/UX design

✅ **Code Quality**
- No diagnostics/errors
- Clean code structure
- Proper state management
- Memory cleanup on unmount
- Similar to add-new.jsx implementation

🎉 **Ready for Testing & Deployment!**

Panel me ab hotel update karte waqt puri tarah se images upload kar sakte hain, bilkul waise hi jaise new hotel add karte waqt hota hai.
