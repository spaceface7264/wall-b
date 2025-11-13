# Plan: Indicate Suspended Communities in Public Community Page

## Overview
This plan outlines how to visually indicate and handle suspended communities (`is_active = false`) on the public-facing community detail page (`/community/[communityId]/page.jsx`).

## Current State
- Suspended communities are filtered out for regular users in listings
- Admins can see suspended communities in listings (with indicators)
- Community detail page currently doesn't show suspension status
- No restrictions on interaction with suspended communities for admins

## Goals
1. **Visual Clarity**: Make it immediately obvious when viewing a suspended community
2. **Admin Visibility**: Admins should see clear suspension indicators
3. **User Experience**: Prevent confusion when admins access suspended communities
4. **Consistency**: Match the visual style used in community listings

## Implementation Plan

### Phase 1: Visual Indicators

#### 1.1 Header Banner (High Priority)
**Location**: Top of the page, below navigation, above community header
**Design**:
- Full-width red banner with AlertCircle icon
- Text: "⚠️ This community has been suspended"
- Background: `rgba(239, 68, 68, 0.15)` with red border
- Only visible to admins (regular users shouldn't access suspended communities)

**Code Location**: After `<SidebarLayout>` opening tag, before community header

#### 1.2 Community Header Badge
**Location**: Next to community name in header
**Design**:
- Red badge with AlertCircle icon
- Text: "Suspended"
- Similar styling to privacy indicator (Private/Public badges)
- Position: Right side of community name

**Code Location**: In the community header section (around line 1395-1397)

#### 1.3 Status Indicator in Metadata
**Location**: Below community name, with privacy indicator
**Design**:
- Red status badge: "Status: Suspended"
- Icon: AlertCircle
- Position: Below privacy indicator or inline with it

**Code Location**: In the metadata section (around line 1420-1435)

### Phase 2: Visual Styling

#### 2.1 Page-Level Styling
- Add subtle red tint to entire page when suspended
- Reduce opacity slightly (0.95) for non-critical content
- Add red border accent to main content container

#### 2.2 Disable Interactive Elements (Optional)
- Disable "Join" button (show as disabled with tooltip)
- Disable "Create Post" button
- Disable "Create Event" button
- Show message: "This community is suspended. Actions are disabled."

### Phase 3: Content Restrictions

#### 3.1 Tab Visibility
- Keep all tabs visible for admins (for review purposes)
- Show content but with visual indicators
- Add warning message in each tab: "This community is suspended"

#### 3.2 Post/Event Display
- Show existing posts/events but with reduced opacity
- Add "Suspended" badge to each post/event card
- Disable interactions (like, comment, RSVP)

### Phase 4: Admin-Specific Features

#### 4.1 Admin Actions
- Add "Unsuspend Community" button in admin menu
- Show suspension reason/date if available
- Link to admin panel for full suspension management

#### 4.2 Admin Notice
- Banner: "Admin View: This community is suspended. Regular users cannot see this page."
- Action buttons: "Unsuspend" | "View in Admin Panel"

## Implementation Details

### Component Structure
```
<SidebarLayout>
  {/* Suspension Banner - Top */}
  {isAdmin && community?.is_active === false && (
    <SuspensionBanner />
  )}
  
  {/* Community Header */}
  <CommunityHeader>
    <CommunityName />
    {isAdmin && community?.is_active === false && (
      <SuspendedBadge />
    )}
    <PrivacyIndicator />
    {isAdmin && community?.is_active === false && (
      <SuspendedStatusBadge />
    )}
  </CommunityHeader>
  
  {/* Content with reduced opacity if suspended */}
  <ContentWrapper opacity={community?.is_active === false ? 0.95 : 1}>
    {/* Tabs and Content */}
  </ContentWrapper>
</SidebarLayout>
```

### Key Variables to Check
- `community?.is_active === false` - Suspension status
- `isAdmin` - Admin status (already exists)
- `user` - Current user (already exists)

### Styling Guidelines
- Use consistent red color: `#ef4444` (red-500)
- Use AlertCircle icon from lucide-react
- Match existing badge styles (similar to privacy indicators)
- Use opacity: 0.6-0.95 for suspended content
- Use red borders: `rgba(239, 68, 68, 0.3-0.5)`

## Files to Modify

1. **`/app/community/[communityId]/page.jsx`**
   - Add suspension banner component
   - Add suspended badge to header
   - Add status indicator to metadata
   - Add conditional styling based on `is_active`
   - Import `AlertCircle` icon

## Testing Checklist

- [ ] Suspension banner appears for admins viewing suspended communities
- [ ] Suspension badge appears next to community name
- [ ] Status indicator appears in metadata section
- [ ] Page styling reflects suspension (opacity, borders)
- [ ] Regular users cannot access suspended communities (404 or redirect)
- [ ] Admin can see all content but with visual indicators
- [ ] All interactive elements are disabled or show appropriate messages
- [ ] Visual consistency with community listing page indicators

## Edge Cases

1. **Community becomes suspended while user is viewing**
   - Handle gracefully (show message, disable actions)
   - Consider real-time updates

2. **Admin viewing suspended community**
   - Should see all content for review purposes
   - Clear indicators that it's suspended

3. **Regular user somehow accessing suspended community**
   - Should be redirected or shown 404
   - RLS policies should prevent this

## Future Enhancements

1. **Suspension Details Modal**
   - Show suspension reason
   - Show suspension date
   - Show who suspended it
   - Show expiration date (if temporary)

2. **Suspension History**
   - Track suspension/unsuspension events
   - Show in admin panel

3. **Temporary Suspensions**
   - Show countdown timer
   - Auto-unsuspend notification

## Priority Order

1. **High Priority** (Implement First):
   - Suspension banner at top of page
   - Suspended badge in header
   - Status indicator in metadata

2. **Medium Priority**:
   - Page-level styling (opacity, borders)
   - Disable interactive elements
   - Admin-specific notices

3. **Low Priority** (Future):
   - Suspension details modal
   - Suspension history
   - Temporary suspension countdown

