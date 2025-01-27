import { MoonIcon, SunIcon } from "lucide-react";
import cx from "clsx";
import {
  ActionIcon,
  Group,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import classes from "./ColorSchemeToggle.module.scss";

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <Group justify="center">
      <ActionIcon
        onClick={() =>
          setColorScheme(computedColorScheme === "light" ? "dark" : "light")
        }
        variant="filled"
        size="md"
        aria-label="Toggle color scheme"
      >
        <SunIcon className={cx(classes.icon, classes.light)} />
        <MoonIcon className={cx(classes.icon, classes.dark)} />
      </ActionIcon>
    </Group>
  );
}
