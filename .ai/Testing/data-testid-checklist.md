# data-testid Attributes Checklist

**Status:** Not Started
**Required for:** E2E Testing Implementation
**Estimated Time:** 2-3 hours

---

## Components Requiring data-testid

### ActivitiesPageContainer.tsx
- [ ] `activities-page-container` - Root container
- [ ] `add-activity-button` - Add activity button
- [ ] `error-banner` - Error message display

### ActivityList.tsx
- [ ] `activity-list` - List container
- [ ] `empty-state` - Empty state component
- [ ] `skeleton-loader` - Loading skeleton

### ActivityCard.tsx
- [ ] `activity-card` - Card wrapper
- [ ] `activity-type-badge` - Type badge
- [ ] `activity-time` - Time display
- [ ] `activity-duration` - Duration display
- [ ] `activity-distance` - Distance display
- [ ] `edit-activity-button` - Edit button
- [ ] `delete-activity-button` - Delete button

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
- [ ] `activity-form-modal` - Modal dialog
- [ ] `activity-date-input` - Date/time input
- [ ] `activity-type-select` - Type dropdown
- [ ] `duration-input` - Duration input
- [ ] `distance-input` - Distance input
- [ ] `submit-activity-button` - Submit button
- [ ] `cancel-button` - Cancel button
- [ ] `form-error-message` - Form-level error
- [ ] `date-error-message` - Date field error
- [ ] `type-error-message` - Type field error
- [ ] `duration-error-message` - Duration field error
- [ ] `distance-error-message` - Distance field error

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

### EmptyState.tsx
- [ ] `empty-state-message` - Message text
- [ ] `empty-state-cta` - Call-to-action button

---

## Quick Reference

**Total Attributes:** 43
**Files to Update:** 9

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