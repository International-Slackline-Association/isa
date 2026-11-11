import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';

interface Props {
  label: string;
  selectedValue: string;
  onSelected: (v: string) => void;
  values: string[];
}

export const DropdownFilter = (props: Props) => {
  return (
    <FormControl size="medium" sx={{ minWidth: 120, mx: 6 }}>
      <InputLabel id={props.label}>{props.label}</InputLabel>
      <Select
        labelId={props.label}
        id={props.label}
        value={props.selectedValue}
        label={props.label}
        variant="outlined"
        size="small"
        onChange={(e) => props.onSelected(e.target.value as string)}
      >
        {props.values.map((v) => (
          <MenuItem key={v} value={v}>
            {v}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
