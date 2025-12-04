# data-testid Attributes Checklist

**Status:** In Progress - User Story 2 Complete
**Required for:** E2E Testing Implementation
**Last Updated:** 2025-12-01

---

## Components Requiring data-testid

### ActivitiesPageContainer.tsx
- [x] `add-activity-button` - Add activity button (via AddActivityButton component)
- [ ] `error-banner` - Error message display (not implemented yet)
- **Note:** No root container in this component (renders fragment)

### ActivityList.tsx
- [x] `activity-list` - List container
- [x] `empty-state` - Empty state component (via EmptyState component)
- [x] `skeleton-loader` - Loading skeleton (via SkeletonLoader component)

### ActivityCard.tsx
- [x] `activity-card` - Card wrapper
- [x] `activity-type-badge` - Type badge
- [x] `activity-time` - Time display
- [x] `activity-duration` - Duration display
- [x] `activity-distance` - Distance display
- [x] `edit-activity-button` - Edit button
- [x] `delete-activity-button` - Delete button

### AddActivityButton.tsx
- [x] `add-activity-button` - Add activity button

### EmptyState.tsx
- [x] `empty-state` - Empty state container
- [x] `empty-state-message` - Message text
- [x] `empty-state-cta` - Call-to-action button

### SkeletonLoader.tsx
- [x] `skeleton-loader` - Loading skeleton container

### DateHeader.tsx
- [ ] `date-header` - Header container
- [ ] `today-badge` - "Today" badge

### MonthNavigation.tsx
- [ ] `month-navigation` - Navigation bar
- [ ] `previous-month-button` - Previous button
- [ ] `next-month-button` - Next button
- [ ] `month-display` - Month/year display
- [ ] `today-button` - Today button

### ActivityFormModal.tsx
- [x] `activity-form-modal` - Modal dialog
- [x] `activity-date-input` - Date/time input
- [x] `activity-type-select` - Type dropdown
- [x] `duration-input` - Duration input
- [x] `distance-input` - Distance input
- [x] `submit-activity-button` - Submit button
- [x] `cancel-button` - Cancel button
- [x] `form-error-message` - Form-level error
- [x] `date-error-message` - Date field error
- [x] `type-error-message` - Type field error
- [x] `duration-error-message` - Duration field error
- [x] `distance-error-message` - Distance field error

### DeleteConfirmationModal.tsx
- [ ] `delete-confirmation-modal` - Modal dialog
- [ ] `activity-preview` - Activity preview
- [ ] `confirm-delete-button` - Confirm button
- [ ] `cancel-delete-button` - Cancel button

### MonthYearPickerModal.tsx
- [ ] `month-picker-modal` - Modal dialog
- [ ] `month-select` - Month dropdown
- [ ] `year-select` - Year dropdown
- [ ] `confirm-month-button` - Confirm button
- [ ] `cancel-month-button` - Cancel button

---

## Quick Reference

**Total Attributes:** 43
**Completed for User Story 2:** 24/43
**Files Updated:** 6/9 (ActivityCard, ActivityList, ActivityFormModal, AddActivityButton, EmptyState, SkeletonLoader)

**Example Implementation:**
```tsx
<Button data-testid="add-activity-button" onClick={handleClick}>
  Add Activity
</Button>
```

**Testing Verification:**
```bash
# After adding attributes, verify with:
npx playwright codegen http://localhost:3000/activities
```

---

**Last Updated:** 2025-11-30