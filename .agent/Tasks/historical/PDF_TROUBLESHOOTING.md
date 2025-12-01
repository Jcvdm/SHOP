# PDF Generation Troubleshooting Guide

## Quick Test

Before troubleshooting, test if Puppeteer is working:

```bash
# Visit this endpoint in your browser or with curl
http://localhost:5173/api/test-puppeteer
```

If this returns `success: true`, Puppeteer is working correctly and the issue is elsewhere.

---

## Common Errors and Solutions

### 1. "Failed to launch Chrome browser"

**Symptoms:**
- Error message: "Failed to launch Chrome browser. Ensure Puppeteer is installed correctly"
- PDF generation fails immediately

**Causes:**
- Puppeteer not installed
- Chrome binary missing
- Insufficient permissions

**Solutions:**

#### A. Reinstall Puppeteer
```bash
# Remove and reinstall Puppeteer
npm uninstall puppeteer
npm install puppeteer --force

# Or with specific version
npm install puppeteer@21.6.1
```

#### B. Check if Chrome was downloaded
```bash
# Check if Chromium exists
ls node_modules/puppeteer/.local-chromium/

# On Windows
dir node_modules\puppeteer\.local-chromium\
```

If the directory is empty, Puppeteer didn't download Chrome. Try:
```bash
# Set environment variable and reinstall
set PUPPETEER_SKIP_DOWNLOAD=false
npm install puppeteer --force
```

#### C. Use system Chrome (alternative)
If Puppeteer's Chrome won't work, use your system Chrome:

Edit `src/lib/utils/pdf-generator.ts`:
```typescript
browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Windows
    // executablePath: '/usr/bin/google-chrome', // Linux
    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Mac
    args: [...]
});
```

---

### 2. "PDF generation timed out"

**Symptoms:**
- Error message: "PDF generation timed out after 30000ms"
- Takes a long time before failing

**Causes:**
- Slow system
- Insufficient memory
- Chrome taking too long to start
- Complex HTML taking too long to render

**Solutions:**

#### A. Increase timeout
Edit the API endpoint (e.g., `src/routes/api/generate-report/+server.ts`):
```typescript
const pdfBuffer = await generatePDF(html, {
    format: 'A4',
    margin: { ... },
    timeout: 60000, // Increase to 60 seconds
    retries: 3 // Increase retries
});
```

#### B. Check system resources
- Close other applications
- Check available RAM (Chrome needs ~200-300MB per instance)
- Check disk space

#### C. Simplify HTML
- Remove large images
- Reduce number of photos per page
- Split large documents into smaller ones

---

### 3. "Browser crashed during PDF generation"

**Symptoms:**
- Error message: "Protocol error" or "Browser crashed"
- Works sometimes, fails other times

**Causes:**
- Insufficient memory
- Chrome process killed by system
- Resource limits exceeded

**Solutions:**

#### A. Add more memory to Chrome
Edit `src/lib/utils/pdf-generator.ts`:
```typescript
browser = await puppeteer.launch({
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--max-old-space-size=4096', // Add this: 4GB memory limit
        '--disable-software-rasterizer',
        '--disable-extensions'
    ]
});
```

#### B. Process one document at a time
Don't generate multiple PDFs simultaneously. Wait for one to complete before starting the next.

---

### 4. "Failed to upload PDF to storage"

**Symptoms:**
- PDF generates successfully
- Error occurs during Supabase upload
- Error message: "Failed to upload PDF to storage"

**Causes:**
- Supabase storage bucket doesn't exist
- Insufficient permissions
- Network issues
- File too large

**Solutions:**

#### A. Check Supabase Storage
1. Go to Supabase Dashboard → Storage
2. Ensure `documents` bucket exists
3. Check bucket is **public** (or has correct policies)

#### B. Check file size limits
Supabase free tier has limits:
- Max file size: 50MB
- Check PDF size in console logs

#### C. Check storage policies
Ensure storage policies allow uploads:
```sql
-- In Supabase SQL Editor
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');
```

---

### 5. "JSON.parse: unexpected character at line 1"

**Symptoms:**
- Error in browser console
- Error message: "SyntaxError: JSON.parse: unexpected character at line 1"

**Causes:**
- Server returning HTML error page instead of JSON
- Usually means the API endpoint crashed

**Solutions:**

#### A. Check server console
Look for the actual error in your terminal where `npm run dev` is running. The real error will be there.

#### B. Check browser Network tab
1. Open DevTools → Network
2. Find the failed request (e.g., `/api/generate-report`)
3. Click on it → Response tab
4. You'll see the actual HTML error page

#### C. This error is now handled
The latest code improvements handle this gracefully and show the real error message.

---

### 6. Antivirus Blocking Chrome

**Symptoms:**
- Works on some computers, not others
- "Access denied" or "Permission denied" errors
- Chrome process starts but immediately closes

**Solutions:**

#### A. Add exception to antivirus
Add these to your antivirus whitelist:
- `node_modules/puppeteer/.local-chromium/`
- `node.exe`
- Your project directory

#### B. Temporarily disable antivirus
Test if it works with antivirus disabled (for testing only).

---

## Debugging Steps

### Step 1: Test Puppeteer Installation
```bash
# Visit test endpoint
curl http://localhost:5173/api/test-puppeteer
```

### Step 2: Check Server Logs
Look at your terminal where `npm run dev` is running. All errors are logged there with full stack traces.

### Step 3: Check Browser Console
Open DevTools → Console. Look for detailed error messages.

### Step 4: Check Network Tab
DevTools → Network → Find failed request → Check Response

### Step 5: Test with Simple HTML
Try generating a PDF with minimal HTML to isolate the issue.

---

## Performance Optimization

### Reduce PDF Generation Time

1. **Use smaller images**
   - Compress photos before uploading
   - Resize to reasonable dimensions (1200px max width)

2. **Limit photos per page**
   - Don't put 50 photos in one PDF
   - Split into multiple documents

3. **Optimize HTML**
   - Remove unnecessary CSS
   - Avoid complex layouts
   - Use simple fonts

4. **Reuse browser instance** (advanced)
   - Keep browser open between requests
   - Reuse pages instead of creating new ones
   - Requires more complex code

---

## Alternative Solutions

If Puppeteer continues to cause issues:

### Option 1: Use Playwright
Similar to Puppeteer but more reliable:
```bash
npm install playwright
```

### Option 2: Use Cloud Service
Use a PDF generation API:
- PDFShift
- DocRaptor
- HTML2PDF.app

### Option 3: Client-Side Generation
Use `jsPDF` + `html2canvas` (lower quality but no server requirements)

---

## Getting Help

When asking for help, provide:

1. **Error message** from server console (full stack trace)
2. **Error message** from browser console
3. **Network response** from DevTools
4. **Test endpoint result** from `/api/test-puppeteer`
5. **System info**: OS, RAM, Node version
6. **What you tried** from this guide

---

## Success Checklist

✅ Test endpoint returns success  
✅ Server console shows "Browser launched successfully"  
✅ Server console shows "PDF generated successfully"  
✅ No timeout errors  
✅ Supabase storage shows uploaded file  
✅ Download button works  

If all checked, PDF generation is working correctly!

