# Skeleton Loading Testing Guide

## Quick Testing Methods

### 1. **Use the Test Page** (Easiest)
Navigate to `/skeleton-test` in your app to see all skeleton components in action with adjustable delays.

### 2. **Use the `useDelayedLoading` Hook**
Wrap your data fetching with the hook to simulate slow loading:

```jsx
import { useDelayedLoading } from '../hooks/useDelayedLoading';

function MyComponent() {
  const [data, setData] = useState([]);
  const [loadingState, setLoadingState] = useState(true);
  
  // For testing: wrap with delay
  const { loading, data: delayedData } = useDelayedLoading(data, { 
    delay: 2000, // 2 seconds delay
    enabled: true // Set to false in production
  });
  
  // Use delayedData instead of data when enabled
  // Use loading from hook instead of loadingState
  
  return loading ? <ListSkeleton variant="post" count={3} /> : <PostList data={delayedData} />;
}
```

### 3. **Throttle Network in DevTools** (Best for Real Testing)
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Click the throttling dropdown (usually says "No throttling")
4. Select "Slow 3G" or "Fast 3G"
5. Refresh the page

### 4. **Add Manual Delay** (Quick Hack)
Temporarily add a delay in your useEffect:

```jsx
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    
    // TEMPORARY: For testing skeletons
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const data = await fetchYourData();
    setData(data);
    setLoading(false);
  };
  
  fetchData();
}, []);
```

### 5. **Browser Network Throttling**
- Chrome: DevTools → Network → Throttle dropdown
- Firefox: DevTools → Network → Settings → Throttling
- Safari: Develop menu → Network Link Conditioner

## Production Note
Remember to remove any testing delays before deploying to production!

## Current Skeleton Implementations
- ✅ `/loading.js` - Main loading page
- ✅ `/community` - Community list
- ✅ `/community/[communityId]` - Community detail
- ✅ `ConversationList` - Chat conversations
- ✅ `SidebarLayout` - Main app layout

