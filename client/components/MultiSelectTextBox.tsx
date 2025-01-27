import { useState } from "react";
import {
  Checkbox,
  Combobox,
  Group,
  Input,
  Pill,
  PillsInput,
  useCombobox,
} from "@mantine/core";
import { UseListStateHandlers } from "@mantine/hooks";
import { UUID } from "crypto";

// reviwers is an array of objects with each object having name and email
interface Reviewer {
  name: string;
  email: string;
  role: string;
  user_id: UUID;
}

interface MultiSelectCheckboxProps {
  reviewers: Reviewer[];
  state: Reviewer[];
  setState: UseListStateHandlers<Reviewer>;
}

// get state from Agreement.Card and setValue on change on that state
export function MultiSelectCheckbox({
  reviewers,
  state,
  setState,
}: MultiSelectCheckboxProps) {
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex("active"),
  });

  const handleValueSelect = (email: string) => {
    const reviewer = reviewers.find((r) => r.email === email);
    if (reviewer) {
      if (state.some((v) => v.email === reviewer.email)) {
        setState.filter((v) => v.email !== reviewer.email);
      } else {
        setState.append(reviewer);
      }
    }
  };

  const handleValueRemove = (val: Reviewer) =>
    setState.setState((current) =>
      current.filter((v) => v.email !== val.email)
    );

  const [search, setSearch] = useState("");

  const options = reviewers
    .filter((item) =>
      item.name.toLowerCase().includes(search.trim().toLowerCase())
    )
    .map((item) => (
      <Combobox.Option
        value={item.email}
        key={item.email}
        active={state.some((v) => v.email === item.email)}
      >
        <Group gap="sm">
          {/* <Checkbox
          checked={state.some((v) => v.email === item.email)}
          onChange={() => {}}
          aria-hidden
          tabIndex={-1}
          style={{ pointerEvents: "none" }}
        /> */}
          <span>{item.name}</span>
        </Group>
      </Combobox.Option>
    ));

  return (
    <Combobox
      store={combobox}
      onOptionSubmit={handleValueSelect}
      withinPortal={false}
    >
      <Combobox.DropdownTarget>
        <PillsInput
          pointer
          onClick={() => combobox.toggleDropdown()}
          onChange={(event) => {
            setSearch((event.currentTarget as HTMLInputElement).value);
            combobox.openDropdown();
          }}
        >
          <Pill.Group>
            {state.length > 0 ? (
              state.map((reviewer) => (
                <Pill
                  key={reviewer.email}
                  onRemove={() => handleValueRemove(reviewer)}
                  withRemoveButton
                >
                  {reviewer.name}
                </Pill>
              ))
            ) : (
              <Input.Placeholder>Pick one or more values</Input.Placeholder>
            )}

            <Combobox.EventsTarget>
              <PillsInput.Field
                type="hidden"
                onBlur={() => combobox.closeDropdown()}
                onKeyDown={(event) => {
                  if (event.key === "Backspace") {
                    event.preventDefault();
                    handleValueRemove(state[state.length - 1]);
                  }
                }}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown>
        <Combobox.Options>{options}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
