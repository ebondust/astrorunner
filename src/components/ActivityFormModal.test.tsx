import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ActivityFormModal } from "./ActivityFormModal";
import { useActivityForm } from "./hooks/useActivityForm";
import userEvent from "@testing-library/user-event";

// Mock the custom hook
vi.mock("./hooks/useActivityForm");

// Mock the date utils
vi.mock("@/lib/utils/date", () => ({
  durationInputToISO8601: vi.fn(() => "PT1H30M"),
  kmToMeters: vi.fn((val: number | null | undefined) => (val == null ? undefined : val * 1000)),
}));

// Mock ResizeObserver for Radix UI
global.ResizeObserver = class ResizeObserver {
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Mock PointerEvent for Radix UI
class MockPointerEvent extends Event {
  button: number;
  ctrlKey: boolean;
  pointerType: string;

  constructor(type: string, props: { button?: number; ctrlKey?: boolean; pointerType?: string } = {}) {
    super(type, props);
    this.button = props?.button || 0;
    this.ctrlKey = props?.ctrlKey || false;
    this.pointerType = props?.pointerType || "mouse";
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
window.PointerEvent = MockPointerEvent as any;
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();

describe("ActivityFormModal", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockSetField = vi.fn();
  const mockValidate = vi.fn();
  const mockReset = vi.fn();
  const mockInitializeFromActivity = vi.fn();

  const defaultFormState = {
    activityDate: "2023-01-01T12:00:00.000Z",
    duration: "1.30",
    activityType: "Run" as const,
    distanceMeters: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mockValidate to return true by default
    mockValidate.mockReturnValue(true);

    // Suppress Radix UI accessibility warnings in tests
    // eslint-disable-next-line no-console
    const originalWarn = console.warn;
    vi.spyOn(console, "warn").mockImplementation((message) => {
      if (typeof message === "string" && message.includes("Missing `Description`")) {
        return;
      }
      originalWarn(message);
    });

    // Default mock implementation
    vi.mocked(useActivityForm).mockReturnValue({
      formState: defaultFormState,
      errors: {},
      setField: mockSetField,
      validate: mockValidate,
      reset: mockReset,
      initializeFromActivity: mockInitializeFromActivity,
      isValid: true,
    });
  });

  it("Render - Empty form", () => {
    vi.mocked(useActivityForm).mockReturnValue({
      formState: {
        activityDate: "",
        duration: "",
        activityType: "Run", // default might be run
        distanceMeters: undefined,
      },
      errors: {},
      setField: mockSetField,
      validate: mockValidate,
      reset: mockReset,
      initializeFromActivity: mockInitializeFromActivity,
      isValid: false,
    });

    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByRole("heading", { name: "Add Activity" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Date and Time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Activity Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Duration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Distance/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Activity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
  });

  it("Render - Edit mode with data", () => {
    const activityData = {
      id: "1",
      activity_date: "2023-01-01T10:00:00Z",
      duration: "PT1H",
      activity_type: "Run",
      distance_meters: 5000,
      user_id: "user1",
      created_at: "2023-01-01T10:00:00Z",
    };

    render(
      <ActivityFormModal
        open={true}
        mode="edit"
        activity={activityData}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole("heading", { name: "Edit Activity" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save Changes/i })).toBeInTheDocument();
    expect(mockInitializeFromActivity).toHaveBeenCalledWith(activityData);
  });

  it("User input - Text fields", async () => {
    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const durationInput = screen.getByLabelText(/Duration/i);
    fireEvent.change(durationInput, { target: { value: "2.00" } });

    expect(mockSetField).toHaveBeenCalledWith("duration", "2.00");

    const distanceInput = screen.getByLabelText(/Distance/i);
    fireEvent.change(distanceInput, { target: { value: "10" } });

    expect(mockSetField).toHaveBeenCalledWith("distanceMeters", 10);
  });

  it("User input - Select fields", async () => {
    const user = userEvent.setup();
    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    // Open select
    const selectTrigger = screen.getByRole("combobox");
    await user.click(selectTrigger);

    // Select 'Walk'
    const walkOption = screen.getByRole("option", { name: "Walk" });
    await user.click(walkOption);

    expect(mockSetField).toHaveBeenCalledWith("activityType", "Walk");
  });

  it("User input - Date/time field with timezone handling", async () => {
    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const dateInput = screen.getByLabelText(/Date and Time/i) as HTMLInputElement;

    // Use fireEvent.change for datetime-local inputs (userEvent doesn't work well with them)
    fireEvent.change(dateInput, { target: { value: "2023-06-15T14:30" } });

    // Component calls setField with ISO string after converting local datetime to UTC
    expect(mockSetField).toHaveBeenCalledWith("activityDate", expect.stringMatching(/2023-06-15/));
  });

  it("Form validation - Display errors", () => {
    vi.mocked(useActivityForm).mockReturnValue({
      formState: defaultFormState,
      errors: {
        duration: "Invalid duration format",
        activityDate: "Date is required",
      },
      setField: mockSetField,
      validate: mockValidate,
      reset: mockReset,
      initializeFromActivity: mockInitializeFromActivity,
      isValid: false,
    });

    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByText("Invalid duration format")).toBeInTheDocument();
    expect(screen.getByText("Date is required")).toBeInTheDocument();
  });

  it("Form validation - Form-level error display", () => {
    vi.mocked(useActivityForm).mockReturnValue({
      formState: defaultFormState,
      errors: {
        form: "Failed to submit activity. Please try again.",
      },
      setField: mockSetField,
      validate: mockValidate,
      reset: mockReset,
      initializeFromActivity: mockInitializeFromActivity,
      isValid: false,
    });

    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    expect(screen.getByText(/Failed to submit activity/i)).toBeInTheDocument();
  });

  it("Form submission - Success", async () => {
    // Re-apply mock to ensure it's active for this render
    vi.mocked(useActivityForm).mockReturnValue({
      formState: defaultFormState,
      errors: {},
      setField: mockSetField,
      validate: mockValidate,
      reset: mockReset,
      initializeFromActivity: mockInitializeFromActivity,
      isValid: true,
    });

    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitBtn = screen.getByRole("button", { name: "Add Activity" });
    const form = submitBtn.closest("form");

    // Ensure form exists
    expect(form).not.toBeNull();

    // Trigger form submission directly
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalled();
    });

    // Verify command structure matches component logic (ActivityFormModal.tsx lines 71-76)
    expect(mockOnSubmit).toHaveBeenCalledWith({
      activityDate: "2023-01-01T12:00:00.000Z",
      duration: "PT1H30M", // from mocked durationInputToISO8601
      activityType: "Run",
      distanceMeters: 5000, // from mocked kmToMeters(5)
    });
    expect(mockReset).toHaveBeenCalled();
  });

  it("Form submission - Error", async () => {
    // Validate returns false
    mockValidate.mockReturnValue(false);

    // Re-apply mock with validation returning false
    vi.mocked(useActivityForm).mockReturnValue({
      formState: defaultFormState,
      errors: {},
      setField: mockSetField,
      validate: mockValidate,
      reset: mockReset,
      initializeFromActivity: mockInitializeFromActivity,
      isValid: false,
    });

    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitBtn = screen.getByRole("button", { name: "Add Activity" });
    const form = submitBtn.closest("form");

    // Trigger form submission directly
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalled();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("Modal open/close", async () => {
    // Test onCancel when clicking cancel button
    const user = userEvent.setup();
    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
    await user.click(cancelBtn);

    expect(mockReset).toHaveBeenCalled();
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("Form submission - Distance field empty/undefined handling", async () => {
    // Reset mockValidate
    mockValidate.mockReturnValue(true);

    vi.mocked(useActivityForm).mockReturnValue({
      formState: {
        ...defaultFormState,
        distanceMeters: undefined, // Empty distance
      },
      errors: {},
      setField: mockSetField,
      validate: mockValidate,
      reset: mockReset,
      initializeFromActivity: mockInitializeFromActivity,
      isValid: true,
    });

    render(<ActivityFormModal open={true} mode="create" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    const submitBtn = screen.getByRole("button", { name: "Add Activity" });
    const form = submitBtn.closest("form");

    // Trigger form submission directly
    if (form) {
      fireEvent.submit(form);
    }

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          distanceMeters: undefined, // Verify undefined is handled correctly
        })
      );
    });
  });
});
