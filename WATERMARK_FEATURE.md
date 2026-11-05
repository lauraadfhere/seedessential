# Watermark Feature - Implementation Guide

## Overview
This feature adds automatic watermark overlays to all plant images in the Popular Plants section and throughout the product catalog. Watermarks protect your brand and prevent unauthorized use of plant images.

## How It Works

### Safety First: Environment Variable Toggle
The watermark feature is **disabled by default** to prevent image loading errors if the watermark logo hasn't been uploaded yet.

**Environment Variable**: `NEXT_PUBLIC_ENABLE_WATERMARK`
- `false` (default) - Watermarks disabled, images load normally
- `true` - Watermarks enabled on all plant images

### Cloudinary Integration
The watermark is applied dynamically through Cloudinary's transformation API. This means:
- No need to modify original images
- Watermarks are applied on-the-fly during delivery
- Different watermark settings can be used for different contexts
- Zero storage overhead

### Implementation Details

#### 1. Updated `cloudinaryImage()` Function
**File**: `src/lib/cloudinary-client.ts`

Added a `watermark` option to the image transformation function:

```typescript
type ImageOptions = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "scale" | "thumb";
  quality?: "auto" | number;
  format?: "auto" | "webp" | "jpg" | "png";
  watermark?: boolean; // New option
};
```

**Watermark Configuration**:
```typescript
const WATERMARK_ENABLED = process.env.NEXT_PUBLIC_ENABLE_WATERMARK === "true";

const watermarkTransform = (watermark && WATERMARK_ENABLED) 
  ? "/l_tannelli:watermark_logo,w_120,o_40,g_south_east,x_20,y_20" 
  : "";
```

**Safety Check**: Watermark only applies if:
1. The `watermark` parameter is `true` AND
2. The environment variable `NEXT_PUBLIC_ENABLE_WATERMARK` is `"true"`

**Parameters Explained**:
- `l_tannelli:watermark_logo` - Layer overlay using the watermark logo
- `w_120` - Watermark width of 120px
- `o_40` - Opacity at 40% (0-100 scale)
- `g_south_east` - Gravity/position: bottom-right corner
- `x_20,y_20` - Offset 20px from edges

#### 2. Product Card Component
**File**: `src/components/product-card.tsx`

Updated the `ProductVisual` component to automatically add watermarks to plant images:

```typescript
export function ProductVisual({ product, className }: { product: Product; className?: string }) {
  // Add watermark only for plant images
  const useWatermark = product.kind === "plant" && product.image;
  
  return (
    <div className={cn(/* ... */)}>
      {product.image ? (
        <Image
          src={cloudinaryImage(product.image, { 
            width: 640, 
            height: 640,
            watermark: useWatermark // Apply watermark to plants
          })}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="object-cover"
        />
      ) : (/* ... */)}
    </div>
  );
}
```

**Logic**:
- Watermark is applied ONLY to plant images (`product.kind === "plant"`)
- Equipment images do NOT get watermarked
- Only images with valid `product.image` values get watermarked

## Setting Up the Watermark Logo

⚠️ **IMPORTANT**: Complete these steps BEFORE enabling the watermark feature to avoid image loading errors.

### Step 1: Upload Your Logo to Cloudinary

See the detailed guide in `WATERMARK_SETUP_GUIDE.md` for three different upload methods.

**Quick Method - Cloudinary Dashboard**:

1. **Prepare Your Logo**:
   - Recommended format: PNG with transparency
   - Recommended size: 400x400px (will be scaled down)
   - White or light-colored logo works best for visibility
   - Should include your brand name or logo

2. **Upload to Cloudinary**:
   ```bash
   # Using Cloudinary CLI or dashboard
   Upload to folder: tannelli/
   Public ID: watermark_logo
   ```

   Or programmatically:
   ```typescript
   import { cloudinary } from '@/lib/cloudinary';
   
   const result = await cloudinary.uploader.upload('path/to/logo.png', {
     public_id: 'watermark_logo',
     folder: 'tannelli',
     resource_type: 'image'
   });
   ```

3. **Verify Upload**:
   - Check Cloudinary dashboard
   - Look for: `tannelli/watermark_logo`
   - Test URL: `https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/tannelli/watermark_logo.png`

### Step 2: Enable Watermark Feature

Once the logo is uploaded and verified:

1. Open `.env.local` file
2. Find: `NEXT_PUBLIC_ENABLE_WATERMARK=false`
3. Change to: `NEXT_PUBLIC_ENABLE_WATERMARK=true`
4. Save the file
5. Restart your development server

**That's it!** Watermarks will now appear on all plant images.

### Alternative Logo Sources

If you want to use the existing BRAND logo:

```typescript
// In cloudinary-client.ts, change the watermark path:
const watermarkTransform = watermark 
  ? "/l_tannelli:BRAND,w_120,o_40,g_south_east,x_20,y_20" 
  : "";
```

Or upload `public/BRAND.png` or `public/BRAND3.png` to Cloudinary first.

## Customization Options

### Position
Change the `g_` (gravity) parameter:
- `g_north_west` - Top-left
- `g_north` - Top-center
- `g_north_east` - Top-right
- `g_west` - Middle-left
- `g_center` - Center
- `g_east` - Middle-right
- `g_south_west` - Bottom-left (current)
- `g_south` - Bottom-center
- `g_south_east` - Bottom-right ✓ (current)

### Size
Change the `w_` parameter:
- `w_80` - Smaller (80px)
- `w_120` - Medium ✓ (current)
- `w_160` - Larger (160px)

### Opacity
Change the `o_` parameter (0-100):
- `o_20` - Very subtle
- `o_40` - Subtle ✓ (current)
- `o_60` - Moderate
- `o_80` - Strong

### Offset
Change `x_` and `y_` values (in pixels):
- `x_10,y_10` - Closer to corner
- `x_20,y_20` - Medium ✓ (current)
- `x_40,y_40` - Further from corner

### Example Configurations

**Centered Watermark**:
```typescript
"/l_tannelli:watermark_logo,w_200,o_30,g_center"
```

**Top-Right Corner**:
```typescript
"/l_tannelli:watermark_logo,w_100,o_50,g_north_east,x_15,y_15"
```

**Diagonal Pattern (Multiple Watermarks)**:
```typescript
"/l_tannelli:watermark_logo,w_120,o_20,g_center/l_tannelli:watermark_logo,w_80,o_15,g_south_east,x_20,y_20"
```

## Testing

### Verify Watermarks Are Working

1. **Check Product Images**:
   ```
   Visit: /shop?kind=plant
   ```
   All plant images should show the watermark in the bottom-right corner.

2. **Check Home Page**:
   ```
   Visit: / (homepage)
   ```
   Popular Plants section should have watermarked images.

3. **Verify Equipment Is NOT Watermarked**:
   ```
   Visit: /shop?kind=equipment
   ```
   Equipment images should NOT have watermarks.

4. **Test Individual Product Pages**:
   ```
   Visit: /shop/monstera-deliciosa
   ```
   Main product image should have watermark.

### Debug Checklist

- [ ] Watermark logo uploaded to Cloudinary
- [ ] Logo path matches: `tannelli/watermark_logo`
- [ ] Plant images have `product.kind === "plant"`
- [ ] Images have valid `product.image` values
- [ ] Cloudinary cloud name is set in `.env.local`
- [ ] Browser cache cleared (Ctrl+Shift+R)

## Extending Watermarks

### Add Watermarks to Other Image Types

**Expert Profile Pictures**:
```typescript
// In expert profile component
<img 
  src={cloudinaryImage(expert.profilePicture, { 
    width: 300, 
    height: 300,
    watermark: true 
  })} 
/>
```

**Project Images**:
```typescript
// In project gallery
<img 
  src={cloudinaryImage(project.image, { 
    width: 800,
    watermark: true 
  })} 
/>
```

### Conditional Watermarks

Apply watermarks based on user role:
```typescript
const useWatermark = 
  product.kind === "plant" && 
  !user?.isPremium && // Premium users see without watermark
  product.image;
```

## Performance Impact

- **No Performance Impact**: Watermarks are applied by Cloudinary's CDN
- **Cached Results**: Once generated, watermarked images are cached
- **Fast Delivery**: Same speed as non-watermarked images
- **Bandwidth**: No additional bandwidth cost

## Security Benefits

1. **Brand Protection**: Prevents unauthorized use of your plant images
2. **Attribution**: Always shows your brand on images
3. **Marketing**: Free advertising when images are shared
4. **Professionalism**: Shows attention to detail and brand consistency

## Future Enhancements

1. **Dynamic Watermarks**: Different watermarks per seller/provider
2. **Text Watermarks**: Add product name or SKU
3. **Seasonal Watermarks**: Change watermark based on season/promotion
4. **User-Based**: Remove watermark for logged-in premium users
5. **Admin Control**: Toggle watermark on/off per product in admin panel

## Files Modified

- `src/lib/cloudinary-client.ts` - Added watermark parameter
- `src/components/product-card.tsx` - Applied watermark to plants
- `WATERMARK_FEATURE.md` - This documentation

## Migration Notes

No database changes required. This is a frontend-only feature that leverages Cloudinary's transformation API.

Simply upload your watermark logo to Cloudinary and the feature is live!
