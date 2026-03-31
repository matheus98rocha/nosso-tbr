export type DatePickerProps = {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  isRequiredField?: boolean;
  isAfterTodayHidden?: boolean;
};
