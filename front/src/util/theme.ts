const createTheme = (background: string, bar: string, color?: string) => ({
  '--toastBackground': background,
  '--toastBarBackground': bar,
  ...color && { '--toastColor': color }
});

export const ERROR_THEME = createTheme('#F56565', '#C53030');
export const SUCCESS_THEME = createTheme('#48BB78', '#2F855A');
export const INFO_THEME = createTheme('#4299E1', '#2B6CB0', 'white');
