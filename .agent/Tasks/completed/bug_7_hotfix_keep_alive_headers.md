# Bug #7 Hotfix: Invalid Keep-Alive Header

## Status: RESOLVED ✅
**Issue Date**: 2025-01-12 (immediately after Bug #7 fix)  
**Resolution Date**: 2025-01-12  
**Severity**: Critical (blocking application startup)

---

## Problem Description

After applying the Bug #7 fix, the application failed to start with the error:
```
InvalidArgumentError: invalid keep-alive header
code: 'UND_ERR_INVALID_ARG'
```

**Error Details**:
- Error occurred in undici (Node.js fetch implementation)
- Caused by Keep-Alive header format: `'Keep-Alive': 'timeout=60, max=100'`
- Affected both server-side and SSR Supabase clients
- Application completely unable to make Supabase Auth requests

---

## Root Cause

The Bug #7 fix added Keep-Alive headers to improve connection pooling:
```javascript
headers: {
  'Connection': 'keep-alive',
  'Keep-Alive': 'timeout=60, max=100'  // ← Invalid format for undici
}
```

**Why it failed**:
1. Node.js uses `undici` library for fetch (since Node 18+)
2. Undici has strict validation for Keep-Alive header format
3. The format `timeout=60, max=100` is rejected by undici's header parser
4. Undici manages connection pooling internally and doesn't need manual Keep-Alive headers

---

## Solution

**Removed Keep-Alive headers from 2 files**:

### File 1: `src/lib/supabase-server.ts`
**Before**:
```javascript
headers: {
  'x-client-info': 'claimtech-server',
  'Connection': 'keep-alive',
  'Keep-Alive': 'timeout=60, max=100'
}
```

**After**:
```javascript
headers: {
  'x-client-info': 'claimtech-server'
}
```

### File 2: `src/hooks.server.ts`
**Before**:
```javascript
headers: {
  'x-client-info': 'claimtech-ssr',
  'Connection': 'keep-alive',
  'Keep-Alive': 'timeout=60, max=100'
}
```

**After**:
```javascript
headers: {
  'x-client-info': 'claimtech-ssr'
}
```

---

## Why This Still Works

**Connection pooling is handled automatically by undici**:
- Undici maintains persistent connections by default
- HTTP/1.1 uses keep-alive connections automatically
- No performance loss from removing manual headers
- Actually more reliable since undici manages it internally

**Bug #7 fixes remain effective**:
1. ✅ Optimized FRC query (73-94% faster)
2. ✅ Database indexes (applied)
3. ✅ 30s timeout (still configured - the important part)
4. ✅ Graceful fallback (still works)
5. ✅ Better error messages (still works)

---

## Files Modified

1. `src/lib/supabase-server.ts` - Removed Keep-Alive headers (lines 30-33)
2. `src/hooks.server.ts` - Removed Keep-Alive headers (lines 47-50)

---

## Testing

**Verification**:
- ✅ TypeScript compilation: No errors
- ✅ Application starts successfully
- ✅ Supabase Auth requests work
- ✅ No undici errors in console

---

## Lessons Learned

1. **Undici manages connection pooling automatically** - Don't add manual Keep-Alive headers
2. **Test immediately after applying fixes** - Catch issues before they reach production
3. **Undici has strict header validation** - Use only standard, well-supported header formats
4. **Connection: keep-alive is redundant** - HTTP/1.1 defaults to persistent connections

---

## Related Documentation

- Original Bug: `.agent/Tasks/completed/bug_7_finalize_force_click_timeout_fix.md`
- Implementation Summary: `.augment/fixes/BUG_7_IMPLEMENTATION_SUMMARY.md`

---

**Resolution Time**: < 5 minutes  
**Impact**: Critical fix applied immediately  
**Production Ready**: Yes ✅

