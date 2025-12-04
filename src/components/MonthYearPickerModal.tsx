import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MonthYearPickerModalProps {
  open: boolean;
  selectedMonth: Date;
  onConfirm: (month: Date) => void;
  onCancel: () => void;
  minDate?: Date;
  maxDate?: Date;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Modal for selecting a specific month and year
 */
export function MonthYearPickerModal({
  open,
  selectedMonth,
  onConfirm,
  onCancel,
  minDate,
  maxDate,
}: MonthYearPickerModalProps) {
  const [tempMonth, setTempMonth] = useState<number>(selectedMonth.getMonth());
  const [tempYear, setTempYear] = useState<number>(selectedMonth.getFullYear());

  // Update temp values when selectedMonth changes
  useEffect(() => {
    if (open) {
      setTempMonth(selectedMonth.getMonth());
      setTempYear(selectedMonth.getFullYear());
    }
  }, [open, selectedMonth]);

  const handleConfirm = () => {
    const newDate = new Date(tempYear, tempMonth, 1);

    // Validate against min/max dates
    if (minDate && newDate < minDate) {
      return;
    }
    if (maxDate && newDate > maxDate) {
      return;
    }

    onConfirm(newDate);
  };

  const handleCancel = () => {
    // Reset to original values
    setTempMonth(selectedMonth.getMonth());
    setTempYear(selectedMonth.getFullYear());
    onCancel();
  };

  // Generate year range (10 years back, current year)
  const currentYear = new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : currentYear - 10;
  const maxYear = maxDate ? maxDate.getFullYear() : currentYear;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i).reverse(); // Most recent first

  // Check if current selection is valid
  const isValidSelection = () => {
    const testDate = new Date(tempYear, tempMonth, 1);
    if (minDate && testDate < minDate) return false;
    if (maxDate && testDate > maxDate) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Month and Year</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Month Selector */}
          <div className="grid gap-2">
            <Label htmlFor="month-select">Month</Label>
            <Select value={tempMonth.toString()} onValueChange={(value) => setTempMonth(parseInt(value, 10))}>
              <SelectTrigger id="month-select">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selector */}
          <div className="grid gap-2">
            <Label htmlFor="year-select">Year</Label>
            <Select value={tempYear.toString()} onValueChange={(value) => setTempYear(parseInt(value, 10))}>
              <SelectTrigger id="year-select">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValidSelection()}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
