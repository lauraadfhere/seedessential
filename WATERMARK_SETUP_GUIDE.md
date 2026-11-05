# Quick Watermark Setup Guide

## Current Status
⚠️ **Watermark is currently DISABLED** to prevent image loading errors.

Images are loading normally without watermarks. The watermark feature is ready but needs activation.

## Why Images Were Not Loading
The watermark feature was trying to apply a logo that doesn't exist yet in your Cloudinary account, causing the images to fail. 

**Solution**: We've added an environment variable toggle so watermarks are only applied when explicitly enabled.

## How to Enable Watermarks (3 Steps)

### Step 1: Prepare Your Watermark Logo

Create or use an existing logo file:
- **Format**: PNG with transparent background (recommended)
- **Size**: 400x400px or similar (will be scaled to 120px)
- **Color**: White or light color works best for visibility
- **Content**: Your brand logo or text

**Example**: Use `public/BRAND.png` or `public/BRAND3.png` from your project

### Step 2: Upload to Cloudinary

**Option A - Using Cloudinary Dashboard** (Easiest):

1. Log in to Cloudinary dashboard: https://cloudinary.com/console
2. Go to "Media Library"
3. Navigate to or create folder: `tannelli/`
4. Click "Upload" button
5. Select your logo file
6. After upload, rename the file:
   - Click on the uploaded image
   - Change "Public ID" to: `watermark_logo`
   - Make sure folder is: `tannelli/`
   - Final path should be: `tannelli/watermark_logo`

**Option B - Using Node.js Script**:

Create a file `scripts/upload-watermark.js`:

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

cloudinary.uploader.upload('public/BRAND.png', {
  public_id: 'watermark_logo',
  folder: 'tannelli',
  overwrite: true
})
.then(result => {
  console.log('✅ Watermark uploaded successfully!');
  console.log('Public ID:', result.public_id);
  console.log('URL:', result.secure_url);
})
.catch(error => {
  console.error('❌ Upload failed:', error);
});
```

Run with:
```bash
node scripts/upload-watermark.js
```

**Option C - Using Cloudinary CLI**:

```bash
# Install CLI
npm install -g cloudinary-cli

# Configure
cld config

# Upload
cld uploader upload public/BRAND.png folder=tannelli public_id=watermark_logo
```

### Step 3: Enable Watermark Feature

1. Open `.env.local` file
2. Find this line:
   ```
   NEXT_PUBLIC_ENABLE_WATERMARK=false
   ```
3. Change it to:
   ```
   NEXT_PUBLIC_ENABLE_WATERMARK=true
   ```
4. Save the file
5. Restart your development server:
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

## Verify It's Working

1. **Check Cloudinary**:
   - Visit: `https://res.cloudinary.com/n08p7st8/image/upload/tannelli/watermark_logo.png`
   - You should see your watermark logo

2. **Check Homepage**:
   - Visit: `http://localhost:3000`
   - Scroll to "Popular Plants" section
   - Plant images should have watermark in bottom-right corner

3. **Check Shop Page**:
   - Visit: `http://localhost:3000/en/shop?kind=plant`
   - All plant cards should show watermark
   - Equipment should NOT show watermark (feature is plants-only)

## Troubleshooting

### Images Still Not Loading?

**Check 1**: Verify the watermark exists
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/tannelli/watermark_logo.png
```
Replace `YOUR_CLOUD_NAME` with your actual cloud name.

**Check 2**: Verify environment variable
```bash
# In your terminal
echo $NEXT_PUBLIC_ENABLE_WATERMARK
```
Should output: `true`

**Check 3**: Server restarted?
After changing `.env.local`, you MUST restart the dev server.

**Check 4**: Disable watermark temporarily
Set `NEXT_PUBLIC_ENABLE_WATERMARK=false` to see if images load without watermark.

### Watermark Too Big/Small?

Edit `src/lib/cloudinary-client.ts` and adjust:

```typescript
// Current: w_120 (120px wide)
const watermarkTransform = (watermark && WATERMARK_ENABLED) 
  ? "/l_tannelli:watermark_logo,w_120,o_40,g_south_east,x_20,y_20" 
  : "";

// Make smaller: w_80
// Make larger: w_160
```

### Watermark Too Transparent/Opaque?

Adjust opacity (o_XX):
```typescript
// Current: o_40 (40% opacity)
// More visible: o_60
// More subtle: o_20
```

### Change Watermark Position?

Change gravity (g_XXXX):
```typescript
// Current: g_south_east (bottom-right)
// Options:
// g_north_west    - Top-left
// g_north_east    - Top-right
// g_south_west    - Bottom-left
// g_center        - Center
```

## Customization Examples

### Centered Large Watermark
```typescript
"/l_tannelli:watermark_logo,w_200,o_30,g_center"
```

### Top-Right Small Watermark
```typescript
"/l_tannelli:watermark_logo,w_80,o_50,g_north_east,x_10,y_10"
```

### Multiple Watermarks (Pattern)
```typescript
"/l_tannelli:watermark_logo,w_100,o_20,g_center/l_tannelli:watermark_logo,w_80,o_15,g_south_east,x_20,y_20"
```

## Summary

**Current State**: ✅ Images loading correctly (watermark disabled)

**To Enable Watermarks**:
1. ✅ Upload logo to Cloudinary as `tannelli/watermark_logo`
2. ✅ Set `NEXT_PUBLIC_ENABLE_WATERMARK=true` in `.env.local`
3. ✅ Restart dev server

**Safety**: Watermark only applies when explicitly enabled, preventing accidental image failures.

## Need Help?

If you encounter issues:
1. Check the watermark URL directly in browser
2. Verify environment variable is set
3. Restart dev server
4. Check browser console for errors
5. Temporarily disable watermark to isolate the issue

The feature is production-ready once the logo is uploaded! 🚀
