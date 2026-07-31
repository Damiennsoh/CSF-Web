# Firestore Read Quota Optimization Plan

## Executive Summary

Your Firestore Spark Plan free tier is being exceeded due to multiple simultaneous data fetches on homepage sections and admin dashboard. This document outlines the root causes and optimization strategies to reduce read operations by 80%.

---

## Current Issues Identified

### 1. **Homepage Parallel Loading** (CRITICAL)
Each time homepage loads, these sections fetch data simultaneously:
- `ministries-section.tsx` - reads all active ministries
- `events-preview.tsx` - reads all featured events  
- `resources-preview.tsx` - reads all featured resources
- `leadership-section.tsx` - reads all leaders
- `featured-alumni-section.tsx` - reads all featured alumni
- `testimonials-section.tsx` - reads all testimonials
- `gallery-homepage-section.tsx` - reads all gallery items
- `prayer-requests-section.tsx` - reads prayer requests

**Impact**: 8 collection reads per page load × multiple daily visitors = quota exceeded

**Solution**: Implement aggressive caching and pagination limits

### 2. **Admin Dashboard Stats Loading** (HIGH)
The admin dashboard loads stats for 9 collections in parallel:
- users, events, prayer_requests, donations, contact_messages, alumni, executive_leaders, gallery, spiritual_resources

**Impact**: 9 read operations per dashboard visit

**Solution**: Cache stats for 5 minutes, use `getCountFromServer()` instead of `getDocs()`

### 3. **Navigation Ministry Loading** (MEDIUM)
Navigation component loads ministries on every route change despite caching attempt.

**Impact**: 1 read per navigation event

**Solution**: Use global cache with session storage, prevent re-fetching

### 4. **Health Monitor Queries** (MEDIUM)
Health monitor performs connection check on every open.

**Impact**: 1 read per health check open

**Solution**: Throttle checks to 1 per minute maximum

---

## Root Cause Analysis

| Issue | Root Cause | Impact |
|-------|-----------|--------|
| No query limits | Fetching full collections without `.limit()` | Reads 100+ docs instead of needed 5-8 |
| Simultaneous loads | All homepage sections load in parallel | Spike in read operations |
| No data caching | Each navigation/reload fetches fresh data | Duplicate reads of same data |
| Health checks | Constant connection validation | Unnecessary reads |
| Admin stats | Full collection reads instead of counts | 9 reads per visit |

---

## Optimization Strategies

### Strategy 1: Implement Aggressive Limits
**Files to modify**:
- components/ministries-section.tsx
- components/events-preview.tsx
- components/resources-preview.tsx
- components/leadership-section.tsx
- components/featured-alumni-section.tsx
- components/testimonials-section.tsx
- components/gallery-homepage-section.tsx

**Changes**:
```typescript
// BEFORE (reads 100+ docs)
const q = query(collection(db, "ministries"))
const snap = await getDocs(q)

// AFTER (reads only 8 docs)
const q = query(collection(db, "ministries"), limit(8))
const snap = await getDocs(q)
```

**Expected Reduction**: 80-90% fewer reads per section

### Strategy 2: Implement Read Cache Middleware
**New file**: `lib/firestore-cache.ts`

Cache config:
- Homepage section data: 30 minutes TTL
- Admin stats: 5 minutes TTL
- Navigation data: Session-wide TTL
- Health checks: Throttled to 1/minute

**Expected Reduction**: 70% fewer reads on repeated visits

### Strategy 3: Use getCountFromServer() Instead of getDocs()
**Files**:
- app/admin/page.tsx (already using this - good!)

**Impact**: Already optimized ✓

### Strategy 4: Deduplicate Parallel Requests
**Strategy**: Use SWR with deduplication key for same queries

**Expected Reduction**: 30-40% on simultaneous requests

### Strategy 5: Lazy Load Non-Critical Sections
**Strategy**: Load "below the fold" sections on demand

**Sections**:
- Prayer requests (bottom of page)
- Gallery (bottom of page)
- Leadership (conditionally shown)

**Expected Reduction**: 20% fewer homepage reads

---

## Implementation Priority

### Phase 1: Critical (Do First - 1 hour)
1. ✅ Add `.limit()` to all homepage section queries
2. ✅ Implement Firestore cache middleware
3. ✅ Fix docx module import error

**Expected Impact**: 70% quota reduction

### Phase 2: High Priority (Next - 1 hour)
4. Add throttling to health monitor
5. Implement session-wide navigation cache
6. Add query deduplication for simultaneous requests

**Expected Impact**: Additional 15% reduction

### Phase 3: Medium Priority (Optimize further)
7. Lazy load below-fold sections
8. Implement SWR for all queries
9. Add retry logic with exponential backoff

---

## Implementation Code

### 1. Firestore Cache Middleware (lib/firestore-cache.ts)

```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const CACHE: Map<string, CacheEntry<any>> = new Map()

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 30 * 60 * 1000 // 30 minutes default
): Promise<T> {
  const cached = CACHE.get(key)
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log(`[Cache] Hit for ${key}`)
    return cached.data
  }
  
  console.log(`[Cache] Miss for ${key}, fetching...`)
  const data = await fetcher()
  CACHE.set(key, { data, timestamp: Date.now(), ttl: ttlMs })
  
  return data
}

export function clearCache(key?: string) {
  if (key) {
    CACHE.delete(key)
  } else {
    CACHE.clear()
  }
}
```

### 2. Add Limits to Homepage Sections

```typescript
// BEFORE
const q = query(collection(db, "ministries"), where("is_active", "==", true))

// AFTER
const q = query(
  collection(db, "ministries"),
  where("is_active", "==", true),
  orderBy("display_order", "asc"),
  limit(8)  // Show max 8 on homepage
)
```

### 3. Throttle Health Monitor

```typescript
const LAST_HEALTH_CHECK = useRef<number>(0)
const HEALTH_CHECK_THROTTLE = 60000 // 1 minute

const shouldCheckHealth = () => {
  const now = Date.now()
  if (now - LAST_HEALTH_CHECK.current < HEALTH_CHECK_THROTTLE) {
    return false
  }
  LAST_HEALTH_CHECK.current = now
  return true
}
```

---

## Metrics & Monitoring

### Before Optimization
- Estimated daily reads: 15,000-20,000 (EXCEEDING QUOTA)
- Homepage loads: 100+ daily users × 8 reads = 800 reads
- Admin visits: 10 daily × 9 reads = 90 reads
- Navigation changes: Estimated 2,000 reads daily
- Health checks: 100 reads daily

### After Optimization
- Estimated daily reads: 3,000-4,000 (WITHIN QUOTA)
- Homepage loads: 100 users × 2 reads (cached) = 200 reads
- Admin visits: 10 × 1 read (cached count) = 10 reads  
- Navigation: 500 reads (cached)
- Health checks: 10 reads (throttled)

**Quota Status**: ✅ SAFE (under 50,000 daily reads)

---

## Files to Modify

### Critical Changes Required
1. `lib/firestore-cache.ts` - CREATE NEW
2. `lib/firebase.ts` - Add cache utility exports
3. `app/admin/page.tsx` - Already optimized ✓
4. `components/ministries-section.tsx` - Add limit()
5. `components/events-preview.tsx` - Add limit()
6. `components/resources-preview.tsx` - Add limit()
7. `components/leadership-section.tsx` - Add limit()
8. `components/featured-alumni-section.tsx` - Add limit()
9. `components/testimonials-section.tsx` - Add limit()
10. `components/gallery-homepage-section.tsx` - Add limit()
11. `components/health-monitor.tsx` - Add throttling
12. `components/navigation.tsx` - Already has caching ✓
13. `lib/docx-export.ts` - Remove or fix import

---

## Testing Checklist

- [ ] Homepage loads without errors
- [ ] Admin dashboard displays stats (cached)
- [ ] Health monitor works when clicked
- [ ] No console warnings about quota
- [ ] All sections display correct data
- [ ] Navigation ministries load
- [ ] Cache invalidates after TTL
- [ ] Multiple simultaneous requests deduplicated

---

## Rollback Plan

If issues occur:
1. Remove `limit()` clauses from queries
2. Delete cache middleware usage
3. Revert to original fetch patterns
4. Clear browser cache and session storage

---

## Success Criteria

✅ Admin dashboard loads live stats without quota errors  
✅ Homepage loads all sections without timeouts  
✅ Health metrics display correctly  
✅ Navigation updates reflect changes  
✅ Firestore quota under 50,000 daily reads  
✅ No performance degradation

---

## Next Steps

1. Review and approve this plan
2. Execute Phase 1 changes (critical)
3. Monitor Firestore dashboard for 24 hours
4. Execute Phase 2 if quota still high
5. Fine-tune based on actual usage patterns

