// Temporary module declaration to satisfy TypeScript.
// Install the real package with: expo install @react-native-community/datetimepicker
// or: npm install @react-native-community/datetimepicker

declare module "@react-native-community/datetimepicker" {
  import * as React from "react";
  import { ViewProps } from "react-native";

  export interface AndroidNativeProps {
    value: Date;
    mode?: "date" | "time" | "datetime";
    is24Hour?: boolean;
    display?: "default" | "spinner" | "clock" | "calendar";
    onChange?: (event: any, date?: Date) => void;
  }

  export interface IOSNativeProps extends AndroidNativeProps {}

  export type DateTimePickerEvent = any;

  export interface DateTimePickerProps extends IOSNativeProps, ViewProps {}

  const DateTimePicker: React.ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
}
