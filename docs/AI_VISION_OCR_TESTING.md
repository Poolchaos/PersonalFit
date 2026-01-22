# Testing AI Vision OCR (Phase 2)

This guide covers testing the Claude Vision API integration for medication bottle label extraction.

## Prerequisites

1. **Anthropic API Key**
   - Sign up at https://console.anthropic.com/
   - Create an API key
   - Add to your `.env` file: `ANTHROPIC_API_KEY=sk-ant-...`

2. **Docker Environment Running**
   ```bash
   docker-compose up -d
   ```

3. **Test Images**
   - Real medication bottle photos work best
   - Clear, well-lit photos of the label
   - Include dosage information and warnings if visible

## Testing Methods

### Method 1: Backend Script (Quick Test)

Test the OCR service directly without the full application:

```bash
cd backend
npm run test:ocr
```

Or manually:
```bash
cd backend
npx ts-node scripts/test-vision-ocr.ts
```

Expected output:
```
🧪 Testing Claude Vision OCR...
📸 Testing with sample image...
✅ OCR Extraction Successful!

📋 Extracted Data:
{
  "medication_name": "Example Medication",
  "dosage": { "amount": 500, "unit": "mg", "form": "tablet" },
  ...
}
```

### Method 2: API Endpoint Test (curl)

Test the actual API endpoint that the frontend uses:

```bash
# Login first to get a token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  | jq -r '.token')

# Test OCR extraction with an image file
curl -X POST http://localhost:5000/api/medications/extract-from-image \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/medication-bottle.jpg"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "medication_name": "Ibuprofen",
    "dosage": {
      "amount": 200,
      "unit": "mg",
      "form": "tablet"
    },
    "frequency": {
      "times_per_day": 3,
      "notes": "Take with food"
    },
    "warnings": ["Do not exceed 1200mg per day"],
    "health_tags": ["pain_relief", "anti_inflammatory"],
    "confidence_score": 0.92
  }
}
```

### Method 3: Frontend UI Test (Full Flow)

1. **Navigate to Medications Page**
   - Go to http://localhost:3000
   - Login or create account
   - Click "Health" → "Medications" in nav

2. **Add New Medication**
   - Click "Add Medication" button
   - See "Scan Medication Bottle (Optional)" section at top

3. **Upload/Capture Photo**
   - Click "📤 Upload Photo" to select from file system
   - OR Click "📷 Take Photo" to use device camera
   - Choose a clear photo of medication bottle label

4. **Verify Extraction**
   - Wait for processing (Claude API call)
   - Check that form fields auto-fill with extracted data:
     - Medication Name
     - Dosage (Amount, Unit, Form)
     - Frequency
     - Warnings (if any)
     - Health Tags
   - Review confidence score (shown in UI)

5. **Manual Correction (if needed)**
   - Modify any incorrectly extracted fields
   - Click "Update Medication" to save with corrections

6. **Verify Image Storage**
   - After saving, the medication card should show the bottle image
   - Image should be accessible in MinIO (http://localhost:9003)
   - Bucket: `personalfit-photos`
   - Path: `medications/{userId}/medication-bottle-{timestamp}.jpg`

## Common Issues & Solutions

### Issue: "API key not found"
**Solution:** Ensure `ANTHROPIC_API_KEY` is set in `.env` and backend container restarted
```bash
docker-compose restart backend
```

### Issue: "Confidence score very low (<0.5)"
**Causes:**
- Poor image quality (blurry, dark, angled)
- Label text too small
- Multiple labels in frame

**Solutions:**
- Retake photo with better lighting
- Get closer to label
- Ensure label is flat and centered

### Issue: "Extraction returns empty/incorrect data"
**Possible causes:**
- Non-English labels (Claude supports multiple languages but accuracy varies)
- Handwritten labels
- Very faded/damaged labels

**Solutions:**
- Try manual entry instead
- Use the correction flow to fix extracted data

### Issue: Image upload fails
**Check:**
1. MinIO is running: `docker ps | grep minio`
2. MinIO accessible: http://localhost:9003
3. Bucket exists: `personalfit-photos`
4. Network connectivity between backend and MinIO

## Performance Expectations

- **Average extraction time:** 2-4 seconds
- **Typical confidence scores:**
  - Clear, professional labels: 0.85-0.95
  - Consumer photos: 0.70-0.85
  - Poor quality: <0.70 (manual review recommended)

## Cost Considerations

Claude Vision API pricing (as of 2026):
- ~$0.008 per image (Claude 3.5 Sonnet)
- Includes structured output extraction
- No separate transcription costs

For 100 medications/month: ~$0.80
For 1000 medications/month: ~$8.00

## Testing Checklist

- [ ] Backend script test passes
- [ ] API endpoint test passes (curl)
- [ ] Frontend photo upload works
- [ ] Frontend camera capture works
- [ ] Form auto-fills with extracted data
- [ ] Confidence score displays correctly
- [ ] Manual correction flow works
- [ ] Images save to MinIO
- [ ] Images display on medication cards
- [ ] Error handling works (invalid images, API failures)
- [ ] Loading states show during extraction

## Next Steps After Testing

Once OCR is verified working:

1. **Implement Correlation Analysis** (Backend)
   - Statistical calculations for medication impact
   - Background job to analyze dose logs vs metrics

2. **Real Correlation Insights** (Frontend)
   - Replace mock data with real API
   - Add trend charts and visualizations

3. **Production Hardening**
   - Rate limiting on OCR endpoint
   - Image size/format validation
   - Retry logic for API failures
   - Caching for repeated extractions
