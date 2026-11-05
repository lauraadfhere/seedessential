# Expert Verification Feature - Implementation Summary

## Overview
This feature implements a comprehensive expert verification system where users signing up as experts must provide profile pictures, expertise details, and verification documents for admin approval before their accounts become active.

## Database Changes

### Updated Tables

#### `users` table
- **Added field**: `profile_picture_url VARCHAR(1000)` - Stores Cloudinary URL of user's profile picture

#### `expert_profiles` table
- **Added fields**:
  - `status ENUM('pending','active','suspended','rejected')` - Added 'rejected' status
  - `verification_documents JSON` - Stores array of uploaded document metadata
  - `rejection_reason TEXT` - Reason for rejection (if applicable)
  - `verified_at DATETIME NULL` - Timestamp when expert was verified
  - `verified_by BIGINT UNSIGNED NULL` - Foreign key to admin user who verified
  - **Foreign key**: `FOREIGN KEY(verified_by) REFERENCES users(id)`

## New Components

### 1. `ImageUploader` Component
**Location**: `src/components/image-uploader.tsx`

**Features**:
- Upload images to Cloudinary with signed uploads
- Preview uploaded images
- Remove and re-upload functionality
- File type and size validation
- Support for different Cloudinary folders (profiles, products, experts, etc.)

**Props**:
```typescript
{
  label?: string;
  value?: string; // Cloudinary URL
  onChange: (url: string, publicId: string) => void;
  folder?: "profiles" | "products" | "guides" | "experts" | "projects";
  required?: boolean;
  maxSizeMB?: number;
  acceptedTypes?: string[];
}
```

### 2. `DocumentUploader` Component
**Location**: `src/components/document-uploader.tsx`

**Features**:
- Upload multiple documents (PDF, JPG, PNG)
- Display uploaded documents with file info
- View and remove individual documents
- File type and size validation
- Maximum file limit support

**Props**:
```typescript
{
  label?: string;
  description?: string;
  value: UploadedDocument[];
  onChange: (documents: UploadedDocument[]) => void;
  folder?: string;
  required?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  acceptedTypes?: string[];
}
```

## Updated Components

### Sign-up Page (`src/app/[locale]/sign-up/page.tsx`)

**New Features**:
1. **Three-step signup process for experts**:
   - Step 1: Account type selection
   - Step 2: Basic details + Profile picture
   - Step 3: Expert verification (expertise, bio, documents)

2. **Two-step signup for non-experts**:
   - Step 1: Account type selection
   - Step 2: Basic details + Profile picture

3. **New State Variables**:
   ```typescript
   const [profilePicture, setProfilePicture] = useState("");
   const [profilePicturePublicId, setProfilePicturePublicId] = useState("");
   const [expertise, setExpertise] = useState("");
   const [bio, setBio] = useState("");
   const [experienceYears, setExperienceYears] = useState("");
   const [verificationDocs, setVerificationDocs] = useState([]);
   ```

4. **Expert Account Creation Flow**:
   - Profile picture upload (required for all users)
   - Expert-specific fields (expertise, bio, experience)
   - Document uploads (certificates, licenses)
   - Account status set to 'pending'
   - ExpertProfile created with verification documents
   - User redirected to dashboard with pending status message

## New API Endpoints

### `/api/admin/experts` (GET)
**Purpose**: Fetch all expert profiles for admin review

**Response**:
```json
[
  {
    "id": "expertProfileId",
    "userId": "userId",
    "name": "John Doe",
    "email": "john@example.com",
    "profilePicture": "https://cloudinary.../image.jpg",
    "slug": "john-doe",
    "professionalCategory": "Horticulture",
    "bio": "...",
    "experienceYears": 10,
    "status": "pending",
    "verificationDocuments": [
      {
        "name": "certificate.pdf",
        "url": "https://cloudinary.../cert.pdf",
        "publicId": "...",
        "type": "application/pdf"
      }
    ],
    "createdAt": "2024-01-01T00:00:00Z",
    "verifiedAt": null,
    "rejectionReason": null
  }
]
```

### `/api/admin/experts` (POST)
**Purpose**: Approve or reject expert verification

**Request Body**:
```json
{
  "expertId": "expertProfileId",
  "action": "approve" | "reject",
  "rejectionReason": "Optional reason for rejection"
}
```

**Actions**:

**Approve**:
- Sets expert status to 'active'
- Sets user status to 'active'
- Records verification timestamp and admin
- Clears rejection reason

**Reject**:
- Sets expert status to 'rejected'
- Keeps user status as 'pending'
- Stores rejection reason
- Allows resubmission

## User Experience Flow

### For Expert Applicants:

1. **Sign Up**
   - Select "Expert" account type
   - Accept terms and conditions
   - Click "Continue"

2. **Basic Information**
   - Enter name, email, password
   - **Upload profile picture (required)**
   - Click "Continue to Verification"

3. **Expert Verification**
   - Enter area of expertise
   - Write professional bio
   - Specify years of experience
   - **Upload verification documents (required)**
   - Submit for verification

4. **Post-Submission**
   - Account created with 'pending' status
   - Cannot access full expert features until approved
   - Dashboard shows "Pending Verification" message
   - Receives email notification once approved/rejected

### For Administrators:

1. **Access Admin Panel**
   - Navigate to `/admin`
   - Click "Experts" workspace

2. **Review Expert Applications**
   - View list of pending experts
   - See profile picture, bio, experience
   - **View/download verification documents**
   - Check credentials

3. **Take Action**
   - **Approve**: Expert account activated, gains full access
   - **Reject**: Expert receives notification with reason, can resubmit

## Design Updates

### Bosch Sans Font
- Applied to login and signup pages for professional look
- Font file: `public/boschsans_regular.otf`
- CSS class: `.font-boschsans`

### Reduced Border Radius
- Changed from `rounded-xl` (0.75rem) to `rounded-md` (0.375rem)
- Affects: inputs, buttons, cards, containers
- Creates sharper, more professional appearance

## Security Features

1. **Signed Uploads**: All file uploads use Cloudinary signed upload API
2. **File Validation**: Type and size checks before upload
3. **Admin-Only Access**: Expert verification endpoints require admin role
4. **Master Key Usage**: Parse queries use master key for security
5. **Status Checks**: Users cannot access features without proper status

## Future Enhancements

1. **Email Notifications**
   - Welcome email on signup
   - Verification submitted confirmation
   - Approval/rejection notifications

2. **Expert Dashboard**
   - View verification status
   - Resubmit documents if rejected
   - Track application progress

3. **Admin Dashboard**
   - Dedicated expert verification page
   - Document viewer
   - Batch approval/rejection
   - Search and filter experts

4. **Document Management**
   - Document expiry tracking
   - Re-verification requests
   - Additional document types

## Files Modified/Created

### Created:
- `src/components/image-uploader.tsx`
- `src/components/document-uploader.tsx`
- `src/app/api/admin/experts/route.ts`
- `EXPERT_VERIFICATION_FEATURE.md`

### Modified:
- `database/schema.sql` - Added fields to users and expert_profiles
- `src/app/[locale]/sign-up/page.tsx` - Multi-step verification flow
- `src/app/globals.css` - Bosch Sans font and styling
- `src/components/deep-ui.tsx` - Reduced border radius
- `src/app/[locale]/sign-in/page.tsx` - Border radius updates

## Testing Checklist

- [ ] Expert signup flow completes successfully
- [ ] Profile picture uploads to Cloudinary
- [ ] Verification documents upload correctly
- [ ] Admin can view pending experts
- [ ] Admin can approve expert
- [ ] Admin can reject expert with reason
- [ ] Non-expert signup still works (2-step process)
- [ ] Profile picture required for all account types
- [ ] Pending experts cannot access restricted features
- [ ] Approved experts gain full access

## Migration Notes

To apply these changes to an existing database:

```sql
-- Add profile picture to users
ALTER TABLE users 
ADD COLUMN profile_picture_url VARCHAR(1000) AFTER status;

-- Update expert_profiles table
ALTER TABLE expert_profiles 
MODIFY COLUMN status ENUM('pending','active','suspended','rejected') DEFAULT 'pending',
ADD COLUMN verification_documents JSON AFTER availability,
ADD COLUMN rejection_reason TEXT AFTER verification_documents,
ADD COLUMN verified_at DATETIME NULL AFTER rejection_reason,
ADD COLUMN verified_by BIGINT UNSIGNED NULL AFTER verified_at,
ADD FOREIGN KEY (verified_by) REFERENCES users(id);
```
