# Group Members Feature

## Overview

The Group Members feature allows users to view and manage members in group conversations. This feature is available for group chats (conversations with `type: 'group'`).

## Features

### For All Group Members
- **View Group Members**: Click the Users icon in the group conversation header to see all members
- **Search Members**: Use the search bar to find specific members by name or email
- **View Member Details**: See member names, avatars, email addresses, and join dates
- **Identify Group Admin**: Group creator is marked with a crown icon

### For Group Admins (Group Creator)
- **Add Members**: Click "Add Members" to invite new users to the group
- **Remove Members**: Remove members from the group (except yourself and other admins)
- **Manage Group**: Full control over group membership

## How to Use

### Viewing Group Members
1. Open a group conversation
2. Click the Users icon (👥) in the conversation header
3. Browse the list of members with their details

### Adding Members (Admin Only)
1. Open the Group Members modal
2. Click "Add Members" button
3. Search for users to add
4. Click the "+" button next to the user you want to add

### Removing Members (Admin Only)
1. Open the Group Members modal
2. Find the member you want to remove
3. Click the "-" button next to their name
4. Confirm the removal

## Technical Implementation

### Components
- `GroupMembersModal.jsx`: Main modal component for managing group members
- `ConversationView.jsx`: Updated to include group members button

### Database Tables
- `conversations`: Stores group conversation details
- `conversation_participants`: Stores group membership
- `profiles`: Stores user profile information

### Key Functions
- `loadMembers()`: Fetches group members with profile data
- `handleAddMember()`: Adds a new member to the group
- `handleRemoveMember()`: Removes a member from the group
- `loadAvailableUsers()`: Fetches users available to add to the group

## Permissions
- **View Members**: All group members can view the member list
- **Add/Remove Members**: Only the group creator (admin) can add or remove members
- **Self-Protection**: Users cannot remove themselves or the group creator

## UI/UX Features
- **Responsive Design**: Works on both mobile and desktop
- **Search Functionality**: Real-time search through members
- **Loading States**: Proper loading indicators for all async operations
- **Error Handling**: User-friendly error messages
- **Visual Indicators**: Crown icon for group admin, different states for buttons

## Future Enhancements
- Member roles (admin, moderator, member)
- Bulk member operations
- Member invitation links
- Member activity status
- Group settings management
